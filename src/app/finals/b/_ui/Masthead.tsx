"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import NumberFlow from "@number-flow/react";
import { clock, dayOf } from "../_lib/data";
import { DEFAULT_REAL, rowsOf, SNAPSHOTS, type WireEntry } from "../_lib/live";
import { useDesk } from "./store";
import s from "../b.module.css";

const B = "/finals/b";

export function ago(iso: string, now: number): string {
  const m = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} h ${m % 60} min ago`;
  return `${Math.floor(h / 24)} days ago`;
}

export function useNow(every = 15_000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(t);
  }, [every]);
  return now;
}

type Hook = { at: string; eventType: string; eventId: string; caseId?: string };

/** The newest verified webhook in the snapshots, so the first render already says something true. */
const SNAP_LAST: Hook = Object.values(SNAPSHOTS)
  .flatMap((j) => rowsOf(j).flatMap((r) => (r.kind === "paypal" && r.dir === "in" && r.eventId ? [{ at: r.at, eventType: r.name, eventId: r.eventId, caseId: j.case.id }] : [])))
  .sort((x, y) => Date.parse(y.at) - Date.parse(x.at))[0];

/** The last real webhook, from GET /api/wire: polled every 20 s from 60 s before the newest one seen, deduped by id. */
export function useLastWebhook(): Hook {
  const [last, setLast] = useState<Hook>(SNAP_LAST);
  useEffect(() => {
    let stop = false;
    const seen = new Set<string>();
    let since = new Date(Date.now() - 6 * 3_600_000).toISOString();
    const tick = async () => {
      try {
        const r = await fetch(`/api/wire?since=${encodeURIComponent(since)}&limit=200`, { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as { wire: WireEntry[] };
        const hooks = j.wire.filter((w) => w.kind === "event" && w.verify === "SUCCESS" && w.eventId && !seen.has(w.id));
        hooks.forEach((w) => seen.add(w.id));
        const newest = hooks.sort((x, y) => Date.parse(y.at) - Date.parse(x.at))[0];
        if (newest && !stop) {
          setLast((cur) => (Date.parse(newest.at) > Date.parse(cur.at) ? { at: newest.at, eventType: newest.eventType ?? "webhook", eventId: newest.eventId!, caseId: newest.caseId } : cur));
          since = new Date(Date.parse(newest.at) - 60_000).toISOString();
        }
      } catch {
        // The snapshot stands until the next tick.
      }
    };
    tick();
    const t = setInterval(tick, 20_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, []);
  return last;
}

/**
 * The PayPal state: the last webhook PayPal really sent us, how long ago, and the case it belongs to. "Live" and the
 * breathing dot only when that webhook is under 15 minutes old. On a staged sample page it says so first.
 */
export function LiveState({ sample = false }: { sample?: boolean }) {
  const w = useLastWebhook();
  const now = useNow();
  const live = now !== null && now - Date.parse(w.at) < 15 * 60_000;
  const at = `${dayOf(w.at)} ${clock(w.at)} PT`;
  const caseId = w.caseId ?? DEFAULT_REAL;
  return (
    <Link href={`${B}/case/${caseId}`} className={s.live} data-origin="paypal" data-live={live ? "" : undefined} title="Open the real case this webhook belongs to">
      <span className={s.liveDot} data-live-dot={live ? "on" : "still"} data-cause="webhook" aria-hidden />
      <span className={s.liveWords}>
        <span className={s.liveHead}>{sample ? "Staged sample. Real PayPal sandbox traffic:" : live ? "Live on PayPal sandbox" : "PayPal sandbox"}</span>
        <span className={s.liveLine}>
          last real webhook <code>{w.eventType}</code> {now === null ? at : ago(w.at, now)}, <code>{caseId}</code>
        </span>
      </span>
    </Link>
  );
}

export function Masthead({ sample = false }: { sample?: boolean }) {
  const path = usePathname();
  const { waiting } = useDesk();
  const nav = [
    { href: `${B}/inbox`, label: "Disputes", on: path === `${B}/inbox` || path.startsWith(`${B}/case`) },
    { href: `${B}/inbox?show=waiting`, label: "Waiting for you", count: true, on: false },
    { href: `${B}/inbox#deadlines`, label: "Deadlines", on: false },
    { href: `${B}/inbox#policy`, label: "Policy", on: false },
  ];
  return (
    <header className={s.mast}>
      <Link href={B} className={s.word} aria-label="CaseClerk, home">
        CaseClerk<i aria-hidden />
      </Link>
      <nav className={s.nav} aria-label="Main">
        {nav.map((n) => (
          <Link key={n.label} href={n.href} className={n.on ? s.navOn : undefined} aria-current={n.on ? "page" : undefined}>
            {n.label}
            {n.count ? (
              <span className={s.navCount} data-cause="approve" data-count={waiting}>
                <NumberFlow value={waiting} />
              </span>
            ) : null}
          </Link>
        ))}
      </nav>
      <LiveState sample={sample} />
    </header>
  );
}
