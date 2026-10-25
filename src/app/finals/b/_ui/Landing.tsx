"use client";
import Link from "next/link";
import NumberFlow from "@number-flow/react";
import { useEffect, useRef, useState } from "react";
import { type Row } from "../_lib/data";
import { DEFAULT_REAL, fromApi, REPLAY_REAL, SNAPSHOTS } from "../_lib/live";
import { Masthead, useNow } from "./Masthead";
import type { LiveRow } from "./store";
import { Timeline } from "./Timeline";
import s from "../b.module.css";

const real = fromApi(SNAPSHOTS[REPLAY_REAL]);
const REPLAY_MS = 9000;

/** The real run's PayPal traffic and decisions, in the order they happened. */
const script: Row[] = [...real.rows].filter((r) => r.kind === "paypal" || r.kind === "agent").sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
const span = Date.parse(script[script.length - 1].at) - Date.parse(script[0].at);
const minutes = Math.round(span / 60_000);

function Replay() {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(script.length);
      return;
    }
    const t = script.map((_, i) => setTimeout(() => setN(i + 1), 400 + (i * (REPLAY_MS - 400)) / script.length));
    return () => t.forEach(clearTimeout);
  }, []);
  const shown: LiveRow[] = script.slice(0, n).map((r, i) => ({ ...r, fresh: i >= n - 1 }));
  const filed = shown.filter((r) => r.kind === "paypal" && r.name === "provide-evidence").length;
  return (
    <section className={s.landR} aria-label="Replay of a real case">
      <div className={s.replayHead}>
        <p className={s.replayTitle}>Replay of {real.id}, recorded Oct 25, 2026</p>
        <p className={s.replayNote}>
          {minutes} minutes of a real PayPal sandbox chargeback, compressed to 9 seconds. Every id is PayPal&apos;s own. Times in PT.
        </p>
      </div>
      <p className={s.replayFig} data-cause="webhook">
        <strong>
          <NumberFlow value={Number(real.amount)} format={{ style: "currency", currency: "USD" }} />
        </strong>
        {filed === 0 ? "disputed" : filed === 1 ? "disputed, evidence filed once" : `disputed, evidence filed ${filed} times`}
      </p>
      <Timeline rows={shown} real limit={6} />
      <Link href={`/finals/b/case/${real.id}`} className={s.textBtn} style={{ justifySelf: "start" }}>
        Open this case
      </Link>
    </section>
  );
}

const STAGES = ["Card payment created", "Tracking added", "Chargeback filed", "Waiting for PayPal's webhook"];

function TestDispute() {
  const [t0, setT0] = useState<number | null>(null);
  const now = useNow(1000);
  const ref = useRef<HTMLButtonElement>(null);
  const el = t0 && now ? Math.max(0, now - t0) : 0;
  const stage = !t0 ? -1 : el < 900 ? 0 : el < 1800 ? 1 : el < 2700 ? 2 : 3;
  const mmss = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
  return (
    <>
      <div className={s.cta}>
        <button ref={ref} type="button" className={s.ctaBtn} onClick={() => setT0(Date.now())} disabled={t0 !== null}>
          Open a test dispute
        </button>
        <p className={s.ctaNote}>A sandbox chargeback. PayPal&apos;s webhook reaches us in about 3 minutes.</p>
      </div>
      {t0 ? (
        <div className={s.stages} data-well role="status">
          {STAGES.map((label, i) => (
            <p key={label} className={`${s.stage} ${i <= stage ? s.stageOn : ""}`}>
              <time>{i < stage ? mmss(i * 900 + 900) : i === stage ? mmss(el) : ""}</time>
              <span>
                {label}
                {i === 3 && stage === 3 ? `, ${mmss(el)} so far, usually under 3 min` : i < stage ? ", done" : ""}
              </span>
            </p>
          ))}
          <p className={s.secNote}>This design preview stages the wait locally; it does not open a dispute on PayPal.</p>
        </div>
      ) : null}
    </>
  );
}

export function Landing() {
  return (
    <>
      <Masthead />
      <main className={s.land}>
        <section className={s.landL}>
          <h1 className={s.landH1}>
            A buyer&apos;s bank charged back a $389 Olympus camera. The seller said yes once; CaseClerk filed the evidence and PayPal answered 200.
          </h1>
          <p className={s.landNext}>
            <Link href={`/finals/b/case/${DEFAULT_REAL}`} className={s.textBtn}>
              The next one, $412, is waiting for your answer
            </Link>
          </p>
          <p className={s.landWhat}>CaseClerk answers PayPal disputes for small sellers: it reads the case, the order and the tracking, files the evidence, and asks you before money moves.</p>
          <TestDispute />
          <p className={s.landFoot}>Built on PayPal Disputes, Orders, Tracking and Webhooks (sandbox). Claude Haiku 5.5 triages; Opus 5.5 decides.</p>
        </section>
        <Replay />
      </main>
    </>
  );
}
