import { handleApproval } from "../../../_lib/approval";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Executing an approved action can call PayPal and continue the agent.
export const maxDuration = 300;

// POST /api/actions/:id/approve  body: { note? } → { action }
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handleApproval(req, (await ctx.params).id, "approve");
}
