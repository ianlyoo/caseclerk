"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { CASES, EVIDENCE_GATE_USD, POLICY, usd } from "../../_shared/data";
import { REAL, REAL_ID, REAL_WIRE } from "../../_shared/real";
import { BASE, EASE_OUT, HERO_HREF, Masthead, Wire, countWord, realDay } from "../ui";
import s from "../a.module.css";

const byId = (id: string) => CASES.find((c) => c.id === id)!;
const grace = byId("PP-R-TVA-10227066");
const daniel = byId("PP-R-NKT-10227591");
const olivia = byId("PP-R-SOF-10225302");
const second = REAL.decisions[1];
const pct = (n: number) => `${Math.round(n)}%`;
const oliviaPct = (Number(olivia.settledUsd) / Number(olivia.amount)) * 100;
const first = (name: string) => name.split(" ")[0];
const thing = (item: string) => item.split(",")[0];

type Rule = { key: string; rule: ReactNode; where: ReactNode };

const RULES: Rule[] = [
  {
    key: "auto",
    rule: <>Refunds of {usd(POLICY.autoRefundMaxUsd)} or less go out without asking you.</>,
    where: (
      <>
        No case this month was that small. The closest, <Link href={BASE}>the {usd(REAL.amount)} chargeback in the real run</Link>, was over the line, so the agent weighed it instead of refunding.
      </>
    ),
  },
  {
    key: "money",
    rule: <>Any money action above {usd(POLICY.approvalAboveUsd)} waits for you.</>,
    where: (
      <>
        <Link href={`${BASE}/case/${grace.id}`}>
          {first(grace.buyer)} {grace.buyer.split(" ")[1]}&rsquo;s {usd(grace.amount)} refund
        </Link>{" "}
        is ready and waiting for your yes.
      </>
    ),
  },
  {
    key: "evidence",
    rule: <>Filing evidence on a case of {usd(EVIDENCE_GATE_USD)} or more waits for you.</>,
    where: (
      <>
        <Link href={HERO_HREF}>
          {first(daniel.buyer)} {daniel.buyer.split(" ")[1]}&rsquo;s {usd(daniel.amount)} {thing(daniel.item)}
        </Link>
        : the evidence pack is ready to file when you say so.
      </>
    ),
  },
  {
    key: "fight",
    rule: <>It fights only at {pct(POLICY.minWinProbabilityToFight * 100)} or better to win; below that it refunds or offers, if that costs you less.</>,
    where: (
      <>
        <Link href={HERO_HREF}>{thing(daniel.item)}</Link>: 55% to win, so it fights. In <Link href={BASE}>the real run</Link>, PayPal&rsquo;s second ask came at {second.winPct}%, but fighting still cost less ({usd(second.evFight.slice(1))} against {usd(second.evRefund.slice(1))} for a refund), so it filed again.
      </>
    ),
  },
  {
    key: "offer",
    rule: <>Offers stay at or under {pct(POLICY.maxOfferPercent)} of the order.</>,
    where: (
      <>
        <Link href={`${BASE}/case/${olivia.id}`}>
          {first(olivia.buyer)} {olivia.buyer.split(" ")[1]}&rsquo;s {thing(olivia.item)}
        </Link>
        : {usd(olivia.settledUsd!)} of {usd(olivia.amount)}, {pct(oliviaPct)}. She accepted and kept the camera.
      </>
    ),
  },
  {
    key: "voice",
    rule: <>Every message to a buyer is written in your voice: &ldquo;{POLICY.voice}&rdquo;</>,
    where: (
      <>
        <Link href={HERO_HREF}>The letter for {first(daniel.buyer)}&rsquo;s case</Link> answers the claim point by point and doesn&rsquo;t blame him.
      </>
    ),
  },
];

/** Preview mode: the switch is real on the live app; here it only changes this page. */
function PreviewSwitch() {
  const reduce = useReducedMotion();
  const [on, setOn] = useState(POLICY.dryRun);
  const line = on
    ? "Preview mode is on: the agent drafts every action and calls nothing on PayPal. You send each one yourself."
    : "Preview mode is off: within the rules above, the agent calls PayPal itself.";
  return (
    <li className={s.rule} data-rule="preview">
      <div className={s.ruleHead}>
        <button className={s.switch} role="switch" aria-checked={on} onClick={() => setOn((v) => !v)} data-switch>
          <motion.span
            className={s.switchKnob}
            animate={{ x: on ? 20 : 0 }}
            transition={reduce ? { duration: 0.1 } : { duration: 0.24, ease: EASE_OUT }}
            data-cause="policy-switch"
          />
        </button>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={String(on)}
            className={s.ruleText}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.1 : 0.16 }}
            data-cause="policy-switch"
          >
            {line}
          </motion.p>
        </AnimatePresence>
      </div>
      <p className={s.ruleWhere}>Changing it here is a preview: this page saves nothing. Every sample case on this site was worked with preview mode off.</p>
    </li>
  );
}

export default function FinalAPolicy() {
  return (
    <div className={`${s.app} ${s.wInbox}`}>
      <div className={s.paper}>
        <Masthead here="policy" />
        <main className={s.inbox}>
          <h1 className={s.headline}>{countWord(RULES.length + 1, true)} rules CaseClerk follows on every case, and where each one applied.</h1>
          <ol className={s.rules}>
            {RULES.map((r) => (
              <li key={r.key} className={s.rule} data-rule={r.key}>
                <p className={s.ruleText}>{r.rule}</p>
                <p className={s.ruleWhere}>{r.where}</p>
              </li>
            ))}
            <PreviewSwitch />
          </ol>
        </main>
        <p className={s.foot}>These are the app&rsquo;s default rules. The cases they link to are sample cases, apart from the real run.</p>
      </div>
      <Wire
        sections={[
          {
            key: "real",
            label: (
              <>
                PayPal, latest real run: <Link href={BASE}>{REAL_ID}</Link>, {realDay(REAL_WIRE[0].at)}
              </>
            ),
            lines: REAL_WIRE.map((l) => ({ ...l, key: `real-${l.at}` })),
          },
        ]}
      />
    </div>
  );
}
