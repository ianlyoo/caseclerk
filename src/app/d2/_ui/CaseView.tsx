"use client";
// A case page that stays live: it polls the case, shows PayPal's answer the moment it comes back,
// and lets later webhooks arrive on the scale and the panel without a reload.
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import NumberFlow from "@number-flow/react";
import type { CaseBundle } from "../_lib/api";
import { caseModel, lineWord, withAnswer, type Answer, type CaseModel, type Exhibit } from "../_lib/caseModel";
import { clock, day, dayClock, reasonWords, stageWord, usd } from "../_lib/format";
import { claimWords, deadlineWords, itemName } from "../_lib/state";
import { lastWebhook, moneyFor } from "../_lib/story";
import { ACTOR_WORDS, EVENT_WORDS, firstSentences, wireWords } from "../_lib/words";
import { RESERVED_CASES } from "../_lib/routes";
import type { CaseRecord } from "@/lib/types";
import { Scale } from "./Scale";
import { Decide } from "./Decide";
import { More } from "./More";
import { Rule, type Outcome } from "./Rule";

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

const FAST_MS = 4000;
const SLOW_MS = 20000;
/** after a sandbox ruling is asked for, PayPal's RESOLVED webhook and its money follow within minutes */
const RULING_MS = 15 * 60_000;

/** The sandbox ruling asked for on this case, from CaseClerk's audit. */
function rulingOf(b: CaseBundle): { outcome: Outcome; at: string } | null {
  const a = [...b.audit].reverse().find((x) => x.kind === "demo.adjudicate");
  if (!a) return null;
  return { outcome: a.data?.outcome === "BUYER_FAVOR" || /for the buyer/.test(a.summary) ? "BUYER_FAVOR" : "SELLER_FAVOR", at: a.at };
}

export function CaseView({ initial, line, serverNow }: { initial: CaseBundle; line: number; serverNow: string }) {
  const [polled, setPolled] = useState(initial);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [now, setNow] = useState(serverNow);
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<string | undefined>(undefined);
  const seen = useRef(new Set(initial.wire.map((w) => w.id)));
  const [arrived, setArrived] = useState<string | null>(null);
  const [askedAt, setAskedAt] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const b = useMemo(() => withAnswer(polled, answer), [polled, answer]);
  const m: CaseModel = useMemo(() => caseModel(b, now), [b, now]);
  const c = b.case;
  const s = c.snapshot;
  const closed = m.state.phase === "closed";

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${encodeURIComponent(initial.case.id)}`, { cache: "no-store" });
      if (!res.ok) return;
      const next = (await res.json()) as CaseBundle;
      const news = next.wire.filter((w) => w.kind === "event" && !seen.current.has(w.id));
      next.wire.forEach((w) => seen.current.add(w.id));
      if (news.length) setArrived(news[news.length - 1].id);
      setPolled(next);
    } catch {
      // the next poll tries again
    }
  }, [initial.case.id]);

  // the clock moves the "now" index; polling brings PayPal's later webhooks in
  useEffect(() => {
    setNow(new Date().toISOString());
    const id = window.setInterval(() => setNow(new Date().toISOString()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const ruling = rulingOf(b);
  const ruledAt = askedAt ?? ruling?.at ?? null;
  // fast for two minutes after an answer (PayPal's webhooks follow a filing) and while a sandbox ruling is due,
  // never while a filing is in flight
  const fast =
    (Boolean(answer) && Date.parse(now) - Date.parse(answer?.at ?? now) < 120_000) || (Boolean(ruledAt) && Date.parse(now) - Date.parse(ruledAt ?? now) < RULING_MS);
  const phase = m.state.phase;
  const was = useRef(phase);
  useEffect(() => {
    if (was.current !== "closed" && phase === "closed") setFresh("kept");
    was.current = phase;
  }, [phase]);
  // a case that closed while open here keeps listening until PayPal states the money (ten minutes at most)
  const closeAt = m.stops.find((x) => x.id === "kept")?.at;
  const awaitMoney = fresh === "kept" && !b.money && Date.parse(now) - Date.parse(closeAt ?? now) < 600_000;
  useEffect(() => {
    if ((closed && !awaitMoney) || busy) return;
    let stop = false;
    let id: number | undefined;
    const loop = async () => {
      if (document.visibilityState === "visible") await refresh();
      if (!stop) id = window.setTimeout(loop, fast ? FAST_MS : SLOW_MS);
    };
    id = window.setTimeout(loop, fast ? FAST_MS : SLOW_MS);
    return () => {
      stop = true;
      window.clearTimeout(id);
    };
  }, [closed, awaitMoney, busy, fast, refresh]);

  const onAnswer = useCallback((a: Answer) => {
    setAnswer(a);
    setNow(a.at);
    setFresh(a.kind === "approve" ? "filed" : "denied");
  }, []);
  const onPhase = useCallback((x: boolean) => setBusy(x), []);
  const onAsked = useCallback((at: string) => {
    setAskedAt(at);
    setNow(at);
    setFresh("ruled");
  }, []);
  // the judge's step: test disputes only, never the case kept for the demo recording, once PayPal is reviewing a filing
  const rulable = c.isTestDispute && !RESERVED_CASES.includes(c.id) && m.state.key === "review";

  const item = itemName(c);
  const title = item ?? claimWords(c);
  const exhibits = m.filing.exhibits ?? [];
  const pdf = m.filing.filing?.files?.[0];
  const shipping = c.order?.shipping?.[0];
  const deny = b.actions.find((a) => a.status === "denied" && a.kind === "provide_evidence");
  const panelKey = m.pending ? "decide" : `${m.state.key}${deny ? "-no" : ""}`;

  return (
    <main className="wrap case-grid">
      <header className="case-head">
        <h1 className="case-title">
          {title.split(" ").map((w, i) => (
            <Fragment key={i}>
              {i ? " " : ""}
              <span className={w.includes("-") ? "nobr" : undefined}>{w}</span>
            </Fragment>
          ))}
        </h1>
        <p className="case-sub">
          {item ? `${usd(s.amount.value)} ${stageWord(s.stage)}, ${reasonWords(s.reason)}.` : `${usd(s.amount.value)}. No order on file.`}{" "}
          {c.isTestDispute ? "A sandbox test dispute" : "A sandbox dispute"}, opened {day(s.createTime)}.
        </p>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.aside
          key={panelKey}
          className="decide leather"
          aria-labelledby="panel-title"
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 1 } : { opacity: 0, y: -8 }}
          transition={{ duration: reduce ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
          {m.pending ? (
            <>
              <p className="decide-amount">{usd(s.amount.value)}</p>
              <h2 id="panel-title" className="decide-title">
                File this evidence with PayPal?
              </h2>
              <p className="decide-why">
                Over your {lineWord(line)} evidence line, so CaseClerk asks first.{m.due ? ` Due ${dayClock(m.due)}.` : ""}
              </p>
              <Decide actionId={m.pending.id} exhibits={exhibits.length} onAnswer={onAnswer} onStale={refresh} onPhase={onPhase} />
              <DecideRead c={c} />
            </>
          ) : (
            <Plate
              b={b}
              m={m}
              line={line}
              answered={answer?.kind === "approve"}
              arrived={arrived}
              denied={Boolean(deny)}
              rule={
                rulable ? <Rule caseId={c.id} status={s.status} asked={ruling} onAsked={onAsked} onCheck={refresh} /> : null
              }
              ruling={ruling}
            />
          )}
        </motion.aside>
      </AnimatePresence>

      <section className="case-scale" aria-label="Where this case stands">
        <Scale
          stops={m.stops}
          ticks={m.ticks}
          tau={m.tau}
          tMax={m.tMax}
          nowT={m.nowT}
          caption={
            closed ? (
              <>Arrived {dayClock(m.stops[0]?.at ?? c.createdAt)}. Time runs on a log scale, from arrival to PayPal&rsquo;s ruling.</>
            ) : (
              <>
                Arrived {dayClock(m.stops[0]?.at ?? c.createdAt)}. Time runs on a log scale{m.due ? <>, out to PayPal&rsquo;s deadline</> : null}.
              </>
            )
          }
          endLabel={m.due ? `Due ${day(m.due)}` : undefined}
          nowLabel="since the dispute arrived"
          readouts={m.readouts}
          fresh={fresh}
        />
      </section>

      <section className="evidence" aria-labelledby="evidence-title">
        {exhibits.length > 0 ? (
          <>
            <h2 id="evidence-title" className="h-block">
              {m.pending ? "What CaseClerk will send PayPal" : m.filed ? "What CaseClerk sent PayPal" : "What CaseClerk would have sent PayPal"}
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
                {pdf ? `${m.pending ? "Goes to PayPal" : m.filed ? "Sent" : "Made"} as one PDF, ${(pdf.size / 1024).toFixed(1)} KB. ` : ""}
                {shipping?.trackingUrl ? (
                  <a href={shipping.trackingUrl} target="_blank" rel="noreferrer">
                    {shipping.carrier} tracking
                  </a>
                ) : null}
              </p>
            )}
          </>
        ) : (
          <>
            <h2 id="evidence-title" className="h-block">
              What CaseClerk read
            </h2>
            <ol className="exhibits">
              <li className="exhibit">
                <h3 className="exhibit-title">The claim</h3>
                <p className="exhibit-body">{c.triage ? firstSentences(c.triage.summary, 2) : `${claimWords(c)}, ${usd(s.amount.value)}. CaseClerk hasn’t read it yet.`}</p>
              </li>
              {c.order?.items[0] && (
                <li className="exhibit">
                  <h3 className="exhibit-title">The order</h3>
                  <p className="exhibit-body">
                    {c.order.items[0].name}
                    {c.order.paidAt ? `, paid ${day(c.order.paidAt)}` : ""}. {shipping ? `${shipping.carrier}, ${(shipping.status ?? "in transit").toLowerCase()}.` : "No tracking on the order."}
                  </p>
                </li>
              )}
              {c.decision && (
                <li className="exhibit">
                  <h3 className="exhibit-title">Its call</h3>
                  <p className="exhibit-body">{firstSentences(c.decision.rationale, 2)}</p>
                </li>
              )}
            </ol>
          </>
        )}
        {m.filing.narrative && (
          <More summary={m.filed ? "The exact text PayPal received" : "The exact text PayPal will receive"}>
            <div className="more-text">
              {m.filing.narrative.split(/\n\n+/).map((para) => (
                <p key={para.slice(0, 40)}>{para}</p>
              ))}
            </div>
          </More>
        )}
        <Record b={b} />
      </section>
    </main>
  );
}

function DecideRead({ c }: { c: CaseRecord }) {
  const d = c.decision;
  if (!d) return null;
  const amount = usd(c.snapshot.amount.value);
  return (
    <dl className="decide-read">
      <div>
        <dt>Chance PayPal sides with you</dt>
        <dd>About {Math.round(d.winProbability * 100)}%</dd>
      </div>
      <div>
        <dt>Evidence</dt>
        <dd>
          {d.evidenceStrength === "weak"
            ? "Weak: tracking proves delivery, not condition"
            : d.evidenceStrength
              ? `${d.evidenceStrength[0].toUpperCase()}${d.evidenceStrength.slice(1)}`
              : "Not rated"}
        </dd>
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
  );
}

/** The panel once nothing waits for the seller: PayPal's answer, the result, or where the case stands. */
function Plate({
  b,
  m,
  line,
  answered,
  arrived,
  denied,
  rule,
  ruling,
}: {
  b: CaseBundle;
  m: CaseModel;
  line: number;
  answered: boolean;
  arrived: string | null;
  denied: boolean;
  /** the sandbox ruling control, on a test dispute PayPal is reviewing */
  rule?: ReactNode;
  ruling: { outcome: Outcome; at: string } | null;
}) {
  const c = b.case;
  const s = c.snapshot;
  const amount = usd(s.amount.value);
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(answered && !reduce ? 0 : (m.filed?.status ?? 0));
  useEffect(() => {
    if (!m.filed) return;
    const id = window.setTimeout(() => setShown(m.filed?.status ?? 0), 300);
    return () => window.clearTimeout(id);
  }, [m.filed]);

  if (m.state.key === "kept") {
    const money = moneyFor(b);
    const closedAt = m.stops.find((x) => x.id === "kept")?.at ?? s.updateTime;
    const placed = money?.movements.find((f) => f.reason === "HOLD_PLACED");
    const released = money?.movements.find((f) => f.reason === "HOLD_RELEASED");
    return (
      <>
        <p className="plate-k">PayPal ruled for you</p>
        {/* Kept green only for money PayPal stated; until then the figure is the disputed amount, in ink */}
        <p className={`decide-amount ${money ? "plate-kept" : "plate-amount"}`}>
          <NumberFlow value={Number(money ? money.kept.value : s.amount.value)} locales="en-US" format={{ style: "currency", currency: "USD" }} />
        </p>
        <h2 id="panel-title" className="decide-title">
          {money ? `You kept ${usd(money.kept.value)} of ${amount}.` : "Closed for you."}
        </h2>
        <p className="decide-why">
          {money ? `The rest, ${usd(money.fee.value)}, is PayPal\u2019s transaction fee on the sale, not a dispute fee.` : "PayPal hasn\u2019t stated the money on this case yet."} Without an
          answer, PayPal rules for the buyer and you lose {amount} and the fee.
        </p>
        <dl className="decide-read">
          <div>
            <dt>Ruling</dt>
            <dd>PayPal&rsquo;s RESOLVED webhook, {dayClock(closedAt)}</dd>
          </div>
          {ruling && (
            <div>
              <dt>Asked of the sandbox</dt>
              <dd>By you, {clock(ruling.at)} PT</dd>
            </div>
          )}
          {placed?.at && released?.at && (
            <div>
              <dt>Held, then released</dt>
              <dd>
                {usd(placed.amount.value)}, {clock(placed.at)} to {clock(released.at)} PT
              </dd>
            </div>
          )}
          <div>
            <dt>Answered by</dt>
            <dd>{m.filed ? (m.filed.approved ? "Your yes, then CaseClerk" : "CaseClerk, on its own") : "Nobody: PayPal ruled without a filing"}</dd>
          </div>
        </dl>
      </>
    );
  }

  if (m.state.key === "lost") {
    return (
      <>
        <p className="plate-k">Closed for the buyer, {dayClock(m.stops.find((x) => x.id === "kept")?.at ?? s.updateTime)}</p>
        <p className="decide-amount plate-lost">{amount}</p>
        <h2 id="panel-title" className="decide-title">
          PayPal ruled for the buyer.
        </h2>
        <p className="decide-why">The disputed amount goes back to the buyer. {m.filed ? "CaseClerk had filed evidence." : "Nothing was filed on this case."}</p>
        <dl className="decide-read">
          {/* with no order on file the page title is the claim already */}
          {itemName(c) && (
            <div>
              <dt>Claim</dt>
              <dd>{claimWords(c)}</dd>
            </div>
          )}
          <div>
            <dt>Disputed</dt>
            <dd>{amount}</dd>
          </div>
          {ruling && (
            <div>
              <dt>Asked of the sandbox</dt>
              <dd>By you, {clock(ruling.at)} PT</dd>
            </div>
          )}
        </dl>
      </>
    );
  }

  if (m.filed && !denied) {
    const after = (w: { at: string }) => Date.parse(w.at) > Date.parse(m.filed!.at);
    const latest = lastWebhook(b);
    const since = latest && after(latest) ? latest : null;
    return (
      <>
        <p className="plate-k">PayPal&rsquo;s answer</p>
        <p className="decide-amount plate-status">
          <NumberFlow value={shown} format={{ useGrouping: false, minimumIntegerDigits: 3 }} />
          <span className="plate-unit">{(m.filed.status ?? 200) < 300 ? "accepted" : "refused"}</span>
        </p>
        <h2 id="panel-title" className="decide-title">
          Filed. PayPal is reviewing.
        </h2>
        <p className="decide-why">
          {m.filed.approved ? `You said yes, ${clock(m.filed.at)} PT.` : `Under your ${lineWord(line)} line, CaseClerk filed on its own, ${dayClock(m.filed.at)}.`}{" "}
          {rule
            ? answered
              ? "Next, ask PayPal\u2019s sandbox to rule, below."
              : "On a test dispute the sandbox rules only when asked, below."
            : "PayPal rules on its own schedule; this page updates as its webhooks arrive."}
        </p>
        <dl className="decide-read">
          {m.filed.debugId && (
            <div>
              <dt>PayPal debug id</dt>
              <dd>
                <code>{m.filed.debugId}</code>
              </dd>
            </div>
          )}
          <div>
            <dt>PayPal&rsquo;s latest</dt>
            <dd>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={since?.id ?? "none"}
                  className="plate-live"
                  data-live={since && since.id === arrived ? true : undefined}
                  initial={reduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 1 } : { opacity: 0, y: -8 }}
                  transition={{ duration: reduce ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  {since ? `${EVENT_WORDS[since.eventType ?? ""] ?? "Webhook"}, ${clock(since.at)} PT` : "No webhook since the filing yet"}
                </motion.span>
              </AnimatePresence>
            </dd>
          </div>
          <div>
            <dt>Disputed</dt>
            <dd>{amount}</dd>
          </div>
        </dl>
        {rule}
      </>
    );
  }

  const dl = deadlineWords(c);
  const heading: Record<string, string> = {
    review: "PayPal is reviewing.",
    buyer: "Waiting for the buyer.",
    read: "Nothing to answer yet.",
    received: "Received, not worked yet.",
    error: "Stopped on an error.",
    sending: "Sending to PayPal.",
  };
  const why: Record<string, string> = {
    review: "No action is open to you right now. CaseClerk picks the case up again when PayPal updates it.",
    buyer: c.decision ? `CaseClerk chose to wait. ${firstSentences(c.decision.rationale)}` : "PayPal asked the buyer to answer first.",
    read: "PayPal hasn’t opened an action to you. CaseClerk picks the case up again when PayPal updates it.",
    received: "PayPal’s webhooks arrived, but CaseClerk’s agent hasn’t run on this case.",
    error: "CaseClerk’s agent stopped before answering, so nothing was sent to PayPal.",
    sending: "CaseClerk is sending its answer to PayPal now.",
  };
  return (
    <>
      <p className="plate-k">{denied ? "You said no" : "Where it stands"}</p>
      <p className="decide-amount plate-amount">{amount}</p>
      <h2 id="panel-title" className="decide-title">
        {denied ? "Not filed." : heading[m.state.key]}
      </h2>
      <p className="decide-why">{denied ? "Nothing was sent to PayPal. The case stays with you until PayPal’s deadline." : why[m.state.key]}</p>
      <dl className="decide-read">
        {itemName(c) && (
          <div>
            <dt>Claim</dt>
            <dd>{claimWords(c)}</dd>
          </div>
        )}
        <div>
          <dt>Deadline</dt>
          <dd>{dl.text}</dd>
        </div>
      </dl>
    </>
  );
}

/** PayPal's own record (calls and webhooks), else CaseClerk's audit rows, behind a toggle. */
function Record({ b }: { b: CaseBundle }) {
  const s = b.case.snapshot;
  const ids = (
    <p className="proof-ids">
      Dispute <code>{s.id}</code>
      {s.sellerTransactionId ? (
        <>
          , capture <code>{s.sellerTransactionId}</code>
        </>
      ) : null}
      {b.case.order?.orderId ? (
        <>
          , order <code>{b.case.order.orderId}</code>
        </>
      ) : null}
    </p>
  );
  if (b.wire.length) {
    return (
      <More summary={<>PayPal&rsquo;s record for this case, {b.wire.length} entries</>}>
        <div className="proof">
          <table className="proof-table proof-wire">
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
                  <td>{wireWords(w)}</td>
                  <td>{w.status}</td>
                  <td>
                    <code>{w.kind === "event" ? w.eventId : w.debugId}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ids}
        </div>
      </More>
    );
  }
  const rows = b.audit.filter((a) => !a.kind.startsWith("agent.run") && a.kind !== "agent.step");
  return (
    <More summary={<>CaseClerk&rsquo;s record for this case, {rows.length} entries</>}>
      <div className="proof">
        <table className="proof-table">
          <thead>
            <tr>
              <th scope="col">Time (PT)</th>
              <th scope="col">Who</th>
              <th scope="col">What</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td>{clock(a.at)}</td>
                <td>{ACTOR_WORDS[a.actor] ?? a.actor}</td>
                <td>{firstSentences(a.summary)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {ids}
      </div>
    </More>
  );
}
