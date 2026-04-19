/**
 * Write the OpenAPI spec to packages/shared-types/openapi.json so the
 * mobile client (T09) can generate its typed fetch client from it.
 * Invoked via `pnpm api:openapi`.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildApp } from "../app.js";

async function main(): Promise<void> {
  const app = buildApp();
  const res = await app.request("/openapi.json");
  if (!res.ok) {
    throw new Error(`openapi.json returned ${res.status}`);
  }
  const spec = await res.json();

  const here = fileURLToPath(import.meta.url);
  const target = resolve(here, "../../../../../packages/shared-types/openapi.json");
  await mkdir(resolve(target, ".."), { recursive: true });
  await writeFile(target, `${JSON.stringify(spec, null, 2)}\n`, "utf-8");
  console.log(`✓ wrote ${target}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ openapi export failed:", err);
  process.exit(1);
});
