/**
 * POST /events — append a taste event for the authenticated user.
 *
 * Auth: required (session present; anonymous sessions allowed).
 * Ownership: user_id is ALWAYS derived from the session. The request body
 *   never carries a user_id — any such field would be silently stripped by
 *   the Zod input schema.
 * Side effect: inserts one row in `taste_events`.
 */
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { tasteEvents } from "@lueur/db";

import { getDb } from "../lib/db.js";
import { ApiError } from "../lib/errors.js";
import { requireAuth } from "../lib/ownership.js";
import type { AppEnv } from "../types.js";

const KNOWN_EVENT_TYPES = [
  "photo_analyzed",
  "duel_answered",
  "correction",
  "graph_rebuilt",
  "reco_feedback",
  "import",
] as const;

const EventBody = z
  .object({
    event_type: z.enum(KNOWN_EVENT_TYPES).openapi({
      description: "Type of taste event. Catalog lives in docs/02-DATA-SCHEMA.md.",
      example: "correction",
    }),
    payload: z.record(z.string(), z.unknown()).openapi({
      description: "Event-type-specific payload. See schema doc for shapes.",
      example: { target: "palette", value: "ocres_poussiereux" },
    }),
  })
  .strict();

const EventCreated = z.object({
  id: z.string().uuid(),
  event_type: z.string(),
  created_at: z.string().datetime(),
});

const route = createRoute({
  method: "post",
  path: "/events",
  tags: ["events"],
  summary: "Append a taste event for the authenticated user",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: EventBody } },
      required: true,
    },
  },
  responses: {
    201: {
      description: "Event created",
      content: { "application/json": { schema: EventCreated } },
    },
    401: {
      description: "No authenticated session",
      content: {
        "application/json": {
          schema: z.object({ error: z.string(), code: z.string() }),
        },
      },
    },
  },
});

export function registerEventsRoutes(app: OpenAPIHono<AppEnv>): void {
  app.openapi(route, async (c) => {
    const user = requireAuth(c.get("user"));
    const body = c.req.valid("json");

    const inserted = await getDb()
      .insert(tasteEvents)
      .values({
        userId: user.id,
        eventType: body.event_type,
        payload: body.payload,
      })
      .returning({
        id: tasteEvents.id,
        eventType: tasteEvents.eventType,
        createdAt: tasteEvents.createdAt,
      });

    const row = inserted[0];
    if (!row?.createdAt) throw new ApiError(409, "insert returned no row");

    return c.json(
      {
        id: row.id,
        event_type: row.eventType,
        created_at: row.createdAt.toISOString(),
      },
      201,
    );
  });
}
