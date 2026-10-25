"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import NumberFlow from "@number-flow/react";
import { lastRealWebhook, REAL, type Row } from "../_lib/data";
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

/** The live state: the last webhook PayPal really sent us, how long ago, and a dot that breathes only within 24 h. */
export function LiveState({ rows }: { rows?: Row[] }) {
  const w = lastRealWebhook(rows);
  const now = useNow();
  if (!w || w.kind !== "paypal") return null;
  const fresh = now !== null && now - Date.parse(w.at) < 24 * 3_600_000;
  const utc = new Date(w.at).toISOString().slice(0, 16).replace("T", " ");
  return (
    <Link href={`${B}/case/${REAL.id}`} className={s.live} data-origin="paypal" title="Open the real case this webhook belongs to">
      <span className={s.liveDot} data-live-dot={fresh ? "on" : "still"} data-cause="webhook" aria-hidden />
      <span className={s.liveWords}>
        <span className={s.liveHead}>Live on PayPal sandbox</span>
        <span className={s.liveLine}>
          <code>{w.name}</code> verified {now === null ? `${utc} UTC` : ago(w.at, now)}
        </span>
      </span>
    </Link>
  );
}

export function Masthead() {
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
              <span className={s.navCount} data-cause="approve">
                <NumberFlow value={waiting} />
              </span>
            ) : null}
          </Link>
        ))}
      </nav>
      <LiveState />
    </header>
  );
}
