import { bad, forward } from "../../_real/upstream";

export const dynamic = "force-dynamic";

// GET /finals/a/live/wire?since=ISO, forwarded to production GET /api/wire?since=
export async function GET(req: Request) {
  const since = new URL(req.url).searchParams.get("since") ?? "";
  if (since && Number.isNaN(Date.parse(since))) return bad("since must be an ISO time.");
  return forward(`/api/wire${since ? `?since=${encodeURIComponent(since)}` : ""}`);
}
