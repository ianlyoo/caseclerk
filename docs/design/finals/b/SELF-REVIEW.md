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
