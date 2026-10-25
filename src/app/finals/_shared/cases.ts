// Per-case detail for the finals: what the agent did, the decision, the approval, the PayPal traffic, the outcome.
// Four cases are written out (Daniel: evidence filing waits for you, the hero; Grace: refund waits for you;
// Sam: agent working; Hannah: won). The rest are built from their inbox row so every row opens its own case.
//
// Every case here is a SAMPLE CASE. Its PayPal lines carry origin "sample" and no debug ids: nothing in this
// file went to PayPal. Real traffic lives in ./real.ts only.

import { CASES, HERO_ID, NOW, OUTCOME_LABEL, REASON_LABEL, usd, type InboxCase } from "./data";

/** One line of PayPal traffic. Webhooks come in, our API calls go out. */
export type WireLine = {
  at: string;
  dir: "in" | "out";
  name: string; // short: "Provide evidence", or the event type for webhooks
  status: string; // HTTP status for calls; dispute status for webhooks
  path: string; // "POST /v1/customer/disputes/…/provide-evidence" or "CUSTOMER.DISPUTE.UPDATED"
  debugId?: string; // real calls only
  eventId?: string; // real webhooks only
  origin: "paypal" | "sample";
};

export type Step = {
  at: string;
  actor: "paypal" | "agent" | "tool" | "seller" | "system";
  title: string; // what happened, as a sentence fragment
  detail?: string; // the result
  wire?: Omit<WireLine, "at" | "origin">; // set when the step was PayPal traffic
  model?: string; // agent steps; never show on the Wire
  costUsd?: number;
  pending?: boolean;
};

export type Option = { key: string; name: string; math: string; ev: string; chosen: boolean };

export type Decision = {
  headline: string; // the recommendation as one sentence
  rationale: string;
  at: string;
  winPct: number;
  options: Option[];
  valueNote?: string; // what a returned item is worth, when an option brings it back
};

export type Approval = {
  kind: "provide_evidence" | "make_offer" | "accept_claim";
  amount: string; // the dispute amount at stake (evidence) or the money that moves (refund, offer)
  head: string; // slip head sentence: "File the evidence on the $412.00 case."
  button: string; // names the action and the amount: "File the evidence on the $412.00 case"
  decline: string; // the decline text link
  why: string; // the policy line it crosses
  note: string; // what PayPal receives, in one or two lines (the whole letter is CaseDetail.letter)
  call: Omit<WireLine, "at" | "origin">; // the PayPal call made on approval (no debug id: sample)
  done: string; // the slip after PayPal's 200: "Evidence filed with PayPal."
  then: Step[]; // what follows the 200 up to PayPal's ruling, offsets in seconds from the 200
  resolved: { headline: string; kept: string; outcome: string; line: string };
};

export type Exhibit = { ref: string; name: string; detail: string; body?: string };

export type CaseDetail = {
  c: InboxCase;
  sample: true;
  title: string; // short: buyer and item
  headline: string; // one sentence that states the case
  steps: Step[];
  decision?: Decision;
  approval?: Approval;
  working?: string; // what the agent is doing right now
  outcome?: { line: string; kept: string };
  exhibits?: Exhibit[];
  exhibitsNote?: string;
  letter?: string; // the evidence letter, verbatim
  did?: string; // one sentence: what the agent did to reach the recommendation
};

const at = (iso: string, plusSeconds: number) => new Date(Date.parse(iso) + plusSeconds * 1000).toISOString();
const D = (id: string) => `/v1/customer/disputes/${id}`;

// ---- Daniel Okafor, the hero: a $412.00 chargeback; filing evidence on $250.00 or more waits for the seller ----

const DANIEL_LETTER = `On 2026-10-09 the buyer, located in Toronto, Canada, paid USD 412.00 (capture 8MC585209K746392H, order 5O190127TN364715T) for one Olympus OM-1n body, chrome, serial 1428803 (USD 289.00), one Zuiko Auto-S 50mm f/1.8 lens (USD 85.00) and UPS Worldwide Saver shipping (USD 38.00). The listing described the camera as tested with a roll of Portra 400, with clean glass and light brassing on the top plate.

The seller shot a 36-frame test roll on this body on 2026-10-07, two days before the sale, at every speed from 1/8 to 1/1000. The scans are attached as exhibit D; frames 3 to 6, at 1/8 to 1/30, are evenly exposed, which a hanging shutter would not allow. The listing photos (exhibit C) show the lens against a light with no haze.

UPS delivered the parcel on 2026-10-14 at 11:02 in Toronto, signed OKAFOR (exhibit B), nine days before the chargeback. The buyer did not contact the seller before filing. A 45-year-old cloth shutter can slow after a cold flight; the seller offered a free service on request. We ask the issuer to rule for the seller.`;

const daniel: CaseDetail = {
  c: CASES.find((c) => c.id === HERO_ID)!,
  sample: true,
  title: "Daniel Okafor, Olympus OM-1n with Zuiko 50mm f/1.8",
  headline: "Daniel Okafor's card issuer says the Olympus OM-1n he bought is not as described.",
  decision: {
    headline: "File the evidence: the test roll answers both points.",
    rationale:
      "The test roll shows the slow speeds working two days before the sale, and the listing photos show clean glass. If the issuer still sides with Daniel, the camera comes back to you, so losing costs less than accepting now.",
    at: "2026-10-25T09:56:58-07:00",
    winPct: 55,
    options: [
      {
        key: "fight",
        name: "File the evidence",
        math: "55% you keep $412.00; 45% the camera comes back; the $20.00 chargeback fee either way",
        ev: "259.70",
        chosen: true,
      },
      {
        key: "accept",
        name: "Accept the chargeback",
        math: "The camera comes back; the $20.00 chargeback fee",
        ev: "98.00",
        chosen: false,
      },
    ],
    valueNote:
      "A returned camera is worth $118.00 to you: $240.00 resale after a $95.00 shutter service, less $27.00 selling fees.",
  },
  approval: {
    kind: "provide_evidence",
    amount: "412.00",
    head: "File the evidence with PayPal.",
    button: "File the evidence on the $412.00 case",
    decline: "Don't file; accept the chargeback",
    why: "Over your $250.00 evidence line, so it waits for you.",
    note: "What PayPal receives: your letter and five exhibits: the order, UPS delivery signed OKAFOR, the listing as published, the Oct 7 test roll and the timeline.",
    call: { dir: "out", name: "Provide evidence", status: "200", path: `POST ${D(HERO_ID)}/provide-evidence` },
    done: "Evidence filed with PayPal.",
    then: [
      {
        at: "+30",
        actor: "paypal",
        title: "PayPal started its review",
        detail: "Status UNDER_REVIEW. PayPal and the issuer usually decide within 30 days.",
        wire: { dir: "in", name: "CUSTOMER.DISPUTE.UPDATED", status: "UNDER_REVIEW", path: "CUSTOMER.DISPUTE.UPDATED" },
      },
    ],
    resolved: {
      headline: "PayPal decided Daniel Okafor's chargeback in your favour.",
      kept: "392.00",
      outcome: "RESOLVED_SELLER_FAVOUR",
      line: "PayPal released the $412.00 it was holding, less the $20.00 chargeback fee. The camera stays with Daniel.",
    },
  },
  exhibits: [
    { ref: "A", name: "Order details", detail: "Order 5O190127TN364715T, capture 8MC585209K746392H, paid Oct 9, $412.00", body: "Order 5O190127TN364715T, capture 8MC585209K746392H. 1 x Olympus OM-1n body, chrome, serial 1428803, USD 289.00. 1 x Zuiko Auto-S 50mm f/1.8, USD 85.00. UPS Worldwide Saver to Toronto, USD 38.00. Total charged USD 412.00. Buyer country: CA. Paid 2026-10-09 21:03 UTC." },
    { ref: "B", name: "Shipment and tracking", detail: "UPS 1ZA6W4410367092155, delivered Oct 14, 11:02 am, Toronto, signed OKAFOR", body: "Carrier: UPS. Tracking number: 1ZA6W4410367092155. Shipped 2026-10-10. Status: DELIVERED 2026-10-14 15:02 UTC, Toronto ON, signed OKAFOR. Tracking added to the PayPal transaction on 2026-10-10." },
    { ref: "C", name: "Listing as published", detail: "Archived Oct 6: 7 photos, \u201cTested with a roll of Portra 400. Clean glass.\u201d", body: "Listing archived 2026-10-06. Title: Olympus OM-1n chrome with Zuiko 50mm f/1.8, tested. Condition: \u201cTested with a roll of Portra 400. Clean glass, light brassing on the top plate.\u201d 7 photos, including the lens held against a light box." },
    { ref: "D", name: "Pre-shipment test roll", detail: "Portra 400, 36 frames shot Oct 7, 1/8 to 1/1000", body: "Kodak Portra 400, 36 exposures, shot 2026-10-07 on body serial 1428803 with the Zuiko 50mm f/1.8, metered at box speed. Frames 3 to 10 bracket every shutter speed from 1/8 to 1/1000; the scans are evenly exposed at each speed." },
    { ref: "E", name: "Timeline", detail: "Paid Oct 9, shipped Oct 10, delivered Oct 14, chargeback Oct 23; no buyer messages", body: "2026-10-09 21:03 UTC payment captured. 2026-10-10 UPS pickup. 2026-10-14 15:02 UTC delivered, signed OKAFOR. 2026-10-23 23:47 UTC chargeback opened (not as described). No buyer messages on the transaction before the chargeback." },
  ],
  exhibitsNote: "Goes to PayPal when you file.",
  letter: DANIEL_LETTER,
  did: "The agent read the chargeback, the order, your PayPal tracking and the UPS delivery, asked you for the test roll, then priced filing against accepting.",
  steps: [
    { at: "2026-10-23T16:47:12-07:00", actor: "paypal", title: "Chargeback opened", detail: "Webhook signature verified. Card network reason 13.3, not as described.", wire: { dir: "in", name: "CUSTOMER.DISPUTE.CREATED", status: "UNDER_REVIEW", path: "CUSTOMER.DISPUTE.CREATED" } },
    { at: "2026-10-23T16:47:13-07:00", actor: "tool", title: "Read the dispute", detail: "Chargeback, $412.00 held by PayPal.", wire: { dir: "out", name: "Read dispute", status: "200", path: `GET ${D(HERO_ID)}` } },
    { at: "2026-10-23T16:47:16-07:00", actor: "agent", title: "Sorted it as not as described", detail: "Shutter hangs at slow speeds; haze in the lens.", model: "claude-haiku-5-5", costUsd: 0.0009 },
    { at: "2026-10-23T16:47:18-07:00", actor: "tool", title: "Found the order", detail: "Paid Oct 9: body $289.00, lens $85.00, shipping $38.00.", wire: { dir: "out", name: "Read order", status: "200", path: "GET /v2/checkout/orders/5O190127TN364715T" } },
    { at: "2026-10-23T16:47:19-07:00", actor: "tool", title: "Read the tracking you added on PayPal", detail: "UPS 1ZA6W4410367092155, added Oct 10.", wire: { dir: "out", name: "Read tracking", status: "200", path: "GET /v1/shipping/trackers/8MC585209K746392H-1ZA6W4410367092155" } },
    { at: "2026-10-23T16:47:20-07:00", actor: "tool", title: "Checked delivery with UPS", detail: "Delivered Oct 14, 11:02 am in Toronto, signed OKAFOR." },
    { at: "2026-10-23T16:52:07-07:00", actor: "paypal", title: "PayPal asked for your evidence", detail: "Status WAITING_FOR_SELLER_RESPONSE, due Oct 28.", wire: { dir: "in", name: "CUSTOMER.DISPUTE.UPDATED", status: "WAITING_FOR_SELLER_RESPONSE", path: "CUSTOMER.DISPUTE.UPDATED" } },
    { at: "2026-10-23T16:52:40-07:00", actor: "agent", title: "Asked you for the test-roll scans", detail: "The listing says tested; the scans prove it.", model: "claude-opus-5-5", costUsd: 0.0391 },
    { at: "2026-10-25T09:52:31-07:00", actor: "seller", title: "You uploaded 36 test-roll scans", detail: "Portra 400, shot Oct 7." },
    { at: "2026-10-25T09:56:58-07:00", actor: "agent", title: "Recommends filing the evidence", detail: "Win estimate 55%. Filing keeps $259.70 on average; accepting keeps $98.00.", model: "claude-opus-5-5", costUsd: 0.0586 },
    { at: "2026-10-25T09:57:14-07:00", actor: "agent", title: "Built the evidence pack", detail: "Letter and 5 exhibits, 6 pages.", model: "pdf-lib", costUsd: 0.0318 },
  ],
};

// ---- Grace Holloway, an inquiry: a $74.95 refund waits for the seller (above $50.00) ----

const graceRow = CASES.find((c) => c.id === "PP-R-TVA-10227066")!;
const grace: CaseDetail = {
  c: graceRow,
  sample: true,
  title: "Grace Holloway, Kodak Portra 400, pack of 5",
  headline: "Grace Holloway says her Portra 400 never arrived.",
  decision: {
    headline: "Refund Grace $74.95 and claim it back from USPS.",
    rationale:
      "USPS hasn't scanned the parcel since Oct 12 in Charlotte, so there is no proof of delivery to show PayPal. Ground Advantage includes $100.00 of insurance; a lost-parcel claim usually pays out in 2 to 3 weeks.",
    at: "2026-10-24T08:15:00-07:00",
    winPct: 5,
    options: [
      { key: "refund", name: "Refund $74.95, file a USPS claim", math: "80% USPS pays the $74.95 back", ev: "59.96", chosen: true },
      { key: "fight", name: "Fight without a delivery scan", math: "5% PayPal sides with you", ev: "3.75", chosen: false },
    ],
  },
  approval: {
    kind: "accept_claim",
    amount: "74.95",
    head: "Refund Grace $74.95.",
    button: "Refund $74.95",
    decline: "Don't refund; fight it",
    why: "Over your $50.00 line, so it waits for you.",
    note: "Hi Grace, sorry, the film looks lost with USPS. We've refunded the full $74.95; if the parcel turns up, keep it.",
    call: { dir: "out", name: "Accept claim", status: "200", path: `POST ${D(graceRow.id)}/accept-claim` },
    done: "Refund sent through PayPal.",
    then: [],
    resolved: {
      headline: "Grace Holloway's dispute is settled.",
      kept: "0.00",
      outcome: "RESOLVED_BUYER_FAVOUR",
      line: "$74.95 went back to Grace. The USPS claim for $74.95 is filed.",
    },
  },
  did: "The agent read the inquiry, the order and USPS tracking, then priced refunding against fighting.",
  steps: [],
};

// ---- Sam Whitfield, agent working ----

const samRow = CASES.find((c) => c.id === "PP-R-PLZ-10225917")!;
const sam: CaseDetail = {
  c: samRow,
  sample: true,
  title: "Sam Whitfield, Rollei 35 S with Sonnar 40mm f/2.8",
  headline: "Sam Whitfield's bank says the Rollei 35 S he bought is not as described.",
  working: "Writing the evidence letter. It goes to PayPal without asking you: the case is under $250.00.",
  decision: {
    headline: "Fight it: the listing and the meter test answer both points.",
    rationale:
      "The meter was tested against a handheld meter before shipping, and four listing photos show the front element clean at an angle. Sam sent his bank no photos.",
    at: "2026-10-25T10:32:40-07:00",
    winPct: 71,
    options: [
      { key: "fight", name: "Fight with evidence", math: "71% you keep $318.50; the $20.00 chargeback fee either way", ev: "206.14", chosen: true },
      { key: "accept", name: "Accept the chargeback", math: "Lose $318.50 and the $20.00 fee", ev: "-20.00", chosen: false },
    ],
  },
  exhibits: [
    { ref: "A", name: "Order details", detail: "Order 2KT55803BN219443X, paid Sep 30, $318.50" },
    { ref: "B", name: "Shipment and tracking", detail: "UPS 1ZA6W4416603418279, delivered Oct 8, Leeds" },
    { ref: "C", name: "Listing as published", detail: "Archived Sep 28, 4 photos of the lens" },
    { ref: "D", name: "Meter test", detail: "Side-by-side readings with a Sekonic L-308, Sep 29" },
  ],
  exhibitsNote: "Being assembled now.",
  steps: [
    { at: "2026-10-16T13:22:09-07:00", actor: "paypal", title: "Chargeback opened", detail: "Webhook signature verified. Card network reason 13.3.", wire: { dir: "in", name: "CUSTOMER.DISPUTE.CREATED", status: "UNDER_REVIEW", path: "CUSTOMER.DISPUTE.CREATED" } },
    { at: "2026-10-16T13:22:10-07:00", actor: "tool", title: "Read the dispute", detail: "Chargeback, under review by PayPal.", wire: { dir: "out", name: "Read dispute", status: "200", path: `GET ${D(samRow.id)}` } },
    { at: "2026-10-16T13:22:13-07:00", actor: "agent", title: "Sorted it as not as described", detail: "Meter not working and a lens scratch not shown in photos.", model: "claude-haiku-5-5", costUsd: 0.0008 },
    { at: "2026-10-16T13:22:15-07:00", actor: "tool", title: "Read the tracking you added on PayPal", detail: "UPS 1ZA6W4416603418279, added Oct 1.", wire: { dir: "out", name: "Read tracking", status: "200", path: "GET /v1/shipping/trackers/6TN81204XA593120K-1ZA6W4416603418279" } },
    { at: "2026-10-16T13:22:16-07:00", actor: "tool", title: "Checked delivery with UPS", detail: "Delivered Oct 8, 10:41 am in Leeds." },
    { at: "2026-10-25T10:31:05-07:00", actor: "paypal", title: "PayPal asked for your evidence", detail: "Status WAITING_FOR_SELLER_RESPONSE, due Oct 26.", wire: { dir: "in", name: "CUSTOMER.DISPUTE.UPDATED", status: "WAITING_FOR_SELLER_RESPONSE", path: "CUSTOMER.DISPUTE.UPDATED" } },
    { at: "2026-10-25T10:32:40-07:00", actor: "agent", title: "Decided to fight", detail: "Win estimate 71%. Fighting keeps $206.14 on average, accepting loses $20.00.", model: "claude-opus-5-5", costUsd: 0.0447 },
    { at: "2026-10-25T10:36:00-07:00", actor: "agent", title: "Writing the evidence letter", detail: "Meter tested before shipping; 4 listing photos show the lens.", model: "claude-opus-5-5", pending: true },
  ],
};

// ---- Hannah Cole, won ----

const hannahRow = CASES.find((c) => c.id === "PP-R-RBN-10224961")!;
const hannah: CaseDetail = {
  c: hannahRow,
  sample: true,
  title: "Hannah Cole, Canon AE-1 Program with FD 50mm f/1.8",
  headline: "PayPal decided Hannah Cole's not-received chargeback in your favour.",
  outcome: { line: "PayPal released the $289.00 it was holding. Nothing went back to the buyer.", kept: "289.00" },
  decision: {
    headline: "Fight it: USPS and Australia Post both show delivery to her address.",
    rationale: "Delivery scan Sep 26 in Melbourne to the address on the PayPal transaction; no signature, but the customs record and the delivery scan match.",
    at: "2026-10-03T08:40:22-07:00",
    winPct: 78,
    options: [
      { key: "fight", name: "Fight with evidence", math: "78% you keep $289.00; the $20.00 chargeback fee either way", ev: "205.42", chosen: true },
      { key: "accept", name: "Accept the chargeback", math: "Lose $289.00 and the $20.00 fee", ev: "-20.00", chosen: false },
    ],
  },
  exhibits: [
    { ref: "A", name: "Order details", detail: "Order 7HF20488WL936512C, paid Sep 17, $289.00" },
    { ref: "B", name: "Shipment and tracking", detail: "USPS CP610472859US, Australia Post delivered Sep 26, Melbourne VIC 3056" },
    { ref: "C", name: "Customs declaration", detail: "CN23, declared value $265.00, cleared Sep 24" },
  ],
  exhibitsNote: "Filed Oct 3.",
  steps: [
    { at: "2026-10-02T21:14:08-07:00", actor: "paypal", title: "Chargeback opened", detail: "Webhook signature verified.", wire: { dir: "in", name: "CUSTOMER.DISPUTE.CREATED", status: "UNDER_REVIEW", path: "CUSTOMER.DISPUTE.CREATED" } },
    { at: "2026-10-02T21:14:09-07:00", actor: "tool", title: "Read the dispute", detail: "Chargeback, $289.00 held.", wire: { dir: "out", name: "Read dispute", status: "200", path: `GET ${D(hannahRow.id)}` } },
    { at: "2026-10-02T21:14:12-07:00", actor: "agent", title: "Sorted it as not received", detail: "Buyer says the camera never arrived.", model: "claude-haiku-5-5", costUsd: 0.0007 },
    { at: "2026-10-02T21:14:14-07:00", actor: "tool", title: "Read the tracking you added on PayPal", detail: "USPS CP610472859US, added Sep 18.", wire: { dir: "out", name: "Read tracking", status: "200", path: "GET /v1/shipping/trackers/3VE77310KM028465S-CP610472859US" } },
    { at: "2026-10-02T21:14:15-07:00", actor: "tool", title: "Checked delivery with USPS", detail: "Delivered Sep 26, 2:14 pm by Australia Post, Melbourne VIC 3056." },
    { at: "2026-10-03T08:40:22-07:00", actor: "agent", title: "Decided to fight", detail: "Win estimate 78%. Fighting keeps $205.42 on average.", model: "claude-opus-5-5", costUsd: 0.0402 },
    { at: "2026-10-03T08:41:03-07:00", actor: "agent", title: "Built the evidence pack", detail: "Letter, delivery scan, customs declaration.", model: "pdf-lib", costUsd: 0.0298 },
    { at: "2026-10-03T08:41:05-07:00", actor: "tool", title: "Filed the evidence with PayPal", detail: "Under $250.00, so it went without asking you.", wire: { dir: "out", name: "Provide evidence", status: "200", path: `POST ${D(hannahRow.id)}/provide-evidence` } },
    { at: "2026-10-03T08:41:14-07:00", actor: "paypal", title: "PayPal started its review", detail: "Status UNDER_REVIEW.", wire: { dir: "in", name: "CUSTOMER.DISPUTE.UPDATED", status: "UNDER_REVIEW", path: "CUSTOMER.DISPUTE.UPDATED" } },
    { at: "2026-10-22T06:02:11-07:00", actor: "paypal", title: "PayPal decided in your favour", detail: "Outcome RESOLVED_SELLER_FAVOUR. $289.00 released to your balance.", wire: { dir: "in", name: "CUSTOMER.DISPUTE.RESOLVED", status: "RESOLVED_SELLER_FAVOUR", path: "CUSTOMER.DISPUTE.RESOLVED" } },
  ],
};

// ---- Everything else, built from the inbox row ----

function built(c: InboxCase): CaseDetail {
  const reason = REASON_LABEL[c.reason].toLowerCase();
  const steps: Step[] = [
    {
      at: at(c.openedAt, 9),
      actor: "paypal",
      title: c.stage === "CHARGEBACK" ? "Chargeback opened" : "Dispute opened",
      detail: "Webhook signature verified.",
      wire: { dir: "in", name: "CUSTOMER.DISPUTE.CREATED", status: c.stage === "CHARGEBACK" ? "UNDER_REVIEW" : "WAITING_FOR_SELLER_RESPONSE", path: "CUSTOMER.DISPUTE.CREATED" },
    },
  ];
  if (c.state !== "new") {
    steps.push(
      { at: at(c.openedAt, 10), actor: "tool", title: "Read the dispute", detail: `${c.stage === "CHARGEBACK" ? "Chargeback" : "Inquiry"}, ${usd(c.amount)}.`, wire: { dir: "out", name: "Read dispute", status: "200", path: `GET ${D(c.id)}` } },
      { at: at(c.openedAt, 13), actor: "agent", title: `Sorted it as ${reason}`, detail: c.claim, model: "claude-haiku-5-5", costUsd: 0.0008 },
      { at: at(c.openedAt, 15), actor: "tool", title: "Read the tracking you added on PayPal", detail: `${c.shipment.carrier} ${c.shipment.tracking}.`, wire: { dir: "out", name: "Read tracking", status: "200", path: "GET /v1/shipping/trackers" } },
      { at: at(c.openedAt, 16), actor: "tool", title: `Checked delivery with ${c.shipment.carrier}`, detail: `${c.shipment.status}.` },
    );
  }
  if (c.state === "new") steps.push({ at: at(c.openedAt, 11), actor: "agent", title: "Reading the dispute and the order", pending: true });
  if (c.state === "working") steps.push({ at: c.lastEventAt, actor: "agent", title: c.lastEvent, model: "claude-opus-5-5", pending: true });
  if (c.state === "waiting_paypal")
    steps.push(
      { at: at(c.lastEventAt, -9), actor: "tool", title: "Filed the evidence with PayPal", detail: "No money moves, so it went without asking you.", wire: { dir: "out", name: "Provide evidence", status: "200", path: `POST ${D(c.id)}/provide-evidence` }, costUsd: 0.0301 },
      { at: c.lastEventAt, actor: "paypal", title: "PayPal started its review", detail: `Status UNDER_REVIEW. ${c.lastEvent}.`, wire: { dir: "in", name: "CUSTOMER.DISPUTE.UPDATED", status: "UNDER_REVIEW", path: "CUSTOMER.DISPUTE.UPDATED" } },
      { at: NOW, actor: "system", title: "Waiting on PayPal's decision", detail: "PayPal usually decides chargebacks within 30 days.", pending: true },
    );
  if (c.closedAt)
    steps.push(
      { at: at(c.closedAt, -60), actor: c.state === "refunded" ? "seller" : "agent", title: c.lastEvent },
      { at: c.closedAt, actor: "paypal", title: "PayPal closed the case", detail: `Outcome ${c.outcome}.`, wire: { dir: "in", name: "CUSTOMER.DISPUTE.RESOLVED", status: c.outcome!, path: "CUSTOMER.DISPUTE.RESOLVED" } },
    );
  const kept = c.closedAt ? (Number(c.amount) - Number(c.settledUsd ?? 0)).toFixed(2) : undefined;
  const thing = c.item.split(",")[0];
  return {
    c,
    sample: true,
    title: `${c.buyer}, ${c.item}`,
    headline:
      c.state === "won"
        ? `PayPal decided ${c.buyer}'s claim about the ${thing} in your favour.`
        : c.closedAt
          ? `${c.buyer}'s dispute about the ${thing} is settled.`
          : `${c.buyer} says the ${thing} is ${c.reason.endsWith("RECEIVED") ? "not received" : reason}.`,
    working: c.state === "working" ? `${c.lastEvent}.` : c.state === "new" ? "Starting now: reading the dispute and the order." : undefined,
    outcome: kept
      ? { line: `${OUTCOME_LABEL[c.outcome!]}. ${c.settledUsd ? `${usd(c.settledUsd)} went back to the buyer.` : "Nothing went back to the buyer."}`, kept }
      : undefined,
    steps,
  };
}

grace.steps = [
  ...built(graceRow).steps,
  { at: "2026-10-24T08:15:00-07:00", actor: "agent", title: "Recommends a full refund of $74.95", detail: "No USPS scan since Oct 12. Refunding and filing a USPS claim keeps $59.96 on average; fighting $3.75.", model: "claude-opus-5-5", costUsd: 0.0388 },
];

const WRITTEN: Record<string, CaseDetail> = {
  [daniel.c.id]: daniel,
  [grace.c.id]: grace,
  [sam.c.id]: sam,
  [hannah.c.id]: hannah,
};

export function caseDetail(id: string): CaseDetail | undefined {
  if (WRITTEN[id]) return WRITTEN[id];
  const c = CASES.find((x) => x.id === id);
  return c ? built(c) : undefined;
}

export const HERO = daniel;
export const CASE_IDS = CASES.map((c) => c.id);

/** The case's PayPal traffic, oldest first. Sample cases: no debug ids, origin "sample". */
export function wireOf(d: CaseDetail): WireLine[] {
  return d.steps.filter((s) => s.wire).map((s) => ({ ...s.wire!, at: s.at, origin: "sample" as const }));
}

/** Total model cost of the case, and the split, for a quiet tooltip. Never on the Wire. */
export function agentCost(d: CaseDetail): { total: string; split: string } {
  const paid = d.steps.filter((s) => s.costUsd);
  const sum = paid.reduce((t, s) => t + (s.costUsd ?? 0), 0);
  return { total: `$${sum.toFixed(2)}`, split: paid.map((s) => `${s.title}: ${s.costUsd! < 0.01 ? "under 1¢" : `$${s.costUsd!.toFixed(2)}`}`).join("\n") };
}

/** Resolve "+30" style offsets in Approval.then against the time of PayPal's 200. */
export function thenSteps(a: Approval, okAt: string): Step[] {
  return a.then.map((s) => ({ ...s, at: s.at.startsWith("+") ? at(okAt, Number(s.at.slice(1))) : s.at }));
}
