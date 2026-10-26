// Turns one case's real audit, wire and money rows into the stops the engraved scale shows.
import type { CaseMoney } from "@/lib/paypal/money";
import type { CaseBundle } from "./api";
import { clock, reasonWords, secondsBetween, stageWord, usd } from "./format";

export type Tone = "done" | "ask" | "kept" | "next";

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

/**
 * Money PayPal stated for resolved cases, recorded from its fund_movements and capture breakdown
 * (docs/REAL-CASES.md, read 2026-10-25 13:04 UTC). Used only while the production API predates `money`.
 */
const STATED: Record<string, CaseMoney> = {
  "PP-R-SGV-10194507": {
    gross: { value: "397.00", currency_code: "USD" },
    fee: { value: "10.77", currency_code: "USD" },
    net: { value: "386.23", currency_code: "USD" },
    kept: { value: "386.23", currency_code: "USD" },
    source: "paypal_fund_movements",
    at: "2026-10-25T13:04:00Z",
    captureId: "0VJ18807MY614672J",
    movements: [
      { type: "DEBIT", reason: "HOLD_PLACED", amount: { value: "386.23", currency_code: "USD" }, at: "2026-10-25T12:50:34Z" },
      { type: "CREDIT", reason: "HOLD_RELEASED", amount: { value: "386.23", currency_code: "USD" }, at: "2026-10-25T12:57:53Z" },
    ],
  },
};

export const moneyFor = (b: CaseBundle): CaseMoney | null => b.money ?? STATED[b.case.id] ?? null;

const firstAudit = (b: CaseBundle, kind: string) => b.audit.find((a) => a.kind === kind);
const lastAudit = (b: CaseBundle, kind: string) => [...b.audit].reverse().find((a) => a.kind === kind);

/** When the dispute reached CaseClerk: the first verified webhook delivery, else the first audit row. */
export const arrivedAt = (b: CaseBundle) =>
  b.wire.find((w) => w.kind === "event" && w.eventType === "CUSTOMER.DISPUTE.CREATED")?.at ??
  b.audit[0]?.at ??
  b.case.createdAt;

export function storyStops(b: CaseBundle): Stop[] {
  const c = b.case;
  const t0 = arrivedAt(b);
  const amount = usd(c.snapshot.amount.value);
  const m = moneyFor(b);
  const stops: Stop[] = [];
  const add = (s: Omit<Stop, "t">) => stops.push({ ...s, t: secondsBetween(t0, s.at) });

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
      detail: shipping ? `${shipping.carrier}: ${shipping.status === "DELIVERED" ? "delivered" : (shipping.status ?? "in transit").toLowerCase()}` : "From PayPal",
      tone: "done",
    });
  }

  const asked = firstAudit(b, "action.awaiting_approval");
  if (asked) {
    add({ id: "ask", at: asked.at, title: "Asked the seller", detail: "Over the $250 line", tone: "ask" });
  }

  const filed = b.wire.find((w) => w.kind === "call" && w.method === "POST" && /provide-evidence$/.test(w.path ?? ""));
  const approved = firstAudit(b, "action.approved");
  if (filed) {
    add({
      id: "filed",
      at: filed.at,
      title: approved ? "Seller said yes. Filed" : "Evidence filed",
      detail: filed.status === 200 ? "PayPal accepted it" : `PayPal answered ${filed.status}`,
      tone: "done",
      proof: [
        { label: "Call", value: `POST ${filed.path}` },
        { label: "Status", value: String(filed.status) },
        ...(filed.debugId ? [{ label: "Debug id", value: filed.debugId }] : []),
      ],
    });
  }

  const resolved = b.wire.find((w) => w.kind === "event" && w.eventType === "CUSTOMER.DISPUTE.RESOLVED");
  const closedAt = resolved?.at ?? lastAudit(b, "webhook.received")?.at;
  if (c.status === "resolved" && closedAt) {
    add({
      id: "kept",
      at: closedAt,
      title: "Closed for the seller",
      detail: m ? `${usd(m.kept.value)} kept` : "Resolved",
      tone: "kept",
      // The hold release sits too near the close on a log scale to label apart; PayPal's capture id stands for it in the proof.
      proof: [
        ...(resolved?.eventId ? [{ label: "Webhook", value: resolved.eventId }] : []),
        ...(m?.captureId ? [{ label: "Capture", value: m.captureId }] : []),
      ],
    });
  }
  return stops.sort((a, b2) => a.t - b2.t);
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
