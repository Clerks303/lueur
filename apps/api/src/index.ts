/**
 * Bun entry point. Starts the HTTP server on API_HOST:API_PORT.
 * `export default { fetch, port, hostname }` is Bun's zero-config server pattern.
 */
import { buildApp } from "./app.js";
import { loadEnv } from "./env.js";
import { logger } from "./lib/logger.js";

const env = loadEnv();
const app = buildApp();

logger.info({ host: env.API_HOST, port: env.API_PORT }, "lueur-api listening");

export default {
  port: env.API_PORT,
  hostname: env.API_HOST,
  fetch: app.fetch,
};
