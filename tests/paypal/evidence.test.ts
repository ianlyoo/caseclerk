import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { buildEvidencePdf, winAnsi } from "../../src/lib/evidence/pdf";
import { toSnapshot, type RawDispute } from "../../src/lib/paypal/disputes";
import { sampleEvidenceInput } from "./fixtures/evidence-input";
import inr from "./fixtures/inr-chargeback.json";

describe("buildEvidencePdf", () => {
  it("builds a 1-3 page PDF under 1 MB", { timeout: 20_000 }, async () => {
    const bytes = await buildEvidencePdf(sampleEvidenceInput(toSnapshot(inr as RawDispute)));
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.byteLength).toBeLessThan(1_000_000);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(doc.getPageCount()).toBeLessThanOrEqual(3);
    expect(doc.getTitle()).toContain("PP-R-PWR-10194441");
  });

  it("survives text the standard fonts can't encode", async () => {
    const input = sampleEvidenceInput(toSnapshot(inr as RawDispute));
    input.narrative = "Delivered → front porch ✅ 배송 완료. “Quoted” text — ok.";
    const bytes = await buildEvidencePdf(input);
    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(winAnsi("a → b ✅ “c”")).toBe('a -> b  "c"');
  });
});
