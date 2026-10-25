"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { WireLine } from "../../_shared/cases";
import { realState, wireRowLines, type ApiCase, type ApiWireRow, type RealRow } from "../_real/model";
import { caseDetail } from "../../_shared/cases";
import { countdown, day, dayOffset, hoursLeft, nextDays, time, usd, usd0, weekday, type InboxCase } from "../../_shared/data";
import { PHOTOS } from "../../_shared/photos";
import { usePhase } from "../../_shared/store";
import { BASE, DESK_CASES, Num, countWord, realDay, useDeskApprovals, useRealNow, wireClock } from "../ui";
import s from "../a.module.css";

const thing = (item: string) => item.split(",")[0];

/** What the row says the case is doing now, after the seller acts on it. */
function Last({ c }: { c: InboxCase }) {
  const phase = usePhase(c.id);
  const d = caseDetail(c.id)!;
  const a = d.approval;
  if (a && phase === "resolved") return <>Staged ruling, sample only.</>;
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

/** Counts the sample desk and the real sandbox cases together, as the nav does. */
export function Headline({ real }: { real: RealRow[] }) {
  const realOpen = real.filter((r) => r.state !== "resolved");
  const waiting = useDeskApprovals() + real.filter((r) => r.state === "pending").length;
  const sampleOpen = DESK_CASES.filter((c) => !c.closedAt);
  const open = [...sampleOpen, ...realOpen];
  const stake = open.reduce((t, c) => t + Number(c.amount), 0);
  return (
    <h1 className={s.headline}>
      {countWord(open.length, true)} open disputes, <Num value={stake} cause="resolve" /> at stake,{" "}
      {waiting === 0 ? "none" : countWord(waiting)} waiting for your answer.
    </h1>
  );
}

/** The next 14 days: every sample answer due on the desk and every real case waiting for you, by its PayPal deadline. */
export function Strip({ real }: { real?: ApiCase[] }) {
  const days = nextDays(14);
  const due = DESK_CASES.filter((c) => c.dueAt);
  const realDue = useRealNow(real).filter((r) => realState(r) === "pending" && r.case.snapshot.sellerResponseDueDate);
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
          {realDue
            .filter((r) => dayOffset(r.case.snapshot.sellerResponseDueDate!) === i)
            .map((r) => {
              const at = r.case.snapshot.sellerResponseDueDate!;
              return (
                <Link key={r.case.id} href={`${BASE}/case/${r.case.id}`} className={`${s.mark} ${s.markReal}`} data-due={at} data-real-due={r.case.id} title={`Real sandbox case ${r.case.id}, due ${weekday(at)} ${time(at)}`}>
                  <span>{usd0(r.case.snapshot.amount.value)}</span>
                  <span className={s.markRealTag}>Real</span>
                </Link>
              );
            })}
        </div>
      ))}
    </div>
  );
}


/** A real sandbox case row: where PayPal has it, and the last call CaseClerk made, with PayPal's debug id. */
export function RealRowView({ r }: { r: RealRow }) {
  const photo = PHOTOS[r.id];
  const c = r.lastCall;
  return (
    <li className={s.row}>
      <Link href={`${BASE}/case/${r.id}`} className={s.rowLink} data-case-row={r.id} data-real-row>
        <span className={`${s.rowDue} ${r.dueAt && hoursLeft(r.dueAt) < 72 ? s.red : ""}`}>
          {r.state === "resolved" ? (
            "Closed"
          ) : r.dueAt ? (
            <span data-real-row-due>
              {countdown(r.dueAt)}
              <br />
              by {weekday(r.dueAt)} {time(r.dueAt)}
            </span>
          ) : r.state === "pending" ? (
            <span className={s.green}>Waiting for you</span>
          ) : (
            "With PayPal"
          )}
        </span>
        {photo ? <img className={s.thumb} src={photo.src} alt={photo.alt} data-credit={photo.credit} width={56} height={42} /> : <span className={s.thumbEmpty} />}
        <span>
          <span className={s.rowItem}>{r.item}</span>
          <span className={s.rowWho}>
            <span className={s.rowReal}>Real sandbox case</span> {r.id}
          </span>
          <span className={s.rowLast}>
            {r.standing}.
            {c ? (
              <>
                {" "}
                Last PayPal call: {c.path.split("/").at(-1)} {c.status}, {realDay(c.at)} {wireClock(c.at)} PT{c.debugId && <>, <span className={s.mono}>debug {c.debugId}</span></>}.
              </>
            ) : r.lastEvent ? (
              <>
                {" "}
                Last webhook {realDay(r.lastEvent.at)} {wireClock(r.lastEvent.at)} PT, <span className={s.mono}>event {r.lastEvent.eventId}</span>.
              </>
            ) : null}
          </span>
        </span>
        <span className={s.rowAmt}>{usd(r.amount)}</span>
      </Link>
    </li>
  );
}

/** The real lines plus any new production wire rows for the real cases, polled every 5 s with a 60 s look-back. */
export function useLiveWire(base: WireLine[], ids: string[]): WireLine[] {
  const [extra, setExtra] = useState<WireLine[]>([]);
  useEffect(() => {
    const events = new Set(base.flatMap((l) => (l.eventId ? [l.eventId] : [])));
    const debugs = new Set(base.flatMap((l) => (l.debugId ? [l.debugId] : [])));
    let stop = false;
    const pull = async () => {
      try {
        const since = new Date(Date.now() - 60_000).toISOString();
        const res = await fetch(`${BASE}/live/wire?since=${encodeURIComponent(since)}`, { cache: "no-store" });
        if (!res.ok || stop) return;
        const rows = ((await res.json()).wire ?? []) as ApiWireRow[];
        const fresh = wireRowLines(rows.filter((w) => w.caseId && ids.includes(w.caseId)), null, events, debugs);
        if (fresh.length) setExtra((x) => [...x, ...fresh]);
      } catch {}
    };
    const t = setInterval(pull, 5000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [base, ids]);
  return [...base, ...extra];
}
