"use client";
// The judge's step on a sandbox test dispute: PayPal's sandbox never rules on its own, so the visitor asks it to.
// Never shown on a live (non-test) dispute or on the case kept for the demo recording; the API refuses both too.
// PayPal opens the step minutes after a filing: until then the API answers 409 and this asks again once a minute.
import { useEffect, useRef, useState } from "react";
import type { DisputeStatus } from "@/lib/types";
import { clock } from "../_lib/format";

export type Outcome = "SELLER_FAVOR" | "BUYER_FAVOR";

const RETRY_MS = 60_000;
/** about half an hour of checks, well inside the API's 120 an hour */
const MAX_TRIES = 30;

const STATUS_WORDS: Record<DisputeStatus, string> = {
  OPEN: "Open",
  WAITING_FOR_BUYER_RESPONSE: "Waiting for the buyer",
  WAITING_FOR_SELLER_RESPONSE: "Waiting for the seller",
  UNDER_REVIEW: "Under review",
  RESOLVED: "Resolved",
  OTHER: "Other",
};
const side = (o: Outcome) => (o === "SELLER_FAVOR" ? "the seller" : "the buyer");

type Flow =
  | { at: "idle" }
  | { at: "sending"; outcome: Outcome; tries: number }
  | { at: "early"; outcome: Outcome; tries: number; checked: string }
  | { at: "limited"; resetAt?: string }
  | { at: "error"; message: string; retry: boolean }
  | { at: "asked"; outcome: Outcome; when: string };

export function Rule({
  caseId,
  status,
  asked,
  onAsked,
  onCheck,
}: {
  caseId: string;
  /** PayPal's status on the case, as last read */
  status: DisputeStatus;
  /** a ruling already asked for (CaseClerk's audit), so a reload doesn't offer it again */
  asked?: { outcome: Outcome; at: string } | null;
  onAsked: (at: string) => void;
  /** the API refreshed the dispute from PayPal: reload the case */
  onCheck: () => void;
}) {
  const [outcome, setOutcome] = useState<Outcome>("SELLER_FAVOR");
  const [flow, setFlow] = useState<Flow>(asked ? { at: "asked", outcome: asked.outcome, when: asked.at } : { at: "idle" });
  const timer = useRef<number | undefined>(undefined);
  /** bumped by Stop asking: an answer to an older request is dropped */
  const run = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function ask(o: Outcome, tries: number) {
    window.clearTimeout(timer.current);
    // a retry keeps the waiting view (PayPal's state, the last check) instead of flashing the choice back
    if (tries === 1) setFlow({ at: "sending", outcome: o, tries });
    const mine = run.current;
    let res: Response;
    try {
      res = await fetch(`/api/cases/${encodeURIComponent(caseId)}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "adjudicate", outcome: o }),
      });
    } catch {
      return setFlow({ at: "error", message: "CaseClerk couldn’t be reached. Nothing was asked.", retry: true });
    }
    const body = (await res.json().catch(() => null)) as { error?: { resetAt?: string } } | null;
    if (mine !== run.current) return;
    if (res.ok) {
      const when = new Date().toISOString();
      setFlow({ at: "asked", outcome: o, when });
      onAsked(when);
      return onCheck();
    }
    if (res.status === 409) {
      onCheck();
      if (tries >= MAX_TRIES) {
        return setFlow({ at: "error", message: `PayPal’s sandbox still hadn’t opened a ruling after ${tries} checks, a minute apart.`, retry: true });
      }
      setFlow({ at: "early", outcome: o, tries, checked: new Date().toISOString() });
      timer.current = window.setTimeout(() => void ask(o, tries + 1), RETRY_MS);
      return;
    }
    if (res.status === 429) return setFlow({ at: "limited", resetAt: body?.error?.resetAt });
    if (res.status === 403) return setFlow({ at: "error", message: "The sandbox takes this only on test disputes.", retry: false });
    if (res.status === 502) {
      return setFlow({ at: "error", message: "PayPal’s sandbox turned the request down. It often does the first time; try again in a minute.", retry: true });
    }
    setFlow({ at: "error", message: "The sandbox controls are unavailable right now. Nothing was asked.", retry: true });
  }

  function stop() {
    run.current++;
    window.clearTimeout(timer.current);
    setFlow({ at: "idle" });
  }

  if (flow.at === "asked") {
    return (
      <section className="rule" aria-labelledby="rule-title">
        <p className="rule-k">Sandbox control, test disputes only</p>
        <h3 id="rule-title" className="rule-title">
          Ruling asked for {side(flow.outcome)}
        </h3>
        <p className="decide-msg" role="status">
          Asked {clock(flow.when)} PT. The sandbox rules on its own time, often minutes later; its RESOLVED webhook lands on the scale and here.
        </p>
      </section>
    );
  }

  if (flow.at === "early") {
    return (
      <section className="rule" aria-labelledby="rule-title">
        <p className="rule-k">Sandbox control, test disputes only</p>
        <h3 id="rule-title" className="rule-title">
          Asking the sandbox to rule for {side(flow.outcome)}
        </h3>
        <p className="decide-msg">Not open yet. The sandbox opens this step a few minutes after a filing, so CaseClerk asks again each minute.</p>
        <dl className="decide-read rule-state decide-in" role="status">
          <div>
            <dt>PayPal&rsquo;s state</dt>
            <dd>{STATUS_WORDS[status] ?? status}</dd>
          </div>
          <div>
            <dt>Last check</dt>
            <dd>
              {clock(flow.checked)} PT, {flow.tries} {flow.tries === 1 ? "check" : "checks"} so far
            </dd>
          </div>
        </dl>
        <div className="decide-actions">
          <button type="button" className="btn btn-quiet" onClick={stop}>
            Stop asking
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rule" aria-labelledby="rule-title">
      <p className="rule-k">Sandbox control, test disputes only</p>
      <h3 id="rule-title" className="rule-title">
        Ask PayPal&rsquo;s sandbox to rule
      </h3>
      <p className="decide-msg">On a live account PayPal decides on its own and nobody can ask it. The sandbox opens this step a few minutes after a filing.</p>
      <fieldset className="rule-pick" disabled={flow.at === "sending"} aria-label="Who wins">
        {(["SELLER_FAVOR", "BUYER_FAVOR"] as const).map((o) => (
          <label key={o} className="rule-opt">
            <input type="radio" name={`rule-${caseId}`} value={o} checked={outcome === o} onChange={() => setOutcome(o)} />
            <span>{o === "SELLER_FAVOR" ? "Seller wins" : "Buyer wins"}</span>
          </label>
        ))}
      </fieldset>
      {flow.at === "error" && !flow.retry ? null : (
        <div className="decide-actions">
          <button
            type="button"
            className={`btn btn-go${flow.at === "sending" ? " btn-run" : ""}`}
            aria-disabled={flow.at === "sending" || undefined}
            onClick={() => flow.at !== "sending" && void ask(outcome, 1)}
          >
            {flow.at === "sending" ? "Asking PayPal’s sandbox" : flow.at === "error" || flow.at === "limited" ? "Ask again" : "Ask for the ruling"}
          </button>
        </div>
      )}
      {flow.at === "limited" && (
        <p className="decide-msg decide-error decide-in" role="alert">
          The sandbox takes a set number of demo requests an hour.{flow.resetAt ? ` Ask again after ${clock(flow.resetAt)} PT.` : " Ask again later."}
        </p>
      )}
      {flow.at === "error" && (
        <p className="decide-msg decide-error decide-in" role="alert">
          {flow.message}
        </p>
      )}
    </section>
  );
}
