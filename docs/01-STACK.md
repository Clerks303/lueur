# Lueur — Technical Stack (LOCKED)

> These decisions are **locked**. If you believe one must change, **surface it to Romain before acting**, do not change stack unilaterally.

## Guiding principles

- **Full self-host on OVH infrastructure** — data sovereignty is a product feature, not an afterthought
- **TypeScript everywhere** — end-to-end type safety
- **Boring, proven tech for infra** — exciting tech only where it creates product value
- **Solo-founder friendly** — every choice optimizes for "can Romain maintain this alone at 3am"

## Mobile app

| Concern | Choice |
|---|---|
| Runtime | **Expo SDK 53+** (React Native) |
| Language | **TypeScript strict mode** |
| Routing | **Expo Router** (file-based) |
| Styling | **NativeWind** (Tailwind for RN) |
| State | **Zustand** (no Redux) |
| Server state | **TanStack Query** |
| Camera | **expo-camera** |
| Notifications | **expo-notifications** |
| Animations | **react-native-reanimated** |
| Secure storage | **expo-secure-store** (Keychain / Keystore) |
| Crypto | **react-native-libsodium** (client-side E2E) |
| Icons | **@expo/vector-icons** or custom SVG only |
| Fonts | System serif for editorial moments + Inter for UI |
| Builds | **EAS Build** (iOS + Android) |
| OTA | **EAS Update** |

## Backend API

| Concern | Choice |
|---|---|
| Runtime | **Bun 1.x** |
| Framework | **Hono** |
| ORM | **Drizzle** |
| Validation | **Zod** everywhere |
| OpenAPI | **@hono/zod-openapi** — schema exported, mobile client generated from it |
| Auth | **Better Auth** (magic links + sessions, passkeys later) |
| Background jobs | **BullMQ** + Redis |

## Database and storage

| Concern | Choice |
|---|---|
| Database | **PostgreSQL 16** self-hosted (Docker) |
| Vector extension | **pgvector** |
| Object storage | **Scaleway Object Storage** (Paris) — S3-compatible, sovereign EU |
| Cache / queue backend | **Redis 7** self-hosted (Docker) |
| Backups | `pg_dump` nightly → Scaleway Object Storage |

## AI models

| Use case | Model |
|---|---|
| Photo analysis (onboarding wow moment) | **Claude Opus 4.7** via Anthropic API — `claude-opus-4-7` |
| Fast scoring, ranking, classification | **Claude Haiku 4.5** — `claude-haiku-4-5` |
| Embeddings (pgvector) | **OpenAI `text-embedding-3-large`** (1536 dims) |

All model usage goes through a thin internal `ai-gateway` module so we can swap providers later without touching product code.

## Infrastructure

| Concern | Choice |
|---|---|
| Server | **VPS OVH** (Ubuntu 24.04 LTS). Size: 8 vCore / 16 GB / 160 GB NVMe minimum. |
| Containerization | **Docker + Docker Compose** everywhere |
| Reverse proxy | **Caddy** (automatic HTTPS via Let's Encrypt) |
| CI/CD | **GitHub Actions** → build images → SSH deploy |
| Monitoring | **Grafana + Prometheus** (self-hosted) |
| Uptime | **Uptime Kuma** self-hosted |
| Error tracking | **Sentry** SaaS (free tier) |
| Product analytics | **PostHog Cloud EU** (migrate to self-host later) |
| Firewall | **ufw** + **fail2ban** |

## Repo structure

```
lueur/
├── apps/
│   ├── mobile/                    # Expo app (iOS + Android only)
│   ├── api/                       # Hono API (Bun)
│   └── worker/                    # BullMQ worker (Bun)
├── packages/
│   ├── shared-types/              # TS types shared between apps (taste graph, DTOs)
│   ├── prompts/                   # Versioned system prompts for AI calls
│   └── db/                        # Drizzle schema + migrations
├── infra/
│   ├── docker-compose.yml         # Production compose file
│   ├── docker-compose.dev.yml     # Local dev (hot reload)
│   ├── Caddyfile
│   └── scripts/                   # Setup, backup, deploy scripts
├── docs/                          # The markdown files you are reading
├── .github/workflows/
├── package.json                   # pnpm workspaces root
├── pnpm-workspace.yaml
├── .gitignore
├── LICENSE                        # MIT (permissive for build-in-public)
└── README.md                      # Public-facing teaser
```

## Rejected explicitly (do not propose these)

- **Supabase** — we want full self-host sovereignty
- **Firebase** — Google lock-in
- **Kubernetes** — overkill for solo founder
- **PM2 alone without Docker** — too fragile, no clean rollback
- **MongoDB** — Postgres + JSONB covers every need
- **Prisma** — acceptable but Drizzle is better suited to Bun + Hono
- **Next.js / web app** — mobile-only product, no web until explicit product decision
- **Redux / MobX** — Zustand is enough
- **Nest.js** — too heavy vs. Hono

## Version targets (as of April 2026)

Always use latest stable unless noted. Lock major versions in package.json once the project stabilizes (~month 2).
