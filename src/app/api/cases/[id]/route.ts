import { actions, audit, cases, wire } from "@/lib/db";
import { caseDto, errMessage, json, jsonError } from "../../_lib/http";
import { moneyForCase } from "../../_lib/money";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/cases/:id → { case, actions, audit, wire, money } (polled by the case page; audit and wire oldest first).
// money: { gross, fee, net, kept, source: "paypal_fund_movements", at, ... } once a resolved case's numbers are stated by PayPal, else null.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const c = await cases.get(id);
    if (!c) return jsonError(404, "not_found", `No case ${id}.`);
    const [acts, timeline, calls, money] = await Promise.all([actions.listByCase(id), audit.listByCase(id), wire.listByCase(id), moneyForCase(c)]);
    return json({ case: caseDto(c), actions: acts, audit: timeline, wire: calls, money });
  } catch (e) {
    console.error(`[api/cases/${id}] get failed: ${errMessage(e)}`);
    return jsonError(503, "unavailable", "This case is unavailable right now. Try again shortly.");
  }
}
