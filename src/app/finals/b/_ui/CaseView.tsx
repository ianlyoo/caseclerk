"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { countdown, day, dayOf, getCase, hoursLeft, isOpen, SAMPLE_NOW, sorted, usd, weekday, type Case, type Row } from "../_lib/data";
import { CaseList, deskLine } from "./CaseList";
import { Dossier } from "./Dossier";
import { Masthead } from "./Masthead";
import { Photo } from "./Photo";
import { CountUp, Sheet, UNDO_MS } from "./Sheet";
import { useDesk } from "./store";
import { Timeline, type LiveRow } from "./Timeline";
import { useT } from "./motion";
import s from "../b.module.css";

const EASE = [0.2, 0.8, 0.2, 1] as const;

/** Sample time: the sample clock plus the seconds since this page opened. */
function sampleClock(start: number) {
  return new Date(Date.parse(SAMPLE_NOW) + (Date.now() - start)).toISOString();
}

function afterRows(c: Case, at: string): LiveRow[] {
  const a = c.approval!;
  return [{ kind: "paypal", at, dir: "out", name: a.name, method: a.method, path: a.path, status: "200", say: "CaseClerk filed the evidence and PayPal accepted it" }];
}
function updatedRow(at: string): LiveRow {
  return { kind: "paypal", at, dir: "in", name: "CUSTOMER.DISPUTE.UPDATED", status: "verified", say: "PayPal moved the case to under review" };
}
function resolvedRows(c: Case, at: string): LiveRow[] {
  return [
    { kind: "paypal", at: new Date(Date.parse(at) - 4000).toISOString(), dir: "out", name: "adjudicate", method: "POST", path: `/v1/customer/disputes/${c.id}/adjudicate`, status: "200", say: "Sandbox control: you asked PayPal to rule for the seller" },
    { kind: "paypal", at, dir: "in", name: "CUSTOMER.DISPUTE.RESOLVED", status: "verified", say: "PayPal decided for the seller" },
  ];
}

function Neighbours({ c }: { c: Case }) {
  const list = sorted();
  const i = list.findIndex((x) => x.id === c.id);
  const prev = list[i - 1];
  const next = list[i + 1];
  const { waiting } = useDesk();
  const open = list.filter(isOpen);
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === "j" && next) router.push(`/finals/b/case/${next.id}`);
      if (e.key === "k" && prev) router.push(`/finals/b/case/${prev.id}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, router]);
  const tail = (x: Case) => `${usd(x.amount)}${x.dueAt && isOpen(x) ? `, due ${weekday(x.dueAt)}` : ""}`;
  const pos = open.findIndex((x) => x.id === c.id);
  return (
    <div className={s.where}>
      <p>
        {pos >= 0 ? `${pos + 1} of ${open.length} open` : `${open.length} open`}, {waiting} need you
      </p>
      {prev ? (
        <Link href={`/finals/b/case/${prev.id}`} className={s.nb}>
          <span className={s.nbK}>Previous (K)</span>
          {prev.short}, {tail(prev)}
        </Link>
      ) : null}
      {next ? (
        <Link href={`/finals/b/case/${next.id}`} className={s.nb}>
          <span className={s.nbK}>Next (J)</span>
          {next.short}, {tail(next)}
        </Link>
      ) : null}
    </div>
  );
}

export function CaseView({ id }: { id: string }) {
  const c = getCase(id)!;
  const T = useT();
  const q = useSearchParams();
  const want = q.get("state");
  const forceFail = q.get("fail") === "1";
  const desk = useDesk();
  const start = useRef(Date.now());
  const extra = desk.rows(c.id);
  const setExtra = useCallback((f: LiveRow[] | ((r: LiveRow[]) => LiveRow[])) => desk.setRows(c.id, typeof f === "function" ? f : () => f), [desk, c.id]);
  const [error, setError] = useState<{ name: string; debugId?: string }>();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phase = desk.phase(c.id) ?? (c.ending && want === "resolved" ? "resolved" : undefined);

  const later = (ms: number, f: () => void) => timers.current.push(setTimeout(f, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // URL states: ?state=approved (after the 200) and ?state=resolved (PayPal decided), for the shots and the owner.
  useEffect(() => {
    if (!c.approval) return;
    const t0 = "2026-10-25T10:42:08-07:00";
    if (want === "approved") {
      setExtra([...afterRows(c, t0), updatedRow("2026-10-25T10:42:39-07:00")]);
      desk.markSent(c.id, t0);
      desk.set(c.id, "sent");
    } else if (want === "resolved") {
      setExtra([...afterRows(c, t0), updatedRow("2026-10-25T10:42:39-07:00"), ...resolvedRows(c, "2026-11-04T14:20:00-08:00")]);
      desk.set(c.id, "resolved");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.id, want]);

  const send = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    desk.set(c.id, "sending");
    const at = sampleClock(start.current);
    setExtra((x) => [...x.filter((r) => !(r.kind === "paypal" && r.inflight)), { ...afterRows(c, at)[0], status: undefined, inflight: true, fresh: true }]);
    // Sample case: there is no PayPal on the other end, so the hold is a fixed 1.4 s (the median sandbox POST we measured).
    later(1400, () => {
      if (forceFail) {
        setExtra((x) => x.filter((r) => !(r.kind === "paypal" && r.inflight)));
        setError({ name: "UNPROCESSABLE_ENTITY" });
        desk.set(c.id, "failed");
        return;
      }
      setExtra((x) => x.map((r) => (r.kind === "paypal" && r.inflight ? { ...r, inflight: false, status: "200", fresh: true } : r)));
      desk.markSent(c.id, sampleClock(start.current));
      desk.set(c.id, "sent");
      later(2600, () => setExtra((x) => [...x, { ...updatedRow(sampleClock(start.current)), fresh: true }]));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c, forceFail]);

  const approve = useCallback(() => {
    desk.set(c.id, "undo");
    later(UNDO_MS, send);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.id, send]);
  const undo = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    desk.set(c.id, "pending");
  }, [c.id, desk]);
  const resolve = useCallback(() => {
    const at = sampleClock(start.current);
    setExtra((x) => [...x, ...resolvedRows(c, at).map((r) => ({ ...r, fresh: true }))]);
    desk.set(c.id, "resolved");
  }, [c, desk]);

  const rows: LiveRow[] = useMemo(() => [...(c.rows as Row[]), ...extra], [c.rows, extra]);
  const resolved = phase === "resolved";
  const sent = phase === "sent" || resolved;
  const due = c.dueAt && isOpen(c) && !resolved;
  const urgent = due && hoursLeft(c.dueAt!) < 72;
  const decided = resolved && c.ending;

  return (
    <>
      <Masthead />
      <div className={s.desk}>
        <CaseList current={c.id} />
        <main className={`${s.main} ${c.approval && !sent ? s.mainSheet : ""}`} id="case">
          <div className={s.caseGrid}>
            <aside className={s.margin}>
              <p className={s.caseId}>
                <code>{c.id}</code>
                <span>Opened {dayOf(c.openedAt, c.real)}</span>
              </p>
              <p className={c.real ? s.tagReal : s.tagSample} data-origin={c.real ? "paypal" : undefined}>
                {c.real ? "Real PayPal sandbox case. Every id here came from PayPal." : "Sample case. Nothing here went to PayPal."}
              </p>
              <Photo name={c.photo} size="mat" alt={c.item} />
              <Neighbours c={c} />
            </aside>
            <div className={s.col}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.h1
                  key={decided ? "end" : "open"}
                  className={s.h1}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={T({ duration: 0.32 })}
                  data-cause="resolve"
                >
                  {decided ? c.ending!.sentence : c.headline}
                </motion.h1>
              </AnimatePresence>
              <div className={s.figureRow}>
                <p className={s.figure}>
                  {decided ? (
                    <>
                      <span className={s.figLabel}>You kept</span>
                      <CountUp to={Number(c.ending!.kept)} />
                    </>
                  ) : (
                    <NumberFlow value={Number(c.amount)} format={{ style: "currency", currency: "USD" }} />
                  )}
                </p>
                <p className={s.figMeta}>
                  {decided ? (
                    <>PayPal closed the case on {day(c.ending!.at)}. The agent spent about ${(c.costUsd ?? 0).toFixed(2)} on it.</>
                  ) : due ? (
                    <>
                      <span className={urgent ? s.urgent : undefined}>Respond within {countdown(c.dueAt!)}</span>, by {weekday(c.dueAt!)} {day(c.dueAt!)}
                      <br />
                      {deskLine(c, phase)}
                    </>
                  ) : (
                    deskLine(c, phase)
                  )}
                </p>
                {decided ? <motion.span className={s.keptRule} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={T({ duration: 0.6, ease: EASE, delay: 0.3 })} data-cause="resolve" aria-hidden /> : null}
              </div>

              <section className={s.sec} aria-label="What happened">
                <div className={s.secHead}>
                  <h2 className={s.h2}>What happened, newest first</h2>
                  <p className={s.secNote}>{c.real ? "PayPal rows carry the ids PayPal returned. Times in UTC." : "Sample rows show the shape of real traffic, without ids. Times in Pacific."}</p>
                </div>
                <Timeline rows={rows} real={c.real} />
              </section>

              {c.rationale ? (
                <section className={s.sec} aria-label="Why">
                  {!c.approval || sent ? <p className={s.rec}>{c.recommendation ?? c.approval?.head}</p> : null}
                  <h2 className={s.h2}>Why the agent recommends it</h2>
                  <p className={s.why}>{c.rationale}</p>
                  {c.values ? (
                    <table className={s.values}>
                      <caption>Expected result for you, on average</caption>
                      <tbody>
                        {c.values.map((v) => (
                          <tr key={v.name} className={v.chosen ? s.valChosen : undefined}>
                            <th scope="row">{v.name}</th>
                            <td>{v.math}</td>
                            <td className={s.num}>{usd(v.ev)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : null}
                  {c.valueNote ? <p className={s.secNote}>{c.valueNote}</p> : null}
                </section>
              ) : null}

              {c.pack ? <Dossier input={c.pack} real={c.real} note={sent && !c.real ? "Filed with PayPal with your approval." : c.packNote} /> : null}

              {c.approval && sent && !resolved ? (
                <section className={s.well} data-well aria-label="Sandbox controls">
                  <p>
                    Sandbox controls. On a real test dispute these ask PayPal&apos;s sandbox to decide; here, on a sample case, they show what happens next.
                  </p>
                  <button type="button" className={s.inkBtn} onClick={resolve}>
                    Ask PayPal to decide for the seller
                  </button>
                </section>
              ) : null}

              <p className={s.cost}>
                {c.real
                  ? `The agent spent $${(c.costUsd ?? 0).toFixed(2)} on this case, rounded.`
                  : `The agent spent about $${(c.costUsd ?? 0).toFixed(2)} on this case.`}
              </p>
            </div>
          </div>
        </main>
      </div>
      {c.approval && phase && phase !== "resolved" ? (
        <Sheet a={c.approval} phase={phase} real={c.real} sentAt={desk.sentAt(c.id)} error={error} onApprove={approve} onUndo={undo} onSendNow={send} onRetry={() => { setError(undefined); desk.set(c.id, "pending"); }} />
      ) : null}
    </>
  );
}
