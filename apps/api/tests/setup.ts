/**
 * Runs BEFORE every test file (see vitest.config.ts setupFiles).
 *
 * Provides just enough env for module top-level imports (auth.ts calls
 * loadEnv() at import time) to not throw in CI, even without a real DB.
 *
 * Integration tests gate themselves on HAS_LIVE_DB (computed below): the
 * flag flips to true only when DATABASE_URL was already set by the
 * environment before this file ran. A fresh CI process has no DATABASE_URL
 * → HAS_LIVE_DB=false → every DB-touching test skips.
 */
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Load repo-root .env.local BEFORE the flag check so local runs see the
// real DATABASE_URL. In CI no .env.local exists → dotenv is a no-op.
const here = fileURLToPath(import.meta.url);
loadDotenv({ path: resolve(here, "../../../../.env.local"), quiet: true });

// Persist the live-DB flag for test files to read without importing setup.ts.
process.env.LUEUR_HAS_LIVE_DB = process.env.DATABASE_URL ? "1" : "";

process.env.NODE_ENV ??= "test";
process.env.BETTER_AUTH_SECRET ??= "test-secret-" + "0".repeat(32);
process.env.BETTER_AUTH_URL ??= "http://localhost:3200";
process.env.DATABASE_URL ??= "postgres://dummy:dummy@127.0.0.1:1/dummy";
process.env.S3_ACCESS_KEY_ID ??= "dummy";
process.env.S3_SECRET_ACCESS_KEY ??= "dummy";
