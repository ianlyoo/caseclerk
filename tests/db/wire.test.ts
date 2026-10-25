// The wire log end to end through W1's real paypalFetch (fetch stubbed): the observer hook,
// origin/case attribution, the provide-evidence filing, and GET /api/wire.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRepo, setDbForTests, type Repo } from "@/lib/db";
import { disputeIdFromPath, withWire } from "@/lib/db/wire";
import { paypalFetch, setPayPalCallObserver } from "@/lib/paypal/client";
import { provideEvidence } from "@/lib/paypal/disputes";
import { mockPayPal } from "../paypal/helpers";
import { snapshot } from "./repo.contract";

const wireRoute = await import("@/app/api/wire/route");

let db: Repo;
beforeEach(() => {
  db = createMemoryRepo();
  setDbForTests(db);
});
afterEach(() => vi.unstubAllGlobals());

describe("PayPal call observer", () => {
  it("logs each call once with origin, case, path without query, status, debug id and duration", async () => {
    mockPayPal((c) => (c.path.startsWith("/v1/customer/disputes/PP-R-1") ? { json: { dispute_id: "PP-R-1" } } : undefined));
    await withWire({ origin: "seller" }, () => paypalFetch("/v1/customer/disputes/PP-R-1?fields=all"));
    await withWire({ origin: "cron", caseId: "PP-R-2" }, () => paypalFetch("/v2/checkout/orders", { method: "POST", body: "{}" }).catch(() => null));
    await paypalFetch("/v1/customer/disputes/PP-R-1");

    const [one, two] = [await db.wire.listByCase("PP-R-1"), await db.wire.listByCase("PP-R-2")];
    expect(one).toHaveLength(2);
    expect(one[0]).toMatchObject({ kind: "call", origin: "seller", method: "GET", path: "/v1/customer/disputes/PP-R-1", status: 200, debugId: "dbg-1" });
    expect(one[0].durationMs).toBeGreaterThanOrEqual(0);
    expect(one[1].origin).toBe("system"); // outside withWire
    expect(two).toEqual([expect.objectContaining({ origin: "cron", method: "POST", path: "/v2/checkout/orders", status: 404, debugId: "dbg-2" })]);
    const json = JSON.stringify([...one, ...two]);
    expect(json).not.toMatch(/fields=all|tok|Bearer|test-secret/);
  });

  it("logs network failures as status 0 and never lets a logging failure break the call", async () => {
    mockPayPal(() => ({ json: {} }));
    const ok = await withWire({ origin: "agent" }, () => paypalFetch("/v1/customer/disputes/PP-R-3"));
    expect(ok.status).toBe(200);

    vi.spyOn(db.wire, "append").mockRejectedValueOnce(new Error("db down"));
    await expect(paypalFetch("/v1/customer/disputes/PP-R-3")).resolves.toMatchObject({ status: 200 });

    const realFetch = globalThis.fetch;
    vi.stubGlobal("fetch", vi.fn(async (url: string | URL, init?: RequestInit) =>
      String(url).endsWith("/v1/oauth2/token") ? realFetch(url, init) : Promise.reject(new Error("offline")),
    ));
    await expect(withWire({ origin: "agent" }, () => paypalFetch("/v1/customer/disputes/PP-R-3"))).rejects.toMatchObject({ status: 0 });
    expect((await db.wire.listByCase("PP-R-3")).map((w) => w.status)).toEqual([200, 0]);
  });

  it("stores the exact evidence filing on the executing provide_evidence action", async () => {
    mockPayPal((c) => (c.path.endsWith("/provide-evidence") ? { json: { links: [] } } : undefined));
    await db.cases.upsertFromSnapshot(snapshot({ id: "PP-R-E" }));
    const action = await db.actions.insert({
      caseId: "PP-R-E", kind: "provide_evidence", params: { narrative: "n" }, rationale: "r", requiresApproval: false, status: "executing",
    });
    const r = await withWire({ origin: "agent", caseId: "PP-R-E" }, () =>
      provideEvidence("PP-R-E", {
        evidences: [{ evidenceType: "PROOF_OF_FULFILLMENT", notes: "Delivered 10/20 per USPS." }],
        files: [{ name: "caseclerk-evidence-PP-R-E.pdf", bytes: new Uint8Array([37, 80, 68, 70]), contentType: "application/pdf" }],
      }),
    );
    const a = await db.actions.get(action.id);
    expect(a?.params).toMatchObject({
      narrative: "n",
      filing: {
        input: { evidences: [expect.objectContaining({ evidence_type: "PROOF_OF_FULFILLMENT", notes: "Delivered 10/20 per USPS." })] },
        files: [{ field: "file1", name: "caseclerk-evidence-PP-R-E.pdf", size: 4, contentType: "application/pdf" }],
        httpStatus: r.status,
        debugId: r.debugId,
      },
    });
    const [row] = await db.wire.listByCase("PP-R-E");
    expect(row).toMatchObject({ origin: "agent", method: "POST", path: "/v1/customer/disputes/PP-R-E/provide-evidence" });
    expect(JSON.stringify(row)).not.toContain("Delivered"); // no bodies on the wire
  });

  it("reads dispute ids from paths", () => {
    expect(disputeIdFromPath("/v1/customer/disputes/PP-R-ABC-1/adjudicate")).toBe("PP-R-ABC-1");
    expect(disputeIdFromPath("/v1/customer/disputes")).toBeUndefined();
    expect(disputeIdFromPath("/v2/checkout/orders/X")).toBeUndefined();
  });
});

describe("GET /api/wire", () => {
  it("returns the latest 50 rows in time order, after since", async () => {
    const t0 = Date.parse("2026-10-25T00:00:00Z");
    for (let i = 0; i < 60; i++) {
      await db.wire.append({ kind: "call", origin: "agent", caseId: `PP-R-${i % 3}`, method: "GET", path: "/v1/x", status: 200, at: new Date(t0 + i * 1000).toISOString() });
    }
    const body = await (await wireRoute.GET(new Request("http://x/api/wire"))).json();
    expect(body.wire).toHaveLength(50);
    expect(body.wire[0].at).toBe(new Date(t0 + 10_000).toISOString());
    expect(body.wire[49].at).toBe(new Date(t0 + 59_000).toISOString());

    const since = new Date(t0 + 57_000).toISOString();
    const later = await (await wireRoute.GET(new Request(`http://x/api/wire?since=${encodeURIComponent(since)}`))).json();
    expect(later.wire.map((w: { at: string }) => w.at)).toEqual([58_000, 59_000].map((d) => new Date(t0 + d).toISOString()));
    expect((await wireRoute.GET(new Request("http://x/api/wire?since=yesterday"))).status).toBe(400);
  });
});

// Leave the observer to the module that registered it; this only proves the hook is optional.
describe("observer hook", () => {
  it("can be cleared", async () => {
    setPayPalCallObserver(null);
    mockPayPal(() => ({ json: {} }));
    await paypalFetch("/v1/customer/disputes/PP-R-9");
    expect(await db.wire.listByCase("PP-R-9")).toEqual([]);
  });
});
