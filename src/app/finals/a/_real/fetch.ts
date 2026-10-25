import { REAL_CASE_IDS, type ApiCase } from "./model";
import { UPSTREAM } from "./upstream";

/** The real cases from the production API, in REAL_CASE_IDS order; any that fail to load are left out. */
export async function fetchRealCases(): Promise<ApiCase[]> {
  const got = await Promise.all(
    REAL_CASE_IDS.map(async (id) => {
      try {
        const r = await fetch(`${UPSTREAM}/api/cases/${id}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
        return r.ok ? ((await r.json()) as ApiCase) : null;
      } catch {
        return null;
      }
    }),
  );
  return got.filter((x): x is ApiCase => x !== null);
}
