"use client";
// The case timeline, newest first. PayPal traffic is a first-class row: what happened in words,
// then method, endpoint, status and the ids PayPal gave us (real cases only).
import { AnimatePresence, motion } from "motion/react";
import { clock, dayOf } from "../_lib/data";
import type { LiveRow } from "./store";
import { useT } from "./motion";
import s from "../b.module.css";

const EASE = [0.2, 0.8, 0.2, 1] as const;

export type { LiveRow };

function PayPalRow({ r, real }: { r: Extract<LiveRow, { kind: "paypal" }>; real: boolean }) {
  const T = useT();
  const ids = r.debugId || r.eventId;
  return (
    <div className={s.pp} data-origin="paypal" data-wire-line data-sample={real ? undefined : ""}>
      <p className={s.ppHead}>
        <span className={s.ppDir}>{r.dir === "in" ? "From PayPal" : "To PayPal"}</span>
        <code className={s.ppName}>{r.name}</code>
        {r.status ? (
          <motion.code
            key={r.status}
            className={r.status === "200" || r.status === "verified" ? s.ppOk : s.ppStatus}
            initial={r.fresh ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={T({ duration: 0.32, delay: 0.12 })}
            data-cause="paypal-call"
          >
            {r.status}
          </motion.code>
        ) : r.inflight ? (
          <code className={s.ppStatus}>sending</code>
        ) : null}
      </p>
      <p className={s.ppSay}>{r.say}</p>
      <p className={s.ppIds}>
        {r.method ? (
          <code className={s.ppPath}>
            {r.method} {r.path}
          </code>
        ) : null}
        {ids ? (
          <>
            {r.debugId ? <code className={s.ppId}>debug id {r.debugId}</code> : null}
            {r.eventId ? <code className={s.ppId}>event {r.eventId}</code> : null}
          </>
        ) : !real && !r.inflight ? (
          <span className={s.ppSample}>Sample case: no PayPal ids</span>
        ) : null}
      </p>
      {r.inflight ? <span className={s.inflight} data-inflight data-cause="paypal-call" aria-hidden /> : null}
    </div>
  );
}

export function Timeline({ rows, real, limit }: { rows: LiveRow[]; real: boolean; limit?: number }) {
  const T = useT();
  const list = [...rows].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, limit);
  return (
    <ol className={s.tl} aria-label="What happened, newest first">
      <AnimatePresence initial={false}>
        {list.map((r) => {
          const key = `${r.at}-${r.kind}-${r.kind === "paypal" ? r.name : ""}`;
          return (
            <motion.li
              key={key}
              layout="position"
              className={`${s.tlRow} ${r.kind === "paypal" ? s.tlPP : ""}`}
              initial={r.fresh ? { opacity: 0, y: -10 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={T({ duration: 0.42, ease: EASE })}
              data-cause={r.fresh ? (r.kind === "paypal" ? "paypal-call" : "agent-step") : undefined}
            >
              <time className={s.tlTime} dateTime={r.at}>
                <span>{dayOf(r.at, real)}</span>
                <span>{clock(r.at, real)}</span>
              </time>
              <div className={s.tlBody}>
                {r.kind === "paypal" ? (
                  <PayPalRow r={r} real={real} />
                ) : r.kind === "buyer" ? (
                  <blockquote className={s.buyer}>&ldquo;{r.words}&rdquo;</blockquote>
                ) : (
                  <p className={s.tlSay}>
                    {r.say}
                    {r.kind === "agent" && r.detail ? <span className={s.tlDetail}> {r.detail}</span> : null}
                  </p>
                )}
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
}
