# Verdict, goal #251 (Judging Round 5): Are CaseClerk's two UI finals competition-winning now?

Judge: fresh, not a debater. I read `topic.md`, all six round-1 and round-2 debate files (`inbox/r1-m1-claude.md`, `inbox/r1-m2-codex.md`, `inbox/r1-m3-claude.md`, `inbox/r2-m1-claude.md`, `inbox/r2-m2-codex.md`, `inbox/r2-m3-claude.md`), `VERDICT-judge-r4.md`, `READERS-synthesis.md`, `VERDICT-meeting-r1.md`, `SLOP-qloo-round1.md`, `REAL-CASES.md`, `LINKS.md`, both `SELF-REVIEW.md` files, the check and ceremony logs (`finals/a/check-results.txt`, `finals/b/check-ui-b.log`, `finals/b/case-approve-real.log.txt`), and directly inspected the desktop and phone screenshots (`1440`, `1920`, `390`) in `materials/material-r5/finals/a/` and `finals/b/`. I could not read `VERDICT-judge-r1.md` because it is not present in `materials/material-r5/`; its history is carried in `VERDICT-judge-r4.md`.

## Recommendation

Neither supplied package is ready to submit untouched (**Final A: no, narrowly; Final B: no**), though both finals closed every Round 4 application defect in their current builds, now end their 1× real-speed approval videos on the verified net amount retained by the seller (`"You keep $386.23"` on `PP-R-SGV-10194507` in A; `"You kept $380.38"` on `PP-R-IHX-10194506` in B), and pass the 10-second live PayPal loop test on desktop. **Final A ("Paper and Wire") is the stronger entry to finish and submit** (`8.7` vs. `8.6`), because its warm paper case file beside a full-height dark PayPal Wire gives the live sandbox loop a signature visual identity across every screen, and its primary approval video (`finals/a/case-approve-real.mp4`) lands PayPal's `200` receipt cleanly at `~9 s` without any state contradiction on screen. Final A needs only a short, code-only pass with zero new PayPal clicks—syncing the server-rendered `"Waiting for you 3"` nav badge across all routes so it does not roll `2 → 3` on first paint, adding the real waiting case (`PP-R-VPY-10194485`, due Nov 4) to the 14-day deadline strip and `/finals/a/deadlines`, differentiating the adjacent sample `$412.00` Olympus row from the real `$412.00` VPY row, and lifting the phone landing CTA above the fold—plus a read-only re-capture of `real-tour.mp4` and affected stills, after which it is **"yes, conditional on the durable deploy"** scheduled for `2026-10-26 13:00 KST`.

## Strongest arguments

1. **Both finals fixed the Round 4 video-tail money blocker and build-level state bugs (`m1-claude`, `m2-codex`, `m3-claude`).**
   - **m1-claude** and **m2-codex** verified by frame extraction and inspection of `finals/a/case-approve-real-resolved.png` and `finals/b/case-approve-real-end.png` (and **m3-claude** agreed) that both approval videos now end on the verified net seller payouts from `REAL-CASES.md` (lines 198–203, checked `2026-10-25 13:04 UTC`): Final A's `PP-R-SGV-10194507` shows `52 px` `"You keep $386.23"` (`"$397.00 sale less PayPal's $10.77 fee · Closed Oct 25, 06:03:07 PT"`) with the overlapping bottom-left toast removed, and Final B's `PP-R-IHX-10194506` shows `"You kept $380.38"` (`"The $391.00 sale less PayPal's $10.62 fee"`) with the `"Real time, not sped up"` caption moved cleanly to the masthead.
   - Both builds also pass their expanded automated suites (`finals/a/check-results.txt`: `422 PASS, 0 FAIL`, including the delayed receipt-clock regression test on line 421; `finals/b/check-ui-b.log`: `511 PASS, 0 FAIL`, including the delayed-response sheet-title and nav-count test on lines 392–393).

2. **Final A has two verified data-consistency defects that make it a narrow "no" today (`m1-claude`, verified and accepted by `m2-codex` and `m3-claude` in r2).**
   - **Uncaused `2 → 3` nav counter roll on first paint:** In r1, **m1-claude** showed from live HTML GETs (`2026-10-25 ~14:58 UTC`) and frame crops of `finals/a/real-tour.mp4` (`0–0.75 s`) that A's server HTML renders `"Waiting for you 2"` on the landing, case, and deadlines routes while rendering `"3"` on the inbox, causing `@number-flow/react` to animate the nav badge `2 → 3` on page load with no PayPal event behind it. In r2, **m2-codex** independently extracted `real-tour.mp4` frames (`0.05 s`, `0.35 s`, `0.65 s` showing `2`; `0.95 s` showing `3`) and flipped A from a conditional `"yes"` to `"no, narrowly"`, agreeing that an uncaused counter animation on load is a visible fake-live tell.
   - **Real pending deadline omitted from the deadline strip and `/finals/a/deadlines`:** **m1-claude** proved in r1 and r2—and **m2-codex** confirmed on `finals/a/inbox-1440.png` and `finals/a/deadlines-1440.png`—that A's 14-day deadline strip and `/finals/a/deadlines` page display five sample cases (`$319` Mon 26, `$1,240` Tue 27, `$412` Wed 28, `$75` Thu 29, `$689` Wed 4) while omitting the only real case waiting for the seller's answer (`PP-R-VPY-10194485`, `$412.00`, due `Nov 4, 8:59 pm PT` per `finals/a/case-real-pending-1440.png`). Checking only that every strip mark is in the list (`check-results.txt` line 146) missed the reverse requirement: that the real waiting case with a deadline in the 14-day window must appear on the strip and Deadlines page.

3. **Final B's current UI fixed its pending sheet and inbox counts, but its submitted video package still exposes rejected Round 4 states (`m2-codex`, `m1-claude`, accepted by `m3-claude`).**
   - On the positive side, **m2-codex** and **m1-claude** credited Final B for adding the recommendation, limitation, cost note, and `"Review the evidence"` link inside its pending decision sheet (`finals/b/case-pending-1440.png`, `case-pending-390.png`) and for reporting honest real-only inbox counts (`"Three open disputes, $479.90 at stake, one waiting for your answer"`, `finals/b/inbox-1440.png`).
   - However, **m2-codex** and **m1-claude** both demonstrated by frame extraction of `finals/b/case-approve-real.mp4` (`~7.8 s` and `~10.7 s`) that because B kept its earlier one-click approval take without cutting the contradictory acceptance beat, the submitted video still shows the nav badge dropping to `2` during `"Sending to PayPal"` (`7.8 s`) and still displays `"Waiting for you"` / `"File this evidence with PayPal?"` directly above `"PayPal answered provide-evidence 200 debug id ca50152e8c8f8"` (`10.7 s`). **m2-codex** provided a clean, zero-click editorial fix (accepted by **m1-claude** and **m3-claude** in r2): cut from the first readable `200` receipt directly to the settled filed state at `~13.5 s` with a brief `"Same case, after the filing"` label.
   - Furthermore, **m1-claude** caught in r1—and **m2-codex** independently verified in r2 (`1.5 s` and `6.0 s` frames)—that `finals/b/case-real.mp4` (`14.8 s`) in the submission folder is a stale pre-Round-4 tour that still shows the rejected 4-line resolved `h1` (`"You keep $378.43… PayPal paid the buyer itself"`), the old recommendation-less pending sheet, and `"1 of 9 open, 2 need you"`.

4. **Final A wins overall desktop product identity; Final B wins phone ergonomics and inbox clarity (`m1-claude`, `m2-codex`, `m3-claude`).**
   - All three members agreed that Final A's `"Paper and Wire"` architecture (`finals/a/landing-1440.png`, `finals/a/case-real-pending-1440.png`) is more distinctive and cohesive on desktop than B's single column + large `337 px` dark bottom overlay + API-diary timeline (`finals/b/case-pending-1440.png`).
   - Conversely, all three members agreed that on a `390×844` phone screen, Final B's `landing-390.png` keeps `"Review the $412.00 case waiting for you"` and `"Open a test dispute"` visible on the first screen, and `b/case-pending-390.png` keeps the `35%` recommendation and tracking limitation inside the mobile sheet, whereas Final A's `landing-390.png` spends the first viewport on an 8-line `h1` + body copy (pushing the CTA below the fold) and `a/case-real-pending-390.png` omits the recommendation lines above the mobile slip.

## Consensus

By the end of Round 2, **all three members (`m1-claude`, `m2-codex`, `m3-claude`) reached full consensus** on:
- **Both packages are "no" to submit as is (`Final A: no, narrowly; Final B: no`), and neither requires a new PayPal click or a visual redesign.**
- **Final A ("Paper and Wire") is the stronger entry to finish and submit**, preferred by every member (`m1-claude`: A `8.7` vs. B `8.6`; `m2-codex`: A `8.7` vs. B `8.6`; `m3-claude`: A `8.6` vs. B `8.4`).
- **Both desktop landings pass the 10-second live PayPal loop test**, and both primary approval videos now end on verified net seller money (`$386.23` on `SGV` in A; `$380.38` on `IHX` in B) with clean disclosures and no overlapping toasts.
- **Every Round 4 code item (`#1–#5`) and reader confusion (`#1–#5`) is fixed or substantially addressed in the builds**, except for A's server/client nav count mismatch (`2 → 3`), A's omitted real `VPY` deadline on the strip/Deadlines page, A's adjacent real and sample `$412.00` Olympus inbox rows, and B's stale video states (`case-approve-real.mp4` at `~7.8–11 s` and the stale secondary `case-real.mp4`).
- **Durable hosting (`https://caseclerk.vercel.app/finals/...`, Round 4 item #6) is an explicitly scheduled external condition** (`2026-10-26 13:00 KST` per `topic.md`), so once the short mechanical list is complete, the verdict becomes **"yes, conditional on the durable deploy"**.

## Unresolved dissent

1. **Whether Final A's adjacent sample `"$412.00 Olympus OM-1n, Zuiko 50mm f/1.8"` row (`Daniel Okafor`) and below-the-fold phone landing CTA (`finals/a/landing-390.png`) belong on Final A's blocking must-fix list (`m1-claude` and `m3-claude` include both as quick code fixes; `m2-codex` treats them as non-blocking polish notes because `READERS-synthesis.md` permitted labelled samples and `VERDICT-meeting-r1.md` scoped phone polish to the approve path).**
   - *Why I rule with m1-claude and m3-claude:* While **m2-codex** is right that `READERS-synthesis.md` allowed labelled samples in general, placing a sample `"$412.00 Olympus OM-1n"` (`Daniel Okafor`, due Wed Oct 28) immediately beneath the real `"$412.00 Olympus OM-1n body"` (`PP-R-VPY-10194485`) inside the same `"Waiting for you"` group (`finals/a/inbox-1440.png`) directly recreates Reader Confusion #2 (`"Several Olympus cases at different amounts"` / twin `$412.00` cameras) and makes the landing CTA (`"Another case is waiting: review the $412.00 one"`) ambiguous once the visitor lands on the inbox. Changing that one sample fixture's item and dollar amount (or moving sample rows under a separate `"Sample cases"` subheading) and moving the CTA above the fold at `390 px` (while also exposing the 2-line recommendation on `case-real-pending-390.png` to match B) are trivial 5-minute edits during the same capture pass that remove A's only deficit against B.
2. **Whether Final B's `"Sandbox control: you asked PayPal to rule for the seller"` on `PP-R-JKB-10194463` (`finals/b/case-deciding-1440.png`) and sibling camera labels in the resolved margin pager (`finals/b/case-resolved-1440.png`) should be included in B's must-fix list (`m1-claude` and `m3-claude` include them; `m2-codex` treats them as non-blocking polish, while agreeing in r2 that B's unlabeled pinned `01:38:05` row above `01:38:41` on `case-pending-1440.png` warrants a `"PayPal's request"` label).**
   - *Why I include them as low-rank items (#4 and #5) on B's list:* **m2-codex** is right that B's #1 and #2 blockers are the video acceptance beat (`case-approve-real.mp4`) and the stale secondary tour (`case-real.mp4`), followed by the pinned-event label (#3). However, because `topic.md` allows up to 8 concrete items, adding the 1-line copy tweak on `JKB` (`"Sandbox test control: we asked PayPal's sandbox to rule..."` so `"you"` does not read as the seller rigging a live dispute) and captioning sibling test disputes in the resolved pager costs almost nothing if B were ever finished.
3. **Broader landing and layout rewrites proposed by `m3-claude` (adding an `"AI agent"` eyebrow above the `h1`, cutting A's desktop `h1` to $\le 3$ lines, building a 3-row mobile mini-Wire on A, boxing B's landing receipt, hiding B's `"last real webhook 1 h 46 min ago"` masthead age, and collapsing B's top PayPal timeline rows; rejected by `m1-claude` and `m2-codex`).**
   - *Why I rule with m1-claude and m2-codex:* As **m1-claude** pointed out from `READERS-synthesis.md`, 6 of 6 fresh readers already understood in their first read that CaseClerk is an AI agent answering PayPal disputes for small sellers, and all three members agreed that both desktop landings pass the 10-second loop test with their primary CTAs inside the `1440×810` viewport (`check-results.txt` line 224). Moreover, **m2-codex** rightly noted that an uppercase eyebrow violates `SLOP-qloo-round1.md` Tell #1, B's unboxed 3-row receipt is one of its best compositions, and B's case-scoped webhook age is honest and already drops the breathing `"Live"` dot after 15 minutes (`b/SELF-REVIEW.md`).

## Dropped members

none

## Confidence

**High.** All three debaters (`m1-claude`, `m2-codex`, `m3-claude`) converged in Round 2 on the exact same verdict for both packages (`Final A: no, narrowly; Final B: no`), the exact same winning choice (`Final A`), and the exact same root causes (confirmed by my direct inspection of the screenshots and logs in `materials/material-r5/`). What would change this confidence: only if the scheduled production deployment to `https://caseclerk.vercel.app` after `2026-10-26 13:00 KST` fails or serves stale assets.

## Deliverable

### Final A: "Paper and Wire"

#### 1. Ratings (1–10 against the five official criteria)

| Official Criterion (20% each) | Rating | Why (as decided by the UI, videos, and live links) |
|---|---:|---|
| **Technological implementation** | **8.9 / 10** | Genuine 1× real-speed approval on `PP-R-SGV-10194507` (`$397.00`, `POST provide-evidence 200`, `debug ca5015c79eef8`), same-case `CUSTOMER.DISPUTE.RESOLVED` webhook (`WH-77M53526VG305471F-9EM50732MT655884D`), verified net payout (`$386.23`), and `422 PASS, 0 FAIL` in `finals/a/check-results.txt` (including the mocked receipt-clock lock test). Docked because the server HTML renders `"Waiting for you 2"` on landing/case/deadlines while the client hydrates to `3`, and `PP-R-VPY-10194485` is missing from the deadline strip and `/finals/a/deadlines`. |
| **Design** | **8.7 / 10** | Strongest visual identity in the contest: warm Newsreader/Hanken paper case file against a full-height `#0F1115` PayPal Wire (`finals/a/landing-1440.png`, `case-real-pending-1440.png`, `case-approve-real-resolved.png`). Docked for the twin `$412.00` Olympus rows (real + sample) sitting side-by-side in `/finals/a/inbox` (`inbox-1440.png`), the phone landing CTA sitting below the fold (`landing-390.png`), and the phone pending view omitting the 2-line recommendation (`case-real-pending-390.png`). |
| **Potential impact** | **8.6 / 10** | Verified net retained money (`"You keep $386.23"` on `SGV`, `"$378.43"` on `NJA`, `"$26.74"` on `RCJ`) is now the hero figure across pages and the approval video ending, paired with the `$250.00`/`$50.00` policy gate and the deadline-loss baseline on the landing page. |
| **Quality of the idea** | **8.7 / 10** | Clear bounded-autonomy workflow: automatic evidence gathering, candid 35% win-chance recommendation with the delivery-vs.-condition limitation and `"Filing adds no cost; accepting gives up the $412.00"`, in-place 640 px evidence reader (`"Review the evidence"`), and sentence-based interactive `Policy` page. |
| **Presentation** | **8.6 / 10** | Desktop landing passes the 10-second loop test immediately, and `finals/a/case-approve-real.mp4` lands PayPal's `200` at `~9 s` and closes cleanly on `"10 min 12 s later: PayPal closed it… You keep $386.23"` with no overlapping toast. Docked for the `2 → 3` nav badge roll in the first `0.75 s` of `finals/a/real-tour.mp4` and the stale `case-real-deciding-1440.png` still. |
| **Overall** | **8.7 / 10** | Equal-weight mean: `8.70` (up from `8.5` in Round 4). **Stronger entry to finish and submit.** |

#### 2. Round-4 must-fix items and reader confusions status

**Round-4 must-fix items:**

| # | Round-4 must-fix item | Status | Evidence (file or URL) |
|---:|---|---|---|
| 1 | Re-record read-only `SGV` resolved video tail with verified net money (`$386.23`) and non-overlapping disclosure | **Fixed** | `finals/a/case-approve-real.mp4` (end card at `~13.5 s` and resolved view at `~20.5 s`) and `finals/a/case-approve-real-resolved.png` show `"You keep $386.23"` (`"$397.00 sale less PayPal's $10.77 fee · Closed Oct 25, 06:03:07 PT"`), with the overlapping bottom-left toast removed. |
| 2 | Put waiting work first, fold closed rehearsal cases, and reconcile waiting counts | **Partly** | `finals/a/inbox-1440.png` puts `"Waiting for you"` first, folds the 10 closed sandbox test disputes into one expandable row, and reconciles `3 / 3 / 3` on the rendered inbox (`check-results.txt` lines 160–162). However, the server HTML on `/finals/a`, `/finals/a/case/...`, and `/finals/a/deadlines` renders `"Waiting for you 2"` before rolling to `3` on hydration (`finals/a/real-tour.mp4` at `0–0.75 s`). |
| 3 | Fix the `05:52:57 → 05:52:55` receipt-clock flip in the build | **Fixed** | `finals/a/check-results.txt` line 421 (`1 distinct: PayPal answered at 07:37:12 PT`) and `finals/a/SELF-REVIEW.md` (Round 4, item 3). The video retains the disclosed 4-frame (`0.13 s`) cut from the original one-click take (`topic.md`). |
| 4 | Remove duplicate `"You keep $X"` sentence from the resolved `h1` | **Fixed** | `finals/a/case-real-resolved-1440.png`, `case-real-resolved-390.png`, and `case-approve-real-resolved.png`: the `h1` reads `"PayPal closed the Olympus OM-1n body chargeback."` and the `52 px` figure below it states `"You keep $378.43"` / `"$386.23"` once. |
| 5 | Replace unmapped resolved-case fallback with `"PayPal closed the chargeback. Seller money outcome not yet verified."` | **Fixed** | `finals/a/SELF-REVIEW.md` (Round 4, item 5) updates the fallback copy on case and inbox surfaces. |
| 6 | Durable production URL (`LINKS.md`) and fresh check log | **Partly (scheduled)** | `finals/a/check-results.txt` (`422 PASS, 0 FAIL`) is fresh; durable deploy to `https://caseclerk.vercel.app` is scheduled for `2026-10-26 13:00 KST` per `topic.md`. |

**Fresh-reader confusions (`READERS-synthesis.md`):**

| # | Reader confusion | Status | Evidence (file or URL) |
|---:|---|---|---|
| 1 | `"Asks you before any money moves"` vs. auto-filed `$17.95` case | **Fixed** | `finals/a/landing-1440.png`: `"Small cases it answers on its own, under your rules; over $250.00 to file, or $50.00 to refund or offer, it asks you first."` with `"your rules"` linked to `/finals/a/policy`. |
| 2 | Several Olympus cases at different amounts (`$389 / $412 / $397...`) | **Partly** | Landing CTA says `"Another case is waiting: review the $412.00 one"` and closed test disputes are folded, but in `finals/a/inbox-1440.png` the sample `"$412.00 Olympus OM-1n, Zuiko 50mm f/1.8"` (`Daniel Okafor`) sits directly under the real `"$412.00 Olympus OM-1n body"` (`PP-R-VPY-10194485`), and the landing explanation line sits below the desktop fold. |
| 3 | Counts, sample rows, and deadline strip don't reconcile | **Partly** | All 5 sample strip marks now appear in the inbox list labelled `"Sample case"`, but the real waiting case `PP-R-VPY-10194485` (`$412.00`, due `Nov 4, 8:59 pm PT`) is missing from both the inbox 14-day strip (`finals/a/inbox-1440.png`) and `/finals/a/deadlines` (`finals/a/deadlines-1440.png`), and the server-rendered nav badge reads `2` on non-inbox routes. |
| 4 | `"Filed the evidence twice"` is unexplained | **Fixed live; stale still** | Live `/finals/a/case/PP-R-JKB-10194463` HTML (checked `2026-10-25 14:58 UTC`) and `finals/a/SELF-REVIEW.md` read `"PayPal asked for more evidence, so CaseClerk filed twice"`, but `finals/a/case-real-deciding-1440.png` is an older capture that still reads `"CaseClerk filed the evidence twice; PayPal is deciding."` and `"Every id here came from PayPal."` |
| 5 | Headline result has no comparison (baseline) | **Fixed** | `finals/a/landing-1440.png` directly below the `h1`: `"Without an answer by the deadline, PayPal rules for the buyer: the seller would lose the $389.00 and the fee."` (Minor person mix: `"after you approved"` vs. `"the seller would lose"`.) |

#### 3. Verdict

**Competition-winning, submit as is: no** (becomes **"yes, conditional on the durable deploy"** as soon as items 1–4 below are applied).

#### 4. Merged must-fix list (ranked, 5 items — zero new PayPal clicks required)

1. **All `/finals/a` routes (nav badge server/client parity) and `finals/a/real-tour.mp4`:**
   - Compute the server-rendered top-nav `"Waiting for you N"` badge on `/finals/a`, `/finals/a/case/[id]`, `/finals/a/deadlines`, and `/finals/a/policy` from the exact same waiting-case set and predicate used on `/finals/a/inbox` so the initial HTML and first paint read `"Waiting for you 3"` on every route (never rolling `2 → 3` on hydration). Animate the badge with `@number-flow/react` only when a case state changes after mount.
   - Re-record `finals/a/real-tour.mp4` read-only and verify that the nav badge stays at a static `3` from frame 0.
2. **`/finals/a/inbox` 14-day strip and `/finals/a/deadlines` (`finals/a/inbox-1440.png`, `-1920.png`, `-390.png`, `finals/a/deadlines-1440.png`):**
   - Add the real waiting case `PP-R-VPY-10194485` (`$412.00`, seller response due `Nov 4, 8:59 pm PT`) to the `Wed 4` cell of the 14-day strip (marked `"Real"`, beside or above the `$689` sample) and to the `Due Wed Nov 4` group and headline count on `/finals/a/deadlines`.
   - In `/finals/a/inbox`, populate `PP-R-VPY-10194485`'s left due column with its countdown and due time (`"N days N h / by Wed 8:59 pm"`) so it matches the other waiting rows, and add a two-way check in `check-results.txt` asserting that every open case with a deadline in the 14-day window appears on the strip.
3. **`/finals/a/inbox` (`Waiting for you` group) and `finals/a/case-real-deciding-1440.png`:**
   - Change the sample row `"Olympus OM-1n, Zuiko 50mm f/1.8 · Daniel Okafor · $412.00"` to a non-Olympus camera item and a different dollar amount (e.g., `"Canon F-1 body, 50mm f/1.4"` at `"$340.00"`, updating its `Wed 28` strip mark to match) so no sample case shares the real `PP-R-VPY-10194485` case's item name or `$412.00` amount.
   - Recapture the stale `finals/a/case-real-deciding-1440.png` (`PP-R-JKB-10194463`) from the current build so it shows `"PayPal asked for more evidence, so CaseClerk filed twice"` and removes `"Every id here came from PayPal."`
4. **Phone landing (`/finals/a` at `390×844`, `finals/a/landing-390.png`) and phone pending case (`finals/a/case-real-pending-390.png`):**
   - At `390 px` on `/finals/a`, place the primary CTA button (`"Another case is waiting: review the $412.00 one"`) directly beneath the baseline sentence (above the `"CaseClerk answers PayPal disputes…"` paragraph) so the action is visible in the first phone screen (`y ≤ 820`), and align the baseline pronoun to `"you'd lose the $389.00 and the fee"` to match `"after you approved"`.
   - At `390 px` on `/finals/a/case/PP-R-VPY-10194485`, keep the 2-line recommendation (`"35% win chance; USPS tracking proves delivery, not condition. Filing adds no cost; accepting gives up the $412.00."`) visible above or inside the sticky slip (`finals/a/case-real-pending-390.png`). Recapture `landing-390.png` and `case-real-pending-390.png`.
5. **Scheduled durable deployment (`LINKS.md` and `finals/a/check-results.txt`):**
   - Once the Vercel deploy window opens at `2026-10-26 13:00 KST`, deploy Final A to `https://caseclerk.vercel.app/finals/a`, update `LINKS.md`, verify HTTP `200` on landing, inbox, deadlines, policy, and deep-linked case routes, and re-run `finals/a/check-results.txt`.

#### 5. Anything that reads AI-generated, template-like, or fake-live

- **Uncaused `2 → 3` nav badge animation on load (`finals/a/real-tour.mp4` at `0–0.75 s` and live non-inbox HTML):** Watching `"Waiting for you 2"` roll to `"3"` in the first second of the tour video when no webhook arrived looks like a scripted fake-live counter.
- **Real waiting deadline omitted while five sample deadlines are shown (`finals/a/inbox-1440.png`, `finals/a/deadlines-1440.png`):** Showing five sample deadlines on the 14-day calendar strip and `/finals/a/deadlines` while omitting the one real pending case (`PP-R-VPY-10194485`, due Nov 4) makes the deadline view read as a static fixture demo.
- **Twin `$412.00` Olympus OM-1n rows stacked back-to-back (`finals/a/inbox-1440.png`):** Putting a `$412.00` sample `Olympus OM-1n` directly below the `$412.00` real `Olympus OM-1n` in `"Waiting for you"` looks like a copy-pasted seed row.
- **Long incident-transcript landing `h1` on mobile (`finals/a/landing-390.png`) and raw webhook IDs in phone inbox prose (`finals/a/inbox-390.png`):** Filling the entire phone first screen with prose before any button appears, and printing `WH-1N7866874L255162D-02531183F1918181W` inline in the paper row when the Wire already holds technical IDs.

---

### Final B: "Darkroom paper"

#### 1. Ratings (1–10 against the five official criteria)

| Official Criterion (20% each) | Rating | Why (as decided by the UI, videos, and live links) |
|---|---:|---|
| **Technological implementation** | **8.9 / 10** | Real 1× one-click approval (`PP-R-IHX-10194506`, `$391.00`, `3.3 s` wait, `debug ca50152e8c8f8`), same-case `CUSTOMER.DISPUTE.RESOLVED` webhook (`WH-0RX02168P8982734Y-9TT31773BN730571G`), verified net payout (`$380.38`), and `511 PASS, 0 FAIL` in `finals/b/check-ui-b.log` (including mocked delayed-response state synchronization and PDF/reader text parity). |
| **Design** | **8.5 / 10** | Crisp editorial typography, an immediately scannable 3-row chronological landing receipt (`finals/b/landing-1440.png`), the strongest phone landing (`landing-390.png`) and phone decision sheet (`case-pending-390.png`), and honest real-only inbox counts (`inbox-1440.png`). Held back on desktop because the `337 px` dark decision sheet covers ~42% of the `1440×810` pending viewport (`case-pending-1440.png`), the upper pending page still reads as an API diary (`"7 routine calls…"`), and the pinned `01:38:05` row sits above `01:38:41` under `"What happened, newest first"` without a pinned label. |
| **Potential impact** | **8.6 / 10** | Clear `"You kept $380.38"` / `"$378.43"` hero figures, lucid hold-and-release prose, a concrete deadline-loss baseline on the landing page, and an inbox total (`$479.90 at stake`) that counts only real open sandbox cases. |
| **Quality of the idea** | **8.7 / 10** | The pending decision sheet (`finals/b/case-pending-1440.png`, `-390.png`) now brings together the `$250.00` policy threshold, the `35%` win-chance recommendation and tracking limitation, the zero-fee note, `"Review the evidence"`, and the explicit `"File the evidence on $412.00"` vs. `"Don't file; accept the chargeback"` choice. |
| **Presentation** | **8.2 / 10** | While the ending of `finals/b/case-approve-real.mp4` (`case-approve-real-end.png`) is now fixed to show `"You kept $380.38"`, the video's acceptance beat (`~7.8–11 s`) still shows the nav count dropping during `"Sending to PayPal"` and the sheet asking `"File this evidence with PayPal?"` above `"PayPal answered provide-evidence 200"`, and the folder still ships a stale `finals/b/case-real.mp4` (`14.8 s`) with the rejected Round 3 resolved `h1`. |
| **Overall** | **8.6 / 10** | Equal-weight mean: `8.58` (up from `8.4` in Round 4). |

#### 2. Round-4 must-fix items and reader confusions status

**Round-4 must-fix items:**

| # | Round-4 must-fix item | Status | Evidence (file or URL) |
|---:|---|---|---|
| 1 | Surface recommendation, limitation, and `"Review the evidence"` inside the pending sheet | **Fixed** | `finals/b/case-pending-1440.png`, `-1920.png`, `-390.png`, and `finals/b/check-ui-b.log` lines 456–463. Both buttons, the `35%` recommendation/limitation, and `"Review the evidence"` are visible without scrolling at desktop and phone sizes. |
| 2 | Re-record read-only `IHX` resolved video tail with verified net money (`$380.38`) and clean toast placement | **Fixed** | `finals/b/case-approve-real-end.png` and `finals/b/case-approve-real.log.txt` (lines 19–26) show `"You kept $380.38"` (`"The $391.00 sale less PayPal's $10.62 fee"`), and the `"Real time, not sped up"` caption is moved to the masthead. |
| 3 | Swap sheet title to `"Filed with PayPal"` and decrement counters when `200` lands | **Partly (fixed in build; still visible in video)** | Fixed in the current build (`finals/b/check-ui-b.log` lines 392–393), but `finals/b/case-approve-real.mp4` still displays the early nav drop (`3 → 2`) at `~7.8 s` and `"Waiting for you / File this evidence with PayPal?"` above the `200` receipt at `~10.7 s`. |
| 4 | Shorten resolved `h1` (drop `"PayPal paid the buyer itself"` and duplicate money math) | **Partly across package** | Fixed in `finals/b/case-resolved-1440.png`, `-390.png`, and `case-approve-real-end.png` (`"A buyer's bank charged back the Olympus OM-1n body you sold. PayPal closed the case."`), but the stale `finals/b/case-real.mp4` (`~6.0 s`) still shows the rejected 4-line `h1`. |
| 5 | Replace unmapped resolved-case fallback with `"PayPal closed the chargeback. Seller money outcome not yet verified."` | **Fixed** | `finals/b/check-ui-b.log` line 437 verifies the exact fallback sentence with no kept figure on an unmapped resolved case. |
| 6 | Durable production URL (`LINKS.md`), `b/SELF-REVIEW.md` update, and check log | **Partly (scheduled)** | `finals/b/SELF-REVIEW.md` and `finals/b/check-ui-b.log` (`511 PASS, 0 FAIL`) are updated; durable deploy is scheduled for `2026-10-26 13:00 KST` per `topic.md`. |

**Fresh-reader confusions (`READERS-synthesis.md`):**

| # | Reader confusion | Status | Evidence (file or URL) |
|---:|---|---|---|
| 1 | `"Asks you before any money moves"` vs. auto-filed `$17.95` case | **Fixed** | `finals/b/landing-1440.png` and `landing-390.png` state the `$250` filing and `$50` refund/offer thresholds and link `"Your policy"`. |
| 2 | Several Olympus cases at different amounts | **Mostly fixed** | `finals/b/landing-1440.png` (`"A separate test dispute on the same camera listing is waiting for your answer:"`) and `finals/b/inbox-1440.png` explain the separate test disputes and fold closed ones; only the left-margin `Previous (K) / Next (J)` pager on `finals/b/case-resolved-1440.png` and `case-approve-real-end.png` still lists `"Olympus OM-1n body, $398.00 / $397.00 / $394.00"` without a test-dispute caption. |
| 3 | Counts, sample rows, and deadline strip don't reconcile | **Fixed in build/stills (stale in `case-real.mp4`)** | `finals/b/inbox-1440.png` counts only the 3 real open disputes (`$412.00 + $49.95 + $17.95 = $479.90`, `1` waiting) and shows only `VPY` on `Wed 4` (`check-ui-b.log` lines 464–467). Only the stale `finals/b/case-real.mp4` still shows `"1 of 9 open, 2 need you"`. |
| 4 | `"Filed the evidence twice"` is unexplained | **Fixed** | `finals/b/SELF-REVIEW.md` (R4) and `finals/b/check-ui-b.log` line 471 (`"PayPal asked for more evidence, so CaseClerk filed again"`). |
| 5 | Headline result has no comparison (baseline) | **Fixed** | `finals/b/landing-1440.png` and `landing-390.png`: `"Without an answer by the deadline, PayPal rules for the buyer: the seller would have lost the $389.00 and the fee."` |

#### 3. Verdict

**Competition-winning, submit as is: no**

#### 4. Merged must-fix list (ranked, 6 items — zero new PayPal clicks required)

1. **`finals/b/case-approve-real.mp4` (`~10.0–11.5 s` acceptance beat):**
   - Preserve the original one-click approval and full `3.3 s` real-speed wait, then at the first readable `provide-evidence 200` receipt (`~10.2 s`), cut directly to the settled filed state (`~13.5 s`, where the collapsed bar reads `"Evidence filed with PayPal 05:46:25 PT debug id ca50152e8c8f8 · $391.00 PayPal is deciding"`) with a brief visible `"Same case, after the filing"` edit label before the `"11 minutes after you approved…"` transition card.
   - This eliminates the contradictory `"Waiting for you / File this evidence with PayPal?"` header above the `200` receipt without needing a new PayPal click or painting synthetic UI frames; disclose in `b/SELF-REVIEW.md` that the `~7.8 s` nav count drop in the raw take predates the `J3` state-sync fix.
2. **`finals/b/case-real.mp4` (stale secondary video in the submission folder):**
   - Delete `finals/b/case-real.mp4` (along with obsolete `case-approve-real-ltk*` and `case-approve-real-recut.log.txt` clutter) or re-record `case-real.mp4` read-only from the current build so the submission package no longer contains the rejected Round 3 resolved `h1` (`"…PayPal paid the buyer itself"`), the old recommendation-less pending sheet, or `"1 of 9 open, 2 need you"`.
3. **Pending case timeline header on `/finals/b/case/[pending]` (`finals/b/case-pending-1440.png`, `-1920.png`, `-390.png`):**
   - Label the pinned `01:38:05 PT` `CUSTOMER.DISPUTE.UPDATED` row `"PayPal's request"` above the `"What happened, newest first"` heading so a `01:38:05 PT` event is not placed above a `01:38:41 PT` row under a `"newest first"` label. Recapture `case-pending-*`.
4. **Adjudicate row copy on `/finals/b/case/PP-R-JKB-10194463` (`finals/b/case-deciding-1440.png`, `-1920.png`, `-390.png`):**
   - Change `"Sandbox control: you asked PayPal to rule for the seller"` to `"Sandbox test control: we asked PayPal's sandbox to rule (a live account can't do this)"` so `"you"` does not read as the seller rigging a dispute. Recapture `case-deciding-*`.
5. **Left-margin `Previous (K) / Next (J)` pager on resolved cases (`finals/b/case-resolved-1440.png`, `case-approve-real-end.png`):**
   - Skip closed ceremony clone disputes (`SGV`, `EGZ`, `IMW`, `AAJ`, `TZD`, `UDP`, `LTK`) in the `Previous / Next` case pager (consistent with folding them in `/finals/b/inbox`), or append `"Test dispute, same listing"` so the margin does not list sibling `"Olympus OM-1n body, $398.00 / $397.00 / $394.00"` links without explanation.
6. **Scheduled durable deployment (`LINKS.md` and `finals/b/check-ui-b.log`):**
   - If Final B is deployed at `2026-10-26 13:00 KST`, deploy `/finals/b` to `https://caseclerk.vercel.app/finals/b`, update `LINKS.md`, verify HTTP `200` on all deep links, and re-run `finals/b/check-ui-b.log`.

#### 5. Anything that reads AI-generated, template-like, or fake-live

- **`"Waiting for you / File this evidence with PayPal?"` above `"PayPal answered provide-evidence 200"` in `finals/b/case-approve-real.mp4` (`~10.7 s`) and early counter drop (`~7.8 s`):** The submitted film still shows the old state-transition contradiction during its central climax beat.
- **Stale `finals/b/case-real.mp4` (`14.8 s`) in the submission folder:** Ships the rejected `"PayPal paid the buyer itself"` headline and `"1 of 9 open, 2 need you"` alongside the updated screenshots.
- **`"Sandbox control: you asked PayPal to rule for the seller"` (`finals/b/case-deciding-1440.png`):** Addressing the seller as `"you"` in a simulator adjudication command sounds like the seller can tell PayPal how to rule.
- **Pinned `01:38:05 PT` row above `01:38:41 PT` under `"What happened, newest first"` and API-diary second row (`finals/b/case-pending-1440.png`):** Placing an older timestamp first without a pinned label and leading the visible case body with `"7 routine calls: get dispute, get tracker…"` still reads partly like an engineering log.

---

### Which final is stronger for winning (in three sentences)

**Final A ("Paper and Wire") is stronger for winning (`8.7` vs. `8.6`) because its warm paper case file beside a full-height dark PayPal Wire makes the live PayPal transport loop the visual signature of every screen, and its primary approval video lands PayPal's `200` at `~9 s` and closes on `"You keep $386.23"` with zero on-screen state contradictions.** Final B now wins the phone first screen, the phone decision sheet, and real-only inbox arithmetic, but its submitted approval film still displays `"File this evidence with PayPal?"` on top of the `200` receipt and its folder still carries a stale pre-Round-4 `case-real.mp4`. Finish **Final A**'s four quick code-only fixes (server-rendered nav count parity, real `VPY` deadline on the strip/Deadlines page, distinct sample row item/price, and phone CTA/recommendation visibility above the fold), refresh `real-tour.mp4` and the affected stills, and deploy `/finals/a` to `https://caseclerk.vercel.app` at the scheduled `13:00 KST` release window.


---
## Debate record (written by company debate)
- m1-claude: company-worker:claude-opus-5-5:high on mac, stance "PayPal developer-relations judge scoring all five official criteria from the video and first screen; wants the live PayPal loop unmistakable in 10 seconds and a finished product, not a tech demo"
- m2-codex: codex:gpt-6.1-sol:high on mac, stance "Top SaaS product-design critic (Stripe, Linear, Mercury, Vercel level); judges typography, layout, motion and finish; flags anything template-like or AI-generated"
- m3-claude: company-worker:claude-sonnet-5-5:medium on mac, stance "Fresh first-time visitor with 5 seconds per screen; says what the product is, who it is for and what to click, and what confused you"
- phases run: r1, r2
