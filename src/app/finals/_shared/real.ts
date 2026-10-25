// The one real run: PayPal sandbox dispute PP-R-JKB-10194463, recorded Oct 25, 2026 (UTC times).
// Copied from https://caseclerk.vercel.app/api/cases/PP-R-JKB-10194463. Every id below came back from PayPal.
// This is the only traffic either final may show as real. It has no RESOLVED webhook: the seller-favour
// ruling was requested with the sandbox simulator and PayPal still reports UNDER_REVIEW. Don't claim a win.

import type { WireLine } from "./cases";

export const REAL_ID = "PP-R-JKB-10194463";
export const REAL_URL = "https://caseclerk.vercel.app/api/cases/PP-R-JKB-10194463";

export const REAL = {
  id: REAL_ID,
  stage: "CHARGEBACK",
  status: "UNDER_REVIEW",
  reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
  amount: "17.95",
  createdAt: "2026-10-25T04:31:40.083Z",
  updatedAt: "2026-10-25T05:18:04.029Z",
  isTestDispute: true,
  item: { name: "Ceramic ring dish, sage glaze", detail: "3.5 in, wheel-thrown", unit: "12.00" },
  orderId: "4DF014412V694000N",
  captureId: "4LL39547DW370724C",
  paidAt: "2026-10-25T04:31:36Z",
  buyerCountry: "US",
  shipment: { carrier: "USPS", tracking: "9400111899972441749681", status: "SHIPPED" },
  /** The agent's two decisions, as recorded. EVs are what each choice costs the seller on average. */
  decisions: [
    { at: "2026-10-25T04:36:24.939Z", strategy: "fight", winPct: 65, evFight: "-16.92", evRefund: "-35.07", why: "USPS showed DELIVERED." },
    { at: "2026-10-25T04:57:28.081Z", strategy: "fight", winPct: 30, evFight: "-28.85", evRefund: "-35.07", why: "PayPal asked again; USPS now shows SHIPPED, not DELIVERED." },
  ],
  /** The model cost of the two agent runs, USD. Never on the Wire. */
  runCostUsd: [0.0517, 0.0597],
  /** The evidence PayPal received in the second filing (the PDF exhibits and the letter). */
  exhibits: [
  {
    "body": "Order 4DF014412V694000N, capture 4LL39547DW370724C. 1 x Ceramic ring dish, sage glaze (3.5 in, wheel-thrown), unit USD 12.00. Total charged USD 17.95. Buyer country: US. Paid 2026-10-25T04:31:36Z.",
    "title": "Order details"
  },
  {
    "body": "Carrier: USPS. Tracking number: 9400111899972441749681. Status: SHIPPED. URL: https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899972441749681",
    "title": "Shipment and tracking"
  },
  {
    "body": "2026-10-25 04:31:36 UTC payment captured. 2026-10-25 04:31:40 UTC chargeback opened (not received). No buyer messages on the dispute.",
    "title": "Timeline"
  }
] as { title: string; body: string }[],
  letter: "On 2026-10-25 at 04:31:36 UTC the buyer, located in the US, paid USD 17.95 (capture 4LL39547DW370724C, order 4DF014412V694000N) for one Ceramic ring dish, sage glaze (3.5 in, wheel-thrown), with a unit price of USD 12.00. The card issuer opened this chargeback (reason: merchandise not received) at 04:31:40 UTC the same day, four seconds after payment. That left no reasonable time for the item to ship or arrive before the claim was filed.\n\nThe seller shipped the order with USPS and added tracking number 9400111899972441749681 to this PayPal transaction. The carrier currently shows the shipment status as SHIPPED. The package is in the USPS network on its way to the buyer, and the tracking link is https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899972441749681. We do not have a delivery signature for this shipment.\n\nThe buyer sent the seller no message about the order before or after the chargeback. The item was ordered, paid for and handed to the carrier with tracking. The claim was filed before delivery could reasonably occur, so it is premature. We ask the issuer to rule for the seller, or to let the buyer receive the shipment that is already in transit.",
};

/** PayPal traffic for the real run, oldest first. Webhooks carry the event id, our calls PayPal's debug id. */
export const REAL_WIRE: WireLine[] = [
  { at: "2026-10-25T04:35:07.753Z", dir: "in", name: "CUSTOMER.DISPUTE.CREATED", status: "UNDER_REVIEW", path: "CUSTOMER.DISPUTE.CREATED", eventId: "WH-76E27498RC817000W-87748504UX535252T", origin: "paypal" },
  { at: "2026-10-25T04:36:07.661Z", dir: "in", name: "CUSTOMER.DISPUTE.UPDATED", status: "WAITING_FOR_SELLER_RESPONSE", path: "CUSTOMER.DISPUTE.UPDATED", eventId: "WH-82P84727SV255314P-65M51596N69169432", origin: "paypal" },
  { at: "2026-10-25T04:36:37.072Z", dir: "out", name: "Provide evidence", status: "200", path: "POST /v1/customer/disputes/PP-R-JKB-10194463/provide-evidence", debugId: "f2739769e12a1", origin: "paypal" },
  { at: "2026-10-25T04:37:07.631Z", dir: "in", name: "CUSTOMER.DISPUTE.UPDATED", status: "UNDER_REVIEW", path: "CUSTOMER.DISPUTE.UPDATED", eventId: "WH-60X945983W072284S-9SU6879991981894S", origin: "paypal" },
  { at: "2026-10-25T04:55:53.821Z", dir: "out", name: "Sandbox: require evidence", status: "200", path: "POST /v1/customer/disputes/PP-R-JKB-10194463/require-evidence", debugId: "ca4fea1a69b06", origin: "paypal" },
  { at: "2026-10-25T04:57:07.895Z", dir: "in", name: "CUSTOMER.DISPUTE.UPDATED", status: "WAITING_FOR_SELLER_RESPONSE", path: "CUSTOMER.DISPUTE.UPDATED", eventId: "WH-73R3763303020580L-4FV00469AK752882S", origin: "paypal" },
  { at: "2026-10-25T04:57:39.896Z", dir: "out", name: "Provide evidence", status: "200", path: "POST /v1/customer/disputes/PP-R-JKB-10194463/provide-evidence", debugId: "f2843364d3500", origin: "paypal" },
  { at: "2026-10-25T04:58:07.960Z", dir: "in", name: "CUSTOMER.DISPUTE.UPDATED", status: "UNDER_REVIEW", path: "CUSTOMER.DISPUTE.UPDATED", eventId: "WH-48X11126LU253151C-03X82557EM479451K", origin: "paypal" },
  { at: "2026-10-25T05:16:27.056Z", dir: "out", name: "Sandbox: adjudicate, seller favour", status: "200", path: "POST /v1/customer/disputes/PP-R-JKB-10194463/adjudicate", debugId: "f1407090def3a", origin: "paypal" },
  { at: "2026-10-25T05:18:38.329Z", dir: "in", name: "CUSTOMER.DISPUTE.UPDATED", status: "UNDER_REVIEW", path: "CUSTOMER.DISPUTE.UPDATED", eventId: "WH-9D6531042X159772H-0RT84328VL704925U", origin: "paypal" },
];

/** The last verified webhook of the real run. */
export const REAL_LAST = REAL_WIRE.filter((l) => l.dir === "in").at(-1)!;
