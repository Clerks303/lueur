/**
 * Integration smoke test. Requires a reachable Postgres at DATABASE_URL with
 * the Lueur schema migrated and seeded.
 *
 * Skipped automatically in CI (no DATABASE_URL, no DB). Run locally with:
 *   pnpm dev:infra
 *   pnpm db:migrate
 *   pnpm db:seed
 *   pnpm --filter @lueur/db test
 */
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDb, type Database } from "../src/client.js";
import { loadEnv } from "../src/env.js";

loadEnv();

const databaseUrl = process.env.DATABASE_URL;

const expectedTables = [
  "user",
  "profiles",
  "taste_graphs",
  "taste_events",
  "photos",
  "duel_pairs",
  "duel_answers",
  "items",
  "recommendations",
] as const;

describe.skipIf(!databaseUrl)("db smoke", () => {
  let db: Database;
  let close: () => Promise<void>;

  beforeAll(() => {
    const created = createDb(databaseUrl as string);
    db = created.db;
    close = created.close;
  });

  afterAll(async () => {
    await close();
  });

  it("connects and can SELECT 1", async () => {
    const rows = await db.execute<{ n: number }>(sql`select 1::int as n`);
    expect(rows[0]?.n).toBe(1);
  });

  it("has pgvector and uuid-ossp extensions installed", async () => {
    const rows = await db.execute<{ extname: string }>(
      sql`select extname from pg_extension where extname in ('vector','uuid-ossp')`,
    );
    const names = rows.map((r) => r.extname).sort();
    expect(names).toEqual(["uuid-ossp", "vector"]);
  });

  it("has every expected table", async () => {
    const rows = await db.execute<{ table_name: string }>(
      sql`select table_name from information_schema.tables
          where table_schema='public' and table_type='BASE TABLE'`,
    );
    const names = new Set(rows.map((r) => r.table_name));
    for (const t of expectedTables) {
      expect(names.has(t), `missing table "${t}"`).toBe(true);
    }
  });

  it("has at least 20 duel_pairs seeded", async () => {
    const rows = await db.execute<{ n: number }>(
      sql`select count(*)::int as n from duel_pairs`,
    );
    expect(rows[0]?.n).toBeGreaterThanOrEqual(20);
  });

  it("has at least 50 items seeded", async () => {
    const rows = await db.execute<{ n: number }>(
      sql`select count(*)::int as n from items`,
    );
    expect(rows[0]?.n).toBeGreaterThanOrEqual(50);
  });
});
