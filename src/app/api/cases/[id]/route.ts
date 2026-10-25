import { actions, audit, cases, wire } from "@/lib/db";
import { caseDto, errMessage, json, jsonError } from "../../_lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/cases/:id → { case, actions, audit, wire } (polled by the case page; audit and wire oldest first)
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const c = await cases.get(id);
    if (!c) return jsonError(404, "not_found", `No case ${id}.`);
    const [acts, timeline, calls] = await Promise.all([actions.listByCase(id), audit.listByCase(id), wire.listByCase(id)]);
    return json({ case: caseDto(c), actions: acts, audit: timeline, wire: calls });
  } catch (e) {
    console.error(`[api/cases/${id}] get failed: ${errMessage(e)}`);
    return jsonError(503, "unavailable", "This case is unavailable right now. Try again shortly.");
  }
}
