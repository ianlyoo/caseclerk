// Final B ("Darkroom paper") data. One real case (PP-R-JKB-10194463, recorded from production on Oct 25)
// and ten sample cases written for the design. Sample content never carries PayPal ids: those exist only
// on the real case, read from its audit trail.

import type { EvidencePdfInput } from "@/lib/evidence/pdf";
import type { CaseRecord, OrderContext } from "@/lib/types";
import real from "./real-PP-R-JKB-10194463.json";

export const TZ = "America/Los_Angeles";
/** The sample clock. Sample countdowns are measured from here, not from the viewer's clock. */
export const SAMPLE_NOW = "2026-10-25T10:40:00-07:00";

export const SELLER = { name: "Northlight Camera Exchange", city: "Portland, Oregon" };
export const POLICY = { approvalAboveUsd: 50, evidenceGateUsd: 250, maxOfferPercent: 45 };

export type Desk = "new" | "working" | "approval" | "paypal" | "won" | "settled";

/** A row of the case timeline. PayPal rows are the traffic at PayPal's boundary; the rest is our side. */
export type Row =
  | {
      kind: "paypal";
      at: string;
      dir: "in" | "out";
      name: string; // CUSTOMER.DISPUTE.CREATED, provide-evidence, get order
      method?: "GET" | "POST";
      path?: string;
      status?: string; // "200", "verified"
      debugId?: string; // real cases only
      eventId?: string; // real cases only
      say: string; // the row in the seller's words
    }
  | { kind: "agent"; at: string; say: string; detail?: string }
  | { kind: "buyer"; at: string; words: string }
  | { kind: "seller"; at: string; say: string };

export type Approval = {
  kind: "provide_evidence" | "make_offer" | "accept_claim";
  head: string; // the recommendation sentence, the sheet's first line
  amount: string;
  button: string; // names the action and the amount
  decline: string;
  receives: string; // what PayPal receives, verbatim
  policy: string; // the line the case crosses
  method: "POST";
  path: string;
  name: string; // provide-evidence
  sentLine: string; // after the 200
};

export type Ending = { sentence: string; kept: string; at: string };

export type Case = {
  id: string;
  real: boolean;
  buyer: string;
  city: string;
  item: string;
  short: string; // "Olympus OM-1n"
  photo?: string;
  amount: string;
  reason: string;
  stage: "INQUIRY" | "CHARGEBACK";
  desk: Desk;
  openedAt: string;
  dueAt?: string;
  last: string; // the agent's last action as a sentence
  lastAt: string;
  settled?: string; // money that went back to the buyer, closed cases
  kept?: string; // money the seller kept, closed cases
  headline: string;
  rows: Row[]; // oldest first
  recommendation?: string; // when no approval is pending
  rationale?: string;
  values?: { name: string; math: string; ev: string; chosen?: boolean }[];
  valueNote?: string;
  approval?: Approval;
  ending?: Ending; // what the resolved state says (sample hero: after the sandbox decides)
  pack?: EvidencePdfInput;
  packNote?: string;
  costUsd?: number;
  proof?: { name: string; status: string; debugId: string }; // real cases: the last PayPal call, shown on the inbox row
};

// ---------------------------------------------------------------- the real case

type RealJson = typeof real;
type AuditRow = RealJson["audit"][number] & { data?: Record<string, unknown> };

const REAL_ID = "PP-R-JKB-10194463";
export const REAL = { id: REAL_ID, recordedAt: "2026-10-25T05:18:41Z" };

function realRows(j: RealJson): Row[] {
  const out: Row[] = [];
  const id = j.case.id;
  const debugFor = (kind: string, near: string) =>
    j.actions.find((a) => a.kind === kind && Math.abs(Date.parse(a.updatedAt) - Date.parse(near)) < 5000)?.result;
  for (const a of j.audit as AuditRow[]) {
    const d = (a.data ?? {}) as Record<string, string | number | undefined>;
    if (a.kind === "webhook.received") {
      out.push({
        kind: "paypal",
        at: a.at,
        dir: "in",
        name: String(d.eventType),
        status: "verified",
        eventId: String(d.eventId),
        say: a.summary.replace("Dispute opened: under review", "PayPal opened the chargeback, under review").replace("Dispute updated: ", "PayPal updated the case: "),
      });
    } else if (a.kind === "action.executed") {
      out.push({
        kind: "paypal",
        at: a.at,
        dir: "out",
        name: "provide-evidence",
        method: "POST",
        path: `/v1/customer/disputes/${id}/provide-evidence`,
        status: String(d.httpStatus),
        debugId: String(d.debugId),
        say: "CaseClerk filed the evidence and PayPal accepted it",
      });
    } else if (a.kind === "demo.require_evidence" || a.kind === "demo.adjudicate") {
      const k = a.kind === "demo.adjudicate" ? "adjudicate" : "require_evidence";
      const r = debugFor(k, a.at);
      out.push({
        kind: "paypal",
        at: a.at,
        dir: "out",
        name: k === "adjudicate" ? "adjudicate" : "require-evidence",
        method: "POST",
        path: `/v1/customer/disputes/${id}/${k === "adjudicate" ? "adjudicate" : "require-evidence"}`,
        status: r?.httpStatus ? String(r.httpStatus) : undefined,
        debugId: r?.debugId,
        say: k === "adjudicate" ? "Sandbox control: you asked PayPal to rule for the seller" : "Sandbox control: you asked PayPal to request more evidence",
      });
    } else if (a.kind === "tool.get_order") {
      out.push({ kind: "paypal", at: a.at, dir: "out", name: "get order", method: "GET", path: `/v2/checkout/orders/${j.case.order.orderId}`, say: a.summary });
    } else if (a.kind === "tool.get_tracking") {
      out.push({ kind: "paypal", at: a.at, dir: "out", name: "get tracker", method: "GET", path: `/v1/shipping/trackers/${j.case.order.captureId}-${j.case.order.shipping[0].trackingNumber}`, say: a.summary.replace("…", "ending ") });
    } else if (a.kind === "tool.get_dispute") {
      out.push({ kind: "paypal", at: a.at, dir: "out", name: "get dispute", method: "GET", path: `/v1/customer/disputes/${id}`, say: a.summary });
    } else if (a.kind === "triage") {
      out.push({ kind: "agent", at: a.at, say: "The agent read the chargeback: item not received, no message from the buyer." });
    } else if (a.kind === "decision") {
      const m = a.summary.match(/win chance (\d+)%/);
      out.push({ kind: "agent", at: a.at, say: `Decided to fight with evidence, win chance ${m ? m[1] : "?"}%.`, detail: a.summary.replace(/^Decision: fight with evidence \([^)]*\)\.\s*/, "") });
    }
  }
  return out;
}

function realCase(): Case {
  const j = real;
  const c = j.case;
  const lastEvidence = [...j.actions].reverse().find((a) => a.kind === "provide_evidence");
  const params = lastEvidence?.params as { narrative: string; exhibits: { title: string; body: string }[] } | undefined;
  const cost = (j.audit as AuditRow[]).filter((a) => a.kind === "agent.run.done").reduce((n, a) => n + Number((a as { costUsd?: number }).costUsd ?? 0), 0);
  const rec = { ...(c as unknown as CaseRecord) };
  return {
    id: c.id,
    real: true,
    buyer: "A buyer in the US",
    city: "",
    proof: { name: "provide-evidence", status: "200", debugId: "f2843364d3500" },
    item: `${c.order.items[0].name}, ${c.order.items[0].description}`,
    short: "Ceramic ring dish",
    amount: c.snapshot.amount.value,
    reason: c.snapshot.reason,
    stage: "CHARGEBACK",
    desk: "paypal",
    openedAt: c.snapshot.createTime,
    last: "Filed the evidence twice; PayPal is deciding",
    lastAt: "2026-10-25T05:18:38.000Z",
    headline: `A buyer's bank charged back a $${c.snapshot.amount.value} ceramic ring dish. CaseClerk filed the evidence on PayPal twice, and the case is with PayPal.`,
    recommendation: "Fight with the evidence. It is filed; PayPal is deciding.",
    rationale: c.decision.rationale,
    values: [
      { name: "Fight with evidence", math: `${Math.round(c.decision.winProbability * 100)}% chance PayPal decides for you`, ev: c.decision.expectedValueUsd.fight.toFixed(2), chosen: true },
      { name: "Refund now", math: "The $17.95 goes back, plus the fee", ev: c.decision.expectedValueUsd.refund.toFixed(2) },
    ],
    rows: realRows(j),
    pack: params
      ? {
          case: rec,
          order: c.order as unknown as OrderContext,
          narrative: params.narrative,
          exhibits: params.exhibits,
          amountCharged: c.order.amountCharged,
          generatedAt: new Date(lastEvidence!.createdAt),
        }
      : undefined,
    packNote: "Filed with PayPal on Oct 25 at 04:57 UTC, second round.",
    costUsd: cost,
  };
}

// ---------------------------------------------------------------- sample cases

const HERO_ID = "PP-R-NKT-10227591";

const heroRecord: CaseRecord = {
  id: HERO_ID,
  snapshot: {
    id: HERO_ID,
    reason: "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED",
    status: "WAITING_FOR_SELLER_RESPONSE",
    stage: "CHARGEBACK",
    channel: "EXTERNAL",
    amount: { value: "412.00", currency_code: "USD" },
    createTime: "2026-10-23T23:47:00Z",
    updateTime: "2026-10-25T16:56:40Z",
    sellerResponseDueDate: "2026-11-03T07:59:00Z",
    sellerTransactionId: "sample capture",
    messages: [],
    allowed: ["provide_evidence", "accept_claim"],
  },
  status: "awaiting_approval",
  isTestDispute: false,
  createdAt: "2026-10-23T23:47:12Z",
  updatedAt: "2026-10-25T16:57:14Z",
};

const heroOrder: OrderContext = {
  orderId: "sample order",
  items: [
    { name: "Olympus OM-1n body, chrome", quantity: 1, unitAmount: { value: "289.00", currency_code: "USD" }, description: "Serial 1428803, tested with a roll of Portra 400" },
    { name: "Zuiko Auto-S 50mm f/1.8", quantity: 1, unitAmount: { value: "85.00", currency_code: "USD" } },
  ],
  shipping: [{ carrier: "UPS", trackingNumber: "1ZA6W4410367092155", status: "DELIVERED", deliveredAt: "2026-10-14T15:02:00Z" }],
  buyerCountry: "CA",
  paidAt: "2026-10-09T21:03:00Z",
  amountCharged: { value: "412.00", currency_code: "USD" },
};

const heroNarrative = `The cardholder says the camera is not as described: the shutter hangs at 1/15 and slower, and there is haze in the 50mm lens.

The listing described the camera as tested with a roll of Portra 400, with clean glass and light brassing on the top plate. We shot that roll on this body on October 7, three days before it shipped, and every speed from 1/1000 to 1/8 exposed correctly.

UPS delivered the parcel in Toronto on October 14, signed OKAFOR. The buyer wrote nine days later. We replied within two minutes, asked for a video, and offered to help with a shutter service or a return.

A 45-year-old mechanical shutter can slow down after a cold flight; that is wear in transit, not a camera sold as something it was not. We ask that the chargeback be decided in the seller's favor. We remain happy to take the camera back at our cost.`;

const heroExhibits = [
  { title: "Listing as published", body: "Olympus OM-1n, chrome, with Zuiko Auto-S 50mm f/1.8. \"Tested with a roll of Portra 400. Clean glass, light brassing on the top plate.\" Listed October 6, 2026, $374.00 plus $38.00 shipping." },
  { title: "Pre-shipment test roll", body: "Kodak Portra 400, shot October 7 on body serial 1428803. Speeds 1/1000, 1/500, 1/250, 1/125, 1/60, 1/30, 1/15 and 1/8 each within half a stop of the meter." },
  { title: "Delivery", body: "UPS Worldwide Saver 1ZA6W4410367092155. Picked up October 10 in Portland, delivered October 14 at 11:02 in Toronto, signed OKAFOR." },
  { title: "Messages with the buyer", body: "October 23: the buyer reports a slow shutter and lens haze. October 23, two minutes later: the seller asks for a video and offers a service or a return. October 25: the buyer sends the video and says he would keep the camera for a partial refund." },
];

const hero: Case = {
  id: HERO_ID,
  real: false,
  buyer: "Daniel Okafor",
  city: "Toronto, Canada",
  item: "Olympus OM-1n, Zuiko 50mm f/1.8",
  short: "Olympus OM-1n",
  photo: "om-1n",
  amount: "412.00",
  reason: "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED",
  stage: "CHARGEBACK",
  desk: "approval",
  openedAt: "2026-10-23T16:47:00-07:00",
  dueAt: "2026-11-02T23:59:00-08:00",
  last: "Built the evidence pack; waiting for you to file it",
  lastAt: "2026-10-25T09:57:14-07:00",
  headline: "Daniel Okafor's bank charged back the $412.00 Olympus OM-1n. He says the shutter sticks and the lens is hazy.",
  rationale:
    "The test roll from October 7 shows every speed working before it shipped, and UPS has his signature. His video shows the slow speeds sticking now, which reads as wear in transit. Fighting keeps more on average than refunding, and the camera stays sold.",
  values: [
    { name: "File the evidence", math: "58% PayPal decides for you and you keep $412.00", ev: "238.96", chosen: true },
    { name: "Accept the claim", math: "Refund $412.00; the camera comes back at his cost", ev: "118.00" },
  ],
  valueNote: "A returned camera is worth $118.00 to you: $240.00 resale after a $95.00 shutter service, less $27.00 selling fees.",
  approval: {
    kind: "provide_evidence",
    head: "File the evidence on the $412.00 case.",
    amount: "412.00",
    button: "File the evidence on $412.00",
    decline: "Decline, accept the claim instead",
    receives:
      "A 4-page evidence pack: the seller statement, the order, UPS delivery signed OKAFOR, the listing, the October 7 test roll and the message thread. Evidence type: proof of fulfillment, with the UPS tracking number.",
    policy: "Over your $250.00 evidence line, so it waits for you.",
    method: "POST",
    path: `/v1/customer/disputes/${HERO_ID}/provide-evidence`,
    name: "provide-evidence",
    sentLine: "Evidence filed with PayPal",
  },
  ending: { sentence: "PayPal decided for you. You kept $412.00 and the camera stays sold.", kept: "412.00", at: "2026-11-04T14:20:00-08:00" },
  pack: { case: heroRecord, order: heroOrder, narrative: heroNarrative, exhibits: heroExhibits, amountCharged: heroOrder.amountCharged, seller: { name: SELLER.name }, generatedAt: new Date("2026-10-25T16:57:14Z") },
  packNote: "Built Oct 25 at 9:57 am. Not filed until you approve.",
  costUsd: 0.13,
  rows: [
    { kind: "paypal", at: "2026-10-23T16:47:12-07:00", dir: "in", name: "CUSTOMER.DISPUTE.CREATED", status: "verified", say: "PayPal opened the chargeback" },
    { kind: "paypal", at: "2026-10-23T16:47:13-07:00", dir: "out", name: "get dispute", method: "GET", path: `/v1/customer/disputes/${HERO_ID}`, status: "200", say: "Read the case: not as described, due Nov 2" },
    { kind: "agent", at: "2026-10-23T16:47:16-07:00", say: "Read the claim: a sticking shutter at slow speeds and haze in the lens." },
    { kind: "paypal", at: "2026-10-23T16:47:18-07:00", dir: "out", name: "get order", method: "GET", path: "/v2/checkout/orders/{order}", status: "200", say: "Found the order: body $289.00, lens $85.00, shipping $38.00" },
    { kind: "paypal", at: "2026-10-23T16:47:19-07:00", dir: "out", name: "get tracker", method: "GET", path: "/v1/shipping/trackers/{capture}-1ZA6W4410367092155", status: "200", say: "Read the tracking you added: UPS, delivered Oct 14" },
    { kind: "buyer", at: "2026-10-23T16:45:00-07:00", words: "The shutter hangs at 1/15 and slower, it stays open for a second or two before it closes. There's also haze inside the 50mm when I hold it up to a light. The listing said tested and clean glass." },
    { kind: "agent", at: "2026-10-23T16:47:53-07:00", say: "Asked Daniel for a short video of the slow speeds before deciding." },
    { kind: "buyer", at: "2026-10-25T09:56:00-07:00", words: "Video attached. 1/8 and 1/4 both stick. The haze is faint but it's there." },
    { kind: "paypal", at: "2026-10-25T09:56:40-07:00", dir: "in", name: "CUSTOMER.DISPUTE.UPDATED", status: "verified", say: "PayPal passed on Daniel's video" },
    { kind: "agent", at: "2026-10-25T09:56:58-07:00", say: "Recommends fighting: the test roll and the signed delivery outweigh a shutter that slowed in transit.", detail: "Win chance 58%." },
    { kind: "agent", at: "2026-10-25T09:57:14-07:00", say: "Built the evidence pack: statement, order, delivery, listing, test roll, messages." },
  ],
};

type Lite = Omit<Case, "rows" | "headline" | "real"> & { rows?: Row[]; headline?: string };

const lite: Lite[] = [
  { id: "PP-R-PLZ-10225917", buyer: "Sam Whitfield", city: "Leeds, UK", item: "Rollei 35 S, Sonnar 40mm f/2.8", short: "Rollei 35 S", photo: "rollei-35", amount: "318.50", reason: "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED", stage: "CHARGEBACK", desk: "working", openedAt: "2026-10-16T13:22:00-07:00", dueAt: "2026-10-26T23:59:00-07:00", last: "Writing the evidence letter: meter tested before shipping, four listing photos show the lens", lastAt: "2026-10-25T10:36:00-07:00" },
  { id: "PP-R-HBW-10226180", buyer: "Marta Lindqvist", city: "Gothenburg, Sweden", item: "Hasselblad 500C/M, Planar 80mm f/2.8", short: "Hasselblad 500C/M", photo: "hasselblad", amount: "1240.00", reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED", stage: "INQUIRY", desk: "working", openedAt: "2026-10-17T02:08:00-07:00", dueAt: "2026-10-27T23:59:00-07:00", last: "Tracking shows the parcel held by Swedish customs; drafting a note to Marta", lastAt: "2026-10-25T10:12:00-07:00" },
  { id: "PP-R-TVA-10227066", buyer: "Grace Holloway", city: "Asheville, NC", item: "Kodak Portra 400, 135-36, pack of 5", short: "Kodak Portra 400", amount: "74.95", reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED", stage: "INQUIRY", desk: "approval", openedAt: "2026-10-19T18:40:00-07:00", dueAt: "2026-10-29T23:59:00-07:00", last: "Proposes a full $74.95 refund and a USPS claim; no scan since Oct 12", lastAt: "2026-10-24T08:15:00-07:00" },
  { id: "PP-R-JDM-10228390", buyer: "Aiko Nakamura", city: "Osaka, Japan", item: "Fujifilm Klasse W, 28mm f/2.8", short: "Fujifilm Klasse W", amount: "689.00", reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED", stage: "INQUIRY", desk: "new", openedAt: "2026-10-25T10:31:00-07:00", dueAt: "2026-11-04T23:59:00-08:00", last: "Just arrived from PayPal; reading the order and tracking", lastAt: "2026-10-25T10:31:00-07:00" },
  { id: "PP-R-CQF-10228844", buyer: "Kevin Tran", city: "San Jose, CA", item: "Contax T2, titanium, Sonnar 38mm f/2.8", short: "Contax T2", photo: "", amount: "1085.00", reason: "UNAUTHORISED", stage: "CHARGEBACK", desk: "paypal", openedAt: "2026-10-14T11:05:00-07:00", last: "Filed signed delivery and his three earlier orders; PayPal is deciding", lastAt: "2026-10-22T15:48:00-07:00" },
  { id: "PP-R-WEX-10226653", buyer: "Luis Ortega", city: "Madrid, Spain", item: "Nikon FM2n, Nikkor 50mm f/1.4 AI-S", short: "Nikon FM2n", photo: "nikon-fm2", amount: "529.00", reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED", stage: "CHARGEBACK", desk: "paypal", openedAt: "2026-10-09T07:51:00-07:00", last: "Filed the Correos delivery scan from Oct 6; PayPal is deciding", lastAt: "2026-10-20T09:30:00-07:00" },
  { id: "PP-R-RBN-10224961", buyer: "Hannah Cole", city: "Melbourne, Australia", item: "Canon AE-1 Program, FD 50mm f/1.8", short: "Canon AE-1 Program", amount: "289.00", reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED", stage: "CHARGEBACK", desk: "won", openedAt: "2026-10-02T21:14:00-07:00", last: "PayPal decided for you", lastAt: "2026-10-22T06:02:00-07:00", kept: "289.00" },
  { id: "PP-R-MGS-10224108", buyer: "Priya Raman", city: "Austin, TX", item: "Mamiya 7 II, N 80mm f/4", short: "Mamiya 7 II", amount: "2150.00", reason: "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED", stage: "CHARGEBACK", desk: "won", openedAt: "2026-09-29T12:30:00-07:00", last: "PayPal decided for you", lastAt: "2026-10-19T14:11:00-07:00", kept: "2150.00" },
  { id: "PP-R-SOF-10225302", buyer: "Olivia Grant", city: "Brooklyn, NY", item: "Yashica Electro 35 GSN, 45mm f/1.7", short: "Yashica Electro 35", amount: "149.00", reason: "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED", stage: "INQUIRY", desk: "settled", openedAt: "2026-10-07T17:26:00-07:00", last: "Olivia accepted a $40.00 partial refund and kept the camera", lastAt: "2026-10-18T10:44:00-07:00", settled: "40.00", kept: "109.00" },
];

const REASON: Record<string, string> = {
  MERCHANDISE_OR_SERVICE_NOT_RECEIVED: "never arrived",
  MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED: "is not as described",
  UNAUTHORISED: "was not his charge",
};

function fromLite(l: Lite): Case {
  const who = l.stage === "CHARGEBACK" ? `${l.buyer.split(" ")[0]}'s bank charged back` : `${l.buyer.split(" ")[0]} opened a case on`;
  const headline =
    l.headline ??
    (l.reason === "UNAUTHORISED"
      ? `${l.buyer}'s bank says the $${money(l.amount)} ${l.short} charge was not his.`
      : `${who} the $${money(l.amount)} ${l.short}. ${l.reason === "MERCHANDISE_OR_SERVICE_NOT_RECEIVED" ? "The claim: it never arrived." : "The claim: not as described."}`);
  const rows: Row[] = l.rows ?? [
    { kind: "paypal", at: l.openedAt, dir: "in", name: "CUSTOMER.DISPUTE.CREATED", status: "verified", say: l.stage === "CHARGEBACK" ? "PayPal opened the chargeback" : "PayPal opened the case" },
    { kind: "paypal", at: new Date(Date.parse(l.openedAt) + 2000).toISOString(), dir: "out", name: "get dispute", method: "GET", path: `/v1/customer/disputes/${l.id}`, status: "200", say: `Read the case: ${REASON[l.reason] ?? "other"}` },
    { kind: "agent", at: l.lastAt, say: l.last + "." },
  ];
  if (l.desk === "won" || l.desk === "settled") {
    rows.push({ kind: "paypal", at: l.lastAt, dir: "in", name: "CUSTOMER.DISPUTE.RESOLVED", status: "verified", say: l.desk === "won" ? "PayPal decided for you" : "The case closed with the settlement" });
  }
  return { ...l, real: false, headline, rows };
}

export const CASES: Case[] = [realCase(), hero, ...lite.map(fromLite)];
export const HERO = hero;

export function getCase(id: string): Case | undefined {
  return CASES.find((c) => c.id === id);
}

export const isOpen = (c: Case) => c.desk !== "won" && c.desk !== "settled";

/** Real case first (it is the proof), then open by deadline, then with PayPal, then closed. */
export function sorted(): Case[] {
  const rank = (c: Case) => (c.real ? -1 : c.dueAt ? 0 : isOpen(c) ? 1 : 2);
  return [...CASES].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r) return r;
    if (a.dueAt && b.dueAt) return Date.parse(a.dueAt) - Date.parse(b.dueAt);
    return Date.parse(b.lastAt) - Date.parse(a.lastAt);
  });
}

// ---------------------------------------------------------------- formatting

export function money(v: string | number): string {
  const n = typeof v === "number" ? v : Number(v);
  return Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export const usd = (v: string | number) => (Number(v) < 0 ? "−$" : "$") + money(v);

const f = (o: Intl.DateTimeFormatOptions, tz = TZ) => new Intl.DateTimeFormat("en-US", { timeZone: tz, ...o });
const dDay = f({ month: "short", day: "numeric" });
const dWeek = f({ weekday: "short" });
const dClock = f({ hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const dClockUtc = f({ hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }, "UTC");
const dDayUtc = f({ month: "short", day: "numeric" }, "UTC");

export const day = (iso: string) => dDay.format(new Date(iso));
export const weekday = (iso: string) => dWeek.format(new Date(iso));
/** Sample cases are in the seller's time (Pacific); the real case is shown in UTC, as PayPal logs it. */
export const clock = (iso: string, real = false) => (real ? dClockUtc : dClock).format(new Date(iso));
export const dayOf = (iso: string, real = false) => (real ? dDayUtc : dDay).format(new Date(iso));

export function hoursLeft(iso: string): number {
  return (Date.parse(iso) - Date.parse(SAMPLE_NOW)) / 3_600_000;
}
export function countdown(iso: string): string {
  const h = Math.floor(hoursLeft(iso));
  if (h <= 0) return "overdue";
  const d = Math.floor(h / 24);
  return d ? `${d} ${d === 1 ? "day" : "days"} ${h % 24} h` : `${h} h`;
}
export function dayOffset(iso: string): number {
  const ymd = (x: string) => f({ year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(x));
  return Math.round((Date.parse(ymd(iso)) - Date.parse(ymd(SAMPLE_NOW))) / 86_400_000);
}

/** The last real webhook PayPal sent us, for the masthead. */
export function lastRealWebhook(rows: Row[] = CASES[0].rows) {
  const w = [...rows].reverse().find((r) => r.kind === "paypal" && r.dir === "in");
  return w && w.kind === "paypal" ? w : undefined;
}
