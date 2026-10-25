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
import { realState, type ApiCase } from "./_real/model";
import s from "./a.module.css";

export const BASE = "/finals/a";
/** The case waiting for you: the real $412.00 sandbox chargeback. The $412.00 sample is SAMPLE_HERO_HREF. */
export const HERO_HREF = `${BASE}/case/PP-R-VPY-10194485`;
export const SAMPLE_HERO_HREF = `${BASE}/case/PP-R-NKT-10227591`;
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
/** The real cases, read once per page load through the same-origin proxy. */
let realOnce: Promise<ApiCase[]> | null = null;
export function useRealCases(): ApiCase[] | null {
  const [got, setGot] = useState<ApiCase[] | null>(null);
  useEffect(() => {
    realOnce ??= fetch(`${BASE}/live/cases`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<{ cases: { id: string }[] }>) : { cases: [] }))
      .catch(() => ({ cases: [] as { id: string }[] }))
      .then(({ cases }) =>
        Promise.all(
          cases.map((c) =>
            fetch(`${BASE}/live/case/${c.id}`, { cache: "no-store" })
              .then((r) => (r.ok ? (r.json() as Promise<ApiCase>) : null))
              .catch(() => null),
          ),
        ),
      )
      .then((xs) => xs.filter((x): x is ApiCase => x !== null));
    let live = true;
    realOnce.then((xs) => live && setGot(xs));
    return () => {
      live = false;
    };
  }, []);
  return got;
}

/** Waiting for you: the sample approvals plus every real case with an action waiting for the seller. */
function useWaiting(): number {
  const real = useRealCases();
  return usePendingApprovals() + (real ?? []).filter((r) => realState(r) === "pending").length;
}

export function WaitingCount() {
  const n = useWaiting();
  return <Num value={n} money={false} cause="approve" />;
}
export const countWord = (n: number, cap = false) => {
  const w = WORDS[n] ?? String(n);
  return cap ? w : w.toLowerCase();
};

export function Masthead({ here }: { here: "landing" | "inbox" | "case" | "deadlines" | "policy" }) {
  const waiting = useWaiting();
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
        <Link href={`${BASE}/policy`} aria-current={here === "policy" ? "page" : undefined}>
          Policy
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
export const realTime = (iso: string) => wTime.format(new Date(iso)).replace(/[\s\u202f]AM$/, " am").replace(/[\s\u202f]PM$/, " pm");

/** The header of every Wire: what the plane is. No relative time, so server and client render the same text. */
function WireHead() {
  const [fresh, setFresh] = useState(false);
  useEffect(() => setFresh(Date.now() - Date.parse(REAL_LAST.at) < 24 * 3600 * 1000), []);
  return (
    <div className={s.wireHead} data-origin="paypal">
      <b>PayPal sandbox</b>
      <span className={`${s.dot} ${fresh ? s.dotLive : ""}`} data-live-dot data-cause="webhook" aria-hidden />
      <span className={s.wireAgo}>webhooks verified with PayPal, times PT</span>
    </div>
  );
}

export type ShownLine = WireLine & { key: string; inflight?: boolean; lit?: boolean; plain?: string };
export type WireSection = { key: string; label: ReactNode; lines: ShownLine[] };

const SHORT: [RegExp, string][] = [
  [/^GET \/v1\/customer\/disputes\/[^/]+$/, "dispute"],
  [/^GET \/v2\/checkout\/orders/, "order"],
  [/^(GET|PUT|POST) \/v1\/shipping\/trackers/, "tracker"],
  [/^GET \/v2\/payments\/captures/, "payment"],
];
function shortName(l: WireLine): string {
  if (l.dir === "in") return l.name;
  const m = l.path.match(/^([A-Z]+) /);
  for (const [re, n] of SHORT) if (re.test(l.path)) return `${m?.[1]} ${n}`;
  return `${m?.[1] ?? ""} ${l.path.split("/").at(-1)}`.trim();
}

const OUTCOME_WORDS: Record<string, string> = {
  RESOLVED_SELLER_FAVOUR: "PayPal decided for the seller",
  RESOLVED_BUYER_FAVOUR: "PayPal decided for the buyer",
  RESOLVED_WITH_PAYOUT: "PayPal closed it and paid the buyer itself",
};

/** One sentence per real PayPal entry, about the boundary only: what PayPal did, or what we asked of it. */
export function plainOf(l: WireLine): string {
  if (l.dir === "in") {
    if (l.name.endsWith(".CREATED")) return "PayPal opened the chargeback";
    if (l.name.endsWith(".RESOLVED")) return OUTCOME_WORDS[l.status] ?? "PayPal closed the case";
    if (l.status === "WAITING_FOR_SELLER_RESPONSE") return "PayPal asked for evidence";
    if (l.status === "UNDER_REVIEW") return "PayPal is reviewing the case";
    return "PayPal updated the case";
  }
  const ok = /^2\d\d$/.test(l.status);
  const path = l.path.replace(/^[A-Z]+ /, "");
  if (!l.status) return "Sent to PayPal, waiting for its answer";
  if (l.path.startsWith("PUT /v1/shipping/trackers/")) return "CaseClerk updated the tracking on the PayPal payment";
  if (!ok) return /^\d{3}$/.test(l.status) ? `PayPal refused the call with ${l.status}` : "The call failed before PayPal answered";
  if (path.endsWith("/provide-evidence")) return "CaseClerk filed the evidence and PayPal accepted it";
  if (path.endsWith("/accept-claim")) return "CaseClerk accepted the claim and PayPal refunded the buyer";
  if (path.endsWith("/make-offer")) return "CaseClerk sent the offer and PayPal accepted it";
  if (path.endsWith("/send-message")) return "CaseClerk messaged the buyer through PayPal";
  if (path.endsWith("/require-evidence")) return "Sandbox control: PayPal was asked to request more evidence";
  if (path.endsWith("/adjudicate")) return "Sandbox control: PayPal was asked to rule for the seller";
  if (path.includes("verify-webhook-signature")) return "CaseClerk checked PayPal's signature on a webhook";
  if (path.startsWith("/v2/checkout/orders")) return "CaseClerk read the order from PayPal";
  if (l.path.startsWith("POST /v1/shipping/trackers")) return "CaseClerk added the tracking to the PayPal payment";
  if (path.startsWith("/v1/shipping/trackers")) return "CaseClerk read the tracking from PayPal";
  if (path.startsWith("/v1/customer/disputes")) return "CaseClerk read the case from PayPal";
  if (path.startsWith("/v2/payments/captures")) return "CaseClerk read the payment from PayPal";
  return "CaseClerk called PayPal";
}

/** Event names break only at the dots, so CUSTOMER.DISPUTE.UPDATED is never cut. */
function dotted(name: string): ReactNode {
  const parts = name.split(".");
  return parts.map((p, i) => (
    <span key={i}>
      {p}
      {i < parts.length - 1 && (
        <>
          .<wbr />
        </>
      )}
    </span>
  ));
}

function Line({ l, fresh }: { l: ShownLine; fresh: boolean }) {
  const reduce = useReducedMotion();
  const real = l.origin === "paypal";
  const path = l.dir === "in" ? (l.status.startsWith("RESOLVED") ? "outcome" : "status") : l.path.replace(/^[A-Z]+ /, "");
  const status = l.inflight ? "sending" : !real ? "staged" : l.dir === "in" ? "verified" : l.status;
  const second = l.dir === "in" ? l.status : path;
  const cut = Math.min(18, Math.floor(second.length / 2));
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
      title={l.eventId ? `Event ${l.eventId}` : real ? l.path : undefined}
    >
      <span className={s.lTime}>{wireClock(l.at)}</span>
      <span className={s.lDir}>{l.dir}</span>
      <span className={s.lName}>{l.dir === "in" ? dotted(l.name) : shortName(l)}</span>
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
      {real ? (
        <>
          <span className={s.lPlain}>{l.plain ?? plainOf(l)}</span>
          {l.debugId && <span className={`${s.lPath} ${s.lDebug}`}>debug {l.debugId}</span>}
        </>
      ) : (
        <span className={s.lPath}>
          {/* Truncated in the middle: the head shrinks with an ellipsis, the tail always shows. */}
          <span className={s.lPathText}>
            <span className={s.lHead}>{second.slice(0, second.length - cut)}</span>
            <span className={s.lTail}>{second.slice(second.length - cut)}</span>
          </span>
        </span>
      )}
      {l.inflight && <span className={s.inflight} data-inflight data-cause="paypal-call" aria-hidden />}
    </motion.li>
  );
}

/** The dark plane. PayPal traffic only, newest on top. */
export function Wire({ sections, phoneLabel }: { sections: WireSection[]; phoneLabel?: string }) {
  const seen = useRef<Set<string> | null>(null);
  if (seen.current === null) seen.current = new Set(sections.flatMap((x) => x.lines.map((l) => l.key)));
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={s.wireBar} data-wire data-origin="paypal" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={s.dot} aria-hidden />
        <span className={s.wireBarText}>
          {phoneLabel ? `${phoneLabel}. ` : ""}
          {open ? "Hide" : "Show"} the PayPal traffic

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
                  {[...sec.lines]
                    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
                    .flatMap((l, i, all) => {
                      const d = realDay(l.at);
                      const row = <Line key={l.key} l={l} fresh={!seen.current!.has(l.key)} />;
                      if (i > 0 && realDay(all[i - 1].at) === d) return [row];
                      return [
                        <li key={`date-${sec.key}-${d}`} className={s.wireDate} data-wire-date>
                          {d}
                        </li>,
                        row,
                      ];
                    })}
                </AnimatePresence>
              </ol>
            </section>
          ))}
        </div>
      </aside>
    </>
  );
}
