// Server-side reads of CaseClerk's production API (GET only). The /d2 pages render from these.
import type { AgentAction, AuditEntry, CaseRecord, SellerPolicy } from "@/lib/types";
import type { WireEntry } from "@/lib/db/repo";
import type { CaseMoney } from "@/lib/paypal/money";

const ORIGIN = process.env.CASECLERK_API_ORIGIN ?? "https://caseclerk.vercel.app";

export type CaseBundle = {
  case: CaseRecord;
  actions: AgentAction[];
  audit: AuditEntry[];
  wire: WireEntry[];
  money?: CaseMoney | null;
};

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${ORIGIN}${path}`, { cache: "no-store", signal: AbortSignal.timeout(9000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const getCase = (id: string) => get<CaseBundle>(`/api/cases/${encodeURIComponent(id)}`);
export const listCases = async () => (await get<{ cases: CaseRecord[] }>("/api/cases?limit=200"))?.cases ?? null;
export const getPolicy = async () => (await get<{ policy: SellerPolicy }>("/api/policy"))?.policy ?? null;
