/**
 * Authorization helpers. Every endpoint that reads or mutates a user-scoped
 * resource must go through `requireAuth` (session present) and, for
 * resources keyed by user_id, `requireOwnership` (session.userId matches
 * resource.userId).
 */
import { ApiError } from "./errors.js";

export function requireAuth<U extends { id: string }>(
  user: U | null | undefined,
): U {
  if (!user) throw new ApiError(401, "authentication required");
  return user;
}

export function requireOwnership(
  sessionUserId: string,
  resourceUserId: string,
): void {
  if (sessionUserId !== resourceUserId) {
    // We raise 404 (not 403) on purpose: do not confirm the resource exists
    // to a caller who does not own it.
    throw new ApiError(404, "not found");
  }
}
