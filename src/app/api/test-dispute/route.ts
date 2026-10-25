import { z } from "zod";
import { TEST_SCENARIOS, type TestScenario } from "@/lib/paypal/testDispute";
import { clientKey, envInt, parseBody } from "../_lib/http";
import { createTestDispute } from "../_lib/testDispute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SCENARIOS = Object.keys(TEST_SCENARIOS) as [TestScenario, ...TestScenario[]];
const Body = z.object({ scenario: z.enum(SCENARIOS).default("not_received") }).strict();

// POST /api/test-dispute  body: { scenario?: "not_received" | "not_as_described" } → 202 { captureId, orderId, disputeId? }
// Creates a sandbox payment + chargeback; PayPal's CUSTOMER.DISPUTE.CREATED webhook (~3 min) opens the case.
export async function POST(req: Request) {
  const body = await parseBody(req, Body);
  if (body instanceof Response) return body;
  const perIp = envInt("TEST_DISPUTES_PER_IP_PER_DAY", 3);
  return createTestDispute({
    origin: "seller",
    scenario: body.scenario,
    caller: {
      key: `test-dispute:ip:${clientKey(req)}`,
      perDay: perIp,
      message: `You've opened ${perIp} test disputes today. Try again tomorrow.`,
    },
  });
}
