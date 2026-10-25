// Opens a fresh sandbox chargeback for the live agent run: card order with one item → seller adds
// USPS tracking → process-chargeback (Visa C2 = not as described) → waits until the dispute is listed.
//   node --import ./eval/register.mjs eval/open-dispute.ts [amount]
// Prints ids and states only.
import { pp } from "./lib/paypal";

const MERCHANT_ID = process.env.PAYPAL_SANDBOX_MERCHANT_ID ?? "LNGYMM7567428";
const amount = process.argv[2] ?? "24.00";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Raw = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function main() {
  const order = await pp<Raw>(
    "POST",
    "/v2/checkout/orders",
    JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: `w2-live-${Date.now()}`,
          description: "CaseClerk live agent test",
          amount: { currency_code: "USD", value: amount, breakdown: { item_total: { currency_code: "USD", value: amount } } },
          items: [
            {
              name: "Ceramic pour-over coffee dripper",
              description: "Hand-glazed ceramic dripper, size 02, white",
              quantity: "1",
              unit_amount: { currency_code: "USD", value: amount },
              category: "PHYSICAL_GOODS",
            },
          ],
          shipping: {
            name: { full_name: "Sandbox Buyer" },
            address: { address_line_1: "1 Main St", admin_area_2: "San Jose", admin_area_1: "CA", postal_code: "95131", country_code: "US" },
          },
        },
      ],
      // PayPal's documented sandbox Visa test number; not a real card.
      payment_source: { card: { number: "4032039317984658", expiry: "2030-12", security_code: "123", name: "Sandbox Buyer" } },
    }),
    { "PayPal-Request-Id": `w2-live-${Date.now()}` },
  );
  const capture = order.json.purchase_units?.[0]?.payments?.captures?.[0];
  console.log(`order ${order.json.id} ${order.status} ${order.json.status}; capture ${capture?.id} ${capture?.status}`);
  if (!capture?.id) {
    const d = (order.json.details ?? []).map((x: Raw) => `${x.issue} ${x.field ?? ""}`).join("; ");
    throw new Error(`order failed: ${order.json.name ?? ""} ${d} (debug ${order.debugId})`);
  }

  const trackingNumber = `9400${String(Date.now()).slice(-10)}${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;
  const track = await pp<Raw>(
    "POST",
    `/v2/checkout/orders/${order.json.id}/track`,
    JSON.stringify({ capture_id: capture.id, tracking_number: trackingNumber, carrier: "USPS", notify_payer: false }),
  );
  console.log(`tracking added: ${track.status} (debug ${track.debugId})`);

  const now = new Date();
  const cb = await pp<Raw>(
    "POST",
    "/v2/customer-support/process-chargeback",
    JSON.stringify({
      adjacency: "PAYPAL",
      file_layout: "ATCK_CB",
      merchant_id: MERCHANT_ID,
      financial_institution: { processor: "FDMS" },
      transaction: { id_enc: capture.id, amount: { currency_code: "USD", value: amount } },
      instrument: { instrument_type: "CARD", card_brand: "VISA", credit_card_transaction_id: String(Date.now()), external: false },
      dispute: {
        id: null,
        stage: "CHARGEBACK",
        response_date: new Date(now.getTime() + 10 * 86400_000).toISOString(),
        status: "2",
        amount: { currency_code: "USD", value: amount },
        receive_date: now.toISOString(),
        event_code: "CHARGEBACK_INITIATED",
        money_movement_date: now.toISOString(),
        event_type: "DEBIT",
        chargeback_type: "REPORTED_TO_PROCESSOR",
        processor_info: { reference_number: String(Date.now()).padEnd(23, "0"), reason_code: "C2", notes: "TEST_MEMO" },
      },
    }),
  );
  console.log(`process-chargeback: ${cb.status} (debug ${cb.debugId})`);
  if (cb.status >= 300) throw new Error("chargeback simulator failed");

  const t0 = Date.now();
  while (Date.now() - t0 < 10 * 60_000) {
    await sleep(15_000);
    const list = await pp<Raw>("GET", `/v1/customer/disputes?disputed_transaction_id=${capture.id}`);
    const d = list.json.items?.[0];
    if (d) {
      console.log(`DISPUTE ${d.dispute_id} listed after ${Math.round((Date.now() - t0) / 1000)} s, status ${d.status}`);
      return;
    }
  }
  throw new Error("dispute not listed within 10 min");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
