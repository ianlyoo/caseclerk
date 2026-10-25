// Shared by POST /api/test-dispute (origin seller) and the daily cron (origin cron): caps → sandbox
// payment + chargeback → record the capture so the webhook marks the case as a test dispute.
import { rateLimit, testCaptures, wire } from "@/lib/db";
import { withWire } from "@/lib/db/wire";
import { openTestDispute, type OpenTestDisputeResult, type TestScenario } from "@/lib/paypal/testDispute";
import { envInt, errMessage, json, jsonError } from "./http";

const DAY_S = 86_400;

export async function createTestDispute(opts: {
  origin: "seller" | "cron";
  scenario: TestScenario;
  /** Extra per-caller cap on top of the global one: rate-limit key and daily limit. */
  caller: { key: string; perDay: number; message: string };
}): Promise<Response> {
  const tag = `[api/test-dispute origin=${opts.origin}]`;
  const global = envInt("TEST_DISPUTES_PER_DAY", 40);
  try {
    const mine = await rateLimit.hit(opts.caller.key, opts.caller.perDay, DAY_S);
    if (!mine.allowed) return jsonError(429, "rate_limited", opts.caller.message, { resetAt: mine.resetAt });
    const all = await rateLimit.hit("test-dispute:all", global, DAY_S);
    if (!all.allowed) {
      return jsonError(429, "rate_limited", "The demo's daily test-dispute limit is reached. Try again tomorrow.", {
        resetAt: all.resetAt,
      });
    }
  } catch (e) {
    console.error(`${tag} rate limit failed: ${errMessage(e)}`);
    return jsonError(503, "unavailable", "Test disputes are unavailable right now. Try again shortly.");
  }

  let created: OpenTestDisputeResult;
  let rowIds: string[] = [];
  try {
    // waitMs 0: don't poll for the dispute id; the webhook links the case by capture id.
    created = await withWire({ origin: opts.origin }, async (ctx) => {
      rowIds = ctx.rowIds;
      return openTestDispute({ scenario: opts.scenario, waitMs: 0 });
    });
  } catch (e) {
    console.error(`${tag} openTestDispute failed: ${errMessage(e)}`);
    return jsonError(502, "upstream_error", "PayPal's sandbox didn't accept the test dispute. Try again in a minute.");
  }

  try {
    await testCaptures.record({
      captureId: created.captureId,
      orderId: created.orderId,
      ...(created.disputeId ? { disputeId: created.disputeId } : {}),
      scenario: opts.scenario,
      order: created.order,
    });
  } catch (e) {
    // The dispute exists; it just won't carry the test badge / demo controls.
    console.error(`${tag} record capture=${created.captureId} failed: ${errMessage(e)}`);
  }
  // Tag the order/capture/chargeback calls so the webhook can attach them to the case.
  await wire
    .tag(rowIds, { ref: created.captureId, ...(created.disputeId ? { caseId: created.disputeId } : {}) })
    .catch((e: unknown) => console.error(`${tag} wire tag failed: ${errMessage(e)}`));
  console.log(`${tag} capture=${created.captureId} order=${created.orderId} dispute=${created.disputeId ?? "-"}`);
  return json(
    {
      scenario: opts.scenario,
      captureId: created.captureId,
      orderId: created.orderId,
      disputeId: created.disputeId ?? null,
      amount: created.amount,
      message: "Sandbox chargeback filed. PayPal usually notifies us in about 3 minutes; the case then appears in the inbox.",
    },
    202,
  );
}
