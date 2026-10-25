"use client";

// The landing: a real PayPal sandbox case replayed from chargeback to ruling, from the production API.

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { EVIDENCE_GATE_USD, POLICY, usd } from "../_shared/data";
import { BASE, HERO_HREF, Masthead, SAMPLE_HERO_HREF, Wire, realDay, realTime, wireClock } from "./ui";
import { keptLine, NO_DEBIT, REAL_HREF, SANDBOX_RULING, realState, replayLines, thingOf, type ApiCase } from "./_real/model";
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

const WAIT_NOTE = "PayPal is opening the chargeback. Its webhook usually arrives in 3–5 minutes.";
type ListCase = { id: string; snapshot?: { amount?: { value: string } } };
type Test =
  | { at: "idle" }
  | { at: "posting" }
  | { at: "waiting"; since: number; known: string[]; disputeId?: string }
  | { at: "here"; id: string; amount?: string }
  | { at: "refused"; message: string };

const listCases = async (): Promise<ListCase[]> => ((await (await fetch(`${BASE}/live/cases`, { cache: "no-store" })).json()).cases ?? []) as ListCase[];
const clock = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;

/** Opens a real PayPal sandbox chargeback through production, then watches the case list until it lands. */
function OpenTest() {
  const [t, setT] = useState<Test>({ at: "idle" });
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (t.at !== "waiting") return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(async () => {
      try {
        const fresh = (await listCases()).find((c) => (t.disputeId ? c.id === t.disputeId : !t.known.includes(c.id)));
        if (fresh) setT({ at: "here", id: fresh.id, amount: fresh.snapshot?.amount?.value });
      } catch {}
    }, 10_000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [t]);
  const open = async () => {
    setT({ at: "posting" });
    try {
      const known = (await listCases()).map((c) => c.id);
      const res = await fetch(`${BASE}/live/test-dispute`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenario: "not_as_described" }) });
      const j = await res.json().catch(() => ({}));
      if (res.status === 202) {
        setNow(Date.now());
        return setT({ at: "waiting", since: Date.now(), known, disputeId: typeof j.disputeId === "string" ? j.disputeId : undefined });
      }
      const msg = typeof j.error?.message === "string" && j.error.message.trim() ? j.error.message.trim() : typeof j.message === "string" && j.message.trim() ? j.message.trim() : "";
      setT({ at: "refused", message: msg || (res.status === 429 ? "Today's test disputes are used up. Try again tomorrow." : `PayPal's sandbox didn't open the dispute (${res.status}). Try again in a minute.`) });
    } catch {
      setT({ at: "refused", message: "CaseClerk didn't answer. Try again in a minute." });
    }
  };
  return (
    <div className={s.cta} id="open-test">
      <button className={s.btnQuiet} onClick={open} disabled={t.at === "posting" || t.at === "waiting"} data-open-test>
        Open a test dispute
      </button>
      {t.at === "idle" && <p className={s.ctaNote}>Opens a real PayPal sandbox chargeback, and CaseClerk takes it from there.</p>}
      {t.at !== "idle" && (
        <motion.div className={s.wellBox} data-well data-test-state={t.at} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} data-cause="paypal-call">
          {t.at === "posting" && <p>Asking PayPal&rsquo;s sandbox for a chargeback&hellip;</p>}
          {t.at === "waiting" && (
            <p>
              {WAIT_NOTE} <span className={s.mono}>{clock(Math.max(0, now - t.since))}</span> so far.
            </p>
          )}
          {t.at === "here" && (
            <p>
              The case arrived: <Link href={`${BASE}/case/${t.id}`} data-test-case>{t.amount ? `the ${usd(t.amount)} chargeback ${t.id}` : t.id}</Link>.
            </p>
          )}
          {t.at === "refused" && <p data-test-refused>{t.message}</p>}
        </motion.div>
      )}
    </div>
  );
}

export function LandingView({ r, hero }: { r: ApiCase | null; hero: ApiCase | null }) {
  const lines = r ? replayLines(r) : [];
  const n = useReplay(lines.length);
  if (!r || !lines.length) return <Unavailable />;
  const c = r.case;
  const amt = usd(c.snapshot.amount.value);
  const created = lines.find((l) => l.name.endsWith(".CREATED"));
  const filing = lines.find((l) => l.path.endsWith("/provide-evidence"));
  const resolved = lines.find((l) => l.name.endsWith(".RESOLVED"));
  const approved = r.audit.find((x) => x.kind === "action.approved");
  const done = n >= lines.length;
  const pending = hero ? realState(hero) === "pending" : false;
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
                PayPal closed it {mins(approved.at, resolved.at)} minutes after you approved the evidence at {realTime(approved.at)}.
              </>
            ) : filing ? (
              <>CaseClerk filed the evidence at {realTime(filing.at)}; PayPal is deciding.</>
            ) : (
              <>CaseClerk is working on it.</>
            )}
          </h1>
          <p className={s.sandboxNote} style={{ margin: 0 }} data-baseline>
            Without an answer by the deadline, PayPal rules for the buyer: you&rsquo;d lose the {amt} and the fee.
          </p>
          <div className={s.landActions}>
            {pending && (
              <Link href={HERO_HREF} className={s.btn} data-review-waiting>
                Another case is waiting: review the {usd(hero!.case.snapshot.amount.value)} one
              </Link>
            )}
            <Link href={REAL_HREF} className={pending ? s.btnLink : s.btn} data-open-real>
              Open this {amt} {realState(r) === "resolved" ? "resolved " : ""}case
            </Link>
            <a href="#open-test" className={s.btnLink} data-test-link>
              Open a test dispute
            </a>
          </div>
          <p className={s.lede}>
            CaseClerk answers PayPal disputes for small online sellers: it reads the case, gathers the order and the tracking, and files the evidence. Small cases it answers on its own, under <Link href={`${BASE}/policy`}>your rules</Link>; over {usd(EVIDENCE_GATE_USD)} to file, or {usd(POLICY.approvalAboveUsd)} to refund or offer, it asks you first.
          </p>
          <p className={s.sandboxNote} style={{ margin: 0 }} data-sandbox-ruling>
            {SANDBOX_RULING}
          </p>
          <div className={s.landCase} style={{ gridTemplateColumns: "1fr" }}>
            <p className={s.landFacts}>
              <strong>
                {item}, {amt}.
              </strong>{" "}
              Charged back as not as described; the seller approved the evidence
              {approved && filing ? (
                <>
                  {" "}
                  and PayPal accepted it, <span className={s.mono}>debug {filing.debugId}</span>.
                </>
              ) : (
                "."
              )}{" "}
              {done && resolved ? <span data-replay-end>{keptLine(r, "The seller keeps") ?? NO_DEBIT}</span> : null}
            </p>
            {pending && (
              <p className={s.landFacts} data-same-listing>
                The {amt} and {usd(hero!.case.snapshot.amount.value)} cases are separate test disputes we opened on PayPal&rsquo;s sandbox for this demo: the same camera listing, different buyers.
              </p>
            )}
          </div>
          <OpenTest />
          <p style={{ margin: 0, fontSize: 15 }}>
            Or see <Link href={`${BASE}/inbox`}>the disputes desk</Link>, or try <Link href={SAMPLE_HERO_HREF}>a sample case</Link>.
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
