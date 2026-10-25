// API routes over the in-memory repo, with W1/W2 modules mocked.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRepo, setDbForTests, type Repo } from "@/lib/db";
import { DEFAULT_POLICY } from "@/lib/types";
import { snapshot } from "./repo.contract";

const m = vi.hoisted(() => ({
  openTestDispute: vi.fn(),
  adjudicate: vi.fn(),
  requireEvidence: vi.fn(),
  getDispute: vi.fn(),
  executeApproved: vi.fn(),
  deny: vi.fn(),
}));
// openTestDispute reports one call per PayPal request, as W1's paypalFetch does through the observer.
vi.mock("@/lib/paypal/testDispute", () => ({
  openTestDispute: m.openTestDispute,
  TEST_SCENARIOS: { not_received: {}, not_as_described: {} },
}));
vi.mock("@/lib/paypal/simulators", () => ({ adjudicate: m.adjudicate, requireEvidence: m.requireEvidence }));
vi.mock("@/lib/paypal/disputes", () => ({ getDispute: m.getDispute }));
vi.mock("@/lib/agent/run", () => ({ executeApproved: m.executeApproved, deny: m.deny }));

const cases = await import("@/app/api/cases/route");
const caseOne = await import("@/app/api/cases/[id]/route");
const simulate = await import("@/app/api/cases/[id]/simulate/route");
const policy = await import("@/app/api/policy/route");
const testDispute = await import("@/app/api/test-dispute/route");
const approve = await import("@/app/api/actions/[id]/approve/route");
const deny = await import("@/app/api/actions/[id]/deny/route");
const health = await import("@/app/api/health/route");
const cron = await import("@/app/api/cron/test-dispute/route");
const { recordPayPalCall } = await import("@/lib/db/wire");

const ORDER = { orderId: "ORD-9", captureId: "CAP-9", items: [] };
async function fakeOpenTestDispute() {
  await recordPayPalCall({ method: "POST", path: "/v2/checkout/orders", status: 201, debugId: "dbg-o", durationMs: 400, at: new Date().toISOString() });
  return { captureId: "CAP-9", orderId: "ORD-9", amount: { value: "30.00", currency_code: "USD" }, order: ORDER };
}

const req = (path: string, init?: RequestInit & { ip?: string }) =>
  new Request(`http://x${path}`, { ...init, headers: { "x-forwarded-for": init?.ip ?? "1.2.3.4", ...(init?.headers ?? {}) } });
const params = (id: string) => ({ params: Promise.resolve({ id }) });

let db: Repo;
beforeEach(() => {
  db = createMemoryRepo();
  setDbForTests(db);
  vi.clearAllMocks();
});

describe("cases", () => {
  it("lists without the raw PayPal payload and filters", async () => {
    await db.cases.upsertFromSnapshot(snapshot({ id: "PP-R-1", raw: { secret: "x" } }));
    await db.cases.upsertFromSnapshot(snapshot({ id: "PP-R-2", status: "RESOLVED" }));
    const body = await (await cases.GET(req("/api/cases?open=true"))).json();
    expect(body.cases.map((c: { id: string }) => c.id)).toEqual(["PP-R-1"]);
    expect(body.cases[0].snapshot.raw).toBeUndefined();
    expect((await cases.GET(req("/api/cases?status=bogus"))).status).toBe(400);
  });

  it("returns one case with actions, timeline and wire, 404 otherwise", async () => {
    await db.cases.upsertFromSnapshot(snapshot({ id: "PP-R-1" }));
    await db.audit.append({ caseId: "PP-R-1", actor: "paypal", kind: "webhook.received", summary: "s" });
    await db.wire.append({ kind: "call", origin: "agent", caseId: "PP-R-1", method: "GET", path: "/v1/customer/disputes/PP-R-1", status: 200, at: "2026-10-25T00:00:02Z" });
    await db.wire.append({ kind: "event", origin: "webhook", caseId: "PP-R-1", eventId: "WH-1", status: 200, at: "2026-10-25T00:00:01Z" });
    const body = await (await caseOne.GET(req("/api/cases/PP-R-1"), params("PP-R-1"))).json();
    expect(body).toMatchObject({ case: { id: "PP-R-1" }, actions: [], audit: [{ kind: "webhook.received" }] });
    expect(body.wire.map((w: { kind: string }) => w.kind)).toEqual(["event", "call"]);
    const missing = await caseOne.GET(req("/api/cases/nope"), params("nope"));
    expect(missing.status).toBe(404);
    expect((await missing.json()).error.code).toBe("not_found");
  });
});

describe("policy", () => {
  it("gets defaults, validates and saves", async () => {
    expect((await (await policy.GET()).json()).policy).toEqual(DEFAULT_POLICY);
    const bad = await policy.PUT(req("/api/policy", { method: "PUT", body: JSON.stringify({ ...DEFAULT_POLICY, maxOfferPercent: 300 }) }));
    expect(bad.status).toBe(400);
    const inverted = { ...DEFAULT_POLICY, autoRefundMaxUsd: 80, approvalAboveUsd: 50 };
    expect((await policy.PUT(req("/api/policy", { method: "PUT", body: JSON.stringify(inverted) }))).status).toBe(400);
    const next = { ...DEFAULT_POLICY, approvalAboveUsd: 80 };
    const ok = await policy.PUT(req("/api/policy", { method: "PUT", body: JSON.stringify(next) }));
    expect((await ok.json()).policy).toEqual(next);
    expect(await db.policy.get()).toEqual(next);
  });
});

describe("test-dispute", () => {
  it("opens a test dispute, records the capture with its order, and rate-limits per IP", async () => {
    const order = { orderId: "ORD-9", captureId: "CAP-9", items: [], shipping: [{ carrier: "USPS", trackingNumber: "9400" }] };
    m.openTestDispute.mockResolvedValue({ captureId: "CAP-9", orderId: "ORD-9", amount: { value: "30.00", currency_code: "USD" }, order });
    const post = (ip: string) => testDispute.POST(req("/api/test-dispute", { method: "POST", body: "{}", ip }));
    for (let i = 0; i < 3; i++) expect((await post("9.9.9.9")).status).toBe(202);
    const limited = await post("9.9.9.9");
    expect(limited.status).toBe(429);
    expect((await limited.json()).error.code).toBe("rate_limited");
    expect((await post("8.8.8.8")).status).toBe(202);
    expect(m.openTestDispute).toHaveBeenCalledTimes(4);
    expect(m.openTestDispute).toHaveBeenCalledWith({ scenario: "not_received", waitMs: 0 });
    expect(await db.testCaptures.get("CAP-9")).toMatchObject({ orderId: "ORD-9", scenario: "not_received", order });
    // The webhook's upsert then gives the case the test badge and the order context.
    const { record } = await db.cases.upsertFromSnapshot(snapshot({ id: "PP-R-9", sellerTransactionId: "CAP-9" }));
    expect(record).toMatchObject({ isTestDispute: true, order });
    expect((await testDispute.POST(req("/api/test-dispute", { method: "POST", body: '{"scenario":"bogus"}', ip: "7.7.7.7" }))).status).toBe(400);
  });

  it("tags its PayPal calls with origin seller and the capture id", async () => {
    m.openTestDispute.mockImplementation(fakeOpenTestDispute);
    expect((await testDispute.POST(req("/api/test-dispute", { method: "POST", body: "{}" }))).status).toBe(202);
    const rows = await db.wire.listRecent();
    expect(rows).toEqual([expect.objectContaining({ origin: "seller", ref: "CAP-9", path: "/v2/checkout/orders", status: 201, debugId: "dbg-o" })]);
    await db.wire.linkRef("CAP-9", "PP-R-9");
    expect(await db.wire.listByCase("PP-R-9")).toHaveLength(1);
  });

  it("reports sandbox failures as JSON", async () => {
    m.openTestDispute.mockRejectedValue(new Error("422"));
    const res = await testDispute.POST(req("/api/test-dispute", { method: "POST", body: JSON.stringify({ scenario: "not_received" }) }));
    expect(res.status).toBe(502);
    expect((await res.json()).error.code).toBe("upstream_error");
  });
});

describe("simulate", () => {
  const post = (id: string, body: unknown) =>
    simulate.POST(req(`/api/cases/${id}/simulate`, { method: "POST", body: JSON.stringify(body) }), params(id));

  it("only works on test disputes and when PayPal allows it", async () => {
    await db.cases.upsertFromSnapshot(snapshot({ id: "PP-R-REAL" }));
    expect((await post("PP-R-REAL", { action: "require_evidence" })).status).toBe(403);

    await db.cases.upsertFromSnapshot(snapshot({ id: "PP-R-T" }), { isTestDispute: true });
    m.getDispute.mockResolvedValue(snapshot({ id: "PP-R-T", allowed: ["provide_evidence"] }));
    expect((await post("PP-R-T", { action: "adjudicate", outcome: "SELLER_FAVOR" })).status).toBe(409);
    expect((await post("PP-R-T", { action: "adjudicate" })).status).toBe(400);

    m.getDispute.mockResolvedValue(
      snapshot({ id: "PP-R-T", allowed: ["adjudicate", "require_evidence"], updateTime: "2026-10-25T03:00:00.000Z" }),
    );
    m.adjudicate.mockResolvedValue({ status: 200, debugId: "dbg1" });
    const ok = await post("PP-R-T", { action: "adjudicate", outcome: "SELLER_FAVOR" });
    expect(ok.status).toBe(200);
    expect(m.adjudicate).toHaveBeenCalledWith("PP-R-T", "SELLER_FAVOR");
    expect((await db.actions.listByCase("PP-R-T"))[0]).toMatchObject({ kind: "adjudicate", status: "executed", result: { httpStatus: 200, debugId: "dbg1" } });
    expect((await db.audit.listByCase("PP-R-T")).map((a) => a.kind)).toEqual(["demo.adjudicate"]);

    // Only real simulator calls count toward the 20/hour cap; "not allowed yet" checks don't.
    expect((await db.rateLimit.hit(`simulate:ip:${(await import("@/app/api/_lib/http")).clientKey(req("/"))}`, 99, 3600)).count).toBe(2);

    m.requireEvidence.mockRejectedValueOnce(new Error("400"));
    const failed = await post("PP-R-T", { action: "require_evidence" });
    expect(failed.status).toBe(502);
    expect((await failed.json()).error.action.status).toBe("failed");
  });
});

describe("approvals", () => {
  async function pending() {
    await db.cases.upsertFromSnapshot(snapshot({ id: "PP-R-A" }));
    return db.actions.insert({
      caseId: "PP-R-A", kind: "refund_capture", params: {}, rationale: "r", amountUsd: 80,
      requiresApproval: true, status: "awaiting_approval",
    });
  }

  it("approves through the agent and refuses a second decision", async () => {
    const a = await pending();
    m.executeApproved.mockImplementation(async (id: string) => {
      await recordPayPalCall({ method: "POST", path: "/v2/payments/captures/CAP-1/refund", status: 201, debugId: "dbg-r", durationMs: 700, at: new Date().toISOString() });
      return {
        ok: true,
        message: "Sent to PayPal",
        action: await db.actions.update(id, { status: "executed", result: { httpStatus: 201, debugId: "dbg-r" } }),
      };
    });
    const res = await approve.POST(req(`/api/actions/${a.id}/approve`, { method: "POST" }), params(a.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ action: { status: "executed" }, status: 201, debugId: "dbg-r", at: body.action.updatedAt });
    // The refund path names no dispute: the call is still filed under the case, origin seller.
    expect(await db.wire.listByCase("PP-R-A")).toEqual([expect.objectContaining({ origin: "seller", status: 201, debugId: "dbg-r" })]);
    const again = await deny.POST(req(`/api/actions/${a.id}/deny`, { method: "POST" }), params(a.id));
    expect(again.status).toBe(409);
    expect(m.deny).not.toHaveBeenCalled();
    expect((await approve.POST(req(`/api/actions/x/approve`, { method: "POST" }), params("x"))).status).toBe(404);
  });

  it("passes the deny note through and maps agent refusals to errors", async () => {
    const a = await pending();
    m.deny.mockImplementation(async (id: string) => ({ ok: true, message: "Denied", action: await db.actions.update(id, { status: "denied" }) }));
    const res = await deny.POST(req(`/api/actions/${a.id}/deny`, { method: "POST", body: JSON.stringify({ note: "too much" }) }), params(a.id));
    expect((await res.json()).action.status).toBe("denied");
    expect(m.deny).toHaveBeenCalledWith(a.id, "too much");

    const b = await pending();
    m.executeApproved.mockImplementation(async (id: string) => ({
      ok: false, message: "PayPal no longer allows refund", action: await db.actions.update(id, { status: "failed" }),
    }));
    const failed = await approve.POST(req(`/api/actions/${b.id}/approve`, { method: "POST" }), params(b.id));
    expect(failed.status).toBe(502);
    expect((await failed.json()).error).toMatchObject({ message: "PayPal no longer allows refund", status: null, debugId: null });
  });
});

describe("cron test dispute", () => {
  const call = (auth?: string) => cron.GET(req("/api/cron/test-dispute", auth ? { headers: { authorization: auth } } : {}));
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "cron-test-value");
    vi.stubEnv("CRON_TEST_DISPUTE", "0");
    m.openTestDispute.mockImplementation(fakeOpenTestDispute);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("needs the cron secret", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong")).status).toBe(401);
    vi.stubEnv("CRON_SECRET", "");
    expect((await call("Bearer ")).status).toBe(503);
    expect(m.openTestDispute).not.toHaveBeenCalled();
  });

  it("does nothing while CRON_TEST_DISPUTE is off", async () => {
    const res = await call("Bearer cron-test-value");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ skipped: true });
    expect(m.openTestDispute).not.toHaveBeenCalled();
  });

  it("opens one test dispute a day with origin cron, within the global cap", async () => {
    vi.stubEnv("CRON_TEST_DISPUTE", "1");
    const res = await call("Bearer cron-test-value");
    expect(res.status).toBe(202);
    expect(await db.testCaptures.get("CAP-9")).toMatchObject({ orderId: "ORD-9" });
    expect(await db.wire.listRecent()).toEqual([expect.objectContaining({ origin: "cron", ref: "CAP-9" })]);
    expect((await call("Bearer cron-test-value")).status).toBe(429);
    expect(m.openTestDispute).toHaveBeenCalledTimes(1);

    db = createMemoryRepo();
    setDbForTests(db);
    vi.stubEnv("TEST_DISPUTES_PER_DAY", "1");
    await db.rateLimit.hit("test-dispute:all", 1, 86_400); // a seller already used today's global quota
    expect((await call("Bearer cron-test-value")).status).toBe(429);
    expect(m.openTestDispute).toHaveBeenCalledTimes(1);
  });
});

describe("health", () => {
  it("reports booleans only", async () => {
    const body = await (await health.GET()).json();
    expect(body).toMatchObject({ ok: true, store: "memory", dbReachable: true });
    for (const v of Object.values(body.configured)) expect(typeof v).toBe("boolean");
  });
});
