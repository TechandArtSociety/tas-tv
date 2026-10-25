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

## Nuit du 24 au 25/10 — suite par Claude (Codex à court de crédits après T1)

Commits `6170f0e` et suivants. Codex a construit T0 et T1 ; Claude a fait la suite à la demande de Lionel.

### Fait

- **Catalogue** : 12 vidéos TAS horizontales (9 programmes, 3 pubs maison), droits OK déclarés par Lionel le 24/10 ; les verticales sont retirées. `pnpm media:link` remplace la copie par des liens vers les originaux (1,2 Go de disque rendus). Fiches (résumé, thèmes, ambiance) dans `db/demo-media.json`, reprises en base à chaque démarrage.
- **Kayo programme la journée** (`/api/studio/grid/[day]/propose`, bouton du studio) : quatre tranches (nuit, matin, après-midi, soirée), une raison par tranche, la journée entière posée bout à bout de minuit à minuit (le dimanche 25/10 fait 25 h), une annonce de Kayo de 8 s avant chaque programme, une pub maison tous les 3 programmes. Avec `OPENAI_API_KEY` : Responses API + Structured Outputs (`lib/kayo.ts`, `lib/openai.ts`, journal dans `ai_runs`). Sans clé : règles fondées sur les fiches.
- **Annonces de Kayo** à l'antenne : carte de Kayo détouré « Up next … », audio optionnel `media/kayo/<vidéo>.mp3` s'il existe ; l'antenne change de créneau à la seconde près (minuterie sur la fin du créneau) et précharge le programme annoncé.
- **Pubs maison** : bandeau « PUB · TAS » à l'antenne, jamais autour d'une vidéo YouTube.
- **Chat en direct** sous l'antenne (`/api/chat`) : pseudo, 1 message toutes les 5 s, modération avant insertion (OpenAI Moderation avec clé, petite liste locale sans), « @kayo » répond à partir de la fiche du programme en cours (Responses API avec clé, fiche brute sans).
- **Studio** : bouton « Kayo, propose la journée », raisons affichées, lignes d'annonces gardées à l'enregistrement, liste des créneaux défilante.
- **Grilles publiées** : dimanche 25/10 et lundi 26/10 (jour de la finale), par règles.

### Vérifié

- `pnpm test` : 2 fichiers, 7 tests (dont la journée de 25 h posée bout à bout, annonces et pubs, pas deux fois le même créateur d'affilée) ; `pnpm typecheck` et `pnpm lint` réussis.
- Antenne vue dans le navigateur : programme en lecture, carte de Kayo entre Summer Breeze et Out of Office, aucune erreur console.
- Chat : message accepté, insulte refusée par la liste locale, deuxième message en moins de 5 s refusé, réponse de Kayo à « @kayo ».
- Prises d'écran réelles pour la vidéo : `../video/clips/`.

### Pas fait / limites

- **Aucun appel OpenAI réel** : pas de clé dans `.env.local` cette nuit. Le code des appels (Responses + Structured Outputs, Moderation) est écrit d'après l'API REST, mais n'a pas tourné : à vérifier dès que Lionel colle la clé (« Kayo, propose la journée » doit afficher « API OpenAI » dans la source).
- **Voix des annonces** : non générée (le modèle de voix local était trop lent, Mac saturé en mémoire ; ElevenLabs demande des téléchargements, que Lionel doit autoriser). Les annonces passent en carte muette.
- T2 (transcription et sous-titres EN/FR), page Grille publique, formulaire créateur, masquage d'un message du chat depuis le studio, relais vers les réseaux, mise en ligne : non faits.
