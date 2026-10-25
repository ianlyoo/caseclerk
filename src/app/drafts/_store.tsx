"use client";

// Approval state for the drafts, held in each draft's layout so the nav count, the inbox row,
// the case header and the timeline all change together when you approve.

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CASES, NOW } from "./_data";
import type { Phase } from "./_cases";

export type { Phase };
type Entry = { phase: Phase; decidedAt: string };
type Store = { get: (id: string) => Entry; set: (id: string, e: Entry) => void };

const UNDO_MS = 4000;
const KEY = "caseclerk-drafts";
const fresh: Entry = { phase: "waiting", decidedAt: NOW };
const Ctx = createContext<Store | null>(null);

export function DecisionProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Record<string, Entry>>({});
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      if (saved) setMap(JSON.parse(saved));
    } catch {}
  }, []);
  const set = useCallback((id: string, e: Entry) => {
    setMap((m) => {
      const next = { ...m, [id]: e };
      try {
        sessionStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);
  const get = useCallback((id: string) => map[id] ?? fresh, [map]);
  return <Ctx.Provider value={{ get, set }}>{children}</Ctx.Provider>;
}

function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("DecisionProvider missing");
  return s;
}

/** The seller's decision on one case: approve (with a short undo), deny, undo, reset. */
export function useDecision(id: string) {
  const { get, set } = useStore();
  const entry = get(id);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // An approval that is still inside its undo window is sent when the window ends.
  useEffect(() => {
    if (entry.phase !== "approved") return;
    timer.current = setTimeout(() => set(id, { phase: "sent", decidedAt: entry.decidedAt }), UNDO_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [entry.phase, entry.decidedAt, id, set]);

  const decidedAt = new Date(Date.parse(NOW) + 20_000).toISOString();
  return {
    phase: entry.phase,
    decidedAt: entry.decidedAt,
    approve: () => set(id, { phase: "approved", decidedAt }),
    deny: () => set(id, { phase: "denied", decidedAt }),
    undo: () => set(id, fresh),
    // Sandbox only: the buyer takes the offer, PayPal closes the case.
    close: () => set(id, { phase: "closed", decidedAt: entry.decidedAt }),
    reset: () => set(id, fresh),
  };
}

/** Cases still waiting for the seller. */
export function usePendingApprovals(): number {
  const { get } = useStore();
  return CASES.filter((c) => c.state === "approval" && get(c.id).phase === "waiting").length;
}

/** The phase of a case, for rows that only display it. */
export function usePhase(id: string): Phase {
  return useStore().get(id).phase;
}
