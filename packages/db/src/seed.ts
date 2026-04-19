/**
 * Seeds `duel_pairs` and `items` with the curated dataset in seed-data.ts.
 * Idempotent: clears both tables first so re-running is safe.
 *
 * Usage: `pnpm db:seed` (from repo root).
 */
import { sql } from "drizzle-orm";

import { createDb } from "./client.js";
import { requireDatabaseUrl } from "./env.js";
import { duelPairs, items } from "./seed-data.js";
import * as schema from "./schema.js";

async function main(): Promise<void> {
  const url = requireDatabaseUrl();
  const { db, close } = createDb(url);

  console.log("→ wiping duel_pairs and items");
  await db.execute(sql`truncate table ${schema.duelPairs} restart identity cascade`);
  await db.execute(sql`truncate table ${schema.items} restart identity cascade`);

  console.log(`→ inserting ${duelPairs.length} duel_pairs`);
  await db.insert(schema.duelPairs).values(duelPairs);

  console.log(`→ inserting ${items.length} items`);
  await db.insert(schema.items).values(items);

  console.log("✓ seed complete");
  await close();
}

main().catch((err) => {
  console.error("✗ seed failed:", err);
  process.exit(1);
});
