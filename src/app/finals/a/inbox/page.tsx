"use client";

import Link from "next/link";
import { sortedCases, type InboxCase } from "../../_shared/data";
import { REAL_ID, REAL_WIRE } from "../../_shared/real";
import { BASE, Masthead, Wire, realDay } from "../ui";
import { Headline, Row, Strip } from "./parts";
import s from "../a.module.css";

export default function FinalAInbox() {
  const rows = sortedCases();
  const groups: [string, InboxCase[]][] = [
    ["Waiting on an answer, soonest first", rows.filter((c) => c.dueAt)],
    ["With PayPal", rows.filter((c) => !c.dueAt && !c.closedAt)],
    ["Closed this month", rows.filter((c) => c.closedAt)],
  ];
  return (
    <div className={`${s.app} ${s.wInbox}`}>
      <div className={s.paper}>
        <Masthead here="inbox" />
        <main className={s.inbox}>
          <Headline />
          <Strip />
          {groups.map(([label, cs]) => (
            <section key={label}>
              <h2 className={s.groupHead}>{label}</h2>
              <ul className={s.rows} style={{ marginTop: 0 }}>
                {cs.map((c) => (
                  <Row key={c.id} c={c} />
                ))}
              </ul>
            </section>
          ))}
        </main>
        <p className={s.foot}>All 11 cases on this page are sample cases. The Wire on the right is the last real sandbox run.</p>
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
