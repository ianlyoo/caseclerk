# Final B ("Darkroom paper"), self-review against the verdict's diagnosis (VERDICT-meeting-r1.md §1)

| Diagnosis row | What B does instead |
|---|---|
| No motion; Approve swaps a sentence after a raw `setTimeout` | Every data change moves (motion + NumberFlow): PayPal rows drop in, status fades in after, in-flight rule loops only while a request is open, the decision sheet rises on a spring, Approve fills brass left→right over the 4 s undo window, the amount counts, the sheet collapses, the nav count rolls down. Reduced motion: every animation ≤ 150 ms (checked). |
| B: Newsreader 300, grey body, ~45 % empty margin at 1920, 3.8 screens long | Newsreader 400 only, ink2 `#57534A` (7+:1), a 280 px case list + 168 px margin + 760 px column (wider ≥ 1800), the decision sheet pinned so the amount and Approve sit on the first screen at every desktop size. |
| A: list/detail/properties template, 6 px blue button | No panes: slim list, sentence-first column, one dark sheet. 56 px paper button on the dark sheet. No blue or teal anywhere (checked by hue). |
| "Live on PayPal sandbox" faint and hard-coded; reused debug id | The masthead live state links to PP-R-JKB-10194463 and shows the last verified webhook and its age from the production snapshot; the dot breathes only if < 24 h old. Every debug/event id shown exists in production's audit; none reused (G12 check). Sample cases carry no PayPal ids and say "Sample case". |
| Evidence pack: gradient CSS art, 90 px wide | Four raised paper sheets mirroring `buildEvidencePdf`'s sections; click opens an in-place reader at ≥ 16 px; Download builds the real PDF from the same input (reader/PDF text parity checked). |
| Approve: a pill that turns into a sentence | The ceremony: brass fill, undo/Send now, in-flight rule, a new `POST provide-evidence 200` row lands in the timeline, then PayPal's UPDATED webhook; the sheet collapses to "Evidence filed with PayPal hh:mm:ss"; failure says "Nothing was sent." with PayPal's error name. |
| No camera, no landing, no resolved state | Matted CC/PD camera photos (≤ 40 KB WebP, credited); landing with a 9 s replay of the real case; resolved state "You kept $392.00" (the $412.00 less the $20.00 chargeback fee, matching `_shared`) with the RESOLVED event (sample only: the real case is still UNDER_REVIEW). |
| Dead ends (every row opens Daniel; Policy/PDF/test dispute do nothing; Bryntum) | 11 inbox rows each open their own case; J/K and Previous/Next words; Deadlines is a native 14-day strip; Policy is in-page sentences; PDF downloads; "Open a test dispute" runs a labelled local staged wait. No Bryntum. |
| Wordmark in 15 px body text | "CaseClerk" set in Newsreader with a brass-on-ink square mark in the masthead. |

## Judge round 1, B's must-fix list (2026-10-25)

Rows above that say "brass", "no blue", "Sample case" or "You kept $392.00" describe round 0; this section replaces them.

| Fix | What B does now | Checked by |
|---|---|---|
| 1 Real ceremony | Default case is the real $412.00 PP-R-VPY-10194485, pending, read live from `GET /api/cases/:id` (5 s poll, snapshot first). Its sibling PP-R-NJA-10194486 ($389.00) is the real approved, filed (provide-evidence 200, debug f8469524f503f) and RESOLVED story (event WH-01G68820AD177843M-8SL79965VW8605524). `case-real.mp4` shows VPY pending, then NJA resolved, with no click on a real Approve and no sample frames. | video; G12 ids vs production |
| 2 Register | Real PayPal rows: 2 px #0059B8 rule, ids in #0059B8. Agent rows: no rule. Sample rows: dashed ink3 rule, "staged" instead of 200/verified. | computed styles on every row |
| 3 Pending first screen | While the sheet is up, the h1 is smaller and the figure moves into the sheet; the 2 newest PayPal rows sit above a ≤ 280 px sheet; "What PayPal receives:" is one unclamped line. | geometry at 1440×810 |
| 4 200 in the sheet | Real Approve POSTs `/api/actions/:id/approve`; PayPal's 200 and debug id land inside the dark sheet for 1.5 s, then the bar "Evidence filed with PayPal hh:mm:ss PT  debug id …". The poll after it does not double the row. | mocked made-up case id (PP-R-ZZZ-99999999); the script aborts every other actions POST |
| 5 Masthead | "PayPal sandbox, last real webhook <type> <age>, <case id>", from `/api/wire` (since = newest − 60 s, deduped). "Live" and the moving dot only under 15 min; on samples it reads "Staged sample. Real PayPal sandbox traffic:". | masthead text vs data-live |
| 6 Copy | Bar: "$412.00 PayPal is deciding". Staged after-approve row as specified. No Nov 4 dates. | text checks |
| 7 Default + photo | Landing, inbox top rows and `/finals/b/case` lead to the real cases; ring-dish photo (CC0, Cleveland Museum of Art) on JKB, OM-1n photo on the real Olympus cases. The staged Daniel Okafor sample is no longer listed (URL only). | links check |
| 8 No brass | `--brass` gone; paper-white figures, ink-on-paper Approve fill; PayPal blue is the only accent. | hue probe + tells |
| 9 Rail | The 280 px list shows only ≥ 1680 px; below, the margin pager. | shots |
| 10 PT, inbox | PT everywhere in the app UI; inbox meta sentence deleted; inbox widened to 1680 px. Exception: the evidence pack reader mirrors the PDF PayPal receives, which `src/lib` writes in UTC (reader/PDF parity kept). | PT check outside the pack |
| Offer cap | 40 %, as DEFAULT_POLICY. | |

## Judge round 2, B's must-fix list (2026-10-25)
| # | Fix | Evidence |
|---|---|---|
| 1 | Captures from the production build on the Mac (`next start`, no dev badge), stills at DPR 2 (2880 px at 1440, 3840 px at 1920). | `*-1440.png`, `*-1920.png`, `*-390.png`, `case-real.mp4` |
| 2 | Tracker writes are named by method: a PUT reads "update tracker", "CaseClerk updated the tracking on the PayPal payment". | `check-ui-b.log` (fix 2 PUT label) |
| 3 | Landing: the headline states what happened on NJA; three-row receipt (CREATED, provide-evidence 200, RESOLVED); primary "Review the $412.00 case waiting for you"; secondary "Open a test dispute" calls the real `POST /api/test-dispute`, shows "PayPal is opening the chargeback. Its webhook usually arrives in 3–5 minutes." and polls until the case appears. Checks mock the route (202 and 429). | `landing-*.png`, `check-ui-b.log` (r2 fix 3) |
| 4 | Timeline: newest PayPal receipt pinned on top; runs of routine GETs and signature checks fold into one row with its debug id. | `case-*-1440.png`, `check-ui-b.log` (r2 fix 4) |
| 5 | Phones: no horizontal overflow on any page at 390 (measured against the device width), one short masthead line, ids wrap. | `*-390.png`, `check-ui-b.log` (r2 fix 5) |
| 6 | Resolved headline from PayPal's fund movements only: "You keep $378.43: the $389.00 sale less PayPal's usual fee. PayPal paid the buyer itself." plus the sandbox-ruling disclosure. | `case-resolved-*.png`, `check-ui-b.log` (r2 fix 6) |
| 7 | Rail removed; one centred column at 1440 and 1920. | `case-*-1440.png`, `case-*-1920.png`, `check-ui-b.log` (r2 fix 7) |
| 8 | State sync: the case is held during undo and sending, and the filed row lands in the same frame the bar flips. | `check-ui-b.log` (fix 8), `case-approve-real.log.txt` (TOP AT LANDED) |
| Ceremony | B3, PP-R-IMW-10194496 ($393.00), one click on the production build: provide-evidence 200, debug id f167343c32e7c. Then a captioned jump to NJA, labelled as a different real case. The LTK round-1 set is kept as `case-approve-real-ltk*`. | `case-approve-real.mp4`, `-before.png`, `-after.png`, `.log.txt` |

## Judge round 3, B's must-fix list (2026-10-25)
| # | Fix | Evidence |
|---|---|---|
| 1 | Video re-cut from the B3 raw take, no new click. The 0.11 s where the old build overprinted rows and faded "Sending to PayPal" under the success headline is replaced by a hold of the last clean frame (clock and speed unchanged). Caption now "Fast-forward 2.3× (real PayPal wait 5.8 s)". The NJA ending is gone: a card "8 minutes later: PayPal closed it." (filed 04:28:41 PT, closing webhook 04:37:09 PT, sandbox disclosure), then IMW's own resolved page, recorded fresh from the hosted build with GETs only. The code no longer overprints: the sheet's action row unmounts at once, and rows a poll adds appear only after their neighbours have moved. Note: the take itself still shows the round-2 masthead and copy, since there was no new click. | `case-approve-real.mp4`, `case-approve-real-end.png`, `case-approve-real-recut.log.txt`, `recut-b3.cjs` |
| 2 | Masthead: on a case page it is that case's own last webhook ("last webhook on this case"); on the landing and inbox it is "last real webhook". No enums or case ids. | `check-ui-b.log` (r3 fix 2), `*-1440.png` |
| 3 | Money from a verified map keyed by dispute id (NJA, UDP, LTK, TZD, AAJ, IMW, RCJ from REAL-CASES.md). Any other resolved case gets "PayPal closed the chargeback with no debit to your account." RESOLVED_WITH_PAYOUT appears only in the Wire. The disclosure reads "Sandbox only: we asked PayPal's sandbox to rule. On a live account PayPal decides on its own." on the landing and on resolved real cases. | `check-ui-b.log` (r3 fix 3, incl. a mocked unmapped case), `case-resolved-*.png`, `landing-*.png` |
| 4 | Inbox: "Last PayPal call" skips the operator's adjudicate and require-evidence; "Filed the evidence; PayPal is deciding."; the subline names the dispute reason ("Not as described chargeback"). | `inbox-1440.png`, `check-ui-b.log` (r3 fix 4) |
| 5 | No "once"; agent rows read "$393.00"; "Case closed; nothing left to do."; "Every id here came from PayPal." removed; "Shared limit: three a day."; the phone CTA is one line; the top PayPal row clears the phone sheet. | `landing-390.png`, `case-pending-390.png`, `check-ui-b.log` (r3 fix 5) |

## Judge round 4 and the fresh readers (2026-10-25)
| # | Fix | Evidence |
|---|---|---|
| J1 | Pending sheet: "The agent recommends filing: 35% chance PayPal decides for you. Tracking proves delivery, not condition." plus "Filing has no fee; accepting gives up the $412.00." and a "Review the evidence" link that opens the reader. In view with both buttons at 1440, 1920 and 390 (the cost sentence is hidden on phones). | `case-pending-*.png`, `check-ui-b.log` (round 4 sheet) |
| J2 | Video re-cut from the B4 take, no new click. The "Real time, not sped up" caption moves from beside the CUSTOMER.DISPUTE.UPDATED row to the empty middle of the masthead (frames 383–579; the old spot is repaired from blank paper). Card: "11 minutes after you approved, PayPal closed it. Same case, PP-R-IHX-10194506. You kept $380.38." (approved 05:46:22 PT, closing webhook 05:57:34 PT). Then IHX resolved, recorded read-only (GET only): "You kept $380.38", "The $391.00 sale less PayPal's $10.62 fee." The take itself shows the build of the click, so its sheet has no recommendation line. | `case-approve-real.mp4`, `-end.png`, `.log.txt` (Round 4), `recut-b4.cjs` |
| J3 | When the 200 lands, the sheet label and title change to "Filed with PayPal" / "Evidence filed with PayPal." in the same render. The nav "Waiting for you" count and "N need you" drop only then, not while sending (a mocked response held 7 s, with a poll landing while it is open; a made-up case id). | `check-ui-b.log` (fix 8, realLoop) |
| J4 | Resolved h1: "A buyer's bank charged back the Olympus OM-1n body you sold. PayPal closed the case." | `case-resolved-*.png` |
| J5 | An unmapped RESOLVED_WITH_PAYOUT reads "PayPal closed the chargeback. Seller money outcome not yet verified." | `check-ui-b.log` (r3 fix 3, mocked case) |
| R1 | Landing states the rule: "Small cases it answers on its own, under your rules; over $250 to file, or $50 to refund or offer, it asks you first." with a Policy link. JKB's first filing says "on its own, under your $250.00 evidence line". | `landing-*.png` |
| R2 | Inbox caption: separate sandbox test disputes, one listing; the closed real cases fold into one row; staged samples sit apart under their own heading. Landing: "A separate test dispute on the same camera listing is waiting for your answer:" above the CTA. | `inbox-*.png`, `landing-*.png` |
| R3 | The h1, nav badge, "N need you" and deadline strip all count real listed cases only; the strip shows only open cases that wait for you. | `check-ui-b.log` (round 4 counts) |
| R4 | "PayPal asked for more evidence, so CaseClerk filed again; PayPal answered 200". | `case-deciding-*.png` |
| R5 | "Without an answer by the deadline, PayPal rules for the buyer: the seller would have lost the $389.00 and the fee." | `landing-*.png` |
| Small | Why filing at 35% pays (no fee vs the amount); "11 minutes after you approved"; "$0.05 … the sum of its model calls in this case's log". | as above |

## Judge round 5 (2026-10-26)
Files the earlier rounds cite that no longer match the build are gone: the LTK round-1 set, `case-approve-real-before/after.png` (frames of the take's older build), `case-approve-real-recut.log.txt`, `recut-b3.cjs` and `recut-b4.cjs` (`recut-b5.cjs` does both cuts).

| # | Fix | Evidence |
|---|---|---|
| 1 | Video, still the B4 take with no new click: it runs at 1x through the full 3.3 s PayPal wait to the last "Sending to PayPal" frame (f00577, 9.97 s), then cuts to the settled filed state (f00788) under a masthead label "Cut: same case, 3.5 s later, after the filing". The old build's "File this evidence with PayPal?" above the 200 is no longer in the film. Disclosed: the take's nav badge drops 3 → 2 at ~7.8 s, during "Sending to PayPal"; that is the take's older build, before the J3 fix (the current build drops it only on the 200, `check-ui-b.log` r4 fix 3). | `case-approve-real.mp4` (23.0 s), `case-approve-real.log.txt` (Round 5), `recut-b5.cjs` |
| 2 | `case-real.mp4` re-recorded read-only (hover only, every POST blocked) from the current build: the pending sheet with its recommendation, then the resolved NJA page with the short h1. Stale LTK files removed (above). | `case-real.mp4` (14.8 s) |
| 3 | When PayPal's latest webhook is not the newest row, it gets its own heading ("PayPal's request" on a pending case, "PayPal's decision" on a resolved one) above "What happened, newest first", and that list is strictly newest first. A filing's 200 stays pinned inside the list, so it never jumps between lists as polls land. | `case-pending-*.png`, `case-resolved-*.png`, `check-ui-b.log` (r5 fix 3) |
| 4 | JKB: "Sandbox test control: we asked PayPal's sandbox to rule (a live account can't do this)"; the require-evidence row reads "we asked PayPal's sandbox to request more evidence". | `case-deciding-*.png`, `check-ui-b.log` (r5 fix 4) |
| 5 | The Previous / Next pager walks open cases only (and the case on screen), as the inbox folds the closed ones; IHX and NJA now point to the ring dish, not sibling Olympus cases. | `case-resolved-*.png`, `case-approve-real-end.png`, `check-ui-b.log` (r5 fix 5) |
