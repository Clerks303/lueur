# lueur

[![CI](https://github.com/Clerks303/lueur/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Clerks303/lueur/actions/workflows/ci.yml)

> Une app qui apprend ton goût. Et s'en souvient.

**Lueur** is a mobile app (iOS + Android, React Native) that learns a user's aesthetic taste across domains — interior, clothing, food, music, travel — through photos of things they already love and daily 30-second *duels*. The result is a structured, explainable, user-owned **taste graph** that AI agents can later query with permission.

Built in public, solo, from Laval (France).

## Status

Week 1 — infrastructure and onboarding wow moment. See `docs/05-ROADMAP-WEEK-1.md`.

## Stack

Mobile: Expo / React Native / TypeScript. Backend: Bun + Hono. DB: PostgreSQL 16 + pgvector. Queue: Redis 7 + BullMQ. AI: Anthropic Claude + OpenAI embeddings. Infra in dev: Docker Compose (local). Infra in prod (later): self-hosted on OVH, Docker + Caddy.

See `docs/01-STACK.md` for the locked decisions.

## Local development setup

Prerequisites:

- **Docker Desktop** (v29+) with Compose v2
- **Node.js** ≥ 20
- **pnpm** ≥ 9.15 — `npm install -g pnpm`

First-time setup:

```bash
git clone https://github.com/Clerks303/lueur.git
cd lueur
cp .env.example .env.local          # fill secrets as they become needed
pnpm dev:infra                       # starts Postgres + Redis
```

Daily workflow:

| Command | What it does |
|---|---|
| `pnpm dev:infra` | Start Postgres + Redis (detached). Safe to re-run. |
| `pnpm dev:infra:ps` | Show container status and health. |
| `pnpm dev:infra:logs` | Tail logs from both services. |
| `pnpm dev:infra:down` | Stop containers. **Data persists** in named volumes. |
| `pnpm dev:infra:reset` | Stop **and wipe** volumes. Use when you want a clean DB. |

Ports (chosen to avoid collision with other local Postgres/Redis instances):

- **Postgres** → `localhost:54329` (internal port is still `5432`)
- **Redis** → `localhost:63799` (internal `6379`)

Connection strings are in `.env.example`.

## Monorepo layout

```
apps/
  api/        Hono + Bun HTTP API            (scaffolded at T04)
  worker/     BullMQ worker                  (scaffolded at T07)
  mobile/     Expo / React Native app        (scaffolded at T09)
packages/
  shared-types/   TS types shared across apps
  prompts/        Versioned AI system prompts (see docs/04-PROMPTS.md)
  db/             Drizzle schema + taste graph derivation
infra/            Docker Compose for local dev
docs/             Product + engineering context
.github/          CI workflow
```

Workspace commands run from the root:

| Command | Purpose |
|---|---|
| `pnpm install` | Install dependencies for all workspaces |
| `pnpm typecheck` | Run `tsc --noEmit` in every workspace, in parallel |
| `pnpm test` | Run `test` script in every workspace, in parallel |
| `pnpm build` | Run `build` where defined |

## Docs

Product and engineering context lives in `docs/`. Start with `docs/CTO-KICKOFF.md`.
Off-WiFi testing via Cloudflare Tunnel: `docs/TUNNEL.md`. Security trade-offs: `docs/SECURITY-ROADMAP.md`.

## License

MIT — see [LICENSE](./LICENSE).
