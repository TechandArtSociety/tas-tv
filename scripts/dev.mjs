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
      insert into creators (name, channel_url, lang)
      values (${demo.creator}, 'https://techandartsociety.com', ${demo.lang})
      returning id
    `)[0].id;
    const existing = await sql`select id from items where src = ${`/media/${demo.file}`} limit 1`;
    if (existing.length === 0) {
      await sql`
        insert into items (kind, src, title, creator_id, duration_s, lang, rights, rights_note)
        values ('file', ${`/media/${demo.file}`}, ${demo.title}, ${creatorId}, ${demo.duration_s}, ${demo.lang}, ${demo.rights}, ${demo.rights_note})
      `;
    }
  }
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
