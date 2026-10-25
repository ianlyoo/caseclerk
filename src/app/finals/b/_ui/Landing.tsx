"use client";
import Link from "next/link";
import NumberFlow from "@number-flow/react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { CaseRecord } from "@/lib/types";
import { clock, dayOf, usd } from "../_lib/data";
import { DEFAULT_REAL, fromApi, REPLAY_REAL, SNAPSHOTS } from "../_lib/live";
import { Masthead, useNow } from "./Masthead";
import type { LiveRow } from "./store";
import { PayPalRow, Timeline } from "./Timeline";
import { useT } from "./motion";
import s from "../b.module.css";

const real = fromApi(SNAPSHOTS[REPLAY_REAL]);
const waiting = fromApi(SNAPSHOTS[DEFAULT_REAL]);
type PP = Extract<LiveRow, { kind: "paypal" }>;
const traffic = real.rows.filter((r): r is PP => r.kind === "paypal");
/** The three receipts of the real loop, in the order they happened: PayPal opened it, CaseClerk filed, PayPal closed it. */
const opened = traffic.find((r) => r.name === "CUSTOMER.DISPUTE.CREATED")!;
const filed = traffic.find((r) => r.name === "provide-evidence" && r.status === "200")!;
const closed = traffic.find((r) => r.name === "CUSTOMER.DISPUTE.RESOLVED")!;
const RECEIPT = [opened, filed, closed];
const minutes = Math.round((Date.parse(closed.at) - Date.parse(filed.at)) / 60_000);

function Receipt() {
  const T = useT();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(RECEIPT.length);
      return;
    }
    const t = RECEIPT.map((_, i) => setTimeout(() => setN(i + 1), 500 + i * 1300));
    return () => t.forEach(clearTimeout);
  }, []);
  return (
    <section className={s.landR} aria-label="Replay of a real case">
      <div className={s.replayHead}>
        <p className={s.replayTitle}>Replay of {real.id}, recorded Oct 25, 2026</p>
        <p className={s.replayNote}>A real PayPal sandbox chargeback, start to close. Every id is PayPal&apos;s own. Times in PT.</p>
      </div>
      <p className={s.replayFig} data-cause="webhook">
        <strong>
          <NumberFlow value={Number(real.amount)} format={{ style: "currency", currency: "USD" }} />
        </strong>
        {n < 2 ? "disputed" : n < 3 ? "disputed, evidence filed once" : real.kept ? `closed by PayPal; the seller kept ${usd(real.kept)}` : "closed by PayPal"}
      </p>
      <ol className={s.tl} aria-label="The three PayPal receipts, oldest first">
        {RECEIPT.slice(0, n).map((r) => (
          <motion.li key={r.eventId ?? r.debugId} className={`${s.tlRow} ${s.tlPP}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={T({ duration: 0.42, ease: [0.2, 0.8, 0.2, 1] })} data-cause="paypal-call">
            <time className={s.tlTime} dateTime={r.at}>
              <span>{dayOf(r.at)}</span>
              <span>{clock(r.at)} PT</span>
            </time>
            <div className={s.tlBody}>
              <PayPalRow r={r} real />
            </div>
          </motion.li>
        ))}
      </ol>
      <details className={s.drawer}>
        <summary>
          All PayPal traffic on this case ({traffic.length} calls and webhooks)
        </summary>
        <Timeline rows={traffic} real fold={false} />
      </details>
      <Link href={`/finals/b/case/${real.id}`} className={s.textBtn} style={{ justifySelf: "start" }}>
        Open this case
      </Link>
    </section>
  );
}

type Opened = { t0: number; captureId: string; disputeId?: string | null };
const KEY = "caseclerk-b-test-dispute";
const mmss = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;

/**
 * The real thing: POST /api/test-dispute makes a sandbox payment and charges it back at PayPal (capped per visitor and
 * per day). PayPal's CUSTOMER.DISPUTE.CREATED webhook then opens the case; this polls the case list until it is there.
 */
function TestDispute() {
  const [state, setState] = useState<"idle" | "opening" | "waiting" | "found" | "error">("idle");
  const [run, setRun] = useState<Opened>();
  const [found, setFound] = useState<string>();
  const [error, setError] = useState<string>();
  const now = useNow(1000);

  useEffect(() => {
    const saved = sessionStorage.getItem(KEY);
    if (!saved) return;
    const r = JSON.parse(saved) as Opened;
    if (Date.now() - r.t0 < 60 * 60_000) {
      setRun(r);
      setState("waiting");
    } else sessionStorage.removeItem(KEY);
  }, []);

  useEffect(() => {
    if (state !== "waiting" || !run) return;
    let stop = false;
    const look = async () => {
      try {
        const r = await fetch("/api/cases?test=true&limit=50", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as { cases: CaseRecord[] };
        const hit = j.cases.find((c) => (run.disputeId && c.id === run.disputeId) || c.snapshot.sellerTransactionId === run.captureId);
        if (hit && !stop) {
          setFound(hit.id);
          setState("found");
          sessionStorage.removeItem(KEY);
        }
      } catch {
        // The next look tries again.
      }
    };
    look();
    const t = setInterval(look, 10_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [state, run]);

  const open = async () => {
    setState("opening");
    setError(undefined);
    try {
      const r = await fetch("/api/test-dispute", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenario: "not_as_described" }) });
      const j = (await r.json().catch(() => ({}))) as { captureId?: string; disputeId?: string | null; error?: { message?: string } };
      if (r.status !== 202 || !j.captureId) {
        setError(j.error?.message ?? `PayPal's sandbox did not take it (HTTP ${r.status}). Nothing was created.`);
        setState("error");
        return;
      }
      const o: Opened = { t0: Date.now(), captureId: j.captureId, disputeId: j.disputeId };
      sessionStorage.setItem(KEY, JSON.stringify(o));
      setRun(o);
      setState("waiting");
    } catch {
      setError("No answer from CaseClerk. Nothing was created; try again in a minute.");
      setState("error");
    }
  };

  const el = run && now ? Math.max(0, now - run.t0) : 0;
  return (
    <div className={s.test}>
      {state === "idle" || state === "error" || state === "opening" ? (
        <>
          <button type="button" className={s.ghostBtn} onClick={open} disabled={state === "opening"}>
            {state === "opening" ? "Asking PayPal…" : "Open a test dispute"}
          </button>
          <p className={s.ctaNote}>A real sandbox payment and chargeback on PayPal, then the case appears here. Three a day per visitor.</p>
          {error ? (
            <p className={s.testErr} role="alert">
              {error}
            </p>
          ) : null}
        </>
      ) : (
        <div className={s.stages} data-well role="status">
          <p className={`${s.stage} ${s.stageOn}`}>
            <time>0:00</time>
            <span>
              PayPal took the payment and the chargeback, capture <code>{run?.captureId}</code>.
            </span>
          </p>
          {state === "waiting" ? (
            <p className={`${s.stage} ${s.stageOn}`}>
              <time>{mmss(el)}</time>
              <span>
                PayPal is opening the chargeback. Its webhook usually arrives in 3–5 minutes.
                {el > 15 * 60_000 ? " The sandbox is slow today; this page keeps checking." : ""}
              </span>
            </p>
          ) : (
            <p className={`${s.stage} ${s.stageOn}`}>
              <time>{mmss(el)}</time>
              <span>
                PayPal opened <code>{found}</code>.{" "}
                <Link href={`/finals/b/case/${found}`} className={s.textBtn}>
                  Open the new case
                </Link>
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function Landing() {
  return (
    <>
      <Masthead />
      <main className={s.land}>
        <section className={s.landL}>
          <h1 className={s.landH1}>
            A buyer&apos;s bank charged back a ${Math.round(Number(real.amount))} Olympus camera. The seller said yes once; CaseClerk filed the evidence, and PayPal closed the case {minutes} minutes later.
          </h1>
          <p className={s.landWhat}>CaseClerk answers PayPal disputes for small sellers: it reads the case, the order and the tracking, files the evidence, and asks you before money moves.</p>
          <div className={s.cta}>
            <Link href={`/finals/b/case/${DEFAULT_REAL}`} className={s.ctaBtn}>
              Review the {usd(waiting.amount)} case waiting for you
            </Link>
          </div>
          <TestDispute />
          <p className={s.landFoot}>Built on PayPal Disputes, Orders, Tracking and Webhooks (sandbox). Claude Haiku 5.5 triages; Opus 5.5 decides.</p>
        </section>
        <Receipt />
      </main>
    </>
  );
}
