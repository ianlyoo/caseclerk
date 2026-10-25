"use client";

import Link from "next/link";
import { day, hoursLeft, weekday, type InboxCase } from "../../_shared/data";
import { REAL_ID, REAL_WIRE } from "../../_shared/real";
import { realRow, realState, type RealRow } from "../_real/model";
import { BASE, DESK_CASES, Masthead, Wire, countWord, realDay, useRealNow, wireClock } from "../ui";
import { RealRowView, Row, Strip } from "../inbox/parts";
import s from "../a.module.css";

type Due = { at: string; sample?: InboxCase; real?: RealRow };

function byDay(due: Due[]) {
  const out: { day: string; cases: Due[] }[] = [];
  for (const c of due) {
    const d = `${weekday(c.at)} ${day(c.at)}`;
    if (out.at(-1)?.day !== d) out.push({ day: d, cases: [] });
    out.at(-1)!.cases.push(c);
  }
  return out;
}

export default function FinalADeadlines() {
  // The real cases waiting for you sit beside the sample desk, at PayPal's own response deadline.
  const real = useRealNow()
    .filter((r) => realState(r) === "pending" && r.case.snapshot.sellerResponseDueDate)
    .map((r) => realRow(r, (iso) => `${wireClock(iso)} PT`));
  const due: Due[] = [...DESK_CASES.filter((c) => c.dueAt).map((c) => ({ at: c.dueAt!, sample: c })), ...real.map((r) => ({ at: r.dueAt!, real: r }))].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const soon = due.filter((c) => hoursLeft(c.at) < 72).length;
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
                {g.cases.map((c) => (c.real ? <RealRowView key={c.real.id} r={c.real} /> : <Row key={c.sample!.id} c={c.sample!} />))}
              </ul>
            </section>
          ))}
        </main>
        <p className={s.foot}>{real.length > 0 ? "Rows marked Real sandbox case come from PayPal’s sandbox; the rest are sample cases." : "All cases on this page are sample cases."}</p>
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
