import Link from "next/link";
import {
  OUTCOME_LABEL,
  REASON_LABEL,
  STATE_LABEL,
  STATUS_LABEL,
  countdown,
  day,
  hoursLeft,
  sortedCases,
  time,
  usd,
  weekday,
  type InboxCase,
} from "../../_data";
import { Bar } from "../Bar";
import { ApprovalCount, DeskWord, OpenTest } from "../Controls";
import s from "../a.module.css";

const FILTERS: { key: string; label: string; test: (c: InboxCase) => boolean }[] = [
  { key: "all", label: "All this month", test: () => true },
  { key: "open", label: "Open", test: (c) => !c.closedAt },
  { key: "approval", label: "Needs your approval", test: (c) => c.state === "approval" },
  { key: "new", label: "New", test: (c) => c.state === "new" },
  { key: "working", label: "Agent working", test: (c) => c.state === "working" },
  { key: "paypal", label: "Waiting on PayPal", test: (c) => c.state === "waiting_paypal" },
  { key: "closed", label: "Closed this month", test: (c) => !!c.closedAt },
];

function Row({ c }: { c: InboxCase }) {
  const hot = c.dueAt && hoursLeft(c.dueAt) < 72;
  const kept = c.closedAt ? Number(c.amount) - Number(c.settledUsd ?? 0) : null;
  return (
    <tr className={c.closedAt ? s.closedRow : undefined}>
      <td className={hot ? s.dueHot : s.dueCell}>
        {c.dueAt ? countdown(c.dueAt) : c.closedAt ? "Closed" : "With PayPal"}
        <span className={s.sub}>{c.dueAt ? `${weekday(c.dueAt)} ${day(c.dueAt)}` : day(c.closedAt ?? c.lastEventAt)}</span>
      </td>
      <td className={s.who}>
        <Link href={`/drafts/a/case/${c.id}`} className={s.rowLink}>
          {c.buyer}
        </Link>
        <span className={s.sub}>{c.item}</span>
      </td>
      <td className={s.num}>
        {usd(c.amount)}
        {kept !== null && <span className={s.sub}>kept {usd(kept)}</span>}
      </td>
      <td>
        {REASON_LABEL[c.reason]}
        <span className={s.sub}>{c.stage === "CHARGEBACK" ? "Chargeback" : "Inquiry"}</span>
      </td>
      <td>
        {c.outcome ? OUTCOME_LABEL[c.outcome] : STATUS_LABEL[c.status]}
        <span className={`${s.sub} ${s.mono}`}>{c.id}</span>
      </td>
      <td className={s.stateCell}>
        <DeskWord id={c.id} label={STATE_LABEL[c.state]} cls={s["st_" + c.state]} />
        <span className={s.sub}>{c.lastEvent}</span>
      </td>
      <td className={s.when}>
        {day(c.lastEventAt)}
        <span className={s.sub}>{time(c.lastEventAt)}</span>
      </td>
    </tr>
  );
}

export default async function DraftAInbox({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const filter = FILTERS.find((x) => x.key === f) ?? FILTERS[0];
  const all = sortedCases();
  const rows = all.filter(filter.test);
  const live = rows.filter((c) => !c.closedAt);
  const closed = rows.filter((c) => c.closedAt);

  return (
    <div className={s.app}>
      <Bar active={filter.key === "approval" ? "approvals" : "inbox"} />
      <div className={s.inboxGrid}>
        <nav className={s.filters} aria-label="Filters">
          <ul>
            {FILTERS.map((x) => (
              <li key={x.key}>
                <Link
                  href={x.key === "all" ? "/drafts/a/inbox" : `/drafts/a/inbox?f=${x.key}`}
                  className={x.key === filter.key ? s.on : undefined}
                >
                  <span>{x.label}</span>
                  {x.key === "approval" ? (
                    <ApprovalCount className={s.fN} />
                  ) : (
                    <span className={s.fN}>{all.filter(x.test).length}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className={s.inboxMain}>
          <div className={s.inboxHead}>
            <h1 className={s.title}>{filter.key === "all" ? "Disputes" : filter.label}</h1>
            <span className={s.muted}>
              {rows.length} {rows.length === 1 ? "case" : "cases"}, soonest deadline first. Times Pacific.
            </span>
            <OpenTest />
          </div>
          <table className={s.inbox}>
            <thead>
              <tr>
                <th>Respond within</th>
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
              {closed.length > 0 && live.length > 0 && (
                <tr className={s.groupRow}>
                  <td colSpan={7}>Closed this month</td>
                </tr>
              )}
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
