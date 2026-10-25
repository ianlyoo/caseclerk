"use client";

// Approval state for the finals, held in each final's layout so the nav count, the inbox row, the case page
// and the Wire all change together. Sample cases only: nothing here calls PayPal.
//
// pending -> (approve) undo -> (4 s, or "Send now") sending -> (staged 200) filed -> (sandbox ruling) resolved
// pending -> (decline) declined. Undo returns to pending; there is no way back to pending after sending.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { CASES, NOW } from "./data";

export type Phase = "pending" | "undo" | "sending" | "filed" | "resolved" | "declined";
export type Entry = { phase: Phase; approvedAt?: string; okAt?: string; resolvedAt?: string };

export const UNDO_MS = 4000;
/** How long the staged PayPal call stays in flight before the sample 200 lands. */
export const SEND_MS = 1400;

const KEY = "caseclerk-finals";
const fresh: Entry = { phase: "pending" };
type Store = { get: (id: string) => Entry; set: (id: string, e: Entry) => void };
const Ctx = createContext<Store | null>(null);

/** Fixture time for a seller action: the fixture clock plus however long the page has been open. */
const opened = Date.now();
export const fixtureNow = () => new Date(Date.parse(NOW) + (Date.now() - opened)).toISOString();

export function DecisionProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Record<string, Entry>>({});
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      // A state a page forced from its URL before this ran wins over the saved one.
      if (saved) setMap((m) => ({ ...JSON.parse(saved), ...m }));
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

/** A state a URL can ask for (?state=pending|approved|resolved), as a store entry. */
export function entryFor(state: string | undefined): Entry | undefined {
  const t = NOW;
  const later = (s: number) => new Date(Date.parse(t) + s * 1000).toISOString();
  if (state === "pending") return { phase: "pending" };
  if (state === "approved") return { phase: "filed", approvedAt: later(20), okAt: later(26) };
  if (state === "resolved") return { phase: "resolved", approvedAt: later(20), okAt: later(26), resolvedAt: later(26 + 31 * 60 + 43) };
  return undefined;
}

/** The seller's decision on one case, with the undo window and the staged send driven by timers. */
export function useDecision(id: string) {
  const { get, set } = useStore();
  const e = get(id);

  useEffect(() => {
    if (e.phase === "undo") {
      const t = setTimeout(() => set(id, { ...e, phase: "sending" }), UNDO_MS);
      return () => clearTimeout(t);
    }
    if (e.phase === "sending") {
      const t = setTimeout(() => set(id, { ...e, phase: "filed", okAt: fixtureNow() }), SEND_MS);
      return () => clearTimeout(t);
    }
  }, [e, id, set]);

  return {
    ...e,
    approve: () => e.phase === "pending" && set(id, { phase: "undo", approvedAt: fixtureNow() }),
    sendNow: () => e.phase === "undo" && set(id, { ...e, phase: "sending" }),
    undo: () => e.phase === "undo" && set(id, fresh),
    decline: () => e.phase === "pending" && set(id, { phase: "declined" }),
    /** Sandbox only: PayPal's ruling arrives. */
    resolve: () => e.phase === "filed" && set(id, { ...e, phase: "resolved", resolvedAt: fixtureNow() }),
    reset: () => set(id, fresh),
    /** Jump to a state a URL asked for. */
    force: (x: Entry) => set(id, x),
  };
}

/** Cases still waiting for the seller. A case leaves the count when PayPal answers, not when Approve is pressed. */
export function usePendingApprovals(): number {
  const { get } = useStore();
  const waiting: Phase[] = ["pending", "undo", "sending"];
  return CASES.filter((c) => c.state === "approval" && waiting.includes(get(c.id).phase)).length;
}

/** The phase of a case, for rows that only display it. */
export function usePhase(id: string): Phase {
  return useStore().get(id).phase;
}
