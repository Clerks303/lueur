/**
 * Session cookie storage. React Native has no built-in cookie jar, so we
 * parse Set-Cookie manually on auth responses and persist the session
 * token in expo-secure-store (Keychain on iOS, EncryptedSharedPreferences
 * on Android). Subsequent requests inject the stored cookie back via a
 * Cookie header.
 *
 * We only track the cookie whose name starts with the "lueur." prefix
 * configured in apps/api/src/lib/auth.ts (advanced.cookiePrefix).
 */
import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "lueur.session";
const COOKIE_PREFIX = "lueur.";

export interface StoredSessionCookie {
  /** Full "name=value" pairs, joined with "; ", ready for a Cookie header. */
  header: string;
}

export async function loadSession(): Promise<StoredSessionCookie | null> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return null;
  return { header: raw };
}

export async function saveSessionFromSetCookie(
  setCookies: string[],
): Promise<StoredSessionCookie | null> {
  const pairs: string[] = [];
  for (const raw of setCookies) {
    const [nameValue] = raw.split(";", 1);
    if (!nameValue) continue;
    const trimmed = nameValue.trim();
    const [name] = trimmed.split("=", 1);
    if (name && name.startsWith(COOKIE_PREFIX)) {
      pairs.push(trimmed);
    }
  }
  if (pairs.length === 0) return null;
  const header = pairs.join("; ");
  await SecureStore.setItemAsync(STORAGE_KEY, header);
  return { header };
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}
