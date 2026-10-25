"use client";
// Approval state for Final B, shared by the masthead count, the case list and the case page, plus the list of
// real cases from production (GET /api/cases?test=true), refreshed every 30 s.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import type { CaseRecord } from "@/lib/types";
import { CASES, LISTED, type Case, type Row } from "../_lib/data";
import { fromApi, fromRecord, SNAPSHOTS } from "../_lib/live";

/** k: a stable key, so the in-flight row and PayPal's answer to it are one row that updates in place. */
export type LiveRow = Row & { fresh?: boolean; inflight?: boolean; k?: string };

/**
 * pending: the sheet is up. undo: 4 s to take it back. sending: the POST is open. landed: PayPal's answer shows in the
 * sheet. sent: the sheet is a bar. failed: nothing was sent. resolved: PayPal decided.
 */
export type Phase = "pending" | "undo" | "sending" | "landed" | "sent" | "failed" | "resolved";

type Ctx = {
  phase: (id: string) => Phase | undefined;
  set: (id: string, p: Phase) => void;
  sentAt: (id: string) => { at: string; debugId?: string } | undefined;
  markSent: (id: string, at: string, debugId?: string) => void;
  rows: (id: string) => LiveRow[];
  setRows: (id: string, f: (r: LiveRow[]) => LiveRow[]) => void;
  real: Case[];
  updateReal: (c: Case) => void;
  waiting: number;
};

const C = createContext<Ctx | null>(null);
const SNAP = Object.values(SNAPSHOTS).map(fromApi);

export function Store({ children }: { children: ReactNode }) {
  const [phases, setPhases] = useState<Record<string, Phase>>(() =>
    Object.fromEntries(CASES.filter((c) => c.approval && c.desk === "approval").map((c) => [c.id, "pending" as Phase])),
  );
  const [sent, setSent] = useState<Record<string, { at: string; debugId?: string }>>({});
  const [extra, setExtra] = useState<Record<string, LiveRow[]>>({});
  const [real, setReal] = useState<Case[]>(SNAP);

  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch("/api/cases?test=true&limit=50", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as { cases: CaseRecord[] };
        if (stop) return;
        setReal((prev) => {
          const byId = new Map(prev.map((c) => [c.id, c]));
          // A full payload (with rows) beats a list record; a list record is enough for a case we have not opened.
          return j.cases.filter((c) => c.order).map((rec) => {
            const had = byId.get(rec.id);
            const fresh = fromRecord(rec);
            return had && had.rows.length && had.lastAt >= fresh.lastAt ? had : had?.rows.length ? { ...had, desk: fresh.desk, last: fresh.last, lastAt: fresh.lastAt } : fresh;
          });
        });
      } catch {
        // Keep the snapshot; the next tick tries again.
      }
    };
    load();
    const t = setInterval(load, 30_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, []);

  const set = useCallback((id: string, p: Phase) => setPhases((x) => (x[id] === p ? x : { ...x, [id]: p })), []);
  const markSent = useCallback((id: string, at: string, debugId?: string) => setSent((x) => ({ ...x, [id]: { at, debugId } })), []);
  const setRows = useCallback((id: string, f: (r: LiveRow[]) => LiveRow[]) => setExtra((x) => ({ ...x, [id]: f(x[id] ?? []) })), []);
  const updateReal = useCallback((c: Case) => setReal((x) => (x.some((y) => y.id === c.id) ? x.map((y) => (y.id === c.id ? c : y)) : [c, ...x])), []);
  const value = useMemo<Ctx>(() => {
    const waitingNow = (c: Case) => {
      const p = phases[c.id];
      return c.desk === "approval" && (p === undefined || p === "pending" || p === "undo" || p === "failed");
    };
    const waiting = [...real, ...LISTED].filter(waitingNow).length;
    return { phase: (id) => phases[id], set, sentAt: (id) => sent[id], markSent, rows: (id) => extra[id] ?? [], setRows, real, updateReal, waiting };
  }, [phases, sent, set, markSent, extra, setRows, real, updateReal]);
  return (
    <C.Provider value={value}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </C.Provider>
  );
}

export function useDesk(): Ctx {
  const v = useContext(C);
  if (!v) throw new Error("useDesk outside Store");
  return v;
}
