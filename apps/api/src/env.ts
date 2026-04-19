/**
 * Environment loading + validation.
 * Loads the repo-root .env.local (if present) then validates via zod.
 * Fails fast on missing required vars so we never boot with a half-broken config.
 */
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

// Load repo-root .env.local before reading process.env. Safe to call once.
const here = fileURLToPath(import.meta.url);
loadDotenv({ path: resolve(here, "../../../../.env.local"), quiet: true });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_HOST: z.string().default("0.0.0.0"),
  // Port 3200 (not 3000) avoids colliding with other local dev servers
  // (Next.js on 3000, FastAPI on 3100 seen on Romain's Mac). Override via env.
  API_PORT: z.coerce.number().int().positive().default(3200),
  API_CORS_ORIGIN: z.string().default("*"),
  API_TRUSTED_ORIGINS: z
    .string()
    .default("http://localhost:3200,http://localhost:8081,http://localhost:19006"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be ≥ 32 chars (openssl rand -hex 32)"),
  BETTER_AUTH_URL: z.string().default("http://localhost:3200"),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().default("Lueur <onboarding@resend.dev>"),

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

  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"])
    .default("info"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const pretty = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment:\n${pretty}`);
  }
  cached = parsed.data;
  return cached;
}

/** Test-only: reset the cache so tests can override env between suites. */
export function _resetEnvCache(): void {
  cached = null;
}
