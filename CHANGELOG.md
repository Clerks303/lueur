# Changelog — Lueur en public

## Jour 7 — 25 avril 2026
- Scaffold de l'app mobile : Expo 55, écrans, icônes, palette Lueur appliquée à tous les composants
- Premier écran vivant : "Une app qui apprend ton goût." — tap sur le CTA crée une session anonyme avec le backend et ouvre l'écran suivant
- Le client API mobile se génère automatiquement depuis la spec OpenAPI ; toutes les routes sont déjà typées
- Session persistée dans le Keychain iOS / Keystore Android — tu rouvres l'app, tu es toujours connecté

## Jour 6 — 24 avril 2026
- Prompts versionnés : le prompt d'analyse photo vit dans son propre package, verrouillé avec schéma Zod strict et parser qui attrape les sorties malformées
- Worker en ligne : les photos uploadées passent automatiquement par Claude Opus 4.7 (vision) et ressortent avec une analyse structurée (palette, matières, ambiance, références)
- La boucle backend est complète — écran de capture → upload → analyse IA → graphe qui apprend
- Plus que le mobile à brancher (semaine 2)

## Jour 5 — 23 avril 2026
- Stockage objets en local avec MinIO : même API S3 que Scaleway en prod, swap via variables d'env
- L'app mobile peut demander une URL signée pour uploader une photo directement (sans passer par l'API)
- Endpoints `POST /photos/upload-url`, `POST /photos/:id/complete`, `GET /photos/:id` prêts pour les écrans 2 et 3
- Première file d'attente : les photos complétées atterrissent dans Redis, attendent que le worker les analyse (semaine prochaine)
- Le CI vérifie désormais que la spec OpenAPI committée est à jour à chaque push

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
