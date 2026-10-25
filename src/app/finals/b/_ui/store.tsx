"use client";
// Approval state for Final B, shared by the masthead count, the case list and the case page.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { CASES, type Row } from "../_lib/data";

export type LiveRow = Row & { fresh?: boolean; inflight?: boolean };

/** pending: the sheet is up. undo: 4 s to take it back. sending: the POST is open. sent: PayPal said 200. resolved: PayPal decided. */
export type Phase = "pending" | "undo" | "sending" | "sent" | "failed" | "resolved";

type Ctx = {
  phase: (id: string) => Phase | undefined;
  set: (id: string, p: Phase) => void;
  sentAt: (id: string) => string | undefined;
  markSent: (id: string, at: string) => void;
  rows: (id: string) => LiveRow[];
  setRows: (id: string, f: (r: LiveRow[]) => LiveRow[]) => void;
  waiting: number;
};

const C = createContext<Ctx | null>(null);

export function Store({ children }: { children: ReactNode }) {
  const [phases, setPhases] = useState<Record<string, Phase>>(() =>
    Object.fromEntries(CASES.filter((c) => c.approval && c.desk === "approval").map((c) => [c.id, "pending" as Phase])),
  );
  const [sent, setSent] = useState<Record<string, string>>({});
  const [extra, setExtra] = useState<Record<string, LiveRow[]>>({});
  const set = useCallback((id: string, p: Phase) => setPhases((x) => (x[id] === p ? x : { ...x, [id]: p })), []);
  const markSent = useCallback((id: string, at: string) => setSent((x) => ({ ...x, [id]: at })), []);
  const setRows = useCallback((id: string, f: (r: LiveRow[]) => LiveRow[]) => setExtra((x) => ({ ...x, [id]: f(x[id] ?? []) })), []);
  const value = useMemo<Ctx>(() => {
    const open = CASES.filter((c) => c.desk === "approval");
    const waiting = open.filter((c) => {
      const p = phases[c.id];
      return p === undefined || p === "pending" || p === "undo" || p === "failed";
    }).length;
    return { phase: (id) => phases[id], set, sentAt: (id) => sent[id], markSent, rows: (id) => extra[id] ?? [], setRows, waiting };
  }, [phases, sent, set, markSent, extra, setRows]);
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
