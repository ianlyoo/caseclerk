// Behaviour every Repo implementation must have. Run against memory always, Postgres when DATABASE_URL is set.
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_POLICY, type DisputeSnapshot } from "@/lib/types";
import type { Repo } from "@/lib/db";

export function snapshot(over: Partial<DisputeSnapshot> = {}): DisputeSnapshot {
  return {
    id: "PP-R-TEST-1",
    reason: "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED",
    status: "UNDER_REVIEW",
    stage: "CHARGEBACK",
    amount: { value: "12.00", currency_code: "USD" },
    createTime: "2026-10-25T02:33:14.000Z",
    updateTime: "2026-10-25T02:36:00.000Z",
    sellerResponseDueDate: "2026-11-04T02:33:14.000Z",
    sellerTransactionId: "CAP-1",
    messages: [],
    allowed: [],
    ...over,
  };
}

export function repoContract(name: string, make: () => Promise<Repo>, uniq: () => string) {
  describe(`repo contract: ${name}`, () => {
    let db: Repo;
    let u: string;
    beforeEach(async () => {
      db = await make();
      u = uniq();
    });

    it("upserts a new case, ignores stale snapshots, applies newer ones", async () => {
      const id = `PP-R-${u}`;
      const first = await db.cases.upsertFromSnapshot(snapshot({ id, sellerTransactionId: `CAP-${u}` }));
      expect(first).toMatchObject({ created: true, changed: true });
      expect(first.record).toMatchObject({ id, status: "new", isTestDispute: false });

      const stale = await db.cases.upsertFromSnapshot(
        snapshot({ id, status: "OPEN", updateTime: "2026-10-25T02:35:00.000Z" }),
      );
      expect(stale).toMatchObject({ created: false, changed: false });
      expect(stale.record.snapshot.status).toBe("UNDER_REVIEW");

      const dup = await db.cases.upsertFromSnapshot(snapshot({ id }));
      expect(dup.changed).toBe(false);

      await db.cases.setStatus(id, "waiting_on_paypal");
      const newer = await db.cases.upsertFromSnapshot(
        snapshot({ id, status: "WAITING_FOR_SELLER_RESPONSE", updateTime: "2026-10-25T02:37:04.000Z", allowed: ["provide_evidence"] }),
      );
      expect(newer).toMatchObject({ created: false, changed: true });
      expect(newer.record.status).toBe("waiting_on_paypal"); // agent-owned status kept
      expect(newer.record.snapshot.allowed).toEqual(["provide_evidence"]);

      const resolved = await db.cases.upsertFromSnapshot(
        snapshot({ id, status: "RESOLVED", outcome: "RESOLVED_WITH_PAYOUT", updateTime: "2026-10-25T02:54:34.000Z" }),
      );
      expect(resolved.record.status).toBe("resolved");
    });

    it("marks a case as test dispute when its capture was recorded", async () => {
      const cap = `CAP-T-${u}`;
      await db.testCaptures.record({ captureId: cap, orderId: `ORD-${u}`, scenario: "not_as_described" });
      await db.testCaptures.record({ captureId: cap, disputeId: `PP-R-T-${u}` });
      expect(await db.testCaptures.get(cap)).toMatchObject({ orderId: `ORD-${u}`, disputeId: `PP-R-T-${u}` });
      const r = await db.cases.upsertFromSnapshot(snapshot({ id: `PP-R-T-${u}`, sellerTransactionId: cap }));
      expect(r.record.isTestDispute).toBe(true);
    });

    it("sets triage, decision, order; lists with filters", async () => {
      const a = `PP-R-A-${u}`;
      const b = `PP-R-B-${u}`;
      await db.cases.upsertFromSnapshot(snapshot({ id: a, sellerTransactionId: `CAP-A-${u}` }));
      await db.cases.upsertFromSnapshot(snapshot({ id: b, status: "RESOLVED", sellerTransactionId: `CAP-B-${u}` }));
      const triage = { category: "not_as_described" as const, summary: "s", model: "claude-haiku-5-5", at: "2026-10-25T03:00:00.000Z" };
      expect((await db.cases.setTriage(a, triage))?.triage).toEqual(triage);
      const decision = {
        strategy: "fight" as const,
        winProbability: 0.7,
        expectedValueUsd: { fight: 8.4, refund: -12 },
        rationale: "tracking shows delivered",
        model: "claude-opus-5-5",
        at: "2026-10-25T03:01:00.000Z",
      };
      expect((await db.cases.setDecision(a, decision))?.decision).toEqual(decision);
      const order = { captureId: `CAP-A-${u}`, items: [{ name: "Mug", quantity: 1, unitAmount: { value: "12.00", currency_code: "USD" } }] };
      expect((await db.cases.setOrder(a, order))?.order).toEqual(order);
      expect(await db.cases.setStatus("PP-R-missing", "error")).toBeNull();

      const open = (await db.cases.list({ open: true })).map((c) => c.id);
      expect(open).toContain(a);
      expect(open).not.toContain(b);
      const closed = (await db.cases.list({ open: false })).map((c) => c.id);
      expect(closed).toContain(b);
      expect((await db.cases.list({ status: ["resolved"] })).map((c) => c.id)).toContain(b);
      const all = await db.cases.list({ limit: 500 });
      expect(all.findIndex((c) => c.id === a)).toBeLessThan(all.findIndex((c) => c.id === b)); // a updated last
    });

    it("inserts and updates actions with compare-and-set", async () => {
      const id = `PP-R-ACT-${u}`;
      await db.cases.upsertFromSnapshot(snapshot({ id }));
      const a = await db.actions.insert({
        caseId: id,
        kind: "refund_capture",
        params: { amount: "60.00" },
        rationale: "over threshold",
        amountUsd: 60,
        requiresApproval: true,
        status: "awaiting_approval",
      });
      expect(a.id).toMatch(/[0-9a-f-]{36}/);
      expect(a).toMatchObject({ status: "awaiting_approval", amountUsd: 60, requiresApproval: true });
      expect((await db.actions.listAwaitingApproval()).map((x) => x.id)).toContain(a.id);

      const ok = await db.actions.update(a.id, { status: "approved" }, { ifStatus: ["awaiting_approval"] });
      expect(ok?.status).toBe("approved");
      const again = await db.actions.update(a.id, { status: "approved" }, { ifStatus: ["awaiting_approval"] });
      expect(again).toBeNull();
      const done = await db.actions.update(a.id, { status: "executed", result: { httpStatus: 200, debugId: "abc" } });
      expect(done).toMatchObject({ status: "executed", result: { httpStatus: 200, debugId: "abc" } });

      const b = await db.actions.insert({ caseId: id, kind: "provide_evidence", params: {}, rationale: "", requiresApproval: false });
      expect(b.status).toBe("proposed");
      expect((await db.actions.listByCase(id)).map((x) => x.id)).toEqual([a.id, b.id]);
      expect(await db.actions.get(b.id)).toMatchObject({ kind: "provide_evidence" });
      expect(await db.actions.get("not-a-uuid")).toBeNull();
      expect((await db.actions.listAwaitingApproval()).map((x) => x.id)).not.toContain(a.id);
    });

    it("appends audit entries in timeline order", async () => {
      const id = `PP-R-AUD-${u}`;
      await db.audit.append({ caseId: id, actor: "paypal", kind: "webhook.received", summary: "one" });
      await db.audit.append({ caseId: id, actor: "agent", kind: "triage", summary: "two", costUsd: 0.0012, data: { model: "x" } });
      await db.audit.append({ caseId: id, actor: "system", kind: "x", summary: "three" });
      const rows = await db.audit.listByCase(id);
      expect(rows.map((r) => r.summary)).toEqual(["one", "two", "three"]);
      expect(rows[1]).toMatchObject({ costUsd: 0.0012, data: { model: "x" } });
      expect((await db.audit.listByCase(id, { limit: 2 })).map((r) => r.summary)).toEqual(["two", "three"]);
    });

    it("dedupes webhook events", async () => {
      const ev = `WH-${u}`;
      expect(await db.webhookEvents.insertIfNew(ev, { eventType: "CUSTOMER.DISPUTE.CREATED" })).toBe(true);
      expect(await db.webhookEvents.insertIfNew(ev)).toBe(false);
      await db.webhookEvents.remove(ev);
      expect(await db.webhookEvents.insertIfNew(ev)).toBe(true);
    });

    it("rate-limits per key in a fixed window", async () => {
      const key = `test:${u}`;
      const r = [];
      for (let i = 0; i < 4; i++) r.push(await db.rateLimit.hit(key, 3, 3600));
      expect(r.map((x) => x.allowed)).toEqual([true, true, true, false]);
      expect(r[3].count).toBe(4);
      expect((await db.rateLimit.hit(`other:${u}`, 3, 3600)).allowed).toBe(true);
    });

    it("holds a per-case lock and releases it", async () => {
      const id = `PP-R-LOCK-${u}`;
      let inner: unknown;
      const outer = await db.locks.withCaseLock(id, async () => {
        inner = await db.locks.withCaseLock(id, async () => "nope");
        return "yes";
      });
      expect(outer).toEqual({ acquired: true, value: "yes" });
      expect(inner).toEqual({ acquired: false });
      expect(await db.locks.withCaseLock(id, async () => 1)).toEqual({ acquired: true, value: 1 });
      await expect(db.locks.withCaseLock(id, async () => { throw new Error("boom"); })).rejects.toThrow("boom");
      expect((await db.locks.withCaseLock(id, async () => 2)).acquired).toBe(true);
    });

    it("stores the policy", async () => {
      const before = await db.policy.get();
      const p = { ...DEFAULT_POLICY, approvalAboveUsd: 75 + Math.floor(Math.random() * 10) };
      try {
        await db.policy.set(p);
        expect(await db.policy.get()).toEqual(p);
      } finally {
        await db.policy.set(before); // shared DBs keep the seller's real policy
      }
    });
  });
}
