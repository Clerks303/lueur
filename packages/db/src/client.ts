import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.js";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Build a Drizzle client bound to the given Postgres connection string.
 * Caller is responsible for closing the underlying connection via the
 * returned `close()` helper when a script exits.
 */
export function createDb(connectionString: string): {
  db: Database;
  close: () => Promise<void>;
} {
  const client = postgres(connectionString, { max: 10, prepare: false });
  const db = drizzle(client, { schema });
  return {
    db,
    close: async () => {
      await client.end({ timeout: 5 });
    },
  };
}
