/**
 * BullMQ queue plumbing for the worker. Mirrors the producer side in
 * apps/api/src/lib/queue.ts; same queue name, same job payload shape.
 * The queue's defaults (retries, backoff, history retention) are set by
 * the producer — we only spin up a Worker to consume.
 */
import IORedis from "ioredis";

import { loadEnv } from "../env.js";

export const QUEUES = {
  analyzePhoto: "analyze-photo",
} as const;

export interface AnalyzePhotoJob {
  photoId: string;
  userId: string;
  storageKey: string;
  domainHint?: string;
}

let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!connection) {
    const env = loadEnv();
    connection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }
  return connection;
}

export async function closeRedis(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
