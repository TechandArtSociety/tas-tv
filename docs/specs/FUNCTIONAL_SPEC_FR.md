# TAS TV, la plateforme : cahier des charges fonctionnel (V0 du 24/10/2026)

Périmètre : le **prototype du hackathon** (rendu dim. 25/10 avant minuit) et ce qui passe en **V1 en novembre**. Architecture : `02_ARCHITECTURE.md`. Cahier technique : `04_CDC_TECHNIQUE.md`.

## 1. Le but

Allumer TAS TV, c'est tomber sur un programme choisi par des humains, sans avoir à choisir dans un flux infini. La chaîne fait découvrir des créateurs indépendants, les crédite et renvoie vers leur chaîne. Kayo, le présentateur IA de TAS, aide à programmer, sous-titre en deux langues et annonce les programmes, mais c'est un humain qui publie la grille.

## 2. Les rôles

| Rôle | Qui | Ce qu'il fait |
|---|---|---|
| Spectateur | tout le monde, sans compte | regarde l'antenne, voit la grille, active les sous-titres, suit le lien du créateur |
| Programmateur | Lionel (un seul compte au prototype) | gère la bibliothèque et les droits, lance l'analyse, construit et publie la grille |
| Créateur | invité par TAS | propose une vidéo et accepte la licence de diffusion |
| Kayo (IA) | API OpenAI | analyse, traduit, propose la grille, écrit et dit les annonces. **Ne publie rien.** |

## 3. Les parcours

1. **Le spectateur allume la chaîne :**
   - il ouvre la page et appuie sur « Allumer TAS TV » ;
   - le programme en cours démarre à la bonne minute, avec le son ;
   - il voit « À l'antenne : titre, créateur » et « Ensuite : titre, heure » ;
   - il active les sous-titres FR ou EN, puis ouvre la chaîne du créateur ;
  - sous l'antenne, il écrit dans le chat et demande à Kayo « @kayo c'est quel morceau ? » ;
  - entre deux programmes, il voit Kayo annoncer la suite, puis une pub maison (le MAG 001, par exemple).
2. **Le programmateur prépare la journée :**
   - il ajoute des vidéos (fichier ou lien YouTube) et coche « droits OK » ;
   - il lance l'analyse : Kayo rend la transcription, les sous-titres EN et FR, le résumé et les thèmes ;
   - il demande à Kayo de proposer la journée : Kayo renvoie une grille avec une raison par créneau ;
   - il déplace, retire ou ajoute des créneaux, puis publie : les annonces de Kayo sont générées et la grille passe à l'antenne.
3. **Le créateur propose une vidéo :**
   - il remplit le formulaire (nom, lien de la vidéo, lien de sa chaîne, deux lignes de présentation, langue) et coche la licence ;
   - la proposition arrive dans le studio, au statut « à étudier ».

## 4. Les fonctions

Priorité : **D** = doit être là au rendu du 25/10 · **S** = si le temps le permet · **V1** = novembre.

| # | Fonction | Priorité |
|---|---|---|
| F-01 | Antenne synchronisée : tous les spectateurs voient la même minute (écart toléré : 2 s) | D |
| F-02 | Bouton « Allumer TAS TV », lecture plein écran, bandeaux « À l'antenne » et « Ensuite » | D |
| F-03 | Crédit du créateur et lien vers sa chaîne, visibles pendant tout le programme | D |
| F-04 | Sous-titres EN et FR au choix | D |
| F-05 | Boucle de secours quand aucun créneau n'est publié (jamais d'écran noir) | D |
| F-06 | Bibliothèque : ajouter un fichier ou un lien YouTube, titre, créateur, langue, durée (lue automatiquement), statut des droits | D |
| F-07 | Analyse par Kayo : transcription, sous-titres, traduction, résumé, thèmes, ambiance | D |
| F-08 | Éditeur de grille : ajouter, déplacer ou retirer un créneau sur une journée | D |
| F-09 | « Kayo, propose la journée » : grille proposée, une raison par créneau, à valider | D |
| F-10 | Publication de la grille par le programmateur, et elle seule | D |
| F-11 | Annonces de Kayo entre deux programmes (texte à l'écran et voix, 10 à 15 s) | D |
| F-12 | Page « Grille » : aujourd'hui et demain, à l'heure de Paris | S |
| F-13 | Formulaire « Proposer une vidéo » avec acceptation de la licence ; filtrage du texte par modération | S |
| F-14 | Page mobile propre (antenne et grille) | S |
| F-15 | Journal des appels IA : modèle, jetons, coût estimé, plafond mensuel | D |
| F-21 | **Chat en direct sous l'antenne** : pseudo libre, messages filtrés par la modération d'OpenAI avant affichage, un message toutes les 5 s au plus par personne | D |
| F-22 | **Kayo dans le chat** : « @kayo qui est cet artiste ? » → réponse tirée uniquement de la fiche du programme en cours (R-08) | D |
| F-23 | **Pages de pub entre les programmes** : pubs maison (MAG 001, TASK, TAS Studio, Out of Office), un emplacement « partenaire » vide, toutes les N vidéos ou toutes les X minutes, réglable dans le studio | D |
| F-24 | **Relais de distribution** : la même grille en direct sur YouTube, TikTok, Twitch et d'autres réseaux. Piste préférée de Lionel : Upstream (jusqu'à 10 destinations). TikTok n'est pas dans la liste d'Upstream : il faut passer par une clé RTMP TikTok, réservée à certains comptes, à vérifier | V1 |
| F-25 | Carton « À l'antenne » animé à chaque début de programme (titre, créateur, crédits) | D |
| F-16 | Flux HLS unique pour les applis TV et les distributeurs FAST | V1 |
| F-17 | Comptes créateurs, registre des droits complet, contrats | V1 |
| F-18 | Mesure : spectateurs, durée, retour à J+7 ; rappels opt-in | V1 |
| F-19 | Plusieurs chaînes ou plusieurs blocs thématiques | V1 |
| F-20 | Créneaux sponsorisés | V1 |

## 5. Les règles

- **R-01** Seule une vidéo au statut « droits OK » peut entrer dans une grille. Kayo ne voit que celles-là.
- **R-02** Deux créneaux ne se chevauchent jamais (règle garantie par la base).
- **R-03** Kayo propose, le programmateur publie ; la proposition est gardée telle quelle dans le journal.
- **R-04** Pas deux programmes du même créateur d'affilée (Kayo le respecte ; le programmateur peut passer outre).
- **R-05** Le crédit et le lien du créateur ne peuvent pas être masqués.
- **R-06** Heures affichées à l'heure de Paris. Le dimanche 25/10 dure 25 heures (passage à l'heure d'hiver à 3 h) : la grille de ce jour en tient compte.
- **R-07** Une vidéo YouTube passe dans le lecteur officiel de YouTube, sans téléchargement, et seulement si le créateur a donné son accord. Règles de YouTube (pages mises à jour le 15/10/2026, voir `01_RECHERCHE_PLATEFORMES_24-7.md` §5) :
  - **rien par-dessus son lecteur** : bandeaux, crédit et annonces se placent à côté ;
  - un seul lecteur YouTube en lecture automatique par page, visible à plus de 50 % ;
  - aucune publicité vendue ni accès payant autour de ce lecteur ;
  - vérifier pour chaque vidéo qu'elle est intégrable et son statut « Made for Kids ».
- **R-08** Les annonces de Kayo ne donnent aucun chiffre ni aucun fait qui ne vient pas de la fiche de la vidéo.
- **R-09** Musique : une vidéo qui contient la musique d'autres artistes reste « à vérifier » par défaut, sauf déclaration contraire de Lionel. Le 24/10, Lionel déclare avoir les droits de diffusion des épisodes « Les Disques de mon père », puis, le même jour, de **toutes les vidéos TAS horizontales** du catalogue (Summer Breeze, Sunday Jams, Out of Office, etc.) : elles passent en « droits OK » pour la démo, avec cette mention dans `rights_note`. Les versions verticales ne passent pas à l'antenne.
- **R-10** Les pubs passent seulement entre deux programmes hébergés par TAS, jamais autour d'une vidéo YouTube (R-07). Au prototype, ce sont des pubs maison : aucun sponsor inventé.
- **R-11** Chat : aucun message n'est affiché sans être passé par la modération. Le programmateur peut masquer un message ou bloquer un pseudo depuis le studio.

## 6. Le catalogue de la démo

- **Programmes** (droits TAS ou déclarés par Lionel) :
  - « Les Disques de mon père » (EP02 et la saison d'octobre) ;
  - Out of Office, Design Week (projection et séquences live) ;
  - Summer Breeze ;
  - Sunday Jams ;
  - Station F × Tellers ;
  - TAS Was There ;
  - les épisodes « Kayo explique » ;
  - les dix contes « Kayo raconte » (EN et FR) ;
  - Kayo e-motion ;
  - Africa Creative Futures et Medesse, si les droits sont confirmés.
- **Pubs maison** : le teaser du MAG 001, la démo TASK, le teaser « Do you? », Kayo Birth.
- **Des créateurs** : 2 ou 3 vidéos YouTube de créateurs du MAG 001, **seulement après leur accord écrit**. C'est Lionel qui leur écrit ; je peux préparer le message.

## 7. La démo qui valide le prototype (critères d'acceptation)

1. Deux navigateurs ouverts en même temps montrent la même scène, à 2 s près.
2. Dans le studio, ajouter une vidéo, la faire analyser, puis voir ses sous-titres FR à l'antenne.
3. « Kayo, propose la journée » rend une grille valide (aucun chevauchement, uniquement des vidéos « droits OK », une raison par créneau).
4. Après publication, entre deux programmes, Kayo annonce le suivant de sa voix.
5. Grille vide : la boucle de secours passe, sans écran noir.
6. Le journal montre chaque appel IA et son coût estimé.
7. Un message écrit dans le chat d'un navigateur apparaît dans l'autre en moins de 3 s. Un message injurieux est bloqué. « @kayo » reçoit une réponse fondée sur la fiche du programme en cours.
8. Une pub maison passe après le nombre de programmes réglé dans le studio, jamais autour d'une vidéo YouTube.

## 8. Avant la V1 publique (points à vérifier, pas un avis juridique)

- Une licence écrite de chaque créateur.
- Une déclaration à l'Arcom pour un service linéaire. Une convention devient obligatoire au-delà de 150 000 € de chiffre d'affaires annuel.
- La SACEM, qui n'a pas de barème web TV publié : il faut la contacter. Les droits voisins (SCPP, SPPF) sont aussi à confirmer.

Sources : `01_RECHERCHE_PLATEFORMES_24-7.md` §6.

## 9. Hors périmètre du prototype

Applis TV, flux HLS, publicité vendue à des tiers, paiements, comptes spectateurs, plusieurs chaînes, contrats signés.

## 10. Questions pour Lionel

1. Le nom à l'écran : « TAS TV » ou « Tech & Art TV » (ancien nom dans tes notes de 2025) ?
2. La voix de Kayo pour le hackathon : une voix d'OpenAI (outil nommé dans le pitch) ou la voix ElevenLabs habituelle ?
3. Quels 2 ou 3 créateurs du MAG 001 solliciter pour l'accord ?
4. Mettre en ligne dimanche (lien public pour les juges, une adresse du type `tv.techandartsociety.com`) ou montrer seulement en local ? **Décision du 24/10 :** l'objectif de dimanche est une version qui fonctionne sur notre propre antenne ; YouTube, TikTok et les autres réseaux viendront ensuite, en relais de distribution (F-24, V1). La mise en ligne du site reste un plus si le temps le permet. Les clés et les comptes restent ton geste.
5. Le direct sur YouTube : vérifié le 24/10 dans YouTube Studio (Paramètres → Chaîne → Accès aux fonctionnalités), les « fonctionnalités intermédiaires », dont le streaming en direct, sont **activées**. Rien n'est à lancer avant la V1.
