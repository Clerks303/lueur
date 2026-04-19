/**
 * Build the Hono app. Exported for the Bun bootstrap (src/index.ts) and
 * for tests (tests/*.test.ts), which call `app.request(...)` directly.
 */
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

import { loadEnv } from "./env.js";
import { auth } from "./lib/auth.js";
import { errorHandler } from "./lib/errors.js";
import { logger } from "./lib/logger.js";
import { sessionMiddleware } from "./middleware/session.js";
import { registerEventsRoutes } from "./routes/events.js";
import { registerHealthRoutes } from "./routes/health.js";
import type { AppEnv } from "./types.js";

export function buildApp(): OpenAPIHono<AppEnv> {
  const env = loadEnv();
  const app = new OpenAPIHono<AppEnv>();

  app.use("*", secureHeaders());

  // CORS permissive in dev so the Expo app from any local port can call us.
  // Tighten to the mobile origin(s) explicitly in prod.
  app.use(
    "*",
    cors({
      origin: env.API_CORS_ORIGIN,
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization", "Cookie"],
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    }),
  );

  // Request logging (skip /health to keep logs readable under load balancers).
  app.use("*", async (c, next) => {
    const started = Date.now();
    await next();
    if (c.req.path !== "/health") {
      logger.info(
        {
          method: c.req.method,
          path: c.req.path,
          status: c.res.status,
          ms: Date.now() - started,
        },
        "request",
      );
    }
  });

  // Mount Better Auth's handler. It owns /auth/* (sign-in, sign-out, magic-link
  // verify, anonymous create, session endpoint).
  app.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));

  // Attach session to context for every non-/auth request.
  app.use("*", sessionMiddleware);

  registerHealthRoutes(app);
  registerEventsRoutes(app);

  // Central OpenAPI spec.
  app.doc("/openapi.json", {
    openapi: "3.0.0",
    info: {
      title: "Lueur API",
      version: "0.0.0",
      description:
        "HTTP API for the Lueur mobile app. Owned by @lueur/api. Generated from Zod schemas via @hono/zod-openapi.",
    },
    servers: [{ url: env.BETTER_AUTH_URL, description: "current" }],
  });

  app.onError(errorHandler);
  return app;
}
