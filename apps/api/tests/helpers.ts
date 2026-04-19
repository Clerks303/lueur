/**
 * Shared helpers for integration tests.
 * Requires the dev Postgres to be up and migrated. Skipped in CI.
 */
import { eq } from "drizzle-orm";
import { beforeAll } from "vitest";

import { user } from "@lueur/db";

import { buildApp } from "../src/app.js";
import { getDb } from "../src/lib/db.js";

/**
 * True iff setup.ts saw a DATABASE_URL in the environment (i.e. local dev
 * with the Docker Postgres up). False in CI, which skips every DB-touching
 * suite via describe.skipIf(!hasLiveDb).
 */
export const hasLiveDb = process.env.LUEUR_HAS_LIVE_DB === "1";
/** @deprecated use hasLiveDb. Kept as alias for existing test files. */
export const testDbUrl = hasLiveDb ? process.env.DATABASE_URL : undefined;

/** Ensures a BETTER_AUTH_SECRET is set before any auth code runs. */
export function setupTestEnv(): void {
  beforeAll(() => {
    if (!process.env.BETTER_AUTH_SECRET) {
      process.env.BETTER_AUTH_SECRET =
        "test-secret-" + "0".repeat(32); // 44 chars, satisfies min(32).
    }
  });
}

/** Build an app instance for the current test. */
export function testApp(): ReturnType<typeof buildApp> {
  return buildApp();
}

/**
 * Create an anonymous session and return a well-formed `Cookie:` request
 * header value (`name=value; name2=value2`) built from every Set-Cookie
 * the server sent. Extracting via getSetCookie() avoids the comma-join
 * ambiguity of headers.get("set-cookie").
 */
export async function createAnonymousSession(
  app: ReturnType<typeof buildApp>,
): Promise<string> {
  const res = await app.request("/auth/sign-in/anonymous", { method: "POST" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `anonymous sign-in failed: ${res.status} ${res.statusText} ${body}`,
    );
  }
  const setCookies = res.headers.getSetCookie();
  if (setCookies.length === 0) {
    throw new Error("no Set-Cookie on anonymous sign-in");
  }
  const pairs = setCookies
    .map((raw) => raw.split(";", 1)[0]?.trim())
    .filter((p): p is string => Boolean(p));
  return pairs.join("; ");
}

/** Tear down every user created during a test (cascades to events/sessions). */
export async function deleteUserCascade(userId: string): Promise<void> {
  await getDb().delete(user).where(eq(user.id, userId));
}
