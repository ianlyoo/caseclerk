"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { agentCost, caseDetail, thenSteps, wireOf, type CaseDetail, type Exhibit, type Step } from "../../../_shared/cases";
import { day, NOW, sortedCases, time, usd, weekday } from "../../../_shared/data";
import { PHOTOS } from "../../../_shared/photos";
import { REAL_ID, REAL_WIRE } from "../../../_shared/real";
import { entryFor, useDecision, usePendingApprovals, UNDO_MS, type Entry } from "../../../_shared/store";
import { BASE, EASE_OUT, countdownNow, hoursLeftNow, Masthead, Num, SPRING, Wire, countWord, wireClock, type ShownLine, type WireSection } from "../../ui";
import { REAL_HREF } from "../../_real/model";
import s from "../../a.module.css";

const plus = (iso: string, sec: number) => new Date(Date.parse(iso) + sec * 1000).toISOString();
const first = (name: string) => name.split(" ")[0];
const thing = (item: string) => item.split(",")[0];

/** The case page, driven by the shared store; ?state= can force a state on load. */
export function CaseView({ id, state, controls }: { id: string; state?: string; controls?: boolean }) {
  const d = caseDetail(id)!;
  const dec = useDecision(id);
  const urlEntry = d.approval ? entryFor(state) : undefined;
  const [applied, setApplied] = useState(!urlEntry);
  useEffect(() => {
    if (urlEntry) dec.force(urlEntry);
    setApplied(true);
    // Applied once: a reload then shows what the seller did since, never the forced state again.
    if (state) window.history.replaceState(null, "", window.location.pathname + (controls ? "?controls=1" : ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const e: Entry = !applied && urlEntry ? urlEntry : dec;
  const phase = d.approval ? e.phase : undefined;
  const [hover, setHover] = useState<string | null>(null);

  // The webhook that follows PayPal's 200 lands a moment later (staged; sample case).
  const [thenShown, setThenShown] = useState(false);
  useEffect(() => {
    if (phase !== "filed") return setThenShown(phase === "resolved");
    const t = setTimeout(() => setThenShown(true), 1600);
    return () => clearTimeout(t);
  }, [phase]);

  const after = useMemo(() => afterSteps(d, e, thenShown), [d, e, thenShown]);
  const sections = useMemo(() => wireSections(d, e, after, hover), [d, e, after, hover]);
  useKeys(id);

  return (
    <div className={s.app}>
      <div className={s.paper}>
        <Masthead here="case" />
        <article className={s.file}>
          <Header d={d} phase={phase} resolvedAt={e.resolvedAt} />
          <SlipRow d={d} e={e} dec={dec} />
          <Why d={d} />
          <Dossier d={d} />
          <Words d={d} />
          <Did d={d} after={after} setHover={setHover} hover={hover} />
        </article>
        {controls && <Bar d={d} phase={phase} resolve={dec.resolve} reset={dec.reset} />}
      </div>
      <Wire sections={sections} phoneLabel={d.sample ? "Sample case" : undefined} />
    </div>
  );
}

// ---- Header: margin (id, mat) | h1, figure ----

function Header({ d, phase, resolvedAt }: { d: CaseDetail; phase?: string; resolvedAt?: string }) {
  const reduce = useReducedMotion();
  const photo = PHOTOS[d.c.id];
  const resolved = phase === "resolved";
  // A staged ruling claims no money: the real ruling is on the real case.
  const kept = resolved ? undefined : d.outcome?.kept;
  const h1 = resolved ? "A staged ending. On a real case, PayPal\u2019s ruling lands here." : d.headline;
  const red = d.c.dueAt && hoursLeftNow(d.c.dueAt) < 72;
  return (
    <>
      <div className={`${s.margin} ${s.marginStack}`}>
        <p style={{ margin: 0 }}>
          <span className={s.mid}>{d.c.id}</span>
          <br />
          Opened {day(d.c.openedAt)}
          <br />
          <span className={s.sample}>Sample case. Nothing on this page went to PayPal.</span>
        </p>
        {photo && (
          <div className={s.mat}>
            <img src={photo.src} alt={photo.alt} data-credit={photo.credit} width={144} height={104} />
          </div>
        )}
      </div>
      <div className={s.col}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.h1
            key={h1}
            className={s.h1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.1 : 0.16, ease: EASE_OUT }}
            data-cause="resolve"
          >
            {h1}
          </motion.h1>
        </AnimatePresence>
        <div className={s.figureRow}>
          {kept !== undefined ? (
            <>
              <span className={`${s.figureLabel} ${s.green}`}>You kept</span>
              <Num value={Number(kept)} cause="resolve" className={`${s.figure} ${s.green}`} />
            </>
          ) : (
            <Num value={Number(d.c.amount)} cause="resolve" className={s.figure} />
          )}
          {kept !== undefined ? (
            <span className={s.due}>of {usd(d.c.amount)}, closed {resolved ? (resolvedAt && day(resolvedAt) !== day(NOW) ? day(resolvedAt) : "today") : day(d.c.closedAt!)}</span>
          ) : resolved ? (
            <span className={s.due} data-staged-ruling>
              staged ruling, sample only. <Link href={REAL_HREF}>See a real ruling</Link>
            </span>
          ) : d.c.dueAt ? (
            <span className={red ? s.red : s.due}>
              respond within <span suppressHydrationWarning>{countdownNow(d.c.dueAt)}</span>, by {weekday(d.c.dueAt)} {day(d.c.dueAt)}
            </span>
          ) : (
            <span className={s.due}>with PayPal, no answer due from you</span>
          )}
        </div>
        {kept !== undefined && (
          <motion.div
            className={s.keptRule}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: reduce ? 0.1 : 0.6, ease: EASE_OUT }}
            data-cause="resolve"
          />
        )}
      </div>
    </>
  );
}

// ---- The slip, or the recommendation sentence when nothing waits ----

type Dec = ReturnType<typeof useDecision>;

function SlipRow({ d, e, dec }: { d: CaseDetail; e: Entry; dec: Dec }) {
  const a = d.approval;
  if (!a) {
    const line = d.outcome?.line ?? d.working ?? d.decision?.headline;
    return (
      <>
        <div className={`${s.margin} ${s.marginStack}`}>
          <span>{d.working ? "The agent, now" : d.outcome ? "Outcome" : "Recommendation"}</span>
          <Position id={d.c.id} />
        </div>
        <div className={s.col}>
          <motion.p
            className={s.filedHead}
            style={{ margin: 0 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: EASE_OUT }}
            data-cause="agent-step"
          >
            {line}
          </motion.p>
        </div>
      </>
    );
  }
  const live = e.phase === "pending" || e.phase === "undo" || e.phase === "sending";
  return (
    <>
      <div className={`${s.margin} ${s.marginStack}`}>
        <div>
        {live ? (
          <>
            <span className={s.green}>Waiting for you</span>
            <p className={s.policy}>{a.why}</p>
          </>
        ) : e.phase === "declined" ? (
          "You declined"
        ) : (
          <span className={s.green}>You approved it</span>
        )}
        </div>
        <Position id={d.c.id} />
      </div>
      <div className={`${s.col} ${s.slipArea}`}>
        {live ? <Slip d={d} e={e} dec={dec} /> : <AfterSlip d={d} e={e} dec={dec} />}
      </div>
    </>
  );
}

function Slip({ d, e, dec }: { d: CaseDetail; e: Entry; dec: Dec }) {
  const a = d.approval!;
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLElement>();
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState(UNDO_MS / 1000);

  // The undo window counts down in words too (the rule is still under reduced motion).
  useEffect(() => {
    if (e.phase !== "undo") return setLeft(UNDO_MS / 1000);
    const started = Date.now();
    const t = setInterval(() => setLeft(Math.max(1, Math.ceil((UNDO_MS - (Date.now() - started)) / 1000))), 200);
    return () => clearInterval(t);
  }, [e.phase]);

  // On send the slip lifts, crosses the seam into the Wire and becomes the POST entry.
  useEffect(() => {
    if (e.phase !== "sending" || !scope.current) return;
    const el = scope.current;
    const wire = [...document.querySelectorAll<HTMLElement>("[data-wire]")].find((w) => w.offsetWidth > 0);
    const target = (wire?.querySelector("ol") ?? wire)?.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    if (!target) return;
    const dx = target.left + 12 - box.left;
    const dy = target.top - box.top;
    (async () => {
      if (reduce) {
        await animate(el, { opacity: 0 }, { duration: 0.12 });
        return;
      }
      await animate(el, { y: -6, boxShadow: "0 2px 2px rgba(22,20,14,.06), 0 16px 32px -12px rgba(22,20,14,.3), 0 36px 64px -28px rgba(22,20,14,.32)" }, { duration: 0.2, ease: EASE_OUT });
      await animate(el, { x: dx, y: dy, scale: 0.6 }, SPRING);
      await animate(el, { opacity: 0 }, { duration: 0.16 });
    })();
  }, [e.phase, animate, reduce, scope]);

  return (
    <motion.section
      ref={scope}
      className={`${s.slip} ${open ? s.open : ""}`}
      data-slip
      data-cause="approve"
      initial={false}
      aria-label="Waiting for your approval"
    >
      <div className={s.slipRow1}>
        <h2 className={s.slipHead}>{a.head}</h2>
      </div>
      <p className={s.slipNote}>{open && d.letter ? d.letter : a.note}</p>
      <button className={`${s.link} ${s.showAll}`} onClick={() => setOpen((o) => !o)}>
        {open ? "Show less" : a.kind === "provide_evidence" ? "Show the whole letter" : "Show all"}
      </button>
      <div className={s.slipRow3}>
        {e.phase === "pending" ? (
          <>
            <button className={s.btn} onClick={dec.approve} data-approve>
              {a.button}
            </button>
            <button className={s.link} onClick={dec.decline}>
              {a.decline}
            </button>
          </>
        ) : e.phase === "undo" ? (
          <>
            <button className={s.btn} onClick={dec.sendNow} data-send-now>
              Send now
            </button>
            <button className={s.link} onClick={dec.undo}>
              Undo
            </button>
            <span className={s.undoText}>Going to PayPal in {left} s.</span>
          </>
        ) : (
          <span className={s.undoText}>Sending to PayPal.</span>
        )}
      </div>
      {e.phase === "undo" && (
        <motion.span
          className={s.undoRule}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: reduce ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : UNDO_MS / 1000, ease: "linear" }}
          data-undo-rule
          data-cause="approve"
          aria-hidden
        />
      )}
    </motion.section>
  );
}

function AfterSlip({ d, e, dec }: { d: CaseDetail; e: Entry; dec: Dec }) {
  const a = d.approval!;
  const reduce = useReducedMotion();
  if (e.phase === "declined")
    return (
      <div className={s.filed}>
        <p className={s.filedHead}>You chose not to file. Nothing was sent to PayPal.</p>
        <p className={s.filedSub}>
          The agent will accept the chargeback when you confirm.{" "}
          <button className={s.link} onClick={dec.reset}>
            Undo
          </button>
        </p>
      </div>
    );
  const ok = e.okAt!;
  return (
    <motion.div
      className={s.filed}
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.1 : 0.32, ease: EASE_OUT }}
      data-cause="paypal-call"
      data-filed
    >
      <p className={s.filedHead}>
        {a.done} <span className={s.mono}>{wireClock(ok)}</span>.
      </p>
      <p className={s.filedSub}>
        Staged: on a real case this posts to <span className={s.mono}>{a.call.path.replace("POST ", "").replace(d.c.id, "{id}")}</span> and PayPal answers with a debug id.{" "}
        {e.phase === "resolved" ? "The ruling here is staged too." : "PayPal and the card issuer usually decide within 30 days."}
      </p>
    </motion.div>
  );
}

// ---- Why, with the expected values ----

function Why({ d }: { d: CaseDetail }) {
  const dc = d.decision;
  if (!dc) return null;
  return (
    <>
      <div className={`${s.margin} ${s.section}`}>Why</div>
      <div className={`${s.col} ${s.section}`}>
        {d.approval && <p className={s.h2}>{dc.headline}</p>}
        <p className={s.rationale}>{dc.rationale}</p>
        <table className={s.ev}>
          <tbody>
            {dc.options.map((o) => (
              <tr key={o.key} className={o.chosen ? s.evChosen : undefined}>
                <td>{o.name}</td>
                <td>{o.math}</td>
                <td>{usd(o.ev)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={s.valueNote}>
          Average you keep, at a {dc.winPct}% chance of winning. {dc.valueNote}
        </p>
      </div>
    </>
  );
}

// ---- Dossier and the in-place reader ----

function Dossier({ d }: { d: CaseDetail }) {
  const [open, setOpen] = useState<number | null>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (open === null) return;
    const k = (ev: KeyboardEvent) => ev.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);
  if (!d.exhibits?.length) return null;
  const sheets: Exhibit[] = [
    ...(d.letter ? [{ ref: "Letter", name: "Evidence letter", detail: d.letter.split("\n")[0], body: d.letter }] : []),
    ...d.exhibits,
  ];
  return (
    <>
      <div className={`${s.margin} ${s.section}`}>
        Evidence pack
        <br />
        {d.exhibitsNote}
      </div>
      <div className={`${s.col} ${s.section}`}>
        <div className={s.dossier}>
          {sheets.map((x, i) => (
            <button key={x.ref} className={s.sheet} onClick={() => setOpen(i)} data-sheet>
              <span className={s.sheetRef}>{x.ref.length === 1 ? `Exhibit ${x.ref}` : x.ref}</span>
              <span className={s.sheetName}>{x.name}</span>
              <span className={s.sheetBody}>{x.detail.length > 90 ? x.detail.slice(0, 88) + "…" : x.detail}</span>
            </button>
          ))}
        </div>
        <AnimatePresence>
          {open !== null && (
            <motion.div
              className={s.scrim}
              onClick={() => setOpen(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0.1 : 0.32, ease: EASE_OUT }}
              data-cause="nav"
            >
              <motion.div
                className={s.reader}
                role="dialog"
                aria-label={sheets[open].name}
                onClick={(ev) => ev.stopPropagation()}
                initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0.1 : 0.32, ease: EASE_OUT }}
                data-cause="nav"
                data-reader
              >
                <span className={s.sheetRef}>
                  {sheets[open].ref.length === 1 ? `Exhibit ${sheets[open].ref}` : sheets[open].ref}, {d.c.id}
                </span>
                <h3>{sheets[open].name}</h3>
                <p>{sheets[open].body ?? sheets[open].detail}</p>
                <div className={s.readerFoot}>
                  {open > 0 && (
                    <button className={s.link} onClick={() => setOpen(open - 1)}>
                      Previous page: {sheets[open - 1].name}
                    </button>
                  )}
                  {open < sheets.length - 1 && (
                    <button className={s.link} onClick={() => setOpen(open + 1)}>
                      Next page: {sheets[open + 1].name}
                    </button>
                  )}
                  <button className={s.link} onClick={() => setOpen(null)}>
                    Close
                  </button>
                </div>
                <p className={s.sample} style={{ fontSize: 14 }}>
                  Sample case: this pack was not filed with PayPal, so there is no PDF to download.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

function Words({ d }: { d: CaseDetail }) {
  const cb = d.c.stage === "CHARGEBACK";
  return (
    <>
      <div className={`${s.margin} ${s.section}`}>{cb ? "The claim" : `${first(d.c.buyer)}'s words`}</div>
      <div className={`${s.col} ${s.section}`}>
        <p className={s.words}>&ldquo;{d.c.claim}&rdquo;</p>
        <p className={s.wordsBy}>
          {cb ? `${d.c.buyer}, through the card issuer` : d.c.buyer}, {d.c.buyerCity}, {day(d.c.openedAt)}
        </p>
      </div>
    </>
  );
}

// ---- What the agent did, with the steps the seller's decision adds ----

function afterSteps(d: CaseDetail, e: Entry, thenShown: boolean): Step[] {
  const a = d.approval;
  if (!a) return [];
  const out: Step[] = [];
  if (e.phase === "pending")
    out.push({ at: plus(d.decision!.at, 17), actor: "system", title: "Waiting for you", detail: `${a.why} Nothing goes to PayPal until you decide.`, pending: true });
  if (e.phase === "declined") out.push({ at: plus(d.decision!.at, 60), actor: "seller", title: "You chose not to file", detail: "Nothing was sent." });
  if (e.approvedAt) out.push({ at: e.approvedAt, actor: "seller", title: a.kind === "provide_evidence" ? "You approved filing the evidence" : `You approved the ${usd(a.amount)} refund` });
  if (e.phase === "undo" || e.phase === "sending")
    out.push({ at: e.approvedAt!, actor: "system", title: e.phase === "undo" ? "Going to PayPal in a few seconds" : "Sending to PayPal", pending: true, wire: e.phase === "sending" ? a.call : undefined });
  if (e.okAt) {
    out.push({ at: e.okAt, actor: "tool", title: a.kind === "provide_evidence" ? "Filed the evidence with PayPal" : "Sent the refund through PayPal", detail: "Staged; nothing went to PayPal.", wire: a.call });
    if (thenShown) out.push(...thenSteps(a, e.okAt));
  }
  if (e.phase === "resolved")
    out.push({
      at: e.resolvedAt!,
      actor: "paypal",
      title: "Staged ruling",
      detail: "Sample only; nothing came from PayPal.",
      wire: { dir: "in", name: "CUSTOMER.DISPUTE.RESOLVED", status: a.resolved.outcome, path: "CUSTOMER.DISPUTE.RESOLVED" },
    });
  return out;
}

const stepKey = (st: Step) => `${st.at}|${st.wire?.path ?? st.title}`;

function Did({ d, after, hover, setHover }: { d: CaseDetail; after: Step[]; hover: string | null; setHover: (k: string | null) => void }) {
  const reduce = useReducedMotion();
  const cost = agentCost(d);
  const all = [...d.steps, ...after];
  return (
    <>
      <div className={`${s.margin} ${s.section}`}>
        What the agent did
        {d.did && <p style={{ margin: "8px 0 0" }}>{d.did}</p>}
      </div>
      <div className={`${s.col} ${s.section}`}>
        <ol className={s.steps}>
          <AnimatePresence initial={false}>
            {all.map((st) => {
              const k = stepKey(st);
              return (
                <motion.li
                  key={k}
                  className={`${s.step} ${hover === k ? s.on : ""}`}
                  initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduce ? 0.1 : 0.32, ease: EASE_OUT }}
                  data-cause="agent-step"
                  onMouseEnter={() => st.wire && setHover(k)}
                  onMouseLeave={() => setHover(null)}
                >
                  <span className={s.stepTime}>
                    {day(st.at)}, {time(st.at)}
                  </span>
                  <p className={`${s.stepText} ${st.pending ? s.pending : ""}`}>
                    {st.title}
                    {st.pending ? "." : ". "}
                    {st.detail && <span className={s.stepDetail}>{st.detail}</span>}
                  </p>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
        <p className={s.costLine} title={cost.split}>
          The agent&rsquo;s model time on this case cost about {cost.total}.
        </p>
      </div>
    </>
  );
}

// ---- The Wire for this case ----

function wireSections(d: CaseDetail, e: Entry, after: Step[], hover: string | null): WireSection[] {
  // The approval's call is one entry: in flight while sending, then the same entry with PayPal's answer.
  const lines: ShownLine[] = [...d.steps, ...after]
    .filter((st) => st.wire)
    .map((st) => {
      const k = stepKey(st);
      const send = !!d.approval && st.wire === d.approval.call;
      return { ...st.wire!, at: st.at, origin: "sample" as const, key: send ? "send" : k, inflight: send && e.phase === "sending", lit: hover === k };
    });
  return [
    { key: "own", label: "Sample case. Nothing here went to PayPal.", lines },
    {
      key: "real",
      label: (
        <>
          Real traffic from the last sandbox run, <Link href={`${BASE}`}>{REAL_ID}</Link>, Oct 24
        </>
      ),
      lines: REAL_WIRE.map((l) => ({ ...l, key: `real-${l.at}` })),
    },
  ];
}

// ---- Sandbox bar ----

function Bar({ d, phase, resolve, reset }: { d: CaseDetail; phase?: string; resolve: () => void; reset: () => void }) {
  const base = `${BASE}/case/${d.c.id}`;
  return (
    <div className={s.bar} data-well>
      <b>Sample case.</b>
      <span>Nothing on this page went to PayPal.</span>
      {d.approval && (
        <>
          <span>
            Show it{" "}
            <Link href={`${base}?state=pending`} aria-current={phase === "pending" ? "true" : undefined}>
              waiting for you
            </Link>
            ,{" "}
            <Link href={`${base}?state=approved`} aria-current={phase === "filed" ? "true" : undefined}>
              approved
            </Link>{" "}
            or{" "}
            <Link href={`${base}?state=resolved`} aria-current={phase === "resolved" ? "true" : undefined}>
              resolved
            </Link>
            .
          </span>
          {phase === "filed" && (
            <button className={s.link} onClick={resolve} data-resolve>
              Sandbox: PayPal rules for the seller
            </button>
          )}
          {phase !== "pending" && (
            <button className={s.link} onClick={reset}>
              Start over
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ---- Position and J/K ----

function neighbours(id: string) {
  const all = sortedCases();
  const i = all.findIndex((c) => c.id === id);
  return { all, i, prev: all[(i - 1 + all.length) % all.length], next: all[(i + 1) % all.length] };
}

function useKeys(id: string) {
  const router = useRouter();
  useEffect(() => {
    const { prev, next } = neighbours(id);
    const k = (ev: KeyboardEvent) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey || (ev.target as HTMLElement).closest("input,textarea,[role=dialog]")) return;
      if (ev.key === "j") router.push(`${BASE}/case/${next.id}`);
      if (ev.key === "k") router.push(`${BASE}/case/${prev.id}`);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [id, router]);
}

const dueWord = (c: { dueAt?: string; closedAt?: string }) => (c.dueAt ? `due ${weekday(c.dueAt)}` : c.closedAt ? "closed" : "with PayPal");

export function Position({ id }: { id: string }) {
  const { all, prev, next } = neighbours(id);
  const need = usePendingApprovals();
  const open = all.filter((c) => !c.closedAt);
  const n = open.findIndex((c) => c.id === id);
  return (
    <div className={s.pager}>
      <span>{n >= 0 ? `${n + 1} of ${open.length} open, ${countWord(need)} need${need === 1 ? "s" : ""} you` : `Closed, ${open.length} still open`}</span>
      <Link href={`${BASE}/case/${prev.id}`}>
        Previous: {thing(prev.item)}, {usd(prev.amount)}, {dueWord(prev)}
      </Link>
      <Link href={`${BASE}/case/${next.id}`}>
        Next: {thing(next.item)}, {usd(next.amount)}, {dueWord(next)}
      </Link>
      <span className={s.sample}>J and K also move.</span>
    </div>
  );
}
