"use client";

import { useMemo } from "react";
import { sortedCases, type InboxCase } from "../../_shared/data";
import { realLines, realRow, type ApiCase } from "../_real/model";
import { Masthead, Wire, wireClock } from "../ui";
import { Headline, RealRowView, Row, Strip, useLiveWire } from "./parts";
import s from "../a.module.css";

export function InboxView({ real }: { real: ApiCase[] }) {
  const rows = sortedCases();
  const realRows = real.map((r) => realRow(r, (iso) => `${wireClock(iso)} PT`));
  const base = useMemo(() => real.flatMap((r) => realLines(r)), [real]);
  const ids = useMemo(() => real.map((r) => r.case.id), [real]);
  const live = useLiveWire(base, ids);
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
          <Headline real={realRows} />
          <Strip />
          {realRows.length > 0 && (
            <section>
              <h2 className={s.groupHead}>Real sandbox cases, from PayPal</h2>
              <ul className={s.rows} style={{ marginTop: 0 }} data-real-rows>
                {realRows.map((r) => (
                  <RealRowView key={r.id} r={r} />
                ))}
              </ul>
            </section>
          )}
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
        <p className={s.foot}>Rows marked Real sandbox case come from PayPal sandbox through CaseClerk&rsquo;s production API. The other 11 are sample cases. The Wire on the right is real PayPal traffic only.</p>
      </div>
      <Wire
        sections={[
          {
            key: "real",
            label: <>PayPal, the real sandbox cases above, read from the production API</>,
            lines: live.map((l) => ({ ...l, key: l.eventId ?? l.debugId ?? l.at })),
          },
        ]}
      />
    </div>
  );
}
