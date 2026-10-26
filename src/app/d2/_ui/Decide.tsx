"use client";
// The one control on a waiting case: the seller's yes or no above their line, each confirmed once.
// The demo case's action is never sent from here: it is kept waiting for the owner's recording.
import { useState } from "react";

const KEPT_FOR_DEMO = new Set(["dce5fede-e03a-4d4e-8e99-d88af7bb177d"]);

type Kind = "approve" | "deny";
type Phase = { at: "idle" } | { at: "confirm" | "sending"; kind: Kind } | { at: "said"; text: string };

export function Decide({ actionId }: { actionId: string }) {
  const [phase, setPhase] = useState<Phase>({ at: "idle" });

  async function send(kind: Kind) {
    if (KEPT_FOR_DEMO.has(actionId)) {
      setPhase({ at: "said", text: "This sandbox case is kept waiting for the demo recording, so nothing was sent to PayPal." });
      return;
    }
    setPhase({ at: "sending", kind });
    try {
      const res = await fetch(`/api/actions/${actionId}/${kind}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const body = (await res.json().catch(() => ({}))) as { status?: number; error?: { message?: string } };
      if (!res.ok) throw new Error(body.error?.message ?? `CaseClerk answered ${res.status}.`);
      setPhase({ at: "said", text: kind === "approve" ? `Filed. PayPal answered ${body.status ?? 200}.` : "Not filed. The case stays with you." });
    } catch (e) {
      setPhase({ at: "said", text: e instanceof Error ? e.message : "Something went wrong. Try again." });
    }
  }

  if (phase.at === "confirm" || phase.at === "sending") {
    const busy = phase.at === "sending";
    return (
      <div className="decide-actions" role="group" aria-label="Confirm">
        <button type="button" className="btn btn-go" onClick={() => send(phase.kind)} disabled={busy}>
          {busy ? "Sending…" : phase.kind === "approve" ? "Yes, file it" : "Yes, don’t file"}
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => setPhase({ at: "idle" })} disabled={busy}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="decide-wrap">
      <div className="decide-actions">
        <button type="button" className="btn btn-go" onClick={() => setPhase({ at: "confirm", kind: "approve" })}>
          File the evidence
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => setPhase({ at: "confirm", kind: "deny" })}>
          Don&rsquo;t file
        </button>
      </div>
      {phase.at === "said" && (
        <p className="decide-msg" role="status">
          {phase.text}
        </p>
      )}
    </div>
  );
}
