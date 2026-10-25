import Link from "next/link";
import { CASES, NOW, STATE_LABEL, countdown, day, dayOffset, hoursLeft, time, usd, weekday } from "../../_data";
import { Bar } from "../Bar";
import { DeskWord } from "../Controls";
import s from "../a.module.css";

// Oct 15 to Nov 7: far enough back to show when the open cases started, far enough ahead for every deadline.
const FROM = -10;
const SPAN = 24;
const days = Array.from({ length: SPAN }, (_, i) => new Date(Date.parse("2026-10-25T12:00:00-07:00") + (FROM + i) * 86_400_000).toISOString());
const col = (iso: string) => Math.max(0, Math.min(SPAN - 1, dayOffset(iso) - FROM));

export default function DraftADeadlines() {
  const open = CASES.filter((c) => c.dueAt).sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!));
  const rest = CASES.filter((c) => !c.dueAt && !c.closedAt);
  const today = col(NOW);

  return (
    <div className={s.app}>
      <Bar active="deadlines" />
      <main className={s.dlMain}>
        <div className={s.inboxHead}>
          <h1 className={s.title}>Deadlines</h1>
          <span className={s.muted}>
            PayPal&rsquo;s respond-by date for each open case. The line runs from when the dispute opened. Times Pacific.
          </span>
        </div>

        <div className={s.dl} style={{ ["--span" as string]: SPAN }}>
          <div className={s.dlRow}>
            <span className={s.dlWho} />
            {days.map((d, i) => (
              <span key={d} className={`${s.dlDay} ${i === today ? s.dlToday : ""}`}>
                <span>{weekday(d).slice(0, 2)}</span>
                {day(d).split(" ")[1]}
                {(i === 0 || day(d).endsWith(" 1")) && <span className={s.dlMonth}>{day(d).split(" ")[0]}</span>}
              </span>
            ))}
          </div>
          {open.map((c) => {
            const a = col(c.openedAt);
            const b = col(c.dueAt!);
            const hot = hoursLeft(c.dueAt!) < 72;
            return (
              <div key={c.id} className={s.dlRow}>
                <span className={s.dlWho}>
                  <Link href={`/drafts/a/case/${c.id}`} className={s.rowLink}>
                    {c.buyer}
                  </Link>
                  <span className={s.sub}>
                    {usd(c.amount)}, <DeskWord id={c.id} label={STATE_LABEL[c.state]} cls={s["st_" + c.state]} />
                  </span>
                </span>
                <span className={s.dlTodayRule} style={{ gridColumn: today + 2 }} aria-hidden />
                <span className={hot ? s.dlSpanHot : s.dlSpan} style={{ gridColumn: `${a + 2} / ${b + 3}` }}>
                  <span className={s.dlDue}>
                    {countdown(c.dueAt!)}, {weekday(c.dueAt!)} {day(c.dueAt!)} {time(c.dueAt!)}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        {rest.length > 0 && (
          <section className={s.dlRest}>
            <h2 className={s.dlRestHead}>No deadline: PayPal is deciding</h2>
            <ul>
              {rest.map((c) => (
                <li key={c.id}>
                  <Link href={`/drafts/a/case/${c.id}`} className={s.rowLink}>
                    {c.buyer}
                  </Link>
                  <span className={s.muted}>
                    {usd(c.amount)}, evidence sent, with PayPal since {day(c.lastEventAt)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
