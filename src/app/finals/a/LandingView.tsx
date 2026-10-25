"use client";

// The landing: a real PayPal sandbox case replayed from chargeback to ruling, from the production API.

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { usd } from "../_shared/data";
import { BASE, EASE_OUT, HERO_HREF, Masthead, SAMPLE_HERO_HREF, Wire, realDay, realTime, useRealCases, wireClock } from "./ui";
import { HERO_ID, REAL_HREF, realState, replayLines, thingOf, type ApiCase } from "./_real/model";
import s from "./a.module.css";

const REPLAY_MS = 9000;
const START_MS = 400;
// Whole seconds, so sums match the clocks shown on the Wire.
const sec = (iso: string) => Math.floor(Date.parse(iso) / 1000);
const mins = (a: string, b: string) => Math.round((sec(b) - sec(a)) / 60);

/** How many replay lines have landed: 9 s in all, or everything at once under reduced motion. */
function useReplay(total: number): number {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduce || !total) return setN(total);
    const gap = REPLAY_MS / total;
    const ts = Array.from({ length: total }, (_, i) => setTimeout(() => setN(i + 1), START_MS + i * gap));
    return () => ts.forEach(clearTimeout);
  }, [reduce, total]);
  return n;
}

const STAGES = ["Card payment created, 201", "Tracking added, 201", "Chargeback filed", "Waiting for PayPal's webhook"];

function OpenTest() {
  const [t0, setT0] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (t0 === null) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [t0]);
  const el = t0 === null ? 0 : Math.max(0, now - t0);
  const done = [600, 1500, 2600].filter((ms) => el >= ms).length;
  const sec = Math.max(0, Math.floor((el - 2600) / 1000));
  return (
    <div className={s.cta}>
      <button className={s.btn} onClick={() => t0 === null && (setT0(Date.now()), setNow(Date.now()))} disabled={t0 !== null} data-open-test>
        Open a test dispute
      </button>
      <p className={s.ctaNote}>A sandbox chargeback. PayPal&rsquo;s webhook reaches us in about 3 minutes.</p>
      {t0 !== null && (
        <motion.div className={s.wellBox} data-well initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.32 }} data-cause="paypal-call">
          <ol>
            {STAGES.slice(0, done + 1).map((st, i) => (
              <motion.li key={st} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: EASE_OUT }} data-cause="paypal-call">
                <span>{i === 3 ? `${st}, ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")} so far, usually under 3 min` : st}</span>
                <span>{i < done ? "done" : ""}</span>
              </motion.li>
            ))}
          </ol>
          <p className={s.ctaNote} style={{ marginTop: 8, fontSize: 14 }}>
            Preview of the wait, staged in your browser: this page does not call PayPal.
          </p>
        </motion.div>
      )}
    </div>
  );
}

/** The real case waiting for the seller right now, read live; nothing shows if none is waiting. */
function WaitingNow() {
  const real = useRealCases();
  const r = real?.find((x) => x.case.id === HERO_ID && realState(x) === "pending");
  if (!r) return null;
  return (
    <motion.p className={s.landNow} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.32 }} data-cause="webhook" data-waiting-now>
      <span className={s.green}>Waiting for you now:</span> a real {usd(r.case.snapshot.amount.value)} chargeback on an {thingOf(r)}. The evidence is ready, and it files when you say yes.{" "}
      <Link href={HERO_HREF}>Open it</Link>
    </motion.p>
  );
}

export function LandingView({ r }: { r: ApiCase | null }) {
  const lines = r ? replayLines(r) : [];
  const n = useReplay(lines.length);
  const reduce = useReducedMotion();
  if (!r || !lines.length) return <Unavailable />;
  const c = r.case;
  const amt = usd(c.snapshot.amount.value);
  const created = lines.find((l) => l.name.endsWith(".CREATED"));
  const filing = lines.find((l) => l.path.endsWith("/provide-evidence"));
  const resolved = lines.find((l) => l.name.endsWith(".RESOLVED"));
  const approved = r.audit.find((x) => x.kind === "action.approved");
  const filingIdx = filing ? lines.indexOf(filing) : lines.length;
  const done = n >= lines.length;
  const d = c.decision;
  const ex = (r.actions.find((a) => a.kind === "provide_evidence")?.params?.exhibits as { title: string }[] | undefined) ?? [];
  const item = c.order?.items?.[0]?.name ?? thingOf(r);
  const spanMin = mins(lines[0].at, lines.at(-1)!.at);
  return (
    <div className={`${s.app} ${s.wLanding}`}>
      <div className={s.paper}>
        <Masthead here="landing" />
        <main className={s.land}>
          <h1 className={s.landH1}>
            A {amt} chargeback came in at {realTime(created?.at ?? lines[0].at)} PT.{" "}
            {approved && resolved ? (
              <>
                You approved the evidence at {realTime(approved.at)}, and PayPal closed the case {mins(approved.at, resolved.at)} minutes later.
              </>
            ) : filing ? (
              <>CaseClerk filed the evidence at {realTime(filing.at)}; PayPal is deciding.</>
            ) : (
              <>CaseClerk is working on it.</>
            )}
          </h1>
          <p className={s.lede}>CaseClerk answers PayPal disputes for small online sellers. It reads the case, gathers the order and the tracking, files the evidence, and asks you before any money moves.</p>
          <div className={s.landCase}>
            <div className={s.dossier} style={{ gridTemplateColumns: "1fr", marginTop: 0 }}>
              <AnimatePresence>
                {n > filingIdx && (
                  <motion.div
                    key="filed"
                    className={s.sheet}
                    style={{ cursor: "default", minHeight: 120 }}
                    initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduce ? 0.1 : 0.32, ease: EASE_OUT }}
                    data-cause="paypal-call"
                  >
                    <span className={s.sheetRef}>Filed with PayPal, {ex.length} exhibits</span>
                    <span className={s.sheetName}>{ex[0]?.title ?? "Evidence"}</span>
                    <span className={s.sheetBody}>
                      {item}, {amt}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className={s.landFacts}>
              <strong>
                {item}, {amt}.
              </strong>{" "}
              The buyer&rsquo;s card issuer said it wasn&rsquo;t as described. The agent pulled the order and the USPS tracking
              {d?.expectedValueUsd ? (
                <>
                  {" "}
                  and decided to fight ({Math.round(d.winProbability * 100)}% to win; fighting costs {usd(Math.abs(d.expectedValueUsd.fight))} on average against {usd(Math.abs(d.expectedValueUsd.refund))} for a refund)
                </>
              ) : null}
              . The case is over the seller&rsquo;s $250.00 evidence line, so it waited for a yes.
              {approved && filing && (
                <>
                  {" "}
                  The seller approved at {wireClock(approved.at)} PT and PayPal accepted the evidence, <span className={s.mono}>debug {filing.debugId}</span>.
                </>
              )}{" "}
              {done && resolved ? (
                <span data-replay-end>
                  PayPal closed the case at {wireClock(resolved.at)} PT and paid the buyer itself, after a sandbox ruling request.
                </span>
              ) : null}
            </p>
          </div>
          <WaitingNow />
          <OpenTest />
          <p style={{ margin: 0, fontSize: 15 }}>
            <Link href={REAL_HREF} data-open-real>
              Open this case
            </Link>
            , see <Link href={`${BASE}/inbox`}>the disputes desk</Link>, or try <Link href={SAMPLE_HERO_HREF}>a sample case</Link>.
          </p>
        </main>
        <p className={s.foot}>Built on PayPal Disputes, Orders, Tracking and Webhooks (sandbox). Claude Haiku 5.5 sorts each case; Opus 5.5 decides.</p>
      </div>
      <Wire
        phoneLabel={`Replay of ${c.id}`}
        sections={[
          {
            key: "replay",
            label: (
              <>
                Replay of {c.id}, recorded {realDay(lines[0].at)}: {spanMin} min compressed to 9 s. Webhooks and filings, real PayPal ids.
              </>
            ),
            lines: lines.slice(0, n).map((l) => ({ ...l, key: l.eventId ?? l.debugId ?? l.at })),
          },
        ]}
      />
    </div>
  );
}

function Unavailable() {
  return (
    <div className={`${s.app} ${s.wLanding}`}>
      <div className={s.paper}>
        <Masthead here="landing" />
        <main className={s.land}>
          <h1 className={s.landH1}>CaseClerk answers PayPal disputes for small online sellers.</h1>
          <p className={s.lede}>The real-case replay couldn&rsquo;t load from the production API just now. <Link href={`${BASE}/inbox`}>See the disputes desk</Link>.</p>
        </main>
      </div>
      <Wire sections={[]} />
    </div>
  );
}
