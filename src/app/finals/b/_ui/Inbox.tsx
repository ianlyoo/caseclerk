"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import NumberFlow from "@number-flow/react";
import { clock, countdown, day, dayOf, dayOffset, hoursLeft, isOpen, POLICY, sorted, usd, weekday, type Case } from "../_lib/data";
import { deskLine } from "./CaseList";
import { Masthead } from "./Masthead";
import { Photo } from "./Photo";
import { useDesk, waitsForYou } from "./store";
import s from "../b.module.css";

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
const word = (n: number) => WORDS[n] ?? String(n);

function Row({ c }: { c: Case }) {
  const { phase } = useDesk();
  const p = phase(c.id);
  const open = isOpen(c) && p !== "resolved";
  const needs = waitsForYou(c, p) && p !== "sending";
  const urgent = c.dueAt && open && hoursLeft(c.dueAt) < 72 && !(p === "sent");
  return (
    <li>
      <Link href={`/finals/b/case/${c.id}`} className={`${s.row} ${c.real ? s.rowReal : ""}`}>
        <span className={s.rowDue}>
          {c.real ? (
            open ? (
            <>
              With PayPal since
              <br />
              {dayOf(c.lastAt)} {clock(c.lastAt)} PT
            </>
          ) : (
            <>Closed {dayOf(c.lastAt)}</>
          )
          ) : c.dueAt && open ? (
            <span className={urgent ? s.urgent : undefined}>
              {countdown(c.dueAt)} left
              <br />
              due {weekday(c.dueAt)} {day(c.dueAt)}
            </span>
          ) : open ? (
            <>With PayPal</>
          ) : (
            <>Closed {day(c.lastAt)}</>
          )}
        </span>
        <span className={s.rowPhoto}>{open || c.real ? <Photo name={c.photo} size="row" alt={c.item} /> : null}</span>
        <span className={s.rowMain}>
          <span className={s.rowItem}>{c.item}</span>
          <span className={s.rowWho}>
            {c.city ? `${c.buyer}, ${c.city}` : c.buyer}
          </span>
          <span className={`${s.rowLast} ${needs ? s.rowLastNeeds : ""}`} data-cause="approve">
            {p === "sent" || p === "resolved" || p === "sending" ? deskLine(c, p) + "." : needs ? `Needs your answer. ${c.last}.` : `${c.last}.`}
          </span>
          {c.proof ? (
            <span className={s.rowProof} data-origin="paypal">
              Last PayPal call <code>{c.proof.name}</code> <code className={s.ppOk}>{c.proof.status}</code> <code>debug id {c.proof.debugId}</code>
            </span>
          ) : null}
        </span>
        <span className={s.rowAmt}>
          {!open && c.kept ? (c.settled ? `Kept ${usd(c.kept)}` : usd(c.kept)) : usd(c.amount)}
          <span>{c.real ? "Real sandbox case" : !open && c.settled ? `Settled, ${usd(c.settled)} back` : "Staged sample"}</span>
        </span>
      </Link>
    </li>
  );
}

function Strip({ open }: { open: Case[] }) {
  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.parse("2026-10-25T12:00:00-07:00") + i * 86_400_000).toISOString());
  return (
    <div className={s.strip} id="deadlines" aria-label="Deadlines, the next 14 days">
      {days.map((d, i) => {
        const due = open.filter((c) => c.dueAt && dayOffset(c.dueAt) === i);
        return (
          <div key={d} className={`${s.stripDay} ${i === 0 ? s.stripToday : ""}`}>
            <span>{i === 0 ? "Today" : `${weekday(d)} ${day(d).split(" ")[1]}`}</span>
            {due.map((c) => (
              <Link key={c.id} href={`/finals/b/case/${c.id}`} className={`${s.stripMark} ${hoursLeft(c.dueAt!) < 72 ? s.urgent : ""}`} data-due={c.dueAt}>
                {c.short}
                <span>${Math.round(Number(c.amount)).toLocaleString("en-US")}</span>
              </Link>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function Inbox() {
  const { waiting, phase, real } = useDesk();
  const only = useSearchParams().get("show") === "waiting";
  const list = sorted(real);
  // Every count and the deadline strip are over the real sandbox cases listed first; the staged samples sit apart.
  const mine = list.filter((c) => c.real);
  const open = mine.filter((c) => isOpen(c) && phase(c.id) !== "resolved");
  const stake = open.reduce((n, c) => n + Number(c.amount), 0);
  const closed = mine.filter((c) => !open.includes(c));
  const samples = list.filter((c) => !c.real);
  // The demo opened many test disputes on one listing; name it, so the repeats read as separate cases, not an error.
  const same = (cs: Case[]) => {
    const n = new Map<string, number>();
    cs.forEach((c) => n.set(c.short, (n.get(c.short) ?? 0) + 1));
    return [...n].sort((a, b) => b[1] - a[1])[0];
  };
  const [listing] = same(mine) ?? [];
  const [closedListing, closedSame] = same(closed) ?? ["", 0];
  const shown = only ? mine.filter((c) => waitsForYou(c, phase(c.id))) : null;
  return (
    <>
      <Masthead />
      <main className={s.inbox}>
        <h1 className={s.headline}>
          {word(open.length)} open {open.length === 1 ? "dispute" : "disputes"},{" "}
          <span data-cause="approve">
            <NumberFlow value={stake} format={{ style: "currency", currency: "USD" }} />
          </span>{" "}
          at stake, {word(waiting).toLowerCase()} waiting for your answer.
        </h1>
        {shown ? (
          <>
            <p className={s.rowGroup}>
              Waiting for you. <Link href="/finals/b/inbox" className={s.textBtn}>Show all disputes</Link>
            </p>
            <ol className={s.rows}>
              {shown.map((c) => (
                <Row key={c.id} c={c} />
              ))}
            </ol>
          </>
        ) : (
          <>
            <Strip open={open.filter((c) => waitsForYou(c, phase(c.id)))} />
            <p className={s.groupNote}>
              Test disputes we opened on PayPal&apos;s sandbox for this demo, each with its own buyer.{listing ? ` The ${listing} rows share one listing; each is a separate case.` : ""}
            </p>
            <ol className={s.rows}>
              {open.map((c) => (
                <Row key={c.id} c={c} />
              ))}
            </ol>
            {closed.length ? (
              <details className={s.closedFold}>
                <summary>
                  {word(closed.length)} closed test {closed.length === 1 ? "dispute" : "disputes"}
                  {closedSame > 1 ? `, ${closedSame === closed.length ? "all" : word(closedSame).toLowerCase()} on the same ${closedListing} listing` : ""}. Each is a separate sandbox case.
                </summary>
                <ol className={s.rows}>
                  {closed.map((c) => (
                    <Row key={c.id} c={c} />
                  ))}
                </ol>
              </details>
            ) : null}
            <h2 className={s.rowGroup}>Staged samples</h2>
            <p className={s.groupNote}>Made-up cases that show other kinds of dispute. Nothing here went to PayPal, and none is counted above.</p>
            <ol className={s.rows}>
              {samples.map((c) => (
                <Row key={c.id} c={c} />
              ))}
            </ol>
          </>
        )}
        <section className={s.policy} id="policy" aria-label="Your policy">
          <h2 className={s.h2}>Your policy, as the agent reads it</h2>
          <p>
            Act on my own when the money is under <em>${POLICY.approvalAboveUsd}.00</em>.
          </p>
          <p>
            Ask me before filing evidence on any case over <em>${POLICY.evidenceGateUsd}.00</em>.
          </p>
          <p>
            Never offer more than <em>{POLICY.maxOfferPercent} %</em> of the order.
          </p>
        </section>
      </main>
    </>
  );
}
