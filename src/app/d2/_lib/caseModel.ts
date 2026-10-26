// Everything a case page shows, from one bundle and a clock. Pure, so the live page recomputes it on every poll.
import type { AgentAction } from "@/lib/types";
import type { CaseBundle } from "./api";
import { clock, secondsBetween, usd } from "./format";
import { caseState, type CaseState } from "./state";
import { arrivedAt, filingOf, foldClose, lastWebhook, logged, logPos, storyStops, ticksFor, type Stop, type Tick } from "./story";

export type Exhibit = { title: string; body: string };
export type Filing = { exhibits?: Exhibit[]; narrative?: string; filing?: { files?: { name: string; size: number }[] } };

export type CaseModel = {
  state: CaseState;
  pending?: AgentAction;
  filed: ReturnType<typeof filingOf>;
  stops: Stop[];
  ticks: Tick[];
  tau: number;
  tMax: number;
  nowT?: number;
  due?: string;
  readouts: Record<string, string>;
  filing: Filing;
};

const NOW_WORDS: Record<CaseState["key"], string> = {
  ask: "Waiting for your yes",
  sending: "Sending to PayPal",
  review: "PayPal is reviewing",
  buyer: "Waiting for the buyer",
  read: "Nothing to answer yet",
  received: "Not worked yet",
  error: "Not answered yet",
  kept: "",
  lost: "",
};

export function caseModel(b: CaseBundle, nowIso: string): CaseModel {
  const c = b.case;
  const state = caseState(c);
  const pending = b.actions.find((a) => a.status === "awaiting_approval");
  const filed = filingOf(b);
  const filing = (pending?.params ?? b.actions.find((a) => a.kind === "provide_evidence")?.params ?? {}) as Filing;
  const t0 = arrivedAt(b);
  const closed = state.phase === "closed";

  // While it waits, reading the order and tracking (seconds before asking) is part of "Asked you", not a dot of its own.
  let stops = storyStops(b, "seller")
    .filter((st) => !(st.id === "read" && (pending || filed)))
    .map((st) => (st.id === "ask" ? { ...st, detail: `${Math.round(st.t)} s after it arrived`, tone: "done" as const } : st));

  if (closed) {
    const tMax = Math.max(900, (stops[stops.length - 1]?.t ?? 0) * 1.12);
    const tau = 15;
    stops = foldClose(stops, (t) => logPos(t, tau, tMax), 0.07);
    return { state, pending, filed, stops, ticks: ticksFor(tau, tMax), tau, tMax, readouts: readoutsFor(stops), filing };
  }

  const nowT = secondsBetween(t0, nowIso);
  const due = c.snapshot.sellerResponseDueDate;
  const tau = 10;
  const tMax = due ? Math.max(secondsBetween(t0, due), nowT * 1.2) : Math.max(nowT * 1.25, 900);
  // its record: where PayPal has the case, and the last word PayPal sent about it
  const latest = lastWebhook(b);
  const heard = [...b.audit].reverse().find((a) => a.kind === "webhook.received");
  const now: Stop = {
    id: "now",
    t: nowT,
    at: nowIso,
    title: "Now",
    detail: NOW_WORDS[state.key],
    tone: state.key === "ask" ? "ask" : "done",
    proof: [
      { label: "PayPal status", value: c.snapshot.status },
      ...(latest?.eventId ? [{ label: "Latest webhook", value: latest.eventId }] : heard ? [logged(heard, "Latest webhook")] : []),
    ],
  };
  const pos = (t: number) => logPos(t, tau, tMax);
  // A filing made a moment ago sits at "now": the filing keeps the dot and says where it stands.
  const near = stops.find((st) => st.id === "filed" && pos(nowT) - pos(st.t) < 0.07);
  stops = foldClose(near ? stops : [...stops, now], pos, 0.07).map((st) =>
    st.id === "filed" && near && state.key === "review" ? { ...st, detail: `${st.detail}. Reviewing` } : st,
  );
  return {
    state,
    pending,
    filed,
    stops,
    ticks: ticksFor(tau, tMax, due ? 0.86 : 0.94),
    tau,
    tMax,
    nowT,
    due,
    readouts: { ...readoutsFor(stops), now: "since the dispute arrived" },
    filing,
  };
}

const readoutsFor = (stops: Stop[]) => Object.fromEntries(stops.map((st) => [st.id, `${st.title}, ${clock(st.at)} PT`]));

/** What the page shows the moment PayPal answers a filing, before CaseClerk's own rows (written after the answer) arrive by poll. */
export type Answer = { kind: "approve" | "deny"; actionId: string; status: number | null; debugId: string | null; at: string };

export function withAnswer(b: CaseBundle, a: Answer | null): CaseBundle {
  if (!a) return b;
  const action = b.actions.find((x) => x.id === a.actionId);
  if (!action) return b;
  if (a.kind === "approve") {
    // until CaseClerk's own rows for the filing arrive (they are written after PayPal answers)
    if (filingOf(b)) return b;
    return {
      ...b,
      case: { ...b.case, status: "waiting_on_paypal" },
      actions: b.actions.map((x) =>
        x.id === a.actionId ? { ...x, status: "executed", result: { httpStatus: a.status ?? undefined, debugId: a.debugId ?? undefined } } : x,
      ),
      audit: [...b.audit, { id: "local-approved", caseId: b.case.id, at: a.at, actor: "seller", kind: "action.approved", summary: "You approved the evidence submission" }],
      wire: [
        ...b.wire,
        {
          id: "local-filed",
          at: a.at,
          kind: "call",
          origin: "seller",
          caseId: b.case.id,
          method: "POST",
          path: `/v1/customer/disputes/${b.case.id}/provide-evidence`,
          status: a.status ?? 200,
          ...(a.debugId ? { debugId: a.debugId } : {}),
        },
      ],
    };
  }
  if (action.status === "denied") return b;
  return {
    ...b,
    case: { ...b.case, status: "triaged" },
    actions: b.actions.map((x) => (x.id === a.actionId ? { ...x, status: "denied" } : x)),
    audit: [...b.audit, { id: "local-denied", caseId: b.case.id, at: a.at, actor: "seller", kind: "action.denied", summary: "You denied the evidence submission" }],
  };
}

export const lineWord = (line: number) => usd(line).replace(".00", "");
