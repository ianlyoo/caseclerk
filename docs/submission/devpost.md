# Devpost submission: CaseClerk (draft)

Draft for the owner's review. Nothing here is published. Every number traces to `docs/REAL-CASES.md`, `docs/experiments.md`, the code, or the live API (`GET https://caseclerk.vercel.app/api/cases/{id}`, read 2026-10-26).

---

## Project name

CaseClerk

## Tagline (≤ 200 characters)

An AI dispute desk for small PayPal sellers: it reads each dispute, files the evidence through PayPal's Disputes API, and asks the seller before crossing their line.

<!-- 165 characters -->

## Inspiration

A small online seller who gets a PayPal chargeback has about ten days to answer (the sandbox disputes we opened carried a seller response date ten days out). If nobody answers, PayPal rules for the buyer, and the seller loses the sale and the fee. Answering well means pulling the order, the shipping record and the payment, matching them to the reason the buyer gave, and writing it up in a form PayPal accepts. A one-person shop has no chargeback team, so these cases often go unanswered or get a weak reply.

We also noticed a gap in the tools. PayPal's agent toolkit covers three dispute operations (list, get, accept), while the Disputes API has fifteen endpoints, including provide-evidence, make-offer and send-message. And PayPal's sandbox has simulators that open chargebacks and rule on them, so a dispute agent can be shown working against PayPal itself, with no mocked side.

## What it does

CaseClerk is a dispute desk that acts on PayPal's Disputes API under rules the seller sets.

- When PayPal sends a dispute webhook, CaseClerk verifies it with PayPal, fetches the dispute and opens a case.
- Claude Haiku 5.5 triages the case. Claude Opus 5.5 then reads the order and the shipment tracking through tools and records a decision with a win estimate. Our code turns that into an expected value (fight vs refund vs offer) and applies the seller's rules. The model writes the seller's statement and exhibits; the code builds the evidence PDF.
- A policy gate checks every action before PayPal is called. By default, evidence on disputes under $250 and refunds or offers up to $15 go out on their own. Anything above those lines waits for the seller's one-click approval.
- Filing goes to PayPal's `provide-evidence` endpoint. The case page shows PayPal's HTTP status and debug id for every call, the exact evidence text PayPal received, and each webhook event id.
- When PayPal resolves the case, CaseClerk reads PayPal's fund movements and the capture and shows what the seller kept. It shows that figure only when PayPal states it.
- A deadline board (Bryntum Scheduler) shows every real case as a row, grouped as waiting for the seller's yes, open and closed. Each bar runs from PayPal opening the dispute to PayPal's deadline (or the close, or now), with the case's moments as dots (filled for CaseClerk or the seller, hollow for PayPal) and a line for now. It has two spans, to the deadlines or hour by hour, and a click or Enter opens the case.
- Anyone can press **Open a test dispute**. That creates a real sandbox payment for a used film camera, with USPS tracking, and a chargeback through PayPal's simulator. The case arrives by webhook a few minutes later and, being over the $250 line, waits for the visitor's yes. After approving, the visitor can ask PayPal's sandbox to rule and watch PayPal's resolved webhook close the case. <!-- verify after judge loop ships -->

## How we built it

- **Next.js 16.4 on Vercel**, with Neon Postgres. The webhook route verifies the signature (`/v1/notifications/verify-webhook-signature`, raw body spliced in unchanged), deduplicates event ids, answers 200, and runs the agent in `after()` within the 300-second function limit.
- **PayPal REST, called directly** (sandbox only): Disputes (get, list, provide-evidence, accept-claim, make-offer, send-message, acknowledge-return-item), the sandbox simulators (process-chargeback, require-evidence, adjudicate, buyer-side create), Orders v2, Payments (captures, a guarded refund), Shipping Trackers, Transaction Search and Webhooks. Every result keeps PayPal's `debug_id`.
- **Claude through `@anthropic-ai/sdk`**, no agent framework. Triage on `claude-haiku-5-5` with JSON-schema output; we chose it after it labelled 15 of 15 hand-labelled disputes correctly. Decisions and writing on `claude-opus-5-5` at medium effort, with strict tool schemas and prompt caching. Write tools appear only when PayPal's HATEOAS link for that action is present.
- **Guards in code**: the policy gate; a fact check that holds back evidence citing any tracking number or id no tool returned; a refund guard that refuses while a dispute is open on the capture; a per-case lock; and a hard spend cap. Each Claude call reserves its estimated cost first, and defaults are $45 all-time, $4 a day and 60 runs a day. Over a cap no request is sent.
- **Front end**: one real case read off a camera's engraved shutter-speed scale. The case's elapsed time runs on a log scale, from "Chargeback in" to "Kept", with one stop where the seller said yes. We followed the impeccable design rules (Apache-2.0), with WCAG 2.2 AA contrast as the target. The deadline board is Bryntum Scheduler (trial 7.3.7, React wrapper, client-only, read-only), themed to the same top plate; the server builds its rows from the same case API, one per real case.
- **Tests**: 155 unit and contract tests with Vitest (agent loop, policy, spend caps, webhook handling, PayPal parsing on real PII-stripped sandbox payloads), plus a live sandbox suite.

## Challenges we ran into

- **Creating disputes without a browser.** PayPal's buyer-side create simulator needs the buyer's Log in with PayPal consent. It also needs the buyer-side transaction id, which neither the Orders nor the Payments API returns. We used the process-chargeback simulator for test disputes. It worked 3 times out of 3 in the spike, and the dispute was listed 42 to 70 seconds later.
- **Sandbox timing.** Actions unlock through HATEOAS links. In the morning spike, evidence opened 2.5 to 4 minutes after creation. On production that afternoon, each unlock took about 19 minutes. So the agent acts only on PayPal's current links, and each `UPDATED` webhook re-runs it.
- **Evidence rewrote the tracking.** Filing evidence with tracking info turned the capture's DELIVERED tracker into SHIPPED. On the next round, the agent's win estimate dropped from 65% to 30%. `provideEvidence` now reads the trackers first and puts back any status that went down.
- **Reading a ruling correctly.** A chargeback that the sandbox ruled for the seller ends as `RESOLVED_WITH_PAYOUT` (PayPal paid the buyer and released the seller's hold), not "seller favour". We show what the seller kept from PayPal's fund movements, and nothing when PayPal doesn't state it.
- **Smaller things**: a spurious 400 from the sandbox right after a link appears (retried); make-offer must come before send-message on an inquiry, or the turn passes to the buyer; Turbopack ran out of memory bundling the Bryntum trial, so we build with webpack.

## Accomplishments that we're proud of

- The whole loop runs against PayPal's sandbox: a chargeback arrives, the agent writes and files evidence, PayPal accepts it, and PayPal resolves the case. Nothing on the PayPal side is mocked.
- 11 sandbox chargebacks went through this loop to `RESOLVED_WITH_PAYOUT`, with PayPal releasing the seller's hold. On ten of them the agent stopped at the seller's $250 line and filed after the seller approved; on one ($17.95) it filed on its own. In each case we asked the sandbox to rule (`SELLER_FAVOR`), so these show the pipe working, not a win rate. For example, a $389.00 case ended with the seller keeping $378.43; the difference is PayPal's normal transaction fee. On the nine cases approved on 10/25, PayPal resolved the dispute 7 to 12.5 minutes after the approval; on the tenth, about 12 minutes after we asked for the ruling.
- The agent is candid. On the camera cases it put the chance at 30 to 35% and said why ("tracking proves delivery, not condition"). It chose to file because the expected loss was smaller than refunding, and it left the call to the seller.
- Every claim on screen is PayPal's own record: HTTP status, debug id, webhook event id, fund movements.

## What we learned

- With money on the line, the agent's freedom belongs in code: which actions exist (PayPal's links), which need a human (the policy gate), and what the model may cite (the fact check). The model reads, weighs and writes; the code decides what reaches PayPal.
- Sandbox behaviour has to be measured, not assumed. Unlock times moved from minutes to hours, tracking statuses changed under us, and outcome codes meant something other than their names.
- Showing PayPal's own ids and amounts builds more trust than any wording of ours.

## What's next for CaseClerk

- Buyer negotiation at the inquiry stage. The agent's offer and message tools are built and unit-tested, and we sent a real message on a sandbox inquiry. Creating inquiries still needs a buyer-side id we can only read by hand.
- Better evidence from the seller: item photos, listings and return policies. On the camera cases the agent itself called the evidence weak for lack of them.
- Seller accounts with sign-in and Log in with PayPal, so each seller connects their own PayPal account and edits their own rules. The demo has one sandbox seller and no auth.
- A live-account pilot with a few small sellers.

## Built with

anthropic, claude, claude-opus-5-5, claude-haiku-5-5, paypal, paypal-disputes-api, paypal-orders-api, paypal-payments-api, paypal-shipping-trackers, paypal-transaction-search, paypal-webhooks, next.js, react, typescript, node.js, postgresql, neon, vercel, bryntum, pdf-lib, zod, vitest

## Try it out

- Hosted demo: https://caseclerk.vercel.app
- Code: https://github.com/ianlyoo/caseclerk (public at submission; MIT)

## Testing instructions for judges

**No login is needed.** The hosted demo has no accounts and no keys to enter. It runs on the PayPal sandbox, so all money is sandbox money.

1. Open **https://caseclerk.vercel.app**. The landing replays one real sandbox case on a time scale, from the chargeback arriving to the seller keeping $386.23 of $397.00. Click any stop on the scale to read PayPal's record for it.
2. Open **Cases** (top bar). You'll see every sandbox dispute: the ones waiting for the seller's yes, the open ones by deadline, and the closed ones with PayPal's ruling.
3. Open a resolved case, for example **https://caseclerk.vercel.app/case/PP-R-NJA-10194486**. There you can see what the agent sent PayPal (the exact text and the PDF), PayPal's HTTP 200 and debug id for the filing, the `CUSTOMER.DISPUTE.RESOLVED` webhook id, and the seller's hold being placed and released.
4. Open **Rules** to see the lines the agent works under. They are shown read-only.
5. Open **Deadlines** (top bar, `/board`): every real case as a row, grouped as waiting, open and closed. A bar runs from PayPal opening the dispute to its deadline (or its close, or now); dots mark the case's moments (filled: CaseClerk or the seller; hollow: PayPal), and the orange line is now. Switch the span between **To the deadlines** and **Hour by hour**, hover a bar for its moments, and click it (or press Enter) to open the case. The diagonal "Trial Version" pattern is Bryntum's trial watermark.
6. Press **Open a test dispute** (on the landing or on Cases). This creates a real sandbox payment for one used film camera ($289 to $449) with USPS tracking, and a chargeback through PayPal's simulator. PayPal delivers the dispute webhook in about 3 to 4 minutes; refresh **Cases** to see it. The order is above the $250 line, so the agent prepares the evidence and waits for your yes. Once PayPal opens the dispute for a response, press **File the evidence** on your case: CaseClerk files it with PayPal and shows PayPal's HTTP status and debug id. Each visitor can open three a day.
7. Once PayPal offers the ruling (minutes to tens of minutes after the filing), press **Ask PayPal's sandbox to rule** on your case. CaseClerk calls the sandbox's `adjudicate` simulator; when PayPal's `CUSTOMER.DISPUTE.RESOLVED` webhook arrives (about 12 minutes after the request on one of our cases), refresh the case to see PayPal's ruling and what the seller kept. <!-- verify after judge loop ships -->

Sandbox notes:
- PayPal's sandbox doesn't rule on chargebacks by itself in any predictable time. The resolved cases you see were ruled after we called the sandbox's `adjudicate` simulator. A test dispute you open stays at "Filed. PayPal is reviewing" until you ask the sandbox to rule (step 7). <!-- verify after judge loop ships -->
- A case may be waiting for a seller's yes. Pressing **File the evidence** on it sends a real sandbox filing to PayPal. One case is marked "Kept waiting for a demo recording": that is our video's case, and the API refuses to file it (403).
- The Rules are read-only here: changing them needs an edit token the hosted demo doesn't set.
- The Claude spend has a hard cap. If the demo budget is ever reached, the agent makes no new model calls, and a case shows a recorded run that is clearly labelled as a replay.
- The API is readable without a key: `GET /api/cases`, `GET /api/cases/{id}`, `GET /api/policy`, `GET /api/health`.
