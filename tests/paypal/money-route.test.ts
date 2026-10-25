// GET /api/cases/:id `money` over the in-memory repo, with the capture read mocked.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRepo, setDbForTests, type Repo } from "@/lib/db";
import { toSnapshot, type RawDispute } from "@/lib/paypal/disputes";

const m = vi.hoisted(() => ({ getCapture: vi.fn(), afterTasks: [] as (() => Promise<void>)[] }));
vi.mock("next/server", () => ({ after: (fn: () => Promise<void>) => m.afterTasks.push(fn) }));
vi.mock("@/lib/paypal/orders", () => ({ getCapture: m.getCapture }));

const caseOne = await import("@/app/api/cases/[id]/route");

const raw = JSON.parse(readFileSync(join(__dirname, "fixtures/snad-resolved-with-payout.json"), "utf8")) as RawDispute;
const usd = (value: string) => ({ currency_code: "USD", value });
const CAPTURE = {
  id: "2UN05916MP311444Y",
  status: "COMPLETED",
  amount: usd("12.00"),
  sellerReceivable: { gross: usd("12.00"), fee: usd("0.80"), net: usd("11.20") },
};
const get = async (id: string) => (await caseOne.GET(new Request(`http://x/api/cases/${id}`), { params: Promise.resolve({ id }) })).json();

let db: Repo;
let n = 0;
beforeEach(() => {
  db = createMemoryRepo();
  setDbForTests(db);
  vi.clearAllMocks();
  m.afterTasks.length = 0;
});

describe("GET /api/cases/:id money", () => {
  it("computes money for a resolved case once, then serves it from the cache", async () => {
    const id = `PP-R-MNY-${++n}`;
    await db.cases.upsertFromSnapshot(toSnapshot({ ...raw, dispute_id: id }));
    m.getCapture.mockResolvedValue(CAPTURE);
    const first = await get(id);
    expect(first.case.status).toBe("resolved");
    expect(first.money).toMatchObject({ gross: usd("12.00"), fee: usd("0.80"), net: usd("11.20"), kept: usd("11.20"), source: "paypal_fund_movements" });
    expect((await get(id)).money).toEqual(first.money);
    expect(m.getCapture).toHaveBeenCalledTimes(1);
    expect(await db.caseMoney.get(id)).toEqual(first.money);
  });

  it("is null on an open case, with no PayPal call", async () => {
    const id = `PP-R-MNY-${++n}`;
    await db.cases.upsertFromSnapshot(toSnapshot({ ...raw, dispute_id: id, status: "UNDER_REVIEW" }));
    expect((await get(id)).money).toBeNull();
    expect(m.getCapture).not.toHaveBeenCalled();
  });

  it("is null when PayPal doesn't state it, and isn't cached", async () => {
    const id = `PP-R-MNY-${++n}`;
    await db.cases.upsertFromSnapshot(toSnapshot({ ...raw, dispute_id: id }));
    m.getCapture.mockResolvedValue({ ...CAPTURE, sellerReceivable: undefined });
    expect((await get(id)).money).toBeNull();
    expect(await db.caseMoney.get(id)).toBeNull();
  });

  it("is null when the capture read fails; the case still loads, and retries wait a minute", async () => {
    const id = `PP-R-MNY-${++n}`;
    await db.cases.upsertFromSnapshot(toSnapshot({ ...raw, dispute_id: id }));
    m.getCapture.mockRejectedValue(new Error("PayPal GET → 503"));
    const body = await get(id);
    expect(body.case.id).toBe(id);
    expect(body.money).toBeNull();
    expect((await get(id)).money).toBeNull();
    expect(m.getCapture).toHaveBeenCalledTimes(1);
  });

  it("answers null after the wait budget and caches the late read in after()", async () => {
    vi.useFakeTimers();
    try {
      const id = `PP-R-MNY-${++n}`;
      await db.cases.upsertFromSnapshot(toSnapshot({ ...raw, dispute_id: id }));
      let release!: (v: unknown) => void;
      m.getCapture.mockReturnValue(new Promise((r) => (release = r)));
      const pending = get(id);
      await vi.advanceTimersByTimeAsync(4_000);
      expect((await pending).money).toBeNull();
      release(CAPTURE);
      for (const t of m.afterTasks.splice(0)) await t();
      expect(await db.caseMoney.get(id)).toMatchObject({ kept: usd("11.20") });
    } finally {
      vi.useRealTimers();
    }
  });
});
