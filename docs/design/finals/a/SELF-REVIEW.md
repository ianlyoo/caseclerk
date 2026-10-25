# Final A, "Paper and Wire": self-review against the verdict's diagnosis (§1)

| Diagnosis row (drafts) | What Final A does instead |
|---|---|
| No motion; Approve swaps a sentence after a raw `setTimeout` | Every data change moves, and each movement carries a `data-cause`: the slip lifts and travels into the Wire on a spring (420/41), PayPal lines arrive at the top, the nav count and figures roll with NumberFlow, the h1 crossfades on resolve and a green rule draws. G1: 393–652 px of travel at the desktop sizes, 544 px on phone. Reduced motion: every animation ≤ 150 ms (G4). |
| B: washed-out Newsreader 300, grey body, empty margin | Newsreader 400/500 for h1s at ≥ 46 px (52 px at 1440), ink #16161A on paper, a 176 px margin column that holds the case's status, policy and pager, and a case column capped at 880 px. |
| A: Linear/Front three-pane template, 13.2 px base | One reading column plus the dark Wire. Body text is 16–18 px and no text is below 13 px. The Approve button is 52 px tall. |
| "Live on PayPal sandbox": faint, hard-coded, with a reused debug id | The Wire is the only dark plane on every page. Real lines come from PP-R-JKB-10194463: 4 debug ids and 6 event ids, all checked against the prod API (G12), shown in blue #6FB2FF at 14 px, and none reused. The header gives the real webhook time ("last webhook verified …"). Sample lines read "sample" and never carry a debug id. |
| Gradient "lenses" and film frames in the evidence pack | Exhibits are typeset sheets with real text, opened in a 640 px in-place reader (Esc or a click outside closes it). There is no CSS art, 0 radial or repeating gradients (G11), and the reader says there is no PDF for sample cases. |
| Approve is a pill or a 6 px button that becomes a sentence | A slip that names the action and the amount ("File the evidence on $412.00"), a 4 s undo rule with Undo and Send now, the slip's flight into the Wire, an in-flight rule while PayPal answers, then "Evidence filed with PayPal. hh:mm:ss" with the 200. The count drops by 1, no Approve remains (even after a reload), and no "until you decide" stays on the page. |
| No camera, no landing, no resolved state | Five CC-BY/CC0 WebP photos (3–32 KB, credited in `public/finals/CREDITS.md`). A landing that replays the real JKB run in 9 s. A resolved state: "PayPal decided Daniel Okafor's chargeback in your favour.", "You kept $392.00", and CUSTOMER.DISPUTE.RESOLVED on the Wire. |
| Dead ends: every row opens Daniel; Policy, PDF, test dispute and Deadlines go nowhere | All 11 rows open their own case (G15), and all 17 links resolve inside /finals/a. Deadlines is our own page with the 14-day strip (marks bound to dueAt, G19). Open a test dispute runs a staged wait, labelled as staged in the browser. Policy is not in the nav (see Decisions). |
| Wordmark is 15 px body text | A Newsreader wordmark with an ink square, the same on every page. |

## Exemptions and N/A, stated
- G3: the undo rule (4 s) and the in-flight rule (1.4 s, infinite) run longer than 900 ms because the spec sets those durations. The check exempts exactly `[data-undo-rule]`, `[data-inflight]` and `[data-live-dot]`.
- G5: the phone Approve button is a full-width ink control, about 5 % of the viewport. The check counts planes, not buttons.
- G21: N/A. Sample cases have no PDF.
- T9: Final A underlines inline links by design. The check asserts the nav has no underlined tabs.
