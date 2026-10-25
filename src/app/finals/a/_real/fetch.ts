import { REAL_LIST_PATH, type ApiCase } from "./model";
import { UPSTREAM } from "./upstream";

/** Every sandbox test case from the production API, in its order (newest first); any that fail to load are left out. */
export async function fetchRealCases(): Promise<ApiCase[]> {
  const get = async <T,>(path: string): Promise<T | null> => {
    try {
      const r = await fetch(`${UPSTREAM}${path}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
      return r.ok ? ((await r.json()) as T) : null;
    } catch {
      return null;
    }
  };
  const list = await get<{ cases: { id: string }[] }>(REAL_LIST_PATH);
  const got = await Promise.all((list?.cases ?? []).map((c) => get<ApiCase>(`/api/cases/${c.id}`)));
  return got.filter((x): x is ApiCase => x !== null);
}
