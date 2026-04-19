# lueur

> Une app qui apprend ton goût. Et s'en souvient.

**Lueur** is a mobile app (iOS + Android, React Native) that learns a user's aesthetic taste across domains — interior, clothing, food, music, travel — through photos of things they already love and daily 30-second *duels*. The result is a structured, explainable, user-owned **taste graph** that AI agents can later query with permission.

Built in public, solo, from Laval (France).

## Status

Week 1 — infrastructure and onboarding wow moment. See `docs/05-ROADMAP-WEEK-1.md`.

## Stack

Mobile: Expo / React Native / TypeScript. Backend: Bun + Hono. DB: PostgreSQL + pgvector. AI: Anthropic Claude + OpenAI embeddings. Infra: self-hosted on OVH, Docker + Caddy.

See `docs/01-STACK.md` for the locked decisions.

## Docs

Product and engineering context lives in `docs/`. Start with `docs/CTO-KICKOFF.md`.

## License

MIT — see [LICENSE](./LICENSE).
