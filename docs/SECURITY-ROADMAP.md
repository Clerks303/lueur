# Lueur — Security Roadmap

> Living document. Anything we *chose not to do* for MVP speed reasons and must revisit before the beta opens lives here. Tick items as they land, keep the rationale so future-us understands the trade-off.

## Known limitations — MVP (week 1–2)

### Photos not encrypted client-side
- **Current**: photos upload to object storage (MinIO in dev, Scaleway in prod later) over HTTPS. The server can read the plaintext blob to feed it to Claude Opus 4.7.
- **Risk**: if a storage bucket leaks or a server is compromised, photos are readable.
- **Why deferred**: client-side E2E with libsodium adds ~2 days of work (key derivation, key rotation, mobile keystore integration, server re-encryption for vision calls) that would push the wow-moment demo past week 1.
- **Scheduled fix**: week 3–4 (`react-native-libsodium` on device, photos encrypted before upload, decryption happens in a short-lived worker context just before the Anthropic call, plaintext never persisted).

### HTTPS only in transit, not end-to-end
- **Current** (dev): API runs plain HTTP on localhost / LAN. No Caddy, no TLS.
- **Current** (prod, later): Caddy auto-HTTPS, but traffic inside the VPS between containers is plaintext.
- **Acceptable**: local dev over LAN, prod before any external user.
- **Scheduled review**: before external beta opens (week 3–4).

### CORS permissive in dev
- **Current**: API will be configured with `API_CORS_ORIGIN=*` in `.env.local`.
- **Scheduled fix**: prod build must pin to known origins (the mobile app doesn't use CORS at all; only an eventual web surface would).

### No rate limiting yet
- **Current**: all endpoints are unthrottled.
- **Scheduled fix**: before T04 (API scaffold) ships to tunnel-exposed environments, add a per-IP + per-user-session token bucket at the Hono layer. Redis is already available.

### Anonymous auth without device attestation
- **Current**: `POST /auth/anonymous` will create a throwaway user and return a session token held in `expo-secure-store`. Any client can call this endpoint.
- **Risk**: a bored attacker can spam anonymous account creation to bloat the DB.
- **Scheduled fix**: add `expo-app-attest` / Play Integrity in week 3 when we harden for external beta. Before that, a simple IP-based rate limit on `/auth/anonymous` is enough.

### No secrets manager yet
- **Current**: secrets live in a gitignored `.env.local` file on the developer's Mac. Never committed, never printed.
- **Scheduled fix**: when the VPS lands, move to systemd-managed env files with `chmod 600`, and consider `sops` + age keys for any secret we want to keep in the repo encrypted.

### Backup strategy not in place
- **Current** (dev): no backups. `pnpm dev:infra:reset` is an intentional nuke button.
- **Current** (prod, later): `pg_dump` nightly → Scaleway Object Storage (see `docs/05-ROADMAP-WEEK-1.md` reference; actual implementation deferred to the deployment roadmap).

### No audit log of sensitive operations
- **Current**: Postgres logs queries at default verbosity. We don't keep an application-level audit trail of "who read what photo, when".
- **Scheduled fix**: once the MCP server ships (v2), every agent read must emit an audit event the user can inspect in-app. Until MCP ships this is academic.

## Commitments that stay in place even for MVP

- **No hard-coded secrets.** Anywhere. Secrets flow only through env vars loaded from `.env.local` or from the host process environment.
- **Zod validation at every external boundary** (HTTP handler, queue job, third-party API response).
- **TypeScript strict, no `any`.** Type safety is a security property.
- **HTTPS-only for any endpoint reachable off-device** (Cloudflare Tunnel, TestFlight, prod VPS). Never serve HTTP from anywhere that leaves the Mac.
- **Principle of least privilege on DB roles.** The app connects with a role that cannot bypass ownership checks. No code path runs as superuser.
- **Every endpoint enforces ownership** (`session.userId === resource.userId`). See `docs/02-DATA-SCHEMA.md` §Access control strategy.

## Changelog

- `2026-04-19` — document created alongside T01 (local dev infra). MVP limitations inventoried.
