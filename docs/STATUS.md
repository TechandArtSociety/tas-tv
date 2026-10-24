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
- Deux onglets locaux ont affiché « Kayo explique — The Door » à 13:48, avec la boucle de secours active. La vidéo était prête (`readyState=4`) et en lecture (`paused=false`).
- Captures de l’antenne en lecture : [desktop 1440 × 900](screenshots/t0-desktop-1440.jpg) et [mobile 390 × 844](screenshots/t0-mobile-390.jpg).
- `git count-objects -vH` après amendement : 169,58 KiB. Les dix MP4 restent dans `media/` mais sont exclus de l’historique Git.
- Les droits de « Summer Breeze » et « Sunday Jams » sont déclarés OK par Lionel pour cette démo (toutes les vidéos TAS horizontales, 24/10/2026).

### Pas fait / limites

- Pas de clé OpenAI utilisée. Ingestion automatisée, transcodage, sous-titres, propositions générées et déploiement ne font pas partie de T0.

## T1 — studio, bibliothèque et publication

### Fait

- `/studio` protégé par `STUDIO_PASSWORD`, avec cookie de session signé, `httpOnly` et limité à 12 heures.
- Bibliothèque de 10 vidéos, affichage et édition des droits, formulaire d’ajout MP4 dans `media/uploads/` et ajout de lien YouTube.
- Éditeur de grille par jour de Paris : ajout, retrait et horaire des programmes, enregistrement du brouillon et publication. Les créneaux non autorisés, les chevauchements et le passage après minuit sont refusés côté serveur.
- `.env.local` contient le mot de passe de développement `tas-tv-dev` et reste ignoré par Git.

### Vérifié

- Sans session, `/api/studio/items` répond `401 Connexion requise.` ; connexion avec le mot de passe local ouvre le studio ; fermer la session revient à l’écran de connexion.
- Les 10 entrées apparaissent dans la bibliothèque. Les droits de « Summer Breeze » ont été changés puis remis à « Droits OK ».
- Grille du 24/10/2026 enregistrée puis publiée avec TAS MAG 001 à 19:00 et Kayo Birth à 19:01, heure de Paris ; l’API la retourne comme `published` avec deux créneaux.
- Deux onglets de l’antenne affichent « Kayo explique — Faux auditeurs » à 14:10 Paris en 1440 × 900 et 390 × 844 ; les deux vidéos lisent (`readyState=4`, `paused=false`) et la boucle de secours est active.
- Captures du studio : [desktop 1440 × 900](screenshots/t1-desktop-1440.jpg) et [mobile 390 × 844](screenshots/t1-mobile-390.jpg). Le document mobile ne déborde pas (390 px).
- `pnpm test` : 1 fichier, 5 tests réussis ; `pnpm typecheck` et `pnpm lint` réussis. Aucune erreur console observée sur l’antenne ou le studio.

### Pas fait / limites

- T2–T6 restent à faire : ingestion/transcription et sous-titres EN/FR, propositions et annonces de Kayo, publicités, chat et modération, pages publiques et relais de diffusion, puis pitch et mise en ligne.
- Aucune clé OpenAI utilisée ; upload MP4 réel non exercé dans l’interface.
