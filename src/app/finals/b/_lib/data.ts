// Final B ("Darkroom paper") sample data: ten staged cases written for the design. Real cases come from the
// production API (see live.ts). Sample content never carries PayPal ids or PayPal statuses.

import type { EvidencePdfInput } from "@/lib/evidence/pdf";
import type { CaseRecord, OrderContext } from "@/lib/types";

export const TZ = "America/Los_Angeles";
/** The sample clock. Sample countdowns are measured from here, not from the viewer's clock. */
export const SAMPLE_NOW = "2026-10-25T10:40:00-07:00";

export const SELLER = { name: "Northlight Camera Exchange", city: "Portland, Oregon" };
export const POLICY = { approvalAboveUsd: 50, evidenceGateUsd: 250, maxOfferPercent: 40 };

export type Desk = "new" | "working" | "approval" | "paypal" | "won" | "settled";

/** A row of the case timeline. PayPal rows are the traffic at PayPal's boundary; the rest is our side. */
export type Row =
  | {
      kind: "paypal";
      at: string;
      dir: "in" | "out";
      name: string; // CUSTOMER.DISPUTE.CREATED, provide-evidence, get order
      method?: "GET" | "POST" | "PUT" | "PATCH";
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
  actionId?: string; // real cases: the action POST /api/actions/:id/approve executes
};

/**
 * money: how the money moved, in PayPal's own figures (fund movements and the capture), with what PayPal did not state.
 * sandbox: how the ruling came about when the sandbox simulator was asked for it.
 */
export type Ending = { sentence: string; kept: string; at: string; money?: string; sandbox?: string };

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
  headline: "Daniel Okafor's bank charged back the Olympus OM-1n he bought from you. He says the shutter sticks and the lens is hazy.",
  rationale:
    "The test roll from October 7 shows every speed working before it shipped, and UPS has his signature. His video shows the slow speeds sticking now, which reads as wear in transit. Fighting keeps more on average than refunding, and the camera stays sold.",
  values: [
    { name: "File the evidence", math: "55% you keep $412.00; 45% the camera comes back; the $20.00 chargeback fee either way", ev: "259.70", chosen: true },
    { name: "Accept the chargeback", math: "The camera comes back; the $20.00 chargeback fee", ev: "98.00" },
  ],
  valueNote: "A returned camera is worth $118.00 to you: $240.00 resale after a $95.00 shutter service, less $27.00 selling fees.",
  approval: {
    kind: "provide_evidence",
    head: "File this evidence with PayPal?",
    amount: "412.00",
    button: "File the evidence on $412.00",
    decline: "Decline, accept the claim instead",
    receives: "seller statement, order receipt, UPS delivery signed OKAFOR, listing photos, and the Oct 7 test roll.",
    policy: "Over your $250.00 evidence line, so it waits for you.",
    method: "POST",
    path: `/v1/customer/disputes/${HERO_ID}/provide-evidence`,
    name: "provide-evidence",
    sentLine: "Evidence filed with PayPal",
  },
  ending: { sentence: "PayPal decided for you. You kept $392.00: the $412.00 less the $20.00 chargeback fee. The camera stays with Daniel.", kept: "392.00", at: "2026-10-25T10:47:30-07:00" },
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
    { kind: "agent", at: "2026-10-25T09:56:58-07:00", say: "Recommends fighting: the test roll and the signed delivery outweigh a shutter that slowed in transit.", detail: "Win chance 55%. Filing keeps $259.70 on average; accepting keeps $98.00." },
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

export const CASES: Case[] = [hero, ...lite.map(fromLite)];
/** The samples the inbox lists. The staged Olympus sample stays reachable by its URL but is not listed: the real
 * $412 Olympus case carries that story now. */
export const LISTED: Case[] = CASES.slice(1);
export const HERO = hero;

export function getCase(id: string): Case | undefined {
  return CASES.find((c) => c.id === id);
}

export const isOpen = (c: Case) => c.desk !== "won" && c.desk !== "settled";

/** Real cases first (they are the proof), then open by deadline, then with PayPal, then closed. */
export function sorted(real: Case[] = []): Case[] {
  const rank = (c: Case) => (c.real ? (c.desk === "approval" ? -3 : c.desk === "won" ? -1 : -2) : c.dueAt ? 0 : isOpen(c) ? 1 : 2);
  return [...real, ...LISTED].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r) return r;
    // Real cases waiting for you: the most money first.
    if (a.real && b.real && a.desk === "approval" && b.desk === "approval") return Number(b.amount) - Number(a.amount);
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

export const day = (iso: string) => dDay.format(new Date(iso));
export const weekday = (iso: string) => dWeek.format(new Date(iso));
/** Every time is in the seller's time, Pacific, marked "PT" where it stands alone. */
export const clock = (iso: string, _real = false) => dClock.format(new Date(iso));
export const dayOf = (iso: string, _real = false) => dDay.format(new Date(iso));

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
