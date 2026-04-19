# Lueur — Week 1 Roadmap

> Target: end of week 1, Romain can install the app on his phone, take a photo, and see the analysis stream. No duels or profile yet — those are week 2.

## Definition of done for week 1

A user with the TestFlight / Android internal build can:

1. Launch the app, see Screen 1 (Landing)
2. Tap `Commencer` — auto-create anonymous session, request camera permission, see Screen 2 (Photo)
3. Capture a photo → encrypted upload to Scaleway → receive analysis from Claude → see Screen 3 (Analysis streaming line by line)
4. Tap `Oui` or `Corrige` → events recorded in the DB

Nothing else. No account, no duels, no profile, no notifications. **Resist scope creep.**

## Tasks, ordered by dependency

### Day 1 — Infrastructure foundation

**T01. VPS bootstrap** (≈ 3 h)
- Order OVH VPS (8 vCore / 16 GB / 160 GB NVMe, Ubuntu 24.04)
- Configure SSH key-only access, disable root login, disable password auth
- Harden with `ufw` (allow 22, 80, 443 only), `fail2ban`, unattended-upgrades
- Create a non-root user `lueur` with Docker group membership
- Install Docker + Docker Compose v2
- Set up Caddy in a container with auto-HTTPS (point a temporary domain to VPS IP first)
- Verify `https://<domain>/` returns a Caddy placeholder

**T02. Monorepo scaffold** (≈ 2 h)
- Initialize git repo, GitHub public, MIT license, README teaser
- `pnpm init`, `pnpm-workspace.yaml` with `apps/*` and `packages/*`
- Create empty `apps/api`, `apps/mobile`, `apps/worker`, `packages/shared-types`, `packages/prompts`, `packages/db`, `infra/`
- Root-level scripts: `pnpm dev`, `pnpm build`, `pnpm test`
- `.gitignore` for Node / Expo / Bun / env files
- First commit: `chore: initial monorepo scaffold`

### Day 2 — Backend API + DB

**T03. Database package with Drizzle** (≈ 3 h)
- `packages/db` with Drizzle + postgres-js
- Translate the SQL from `docs/02-DATA-SCHEMA.md` into Drizzle schema
- Migration tooling (drizzle-kit) generates `0001_init.sql`
- Seed script that inserts ~20 duel_pairs and ~50 items (can use placeholder data)
- `pnpm db:migrate` runs migrations, `pnpm db:seed` seeds

**T04. API scaffold with Hono + Bun** (≈ 4 h)
- `apps/api` running Hono on Bun
- Routes folder structure: `src/routes/{auth,photos,graph,duels,recommendations}`
- Integrate Better Auth with magic links (email provider: Resend or Brevo)
- For MVP, also support **anonymous auth** (Better Auth has this pattern): when mobile has no session, `POST /auth/anonymous` creates a throwaway user; the app persists the session in `expo-secure-store` and uses it for all subsequent requests. User can upgrade to email later.
- `/health` endpoint (returns `{ ok: true, version }`)
- OpenAPI schema exported at `/openapi.json` via `@hono/zod-openapi`
- Dockerfile + add to `infra/docker-compose.yml`

**T05. Deploy API to VPS** (≈ 2 h)
- GitHub Actions workflow: build Docker image, push to GHCR, SSH to VPS, `docker compose pull && up -d`
- Caddy config routes `api.<domain>` → api container
- Verify `https://api.<domain>/health` returns OK over HTTPS

### Day 3 — Storage + worker + first AI integration

**T06. Scaleway Object Storage wired up** (≈ 2 h)
- Create bucket in Paris region, access keys stored as GitHub Actions secrets + in `.env` on VPS
- API endpoint `POST /photos/upload-url` returns a presigned PUT URL (5 min expiry) + a `photo_id` (creates a `photos` row with `analysis_status='pending'`)
- API endpoint `POST /photos/:id/complete` marks upload complete and enqueues analysis

**T07. Worker with BullMQ** (≈ 3 h)
- `apps/worker` running Bun, connects to Redis (in Docker Compose)
- Job `analyze-photo`: fetches photo blob from Scaleway (server-side decrypt? — see note below), calls Claude Opus 4.7 (`claude-opus-4-7`) with `interior_analysis_v1`, writes to `photos.analysis`, inserts `taste_events(type='photo_analyzed')`, sets `analysis_status='done'`
- Add worker to `infra/docker-compose.yml`

**Note on encryption for MVP:** client-side E2E encryption is the **v2 goal**, not week 1. For week 1, upload raw photos with HTTPS-only in transit; document this as a known limitation in `docs/SECURITY-ROADMAP.md`. Proper E2E with libsodium comes week 3–4 once the core loop works.

**T08. Prompts package** (≈ 1 h)
- `packages/prompts/src/interior_analysis_v1.ts` — exports the system prompt string + model name + parameters
- Versioning convention documented in the package README

### Day 4 — Mobile scaffold + screens 1 & 2

**T09. Expo app scaffold** (≈ 3 h)
- `apps/mobile` with Expo SDK 53, TypeScript strict, Expo Router, NativeWind
- Configure app.json with bundle identifiers (`app.lueur.mobile.ios` / `.android`)
- NativeWind theme extended with the Lueur color palette (see `docs/03-DESIGN-SYSTEM.md`)
- Install `expo-camera`, `expo-secure-store`, `react-native-reanimated`, `zustand`, `@tanstack/react-query`
- Generate typed API client from `https://api.<domain>/openapi.json` via `openapi-typescript` + `openapi-fetch`
- Custom React hook `useApi()` that injects the session token from `expo-secure-store`
- Running on iOS simulator and Android emulator

**T10. Screen 1 (Landing) pixel-perfect** (≈ 2 h)
- Implement per `docs/03-DESIGN-SYSTEM.md` §Screen 1
- Tapping `Commencer` calls `POST /auth/anonymous`, stores session, requests camera permission, navigates to `/onboarding/photo`

**T11. Screen 2 (Photo capture)** (≈ 3 h)
- Implement per §Screen 2 with `expo-camera`
- On capture: `POST /photos/upload-url` → PUT to presigned URL → `POST /photos/:id/complete` → navigate to `/onboarding/analysis/:id`
- Display graceful error states

### Day 5 — Screen 3 + wiring + TestFlight

**T12. Screen 3 (Analysis with typewriter effect)** (≈ 3 h)
- Polls `GET /photos/:id` every 800 ms until `analysis_status === 'done'`
- While pending: shimmer skeleton on the lines area
- On arrival: render `analysis.narrative.observation_lines` one by one with typewriter (50ms/char, small terracotta cursor between lines)
- Synthesis line appears at the end in italic
- Buttons `Oui` / `Corrige`
- `Corrige` opens a modal that `POST /events` a `correction` event

**T13. Edge cases and polish** (≈ 2 h)
- Network failure states on every screen
- Camera permission denied state
- Analysis failure retry button
- Haptics on key moments

**T14. EAS setup and first TestFlight build** (≈ 3 h)
- `eas build` for iOS internal distribution → TestFlight
- `eas build` for Android internal test track
- Romain installs on his phone, runs the full flow
- Screen recording for the first build-in-public tweet 🎬

## Do NOT do in week 1

These are week 2+ and will be specced separately:
- Duels (Screen 4)
- Cross-domain reveal (Screen 5)
- Profile generation (Screen 6)
- Actions screen (Screen 7)
- Daily duel notifications
- Weekly recommendations
- E2E encryption
- MCP server
- Admin dashboard of any kind
- User account upgrade flow (anonymous → email)

## Metrics to track from day 1

Set up PostHog Cloud EU with these events:
- `app_opened`
- `onboarding_started` (tap Commencer)
- `photo_captured`
- `photo_uploaded`
- `analysis_completed`
- `analysis_failed`
- `onboarding_screen3_reached`
- `correction_submitted`

Funnel from `app_opened` to `onboarding_screen3_reached` is the #1 metric this week.
