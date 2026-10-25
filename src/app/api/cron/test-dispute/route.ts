import { timingSafeEqual } from "node:crypto";
import { TEST_SCENARIOS, type TestScenario } from "@/lib/paypal/testDispute";
import { envInt, json, jsonError } from "../../_lib/http";
import { createTestDispute } from "../../_lib/testDispute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/cron/test-dispute: Vercel Cron (vercel.json, daily) opens one real sandbox test dispute,
// through the same path and caps as POST /api/test-dispute, with origin "cron".
// Needs `Authorization: Bearer <CRON_SECRET>` (Vercel sends it). Off unless CRON_TEST_DISPUTE=1.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return jsonError(503, "unavailable", "CRON_SECRET is not set.");
  if (!sameSecret(req.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return jsonError(401, "unauthorized", "Missing or wrong cron secret.");
  }
  if (process.env.CRON_TEST_DISPUTE !== "1") {
    console.log("[api/cron/test-dispute] skipped (CRON_TEST_DISPUTE is off)");
    return json({ skipped: true, reason: "CRON_TEST_DISPUTE is off" });
  }
  // Alternate scenarios by UTC day so judges see both kinds.
  const scenarios = Object.keys(TEST_SCENARIOS) as TestScenario[];
  const scenario = scenarios[Math.floor(Date.now() / 86_400_000) % scenarios.length];
  return createTestDispute({
    origin: "cron",
    scenario,
    caller: {
      key: "test-dispute:cron",
      perDay: envInt("CRON_TEST_DISPUTES_PER_DAY", 1),
      message: "Today's scheduled test dispute was already opened.",
    },
  });
}

function sameSecret(got: string, want: string): boolean {
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}
