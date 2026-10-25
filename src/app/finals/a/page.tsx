"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { usd } from "../_shared/data";
import { REAL, REAL_ID, REAL_WIRE } from "../_shared/real";
import { BASE, EASE_OUT, HERO_HREF, Masthead, SAMPLE_HERO_HREF, Wire, realDay, realTime, useRealCases, wireClock } from "./ui";
import { HERO_ID, REAL_HREF, realState, thingOf } from "./_real/model";
import s from "./a.module.css";

const GAP_MS = 800;
const START_MS = 400;
const spanMin = Math.round((Date.parse(REAL_WIRE.at(-1)!.at) - Date.parse(REAL_WIRE[0].at)) / 60000);
const firstAsk = REAL_WIRE.find((l) => l.status === "WAITING_FOR_SELLER_RESPONSE")!;
const firstFile = REAL_WIRE.find((l) => l.path.endsWith("/provide-evidence"))!;
// Whole seconds, so the sum matches the clocks shown on the Wire (21:36:07 to 21:36:37 is 30 s).
const sec = (iso: string) => Math.floor(Date.parse(iso) / 1000);
const askToFile = sec(firstFile.at) - sec(firstAsk.at);
const ruling = REAL_WIRE.find((l) => l.path.endsWith("/adjudicate"))!;
const fileIdx = REAL_WIRE.indexOf(firstFile);

/** How many real lines have landed: a 9 s replay, or all at once under reduced motion. */
function useReplay(): number {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduce) return setN(REAL_WIRE.length);
    const ts = REAL_WIRE.map((_, i) => setTimeout(() => setN(i + 1), START_MS + i * GAP_MS));
    return () => ts.forEach(clearTimeout);
  }, [reduce]);
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

export default function FinalALanding() {
  const n = useReplay();
  const reduce = useReducedMotion();
  const filed = n > fileIdx;
  return (
    <div className={`${s.app} ${s.wLanding}`}>
      <div className={s.paper}>
        <Masthead here="landing" />
        <main className={s.land}>
          <h1 className={s.landH1}>
            A {usd(REAL.amount)} chargeback came in at {realTime(REAL_WIRE[0].at)} PT. CaseClerk filed the evidence {askToFile} seconds after PayPal asked for it.
          </h1>
          <p className={s.lede}>CaseClerk answers PayPal disputes for small online sellers. It reads the case, gathers the order and the tracking, files the evidence, and asks you before any money moves.</p>
          <div className={s.landCase}>
            <div className={s.dossier} style={{ gridTemplateColumns: "1fr", marginTop: 0 }}>
              <AnimatePresence>
                {filed &&
                  REAL.exhibits.slice(0, 1).map((x) => (
                    <motion.div
                      key={x.title}
                      className={s.sheet}
                      style={{ cursor: "default", minHeight: 120 }}
                      initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: reduce ? 0.1 : 0.32, ease: EASE_OUT }}
                      data-cause="paypal-call"
                    >
                      <span className={s.sheetRef}>Filed with PayPal, 3 exhibits</span>
                      <span className={s.sheetName}>{x.title}</span>
                      <span className={s.sheetBody}>{REAL.item.name}, {usd(REAL.amount)}</span>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
            <p className={s.landFacts}>
              <strong>
                {REAL.item.name}, {usd(REAL.amount)}.
              </strong>{" "}
              The buyer&rsquo;s card issuer said it never arrived, four seconds after payment. The agent pulled the order and the USPS tracking, decided to fight ({REAL.decisions[0].winPct}% to win; fighting costs {usd(REAL.decisions[0].evFight.slice(1))} on average against {usd(REAL.decisions[0].evRefund.slice(1))} for a refund), and filed. When PayPal asked again, it filed again.{" "}
              {n >= REAL_WIRE.length ? (
                <>
                  <span data-replay-end>PayPal is deciding; sandbox ruling requested {wireClock(ruling.at)} PT.</span>
                </>
              ) : null}
            </p>
          </div>
          <WaitingNow />
          <OpenTest />
          <p style={{ margin: 0, fontSize: 15 }}>
            <Link href={REAL_HREF} data-open-real>Open this case</Link>, see <Link href={`${BASE}/inbox`}>the disputes desk</Link>, or try <Link href={SAMPLE_HERO_HREF}>a sample case</Link>.
          </p>
        </main>
        <p className={s.foot}>Built on PayPal Disputes, Orders, Tracking and Webhooks (sandbox). Claude Haiku 5.5 sorts each case; Opus 5.5 decides.</p>
      </div>
      <Wire
        phoneLabel={`Replay of ${REAL_ID}`}
        sections={[
          {
            key: "replay",
            label: (
              <>
                Replay of {REAL_ID}, recorded {realDay(REAL_WIRE[0].at)}: {spanMin} min compressed to 9 s. Real PayPal ids.
              </>
            ),
            lines: REAL_WIRE.slice(0, n).map((l) => ({ ...l, key: `real-${l.at}` })),
          },
        ]}
      />
    </div>
  );
}
