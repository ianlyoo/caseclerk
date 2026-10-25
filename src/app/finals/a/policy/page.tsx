"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { CASES, EVIDENCE_GATE_USD, POLICY, usd } from "../../_shared/data";
import { REAL, REAL_ID, REAL_WIRE } from "../../_shared/real";
import { BASE, EASE_OUT, SAMPLE_HERO_HREF, Masthead, Num, Wire, countWord, realDay, useRealCases } from "../ui";
import { pendingAction, realState, type ApiCase } from "../_real/model";
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

function rules(money: number, evidence: number): Rule[] {
  return [
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
    rule: <>Any money action above {usd(money)} waits for you.</>,
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
    rule: <>Filing evidence on a case of {usd(evidence)} or more waits for you.</>,
    where: (
      <>
        <Link href={SAMPLE_HERO_HREF}>
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
        <Link href={SAMPLE_HERO_HREF}>{thing(daniel.item)}</Link>: 55% to win, so it fights. In <Link href={BASE}>the real run</Link>, PayPal&rsquo;s second ask came at {second.winPct}%, but fighting still cost less ({usd(second.evFight.slice(1))} against {usd(second.evRefund.slice(1))} for a refund), so it filed again.
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
        <Link href={SAMPLE_HERO_HREF}>The letter for {first(daniel.buyer)}&rsquo;s case</Link> answers the claim point by point and doesn&rsquo;t blame him.
      </>
    ),
  },
  ];
}

/** Each open case's next step: what the agent will do next, and the money it moves. */
type Next = { label: string; amount: string; kind: "evidence" | "refund" | "message" | "none" };
const sample = (id: string, kind: Next["kind"]): Next => ({ label: `${first(byId(id).buyer)}\u2019s ${usd(byId(id).amount)}`, amount: byId(id).amount, kind });
const NEXT: Next[] = [
  sample("PP-R-PLZ-10225917", "evidence"),
  sample("PP-R-HBW-10226180", "message"),
  sample("PP-R-TVA-10227066", "refund"),
  sample("PP-R-NKT-10227591", "evidence"),
  sample("PP-R-JDM-10228390", "none"),
  sample("PP-R-CQF-10228844", "none"),
  sample("PP-R-WEX-10226653", "none"),
];
/** The open real sandbox cases, from the same production list as the inbox: a pending filing is an evidence case; PayPal deciding is none. */
const realNext = (real: ApiCase[]): Next[] =>
  real
    .filter((r) => realState(r) !== "resolved")
    .map((r) => ({ label: `the real ${usd(r.case.snapshot.amount.value)}`, amount: r.case.snapshot.amount.value, kind: pendingAction(r)?.kind === "provide_evidence" ? "evidence" : "none" }));
const waits = (next: Next[], money: number, evidence: number) =>
  next.filter((n) => (n.kind === "evidence" && Number(n.amount) >= evidence) || (n.kind === "refund" && Number(n.amount) > money));

/** A dollar value inside the sentence, edited in place. */
function Dollars({ value, set, label, name }: { value: number; set: (n: number) => void; label: string; name: string }) {
  const [text, setText] = useState(value.toFixed(2));
  return (
    <span className={s.dollar}>
      $
      <input
        className={s.dollarIn}
        value={text}
        inputMode="decimal"
        aria-label={label}
        data-policy-input={name}
        size={Math.max(4, text.length)}
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9.]/g, "");
          setText(v);
          const n = Number(v);
          if (v !== "" && Number.isFinite(n)) set(n);
        }}
        onBlur={() => setText(value.toFixed(2))}
      />
    </span>
  );
}

function Sentence({ money, evidence, setMoney, setEvidence }: { money: number; evidence: number; setMoney: (n: number) => void; setEvidence: (n: number) => void }) {
  const next = [...NEXT, ...realNext(useRealCases() ?? [])];
  const open = next.length;
  const w = waits(next, money, evidence);
  return (
    <div className={s.sentence} data-policy-sentence>
      <p className={s.sentenceText}>
        Act on my own when the money is under <Dollars value={money} set={setMoney} label="Money line, in dollars" name="money" />. File evidence on my own when the case is under{" "}
        <Dollars value={evidence} set={setEvidence} label="Evidence line, in dollars" name="evidence" />. Otherwise, wait for me.
      </p>
      <p className={s.consequence} data-consequence={w.length}>
        With this policy, <Num value={w.length} money={false} cause="policy-edit" /> of your {open} open cases would wait for you
        {w.length ? <>: {w.map((n) => n.label).join(", ")}.</> : "."}
      </p>
      <p className={s.ruleWhere}>A preview: change the numbers to see who would wait. This page saves nothing.</p>
    </div>
  );
}

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
  const [money, setMoney] = useState(POLICY.approvalAboveUsd);
  const [evidence, setEvidence] = useState(EVIDENCE_GATE_USD);
  const RULES = rules(money, evidence);
  return (
    <div className={`${s.app} ${s.wInbox}`}>
      <div className={s.paper}>
        <Masthead here="policy" />
        <main className={s.inbox}>
          <h1 className={s.headline}>{countWord(RULES.length + 1, true)} rules CaseClerk follows on every case, and where each one applied.</h1>
          <Sentence money={money} evidence={evidence} setMoney={setMoney} setEvidence={setEvidence} />
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
