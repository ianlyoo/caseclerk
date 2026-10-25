// Writes docs/samples/evidence-sample.pdf from a real (PII-stripped) sandbox dispute fixture.
//   node --import ./scripts/lib/register.mjs scripts/build-sample-evidence.ts   (no keys needed)
import { mkdirSync, writeFileSync } from "node:fs";
import { buildEvidencePdf } from "../src/lib/evidence/pdf";
import { toSnapshot, type RawDispute } from "../src/lib/paypal/disputes";
import { sampleEvidenceInput } from "../tests/paypal/fixtures/evidence-input";
import inr from "../tests/paypal/fixtures/inr-chargeback.json" with { type: "json" };

const bytes = await buildEvidencePdf(sampleEvidenceInput(toSnapshot(inr as RawDispute)));
const out = new URL("../docs/samples/evidence-sample.pdf", import.meta.url);
mkdirSync(new URL(".", out), { recursive: true });
writeFileSync(out, bytes);
console.log(`wrote docs/samples/evidence-sample.pdf (${bytes.byteLength} bytes)`);
