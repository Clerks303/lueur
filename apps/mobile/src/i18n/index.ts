/**
 * Tiny i18n wrapper. `i18n-js` is the lightest option that handles
 * fallback locales, interpolation and pluralisation. We only ship
 * French strings for MVP; English (en) is an empty stub so the
 * runtime never crashes if a future device reports a non-fr locale.
 */
import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";

import en from "./en";
import fr from "./fr";

export const i18n = new I18n({ fr, en });

i18n.defaultLocale = "fr";
i18n.enableFallback = true;

const deviceLocale = getLocales()[0]?.languageCode ?? "fr";
i18n.locale = deviceLocale === "fr" || deviceLocale === "en" ? deviceLocale : "fr";

export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}
