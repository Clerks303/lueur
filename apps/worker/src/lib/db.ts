/**
 * Singleton Drizzle client for the worker process. Mirrors apps/api/src/lib/db.ts;
 * kept separate so each runtime owns its own connection pool.
 */
import { createDb, type Database } from "@lueur/db";

import { loadEnv } from "../env.js";

type Handle = { db: Database; close: () => Promise<void> };

let handle: Handle | null = null;

export function getDb(): Database {
  if (!handle) {
    const env = loadEnv();
    handle = createDb(env.DATABASE_URL);
  }
  return handle.db;
}

export async function closeDb(): Promise<void> {
  const h = handle;
  if (h) {
    handle = null;
    await h.close();
  }
}
