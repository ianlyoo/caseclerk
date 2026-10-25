// API routes over the in-memory repo, with W1/W2 modules mocked.
import { beforeEach, describe, expect, it, vi } from "vitest";
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
  approvalsLoaded: true,
}));
vi.mock("@/app/api/_lib/modules", () => ({
  loadTestDispute: async () => ({ openTestDispute: m.openTestDispute }),
  loadSimulators: async () => ({ adjudicate: m.adjudicate, requireEvidence: m.requireEvidence }),
  loadDisputes: async () => ({ getDispute: m.getDispute }),
  loadApprovals: async () => (m.approvalsLoaded ? { executeApproved: m.executeApproved, deny: m.deny } : null),
  loadAgent: async () => null,
}));

const cases = await import("@/app/api/cases/route");
const caseOne = await import("@/app/api/cases/[id]/route");
const simulate = await import("@/app/api/cases/[id]/simulate/route");
const policy = await import("@/app/api/policy/route");
const testDispute = await import("@/app/api/test-dispute/route");
const approve = await import("@/app/api/actions/[id]/approve/route");
const deny = await import("@/app/api/actions/[id]/deny/route");
const health = await import("@/app/api/health/route");

const req = (path: string, init?: RequestInit & { ip?: string }) =>
  new Request(`http://x${path}`, { ...init, headers: { "x-forwarded-for": init?.ip ?? "1.2.3.4", ...(init?.headers ?? {}) } });
const params = (id: string) => ({ params: Promise.resolve({ id }) });

let db: Repo;
beforeEach(() => {
  db = createMemoryRepo();
  setDbForTests(db);
  vi.clearAllMocks();
  m.approvalsLoaded = true;
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

  it("returns one case with actions and timeline, 404 otherwise", async () => {
    await db.cases.upsertFromSnapshot(snapshot({ id: "PP-R-1" }));
    await db.audit.append({ caseId: "PP-R-1", actor: "paypal", kind: "webhook.received", summary: "s" });
    const body = await (await caseOne.GET(req("/api/cases/PP-R-1"), params("PP-R-1"))).json();
    expect(body).toMatchObject({ case: { id: "PP-R-1" }, actions: [], audit: [{ kind: "webhook.received" }] });
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
  it("opens a test dispute, records the capture, and rate-limits per IP", async () => {
    m.openTestDispute.mockResolvedValue({ captureId: "CAP-9", orderId: "ORD-9" });
    const post = (ip: string) => testDispute.POST(req("/api/test-dispute", { method: "POST", body: "{}", ip }));
    for (let i = 0; i < 3; i++) expect((await post("9.9.9.9")).status).toBe(202);
    const limited = await post("9.9.9.9");
    expect(limited.status).toBe(429);
    expect((await limited.json()).error.code).toBe("rate_limited");
    expect((await post("8.8.8.8")).status).toBe(202);
    expect(m.openTestDispute).toHaveBeenCalledTimes(4);
    expect(await db.testCaptures.get("CAP-9")).toMatchObject({ orderId: "ORD-9" });
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
    const ok = await post("PP-R-T", { action: "adjudicate", outcome: "SELLER_FAVOR" });
    expect(ok.status).toBe(200);
    expect(m.adjudicate).toHaveBeenCalledWith("PP-R-T", "SELLER_FAVOR");
    expect((await db.actions.listByCase("PP-R-T"))[0]).toMatchObject({ kind: "adjudicate", status: "executed" });
    expect((await db.audit.listByCase("PP-R-T")).map((a) => a.kind)).toEqual(["demo.adjudicate"]);

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
    m.executeApproved.mockImplementation(async (id: string) => db.actions.update(id, { status: "executed" }));
    const res = await approve.POST(req(`/api/actions/${a.id}/approve`, { method: "POST" }), params(a.id));
    expect(res.status).toBe(200);
    expect((await res.json()).action.status).toBe("executed");
    expect((await db.audit.listByCase("PP-R-A"))[0]).toMatchObject({ actor: "seller", kind: "action.approved" });
    const again = await deny.POST(req(`/api/actions/${a.id}/deny`, { method: "POST" }), params(a.id));
    expect(again.status).toBe(409);
    expect((await approve.POST(req(`/api/actions/x/approve`, { method: "POST" }), params("x"))).status).toBe(404);
  });

  it("denies locally when the agent module isn't deployed, but won't approve", async () => {
    m.approvalsLoaded = false;
    const a = await pending();
    expect((await approve.POST(req(`/api/actions/${a.id}/approve`, { method: "POST" }), params(a.id))).status).toBe(503);
    const res = await deny.POST(req(`/api/actions/${a.id}/deny`, { method: "POST", body: JSON.stringify({ note: "too much" }) }), params(a.id));
    expect((await res.json()).action.status).toBe("denied");
  });
});

describe("health", () => {
  it("reports booleans only", async () => {
    const body = await (await health.GET()).json();
    expect(body).toMatchObject({ ok: true, store: "memory", dbReachable: true });
    for (const v of Object.values(body.configured)) expect(typeof v).toBe("boolean");
  });
});
