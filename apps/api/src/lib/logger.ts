import { pino } from "pino";

import { loadEnv } from "../env.js";

const env = loadEnv();

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { app: "lueur-api", env: env.NODE_ENV },
  ...(env.NODE_ENV === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss.l" },
        },
      }
    : {}),
});
