import { bad, forward } from "../../_real/upstream";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// POST /finals/a/live/test-dispute {scenario}, forwarded to production POST /api/test-dispute, which opens a real
// PayPal sandbox chargeback (202 { captureId, orderId, disputeId? }; 429 past the daily caps). Already public on production.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { scenario?: unknown } | null;
  const scenario = body?.scenario ?? "not_as_described";
  if (scenario !== "not_as_described" && scenario !== "not_received") return bad("scenario must be not_as_described or not_received.");
  return forward("/api/test-dispute", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenario }) });
}
