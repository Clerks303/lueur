/**
 * Anonymous auth flow: POST /auth/sign-in/anonymous creates a user,
 * sets a session cookie, and the cookie reads back on GET /auth/get-session.
 */
import { eq, inArray } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { user } from "@lueur/db";

import { getDb } from "../src/lib/db.js";
import {
  createAnonymousSession,
  setupTestEnv,
  testApp,
  testDbUrl,
} from "./helpers.js";

describe.skipIf(!testDbUrl)("anonymous auth", () => {
  setupTestEnv();
  const createdUserIds: string[] = [];

  // Cleanup: remove only users created by this suite. A broader `DELETE
  // WHERE email LIKE '%@lueur.local'` would torpedo the other suites
  // running in parallel.
  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await getDb().delete(user).where(inArray(user.id, createdUserIds));
    }
  });

  async function trackCurrentUser(
    app: ReturnType<typeof testApp>,
    cookie: string,
  ): Promise<string> {
    const res = await app.request("/auth/get-session", { headers: { cookie } });
    const body = (await res.json()) as { user: { id: string } } | null;
    if (!body) throw new Error("no session body");
    createdUserIds.push(body.user.id);
    return body.user.id;
  }

  it("creates an anonymous user, sets session cookies with HttpOnly + SameSite=Lax", async () => {
    const app = testApp();
    const res = await app.request("/auth/sign-in/anonymous", {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const raws = res.headers.getSetCookie();
    expect(raws.length).toBeGreaterThan(0);
    // At least one cookie must be the session token and carry our security flags.
    const sessionToken = raws.find((c) => c.startsWith("lueur.session_token="));
    expect(sessionToken).toBeDefined();
    expect(sessionToken!.toLowerCase()).toContain("httponly");
    expect(sessionToken!.toLowerCase()).toContain("samesite=lax");
  });

  it("recognises the cookie on a follow-up /auth/get-session call", async () => {
    const app = testApp();
    const cookie = await createAnonymousSession(app);
    const userId = await trackCurrentUser(app, cookie);

    // Fetch a second time to verify the session is durable, and confirm the
    // email follows the @lueur.local anon convention.
    const res = await app.request("/auth/get-session", {
      headers: { cookie },
    });
    const body = (await res.json()) as {
      user: { id: string; email: string };
    } | null;
    expect(body?.user.id).toBe(userId);
    expect(body?.user.email).toMatch(/@lueur\.local$/);
  });

  it("persists the anonymous user row in the database", async () => {
    const app = testApp();
    const cookie = await createAnonymousSession(app);
    const userId = await trackCurrentUser(app, cookie);

    const rows = await getDb().select().from(user).where(eq(user.id, userId));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.isAnonymous).toBe(true);
  });
});
