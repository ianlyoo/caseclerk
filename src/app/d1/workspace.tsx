"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { AgentAction, AuditEntry, CaseRecord, SellerPolicy } from "@/lib/types";

const DEMO_CASE = "PP-R-VPY-10194485";
const money = (value: string | number, currency = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(Number(value));
const date = (value?: string, full = false) => value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", ...(full ? { year: "numeric" as const } : {}), timeZone: "UTC" }).format(new Date(value)) : "Not supplied";
const itemName = (c: CaseRecord) => c.order?.items[0]?.name || "PayPal purchase";
const reason = (c: CaseRecord) => ({ not_as_described: "Not as described", not_received: "Item not received", unauthorized: "Unauthorized purchase", duplicate_or_billing: "Billing issue", other: "Other dispute" })[c.triage?.category || "other"];
const statusName = (c: CaseRecord) => ({ new: "New dispute", triaged: "Assessed", awaiting_approval: "Needs approval", acting: "Filing evidence", waiting_on_paypal: "PayPal reviewing", waiting_on_buyer: "Buyer response due", resolved: "Closed by PayPal", error: "Needs attention" })[c.status];

type CaseDetail = {
  case: CaseRecord;
  actions: AgentAction[];
  audit: AuditEntry[];
  wire: { id: string; at: string; kind: string; status?: number; eventType?: string; debugId?: string; method?: string; path?: string; verify?: string }[];
  money: { gross: string; fee: string; net: string; kept: string } | null;
};

function useLive<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((v) => v + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    const read = async () => {
      setBusy(true);
      try {
        const result = await fetch(url, { signal: controller.signal, cache: "no-store" });
        if (!result.ok) throw new Error("Unavailable");
        const next = await result.json() as T;
        if (!controller.signal.aborted) { setData(next); setError(false); }
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    };
    void read();
    const interval = window.setInterval(() => { if (!document.hidden) void read(); }, 60_000);
    return () => { controller.abort(); window.clearInterval(interval); };
  }, [url, attempt]);
  return { data, error, busy, retry };
}

type IconName = "desk" | "file" | "check" | "clock" | "shield" | "chevron" | "back" | "refresh" | "box" | "alert" | "lock" | "receipt";
function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    desk: <><path d="M4 4h16v16H4zM4 9h16M9 9v11" /></>,
    file: <><path d="M14 3H5v18h14V8zM14 3v5h5M8 12h8M8 16h6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z" /><path d="m8 12 3 3 5-6" /></>,
    chevron: <path d="m9 5 7 7-7 7" />,
    back: <path d="m14 5-7 7 7 7" />,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.1 6.1a8 8 0 0 1 13 3M4.9 14.9a8 8 0 0 0 13 3" /></>,
    box: <><path d="m12 3 9 5-9 5-9-5zM3 8v9l9 5 9-5V8M12 13v9M8 5l9 5" /></>,
    alert: <><path d="m12 3 10 18H2zM12 9v5" /><path d="M12 17v.1" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
    receipt: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2zM8 8h8M8 12h8" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Brand() {
  return <Link href="/d1" className="brand" aria-label="CaseClerk dispute desk"><svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M20 4H9a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h11" stroke="currentColor" strokeWidth="2.2" /><path d="m12 14 4 4 9-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg><span>CaseClerk</span></Link>;
}

function Shell({ children, casePage = false }: { children: ReactNode; casePage?: boolean }) {
  return <div className="desk-shell">
    <a href="#workspace" className="skip-link">Skip to workspace</a>
    <aside className="sidebar">
      <Brand />
      <nav aria-label="Workspace">
        <Link href="/d1" className={`nav-link ${!casePage ? "selected" : ""}`} aria-current={!casePage ? "page" : undefined}><Icon name="desk" /><span>Dispute desk</span></Link>
        <Link href={`/d1/case/${DEMO_CASE}`} className={`nav-link ${casePage ? "selected" : ""}`} aria-current={casePage ? "page" : undefined}><Icon name="file" /><span>Pending review</span></Link>
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-rule"><Icon name="shield" /><span>Seller in control</span></div>
        <div className="sidebar-workspace"><span className="status-dot" />Sandbox workspace</div>
      </div>
    </aside>
    <div className="desk-body">
      <header className="topbar"><p>AI dispute desk for PayPal sellers.</p><span className="environment"><span className="status-dot" />PayPal sandbox</span></header>
      <main id="workspace" className="workspace">{children}</main>
    </div>
  </div>;
}

function Loading({ casePage = false }: { casePage?: boolean }) {
  return <Shell casePage={casePage}><div className="loading-state" role="status"><h1>{casePage ? "Loading case" : "Opening your desk"}</h1><p>Reading the latest case data.</p><div className="skeleton tall" /><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div></Shell>;
}
function ErrorState({ retry, casePage = false }: { retry: () => void; casePage?: boolean }) {
  return <Shell casePage={casePage}><section className="error-state"><Icon name="alert" size={32} /><h1>Case data is unavailable</h1><p>We couldn’t reach the dispute service. Try loading the desk again.</p><button className="button primary" onClick={retry}>Try again</button></section></Shell>;
}

function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "pending" | "success" }) {
  return <span className={`badge ${tone}`}><span className="status-dot" />{children}</span>;
}

function Rules({ policy }: { policy: SellerPolicy | null }) {
  if (!policy) return null;
  return <details className="rules-disclosure disclosure">
    <summary><span className="summary-label"><Icon name="shield" /><span>Your approval rules</span></span><span className="rule-summary">Evidence {money(policy.evidenceApprovalAtUsd ?? 250)}+<Icon name="chevron" size={16} /></span></summary>
    <div className="disclosure-content">
      <p>Small cases it answers on its own, under your rules. At {money(policy.evidenceApprovalAtUsd ?? 250)} to file evidence, or over {money(policy.approvalAboveUsd)} to refund or offer, it asks you first.</p>
      <p>Without an answer by the deadline, PayPal rules for the buyer: the seller loses the disputed amount and the fee.</p>
    </div>
  </details>;
}

export function DeskHome() {
  const cases = useLive<{ cases: CaseRecord[] }>("/api/cases?limit=100");
  const pending = useLive<CaseDetail>(`/api/cases/${DEMO_CASE}`);
  const policy = useLive<{ policy: SellerPolicy }>("/api/policy");
  if ((cases.error && !cases.data) || (pending.error && !pending.data)) return <ErrorState retry={() => { cases.retry(); pending.retry(); }} />;
  if (!cases.data || !pending.data) return <Loading />;
  const c = pending.data.case;
  const all = cases.data.cases;
  const others = all.filter((r) => r.id !== c.id);
  const recent = others.slice(0, 6);
  const awaiting = c.status === "awaiting_approval";
  const isStale = cases.error || pending.error;
  return <Shell>
    <div className="page-heading"><h1>Disputes</h1><span className="quiet-label">Your seller workspace</span></div>
    {isStale && <p className="stale-note" role="status">Showing the last received data. <button onClick={() => { cases.retry(); pending.retry(); }}>Refresh cases</button></p>}
    <section className="pending-work" aria-labelledby="pending-title">
      <div className="pending-heading"><h2 id="pending-title">{awaiting ? "Waiting for your approval" : "Featured case"}</h2><Badge tone={awaiting ? "pending" : "neutral"}>{statusName(c)}</Badge></div>
      <div className="pending-main">
        <div className="pending-product"><h3>{itemName(c)}</h3><div className="case-meta"><span>{reason(c)}</span><span>Chargeback</span></div><div className="pending-facts"><span><Icon name="check" size={16} />Delivery confirmed</span><span className="warning-text"><Icon name="alert" size={16} />Condition unverified</span></div></div>
        <div className="pending-value"><span className="amount-large">{money(c.snapshot.amount.value, c.snapshot.amount.currency_code)}</span><span>Disputed amount</span></div>
      </div>
      <div className="pending-footer"><div className="due"><Icon name="clock" /><span>Reply by <strong>{date(c.snapshot.sellerResponseDueDate)}</strong></span></div><Link className="button primary" href={`/d1/case/${c.id}`}>Review case<Icon name="chevron" size={16} /></Link></div>
    </section>
    <section className="recent-section" aria-labelledby="recent-title">
      <div className="section-heading"><h2 id="recent-title">Recent cases</h2><span className="quiet-label">Latest {recent.length} of {others.length} other cases</span></div>
      <p className="table-note">Repeated items are separate sandbox test disputes.</p>
      {recent.length ? <div className="case-table-wrap"><table className="case-table"><thead><tr><th scope="col">Item / reason</th><th scope="col" className="case-number">Case</th><th scope="col" className="numeric">Disputed</th><th scope="col">Status</th><th scope="col" className="updated">Updated</th></tr></thead><tbody>{recent.map((r) => <tr key={r.id}><td className="item-cell"><span className="item-title">{itemName(r)}</span><span className="item-reason">{reason(r)}</span></td><td className="case-number">{r.id.replace("PP-R-", "")}</td><td className="numeric row-amount">{money(r.snapshot.amount.value, r.snapshot.amount.currency_code)}</td><td className="row-state"><span className={`table-status ${r.status === "resolved" ? "success-text" : ""}`}><Icon name={r.status === "resolved" ? "check" : "clock"} size={16} />{statusName(r)}</span></td><td className="updated">{date(r.updatedAt)}</td></tr>)}</tbody></table></div> : <div className="empty-state"><p>Your other cases will appear here as PayPal sends them.</p></div>}
    </section>
    <Rules policy={policy.data?.policy ?? null} />
    <footer className="workspace-footer"><span>{all.length} sandbox cases</span><span>Live data from PayPal sandbox</span></footer>
  </Shell>;
}

function Disclosure({ title, meta, children, icon = "file", open = false }: { title: string; meta?: string; children: ReactNode; icon?: IconName; open?: boolean }) {
  return <details className="evidence-disclosure disclosure" open={open}>
    <summary><span className="summary-label"><Icon name={icon} /><span>{title}</span></span><span className="disclosure-meta">{meta}<Icon name="chevron" size={16} /></span></summary>
    <div className="disclosure-content">{children}</div>
  </details>;
}

export function CaseView({ id }: { id: string }) {
  const resource = useLive<CaseDetail>(`/api/cases/${encodeURIComponent(id)}`);
  const policy = useLive<{ policy: SellerPolicy }>("/api/policy");
  if (resource.error && !resource.data) return <ErrorState retry={resource.retry} casePage />;
  if (!resource.data) return <Loading casePage />;
  const { case: c, actions, wire } = resource.data;
  const action = actions.find((a) => a.kind === "provide_evidence" && a.status === "awaiting_approval");
  const params = action?.params;
  const draft = typeof params?.narrative === "string" ? params.narrative : null;
  const shipping = c.order?.shipping?.[0];
  const threshold = policy.data?.policy?.evidenceApprovalAtUsd ?? 250;
  const isPending = c.status === "awaiting_approval";
  const weak = c.decision?.evidenceStrength === "weak";
  return <Shell casePage>
    <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/d1"><Icon name="back" size={16} />Disputes</Link><span>Case review</span></nav>
    <div className="case-heading"><div><h1>{itemName(c)}</h1><div className="case-meta"><span>{reason(c)}</span><span>{c.snapshot.stage === "CHARGEBACK" ? "Chargeback" : "Dispute"}</span><span>Opened {date(c.createdAt)}</span></div></div><Badge tone={isPending ? "pending" : "neutral"}>{statusName(c)}</Badge></div>
    {resource.error && <p className="stale-note" role="status">Updates are unavailable. Showing the last received case. <button onClick={resource.retry}>Try again</button></p>}
    <div className="case-layout">
      <div className="case-evidence">
        <section className="evidence-section" aria-labelledby="evidence-title">
          <div className="section-heading"><h2 id="evidence-title">Evidence review</h2><span className="quiet-label">Prepared by CaseClerk</span></div>
          <div className="evidence-findings">
            <div className="finding"><span className="finding-icon success-text"><Icon name="check" /></span><div><h3>{shipping?.status === "DELIVERED" ? "Delivery confirmed" : "Shipment details"}</h3><p>{shipping ? `${shipping.carrier}, ${shipping.status === "DELIVERED" ? `delivered ${date(shipping.deliveredAt)}` : "tracking available"}` : "No tracking was supplied"}</p></div></div>
            <div className="finding"><span className="finding-icon"><Icon name="receipt" /></span><div><h3>Payment matched</h3><p>{c.order?.amountCharged ? `${money(c.order.amountCharged.value)} captured on ${date(c.order.paidAt)}` : "Payment details are not available"}</p></div></div>
            <div className="finding attention"><span className="finding-icon warning-text"><Icon name="alert" /></span><div><h3>{weak ? "Item condition is unverified" : "Evidence assessment"}</h3><p>{weak ? "No listing photos or condition records on file." : `The agent rates this evidence ${c.decision?.evidenceStrength ?? "unassessed"}.`}</p></div></div>
          </div>
        </section>
        <section className="documents-section" aria-labelledby="documents-title">
          <div className="section-heading"><h2 id="documents-title">Case file</h2><span className="quiet-label">Review before filing</span></div>
          <div className="document-list">
            <Disclosure title="Draft response" meta="Prepared" icon="file">
              <p className="document-caution">Agent draft. Verify the item-condition statements before filing; delivery alone does not prove condition.</p>
              {draft ? draft.split("\n\n").map((paragraph, i) => <p key={i}>{paragraph}</p>) : <p>No evidence draft is available for this case.</p>}
            </Disclosure>
            <Disclosure title="Order & delivery" meta="Source details" icon="box">
              <dl className="detail-list"><div><dt>Item</dt><dd>{itemName(c)}</dd></div><div><dt>Paid</dt><dd>{date(c.order?.paidAt, true)}</dd></div><div><dt>Order</dt><dd>{c.order?.orderId ?? "Not supplied"}</dd></div><div><dt>Carrier</dt><dd>{shipping?.carrier ?? "Not supplied"}</dd></div><div><dt>Tracking</dt><dd>{shipping?.trackingNumber ?? "Not supplied"}</dd></div></dl>
            </Disclosure>
            <Disclosure title="Buyer’s claim" meta={reason(c)} icon="receipt">
              <p>{c.triage?.summary ?? "PayPal has not supplied a claim summary."}</p>
              {c.snapshot.messages.length ? c.snapshot.messages.map((message, i) => <p key={i}>{message.content}</p>) : <p>No buyer message was included in this dispute.</p>}
            </Disclosure>
          </div>
        </section>
        <Disclosure title="PayPal record" meta={`${wire.length} entries`} icon="shield">
          <dl className="detail-list"><div><dt>Case ID</dt><dd>{c.id}</dd></div><div><dt>Evidence due</dt><dd>{date(c.snapshot.sellerResponseDueDate, true)} at 04:59 UTC</dd></div></dl>
          <div className="proof-list">{wire.map((entry) => <div className="proof-row" key={entry.id}><span>{new Date(entry.at).toISOString().slice(11, 19)} UTC</span><code>{entry.eventType ?? `${entry.method ?? ""} ${entry.path ?? entry.kind}`}</code><span>{entry.status ? `HTTP ${entry.status}` : entry.verify ?? "Recorded"}</span>{entry.debugId && <code>PayPal debug ID: {entry.debugId}</code>}</div>)}</div>
        </Disclosure>
      </div>
      <aside className="decision-panel" aria-labelledby="decision-title">
        <div className="decision-top"><h2 id="decision-title">Your decision</h2><span className="decision-amount">{money(c.snapshot.amount.value, c.snapshot.amount.currency_code)}</span><span className="quiet-label">Disputed amount</span></div>
        <div className="decision-body">
          <dl className="decision-facts"><div><dt>Agent proposes</dt><dd>{c.decision?.strategy === "fight" ? "File evidence" : "Review this case"}</dd></div><div><dt>Evidence strength</dt><dd className={weak ? "warning-text" : ""}>{weak ? "Weak" : c.decision?.evidenceStrength ?? "Not assessed"}</dd></div><div><dt>Reply by</dt><dd>{date(c.snapshot.sellerResponseDueDate)}</dd></div></dl>
          <p className="decision-explanation">{weak ? "Tracking proves delivery, not condition. Review the draft before deciding to contest this claim." : "Review the prepared response before sending evidence to PayPal."}</p>
          <div className="approval-rule"><Icon name="shield" /><p>Your approval is required for evidence on cases of {money(threshold)} or more.</p></div>
          <button className="button primary approval-button" aria-disabled="true" aria-describedby="reserved-note"><Icon name="lock" size={16} />Approve & file evidence</button>
          <p id="reserved-note" className="reserved-note">{id === DEMO_CASE ? "Approval is reserved for the demo recording." : "Filing is unavailable in this preview."}</p>
        </div>
      </aside>
    </div>
    <footer className="workspace-footer"><span>Sandbox test dispute</span><span>Nothing has been filed for this pending action.</span></footer>
  </Shell>;
}
