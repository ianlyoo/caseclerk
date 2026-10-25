"use client";
// The decision sheet: the one dark surface. It rises when a case needs the seller, and only then.
// Approve opens a 4 s undo window (the button fills, ink on paper, left to right); then the POST goes out, the
// sheet holds until PayPal answers, shows that answer (status and debug id) inside the sheet for 1.5 s, and
// collapses to one line with the time PayPal took it. On a staged sample the answer line says nothing was sent.
import { AnimatePresence, motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { useEffect, useState } from "react";
import { clock, usd, type Approval } from "../_lib/data";
import type { Phase } from "./store";
import { useT } from "./motion";
import s from "../b.module.css";

const SPRING = { type: "spring", stiffness: 420, damping: 41, mass: 1 } as const;
export const UNDO_MS = 4000;
export const LANDED_MS = 1500;
/** Asks the evidence pack on the page to open its reader at the first page. */
export const OPEN_PACK = "caseclerk-b-open-pack";

type Props = {
  a: Approval;
  phase: Phase;
  real: boolean;
  sent?: { at: string; debugId?: string };
  error?: { name: string; debugId?: string };
  onApprove: () => void;
  onUndo: () => void;
  onSendNow: () => void;
  onRetry: () => void;
};

export function Sheet({ a, phase, real, sent, error, onApprove, onUndo, onSendNow, onRetry }: Props) {
  const T = useT();
  const [declined, setDeclined] = useState(false);
  const up = phase === "pending" || phase === "undo" || phase === "sending" || phase === "landed" || phase === "failed";
  return (
    <AnimatePresence mode="wait" initial={true}>
      {up ? (
        <motion.section
          key="sheet"
          className={s.sheetDark}
          data-object
          aria-label="Your decision"
          data-sheet
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%", transition: T({ duration: 0.42, ease: [0.65, 0, 0.35, 1] }) }}
          transition={T(SPRING)}
          data-cause="agent-step"
        >
          <div className={s.sdInner}>
            <div className={s.sdTop}>
              <p className={s.sdLabel}>
                <span>
                  {phase === "landed" ? "Filed with PayPal" : "Waiting for you"}
                  {real ? <span className={s.sdSample}>Real PayPal sandbox case</span> : <span className={s.sdSample}>Staged sample: nothing goes to PayPal</span>}
                </span>
                <span className={s.sdAmtLabel}>At stake</span>
              </p>
              <h2 className={s.sdHead}>{phase === "landed" ? `${a.sentLine}.` : a.head}</h2>
              <p className={s.sdAmt} data-cause="approve">
                <NumberFlow value={Number(a.amount)} format={{ style: "currency", currency: "USD" }} />
              </p>
            </div>
            <p className={s.sdNote}>
              <span className={s.sdInline}>What PayPal receives: </span>
              {a.receives}
            </p>
            <AnimatePresence mode="wait" initial={false}>
              {phase === "landed" ? (
                <motion.p
                  key="landed"
                  className={s.sdLanded}
                  role="status"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={T({ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] })}
                  data-cause="paypal-call"
                  data-wire-line
                  data-origin="paypal"
                  data-sample={real ? undefined : ""}
                >
                  <span className={s.sdLandedDir}>{real ? "PayPal answered" : "Staged"}</span>
                  <code>{a.name}</code>
                  {real ? (
                    <>
                      <code className={s.sdOk}>200</code>
                      {sent?.debugId ? <code className={s.sdId}>debug id {sent.debugId}</code> : null}
                    </>
                  ) : (
                    <span className={s.sdLandedNote}>on a real case PayPal answers 200 here, with a debug id</span>
                  )}
                </motion.p>
              ) : (
                <motion.div key="act" className={s.sdAct} initial={false} exit={{ opacity: 0, transition: { duration: 0 } }}>
                  {a.rec && !declined ? (
                    <p className={s.sdRec}>
                      {a.rec.call} <span className={s.sdRecCost}>{a.rec.cost} </span>
                      <button type="button" className={s.sdText} onClick={() => document.dispatchEvent(new CustomEvent(OPEN_PACK))}>
                        Review the evidence
                      </button>
                    </p>
                  ) : null}
                  <p className={s.sdPolicy}>
                    {declined ? "You declined. Nothing was sent; the case stays open and the deadline still runs." : a.policy}
                  </p>
                  {phase === "failed" ? (
                    <p className={s.sdFail} role="alert">
                      Nothing was sent. PayPal answered {error?.name ?? "with an error"}
                      {error?.debugId ? `, debug id ${error.debugId}` : ""}.{" "}
                      <button type="button" className={s.sdText} onClick={onRetry}>
                        Try again
                      </button>
                    </p>
                  ) : null}
                  <div className={s.sdBtns}>
                    {phase === "pending" || phase === "failed" ? (
                      <button type="button" className={s.sdText} onClick={() => setDeclined((d) => !d)}>
                        {declined ? "Bring the recommendation back" : a.decline}
                      </button>
                    ) : phase === "undo" ? (
                      <>
                        <button type="button" className={s.sdText} onClick={onUndo}>
                          Undo
                        </button>
                        <button type="button" className={s.sdText} onClick={onSendNow}>
                          Send now
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      className={s.approve}
                      onClick={phase === "pending" ? onApprove : undefined}
                      disabled={declined || phase === "sending"}
                      aria-disabled={phase !== "pending"}
                      data-phase={phase}
                    >
                      <motion.span
                        className={s.approveFill}
                        aria-hidden
                        initial={false}
                        animate={{ scaleX: phase === "undo" || phase === "sending" ? 1 : 0 }}
                        transition={phase === "undo" ? T({ duration: UNDO_MS / 1000, ease: "linear" }) : T({ duration: 0.16 })}
                        data-cause="approve"
                      />
                      <span className={s.approveText}>
                        {phase === "undo" ? "Sending in a moment" : phase === "sending" ? (real ? "Sending to PayPal" : "Staging the call") : a.button}
                      </span>
                      {phase === "sending" ? <span className={s.inflightDark} data-inflight data-cause="paypal-call" aria-hidden /> : null}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      ) : phase === "sent" ? (
        <motion.section
          key="bar"
          className={s.sheetBar}
          data-object
          aria-label="Sent"
          data-sheet
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={T({ duration: 0.42, ease: [0.2, 0.8, 0.2, 1] })}
          data-cause="paypal-call"
        >
          <p className={s.sbLine} role="status">
            {real ? a.sentLine : "Staged: evidence filed"} <time>{sent ? `${clock(sent.at)} PT` : ""}</time>
            {real ? sent?.debugId ? <code className={s.sdId}>debug id {sent.debugId}</code> : null : <span className={s.sdSample}>Staged sample: nothing went to PayPal</span>}
          </p>
          <p className={s.sbAmt}>
            {usd(a.amount)}
            <span className={s.sbState}>PayPal is deciding</span>
          </p>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}

/** A figure that rolls up from zero when it appears (the money that just moved). */
export function CountUp({ to, from = 0 }: { to: number; from?: number }) {
  const [v, setV] = useState(from);
  useEffect(() => {
    const t = setTimeout(() => setV(to), 60);
    return () => clearTimeout(t);
  }, [to]);
  return (
    <span data-cause="approve">
      <NumberFlow value={v} format={{ style: "currency", currency: "USD" }} transformTiming={{ duration: 900, easing: "cubic-bezier(.2,.8,.2,1)" }} spinTiming={{ duration: 900, easing: "cubic-bezier(.2,.8,.2,1)" }} />
    </span>
  );
}

export { usd };
