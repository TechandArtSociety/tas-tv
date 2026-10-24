# Brief de développement : TAS TV au DevDay Hackathon (pour Codex)

Décision de Lionel du 24/10 : le développement se fait **avec les outils d'OpenAI (Codex)**, dès que les crédits du hackathon arrivent. Ce fichier est le brief de Codex pour ce dépôt : il est relu à chaque session. Les chemins ci-dessous partent de la racine `TAS CLAUDE` (trois dossiers au-dessus de celui-ci : `../../../`). Les consignes du `AGENTS.md` racine de `TAS CLAUDE` (quota annoncé en français, etc.) restent valables.

## La mission

Construire le prototype de **TAS TV** : une chaîne 24/7 dans le navigateur, où une grille programmée par des humains, avec l'aide de Kayo (le présentateur IA de TAS, sur l'API OpenAI), fait passer des vidéos de créateurs que tout le monde voit à la même minute. Entre les programmes passent les annonces de Kayo et des pubs maison ; sous l'antenne, un chat en direct où Kayo répond. Objectif de Lionel pour dimanche : **une version qui fonctionne, sur notre propre antenne** (en local ou en ligne). YouTube, TikTok et les autres réseaux seront des relais de distribution plus tard (V1, piste Upstream). Lionel : « on est en mode démo, ne te mets pas de limite ».

**Rendu :** dimanche 25/10 avant 22 h (la date limite officielle est minuit, heure de Paris), avec une vidéo de pitch de 2 minutes.

## À lire d'abord (dans cet ordre)

1. `08_MEDIA_STUDIO/TAS_TV_PLATEFORME_2026-10-24/03_CDC_FONCTIONNEL.md` : les fonctions F-xx, les règles R-xx, les critères d'acceptation (§7).
2. `08_MEDIA_STUDIO/TAS_TV_PLATEFORME_2026-10-24/04_CDC_TECHNIQUE.md` : la pile, la base, l'API, l'ordre des tranches T0 à T6.
3. `08_MEDIA_STUDIO/TAS_TV_PLATEFORME_2026-10-24/02_ARCHITECTURE.md` : les choix D1 à D10.
4. `08_MEDIA_STUDIO/TAS_TV_PLATEFORME_2026-10-24/01_RECHERCHE_PLATEFORMES_24-7.md` : ce qui existe et les règles de YouTube.
5. `10_BIZDEV/DEVDAY_OPENAI_2026-10-24/00_POINT_KICKOFF_ET_PLAN.md` : les règles du hackathon (être honnête sur ce qui a été fait, nommer les outils OpenAI, tracks).

## Comment travailler

- **Le dépôt :** dépôt neuf `08_MEDIA_STUDIO/TAS_TV_PLATEFORME_2026-10-24/tas-tv/`, `git init` au premier commit. Ne toucher ni à TASK (`09_PRODUIT_TASK/`), ni au site, ni à `TAS GPT/`.
- **Les tranches :** dans l'ordre, T0 → T6. Chacune se termine par un commit, une mise à jour de `docs/STATUS.md` (fait / vérifié / pas fait, preuve à l'appui) et une capture d'écran. T0 et T1 se font sans clé OpenAI.
- **Le principe :** le plus simple qui marche. Pas d'abstraction sans deuxième usage, et le seul test obligatoire est `test/locate.test.ts`.
- **Vérifier en vrai :**
  - deux onglets de l'antenne côte à côte, même minute ;
  - captures desktop 1440 et mobile 390 ;
  - aucune erreur dans la console.
- **Les modèles OpenAI :** lire la documentation officielle avant d'écrire les appels (noms de modèles, Structured Outputs, limite de taille de la transcription, voix de la synthèse vocale, Moderation).
- **Les contraintes de la machine :** Node 26, pnpm 10, ni Docker, ni Homebrew, ni ffmpeg. Utiliser `ffmpeg-static` et `embedded-postgres` depuis npm.

## Le catalogue de démo

- « Les Disques de mon père » (`00_VIDEOS_FINALES/LES_DISQUES_DE_MON_PERE_EP02`, `LDDMP_SAISON_2026-10_A_VALIDER`) : droits déclarés par Lionel le 24/10 (R-09).
- Out of Office : `08_MEDIA_STUDIO/PROJECTIONS_OOO_DESIGN_WEEK_2026-09-18/MONTAGE_V1/` (masters et séquences).
- `00_VIDEOS_FINALES/` : SUMMER_BREEZE, SEQUENCE_SUNDAY_JAMS, KAYO, KAYO_BIRTH.
- Les épisodes « Kayo explique » et les contes « Kayo raconte » : `08_MEDIA_STUDIO/KAYO_EXPLAINER/episodes/` et `contes/`.
- Station F × Tellers, TAS Was There, Kayo e-motion : leurs dossiers dans `08_MEDIA_STUDIO/`.
- Pubs maison : `08_MEDIA_STUDIO/TEASER_MAG_001/`, `TASK_DEMO_V3_2026-10-15/`, `TEASER_TAS_2026-10-15/`, `KAYO_BIRTH_TEASER/`.
- Prendre la version finale de chaque dossier, horizontale de préférence. Copier, ne jamais déplacer les originaux.

## Ce qui revient à Lionel (rien de tout ça ne se fait sans lui)

- **Les clés :** il colle lui-même la clé OpenAI (crédits du hackathon) et, en cas de mise en ligne, les accès AWS et la base, dans `.env.local` ou dans Vercel. Ne jamais lui demander une clé dans une conversation.
- **La mise en ligne** (Vercel, Neon, S3, domaine), seulement si le temps le permet. C'est lui qui crée les comptes.
- **Les messages aux créateurs** pour leur accord : préparer les brouillons, c'est lui qui les envoie.
- **Les posts Build in public :** les préparer en FR et en EN, avec les tags @borvibe et @openaidevs et le hashtag #parisdevdayhack ; c'est lui qui les publie. Trois posts :
  - samedi soir : « la chaîne est à l'antenne », avec une capture ;
  - dimanche après-midi : Kayo programme la journée, une courte vidéo d'écran ;
  - lundi : la finale.
- **La vidéo de pitch :**
  - un script de 2 minutes, à lui faire valider ;
  - sa prise face caméra, de 15 à 20 s ;
  - le montage, avec de vraies prises d'écran.
- **L'envoi du formulaire de rendu.**

## Le pitch (fil proposé, à valider)

1. **L'accroche :** « Turn it on, don't choose. »
2. **Le problème :** les créateurs indépendants se perdent dans le flux, et il n'y a plus de moment partagé.
3. **La démo :**
   - on allume la chaîne, puis on active les sous-titres FR ;
   - on demande « @kayo » dans le chat ;
   - Kayo propose la journée, un humain la publie ;
   - Kayo annonce le programme suivant, puis passe une pub maison.
4. **Les outils OpenAI nommés :** Codex (pour le développement), Speech-to-text, Responses API avec Structured Outputs, Text-to-speech, Moderation.
5. **L'impact :** de l'antenne et deux langues pour des créateurs indépendants, crédités et renvoyés vers leur chaîne.
6. **Ce qui a été fait ce week-end :** tout le dépôt est neuf. La suite, en novembre : relais vers YouTube et TikTok, flux HLS, applis TV.

## C'est fini quand

- les huit critères du §7 de `03_CDC_FONCTIONNEL.md` passent, preuves dans `docs/STATUS.md` ;
- la vidéo de pitch de 2 minutes est validée par Lionel ;
- le formulaire de rendu est envoyé par Lionel avant 22 h dimanche.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
