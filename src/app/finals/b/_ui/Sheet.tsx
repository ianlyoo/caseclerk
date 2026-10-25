"use client";
// The decision sheet: the one dark surface. It rises when a case needs the seller, and only then.
// Approve opens a 4 s undo window (the button fills with brass left to right); then the POST goes out,
// the sheet holds until PayPal answers, and collapses to one line with the time PayPal took it.
import { AnimatePresence, motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { useEffect, useState } from "react";
import { clock, usd, type Approval } from "../_lib/data";
import type { Phase } from "./store";
import { useT } from "./motion";
import s from "../b.module.css";

const SPRING = { type: "spring", stiffness: 420, damping: 41, mass: 1 } as const;
export const UNDO_MS = 4000;

type Props = {
  a: Approval;
  phase: Phase;
  real: boolean;
  sentAt?: string;
  error?: { name: string; debugId?: string };
  onApprove: () => void;
  onUndo: () => void;
  onSendNow: () => void;
  onRetry: () => void;
};

export function Sheet({ a, phase, real, sentAt, error, onApprove, onUndo, onSendNow, onRetry }: Props) {
  const T = useT();
  const [more, setMore] = useState(false);
  const [declined, setDeclined] = useState(false);
  const up = phase === "pending" || phase === "undo" || phase === "sending" || phase === "failed";
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
                  Waiting for you{real ? "" : <span className={s.sdSample}>Sample case</span>}
                </span>
                <span className={s.sdAmtLabel}>At stake</span>
              </p>
              <h2 className={s.sdHead}>{a.head}</h2>
              <p className={s.sdAmt} data-cause="approve">
                <NumberFlow value={Number(a.amount)} format={{ style: "currency", currency: "USD" }} />
              </p>
            </div>
            <div className={s.sdReceives}>
              <p className={more ? s.sdNoteAll : s.sdNote}>
                <span className={s.sdInline}>What PayPal receives: </span>
                {a.receives}
              </p>
              <button type="button" className={s.sdText} onClick={() => setMore((m) => !m)} aria-expanded={more}>
                {more ? "Show less" : "Show all"}
              </button>
            </div>
            <div className={s.sdAct}>
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
                    {phase === "undo" ? "Sending in a moment" : phase === "sending" ? "Sending to PayPal" : a.button}
                  </span>
                  {phase === "sending" ? <span className={s.inflightDark} data-inflight data-cause="paypal-call" aria-hidden /> : null}
                </button>
              </div>
            </div>
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
            {a.sentLine} <time>{sentAt ? clock(sentAt) : ""}</time>
            {real ? null : <span className={s.sdSample}>Sample case</span>}
          </p>
          <p className={s.sbAmt}>
            <CountUp to={Number(a.amount)} /> defended
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
