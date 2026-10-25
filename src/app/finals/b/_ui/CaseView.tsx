"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clock, countdown, day, dayOf, getCase, hoursLeft, isOpen, SAMPLE_NOW, sorted, usd, weekday, type Case, type Row } from "../_lib/data";
import { fromApi, SNAPSHOTS, type ApiCase } from "../_lib/live";
import { CaseList, deskLine } from "./CaseList";
import { Dossier } from "./Dossier";
import { Masthead } from "./Masthead";
import { Photo } from "./Photo";
import { CountUp, LANDED_MS, Sheet, UNDO_MS } from "./Sheet";
import { useDesk } from "./store";
import { Timeline, type LiveRow } from "./Timeline";
import { useT } from "./motion";
import s from "../b.module.css";

const EASE = [0.2, 0.8, 0.2, 1] as const;

/** Sample time: the sample clock plus the seconds since this page opened. */
function sampleClock(start: number) {
  return new Date(Date.parse(SAMPLE_NOW) + (Date.now() - start)).toISOString();
}

// Staged rows for sample cases: the shape of the traffic a real case would show, with no status and no ids.
function afterRows(c: Case, at: string): LiveRow[] {
  const a = c.approval!;
  return [{ kind: "paypal", at, dir: "out", name: a.name, method: a.method, path: a.path, say: "Staged: on a real case, CaseClerk files the evidence and PayPal returns a debug id here." }];
}
function updatedRow(at: string): LiveRow {
  return { kind: "paypal", at, dir: "in", name: "CUSTOMER.DISPUTE.UPDATED", say: "Staged: on a real case, PayPal's webhook moves the case to under review here." };
}
function resolvedRows(c: Case, at: string): LiveRow[] {
  return [
    { kind: "paypal", at: new Date(Date.parse(at) - 4000).toISOString(), dir: "out", name: "adjudicate", method: "POST", path: `/v1/customer/disputes/${c.id}/adjudicate`, say: "Staged: the sandbox control that asks PayPal to rule for the seller" },
    { kind: "paypal", at, dir: "in", name: "CUSTOMER.DISPUTE.RESOLVED", say: "Staged: on a real case, PayPal's RESOLVED webhook lands here." },
  ];
}

/** A real case, from the snapshot first and then from GET /api/cases/:id every 5 s. */
function useRealCase(id: string, enabled: boolean): { c?: Case; refresh: () => void; failed: boolean } {
  const desk = useDesk();
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);
  const known = desk.real.find((x) => x.id === id && x.rows.length);
  const snap = useMemo(() => (SNAPSHOTS[id] ? fromApi(SNAPSHOTS[id]) : undefined), [id]);
  useEffect(() => {
    if (!enabled) return;
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/cases/${id}`, { cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        const j = (await r.json()) as ApiCase;
        if (!stop) {
          desk.updateReal(fromApi(j));
          setFailed(false);
        }
      } catch {
        if (!stop) setFailed(true);
      }
    };
    load();
    const t = setInterval(load, 5000);
    return () => {
      stop = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, enabled, tick]);
  return { c: known ?? snap, refresh: () => setTick((n) => n + 1), failed };
}

function Neighbours({ c }: { c: Case }) {
  const { real } = useDesk();
  const list = sorted(real);
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
  const sample = getCase(id);
  const live = useRealCase(id, !sample);
  const c = sample ?? live.c;
  if (!c) {
    return (
      <>
        <Masthead />
        <main className={s.main} id="case">
          <p className={s.loading}>{live.failed ? `PayPal case ${id} is not in CaseClerk, or the API did not answer. It tries again every 5 s.` : `Reading PayPal case ${id} from CaseClerk…`}</p>
        </main>
      </>
    );
  }
  return <CaseBody c={c} refresh={live.refresh} />;
}

function CaseBody({ c, refresh }: { c: Case; refresh: () => void }) {
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
  const local = desk.phase(c.id);
  // Once approved, the next poll no longer carries the pending action; the sheet keeps the approval it showed so the
  // 200 can land in it and it can collapse to the filed bar.
  const kept = useRef(c.approval);
  if (c.approval) kept.current = c.approval;
  const approval = c.approval ?? (c.real && local && local !== "pending" && c.desk !== "won" ? kept.current : undefined);
  // A real case's phase is PayPal's: pending while an action waits, resolved once PayPal closed it. The local phase
  // only covers the seconds between Approve and the next poll.
  const phase = c.real
    ? local && local !== "pending" && !(local === "failed" && !c.approval)
      ? local
      : c.desk === "won"
        ? "resolved"
        : c.approval
          ? "pending"
          : undefined
    : local ?? (c.ending && want === "resolved" ? "resolved" : undefined);

  const later = (ms: number, f: () => void) => timers.current.push(setTimeout(f, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // URL states: ?state=approved (after the 200) and ?state=resolved (PayPal decided), for the shots and the owner.
  useEffect(() => {
    if (!c.approval || c.real) return;
    const t0 = "2026-10-25T10:42:08-07:00";
    if (want === "approved") {
      setExtra([...afterRows(c, t0), updatedRow("2026-10-25T10:42:39-07:00")]);
      desk.markSent(c.id, t0);
      desk.set(c.id, "sent");
    } else if (want === "resolved") {
      setExtra([...afterRows(c, t0), updatedRow("2026-10-25T10:42:39-07:00"), ...resolvedRows(c, "2026-10-25T10:47:30-07:00")]);
      desk.set(c.id, "resolved");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.id, want]);

  const landed = useCallback(
    (at: string, debugId?: string) => {
      desk.markSent(c.id, at, debugId);
      desk.set(c.id, "landed");
      later(LANDED_MS, () => desk.set(c.id, "sent"));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [c.id],
  );

  const send = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    desk.set(c.id, "sending");
    const a = approval!;
    const inflight: LiveRow = { kind: "paypal", at: c.real ? new Date().toISOString() : sampleClock(start.current), dir: "out", name: a.name, method: a.method, path: a.path, say: c.real ? "CaseClerk is filing the evidence" : "Staged: on a real case, CaseClerk files the evidence and PayPal returns a debug id here.", inflight: true, fresh: true };
    setExtra((x) => [...x.filter((r) => !(r.kind === "paypal" && r.inflight)), inflight]);
    const clear = () => setExtra((x) => x.filter((r) => !(r.kind === "paypal" && r.inflight)));

    if (c.real && a.actionId) {
      // The real call: CaseClerk executes the approved action against PayPal and returns PayPal's answer.
      fetch(`/api/actions/${a.actionId}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
        .then(async (r) => {
          const j = (await r.json().catch(() => ({}))) as { status?: number; debugId?: string; at?: string; error?: { code?: string; message?: string; debugId?: string; status?: number } };
          clear();
          if (!r.ok || (j.status && j.status >= 300)) {
            setError({ name: j.error?.message ?? j.error?.code ?? `HTTP ${r.status}`, debugId: j.error?.debugId ?? j.debugId ?? undefined });
            desk.set(c.id, "failed");
            return;
          }
          const at = j.at ?? new Date().toISOString();
          setExtra((x) => [...x, { kind: "paypal", at, dir: "out", name: a.name, method: a.method, path: a.path, status: String(j.status ?? 200), debugId: j.debugId ?? undefined, say: "CaseClerk filed the evidence; PayPal answered 200", fresh: true }]);
          landed(at, j.debugId ?? undefined);
          refresh();
        })
        .catch(() => {
          clear();
          setError({ name: "no answer (network)" });
          desk.set(c.id, "failed");
        });
      return;
    }

    // Staged sample: there is no PayPal on the other end, so the hold is a fixed 1.4 s (the median sandbox POST we measured).
    later(1400, () => {
      if (forceFail) {
        clear();
        setError({ name: "UNPROCESSABLE_ENTITY" });
        desk.set(c.id, "failed");
        return;
      }
      setExtra((x) => x.map((r) => (r.kind === "paypal" && r.inflight ? { ...r, inflight: false, fresh: true } : r)));
      landed(sampleClock(start.current));
      later(LANDED_MS + 1100, () => setExtra((x) => [...x, { ...updatedRow(sampleClock(start.current)), fresh: true }]));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c, approval, forceFail, landed]);

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

  // Local rows stand in for PayPal's answer until the next poll brings the same debug id from the server.
  const rows: LiveRow[] = useMemo(() => {
    const ids = new Set(c.rows.flatMap((r) => (r.kind === "paypal" && r.debugId ? [r.debugId] : [])));
    return [...(c.rows as Row[]), ...extra.filter((r) => !(r.kind === "paypal" && r.debugId && ids.has(r.debugId)))];
  }, [c.rows, extra]);
  const resolved = phase === "resolved";
  const resolvedEvent = rows.flatMap((r) => (r.kind === "paypal" && r.name === "CUSTOMER.DISPUTE.RESOLVED" && r.eventId ? [r.eventId] : []))[0];
  const sent = phase === "sent" || phase === "landed" || resolved;
  const due = c.dueAt && isOpen(c) && !resolved;
  const urgent = due && hoursLeft(c.dueAt!) < 72;
  const decided = resolved && c.ending;

  return (
    <>
      <Masthead sample={!c.real} />
      <div className={s.desk}>
        <CaseList current={c.id} />
        <main className={`${s.main} ${approval && !sent ? s.mainSheet : ""}`} id="case">
          <div className={s.caseGrid}>
            <aside className={s.margin}>
              <p className={s.caseId}>
                <code>{c.id}</code>
                <span>Opened {dayOf(c.openedAt)}</span>
              </p>
              <p className={c.real ? s.tagReal : s.tagSample} data-origin={c.real ? "paypal" : undefined}>
                {c.real ? "Real PayPal sandbox case. Every id here came from PayPal." : "Staged sample. Nothing here went to PayPal."}
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
                  {decided && c.ending!.kept ? (
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
                    c.real ? (
                      <>
                        PayPal closed the case on {day(c.ending!.at)} at {clock(c.ending!.at)} PT
                        {resolvedEvent ? (
                          <>
                            , webhook <code className={s.ppId} data-origin="paypal">event {resolvedEvent}</code>
                          </>
                        ) : null}
                        . The agent spent ${(c.costUsd ?? 0).toFixed(2)} on it.
                      </>
                    ) : (
                      <>Staged ending. On a real case this is PayPal&apos;s RESOLVED webhook and the money it released.</>
                    )
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
                  <p className={s.secNote}>
                    {c.real ? "Blue rows are PayPal's own traffic, with the ids PayPal returned. Times in PT." : "Dashed rows are staged: the shape of PayPal traffic, nothing sent. Times in PT."}
                  </p>
                </div>
                <Timeline rows={rows} real={c.real} pending={!!approval && !sent} />
              </section>

              {c.rationale ? (
                <section className={s.sec} aria-label="Why">
                  {!approval || sent ? <p className={s.rec}>{c.recommendation ?? approval?.head}</p> : null}
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

              {c.approval && sent && !resolved && !c.real ? (
                <section className={s.well} data-well aria-label="Sandbox controls">
                  <p>
                    Staged sample. On a real test dispute this asks PayPal&apos;s sandbox to decide; here it shows what happens next.
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
      {approval && phase && phase !== "resolved" ? (
        <Sheet a={approval} phase={phase} real={c.real} sent={desk.sentAt(c.id)} error={error} onApprove={approve} onUndo={undo} onSendNow={send} onRetry={() => { setError(undefined); desk.set(c.id, "pending"); }} />
      ) : null}
    </>
  );
}
