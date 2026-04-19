/**
 * analyze-photo handler tests — deterministic, no network.
 * We inject stubs for Anthropic + S3 fetcher so the real clients are
 * never constructed; the only live dependency is Postgres (gated by
 * hasLiveDb).
 */
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { photos, tasteEvents, user } from "@lueur/db";

import { runAnalyzePhoto } from "../src/jobs/analyze-photo.js";
import { getDb } from "../src/lib/db.js";
import type { AnalyzeInteriorClient } from "../src/lib/anthropic.js";

const hasLiveDb = process.env.LUEUR_HAS_LIVE_DB === "1";

const VALID_RESPONSE = JSON.stringify({
  structured: {
    palette: {
      observed_colors: ["ocres poussiéreux", "blanc cassé"],
      temperature: "warm",
      saturation: "muted",
    },
    materials: {
      observed: ["lin brut", "chêne non verni"],
      absent_notable: ["plastique"],
    },
    forms: {
      dominant: ["lignes droites"],
      ornamentation: "minimal",
    },
    references: ["japandi"],
    anti_patterns_detected: [],
    confidence_overall: 0.85,
    domain: "interior",
  },
  narrative: {
    observation_lines: ["Lumière douce.", "Palette : ocres."],
    synthesis: "Tu privilégies le toucher.",
  },
});

const INVALID_RESPONSE = "{this-is-not-json}";

function makeAnthropicStub(raw: string): AnalyzeInteriorClient {
  return {
    analyzeInterior: async () => raw,
  };
}

const noopFetcher = async () => ({
  base64: "Zg==", // "f" — just to satisfy the signature
  mediaType: "image/jpeg",
  bytes: 1,
});

describe.skipIf(!hasLiveDb)("analyze-photo handler", () => {
  const createdUserIds: string[] = [];
  let userId: string;
  let photoId: string;

  beforeEach(async () => {
    // Fresh user + photo row for each test so state is isolated.
    const [u] = await getDb()
      .insert(user)
      .values({
        name: "Test",
        email: `worker-test-${crypto.randomUUID()}@lueur.local`,
        isAnonymous: true,
      })
      .returning({ id: user.id });
    userId = u!.id;
    createdUserIds.push(userId);

    const [p] = await getDb()
      .insert(photos)
      .values({
        userId,
        storageKey: `photos/${userId}/fake.jpg`,
        analysisStatus: "queued",
      })
      .returning({ id: photos.id });
    photoId = p!.id;
  });

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await getDb().delete(user).where(inArray(user.id, createdUserIds));
    }
  });

  it("writes analysis, flips status to done, and emits taste_event on success", async () => {
    const result = await runAnalyzePhoto(
      { photoId, userId, storageKey: `photos/${userId}/fake.jpg` },
      {
        anthropic: makeAnthropicStub(VALID_RESPONSE),
        fetcher: noopFetcher,
      },
    );
    expect(result.analysis_status).toBe("done");

    const [row] = await getDb().select().from(photos).where(eq(photos.id, photoId));
    expect(row?.analysisStatus).toBe("done");
    expect(row?.errorMessage).toBeNull();
    expect(row?.domain).toBe("interior");
    const analysis = row?.analysis as {
      structured: { palette: { temperature: string } };
    } | null;
    expect(analysis?.structured.palette.temperature).toBe("warm");

    const events = await getDb()
      .select()
      .from(tasteEvents)
      .where(eq(tasteEvents.userId, userId));
    expect(events).toHaveLength(1);
    expect(events[0]?.eventType).toBe("photo_analyzed");
    const payload = events[0]?.payload as {
      photo_id: string;
      prompt_version: string;
    };
    expect(payload.photo_id).toBe(photoId);
    expect(payload.prompt_version).toBe("1.0.0");
  });

  it("marks photo as failed and rethrows when Anthropic returns junk", async () => {
    await expect(
      runAnalyzePhoto(
        { photoId, userId, storageKey: `photos/${userId}/fake.jpg` },
        {
          anthropic: makeAnthropicStub(INVALID_RESPONSE),
          fetcher: noopFetcher,
        },
      ),
    ).rejects.toThrow();

    const [row] = await getDb().select().from(photos).where(eq(photos.id, photoId));
    expect(row?.analysisStatus).toBe("failed");
    expect(row?.errorMessage).toBeTruthy();
    expect(row?.errorMessage).not.toContain("\n"); // sanitized single-line
    expect(row?.errorMessage?.length).toBeLessThanOrEqual(200);

    const events = await getDb()
      .select()
      .from(tasteEvents)
      .where(eq(tasteEvents.userId, userId));
    expect(events).toHaveLength(0); // no photo_analyzed event on failure
  });

  it("sanitizes the error_message (no stack, no PII)", async () => {
    try {
      await runAnalyzePhoto(
        { photoId, userId, storageKey: `photos/${userId}/fake.jpg` },
        {
          anthropic: {
            async analyzeInterior() {
              throw new Error(
                "secret-api-key=sk-ant-xxxxx leaked in stack\n  at foo (bar.ts:10)",
              );
            },
          },
          fetcher: noopFetcher,
        },
      );
    } catch {
      // expected
    }
    const [row] = await getDb().select().from(photos).where(eq(photos.id, photoId));
    // We keep the first line, clipped to 200 chars — the stack line is stripped.
    expect(row?.errorMessage).toBeTruthy();
    expect(row?.errorMessage).not.toContain("at foo");
  });
});
