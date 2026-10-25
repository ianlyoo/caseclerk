// Webhook route with a recorded sandbox payload (PII scrubbed) through W1's real getDispute/toSnapshot;
// paypalFetch, the signature check and the agent are mocked.
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
  observer: null as null | ((c: Record<string, unknown>) => Promise<void>),
}));

vi.mock("@/lib/paypal/webhook", () => ({ verifyWebhookSignature: m.verify }));
// Like W1's client: each paypalFetch reports to the registered observer (the wire log).
vi.mock("@/lib/paypal/client", () => ({
  paypalFetch: async (path: string, init?: { method?: string }) => {
    const report = (status: number) =>
      m.observer?.({ method: init?.method ?? "GET", path, status, debugId: "dbg-w", durationMs: 5, at: new Date().toISOString() });
    try {
      const r = await m.paypalFetch(path, init);
      await report(r.status);
      return r;
    } catch (e) {
      await report(500);
      throw e;
    }
  },
  setPayPalCallObserver: (fn: typeof m.observer) => (m.observer = fn),
}));
vi.mock("next/server", () => ({ after: (fn: () => Promise<void>) => m.afterTasks.push(fn) }));
vi.mock("@/lib/agent/run", () => ({ runAgent: m.runAgent }));

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
  m.verify.mockReset().mockResolvedValue({ verified: true, status: "SUCCESS" });
  m.runAgent.mockReset().mockResolvedValue({ status: "done", summary: "ok", costUsd: 0.05 });
  m.paypalFetch.mockReset().mockImplementation(async () => ({ status: 200, json: dispute }));
});

describe("POST /api/webhooks/paypal", () => {
  it("verifies, stores the case, audits, responds, then runs the agent", async () => {
    const res = await post();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, caseId: DISPUTE_ID, changed: true });
    expect(m.verify).toHaveBeenCalledWith(expect.any(Headers), event);
    expect(m.paypalFetch).toHaveBeenCalledWith(`/v1/customer/disputes/${DISPUTE_ID}`, undefined);

    const c = await db.cases.get(DISPUTE_ID);
    expect(c).toMatchObject({
      status: "new",
      isTestDispute: false,
      snapshot: {
        status: "WAITING_FOR_SELLER_RESPONSE",
        stage: "CHARGEBACK",
        sellerTransactionId: dispute.disputed_transactions[0].seller_transaction_id,
        allowed: expect.arrayContaining(["accept_claim", "provide_evidence"]),
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
    m.paypalFetch.mockRejectedValueOnce(new Error("PayPal GET /v1/customer/disputes/x → 500 (debug_id test)")); // W1 throws on non-2xx
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

  it("logs the delivery and every PayPal call on the wire, attributed to webhook and agent", async () => {
    const CAPTURE = dispute.disputed_transactions[0].seller_transaction_id as string;
    await db.testCaptures.record({ captureId: CAPTURE });
    const pre = await db.wire.append({ kind: "call", origin: "seller", method: "POST", path: "/v2/checkout/orders", status: 201, ref: CAPTURE });
    m.runAgent.mockImplementationOnce(async () => {
      const { paypalFetch } = await import("@/lib/paypal/client");
      await paypalFetch(`/v1/customer/disputes/${DISPUTE_ID}/send-message`, { method: "POST" });
      return { status: "done", summary: "ok", costUsd: 0 };
    });
    await post();
    await flushAfter();
    await post(); // duplicate delivery: one more event row, no PayPal call
    const rows = await db.wire.listByCase(DISPUTE_ID);
    expect(rows.map((w) => [w.kind, w.origin, w.path ?? w.eventType])).toEqual([
      ["call", "seller", "/v2/checkout/orders"], // the test dispute's own calls, linked by capture id
      ["event", "webhook", "CUSTOMER.DISPUTE.CREATED"], // stamped at receipt
      ["call", "webhook", `/v1/customer/disputes/${DISPUTE_ID}`],
      ["call", "agent", `/v1/customer/disputes/${DISPUTE_ID}/send-message`],
      ["event", "webhook", "CUSTOMER.DISPUTE.CREATED"],
    ]);
    expect(rows[0].id).toBe(pre.id);
    expect(rows[1]).toMatchObject({ eventId: JSON.parse(event).id, verify: "SUCCESS", status: 200, detail: { result: "processed" } });
    expect(rows[1].durationMs).toBeGreaterThanOrEqual(0);
    expect(rows[4].detail).toEqual({ result: "duplicate" });

    m.verify.mockResolvedValueOnce({ verified: false, status: "FAILURE" });
    await post();
    expect(await db.wire.listByCase(DISPUTE_ID)).toHaveLength(5); // the forged one stays off the wire
    expect((await db.wire.listByCase(DISPUTE_ID, { includeUnverified: true })).at(-1)).toMatchObject({ kind: "event", verify: "FAILURE", status: 401 });
  });

  it("never stores a case, runs the agent or shows a row for a forged delivery", async () => {
    // A forged POST: the signature check itself calls PayPal, which answers FAILURE.
    const { paypalFetch } = await import("@/lib/paypal/client");
    const forged = [
      { verified: false, status: "FAILURE" },
      { verified: false, status: "MISSING_HEADER" },
      { verified: true, status: "FAILURE" }, // a malformed result must not pass either
    ];
    for (const v of forged) {
      m.verify.mockImplementationOnce(async () => {
        await paypalFetch("/v1/notifications/verify-webhook-signature", { method: "POST" });
        return v;
      });
      expect((await post()).status).toBe(401);
    }
    m.verify.mockRejectedValueOnce(new Error("verify blew up"));
    expect((await post()).status).toBe(401);
    m.verify.mockResolvedValueOnce({ verified: false, status: "NOT_CONFIGURED" });
    expect((await post()).status).toBe(503);
    await flushAfter();

    expect(await db.cases.get(DISPUTE_ID)).toBeNull();
    expect(await db.audit.listByCase(DISPUTE_ID)).toEqual([]);
    expect(m.runAgent).not.toHaveBeenCalled();
    expect(m.paypalFetch).not.toHaveBeenCalledWith(`/v1/customer/disputes/${DISPUTE_ID}`, undefined);
    expect(await db.wire.listByCase(DISPUTE_ID)).toEqual([]);
    expect(await db.wire.listRecent()).toEqual([]);
    const stored = await db.wire.listRecent({ includeUnverified: true });
    expect(stored.filter((w) => w.kind === "event").map((w) => w.verify)).toEqual(["FAILURE", "MISSING_HEADER", "FAILURE", "ERROR", "NOT_CONFIGURED"]);
    expect(stored.filter((w) => w.kind === "call")).toHaveLength(3);
    expect(stored.every((w) => w.verify !== "SUCCESS" && w.verify !== "PENDING")).toBe(true);

    // The real delivery afterwards still goes through (the forged ones didn't burn its event id).
    expect((await post()).status).toBe(200);
    await flushAfter();
    expect(m.runAgent).toHaveBeenCalledTimes(1);
  });
});
