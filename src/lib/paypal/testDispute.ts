// "Open test dispute": a realistic sandbox order from a small handmade-goods shop, shipped with
// tracking, then a card chargeback through the process-chargeback simulator. Sandbox only.
import type { Money, OrderContext } from "../types";
import { listDisputes } from "./disputes";
import { createPaidCardOrder, type OrderItemInput } from "./orders";
import { CHARGEBACK_REASON_CODES, processChargeback } from "./simulators";
import { addTracking, trackingUrl } from "./tracking";

export type TestScenario = "not_received" | "not_as_described" | "unauthorized";

export const TEST_SCENARIOS: Record<TestScenario, { label: string; reason: string; reasonCode: string }> = {
  not_received: { label: "Item not received", reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED", reasonCode: CHARGEBACK_REASON_CODES.not_received.reasonCode },
  not_as_described: { label: "Not as described", reason: "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED", reasonCode: CHARGEBACK_REASON_CODES.not_as_described.reasonCode },
  unauthorized: { label: "Unauthorized payment", reason: "UNAUTHORISED", reasonCode: CHARGEBACK_REASON_CODES.unauthorized.reasonCode },
};

export const SHOP_NAME = "Juniper & Clay Studio";

const usd = (value: string): Money => ({ currency_code: "USD", value });
const CATALOG: OrderItemInput[] = [
  { name: "Hand-thrown stoneware mug, speckled oat", sku: "JC-MUG-OAT", quantity: 1, unitAmount: usd("28.00"), description: "12 oz, wheel-thrown, food safe glaze" },
  { name: "Beeswax taper candles (pair)", sku: "JC-CDL-TPR", quantity: 1, unitAmount: usd("16.00"), description: "Hand-dipped, 10 in, unscented" },
  { name: "Block-printed linen tea towel, fern", sku: "JC-TWL-FRN", quantity: 1, unitAmount: usd("14.50"), description: "100% linen, hand block-printed" },
  { name: "Hand-carved walnut serving spoon", sku: "JC-SPN-WAL", quantity: 1, unitAmount: usd("22.00"), description: "Black walnut, oil finish, 11 in" },
  { name: "Ceramic ring dish, sage glaze", sku: "JC-DSH-SGE", quantity: 1, unitAmount: usd("12.00"), description: "3.5 in, wheel-thrown" },
];
const SHIPPING_FEE = usd("5.95");

function pick<T>(list: T[], n: number): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

/** USPS-style 22-digit tracking number (fictional). */
function uspsTrackingNumber(): string {
  let n = "9400111899";
  while (n.length < 22) n += Math.floor(Math.random() * 10);
  return n;
}

export type OpenTestDisputeResult = {
  scenario: TestScenario;
  disputeId?: string; // undefined when PayPal didn't list it in time; the webhook still links it by capture
  orderId: string;
  captureId: string;
  amount: Money;
  reasonCode: string;
  order: OrderContext;
  /** ms until the dispute could be read (GET by id, or list by capture as fallback). */
  resolvedAfterMs?: number;
  debugIds: { order?: string; tracking?: string; chargeback?: string };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Order (card, completes at once) → tracking on the capture → process-chargeback.
 * The simulator usually answers with the dispute id; otherwise we poll the list by capture
 * (listed after 42–70 s in the spike) for up to `waitMs`.
 */
export async function openTestDispute(o: { scenario: TestScenario; waitMs?: number; pollMs?: number }): Promise<OpenTestDisputeResult> {
  const sc = TEST_SCENARIOS[o.scenario];
  if (!sc) throw new Error(`openTestDispute: unknown scenario ${String(o.scenario)}`);
  const items = pick(CATALOG, Math.random() < 0.5 ? 1 : 2);
  const invoiceId = `JC-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  const order = await createPaidCardOrder({
    items,
    invoiceId,
    description: `${SHOP_NAME} order ${invoiceId}`,
    cardholderName: "Sandbox Buyer",
    shipping: {
      name: "Sandbox Buyer",
      amount: SHIPPING_FEE,
      address: { line1: "2211 N First St", city: "San Jose", state: "CA", postalCode: "95131", countryCode: "US" },
    },
  });

  const trackingNumber = uspsTrackingNumber();
  const tracking = await addTracking(order.captureId, {
    carrier: "USPS",
    trackingNumber,
    status: "DELIVERED",
    shipmentDate: new Date().toISOString().slice(0, 10),
  });

  const cb = await processChargeback({
    captureId: order.captureId,
    amount: order.amount,
    reasonCode: sc.reasonCode,
    cardBrand: CHARGEBACK_REASON_CODES[o.scenario].cardBrand,
    merchantId: order.merchantId,
  });

  const t0 = Date.now();
  let disputeId = (cb.json as { dispute_id?: string } | null)?.dispute_id;
  let resolvedAfterMs: number | undefined = disputeId ? 0 : undefined;
  const waitMs = o.waitMs ?? 90_000;
  while (!disputeId && Date.now() - t0 < waitMs) {
    await sleep(o.pollMs ?? 10_000);
    const { items: found } = await listDisputes({ disputedTransactionId: order.captureId });
    if (found[0]) {
      disputeId = found[0].id;
      resolvedAfterMs = Date.now() - t0;
    }
  }

  return {
    scenario: o.scenario,
    disputeId,
    orderId: order.orderId,
    captureId: order.captureId,
    amount: order.amount,
    reasonCode: sc.reasonCode,
    resolvedAfterMs,
    order: {
      orderId: order.orderId,
      captureId: order.captureId,
      items: items.map((i) => ({ name: i.name, quantity: i.quantity, unitAmount: i.unitAmount, description: i.description })),
      shipping: [{ carrier: "USPS", trackingNumber, status: "DELIVERED", trackingUrl: trackingUrl("USPS", trackingNumber) }],
      buyerCountry: "US",
      paidAt: order.createTime,
    },
    debugIds: { order: order.debugId, tracking: tracking.debugId, chargeback: cb.debugId },
  };
}
