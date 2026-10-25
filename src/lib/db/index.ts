// Data access for CaseClerk. Owner: W4.
//
//   import { cases, actions, audit } from "@/lib/db";
//   const c = await cases.get(id);
//
// DATABASE_URL set → Neon Postgres; otherwise an in-memory store (per instance, lost on cold start).
// The choice is logged once per process.
import type { Repo } from "./repo";
import { createMemoryRepo } from "./memory";
import { createPostgresRepo } from "./postgres";

export type * from "./repo";

let current: Repo | null = null;

export function getDb(): Repo {
  if (current) return current;
  const url = process.env.DATABASE_URL;
  if (url) {
    current = createPostgresRepo(url);
  } else {
    current = createMemoryRepo();
  }
  console.log(`[db] using ${current.kind} store`);
  return current;
}

/** Tests only: swap the store (pass null to re-select from env on next use). */
export function setDbForTests(repo: Repo | null): void {
  current = repo;
}

function delegate<K extends keyof Omit<Repo, "kind">>(key: K): Repo[K] {
  return new Proxy({} as Repo[K], {
    get: (_t, prop) => (getDb()[key] as Record<PropertyKey, unknown>)[prop],
  });
}

export const cases = delegate("cases");
export const actions = delegate("actions");
export const audit = delegate("audit");
export const policy = delegate("policy");
export const spend = delegate("spend");
export const webhookEvents = delegate("webhookEvents");
export const rateLimit = delegate("rateLimit");
export const locks = delegate("locks");
export const testCaptures = delegate("testCaptures");
export const wire = delegate("wire");
export const caseMoney = delegate("caseMoney");

export { createMemoryRepo };
