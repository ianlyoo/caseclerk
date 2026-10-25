"use client";

import Link from "next/link";
import { CASES, day, hoursLeft, weekday, type InboxCase } from "../../_shared/data";
import { REAL_ID, REAL_WIRE } from "../../_shared/real";
import { BASE, Masthead, Wire, countWord, realDay } from "../ui";
import { Row, Strip } from "../inbox/parts";
import s from "../a.module.css";

function byDay(cases: InboxCase[]) {
  const out: { day: string; cases: InboxCase[] }[] = [];
  for (const c of cases) {
    const d = `${weekday(c.dueAt!)} ${day(c.dueAt!)}`;
    if (out.at(-1)?.day !== d) out.push({ day: d, cases: [] });
    out.at(-1)!.cases.push(c);
  }
  return out;
}

export default function FinalADeadlines() {
  const due = CASES.filter((c) => c.dueAt).sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!));
  const soon = due.filter((c) => hoursLeft(c.dueAt!) < 72).length;
  return (
    <div className={`${s.app} ${s.wInbox}`}>
      <div className={s.paper}>
        <Masthead here="deadlines" />
        <main className={s.dl}>
          <h1 className={s.headline}>
            {countWord(soon, true)} {soon === 1 ? "answer is" : "answers are"} due in the next 72 hours; {countWord(due.length)} in the next two weeks.
          </h1>
          <Strip />
          {byDay(due).map((g) => (
            <section key={g.day}>
              <h2 className={s.groupHead}>Due {g.day}</h2>
              <ul className={s.rows} style={{ marginTop: 0 }}>
                {g.cases.map((c) => (
                  <Row key={c.id} c={c} />
                ))}
              </ul>
            </section>
          ))}
        </main>
        <p className={s.foot}>All cases on this page are sample cases.</p>
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
