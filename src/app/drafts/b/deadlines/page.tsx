import Link from "next/link";
import { CASES, REASON_LABEL, STATE_LABEL, countdown, day, hoursLeft, time, usd, weekday, type InboxCase } from "../../_data";
import { StateWord } from "../Controls";
import { Masthead } from "../Masthead";
import s from "../b.module.css";

function byDueDay(cases: InboxCase[]) {
  const out: { day: string; cases: InboxCase[] }[] = [];
  for (const c of cases) {
    const d = `${weekday(c.dueAt!)}, ${day(c.dueAt!)}`;
    if (out.at(-1)?.day !== d) out.push({ day: d, cases: [] });
    out.at(-1)!.cases.push(c);
  }
  return out;
}

export default function DraftBDeadlines() {
  const due = CASES.filter((c) => c.dueAt).sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!));
  const paypal = CASES.filter((c) => !c.dueAt && !c.closedAt);
  const last = due.at(-1)!;

  return (
    <div className={s.page}>
      <Masthead here="deadlines" />
      <article className={s.file}>
        <header className={s.row}>
          <p className={s.margin}>
            Sunday, Oct 25
            <br />
            {time("2026-10-25T10:40:00-07:00")} Pacific
          </p>
          <div className={s.text}>
            <h1 className={s.h1}>
              The next answer PayPal needs is due in {countdown(due[0].dueAt!)}; the last, {weekday(last.dueAt!)} {day(last.dueAt!)}.
            </h1>
          </div>
        </header>

        {byDueDay(due).map((g) => (
          <section key={g.day} className={s.ledgerDay}>
            <div className={s.row}>
              <p className={`${s.margin} ${s.dayName}`}>{g.day}</p>
            </div>
            <ol className={s.entries}>
              {g.cases.map((c) => (
                <li key={c.id} className={s.row}>
                  <p className={`${s.margin} ${hoursLeft(c.dueAt!) < 72 ? s.red : ""}`}>
                    {countdown(c.dueAt!)}
                    <br />
                    <span className={s.quiet}>by {time(c.dueAt!)}</span>
                  </p>
                  <div className={s.text}>
                    <Link href={`/drafts/b/case/${c.id}`} className={s.caseTitle}>
                      {c.buyer}, {c.item}
                    </Link>
                    <p className={s.caseNow}>
                      <StateWord id={c.id} label={STATE_LABEL[c.state]} green={c.state === "approval"} />{" "}
                      {REASON_LABEL[c.reason]}, {c.stage === "CHARGEBACK" ? "chargeback" : "inquiry"}.
                    </p>
                  </div>
                  <p className={s.right}>
                    <span className={s.amt}>{usd(c.amount)}</span>
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ))}

        <section className={s.row}>
          <p className={s.margin}>No deadline</p>
          <h2 className={`${s.text} ${s.h3}`}>PayPal is deciding</h2>
        </section>
        <ol className={s.entries}>
          {paypal.map((c) => (
            <li key={c.id} className={s.row}>
              <p className={s.margin}>
                since {day(c.lastEventAt)}
              </p>
              <div className={s.text}>
                <Link href={`/drafts/b/case/${c.id}`} className={s.caseTitle}>
                  {c.buyer}, {c.item}
                </Link>
                <p className={s.caseNow}>{c.lastEvent}.</p>
              </div>
              <p className={s.right}>
                <span className={s.amt}>{usd(c.amount)}</span>
              </p>
            </li>
          ))}
        </ol>
      </article>
    </div>
  );
}
