/**
 * Worker bootstrap. Spins up one BullMQ Worker per queue name, then idles
 * on the event loop. Graceful shutdown: SIGTERM / SIGINT → close worker
 * (drains in-flight jobs) → close Redis / DB → exit 0.
 */
import { Worker, type Job } from "bullmq";

import { loadEnv } from "./env.js";
import { runAnalyzePhoto } from "./jobs/analyze-photo.js";
import { closeDb } from "./lib/db.js";
import { logger } from "./lib/logger.js";
import { closeRedis, getRedisConnection, QUEUES, type AnalyzePhotoJob } from "./lib/queue.js";

const env = loadEnv();

const analyzePhotoWorker = new Worker<AnalyzePhotoJob>(
  QUEUES.analyzePhoto,
  async (job: Job<AnalyzePhotoJob>) => {
    logger.info(
      { jobId: job.id, attempt: job.attemptsMade + 1, photoId: job.data.photoId },
      "picked up analyze-photo job",
    );
    return runAnalyzePhoto(job.data);
  },
  {
    connection: getRedisConnection(),
    concurrency: env.WORKER_CONCURRENCY,
  },
);

analyzePhotoWorker.on("failed", (job, err) => {
  logger.warn(
    {
      jobId: job?.id,
      attempt: job?.attemptsMade,
      maxAttempts: job?.opts.attempts,
      err: err.message,
    },
    "analyze-photo job failed",
  );
});

analyzePhotoWorker.on("completed", (job, result) => {
  logger.info(
    { jobId: job.id, photoId: job.data.photoId, result },
    "analyze-photo job completed",
  );
});

logger.info(
  { queue: QUEUES.analyzePhoto, concurrency: env.WORKER_CONCURRENCY },
  "lueur-worker ready",
);

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "shutting down");
  try {
    await analyzePhotoWorker.close();
    await closeRedis();
    await closeDb();
  } catch (err) {
    logger.error({ err }, "error during shutdown");
  }
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
