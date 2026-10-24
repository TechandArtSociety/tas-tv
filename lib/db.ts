import postgres from "postgres";

const globalForSql = globalThis as typeof globalThis & { tasSql?: ReturnType<typeof postgres> };

export function db() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL est manquant. Lance l'application avec pnpm dev.");
  if (!globalForSql.tasSql) {
    globalForSql.tasSql = postgres(connectionString, { max: 10, idle_timeout: 20, connect_timeout: 5 });
  }
  return globalForSql.tasSql;
}
