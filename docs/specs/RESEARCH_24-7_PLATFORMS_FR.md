# TAS TV : recherche sur les plateformes de chaînes 24/7 (24/10/2026)

Recherche web en lecture seule, faite par Claude (Opus 5.5) le samedi 24/10/2026 pour le prototype du hackathon OpenAI (24-25/10) et la V1 de novembre.

**Comment lire les sources.** Chaque fait porte une étiquette cliquable :
- **[V·24/10]** : vérifié sur la page officielle, chargée le 24/10/2026.
- **[T·24/10]** : vu dans un article ou sur une page tierce, le 24/10/2026.
- **[M·24/10]** : vu seulement dans l'extrait d'un moteur de recherche, parce que la page n'a pas chargé. À reconfirmer.
- **(calcul TAS)** : calcul fait à partir des prix publiés, ce n'est pas un prix publié.

Sauf mention contraire, les prix sont en dollars US et hors taxes. Les prix AWS sont ceux de US East (Virginie), car les pages n'affichent pas ceux de Paris ou d'Irlande.

---

## 1. Plateformes SaaS qui font déjà « vidéos → grille → diffusion 24/7 »

### Tableau comparatif

| Outil | Ce qu'il fait | Prix d'entrée publié | Sorties | Intérêt pour TAS TV |
|---|---|---|---|---|
| **Lightcast** [V·24/10](https://www.lightcast.com/) | « 24/7 Scheduler & Playout » : création d'une chaîne linéaire 24/7 prête pour le FAST ou la diffusion, plus Media Cloud pour automatiser chaînes, directs et grilles. | **Non publié.** La page tarifs ne montre que « Request Pricing » et quatre formules sans prix : Power, Power X, Power XL, Signature [V·24/10](https://www.lightcast.com/pricing). | Applis Roku, Apple TV, Fire TV, Android TV, iOS et Android. Le Web Player est inclus sans surcoût. Samsung n'est pas nommé (seulement « smart TV »). Pas d'intégration (embed) mentionnée. | **Fort pour la V1** : seul acteur vu qui réunit chargement, grille, 24/7 et applis Apple TV clés en main. Il faut demander un devis. |
| **Castr** [V·24/10](https://castr.com/pricing/) | « TV Playout » : grille horaire de fichiers, de directs et de pauses. Mode Schedule sur toutes les formules ; mode Loop et guide des programmes (EPG) en JSON à partir de Premium [V·24/10](https://docs.castr.com/en/articles/8001118-introducing-tv-playout-what-is-it-how-to-create-one). | **Starter : 19,99 $/mois** (199,99 $/an). Limites : 1 playout, 5 fichiers de 30 min et 500 Mo au plus, 720p, logo Castr incrusté. **Premium : 199,99 $/mois** pour la boucle de 15 jours, l'EPG, 30 fichiers et sans logo. | Le direct Castr (CDN multiple, lecteur intégrable), la multidiffusion vers YouTube et Facebook, le RTMP personnalisé. La page dit que le playout alimente les applis OTT comme un direct ordinaire, sans les nommer [V·24/10](https://castr.com/tv-playout/). L'application web OTT n'existe que dans la formule Events (749,99 $). | **Moyen.** Bien pour un essai, mais 5 × 30 min en Starter ne fait pas une grille 24/7. Une vraie chaîne demande Premium. La page castr.com/24-7-tv-playout/ renvoie une erreur 404. |
| **OneStream Live** [V·24/10](https://onestream.live/pricing/) | Programmation de vidéos préenregistrées, playlists continues, « chaînes en continu sur YouTube », pages de direct hébergées et lecteurs intégrables [V·24/10](https://onestream.live/). | **Basic : 15 $/mois** (144 $/an), 720p, 5 destinations. Le flux de 24 h n'est inclus qu'en **Enterprise (139 $/mois)** ou en option à **30 $/mois** (« 24-hour YouTube stream »). | Plus de 45 réseaux, RTMP personnalisé, pages hébergées, lecteur intégrable. | **Moyen** pour un relais vers YouTube Live. La diffusion 24/7 semble limitée à YouTube. |
| **Restream** [V·24/10](https://restream.io/pricing) | Upload & Stream : diffuser une vidéo préenregistrée. Playlists et boucle avec les options Marathon et Media [M·24/10](https://support.restream.io/en/articles/13626308-schedule-your-video-as-a-pre-recorded-event). | **Standard : 19 $/mois.** Options Upload & Stream : Premier 39 $, Marathon 79 $, Media 239 $/mois [M·24/10]. | Multidiffusion : 3 canaux en Standard, 8 en Business. | **Faible** : boucle de 10 passages au plus et 40 h au maximum [M·24/10](https://support.restream.io/en/articles/6980009-video-looping-for-pre-recorded-videos). Les pages d'aide renvoient 404 au chargement. |
| **Gyre** [V·24/10](https://gyre.pro/pricing) | Diffusion 24/7 de vidéos préenregistrées, heures illimitées. | **Start : 49 $/mois.** Le tableau ne coche ni playlists ni planificateur pour Start, ce qui est à confirmer. **Start+ : 99 $/mois** avec playlists, planificateur et 4 flux HD. Essai gratuit de 7 jours. | YouTube, Twitch, Facebook, Instagram, X, Kick, Mixcloud. Pas de lecteur propre mentionné. | **Moyen** pour « TAS TV en direct 24/7 sur YouTube ou Twitch » en V1. Pas pour notre propre site. |
| **LiveReacting** [V·24/10](https://www.livereacting.com/pricing) (en plus) | Formule « 24/7 streaming » : playlist qui tourne en boucle sans limite de durée. | **39,99 $/mois** (33 $/mois en annuel). Code KICKSTART2026 : 287,93 $ la première année, jusqu'au 31/10/2026. | 5 destinations, dont du RTMP personnalisé. | **Moyen**, même rôle que Gyre. |
| **Viloud** [V·24/10](https://viloud.tv/) (en plus) | Chaînes linéaires 24/7 et à la demande, « Program Scheduler », envoi de fichiers ou de liens (y compris des HLS venant d'un CDN externe), lecteur HTML5 intégrable [V·24/10](https://viloud.tv/pricing). | **Les prix n'apparaissent pas sur la page officielle.** Seul un exemple de la FAQ donne une base BUSINESS à 99. Les sites tiers indiquent 29 / 79 / 199 $/mois en annuel [T·24/10](https://capterra.com/p/236565/Viloud/), ou 39 / 99 / 249 $ selon une autre source. Essai de 14 jours sans carte. | Lecteur intégrable, sites de marque, lien M3U8 de la chaîne (inclus en PREMIUM, en option en BUSINESS). La page d'accueil cite Roku TV et Apple TV. | **Fort pour un petit média** : c'est le plus proche de « grille + lecteur web + flux M3U8 » à petit prix. À tester pendant l'essai. |
| **Muvi** (One + Playout) [V·24/10](https://www.muvi.com/playout/pricing/) | Playout : planificateur glisser-déposer, gestion des trous, publicité insérée côté serveur (SSAI), marqueurs SCTE-35, HLS. L'EPG commence en Professional. | **Playout Standard : 199 $/mois** (facturé à l'année), avec seulement 5 h de diffusion incluses par mois. La FAQ facture **0,50 $ par heure de serveur actif**, soit ≈ 365 $/mois pour du 24/7 (calcul TAS). Muvi One commence à 399 $/mois, et les applis TV sont en Professional [V·24/10](https://www.muvi.com/pricing/). | HLS sur toutes les formules, SRT en Professional. | **Faible** : coûteux en 24/7, applis en supplément. |
| **Uscreen** [V·24/10](https://www.uscreen.tv/pricing/) | Plateforme de vidéo à la demande et d'abonnements avec direct natif. | **Starter : 49 $/mois**, avec 1 h de direct incluse. | Le 24/7 ne passe que par l'option « Custom CDN (HLS) » d'un tiers comme ScaleEngine [V·24/10](https://help.uscreen.tv/en/articles/8955273-live-streaming-on-uscreen-start-here). Les applis TV sont réservées à la formule Custom. | **Faible** : pas de grille native. |
| **Vimeo OTT** [V·24/10](https://vimeo.com/ott/pricing) | Starter : vidéo à la demande sur le web uniquement. Enterprise : direct et « 24/7 live linear channel ». | **Starter : 1 $ par abonné et par mois**, sans direct. **Enterprise : sur devis.** | Enterprise : web, iOS, Android, Apple TV, Android TV, Roku, Fire TV, Xbox, Samsung Tizen, LG, Vizio. | **Faible à moyen** : le 24/7 n'existe qu'en Enterprise. |
| **Vimeo (simulive)** [V·24/10](https://vimeo.com/product/simulive-and-scheduled-streams) (en plus) | « 24/7 scheduled streams » construits à partir d'une playlist ; premières programmées. | **Formule non identifiable** : la page tarifs s'est chargée sans contenu [V·24/10](https://vimeo.com/upgrade-plan). Les sites tiers donnent l'offre Advanced entre 65 et 108 $/mois [T·24/10](https://www.capterra.com/p/122348/Vimeo-Pro/pricing/). | Jusqu'à 20 destinations RTMP, plus YouTube, LinkedIn, Facebook, Instagram, TikTok et X. | **À vérifier** : ce serait une option simple si l'offre Advanced l'inclut. |
| **Wurl** [V·24/10](https://www.wurl.com/) | « Global FAST Pass » : distribution FAST, grille, directs et SSAI. AdPool pour la monétisation. | Non publié (formulaire de contact). | Partenaires affichés : Roku et Samsung TV Plus (logos seulement). | **Plus tard** : pour être distribué sur les plateformes FAST, pas pour le prototype. |
| **Amagi** [V·24/10](https://www.amagi.com/) | CLOUDPORT : playout cloud (ingestion, grille, habillage HTML et After Effects, directs) [V·24/10](https://www.amagi.com/products/cloudport-cloud-playout). PLANNER : programmation. THUNDERSTORM : SSAI et statistiques. FASTKit : « plateforme FAST clé en main » pour opérateurs, fabricants de TV et télécoms [V·24/10](https://www.amagi.com/products/fastkit). | Non publié (démonstration et contact). | Distribution linéaire, FAST et sur les réseaux sociaux. | **Nul à court terme** : cible broadcast et entreprise. |
| **Frequency** [V·24/10](https://www.frequency.com/) | Frequency Studio : ingestion, programmation et diffusion de chaînes. Plus de 200 destinations (FAST, vMVPD, applis propres). Service géré possible. | « Forfait mensuel fixe par chaîne », montant non publié. | Plateformes FAST, vMVPD, applis propres. | **Plus tard**, comme Wurl. |
| **Cineverse Matchpoint** [V·24/10](https://matchpoint.tv/) | Dispatch (chaîne logistique des médias), Blueprint (applis mobile, TV et web), Insights. La page d'accueil ne parle pas de playout FAST. Cineverse utilise Frequency pour son playout depuis août 2024 [M·24/10](https://www.frequency.com/news/cineverse-switches-on-frequency-to-distribute-its-top-fast-channels-worldwide). | Non publié. | Applis et livraison vers les plateformes. | **Nul** pour TAS TV. |
| **Brightcove** [V·24/10](https://studio.support.brightcove.com/cloud-playout/getting-started/cloud-playout-overview.html) | Cloud Playout : grille de vidéos à la demande et de directs, glisser-déposer, boucle, SSAI, EPG par API, code d'intégration. Exige un compte Video Cloud et Brightcove Live ; entrées limitées à 1080p et 20 Mbps. | Non publié. La page produit et la page tarifs renvoient 404. | Chaîne linéaire via Brightcove Live, code d'intégration. | **Faible** : solution d'entreprise. |
| **Kaltura** [M·24/10](https://knowledge.kaltura.com/help/creating-a-live-linear-stream-simulive-from-a-playlist-of-recorded-videos) | Seule trace trouvée : un « Live Linear » bricolé avec une playlist, VLC et OBS, sur un ordinateur qui doit rester allumé. Aucune grille 24/7 native trouvée. La page n'a chargé que son titre. | Non vérifié. | Non vérifié. | **Nul.** |

### À retenir
- Aucune offre en libre-service ne coche les quatre cases à petit prix : grille 24/7, lecteur web propre, applis Apple TV et Roku, flux HLS unique. Lightcast et Vimeo OTT Enterprise le font, mais sur devis.
- Les outils de « direct préenregistré » (OneStream, Restream, Gyre, LiveReacting) servent à **relayer** une chaîne vers YouTube ou Twitch. Ils ne remplacent pas notre propre antenne.

---

## 2. La plateforme « sur Apple » dont Lionel se souvient

D'après le contexte partagé, ses 1 464 notes Apple ne contiennent aucune trace de cet outil. Voici les candidats, du plus probable au moins probable :

1. **Lightcast** : chargement, grille et chaîne 24/7 dans le cloud, publiées dans des **applis Apple TV**, Roku et Fire TV [V·24/10](https://www.lightcast.com/). C'est le meilleur candidat si le souvenir est « ma chaîne sur l'Apple TV ».
2. **Softron OnTheAir Video** : logiciel de playout **pour Mac**. Il a un calendrier qui lance les playlists à heure fixe et peut tourner 24/7 en continu. Sorties SDI, HDMI, NDI ; RTMP vers les plateformes via MovieRecorder et l'option Streaming Pack. Licence permanente par sortie, sans abonnement, prix non affiché [V·24/10](https://softron.tv/products/play/ontheair-video). C'est le meilleur candidat si le souvenir est « un logiciel sur Mac ».
3. **mimoLive (Boinx)** : production vidéo sur Mac. La page cite « Automated scheduled broadcasts and 24/7 streams » comme cas d'usage, avec plusieurs sorties RTMP. Gratuit avec filigrane, sinon abonnement sans prix affiché [V·24/10](https://mimolive.com/).
4. **QuickTime Streaming Server (Apple, Mac OS X Server)** : le serveur d'Apple lui-même. Il faisait du « direct simulé » à partir de contenus préenregistrés, avec des playlists préparées dans QTSS Publisher, et citait les chaînes de radio et de TV 24/7 sur internet. Fiche technique Apple © 2005 [V·24/10](https://images.apple.com/server/docs/QuickTime_Streaming_TB_v10.4.pdf). Il a disparu après OS X Server 10.6 [T·24/10](https://en.wikipedia.org/wiki/QuickTime_Streaming_Server). Candidat possible si le souvenir est ancien.
5. **Vimeo OTT ou Uscreen** : applis Apple TV, mais grille 24/7 seulement dans Vimeo OTT Enterprise (voir §1).
6. **Ecamm Live** : logiciel Mac (macOS 11.2 ou plus) qui programme des directs Facebook, YouTube et LinkedIn et lit des vidéos préenregistrées. Ni playlist ni 24/7 mentionnés [V·24/10](https://www.ecamm.com/mac/ecammlive/).
7. **Wirecast** : Mac et Windows, « persistent playlists » sans détail, ni programmation ni 24/7 mentionnés [V·24/10](https://www.wirecast.io/).
8. **OBS + extensions** (Advanced Scene Switcher, planificateur du système) : bricolages surtout sous Windows, d'après le forum OBS [T·24/10](https://obsproject.com/forum/threads/automate-24-7-stream-for-a-scheduled-playlist.85336/).
9. **CasparCG** : **exclu**, car le serveur ne tourne que sous Windows et Linux [V·24/10](https://casparcg.com/).

**Être dans l'appli Apple TV elle-même** : aucune voie en libre-service trouvée.
- Live Tune-In pour les chaînes linéaires demande une appli tvOS, un « partner manifest » et un identifiant fourni par un représentant Apple ; la chaîne n'est accessible que par la télécommande Siri [V·24/10](https://tvpartners.apple.com/support/5496-linear-tv-channels-with-apple-tv-live-tune-in).
- Le Video Partner Program est réservé aux services d'abonnement vidéo premium, sur iOS et tvOS, avec achat intégré Apple [V·24/10](https://developer.apple.com/programs/video-partner/).

---

## 3. Briques cloud pour fabriquer une chaîne linéaire

**AWS Elemental MediaTailor Channel Assembly**
- **Fonctionnement :** le service ne manipule que des manifestes. Il assemble une fenêtre de direct glissante à partir des manifestes de vidéos déjà encodées, et les segments restent servis par notre origine (S3, serveur web, CDN ou MediaPackage). On peut insérer des coupures publicitaires sans marqueurs SCTE-35, avec MediaTailor ou tout autre serveur SSAI [V·24/10](https://docs.aws.amazon.com/mediatailor/latest/ug/channel-assembly.html).
- **Contraintes d'entrée :** vidéos **déjà packagées en HLS ou DASH**, toutes avec la même échelle d'encodage. L'encodage par titre et l'ABR automatique ne sont pas acceptés ; AWS recommande des segments d'au moins 1 s. Fenêtre de manifeste de 30 à 3 600 s. Sortie HLS ou DASH. La chaîne doit être publique pour l'insertion publicitaire [V·24/10](https://docs.aws.amazon.com/mediatailor/latest/ug/channel-assembly-getting-started.html).
- **Formules :** **Basic** = vidéos à la demande seulement, mode Loop (boucle sans fin) ou Linear (chaque programme passe une fois, avec un écran de remplissage obligatoire). **Standard** = sources en direct possibles, mode Linear obligatoire [V·24/10](https://docs.aws.amazon.com/mediatailor/latest/ug/channel-assembly-creating-channels.html).
- **Prix :**
  - **Basic : 0,10 $ par heure de chaîne active**, soit **73 $/mois en 24/7**, l'exemple officiel.
  - **Standard : 0,35 $/h**, soit 255,50 $/mois. La page affiche 225,50 $, une erreur de calcul de sa part.
  - Insertion publicitaire : 0,50 $ pour 1 000 publicités en direct.
  - Une chaîne arrêtée ne coûte rien [V·24/10](https://aws.amazon.com/mediatailor/pricing/).
- **Encodage préalable (MediaConvert) :** formule Basic à 0,0075 $ par minute normalisée au premier palier. Une sortie HD compte double, soit 0,015 $ la minute. Ce sont les tarifs de l'Ohio, ceux de Virginie ne sont pas affichés [V·24/10](https://aws.amazon.com/mediaconvert/pricing/). Avec 3 rendus (2 HD + 1 SD), 100 h de programmes coûtent ≈ 225 $, une seule fois (calcul TAS).

**AWS MediaLive et MediaPackage** (nécessaires seulement pour un vrai encodage en direct, par exemple pousser la chaîne vers YouTube Live)
- **MediaLive**, un seul pipeline : sortie 1080p AVC à 0,4212 $/h et entrée HEVC 1080p à 0,3528 $/h, soit **≈ 557 $/mois en 24/7** à la demande. En engagement de 12 mois, facturé chaque heure, ≈ 137 $/mois (calculs TAS à partir de la page) [V·24/10](https://aws.amazon.com/medialive/pricing/).
- **MediaPackage :** ingestion en direct à 0,03 $/Go, origination à 0,05 $/Go, packaging à la demande à 0,05 $/Go. Pas de frais par heure de chaîne. AWS offre 100 Go/mois de transfert sortant, tous services confondus [V·24/10](https://aws.amazon.com/mediapackage/pricing/).
- **CloudFront :** forfaits fixes **Free à 0 $** (1 M de requêtes, 100 Go) et **Pro à 15 $/mois** (10 M de requêtes, 50 To) [V·24/10](https://aws.amazon.com/cloudfront/pricing/).

**Ce que couvrent les 1 120 $ de crédits AWS Activate**
- **Exclus** des crédits promotionnels : AWS Marketplace, Route 53 (achat ou transfert de domaine), frais initiaux des Savings Plans et instances réservées, support non éligible (Enterprise, etc.), Mechanical Turk, Professional Services, formation, certification, minage. Les crédits s'appliquent seulement aux services désignés par l'entité contractante AWS [V·24/10](https://aws.amazon.com/awscredits/). La page FAQ d'Activate n'affiche pas ses réponses.
- **Donc a priori couverts :** MediaTailor, MediaConvert, MediaLive à la demande, MediaPackage, S3, CloudFront à l'usage. Deux points à vérifier dans la console (Facturation > Crédits) : la liste des services éligibles, et si les forfaits fixes CloudFront entrent dans les crédits.
- **Ordre de grandeur (calcul TAS) :** une chaîne Basic 24/7 de novembre à avril coûte ≈ 438 $. Avec ≈ 225 $ d'encodage pour 100 h, il reste ≈ 450 $ pour le stockage, la diffusion et les tests. **MediaLive 24/7 à la demande épuiserait les crédits en deux mois.**

**Cloudflare Stream**
- **Prix :** 5 $/mois pour 1 000 minutes stockées (prépayé), 1 $ pour 1 000 minutes regardées. L'envoi et l'encodage sont gratuits [V·24/10](https://developers.cloudflare.com/stream/pricing/).
- **Direct :** entrée RTMPS ou SRT, enregistrement automatique, lecture HLS ou DASH [V·24/10](https://developers.cloudflare.com/stream/stream-live/). Relais vers 50 destinations au plus par entrée [V·24/10](https://developers.cloudflare.com/stream/stream-live/simulcasting/).
- **Pas de playlist programmée ni de boucle 24/7** dans la documentation du direct. Il faut un outil de playout externe qui envoie le flux en RTMPS.

**Mux**
- **Prix :** stockage à 0,003 $ par minute et par mois. Diffusion à 0,001 $ la minute au-delà de **100 000 minutes gratuites par mois**. Encodage gratuit pour la vidéo à la demande « basic ». Le direct coûte 0,03125 $ la minute d'entrée, soit ≈ 1 369 $/mois en 24/7 (calcul TAS). Paiement à l'usage avec 20 $ de crédit mensuel [V·24/10](https://www.mux.com/pricing).
- **Pas de direct simulé natif.** Mux propose trois contournements : un service RTMP tiers, son propre serveur ffmpeg, ou **une vidéo à la demande présentée comme un direct, dont la tête de lecture est calée sur l'heure du serveur** (timeline masquée, point rouge) [V·24/10](https://www.mux.com/docs/guides/stream-simulated-live). C'est exactement l'antenne virtuelle prévue pour le prototype.

---

## 4. Open source

| Projet | Ce qu'il fait | Licence | Remarque |
|---|---|---|---|
| **ErsatzTV** [V·24/10](https://ersatztv.org/) | Transforme une médiathèque (Plex, Jellyfin, Emby…) en chaînes en direct, avec grille, EPG et IPTV. | Zlib, pour le dépôt `ErsatzTV/legacy` [V·24/10](https://github.com/ErsatzTV/legacy). La licence de la version « Next » n'a pas été vérifiée. | Une version « Next » est en cours ; « Legacy » ne reçoit plus que des correctifs de sécurité. Conçu pour un usage domestique. |
| **Tunarr** [V·24/10](https://tunarr.com/) | Chaînes en direct à partir de Plex, Jellyfin, Emby ou de fichiers locaux. Faux tuner HDHomeRun et fichier M3U. | Zlib [V·24/10](https://github.com/chrisbenincasa/tunarr) | Ancien fork de dizqueTV, presque entièrement réécrit. |
| **dizqueTV** | Chaînes en direct depuis sa médiathèque, tuner HDHomeRun simulé ou M3U. | Zlib [V·24/10](https://github.com/vexorian/dizquetv) | Ancêtre de Tunarr. |
| **ffplayout** [V·24/10](https://github.com/ffplayout/ffplayout) | Playout 24/7 en Rust et FFmpeg : un dossier ou une playlist JSON par jour, modifiable pendant la diffusion. Sorties stream, bureau et HLS, ingestion RTMP, interface web. | GPL-3.0 | Pensé pour Linux. Le plus proche d'un « mini-Amagi » auto-hébergé. |
| **CasparCG** [V·24/10](https://casparcg.com/) | Moteur de playout broadcast (graphismes, vidéo, son), en production 24/7 depuis 2006. Se pilote par un protocole réseau et des clients externes. | GPL-3.0 [V·24/10](https://github.com/CasparCG/server) | Windows et Linux seulement. Pas de grille intégrée mentionnée. |
| **Liquidsoap** | Langage de script généraliste pour les médias : flux, génération de fichiers, automatisation (description GitHub). | GPL-2.0 [V·24/10](https://github.com/savonet/liquidsoap) | Puissant mais demande de la programmation. |
| **Owncast** (en plus) | Serveur de direct auto-hébergé, avec lecteur et chat intégrés. | MIT [V·24/10](https://github.com/owncast/owncast) | Pourrait servir de page antenne si TAS lui envoie un flux. Non testé. |
| **OBS Studio** | Diffusion et enregistrement. | GPL-2.0 [V·24/10](https://github.com/obsproject/obs-studio) | Le 24/7 passe par des extensions et des bricolages (voir §2). |

---

## 5. La « TV virtuelle » sur le web et les règles de YouTube

**Exemples qui existent**
- **YTCH** (ytch.xyz, qui redirige vers ytch.tv) : projet personnel de Hadi Safa. 17 chaînes thématiques de vidéos YouTube, programmées comme une chaîne de télé, sans pause ni défilement. L'article note l'absence de publicités YouTube et s'inquiète de la rémunération des créateurs [T·24/10](https://www.tubefilter.com/2024/08/19/ytch-youtube-tv-network-site/).
- **Channel Surfer** (channelsurfer.tv, lancé le 12/03/2026) : de Steven Irby, à Londres. Guide TV rétro sur 24 h ; quand on change de chaîne, **on arrive au milieu de la vidéo en cours**. Les vidéos sont des intégrations YouTube, publicités YouTube comprises. Site Next.js statique avec PartyKit, hébergé chez Cloudflare, sans serveur applicatif ; les données sont rafraîchies chaque jour par GitHub Actions [T·24/10](https://techcrunch.com/2026/03/12/channel-surfer-watch-youtube-retro-cable-tv-guide/).
- **OldSchoolTV** : sa fiche dit que tous les spectateurs d'une même chaîne voient la même chose au même moment [M·24/10](https://peerpush.com/p/oldschooltv). Non vérifié sur le site.
- **Le principe** « tout le monde voit la même minute » : on calcule la position de lecture à partir de l'heure du serveur. C'est le contournement n°3 décrit par Mux (§3) [V·24/10](https://www.mux.com/docs/guides/stream-simulated-live). Avec l'API IFrame de YouTube, on charge chaque vidéo à une seconde de départ donnée et on enchaîne quand la précédente se termine [V·24/10](https://developers.google.com/youtube/iframe_api_reference).

**Règles YouTube qui s'appliquent** (pages mises à jour le 15/10/2026)
- **Ne rien télécharger ni copier.** Interdit de télécharger, mettre en cache ou stocker des vidéos YouTube sans accord écrit de YouTube, ou de permettre la lecture hors ligne. On ne peut donc pas réinjecter une vidéo YouTube dans notre propre flux HLS [V·24/10](https://developers.google.com/youtube/terms/developer-policies).
- **Lecteur intact.**
  - Rien par-dessus le lecteur, ni logo, ni bandeau, ni cadre : l'habillage TAS doit rester **à côté** du lecteur.
  - Lecteur d'au moins 200 × 200 px.
  - Pas d'action déclenchée par le survol.
  - Aucune modification du lecteur au-delà de ce que la documentation prévoit [V·24/10](https://developers.google.com/youtube/terms/required-minimum-functionality).
  - Interdit aussi de séparer ou de modifier le son ou l'image (pas de doublage de Kayo par-dessus une vidéo YouTube), de bloquer les publicités YouTube et de lire en arrière-plan [V·24/10](https://developers.google.com/youtube/terms/developer-policies).
- **Lecture automatique et enchaînement.** Autorisés, mais seulement quand plus de la moitié du lecteur est visible, et **un seul lecteur à la fois** peut se lancer seul sur une page [V·24/10](https://developers.google.com/youtube/terms/required-minimum-functionality). Les navigateurs bloquent le son sans geste de l'utilisateur ; l'API prévient alors par l'événement `onAutoplayBlocked`. D'où un bouton « Activer le son » [V·24/10](https://developers.google.com/youtube/iframe_api_reference).
- **Argent.**
  - Interdit de faire payer l'accès à une vidéo YouTube intégrée.
  - Interdit de vendre de la publicité dans ou sur le lecteur sans accord de YouTube.
  - Sur une page qui affiche des données YouTube, la publicité n'est permise que si le contenu non-YouTube a assez de valeur propre [V·24/10](https://developers.google.com/youtube/terms/developer-policies).
- **Pas de clone de YouTube.** Interdit de créer un service de substitution à YouTube ou d'en recopier l'expérience sans valeur ajoutée importante. La curation, le multilingue et la grille sont nos arguments. YouTube doit être clairement crédité comme source [V·24/10](https://developers.google.com/youtube/terms/developer-policies).
- **Vérifications par vidéo.** Le statut « Made for Kids » doit être consulté pour chaque vidéo intégrée [V·24/10](https://developers.google.com/youtube/terms/developer-policies). Le champ `status.embeddable` indique si l'intégration est permise, mais une vidéo peut être bloquée même quand il est vrai [V·24/10](https://developers.google.com/youtube/v3/docs/videos).
- **Programmer des vidéos de tiers en continu :** aucune règle trouvée qui l'interdise en tant que tel. Les limites sont celles listées ci-dessus. Recueillir l'accord du créateur reste la règle que TAS s'est fixée.

---

## 6. Droits : points à vérifier (pas un avis juridique)

- **Créateur :** il faut une licence écrite pour la diffusion linéaire (territoires, durée, langues et sous-titres, exclusivité ou non, rémunération). Le créateur doit garantir qu'il détient les droits de tout ce que contient sa vidéo : musique, images de tiers, personnes filmées.
- **Arcom :** une chaîne de télévision diffusée sur internet doit être **déclarée**. Une **convention** est obligatoire au-delà de 150 000 € de chiffre d'affaires net annuel, ou pour l'information locale [V·24/10](https://www.arcom.fr/en/tv-and-demand/declaration-or-agreement-non-hertzian-services).
- **SACEM (auteurs) :** autorisation préalable avant de diffuser de la musique. Seul le dépliant webradio et podcast de 2020 a été trouvé [M·24/10](https://www.editionmultimedia.fr/wp-content/uploads/2021/11/Flyer-Sacem-Webradio-Podcast-2020.pdf). Aucun barème web TV français n'a été trouvé : il faut demander directement à la SACEM.
- **Droits voisins :** la licence légale couvre le webcasting non interactif de disques [T·24/10](https://next.ink/9360/104831-lavenir-licence-legale-webradios-fixe-4-aout/). Mais un disque utilisé avec une image relève d'une autorisation des producteurs (SCPP, SPPF) [M·24/10](https://www.assemblee-nationale.fr/12/pdf/amendements/1206/120600173.pdf). La SACEM Luxembourg exige aussi une licence séparée des producteurs pour les web TV [M·24/10](https://sacem.lu/en/music-users/internet-multimedia/webradio-webtv).
- **Musique « libre » ou bibliothèque YouTube :** vérifier que la licence couvre une diffusion hors de YouTube, dans une grille linéaire.

---

## Recommandation (prototype en 36 h, puis V1 en novembre)

1. **Prototype :** une antenne web virtuelle. Une grille en JSON et l'heure du serveur ; chaque lecteur se cale sur la bonne minute (méthode décrite par Mux). Fichiers TAS en HLS (S3 + CloudFront, ou Mux ou Cloudflare Stream) et vidéos YouTube intégrées. Démarrage muet avec bouton « Activer le son », aucun habillage sur le lecteur YouTube, `embeddable` vérifié. Aucun serveur de diffusion.
2. **V1 :** AWS MediaTailor Channel Assembly en formule Basic (73 $/mois en 24/7, couvert par les crédits). Les vidéos TAS ou sous licence sont encodées une fois par MediaConvert avec une échelle fixe. On obtient **une URL HLS unique** pour le site, les applis et, plus tard, les plateformes FAST, avec la publicité serveur possible.
3. **Relais YouTube Live ou Twitch :** Gyre ou LiveReacting (≈ 40 à 100 $/mois), ou ffmpeg sur un petit serveur. **Éviter MediaLive 24/7 à la demande** (≈ 557 $/mois) et le direct 24/7 de Mux (≈ 1 369 $/mois).
4. **Applis Apple TV et Roku :** demander un devis à Lightcast et tester Viloud pendant son essai. Écarter pour l'instant Vimeo OTT Enterprise, Muvi et Uscreen (chers ou sans grille native), ainsi qu'Amagi, Wurl et Frequency (à garder pour la distribution FAST en 2027).
5. **À ne pas faire :**
   - télécharger des vidéos YouTube pour les mettre dans notre flux ;
   - construire le cœur sur ErsatzTV ou Tunarr (faits pour des médiathèques personnelles) ;
   - utiliser CasparCG sur Mac ;
   - compter sur Castr Starter ou Restream pour du 24/7 (plafonds trop bas).
