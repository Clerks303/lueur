/**
 * Full photo flow integration: upload-url → presigned PUT to MinIO →
 * complete → GET. Plus ownership isolation: user A cannot touch user B's
 * photo on /complete or GET.
 */
import { eq, inArray } from "drizzle-orm";
import IORedis from "ioredis";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { photos, user } from "@lueur/db";

import { getDb } from "../src/lib/db.js";
import {
  createAnonymousSession,
  hasLiveDb,
  testApp,
} from "./helpers.js";

// Gate on both DB and Redis reachability. MinIO is implied (we rely on
// the presigned PUT round-tripping).
const hasLiveInfra =
  hasLiveDb && (process.env.REDIS_URL ?? "") !== "";

describe.skipIf(!hasLiveInfra)("photos flow", () => {
  const createdUserIds: string[] = [];

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

  beforeAll(async () => {
    // Drain any stale jobs from previous runs so count assertions are stable.
    const redis = new IORedis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null,
    });
    const keys = await redis.keys("bull:analyze-photo:*");
    if (keys.length > 0) await redis.del(keys);
    await redis.quit();
  });

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      // Cascades delete sessions and photos.
      await getDb().delete(user).where(inArray(user.id, createdUserIds));
    }
  });

  it("runs the full upload → complete → GET flow and enqueues a job", async () => {
    const app = testApp();
    const cookie = await createAnonymousSession(app);
    const userId = await currentUserId(app, cookie);

    // 1) Reserve a slot + get presigned URL.
    const urlRes = await app.request("/photos/upload-url", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ content_type: "image/jpeg" }),
    });
    expect(urlRes.status).toBe(201);
    const urlBody = (await urlRes.json()) as {
      photo_id: string;
      upload_url: string;
      storage_key: string;
      expires_in: number;
      max_bytes: number;
    };
    expect(urlBody.photo_id).toMatch(/[0-9a-f-]{36}/);
    expect(urlBody.storage_key).toBe(
      `photos/${userId}/${urlBody.photo_id}.jpg`,
    );
    expect(urlBody.max_bytes).toBe(15 * 1024 * 1024);

    // 2) Upload a tiny fake JPEG directly to MinIO via the presigned URL.
    const fakeJpeg = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00,
    ]);
    const putRes = await fetch(urlBody.upload_url, {
      method: "PUT",
      headers: { "content-type": "image/jpeg" },
      body: fakeJpeg,
    });
    expect(putRes.status, await putRes.text()).toBe(200);

    // 3) Complete: should flip to 'queued' and return a BullMQ job id.
    const completeRes = await app.request(
      `/photos/${urlBody.photo_id}/complete`,
      { method: "POST", headers: { cookie } },
    );
    expect(completeRes.status).toBe(200);
    const completeBody = (await completeRes.json()) as {
      analysis_status: string;
      job_id: string;
    };
    expect(completeBody.analysis_status).toBe("queued");
    expect(completeBody.job_id).toMatch(/^\d+$/);

    // 4) GET returns the row with the expected state.
    const getRes = await app.request(`/photos/${urlBody.photo_id}`, {
      headers: { cookie },
    });
    expect(getRes.status).toBe(200);
    const getBody = (await getRes.json()) as {
      id: string;
      analysis_status: string;
      user_id: string;
    };
    expect(getBody.id).toBe(urlBody.photo_id);
    expect(getBody.user_id).toBe(userId);
    expect(getBody.analysis_status).toBe("queued");

    // 5) The job landed in Redis.
    const redis = new IORedis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null,
    });
    const waitLen = await redis.llen("bull:analyze-photo:wait");
    await redis.quit();
    expect(waitLen).toBeGreaterThanOrEqual(1);
  });

  it("rejects unknown content_type via Zod (4xx) and writes no row", async () => {
    const app = testApp();
    const cookie = await createAnonymousSession(app);
    await currentUserId(app, cookie);

    const res = await app.request("/photos/upload-url", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ content_type: "application/zip" }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("blocks GET /photos/:id for a non-owner with 404", async () => {
    const app = testApp();
    const cookieA = await createAnonymousSession(app);
    const cookieB = await createAnonymousSession(app);
    const userIdA = await currentUserId(app, cookieA);
    await currentUserId(app, cookieB);

    // A reserves an upload slot.
    const urlRes = await app.request("/photos/upload-url", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieA },
      body: JSON.stringify({ content_type: "image/png" }),
    });
    const { photo_id } = (await urlRes.json()) as { photo_id: string };

    // B tries to fetch A's photo.
    const res = await app.request(`/photos/${photo_id}`, {
      headers: { cookie: cookieB },
    });
    expect(res.status).toBe(404);

    // Sanity: the row belongs to A.
    const rows = await getDb()
      .select()
      .from(photos)
      .where(eq(photos.id, photo_id));
    expect(rows[0]?.userId).toBe(userIdA);
  });

  it("blocks POST /photos/:id/complete for a non-owner with 404", async () => {
    const app = testApp();
    const cookieA = await createAnonymousSession(app);
    const cookieB = await createAnonymousSession(app);
    await currentUserId(app, cookieA);
    await currentUserId(app, cookieB);

    const urlRes = await app.request("/photos/upload-url", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieA },
      body: JSON.stringify({ content_type: "image/jpeg" }),
    });
    const { photo_id } = (await urlRes.json()) as { photo_id: string };

    const res = await app.request(`/photos/${photo_id}/complete`, {
      method: "POST",
      headers: { cookie: cookieB },
    });
    expect(res.status).toBe(404);
  });

  it("requires auth on all three endpoints (401 without cookie)", async () => {
    const app = testApp();
    const [urlRes, compRes, getRes] = await Promise.all([
      app.request("/photos/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content_type: "image/jpeg" }),
      }),
      app.request("/photos/00000000-0000-0000-0000-000000000000/complete", {
        method: "POST",
      }),
      app.request("/photos/00000000-0000-0000-0000-000000000000"),
    ]);
    expect(urlRes.status).toBe(401);
    expect(compRes.status).toBe(401);
    expect(getRes.status).toBe(401);
  });
});
