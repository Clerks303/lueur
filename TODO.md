# TODO — deferred work

Non-blocking items we have consciously deferred. Keep terse, one line each; open a GitHub issue when an item grows beyond a single bullet.

## Before production beta (week 3–4)

- **VPS deployment** — Docker Compose on OVH, Caddy + HTTPS, CI/CD push to prod, Grafana/Prometheus self-hosted. See `docs/05-ROADMAP-WEEK-1.md` for the locked specs and `docs/SECURITY-ROADMAP.md` for the security items that flip on at that moment.
- **Client-side photo encryption (libsodium)** — photos uploaded raw in MVP; encrypt client-side before upload, decrypt in a short-lived worker context for the vision call.
- **Rate limiting on `/auth/*` and public endpoints** — per-IP token bucket in Redis once the API lives outside localhost.

## Before wiring item embeddings (T06+)

- **Replace `picsum.photos` seeds with curated real images** — Margaret Howell on their site, Wegner CH24 on Carl Hansen, APC Martin on APC, etc. Same image must ship to the mobile preview AND feed the embedding pipeline. Current deterministic picsum URLs are placeholder-only and will bias embeddings toward "random photo" if fed to OpenAI `text-embedding-3-large`.

## Before first iOS/Android build on pnpm

- **pnpm + react-native-reanimated podspec** — `pod install` under `apps/mobile/ios/` fails with `Invalid RNReanimated.podspec: different prefix: "" and "apps/mobile/ios/Pods"` because Reanimated's podspec doesn't follow pnpm's symlinked `node_modules/.pnpm` layout. Well-known issue. Two workable fixes, pick one when we do the first real build:
  1. Add `node-linker=hoisted` to a repo-root `.npmrc`, then reinstall. Forces pnpm into a flat layout the podspec can walk. Mild cost: we lose pnpm's strict-isolation guarantee across workspaces.
  2. Patch the podspec via `patch-package` to make it pnpm-aware. More surgical, no trade-off, but a maintenance touch-point at every Reanimated bump.
  The smoke tests in `__tests__/*.test.tsx` already prove Screens 1–3 render correctly under the Reanimated Jest mock, so this only blocks the *native* build.

## After first real Anthropic runs (post-T12)

- **Tune BullMQ backoff on analyze-photo** — current config is 3 attempts with exponential backoff from 5 s. Adjust once we have real Claude Opus 4.7 latency distributions; the onboarding polls every 800 ms so retries should not dominate the perceived wait.

## When the catalogue crosses ~10k items

- **Migrate ivfflat → HNSW on `items.embedding`** — pgvector 0.8+ supports HNSW with better recall and no `lists` tuning. Keep ivfflat while we're <1k items; it works and the NOTICE is informational.

## Whenever it becomes useful

- **App dashboard for seed curation** — a Drizzle Studio replacement is probably not worth building; `pnpm db:studio` is fine until we want non-dev editors.
- **TOTP / passkey support** — Better Auth has plugins; add when the user base grows enough to want 2FA.
