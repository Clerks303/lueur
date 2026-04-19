/**
 * GET /health
 * Liveness probe. No auth. No side effects.
 */
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import type { AppEnv } from "../types.js";

const HealthResponse = z.object({
  ok: z.literal(true),
  version: z.string(),
  timestamp: z.string().datetime(),
});

const route = createRoute({
  method: "get",
  path: "/health",
  tags: ["system"],
  summary: "Liveness probe",
  responses: {
    200: {
      description: "Service is up",
      content: { "application/json": { schema: HealthResponse } },
    },
  },
});

const VERSION = process.env["npm_package_version"] ?? "0.0.0";

export function registerHealthRoutes(app: OpenAPIHono<AppEnv>): void {
  app.openapi(route, (c) =>
    c.json(
      {
        ok: true as const,
        version: VERSION,
        timestamp: new Date().toISOString(),
      },
      200,
    ),
  );
}
