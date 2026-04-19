/**
 * Photos endpoints.
 *
 * Contract (kept small on purpose for week 1):
 *
 *   POST /photos/upload-url
 *     Auth: required. Inserts a `photos` row (analysis_status='pending'),
 *     returns a presigned PUT URL the mobile uses to upload bytes directly
 *     to object storage. Bytes never transit this API.
 *
 *   POST /photos/:id/complete
 *     Auth: required. Ownership: photo.user_id === session.user.id (404
 *     otherwise — we don't confirm existence to a non-owner).
 *     Verifies the object landed in storage and that its size is under
 *     MAX_PHOTO_BYTES. Oversize → the object is deleted, row flipped to
 *     'failed', the caller gets 422. On success the row flips to 'queued'
 *     and an 'analyze-photo' job lands in the BullMQ queue for the worker
 *     (T07) to consume.
 *
 *   GET /photos/:id
 *     Auth: required. Ownership: same 404 rule. Returns the full row for
 *     Screen 3's polling loop (analysis_status, analysis, created_at, …).
 */
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, eq } from "drizzle-orm";

import { photos } from "@lueur/db";

import { getDb } from "../lib/db.js";
import { ApiError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { requireAuth, requireOwnership } from "../lib/ownership.js";
import { enqueueAnalyzePhoto } from "../lib/queue.js";
import {
  ALLOWED_CONTENT_TYPES,
  deletePhoto,
  getPhotoUploadUrl,
  MAX_PHOTO_BYTES,
  statPhoto,
  type AllowedContentType,
} from "../lib/storage.js";
import type { AppEnv } from "../types.js";

// --------------------------------------------------------------------------
// Schemas
// --------------------------------------------------------------------------

const UploadUrlBody = z
  .object({
    content_type: z.enum(ALLOWED_CONTENT_TYPES).openapi({
      description: "MIME type the mobile will upload. Whitelist enforced.",
      example: "image/jpeg",
    }),
  })
  .strict();

const UploadUrlResponse = z.object({
  photo_id: z.string().uuid(),
  upload_url: z.string().url(),
  storage_key: z.string(),
  expires_in: z.number().int().positive(),
  max_bytes: z.number().int().positive(),
});

const PhotoRow = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  storage_key: z.string(),
  domain: z.string().nullable(),
  analysis: z.record(z.string(), z.unknown()).nullable(),
  analysis_status: z.enum([
    "pending",
    "queued",
    "processing",
    "done",
    "failed",
  ]),
  created_at: z.string().datetime(),
});

const IdParam = z.object({
  id: z.string().uuid().openapi({ param: { in: "path", name: "id" } }),
});

const ErrorBody = z.object({ error: z.string(), code: z.string() });

// --------------------------------------------------------------------------
// Routes
// --------------------------------------------------------------------------

const uploadUrlRoute = createRoute({
  method: "post",
  path: "/photos/upload-url",
  tags: ["photos"],
  summary: "Reserve a photo row and get a presigned upload URL",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: UploadUrlBody } },
      required: true,
    },
  },
  responses: {
    201: {
      description: "Upload URL issued",
      content: { "application/json": { schema: UploadUrlResponse } },
    },
    401: {
      description: "No authenticated session",
      content: { "application/json": { schema: ErrorBody } },
    },
  },
});

const completeRoute = createRoute({
  method: "post",
  path: "/photos/{id}/complete",
  tags: ["photos"],
  summary: "Mark an upload as complete and enqueue analysis",
  security: [{ cookieAuth: [] }],
  request: { params: IdParam },
  responses: {
    200: {
      description: "Upload verified and queued",
      content: {
        "application/json": {
          schema: z.object({
            photo_id: z.string().uuid(),
            analysis_status: z.literal("queued"),
            job_id: z.string(),
          }),
        },
      },
    },
    401: {
      description: "No authenticated session",
      content: { "application/json": { schema: ErrorBody } },
    },
    404: {
      description: "Photo not found or not owned by caller",
      content: { "application/json": { schema: ErrorBody } },
    },
    422: {
      description:
        "Upload missing from storage or exceeded max size (15 MB). Server deletes the oversized object on reject.",
      content: { "application/json": { schema: ErrorBody } },
    },
  },
});

const getPhotoRoute = createRoute({
  method: "get",
  path: "/photos/{id}",
  tags: ["photos"],
  summary: "Fetch a photo row (for the mobile polling loop on Screen 3)",
  security: [{ cookieAuth: [] }],
  request: { params: IdParam },
  responses: {
    200: {
      description: "Photo row",
      content: { "application/json": { schema: PhotoRow } },
    },
    401: {
      description: "No authenticated session",
      content: { "application/json": { schema: ErrorBody } },
    },
    404: {
      description: "Photo not found or not owned by caller",
      content: { "application/json": { schema: ErrorBody } },
    },
  },
});

// --------------------------------------------------------------------------
// Handlers
// --------------------------------------------------------------------------

export function registerPhotosRoutes(app: OpenAPIHono<AppEnv>): void {
  app.openapi(uploadUrlRoute, async (c) => {
    const user = requireAuth(c.get("user"));
    const body = c.req.valid("json");

    const [row] = await getDb()
      .insert(photos)
      .values({
        userId: user.id,
        storageKey: "pending",
        analysisStatus: "pending",
      })
      .returning({ id: photos.id });
    if (!row) throw new ApiError(409, "insert returned no row");

    const { uploadUrl, storageKey, expiresIn } = await getPhotoUploadUrl({
      userId: user.id,
      photoId: row.id,
      contentType: body.content_type as AllowedContentType,
    });

    await getDb()
      .update(photos)
      .set({ storageKey })
      .where(eq(photos.id, row.id));

    return c.json(
      {
        photo_id: row.id,
        upload_url: uploadUrl,
        storage_key: storageKey,
        expires_in: expiresIn,
        max_bytes: MAX_PHOTO_BYTES,
      },
      201,
    );
  });

  app.openapi(completeRoute, async (c) => {
    const user = requireAuth(c.get("user"));
    const { id } = c.req.valid("param");

    const [photo] = await getDb()
      .select()
      .from(photos)
      .where(eq(photos.id, id))
      .limit(1);
    if (!photo) throw new ApiError(404, "not found");
    requireOwnership(user.id, photo.userId);

    const stat = await statPhoto(photo.storageKey);
    if (!stat) {
      throw new ApiError(422, "upload not found in storage");
    }
    if (stat.size > MAX_PHOTO_BYTES) {
      logger.warn(
        { photoId: photo.id, size: stat.size },
        "oversized upload rejected; deleting object",
      );
      await deletePhoto(photo.storageKey);
      await getDb()
        .update(photos)
        .set({ analysisStatus: "failed" })
        .where(eq(photos.id, photo.id));
      throw new ApiError(422, `upload exceeds ${MAX_PHOTO_BYTES} bytes`);
    }

    await getDb()
      .update(photos)
      .set({ analysisStatus: "queued" })
      .where(eq(photos.id, photo.id));

    const jobId = await enqueueAnalyzePhoto({
      photoId: photo.id,
      userId: user.id,
      storageKey: photo.storageKey,
    });

    return c.json(
      { photo_id: photo.id, analysis_status: "queued" as const, job_id: jobId },
      200,
    );
  });

  app.openapi(getPhotoRoute, async (c) => {
    const user = requireAuth(c.get("user"));
    const { id } = c.req.valid("param");

    const [photo] = await getDb()
      .select()
      .from(photos)
      .where(and(eq(photos.id, id), eq(photos.userId, user.id)))
      .limit(1);
    if (!photo) throw new ApiError(404, "not found");

    return c.json(
      {
        id: photo.id,
        user_id: photo.userId,
        storage_key: photo.storageKey,
        domain: photo.domain,
        analysis: (photo.analysis ?? null) as Record<string, unknown> | null,
        analysis_status: (photo.analysisStatus ?? "pending") as
          | "pending"
          | "queued"
          | "processing"
          | "done"
          | "failed",
        created_at: (photo.createdAt ?? new Date()).toISOString(),
      },
      200,
    );
  });
}
