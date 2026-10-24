# TAS TV

Prototype local de l’antenne TAS TV et du studio de programmation.

## Lancer en développement

```sh
pnpm install
pnpm dev
```

Ouvrir http://localhost:3000. `pnpm dev` démarre PostgreSQL local via `embedded-postgres`, applique `db/schema.sql`, ajoute les médias de démo, puis lance Next.js. Le cluster reste dans `.data/postgres`.

La configuration locale se trouve dans `.env.local` (ignoré par Git). Pour une nouvelle installation, copier `.env.example` vers `.env.local` puis définir un `STUDIO_PASSWORD` et un `SESSION_SECRET` locaux. Aucune clé OpenAI n’est requise.

Les MP4 ne sont pas suivis par Git. Avec le catalogue source TAS présent trois niveaux au-dessus du dépôt, `pnpm media:copy` les recopie dans `media/` sans déplacer les originaux.

## Vérifier

```sh
pnpm test
pnpm typecheck
pnpm lint
```

Voir [docs/STATUS.md](docs/STATUS.md) pour l’avancement, les preuves et les limites connues.
