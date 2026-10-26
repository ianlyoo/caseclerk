import { getPolicy, listCases } from "../_lib/api";
import { clock, usd } from "../_lib/format";
import { TopBar } from "../_ui/Chrome";
import { DOLLARS, PERCENT, PolicyLane } from "../_ui/PolicyLane";

const short = (v: number) => usd(v).replace(".00", "");
const pct = (v: number) => `${Math.round(v * 100)}%`;

export async function Policy() {
  const [policy, list] = await Promise.all([getPolicy(), listCases()]);
  if (!policy) {
    return (
      <div className="metal page-error">
        <TopBar here="policy" />
        <div className="wrap">
          <h1 className="h-section">CaseClerk can&rsquo;t read the seller&rsquo;s rules right now.</h1>
          <p className="body">Try again in a minute.</p>
        </div>
      </div>
    );
  }

  const evidence = policy.evidenceApprovalAtUsd ?? 250;
  const refund = policy.autoRefundMaxUsd ?? 15;
  const approval = policy.approvalAboveUsd ?? refund;
  const amounts = (list ?? []).map((c) => Number(c.snapshot.amount.value)).filter(Number.isFinite);
  const called = (list ?? []).flatMap((c) => (c.decision ? [c.decision.winProbability] : []));
  // the money lane's own zone ends at the lower of the two lines; above it, it asks
  const asksFrom = Math.min(refund, approval);

  return (
    <div className="policy">
      <div className="metal">
        <TopBar here="policy" />
        <header className="wrap policy-head">
          <h1 className="inbox-title">Your rules</h1>
          <p className="policy-lede">CaseClerk checks every action against these lines before it calls PayPal.</p>
          <p className="policy-note">The seller edits these in their CaseClerk account. Shown read-only here, so no visitor changes the rules other cases run under.</p>
        </header>
      </div>

      <section className="metal policy-band" aria-labelledby="money-title">
        <div className="wrap rules-grid">
          <div className="rules-copy">
            <h2 id="money-title" className="h-section">
              Your lines decide when it asks.
            </h2>
            <p className="body">
              Over {short(evidence)} to file evidence, or over {short(asksFrom)} to refund or offer, it asks you first. Below those lines CaseClerk acts on
              its own.
              {approval > refund ? <> Your {short(approval)} approval line sits above the {short(refund)} refund limit, so the {short(refund)} limit is the one that asks.</> : null}
            </p>
          </div>
          <div className="ledger">
            <PolicyLane
              title="Filing evidence"
              axis={DOLLARS}
              line={evidence}
              lineLabel={`Asks at ${short(evidence)} and up`}
              below="On its own"
              above="Asks you"
              ask
              marks={amounts.length ? { label: `The ${amounts.length} cases on file`, values: amounts } : undefined}
            />
            <PolicyLane
              title="Refunds and offers"
              axis={DOLLARS}
              line={asksFrom}
              lineLabel={`Asks over ${short(asksFrom)}`}
              below="On its own"
              above="Asks you"
              ask
              extra={approval !== refund ? { v: approval, label: `${short(approval)} approval line` } : undefined}
            />
          </div>
        </div>
      </section>

      <section className="metal policy-band policy-judge" aria-labelledby="judge-title">
        <div className="wrap rules-grid">
          <div className="rules-copy">
            <h2 id="judge-title" className="h-section">
              It fights when the odds are there.
            </h2>
            <p className="body">
              Below a {pct(policy.minWinProbabilityToFight)} chance that PayPal sides with you, CaseClerk prefers a refund or an offer when that costs
              less. An offer never goes past {policy.maxOfferPercent}% of the disputed amount.
            </p>
          </div>
          <div className="ledger">
            <PolicyLane
              title="Chance PayPal sides with you"
              axis={PERCENT}
              line={policy.minWinProbabilityToFight}
              lineLabel={`${pct(policy.minWinProbabilityToFight)} minimum to fight`}
              below="Settles if cheaper"
              above="Fights"
              marks={called.length ? { label: `${called.length} cases it has called`, values: called } : undefined}
            />
            <PolicyLane
              title="Largest partial offer"
              axis={PERCENT}
              line={policy.maxOfferPercent / 100}
              lineLabel={`${policy.maxOfferPercent}% of the disputed amount`}
              below="Offers"
              above="Never"
              open
            />
          </div>
        </div>
      </section>

      <section className="leather policy-voice" aria-labelledby="voice-title">
        <div className="wrap waiting-grid">
          <div className="waiting-head">
            <h2 id="voice-title" className="plate-k">
              How it writes to buyers
            </h2>
            <blockquote className="policy-quote">
              <p>&ldquo;{policy.voice}&rdquo;</p>
            </blockquote>
          </div>
          <dl className="facts facts-dark">
            <div>
              <dt>Dry run</dt>
              <dd>{policy.dryRun ? "On: CaseClerk proposes, and sends nothing to PayPal" : "Off: CaseClerk sends its answers to PayPal, the sandbox here"}</dd>
            </div>
            <div>
              <dt>Read from</dt>
              <dd>
                CaseClerk&rsquo;s policy API, {clock(new Date().toISOString())} PT
              </dd>
            </div>
            <div>
              <dt>Who changes them</dt>
              <dd>The seller, in their CaseClerk account</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
