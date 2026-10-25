import { CASE_ID, bad, forward } from "../../../_real/upstream";

export const dynamic = "force-dynamic";

// GET /finals/a/live/case/:id → production GET /api/cases/:id
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!CASE_ID.test(id)) return bad("Not a PayPal dispute id.");
  return forward(`/api/cases/${id}`);
}
