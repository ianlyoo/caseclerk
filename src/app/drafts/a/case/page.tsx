import Link from "next/link";
import {
  HERO,
  HERO_COST,
  POLICY,
  REASON_LABEL,
  STATE_LABEL,
  STATUS_LABEL,
  TIMELINE,
  clock,
  cost,
  countdown,
  day,
  hoursLeft,
  sortedCases,
  time,
  usd,
  weekday,
  type Step,
} from "../../_data";
import { EvidencePages } from "../../_pages";
import { Bar } from "../Bar";
import { Approval, Sandbox } from "../Controls";
import s from "../a.module.css";

const ACTOR: Record<Step["actor"], string> = {
  paypal: "PayPal",
  agent: "Agent",
  tool: "Tool",
  seller: "You",
  system: "Policy",
};

function byDay(steps: Step[]) {
  const out: { day: string; steps: Step[] }[] = [];
  for (const st of steps) {
    const d = `${weekday(st.at)} ${day(st.at)}`;
    if (out.at(-1)?.day !== d) out.push({ day: d, steps: [] });
    out.at(-1)!.steps.push(st);
  }
  return out;
}

export default function DraftACase() {
  const cases = sortedCases();
  const d = HERO.decision;

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
            {cases.map((c) => (
              <li key={c.id} className={c.id === HERO.id ? s.current : undefined}>
                <Link href="/drafts/a/case">
                  <span className={s.lName}>{c.buyer}</span>
                  <span className={s.lAmt}>{usd(c.amount)}</span>
                  <span className={`${s.lState} ${s["st_" + c.state]}`}>{STATE_LABEL[c.state]}</span>
                  <span className={c.dueAt && hoursLeft(c.dueAt) < 72 ? s.lDueHot : s.lDue}>
                    {c.dueAt ? countdown(c.dueAt) : c.closedAt ? day(c.closedAt) : "with PayPal"}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </aside>

        <main className={s.main}>
          <section className={s.head}>
            <h1 className={s.title}>
              {HERO.buyer.name}, Olympus OM-1n with Zuiko 50mm f/1.8
            </h1>
            <div className={s.headline}>
              <p className={s.amount}>{usd(HERO.amount)}</p>
              <p className={s.due}>
                <span className={s.dueBig}>{countdown(HERO.dueAt)}</span>
                <span className={s.muted}>
                  left to respond, due {weekday(HERO.dueAt)} {day(HERO.dueAt)}, {time(HERO.dueAt)}
                </span>
              </p>
            </div>
            <dl className={s.facts}>
              <div>
                <dt>Dispute</dt>
                <dd className={s.mono}>{HERO.id}</dd>
              </div>
              <div>
                <dt>Reason</dt>
                <dd>
                  {REASON_LABEL[HERO.reason]}
                  <span className={s.code}>{HERO.reason}</span>
                </dd>
              </div>
              <div>
                <dt>PayPal</dt>
                <dd>
                  Inquiry stage
                  <span className={s.sub}>{STATUS_LABEL[HERO.status]}</span>
                </dd>
              </div>
              <div>
                <dt>Order</dt>
                <dd>
                  <span className={s.mono}>{HERO.order.id}</span>
                  <span className={s.sub}>Paid {day(HERO.order.paidAt)}</span>
                </dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>
                  <span className={s.mono}>{HERO.shipment.tracking}</span>
                  <span className={s.sub}>UPS, delivered Oct 14, signed {HERO.shipment.signedBy}</span>
                </dd>
              </div>
            </dl>
            <blockquote className={s.claim}>
              <p>{HERO.claim.text}</p>
              <footer className={s.muted}>
                {HERO.buyer.name}, {day(HERO.claim.at)} at {time(HERO.claim.at)}
              </footer>
            </blockquote>
          </section>

          <section className={s.timelineSec} aria-label="Agent timeline">
            <div className={s.secHead}>
              <h2>Timeline</h2>
              <span className={s.muted}>
                {TIMELINE.length} steps, agent cost {cost(HERO_COST)}
              </span>
            </div>
            <table className={s.tl}>
              <tbody>
                {byDay(TIMELINE).map((g) => [
                  <tr key={g.day} className={s.tlDay}>
                    <td colSpan={5}>{g.day}</td>
                  </tr>,
                  ...g.steps.map((st) => (
                    <tr key={st.at} className={st.pending ? s.tlPending : undefined}>
                      <td className={s.tlTime}>{clock(st.at)}</td>
                      <td className={`${s.tlActor} ${s["ac_" + st.actor]}`}>{ACTOR[st.actor]}</td>
                      <td className={s.tlWhat}>
                        <span className={s.tlTitle}>{st.title}</span>
                        {st.detail && <span className={s.tlDetail}>{st.detail}</span>}
                      </td>
                      <td className={s.tlCode}>{st.code}</td>
                      <td className={s.tlCost}>{st.costUsd ? cost(st.costUsd) : ""}</td>
                    </tr>
                  )),
                ])}
              </tbody>
            </table>
          </section>
        </main>

        <aside className={s.rail} aria-label="Decision">
          <section className={s.ask}>
            <h2 className={s.askHead}>Needs your approval</h2>
            <p className={s.askAmt}>{usd(HERO.approval.amount)} partial refund</p>
            <p className={s.muted}>
              Buyer keeps the camera. Above your {usd(POLICY.approvalAboveUsd)} approval line, within your{" "}
              {POLICY.maxOfferPercent}% offer cap.
            </p>
            <div className={s.note}>
              <p className={s.noteHead}>Message PayPal sends with the offer</p>
              <p>{HERO.approval.note}</p>
            </div>
            <Approval />
          </section>

          <section className={s.why}>
            <div className={s.secHead}>
              <h2>Why this option</h2>
              <span className={s.muted}>
                {d.model}, {time(d.at)}
              </span>
            </div>
            <table className={s.ev}>
              <thead>
                <tr>
                  <th>Option</th>
                  <th className={s.num}>Expected to keep</th>
                </tr>
              </thead>
              <tbody>
                {d.options.map((o) => (
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
            <p className={s.rationale}>{d.rationale}</p>
          </section>

          <section className={s.pack}>
            <div className={s.secHead}>
              <h2>Evidence pack</h2>
              <a href="#pdf" className={s.link}>
                PDF, {HERO.evidence.pages} pages
              </a>
            </div>
            <p className={s.muted}>Ready if the buyer declines the offer. Built {time(HERO.evidence.builtAt)}.</p>
            <EvidencePages className={s.pages} />
            <ol className={s.exhibits}>
              {HERO.evidence.exhibits.map((e) => (
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

          <Sandbox />
        </aside>
      </div>
    </div>
  );
}
