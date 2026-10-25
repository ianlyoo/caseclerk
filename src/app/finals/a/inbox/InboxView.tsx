"use client";

import { useMemo } from "react";
import type { InboxCase } from "../../_shared/data";
import { realLines, realRow, type ApiCase, type RealRow } from "../_real/model";
import { Masthead, Wire, deskSorted, foldRoutine, wireClock } from "../ui";
import { Headline, RealRowView, Row, Strip, useLiveWire } from "./parts";
import s from "../a.module.css";

export function InboxView({ real }: { real: ApiCase[] }) {
  const rows = deskSorted();
  const realRows = real.map((r) => realRow(r, (iso) => `${wireClock(iso)} PT`));
  const base = useMemo(() => real.flatMap((r) => realLines(r)), [real]);
  const ids = useMemo(() => real.map((r) => r.case.id), [real]);
  const live = useLiveWire(base, ids);
  // Waiting work first; the closed sandbox test disputes fold into one row at the end.
  const realWaiting = realRows.filter((r) => r.state === "pending");
  const realWithPayPal = realRows.filter((r) => r.state !== "pending" && r.state !== "resolved");
  const realClosed = realRows.filter((r) => r.state === "resolved");
  const groups: [string, RealRow[], InboxCase[]][] = [
    ["Waiting for you", realWaiting, rows.filter((c) => c.state === "approval")],
    ["Answer due, soonest first", [], rows.filter((c) => c.dueAt && c.state !== "approval")],
    ["With PayPal", realWithPayPal, rows.filter((c) => !c.dueAt && !c.closedAt)],
    ["Closed this month", [], rows.filter((c) => c.closedAt)],
  ];
  return (
    <div className={`${s.app} ${s.wInbox}`}>
      <div className={s.paper}>
        <Masthead here="inbox" real={real} />
        <main className={s.inbox}>
          <Headline real={realRows} />
          <Strip real={real} />
          {groups
            .filter(([, rs, cs]) => rs.length + cs.length > 0)
            .map(([label, rs, cs]) => (
              <section key={label}>
                <h2 className={s.groupHead}>{label}</h2>
                <ul className={s.rows} style={{ marginTop: 0 }} data-group={label}>
                  {rs.map((r) => (
                    <RealRowView key={r.id} r={r} />
                  ))}
                  {cs.map((c) => (
                    <Row key={c.id} c={c} />
                  ))}
                </ul>
              </section>
            ))}
          {realClosed.length > 0 && (
            <section>
              <details className={s.closedFold} data-closed-fold>
                <summary>
                  Closed by PayPal: {realClosed.length} sandbox test disputes <span className={s.closedFoldShow}>Show them</span>
                </summary>
                <p className={s.closedFoldNote}>Test disputes we opened on PayPal&rsquo;s sandbox for this demo, most on the same camera listing with separate buyers. Each is its own real case with its own PayPal ids.</p>
                <ul className={s.rows} style={{ marginTop: 0 }} data-real-rows>
                  {realClosed.map((r) => (
                    <RealRowView key={r.id} r={r} />
                  ))}
                </ul>
              </details>
            </section>
          )}
        </main>
        <p className={s.foot}>Rows marked Real sandbox case come from PayPal sandbox through CaseClerk&rsquo;s production API. The other {rows.length} are sample cases. The Wire on the right is real PayPal traffic only.</p>
      </div>
      <Wire
        sections={[
          {
            key: "real",
            label: <>PayPal traffic for the real sandbox cases above</>,
            lines: foldRoutine(live.map((l) => ({ ...l, key: l.eventId ?? l.debugId ?? l.at }))),
          },
        ]}
      />
    </div>
  );
}
