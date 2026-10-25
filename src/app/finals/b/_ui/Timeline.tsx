"use client";
// The case timeline, newest first. PayPal traffic is a first-class row: what happened in words, then method,
// endpoint, status and the ids PayPal gave us. Real rows carry the PayPal-blue rule; staged sample rows a dashed
// one and the word "staged" where a status would be, because nothing in them went to PayPal.
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { clock, dayOf } from "../_lib/data";
import type { LiveRow } from "./store";
import { useT } from "./motion";
import s from "../b.module.css";

const EASE = [0.2, 0.8, 0.2, 1] as const;

export type { LiveRow };

export function PayPalRow({ r, real }: { r: Extract<LiveRow, { kind: "paypal" }>; real: boolean }) {
  const T = useT();
  const ids = r.debugId || r.eventId;
  return (
    <div className={s.pp} data-origin="paypal" data-wire-line data-sample={real ? undefined : ""}>
      <p className={s.ppHead}>
        <span className={s.ppDir}>{r.dir === "in" ? "From PayPal" : "To PayPal"}</span>
        <code className={s.ppName}>{r.name}</code>
        {!real && !r.inflight ? (
          <code className={s.ppStaged}>staged</code>
        ) : r.status ? (
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
            {r.method}{" "}
            {/* Long PayPal paths break after a slash, never inside a word. */}
            {r.path?.split("/").map((seg, i) => (
              <span key={i}>
                {i ? "/" : ""}
                {seg}
                <wbr />
              </span>
            ))}
          </code>
        ) : null}
        {ids ? (
          <>
            {r.debugId ? <code className={s.ppId}>debug id {r.debugId}</code> : null}
            {r.eventId ? <code className={s.ppId}>event {r.eventId}</code> : null}
          </>
        ) : !real && !r.inflight ? (
          <span className={s.ppSample}>Staged sample: no PayPal ids</span>
        ) : null}
      </p>
      {r.inflight ? <span className={s.inflight} data-inflight data-cause="paypal-call" aria-hidden /> : null}
    </div>
  );
}

type PP = Extract<LiveRow, { kind: "paypal" }>;
/** Housekeeping at PayPal's boundary: reads, webhook signature checks and the tracker write after a filing. */
const routine = (r: LiveRow): r is PP =>
  r.kind === "paypal" && r.dir === "out" && !r.inflight && (r.method === "GET" || r.name === "verify-webhook-signature" || r.name === "update tracker");
/** A receipt: something PayPal said (a webhook) or something CaseClerk asked PayPal to do (a POST). */
const receipt = (r: LiveRow): r is PP => r.kind === "paypal" && !routine(r);
const keyOf = (r: LiveRow) =>
  r.kind === "paypal" ? r.k ?? r.debugId ?? r.eventId ?? `${r.at}-${r.name}` : `${r.at}-${r.kind}`;

type Item = { key: string; row: LiveRow } | { key: string; fold: PP[]; open: boolean };

/**
 * Newest first, with PayPal's latest receipt pinned on top (the filing's 200, the RESOLVED webhook, the UPDATED one
 * asking for evidence) and each run of routine calls folded into one line that opens in place.
 * While the decision sheet is up (`pending`), the agent's rows after PayPal's latest webhook are hidden: the sheet
 * is those rows (the recommendation and the pack), so the column opens on what PayPal last said.
 */
export function Timeline({ rows, real, limit, pending, fold = true }: { rows: LiveRow[]; real: boolean; limit?: number; pending?: boolean; fold?: boolean }) {
  const T = useT();
  const [opened, setOpened] = useState<Set<string>>(() => new Set());
  const sorted = [...rows].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const hook = pending ? sorted.find((r) => r.kind === "paypal" && r.dir === "in") : undefined;
  let list = hook ? sorted.filter((r) => r.kind !== "agent" || Date.parse(r.at) <= Date.parse(hook.at)) : sorted;
  const items: Item[] = [];
  if (fold) {
    const top = list.find(receipt);
    if (top) list = [top, ...list.filter((r) => r !== top)];
    let run: PP[] = [];
    const flush = () => {
      if (run.length > 1) {
        const key = `fold-${keyOf(run[run.length - 1])}`;
        const open = opened.has(key);
        items.push({ key, fold: run, open });
        if (open) run.forEach((r) => items.push({ key: keyOf(r), row: r }));
      } else run.forEach((r) => items.push({ key: keyOf(r), row: r }));
      run = [];
    };
    for (const r of list) {
      if (routine(r)) run.push(r);
      else {
        flush();
        items.push({ key: keyOf(r), row: r });
      }
    }
    flush();
  } else list.forEach((r) => items.push({ key: keyOf(r), row: r }));
  const toggle = (key: string) =>
    setOpened((x) => {
      const n = new Set(x);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  return (
    <ol className={s.tl} aria-label="What happened, newest first">
      <AnimatePresence initial={false}>
        {items.slice(0, limit).map((it) => {
          if ("fold" in it) {
            const names = [...new Set(it.fold.map((r) => r.name))];
            const newest = it.fold[0];
            return (
              <motion.li
                key={it.key}
                layout="position"
                className={`${s.tlRow} ${s.tlPP}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0 } }}
                transition={T({ duration: 0.42, ease: EASE, opacity: { duration: 0.2, delay: 0.42 } })}
              >
                <time className={s.tlTime} dateTime={newest.at}>
                  <span>{dayOf(newest.at)}</span>
                  <span>{clock(newest.at)} PT</span>
                </time>
                <div className={s.tlBody}>
                  <button type="button" className={s.fold} data-origin="paypal" aria-expanded={it.open} onClick={() => toggle(it.key)}>
                    <span className={s.ppDir}>To PayPal</span>
                    <span className={s.foldSay}>
                      {it.fold.length} routine calls:{" "}
                      {names.map((n, i) => (
                        <span key={n}>
                          <code>{n}</code>
                          {i < names.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </span>
                    {it.fold.find((r) => r.debugId) ? <code className={s.ppId}>debug id {it.fold.find((r) => r.debugId)!.debugId}</code> : null}
                    <span className={s.foldTog}>{it.open ? "Fold" : "Show"}</span>
                  </button>
                </div>
              </motion.li>
            );
          }
          const r = it.row;
          return (
            <motion.li
              key={it.key}
              layout="position"
              className={`${s.tlRow} ${r.kind === "paypal" ? s.tlPP : ""}`}
              // A row a poll adds shows only after its neighbours have moved, so no two rows ever share a line.
              initial={r.fresh ? { opacity: 0, y: -10 } : { opacity: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
              transition={T({ duration: 0.42, ease: EASE, opacity: r.fresh ? { duration: 0.42, ease: EASE } : { duration: 0.2, delay: 0.42 } })}
              data-cause={r.fresh ? (r.kind === "paypal" ? "paypal-call" : "agent-step") : undefined}
            >
              <time className={s.tlTime} dateTime={r.at}>
                <span>{dayOf(r.at)}</span>
                <span>{clock(r.at)} PT</span>
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
