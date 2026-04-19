/**
 * BullMQ queue producer. The API only enqueues; the worker (T07) consumes.
 *
 * The queue name is stable — the worker will use the same name to connect.
 * `connection` accepts an ioredis client OR an options object; we go with
 * the URL-based options form so we can swap REDIS_URL without touching code.
 */
import { Queue } from "bullmq";
import IORedis from "ioredis";

import { loadEnv } from "../env.js";

const env = loadEnv();

export const QUEUES = {
  analyzePhoto: "analyze-photo",
} as const;

export interface AnalyzePhotoJob {
  photoId: string;
  userId: string;
  storageKey: string;
  domainHint?: string;
}

let analyzePhotoQueue: Queue<AnalyzePhotoJob> | null = null;
let redisConnection: IORedis | null = null;

function getConnection(): IORedis {
  if (!redisConnection) {
    // maxRetriesPerRequest must be null for BullMQ blocking calls to work.
    redisConnection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }
  return redisConnection;
}

export function getAnalyzePhotoQueue(): Queue<AnalyzePhotoJob> {
  if (!analyzePhotoQueue) {
    analyzePhotoQueue = new Queue<AnalyzePhotoJob>(QUEUES.analyzePhoto, {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: { count: 1_000 },
        removeOnFail: { count: 5_000 },
      },
    });
  }
  return analyzePhotoQueue;
}

export async function enqueueAnalyzePhoto(
  payload: AnalyzePhotoJob,
): Promise<string> {
  const job = await getAnalyzePhotoQueue().add(QUEUES.analyzePhoto, payload);
  if (!job.id) throw new Error("BullMQ returned a job without id");
  return job.id;
}

export async function closeQueues(): Promise<void> {
  if (analyzePhotoQueue) {
    await analyzePhotoQueue.close();
    analyzePhotoQueue = null;
  }
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
  }
}
