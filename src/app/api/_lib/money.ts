// `money` on GET /api/cases/:id: what the seller ended up with on a resolved case, from PayPal's
// fund_movements and the capture's fee breakdown (W1 src/lib/paypal/money.ts). Cached in case_money
// the first time PayPal states it; null until then or when PayPal doesn't state it.
import { after } from "next/server";
import { caseMoney } from "@/lib/db";
import { withWire } from "@/lib/db/wire";
import { fetchCaseMoney, moneyMayBeStated, type CaseMoney } from "@/lib/paypal/money";
import type { CaseRecord } from "@/lib/types";
import { errMessage } from "./http";

/** How long a GET waits for PayPal before answering null (the read finishes in after() and is cached). */
export const MONEY_WAIT_MS = 4_000;
/** At most one capture read per case per minute per instance while PayPal hasn't stated the money. */
const RETRY_MS = 60_000;
const lastTry = new Map<string, number>();

export async function moneyForCase(c: CaseRecord): Promise<CaseMoney | null> {
  if (c.status !== "resolved") return null;
  try {
    const cached = await caseMoney.get(c.id);
    if (cached) return cached;
  } catch (e) {
    console.error(`[money] ${c.id} cache read failed: ${errMessage(e)}`);
  }
  if (!moneyMayBeStated(c.snapshot)) return null;
  const t = lastTry.get(c.id);
  if (t !== undefined && Date.now() - t < RETRY_MS) return null;
  lastTry.set(c.id, Date.now());

  const read = withWire({ origin: "system", caseId: c.id }, () => fetchCaseMoney(c.snapshot))
    .then(async (m) => {
      if (!m) return null;
      lastTry.delete(c.id);
      try {
        return await caseMoney.put(c.id, m);
      } catch (e) {
        console.error(`[money] ${c.id} cache write failed: ${errMessage(e)}`);
        return m;
      }
    })
    .catch((e: unknown) => {
      console.error(`[money] ${c.id} PayPal read failed: ${errMessage(e)}`);
      return null;
    });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((r) => (timer = setTimeout(() => r(null), MONEY_WAIT_MS)));
  const result = await Promise.race([read, timeout]);
  clearTimeout(timer);
  if (result === null) after(() => read.then(() => undefined));
  return result;
}
