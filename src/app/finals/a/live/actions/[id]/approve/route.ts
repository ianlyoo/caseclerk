import { ACTION_ID, bad, forward } from "../../../../_real/upstream";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// POST /finals/a/live/actions/:id/approve {note?} → production POST /api/actions/:id/approve
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!ACTION_ID.test(id)) return bad("Not an action id.");
  const body = (await req.text()) || "{}";
  return forward(`/api/actions/${id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body });
}
