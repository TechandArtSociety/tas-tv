# État de TAS TV

## T0 — antenne et base locale

### Fait

- Initialisation Git, Next.js 16 avec TypeScript et pnpm (`pnpm-lock.yaml` présent). Next est en 16.4.3.
- PostgreSQL local lancé par `embedded-postgres`; données persistantes dans `.data/postgres` (ignoré par Git). Le démarrage applique `db/schema.sql` et enregistre les démos depuis `db/demo-media.json`.
- Schéma demandé au §2 du cahier technique : `creators`, `items`, `grids`, `slots` (exclusion des chevauchements), `submissions`, `chat_messages`, `settings` et `ai_runs`.
- Dix vidéos de démonstration copiées dans `media/`, toutes en 1080p. `pnpm media:copy` les recopie depuis le manifeste sans déplacer les originaux ; les SHA-256 des copies initiales ont été comparés aux sources. Le catalogue représente 17 min 28 s.
- `/api/now`, sélection du créneau selon l’heure serveur, boucle de secours et lecture alignée après « Allumer TAS TV ».
- `test/locate.test.ts` couvre le créneau courant, les limites, les trous avec secours, la journée de 25 heures à Paris et une bibliothèque vide.

### Vérifié

- `pnpm test` : 1 fichier, 5 tests réussis.
- `pnpm typecheck` : réussi.
- `pnpm lint` : réussi.
- Deux onglets locaux ont affiché « Kayo explique — Faux auditeurs » à 13:47, avec la boucle de secours active. La vidéo était prête (`readyState=4`) et en lecture (`paused=false`).
- Captures de l’antenne en lecture : [desktop 1440 × 900](screenshots/t0-desktop-1440.jpg) et [mobile 390 × 844](screenshots/t0-mobile-390.jpg).

### Pas fait / limites

- T1 (studio, bibliothèque, grille éditable et publication) reste à construire.
- Les droits de « Summer Breeze » et « Sunday Jams » sont déclarés OK par Lionel pour cette démo (toutes les vidéos TAS horizontales, 24/10/2026).
- Pas de clé OpenAI utilisée. Ingestion automatisée, transcodage, sous-titres, propositions générées et déploiement ne font pas partie de T0.
