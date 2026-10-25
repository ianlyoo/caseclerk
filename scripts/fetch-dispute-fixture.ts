// Saves a real sandbox dispute as a test fixture with buyer/seller PII replaced.
//   scripts/run.sh scripts/fetch-dispute-fixture.ts <dispute_id> <fixture-name>
import { writeFileSync } from "node:fs";
import { getDisputeRaw } from "../src/lib/paypal/disputes";

const [id, name] = process.argv.slice(2);
if (!id || !name) {
  console.error("usage: fetch-dispute-fixture.ts <dispute_id> <fixture-name>");
  process.exit(2);
}

const PII_KEYS: Record<string, string> = { name: "REDACTED NAME", email: "redacted@example.com", payer_id: "REDACTEDPAYER", phone: "REDACTED" };

/** Replaces PII-bearing fields inside buyer/seller objects and any address blocks. */
function strip(v: unknown, parent = ""): unknown {
  if (Array.isArray(v)) return v.map((x) => strip(x, parent));
  if (!v || typeof v !== "object") return v;
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v)) {
    if (/^(buyer|seller|payer|payee)$/.test(parent) && k in PII_KEYS) out[k] = PII_KEYS[k];
    else if (/address/i.test(k) && x && typeof x === "object") out[k] = { country_code: (x as { country_code?: string }).country_code ?? "US" };
    else if (k === "content" && parent === "messages") out[k] = x; // message text from sandbox is synthetic
    else out[k] = strip(x, k);
  }
  return out;
}

const { json, debugId } = await getDisputeRaw(id);
const path = new URL(`../tests/paypal/fixtures/${name}.json`, import.meta.url);
writeFileSync(path, JSON.stringify(strip(json), null, 2) + "\n");
console.log(`saved ${id} (${json.status}/${json.dispute_life_cycle_stage}, debug_id ${debugId}) → tests/paypal/fixtures/${name}.json`);
