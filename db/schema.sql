create extension if not exists btree_gist;

create table if not exists creators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel_url text,
  lang text,
  consent_at timestamptz
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('file','youtube')),
  src text not null,
  title text not null,
  creator_id uuid not null references creators,
  duration_s int not null check (duration_s > 0),
  lang text not null,
  rights text not null default 'pending' check (rights in ('cleared','pending','refused')),
  rights_note text,
  subtitles jsonb not null default '{}',
  summary text, tags text[] not null default '{}', mood text,
  ingest_status text not null default 'todo' check (ingest_status in ('todo','running','done','failed')),
  created_at timestamptz not null default now()
);

create table if not exists grids (
  day date primary key,
  status text not null default 'draft' check (status in ('draft','published')),
  proposal jsonb,
  published_at timestamptz
);

create table if not exists slots (
  id uuid primary key default gen_random_uuid(),
  day date not null references grids on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  kind text not null check (kind in ('item','bumper')),
  item_id uuid references items,
  bumper_text text, bumper_audio text,
  reason text,
  check ((kind = 'item') = (item_id is not null)),
  exclude using gist (tstzrange(starts_at, ends_at) with &&)
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null, video_url text not null, channel_url text,
  pitch text, lang text, licence_accepted boolean not null check (licence_accepted),
  flagged boolean not null default false, status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id bigserial primary key,
  nick text not null check (length(nick) between 2 and 24),
  body text not null check (length(body) between 1 and 300),
  by_kayo boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  id int primary key default 1 check (id = 1),
  ad_every_n_items int not null default 2,
  ad_item_ids uuid[] not null default '{}'
);

create table if not exists ai_runs (
  id bigserial primary key, step text not null, model text not null, prompt_version text not null,
  input_hash text not null, tokens_in int, tokens_out int, cost_usd numeric(10,4),
  ok boolean not null, error text, created_at timestamptz not null default now()
);
