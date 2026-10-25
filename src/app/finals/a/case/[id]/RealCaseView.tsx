"use client";

// A real PayPal sandbox case, rendered from the production API and polled every 5 s.
// Approve here is real: it posts to production through /finals/a/live and PayPal answers.

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { POLICY, EVIDENCE_GATE_USD } from "../../../_shared/data";
import { PHOTOS } from "../../../_shared/photos";
import { EASE_OUT, Masthead, Wire, plainOf, realDay, realTime, wireClock, type ShownLine } from "../../ui";
import { buttonFor, headline, pendingAction, realLines, realState, ptify, rulingAsked, slipSummary, story, usd, whyWaits, type ApiCase } from "../../_real/model";
import s from "../../a.module.css";

const POLL_MS = 5000;
const UNDO_MS = 4000;
const pt = (iso: string) => `${wireClock(iso)} PT`;

type Send =
  | { at: "idle" }
  | { at: "undo"; until: number }
  | { at: "sending"; since: string }
  | { at: "done"; status: number | null; debugId: string | null; when: string; message: string }
  | { at: "refused"; status: number; debugId: string | null; message: string };

function usePolledCase(initial: ApiCase): [ApiCase, () => void] {
  const [r, setR] = useState(initial);
  const last = useRef(JSON.stringify(initial));
  const pull = useCallback(async () => {
    try {
      const res = await fetch(`/finals/a/live/case/${initial.case.id}`, { cache: "no-store" });
      if (!res.ok) return;
      const text = await res.text();
      if (text !== last.current) {
        last.current = text;
        setR(JSON.parse(text));
      }
    } catch {}
  }, [initial.case.id]);
  useEffect(() => {
    const t = setInterval(pull, POLL_MS);
    return () => clearInterval(t);
  }, [pull]);
  return [r, pull];
}

export function RealCaseView({ initial }: { initial: ApiCase }) {
  const [r, pull] = usePolledCase(initial);
  const [send, setSend] = useState<Send>({ at: "idle" });
  const state = realState(r);
  const lines = useMemo(() => realLines(r), [r]);
  const action = pendingAction(r);
  const c = r.case;
  const sections = useMemo(() => {
    const shown: ShownLine[] = lines.map((l) => ({ ...l, key: `${l.eventId ?? l.debugId ?? l.at}` }));
    if (send.at === "sending" && action)
      shown.push({ key: "inflight", at: send.since, dir: "out", name: "Provide evidence", status: "", path: `POST /v1/customer/disputes/${c.id}/${action.kind.replaceAll("_", "-")}`, origin: "paypal", inflight: true });
    return [{ key: "case", label: <>PayPal traffic for {c.id}, from the production API</>, lines: shown }];
  }, [lines, send, action, c.id]);

  return (
    <div className={s.app}>
      <div className={s.paper}>
        <Masthead here="case" />
        <article className={s.file} data-real-case={c.id} data-real-state={state}>
          <Header r={r} />
          {action && <Slip r={r} send={send} setSend={setSend} pull={pull} />}
          {!action && send.at === "done" && <Answer send={send} />}
          <Story r={r} />
          <Decision r={r} />
        </article>
        <p className={s.foot}>Read from caseclerk.vercel.app/api/cases/{c.id} and refreshed every 5 seconds. Times are Pacific (PT).</p>
      </div>
      <Wire sections={sections} phoneLabel="Real sandbox case" />
    </div>
  );
}

function Header({ r }: { r: ApiCase }) {
  const reduce = useReducedMotion();
  const c = r.case;
  const state = realState(r);
  const photo = PHOTOS[c.id];
  const asked = rulingAsked(r);
  const resolvedAt = r.audit.find((x) => x.kind === "webhook.received" && String(x.data?.eventType).endsWith(".RESOLVED"))?.at;
  const h1 = headline(r);
  return (
    <>
      <div className={`${s.margin} ${s.marginStack}`}>
        <p style={{ margin: 0 }}>
          <span className={s.mid}>{c.id}</span>
          <br />
          Opened {realDay(c.snapshot.createTime)}, {realTime(c.snapshot.createTime)} PT
        </p>
        <p className={s.realMark} data-real-mark>
          Real PayPal sandbox case. Every id here came from PayPal.
        </p>
        {photo && (
          <figure className={s.matFig}>
            <div className={s.mat}>
              <img src={photo.src} alt={photo.alt} data-credit={photo.credit} width={144} height={104} />
            </div>
            <figcaption className={s.credit}>Photo: {photo.credit}. Similar item, not the seller&rsquo;s.</figcaption>
          </figure>
        )}
      </div>
      <div className={s.col}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.h1 key={h1} className={s.h1} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0.1 : 0.16, ease: EASE_OUT }} data-cause="webhook">
            {h1}
          </motion.h1>
        </AnimatePresence>
        <div className={s.figureRow}>
          <span className={s.figure}>{usd(c.snapshot.amount.value)}</span>
          <span className={s.due} data-real-status>
            {state === "resolved" && resolvedAt ? (
              <>
                PayPal closed it {realDay(resolvedAt)}, {pt(resolvedAt)}
              </>
            ) : state === "pending" ? (
              <>
                <span className={s.green}>Waiting for you</span>
                {c.snapshot.sellerResponseDueDate && <>; PayPal needs your answer by {realDay(c.snapshot.sellerResponseDueDate)}, {realTime(c.snapshot.sellerResponseDueDate)} PT</>}
              </>
            ) : asked ? (
              <>PayPal is deciding; sandbox ruling requested {pt(asked)}</>
            ) : (
              <>PayPal is deciding</>
            )}
          </span>
        </div>
      </div>
    </>
  );
}

function Slip({ r, send, setSend, pull }: { r: ApiCase; send: Send; setSend: (s: Send) => void; pull: () => void }) {
  const reduce = useReducedMotion();
  const a = pendingAction(r)!;
  const [left, setLeft] = useState(0);

  const post = useCallback(async () => {
    setSend({ at: "sending", since: new Date().toISOString() });
    try {
      const res = await fetch(`/finals/a/live/actions/${a.id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const j = await res.json().catch(() => ({}));
      if (res.ok) setSend({ at: "done", status: j.status ?? null, debugId: j.debugId ?? null, when: j.at ?? new Date().toISOString(), message: j.message ?? "PayPal answered." });
      else {
        const e = j.error ?? {};
        setSend({ at: "refused", status: res.status, debugId: e.debugId ?? null, message: res.status === 409 ? `Already decided: ${e.message ?? "someone answered first."}` : (e.message ?? "CaseClerk couldn't reach PayPal.") });
      }
    } catch {
      setSend({ at: "refused", status: 0, debugId: null, message: "The request didn't reach CaseClerk." });
    }
    pull();
  }, [a.id, setSend, pull]);

  useEffect(() => {
    if (send.at !== "undo") return;
    const tick = () => {
      const ms = send.until - Date.now();
      if (ms <= 0) post();
      else setLeft(Math.ceil(ms / 1000));
    };
    tick();
    const t = setInterval(tick, 200);
    return () => clearInterval(t);
  }, [send, post]);

  if (send.at === "done") return <Answer send={send} />;
  return (
    <>
      <div className={`${s.margin} ${s.section}`}>
        <span className={s.green}>Waiting for you</span>
        <p className={s.policy}>{whyWaits(r, a, EVIDENCE_GATE_USD, POLICY.approvalAboveUsd)}</p>
      </div>
      <div className={`${s.col} ${s.section}`}>
        <section className={s.slip} data-slip data-real-slip aria-label="Waiting for your approval">
          <div className={s.slipRow1}>
            <h2 className={s.slipHead}>{a.kind === "provide_evidence" ? "File the evidence with PayPal" : a.rationale.split(".")[0]}</h2>
          </div>
          <p className={s.slipNote}>{slipSummary(r, a)}</p>
          <div className={s.slipRow3}>
            {send.at === "idle" || send.at === "refused" ? (
              <button className={s.btn} onClick={() => setSend({ at: "undo", until: Date.now() + UNDO_MS })} data-approve data-real-approve={a.id}>
                {buttonFor(r, a)}
              </button>
            ) : send.at === "undo" ? (
              <>
                <button className={s.btn} onClick={post} data-send-now>
                  Send now
                </button>
                <button className={s.link} onClick={() => setSend({ at: "idle" })}>
                  Undo
                </button>
                <span className={s.undoText}>Going to PayPal in {left} s.</span>
              </>
            ) : (
              <span className={s.undoText}>Sending to PayPal.</span>
            )}
          </div>
          {send.at === "undo" && (
            <motion.span className={s.undoRule} initial={{ scaleX: 1 }} animate={{ scaleX: reduce ? 1 : 0 }} transition={{ duration: reduce ? 0 : UNDO_MS / 1000, ease: "linear" }} data-undo-rule data-cause="approve" aria-hidden />
          )}
          {send.at === "refused" && (
            <p className={`${s.filedSub} ${s.red}`} data-refused>
              Nothing was sent. {send.message}
              {send.debugId && (
                <>
                  {" "}
                  <span className={s.mono} data-origin="paypal">
                    debug {send.debugId}
                  </span>
                </>
              )}
            </p>
          )}
        </section>
      </div>
    </>
  );
}

function Answer({ send }: { send: Extract<Send, { at: "done" }> }) {
  const reduce = useReducedMotion();
  return (
    <>
      <div className={`${s.margin} ${s.section}`}>You approved it</div>
      <motion.div
        className={`${s.col} ${s.section} ${s.filed}`}
        initial={{ opacity: 0, y: reduce ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.1 : 0.32, ease: EASE_OUT }}
        data-cause="paypal-call"
        data-filed
        data-origin="paypal"
      >
        <p className={s.filedHead}>
          {send.message} <span className={s.mono}>{pt(send.when)}</span>.
        </p>
        <p className={s.filedSub}>
          PayPal answered {send.status ?? "without a status"}
          {send.debugId && (
            <>
              , debug id <span className={`${s.mono} ${s.ppId}`}>{send.debugId}</span>
            </>
          )}
          . PayPal and the card issuer usually decide within 30 days.
        </p>
      </motion.div>
    </>
  );
}

function Story({ r }: { r: ApiCase }) {
  const rows = story(r, plainOf);
  return (
    <>
      <div className={`${s.margin} ${s.section}`}>
        What happened, newest first
        <p style={{ margin: "8px 0 0" }}>PayPal rows carry the ids PayPal returned. Times PT.</p>
      </div>
      <div className={`${s.col} ${s.section}`}>
        <ol className={s.story} data-story>
          {rows.map((x) => (
            <li key={`${x.at}-${x.title}`} className={s.storyRow} data-story-row={x.who}>
              <span className={s.stepTime}>
                {realDay(x.at)}
                <br />
                {pt(x.at)}
              </span>
              <div className={x.who === "CaseClerk" ? s.storyBody : `${s.storyBody} ${s.storyPP}`}>
                <p className={s.storyHead}>
                  <span className={s.storyWho}>{x.who}</span> <span className={s.mono}>{x.title}</span>
                  {x.status && <span className={s.storyStatus}> {x.status}</span>}
                </p>
                <p className={s.storyPlain}>{x.plain}</p>
                {x.id && (
                  <p className={`${s.mono} ${s.storyId}`} data-story-id={x.id}>
                    {x.line?.dir === "out" ? `${x.line.path}  ` : ""}
                    {x.idKind} {x.id}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

function Decision({ r }: { r: ApiCase }) {
  const d = r.case.decision;
  if (!d) return null;
  const ev = d.expectedValueUsd;
  return (
    <>
      <div className={`${s.margin} ${s.section}`}>The agent&rsquo;s last decision</div>
      <div className={`${s.col} ${s.section}`}>
        <p className={s.rationale}>
          {d.strategy === "fight" ? "Fight with evidence" : d.strategy === "refund" ? "Refund" : d.strategy}, {Math.round(d.winProbability * 100)}% to win
          {ev && (
            <>
              {" "}
              (fighting costs {usd(Math.abs(ev.fight))} on average against {usd(Math.abs(ev.refund))} for a refund)
            </>
          )}
          , {realDay(d.at)} {pt(d.at)}. {ptify(d.rationale ?? "")}
        </p>
      </div>
    </>
  );
}
