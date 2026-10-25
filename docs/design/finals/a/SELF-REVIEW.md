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
| Dead ends: every row opens Daniel; Policy, PDF, test dispute and Deadlines go nowhere | All 11 rows open their own case (G15), and all 17 links resolve inside /finals/a. Deadlines is our own page with the 14-day strip (marks bound to dueAt, G19). Open a test dispute runs a staged wait, labelled as staged in the browser. /finals/a/policy lists the app's DEFAULT_POLICY as seven rules, each linked to a case where it applied, with a preview-mode switch. |
| Wordmark is 15 px body text | A Newsreader wordmark with an ink square, the same on every page. |

## Exemptions and N/A (approved by the PM)
- G3: the undo rule (4 s) and the in-flight rule (1.4 s, infinite) run longer than 900 ms because the spec sets those durations. The check exempts exactly `[data-undo-rule]`, `[data-inflight]` and `[data-live-dot]`.
- G5: the phone Approve button is a full-width ink control, about 5 % of the viewport. The check counts planes, not buttons.
- G21: N/A. Sample cases have no PDF.
- T9: Final A underlines inline links by design. The check asserts the nav has no underlined tabs.

## Fixed during the finals checks
- G6: browser-default blue on inline links (landing and policy). The probe now flags any blue hue outside `[data-origin=paypal]`.
- G9: inbox, deadlines and policy headlines were 44 px at 1440; they are now ≥ 46 px.
- G19: Marta's $1,240 was cut off on the phone strip. The phone strip now shows six days, and a check asserts that no amount is truncated at any of the 5 sizes.
- The shared POLICY offered up to 45 %; it is now the app's DEFAULT_POLICY (40 %).

## Judge round 1: Final A must-fix list
1. **Real ceremony.** The $412.00 real case PP-R-VPY-10194485 renders live from the production API with its real slip ("File the evidence on the $412.00 case", "Over your $250.00 evidence line, so it waits for you."). Approve posts through `/finals/a/live/actions/<id>/approve`, a same-origin forward to production's already-public approve route, so the proxy adds no new exposure. The slip runs the undo window, then shows PayPal's status and debug id, or "Nothing was sent" with the error. VPY is camera only: nothing here approves it. The real Approve button carries only `data-real-approve`, and both the checks and the shot script abort every approve request. The video (`real-tour.mp4`, DPR 2) is a tour: the landing replay, VPY waiting (hovered, never clicked), then NJA resolved. The approval on camera waits for the PM.
2. **Real resolution.** PP-R-NJA-10194486 ($389.00): the PM approved it, CaseClerk filed it (provide-evidence 200, debug f8469524f503f), and PayPal sent the RESOLVED webhook WH-01G68820AD177843M-8SL79965VW8605524. The landing replays this run and ends on it. JKB's page ends honestly: "PayPal is deciding; sandbox ruling requested 22:16:27 PT". The sample's resolved state, behind `?controls=1`, now says "A staged ending", has no "You kept", and links to a real ruling. No future dates remain.
3. **Controls.** The state bar renders only with `?controls=1`. The margin says "Sample case. Nothing on this page went to PayPal."
4. **Sample honesty.**
   - Sample Wire lines read `staged` in wire3, with no debug id and no suffix.
   - The post-approve copy is the verdict's sentence.
   - The Wire sorts by full timestamp, newest first, with date rows.
5. **Wire.**
   - Every real entry has a 14 px Hanken plain-English line in wire2.
   - Event names break only at the dots and are never cut (checked).
   - The inbox Wire is clamp(400px, 30%, 560px).
   - The header has no relative time, so server and client match (checked against the raw HTML).
6. **Landing.**
   - The h1 now sits above the intro. Its facts come from the same lines the Wire shows: "came in at 1:37 am PT" is the CREATED clock, and "12 minutes later" runs from approval to RESOLVED, both checked.
   - The CTA note is the verdict's.
   - The PM moved the replay from JKB to NJA after the verdict, because NJA reached RESOLVED.
7. **Real-case page.**
   - Modelled on B's page: "Real PayPal sandbox case. Every id here came from PayPal.", a credited similar-item photo and "What happened, newest first". Times are PT, and UTC inside agent text is rewritten as PT.
   - It covers three states, all from the API: pending (VPY), deciding (JKB), and resolved (NJA, RCJ).
   - The inbox lists the 4 real cases first, labelled "Real sandbox case", each with its last PayPal call and debug id (JKB: f2843364d3500).
8. **Slip.** No duplicate amount. A clean summary ("What PayPal receives: …"), plus the verdict's margin sentence and button.
9. **Policy.** "Act on my own when the money is under [$50.00]. File evidence on my own when the case is under [$250.00]…", with a rolling line: "With this policy, 4 of your 9 open cases would wait for you". The 9 are 7 sample cases plus the open real VPY and JKB.
10. **Strip and photos.** The surname shows only when the day cell is ≥ 120 px (container query), never with an ellipsis. Kodak is now a clear Portra box (CC BY 3.0, Portra 160 shown). New photos are the ring dish (Cleveland Museum, CC0) and the spoon (PD).

Checks: 404 PASS, 0 FAIL on a Mac production build of this branch; the Vercel preview was rate-limited. Shots at DPR 2 (2880×1620 and 3840×2160), phone at DPR 3. Real-case shots are `case-real-*`. The old `case-approve.mp4` showed the sample "You kept $392.00" and is removed.

## Real approval on camera (item 1)
- PP-R-UDP-10194489 ($405.00), action a5723516-3171-48a8-a051-b236a8e3dbe9. Approved once, on camera, through `/finals/a/case/PP-R-UDP-10194489` on a Mac production build that forwards to production. PayPal answered **200, debug f1926738baa71** at 02:53:30 PT. PayPal closed the case at 03:03:08 PT.
- Before the click, a dry run with a locally fulfilled approve found that the slip read the status and debug id from the wrong field (they sit on `action.result`). Fixed before the real click.
- The recorder allowed exactly one POST, to this action only, and aborted everything else. VPY is still awaiting_approval.
- `case-approve-real.mp4`: 23 s at 30 fps, 2880×1620; stills `case-approve-real-before.png` and `-after.png` are true DPR 2.
- Known flaws in the recording, not re-recordable:
  - **Not true DPR 2.** Playwright's video frames are captured at CSS size, so the video is 1440×810 upscaled 2×. `real-tour.mp4` is reprocessed the same way; it previously filled only the top-left quarter.
  - **Wrong in-flight wording.** For about 8 s the in-flight Wire line reads "PayPal refused the call ()". That came from an empty status; it now reads "Sent to PayPal; waiting for its answer".
  - **Raw tracker name.** The tracker PUT row showed the raw tracker id; it is now named "tracker".
  
  The two code fixes come after the recording: 404 PASS, 0 FAIL on a Mac production build.
