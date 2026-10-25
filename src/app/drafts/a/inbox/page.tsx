import Link from "next/link";
import {
  CASES,
  REASON_LABEL,
  STATE_LABEL,
  STATUS_LABEL,
  countdown,
  cost,
  day,
  dayOffset,
  hoursLeft,
  nextDays,
  sortedCases,
  time,
  usd,
  weekday,
  type DeskState,
  type InboxCase,
} from "../../_data";
import { Bar } from "../Bar";
import s from "../a.module.css";

const SPAN = 14; // days shown in the deadline lane
const days = nextDays(SPAN);

const open = CASES.filter((c) => !c.closedAt);
const openTotal = open.reduce((t, c) => t + Number(c.amount), 0);
const won = CASES.filter((c) => c.state === "won").reduce((t, c) => t + Number(c.amount), 0);
const spend = CASES.reduce((t, c) => t + c.agentCostUsd, 0);
const count = (st: DeskState[]) => CASES.filter((c) => st.includes(c.state)).length;

const FILTERS: { label: string; n: number; on?: boolean }[] = [
  { label: "Open", n: open.length, on: true },
  { label: "Needs your approval", n: count(["approval"]) },
  { label: "New", n: count(["new"]) },
  { label: "Agent working", n: count(["working"]) },
  { label: "Waiting on PayPal", n: count(["waiting_paypal"]) },
  { label: "Closed this month", n: count(["won", "refunded"]) },
];

function Lane({ c }: { c: InboxCase }) {
  if (!c.dueAt) {
    return <span className={s.laneNote}>{c.closedAt ? `closed ${day(c.closedAt)}` : `with PayPal since ${day(c.lastEventAt)}`}</span>;
  }
  const end = Math.min(dayOffset(c.dueAt) + 1, SPAN);
  const hot = hoursLeft(c.dueAt) < 72;
  return (
    <span className={s.lane}>
      <span className={hot ? s.barHot : s.bar2} style={{ width: `${(end / SPAN) * 100}%` }} />
    </span>
  );
}

function Row({ c }: { c: InboxCase }) {
  const hot = c.dueAt && hoursLeft(c.dueAt) < 72;
  return (
    <tr className={c.closedAt ? s.closedRow : undefined}>
      <td className={hot ? s.dueHot : s.dueCell}>
        {c.dueAt ? countdown(c.dueAt) : ""}
        {c.dueAt && <span className={s.sub}>{`${weekday(c.dueAt)} ${day(c.dueAt)}`}</span>}
      </td>
      <td className={s.laneCell}>
        <Lane c={c} />
      </td>
      <td className={s.who}>
        <Link href="/drafts/a/case" className={s.rowLink}>
          {c.buyer}
        </Link>
        <span className={s.sub}>{c.item}</span>
      </td>
      <td className={s.num}>{usd(c.amount)}</td>
      <td>
        {REASON_LABEL[c.reason]}
        <span className={s.sub}>{c.stage === "CHARGEBACK" ? "Chargeback" : "Inquiry"}</span>
      </td>
      <td>
        {c.outcome ? (c.outcome === "RESOLVED_SELLER_FAVOUR" ? "Seller favour" : "Buyer favour") : STATUS_LABEL[c.status]}
        <span className={`${s.sub} ${s.mono}`}>{c.id}</span>
      </td>
      <td>
        <span className={s["st_" + c.state]}>{STATE_LABEL[c.state]}</span>
        <span className={s.sub}>{c.lastEvent}</span>
      </td>
      <td className={s.when}>
        {day(c.lastEventAt)}
        <span className={s.sub}>{time(c.lastEventAt)}</span>
      </td>
    </tr>
  );
}

export default function DraftAInbox() {
  const rows = sortedCases();
  const live = rows.filter((c) => !c.closedAt);
  const closed = rows.filter((c) => c.closedAt);

  return (
    <div className={s.app}>
      <Bar active="inbox" />
      <div className={s.inboxGrid}>
        <aside className={s.filters} aria-label="Filters">
          <ul>
            {FILTERS.map((f) => (
              <li key={f.label} className={f.on ? s.on : undefined}>
                <span>{f.label}</span>
                <span className={s.fN}>{f.n}</span>
              </li>
            ))}
          </ul>
          <dl className={s.totals}>
            <div>
              <dt>In dispute</dt>
              <dd>{usd(openTotal)}</dd>
            </div>
            <div>
              <dt>Won this month</dt>
              <dd>{usd(won)}</dd>
            </div>
            <div>
              <dt>Agent spend</dt>
              <dd>{cost(spend)}</dd>
            </div>
          </dl>
        </aside>

        <main className={s.inboxMain}>
          <div className={s.inboxHead}>
            <h1 className={s.title}>Disputes</h1>
            <span className={s.muted}>
              {live.length} open, soonest deadline first. Times Pacific.
            </span>
            <button className={s.secondary}>Open test dispute</button>
          </div>
          <table className={s.inbox}>
            <thead>
              <tr>
                <th>Respond within</th>
                <th className={s.laneHead}>
                  <span className={s.ticks}>
                    {days.map((d, i) => (
                      <span key={d} className={i === 0 ? s.today : undefined}>
                        {i === 0 ? "Today" : day(d).split(" ")[1]}
                      </span>
                    ))}
                  </span>
                </th>
                <th>Buyer and item</th>
                <th className={s.num}>Amount</th>
                <th>Reason</th>
                <th>PayPal</th>
                <th>CaseClerk</th>
                <th>Last</th>
              </tr>
            </thead>
            <tbody>
              {live.map((c) => (
                <Row key={c.id} c={c} />
              ))}
              <tr className={s.groupRow}>
                <td colSpan={8}>Closed this month</td>
              </tr>
              {closed.map((c) => (
                <Row key={c.id} c={c} />
              ))}
            </tbody>
          </table>
        </main>
      </div>
    </div>
  );
}
