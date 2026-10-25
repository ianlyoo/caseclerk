import { z } from "zod";
import { wire } from "@/lib/db";
import { errMessage, json, jsonError } from "../_lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Query = z.object({
  since: z.iso.datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

// GET /api/wire?since=<iso>&limit=50 → { wire: WireEntry[] } — the latest PayPal calls and webhook
// deliveries across cases, oldest first. Ids, paths, statuses, debug ids and timings only.
export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const q = Query.safeParse(params);
  if (!q.success) return jsonError(400, "bad_request", "since must be an ISO date-time; limit 1–200.");
  try {
    const rows = await wire.listRecent({ since: q.data.since, limit: q.data.limit ?? 50 });
    return json({ wire: rows, now: new Date().toISOString() });
  } catch (e) {
    console.error(`[api/wire] list failed: ${errMessage(e)}`);
    return jsonError(503, "unavailable", "The wire is unavailable right now. Try again shortly.");
  }
}
