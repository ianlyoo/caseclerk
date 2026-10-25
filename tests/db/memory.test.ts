import { describe, expect, it } from "vitest";
import { createMemoryRepo } from "@/lib/db";
import { repoContract } from "./repo.contract";
import { DEFAULT_POLICY } from "@/lib/types";

let n = 0;
repoContract("memory", async () => createMemoryRepo(), () => `M${++n}`);

describe("memory repo specifics", () => {
  it("returns the default policy until one is set", async () => {
    expect(await createMemoryRepo().policy.get()).toEqual(DEFAULT_POLICY);
  });

  it("totals spend for today and all time", async () => {
    const db = createMemoryRepo();
    await db.spend.add({ kind: "llm", costUsd: 0.5, at: "2020-01-01T00:00:00.000Z" });
    await db.spend.add({ kind: "llm", costUsd: 0.25 });
    await db.spend.add({ kind: "run", costUsd: 0 });
    await db.spend.add({ kind: "run", costUsd: 0, at: "2020-01-01T00:00:00.000Z" });
    expect(await db.spend.totals()).toEqual({ totalUsd: 0.75, todayUsd: 0.25, runsToday: 1 });
  });

  it("returns copies, not live references", async () => {
    const db = createMemoryRepo();
    const { record } = await db.cases.upsertFromSnapshot({
      id: "PP-R-COPY", reason: "x", status: "OPEN", stage: "CHARGEBACK", amount: { value: "1.00", currency_code: "USD" },
      createTime: "2026-10-25T00:00:00Z", updateTime: "2026-10-25T00:00:00Z", messages: [], allowed: [],
    });
    record.snapshot.allowed.push("adjudicate");
    expect((await db.cases.get("PP-R-COPY"))?.snapshot.allowed).toEqual([]);
  });
});
