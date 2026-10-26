import Link from "next/link";
import type { CaseRecord } from "@/lib/types";
import { getCase, getPolicy, listCases } from "./_lib/api";
import { dayClock, daysLeft, day, reasonWords, stageWord, usd, cap } from "./_lib/format";
import { arrivedAt, moneyFor, STORY_TICKS, storyStops } from "./_lib/story";
import { Scale } from "./_ui/Scale";
import { TopBar } from "./_ui/Chrome";
import { Ledger } from "./_ui/Ledger";

export const dynamic = "force-dynamic";

/** The resolved case the landing tells: approved by the seller, filed, closed by PayPal for the seller. */
const STORY_ID = "PP-R-SGV-10194507";
/** The case kept waiting for the owner's demo; any other waiting case stands in once it is answered. */
const WAITING_ID = "PP-R-VPY-10194485";

export default async function Landing() {
  const [story, list, policy] = await Promise.all([getCase(STORY_ID), listCases(), getPolicy()]);
  const waitingRow: CaseRecord | undefined =
    list?.find((c) => c.id === WAITING_ID && c.status === "awaiting_approval") ?? list?.find((c) => c.status === "awaiting_approval");
  const waiting = waitingRow ? await getCase(waitingRow.id) : null;

  if (!story) {
    return (
      <main className="metal page-error">
        <TopBar />
        <div className="wrap">
          <h1 className="h-section">CaseClerk can&rsquo;t reach its case data right now.</h1>
          <p className="body">Try again in a minute.</p>
        </div>
      </main>
    );
  }

  const evidenceLine = policy?.evidenceApprovalAtUsd ?? 250;
  const moneyLine = policy?.approvalAboveUsd ?? 50;
  const m = moneyFor(story);
  const amount = usd(story.case.snapshot.amount.value);
  const kept = m ? usd(m.kept.value) : null;
  const stops = storyStops(story).map((s) => (s.id === "ask" ? { ...s, detail: `Over the ${usd(evidenceLine).replace(".00", "")} line` } : s));
  const w = waiting?.case;
  const wAmount = w ? usd(w.snapshot.amount.value) : null;
  const wDue = w?.snapshot.sellerResponseDueDate;
  const wAction = waiting?.actions.find((a) => a.status === "awaiting_approval");
  const exhibits = ((wAction?.params as { exhibits?: { title: string }[] } | undefined)?.exhibits ?? []).map((e) => e.title);

  return (
    <>
      <div className="metal">
        <TopBar>
          <a href="#story">The case</a>
          <a href="#rules">When it asks</a>
        </TopBar>
        <section className="hero wrap" aria-labelledby="hero-title">
          <h1 id="hero-title" className="hero-title">
            <span className="hero-l1">{amount} disputed.</span>
            {kept && <span className="hero-l2">{kept} kept.</span>}
          </h1>
          <div className="hero-copy">
            <p className="hero-lede">CaseClerk answers PayPal disputes for small sellers and asks before it moves money.</p>
            {m && (
              <p className="hero-fine">
                Kept after PayPal&rsquo;s {usd(m.fee.value)} fee; unanswered, the seller loses {amount} and the fee.
              </p>
            )}
          </div>
          {w && wAmount && (
            <aside className="hero-wait leather" aria-labelledby="hero-wait-title">
              <p id="hero-wait-title" className="hero-wait-k">
                Another case, waiting for you
              </p>
              <p className="hero-wait-amount">{wAmount}</p>
              <p className="hero-wait-body">{w.order?.items[0]?.name ? `${w.order.items[0].name}. ` : ""}A separate sandbox test dispute.</p>
              <Link className="btn btn-go" href={`/d2/case/${w.id}`}>
                Review the {wAmount} case
              </Link>
            </aside>
          )}
        </section>
      </div>

      <section id="story" className="leather band" aria-label="The case, stop by stop">
        <div className="wrap">
          <Scale
            stops={stops}
            ticks={STORY_TICKS}
            tau={15}
            tMax={900}
            replay
            caption={
              <>
                A real PayPal sandbox {stageWord(story.case.snapshot.stage)}, {story.case.order?.items[0]?.name ?? "one order"},{" "}
                {dayClock(arrivedAt(story))}
              </>
            }
            readouts={{ kept: "from chargeback to closed" }}
          />
        </div>
      </section>

      <section id="rules" className="metal rules" aria-labelledby="rules-title">
        <div className="wrap rules-grid">
          <div className="rules-copy">
            <h2 id="rules-title" className="h-section">
              It asks before money moves.
            </h2>
            <p className="body">
              Small cases it answers on its own, under your rules. Over {usd(evidenceLine).replace(".00", "")} to file evidence, or{" "}
              {usd(moneyLine).replace(".00", "")} to refund or offer, it asks you first.
            </p>
          </div>
          <Ledger
            evidenceLine={evidenceLine}
            moneyLine={moneyLine}
            marks={{
              label: w && wAmount ? `The two cases here, ${amount} and ${wAmount}` : `The case above, ${amount}`,
              values: [Number(story.case.snapshot.amount.value), ...(w ? [Number(w.snapshot.amount.value)] : [])],
            }}
          />
        </div>
      </section>

      {w && wAmount && (
        <section className="leather waiting" aria-labelledby="waiting-title">
          <div className="wrap waiting-grid">
            <div className="waiting-head">
              <h2 id="waiting-title" className="h-section">
                Waiting for a yes: {wAmount}
              </h2>
              <p className="body body-on-dark">
                A separate sandbox test dispute on the same camera listing. CaseClerk has the evidence ready and stopped at your line.
              </p>
              <Link className="btn btn-go" href={`/d2/case/${w.id}`}>
                Review the {wAmount} case
              </Link>
            </div>
            <dl className="facts facts-dark">
              <div>
                <dt>Item</dt>
                <dd>{w.order?.items[0]?.name ?? "Order on file"}</dd>
              </div>
              <div>
                <dt>Claim</dt>
                <dd>
                  {cap(stageWord(w.snapshot.stage))}, {reasonWords(w.snapshot.reason)}
                </dd>
              </div>
              <div>
                <dt>Why it waits</dt>
                <dd>
                  {wAmount} is over your {usd(evidenceLine).replace(".00", "")} evidence line
                </dd>
              </div>
              {exhibits.length > 0 && (
                <div>
                  <dt>Ready to file</dt>
                  <dd>{exhibits.join(", ")}</dd>
                </div>
              )}
              {wDue && (
                <div>
                  <dt>PayPal&rsquo;s deadline</dt>
                  <dd>
                    {dayClock(wDue)}, {daysLeft(wDue)} days left
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>
      )}

      <footer className="metal foot">
        <div className="wrap foot-grid">
          <p className="foot-note">
            Every dispute here is a PayPal sandbox test dispute, opened from a sandbox buyer account on {day(story.case.snapshot.createTime)}. Sandbox
            rulings were requested from PayPal&rsquo;s sandbox; on a live account the ruling is PayPal&rsquo;s own.
          </p>
          <p className="foot-note">Built for the PayPal AI Hackathon.</p>
        </div>
      </footer>
    </>
  );
}
