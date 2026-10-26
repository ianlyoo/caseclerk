// The deadline board's rows: one per case, opened to PayPal's deadline (or to the close, or to now), with the
// moments the case's scale shows. Pure and serialisable, so the server builds it and the Bryntum client only draws it.
import type { CaseRecord } from "@/lib/types";
import type { CaseBundle } from "./api";
import { cap, clock, day, dayClock, leftWords, usd } from "./format";
import { href, RESERVED_CASES } from "./routes";
import { caseState, claimWords, itemName, judgeCase, type Phase, type StateKey } from "./state";
import { storyStops, type Tone } from "./story";

/** Who made the moment: PayPal (its webhooks), CaseClerk (its reads, asks, filings, errors) or the seller. */
export type Who = "paypal" | "caseclerk" | "you";

export type Moment = { id: string; at: string; title: string; when: string; who: Who; tone: Tone };

export type BoardRow = {
  id: string;
  href: string;
  /** the item, else the claim */
  title: string;
  claim: string;
  amount: string;
  band: Phase;
  key: StateKey;
  state: string;
  /** PayPal opened the dispute */
  start: string;
  end: string;
  /** what the bar's right end is */
  endKind: "due" | "closed" | "now";
  endWords: string;
  /** the same, for a phone's narrow board */
  endShort: string;
  moments: Moment[];
  held: boolean;
};

/** the board's two time spans: every case to PayPal's deadlines, or hour by hour since the first case */
export type Span = "deadlines" | "hours";

export type Board = { rows: BoardRow[]; now: string; counts: Record<Phase, number>; nearest?: { id: string; due: string; words: string } };

const WHO: Record<string, Who> = { in: "paypal", read: "caseclerk", ask: "caseclerk", filed: "caseclerk", error: "caseclerk", denied: "you", ruled: "you", kept: "paypal" };

/** "13 min", "3 h 9 min", "26 h 21 min": how long a closed case was open (seconds would be noise on a board) */
function took(ms: number) {
  const min = Math.round(ms / 60_000);
  if (min < 1) return `${Math.max(1, Math.round(ms / 1000))} s`;
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h >= 48) return `${Math.round(h / 24)} days`;
  return min % 60 ? `${h} h ${min % 60} min` : `${h} h`;
}

const byNewest = (a: CaseRecord, b: CaseRecord) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id.localeCompare(a.id);
const dueOf = (c: CaseRecord) => (c.snapshot.sellerResponseDueDate ? Date.parse(c.snapshot.sellerResponseDueDate) : Infinity);
const later = (a: string, b: string) => (Date.parse(a) >= Date.parse(b) ? a : b);

function rowFor(c: CaseRecord, b: CaseBundle | null, nowIso: string, line: number): BoardRow {
  const st = caseState(c, line);
  const stops = b ? storyStops(b, "seller") : [];
  const moments: Moment[] = stops.map((s) => ({ id: s.id, at: s.at, title: s.title, when: `${day(s.at)}, ${clock(s.at)}`, who: WHO[s.id] ?? "caseclerk", tone: s.tone }));
  const start = c.snapshot.createTime;
  const lastAt = moments.reduce((m, x) => later(m, x.at), start);
  const due = c.snapshot.sellerResponseDueDate;
  let end: string;
  let endKind: BoardRow["endKind"];
  let endWords: string;
  let endShort: string;
  if (st.phase === "closed") {
    const closedAt = moments.find((m) => m.id === "kept")?.at ?? c.snapshot.updateTime;
    end = later(closedAt, lastAt);
    endKind = "closed";
    endWords = `${st.words}, ${took(Date.parse(end) - Date.parse(start))} after it opened`;
    endShort = st.words;
  } else if (due) {
    end = later(due, lastAt);
    endKind = "due";
    endWords = `Due ${dayClock(due)}, ${leftWords(due, Date.parse(nowIso))}`;
    endShort = cap(leftWords(due, Date.parse(nowIso)));
  } else {
    end = later(nowIso, lastAt);
    endKind = "now";
    endWords = st.key === "buyer" ? "The buyer has the next word" : "No deadline from PayPal right now";
    endShort = st.key === "buyer" ? "The buyer's turn" : "No deadline";
  }
  return {
    id: c.id,
    href: href.case(c.id),
    title: itemName(c) ?? claimWords(c),
    claim: claimWords(c),
    amount: usd(c.snapshot.amount.value),
    band: st.phase,
    key: st.key,
    state: st.words,
    start,
    end,
    endKind,
    endWords,
    endShort,
    moments,
    held: RESERVED_CASES.includes(c.id),
  };
}

/** Rows in the inbox's order: waiting for your yes (the case a visitor may answer first), then open by deadline, then closed, newest first. */
export function boardOf(list: CaseRecord[], bundles: Map<string, CaseBundle | null>, nowIso: string, line: number): Board {
  const judge = judgeCase(list);
  const phase = (c: CaseRecord) => caseState(c).phase;
  const waiting = list
    .filter((c) => phase(c) === "waiting")
    .sort((x, y) => Number(x.id !== judge?.id) - Number(y.id !== judge?.id) || Number(RESERVED_CASES.includes(x.id)) - Number(RESERVED_CASES.includes(y.id)) || byNewest(x, y));
  const open = list.filter((c) => phase(c) === "open").sort((x, y) => dueOf(x) - dueOf(y) || byNewest(x, y));
  const closed = list
    .filter((c) => phase(c) === "closed")
    .sort((x, y) => Date.parse(y.snapshot.updateTime) - Date.parse(x.snapshot.updateTime) || byNewest(x, y));
  const rows = [...waiting, ...open, ...closed].map((c) => rowFor(c, bundles.get(c.id) ?? null, nowIso, line));
  const next = [...waiting, ...open].filter((c) => c.snapshot.sellerResponseDueDate && dueOf(c) > Date.parse(nowIso)).sort((x, y) => dueOf(x) - dueOf(y))[0];
  const nd = next?.snapshot.sellerResponseDueDate;
  return {
    rows,
    now: nowIso,
    counts: { waiting: waiting.length, open: open.length, closed: closed.length },
    nearest: next && nd ? { id: next.id, due: nd, words: `${day(nd)}, ${clock(nd)} PT, ${leftWords(nd, Date.parse(nowIso))}` } : undefined,
  };
}
