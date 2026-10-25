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
 * Facts PayPal reported outside this payload (GET /v1/customer/disputes fund movements, read by W1 on Oct 25,
 * see s3/finals/REAL-CASES.md). Only the money line of a resolved case comes from here.
 */
const KNOWN: Record<string, { kept: string; ending: string }> = {
  "PP-R-RCJ-10194476": {
    kept: "26.74",
    ending: "PayPal closed the chargeback and paid the buyer itself. The $26.74 it held from you was released, so you kept it.",
  },
};

/** Item photos for real cases, by case id (credited in public/finals/b/CREDITS.md). */
const REAL_PHOTO: Record<string, string> = { "PP-R-JKB-10194463": "ring-dish", "PP-R-VPY-10194485": "om-1n", "PP-R-NJA-10194486": "om-1n" };

const OUTCOME: Record<string, string> = {
  RESOLVED_SELLER_FAVOUR: "PayPal decided for you.",
  RESOLVED_BUYER_FAVOUR: "PayPal decided for the buyer.",
  RESOLVED_WITH_PAYOUT: "PayPal closed the chargeback and paid the buyer itself.",
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
  [/\/v1\/shipping\/trackers/, "Read the tracking"],
  [/\/v1\/customer\/disputes\/[^/]+$/, "Read the dispute"],
];
const callName = (path: string) => {
  const last = path.split("/").pop() ?? path;
  if (/verify-webhook-signature/.test(path)) return "verify-webhook-signature";
  if (/\/v2\/checkout\/orders\//.test(path)) return "get order";
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

  for (const w of wire) {
    if (w.kind === "event") {
      if (!w.eventId || w.verify !== "SUCCESS") continue;
      seenEvents.add(w.eventId);
      const a = j.audit.find((x) => (x.data as { eventId?: string } | undefined)?.eventId === w.eventId);
      out.push({ kind: "paypal", at: w.at, dir: "in", name: w.eventType ?? "webhook", status: "verified", eventId: w.eventId, say: a ? eventSay(a.summary) : "PayPal sent a webhook" });
    } else if (w.path) {
      const say = CALL_SAY.find(([re]) => re.test(w.path!))?.[1] ?? "Called PayPal";
      const tool = /orders/.test(w.path) ? "tool.get_order" : /trackers/.test(w.path) ? "tool.get_tracking" : "";
      const detail = tool ? auditNear(tool, w.at)?.summary : undefined;
      out.push({
        kind: "paypal",
        at: w.at,
        dir: "out",
        name: callName(w.path),
        method: (w.method as "GET" | "POST") ?? "GET",
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
      out.push({ kind: "paypal", at: a.at, dir: "out", name: tool, method: "POST", path: `/v1/customer/disputes/${id}/${tool}`, status: d.httpStatus ? String(d.httpStatus) : undefined, debugId: d.debugId ? String(d.debugId) : undefined, say: tool === "provide-evidence" ? `CaseClerk filed the evidence; PayPal answered ${d.httpStatus ?? ""}`.trim() : a.summary });
    } else if ((a.kind === "demo.require_evidence" || a.kind === "demo.adjudicate") && early) {
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
      out.push({ kind: "agent", at: a.at, say: `The agent read the case. ${a.summary.replace(/^Triage: [^.]*\.\s*/, "")}` });
    } else if (a.kind === "decision") {
      const m = a.summary.match(/win chance (\d+)%/);
      const fight = /fight/.test(a.summary);
      out.push({ kind: "agent", at: a.at, say: fight ? `Decided to fight with evidence, win chance ${m ? m[1] : "?"}%.` : a.summary.replace(/\s*\(.*$/, ".") });
    } else if (a.kind === "action.proposed" || a.kind === "approval.requested") {
      out.push({ kind: "agent", at: a.at, say: a.summary });
    } else if (a.actor === "seller" && /approv|denied|declin/i.test(a.kind)) {
      out.push({ kind: "seller", at: a.at, say: a.summary });
    } else if (a.kind === "agent.run.done" && /closed the dispute/.test(a.summary)) {
      out.push({ kind: "agent", at: a.at, say: a.summary });
    }
  }
  return out.sort((x, y) => Date.parse(x.at) - Date.parse(y.at));
}

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
  const lastCall = [...rows].reverse().find((r) => r.kind === "paypal" && r.debugId);
  const cost = j.audit.reduce((n, a) => n + Number(a.costUsd ?? 0), 0);
  const item = ITEM(o);
  const known = KNOWN[c.id];
  const outcome = c.snapshot.outcome ? OUTCOME[c.snapshot.outcome] ?? `PayPal closed the case (${c.snapshot.outcome}).` : "PayPal closed the case.";
  const filedWord = filed.length === 1 ? "once" : filed.length === 2 ? "twice" : `${filed.length} times`;
  const what = c.snapshot.stage === "CHARGEBACK" ? "charged back" : "disputed";
  // Brand names keep their capitals ("Olympus OM-1n"); a plain noun reads lower case ("ceramic ring dish").
  const noun = item.split(",")[0];
  const said = /^[A-Z][a-z]+ [A-Z0-9]/.test(noun) ? noun : noun.charAt(0).toLowerCase() + noun.slice(1);
  // The amount is in the figure and the sheet; the headline names the thing instead.
  const lead = `A buyer's bank ${what} the ${said} you sold.`;
  const desk: Desk = resolved ? "won" : waitsForYou ? "approval" : "paypal";
  const headline = resolved
    ? `${lead} ${outcome}`
    : waitsForYou
      ? `${lead} CaseClerk built the evidence; it waits for you.`
      : filed.length
        ? `${lead} CaseClerk filed the evidence on PayPal ${filedWord}, and PayPal is deciding.`
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
    };
  }

  return {
    id: c.id,
    real: true,
    buyer: o?.buyerCountry ? `A buyer in the ${o.buyerCountry}` : "A buyer",
    city: "",
    item: o?.items?.[0] ? `${o.items[0].name}${o.items[0].description ? `, ${o.items[0].description}` : ""}` : `PayPal case ${c.id}`,
    short: item.split(",")[0],
    photo: REAL_PHOTO[c.id],
    amount,
    reason: c.snapshot.reason,
    stage: c.snapshot.stage === "INQUIRY" ? "INQUIRY" : "CHARGEBACK",
    desk,
    openedAt: c.snapshot.createTime ?? c.createdAt,
    last: resolved ? outcome.replace(/\.$/, "") : waitsForYou ? "Built the evidence; waiting for you to file it" : filed.length ? `Filed the evidence ${filedWord}; PayPal is deciding` : "With PayPal; nothing open to you yet",
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
    ending: resolved ? { sentence: known?.ending ?? outcome, kept: known?.kept ?? "", at: resolvedAt } : undefined,
    pack: packOf(j, lastEvidence),
    packNote: pending ? "Built by the agent. Not filed until you approve." : lastEvidence ? `Filed with PayPal, ${filedWord}.` : undefined,
    costUsd: cost,
    proof: lastCall && lastCall.kind === "paypal" && lastCall.debugId ? { name: lastCall.name, status: lastCall.status ?? "", debugId: lastCall.debugId } : undefined,
  };
}

/** A case from the list endpoint (no actions or audit yet): enough for the inbox and the case list. */
export function fromRecord(c: CaseRecord): Case {
  return fromApi({ case: c, actions: [], audit: [], wire: [] });
}
