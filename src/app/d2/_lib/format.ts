import type { Money } from "@/lib/types";

const TZ = "America/Los_Angeles";

export const usd = (v: number | string, opts: { sign?: boolean } = {}) => {
  const n = typeof v === "string" ? Number(v) : v;
  const s = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (opts.sign && n < 0) return `−$${s}`;
  return `$${s}`;
};

export const money = (m?: Money | null) => (m ? usd(m.value) : "");

/** "5:50 am" in Pacific time (the sandbox seller is in the US). */
export const clock = (iso: string) =>
  new Date(iso)
    .toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" })
    .replace(" AM", " am")
    .replace(" PM", " pm");

/** "Oct 25" */
export const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { timeZone: TZ, month: "short", day: "numeric" });

/** "Nov 4, 9:59 pm PT" */
export const dayClock = (iso: string) => `${day(iso)}, ${clock(iso)} PT`;

export const secondsBetween = (a: string, b: string) => Math.max(0, (Date.parse(b) - Date.parse(a)) / 1000);

/** "2 min 21 s", "56 s", "12 min" */
export const span = (sec: number) => {
  const s = Math.round(sec);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return s % 60 ? `${m} min ${s % 60} s` : `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
  return `${Math.floor(h / 24)} days`;
};

/** Whole days still left (10 days and 3 hours is "10 days left", never rounded up). */
export const daysLeft = (iso: string, now = Date.now()) => Math.max(0, Math.floor((Date.parse(iso) - now) / 86_400_000));

/** "10 days left", "1 day left", "5 h left", "past due" */
export const leftWords = (iso: string, now = Date.now()) => {
  const ms = Date.parse(iso) - now;
  if (ms <= 0) return "past due";
  const d = daysLeft(iso, now);
  if (d >= 1) return d === 1 ? "1 day left" : `${d} days left`;
  return `${Math.max(1, Math.floor(ms / 3_600_000))} h left`;
};

const REASONS: Record<string, string> = {
  MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED: "not as described",
  MERCHANDISE_OR_SERVICE_NOT_RECEIVED: "not received",
  UNAUTHORISED: "unauthorized",
  UNAUTHORIZED: "unauthorized",
  CREDIT_NOT_PROCESSED: "credit not processed",
  DUPLICATE_TRANSACTION: "duplicate charge",
  INCORRECT_AMOUNT: "wrong amount",
};
export const reasonWords = (r: string) => REASONS[r] ?? r.toLowerCase().replace(/_/g, " ");

export const stageWord = (s: string) => (s === "CHARGEBACK" ? "chargeback" : s === "INQUIRY" ? "inquiry" : "dispute");

export const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
