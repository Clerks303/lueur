/**
 * Typed fetch client generated from the OpenAPI spec shipped by
 * @lueur/api (packages/shared-types/openapi.json). Three concerns:
 *
 *   1. Base URL — read from EXPO_PUBLIC_API_URL at bundle time. Override
 *      per EAS profile (see eas.json).
 *   2. Session cookie — loaded from secure storage and injected on every
 *      request via middleware. Any Set-Cookie on the response is parsed
 *      and persisted back so anonymous sign-in "just works".
 *   3. 401 handling — clears the stored session and throws a typed
 *      SessionExpiredError the caller can route on.
 */
import Constants from "expo-constants";
import createClient, { type Middleware } from "openapi-fetch";

import type { paths } from "./schema";
import {
  clearSession,
  loadSession,
  saveSessionFromSetCookie,
} from "./session";

const DEFAULT_API_URL = "http://localhost:3200";

export class SessionExpiredError extends Error {
  constructor() {
    super("session expired");
    this.name = "SessionExpiredError";
  }
}

function resolveBaseUrl(): string {
  // process.env.EXPO_PUBLIC_* is bundled at build time. Fall back to
  // expo-constants extras so a simulator without env vars still works.
  const fromEnv = process.env["EXPO_PUBLIC_API_URL"];
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  const fromExtra =
    (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (fromExtra && fromExtra.length > 0) return fromExtra;
  return DEFAULT_API_URL;
}

export const API_URL = resolveBaseUrl();

const cookieMiddleware: Middleware = {
  async onRequest({ request }) {
    const session = await loadSession();
    if (session) request.headers.set("cookie", session.header);
    return request;
  },
  async onResponse({ response }) {
    // expo's React Native fetch returns Headers. getSetCookie is available
    // in modern RN and Node; fall back to the concatenated form otherwise.
    const setCookies =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : splitLegacySetCookie(response.headers.get("set-cookie"));
    if (setCookies.length > 0) {
      await saveSessionFromSetCookie(setCookies);
    }
    if (response.status === 401) {
      await clearSession();
      throw new SessionExpiredError();
    }
    return response;
  },
};

function splitLegacySetCookie(raw: string | null): string[] {
  if (!raw) return [];
  // Ambiguous: a single Cookie value can contain commas (dates). Best-effort
  // split on ", " that precedes a cookie-name pattern. For modern RN this
  // branch is a fallback only.
  return raw.split(/,\s(?=[a-zA-Z0-9._\-]+=)/);
}

export const api = createClient<paths>({
  baseUrl: API_URL,
});
api.use(cookieMiddleware);

// --------------------------------------------------------------------------
// Convenience wrappers used by screens. Keep this file thin; per-feature
// calls go into src/api/*.ts files as the app grows.
// --------------------------------------------------------------------------

export async function signInAnonymous(): Promise<void> {
  const res = await fetch(`${API_URL}/auth/sign-in/anonymous`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`anonymous sign-in failed: ${res.status}`);
  }
  const setCookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : splitLegacySetCookie(res.headers.get("set-cookie"));
  const stored = await saveSessionFromSetCookie(setCookies);
  if (!stored) {
    throw new Error("anonymous sign-in returned no session cookie");
  }
}

// --------------------------------------------------------------------------
// Photos
// --------------------------------------------------------------------------

export interface UploadUrlResponse {
  photo_id: string;
  upload_url: string;
  storage_key: string;
  expires_in: number;
  max_bytes: number;
}

export async function requestUploadUrl(
  contentType: "image/jpeg" | "image/png",
): Promise<UploadUrlResponse> {
  const { data, error } = await api.POST("/photos/upload-url", {
    body: { content_type: contentType },
  });
  if (error || !data) {
    throw new Error("Impossible d'obtenir l'URL d'upload.");
  }
  return data as UploadUrlResponse;
}

export async function completePhoto(
  photoId: string,
): Promise<{ analysis_status: "queued"; job_id: string }> {
  const { data, error } = await api.POST("/photos/{id}/complete", {
    params: { path: { id: photoId } },
  });
  if (error || !data) {
    throw new Error("Impossible de finaliser l'upload.");
  }
  return data as { analysis_status: "queued"; job_id: string };
}

export type PhotoStatus =
  | "pending"
  | "queued"
  | "processing"
  | "done"
  | "failed";

export interface PhotoRow {
  id: string;
  user_id: string;
  storage_key: string;
  domain: string | null;
  analysis: Record<string, unknown> | null;
  analysis_status: PhotoStatus;
  created_at: string;
}

export async function fetchPhoto(photoId: string): Promise<PhotoRow> {
  const { data, error } = await api.GET("/photos/{id}", {
    params: { path: { id: photoId } },
  });
  if (error || !data) {
    throw new Error("Impossible de charger la photo.");
  }
  return data as PhotoRow;
}

// --------------------------------------------------------------------------
// Events
// --------------------------------------------------------------------------

export type EventType =
  | "photo_analyzed"
  | "duel_answered"
  | "correction"
  | "graph_rebuilt"
  | "reco_feedback"
  | "import";

export async function postEvent(
  eventType: EventType,
  payload: Record<string, unknown>,
): Promise<void> {
  const { error } = await api.POST("/events", {
    body: { event_type: eventType, payload },
  });
  if (error) {
    throw new Error("Impossible d'enregistrer l'événement.");
  }
}
