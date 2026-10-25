import Link from "next/link";
import {
  CASES,
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
            {c.state === "won" ? <span className={s.green}>Won</span> : "Refunded"}
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
        <Link href="/drafts/b/case" className={s.caseTitle}>
          {c.item}
        </Link>
        <p className={s.caseMeta}>
          {c.buyer}, {c.buyerCity}. {REASON_LABEL[c.reason]}, {c.stage === "CHARGEBACK" ? "chargeback" : "inquiry"}.
        </p>
        {!c.closedAt && (
          <p className={s.caseNow}>
            <span className={c.state === "approval" ? s.green : s.ink}>{STATE_LABEL[c.state]}.</span> {c.lastEvent}.
          </p>
        )}
      </div>
      <p className={s.right}>
        <span className={s.amt}>{usd(c.amount)}</span>
        <br />
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
  const needYou = CASES.filter((c) => c.state === "approval").length;

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
              {WORDS[open]} open disputes, {usd(atStake)} at stake, {WORDS[needYou].toLowerCase()} waiting for your answer.
            </h1>
          </div>
        </header>

        <section className={s.row}>
          <p className={s.margin}>Next two weeks</p>
          <div className={`${s.text} ${s.calWrap}`}>
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
                        {c.buyer.split(" ")[1]}
                        <br />
                        {usd(c.amount)}
                      </span>
                    ))}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className={s.row}>
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
            <button className={s.openTest}>Open a test dispute</button>
            <span className={s.quiet}> Creates a sandbox payment and chargeback; the case appears here in about 3 minutes.</span>
          </div>
        </footer>
      </article>
    </div>
  );
}
