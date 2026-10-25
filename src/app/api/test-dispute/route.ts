import { z } from "zod";
import { rateLimit, testCaptures } from "@/lib/db";
import { clientKey, envInt, errMessage, json, jsonError, parseBody } from "../_lib/http";
import { openTestDispute, TEST_SCENARIOS, type OpenTestDisputeResult, type TestScenario } from "@/lib/paypal/testDispute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY_S = 86_400;
const SCENARIOS = Object.keys(TEST_SCENARIOS) as [TestScenario, ...TestScenario[]];
const Body = z.object({ scenario: z.enum(SCENARIOS).default("not_received") }).strict();

// POST /api/test-dispute  body: { scenario?: "not_received" | "not_as_described" } → 202 { captureId, orderId, disputeId? }
// Creates a sandbox payment + chargeback; PayPal's CUSTOMER.DISPUTE.CREATED webhook (~3 min) opens the case.
export async function POST(req: Request) {
  const body = await parseBody(req, Body);
  if (body instanceof Response) return body;

  const perIp = envInt("TEST_DISPUTES_PER_IP_PER_DAY", 3);
  const global = envInt("TEST_DISPUTES_PER_DAY", 40);
  try {
    const ip = await rateLimit.hit(`test-dispute:ip:${clientKey(req)}`, perIp, DAY_S);
    if (!ip.allowed) {
      return jsonError(429, "rate_limited", `You've opened ${perIp} test disputes today. Try again tomorrow.`, {
        resetAt: ip.resetAt,
      });
    }
    const all = await rateLimit.hit("test-dispute:all", global, DAY_S);
    if (!all.allowed) {
      return jsonError(429, "rate_limited", "The demo's daily test-dispute limit is reached. Try again tomorrow.", {
        resetAt: all.resetAt,
      });
    }
  } catch (e) {
    console.error(`[api/test-dispute] rate limit failed: ${errMessage(e)}`);
    return jsonError(503, "unavailable", "Test disputes are unavailable right now. Try again shortly.");
  }

  let created: OpenTestDisputeResult;
  try {
    // waitMs 0: don't poll for the dispute id; the webhook links the case by capture id.
    created = await openTestDispute({ scenario: body.scenario, waitMs: 0 });
  } catch (e) {
    console.error(`[api/test-dispute] openTestDispute failed: ${errMessage(e)}`);
    return jsonError(502, "upstream_error", "PayPal's sandbox didn't accept the test dispute. Try again in a minute.");
  }

  try {
    await testCaptures.record({
      captureId: created.captureId,
      orderId: created.orderId,
      ...(created.disputeId ? { disputeId: created.disputeId } : {}),
      scenario: body.scenario,
      order: created.order,
    });
  } catch (e) {
    // The dispute exists; it just won't carry the test badge / demo controls.
    console.error(`[api/test-dispute] record capture=${created.captureId} failed: ${errMessage(e)}`);
  }
  console.log(`[api/test-dispute] capture=${created.captureId} order=${created.orderId} dispute=${created.disputeId ?? "-"}`);
  return json(
    {
      scenario: body.scenario,
      captureId: created.captureId,
      orderId: created.orderId,
      disputeId: created.disputeId ?? null,
      amount: created.amount,
      message: "Sandbox chargeback filed. PayPal usually notifies us in about 3 minutes; the case then appears in the inbox.",
    },
    202,
  );
}
