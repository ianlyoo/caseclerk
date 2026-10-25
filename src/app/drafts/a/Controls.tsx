"use client";

import { useState } from "react";
import { HERO, usd } from "../_data";
import s from "./a.module.css";

type Phase = "waiting" | "sending" | "sent" | "denied";

export function Approval() {
  const [phase, setPhase] = useState<Phase>("waiting");

  function approve() {
    setPhase("sending");
    setTimeout(() => setPhase("sent"), 900);
  }

  if (phase === "sent") {
    return (
      <div className={s.decided}>
        <p className={s.okLine}>Offer of {usd(HERO.approval.amount)} sent to PayPal.</p>
        <p className={s.muted}>make-offer returned 200, debug id 3c81e0f5a9d27. The agent watches for the buyer&rsquo;s answer.</p>
        <button className={s.textBtn} onClick={() => setPhase("waiting")}>
          Back to the proposal
        </button>
      </div>
    );
  }
  if (phase === "denied") {
    return (
      <div className={s.decided}>
        <p>Denied. The agent will submit the evidence pack instead.</p>
        <button className={s.textBtn} onClick={() => setPhase("waiting")}>
          Undo
        </button>
      </div>
    );
  }
  return (
    <div className={s.actions}>
      <button className={s.primary} onClick={approve} disabled={phase === "sending"}>
        {phase === "sending" ? "Sending to PayPal" : `Approve ${usd(HERO.approval.amount)} offer`}
      </button>
      <button className={s.textBtn} onClick={() => setPhase("denied")}>
        Deny, fight with evidence
      </button>
    </div>
  );
}

const SIM = [
  { key: "require", label: "Require evidence" },
  { key: "seller", label: "Adjudicate for seller" },
  { key: "buyer", label: "Adjudicate for buyer" },
];

export function Sandbox() {
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className={s.sandboxCtl}>
      <p className={s.muted}>Sandbox simulators, test disputes only</p>
      <div className={s.simRow}>
        {SIM.map((x) => (
          <button key={x.key} className={s.simBtn} onClick={() => setLast(x.label)}>
            {x.label}
          </button>
        ))}
      </div>
      {last && <p className={s.muted}>{last}: request sent, PayPal answers by webhook in 1 to 4 minutes.</p>}
    </div>
  );
}
