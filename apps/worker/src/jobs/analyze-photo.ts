/**
 * analyze-photo job handler.
 *
 *   Input: { photo_id, user_id, storage_key } (AnalyzePhotoJob).
 *
 *   Side effects:
 *     1. Flip photos.analysis_status → 'processing'.
 *     2. Stream the S3 object (fetchPhotoBytes enforces MAX_PHOTO_BYTES).
 *     3. Call Anthropic Claude Opus 4.7 with INTERIOR_ANALYSIS_V1.
 *     4. parseInteriorAnalysis (strict Zod); any failure → 'failed'.
 *     5. Flip row to 'done', persist analysis JSON, clear error_message.
 *     6. INSERT taste_event type='photo_analyzed' with prompt_version.
 *
 *   Retry policy: whatever BullMQ configured at queue creation (3 attempts,
 *   exponential backoff). We throw on any transient-looking error so BullMQ
 *   retries; deterministic parse failures persist 'failed' immediately and
 *   STILL throw so the job lands in failed queue with the full error.
 */
import { eq } from "drizzle-orm";

import { photos, tasteEvents, type Database } from "@lueur/db";
import {
  AnalysisParseError,
  INTERIOR_ANALYSIS_V1,
  parseInteriorAnalysis,
} from "@lueur/prompts";

import { getAnthropicClient, type AnalyzeInteriorClient } from "../lib/anthropic.js";
import { getDb } from "../lib/db.js";
import { logger } from "../lib/logger.js";
import { fetchPhotoBytes } from "../lib/storage.js";
import type { AnalyzePhotoJob } from "../lib/queue.js";

/** Strips anything that could leak PII or a stack trace. */
function sanitizeError(err: unknown): string {
  if (err instanceof AnalysisParseError) return "analysis: invalid response shape";
  if (err instanceof Error) {
    // Keep only the first line, clip to 200 chars.
    return err.message.split("\n", 1)[0]!.slice(0, 200);
  }
  return "unknown error";
}

export interface AnalyzePhotoDeps {
  db?: Database;
  anthropic?: AnalyzeInteriorClient;
  fetcher?: typeof fetchPhotoBytes;
}

export async function runAnalyzePhoto(
  data: AnalyzePhotoJob,
  deps: AnalyzePhotoDeps = {},
): Promise<{ analysis_status: "done" | "failed" }> {
  const db = deps.db ?? getDb();
  const fetcher = deps.fetcher ?? fetchPhotoBytes;

  logger.info({ photoId: data.photoId }, "analyze-photo: starting");

  // Mark processing before any call that could throw. getAnthropicClient
  // itself throws if ANTHROPIC_API_KEY is missing — we must already have
  // the row in 'processing' so the catch below can flip it to 'failed'.
  await db
    .update(photos)
    .set({ analysisStatus: "processing", errorMessage: null })
    .where(eq(photos.id, data.photoId));

  try {
    const anthropic = deps.anthropic ?? getAnthropicClient();
    const photo = await fetcher({ storageKey: data.storageKey });
    logger.debug(
      { photoId: data.photoId, bytes: photo.bytes, mediaType: photo.mediaType },
      "analyze-photo: bytes fetched",
    );

    const rawText = await anthropic.analyzeInterior({
      base64: photo.base64,
      mediaType: photo.mediaType,
    });

    const analysis = parseInteriorAnalysis(rawText);

    await db
      .update(photos)
      .set({
        analysisStatus: "done",
        analysis,
        domain: analysis.structured.domain,
        errorMessage: null,
      })
      .where(eq(photos.id, data.photoId));

    await db.insert(tasteEvents).values({
      userId: data.userId,
      eventType: "photo_analyzed",
      payload: {
        photo_id: data.photoId,
        analysis,
        prompt_version: INTERIOR_ANALYSIS_V1.version,
      },
    });

    logger.info({ photoId: data.photoId }, "analyze-photo: done");
    return { analysis_status: "done" };
  } catch (err) {
    const safe = sanitizeError(err);
    logger.error(
      { photoId: data.photoId, err },
      `analyze-photo: failed (${safe})`,
    );

    await db
      .update(photos)
      .set({
        analysisStatus: "failed",
        errorMessage: safe,
      })
      .where(eq(photos.id, data.photoId));

    // Rethrow so BullMQ records the failure and honours its retry policy.
    throw err;
  }
}
