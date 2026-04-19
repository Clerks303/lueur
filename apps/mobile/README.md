# @lueur/mobile

Lueur mobile app — Expo / React Native / TypeScript.

> This package is a stub. The actual Expo project is scaffolded at **T09** (see `docs/05-ROADMAP-WEEK-1.md`).

## Placeholder for now

Only a minimal `package.json` exists so pnpm workspaces recognise the folder and CI stays green. No Expo config, no source, no assets.

## What T09 will add

- `expo init` with TypeScript strict template
- Expo Router (file-based routing)
- NativeWind with Lueur color palette (`docs/03-DESIGN-SYSTEM.md`)
- Bundle identifiers (locked): `app.lueur.mobile` (iOS + Android)
- EAS config with three profiles: `development`, `preview`, `production`
- App icon + splash (terracotta "L" on `#FAF6EE`)
- Deep linking scheme `lueur://` + prepared Universal / App Links
- Permissions with French-first copy
- Base i18n structure (fr primary)
- Dependencies: `expo-camera`, `expo-secure-store`, `react-native-reanimated`, `zustand`, `@tanstack/react-query`, `@lueur/shared-types`

## Running locally (once T09 lands)

| Command | Purpose |
|---|---|
| `pnpm --filter @lueur/mobile start` | Start the Metro bundler + Expo Dev Client |
| `pnpm --filter @lueur/mobile ios` | Open in the iOS Simulator |
| `pnpm --filter @lueur/mobile android` | Open in the Android emulator |

### Connecting to the local API

The API runs on your Mac at `http://0.0.0.0:3000` (see root `.env.example`). Two cases:

- **iOS Simulator / Android Emulator on the Mac**: `EXPO_PUBLIC_API_URL=http://localhost:3000` in `apps/mobile/.env`.
- **Physical iPhone/Android on the same WiFi**: get your Mac's LAN IP with `ipconfig getifaddr en0` (or `en1` if on Ethernet), then set `EXPO_PUBLIC_API_URL=http://<that-ip>:3000`.
- **Off-WiFi testing**: start a Cloudflare Tunnel (`docs/TUNNEL.md`) and point `EXPO_PUBLIC_API_URL` at the generated `https://*.trycloudflare.com` URL.

## Prerequisites (before T09)

- **Xcode** for iOS Simulator (Mac App Store, ~15 GB)
- **Android Studio** for Android Emulator (site officiel)
- Apple Developer Program enrolment (for EAS Build → TestFlight later)
- Google Play Console enrolment (for EAS Build → Internal Testing later)
