import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import postgres from "postgres";

const root = process.cwd();
const envPath = resolve(root, ".env.local");
try {
  process.loadEnvFile(envPath);
} catch (error) {
  throw new Error(`Crée .env.local avant de lancer TAS TV : ${error.message}`);
}

const dbUrl = new URL(process.env.DATABASE_URL ?? "");
const database = dbUrl.pathname.replace(/^\//, "") || "tas_tv";
const cluster = new EmbeddedPostgres({
  databaseDir: resolve(root, ".data/postgres"),
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  port: Number(dbUrl.port || 5432),
  persistent: true,
});

let sql;
let child;
let interruptedBy;

try {
  try {
    await access(resolve(root, ".data/postgres/PG_VERSION"), constants.R_OK);
  } catch {
    await cluster.initialise();
  }
  await cluster.start();

  const adminClient = cluster.getPgClient("postgres", "127.0.0.1");
  await adminClient.connect();
  const databaseExists = await adminClient.query("select 1 from pg_database where datname = $1", [database]);
  await adminClient.end();
  if (databaseExists.rowCount === 0) await cluster.createDatabase(database);

  sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 10 });
  await sql.file(resolve(root, "db/schema.sql"));
  const demos = JSON.parse(await readFile(resolve(root, "db/demo-media.json"), "utf8"));
  for (const demo of demos) {
    const creatorRows = await sql`select id from creators where name = ${demo.creator} limit 1`;
    const creatorId = creatorRows[0]?.id ?? (await sql`
      insert into creators (name, channel_url, lang) values (${demo.creator}, ${demo.channel_url}, ${demo.lang}) returning id
    `)[0].id;
    if (creatorRows[0]) await sql`update creators set channel_url = ${demo.channel_url} where id = ${creatorId}`;
    const fields = {
      kind: "file", src: `/media/${demo.file}`, title: demo.title, creator_id: creatorId, duration_s: demo.duration_s, lang: demo.lang,
      rights: demo.rights, rights_note: demo.rights_note, tags: demo.tags ?? [], mood: demo.mood || null, summary: demo.summary ?? null,
    };
    const existing = await sql`select id from items where src = ${fields.src} limit 1`;
    if (existing[0]) {
      await sql`update items set ${sql(fields, "title", "creator_id", "duration_s", "lang", "rights", "rights_note", "tags", "mood", "summary")} where id = ${existing[0].id}`;
    } else {
      await sql`insert into items ${sql(fields)}`;
    }
  }
  // demo videos that left the manifest disappear, unless a grid still uses them; uploads are never touched
  const manifestSources = demos.map((demo) => `/media/${demo.file}`);
  await sql`delete from items i where i.kind = 'file' and i.src like '/media/%' and i.src not like '/media/uploads/%'
    and i.src <> all(${manifestSources}) and not exists (select 1 from slots s where s.item_id = i.id)`;
  await sql`insert into settings (id) values (1) on conflict (id) do nothing`;

  const mode = process.argv.includes("--production") ? "start" : "dev";
  child = spawn(process.execPath, [resolve(root, "node_modules/next/dist/bin/next"), mode], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      interruptedBy = signal;
      child?.kill(signal);
    });
  }
  const exitCode = await new Promise((resolveExit, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolveExit(code ?? (signal ? 1 : 0)));
  });
  process.exitCode = exitCode;
} finally {
  await sql?.end({ timeout: 5 });
  try {
    await cluster.stop();
  } catch (error) {
    if (!interruptedBy) console.error("Arrêt embedded-postgres :", error.message);
  }
}
