import Link from "next/link";
import {
  OUTCOME_LABEL,
  REASON_LABEL,
  STATE_LABEL,
  countdown,
  day,
  dayOffset,
  hoursLeft,
  nextDays,
  sortedCases,
  time,
  usd,
  weekday,
  type InboxCase,
} from "../../_data";
import { OpenTest, StateWord, WaitingWords } from "../Controls";
import { Masthead } from "../Masthead";
import s from "../b.module.css";

const SPAN = 14;
const calendar = nextDays(SPAN);

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

function Entry({ c }: { c: InboxCase }) {
  const hot = c.dueAt && hoursLeft(c.dueAt) < 72;
  return (
    <li className={s.row}>
      <p className={`${s.margin} ${hot ? s.red : ""}`}>
        {c.dueAt ? (
          <>
            {countdown(c.dueAt)}
            <br />
            <span className={s.quiet}>
              due {weekday(c.dueAt)} {day(c.dueAt)}
            </span>
          </>
        ) : c.closedAt ? (
          <>
            <span className={c.state === "won" ? s.green : undefined}>{OUTCOME_LABEL[c.outcome!]}</span>
            <br />
            <span className={s.quiet}>{day(c.closedAt)}</span>
          </>
        ) : (
          <>
            With PayPal
            <br />
            <span className={s.quiet}>since {day(c.lastEventAt)}</span>
          </>
        )}
      </p>
      <div className={s.text}>
        <Link href={`/drafts/b/case/${c.id}`} className={s.caseTitle}>
          {c.item}
        </Link>
        <p className={s.caseMeta}>
          {c.buyer}, {c.buyerCity}. {REASON_LABEL[c.reason]}, {c.stage === "CHARGEBACK" ? "chargeback" : "inquiry"}.
        </p>
        <p className={s.caseNow}>
          {!c.closedAt && <StateWord id={c.id} label={STATE_LABEL[c.state]} green={c.state === "approval"} />} {c.lastEvent}.
        </p>
      </div>
      <p className={s.right}>
        <span className={s.amt}>{usd(c.closedAt ? Number(c.amount) - Number(c.settledUsd ?? 0) : c.amount)}</span>
        <br />
        {c.closedAt && (
          <>
            <span className={s.quiet}>kept of {usd(c.amount)}</span>
            <br />
          </>
        )}
        <span className={`${s.mono} ${s.quiet}`}>{c.id.slice(5)}</span>
      </p>
    </li>
  );
}

export default function DraftBInbox() {
  const rows = sortedCases();
  const due = rows.filter((c) => c.dueAt);
  const paypal = rows.filter((c) => !c.dueAt && !c.closedAt);
  const closed = rows.filter((c) => c.closedAt);
  const open = due.length + paypal.length;
  const atStake = [...due, ...paypal].reduce((t, c) => t + Number(c.amount), 0);

  return (
    <div className={s.page}>
      <Masthead here="inbox" />
      <article className={s.file}>
        <header className={s.row}>
          <p className={s.margin}>
            Sunday, Oct 25
            <br />
            {time("2026-10-25T10:40:00-07:00")} Pacific
          </p>
          <div className={s.text}>
            <h1 className={s.h1}>
              {WORDS[open]} open disputes, {usd(atStake)} at stake, <WaitingWords /> waiting for your answer.
            </h1>
          </div>
        </header>

        <section className={s.row}>
          <p className={s.margin}>Next two weeks</p>
          <div className={s.calWrap}>
            <ol className={s.cal}>
              {calendar.map((d, i) => {
                const onDay = due.filter((c) => dayOffset(c.dueAt!) === i);
                return (
                  <li key={d} className={i === 0 ? s.calToday : undefined}>
                    <span className={s.calHead}>
                      {i === 0 ? "Today" : weekday(d)}
                      <br />
                      {day(d)}
                    </span>
                    {onDay.map((c) => (
                      <span key={c.id} className={hoursLeft(c.dueAt!) < 72 ? `${s.calCase} ${s.red}` : s.calCase}>
                        <Link href={`/drafts/b/case/${c.id}`}>{c.buyer.split(" ")[1]}</Link>
                        <span className={s.calAmt}>${Math.round(Number(c.amount)).toLocaleString("en-US")}</span>
                      </span>
                    ))}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className={s.row} id="waiting">
          <p className={s.margin}>Soonest first</p>
          <h2 className={`${s.text} ${s.h3}`}>Waiting on you or the agent</h2>
        </section>
        <ol className={s.entries}>
          {due.map((c) => (
            <Entry key={c.id} c={c} />
          ))}
        </ol>

        <section className={s.row}>
          <p className={s.margin}>Evidence is in</p>
          <h2 className={`${s.text} ${s.h3}`}>Waiting on PayPal</h2>
        </section>
        <ol className={s.entries}>
          {paypal.map((c) => (
            <Entry key={c.id} c={c} />
          ))}
        </ol>

        <section className={s.row}>
          <p className={s.margin}>October</p>
          <h2 className={`${s.text} ${s.h3}`}>Closed</h2>
        </section>
        <ol className={`${s.entries} ${s.closed}`}>
          {closed.map((c) => (
            <Entry key={c.id} c={c} />
          ))}
        </ol>

        <footer className={`${s.row} ${s.foot}`}>
          <div className={s.text}>
            <OpenTest />
          </div>
        </footer>
      </article>
    </div>
  );
}
