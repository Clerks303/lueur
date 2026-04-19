/**
 * Vitest setupFiles — loads repo-root .env.local if present, records a
 * LUEUR_HAS_LIVE_DB flag, then stubs everything the worker's env schema
 * requires so module top-level imports don't throw in CI.
 */
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(import.meta.url);
loadDotenv({ path: resolve(here, "../../../../.env.local"), quiet: true });

process.env.LUEUR_HAS_LIVE_DB = process.env.DATABASE_URL ? "1" : "";

process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgres://dummy:dummy@127.0.0.1:1/dummy";
process.env.S3_ACCESS_KEY_ID ??= "dummy";
process.env.S3_SECRET_ACCESS_KEY ??= "dummy";
