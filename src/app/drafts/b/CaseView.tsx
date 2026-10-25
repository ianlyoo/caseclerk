import { Fragment } from "react";
import Link from "next/link";
import {
  OUTCOME_LABEL,
  REASON_LABEL,
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
import { Decide, DecisionMargin, Live, SandboxLine, Tail } from "./Controls";
import { Masthead } from "./Masthead";
import { BStep } from "./Rows";
import s from "./b.module.css";

const href = (id: string) => `/drafts/b/case/${id}`;

function days(steps: Step[]) {
  const out: { day: string; steps: Step[] }[] = [];
  for (const st of steps) {
    const d = `${weekday(st.at)}, ${day(st.at)}`;
    if (out.at(-1)?.day !== d) out.push({ day: d, steps: [] });
    out.at(-1)!.steps.push(st);
  }
  return out;
}

/** A PayPal code that may break at its underscores and nowhere else. */
function Code({ text }: { text: string }) {
  const parts = text.split("_");
  return (
    <span className={s.mono}>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {p}
          {i < parts.length - 1 && (
            <>
              _<wbr />
            </>
          )}
        </Fragment>
      ))}
    </span>
  );
}

/** The recommendation block for a case that isn't waiting on the seller. */
function Standing({ d }: { d: CaseDetail }) {
  const c = d.c;
  if (d.outcome)
    return (
      <>
        <p className={s.margin}>
          <span className={c.state === "won" ? s.green : s.ink}>{OUTCOME_LABEL[c.outcome!]}</span>
          <br />
          closed {day(c.closedAt!)}, {time(c.closedAt!)}
        </p>
        <div className={s.text}>
          <h2 className={s.h2}>You kept {usd(d.outcome.kept)}.</h2>
          <p className={s.body}>{d.outcome.line}</p>
        </div>
      </>
    );
  return (
    <>
      <p className={s.margin}>
        <span className={s.ink}>{c.state === "waiting_paypal" ? "With PayPal" : "Agent working"}</span>
        <br />
        nothing for you to do yet
      </p>
      <div className={s.text}>
        <h2 className={s.h2}>{d.decision?.headline ?? d.working ?? "PayPal has your evidence and is deciding."}</h2>
        <p className={s.body}>
          {d.decision && d.working ? d.working : c.state === "waiting_paypal" ? `${c.lastEvent}. PayPal usually decides within 30 days.` : null}
        </p>
      </div>
    </>
  );
}

export function CaseView({ id }: { id: string }) {
  const d = caseDetail(id)!;
  const c = d.c;
  const dec = d.decision;
  const cases = sortedCases();
  const i = cases.findIndex((x) => x.id === id);
  const prev = cases[(i - 1 + cases.length) % cases.length];
  const next = cases[(i + 1) % cases.length];
  const spend = agentCost(d);
  const hot = c.dueAt && hoursLeft(c.dueAt) < 72;
  const first = c.buyer.split(" ")[0];

  return (
    <div className={s.page}>
      <Masthead here="case" />

      <article className={s.file}>
        <header className={s.row}>
          <p className={s.margin}>
            <span className={s.mono}>{c.id}</span>
            <br />
            opened {day(c.openedAt)}
          </p>
          <div className={s.text}>
            <h1 className={s.h1}>{d.headline}</h1>
            <p className={s.lede}>
              <span className={s.big}>{usd(c.amount)}</span>
              {c.dueAt ? (
                <>
                  , respond within <span className={`${s.big} ${hot ? s.red : ""}`}>{countdown(c.dueAt)}</span>, by{" "}
                  {weekday(c.dueAt)} {day(c.dueAt)} {time(c.dueAt)}
                </>
              ) : c.closedAt ? (
                <>, closed {day(c.closedAt)}</>
              ) : (
                <>, with PayPal since {day(c.lastEventAt)}</>
              )}
            </p>
            <Live id={id} />
          </div>
        </header>

        <section className={`${s.row} ${s.recommend}`}>
          {d.approval ? (
            <>
              <DecisionMargin id={id} did={d.did ?? ""} />
              <div className={s.text}>
                <h2 className={s.h2}>{dec!.headline}</h2>
                <Decide id={id} />
                <p className={s.body}>{dec!.rationale}</p>
                <table className={s.ev}>
                  <thead>
                    <tr>
                      <th>If you</th>
                      <th>Because</th>
                      <th className={s.num}>You keep, on average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dec!.options.map((o) => (
                      <tr key={o.key} className={o.chosen ? s.pick : undefined}>
                        <td>{o.name}</td>
                        <td className={s.quiet}>{o.math}</td>
                        <td className={s.num}>{usd(o.ev)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dec!.valueNote && <p className={s.valueNote}>{dec!.valueNote}</p>}
                <p className={s.label}>The note PayPal sends {first}</p>
                <p className={s.letter}>{d.approval.note}</p>
              </div>
            </>
          ) : (
            <Standing d={d} />
          )}
        </section>

        <section className={s.row}>
          <p className={s.margin}>
            {first}, {day(c.openedAt)}
            <br />
            {c.buyerCity}
          </p>
          <blockquote className={`${s.text} ${s.claim}`}>&ldquo;{c.claim}&rdquo;</blockquote>
        </section>

        <section className={s.row}>
          <div className={s.text}>
            <dl className={s.facts}>
              <dt>Reason</dt>
              <dd>
                {REASON_LABEL[c.reason]}
                <br />
                <Code text={c.reason} />
              </dd>
              <dt>At PayPal</dt>
              <dd>
                {c.stage === "CHARGEBACK" ? "Chargeback" : "Inquiry"},{" "}
                {(c.outcome ? OUTCOME_LABEL[c.outcome] : STATUS_LABEL[c.status]).toLowerCase()}
              </dd>
              <dt>Delivered</dt>
              <dd>
                {c.shipment.carrier} <span className={s.mono}>{c.shipment.tracking}</span>, {c.shipment.status}
              </dd>
              <dt>Item</dt>
              <dd>{c.item}</dd>
            </dl>
          </div>
        </section>

        {!d.approval && dec && (
          <section className={s.row}>
            <p className={s.margin}>
              {dec.model}
              <br />
              {day(dec.at)}, {time(dec.at)}
            </p>
            <div className={s.text}>
              <h2 className={s.h3}>What the agent weighed</h2>
              <p className={s.body}>{dec.rationale}</p>
              <table className={s.ev}>
                <tbody>
                  {dec.options.map((o) => (
                    <tr key={o.key} className={o.chosen ? s.pick : undefined}>
                      <td>{o.name}</td>
                      <td className={s.quiet}>{o.math}</td>
                      <td className={s.num}>{usd(o.ev)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className={`${s.row} ${s.tlHead}`}>
          <p className={s.margin}>
            agent cost{" "}
            <span className={s.costTip} title={spend.split || "No model calls yet"}>
              {spend.total}
            </span>
          </p>
          <h2 className={`${s.text} ${s.h3}`}>How the agent got here</h2>
        </section>

        {days(d.steps).map((g) => (
          <section key={g.day} className={s.dayBlock}>
            <div className={s.row}>
              <p className={`${s.margin} ${s.dayName}`}>{g.day}</p>
            </div>
            <ol className={s.steps}>
              {g.steps.map((st) => (
                <BStep key={st.at + st.title} st={st} />
              ))}
            </ol>
          </section>
        ))}
        {d.approval && <Tail id={id} />}

        {d.exhibits && (
          <>
            <section className={`${s.row} ${s.evidenceHead}`}>
              <p className={s.margin}>{d.pages ? "PDF, 4 pages" : `${d.exhibits.length} exhibits`}</p>
              <div className={s.text}>
                <h2 className={s.h3}>The evidence pack</h2>
                <p className={s.body}>{d.exhibitsNote}</p>
              </div>
            </section>
            {d.pages && (
              <div className={s.row}>
                <EvidencePages className={s.pagesWide} />
              </div>
            )}
            <section className={s.row}>
              <ol className={`${s.text} ${s.exhibits}`}>
                {d.exhibits.map((e) => (
                  <li key={e.ref}>
                    <span className={s.exRef}>Exhibit {e.ref}</span>
                    <span>
                      {e.name}
                      <span className={s.quietBlock}>{e.detail}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}

        <nav className={`${s.row} ${s.pager}`} aria-label="Other cases">
          <p className={s.margin}>
            <Link href={href(prev.id)} className={s.inlineLink}>
              &larr; {prev.buyer}
            </Link>
          </p>
          <p className={s.text}>
            <Link href="/drafts/b/inbox" className={s.inlineLink}>
              All disputes
            </Link>
          </p>
          <p className={s.right}>
            <Link href={href(next.id)} className={s.inlineLink}>
              {next.buyer} &rarr;
            </Link>
          </p>
        </nav>

        {!c.closedAt && (
          <footer className={`${s.row} ${s.foot}`}>
            <div className={s.text}>
              <SandboxLine id={id} />
            </div>
          </footer>
        )}
      </article>
    </div>
  );
}
