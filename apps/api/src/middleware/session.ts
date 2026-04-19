/**
 * Session extraction middleware. Runs on every request: attaches the
 * current Better Auth session (or null) to the Hono context so downstream
 * handlers can read `c.get("user")` and `c.get("session")` without
 * re-invoking auth.api.getSession.
 */
import type { MiddlewareHandler } from "hono";

import { auth } from "../lib/auth.js";
import type { AppEnv } from "../types.js";

export const sessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const result = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", result?.user ?? null);
  c.set("session", result?.session ?? null);
  await next();
};
