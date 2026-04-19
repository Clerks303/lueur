import type { AuthSession } from "./lib/auth.js";

/**
 * Hono environment typing. `c.get("user")` is either a Better Auth user
 * object (possibly anonymous) or null. Same for `session`.
 */
export interface AppEnv {
  Variables: {
    user: AuthSession["user"] | null;
    session: AuthSession["session"] | null;
  };
}
