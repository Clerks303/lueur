/**
 * POST /events ownership: the user_id written to the DB is always the
 * session user, never a value the client tries to sneak in via the body.
 * Two parallel anonymous sessions must never cross-contaminate.
 */
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { tasteEvents, user } from "@lueur/db";

import { getDb } from "../src/lib/db.js";
import {
  createAnonymousSession,
  setupTestEnv,
  testApp,
  testDbUrl,
} from "./helpers.js";

describe.skipIf(!testDbUrl)("POST /events ownership", () => {
  setupTestEnv();
  const createdUserIds: string[] = [];

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await getDb().delete(user).where(inArray(user.id, createdUserIds));
    }
  });

  async function currentUserId(
    app: ReturnType<typeof testApp>,
    cookie: string,
  ): Promise<string> {
    const res = await app.request("/auth/get-session", {
      headers: { cookie },
    });
    const body = (await res.json()) as { user: { id: string } };
    createdUserIds.push(body.user.id);
    return body.user.id;
  }

  it("rejects POST /events without a session with 401", async () => {
    const app = testApp();
    const res = await app.request("/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_type: "correction",
        payload: { target: "palette", value: "ocres" },
      }),
    });
    expect(res.status).toBe(401);
  });

  it("writes the event under the session user_id", async () => {
    const app = testApp();
    const cookie = await createAnonymousSession(app);
    const sessionUserId = await currentUserId(app, cookie);

    const res = await app.request("/events", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        event_type: "correction",
        payload: { target: "material", value: "lin_brut" },
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; event_type: string };
    expect(body.event_type).toBe("correction");

    const rows = await getDb()
      .select()
      .from(tasteEvents)
      .where(eq(tasteEvents.id, body.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.userId).toBe(sessionUserId);
  });

  it("ignores a smuggled user_id in the body (never writes it)", async () => {
    const app = testApp();
    const cookieA = await createAnonymousSession(app);
    const cookieB = await createAnonymousSession(app);
    const userIdA = await currentUserId(app, cookieA);
    const userIdB = await currentUserId(app, cookieB);

    // User A tries to forge an event attributed to user B.
    const res = await app.request("/events", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieA },
      body: JSON.stringify({
        event_type: "correction",
        payload: { target: "palette", value: "ocres" },
        // biome-ignore lint: intentional forgery attempt
        user_id: userIdB,
      }),
    });

    // Two outcomes are both safe:
    //   - Zod strict-mode rejected the body (4xx) → nothing written.
    //   - Server accepted (201) and silently wrote userIdA (session wins).
    // Either way: nothing is ever written under userIdB.
    if (res.status === 201) {
      const body = (await res.json()) as { id: string };
      const rows = await getDb()
        .select()
        .from(tasteEvents)
        .where(eq(tasteEvents.id, body.id));
      expect(rows[0]?.userId).toBe(userIdA);
      expect(rows[0]?.userId).not.toBe(userIdB);
    } else {
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    }

    // And confirm no event was ever written against userIdB.
    const forged = await getDb()
      .select()
      .from(tasteEvents)
      .where(
        and(
          eq(tasteEvents.userId, userIdB),
          eq(tasteEvents.eventType, "correction"),
        ),
      );
    expect(forged).toHaveLength(0);
  });
});
