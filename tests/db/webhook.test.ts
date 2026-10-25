// Webhook route with a recorded sandbox payload (PII scrubbed), mocked signature check and agent.
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRepo, setDbForTests, type Repo } from "@/lib/db";

const event = readFileSync("tests/db/fixtures/event.created.json", "utf8");
const dispute = JSON.parse(readFileSync("tests/db/fixtures/dispute.created.json", "utf8"));
const DISPUTE_ID = dispute.dispute_id as string;

const m = vi.hoisted(() => ({
  verify: vi.fn(),
  paypalFetch: vi.fn(),
  runAgent: vi.fn(),
  afterTasks: [] as (() => Promise<void>)[],
  agentLoaded: true,
}));

vi.mock("@/lib/paypal/webhook", () => ({ verifyWebhookSignature: m.verify }));
vi.mock("@/lib/paypal/client", () => ({ paypalFetch: m.paypalFetch }));
vi.mock("next/server", () => ({ after: (fn: () => Promise<void>) => m.afterTasks.push(fn) }));
vi.mock("@/app/api/_lib/modules", () => ({
  loadAgent: async () => (m.agentLoaded ? { runAgent: m.runAgent } : null),
  loadDisputes: async () => null, // exercise the fallback normalizer over the recorded GET payload
}));

const { POST } = await import("@/app/api/webhooks/paypal/route");

function post(body = event) {
  return POST(new Request("http://x/api/webhooks/paypal", { method: "POST", body }));
}
const flushAfter = async () => {
  for (const t of m.afterTasks.splice(0)) await t();
};

let db: Repo;
beforeEach(() => {
  db = createMemoryRepo();
  setDbForTests(db);
  m.afterTasks.length = 0;
  m.agentLoaded = true;
  m.verify.mockReset().mockResolvedValue({ verified: true, status: "SUCCESS" });
  m.runAgent.mockReset().mockResolvedValue(undefined);
  m.paypalFetch.mockReset().mockImplementation(async () => Response.json(dispute));
});

describe("POST /api/webhooks/paypal", () => {
  it("verifies, stores the case, audits, responds, then runs the agent", async () => {
    const res = await post();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, caseId: DISPUTE_ID, changed: true });
    expect(m.verify).toHaveBeenCalledWith(expect.any(Headers), event);
    expect(m.paypalFetch).toHaveBeenCalledWith(`/v1/customer/disputes/${DISPUTE_ID}`);

    const c = await db.cases.get(DISPUTE_ID);
    expect(c).toMatchObject({
      status: "new",
      isTestDispute: false,
      snapshot: {
        status: "WAITING_FOR_SELLER_RESPONSE",
        stage: "CHARGEBACK",
        sellerTransactionId: dispute.disputed_transactions[0].seller_transaction_id,
        allowed: ["accept_claim", "provide_evidence"],
      },
    });
    const timeline = await db.audit.listByCase(DISPUTE_ID);
    expect(timeline).toHaveLength(1);
    expect(timeline[0]).toMatchObject({ actor: "paypal", kind: "webhook.received", summary: "Dispute opened: waiting for seller response" });

    expect(m.runAgent).not.toHaveBeenCalled(); // only after the response
    await flushAfter();
    expect(m.runAgent).toHaveBeenCalledWith(DISPUTE_ID, { kind: "webhook", eventType: "CUSTOMER.DISPUTE.CREATED" });
  });

  it("marks the case as a test dispute when the capture came from Open test dispute", async () => {
    await db.testCaptures.record({ captureId: dispute.disputed_transactions[0].seller_transaction_id, orderId: "O-1" });
    await post();
    expect((await db.cases.get(DISPUTE_ID))?.isTestDispute).toBe(true);
  });

  it("acks duplicate deliveries without refetching or rerunning", async () => {
    await post();
    await flushAfter();
    const res = await post();
    expect(await res.json()).toEqual({ received: true, duplicate: true });
    expect(m.paypalFetch).toHaveBeenCalledTimes(1);
    await flushAfter();
    expect(m.runAgent).toHaveBeenCalledTimes(1);
  });

  it("does not rerun the agent when a new event carries an unchanged snapshot", async () => {
    await post();
    await flushAfter();
    const again = JSON.stringify({ ...JSON.parse(event), id: "WH-OTHER", event_type: "CUSTOMER.DISPUTE.UPDATED" });
    expect(await (await post(again)).json()).toMatchObject({ changed: false });
    await flushAfter();
    expect(m.runAgent).toHaveBeenCalledTimes(1);
  });

  it("rejects unverified signatures and asks for a retry when unconfigured", async () => {
    m.verify.mockResolvedValueOnce({ verified: false, status: "FAILURE" });
    expect((await post()).status).toBe(401);
    m.verify.mockResolvedValueOnce({ verified: false, status: "NOT_CONFIGURED" });
    expect((await post()).status).toBe(503);
    expect(await db.cases.list()).toEqual([]);
  });

  it("returns 503 and forgets the event when PayPal can't be read, so the retry works", async () => {
    m.paypalFetch.mockResolvedValueOnce(new Response("{}", { status: 500 }));
    expect((await post()).status).toBe(503);
    expect(m.afterTasks).toHaveLength(0);
    expect((await post()).status).toBe(200);
    expect(await db.cases.get(DISPUTE_ID)).not.toBeNull();
  });

  it("ignores non-dispute events and bad JSON", async () => {
    const capture = JSON.stringify({ id: "WH-CAP", event_type: "PAYMENT.CAPTURE.COMPLETED", resource_type: "capture", resource: { id: "C1" } });
    expect(await (await post(capture)).json()).toEqual({ received: true, ignored: true });
    expect((await post("{nope")).status).toBe(400);
  });

  it("audits an agent failure on the case timeline", async () => {
    m.runAgent.mockRejectedValueOnce(new Error("model overloaded"));
    await post();
    await flushAfter();
    const kinds = (await db.audit.listByCase(DISPUTE_ID)).map((e) => e.kind);
    expect(kinds).toEqual(["webhook.received", "agent.error"]);
  });

  it("still stores the case when the agent module isn't deployed", async () => {
    m.agentLoaded = false;
    expect((await post()).status).toBe(200);
    await flushAfter();
    expect(await db.cases.get(DISPUTE_ID)).not.toBeNull();
  });
});
