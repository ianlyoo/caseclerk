import { handleApproval } from "../../../_lib/approval";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/actions/:id/deny  body: { note? } → { action }
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handleApproval(req, (await ctx.params).id, "deny");
}
