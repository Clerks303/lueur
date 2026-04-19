import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Load the repo-root `.env.local` so scripts run from `packages/db/` have
 * access to DATABASE_URL and other secrets defined in the monorepo root.
 * Idempotent — calling twice is a no-op.
 */
let loaded = false;
export function loadEnv(): void {
  if (loaded) return;
  const here = fileURLToPath(import.meta.url);
  const rootEnv = resolve(here, "../../../../.env.local");
  config({ path: rootEnv });
  loaded = true;
}

export function requireDatabaseUrl(): string {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is missing. Copy .env.example to .env.local at the repo root and fill it.",
    );
  }
  return url;
}
