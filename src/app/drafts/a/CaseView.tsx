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
} from "../_data";
import { agentCost, caseDetail, type CaseDetail, type Step } from "../_cases";
import { EvidencePages } from "../_pages";
import { Bar } from "./Bar";
import { Ask, DeskWord, LiveLine, Sandbox, TailRows } from "./Controls";
import { StepRow } from "./Rows";
import s from "./a.module.css";

const href = (id: string) => `/drafts/a/case/${id}`;

function byDay(steps: Step[]) {
  const out: { day: string; steps: Step[] }[] = [];
  for (const st of steps) {
    const d = `${weekday(st.at)} ${day(st.at)}`;
    if (out.at(-1)?.day !== d) out.push({ day: d, steps: [] });
    out.at(-1)!.steps.push(st);
  }
  return out;
}

/** Rail block for a case that isn't waiting on the seller: what the agent is doing, or how it ended. */
function Status({ d }: { d: CaseDetail }) {
  if (d.outcome)
    return (
      <section className={s.ask}>
        <h2 className={`${s.askHead} ${d.c.state === "won" ? s.okHead : s.plainHead}`}>{OUTCOME_LABEL[d.c.outcome!]}</h2>
        <p className={s.askAmt}>You kept {usd(d.outcome.kept)}</p>
        <p className={s.muted}>
          {d.outcome.line} Closed {day(d.c.closedAt!)}, {time(d.c.closedAt!)}.
        </p>
      </section>
    );
  return (
    <section className={s.ask}>
      <h2 className={`${s.askHead} ${s.plainHead}`}>{STATE_LABEL[d.c.state]}</h2>
      <p className={s.muted}>{d.working ?? "PayPal has the evidence. Nothing for you to do until it decides."}</p>
    </section>
  );
}

export function CaseView({ id }: { id: string }) {
  const d = caseDetail(id)!;
  const c = d.c;
  const cases = sortedCases();
  const i = cases.findIndex((x) => x.id === id);
  const next = cases[(i + 1) % cases.length];
  const spend = agentCost(d);
  const hot = c.dueAt && hoursLeft(c.dueAt) < 72;

  return (
    <div className={s.app}>
      <Bar active="case" />
      <div className={s.desk}>
        <aside className={s.list} aria-label="Cases">
          <p className={s.listHead}>
            <Link href="/drafts/a/inbox">All disputes</Link>
            <span className={s.muted}>by deadline</span>
          </p>
          <ol>
            {cases.map((x) => (
              <li key={x.id} className={x.id === id ? s.current : undefined}>
                <Link href={href(x.id)}>
                  <span className={s.lName}>{x.buyer}</span>
                  <span className={s.lAmt}>{usd(x.amount)}</span>
                  <span className={s.lState}>
                    <DeskWord id={x.id} label={STATE_LABEL[x.state]} cls={s["st_" + x.state]} />
                  </span>
                  <span className={x.dueAt && hoursLeft(x.dueAt) < 72 ? s.lDueHot : s.lDue}>
                    {x.dueAt ? countdown(x.dueAt) : x.closedAt ? day(x.closedAt) : "with PayPal"}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </aside>

        <main className={s.main}>
          <section className={s.head}>
            <div className={s.headTop}>
              <h1 className={s.title}>{d.title}</h1>
              <div className={s.headline}>
                <p className={s.amount}>{usd(c.amount)}</p>
                {c.dueAt ? (
                  <p className={s.due}>
                    <span className={`${s.dueBig} ${hot ? s.hot : ""}`}>{countdown(c.dueAt)}</span>
                    <span className={s.muted}>
                      left to respond, due {weekday(c.dueAt)} {day(c.dueAt)}, {time(c.dueAt)}
                    </span>
                  </p>
                ) : (
                  <p className={s.due}>
                    <span className={s.muted}>
                      {c.closedAt ? `Closed ${weekday(c.closedAt)} ${day(c.closedAt)}` : `With PayPal since ${day(c.lastEventAt)}`}
                    </span>
                  </p>
                )}
              </div>
              <LiveLine id={id} />
            </div>
            <div className={s.headMore}>
              <dl className={s.facts}>
                <div>
                  <dt>CaseClerk</dt>
                  <dd>
                    <DeskWord id={id} label={STATE_LABEL[c.state]} cls={s["st_" + c.state]} />
                  </dd>
                </div>
                <div>
                  <dt>Reason</dt>
                  <dd>
                    {REASON_LABEL[c.reason]}
                    <span className={s.code}>{c.reason}</span>
                  </dd>
                </div>
                <div>
                  <dt>PayPal</dt>
                  <dd>
                    {c.stage === "CHARGEBACK" ? "Chargeback" : "Inquiry"}
                    <span className={s.sub}>{c.outcome ? OUTCOME_LABEL[c.outcome] : STATUS_LABEL[c.status]}</span>
                    <span className={`${s.sub} ${s.mono}`}>{c.id}</span>
                  </dd>
                </div>
                <div>
                  <dt>Delivery</dt>
                  <dd>
                    <span className={s.mono}>{c.shipment.tracking}</span>
                    <span className={s.sub}>
                      {c.shipment.carrier}, {c.shipment.status}
                    </span>
                  </dd>
                </div>
              </dl>
              <blockquote className={s.claim}>
                <p>{c.claim}</p>
                <footer className={s.muted}>
                  {c.buyer}, {c.buyerCity}, {day(c.openedAt)}
                </footer>
              </blockquote>
            </div>
          </section>

          <section className={s.timelineSec} aria-label="Timeline">
            <div className={s.secHead}>
              <h2>Timeline</h2>
              <span className={s.muted}>
                Agent cost{" "}
                <span className={s.costTip} title={spend.split || "No model calls yet"}>
                  {spend.total}
                </span>
              </span>
            </div>
            <table className={s.tl}>
              <tbody>
                {byDay(d.steps).map((g) => [
                  <tr key={g.day} className={s.tlDay}>
                    <td colSpan={3}>{g.day}</td>
                  </tr>,
                  ...g.steps.map((st) => <StepRow key={st.at + st.title} st={st} />),
                ])}
                {d.approval && <TailRows id={id} />}
              </tbody>
            </table>
            <p className={s.nextCase}>
              <Link href={href(next.id)} className={s.link}>
                Next case: {next.buyer}
              </Link>
            </p>
          </section>
        </main>

        <aside className={s.rail} aria-label="Decision">
          {d.approval ? <Ask id={id} /> : <Status d={d} />}

          {d.decision && (
            <section className={s.why}>
              <div className={s.secHead}>
                <h2>{d.approval ? "Why this option" : "What the agent decided"}</h2>
                <span className={s.muted}>
                  {d.decision.model}, {day(d.decision.at)}
                </span>
              </div>
              <p className={s.decHead}>{d.decision.headline}</p>
              <table className={s.ev}>
                <thead>
                  <tr>
                    <th>Option</th>
                    <th className={s.num}>Expected to keep</th>
                  </tr>
                </thead>
                <tbody>
                  {d.decision.options.map((o) => (
                    <tr key={o.key} className={o.chosen ? s.chosen : undefined}>
                      <td>
                        {o.name}
                        <span className={s.sub}>{o.math}</span>
                      </td>
                      <td className={s.num}>{usd(o.ev)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {d.decision.valueNote && <p className={s.valueNote}>{d.decision.valueNote}</p>}
              <p className={s.rationale}>{d.decision.rationale}</p>
            </section>
          )}

          {d.exhibits && (
            <section className={s.pack}>
              <div className={s.secHead}>
                <h2>Evidence pack</h2>
                <span className={s.muted}>{d.pages ? "PDF, 4 pages" : `${d.exhibits.length} exhibits`}</span>
              </div>
              <p className={s.muted}>{d.exhibitsNote}</p>
              {d.pages && <EvidencePages className={s.pages} />}
              <ol className={s.exhibits}>
                {d.exhibits.map((e) => (
                  <li key={e.ref}>
                    <span className={s.exRef}>{e.ref}</span>
                    <span>
                      {e.name}
                      <span className={s.sub}>{e.detail}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {!c.closedAt && <Sandbox id={id} />}
        </aside>
      </div>
    </div>
  );
}
