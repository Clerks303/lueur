/**
 * Worker env loading + validation. Smaller surface than the API because
 * the worker doesn't host HTTP or auth; it connects to DB, Redis, S3 and
 * Anthropic only.
 */
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const here = fileURLToPath(import.meta.url);
loadDotenv({ path: resolve(here, "../../../../.env.local"), quiet: true });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().default("redis://localhost:63799"),

  S3_ENDPOINT: z.string().default("http://localhost:9000"),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().default("lueur-photos"),
  S3_ACCESS_KEY_ID: z.string().min(1, "S3_ACCESS_KEY_ID is required"),
  S3_SECRET_ACCESS_KEY: z.string().min(1, "S3_SECRET_ACCESS_KEY is required"),
  S3_FORCE_PATH_STYLE: z
    .string()
    .default("true")
    .transform((v) => v.toLowerCase() === "true"),

  /** Required in prod / dev. Tests override with a stub client and skip this. */
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),

  WORKER_CONCURRENCY: z.coerce.number().int().positive().max(20).default(3),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"])
    .default("info"),
});

export type WorkerEnv = z.infer<typeof schema>;

let cached: WorkerEnv | null = null;

export function loadEnv(): WorkerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const pretty = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid worker environment:\n${pretty}`);
  }
  cached = parsed.data;
  return cached;
}
