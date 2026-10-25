"use client";

import { useState } from "react";
import { ago, usd } from "../_data";
import { caseDetail, decisionSteps, keptAfter } from "../_cases";
import { useDecision, usePendingApprovals, usePhase } from "../_store";
import { BStep } from "./Rows";
import s from "./b.module.css";

export function WaitingCount() {
  return <>{usePendingApprovals()}</>;
}

/** The one-line state of a case in the inbox, after the seller acts on it. */
export function StateWord({ id, label, green }: { id: string; label: string; green: boolean }) {
  const phase = usePhase(id);
  if (phase === "closed") return <span className={s.ink}>Settled.</span>;
  if (phase === "sent") return <span className={s.ink}>Offer with the buyer.</span>;
  if (phase === "approved") return <span className={s.ink}>Sending to PayPal.</span>;
  if (phase === "denied") return <span className={s.ink}>Agent working.</span>;
  return <span className={green ? s.green : s.ink}>{label}.</span>;
}

/** "Live on PayPal sandbox": the last verified webhook and the last debug id PayPal returned. */
export function Live({ id }: { id: string }) {
  const d = caseDetail(id)!;
  const phase = usePhase(id);
  const sent = (phase === "sent" || phase === "closed") && d.approval;
  return (
    <p className={s.live}>
      <span className={s.liveDot} aria-hidden />
      Live on PayPal sandbox. Webhook{" "}
      <span className={s.liveCode}>{phase === "closed" ? "CUSTOMER.DISPUTE.RESOLVED" : d.live.event}</span> verified{" "}
      {phase === "closed" ? "just now" : ago(d.live.at)}; last debug id{" "}
      <span className={s.liveCode}>{sent ? d.approval!.debugId : d.live.debugId}</span>.
    </p>
  );
}

/** Left margin of the recommendation: where the decision stands, and what the agent did to get there. */
export function DecisionMargin({ id, did }: { id: string; did: string }) {
  const d = caseDetail(id)!;
  const a = d.approval!;
  const phase = usePhase(id);
  const line =
    phase === "closed" ? (
      <>
        <span className={s.green}>Settled</span>
        <br />
        You kept {usd(keptAfter(d))}.
      </>
    ) : phase === "sent" ? (
      <>
        <span className={s.green}>You approved it</span>
        <br />
        Sent to PayPal. Waiting for {d.c.buyer.split(" ")[0]}&rsquo;s answer.
      </>
    ) : phase === "approved" ? (
      <>
        <span className={s.green}>You approved it</span>
        <br />
        Going to PayPal in a few seconds.
      </>
    ) : phase === "denied" ? (
      <>
        You declined
        <br />
        The agent will fight with evidence.
      </>
    ) : (
      <>
        <span className={s.green}>Waiting for you</span>
        <br />
        {usd(a.amount)} is above your $50.00 line. Nothing reaches PayPal until you decide.
      </>
    );
  return (
    <p className={s.margin}>
      {line}
      <span className={s.did}>{did}</span>
    </p>
  );
}

export function Decide({ id }: { id: string }) {
  const d = caseDetail(id)!;
  const a = d.approval!;
  const { phase, approve, deny, undo } = useDecision(id);

  if (phase === "closed")
    return (
      <div className={s.outcome}>
        <p className={s.green}>
          {d.c.buyer.split(" ")[0]} took the {a.label}. PayPal closed the case; you kept {usd(keptAfter(d))}.
        </p>
      </div>
    );
  if (phase === "sent")
    return (
      <div className={s.outcome}>
        <p className={s.green}>You approved the {a.label}. It is with PayPal.</p>
        <p className={s.quiet}>
          PayPal returned 200, debug id <span className={s.mono}>{a.debugId}</span>. The agent reads the answer when
          PayPal&rsquo;s webhook arrives.
        </p>
      </div>
    );
  if (phase === "approved")
    return (
      <div className={s.outcome}>
        <p className={s.green}>Approved. Sending the {a.label} to PayPal.</p>
        <p className={s.quiet}>
          Goes out in a few seconds.{" "}
          <button className={s.inline} onClick={undo}>
            Undo
          </button>
        </p>
      </div>
    );
  if (phase === "denied")
    return (
      <div className={s.outcome}>
        <p>You declined. The agent will submit the evidence pack to PayPal instead.</p>
        <p className={s.quiet}>
          <button className={s.inline} onClick={undo}>
            Undo
          </button>
        </p>
      </div>
    );
  return (
    <div className={s.decide}>
      <button className={s.approve} onClick={approve}>
        Approve the {a.label}
      </button>
      <button className={s.decline} onClick={deny}>
        Decline, fight it with evidence
      </button>
    </div>
  );
}

export function Tail({ id }: { id: string }) {
  const d = caseDetail(id)!;
  const { phase, decidedAt } = useDecision(id);
  const steps = decisionSteps(d, phase, decidedAt);
  if (!steps.length) return null;
  return (
    <ol className={s.steps}>
      {steps.map((st) => (
        <BStep key={st.title} st={st} />
      ))}
    </ol>
  );
}

export function SandboxLine({ id }: { id: string }) {
  const [last, setLast] = useState<string | null>(null);
  const { phase, close, reset } = useDecision(id);
  const d = caseDetail(id)!;
  const items = ["require evidence", "adjudicate for the seller", "adjudicate for the buyer"];
  return (
    <p className={s.sandboxLine}>
      PayPal sandbox simulators:{" "}
      {phase === "sent" && d.approval && (
        <>
          <button className={s.inline} onClick={close}>
            the buyer accepts
          </button>
          ,{" "}
        </>
      )}
      {items.map((x) => (
        <span key={x}>
          <button className={s.inline} onClick={() => setLast(x)}>
            {x}
          </button>
          ,{" "}
        </span>
      ))}
      <button
        className={s.inline}
        onClick={() => {
          reset();
          setLast(null);
        }}
      >
        reset this demo case
      </button>
      .{last && <span> Sent &ldquo;{last}&rdquo;; PayPal answers by webhook in 1 to 4 minutes.</span>}
    </p>
  );
}

export function OpenTest() {
  const [state, setState] = useState<"idle" | "opening" | "opened">("idle");
  return (
    <>
      <button
        className={s.openTest}
        disabled={state !== "idle"}
        onClick={() => {
          setState("opening");
          setTimeout(() => setState("opened"), 1200);
        }}
      >
        {state === "opening" ? "Opening" : state === "opened" ? "Test dispute opened" : "Open a test dispute"}
      </button>
      <span className={s.quiet}>
        {state === "opened"
          ? " Sandbox payment and chargeback created; the case appears here in about 3 minutes."
          : " Creates a sandbox payment and chargeback; the case appears here in about 3 minutes."}
      </span>
    </>
  );
}

const WORDS = ["none", "one", "two", "three", "four", "five"];

export function WaitingWords() {
  const n = usePendingApprovals();
  return <>{WORDS[n] ?? n}</>;
}
