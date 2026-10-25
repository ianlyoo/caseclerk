import {
  HERO,
  HERO_COST,
  POLICY,
  STATUS_LABEL,
  TIMELINE,
  clock,
  cost,
  countdown,
  day,
  time,
  usd,
  weekday,
  type Step,
} from "../../_data";
import { EvidencePages } from "../../_pages";
import { Decide, SandboxLine } from "../Controls";
import { Masthead } from "../Masthead";
import s from "../b.module.css";

const WHO: Record<Step["actor"], string> = {
  paypal: "PayPal",
  agent: "Agent",
  tool: "Agent tool",
  seller: "You",
  system: "Your policy",
};

function days(steps: Step[]) {
  const out: { day: string; steps: Step[] }[] = [];
  for (const st of steps) {
    const d = `${weekday(st.at)}, ${day(st.at)}`;
    if (out.at(-1)?.day !== d) out.push({ day: d, steps: [] });
    out.at(-1)!.steps.push(st);
  }
  return out;
}

export default function DraftBCase() {
  const d = HERO.decision;
  return (
    <div className={s.page}>
      <Masthead here="case" />

      <article className={s.file}>
        <header className={s.row}>
          <p className={s.margin}>
            <span className={s.mono}>{HERO.id}</span>
            <br />
            opened {day(HERO.openedAt)}
          </p>
          <div className={s.text}>
            <h1 className={s.h1}>Daniel Okafor says the Olympus OM-1n he bought is not as described.</h1>
            <dl className={s.facts}>
              <dt>Amount</dt>
              <dd>
                <span className={s.big}>{usd(HERO.amount)}</span>, the whole order, paid {day(HERO.order.paidAt)}
              </dd>
              <dt>Respond by</dt>
              <dd>
                <span className={s.big}>{countdown(HERO.dueAt)}</span> from now, {weekday(HERO.dueAt)}{" "}
                {day(HERO.dueAt)} at {time(HERO.dueAt)}
              </dd>
              <dt>Reason</dt>
              <dd className={s.mono}>{HERO.reason}</dd>
              <dt>At PayPal</dt>
              <dd>
                Inquiry, {STATUS_LABEL[HERO.status].toLowerCase()}. Offer, message or refund allowed.
              </dd>
              <dt>Delivered</dt>
              <dd>
                UPS <span className={s.mono}>{HERO.shipment.tracking}</span>, Oct 14 in Toronto, signed{" "}
                {HERO.shipment.signedBy}
              </dd>
            </dl>
          </div>
        </header>

        <section className={s.row}>
          <p className={s.margin}>
            The buyer, {day(HERO.claim.at)}
            <br />
            {time(HERO.claim.at)}
          </p>
          <blockquote className={`${s.text} ${s.claim}`}>&ldquo;{HERO.claim.text}&rdquo;</blockquote>
        </section>

        <section className={`${s.row} ${s.recommend}`}>
          <p className={s.margin}>
            <span className={s.green}>Waiting for you</span>
            <br />
            {usd(HERO.approval.amount)} is above your {usd(POLICY.approvalAboveUsd)} line. Nothing reaches PayPal until
            you decide.
          </p>
          <div className={s.text}>
            <h2 className={s.h2}>Offer Daniel {usd(HERO.approval.amount)} and let him keep the camera.</h2>
            <p className={s.body}>{d.rationale}</p>
            <table className={s.ev}>
              <thead>
                <tr>
                  <th>If you</th>
                  <th>Because</th>
                  <th className={s.num}>You keep, on average</th>
                </tr>
              </thead>
              <tbody>
                {d.options.map((o) => (
                  <tr key={o.key} className={o.chosen ? s.pick : undefined}>
                    <td>{o.name}</td>
                    <td className={s.quiet}>{o.math}</td>
                    <td className={s.num}>{usd(o.ev)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Decide />
            <p className={s.label}>The note PayPal sends Daniel with the offer</p>
            <p className={s.letter}>{HERO.approval.note}</p>
          </div>
        </section>

        <section className={s.row}>
          <p className={s.margin}>
            {TIMELINE.length} steps
            <br />
            agent cost {cost(HERO_COST)}
          </p>
          <h2 className={`${s.text} ${s.h3}`}>How the agent got here</h2>
        </section>

        {days(TIMELINE).map((g) => (
          <section key={g.day} className={s.dayBlock}>
            <div className={s.row}>
              <p className={`${s.margin} ${s.dayName}`}>{g.day}</p>
            </div>
            <ol className={s.steps}>
              {g.steps.map((st) => (
                <li key={st.at} className={`${s.row} ${st.pending ? s.now : ""}`}>
                  <p className={s.margin}>
                    <span className={s.mono}>{clock(st.at)}</span>
                    <br />
                    {WHO[st.actor]}
                  </p>
                  <div className={s.text}>
                    <p className={s.stepTitle}>{st.title}</p>
                    {st.detail && <p className={s.stepDetail}>{st.detail}</p>}
                    {st.code && <p className={s.stepCode}>{st.code}</p>}
                  </div>
                  <p className={s.right}>{st.costUsd ? cost(st.costUsd) : ""}</p>
                </li>
              ))}
            </ol>
          </section>
        ))}

        <section className={`${s.row} ${s.evidenceHead}`}>
          <p className={s.margin}>
            Built {day(HERO.evidence.builtAt)}, {time(HERO.evidence.builtAt)}
            <br />
            <a href="#pdf" className={s.inlineLink}>
              Download the PDF
            </a>
          </p>
          <div className={s.text}>
            <h2 className={s.h3}>The evidence pack, if he says no</h2>
            <p className={s.body}>
              Four pages, five exhibits, filed as PROOF_OF_FULFILLMENT and OTHER if Daniel declines the offer.
            </p>
          </div>
        </section>
        <div className={s.row}>
          <EvidencePages className={s.pagesWide} />
        </div>
        <section className={s.row}>
          <ol className={`${s.text} ${s.exhibits}`}>
            {HERO.evidence.exhibits.map((e) => (
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

        <footer className={`${s.row} ${s.foot}`}>
          <div className={s.text}>
            <SandboxLine />
          </div>
        </footer>
      </article>
    </div>
  );
}
