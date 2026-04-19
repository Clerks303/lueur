# @lueur/mobile

Lueur mobile app — Expo SDK 55, React Native 0.82, TypeScript strict, Expo Router, NativeWind.

## Prerequisites

- **Node.js ≥ 20** and **pnpm ≥ 9.15** (already required by the monorepo)
- **Bun** (only for the `icons:gen` and API client generation scripts)
- **Xcode** (for the iOS Simulator) — Mac App Store, ~15 GB
- **Android Studio** (for the Android Emulator) — site officiel

The backend (Postgres + Redis + MinIO + API) must be up before you launch the app: `pnpm dev:infra && pnpm dev:api`.

## First run

```bash
pnpm install                    # from the repo root
pnpm mobile:icons               # generate PNG icons from assets/*.svg (one-time)
pnpm mobile:api:gen             # regen the typed API client from OpenAPI
pnpm dev:mobile                 # starts Expo dev server
```

From the Expo dev UI: press `i` for iOS Simulator, `a` for Android Emulator, or scan the QR code with Expo Go on a physical device on the same WiFi.

## Connecting to the local API

`EXPO_PUBLIC_API_URL` is bundled at build time. Configure per target:

| Target | Value |
|---|---|
| iOS Simulator / Android Emulator on the Mac | `http://localhost:3200` (default) |
| Physical iPhone on the same WiFi | `http://<mac-lan-ip>:3200` |
| Off-WiFi testing | `https://<random>.trycloudflare.com` (see [docs/TUNNEL.md](../../docs/TUNNEL.md)) |

Get the Mac LAN IP:

```bash
ipconfig getifaddr en0    # Wi-Fi
ipconfig getifaddr en1    # Ethernet, if applicable
```

Then set the env var in `.env` at the repo root OR via `EAS build --env-file`.

## Scripts (run from repo root unless noted)

| Command | Purpose |
|---|---|
| `pnpm dev:mobile` | Start the Expo dev server with the dev client |
| `pnpm mobile:ios` | `expo run:ios` — builds a dev client and opens the iOS Simulator |
| `pnpm mobile:android` | `expo run:android` — builds a dev client and opens the Android Emulator |
| `pnpm mobile:api:gen` | Regenerate `src/api/schema.ts` from the current OpenAPI spec |
| `pnpm mobile:icons` | Regenerate `assets/*.png` from the SVG sources |
| `pnpm --filter @lueur/mobile typecheck` | `tsc --noEmit` |
| `pnpm --filter @lueur/mobile test` | Jest smoke suite (UI tests are intentionally minimal for MVP) |

## EAS build profiles

`eas.json` exposes three profiles (keep in sync with the docs):

| Profile | Distribution | `EXPO_PUBLIC_API_URL` |
|---|---|---|
| `development` | internal, iOS simulator allowed | `http://localhost:3200` |
| `preview` | internal TestFlight / Internal Testing | `http://localhost:3200` (override per session) |
| `production` | stores | `https://api.lueur.app` (placeholder) |

First builds require credentials we don't have yet — see `docs/CTO-KICKOFF.md` §Apple / Google dev accounts.

## Bundle identifiers (locked)

`app.lueur.mobile` on both iOS and Android. Never change these even if the product rebrands — only the display name is mutable.

## Session cookie pattern

React Native has no native cookie jar. `src/api/session.ts` parses `Set-Cookie` off auth responses and persists the `lueur.session_token` cookie in `expo-secure-store`. `src/api/client.ts` injects it back on every request via `openapi-fetch` middleware. A `401` clears the stored session and throws `SessionExpiredError`.

## Directory layout

```
app/                        Expo Router routes (file-based)
  _layout.tsx               Root providers (TanStack Query, gesture handler)
  index.tsx                 Screen 1 — Landing (shipped)
  onboarding/
    _layout.tsx             Stack for onboarding flow
    photo.tsx               Screen 2 — stub
    analysis/[id].tsx       Screen 3 — stub
    duel.tsx                Screen 4 — stub
    cross-domain.tsx        Screen 5 — stub
    profile.tsx             Screen 6 — stub
    actions.tsx             Screen 7 — stub
  (app)/
    _layout.tsx
    index.tsx               Home — stub
src/
  api/                      Typed client, session helpers, schema (generated)
  i18n/                     French strings + i18n-js wrapper
assets/                     Icons / splash (SVG source + generated PNG)
scripts/                    One-off dev scripts (icon generation)
```

## Writing strings

French-first. All user-facing text goes in `src/i18n/fr.ts`. The `en.ts` stub exists so i18n-js never crashes on a non-fr device; we only translate when we open to UK/US.
