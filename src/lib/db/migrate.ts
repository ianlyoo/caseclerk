// Applies db/migrations/*.sql in name order, once each (tracked in schema_migrations).
// One-off command (Node >= 22.18 strips types natively), with DATABASE_URL in the environment:
//   node src/lib/db/migrate.ts
// Uses DATABASE_URL_UNPOOLED when present (Neon recommends a direct connection for schema changes);
// the pooled DATABASE_URL also works, since each file runs as one HTTP transaction.
// Self-contained on purpose (no "@/" imports) so plain Node can run it.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

/** Splits a migration into statements on ";" at end of line. Migrations must not contain function bodies. */
export function splitStatements(sql: string): string[] {
  return sql
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n")
    .split(/;\s*(?:--[^\n]*)?\n|;\s*$/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function migrate(url: string, dir = join(process.cwd(), "db", "migrations")): Promise<string[]> {
  const sql = neon(url);
  await sql.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`,
  );
  const done = new Set(
    ((await sql.query(`SELECT name FROM schema_migrations`)) as { name: string }[]).map((r) => r.name),
  );
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const applied: string[] = [];
  for (const f of files) {
    if (done.has(f)) continue;
    const statements = splitStatements(await readFile(join(dir, f), "utf8"));
    // One transaction per file: all statements plus the bookkeeping row, or nothing.
    await sql.transaction([
      ...statements.map((s) => sql.query(s)),
      sql.query(`INSERT INTO schema_migrations (name) VALUES ($1)`, [f]),
    ]);
    applied.push(f);
    console.log(`[migrate] applied ${f} (${statements.length} statements)`);
  }
  if (applied.length === 0) console.log(`[migrate] up to date (${files.length} files)`);
  return applied;
}

const isMain = typeof process !== "undefined" && process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    console.error("[migrate] DATABASE_URL is not set");
    process.exit(1);
  }
  migrate(url).catch((e: unknown) => {
    console.error(`[migrate] failed: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
}
