// Turns one case's real audit, wire and money rows into the stops the engraved scale shows.
import type { CaseMoney } from "@/lib/paypal/money";
import type { CaseBundle } from "./api";
import { clock, reasonWords, secondsBetween, stageWord, usd } from "./format";
import { sellerWon } from "./state";

export type Tone = "done" | "ask" | "kept" | "lost" | "next";

export type Stop = {
  id: string;
  /** seconds after the dispute reached CaseClerk */
  t: number;
  at: string;
  title: string;
  detail: string;
  tone: Tone;
  /** Dot only, no label (stops too close together to name separately). */
  quiet?: boolean;
  /** PayPal's own proof for this stop, shown only in the details layer */
  proof?: { label: string; value: string }[];
};

export type Tick = { t: number; label: string; /** label hidden when the scale is narrow */ narrow?: "hide" };

/** Log scale for elapsed time, like a shutter-speed dial: equal steps for 15 s, 30 s, 1 min, 2 min … */
export const logPos = (t: number, tau: number, tMax: number) => Math.log2(1 + t / tau) / Math.log2(1 + tMax / tau);

const usdM = (v: string) => ({ value: v, currency_code: "USD" });
const cents = (v: string) => Math.round(Number(v) * 100);
/** One resolved case's money as PayPal stated it: the capture's gross and fee, the hold placed and released in full. */
function stated(gross: string, fee: string, captureId: string, at: string, placed?: string, released?: string): CaseMoney {
  const net = ((cents(gross) - cents(fee)) / 100).toFixed(2);
  return {
    gross: usdM(gross),
    fee: usdM(fee),
    net: usdM(net),
    kept: usdM(net),
    source: "paypal_fund_movements",
    at,
    captureId,
    movements:
      placed && released
        ? [
            { type: "DEBIT", reason: "HOLD_PLACED", amount: usdM(net), at: placed },
            { type: "CREDIT", reason: "HOLD_RELEASED", amount: usdM(net), at: released },
          ]
        : [],
  };
}

/**
 * Money PayPal stated for resolved cases, recorded from its fund_movements and capture breakdown
 * (docs/REAL-CASES.md, read 2026-10-25). Used only while a case's `money` from the API is absent.
 */
const STATED: Record<string, CaseMoney> = {
  "PP-R-SGV-10194507": stated("397.00", "10.77", "0VJ18807MY614672J", "2026-10-25T13:04:00Z", "2026-10-25T12:50:34Z", "2026-10-25T12:57:53Z"),
  "PP-R-IHX-10194506": stated("391.00", "10.62", "99220792RT677781T", "2026-10-25T13:04:00Z", "2026-10-25T12:43:00Z", "2026-10-25T12:51:33Z"),
  "PP-R-EGZ-10194505": stated("394.00", "10.69", "2E877808LW833145X", "2026-10-25T13:04:00Z", "2026-10-25T12:43:04Z", "2026-10-25T12:50:33Z"),
  "PP-R-IMW-10194496": stated("393.00", "10.67", "1PA13666SL883415A", "2026-10-25T13:04:00Z", "2026-10-25T10:59:34Z", "2026-10-25T11:34:04Z"),
  "PP-R-AAJ-10194495": stated("396.00", "10.75", "8BW77137DH722621Y", "2026-10-25T13:04:00Z", "2026-10-25T10:59:34Z", "2026-10-25T11:29:46Z"),
  "PP-R-TZD-10194493": stated("402.00", "10.90", "3SF344296A2880101", "2026-10-25T10:45:00Z", "2026-10-25T10:15:34Z", "2026-10-25T10:30:34Z"),
  "PP-R-UDP-10194489": stated("405.00", "10.98", "8MN60180883817530", "2026-10-25T10:45:00Z", "2026-10-25T09:40:04Z", "2026-10-25T09:58:34Z"),
  "PP-R-LTK-10194490": stated("398.00", "10.80", "3XF555001T731522H", "2026-10-25T10:45:00Z", "2026-10-25T09:40:04Z", "2026-10-25T09:55:04Z"),
  "PP-R-NJA-10194486": stated("389.00", "10.57", "3D572951SP109543G", "2026-10-25T10:45:00Z", "2026-10-25T08:36:50Z", "2026-10-25T08:45:34Z"),
  "PP-R-RCJ-10194476": stated("27.95", "1.21", "5X314671C5018893S", "2026-10-25T10:45:00Z", "2026-10-25T06:24:34Z", "2026-10-25T06:31:04Z"),
};

export const moneyFor = (b: Pick<CaseBundle, "case" | "money">): CaseMoney | null => b.money ?? STATED[b.case.id] ?? null;
/** For list rows, which carry no `money`: the recorded figures only. */
export const statedMoney = (id: string): CaseMoney | null => STATED[id] ?? null;

const firstAudit = (b: CaseBundle, kind: string) => b.audit.find((a) => a.kind === kind);
const lastAudit = (b: CaseBundle, kind: string) => [...b.audit].reverse().find((a) => a.kind === kind);

/** When the dispute reached CaseClerk: the first verified webhook delivery, else the first audit row. */
export const arrivedAt = (b: CaseBundle) =>
  b.wire.find((w) => w.kind === "event" && w.eventType === "CUSTOMER.DISPUTE.CREATED")?.at ??
  b.audit[0]?.at ??
  b.case.createdAt;

/** The evidence filing: PayPal's answer to POST provide-evidence, from the wire, else from the audit. */
export function filingOf(b: CaseBundle) {
  const call = b.wire.find((w) => w.kind === "call" && w.method === "POST" && /provide-evidence$/.test(w.path ?? ""));
  const action = b.actions.find((a) => a.kind === "provide_evidence" && a.status === "executed");
  const executed = b.audit.find((a) => a.kind === "action.executed");
  const at = call?.at ?? executed?.at;
  if (!at) return null;
  return {
    at,
    status: call?.status ?? action?.result?.httpStatus ?? 200,
    debugId: call?.debugId ?? action?.result?.debugId,
    path: call?.path,
    /** filed under the seller's yes, or on its own under the seller's line */
    approved: Boolean(firstAudit(b, "action.approved")) || Boolean(action?.requiresApproval),
  };
}

/** PayPal's webhooks after the filing: its latest word on the case while it reviews. */
export function lastWebhook(b: CaseBundle) {
  return [...b.wire].reverse().find((w) => w.kind === "event");
}

export function storyStops(b: CaseBundle, voice: "story" | "seller" = "story"): Stop[] {
  const c = b.case;
  const t0 = arrivedAt(b);
  const amount = usd(c.snapshot.amount.value);
  const m = moneyFor(b);
  const stops: Stop[] = [];
  const add = (s: Omit<Stop, "t">) => stops.push({ ...s, t: secondsBetween(t0, s.at) });
  const you = voice === "seller";

  const created = b.wire.find((w) => w.kind === "event" && w.eventType === "CUSTOMER.DISPUTE.CREATED");
  add({
    id: "in",
    at: t0,
    title: `${stageWord(c.snapshot.stage)[0].toUpperCase()}${stageWord(c.snapshot.stage).slice(1)} in`,
    detail: `${amount}, ${reasonWords(c.snapshot.reason)}`,
    tone: "done",
    proof: created?.eventId ? [{ label: "Webhook", value: created.eventId }] : undefined,
  });

  const tracking = firstAudit(b, "tool.get_tracking");
  const shipping = c.order?.shipping?.[0];
  if (tracking) {
    add({
      id: "read",
      at: tracking.at,
      title: "Order and tracking read",
      detail: shipping ? `${shipping.carrier}: ${shipping.status === "DELIVERED" ? "delivered" : (shipping.status ?? "in transit").toLowerCase()}` : "No tracking on the order",
      tone: "done",
    });
  }

  const asked = firstAudit(b, "action.awaiting_approval");
  if (asked) {
    add({ id: "ask", at: asked.at, title: you ? "Asked you" : "Asked the seller", detail: "Over the $250 line", tone: "ask" });
  }

  const filed = filingOf(b);
  if (filed) {
    add({
      id: "filed",
      at: filed.at,
      title: filed.approved ? (you ? "You said yes. Filed" : "Seller said yes. Filed") : "Filed on its own",
      detail: filed.status === 200 ? "PayPal accepted it" : `PayPal answered ${filed.status}`,
      tone: "done",
      proof: [
        ...(filed.path ? [{ label: "Call", value: `POST ${filed.path}` }] : []),
        { label: "Status", value: String(filed.status) },
        ...(filed.debugId ? [{ label: "Debug id", value: filed.debugId }] : []),
      ],
    });
  }

  const denied = firstAudit(b, "action.denied");
  if (denied) add({ id: "denied", at: denied.at, title: you ? "You said no" : "Seller said no", detail: "Nothing was filed", tone: "done" });

  const stopped = lastAudit(b, "agent.error");
  if (stopped && c.status === "error") add({ id: "error", at: stopped.at, title: "Stopped on an error", detail: "Nothing sent to PayPal", tone: "done" });

  const resolved = b.wire.find((w) => w.kind === "event" && w.eventType === "CUSTOMER.DISPUTE.RESOLVED");
  const closedAt = resolved?.at ?? [...b.audit].reverse().find((a) => a.kind === "webhook.received" && /resolved/i.test(a.summary))?.at;
  if (c.status === "resolved" && closedAt) {
    const won = sellerWon(c);
    add({
      id: "kept",
      at: closedAt,
      title: won ? (you ? "Closed for you" : "Closed for the seller") : "Closed for the buyer",
      detail: won ? (m ? `${usd(m.kept.value)} kept` : "PayPal ruled for you") : `${amount} to the buyer`,
      tone: won ? "kept" : "lost",
      // The hold release sits too near the close on a log scale to label apart; PayPal's capture id stands for it in the proof.
      proof: [
        ...(resolved?.eventId ? [{ label: "Webhook", value: resolved.eventId }] : []),
        ...(m?.captureId ? [{ label: "Capture", value: m.captureId }] : []),
      ],
    });
  }
  return stops.sort((a, b2) => a.t - b2.t);
}

/** Drops stops whose dots would touch: within `gap` of the axis, the lower-ranked one goes (its words live on in its neighbour). */
export function foldClose(stops: Stop[], pos: (t: number) => number, gap: number): Stop[] {
  const rank = (s: Stop) => ({ in: 0, kept: 1, now: 2, filed: 3, ask: 4, denied: 4, error: 4 })[s.id] ?? 9;
  const out: Stop[] = [];
  for (const s of stops) {
    const prev = out[out.length - 1];
    if (prev && pos(s.t) - pos(prev.t) < gap) {
      if (rank(s) < rank(prev)) out[out.length - 1] = s;
      continue;
    }
    out.push(s);
  }
  return out;
}

const STEPS: Tick[] = [
  { t: 15, label: "15 s" },
  { t: 30, label: "30 s" },
  { t: 60, label: "1 min" },
  { t: 120, label: "2 min" },
  { t: 240, label: "4 min" },
  { t: 600, label: "10 min" },
  { t: 900, label: "15 min" },
  { t: 1800, label: "30 min" },
  { t: 3600, label: "1 h" },
  { t: 21600, label: "6 h" },
  { t: 86400, label: "1 day" },
  { t: 259200, label: "3 days" },
  { t: 604800, label: "7 days" },
];

/** Shutter-like ticks for a scale: kept at least `gap` apart, clear of the axis end; fewer labels when narrow. */
export function ticksFor(tau: number, tMax: number, endAt = 0.94, gap = 0.1): Tick[] {
  const out: Tick[] = [];
  for (const s of STEPS) {
    const p = logPos(s.t, tau, tMax);
    if (p >= endAt) break;
    if (out.length && p - logPos(out[out.length - 1].t, tau, tMax) < gap) continue;
    out.push({ ...s });
  }
  // narrow: every other label, and none near the right end, where the end label (the deadline) is engraved
  return out.map((t, i) =>
    (i % 2 === 0 && i !== out.length - 1) || logPos(t.t, tau, tMax) > 0.74 ? { ...t, narrow: "hide" as const } : t,
  );
}

export const STORY_TICKS: Tick[] = [
  { t: 15, label: "15 s", narrow: "hide" },
  { t: 30, label: "30 s" },
  { t: 60, label: "1 min" },
  { t: 120, label: "2 min" },
  { t: 240, label: "4 min" },
  { t: 480, label: "8 min", narrow: "hide" },
  { t: 900, label: "15 min" },
];

export const startedLine = (b: CaseBundle) => `${clock(arrivedAt(b))} PT`;
