// Real PayPal sandbox cases, read from the production API. Pure functions: an API response in,
// what the page shows out. Nothing here is invented; anything the API doesn't say, we don't say.

import type { AgentAction } from "@/lib/types";
import type { WireLine } from "../../_shared/cases";

/** The real disputes Final A shows, newest first. Ids come from REAL-CASES.md.
 *  VPY waits for the seller's approval on camera: nothing in this repo approves it. */
export const HERO_ID = "PP-R-VPY-10194485";
/** Every sandbox test case production returns; the inbox lists whatever comes back, newest first. */
export const REAL_LIST_PATH = "/api/cases?test=true&limit=50";
/** The landing's replay: the real run from chargeback to RESOLVED, with the seller's approval in the middle. */
export const REPLAY_ID = "PP-R-NJA-10194486";
export const REAL_HREF = `/finals/a/case/${REPLAY_ID}`;

type Money = { value: string; currency_code?: string };
export type ApiAudit = { at: string; actor: string; kind: string; summary: string; data?: Record<string, unknown> };
export type ApiWireRow = {
  id: string;
  at: string;
  kind: "event" | "call";
  origin: string;
  caseId?: string;
  eventId?: string;
  eventType?: string;
  verify?: string;
  method?: string;
  path?: string;
  status?: number;
  debugId?: string;
};
export type ApiCase = {
  case: {
    id: string;
    status: string;
    isTestDispute?: boolean;
    createdAt: string;
    snapshot: { id: string; stage: string; status: string; outcome?: string; reason: string; amount: Money; createTime: string; updateTime: string; sellerResponseDueDate?: string };
    order?: { orderId?: string; captureId?: string; items?: { name: string; description?: string; unitAmount?: Money }[]; shipping?: { carrier?: string; trackingNumber?: string; status?: string }[] };
    triage?: { summary?: string; category?: string };
    decision?: { at: string; strategy: string; winProbability: number; evidenceStrength?: string; expectedValueUsd?: { fight: number; refund: number }; rationale?: string };
  };
  actions: AgentAction[];
  audit: ApiAudit[];
  wire?: ApiWireRow[];
};

export type RealState = "pending" | "deciding" | "resolved";

export const usd = (v: string | number) => `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function realState(r: ApiCase): RealState {
  if (r.actions.some((a) => a.status === "awaiting_approval" || a.status === "approved" || a.status === "executing")) return "pending";
  if (r.case.snapshot.status === "RESOLVED") return "resolved";
  return "deciding";
}

/** The action waiting for the seller, if any: the slip. */
export const pendingAction = (r: ApiCase) => r.actions.find((a) => a.status === "awaiting_approval" || a.status === "approved" || a.status === "executing");

/** "Ceramic ring dish, sage glaze" becomes "ceramic ring dish"; brand names keep their capital. */
export function thingOf(r: ApiCase): string {
  const name = (r.case.order?.items?.[0]?.name ?? "order").split(",")[0];
  const second = name.split(/[\s-]/)[1] ?? "";
  return /^[a-z]/.test(second) ? name[0].toLowerCase() + name.slice(1) : name;
}

const PATH: Record<string, string> = {
  provide_evidence: "provide-evidence",
  accept_claim: "accept-claim",
  make_offer: "make-offer",
  send_message: "send-message",
  acknowledge_return_item: "acknowledge-return-item",
  require_evidence: "require-evidence",
  adjudicate: "adjudicate",
};
const NAME: Record<string, string> = {
  provide_evidence: "Provide evidence",
  accept_claim: "Accept claim",
  make_offer: "Make offer",
  send_message: "Send message",
  acknowledge_return_item: "Acknowledge return",
  refund_capture: "Refund",
  require_evidence: "Sandbox: require evidence",
  adjudicate: "Sandbox: adjudicate",
};

export function actionPath(r: ApiCase, a: AgentAction): string {
  if (a.kind === "refund_capture") return `POST /v2/payments/captures/${r.case.order?.captureId ?? "{capture}"}/refund`;
  return `POST /v1/customer/disputes/${r.case.id}/${PATH[a.kind] ?? a.kind}`;
}

/** When PayPal answered an action: the audit's execution entry, else the demo control's, else the action's update. */
function answeredAt(r: ApiCase, a: AgentAction): string {
  // A filing's answer time is the executed time from the approve response; later refetches never move it.
  if (a.kind === "provide_evidence" && (a.status === "executed" || a.status === "failed")) return a.updatedAt;
  const call = a.result?.debugId && r.wire?.find((w) => w.debugId === a.result!.debugId);
  if (call) return call.at;
  const hit = r.audit.find((x) => (a.result?.debugId && x.data?.debugId === a.result.debugId) || ((x.kind === "action.executed" || x.kind === "action.failed") && x.data?.actionId === a.id));
  return hit?.at ?? r.audit.find((x) => x.kind === `demo.${a.kind}`)?.at ?? filedAt(a);
}

/** Every PayPal boundary crossing on the case, oldest first: verified webhooks and our calls with PayPal's answer. */
export function realLines(r: ApiCase): WireLine[] {
  const id = r.case.id;
  const out: WireLine[] = [];
  const events = new Set<string>();
  const debugs = new Set<string>();
  for (const x of r.audit) {
    if (x.kind !== "webhook.received") continue;
    const eventId = String(x.data?.eventId ?? "");
    const type = String(x.data?.eventType ?? "");
    if (!eventId || !type || events.has(eventId)) continue;
    events.add(eventId);
    const status = type.endsWith(".RESOLVED") ? (r.case.snapshot.outcome ?? String(x.data?.status ?? "RESOLVED")) : String(x.data?.status ?? "");
    out.push({ at: x.at, dir: "in", name: type, status, path: type, eventId, origin: "paypal", plain: type.endsWith(".RESOLVED") ? closedPlain(id) : undefined });
  }
  for (const a of r.actions) {
    if (a.status !== "executed" && a.status !== "failed") continue;
    const debugId = a.result?.debugId;
    if (!debugId && !a.result?.httpStatus) continue;
    if (debugId) debugs.add(debugId);
    out.push({ at: answeredAt(r, a), dir: "out", name: NAME[a.kind] ?? a.kind, status: String(a.result?.httpStatus ?? "failed"), path: actionPath(r, a), debugId, origin: "paypal" });
  }
  for (const w of r.wire ?? []) out.push(...wireRowLines([w], id, events, debugs));
  return out.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

/** /api/wire rows to lines, skipping any event or debug id already shown. Mutates the seen sets. */
export function wireRowLines(rows: ApiWireRow[], caseId: string | null, events: Set<string>, debugs: Set<string>): WireLine[] {
  const out: WireLine[] = [];
  for (const w of rows) {
    if (caseId && w.caseId !== caseId) continue;
    if (w.kind === "event" && w.eventId && w.eventType && w.verify === "SUCCESS" && !events.has(w.eventId)) {
      events.add(w.eventId);
      out.push({ at: w.at, dir: "in", name: w.eventType, status: "", path: w.eventType, eventId: w.eventId, origin: "paypal", plain: w.eventType.endsWith(".RESOLVED") ? closedPlain(w.caseId) : undefined });
    } else if (w.kind === "call" && w.debugId && w.path && !debugs.has(w.debugId)) {
      debugs.add(w.debugId);
      out.push({ at: w.at, dir: "out", name: w.path.includes("/shipping/trackers/") ? "tracker" : (w.path.split("/").at(-1) ?? w.path), status: String(w.status ?? ""), path: `${w.method ?? "GET"} ${w.path}`, debugId: w.debugId, origin: "paypal" });
    }
  }
  return out;
}

// What the seller kept on the resolved real cases, from PayPal's capture and the dispute's fund_movements (REAL-CASES.md,
// "fund movements", read 2026-10-25): PayPal held the seller's net, released all of it, left the capture COMPLETED and paid
// the buyer itself. The net is the sale less PayPal's ordinary transaction fee; PayPal shows no chargeback fee and no debit.
// Verified by hand for tonight; tomorrow the API serves it live.
const MONEY: Record<string, { kept: string; fee: string }> = {
  "PP-R-NJA-10194486": { kept: "378.43", fee: "10.57" },
  "PP-R-UDP-10194489": { kept: "394.02", fee: "10.98" },
  "PP-R-LTK-10194490": { kept: "387.20", fee: "10.80" },
  "PP-R-TZD-10194493": { kept: "391.10", fee: "10.90" },
  "PP-R-AAJ-10194495": { kept: "385.25", fee: "10.75" },
  "PP-R-IMW-10194496": { kept: "382.33", fee: "10.67" },
  "PP-R-RCJ-10194476": { kept: "26.74", fee: "1.21" },
  "PP-R-EGZ-10194505": { kept: "383.31", fee: "10.69" },
  "PP-R-IHX-10194506": { kept: "380.38", fee: "10.62" },
  "PP-R-SGV-10194507": { kept: "386.23", fee: "10.77" },
};
/** The fallback for a resolved case with no verified money (judge round 4 wording). */
export const NO_DEBIT = "PayPal closed the chargeback. Seller money outcome not yet verified.";

/** The verified net kept and PayPal's fee for a case PayPal closed, or null. */
export function money(r: ApiCase): { kept: string; fee: string } | null {
  return r.case.snapshot.status === "RESOLVED" && r.case.snapshot.outcome === "RESOLVED_WITH_PAYOUT" ? (MONEY[r.case.id] ?? null) : null;
}

/** The Wire's sentence under CUSTOMER.DISPUTE.RESOLVED for a case, when its money is verified. */
export const closedPlain = (caseId: string | null | undefined) => {
  const m = caseId ? MONEY[caseId] : undefined;
  return m ? `PayPal closed it; you keep ${usd(m.kept)}` : undefined;
};

/** "The seller keeps $378.43: the $389.00 sale less PayPal's $10.57 fee.", only where PayPal's data shows it. */
export function keptLine(r: ApiCase, who = "You keep"): string | null {
  const m = money(r);
  return m ? `${who} ${usd(m.kept)}: the ${usd(r.case.snapshot.amount.value)} sale less PayPal's ${usd(m.fee)} fee.` : null;
}

/** On a live account PayPal rules alone; on these sandbox cases the operator asked the sandbox to (PM wording). */
export const SANDBOX_RULING = "Sandbox only: we asked PayPal's sandbox to rule. On a live account PayPal decides on its own.";

const executed = (r: ApiCase, kind: string) => r.actions.filter((a) => a.kind === kind && a.status === "executed");
const TIMES = ["", "once", "twice", "three times", "four times"];

/** The sentence at the top of the page, from the data. */
export function headline(r: ApiCase): string {
  const amt = usd(r.case.snapshot.amount.value);
  const thing = thingOf(r);
  const who = r.case.snapshot.stage === "CHARGEBACK" ? "A buyer's card issuer charged back" : "A buyer disputed";
  const state = realState(r);
  if (state === "resolved") {
    const o = r.case.snapshot.outcome ?? "";
    const m = money(r);
    // The kept figure sits right under the h1, so the sentence doesn't repeat it.
    if (m) return `PayPal closed the ${thing} chargeback.`;
    if (o === "RESOLVED_WITH_PAYOUT") return `PayPal closed the ${thing} chargeback. Seller money outcome not yet verified.`;
    if (o === "RESOLVED_SELLER_FAVOUR") return `PayPal ruled for you on the ${amt} ${thing}.`;
    if (o === "RESOLVED_BUYER_FAVOUR") return `PayPal ruled for the buyer on the ${amt} ${thing}.`;
    return `PayPal closed the ${amt} ${thing} case.`;
  }
  // Open cases: the figure right under the h1 carries the amount, so the sentence doesn't repeat it.
  const a = `${who} ${/^[aeiou]/i.test(thing) ? "an" : "a"} ${thing}.`;
  if (state === "pending") return `${a} The evidence is ready, and it waits for your yes.`;
  const n = executed(r, "provide_evidence").length;
  if (n && r.audit.some((x) => x.kind === "action.approved")) return `${a} You approved the evidence, CaseClerk filed it, and PayPal is deciding.`;
  if (n > 1) return `${a} PayPal asked for more evidence, so CaseClerk filed ${TIMES[n] ?? `${n} times`}; PayPal is deciding.`;
  return n ? `${a} CaseClerk filed the evidence; PayPal is deciding.` : `${a} PayPal is reviewing it.`;
}

/** The sandbox ruling request, if one was made: the honest end of a case PayPal hasn't decided. */
export const rulingAsked = (r: ApiCase) => {
  const a = executed(r, "adjudicate").at(-1);
  return a ? answeredAt(r, a) : undefined;
};

const ptFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
/** Rewrites UTC timestamps inside agent text ("2026-10-25 at 08:33:51 UTC", "2026-11-05 04:59 UTC") as Pacific, marked PT. */
export function ptify(text: string): string {
  return text.replace(/(\d{4}-\d{2}-\d{2})(?: at |[ T])(\d{2}:\d{2})(:\d{2})?(?:\.\d+)?(?:Z| UTC)/g, (_, d, hm, s) => `${ptFmt.format(new Date(`${d}T${hm}${s ?? ":00"}Z`)).replace(/[\s\u202f]AM$/, " am").replace(/[\s\u202f]PM$/, " pm")} PT`);
}

export type StoryRow = { at: string; who: "From PayPal" | "To PayPal" | "CaseClerk"; title: string; plain: string; id?: string; idKind?: "event" | "debug id"; status?: string; line?: WireLine };

/** The agent's recommendation in two plain lines, from its decision and the order's tracking; no expected-value math. */
export function recommendation(r: ApiCase): [string, string?] | null {
  const d = r.case.decision;
  if (!d) return null;
  const ship = r.case.order?.shipping?.[0];
  const pct = Math.round(d.winProbability * 100);
  const verb = d.strategy === "fight" ? "fight with evidence" : d.strategy === "refund" ? "refund the buyer" : d.strategy;
  const first = `The agent recommends you ${verb}, and puts the chance of winning at ${pct}%.${d.strategy === "fight" ? ` Filing adds no cost; accepting gives up the ${usd(r.case.snapshot.amount.value)}.` : ""}`;
  if (ship?.status === "DELIVERED" && r.case.triage?.category === "not_as_described")
    return [first, `${ship.carrier ?? "The"} tracking proves the ${thingOf(r)} was delivered, not what condition it arrived in.`];
  if (ship?.status === "DELIVERED") return [first, `${ship.carrier ?? "The"} tracking proves the ${thingOf(r)} was delivered.`];
  return [first];
}

/** "What happened, newest first": the seller's story only. The chargeback, the agent's recommendation, the evidence,
 *  the approval, the filing and PayPal's ruling. Status updates, reads and signature checks stay on the Wire. */
export function story(r: ApiCase, plainOf: (l: WireLine) => string): StoryRow[] {
  const keep = (l: WireLine) => (l.dir === "in" ? /\.(CREATED|RESOLVED)$/.test(l.name) : l.path.startsWith("POST /v1/customer/disputes/"));
  const rows: StoryRow[] = realLines(r).filter(keep).map((l) =>
    l.dir === "in"
      ? { at: l.at, who: "From PayPal", title: l.name, plain: l.plain ?? plainOf(l), id: l.eventId, idKind: "event", status: "verified", line: l }
      : // The path and debug id of a filing stay on the Wire and the receipt; the paper says what happened.
        { at: l.at, who: "To PayPal", title: l.path.split("/").at(-1)!, plain: plainOf(l), status: l.status, line: l },
  );
  for (const x of r.audit) {
    if (x.kind === "action.approved") rows.push({ at: x.at, who: "CaseClerk", title: "You approved it", plain: "The seller approved the evidence filing in CaseClerk." });
    if (x.kind === "action.awaiting_approval") rows.push({ at: x.at, who: "CaseClerk", title: "Evidence ready", plain: "The letter and exhibits are ready. Filing them waits for your approval." });
    if (x.kind === "decision") rows.push({ at: x.at, who: "CaseClerk", title: "Recommendation", plain: (recommendation(r) ?? [ptify(x.summary)]).join(" ") });
  }
  return rows.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

/** The filing PayPal accepted, if any: the receipt pinned on the page and on the Wire. */
export function filedAction(r: ApiCase): AgentAction | undefined {
  return executed(r, "provide_evidence").at(-1);
}
export const filedAt = (a: AgentAction) => ((a.params?.filing as { at?: string } | undefined)?.at ?? a.updatedAt);

/** The filing time as first seen for this action, or null if the first copy (an approve response) didn't carry it: never changes once rendered. */
const filedSeen = new Map<string, string | null>();
export function lockedFiledAt(a: AgentAction): string | null {
  if (!filedSeen.has(a.id)) filedSeen.set(a.id, (a.params?.filing as { at?: string } | undefined)?.at ?? null);
  return filedSeen.get(a.id) ?? null;
}

/** The policy line for a waiting action, in the seller's numbers. */
export function whyWaits(r: ApiCase, a: AgentAction, evidenceLine: number, moneyLine: number): string {
  const amt = Number(r.case.snapshot.amount.value);
  if (a.kind === "provide_evidence" && amt >= evidenceLine) return `Over your ${usd(evidenceLine)} evidence line, so it waits for you.`;
  if ((a.amountUsd ?? 0) > moneyLine) return `Over your ${usd(moneyLine)} line, so it waits for you.`;
  return "Your rules send this one to you.";
}

export function buttonFor(r: ApiCase, a: AgentAction): string {
  const amt = usd(r.case.snapshot.amount.value);
  if (a.kind === "provide_evidence") return `File the evidence on the ${amt} case`;
  if (a.kind === "accept_claim") return `Refund the buyer ${usd(a.amountUsd ?? r.case.snapshot.amount.value)}`;
  if (a.kind === "make_offer") return `Send the ${usd(a.amountUsd ?? 0)} offer`;
  return `Approve: ${(NAME[a.kind] ?? a.kind).toLowerCase()}`;
}

/** Two clean lines about what PayPal receives, from the action's own params. */
export function slipSummary(r: ApiCase, a: AgentAction): string {
  const ex = (a.params?.exhibits as { title: string }[] | undefined) ?? [];
  if (a.kind === "provide_evidence" && ex.length)
    return `What PayPal receives: the seller's letter and ${ex.length} exhibit${ex.length === 1 ? "" : "s"}: ${ex.map((e) => e.title.toLowerCase()).join(", ")}.`;
  return a.rationale.split(/(?<=\.)\s/).slice(0, 2).join(" ");
}

/** The inbox row for a real case: what it is, where it stands, and its last PayPal call. */
export type RealRow = { id: string; item: string; amount: string; state: RealState; standing: string; lastCall?: { at: string; path: string; status: string; debugId?: string }; lastEvent?: { at: string; eventId: string } };

export function realRow(r: ApiCase, ptTime: (iso: string) => string): RealRow {
  const lines = realLines(r);
  const calls = lines.filter((l) => l.dir === "out" && l.path.startsWith("POST /v1/customer/disputes/") && !/\/(adjudicate|require-evidence)$/.test(l.path));
  const call = calls.at(-1);
  const ev = lines.filter((l) => l.dir === "in").at(-1);
  const state = realState(r);
  const asked = rulingAsked(r);
  const standing =
    state === "resolved"
      ? money(r)
        ? `Closed by PayPal; you keep ${usd(money(r)!.kept)}`
        : `Closed by PayPal${({ RESOLVED_WITH_PAYOUT: "; seller money outcome not yet verified", RESOLVED_SELLER_FAVOUR: ": it decided for the seller", RESOLVED_BUYER_FAVOUR: ": it decided for the buyer" } as Record<string, string>)[r.case.snapshot.outcome ?? ""] ?? ""}`
      : state === "pending"
        ? "Waiting for you: the evidence is ready to file"
        : asked
          ? `PayPal is deciding; sandbox ruling requested ${ptTime(asked)}`
          : "PayPal is deciding";
  return {
    id: r.case.id,
    item: (r.case.order?.items?.[0]?.name ?? r.case.id).split(",")[0],
    amount: r.case.snapshot.amount.value,
    state,
    standing,
    lastCall: call && { at: call.at, path: call.path, status: call.status, debugId: call.debugId },
    lastEvent: ev?.eventId ? { at: ev.at, eventId: ev.eventId } : undefined,
  };
}

/** The landing replay: webhooks, the seller's approval and the calls that changed the case, oldest first. */
export function replayLines(r: ApiCase): WireLine[] {
  return realLines(r).filter((l) => l.dir === "in" || l.path.startsWith("POST /v1/customer/disputes/"));
}
