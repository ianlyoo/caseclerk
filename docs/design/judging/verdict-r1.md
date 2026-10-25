# Verdict, goal #251: CaseClerk UI finals ("Paper and Wire" vs. "Darkroom paper")

Judge: fresh, not a debater. I read `topic.md`, both rounds from the active members (`r1-m1-claude.md`, `r1-m3-claude.md`, `r2-m1-claude.md`, `r2-m3-claude.md`), `VERDICT-meeting-r1.md`, `SLOP-qloo-round1.md`, `LINKS.md`, both `SELF-REVIEW.md` files, the captured screenshots across desktop and mobile viewports in `finals/a/` and `finals/b/`, and both `case-approve.mp4` ceremony videos.

## Recommendation

Keep **Final A ("Paper and Wire")** and drop Final B, but **neither final is competition-winning to submit as is** (**Final A: no; Final B: no**). In a PayPal-judged hackathon where judges may score from the video and first screen alone, Final A is the only entry that makes the live PayPal loop unmistakable within 10 seconds on every page—pairing warm editorial paper with a dedicated dark Wire plane carrying real `CUSTOMER.DISPUTE.*` webhooks, `200` statuses, and PayPal-blue `debug` IDs, and turning approval into a spatial ceremony where the paper slip visibly flies into the PayPal plane. However, both finals fail the "end-to-end real loop" bar because their approval ceremony climax runs on Daniel Okafor's staged sample case while the real sandbox run (`PP-R-JKB-10194463`) stops at `UNDER_REVIEW`. To win, Final A must run the video climax on a real $\ge \$250$ sandbox dispute through resolution, strip its visible demo scaffolding and fake-live `verified`/`200` badges on sample rows, and port Final B's best product finishes: plain-English PayPal call lines on the Wire, the real ceramic-dish case as the default destination, the `Policy` page in the navigation, and B's crisp policy and summary copy.

## Strongest arguments

1. **The 10-second PayPal proof test (favours Final A).**
   - **m1-claude** and **m3-claude** both argued that Final A's right-hand dark Wire plane immediately proves Technological Implementation on every screen (`landing`, `inbox`, `case`) without scrolling: real `POST provide-evidence 200` calls, `verified` webhooks, and `#6FB2FF` `debug` IDs sit right beside the headline and the approval slip.
   - In Final B, PayPal calls are set inline in the paper timeline with the same visual weight and brass left rule as the agent's internal steps (**m1-claude**), and on the pending case screen (`b/case-pending-1440.png`) the rising dark decision sheet completely covers the PayPal timeline below the fold (**m3-claude**, **m1-claude**).
2. **Spatial cause-and-effect in the approval ceremony (favours Final A).**
   - Inspecting `finals/a/case-approve.mp4` (which **m1-claude** sampled and I verified directly), clicking Approve and Send lifts the paper slip and flies it across the seam into the dark Wire plane (00:06), landing as a new `POST provide-evidence` entry at the top of the Wire (00:07). Cause and effect happen in one continuous motion.
   - In `finals/b/case-approve.mp4`, the brass fill on the button is handsome (00:03–00:07), but when the call fires (00:07–00:08), the new `To PayPal provide-evidence 200` row lands in the paper timeline *above* and partly behind the dark sheet—away from where the viewer's eye is anchored (**m1-claude**, **m3-claude**)—before collapsing to a bottom bar that overclaims `$412.00 defended` on an undecided sample case.
3. **"Complete product experience, not a tech demo" and readability for non-engineers (favours Final B).**
   - **m1-claude** showed that Final B translates every PayPal boundary call into plain English (`CaseClerk filed the evidence and PayPal accepted it`) above the raw endpoint and `debug id`, making the loop legible to product managers as well as engineers, whereas A's raw `21:57:39 out POST provide-evidence 200` mono lines can read like a developer console (**m1-claude**, **m3-claude**).
   - Final B also ships a real-case view (`b/case-real-1440.png`) as row 1 of the inbox, includes `Policy` in the top nav, and avoids A's exposed test-harness seams: A docks a `Sample case... Show it waiting for you, approved or resolved` switcher bar at the bottom of every case screen (**m1-claude**, **m3-claude**), puts the 3-line explainer *above* the `h1` on the landing page (**m3-claude**), leaves unstyled default-blue browser links at the bottom of `a/landing-1920.png` (**m1-claude**), and truncates PayPal's own webhook names to `CUSTOMER.DISPUTE.UPDAT…` on `a/inbox-1440.png` (**m1-claude**).
4. **Honesty and end-to-end completeness (indicts both finals).**
   - **m1-claude** demonstrated (and **m3-claude** agreed in r2) that both finals run their centerpiece approval ceremony on Daniel Okafor's sample case (`PP-R-NKT-10227591`) while stamping staged lines with `verified` and `200`, and claiming `PayPal answered 200` (A) or `PayPal accepted it` / `$412.00 defended` (B) when nothing touched PayPal.
   - Meanwhile, the actual sandbox dispute (`PP-R-JKB-10194463`) stops at `UNDER_REVIEW` after `POST adjudicate 200`, leaving the `"You kept $392.00"` payoff entirely on a sample case with future dates (`closed Oct 28` in A; `closed the case on Nov 4` in B, on Oct 25) (**m1-claude**).

## Consensus

By the end of Round 2, **m1-claude** and **m3-claude** reached full agreement on:
- **The winner and the submit-as-is verdicts:** Final A is the stronger architecture to build on, and neither Final A nor Final B is ready to submit as is (`no` on both).
- **Overall scores:** Both converged on **6.8 / 10** overall for Final A and **6.6 / 10** overall for Final B.
- **Top must-fix priority (#1 and #2 for both finals):** Trigger a real sandbox dispute $\ge \$250$ so the approval ceremony in the video runs on a real PayPal gate and produces a real `debug` ID, and take a real dispute to `CUSTOMER.DISPUTE.RESOLVED` (or end honestly on `"PayPal is deciding"` with no sample `"You kept $392.00"` in the video).
- **Sample honesty:** Replace `verified`, `200`, `"PayPal answered 200"`, and `"PayPal accepted it"` on sample cases with a single `staged` marker (**m1-claude**'s r2 synthesis of **m3-claude**'s repetition point), and fix B's contradictory `"Live on PayPal sandbox"` masthead over sample cases.
- **Removing demo seams and fixing facts in Final A:** Hide A's bottom state-switcher bar behind `?controls=1`; move the landing `h1` above the 3-line explainer; reconcile the landing `h1` time/duration claims (`9:31 pm` vs `21:35:07`, `29 seconds` vs `32 s`) with the Wire timestamps; make the real JKB ceramic-dish dispute the default case from the landing and inbox row 1; add `Policy` to A's nav; never truncate `CUSTOMER.DISPUTE.UPDATED`; and add one plain-English line per Wire entry so non-engineers do not read the Wire as a raw console.
- **Capture parity:** Capture Final A's screenshots and video at DPR 2 (`2880×1620` backing for `1440×810`) and fix the hydration flip on the Wire header (`Oct 24, 10:18 pm` in frame 00:00 flipping to `2 h 2 min ago` in frame 00:01 of `a/case-approve.mp4`).

## Unresolved dissent

1. **Design score gap between Final A and Final B (`m1-claude`: A 6.5 vs. B 7.5; `m3-claude`: A 6.5–7 vs. B 7).**
   - *Why I rule with m1-claude (A: 6.5, B: 7.5):* Looking across all viewports—including the `1920` and `390` shots that **m3-claude** did not inspect—Final A has unmistakable visual seams right now: unstyled `#0000EE` default browser links at the bottom of `a/landing-1920.png`, truncated `CUSTOMER.DISPUTE.UPDAT…` text in `a/inbox-1440.png`, truncated buyer names (`Whitfi…`, `Lindqv…`) in the 14-day strip, a yellow blob for the Kodak thumbnail, and the persistent test-harness bar across the bottom of the case view. They are fast to fix, which is why A is the right base, but judging the artifacts *as built*, B is a full point more polished on Design.
2. **Final B's amber/brass `$412.00` accent on the dark decision sheet (`m1-claude` wants it replaced with paper-white figures and an ink-on-paper fill; `m3-claude` wants to keep the amber weight and contrast, ranking any colour change near the bottom).**
   - *Why I rule with m1-claude:* The Round 1 spec (`VERDICT-meeting-r1.md` §2) explicitly restricted accent colour so that PayPal blue is the sole chromatic signal for boundary traffic, and gold-on-obsidian is a stock luxury-fintech template tell that competes with the PayPal loop. In B's must-fix list, replacing the brass figure and fill with paper-white / ink-on-paper keeps the sheet's dramatic scale and contrast without the template colour tell (placed at #8 in B's list, reflecting **m3-claude**'s point that structural loop fixes come first).

## Dropped members

- **m2-codex** (`codex:gpt-5.5:high` on oracle, stance: *"Top SaaS product-design critic (Stripe, Linear, Mercury, Vercel level); judges typography, layout, motion and finish; flags anything template-like or AI-generated"*): dropped in `r1` due to `agent error`.

## Confidence

**High.** Both active debaters independently converged on the same winner, the same `"no"` verdicts on submitting as is, the same overall scores, and the same root diagnosis. Furthermore, I directly verified every cited visual fact across the PNGs and MP4s in `materials/material-r1/finals/a/` and `finals/b/` against the specification in `VERDICT-meeting-r1.md` and `SLOP-qloo-round1.md`. What would change this confidence: only if the owner rejects the dark right-hand Wire plane concept altogether (the untested owner risk noted in `VERDICT-meeting-r1.md`) or if PayPal's sandbox environment blocks triggering a real $\ge \$250$ evidence gate before the submission deadline.

## Deliverable

### Final A: "Paper and Wire"

#### 1. Rating (1–10 against the five official criteria)

| Official Criterion (20% each) | Rating | Why (as decided by the UI and approval ceremony) |
|---|---|---|
| **Technological implementation** (as visibly proven) | **8.0 / 10** | Real PayPal `debug` IDs in `#6FB2FF`, `verified` webhook signatures, and `200` status codes are visible on the first screen of every page without scrolling, and the approval slip physically crosses into the PayPal Wire plane. Held back from 9.5+ because sample lines also display `verified` and `200`. |
| **Design** ("complete product experience, not a tech demo") | **6.5 / 10** | Strong paper-and-wire contrast and editorial typography (`Newsreader` + `Hanken Grotesk` + `IBM Plex Mono`), but hurt by exposed demo seams: the persistent bottom state-switcher bar, unstyled default-blue browser links at `1920`, inverted landing hierarchy (explainer above `h1`), missing `Policy` nav, truncated `CUSTOMER.DISPUTE.UPDAT…` event names, and DPR 1 desktop captures. |
| **Potential impact** (as shown) | **6.0 / 10** | The seller value proposition is clear, but the actual financial payoff (`"You kept $392.00"`) only exists on a staged sample case with a future date (`Oct 28`), while the real `$17.95` dispute has no photo and remains unresolved. |
| **Quality of the idea** (as shown) | **7.0 / 10** | The seller policy gate, expected-value breakdown, in-place evidence sheets, and physical approval slip communicate the autonomous-with-guardrails concept well, though `Policy` is missing from the navigation. |
| **Presentation** (video and first screen) | **6.5 / 10** | Best 10-second opening frame of either final, and the spatial slip-to-Wire flight (`00:06–00:07` in `a/case-approve.mp4`) visually proves cause and effect. Held back because the video climax runs on a sample case, the real case stops at `UNDER_REVIEW`, and frame `00:00→00:01` has a visible hydration flip in the Wire header. |
| **Overall** | **6.8 / 10** | |

#### 2. Verdict

**Competition-winning, submit as is: no**

#### 3. Must-fix list (ranked, concrete, 10 items)

1. **Video & case flow (`finals/a/case/*`, `case-approve.mp4`) — Run the approval ceremony on a real sandbox dispute $\ge \$250$:** Trigger one real PayPal sandbox chargeback $\ge \$250$ so the seller evidence gate fires on real data. Record the approval ceremony on that case so the slip lands on `[data-wire]` as `out POST provide-evidence 200` with a real blue `debug <id>`. Show Daniel Okafor's sample case only afterwards for $\le 8\text{ s}$ with `"Sample case"` visible, or omit it from the video entirely.
2. **Landing replay & case resolution (`finals/a/page`, `finals/a/case/[id]`) — Real end-to-end resolution or honest pending ending:** Before final capture, advance a real sandbox dispute through `CUSTOMER.DISPUTE.RESOLVED` so the landing replay and video end on a real `"PayPal decided for you"` sentence and real `RESOLVED` webhook. If sandbox adjudication has not emitted `RESOLVED` by capture time, set the final replay beat to `"PayPal is deciding; sandbox ruling requested 22:16:27"` and remove all sample `"You kept $392.00"` frames and future dates (`"closed Oct 28"`) from the video and resolved view.
3. **Case page bottom bar (`finals/a/case/[id]`, bottom viewport edge) — Hide the demo state switcher:** Remove the persistent bottom bar (`"Sample case. Nothing on this page went to PayPal. Show it waiting for you, approved or resolved. Sandbox: PayPal rules for the seller / Start over"`) from the default view and gate it behind `?controls=1`. Keep only the static label `"Sample case. Nothing on this page went to PayPal."` in the left margin under `PP-R-NKT-10227591`.
4. **Case page Wire & post-approve copy (`finals/a/case/[id]`, `[data-wire]` and paper body) — Strip fake-live markers from sample cases:**
   - In `[data-wire]` on sample cases, replace the right-column status words `verified` and `200` (and the second-line `sample` suffix) with a single right-column status word: `staged` in `wire3` (`#8C887F`).
   - On the paper column after sample approval, change `"PayPal answered 200 to /v1/customer/disputes/PP-R-NKT-10227591/provide-evidence. Sample case: a staged response, so no debug id."` to `"Staged: on a real case this posts to /v1/customer/disputes/{id}/provide-evidence and PayPal answers with a debug id."`
   - Sort all Wire entries strictly by full timestamp (newest on top) and display the date (`Oct 25` vs `Oct 23`) whenever it changes between rows so `10:40:34` never sits above `16:52:07` without a date label.
5. **Wire plane across all pages (`finals/a/**`, `[data-wire]`) — Add plain-English descriptions, fix event truncation, and fix header hydration:**
   - Under each real PayPal entry on the Wire, add one `14 px` `Hanken Grotesk` line in `wire2` (`#A29E95`) stating what happened at the PayPal boundary only (no agent reasoning): e.g., `"PayPal opened the chargeback"`, `"PayPal asked for evidence"`, `"CaseClerk filed the evidence and PayPal accepted it"`.
   - On `/finals/a/inbox` (and any narrow Wire container), stop truncating `CUSTOMER.DISPUTE.UPDATED` to `CUSTOMER.DISPUTE.UPDAT…`; either widen the inbox Wire from `28%` to `30%` (`min 400 px`) or render `DISPUTE.UPDATED` / `DISPUTE.CREATED` with the full string in `title`.
   - Render the Wire header timestamp (`"last webhook verified 2 h 1 min ago"`) identically on SSR and client hydration so frame 1 of the video never flips from `"Oct 24, 10:18 pm"` to `"2 h 2 min ago"`, and recapture all desktop stills and video at DPR 2 (`2880×1620`).
6. **Landing page (`finals/a`, paper column) — Fix reading order, timestamp arithmetic, meta-demo copy, and unstyled links:**
   - Move the `Newsreader` `h1` (`"A $17.95 chargeback..."`) *above* the 3-line grey intro paragraph (`"CaseClerk answers PayPal disputes..."`).
   - Make the `h1` facts match the Wire timestamps on the same screen: change `"came in at 9:31 pm"` to `"came in at 9:35 pm"` (matching `21:35:07 in CUSTOMER.DISPUTE.CREATED`, or display `create_time 21:31` on the Wire) and change `"29 seconds"` to `"32 seconds"` (matching `21:57:07` $\to$ `21:57:39`, or `30 seconds` for the first filing `21:36:07` $\to$ `21:36:37`).
   - Under the `"Open a test dispute"` button, replace `"On the live app this opens a real PayPal sandbox dispute; its webhook usually reaches us in about 3 minutes."` with `"A sandbox chargeback. PayPal's webhook reaches us in about 3 minutes."`
   - Style the bottom links (`"See the disputes desk or open the $412.00 sample case"`, visible at `1920×1080`) in ink (`#16161A`) with a subtle hairline underline—never default browser `#0000EE` blue, which violates G6 (`blue means PayPal`).
7. **Default case routing & Inbox row 1 (`finals/a`, `finals/a/inbox`) — Make the real sandbox case the primary path:**
   - Change the landing page text link to `"Open this case"` pointing to `/finals/a/case/PP-R-JKB-10194463` (building the real-case page in A using B's `case-real-1440` structure: `"Real PayPal sandbox case. Every id here came from PayPal."`), with a credited photo for the ceramic ring dish.
   - On `/finals/a/inbox`, place the real `PP-R-JKB-10194463` ceramic ring dish dispute as the first row (labelled `"Real sandbox case"` with its last PayPal call and `debug f2843364d3500`), moving the sample rows underneath.
8. **Approval slip (`finals/a/case/[id]`, `.slip` and left margin) — Remove duplicate amount and raw fake IDs:**
   - Remove the duplicate `56 px` `$412.00` from the top-right of `.slip` (the `52 px` `$412.00` case figure already sits `60 px` directly above it).
   - Replace the truncated raw letter excerpt (`"On 2026-10-09 the buyer, located in Toronto, Canada, paid USD 412.00 (capture 8MC585209K746392H, order 5O190127TN364715T) for one Olympus OM-1n body, chrome, serial..."`) with a clean 2-line summary: `"What PayPal receives: a 4-section evidence pack—seller statement, order receipt, UPS delivery signed OKAFOR, and the Oct 7 shutter test roll."`
   - In the left margin next to `.slip`, adopt B's clearer policy sentence: `"Over your $250.00 evidence line, so it waits for you."`
   - Change the button label from `"File the evidence on $412.00"` to `"File the evidence on the $412.00 case"`.
9. **Navigation & Policy page (`finals/a/**` masthead and `/finals/a/policy`) — Restore Policy to the nav:** Add `Policy` to the masthead navigation (`Disputes`, `Waiting for you 2`, `Deadlines`, `Policy`) and expose the sentence-based Policy view (`"Act on my own when the money is under [$50.00]..."` with the live rolling consequence line `"With this policy, n of your 7 open cases would wait for you"`) so the video's `2:42–3:00` seller-control beat can be recorded.
10. **Inbox 14-day strip & thumbnails (`finals/a/inbox`) — Fix name truncation and the Kodak image:**
    - In the 14-day deadline strip, display only the amount (`$319`, `$1,240`, `$412`, `$75`, `$689`) or surname without ellipsis at `< 120 px` cell width so `Whitfi…`, `Lindqv…`, `Hollo…`, and `Naka…` never truncate (enforcing G19).
    - Replace the `56×42` Kodak Portra 400 thumbnail (currently an indistinct yellow rectangle) with a clear, high-contrast film box/canister photo.

#### 4. Anything that reads AI-generated, template-like, or fake-live

- **Fake-live:** Stamping `verified` and `200` on sample Wire lines (`16:52:07 in CUSTOMER.DISPUTE.UPDATED verified`, `10:40:04 out POST provide-evidence 200 sample`) and writing `"PayPal answered 200 to /v1/customer/disputes/PP-R-NKT-10227591/provide-evidence"` on a case that never touched PayPal.
- **Fake-live / synthetic data:** Fabricated PayPal-shaped IDs (`capture 8MC585209K746392H, order 5O190127TN364715T`) and raw ISO date (`2026-10-09`) inside the sample slip letter preview; future resolution date (`"closed Oct 28"` when viewed on Oct 25); out-of-order timestamps (`10:40:34` above `16:52:07` with no date separator).
- **Demo scaffolding tells:** The persistent bottom state-switcher bar (`"Show it waiting for you, approved or resolved. Sandbox: PayPal rules for the seller"`), the self-incriminating landing line `"On the live app this opens a real PayPal sandbox dispute"`, unstyled `#0000EE` browser links at `1920`, and the video frame 00:00 $\to$ 00:01 hydration flip (`"Oct 24, 10:18 pm"` $\to$ `"2 h 2 min ago"`).
- **Template / layout tells:** Repeating `$412.00` four times on a single viewport; the dark right-hand mono plane reading like a raw developer console to non-technical judges until plain-English call lines are added; truncated `CUSTOMER.DISPUTE.UPDAT…` and `Whitfi…` strings.

---

### Final B: "Darkroom paper"

#### 1. Rating (1–10 against the five official criteria)

| Official Criterion (20% each) | Rating | Why (as decided by the UI and approval ceremony) |
|---|---|---|
| **Technological implementation** (as visibly proven) | **6.0 / 10** | Real webhook event IDs and `debug` IDs are present in the prose timeline, and `b/case-real-1440.png` is an excellent proof page. However, PayPal traffic shares the same paper surface and brass rule as internal agent notes, and on the pending case screen the dark decision sheet completely hides the timeline below the fold. |
| **Design** ("complete product experience, not a tech demo") | **7.5 / 10** | Feels like a calm, finished product desk with a real-case page, `Policy` in the nav, well-crafted prose rows, and a striking dark decision sheet. Held back by the 280 px left case-list rail (which recreates the rejected three-column SaaS silhouette), the luxury-template brass-on-black `$412.00` accent, and an empty right half on `b/inbox-1440.png`. |
| **Potential impact** (as shown) | **6.5 / 10** | Has the strongest resolution headline (`"PayPal decided for you. You kept $392.00: the $412.00 less the $20.00 chargeback fee. The camera stays with Daniel."`), but it is only shown on a sample case with a future date (`Nov 4`), and the approved bar overclaims `"$412.00 defended"` while PayPal is still deciding. |
| **Quality of the idea** (as shown) | **7.0 / 10** | The policy line (`"Over your $250.00 evidence line, so it waits for you."`) and plain-English PayPal event explanations make the product concept effortless to grasp. |
| **Presentation** (video and first screen) | **6.0 / 10** | On the case page, the live PayPal loop is not unmistakable in 10 seconds. During `b/case-approve.mp4`, the new `provide-evidence 200` row lands in the paper timeline *above* the dark sheet (`00:07–00:08`) while the viewer's eye is on the bottom-right button, and the ceremony runs on a sample case. |
| **Overall** | **6.6 / 10** | |

#### 2. Verdict

**Competition-winning, submit as is: no**

#### 3. Must-fix list (ranked, concrete, 10 items)

1. **Video & case flow (`finals/b/case/*`, `case-approve.mp4`) — Real sandbox approval $\ge \$250$ and real resolution:** Same prerequisite as Final A's items 1–2: run the video's approval ceremony on a real sandbox dispute $\ge \$250$ so it yields a real `debug` ID, and end on a real `CUSTOMER.DISPUTE.RESOLVED` event (or an honest `"with PayPal"` pending state without sample `"You kept $392.00"` frames).
2. **Timeline PayPal register (`finals/b/**`, timeline rows) — Visually separate PayPal traffic from agent notes:**
   - Give every `From PayPal` and `To PayPal` row on real cases a `2 px` PayPal-blue (`#0059B8`) left rule and set the `debug id <id>` / `event <id>` token in `#0059B8`.
   - Remove the left rule from internal agent rows (`"Built the evidence pack..."`, `"Decided to fight..."`) so only PayPal boundary traffic carries a vertical bar.
   - On sample cases, render the rule as dashed `ink3` (`#67635B`) and replace green `verified` and `200` badges with neutral `staged`.
3. **Case pending first screen (`finals/b/case/[id]`, at `1440×810`) — Keep PayPal proof visible above the rising sheet:**
   - Ensure the 2 newest PayPal timeline rows sit above the top edge of the dark decision sheet at `1440×810` (start the visible timeline with the latest `From PayPal` webhook rather than the internal `"Built the evidence pack"` row).
   - Cap the dark decision sheet height at `280 px` and rewrite the truncated `"What PayPal receives"` copy (`"...Evidence type: proo..."`) into one complete, untruncated line: `"What PayPal receives: seller statement, order receipt, UPS delivery signed OKAFOR, listing photos, and the Oct 7 test roll."`
4. **Approval ceremony payoff (`finals/b/case/[id]`, `case-approve.mp4`) — Land the PayPal 200 inside the dark sheet before collapse:** When `"Sending to PayPal"` completes, render the new `To PayPal provide-evidence 200 · debug id <id>` confirmation line *inside* the dark decision sheet for `1.5 s` where the user's eye is focused, then collapse the sheet into the bottom bar reading `"Evidence filed with PayPal 10:42:08 · debug id <id>"`.
5. **Masthead live indicator (`finals/b/**`, top-right masthead) — Stop claiming `"Live on PayPal sandbox"` over sample cases:**
   - On real cases and the landing page, show `"PayPal sandbox · last real webhook 2 h 23 min ago · PP-R-JKB-10194463"` (using the word `"Live"` with a pulsing dot only when the latest webhook is $< 15\text{ min}$ old).
   - When viewing any sample case, change the masthead indicator or case banner so it never contradicts `"Sample case. Nothing here went to PayPal."`
6. **Post-approve and resolved copy (`finals/b/case/[id]`) — Remove overclaims and future dates:**
   - In the collapsed post-approve bottom bar, change `"$412.00 defended"` to `"$412.00 · PayPal is deciding"`.
   - On sample cases after approval, change `"CaseClerk filed the evidence and PayPal accepted it"` to `"Staged: on a real case, CaseClerk files the evidence and PayPal returns a debug id here."`
   - On sample resolved views (`b/case-resolved-1440.png`), remove the future date `"PayPal closed the case on Nov 4"` and `"Nov 4 14:20:00"`.
7. **Default case & real-case photo (`finals/b`, `finals/b/inbox`) — Route to the real JKB dispute first and add its photo:** Make `PP-R-JKB-10194463` (`b/case-real-1440.png`) the default case opened from the landing page and the inbox, and add a credited `160×120` matted photo of the sage-glaze ceramic ring dish to the real case's left margin and `56×42` inbox row so the top row is not the only open dispute missing an image.
8. **Decision sheet colour (`finals/b/case/[id]`) — Replace luxury-template brass-on-black:** Replace the brass/amber `#D4943A` `$412.00` figure and brass button-fill animation on the dark decision sheet with paper-white (`#FBF9F4`) tabular figures and a clean paper-on-ink / ink-on-paper progress fill, keeping PayPal blue as the product's sole semantic colour accent.
9. **Case-list left rail (`finals/b/case/[id]`) — Collapse the 280 px rail at 1440 px:** At `< 1680 px` viewports, drop the persistent `280 px` left case-list rail (which recreates the rejected three-column SaaS silhouette and wraps 3-line status strings) and rely on the existing left-margin pager (`"5 of 8 open, 2 need you"`, `Previous (K)` / `Next (J)`).
10. **Time zones & Inbox layout (`finals/b/**`, `finals/b/inbox`) — Unify time zones and balance the 1440 inbox:**
    - Use one consistent time zone (`PT` / Pacific, the seller's local time) across landing, real cases, and sample cases instead of mixing `"Times in UTC"` (`Oct 25 05:18:38`) with `"Times in Pacific"`.
    - On `/finals/b/inbox`, delete the preview meta-sentence `"The other 10 are sample cases written for this preview; their clocks run from Oct 25, 10:40 am Pacific"` (relying on the per-row `"Sample case"` labels) and widen the header/strip container so the right third of the `1440` viewport is not blank paper.

#### 4. Anything that reads AI-generated, template-like, or fake-live

- **Fake-live / contradictions:** Displaying `"Live on PayPal sandbox"` in green at the top right of a sample case whose left margin says `"Sample case. Nothing here went to PayPal."`; showing green `verified` and `200` badges and `"CaseClerk filed the evidence and PayPal accepted it"` on staged sample rows; claiming `"$412.00 defended"` in the bottom bar immediately upon filing evidence; and dating a sample resolution in the future (`"Nov 4"` on Oct 25).
- **Template tells:** The `280 px` left case-list rail + `168 px` margin + case column + bottom bar layout (rebuilding the standard 3-pane SaaS desk silhouette rejected in Round 1); the luxury-fintech gold/brass `$412.00` on a near-black sheet; and repeating `$412.00` five times on a single pending case screen (rail, `h1`, case figure, sheet figure, and approve button).
- **Demo meta-copy:** Writing `"The other 10 are sample cases written for this preview"` directly in the inbox subheadline instead of staying in product voice.

---

### Which final is stronger for winning, and why

**Final A ("Paper and Wire") is stronger for winning.** In a PayPal-judged hackathon where judges may score from the video and first screen alone, Final A's dark Wire plane proves within 10 seconds on every page that CaseClerk is talking to PayPal's live sandbox APIs (`CUSTOMER.DISPUTE.*` webhooks, `200`s, and blue `debug` IDs), and its approval ceremony turns that proof into a single spatial motion as the paper slip flies across the seam into the PayPal plane. Final B looks more like a finished desk at first glance and writes clearer plain-English PayPal rows, but it buries PayPal traffic inside the paper timeline with the same weight as agent notes and covers that timeline with a dark modal sheet at the exact moment of approval. Final A's flaws are surface demo seams (the bottom switcher bar, `verified` labels on sample rows, unstyled links, and missing plain-English subtitles) that can be fixed in place without changing its layout, whereas fixing Final B's hidden PayPal loop requires rebuilding it toward Final A.


---
## Debate record (written by company debate)
- m1-claude: company-worker:claude-opus-5-5:high on oracle, stance "PayPal developer-relations judge scoring all five official criteria from the video and first screen; wants the live PayPal loop unmistakable in 10 seconds and a finished product, not a tech demo"
- m2-codex: codex:gpt-5.5:high on oracle, stance "Top SaaS product-design critic (Stripe, Linear, Mercury, Vercel level); judges typography, layout, motion and finish; flags anything template-like or AI-generated" — DROPPED: r1: agent error
- m3-claude: company-worker:claude-sonnet-5-5:medium on oracle, stance "Fresh first-time visitor with 5 seconds per screen; says what the product is, who it is for and what to click, and what confused you"
- phases run: r1, r2
