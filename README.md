# lueur

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

## Docs

Product and engineering context lives in `docs/`. Start with `docs/CTO-KICKOFF.md`.

## License

MIT — see [LICENSE](./LICENSE).
