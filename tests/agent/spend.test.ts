import { describe, expect, it } from "vitest";
import { costFromUsage, createSpend, readCaps, SpendCapError } from "../../src/lib/spend";
import { runAgentWith } from "../../src/lib/agent/run";
import { makeDeps, memoryDb, snapshot } from "./fakes";

describe("prices", () => {
  it("prices Opus 5.5 from usage incl. cache reads (0.05x) and 5-minute writes (1.25x)", () => {
    const usd = costFromUsage("claude-opus-5-5", {
      input_tokens: 1_000_000,
      output_tokens: 1_000_000,
      cache_read_input_tokens: 1_000_000,
      cache_creation_input_tokens: 1_000_000,
    });
    expect(usd).toBeCloseTo(4 + 20 + 0.2 + 5, 6);
  });

  it("prices 1-hour cache writes at 2x", () => {
    const usd = costFromUsage("claude-sonnet-5-5", {
      input_tokens: 0,
      output_tokens: 0,
      cache_creation_input_tokens: 1_000_000,
      cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 1_000_000 },
    });
    expect(usd).toBeCloseTo(4, 6);
  });

  it("prices Haiku 5.5 and its long-prompt tier", () => {
    expect(costFromUsage("claude-haiku-5-5", { input_tokens: 1_000_000 / 10, output_tokens: 0 })).toBeCloseTo(0.01, 6);
    // 200K prompt → $0.50/MTok tier
    expect(costFromUsage("claude-haiku-5-5", { input_tokens: 200_000, output_tokens: 0 })).toBeCloseTo(0.1, 6);
  });

  it("refuses unknown models instead of guessing a price", () => {
    expect(() => costFromUsage("claude-opus-4-1", { input_tokens: 1, output_tokens: 1 })).toThrow();
  });
});

describe("caps", () => {
  it("defaults to ARCHITECTURE.md and reads env overrides", () => {
    expect(readCaps({})).toEqual({ totalUsd: 45, dailyUsd: 4, runsPerDay: 60, testDisputesPerIpPerDay: 3 });
    expect(readCaps({ SPEND_CAP_DAILY_USD: "1.5", AGENT_RUNS_PER_DAY: "10", SPEND_CAP_TOTAL_USD: "nope" })).toMatchObject({
      dailyUsd: 1.5,
      runsPerDay: 10,
      totalUsd: 45,
    });
  });

  it("reserve() throws over the daily cap, counting in-flight reservations", async () => {
    const db = memoryDb();
    const spend = createSpend(db.spend, { totalUsd: 45, dailyUsd: 1, runsPerDay: 60, testDisputesPerIpPerDay: 3 });
    const r1 = await spend.reserve(0.6);
    await expect(spend.reserve(0.6)).rejects.toBeInstanceOf(SpendCapError);
    spend.release(r1);
    await expect(spend.reserve(0.6)).resolves.toBeTruthy();
  });

  it("startRun() stops at the runs-per-day cap", async () => {
    const db = memoryDb();
    const spend = createSpend(db.spend, { totalUsd: 45, dailyUsd: 4, runsPerDay: 2, testDisputesPerIpPerDay: 3 });
    await spend.startRun("a");
    await spend.startRun("b");
    await expect(spend.startRun("c")).rejects.toMatchObject({ cap: "runs" });
  });
});

describe("over a cap the agent makes no LLM call and replays a stored run", () => {
  it("daily cap spent → zero model requests, replay rendered in the timeline", async () => {
    const { deps, db, llm, paypal } = makeDeps({ snap: snapshot(), turns: [], caps: { dailyUsd: 4 } });
    db.seed(snapshot());
    await db.spend.add({ kind: "llm", costUsd: 4 });

    const out = await runAgentWith(deps, "PP-R-TST-10000001", { kind: "webhook", eventType: "CUSTOMER.DISPUTE.CREATED" });

    expect(out.status).toBe("replayed");
    expect(llm.requests).toHaveLength(0);
    expect(paypal.calls.filter((c) => c.name !== "getDispute")).toHaveLength(0);
    const kinds = db._audit.map((e) => e.kind);
    expect(kinds).toContain("spend.blocked");
    expect(kinds).toContain("replay.start");
    expect(kinds.filter((k) => k.startsWith("replay.")).length).toBeGreaterThan(2);
    const c = await db.cases.get("PP-R-TST-10000001");
    expect(c?.decision?.model).toMatch(/^replay of claude-opus-5-5/);
    expect(c?.triage?.model).toBe("replay");
    // A replay spends nothing now: no costUsd on its timeline entries (the recorded cost is data).
    expect(db._audit.filter((e) => e.costUsd)).toHaveLength(0);
    expect(db._audit.some((e) => typeof e.data?.recordedCostUsd === "number")).toBe(true);
  });

  it("runs-per-day cap → no LLM call", async () => {
    const { deps, db, llm } = makeDeps({ snap: snapshot(), turns: [], caps: { runsPerDay: 0 } });
    db.seed(snapshot());
    const out = await runAgentWith(deps, "PP-R-TST-10000001", { kind: "manual" });
    expect(out.status).toBe("replayed");
    expect(llm.requests).toHaveLength(0);
  });

  it("a cap reached mid-run stops before the next call", async () => {
    // Triage costs ~$0.0004; the Opus reservation (~$0.15) no longer fits a $0.05 daily cap.
    const { deps, db, llm } = makeDeps({
      snap: snapshot(),
      turns: [{ text: JSON.stringify({ category: "not_as_described", summary: "x" }) }],
      caps: { dailyUsd: 0.05 },
    });
    db.seed(snapshot());
    const out = await runAgentWith(deps, "PP-R-TST-10000001", { kind: "manual" });
    expect(out.status).toBe("replayed");
    expect(llm.requests).toHaveLength(1);
    expect(llm.requests[0].model).toBe("claude-haiku-5-5");
  });
});
