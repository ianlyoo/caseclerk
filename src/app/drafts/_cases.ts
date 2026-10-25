// Per-case detail for the draft case pages: timeline, decision, approval, outcome.
// Three cases are written out in full (Daniel: approval, Sam: agent working, Hannah: won);
// the rest are built from their inbox row so every row opens its own case.

import { CASES, HERO, HERO_ID, NOW, OUTCOME_LABEL, REASON_LABEL, usd, type InboxCase } from "./_data";

export type Step = {
  at: string;
  actor: "paypal" | "agent" | "tool" | "seller" | "system";
  title: string; // what happened
  detail?: string; // the result
  code?: string; // request, event or model, set in mono
  costUsd?: number;
  pending?: boolean;
};

export type Option = { key: string; name: string; math: string; ev: string; chosen: boolean };

export type Decision = {
  headline: string; // the recommendation as one sentence
  rationale: string;
  model: string;
  at: string;
  options: Option[];
  valueNote?: string; // what a returned item is worth, when an option brings it back
};

export type Approval = {
  amount: string;
  kind: "make_offer" | "accept_claim";
  label: string; // "$180.00 partial refund"
  why: string; // the policy line it crosses
  note: string; // what PayPal sends the buyer
  endpoint: string; // the PayPal call made on approval
  debugId: string; // fixture debug id PayPal returns
};

export type CaseDetail = {
  c: InboxCase;
  title: string; // short: buyer and item
  headline: string; // one sentence that states the case
  steps: Step[];
  live: { event: string; at: string; debugId: string };
  decision?: Decision;
  approval?: Approval;
  working?: string; // what the agent is doing right now
  outcome?: { line: string; kept: string };
  exhibits?: { ref: string; name: string; detail: string }[];
  exhibitsNote?: string;
  pages?: boolean; // the PDF page previews exist (hero only)
  did?: string; // one sentence: what the agent did to reach the recommendation
};

const at = (iso: string, plusSeconds: number) => new Date(Date.parse(iso) + plusSeconds * 1000).toISOString();

// ---- Daniel Okafor, needs approval ----

const daniel: CaseDetail = {
  c: CASES.find((c) => c.id === HERO_ID)!,
  title: "Daniel Okafor, Olympus OM-1n with Zuiko 50mm f/1.8",
  headline: "Daniel Okafor says the Olympus OM-1n he bought is not as described.",
  live: { event: "CUSTOMER.DISPUTE.UPDATED", at: "2026-10-25T09:56:40-07:00", debugId: "7f3a91c2e04b8" },
  decision: {
    headline: "Offer Daniel $180.00 and let him keep the camera.",
    rationale:
      "Daniel's video shows the slow speeds sticking, so the test roll no longer wins this. Offering and fighting are close; the offer settles it this week, while a fight takes 30 days or more and brings back a camera that needs service.",
    model: "claude-opus-5-5",
    at: "2026-10-25T09:56:58-07:00",
    options: [
      {
        key: "offer",
        name: "Offer $180.00, he keeps the camera",
        math: "85% he accepts and you keep $232.00; otherwise you fight",
        ev: "229.89",
        chosen: true,
      },
      {
        key: "fight",
        name: "Fight with the evidence pack",
        math: "34% you keep $412.00; 66% you refund and he returns the camera at his cost",
        ev: "217.96",
        chosen: false,
      },
      {
        key: "refund",
        name: "Refund $412.00 now, camera comes back",
        math: "Camera's value to you, less the $46.80 return label",
        ev: "71.20",
        chosen: false,
      },
    ],
    valueNote:
      "A returned camera is worth $118.00 to you: $240.00 resale after a $95.00 shutter service, less $27.00 selling fees.",
  },
  approval: {
    amount: "180.00",
    kind: "make_offer",
    label: "$180.00 offer",
    why: "Above your $50.00 approval line, within your 45% offer cap.",
    note: "Hi Daniel, thanks for the video. Keep the camera and we'll refund $180.00 toward a shutter service. If you'd still rather send it back, say so and we'll email a prepaid label.",
    endpoint: "POST /v1/customer/disputes/PP-R-NKT-10227591/make-offer",
    debugId: "3c81e0f5a9d27",
  },
  exhibits: HERO.evidence.exhibits,
  exhibitsNote: "Ready if Daniel declines the offer.",
  did: "The agent read the dispute, the order, your PayPal tracking and UPS delivery, asked Daniel for a video, then priced three options.",
  pages: true,
  steps: [
    { at: "2026-10-23T16:47:12-07:00", actor: "paypal", title: "Dispute opened", code: "CUSTOMER.DISPUTE.CREATED", detail: "Webhook signature verified, event WH-4KX09214BV538122L." },
    { at: "2026-10-23T16:47:13-07:00", actor: "tool", title: "Read the dispute", code: "GET /v1/customer/disputes/PP-R-NKT-10227591", detail: "200, debug id 51ab07e93c2f4. Inquiry, waiting for your response, due Nov 2. PayPal allows a message, an offer or accepting the claim." },
    { at: "2026-10-23T16:47:16-07:00", actor: "agent", title: "Triage: not as described", code: "claude-haiku-5-5", detail: "Sticking shutter at slow speeds and lens haze; asks to return or refund.", costUsd: 0.0009 },
    { at: "2026-10-23T16:47:18-07:00", actor: "tool", title: "Found the order", code: "GET /v2/checkout/orders/5O190127TN364715T", detail: "200. Paid Oct 9: body $289.00, lens $85.00, shipping $38.00." },
    { at: "2026-10-23T16:47:19-07:00", actor: "tool", title: "Read the tracking you added on PayPal", code: "GET /v1/shipping/trackers/8MC585209K746392H-1ZA6W4410367092155", detail: "200. UPS 1ZA6W4410367092155, added Oct 10, status SHIPPED." },
    { at: "2026-10-23T16:47:20-07:00", actor: "tool", title: "Checked delivery with UPS", code: "UPS Track API, 1ZA6W4410367092155", detail: "Delivered Oct 14, 11:02 am in Toronto, signed OKAFOR." },
    { at: "2026-10-23T16:47:21-07:00", actor: "tool", title: "Looked up the buyer", code: "GET /v1/reporting/transactions", detail: "200. 2 earlier orders (Mar 2024, Jun 2025), no disputes." },
    { at: "2026-10-23T16:47:41-07:00", actor: "agent", title: "Decided to ask for a video first", code: "claude-opus-5-5", detail: "The test roll supports the listing; the report is specific. Ask before offering money. Win estimate 52%.", costUsd: 0.0391 },
    { at: "2026-10-23T16:47:53-07:00", actor: "tool", title: "Sent Daniel a message", code: "POST /v1/customer/disputes/PP-R-NKT-10227591/send-message", detail: "200, debug id 7f3a91c2e04b8. No money involved, so no approval needed.", costUsd: 0.0124 },
    { at: "2026-10-25T09:56:40-07:00", actor: "paypal", title: "Daniel replied with a video", code: "CUSTOMER.DISPUTE.UPDATED", detail: "“1/8 and 1/4 both stick. If you knocked something off I'd keep it.”" },
    { at: "2026-10-25T09:56:58-07:00", actor: "agent", title: "Recommends a $180.00 partial refund", code: "claude-opus-5-5", detail: "Win estimate down to 34%. Offering keeps $229.89 on average, fighting $217.96, refunding now $71.20.", costUsd: 0.0462 },
    { at: "2026-10-25T09:57:14-07:00", actor: "agent", title: "Built the evidence pack, in case he declines", code: "pdf-lib, 4 pages", detail: "Letter, order and listing, UPS delivery, test roll scans.", costUsd: 0.0318 },
  ],
};

// ---- Grace Holloway, needs approval (small refund) ----

const graceRow = CASES.find((c) => c.id === "PP-R-TVA-10227066")!;
const grace: CaseDetail = {
  c: graceRow,
  title: "Grace Holloway, Kodak Portra 400, pack of 5",
  headline: "Grace Holloway says her Portra 400 never arrived.",
  live: { event: "CUSTOMER.DISPUTE.CREATED", at: "2026-10-19T18:40:12-07:00", debugId: "9b07d1e44a3c6" },
  decision: {
    headline: "Refund Grace $74.95 and claim it back from USPS.",
    rationale:
      "USPS hasn't scanned the parcel since Oct 12 in Charlotte, so there is no proof of delivery to show PayPal. Ground Advantage includes $100.00 of insurance; a lost-parcel claim usually pays out in 2 to 3 weeks.",
    model: "claude-opus-5-5",
    at: "2026-10-24T08:15:00-07:00",
    options: [
      { key: "refund", name: "Refund $74.95, file a USPS claim", math: "80% USPS pays the $74.95 back", ev: "59.96", chosen: true },
      { key: "fight", name: "Fight without a delivery scan", math: "5% PayPal sides with you", ev: "3.75", chosen: false },
    ],
  },
  approval: {
    amount: "74.95",
    kind: "accept_claim",
    label: "$74.95 full refund",
    why: "Above your $50.00 approval line.",
    note: "Hi Grace, sorry, the film looks lost with USPS. We've refunded the full $74.95; if the parcel turns up, keep it.",
    endpoint: "POST /v1/customer/disputes/PP-R-TVA-10227066/accept-claim",
    debugId: "e2c94a1078bd5",
  },
  did: "The agent read the dispute, the order and USPS tracking, then priced refunding against fighting.",
  steps: [],
};

// ---- Sam Whitfield, agent working ----

const samRow = CASES.find((c) => c.id === "PP-R-PLZ-10225917")!;
const sam: CaseDetail = {
  c: samRow,
  title: "Sam Whitfield, Rollei 35 S with Sonnar 40mm f/2.8",
  headline: "Sam Whitfield's bank says the Rollei 35 S he bought is not as described.",
  live: { event: "CUSTOMER.DISPUTE.UPDATED", at: "2026-10-25T10:31:05-07:00", debugId: "0d6f2b8c91e47" },
  working: "Writing the evidence letter. It goes to PayPal without asking you, because fighting moves no money.",
  decision: {
    headline: "Fight it: the listing and the meter test answer both points.",
    rationale:
      "The meter was tested against a handheld meter before shipping, and four listing photos show the front element clean at an angle. Sam sent his bank no photos.",
    model: "claude-opus-5-5",
    at: "2026-10-25T10:29:40-07:00",
    options: [
      { key: "fight", name: "Fight with evidence", math: "71% you keep $318.50; the $20.00 chargeback fee either way", ev: "206.14", chosen: true },
      { key: "accept", name: "Accept the chargeback", math: "Lose $318.50 and the $20.00 fee", ev: "-20.00", chosen: false },
    ],
  },
  exhibits: [
    { ref: "A", name: "Order receipt", detail: "Order 2KT55803BN219443X, paid Sep 30, $318.50" },
    { ref: "B", name: "UPS proof of delivery", detail: "1ZA6W4416603418279, delivered Oct 8, Leeds" },
    { ref: "C", name: "Listing as published", detail: "Archived Sep 28, 4 photos of the lens" },
    { ref: "D", name: "Meter test", detail: "Side-by-side readings with a Sekonic L-308, Sep 29" },
  ],
  exhibitsNote: "Being assembled now.",
  steps: [
    { at: "2026-10-16T13:22:09-07:00", actor: "paypal", title: "Chargeback opened", code: "CUSTOMER.DISPUTE.CREATED", detail: "Webhook signature verified. Card network reason 13.3, PayPal reason MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED." },
    { at: "2026-10-16T13:22:10-07:00", actor: "tool", title: "Read the dispute", code: "GET /v1/customer/disputes/PP-R-PLZ-10225917", detail: "200, debug id a41c7e0592bd3. Chargeback, under review by PayPal." },
    { at: "2026-10-16T13:22:13-07:00", actor: "agent", title: "Triage: not as described", code: "claude-haiku-5-5", detail: "Meter not working and a lens scratch not shown in photos.", costUsd: 0.0008 },
    { at: "2026-10-16T13:22:15-07:00", actor: "tool", title: "Read the tracking you added on PayPal", code: "GET /v1/shipping/trackers/6TN81204XA593120K-1ZA6W4416603418279", detail: "200. UPS 1ZA6W4416603418279, added Oct 1, status SHIPPED." },
    { at: "2026-10-16T13:22:16-07:00", actor: "tool", title: "Checked delivery with UPS", code: "UPS Track API, 1ZA6W4416603418279", detail: "Delivered Oct 8, 10:41 am in Leeds." },
    { at: "2026-10-16T13:22:30-07:00", actor: "agent", title: "Waiting for PayPal to open evidence", detail: "PayPal doesn't accept evidence on a new chargeback for a few minutes; the agent picks it up on the next update." },
    { at: "2026-10-25T10:31:05-07:00", actor: "paypal", title: "PayPal asked for your evidence", code: "CUSTOMER.DISPUTE.UPDATED", detail: "Status WAITING_FOR_SELLER_RESPONSE, due Oct 26. Requested: PROOF_OF_FULFILLMENT, OTHER." },
    { at: "2026-10-25T10:32:40-07:00", actor: "agent", title: "Decided to fight", code: "claude-opus-5-5", detail: "Win estimate 71%. Fighting keeps $206.14 on average, accepting loses $20.00.", costUsd: 0.0447 },
    { at: "2026-10-25T10:36:00-07:00", actor: "agent", title: "Writing the evidence letter", code: "claude-opus-5-5", detail: "Meter tested before shipping; 4 listing photos show the lens.", pending: true },
  ],
};

// ---- Hannah Cole, won ----

const hannahRow = CASES.find((c) => c.id === "PP-R-RBN-10224961")!;
const hannah: CaseDetail = {
  c: hannahRow,
  title: "Hannah Cole, Canon AE-1 Program with FD 50mm f/1.8",
  headline: "PayPal decided Hannah Cole's not-received chargeback in your favour.",
  live: { event: "CUSTOMER.DISPUTE.RESOLVED", at: "2026-10-22T06:02:11-07:00", debugId: "c7e3105ab84f2" },
  outcome: {
    line: "PayPal released the $289.00 it was holding. Nothing went back to the buyer.",
    kept: "289.00",
  },
  decision: {
    headline: "Fight it: USPS and Australia Post both show delivery to her address.",
    rationale: "Delivery scan Sep 26 in Melbourne to the address on the PayPal transaction; no signature, but the customs record and the delivery scan match.",
    model: "claude-opus-5-5",
    at: "2026-10-03T08:40:22-07:00",
    options: [
      { key: "fight", name: "Fight with evidence", math: "78% you keep $289.00; the $20.00 chargeback fee either way", ev: "205.42", chosen: true },
      { key: "accept", name: "Accept the chargeback", math: "Lose $289.00 and the $20.00 fee", ev: "-20.00", chosen: false },
    ],
  },
  exhibits: [
    { ref: "A", name: "Order receipt", detail: "Order 7HF20488WL936512C, paid Sep 17, $289.00" },
    { ref: "B", name: "Delivery scan", detail: "USPS CP610472859US, Australia Post delivered Sep 26, Melbourne VIC 3056" },
    { ref: "C", name: "Customs declaration", detail: "CN23, declared value $265.00, cleared Sep 24" },
  ],
  exhibitsNote: "Submitted Oct 3 with provide-evidence.",
  steps: [
    { at: "2026-10-02T21:14:08-07:00", actor: "paypal", title: "Chargeback opened", code: "CUSTOMER.DISPUTE.CREATED", detail: "Webhook signature verified. PayPal reason MERCHANDISE_OR_SERVICE_NOT_RECEIVED." },
    { at: "2026-10-02T21:14:09-07:00", actor: "tool", title: "Read the dispute", code: "GET /v1/customer/disputes/PP-R-RBN-10224961", detail: "200, debug id 4e0b9a7c13d58. Chargeback, $289.00 held." },
    { at: "2026-10-02T21:14:12-07:00", actor: "agent", title: "Triage: not received", code: "claude-haiku-5-5", detail: "Buyer says the camera never arrived.", costUsd: 0.0007 },
    { at: "2026-10-02T21:14:14-07:00", actor: "tool", title: "Read the tracking you added on PayPal", code: "GET /v1/shipping/trackers/3VE77310KM028465S-CP610472859US", detail: "200. USPS CP610472859US, added Sep 18, status SHIPPED." },
    { at: "2026-10-02T21:14:15-07:00", actor: "tool", title: "Checked delivery with USPS", code: "USPS Tracking API, CP610472859US", detail: "Delivered Sep 26, 2:14 pm by Australia Post, Melbourne VIC 3056." },
    { at: "2026-10-03T08:40:22-07:00", actor: "agent", title: "Decided to fight", code: "claude-opus-5-5", detail: "Win estimate 78%. Fighting keeps $205.42 on average.", costUsd: 0.0402 },
    { at: "2026-10-03T08:41:03-07:00", actor: "agent", title: "Built the evidence pack", code: "pdf-lib, 3 pages", detail: "Letter, delivery scan, customs declaration.", costUsd: 0.0298 },
    { at: "2026-10-03T08:41:05-07:00", actor: "tool", title: "Sent the evidence to PayPal", code: "POST /v1/customer/disputes/PP-R-RBN-10224961/provide-evidence", detail: "200, debug id 8d25f0c6e1a97. PROOF_OF_FULFILLMENT with USPS tracking and 1 PDF. No money moves, so no approval needed." },
    { at: "2026-10-03T08:41:14-07:00", actor: "paypal", title: "PayPal started its review", code: "CUSTOMER.DISPUTE.UPDATED", detail: "Status UNDER_REVIEW." },
    { at: "2026-10-22T06:02:11-07:00", actor: "paypal", title: "PayPal decided in your favour", code: "CUSTOMER.DISPUTE.RESOLVED", detail: "Outcome RESOLVED_SELLER_FAVOUR. $289.00 released to your balance." },
    { at: "2026-10-22T06:02:13-07:00", actor: "agent", title: "Closed the case", detail: "You kept $289.00." },
  ],
};

// ---- Everything else, built from the inbox row ----

const DEBUG = ["2f81c0d7a6b39", "b5e0294c7d1a8", "61d9e3f0a2c75", "d03a7b5e19f42", "7ac41e86d0b25", "e98b2c03f5d61", "15f7d6a9c0e83", "a26c8e41b7f09"];

function built(c: InboxCase, n: number): CaseDetail {
  const dbg = DEBUG[n % DEBUG.length];
  const reason = REASON_LABEL[c.reason].toLowerCase();
  const steps: Step[] = [
    { at: at(c.openedAt, 9), actor: "paypal", title: c.stage === "CHARGEBACK" ? "Chargeback opened" : "Dispute opened", code: "CUSTOMER.DISPUTE.CREATED", detail: "Webhook signature verified." },
  ];
  if (c.state !== "new") {
    steps.push(
      { at: at(c.openedAt, 10), actor: "tool", title: "Read the dispute", code: `GET /v1/customer/disputes/${c.id}`, detail: `200, debug id ${dbg}.` },
      { at: at(c.openedAt, 13), actor: "agent", title: `Triage: ${reason}`, code: "claude-haiku-5-5", detail: c.claim, costUsd: 0.0008 },
      { at: at(c.openedAt, 15), actor: "tool", title: "Read the tracking you added on PayPal", code: "GET /v1/shipping/trackers", detail: `200. ${c.shipment.carrier} ${c.shipment.tracking}, status SHIPPED.` },
      { at: at(c.openedAt, 16), actor: "tool", title: `Checked delivery with ${c.shipment.carrier}`, code: `${c.shipment.carrier} tracking, ${c.shipment.tracking}`, detail: `${c.shipment.status}.` },
    );
  }
  if (c.state === "new") steps.push({ at: at(c.openedAt, 11), actor: "agent", title: "Starting: reading the dispute and the order", pending: true });
  if (c.state === "working") steps.push({ at: c.lastEventAt, actor: "agent", title: c.lastEvent, code: "claude-opus-5-5", pending: true });
  if (c.state === "waiting_paypal")
    steps.push(
      { at: at(c.lastEventAt, -9), actor: "tool", title: "Sent the evidence to PayPal", code: `POST /v1/customer/disputes/${c.id}/provide-evidence`, detail: `200, debug id ${DEBUG[(n + 3) % DEBUG.length]}. No money moves, so no approval needed.`, costUsd: 0.0301 },
      { at: c.lastEventAt, actor: "paypal", title: "PayPal started its review", code: "CUSTOMER.DISPUTE.UPDATED", detail: `Status UNDER_REVIEW. ${c.lastEvent}.` },
      { at: NOW, actor: "system", title: "Waiting on PayPal's decision", detail: "PayPal usually decides chargebacks within 30 days.", pending: true },
    );
  if (c.closedAt)
    steps.push(
      { at: at(c.closedAt, -60), actor: c.state === "refunded" ? "seller" : "agent", title: c.lastEvent },
      { at: c.closedAt, actor: "paypal", title: "PayPal closed the case", code: "CUSTOMER.DISPUTE.RESOLVED", detail: `Outcome ${c.outcome}.` },
    );
  const kept = c.closedAt ? (Number(c.amount) - Number(c.settledUsd ?? 0)).toFixed(2) : undefined;
  return {
    c,
    title: `${c.buyer}, ${c.item}`,
    headline:
      c.state === "won"
        ? `PayPal decided ${c.buyer}'s claim about the ${c.item.split(",")[0]} in your favour.`
        : c.closedAt
          ? `${c.buyer}'s dispute about the ${c.item.split(",")[0]} is settled.`
          : `${c.buyer} says the ${c.item.split(",")[0]} is ${c.reason.endsWith("RECEIVED") ? "not received" : reason}.`,
    live: { event: steps.filter((s) => s.code?.startsWith("CUSTOMER.")).at(-1)!.code!, at: steps.filter((s) => s.code?.startsWith("CUSTOMER.")).at(-1)!.at, debugId: dbg },
    working: c.state === "working" ? `${c.lastEvent}.` : c.state === "new" ? "Starting now: reading the dispute and the order." : undefined,
    outcome: kept
      ? {
          line: `${OUTCOME_LABEL[c.outcome!]}. ${c.settledUsd ? `$${c.settledUsd} went back to the buyer.` : "Nothing went back to the buyer."}`,
          kept,
        }
      : undefined,
    steps,
  };
}

grace.steps = [
  ...built(graceRow, 2).steps,
  { at: "2026-10-24T08:15:00-07:00", actor: "agent", title: "Recommends a full refund of $74.95", code: "claude-opus-5-5", detail: "No USPS scan since Oct 12. Refund and file a USPS claim: keeps $59.96 on average, fighting $3.75.", costUsd: 0.0388 },
];

const WRITTEN: Record<string, CaseDetail> = {
  [daniel.c.id]: daniel,
  [grace.c.id]: grace,
  [sam.c.id]: sam,
  [hannah.c.id]: hannah,
};

export function caseDetail(id: string): CaseDetail | undefined {
  if (WRITTEN[id]) return WRITTEN[id];
  const i = CASES.findIndex((c) => c.id === id);
  return i < 0 ? undefined : built(CASES[i], i);
}

export const CASE_IDS = CASES.map((c) => c.id);

/** One quiet number per case, with the per-step split for a tooltip. */
export function agentCost(d: CaseDetail): { total: string; split: string } {
  const paid = d.steps.filter((s) => s.costUsd);
  const sum = paid.reduce((t, s) => t + (s.costUsd ?? 0), 0);
  return {
    total: `$${sum.toFixed(2)}`,
    split: paid.map((s) => `${s.title}: $${s.costUsd!.toFixed(4)}`).join("\n"),
  };
}

/** Where an approval case is: waiting for the seller, inside the undo window, sent, declined, or closed by the buyer's answer. */
export type Phase = "waiting" | "approved" | "sent" | "denied" | "closed";

/** What the seller keeps once the buyer takes the approved money. */
export const keptAfter = (d: CaseDetail) => (Number(d.c.amount) - Number(d.approval!.amount)).toFixed(2);

/** The steps the seller's decision adds to a case that is waiting for approval. */
export function decisionSteps(d: CaseDetail, phase: Phase, decidedAt: string): Step[] {
  const a = d.approval;
  if (!a) return [];
  if (phase === "waiting")
    return [
      {
        at: at(d.decision!.at, 17),
        actor: "system",
        title: "Waiting for you",
        detail: `${a.label} is above your $50.00 approval line. Nothing goes to PayPal until you decide.`,
        pending: true,
      },
    ];
  if (phase === "denied")
    return [
      { at: decidedAt, actor: "seller", title: `You declined the ${a.label}` },
      { at: at(decidedAt, 1), actor: "agent", title: "Preparing to submit the evidence pack instead", code: "provide-evidence", pending: true },
    ];
  const out: Step[] = [{ at: decidedAt, actor: "seller", title: `You approved the ${a.label}` }];
  if (phase === "approved") out.push({ at: at(decidedAt, 1), actor: "system", title: "Sending to PayPal in a few seconds", detail: "You can still undo.", pending: true });
  if (phase === "sent" || phase === "closed")
    out.push({ at: at(decidedAt, 5), actor: "tool", title: "Sent to PayPal", code: a.endpoint, detail: `200, debug id ${a.debugId}.` });
  if (phase === "sent")
    out.push({ at: at(decidedAt, 6), actor: "system", title: "Waiting for the buyer's answer", detail: "PayPal sends a webhook when the buyer accepts or declines.", pending: true });
  if (phase === "closed") {
    const first = d.c.buyer.split(" ")[0];
    if (a.kind === "make_offer")
      out.push({ at: at(decidedAt, 3600), actor: "paypal", title: `${first} accepted the offer`, code: "CUSTOMER.DISPUTE.UPDATED", detail: "Webhook signature verified." });
    out.push(
      { at: at(decidedAt, 3602), actor: "paypal", title: "PayPal closed the case", code: "CUSTOMER.DISPUTE.RESOLVED", detail: `Outcome RESOLVED_BUYER_FAVOUR. ${usd(a.amount)} refunded to ${first}; you kept ${usd(keptAfter(d))}.` },
    );
  }
  return out;
}
