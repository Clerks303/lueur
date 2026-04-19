/**
 * Centralized error handler. Converts throws into JSON error responses and
 * logs unexpected failures. Expected errors (HTTPException, Zod validation)
 * carry the right status; unexpected errors become 500.
 */
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import { ZodError } from "zod";

import { logger } from "./logger.js";

export class ApiError extends HTTPException {
  constructor(status: 400 | 401 | 403 | 404 | 409 | 422, message: string) {
    super(status, { message });
  }
}

export function errorHandler(err: Error, c: Context): Response {
  if (err instanceof HTTPException) {
    return c.json(
      { error: err.message, code: httpCode(err.status) },
      err.status,
    );
  }
  if (err instanceof ZodError) {
    return c.json(
      {
        error: "validation_failed",
        code: "VALIDATION_FAILED",
        issues: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      422,
    );
  }
  logger.error({ err }, "unhandled error");
  return c.json({ error: "internal_error", code: "INTERNAL_ERROR" }, 500);
}

function httpCode(status: number): string {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "VALIDATION_FAILED";
    default:
      return "HTTP_ERROR";
  }
}
