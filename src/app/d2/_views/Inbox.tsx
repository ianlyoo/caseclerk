import Link from "next/link";
import type { CSSProperties } from "react";
import type { CaseRecord } from "@/lib/types";
import { getPolicy, listCases } from "../_lib/api";
import { day, usd } from "../_lib/format";
import { href, RESERVED_CASES } from "../_lib/routes";
import { caseState, claimWords, deadlineWords, itemName, judgeCase, sellerWon, sharedListings } from "../_lib/state";
import { statedMoney } from "../_lib/story";
import { TopBar } from "../_ui/Chrome";
import { Refresh } from "../_ui/Refresh";
import { TestDispute } from "../_ui/TestDispute";

const byNewest = (a: CaseRecord, b: CaseRecord) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id.localeCompare(a.id);
const dueOf = (c: CaseRecord) => (c.snapshot.sellerResponseDueDate ? Date.parse(c.snapshot.sellerResponseDueDate) : Infinity);

/** The seller's window on a waiting case, opened to due, with "now" as the orange index. Linear: days, not seconds. */
function Rail({ c, now }: { c: CaseRecord; now: number }) {
  const due = c.snapshot.sellerResponseDueDate;
  if (!due) return null;
  const a = Date.parse(c.snapshot.createTime);
  const p = Math.min(1, Math.max(0, (now - a) / (Date.parse(due) - a)));
  return (
    <div className="rail" style={{ "--p": p } as CSSProperties} aria-hidden="true">
      <span className="rail-line" />
      <span className="rail-lit" />
      <span className="rail-now" />
      <span className="rail-end" />
    </div>
  );
}

export async function Inbox() {
  const [list, policy] = await Promise.all([listCases(), getPolicy()]);
  if (!list) {
    return (
      <div className="metal page-error">
        <TopBar here="cases" />
        <div className="wrap">
          <h1 className="h-section">CaseClerk can&rsquo;t reach its case data right now.</h1>
          <p className="body">Try again in a minute.</p>
        </div>
      </div>
    );
  }

  const now = Date.now();
  const judge = judgeCase(list);
  const line = policy?.evidenceApprovalAtUsd ?? 250;
  const rows = list.map((c) => ({ c, st: caseState(c, line) }));
  const waiting = rows
    .filter((r) => r.st.phase === "waiting")
    .sort((x, y) => Number(x.c.id === judge?.id ? 0 : 1) - Number(y.c.id === judge?.id ? 0 : 1) || Number(RESERVED_CASES.includes(x.c.id)) - Number(RESERVED_CASES.includes(y.c.id)) || byNewest(x.c, y.c));
  const open = rows.filter((r) => r.st.phase === "open").sort((x, y) => dueOf(x.c) - dueOf(y.c) || byNewest(x.c, y.c));
  const closed = rows
    .filter((r) => r.st.phase === "closed")
    .sort((x, y) => Date.parse(y.c.snapshot.updateTime) - Date.parse(x.c.snapshot.updateTime) || byNewest(x.c, y.c));
  const shared = [...sharedListings(list)].sort((x, y) => y[1] - x[1]);

  return (
    <div className="inbox">
      <Refresh every={30_000} />
      <div className="metal">
        <TopBar here="cases" />
        <header className="wrap inbox-head">
          <div className="inbox-head-copy">
            <h1 className="inbox-title">{list.length} PayPal sandbox disputes</h1>
            <p className="inbox-counts">
              {waiting.length} waiting for your yes, {open.length} open, {closed.length} closed.
            </p>
            {shared.length > 0 && (
              <p className="inbox-note">
                {shared.map(([name, n], i) => `${n} ${i === 0 ? "cases share one test listing" : "share another"} (${name})`).join(", ")}. Each is a
                separate sandbox test dispute at its own amount, not one sale disputed again.
              </p>
            )}
          </div>
          {judge && <TestDispute lede="Want to watch one arrive?" line={line} />}
        </header>
      </div>

      <section className="leather inbox-band" aria-labelledby="waiting-title">
        <div className="wrap">
          <h2 id="waiting-title" className="inbox-band-title">
            Waiting for your yes <span className="inbox-n">{waiting.length}</span>
          </h2>
          {waiting.length ? (
            <ol className="wrows">
              {waiting.map(({ c }) => {
                const amount = usd(c.snapshot.amount.value);
                const item = itemName(c);
                const held = RESERVED_CASES.includes(c.id);
                const dl = deadlineWords(c, now);
                return (
                  <li key={c.id} className="wrow" data-judge={c.id === judge?.id || undefined}>
                    <p className="wrow-amount">{amount}</p>
                    <div className="wrow-body">
                      <h3 className="wrow-item">
                        <Link href={href.case(c.id)}>{item ?? claimWords(c)}</Link>
                      </h3>
                      <p className="wrow-sub">
                        {item ? `${claimWords(c)}. ` : ""}
                        A separate sandbox test dispute, opened {day(c.snapshot.createTime)}.
                      </p>
                      <Rail c={c} now={now} />
                      <p className="wrow-due">{dl.text}</p>
                    </div>
                    <div className="wrow-act">
                      {held ? (
                        <>
                          <p className="wrow-held">Kept waiting for a demo recording.</p>
                          <Link className="btn btn-quiet" href={href.case(c.id)}>
                            View the case
                          </Link>
                        </>
                      ) : (
                        <Link className={`btn ${c.id === judge?.id ? "btn-go" : "btn-quiet"}`} href={href.case(c.id)}>
                          Review the {amount} case
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="inbox-empty body body-on-dark">Nothing waits for you right now.</p>
          )}
          {!judge && (
            <div className="inbox-try">
              <p className="inbox-fine">
                {waiting.length ? "The case waiting here is kept for a demo recording. " : ""}Open a real PayPal sandbox chargeback and watch CaseClerk work it.
              </p>
              <TestDispute tone="go" on="leather" line={line} />
            </div>
          )}
        </div>
      </section>

      <section className="metal inbox-band" aria-labelledby="open-title">
        <div className="wrap">
          <h2 id="open-title" className="inbox-band-title">
            Open <span className="inbox-n">{open.length}</span>
          </h2>
          <p className="inbox-band-sub">Nothing to answer on these right now. Soonest deadline first.</p>
          <table className="rows">
            <thead>
              <tr>
                <th scope="col">Amount</th>
                <th scope="col">Case</th>
                <th scope="col">Where it stands</th>
                <th scope="col">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {open.map(({ c, st }) => (
                <tr key={c.id} data-key={st.key}>
                  <td className="rows-amount">{usd(c.snapshot.amount.value)}</td>
                  <td className="rows-case">
                    <Link href={href.case(c.id)}>{itemName(c) ?? claimWords(c)}</Link>
                    <span className="rows-sub">
                      {itemName(c) ? `${claimWords(c)}, ` : "No order on file, "}
                      <code>{c.id}</code>
                    </span>
                  </td>
                  <td className="rows-state">{st.words}</td>
                  <td className="rows-due">{deadlineWords(c, now).text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="metal inbox-band inbox-closed" aria-labelledby="closed-title">
        <div className="wrap">
          <h2 id="closed-title" className="inbox-band-title">
            Closed <span className="inbox-n">{closed.length}</span>
          </h2>
          <p className="inbox-band-sub">PayPal&rsquo;s rulings, newest first.</p>
          <table className="rows">
            <thead>
              <tr>
                <th scope="col">Amount</th>
                <th scope="col">Case</th>
                <th scope="col">Ruling</th>
                <th scope="col">Closed</th>
              </tr>
            </thead>
            <tbody>
              {closed.map(({ c }) => {
                const won = sellerWon(c);
                const m = statedMoney(c.id);
                return (
                  <tr key={c.id} data-key={won ? "kept" : "lost"}>
                    <td className="rows-amount">{usd(c.snapshot.amount.value)}</td>
                    <td className="rows-case">
                      <Link href={href.case(c.id)}>{itemName(c) ?? claimWords(c)}</Link>
                      <span className="rows-sub">
                        {itemName(c) ? `${claimWords(c)}, ` : "No order on file, "}
                        <code>{c.id}</code>
                      </span>
                    </td>
                    <td className="rows-state">
                      {won ? (
                        <>
                          For you{m ? <span className="rows-kept">, {usd(m.kept.value)} kept</span> : null}
                        </>
                      ) : (
                        <span className="rows-lost">For the buyer, {usd(c.snapshot.amount.value)} back to them</span>
                      )}
                    </td>
                    <td className="rows-due">
                      <span className="rows-k">Closed </span>
                      {day(c.snapshot.updateTime)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
