# Changelog — Lueur en public

## Jour 4 — 22 avril 2026
- API Lueur en ligne en local : Bun + Hono sur le port 3200 avec hot reload
- Auth anonyme fonctionnelle (on crée une session sans email, on la garde 30 jours)
- Lien magique par email prêt à partir (Resend, template français sobre et signé Lueur)
- Premier endpoint métier : enregistrer les corrections et interactions de l'utilisateur
- Spec OpenAPI auto-générée — le générateur de client mobile s'appuiera dessus en semaine 2

## Jour 3 — 21 avril 2026
- Schéma base de données complet, 9 tables pour le graphe de goût (ORM Drizzle, pgvector)
- Catalogue de démarrage : 20 duels curés et 50 objets de l'univers Lueur (chaises Wegner, APC, Margaret Howell, ryokan…)
- Tests de base qui vérifient que la migration et le seed tournent sans accroc
- Runtime Bun installé, CHANGELOG public démarré

## Jour 2 — 20 avril 2026
- Monorepo pnpm en place avec 6 workspaces (api, worker, mobile + 3 packages)
- TypeScript strict, CI GitHub Actions verte sur chaque push
- Documentation Cloudflare Tunnel pour tester l'app hors WiFi plus tard

## Jour 1 — 20 avril 2026
- Infrastructure Docker locale opérationnelle (Postgres + pgvector, Redis)
- Scripts pnpm pour orchestrer l'infra de dev
- Inventaire des limitations sécurité assumées en MVP

## Jour 0 — 19 avril 2026
- Décisions produit et stack verrouillées
- Repo public ouvert sous licence MIT
- Documentation produit complète (7 documents dans /docs)
