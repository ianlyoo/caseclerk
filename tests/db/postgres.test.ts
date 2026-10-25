// Postgres integration: runs only when DATABASE_URL is set. Applies migrations, runs the repo contract
// with ids unique to this run, then deletes what it created.
import { afterAll, describe, it } from "vitest";
import { neon } from "@neondatabase/serverless";
import { createPostgresRepo } from "@/lib/db/postgres";
import { migrate } from "@/lib/db/migrate";
import { repoContract } from "./repo.contract";

const url = process.env.DATABASE_URL;
const run = `IT${Date.now().toString(36)}`;
let n = 0;

if (url) {
  let migrated: Promise<unknown> | null = null;
  repoContract(
    "postgres",
    async () => {
      migrated ??= migrate(url);
      await migrated;
      return createPostgresRepo(url);
    },
    () => `${run}-${++n}`,
  );

  afterAll(async () => {
    const sql = neon(url);
    const like = `%${run}%`;
    await sql.transaction([
      sql.query(`DELETE FROM cases WHERE id LIKE $1`, [like]),
      sql.query(`DELETE FROM audit WHERE case_id LIKE $1`, [like]),
      sql.query(`DELETE FROM webhook_events WHERE event_id LIKE $1`, [like]),
      sql.query(`DELETE FROM rate_limits WHERE key LIKE $1`, [like]),
      sql.query(`DELETE FROM case_locks WHERE case_id LIKE $1`, [like]),
      sql.query(`DELETE FROM test_captures WHERE capture_id LIKE $1`, [like]),
      sql.query(`DELETE FROM wire WHERE case_id LIKE $1 OR ref LIKE $1`, [like]),
      sql.query(`DELETE FROM case_money WHERE case_id LIKE $1`, [like]),
    ]);
  });
} else {
  describe("repo contract: postgres", () => {
    it.skip("needs DATABASE_URL", () => undefined);
  });
}
