// Live dependencies: W1's PayPal + evidence modules, W4's repo, Claude, spend caps.
import { getDb } from "../db";
import { buildEvidencePdf } from "../evidence/pdf";
import * as paypal from "../paypal";
import { createSpend } from "../spend";
import { resolveConfig } from "./config";
import { anthropicLlm } from "./llm";
import type { AgentDeps, OrderFacts, PaypalPort, TrackingInfo, TransactionFacts } from "./ports";

async function getOrderForCapture(captureId: string): Promise<OrderFacts | null> {
  let cap: paypal.Capture;
  try {
    cap = await paypal.getCapture(captureId);
  } catch (e) {
    if (e instanceof paypal.PayPalError && e.status === 404) return null;
    throw e;
  }
  if (!cap.orderId) return { captureId, items: [], paidAt: cap.createTime, amountCharged: cap.amount };
  const order = paypal.toOrderContext(await paypal.getOrder(cap.orderId));
  return { ...order, captureId, paidAt: cap.createTime ?? order.paidAt, amountCharged: order.amountCharged ?? cap.amount };
}

async function getTracking(captureId: string): Promise<TrackingInfo[]> {
  return (await paypal.getTracking(captureId)).map((t) => ({
    carrier: t.carrier,
    trackingNumber: t.trackingNumber,
    status: t.status,
    ...(t.status === "DELIVERED" && t.lastUpdated ? { deliveredAt: t.lastUpdated } : {}),
    ...(t.trackingUrl ? { trackingUrl: t.trackingUrl } : {}),
  }));
}

async function searchTransactions(q: { transactionId: string }): Promise<TransactionFacts[]> {
  return (await paypal.searchTransactions({ transactionId: q.transactionId })).map((t) => ({
    transactionId: t.transactionId,
    status: t.status,
    amount: t.amount,
    fee: t.fee,
    at: t.initiatedAt,
    eventCode: t.eventCode,
  }));
}

export function livePaypal(opts: { transactionSearch: boolean }): PaypalPort {
  return {
    getDispute: paypal.getDispute,
    getOrderForCapture,
    getTracking,
    ...(opts.transactionSearch ? { searchTransactions } : {}),
    sendMessage: paypal.sendMessage,
    makeOffer: paypal.makeOffer,
    provideEvidence: paypal.provideEvidence,
    acceptClaim: paypal.acceptClaim,
    acknowledgeReturn: paypal.acknowledgeReturn,
  };
}

export const liveEvidence: AgentDeps["evidence"] = {
  buildEvidencePdf: (input) => buildEvidencePdf({ ...input, amountCharged: input.order.amountCharged }),
};

export function liveDeps(): AgentDeps {
  const db = getDb();
  const config = resolveConfig();
  return {
    db,
    paypal: livePaypal({ transactionSearch: config.transactionSearch }),
    evidence: liveEvidence,
    llm: anthropicLlm(),
    spend: createSpend(db.spend),
    config,
  };
}
