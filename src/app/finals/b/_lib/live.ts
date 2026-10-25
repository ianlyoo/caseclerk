// Real cases, read from the production API (GET /api/cases/:id returns { case, actions, audit, wire }).
// Every id and status shown for a real case comes from PayPal through this payload; nothing is written here.
// The JSON files in ./real are snapshots of the same payload, used for the first render and when the API is down.

import type { EvidencePdfInput } from "@/lib/evidence/pdf";
import type { AgentAction, AuditEntry, CaseRecord, OrderContext } from "@/lib/types";
import { POLICY, money, type Approval, type Case, type Desk, type Row } from "./data";
import jkb from "./real/PP-R-JKB-10194463.json";
import rcj from "./real/PP-R-RCJ-10194476.json";
import gds from "./real/PP-R-GDS-10194475.json";
import vpy from "./real/PP-R-VPY-10194485.json";
import nja from "./real/PP-R-NJA-10194486.json";

export type WireEntry = {
  id: string;
  at: string;
  kind: "call" | "event";
  origin: string;
  caseId?: string;
  method?: string;
  path?: string;
  status?: number;
  debugId?: string;
  eventId?: string;
  eventType?: string;
  verify?: string;
};
export type ApiCase = { case: CaseRecord & { decision?: CaseRecord["decision"] }; actions: AgentAction[]; audit: AuditEntry[]; wire: WireEntry[] };

export const SNAPSHOTS: Record<string, ApiCase> = Object.fromEntries(
  [vpy, nja, jkb, rcj, gds].map((j) => [j.case.id, j as unknown as ApiCase]),
);
/** The real case B opens by default: the $412 Olympus chargeback, waiting for the seller's approval. */
export const DEFAULT_REAL = "PP-R-VPY-10194485";
/** The real case the landing replays: the $389 Olympus chargeback, approved and filed with PayPal. */
export const REPLAY_REAL = "PP-R-NJA-10194486";
export const isRealId = (id: string) => /^PP-R-[A-Z]{3}-\d{8}$/.test(id);

/**
 * Facts PayPal reported outside this payload: GET /v1/customer/disputes/{id} fund_movements and GET
 * /v2/payments/captures/{id}, read by W1 on Oct 25 (s3/finals/REAL-CASES.md, "Fund movements" and "A4 / B4 / A5 results"), keyed by dispute id.
 * Only the money lines of a resolved case come from here. A case missing from the map gets UNVERIFIED, nothing more.
 */
type Money = { gross: string; fee: string; net: string; heldAt: string; releasedAt: string };
const MONEY: Record<string, Money> = {
  "PP-R-NJA-10194486": { gross: "389.00", fee: "10.57", net: "378.43", heldAt: "2026-10-25T08:36:50Z", releasedAt: "2026-10-25T08:45:34Z" },
  "PP-R-LTK-10194490": { gross: "398.00", fee: "10.80", net: "387.20", heldAt: "2026-10-25T09:40:04Z", releasedAt: "2026-10-25T09:55:04Z" },
  "PP-R-UDP-10194489": { gross: "405.00", fee: "10.98", net: "394.02", heldAt: "2026-10-25T09:40:04Z", releasedAt: "2026-10-25T09:58:34Z" },
  "PP-R-TZD-10194493": { gross: "402.00", fee: "10.90", net: "391.10", heldAt: "2026-10-25T10:15:34Z", releasedAt: "2026-10-25T10:30:34Z" },
  "PP-R-AAJ-10194495": { gross: "396.00", fee: "10.75", net: "385.25", heldAt: "2026-10-25T10:59:34Z", releasedAt: "2026-10-25T11:29:46Z" },
  "PP-R-IMW-10194496": { gross: "393.00", fee: "10.67", net: "382.33", heldAt: "2026-10-25T10:59:34Z", releasedAt: "2026-10-25T11:34:04Z" },
  "PP-R-RCJ-10194476": { gross: "27.95", fee: "1.21", net: "26.74", heldAt: "2026-10-25T06:24:34Z", releasedAt: "2026-10-25T06:31:04Z" },
  "PP-R-EGZ-10194505": { gross: "394.00", fee: "10.69", net: "383.31", heldAt: "2026-10-25T12:43:04Z", releasedAt: "2026-10-25T12:50:33Z" },
  "PP-R-IHX-10194506": { gross: "391.00", fee: "10.62", net: "380.38", heldAt: "2026-10-25T12:43:00Z", releasedAt: "2026-10-25T12:51:33Z" },
  "PP-R-SGV-10194507": { gross: "397.00", fee: "10.77", net: "386.23", heldAt: "2026-10-25T12:50:34Z", releasedAt: "2026-10-25T12:57:53Z" },
};
const KNOWN: Record<string, { kept: string; ending: string; money?: string }> = Object.fromEntries(
  Object.entries(MONEY).map(([id, m]) => [
    id,
    {
      kept: m.net,
      ending: "PayPal closed the case.",
      money: `The $${m.gross} sale less PayPal's $${m.fee} fee. PayPal held your $${m.net} while it decided, then released all of it; it shows no chargeback fee and no debit.`,
    },
  ]),
);

/** Item photos for real cases, by case id (credited in public/finals/b/CREDITS.md). */
const REAL_PHOTO: Record<string, string> = { "PP-R-JKB-10194463": "ring-dish", "PP-R-VPY-10194485": "om-1n", "PP-R-NJA-10194486": "om-1n" };

/** The resolved line for a case PayPal closed with a payout whose fund movements are not in MONEY yet. */
const UNVERIFIED = "PayPal closed the chargeback. Seller money outcome not yet verified.";

const REASON: Record<string, string> = {
  MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED: "Not as described",
  MERCHANDISE_OR_SERVICE_NOT_RECEIVED: "Not received",
  UNAUTHORISED: "Unauthorized",
  CREDIT_NOT_PROCESSED: "Credit not processed",
  DUPLICATE_TRANSACTION: "Duplicate charge",
  INCORRECT_AMOUNT: "Incorrect amount",
  PAYMENT_BY_OTHER_MEANS: "Paid another way",
  CANCELED_RECURRING_BILLING: "Cancelled subscription",
};

const OUTCOME: Record<string, string> = {
  RESOLVED_SELLER_FAVOUR: "PayPal decided for you.",
  RESOLVED_BUYER_FAVOUR: "PayPal decided for the buyer.",
  RESOLVED_WITH_PAYOUT: UNVERIFIED,
  CANCELED_BY_BUYER: "The buyer withdrew the claim.",
  ACCEPTED: "You accepted the claim.",
  DENIED: "PayPal denied the claim.",
};

const CALL_SAY: [RegExp, string][] = [
  [/verify-webhook-signature/, "Checked PayPal's signature on the webhook"],
  [/\/provide-evidence$/, "Filed the evidence"],
  [/\/require-evidence$/, "Sandbox control: asked PayPal to request more evidence"],
  [/\/adjudicate$/, "Sandbox control: asked PayPal to decide"],
  [/\/accept-claim$/, "Accepted the claim"],
  [/\/make-offer$/, "Made an offer to the buyer"],
  [/\/send-message$/, "Sent the buyer a message"],
  [/\/v2\/checkout\/orders\//, "Read the order"],
  [/\/v2\/payments\/captures\//, "Read the payment"],
  [/\/v1\/shipping\/trackers/, "Read the tracking"],
  [/\/v1\/customer\/disputes\/[^/]+$/, "Read the dispute"],
];
const callName = (path: string) => {
  const last = path.split("/").pop() ?? path;
  if (/verify-webhook-signature/.test(path)) return "verify-webhook-signature";
  if (/\/v2\/checkout\/orders\//.test(path)) return "get order";
  if (/\/v2\/payments\/captures\//.test(path)) return "get capture";
  if (/\/v1\/shipping\/trackers/.test(path)) return "get tracker";
  if (/\/v1\/customer\/disputes\/[^/]+$/.test(path)) return "get dispute";
  return last;
};

const eventSay = (summary: string) =>
  summary
    .replace(/^Dispute opened: (.*)$/, "PayPal opened the chargeback, $1")
    .replace(/^Dispute updated: (.*)$/, "PayPal updated the case: $1")
    .replace(/^Dispute resolved: .*$/, "PayPal closed the case");

/** The timeline: PayPal traffic from the wire log where it exists, from the audit trail before it went live. */
export function rowsOf(j: ApiCase): Row[] {
  const out: Row[] = [];
  const id = j.case.id;
  const o = j.case.order;
  const wire = j.wire ?? [];
  const wireFrom = wire.length ? Date.parse(wire[0].at) - 2000 : Infinity;
  const fromWire = (at: string) => Date.parse(at) >= wireFrom;
  const auditNear = (kind: string, at: string) => j.audit.find((a) => a.kind === kind && Math.abs(Date.parse(a.at) - Date.parse(at)) < 8000);
  const actionNear = (kind: string, at: string) =>
    j.actions.find((a) => a.kind === kind && a.result?.debugId && Math.abs(Date.parse(a.updatedAt) - Date.parse(at)) < 8000)?.result;
  const seenEvents = new Set<string>();
  // A second filing only happens when PayPal asked for more evidence; the row says so.
  let askedAgain = false;
  let filings = 0;
  const filedSay = (status?: string | number) => {
    const again = askedAgain && filings > 0;
    filings++;
    askedAgain = false;
    if (again) return `PayPal asked for more evidence, so CaseClerk filed again${status ? `; PayPal answered ${status}` : ""}`;
    const self = Number(j.case.snapshot.amount.value) <= POLICY.evidenceGateUsd && !j.audit.some((a) => a.actor === "seller" && /approv/i.test(a.kind));
    return `${self ? `CaseClerk filed the evidence on its own, under your $${money(POLICY.evidenceGateUsd)} evidence line` : "CaseClerk filed the evidence"}${status ? `; PayPal answered ${status}` : ""}`;
  };

  for (const w of wire) {
    if (w.kind === "event") {
      if (!w.eventId || w.verify !== "SUCCESS") continue;
      seenEvents.add(w.eventId);
      const a = j.audit.find((x) => (x.data as { eventId?: string } | undefined)?.eventId === w.eventId);
      out.push({ kind: "paypal", at: w.at, dir: "in", name: w.eventType ?? "webhook", status: "verified", eventId: w.eventId, say: a ? eventSay(a.summary) : "PayPal sent a webhook" });
    } else if (w.path) {
      const method = (w.method ?? "GET").toUpperCase() as "GET" | "POST" | "PUT" | "PATCH";
      // A tracker write (PUT/PATCH while filing) is not a read; name it for what it did.
      const write = method !== "GET" && /\/v1\/shipping\/trackers/.test(w.path);
      if (/\/require-evidence$/.test(w.path)) askedAgain = true;
      const say = write
        ? "CaseClerk updated the tracking on the PayPal payment"
        : /\/provide-evidence$/.test(w.path) && method === "POST"
          ? filedSay().replace(/^CaseClerk filed the evidence$/, "Filed the evidence")
          : CALL_SAY.find(([re]) => re.test(w.path!))?.[1] ?? "Called PayPal";
      const tool = write ? "" : /orders/.test(w.path) ? "tool.get_order" : /trackers/.test(w.path) ? "tool.get_tracking" : "";
      const detail = tool ? auditNear(tool, w.at)?.summary : undefined;
      out.push({
        kind: "paypal",
        at: w.at,
        dir: "out",
        name: write ? "update tracker" : callName(w.path),
        method,
        path: w.path,
        status: w.status ? String(w.status) : undefined,
        debugId: w.debugId,
        say: detail ? detail.replace("…", "ending ") : say,
      });
    }
  }

  for (const a of j.audit) {
    const d = (a.data ?? {}) as Record<string, string | number | undefined>;
    const early = !fromWire(a.at);
    if (a.kind === "webhook.received") {
      if (!d.eventId || seenEvents.has(String(d.eventId))) continue;
      seenEvents.add(String(d.eventId));
      out.push({ kind: "paypal", at: a.at, dir: "in", name: String(d.eventType ?? (/resolved/i.test(a.summary) ? "CUSTOMER.DISPUTE.RESOLVED" : /opened/i.test(a.summary) ? "CUSTOMER.DISPUTE.CREATED" : "CUSTOMER.DISPUTE.UPDATED")), status: "verified", eventId: String(d.eventId), say: eventSay(a.summary) });
    } else if (a.kind === "action.executed" && early) {
      const tool = String(d.tool ?? "provide_evidence").replaceAll("_", "-");
      out.push({ kind: "paypal", at: a.at, dir: "out", name: tool, method: "POST", path: `/v1/customer/disputes/${id}/${tool}`, status: d.httpStatus ? String(d.httpStatus) : undefined, debugId: d.debugId ? String(d.debugId) : undefined, say: tool === "provide-evidence" ? filedSay(d.httpStatus) : a.summary });
    } else if ((a.kind === "demo.require_evidence" || a.kind === "demo.adjudicate") && early) {
      if (a.kind === "demo.require_evidence") askedAgain = true;
      const k = a.kind === "demo.adjudicate" ? "adjudicate" : "require-evidence";
      const r = actionNear(k.replace("-", "_"), a.at);
      out.push({ kind: "paypal", at: a.at, dir: "out", name: k, method: "POST", path: `/v1/customer/disputes/${id}/${k}`, status: r?.httpStatus ? String(r.httpStatus) : undefined, debugId: r?.debugId, say: k === "adjudicate" ? "Sandbox control: you asked PayPal to rule for the seller" : "Sandbox control: you asked PayPal to request more evidence" });
    } else if (a.kind === "tool.get_order" && early && o) {
      out.push({ kind: "paypal", at: a.at, dir: "out", name: "get order", method: "GET", path: `/v2/checkout/orders/${o.orderId}`, say: a.summary });
    } else if (a.kind === "tool.get_tracking" && early && o?.shipping?.[0]) {
      out.push({ kind: "paypal", at: a.at, dir: "out", name: "get tracker", method: "GET", path: `/v1/shipping/trackers/${o.captureId}-${o.shipping[0].trackingNumber}`, say: a.summary.replace("…", "ending ") });
    } else if (a.kind === "tool.get_dispute" && early) {
      out.push({ kind: "paypal", at: a.at, dir: "out", name: "get dispute", method: "GET", path: `/v1/customer/disputes/${id}`, say: a.summary });
    } else if (a.kind === "triage") {
      out.push({ kind: "agent", at: a.at, say: plain(`The agent read the case. ${a.summary.replace(/^Triage: [^.]*\.\s*/, "")}`) });
    } else if (a.kind === "decision") {
      const m = a.summary.match(/win chance (\d+)%/);
      const fight = /fight/.test(a.summary);
      out.push({ kind: "agent", at: a.at, say: fight ? `Decided to fight with evidence, win chance ${m ? m[1] : "?"}%.` : a.summary.replace(/\s*\(.*$/, ".") });
    } else if (a.kind === "action.proposed" || a.kind === "approval.requested") {
      out.push({ kind: "agent", at: a.at, say: plain(a.summary) });
    } else if (a.actor === "seller" && /approv|denied|declin/i.test(a.kind)) {
      out.push({ kind: "seller", at: a.at, say: a.summary });
    } else if (a.kind === "agent.run.done" && /closed the dispute/.test(a.summary)) {
      out.push({ kind: "agent", at: a.at, say: plain(a.summary) });
    }
  }
  return out.sort((x, y) => Date.parse(x.at) - Date.parse(y.at));
}

/**
 * Every resolved real case here was decided through the sandbox simulator: W1's demo script (outside CaseClerk) asked
 * PayPal's sandbox to rule (REAL-CASES.md). The resolved screen and the landing say so. PayPal's enum stays in the Wire.
 */
export const SANDBOX_RULING = "Sandbox only: we asked PayPal's sandbox to rule. On a live account PayPal decides on its own.";
const ruledBySandbox = (outcome?: string) => !!outcome && !["CANCELED_BY_BUYER", "ACCEPTED"].includes(outcome);

/** Agent and audit lines in the seller's terms: "$393.00", not "393.00 USD"; no PayPal enums. */
const plain = (t: string) =>
  t
    .replace(/(\d[\d,]*\.\d{2}) USD/g, "$$$1")
    .replace(/^PayPal closed the dispute \([A-Z_]+\)\. Nothing left to do\.$/, "Case closed; nothing left to do.");

const ITEM = (o?: OrderContext) => (o?.items?.[0] ? o.items[0].name : "order");

function packOf(j: ApiCase, act?: AgentAction): EvidencePdfInput | undefined {
  const o = j.case.order;
  const p = act?.params as { narrative?: string; exhibits?: { title: string; body: string }[] } | undefined;
  if (!o || !p?.narrative) return undefined;
  return {
    case: j.case as CaseRecord,
    order: o,
    narrative: p.narrative,
    exhibits: p.exhibits ?? [],
    amountCharged: o.amountCharged,
    generatedAt: new Date(act!.createdAt),
  };
}

/** The agent's call and its main limit, then what each answer costs, for the decision sheet. */
function recOf(win: number, reason: string, tracked: boolean, amount: string): Approval["rec"] {
  const limit = reason === "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED" && tracked ? " Tracking proves delivery, not condition." : "";
  return {
    call: `The agent recommends filing: ${Math.round(win * 100)}% chance PayPal decides for you.${limit}`,
    cost: `Filing has no fee; accepting gives up the $${money(amount)}.`,
  };
}

/** Map one production payload to the case B renders. */
export function fromApi(j: ApiCase): Case {
  const c = j.case;
  const amount = c.snapshot.amount.value;
  const o = c.order;
  const resolved = c.snapshot.status === "RESOLVED" || c.status === "resolved";
  const pending = j.actions.find((a) => a.status === "awaiting_approval");
  const waitsForYou = !!pending || c.status === "awaiting_approval";
  const filed = j.actions.filter((a) => a.kind === "provide_evidence" && a.status === "executed");
  const lastEvidence = pending?.kind === "provide_evidence" ? pending : filed[filed.length - 1];
  const rows = rowsOf(j);
  // The last call CaseClerk made, not the operator's sandbox controls (adjudicate, require-evidence).
  const lastCall = [...rows].reverse().find((r) => r.kind === "paypal" && r.debugId && !/^(adjudicate|require-evidence)$/.test(r.name));
  const cost = j.audit.reduce((n, a) => n + Number(a.costUsd ?? 0), 0);
  const item = ITEM(o);
  const known = KNOWN[c.id];
  const outcome = (c.snapshot.outcome && OUTCOME[c.snapshot.outcome]) || "PayPal closed the case.";
  const what = c.snapshot.stage === "CHARGEBACK" ? "charged back" : "disputed";
  // Brand names keep their capitals ("Olympus OM-1n"); a plain noun reads lower case ("ceramic ring dish").
  const noun = item.split(",")[0];
  const said = /^[A-Z][a-z]+ [A-Z0-9]/.test(noun) ? noun : noun.charAt(0).toLowerCase() + noun.slice(1);
  // The amount is in the figure and the sheet; the headline names the thing instead.
  const lead = `A buyer's bank ${what} the ${said} you sold.`;
  const desk: Desk = resolved ? "won" : waitsForYou ? "approval" : "paypal";
  const closed = known?.ending ?? outcome;
  const headline = resolved
    ? `${lead} ${closed}`
    : waitsForYou
      ? `${lead} CaseClerk built the evidence; it waits for you.`
      : filed.length
        ? `${lead} CaseClerk filed the evidence with PayPal, and PayPal is deciding.`
        : `${lead} PayPal is reviewing it; nothing is open to you yet.`;
  const resolvedAt = [...rows].reverse().find((r) => r.kind === "paypal" && r.name === "CUSTOMER.DISPUTE.RESOLVED")?.at ?? c.updatedAt;
  const d = c.decision;

  let approval: (Approval & { actionId: string }) | undefined;
  if (pending) {
    const ex = (pending.params as { exhibits?: { title: string }[] }).exhibits ?? [];
    const evidence = pending.kind === "provide_evidence";
    const name = pending.kind.replaceAll("_", "-");
    approval = {
      actionId: pending.id,
      kind: evidence ? "provide_evidence" : pending.kind === "make_offer" ? "make_offer" : "accept_claim",
      head: evidence ? "File this evidence with PayPal?" : pending.rationale,
      amount: pending.amountUsd ? pending.amountUsd.toFixed(2) : amount,
      button: evidence ? `File the evidence on $${money(amount)}` : `Approve $${money(pending.amountUsd ?? amount)}`,
      decline: evidence ? "Don't file; accept the chargeback" : "Decline",
      receives: evidence ? ["seller statement", ...ex.map((e) => e.title.toLowerCase())].filter((v, i, a) => a.indexOf(v) === i).join(", ") + "." : pending.rationale,
      policy: evidence
        ? `Over your $${money(POLICY.evidenceGateUsd)} evidence line, so it waits for you.`
        : `Over your $${money(POLICY.approvalAboveUsd)} line, so it waits for you.`,
      method: "POST",
      path: `/v1/customer/disputes/${c.id}/${name}`,
      name,
      sentLine: evidence ? "Evidence filed with PayPal" : "Sent to PayPal",
      rec: evidence && d ? recOf(d.winProbability, c.snapshot.reason, !!o?.shipping?.length, amount) : undefined,
    };
  }

  return {
    id: c.id,
    real: true,
    // The inbox subline: what the buyer claims, in the seller's words.
    buyer: `${REASON[c.snapshot.reason] ?? "Disputed"} ${c.snapshot.stage === "INQUIRY" ? "inquiry" : "chargeback"}`,
    city: "",
    item: o?.items?.[0] ? `${o.items[0].name}${o.items[0].description ? `, ${o.items[0].description}` : ""}` : `PayPal case ${c.id}`,
    short: item.split(",")[0],
    photo: REAL_PHOTO[c.id] ?? (/^Olympus OM-1n/.test(item) ? "om-1n" : undefined),
    amount,
    reason: c.snapshot.reason,
    stage: c.snapshot.stage === "INQUIRY" ? "INQUIRY" : "CHARGEBACK",
    desk,
    openedAt: c.snapshot.createTime ?? c.createdAt,
    // PayPal's own reply-by date, while the answer is still the seller's to give.
    dueAt: waitsForYou && !resolved ? c.snapshot.sellerResponseDueDate ?? undefined : undefined,
    last: resolved ? (known ? "PayPal closed the case" : outcome.replace(/\.$/, "")) : waitsForYou ? "Built the evidence; waiting for you to file it" : filed.length ? "Filed the evidence; PayPal is deciding" : "With PayPal; nothing open to you yet",
    lastAt: c.updatedAt,
    kept: resolved ? known?.kept : undefined,
    headline,
    rows,
    recommendation: pending ? undefined : d ? (filed.length ? "Fight with the evidence. It is filed; PayPal is deciding." : undefined) : undefined,
    rationale: d?.rationale,
    values: d
      ? [
          { name: "Fight with evidence", math: `${Math.round(d.winProbability * 100)}% chance PayPal decides for you`, ev: d.expectedValueUsd.fight.toFixed(2), chosen: d.strategy === "fight" },
          { name: "Refund now", math: `The $${money(amount)} goes back, plus the fee`, ev: d.expectedValueUsd.refund.toFixed(2), chosen: d.strategy !== "fight" },
        ]
      : undefined,
    approval,
    ending: resolved ? { sentence: headline, kept: known?.kept ?? "", at: resolvedAt, money: known?.money, sandbox: ruledBySandbox(c.snapshot.outcome) ? SANDBOX_RULING : undefined } : undefined,
    pack: packOf(j, lastEvidence),
    packNote: pending ? "Built by the agent. Not filed until you approve." : lastEvidence ? "Filed with PayPal." : undefined,
    costUsd: cost,
    proof: lastCall && lastCall.kind === "paypal" && lastCall.debugId ? { name: lastCall.name, status: lastCall.status ?? "", debugId: lastCall.debugId } : undefined,
  };
}

/** A case from the list endpoint (no actions or audit yet): enough for the inbox and the case list. */
export function fromRecord(c: CaseRecord): Case {
  return fromApi({ case: c, actions: [], audit: [], wire: [] });
}
