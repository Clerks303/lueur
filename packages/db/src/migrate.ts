/**
 * Applies pending Drizzle migrations to the configured Postgres.
 * Usage: `pnpm db:migrate` (from repo root) or `pnpm --filter @lueur/db db:migrate`.
 */
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createDb } from "./client.js";
import { requireDatabaseUrl } from "./env.js";

async function main(): Promise<void> {
  const url = requireDatabaseUrl();
  const { db, close } = createDb(url);

  const here = fileURLToPath(import.meta.url);
  const migrationsFolder = resolve(here, "../../drizzle");

  console.log(`→ running migrations from ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
  console.log("✓ migrations applied");

  await close();
}

main().catch((err) => {
  console.error("✗ migration failed:", err);
  process.exit(1);
});
