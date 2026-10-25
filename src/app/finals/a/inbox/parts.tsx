"use client";

import Link from "next/link";
import { caseDetail } from "../../_shared/cases";
import { CASES, countdown, day, dayOffset, hoursLeft, nextDays, sortedCases, time, usd, usd0, weekday, type InboxCase } from "../../_shared/data";
import { PHOTOS } from "../../_shared/photos";
import { usePendingApprovals, usePhase } from "../../_shared/store";
import { BASE, Num, countWord } from "../ui";
import s from "../a.module.css";

const thing = (item: string) => item.split(",")[0];

/** What the row says the case is doing now, after the seller acts on it. */
function Last({ c }: { c: InboxCase }) {
  const phase = usePhase(c.id);
  const d = caseDetail(c.id)!;
  const a = d.approval;
  if (a && phase === "resolved") return <span className={s.green}>{a.resolved.headline.replace(/\.$/, "")}; you kept {usd(a.resolved.kept)}.</span>;
  if (a && phase === "filed") return <>{a.done} PayPal is reviewing it.</>;
  if (a && (phase === "undo" || phase === "sending")) return <>Sending to PayPal now.</>;
  if (a && phase === "declined") return <>You declined; nothing was sent.</>;
  if (c.state === "approval") return <span className={s.green}>Waiting for you. {c.lastEvent}.</span>;
  return <>{c.lastEvent}.</>;
}

function Settled({ c }: { c: InboxCase }) {
  const kept = (Number(c.amount) - Number(c.settledUsd ?? 0)).toFixed(2);
  if (c.state === "won") return <span className={`${s.rowSettled} ${s.green}`}>Won, kept {usd(kept)}</span>;
  if (Number(kept) === 0) return <span className={s.rowSettled}>Refunded in full</span>;
  return <span className={s.rowSettled}>Settled, kept {usd(kept)}</span>;
}

export function Row({ c }: { c: InboxCase }) {
  const photo = !c.closedAt ? PHOTOS[c.id] : undefined;
  const red = c.dueAt && hoursLeft(c.dueAt) < 72;
  return (
    <li className={s.row}>
      <Link href={`${BASE}/case/${c.id}`} className={s.rowLink} data-case-row={c.id}>
        <span className={`${s.rowDue} ${red ? s.red : ""}`}>
          {c.dueAt ? (
            <>
              {countdown(c.dueAt)}
              <br />
              by {weekday(c.dueAt)} {time(c.dueAt)}
            </>
          ) : c.closedAt ? (
            <>Closed {day(c.closedAt)}</>
          ) : (
            <>With PayPal since {day(c.lastEventAt)}</>
          )}
        </span>
        {photo ? <img className={s.thumb} src={photo.src} alt={photo.alt} data-credit={photo.credit} width={56} height={42} /> : <span className={s.thumbEmpty} />}
        <span>
          <span className={s.rowItem}>{c.item}</span>
          <span className={s.rowWho}>
            {c.buyer}, {c.buyerCity}. <span className={s.sample}>Sample case</span>
          </span>
          <span className={s.rowLast}>
            <Last c={c} />
          </span>
        </span>
        <span className={s.rowAmt}>
          {usd(c.amount)}
          {c.closedAt && <Settled c={c} />}
        </span>
      </Link>
    </li>
  );
}

export function Headline() {
  const waiting = usePendingApprovals();
  const heroResolved = usePhase("PP-R-NKT-10227591") === "resolved";
  const open = CASES.filter((c) => !c.closedAt && !(heroResolved && c.id === "PP-R-NKT-10227591"));
  const stake = open.reduce((t, c) => t + Number(c.amount), 0);
  return (
    <h1 className={s.headline}>
      {countWord(open.length, true)} open disputes, <Num value={stake} cause="resolve" /> at stake,{" "}
      {waiting === 0 ? "none" : countWord(waiting)} waiting for your answer.
    </h1>
  );
}

export function Strip() {
  const days = nextDays(14);
  const due = CASES.filter((c) => c.dueAt);
  return (
    <div className={s.strip} data-strip aria-label="Answers due in the next 14 days">
      {days.map((iso, i) => (
        <div key={iso} className={s.cell}>
          <span className={s.cellDay}>{i === 0 ? "Today" : `${weekday(iso)} ${day(iso).split(" ")[1]}`}</span>
          {due
            .filter((c) => dayOffset(c.dueAt!) === i)
            .map((c) => (
              <Link
                key={c.id}
                href={`${BASE}/case/${c.id}`}
                className={`${s.mark} ${hoursLeft(c.dueAt!) < 72 ? s.markRed : ""}`}
                data-due={c.dueAt}
                title={`${c.buyer}, ${thing(c.item)}, due ${weekday(c.dueAt!)} ${time(c.dueAt!)}`}
              >
                <span>{usd0(c.amount)}</span>
                <span className={s.sample}>{c.buyer.split(" ")[1]}</span>
              </Link>
            ))}
        </div>
      ))}
    </div>
  );
}

