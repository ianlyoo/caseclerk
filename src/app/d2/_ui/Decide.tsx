"use client";
// The one control on a waiting case: the seller's yes or no above their line.
// Yes → confirm in place → a short undo window → sending → PayPal's answer, which the page then shows everywhere.
// A case kept for the demo recording is never sent from here.
import { useEffect, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import { RESERVED_ACTIONS } from "../_lib/routes";
import type { Answer } from "../_lib/caseModel";

const UNDO_MS = 5000;

type Kind = "approve" | "deny";
type Flow =
  | { at: "idle" }
  | { at: "confirm"; kind: Kind }
  | { at: "undo"; kind: Kind; until: number }
  | { at: "sending"; kind: Kind }
  | { at: "error"; kind: Kind; message: string; retry: boolean }
  | { at: "held" };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Decide({
  actionId,
  exhibits,
  onAnswer,
  onStale,
  onPhase,
}: {
  actionId: string;
  exhibits: number;
  onAnswer: (a: Answer) => void;
  /** Someone else answered first: reload the case. */
  onStale: () => void;
  /** Tells the page when a filing is under way, so the scale can show it. */
  onPhase?: (sending: boolean) => void;
}) {
  const [flow, setFlow] = useState<Flow>({ at: "idle" });
  const [left, setLeft] = useState(UNDO_MS / 1000);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => onPhase?.(flow.at === "sending" || flow.at === "undo"), [flow.at, onPhase]);

  // the undo window counts down in whole seconds
  useEffect(() => {
    if (flow.at !== "undo") return;
    const tick = () => setLeft(Math.max(0, Math.ceil((flow.until - Date.now()) / 1000)));
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [flow]);

  function yes(kind: Kind) {
    if (RESERVED_ACTIONS.includes(actionId)) return setFlow({ at: "held" });
    const until = Date.now() + UNDO_MS;
    setFlow({ at: "undo", kind, until });
    timer.current = window.setTimeout(() => void send(kind), UNDO_MS);
  }

  function undo() {
    window.clearTimeout(timer.current);
    setFlow({ at: "idle" });
  }

  async function send(kind: Kind) {
    if (RESERVED_ACTIONS.includes(actionId)) return setFlow({ at: "held" });
    setFlow({ at: "sending", kind });
    const started = performance.now();
    try {
      const res = await fetch(`/api/actions/${actionId}/${kind}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const body = (await res.json().catch(() => ({}))) as { status?: number | null; debugId?: string | null; at?: string; error?: { message?: string } };
      await wait(Math.max(0, 900 - (performance.now() - started))); // the sending step stays long enough to read
      if (res.ok) {
        onAnswer({ kind, actionId, status: body.status ?? null, debugId: body.debugId ?? null, at: body.at ?? new Date().toISOString() });
        return;
      }
      if (res.status === 409) {
        setFlow({ at: "error", kind, message: body.error?.message ?? "This case was already answered.", retry: false });
        onStale();
        return;
      }
      setFlow({
        at: "error",
        kind,
        message: `${body.error?.message ?? `CaseClerk answered ${res.status}.`} Nothing changed on the case.`,
        retry: true,
      });
    } catch {
      setFlow({ at: "error", kind, message: "Couldn't reach CaseClerk, so nothing was sent. Check the connection and try again.", retry: true });
    }
  }

  const what = exhibits ? `${exhibits} ${exhibits === 1 ? "exhibit" : "exhibits"}` : "the evidence";

  if (flow.at === "confirm") {
    return (
      <div className="decide-wrap" key="confirm">
        <p className="decide-msg decide-in">
          {flow.kind === "approve" ? `CaseClerk sends ${what} to PayPal as one filing. PayPal can't take it back.` : "Nothing is sent to PayPal. The case stays with you."}
        </p>
        <div className="decide-actions decide-in" role="group" aria-label="Confirm">
          <button type="button" className="btn btn-go" onClick={() => yes(flow.kind)} autoFocus>
            {flow.kind === "approve" ? "Yes, file it" : "Yes, don’t file"}
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => setFlow({ at: "idle" })}>
            Back
          </button>
        </div>
      </div>
    );
  }

  if (flow.at === "undo" || flow.at === "sending") {
    const sending = flow.at === "sending";
    return (
      <div className="decide-wrap" key="run">
        <p className="decide-msg" role="status" aria-live="polite">
          {sending ? "Sending to PayPal. Keep this page open." : flow.kind === "approve" ? "Filing with PayPal. You can still undo." : "Saying no. You can still undo."}
        </p>
        <div className="decide-actions" role="group" aria-label={sending ? "Sending" : "Undo"}>
          <div className="btn btn-go btn-run" data-sending={sending || undefined} aria-hidden="true">
            {sending ? (
              "Sending"
            ) : (
              <>
                {flow.kind === "approve" ? "Filing in" : "Saying no in"}&nbsp;
                <NumberFlow value={left} className="decide-count" />
                &nbsp;s
              </>
            )}
            <span className="btn-run-bar" style={{ animationDuration: `${UNDO_MS}ms` }} />
          </div>
          <button type="button" className="btn btn-quiet" onClick={undo} disabled={sending} autoFocus>
            Undo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="decide-wrap" key="idle">
      <div className="decide-actions">
        <button type="button" className="btn btn-go" onClick={() => setFlow({ at: "confirm", kind: "approve" })}>
          {flow.at === "error" && flow.retry && flow.kind === "approve" ? "Try filing again" : "File the evidence"}
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => setFlow({ at: "confirm", kind: "deny" })}>
          Don&rsquo;t file
        </button>
      </div>
      {flow.at === "error" && (
        <p className="decide-msg decide-error decide-in" role="alert">
          {flow.message}
        </p>
      )}
      {flow.at === "held" && (
        <p className="decide-msg decide-in" role="status">
          This sandbox case is kept waiting for the demo recording, so nothing was sent to PayPal.
        </p>
      )}
    </div>
  );
}
