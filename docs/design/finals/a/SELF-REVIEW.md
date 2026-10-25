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
- **Take 2, shipped.** PP-R-TZD-10194493 ($402.00), action c3ca42c2-a0dd-49dc-9992-044b3f5c00ee.
  - Approved once, on camera, through `/finals/a/case/PP-R-TZD-10194493` on a Mac production build that forwards to production.
  - PayPal answered **200, debug f182178f16410**. The filing went out at 03:25:02 PT.
  - The wait from POST to answer was 10.8 s, under 12 s, so it plays at real speed with no speed-up.
- `case-approve-real.mp4`: 24.5 s at 30 fps, recorded at 1440×810 and upscaled 2× to 2880×1620, because Playwright video doesn't follow DPR. The before and after stills are true DPR 2.
- While sending, the slip and the Wire both read "Sending to PayPal… N s", counting real seconds.
- Refusal wording:
  - 409: "Already answered, so nothing new went to PayPal."
  - PayPal failure: "PayPal didn't accept the filing." plus its debug id.
  - Unreachable: "CaseClerk couldn't reach PayPal, so nothing was filed."
  - Dropped connection: says the page will show whether the filing went.
  - Messages are never interpolated empty.
- The dry run on the same case ran both paths locally: an approve aborted after 8 s, then one fulfilled locally. Nothing left the browser.
- **Take 1, superseded.** PP-R-UDP-10194489 ($405.00), PayPal 200, debug f1926738baa71. Its video showed "PayPal refused the call ()" during the in-flight stretch, so it was replaced.
- The recorder allows exactly one POST, to the named action only, and refuses VPY outright. VPY is still awaiting_approval.
- The inbox's real rows are now dynamic: every test case from production's `/api/cases?test=true`, newest first. G12 checks the inbox ids against that same list.
- Checks: 404 PASS, 0 FAIL on a Mac production build.

## Judge round 2: Final A's 8 must-fix items

Every capture comes from a production build on the Mac (`next build --webpack && next start`). Stills are true DPR 2. The videos were recorded at 1440×810 CSS and upscaled to 2880×1620 at 30 fps. Checks: `check-results.txt`, 408 PASS, 0 FAIL.

1. **Post-approval state sync.** The page keeps one case record. On a 200, the approve answer is merged into it at once, and the same record drives the h1, the receipt, the story, the Wire and the nav count (a shared store). "Sending" lasts only while that record's action is still unfiled, so the paper and the Wire switch on the same render. A sync monitor in the recorder sampled the page every 100 ms. Dry run: no faults. Real take: one sample at the answer, then clean, explained in the risks below. The nav count went 5 → 4 and was still 4 after a reload. The h1 swaps in 150 ms (75 ms out, 75 ms in). The receipt reads "Filed at 04:24:52 PT; PayPal answered at 04:24:54 PT." in Newsreader tabular figures, 48 px below the amount. Evidence: `case-approve-real.mp4`, `case-approve-real-after.png`.
2. **VPY at 390.** A sticky bottom slip shows the amount (in the button), "Over your $250.00 evidence line, so it waits for you." and the full-width button, with safe-area padding. The mark fits on one line. The photo and its credit are both hidden on mobile. Evidence: `case-real-pending-390.png`.
3. **Wire and paper hierarchy.** The Wire is topped by a pinned receipt: "Filed with PayPal / POST provide-evidence 200 / debug …" or "Closed by PayPal / CUSTOMER.DISPUTE.RESOLVED / WH-…". Consecutive routine GETs and signature checks fold into one row ("5 calls … Show them"), and the inbox Wire folds them too. The paper story keeps only the seller-facing beats: arrival, recommendation, evidence ready, approval, filing, ruling. Evidence: `case-real-resolved-1440.png`, `inbox-1440.png`.
4. **Evidence review.** "Review the evidence" in the slip opens the 640 px reader, filled from the action payload: the letter, then exhibits A, B and C. Two plain recommendation lines sit above the slip, with no expected-value math. Evidence: `case-real-pending-1440.png`.
5. **Seller money.** The resolved headline comes from PayPal's capture and fund_movements (REAL-CASES.md, "fund movements"): "You keep $378.43: the $389.00 sale less PayPal's usual fee. PayPal paid the buyer itself." It is only shown for the four cases with that data. Evidence: `case-real-resolved-1440.png`, `landing-1440.png`.
6. **Landing.** The paragraph is cut to about 3 lines, and the expected-value costs are gone. Above the fold, the primary ink button "Review the $412.00 case waiting for you" goes to VPY, with "Open this $389.00 resolved case" (NJA) beside it. "Open a test dispute" is real (PM ruling). It is an outlined secondary button that posts through `/finals/a/live/test-dispute` to production's `POST /api/test-dispute`. It then shows "PayPal is opening the chargeback. Its webhook usually arrives in 3–5 minutes." with a clock, polls the case list every 10 s, links the new case when it appears, and shows the API's 429 message. The checks mock both the 202 and the 429 and never call production. Evidence: `landing-1440.png`.
7. **Videos and stills.** The ceremony was re-recorded on A3 (PP-R-AAJ-10194495, $396.00) with one real click: 200, debug f4501995cc305. It ends on a captioned card, "12 minutes later: PayPal closed it", labelled "Shown on a different real case, PP-R-NJA-10194486 ($389.00)", followed by NJA resolved with a caption naming it as a different case. Everything runs at real speed: PayPal answered in 6.6 s. `real-tour.mp4` now scrolls with a smooth `scrollTo`, so there is no tear. `case-resolved-*` is recaptured with `?state=resolved` and no controls. Evidence: `case-approve-real.mp4`, `case-approve-real-jump.png`, `real-tour.mp4`, `case-resolved-1440.png`.
8. **Repetition.** The pending h1 has no amount: "A buyer's card issuer charged back an Olympus OM-1n body. …". The Wire subheader reads "PayPal traffic for <id>", and the mark reads "Real PayPal sandbox case".

Also fixed: on real cases the sticky header margin rode over the slip's margin photo when the page scrolled, so it is now static there. The filing time no longer falls back to the action's creation time.

Known risk: in the real take, about 0.2 s at the answer (around 13.4 s into the trimmed video) still shows the old in-flight Wire line while the new rows slide in. Wire lines used a position layout animation, which has since been removed (the hosted build has it). The take used the one allowed click, so it was not re-recorded.

## Judge round 3: Final A's 6 items

Every capture comes from one production build on the Mac (`next build --webpack && next start`). No new click: AAJ was approved once in round 2. Checks: `check-results.txt`, 417 PASS, 0 FAIL.

1. **Video.** `case-approve-real.mp4` is re-cut from the round-2 raw AAJ take. It runs 24.8 s at 2880×1620 and 30 fps, at 1× speed throughout (PayPal answered in 6.6 s). The cut has three parts:
   - Raw take 2.0–14.6 s: pending, approve, sending.
   - A 0.4 s hold on the 14.6 s frame replaces the old build's 14.6–15.0 s transition, which held the overprint and the 04:24:54 → 04:24:52 flip. This is a still frame, not new footage. Then raw 15.0–18.8 s, filed and settled.
   - A card, "7 min 48 s later: PayPal closed it. Same case, PP-R-AAJ-10194495. Approved 04:24:48 PT; PayPal's RESOLVED webhook arrived 04:32:37 PT.", then AAJ's own resolved page, recorded fresh as a read-only view (every action and test-dispute request is aborted), with the sandbox disclosure as a caption. There is no static tail.

   In code, the Wire lines have no layout animation, the h1 is keyed with no exit overlap, and the "Filed" time is locked to the filing time. Evidence: `case-approve-real.mp4`, `case-approve-real-resolved.png`.
2. **Sandbox-ruling disclosure.** "Sandbox only: we asked PayPal's sandbox to rule. On a live account PayPal decides on its own." It appears on the landing below the intro, under the receipt on every resolved real case, and at the end of the video. Evidence: `landing-1440.png`, `case-real-resolved-1440.png`, `case-real-aaj-1440.png`.
3. **Money copy.** A verified map keyed by dispute id covers NJA, UDP, LTK, TZD, AAJ, IMW and RCJ. Any other case reads "PayPal closed the chargeback with no debit to your account." The inbox rows, the Wire RESOLVED subtitles and the paper story read "PayPal closed it; you keep $X". RESOLVED_WITH_PAYOUT appears only as raw Wire data. Evidence: `inbox-1440.png`, `landing-1440.png`.
4. **Resolved pages.** The h1 reads "PayPal closed the Olympus OM-1n body chargeback. You keep $378.43." The figure reads "You keep $378.43", with "$389.00 sale less PayPal's $10.57 fee · Closed Oct 25, 01:52:42 PT" beside it. Evidence: `case-real-resolved-1440.png`, `case-real-aaj-1440.png`.
5. **Pending Wire and paper.** The pending Wire pins "PayPal asked for evidence · CUSTOMER.DISPUTE.UPDATED · WH-…". Paper story rows no longer carry the POST path or the debug id. Those stay in the Wire and the top receipt. Evidence: `case-real-pending-1440.png`, `case-real-full-1440.png`.
6. **Cleanup.**
   - `case-approved-*` is recaptured without `?controls=1`.
   - At 390, the duplicate "Waiting for you" margin label is gone and "What PayPal receives" is no longer clamped.
   - The landing's orphaned "Order details" card is removed.
   - `case-approve-real-jump.png` (the NJA borrow) and the stale `case-real-rcj-1440.png` are removed.

   Evidence: `case-approved-1440.png`, `case-real-pending-390.png`, `landing-1440.png`.

Known limit: the first 18.8 s of the video show the round-2 build, so its paper rows still show the POST path that item 5 removes from the current build. The only way to change that was a new click, which the PM ruled out.
