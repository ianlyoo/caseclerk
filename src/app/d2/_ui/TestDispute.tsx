"use client";
// Opens a real PayPal sandbox chargeback, then shows the honest wait: PayPal's webhook takes minutes,
// then CaseClerk's agent works the case. Arrivals come in live from the wire; a reload keeps the wait.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { WireEntry } from "@/lib/db/repo";
import type { CaseRecord } from "@/lib/types";
import { clock, dayClock, span, usd } from "../_lib/format";
import { caseState } from "../_lib/state";
import { href } from "../_lib/routes";
import { wireWords } from "../_lib/words";

const KEY = "caseclerk.test-dispute";
const KEEP_MS = 30 * 60_000;

type Opened = { captureId: string; disputeId: string | null; amount: string | null; at: string };
type Flow =
  | { at: "idle" }
  | { at: "sending" }
  | { at: "capped"; message: string; resetAt?: string }
  | { at: "error"; message: string }
  | { at: "waiting"; opened: Opened };

const amountOf = (a: unknown) => (typeof a === "string" ? a : typeof a === "object" && a && "value" in a ? String((a as { value: unknown }).value) : null);

/** `on`: the material it sits on; on metal the wait is its own leather plate. */
export function TestDispute({ tone = "quiet", lede, on = "metal" }: { tone?: "go" | "quiet"; lede?: string; on?: "metal" | "leather" }) {
  const [flow, setFlow] = useState<Flow>({ at: "idle" });

  // a wait in progress survives a reload
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Opened | null;
      if (saved && Date.now() - Date.parse(saved.at) < KEEP_MS) setFlow({ at: "waiting", opened: saved });
    } catch {
      // nothing saved
    }
  }, []);

  async function open() {
    setFlow({ at: "sending" });
    try {
      const res = await fetch("/api/test-dispute", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const body = (await res.json().catch(() => ({}))) as {
        captureId?: string;
        disputeId?: string | null;
        amount?: unknown;
        error?: { code?: string; message?: string; resetAt?: string };
      };
      if (res.status === 202 && body.captureId) {
        const opened: Opened = { captureId: body.captureId, disputeId: body.disputeId ?? null, amount: amountOf(body.amount), at: new Date().toISOString() };
        localStorage.setItem(KEY, JSON.stringify(opened));
        setFlow({ at: "waiting", opened });
        return;
      }
      if (res.status === 429) {
        setFlow({ at: "capped", message: body.error?.message ?? "Today's test disputes are used up. Try again tomorrow.", resetAt: body.error?.resetAt });
        return;
      }
      setFlow({ at: "error", message: body.error?.message ?? `CaseClerk answered ${res.status}. Nothing was opened.` });
    } catch {
      setFlow({ at: "error", message: "Couldn't reach CaseClerk, so nothing was opened. Check the connection and try again." });
    }
  }

  if (flow.at === "waiting") {
    return (
      <Wait
        opened={flow.opened}
        plate={on === "metal"}
        go={tone === "go"}
        onDone={() => {
          localStorage.removeItem(KEY);
          setFlow({ at: "idle" });
        }}
      />
    );
  }

  return (
    <div className="td" data-tone={tone}>
      {lede && <p className="td-lede">{lede}</p>}
      <div className="td-row">
        <button type="button" className={`btn ${tone === "go" ? "btn-go" : "btn-quiet"}`} onClick={open} disabled={flow.at === "sending"} aria-busy={flow.at === "sending" || undefined}>
          {flow.at === "sending" ? "Opening in PayPal’s sandbox" : "Open a test dispute"}
        </button>
        <p className="td-fine">A real sandbox chargeback on a test order. Three a day per visitor.</p>
      </div>
      {flow.at === "capped" && (
        <p className="td-msg" role="status">
          {flow.message}
          {flow.resetAt ? ` It opens again ${dayClock(flow.resetAt)}.` : ""}
        </p>
      )}
      {flow.at === "error" && (
        <p className="td-msg td-error" role="alert">
          {flow.message}
        </p>
      )}
    </div>
  );
}

type Found = Pick<CaseRecord, "id" | "status" | "snapshot" | "decision">;

/** `go`: this control is the page's one action, so the arrived case gets the Go button; otherwise it stays Quiet. */
function Wait({ opened, plate, go, onDone }: { opened: Opened; plate: boolean; go: boolean; onDone: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const [rows, setRows] = useState<WireEntry[]>([]);
  const [found, setFound] = useState<Found | null>(null);
  const seen = useRef(new Set<string>());
  const since = useRef(new Date(Date.parse(opened.at) - 60_000).toISOString());

  const mine = useCallback(
    (w: WireEntry) => w.ref === opened.captureId || (found && w.caseId === found.id) || (opened.disputeId && w.caseId === opened.disputeId),
    [opened, found],
  );

  const poll = useCallback(async () => {
    try {
      const [wr, cr] = await Promise.all([
        fetch(`/api/wire?since=${encodeURIComponent(since.current)}&limit=100`, { cache: "no-store" }),
        fetch("/api/cases?limit=50", { cache: "no-store" }),
      ]);
      if (wr.ok) {
        const { wire } = (await wr.json()) as { wire: WireEntry[] };
        const fresh = wire.filter((w) => !seen.current.has(w.id));
        fresh.forEach((w) => seen.current.add(w.id));
        if (fresh.length) setRows((r) => [...r, ...fresh]);
      }
      if (cr.ok) {
        const { cases } = (await cr.json()) as { cases: CaseRecord[] };
        const c = cases.find((x) => x.snapshot.sellerTransactionId === opened.captureId || x.id === opened.disputeId);
        if (c) setFound(c);
      }
    } catch {
      // the next poll tries again
    }
  }, [opened]);

  useEffect(() => {
    let stop = false;
    let id: number | undefined;
    const loop = async () => {
      if (document.visibilityState === "visible") await poll();
      if (!stop) id = window.setTimeout(loop, 5000);
    };
    void loop();
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      stop = true;
      window.clearTimeout(id);
      window.clearInterval(tick);
    };
  }, [poll]);

  const t0 = Date.parse(opened.at);
  const arrived = found ?? null;
  const st = arrived ? caseState(arrived as CaseRecord) : null;
  const worked = arrived && arrived.status !== "new" && arrived.status !== "acting";
  const related = rows.filter((w) => mine(w) || (w.kind === "event" && w.eventType === "CUSTOMER.DISPUTE.CREATED" && Date.parse(w.at) >= t0));
  const amount = arrived ? usd(arrived.snapshot.amount.value) : opened.amount ? usd(opened.amount) : null;

  const steps = [
    { id: "filed", title: "Chargeback filed in PayPal’s sandbox", detail: `${clock(opened.at)} PT${amount ? `, ${amount}` : ""}`, done: true },
    {
      id: "told",
      title: "PayPal tells CaseClerk",
      detail: arrived ? "Its webhook arrived" : `Usually about 3 minutes. ${span((now - t0) / 1000)} so far`,
      done: Boolean(arrived),
    },
    {
      id: "worked",
      title: "CaseClerk works the case",
      detail: worked && st ? st.words : arrived ? "Reading the order and tracking" : "After the webhook",
      done: Boolean(worked),
    },
  ];
  const current = steps.findIndex((s) => !s.done);

  return (
    <div className={`td td-wait${plate ? " leather" : ""}`} role="region" aria-label="Your test dispute">
      <ol className="td-steps">
        {steps.map((s, i) => (
          <li key={s.id} className="td-step" data-state={s.done ? "done" : i === current ? "current" : "next"}>
            <span className="td-step-title">{s.title}</span>
            <span className="td-step-detail" aria-live={i === current ? "polite" : undefined}>
              {s.detail}
            </span>
          </li>
        ))}
      </ol>
      {related.length > 0 && (
        <ul className="td-wire" aria-label="Arrived on the wire">
          {related.slice(-4).map((w) => (
            <li key={w.id} className="td-wire-row">
              <span className="td-wire-time">{clock(w.at)}</span>
              <span>{wireWords(w)}</span>
              <span className="td-wire-status">{w.status}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="td-row">
        {arrived ? (
          <Link className={`btn ${worked && go ? "btn-go" : "btn-quiet"}`} href={href.case(arrived.id)}>
            Open the {usd(arrived.snapshot.amount.value)} case
          </Link>
        ) : null}
        <button type="button" className="td-link" onClick={onDone}>
          {arrived ? "Done" : "Stop watching"}
        </button>
      </div>
      <p className="td-fine">
        Capture <code>{opened.captureId}</code>. PayPal decides when it delivers; this keeps watching while the page is open.
      </p>
    </div>
  );
}
