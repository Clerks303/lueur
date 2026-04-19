import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { resolve } from "node:path";

// Load repo-root .env.local. drizzle-kit transpiles this file to CJS, so
// we resolve relative to cwd (packages/db when run via pnpm) rather than
// import.meta.dirname (unavailable under CJS).
config({ path: resolve(process.cwd(), "../../.env.local") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Copy .env.example to .env.local at the repo root and fill it.",
  );
}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
});
