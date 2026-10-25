import { describe, expect, it } from "vitest";
import { applyPolicyToStrategy, expectedValues, processingFee } from "../../src/lib/agent/ev";
import { DEFAULT_CONFIG } from "../../src/lib/agent/config";
import { parseTriage, triageInput } from "../../src/lib/agent/triage";
import { unknownIdentifiers } from "../../src/lib/agent/facts";
import { DEFAULT_POLICY } from "../../src/lib/types";
import { snapshot } from "./fakes";

describe("expected values", () => {
  it("chargeback: losing costs amount + dispute fee + kept processing fee", () => {
    const ev = expectedValues({ amountUsd: 100, stage: "CHARGEBACK", winProbability: 0 });
    // 100 + 15 + (3.49 + 0.49) = 118.98, plus 10 min of seller time at $30/h
    expect(ev.fight).toBeCloseTo(-123.98, 2);
    expect(ev.refund).toBeCloseTo(-118.98 - 1, 2);
    expect(processingFee(100)).toBe(3.98);
  });

  it("fighting wins with strong odds; refunding wins on a small weak case", () => {
    expect(expectedValues({ amountUsd: 12, stage: "CHARGEBACK", winProbability: 0.8 }).best).toBe("fight");
    expect(expectedValues({ amountUsd: 12, stage: "INQUIRY", winProbability: 0.1 }).best).toBe("refund");
  });

  it("evaluates partial offers only at the inquiry stage", () => {
    expect(expectedValues({ amountUsd: 50, stage: "CHARGEBACK", winProbability: 0.3, offerShare: 0.3 }).offer).toBeUndefined();
    const ev = expectedValues({ amountUsd: 50, stage: "INQUIRY", winProbability: 0.3, offerShare: 0.3 });
    expect(ev.offer).toBeDefined();
  });

  it("policy turns a low-odds fight into the cheaper option, and leaves a good fight alone", () => {
    const low = expectedValues({ amountUsd: 12, stage: "CHARGEBACK", winProbability: 0.1 });
    expect(applyPolicyToStrategy("fight", low, 0.1, DEFAULT_POLICY, "CHARGEBACK").strategy).toBe("accept_claim");
    const high = expectedValues({ amountUsd: 12, stage: "CHARGEBACK", winProbability: 0.8 });
    expect(applyPolicyToStrategy("fight", high, 0.8, DEFAULT_POLICY, "CHARGEBACK")).toEqual({ strategy: "fight" });
  });
});

describe("triage", () => {
  it("never uses Opus for triage", () => {
    expect(DEFAULT_CONFIG.triageModel).not.toMatch(/opus/);
    expect(DEFAULT_CONFIG.agentModel).toBe("claude-opus-5-5");
    expect(DEFAULT_CONFIG.agentEffort).toBe("medium");
  });

  it("sends only reason, stage, amount and buyer text", () => {
    const s = snapshot({ messages: [{ postedBy: "BUYER", at: "2026-10-20T00:00:00Z", content: "Box arrived empty." }, { postedBy: "SELLER", at: "x", content: "seller text" }] });
    const t = triageInput(s);
    expect(t).toContain("Box arrived empty.");
    expect(t).not.toContain("seller text");
    expect(t).not.toContain(s.sellerTransactionId!);
  });

  it("parses structured output and falls back to other on unknown categories", () => {
    expect(parseTriage('{"category":"unauthorized","summary":" x "}')).toEqual({ category: "unauthorized", summary: "x" });
    expect(parseTriage('{"category":"weird","summary":"y"}').category).toBe("other");
    expect(() => parseTriage("nope")).toThrow();
  });
});

describe("fact check", () => {
  it("flags identifiers no tool returned and ignores dates and amounts", () => {
    const text = "Paid 12.00 USD on 2026-10-18, capture 2UN05916MP311444Y, UPS 1Z999AA10123456784.";
    expect(unknownIdentifiers(text, ["2UN05916MP311444Y"])).toEqual(["1Z999AA10123456784"]);
    expect(unknownIdentifiers(text, ["2UN05916MP311444Y", "1z999aa10123456784"])).toEqual([]);
  });
});
