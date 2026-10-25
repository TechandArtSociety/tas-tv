# TAS TV, la plateforme : cahier des charges technique (V0 du 24/10/2026)

À lire avec `02_ARCHITECTURE.md` (les choix D1 à D8) et `03_CDC_FONCTIONNEL.md` (les fonctions F-xx et les règles R-xx).

## 1. Dépôt et pile

- **Dépôt neuf** `tas-tv`, dans `08_MEDIA_STUDIO/TAS_TV_PLATEFORME_2026-10-24/tas-tv/`, git initialisé au premier commit du samedi. Pour les juges, l'historique montre que tout date du week-end.
- **Une seule application** Next.js 16 (App Router), TypeScript, pnpm. Pas de monorepo : un seul paquet suffit.
- **Postgres :**
  - en local, `embedded-postgres` (npm), comme TASK, parce qu'il n'y a ni Docker ni Homebrew sur le Mac ;
  - en ligne, Neon via l'intégration Vercel ;
  - SQL écrit à la main avec le client `postgres`, sans ORM.
- **Stockage :**
  - en local, `media/` servi par l'application ;
  - en ligne, S3 (eu-west-3) avec CloudFront, payé par les crédits AWS ;
  - envoi des fichiers par un script, `pnpm media:push`, pas par le navigateur.
- **Audio :** `ffmpeg-static` (npm) pour extraire la piste son avant la transcription. Il n'y a pas de ffmpeg sur le Mac.
- **IA :** le SDK officiel `openai`, avec les modèles en variables d'environnement.
- **Tests :** `vitest`, un seul fichier pour la logique qui compte (synchronisation et validation de grille).
- **Contraintes de la machine** (voir TASK) : Node 26, pnpm 10, pas de Docker ni de Homebrew, `timeout` absent (utiliser `perl -e 'alarm N; exec @ARGV'`).

## 2. Les données

```sql
create extension if not exists btree_gist;

create table creators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel_url text,            -- lien toujours affiché (R-05)
  lang text,
  consent_at timestamptz       -- accord écrit reçu
);

create table items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('file','youtube')),
  src text not null,           -- URL du fichier ou ID YouTube
  title text not null,
  creator_id uuid not null references creators,
  duration_s int not null check (duration_s > 0),
  lang text not null,
  rights text not null default 'pending' check (rights in ('cleared','pending','refused')),
  rights_note text,
  subtitles jsonb not null default '{}',   -- {"en": url, "fr": url}
  summary text, tags text[] not null default '{}', mood text,
  ingest_status text not null default 'todo' check (ingest_status in ('todo','running','done','failed')),
  created_at timestamptz not null default now()
);

create table grids (
  day date primary key,        -- jour à l'heure de Paris
  status text not null default 'draft' check (status in ('draft','published')),
  proposal jsonb,              -- la proposition brute de Kayo (R-03)
  published_at timestamptz
);

create table slots (
  id uuid primary key default gen_random_uuid(),
  day date not null references grids on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  kind text not null check (kind in ('item','bumper')),
  item_id uuid references items,
  bumper_text text, bumper_audio text,
  reason text,                 -- la raison donnée par Kayo
  check ((kind = 'item') = (item_id is not null)),
  exclude using gist (tstzrange(starts_at, ends_at) with &&)   -- R-02, une seule chaîne au prototype
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null, video_url text not null, channel_url text,
  pitch text, lang text, licence_accepted boolean not null check (licence_accepted),
  flagged boolean not null default false, status text not null default 'new',
  created_at timestamptz not null default now()
);

create table chat_messages (
  id bigserial primary key,
  nick text not null check (length(nick) between 2 and 24),
  body text not null check (length(body) between 1 and 300),
  by_kayo boolean not null default false,
  hidden boolean not null default false,   -- modération ou programmateur (R-11)
  created_at timestamptz not null default now()
);

create table settings (                    -- une ligne : réglages des pubs (F-23)
  id int primary key default 1 check (id = 1),
  ad_every_n_items int not null default 2,
  ad_item_ids uuid[] not null default '{}'  -- items marqués « pub maison »
);

create table ai_runs (
  id bigserial primary key, step text not null, model text not null, prompt_version text not null,
  input_hash text not null, tokens_in int, tokens_out int, cost_usd numeric(10,4),
  ok boolean not null, error text, created_at timestamptz not null default now()
);
```

- **R-01 (droits OK)** est vérifiée à la publication, dans une seule fonction `publishGrid(day)`, et Kayo ne reçoit que des items `cleared`.
- **R-02 (chevauchements)** est garantie par la base. Quand il y aura plusieurs chaînes, ajouter `channel_id with =` à la contrainte.

## 3. L'API

| Route | Accès | Rôle |
|---|---|---|
| `GET /api/now` | public | `{serverNow, slots: [...]}` : créneau en cours et 3 suivants, grille publiée seulement, cache de 5 s |
| `GET /api/grid?day=YYYY-MM-DD` | public | grille publiée du jour |
| `POST /api/submissions` | public, limité (taille, 5 par heure et par IP) | proposition de créateur, modération du texte |
| `GET /api/chat?after=<id>` | public | messages visibles plus récents que `id` (le navigateur appelle toutes les 2 s) |
| `POST /api/chat` | public, 1 message toutes les 5 s par IP | modération avant insertion ; si le texte contient « @kayo », réponse de Kayo insérée juste après (`by_kayo`) |
| `PATCH /api/studio/chat/:id` | studio | masquer un message |
| `POST /api/studio/login` | public | mot de passe → cookie signé httpOnly (`STUDIO_PASSWORD`, `SESSION_SECRET`) |
| `GET/POST/PATCH /api/studio/items` | studio | bibliothèque, droits |
| `POST /api/studio/grid/:day/propose` | studio | Kayo propose (Structured Outputs) → `grids.proposal` + créneaux en brouillon |
| `PUT /api/studio/grid/:day` | studio | enregistrer les créneaux modifiés |
| `POST /api/studio/grid/:day/publish` | studio | vérifie R-01, génère les annonces (texte + voix), publie |

L'analyse d'une vidéo n'est pas une route au prototype : c'est `pnpm ingest <itemId|--all>` (D8).

## 4. La synchronisation (cœur à tester)

- Une fonction pure `locate(slots, now) → {slot, offsetS} | null` et une fonction `fallback(now)` qui choisit le clip de secours et son décalage, calculés modulo la durée de la boucle.
- **Côté client :**
  - `t0 = performance.now()` à la réponse de `/api/now` ;
  - heure corrigée = `serverNow + (performance.now() − t0)` ;
  - pour un fichier, `video.currentTime = offsetS` ; pour YouTube, `loadVideoById({videoId, startSeconds})` via l'API IFrame ;
  - un fichier suivant est préchargé 10 s avant la fin. Une vidéo YouTube, elle, ne se précharge pas dans un lecteur caché (un seul lecteur YouTube actif par page) : elle se charge au moment du changement ;
  - pour une vidéo YouTube, aucun bandeau ni carton par-dessus le lecteur : tout l'habillage se place à côté (R-07) ;
  - toutes les 60 s, recalage si l'écart dépasse 2 s.
- **Les navigateurs bloquent le son en lecture automatique :** l'antenne démarre sur le bouton « Allumer TAS TV », dont le clic autorise le son.
- **Le test** `test/locate.test.ts` couvre :
  - un instant au milieu d'un créneau ;
  - la frontière entre deux créneaux ;
  - un trou dans la grille, qui doit renvoyer la boucle de secours ;
  - le dimanche 25/10 et ses 25 heures ;
  - une grille vide.
  Il doit échouer si la logique casse.

## 5. L'analyse d'une vidéo (`pnpm ingest`)

1. Extraire l'audio (mono, débit faible) avec `ffmpeg-static`. Vérifier dans la documentation la taille maximale d'un fichier envoyé à la transcription, et découper si besoin.
2. **Transcription** horodatée (Speech-to-text) → WebVTT dans la langue d'origine.
3. **Traduction** des segments vers l'autre langue (Responses API, sortie JSON qui garde les horodatages) → second WebVTT.
4. **Fiche** (Responses API + Structured Outputs) : `summary`, `tags`, `mood`, `audience`, `best_time_of_day`.
5. Écrire les fichiers (local ou S3), mettre à jour `items`, journaliser chaque appel dans `ai_runs`.

- Pour une vidéo YouTube : pas de téléchargement (R-07). La fiche se remplit à la main ou à partir des sous-titres publics, si les conditions de YouTube le permettent (voir la recherche).

## 6. Kayo programmateur et présentateur

- **Proposition** (`prompt_version = "grid-v1"`) :
  - **ce que reçoit Kayo :** la liste des items `cleared` (id, durée, langue, résumé, thèmes, ambiance, créateur), le jour, la plage horaire et les règles R-04 et R-06 ;
  - **ce qu'il rend :** `[{item_id, starts_at, reason}]` selon un schéma JSON strict ;
  - **ce que le serveur vérifie avant d'écrire :** ids connus, durées, aucun chevauchement, R-04. En cas d'erreur, une seule nouvelle tentative, avec l'erreur.
- **Blocs de la journée** (V0, à valider par Lionel) :
  - matin : contes et musique ;
  - après-midi : « Kayo explique » et films courts ;
  - soirée : films et conversations ;
  - nuit : boucle douce.
- **Annonces** (`bumper-v1`), générées à la publication pour chaque transition :
  - un texte de 25 mots au plus, uniquement à partir des fiches (R-08) ;
  - la voix par Text-to-speech ;
  - un fichier audio par annonce ;
  - un créneau `bumper` de la durée de l'audio, avec un carton à l'écran.
- **Pubs maison** (F-23) : à la publication, `publishGrid` insère un créneau `bumper` de pub (un item de `ad_item_ids`, à tour de rôle) tous les `ad_every_n_items` programmes, après l'annonce de Kayo. Ces pubs ne se placent jamais à côté d'un item YouTube (R-10).
- **Kayo dans le chat** (F-22) : le prompt `chat-v1` reçoit la fiche du programme en cours et la question ; la réponse fait 40 mots au plus, et si la fiche ne contient pas la réponse, Kayo le dit. Il y a une limite de réponses par minute.
- **Budget :** `AI_MONTHLY_BUDGET_USD` (par défaut 50). Au-delà, les appels sont refusés proprement.

## 6 bis. Relais de distribution (F-24, V1 : rien à coder ce week-end)

Ce qui est prévu pour la V1 :
- **Piste A, Upstream** (préférée par Lionel) :
  - envoyer nos fichiers dans l'ordre de la grille, avec les annonces et les pubs rendues en petites vidéos, sur sa playlist ;
  - ou, à vérifier, lui envoyer notre flux s'il accepte une entrée RTMP ;
  - jusqu'à 10 destinations ; TikTok passe par une clé RTMP TikTok, à vérifier.
- **Piste B, notre relais** :
  - un script lit la grille et écrit une liste `ffconcat`, où le premier fichier démarre au bon décalage (`inpoint`) ;
  - un `ffmpeg -re` réencode en 1080p30, H.264 + AAC, et envoie en RTMP ;
  - il tourne sur un petit serveur AWS payé par les crédits.
- **Dans les deux cas :**
  - les vidéos YouTube intégrées n'entrent pas dans le relais (R-07) ;
  - les clés de flux sont collées par Lionel.
- **Ce que le prototype prépare déjà :** des annonces et des pubs gardées comme fichiers séparés, donc réutilisables par un relais.

## 7. Sécurité

- **Les clés** (`OPENAI_API_KEY`, accès AWS, base) restent dans `.env.local` en local, et dans les variables Vercel en ligne. C'est Lionel qui les colle, jamais dans le chat. Le fichier `.env.example` liste les noms sans les valeurs.
- **Le studio :**
  - cookie signé, `httpOnly`, `secure`, `sameSite=lax` ;
  - mot de passe comparé en temps constant ;
  - toutes les routes `/api/studio/*` vérifient le cookie.
- **Les entrées publiques :** formulaire validé (longueurs, URL en `https`), limité par IP, texte passé à la modération.
- **Aucune donnée personnelle de spectateur** au prototype.

## 8. Mise en ligne (dimanche, sur le « oui » de Lionel)

Les étapes que Lionel fait lui-même :
1. **Vercel :** un nouveau projet relié au dépôt ; ajouter Neon (Postgres) depuis la Marketplace.
2. **AWS :** un utilisateur IAM limité à un bucket `tas-tv-media` (droit d'écriture), sa clé d'accès collée dans les variables Vercel, et une distribution CloudFront.
3. **OpenAI :** la clé API des crédits du hackathon.
4. **Le domaine** `tv.techandartsociety.com`, si le DNS le permet (sinon l'adresse `*.vercel.app`).

**Coût attendu ce week-end :**
- OpenAI : moins de 20 $ (une trentaine de vidéos analysées, quelques grilles, une centaine d'annonces), à mesurer dans `ai_runs` ;
- AWS : quelques dollars pris sur les crédits ;
- Vercel et Neon : offres gratuites.

## 9. L'ordre de construction (tranches verticales)

| Tranche | Contenu | Prête quand |
|---|---|---|
| T0 | dépôt, base, données de démo (10 vidéos TAS locales), `/api/now`, antenne synchronisée, boucle de secours, test `locate` | deux navigateurs montrent la même minute |
| T1 | studio : connexion, bibliothèque, éditeur de grille, publication | une grille faite à la main passe à l'antenne |
| T2 | `pnpm ingest` : transcription, sous-titres EN et FR, fiche | les sous-titres FR s'affichent à l'antenne |
| T3 | « Kayo, propose la journée » + annonces vocales + pubs maison | critères 1 à 6 et 8 du §7 du cahier fonctionnel |
| T4 | chat en direct, modération, « @kayo » | critère 7 du §7 |
| T5 | page Grille, formulaire créateur, mobile | sur téléphone, sans débordement |
| T6 | prises d'écran, vidéo de pitch de 2 min, mise en ligne si le temps le permet | formulaire de rendu envoyé avant 22 h |

Après chaque tranche : commit, mise à jour de `docs/STATUS.md` (fait, vérifié, pas fait) et capture d'écran. Les tranches T0 et T1 se font sans clé OpenAI.
