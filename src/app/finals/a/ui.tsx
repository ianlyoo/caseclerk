"use client";

// Final A building blocks: masthead, the Wire, numbers that roll.

import Link from "next/link";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { WireLine } from "../_shared/cases";
import { SELLER, TZ } from "../_shared/data";
import { REAL_LAST } from "../_shared/real";
import { usePendingApprovals } from "../_shared/store";
import s from "./a.module.css";

export const BASE = "/finals/a";
export const HERO_HREF = `${BASE}/case/PP-R-NKT-10227591`;
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const SPRING = { type: "spring", stiffness: 420, damping: 41, mass: 1 } as const;

/** A number that rolls when the data changes; still under reduced motion. */
export function Num({ value, money = true, cause, className }: { value: number; money?: boolean; cause: string; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <NumberFlow
      value={value}
      locales="en-US"
      format={money ? { style: "currency", currency: "USD", minimumFractionDigits: 2 } : undefined}
      animated={!reduce}
      transformTiming={{ duration: 900, easing: "cubic-bezier(.22,1,.36,1)" }}
      spinTiming={{ duration: 900, easing: "cubic-bezier(.22,1,.36,1)" }}
      opacityTiming={{ duration: 320, easing: "ease-out" }}
      data-cause={cause}
      className={className}
    />
  );
}

const WORDS = ["Nothing", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
export function WaitingCount() {
  const n = usePendingApprovals();
  return <Num value={n} money={false} cause="approve" />;
}
export const countWord = (n: number, cap = false) => {
  const w = WORDS[n] ?? String(n);
  return cap ? w : w.toLowerCase();
};

export function Masthead({ here }: { here: "landing" | "inbox" | "case" | "deadlines" }) {
  const waiting = usePendingApprovals();
  return (
    <header className={s.mast}>
      <Link href={BASE} className={s.word} aria-label="CaseClerk home">
        CaseClerk
      </Link>
      <nav className={s.nav} aria-label="Main">
        <Link href={`${BASE}/inbox`} aria-current={here === "inbox" ? "page" : undefined}>
          Disputes
        </Link>
        <Link href={HERO_HREF} aria-current={here === "case" ? "page" : undefined} data-count={waiting}>
          Waiting for you <WaitingCount />
        </Link>
        <Link href={`${BASE}/deadlines`} aria-current={here === "deadlines" ? "page" : undefined}>
          Deadlines
        </Link>
      </nav>
      <span className={s.seller}>{SELLER.name}</span>
    </header>
  );
}

// ---- Time on the Wire: the line's own clock, Pacific ----

const wClock = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const wDay = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric" });
const wTime = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
export const wireClock = (iso: string) => wClock.format(new Date(iso));
export const realDay = (iso: string) => wDay.format(new Date(iso));
export const realTime = (iso: string) => wTime.format(new Date(iso)).replace(" AM", " am").replace(" PM", " pm");

/** "5 h 12 min ago", measured on the real clock, ticking. Server render shows the date. */
export function useRealAgo(iso: string): { text: string; fresh: boolean } {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return { text: `${realDay(iso)}, ${realTime(iso)}`, fresh: false };
  const sec = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  const fresh = sec < 24 * 3600;
  if (!fresh) return { text: `${realDay(iso)}, ${realTime(iso)}`, fresh };
  if (sec < 60) return { text: `${sec} s ago`, fresh };
  const m = Math.floor(sec / 60);
  if (m < 60) return { text: `${m} min ago`, fresh };
  return { text: `${Math.floor(m / 60)} h ${m % 60} min ago`, fresh };
}

/** The header of every Wire: the last real webhook PayPal sent us, verified, ticking. */
function WireHead() {
  const { text, fresh } = useRealAgo(REAL_LAST.at);
  return (
    <div className={s.wireHead} data-origin="paypal">
      <b>PayPal sandbox</b>
      <span className={`${s.dot} ${fresh ? s.dotLive : ""}`} data-live-dot data-cause="webhook" aria-hidden />
      <span className={s.wireAgo}>last webhook verified {text}</span>
    </div>
  );
}

export type ShownLine = WireLine & { key: string; inflight?: boolean; lit?: boolean };
export type WireSection = { key: string; label: ReactNode; lines: ShownLine[] };

const SHORT: [RegExp, string][] = [
  [/^GET \/v1\/customer\/disputes\/[^/]+$/, "dispute"],
  [/^GET \/v2\/checkout\/orders/, "order"],
  [/^GET \/v1\/shipping\/trackers/, "tracker"],
];
function shortName(l: WireLine): string {
  if (l.dir === "in") return l.name;
  const m = l.path.match(/^(GET|POST) /);
  for (const [re, n] of SHORT) if (re.test(l.path)) return `${m?.[1]} ${n}`;
  return `${m?.[1] ?? ""} ${l.path.split("/").at(-1)}`.trim();
}

function Line({ l, fresh }: { l: ShownLine; fresh: boolean }) {
  const reduce = useReducedMotion();
  const real = l.origin === "paypal";
  const path = l.dir === "in" ? (l.status.startsWith("RESOLVED") ? "outcome" : "status") : l.path.replace(/^(GET|POST) /, "");
  const status = l.inflight ? "sending" : l.dir === "in" ? "verified" : l.status;
  const second = l.dir === "in" ? l.status : path;
  // With a debug id beside it, the tail keeps only the last path segment.
  const cut = l.debugId && second.includes("/") ? second.length - second.lastIndexOf("/") : Math.min(18, Math.floor(second.length / 2));
  return (
    <motion.li
      layout={reduce ? false : "position"}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0.12 } : { duration: 0.32, ease: EASE_OUT }}
      className={`${s.line} ${fresh && real ? s.fresh : ""} ${l.lit ? s.lit : ""}`}
      data-wire-line
      data-key={l.key}
      data-origin={real ? "paypal" : undefined}
      data-sample={real ? undefined : ""}
      data-cause={l.dir === "in" ? "webhook" : "paypal-call"}
      title={l.eventId ? `Event ${l.eventId}` : undefined}
    >
      <span className={s.lTime}>{wireClock(l.at)}</span>
      <span className={s.lDir}>{l.dir}</span>
      <span className={s.lName}>{shortName(l)}</span>
      <motion.span
        key={status}
        className={s.lStatus}
        initial={fresh ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: reduce ? 0.1 : 0.32, delay: reduce ? 0 : 0.12 }}
        data-cause={l.dir === "in" ? "webhook" : "paypal-call"}
      >
        {status}
      </motion.span>
      <span className={s.lPath}>
        {/* Truncated in the middle: the head shrinks with an ellipsis, the tail always shows. */}
        <span className={s.lPathText}>
          <span className={s.lHead}>{second.slice(0, second.length - cut)}</span>
          <span className={s.lTail}>{second.slice(second.length - cut)}</span>
        </span>
        {l.debugId && <span className={s.lDebug}>debug {l.debugId}</span>}
        {!real && l.dir === "out" && !l.inflight && l.status === "200" && <span className={s.lDebug}>sample</span>}
      </span>
      {l.inflight && <span className={s.inflight} data-inflight data-cause="paypal-call" aria-hidden />}
    </motion.li>
  );
}

/** The dark plane. PayPal traffic only, newest on top. */
export function Wire({ sections, phoneLabel }: { sections: WireSection[]; phoneLabel?: string }) {
  const seen = useRef<Set<string> | null>(null);
  if (seen.current === null) seen.current = new Set(sections.flatMap((x) => x.lines.map((l) => l.key)));
  const [open, setOpen] = useState(false);
  const { text } = useRealAgo(REAL_LAST.at);
  return (
    <>
      <button className={s.wireBar} data-wire data-origin="paypal" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={s.dot} aria-hidden />
        <span className={s.wireBarText}>
          {phoneLabel ?? "PayPal sandbox"}, last webhook {text}. {open ? "Close" : "Show"}
        </span>
      </button>
      <aside className={`${s.wire} ${open ? s.wireOpen : ""}`} data-wire aria-label="PayPal traffic">
        <WireHead />
        <div className={s.wireBody}>
          {sections.map((sec, i) => (
            <section key={sec.key}>
              {i > 0 && <hr className={s.wireRule} />}
              <p className={s.wireLabel}>{sec.label}</p>
              <ol className={s.lines}>
                <AnimatePresence initial={false}>
                  {[...sec.lines].reverse().map((l) => (
                    <Line key={l.key} l={l} fresh={!seen.current!.has(l.key)} />
                  ))}
                </AnimatePresence>
              </ol>
            </section>
          ))}
        </div>
      </aside>
    </>
  );
}
