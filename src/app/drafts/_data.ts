// Fixture data for the two design drafts (/drafts/a, /drafts/b). Static, no API calls.
// Deleted after the owner picks a draft. Times are Pacific (the seller is in Portland, OR).

import type { DisputeStage, DisputeStatus, SellerPolicy } from "@/lib/types";

/** The fixture clock: every countdown on the draft pages is measured from here. */
export const NOW = "2026-10-25T10:40:00-07:00";
export const TZ = "America/Los_Angeles";

export const SELLER = {
  name: "Northlight Camera Exchange",
  city: "Portland, Oregon",
  merchantId: "LNGYMM7567428",
};

export const POLICY: SellerPolicy = {
  autoRefundMaxUsd: 15,
  approvalAboveUsd: 50,
  minWinProbabilityToFight: 0.45,
  maxOfferPercent: 45,
  dryRun: false,
  voice: "Friendly, brief, specific. Never blame the buyer.",
};

/** What CaseClerk is doing with the case, in the seller's words. */
export type DeskState = "new" | "working" | "waiting_paypal" | "approval" | "won" | "refunded";

export const STATE_LABEL: Record<DeskState, string> = {
  new: "New",
  working: "Agent working",
  waiting_paypal: "Waiting on PayPal",
  approval: "Needs your approval",
  won: "Won",
  refunded: "Refunded",
};

export const REASON_LABEL: Record<string, string> = {
  MERCHANDISE_OR_SERVICE_NOT_RECEIVED: "Not received",
  MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED: "Not as described",
  UNAUTHORISED: "Unauthorised",
  DUPLICATE_TRANSACTION: "Duplicate transaction",
};

export const STATUS_LABEL: Record<DisputeStatus, string> = {
  OPEN: "Open",
  WAITING_FOR_BUYER_RESPONSE: "Waiting for buyer",
  WAITING_FOR_SELLER_RESPONSE: "Waiting for your response",
  UNDER_REVIEW: "Under review",
  RESOLVED: "Resolved",
  OTHER: "Other",
};

/** PayPal outcome codes in the seller's words. */
export const OUTCOME_LABEL: Record<string, string> = {
  RESOLVED_SELLER_FAVOUR: "Decided for you",
  RESOLVED_BUYER_FAVOUR: "Settled with the buyer",
  RESOLVED_WITH_PAYOUT: "PayPal covered it",
  CANCELED_BY_BUYER: "Buyer cancelled",
};

export type Shipment = { carrier: string; service: string; tracking: string; status: string };

export type InboxCase = {
  id: string; // PayPal dispute id
  buyer: string;
  buyerCity: string;
  item: string;
  amount: string; // USD, two decimals
  reason: keyof typeof REASON_LABEL;
  stage: DisputeStage;
  status: DisputeStatus;
  state: DeskState;
  openedAt: string;
  dueAt?: string; // seller_response_due_date
  lastEvent: string; // what happened last, one line
  lastEventAt: string;
  shipment: Shipment;
  agentCostUsd: number;
  outcome?: string; // PayPal outcome code, closed cases
  closedAt?: string;
  settledUsd?: string; // money that went back to the buyer, closed cases
  claim: string; // the buyer's first message, as PayPal shows it
};

export const CASES: InboxCase[] = [
  {
    id: "PP-R-PLZ-10225917",
    buyer: "Sam Whitfield",
    buyerCity: "Leeds, UK",
    item: "Rollei 35 S, Sonnar 40mm f/2.8",
    amount: "318.50",
    reason: "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED",
    stage: "CHARGEBACK",
    status: "WAITING_FOR_SELLER_RESPONSE",
    state: "working",
    openedAt: "2026-10-16T13:22:00-07:00",
    dueAt: "2026-10-26T23:59:00-07:00",
    lastEvent: "Writing the evidence letter: meter tested before shipping, 4 listing photos show the lens",
    lastEventAt: "2026-10-25T10:36:00-07:00",
    shipment: { carrier: "UPS", service: "Worldwide Saver", tracking: "1ZA6W4416603418279", status: "Delivered Oct 8, Leeds" },
    agentCostUsd: 0.1122,
    claim: "The light meter doesn't move at all and there's a scratch on the front of the lens that wasn't in the photos.",
  },
  {
    id: "PP-R-HBW-10226180",
    buyer: "Marta Lindqvist",
    buyerCity: "Gothenburg, Sweden",
    item: "Hasselblad 500C/M, Planar 80mm f/2.8",
    amount: "1240.00",
    reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
    stage: "INQUIRY",
    status: "WAITING_FOR_SELLER_RESPONSE",
    state: "working",
    openedAt: "2026-10-17T02:08:00-07:00",
    dueAt: "2026-10-27T23:59:00-07:00",
    lastEvent: "Tracking shows the parcel held by Swedish customs since Oct 15; drafting a note to the buyer",
    lastEventAt: "2026-10-25T10:12:00-07:00",
    shipment: { carrier: "USPS", service: "Priority Mail Express International", tracking: "EA712304961US", status: "Held in customs, Malmö" },
    agentCostUsd: 0.0874,
    claim: "It's been three weeks and the tracking hasn't changed since it reached Sweden. I paid for express.",
  },
  {
    id: "PP-R-TVA-10227066",
    buyer: "Grace Holloway",
    buyerCity: "Asheville, NC",
    item: "Kodak Portra 400, 135-36, pack of 5",
    amount: "74.95",
    reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
    stage: "INQUIRY",
    status: "WAITING_FOR_SELLER_RESPONSE",
    state: "approval",
    openedAt: "2026-10-19T18:40:00-07:00",
    dueAt: "2026-10-29T23:59:00-07:00",
    lastEvent: "Proposes a full refund of $74.95; no USPS scan since Oct 12, file a claim with USPS",
    lastEventAt: "2026-10-24T08:15:00-07:00",
    shipment: { carrier: "USPS", service: "Ground Advantage", tracking: "9400111202062457813648", status: "In transit, last scan Oct 12, Charlotte NC" },
    agentCostUsd: 0.0613,
    claim: "My film never showed up. Tracking has said in transit since the 12th.",
  },
  {
    id: "PP-R-NKT-10227591",
    buyer: "Daniel Okafor",
    buyerCity: "Toronto, Canada",
    item: "Olympus OM-1n, Zuiko 50mm f/1.8",
    amount: "412.00",
    reason: "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED",
    stage: "INQUIRY",
    status: "WAITING_FOR_SELLER_RESPONSE",
    state: "approval",
    openedAt: "2026-10-23T16:47:00-07:00",
    dueAt: "2026-11-02T23:59:00-08:00",
    lastEvent: "Proposes a $180.00 partial refund, buyer keeps the camera",
    lastEventAt: "2026-10-25T09:57:00-07:00",
    shipment: { carrier: "UPS", service: "Worldwide Saver", tracking: "1ZA6W4410367092155", status: "Delivered Oct 14, Toronto" },
    agentCostUsd: 0.1304,
    claim: "Hi, the OM-1 arrived well packed but the shutter hangs at 1/15 and slower, it stays open for a second or two before it closes. There's also haze inside the 50mm when I hold it up to a light. The listing said tested and clean glass. I'd like to return it or get a refund.",
  },
  {
    id: "PP-R-JDM-10228390",
    buyer: "Aiko Nakamura",
    buyerCity: "Osaka, Japan",
    item: "Fujifilm Klasse W, 28mm f/2.8",
    amount: "689.00",
    reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
    stage: "INQUIRY",
    status: "WAITING_FOR_SELLER_RESPONSE",
    state: "new",
    openedAt: "2026-10-25T10:31:00-07:00",
    dueAt: "2026-11-04T23:59:00-08:00",
    lastEvent: "PayPal webhook CUSTOMER.DISPUTE.CREATED received",
    lastEventAt: "2026-10-25T10:31:00-07:00",
    shipment: { carrier: "USPS", service: "Priority Mail International", tracking: "CP582190364US", status: "Arrived Osaka, Oct 21" },
    agentCostUsd: 0,
    claim: "Tracking says it arrived in Osaka on the 21st but nothing has been delivered to me.",
  },
  {
    id: "PP-R-CQF-10228844",
    buyer: "Kevin Tran",
    buyerCity: "San Jose, CA",
    item: "Contax T2, titanium, Sonnar 38mm f/2.8",
    amount: "1085.00",
    reason: "UNAUTHORISED",
    stage: "CHARGEBACK",
    status: "UNDER_REVIEW",
    state: "waiting_paypal",
    openedAt: "2026-10-14T11:05:00-07:00",
    lastEvent: "Evidence accepted by PayPal: signed delivery, AVS match, buyer's 3 earlier orders",
    lastEventAt: "2026-10-22T15:48:00-07:00",
    shipment: { carrier: "UPS", service: "2nd Day Air", tracking: "1ZA6W4410261209345", status: "Delivered Oct 3, signed TRAN" },
    agentCostUsd: 0.1418,
    claim: "I don't recognise this charge.",
  },
  {
    id: "PP-R-WEX-10226653",
    buyer: "Luis Ortega",
    buyerCity: "Madrid, Spain",
    item: "Nikon FM2n, Nikkor 50mm f/1.4 AI-S",
    amount: "529.00",
    reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
    stage: "CHARGEBACK",
    status: "UNDER_REVIEW",
    state: "waiting_paypal",
    openedAt: "2026-10-09T07:51:00-07:00",
    lastEvent: "Evidence accepted by PayPal: Correos delivery scan Oct 6, Madrid",
    lastEventAt: "2026-10-20T09:30:00-07:00",
    shipment: { carrier: "USPS", service: "First-Class Package International", tracking: "LZ047188238US", status: "Delivered Oct 6, Madrid" },
    agentCostUsd: 0.1036,
    claim: "I never received the camera.",
  },
  {
    id: "PP-R-RBN-10224961",
    buyer: "Hannah Cole",
    buyerCity: "Melbourne, Australia",
    item: "Canon AE-1 Program, FD 50mm f/1.8",
    amount: "289.00",
    reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
    stage: "CHARGEBACK",
    status: "RESOLVED",
    state: "won",
    openedAt: "2026-10-02T21:14:00-07:00",
    lastEvent: "PayPal decided in your favour",
    lastEventAt: "2026-10-22T06:02:00-07:00",
    shipment: { carrier: "USPS", service: "Priority Mail International", tracking: "CP610472859US", status: "Delivered Sep 26, Melbourne" },
    agentCostUsd: 0.0951,
    claim: "The camera never arrived.",
    outcome: "RESOLVED_SELLER_FAVOUR",
    closedAt: "2026-10-22T06:02:00-07:00",
  },
  {
    id: "PP-R-MGS-10224108",
    buyer: "Priya Raman",
    buyerCity: "Austin, TX",
    item: "Mamiya 7 II, N 80mm f/4",
    amount: "2150.00",
    reason: "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED",
    stage: "CHARGEBACK",
    status: "RESOLVED",
    state: "won",
    openedAt: "2026-09-29T12:30:00-07:00",
    lastEvent: "PayPal decided in your favour",
    lastEventAt: "2026-10-19T14:11:00-07:00",
    shipment: { carrier: "FedEx", service: "2Day", tracking: "774910364852", status: "Delivered Sep 22, Austin" },
    agentCostUsd: 0.1583,
    claim: "The rangefinder is misaligned, infinity focus is off. Not the excellent condition described.",
    outcome: "RESOLVED_SELLER_FAVOUR",
    closedAt: "2026-10-19T14:11:00-07:00",
  },
  {
    id: "PP-R-SOF-10225302",
    buyer: "Olivia Grant",
    buyerCity: "Brooklyn, NY",
    item: "Yashica Electro 35 GSN, 45mm f/1.7",
    amount: "149.00",
    reason: "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED",
    stage: "INQUIRY",
    status: "RESOLVED",
    state: "refunded",
    openedAt: "2026-10-07T17:26:00-07:00",
    lastEvent: "Buyer accepted a $40.00 partial refund and kept the camera",
    lastEventAt: "2026-10-18T10:44:00-07:00",
    shipment: { carrier: "USPS", service: "Priority Mail", tracking: "9405510899300275166406", status: "Delivered Oct 4, Brooklyn" },
    agentCostUsd: 0.0702,
    claim: "The battery check light doesn't come on and the viewfinder has a lot of dust inside.",
    outcome: "RESOLVED_BUYER_FAVOUR",
    closedAt: "2026-10-18T10:44:00-07:00",
    settledUsd: "40.00",
  },
  {
    id: "PP-R-ELK-10223775",
    buyer: "Thomas Becker",
    buyerCity: "Munich, Germany",
    item: "Pentax K1000, SMC Pentax-M 50mm f/2",
    amount: "214.00",
    reason: "DUPLICATE_TRANSACTION",
    stage: "INQUIRY",
    status: "RESOLVED",
    state: "refunded",
    openedAt: "2026-10-05T03:48:00-07:00",
    lastEvent: "You approved a $214.00 refund of the second charge",
    lastEventAt: "2026-10-16T08:20:00-07:00",
    shipment: { carrier: "USPS", service: "Priority Mail International", tracking: "CP703185461US", status: "Delivered Oct 1, Munich" },
    agentCostUsd: 0.0389,
    claim: "I was charged twice for the same camera, please refund the second payment.",
    outcome: "RESOLVED_BUYER_FAVOUR",
    closedAt: "2026-10-16T08:20:00-07:00",
    settledUsd: "214.00",
  },
];

/** Open cases by deadline (soonest first), then cases with PayPal, then closed cases (latest first). */
export function sortedCases(): InboxCase[] {
  const rank = (c: InboxCase) => (c.dueAt ? 0 : c.closedAt ? 2 : 1);
  return [...CASES].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r) return r;
    if (a.dueAt && b.dueAt) return Date.parse(a.dueAt) - Date.parse(b.dueAt);
    return Date.parse(b.lastEventAt) - Date.parse(a.lastEventAt);
  });
}

// ---- The hero case: PP-R-NKT-10227591 ----

export const HERO_ID = "PP-R-NKT-10227591";

export const HERO = {
  id: HERO_ID,
  amount: "412.00",
  reason: "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED",
  stage: "INQUIRY" as DisputeStage,
  status: "WAITING_FOR_SELLER_RESPONSE" as DisputeStatus,
  channel: "INTERNAL",
  openedAt: "2026-10-23T16:47:00-07:00",
  dueAt: "2026-11-02T23:59:00-08:00",
  allowed: ["send_message", "make_offer", "accept_claim"],
  buyer: { name: "Daniel Okafor", city: "Toronto, Ontario", country: "CA", earlierOrders: 2, earlierDisputes: 0 },
  order: {
    id: "5O190127TN364715T",
    captureId: "8MC585209K746392H",
    paidAt: "2026-10-09T14:03:00-07:00",
    lines: [
      { name: "Olympus OM-1n body, chrome, serial 1428803", amount: "289.00" },
      { name: "Zuiko Auto-S 50mm f/1.8", amount: "85.00" },
      { name: "UPS Worldwide Saver to Toronto", amount: "38.00" },
    ],
    listingNote: "Tested with a roll of Portra 400. Clean glass, light brassing on the top plate.",
  },
  shipment: {
    carrier: "UPS",
    service: "Worldwide Saver",
    tracking: "1ZA6W4410367092155",
    shippedAt: "2026-10-10T15:20:00-07:00",
    deliveredAt: "2026-10-14T11:02:00-04:00",
    signedBy: "OKAFOR",
  },
  claim: {
    at: "2026-10-23T16:45:00-07:00",
    text:
      "Hi, the OM-1 arrived well packed but the shutter hangs at 1/15 and slower, it stays open for a second or two before it closes. There's also haze inside the 50mm when I hold it up to a light. The listing said tested and clean glass. I'd like to return it or get a refund.",
  },
  messages: [
    {
      by: "BUYER",
      at: "2026-10-23T16:45:00-07:00",
      text:
        "Hi, the OM-1 arrived well packed but the shutter hangs at 1/15 and slower, it stays open for a second or two before it closes. There's also haze inside the 50mm when I hold it up to a light. The listing said tested and clean glass. I'd like to return it or get a refund.",
    },
    {
      by: "SELLER",
      at: "2026-10-23T16:47:53-07:00",
      text:
        "Hi Daniel, thanks for the clear description, and sorry it isn't right. We shot a test roll on this body before it shipped and the slow speeds were fine then, but a cold flight can make a 45-year-old shutter sluggish. Could you send a short video at 1/8 and a photo of the lens held up to a light? We'll sort it out either way.",
    },
    {
      by: "BUYER",
      at: "2026-10-25T09:56:00-07:00",
      text:
        "Video attached. 1/8 and 1/4 both stick. The haze is faint but it's there. Honestly I like the camera. If you knocked something off I'd keep it and have the shutter serviced here.",
    },
  ],
  approval: {
    actionId: "a3f1c9e2-58b4-4d1e-9c07-2b6e1f4d8a10",
    kind: "make_offer",
    amount: "180.00",
    offerType: "REFUND",
    note:
      "Hi Daniel, thanks for the video. Keep the camera and we'll refund $180.00 toward a shutter service. If you'd still rather send it back, say so and we'll email a prepaid label.",
  },
  evidence: {
    file: "PP-R-NKT-10227591-evidence.pdf",
    builtAt: "2026-10-25T09:57:14-07:00",
    pages: 4,
    exhibits: [
      { ref: "A", name: "Order receipt", detail: "Order 5O190127TN364715T, paid Oct 9, $412.00" },
      { ref: "B", name: "UPS proof of delivery", detail: "1ZA6W4410367092155, delivered Oct 14, signed OKAFOR" },
      { ref: "C", name: "Listing as published", detail: "Archived Oct 6, 7 photos, condition notes" },
      { ref: "D", name: "Pre-shipment test roll", detail: "Portra 400, 36 frames shot Oct 7, scans at 1/8 to 1/1000" },
      { ref: "E", name: "Message thread", detail: "3 messages, Oct 23 to Oct 25" },
    ],
  },
};

// ---- Formatting (fixed time zone so server and phone renders agree) ----

export function usd(value: string | number): string {
  const n = typeof value === "number" ? value : Number(value);
  const s = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n < 0 ? "−$" : "$") + s;
}

export function cost(n: number): string {
  return "$" + n.toFixed(4);
}

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, ...o });
const dDay = fmt({ month: "short", day: "numeric" });
const dTime = fmt({ hour: "numeric", minute: "2-digit" });
const dClock = fmt({ hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const dWeek = fmt({ weekday: "short" });

export const day = (iso: string) => dDay.format(new Date(iso));
export const time = (iso: string) => dTime.format(new Date(iso)).replace(" AM", " am").replace(" PM", " pm");
export const clock = (iso: string) => dClock.format(new Date(iso));
export const weekday = (iso: string) => dWeek.format(new Date(iso));

/** "1 day 13 h" style countdown from the fixture clock. */
export function countdown(iso: string): string {
  const ms = Date.parse(iso) - Date.parse(NOW);
  if (ms <= 0) return "overdue";
  const h = Math.floor(ms / 3_600_000);
  const d = Math.floor(h / 24);
  const rh = h % 24;
  if (d === 0) return `${rh} h`;
  return `${d} ${d === 1 ? "day" : "days"} ${rh} h`;
}

export function hoursLeft(iso: string): number {
  return (Date.parse(iso) - Date.parse(NOW)) / 3_600_000;
}

/** Whole days from the fixture day to the date (Pacific calendar days). */
export function dayOffset(iso: string): number {
  const ymd = (x: string) => fmt({ year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(x));
  const a = Date.parse(ymd(NOW));
  const b = Date.parse(ymd(iso));
  return Math.round((b - a) / 86_400_000);
}

/** The next n calendar days starting today, as ISO noon timestamps (Pacific). */
export function nextDays(n: number): string[] {
  const out: string[] = [];
  const base = Date.parse("2026-10-25T12:00:00-07:00");
  for (let i = 0; i < n; i++) out.push(new Date(base + i * 86_400_000).toISOString());
  return out;
}

/** "43 min ago" within a day of the fixture clock, else the date and time. */
export function ago(iso: string): string {
  const m = Math.round((Date.parse(NOW) - Date.parse(iso)) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 24 * 60) return `${Math.floor(m / 60)} h ${m % 60} min ago`;
  return `${day(iso)}, ${time(iso)}`;
}
