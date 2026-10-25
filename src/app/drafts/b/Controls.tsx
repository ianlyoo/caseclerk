"use client";

import { useState } from "react";
import { HERO, usd } from "../_data";
import s from "./b.module.css";

type Phase = "waiting" | "sending" | "sent" | "denied";

export function Decide() {
  const [phase, setPhase] = useState<Phase>("waiting");

  if (phase === "sent") {
    return (
      <div className={s.outcome}>
        <p className={s.green}>You approved it. The {usd(HERO.approval.amount)} offer is with PayPal.</p>
        <p className={s.quiet}>
          make-offer returned 200, debug id 3c81e0f5a9d27. The agent reads Daniel&rsquo;s answer when PayPal sends it.{" "}
          <button className={s.inline} onClick={() => setPhase("waiting")}>
            Show the proposal again
          </button>
        </p>
      </div>
    );
  }
  if (phase === "denied") {
    return (
      <div className={s.outcome}>
        <p>You declined. The agent will submit the evidence pack to PayPal instead.</p>
        <p className={s.quiet}>
          <button className={s.inline} onClick={() => setPhase("waiting")}>
            Undo
          </button>
        </p>
      </div>
    );
  }
  return (
    <div className={s.decide}>
      <button
        className={s.approve}
        disabled={phase === "sending"}
        onClick={() => {
          setPhase("sending");
          setTimeout(() => setPhase("sent"), 900);
        }}
      >
        {phase === "sending" ? "Sending the offer" : "Approve and send the offer"}
      </button>
      <button className={s.decline} onClick={() => setPhase("denied")}>
        Decline, fight it with evidence
      </button>
    </div>
  );
}

export function SandboxLine() {
  const [last, setLast] = useState<string | null>(null);
  const items = ["require evidence", "adjudicate for the seller", "adjudicate for the buyer"];
  return (
    <p className={s.sandboxLine}>
      PayPal sandbox, test disputes only:{" "}
      {items.map((x, i) => (
        <span key={x}>
          <button className={s.inline} onClick={() => setLast(x)}>
            {x}
          </button>
          {i < items.length - 1 ? ", " : "."}
        </span>
      ))}
      {last && <span className={s.quiet}> Sent &ldquo;{last}&rdquo;; PayPal answers by webhook in 1 to 4 minutes.</span>}
    </p>
  );
}
