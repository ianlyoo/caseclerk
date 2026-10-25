"use client";

// A real PayPal sandbox case, rendered from the production API and polled every 5 s.
// Approve here is real: it posts to production through /finals/a/live and PayPal answers.
// One source of truth: the case data. PayPal's answer to an approval is merged into it, and so is every poll,
// so the slip, the receipt, the story, the Wire and the nav count all change in the same render.

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AgentAction } from "@/lib/types";
import { POLICY, EVIDENCE_GATE_USD } from "../../../_shared/data";
import { PHOTOS } from "../../../_shared/photos";
import { EASE_OUT, Masthead, Wire, foldRoutine, plainOf, putRealCase, realDay, realTime, wireClock, type ShownLine } from "../../ui";
import { buttonFor, filedAction, filedAt, headline, pendingAction, ptify, realLines, realState, recommendation, rulingAsked, slipSummary, story, usd, whyWaits, type ApiCase } from "../../_real/model";
import s from "../../a.module.css";

const POLL_MS = 5000;
const UNDO_MS = 4000;
const pt = (iso: string) => `${wireClock(iso)} PT`;

type Send =
  | { at: "idle" }
  | { at: "undo"; until: number }
  | { at: "sending"; since: string; id: string }
  | { at: "refused"; status: number; debugId: string | null; message: string };

/** The case, polled; `merge` folds an action PayPal just answered into it, the way the next poll will show it. */
function usePolledCase(initial: ApiCase): [ApiCase, () => void, (a: AgentAction) => void] {
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
  const merge = useCallback((a: AgentAction) => {
    setR((x) => ({
      ...x,
      actions: x.actions.map((y) => (y.id === a.id ? a : y)),
      audit: x.audit.some((y) => y.kind === "action.approved") ? x.audit : [...x.audit, { at: new Date().toISOString(), actor: "seller", kind: "action.approved", summary: "Approved" }],
    }));
  }, []);
  useEffect(() => {
    const t = setInterval(pull, POLL_MS);
    return () => clearInterval(t);
  }, [pull]);
  useEffect(() => putRealCase(r), [r]);
  return [r, pull, merge];
}

/** Whole seconds since an ISO time, ticking while it is set. */
function useElapsed(since: string | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!since) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [since]);
  return since ? Math.max(0, Math.floor((now - Date.parse(since)) / 1000)) : 0;
}

export function RealCaseView({ initial }: { initial: ApiCase }) {
  const [r, pull, merge] = usePolledCase(initial);
  const [send, setSend] = useState<Send>({ at: "idle" });
  const action = pendingAction(r);
  // Sending ends the moment the data shows the action answered, whether PayPal's reply or a poll got there first.
  const sending = send.at === "sending" && r.actions.some((a) => a.id === send.id && (a.status === "approved" || a.status === "executing" || a.status === "awaiting_approval"));
  const elapsed = useElapsed(sending && send.at === "sending" ? send.since : null);
  const state = realState(r);
  const lines = useMemo(() => realLines(r), [r]);
  const filed = filedAction(r);
  const c = r.case;
  const resolvedLine = lines.find((l) => l.dir === "in" && l.name.endsWith(".RESOLVED"));
  const filedLine = filed && lines.find((l) => l.debugId && l.debugId === filed.result?.debugId);
  const sections = useMemo(() => {
    const shown: ShownLine[] = lines.map((l) => ({ ...l, key: `${l.eventId ?? l.debugId ?? l.at}` }));
    if (sending && send.at === "sending" && action)
      shown.push({ key: "inflight", at: send.since, dir: "out", name: action.kind.replaceAll("_", "-"), status: "", path: `POST /v1/customer/disputes/${c.id}/${action.kind.replaceAll("_", "-")}`, origin: "paypal", inflight: true, plain: `Sending to PayPal\u2026 ${elapsed} s` });
    const pin = resolvedLine ? (
      <>
        <span className={s.wirePinHead}>Closed by PayPal</span>
        <span className={s.mono}>{resolvedLine.name}</span> {pt(resolvedLine.at)}
        <br />
        <span className={`${s.mono} ${s.lDebug}`}>{resolvedLine.eventId}</span>
      </>
    ) : filed ? (
      <>
        <span className={s.wirePinHead}>Filed with PayPal</span>
        <span className={s.mono}>POST provide-evidence {filed.result?.httpStatus ?? ""}</span> {pt(filedLine?.at ?? filedAt(filed))}
        <br />
        <span className={`${s.mono} ${s.lDebug}`}>debug {filed.result?.debugId}</span>
      </>
    ) : undefined;
    return [{ key: "case", label: <>PayPal traffic for {c.id}</>, lines: foldRoutine(shown), pin }];
  }, [lines, sending, send, action, c.id, elapsed, resolvedLine, filed, filedLine]);

  const photoIn = action ? "slip" : filed ? "receipt" : "story";
  return (
    <div className={s.app}>
      <div className={s.paper}>
        <Masthead here="case" />
        <article className={s.file} data-real-case={c.id} data-real-state={state}>
          <Header r={r} />
          {action && <Slip r={r} send={send} setSend={setSend} pull={pull} merge={merge} sending={sending} elapsed={elapsed} photo={photoIn === "slip"} />}
          {!action && filed && <Receipt r={r} a={filed} photo={photoIn === "receipt"} />}
          <Story r={r} photo={photoIn === "story"} />
          <Decision r={r} />
        </article>
        <p className={s.foot}>Read from caseclerk.vercel.app/api/cases/{c.id} and refreshed every 5 seconds. Times are Pacific (PT).</p>
      </div>
      <Wire sections={sections} phoneLabel="Real sandbox case" />
    </div>
  );
}

function Photo({ r }: { r: ApiCase }) {
  const photo = PHOTOS[r.case.id];
  if (!photo) return null;
  return (
    <figure className={s.matFig}>
      <div className={s.mat}>
        <img src={photo.src} alt={photo.alt} data-credit={photo.credit} width={144} height={104} />
      </div>
      <figcaption className={s.credit}>Photo: {photo.credit}. Similar item, not the seller&rsquo;s.</figcaption>
    </figure>
  );
}

function Header({ r }: { r: ApiCase }) {
  const reduce = useReducedMotion();
  const c = r.case;
  const state = realState(r);
  const asked = rulingAsked(r);
  const resolvedAt = r.audit.find((x) => x.kind === "webhook.received" && String(x.data?.eventType).endsWith(".RESOLVED"))?.at;
  const h1 = headline(r);
  return (
    <>
      <div className={`${s.margin} ${s.marginStack} ${s.marginStill}`}>
        <p style={{ margin: 0 }}>
          <span className={s.mid}>{c.id}</span>
          <br />
          Opened {realDay(c.snapshot.createTime)}, {realTime(c.snapshot.createTime)} PT
        </p>
        <p className={s.realMark} data-real-mark>
          Real PayPal sandbox case
        </p>
      </div>
      <div className={s.col}>
        <AnimatePresence mode="wait" initial={false}>
          {/* A clean 150 ms swap: 75 ms out, 75 ms in, never two sentences on top of each other. */}
          <motion.h1 key={h1} className={s.h1} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0.05 : 0.075, ease: EASE_OUT }} data-cause="webhook">
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

function Slip({ r, send, setSend, pull, merge, sending, elapsed, photo }: { r: ApiCase; send: Send; setSend: (s: Send) => void; pull: () => void; merge: (a: AgentAction) => void; sending: boolean; elapsed: number; photo: boolean }) {
  const reduce = useReducedMotion();
  const a = pendingAction(r)!;
  const [left, setLeft] = useState(0);
  const [reading, setReading] = useState<number | null>(null);
  const rec = recommendation(r);
  const why = whyWaits(r, a, EVIDENCE_GATE_USD, POLICY.approvalAboveUsd);

  const post = useCallback(async () => {
    setSend({ at: "sending", since: new Date().toISOString(), id: a.id });
    try {
      const res = await fetch(`/finals/a/live/actions/${a.id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const j = await res.json().catch(() => ({}));
      // Success is { action, message }: PayPal's status and debug id sit on action.result. Merged into the case,
      // it moves the slip, the receipt, the story, the Wire and the nav count together.
      if (res.ok && j.action) merge(j.action as AgentAction);
      else if (!res.ok) {
        const e = j.error ?? {};
        const debugId = e.debugId ?? e.action?.result?.debugId ?? null;
        const said = typeof e.message === "string" && e.message.trim() ? ` ${e.message.trim().replace(/([^.])$/, "$1.")}` : "";
        const message =
          res.status === 409
            ? `Already answered, so nothing new went to PayPal.${said}`
            : e.action?.status === "failed" || debugId
              ? `PayPal didn't accept the filing.${said}`
              : `CaseClerk couldn't reach PayPal, so nothing was filed.${said}`;
        setSend({ at: "refused", status: res.status, debugId, message });
      }
    } catch {
      setSend({ at: "refused", status: 0, debugId: null, message: "The connection to CaseClerk dropped before an answer came back. The case below refreshes every 5 seconds and will show whether it was filed." });
    }
    pull();
  }, [a.id, setSend, pull, merge]);

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

  const sheets = readerSheets(a);
  return (
    <>
      <div className={`${s.margin} ${s.section}`}>
        <span className={s.green}>Waiting for you</span>
        <p className={s.policy}>{why}</p>
        {photo && <Photo r={r} />}
      </div>
      <div className={`${s.col} ${s.section} ${s.slipArea}`}>
        {rec && (
          <p className={s.recommend} data-recommend>
            {rec[0]}
            {rec[1] && (
              <>
                <br />
                {rec[1]}
              </>
            )}
          </p>
        )}
        <section className={s.slip} data-slip data-real-slip aria-label="Waiting for your approval">
          <div className={s.slipRow1}>
            <h2 className={s.slipHead}>{a.kind === "provide_evidence" ? "File the evidence with PayPal" : a.rationale.split(".")[0]}</h2>
          </div>
          <p className={s.slipNote}>{slipSummary(r, a)}</p>
          <p className={s.slipWhy}>{why}</p>
          {sheets.length > 0 && (
            <button className={`${s.link} ${s.showAll}`} onClick={() => setReading(0)} data-review-evidence>
              Review the evidence
            </button>
          )}
          <div className={s.slipRow3}>
            {send.at === "idle" || send.at === "refused" ? (
              <button className={s.btn} onClick={() => (setLeft(0), setSend({ at: "undo", until: Date.now() + UNDO_MS }))} data-real-approve={a.id}>
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
                <span className={s.undoText}>Going to PayPal in {left || Math.ceil(UNDO_MS / 1000)} s.</span>
              </>
            ) : sending ? (
              <span className={s.undoText} data-sending>
                Sending to PayPal&hellip; {elapsed} s
              </span>
            ) : null}
          </div>
          {send.at === "undo" && (
            <motion.span className={s.undoRule} initial={{ scaleX: 1 }} animate={{ scaleX: reduce ? 1 : 0 }} transition={{ duration: reduce ? 0 : UNDO_MS / 1000, ease: "linear" }} data-undo-rule data-cause="approve" aria-hidden />
          )}
          {send.at === "refused" && (
            <p className={`${s.filedSub} ${s.red}`} data-refused>
              {send.message}
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
        <Reader id={r.case.id} sheets={sheets} at={reading} setAt={setReading} />
      </div>
    </>
  );
}

type Sheet = { ref: string; name: string; body: string };
/** The pack CaseClerk will file: the seller's letter and the exhibits, straight from the action's params. */
function readerSheets(a: AgentAction): Sheet[] {
  const p = (a.params ?? {}) as { narrative?: string; exhibits?: { title: string; body: string }[] };
  return [
    ...(p.narrative ? [{ ref: "Letter", name: "The seller's letter", body: ptify(p.narrative) }] : []),
    ...(p.exhibits ?? []).map((x, i) => ({ ref: `Exhibit ${String.fromCharCode(65 + i)}`, name: x.title, body: ptify(x.body) })),
  ];
}

function Reader({ id, sheets, at, setAt }: { id: string; sheets: Sheet[]; at: number | null; setAt: (n: number | null) => void }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (at === null) return;
    const k = (ev: KeyboardEvent) => ev.key === "Escape" && setAt(null);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [at, setAt]);
  return (
    <AnimatePresence>
      {at !== null && sheets[at] && (
        <motion.div className={s.scrim} onClick={() => setAt(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0.1 : 0.32, ease: EASE_OUT }} data-cause="nav">
          <motion.div
            className={s.reader}
            role="dialog"
            aria-label={sheets[at].name}
            onClick={(ev) => ev.stopPropagation()}
            initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.1 : 0.32, ease: EASE_OUT }}
            data-cause="nav"
            data-reader
          >
            <span className={s.sheetRef}>
              {sheets[at].ref}, {id}
            </span>
            <h3>{sheets[at].name}</h3>
            <p style={{ whiteSpace: "pre-line" }}>{sheets[at].body}</p>
            <div className={s.readerFoot}>
              {at > 0 && (
                <button className={s.link} onClick={() => setAt(at - 1)}>
                  Previous page: {sheets[at - 1].name}
                </button>
              )}
              {at < sheets.length - 1 && (
                <button className={s.link} onClick={() => setAt(at + 1)}>
                  Next page: {sheets[at + 1].name}
                </button>
              )}
              <button className={s.link} onClick={() => setAt(null)}>
                Close
              </button>
            </div>
            <p className={s.policy} style={{ fontSize: 14 }}>
              This is the pack CaseClerk files with PayPal when you approve, as a PDF with the letter as its notes.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** PayPal's receipt for the filing, from the action itself: who approved, when it went out, PayPal's status and debug id. */
function Receipt({ r, a, photo }: { r: ApiCase; a: AgentAction; photo: boolean }) {
  const reduce = useReducedMotion();
  const approved = a.requiresApproval;
  return (
    <>
      <div className={`${s.margin} ${s.section} ${s.filedGap}`}>
        {approved ? "You approved it" : "Filed under your rules"}
        {photo && <Photo r={r} />}
      </div>
      <motion.div
        className={`${s.col} ${s.section} ${s.filed} ${s.filedGap}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduce ? 0.05 : 0.15, ease: EASE_OUT }}
        data-cause="paypal-call"
        data-filed
        data-origin="paypal"
      >
        <p className={s.filedHead}>CaseClerk filed the evidence with PayPal.</p>
        <p className={s.filedTimes} data-filed-times>
          Filed at {pt(filedAt(a))}; PayPal answered at {pt(a.updatedAt)}.
        </p>
        <p className={s.filedSub}>
          {a.result?.httpStatus ? <>PayPal answered {a.result.httpStatus}</> : <>PayPal took the filing</>}
          {a.result?.debugId && (
            <>
              , debug id <span className={`${s.mono} ${s.ppId}`}>{a.result.debugId}</span>
            </>
          )}
          .{realState(r) === "resolved" ? "" : " PayPal and the card issuer usually decide within 30 days."}
        </p>
      </motion.div>
    </>
  );
}

function Story({ r, photo }: { r: ApiCase; photo: boolean }) {
  const rows = story(r, plainOf);
  return (
    <>
      <div className={`${s.margin} ${s.section}`}>
        What happened, newest first
        <p style={{ margin: "8px 0 0" }}>PayPal rows carry the ids PayPal returned. Times PT.</p>
        {photo && <Photo r={r} />}
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
  return (
    <>
      <div className={`${s.margin} ${s.section}`}>The agent&rsquo;s reasoning</div>
      <div className={`${s.col} ${s.section}`}>
        <p className={s.rationale}>
          {realDay(d.at)} {pt(d.at)}. {ptify(d.rationale ?? "")}
        </p>
      </div>
    </>
  );
}
