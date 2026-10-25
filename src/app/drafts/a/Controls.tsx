"use client";

import { useState } from "react";
import { ago, usd } from "../_data";
import { caseDetail, decisionSteps, keptAfter } from "../_cases";
import { usePendingApprovals, usePhase, useDecision } from "../_store";
import { StepRow } from "./Rows";
import s from "./a.module.css";

export function ApprovalCount({ className }: { className?: string }) {
  const n = usePendingApprovals();
  return n ? <span className={className}>{n}</span> : null;
}

/** The CaseClerk state word for an approval case, after the seller acts. */
export function DeskWord({ id, label, cls }: { id: string; label: string; cls: string }) {
  const phase = usePhase(id);
  if (phase === "closed") return <span className={s.st_refunded}>Settled</span>;
  if (phase === "sent") return <span className={s.st_waiting_paypal}>With the buyer</span>;
  if (phase === "approved") return <span className={s.st_waiting_paypal}>Sending to PayPal</span>;
  if (phase === "denied") return <span className={s.st_working}>Agent working</span>;
  return <span className={cls}>{label}</span>;
}

/** "Live on PayPal sandbox" line: the last webhook and the last debug id PayPal returned. */
export function LiveLine({ id }: { id: string }) {
  const d = caseDetail(id)!;
  const phase = usePhase(id);
  const sent = (phase === "sent" || phase === "closed") && d.approval;
  const event = phase === "closed" ? "CUSTOMER.DISPUTE.RESOLVED" : d.live.event;
  return (
    <p className={s.live}>
      <span className={s.liveDot} aria-hidden />
      Live on PayPal sandbox. Last webhook <span className={s.mono}>{event}</span>, verified{" "}
      {phase === "closed" ? "just now" : ago(d.live.at)}. Last debug id{" "}
      <span className={s.mono}>{sent ? d.approval!.debugId : d.live.debugId}</span>
      {sent ? `, from ${d.approval!.endpoint.split("/").at(-1)}.` : "."}
    </p>
  );
}

/** Timeline rows the seller's decision adds. */
export function TailRows({ id }: { id: string }) {
  const d = caseDetail(id)!;
  const { phase, decidedAt } = useDecision(id);
  return (
    <>
      {decisionSteps(d, phase, decidedAt).map((st) => (
        <StepRow key={st.title} st={st} />
      ))}
    </>
  );
}

/** The ask in the rail: what will happen, the exact note, Approve / Deny, and what happened after. */
export function Ask({ id }: { id: string }) {
  const d = caseDetail(id)!;
  const a = d.approval!;
  const { phase, approve, deny, undo } = useDecision(id);

  if (phase === "closed")
    return (
      <section className={s.ask}>
        <h2 className={`${s.askHead} ${s.okHead}`}>Settled</h2>
        <p className={s.askAmt}>You kept {usd(keptAfter(d))}</p>
        <p className={s.muted}>
          {d.c.buyer.split(" ")[0]} took the {a.label}. PayPal closed the case, RESOLVED_BUYER_FAVOUR.
        </p>
      </section>
    );
  if (phase === "sent")
    return (
      <section className={s.ask}>
        <h2 className={`${s.askHead} ${s.okHead}`}>Offer sent to PayPal</h2>
        <p className={s.askAmt}>{a.label}</p>
        <p className={s.muted}>
          You approved it. PayPal returned 200, debug id <span className={s.mono}>{a.debugId}</span>. The agent reads the
          buyer&rsquo;s answer when PayPal&rsquo;s webhook arrives.
        </p>
      </section>
    );
  if (phase === "approved")
    return (
      <section className={s.ask}>
        <h2 className={s.askHead}>Sending to PayPal</h2>
        <p className={s.askAmt}>{a.label}</p>
        <div className={s.actions}>
          <span className={s.muted}>Goes out in a few seconds.</span>
          <button className={s.textBtn} onClick={undo}>
            Undo
          </button>
        </div>
      </section>
    );
  if (phase === "denied")
    return (
      <section className={s.ask}>
        <h2 className={s.askHead}>You declined</h2>
        <p className={s.muted}>The agent will submit the evidence pack to PayPal instead. Nothing has been sent yet.</p>
        <button className={s.textBtn} onClick={undo}>
          Undo
        </button>
      </section>
    );
  return (
    <section className={s.ask}>
      <h2 className={s.askHead}>Needs your approval</h2>
      <p className={s.askAmt}>{a.label}</p>
      <p className={s.muted}>{a.why}</p>
      <div className={s.actions}>
        <button className={s.primary} onClick={approve}>
          Approve {a.label}
        </button>
        <button className={s.textBtn} onClick={deny}>
          Deny, fight with evidence
        </button>
      </div>
      <div className={s.note}>
        <p className={s.noteHead}>The note PayPal sends with it</p>
        <p>{a.note}</p>
      </div>
    </section>
  );
}

export function Sandbox({ id }: { id: string }) {
  const [last, setLast] = useState<string | null>(null);
  const { phase, reset, close } = useDecision(id);
  const d = caseDetail(id)!;
  const sims = ["Require evidence", "Adjudicate for seller", "Adjudicate for buyer"];
  return (
    <div className={s.sandboxCtl}>
      <p className={s.muted}>PayPal sandbox simulators</p>
      <div className={s.simRow}>
        {phase === "sent" && d.approval && (
          <button className={s.simBtn} onClick={close}>
            Buyer accepts
          </button>
        )}
        {sims.map((x) => (
          <button key={x} className={s.simBtn} onClick={() => setLast(x)}>
            {x}
          </button>
        ))}
        <button className={s.simBtn} onClick={() => { reset(); setLast(null); }}>
          Reset demo
        </button>
      </div>
      {last && <p className={s.muted}>{last}: request sent to the sandbox; PayPal answers by webhook in 1 to 4 minutes.</p>}
    </div>
  );
}

export function OpenTest() {
  const [state, setState] = useState<"idle" | "opening" | "opened">("idle");
  return (
    <span className={s.openTest}>
      {state === "opened" && <span className={s.muted}>Sandbox payment and chargeback created. The case appears here in about 3 minutes.</span>}
      <button
        className={s.secondary}
        disabled={state !== "idle"}
        onClick={() => {
          setState("opening");
          setTimeout(() => setState("opened"), 1200);
        }}
      >
        {state === "opening" ? "Opening" : state === "opened" ? "Test dispute opened" : "Open test dispute"}
      </button>
    </span>
  );
}
