import Link from "next/link";
import { Fragment } from "react";
import type { CaseRecord } from "@/lib/types";
import { notFound } from "next/navigation";
import { getCase, getPolicy } from "../../_lib/api";
import { clock, day, dayClock, daysLeft, reasonWords, secondsBetween, stageWord, usd } from "../../_lib/format";
import { arrivedAt, logPos, storyStops, type Stop, type Tick } from "../../_lib/story";
import { Scale } from "../../_ui/Scale";
import { TopBar } from "../../_ui/Chrome";
import { Decide } from "../../_ui/Decide";
import { More } from "../../_ui/More";

export const dynamic = "force-dynamic";

type Exhibit = { title: string; body: string };
type Filing = { exhibits?: Exhibit[]; narrative?: string; filing?: { files?: { name: string; size: number }[] } };

const WHAT: Record<string, string> = {
  "CUSTOMER.DISPUTE.CREATED": "Dispute opened",
  "CUSTOMER.DISPUTE.UPDATED": "Dispute updated",
  "CUSTOMER.DISPUTE.RESOLVED": "Dispute resolved",
};
const callWords = (method?: string, path?: string) => {
  const p = path ?? "";
  if (p.includes("verify-webhook-signature")) return "Checked the webhook signature";
  if (/provide-evidence$/.test(p)) return "Filed the evidence";
  if (p.startsWith("/v1/customer/disputes")) return "Read the dispute";
  if (p.startsWith("/v2/payments/captures")) return "Read the payment";
  if (p.startsWith("/v2/checkout/orders")) return "Read the order";
  if (p.startsWith("/v1/shipping/trackers")) return method === "PUT" ? "Updated the tracker" : "Read the tracking";
  return `${method ?? ""} ${p}`.trim();
};

/** An exhibit in plain words; its exact text (ids, timestamps) stays in the details layer. */
function plain(e: Exhibit, c: CaseRecord): string {
  const o = c.order;
  const it = o?.items[0];
  const sh = o?.shipping?.[0];
  if (/order/i.test(e.title) && it) {
    return `${it.name}, ${it.quantity} at ${usd(it.unitAmount.value)}${o?.paidAt ? `, paid ${day(o.paidAt)}` : ""}.`;
  }
  if (/ship|track/i.test(e.title) && sh) {
    return `${sh.carrier}, ${sh.status === "DELIVERED" ? `delivered${sh.deliveredAt ? ` ${day(sh.deliveredAt)}` : ""}` : (sh.status ?? "in transit").toLowerCase()}, with the tracking number.`;
  }
  return e.body;
}

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [b, policy] = await Promise.all([getCase(id), getPolicy()]);
  if (!b) notFound();

  const c = b.case;
  const s = c.snapshot;
  const amount = usd(s.amount.value);
  const item = c.order?.items[0]?.name ?? `${stageWord(s.stage)} ${s.id}`;
  const pending = b.actions.find((a) => a.status === "awaiting_approval");
  const filing = (pending?.params ?? b.actions.find((a) => a.kind === "provide_evidence")?.params ?? {}) as Filing;
  const exhibits = filing.exhibits ?? [];
  const pdf = filing.filing?.files?.[0];
  const due = s.sellerResponseDueDate;
  const line = policy?.evidenceApprovalAtUsd ?? 250;
  const t0 = arrivedAt(b);
  const now = new Date().toISOString();
  const nowT = secondsBetween(t0, now);
  const tMax = due ? Math.max(secondsBetween(t0, due), nowT * 1.2) : Math.max(nowT * 1.5, 900);
  const d = c.decision;
  const shipping = c.order?.shipping?.[0];

  const stops: Stop[] = storyStops(b).map((st) =>
    st.id === "ask"
      ? { ...st, title: "Asked you", detail: `${Math.round(st.t)} s after it arrived`, tone: "done" }
      : st.id === "read" && pending
        ? { ...st, quiet: true }
        : st,
  );
  if (pending) stops.push({ id: "now", t: nowT, at: now, title: "Now", detail: "Waiting for your yes", tone: "ask" });
  const ticks: Tick[] = [
    { t: 60, label: "1 min" },
    { t: 600, label: "10 min", narrow: "hide" as const },
    { t: 3600, label: "1 h" },
    { t: 21600, label: "6 h" },
    { t: 86400, label: "1 day" },
    { t: 259200, label: "3 days", narrow: "hide" as const },
  ].filter((t) => logPos(t.t, 10, tMax) < 0.94);

  const waited = pending ? secondsBetween(pending.createdAt, now) : 0;
  const lineWord = usd(line).replace(".00", "");

  return (
    <div className="metal case-page">
      <TopBar>
        <Link href="/d2">How CaseClerk works</Link>
      </TopBar>
      <main className="wrap case-grid">
        <header className="case-head">
          <h1 className="case-title">
            {item.split(" ").map((w, i) => (
              <Fragment key={i}>
                {i ? " " : ""}
                <span className={w.includes("-") ? "nobr" : undefined}>{w}</span>
              </Fragment>
            ))}
          </h1>
          <p className="case-sub">
            {amount} {stageWord(s.stage)}, {reasonWords(s.reason)}. {c.isTestDispute ? "A sandbox test dispute" : "A sandbox dispute"}, opened {day(s.createTime)}.
          </p>
        </header>

        {pending && (
          <aside className="decide leather" aria-labelledby="decide-title">
            <p className="decide-amount">{amount}</p>
            <h2 id="decide-title" className="decide-title">
              File this evidence with PayPal?
            </h2>
            <p className="decide-why">
              It is over your {lineWord} line for evidence, so CaseClerk asks first. Waiting{" "}
              {waited >= 3600 ? `${Math.floor(waited / 3600)} h` : `${Math.max(1, Math.round(waited / 60))} min`}
              {due ? `; PayPal's deadline is ${dayClock(due)}.` : "."}
            </p>
            <Decide actionId={pending.id} />
            {d && (
              <dl className="decide-read">
                <div>
                  <dt>Chance PayPal sides with you</dt>
                  <dd>About {Math.round(d.winProbability * 100)}%</dd>
                </div>
                <div>
                  <dt>Evidence</dt>
                  <dd>{d.evidenceStrength === "weak" ? "Weak: tracking proves delivery, not condition" : d.evidenceStrength ? `${d.evidenceStrength[0].toUpperCase()}${d.evidenceStrength.slice(1)}` : "Not rated"}</dd>
                </div>
                {d.expectedValueUsd.fight <= 0 && d.expectedValueUsd.refund <= 0 ? (
                  <div>
                    <dt>Expected loss</dt>
                    <dd>
                      Filing {usd(-d.expectedValueUsd.fight)}, refunding {usd(-d.expectedValueUsd.refund)}
                    </dd>
                  </div>
                ) : (
                  <div>
                    <dt>Expected result</dt>
                    <dd>
                      Filing {usd(d.expectedValueUsd.fight, { sign: true })}, refunding {usd(d.expectedValueUsd.refund, { sign: true })}
                    </dd>
                  </div>
                )}
                <div>
                  <dt>No answer at all</dt>
                  <dd>PayPal rules for the buyer: you lose {amount} and the fee</dd>
                </div>
              </dl>
            )}
          </aside>
        )}

        <section className="case-scale" aria-label="Where this case stands">
          <Scale
            stops={stops}
            ticks={ticks}
            tau={10}
            tMax={tMax}
            nowT={nowT}
            caption={<>Arrived {dayClock(t0)}. Time runs on a log scale, out to PayPal&rsquo;s deadline.</>}
            endLabel={due ? `Deadline, ${day(due)}` : undefined}
            nowLabel="since the dispute arrived"
            readouts={Object.fromEntries(stops.map((st) => [st.id, st.id === "now" ? "since the dispute arrived" : `${st.title}, ${clock(st.at)} PT`]))}
          />
        </section>

        <section className="evidence" aria-labelledby="evidence-title">
          <h2 id="evidence-title" className="h-block">
            {pending ? "What CaseClerk will send PayPal" : "What CaseClerk sent PayPal"}
          </h2>
          <ol className="exhibits">
            {exhibits.map((e) => (
              <li key={e.title} className="exhibit">
                <h3 className="exhibit-title">{e.title}</h3>
                <p className="exhibit-body">{plain(e, c)}</p>
              </li>
            ))}
          </ol>
          {(pdf || shipping?.trackingUrl) && (
            <p className="evidence-meta">
              {pdf ? `Sent as one PDF, ${(pdf.size / 1024).toFixed(1)} KB. ` : ""}
              {shipping?.trackingUrl ? (
                <a href={shipping.trackingUrl} target="_blank" rel="noreferrer">
                  {shipping.carrier} tracking
                </a>
              ) : null}
            </p>
          )}
          {filing.narrative && (
            <More summary="The exact text PayPal will receive">
              <div className="more-text">
                {filing.narrative.split(/\n\n+/).map((para) => (
                  <p key={para.slice(0, 40)}>{para}</p>
                ))}
              </div>
            </More>
          )}
          <More summary={<>PayPal&rsquo;s record for this case, {b.wire.length} entries</>}>
            <div className="proof">
              <table className="proof-table">
                <thead>
                  <tr>
                    <th scope="col">Time (PT)</th>
                    <th scope="col">What</th>
                    <th scope="col">Status</th>
                    <th scope="col">PayPal id</th>
                  </tr>
                </thead>
                <tbody>
                  {b.wire.map((w) => (
                    <tr key={w.id}>
                      <td>{clock(w.at)}</td>
                      <td>{w.kind === "event" ? `${WHAT[w.eventType ?? ""] ?? w.eventType}, webhook${w.verify === "SUCCESS" ? " (verified)" : ""}` : callWords(w.method, w.path)}</td>
                      <td>{w.status}</td>
                      <td>
                        <code>{w.kind === "event" ? w.eventId : w.debugId}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="proof-ids">
                Dispute <code>{s.id}</code>, capture <code>{s.sellerTransactionId}</code>
                {c.order?.orderId ? (
                  <>
                    , order <code>{c.order.orderId}</code>
                  </>
                ) : null}
              </p>
            </div>
          </More>
        </section>
      </main>
    </div>
  );
}
