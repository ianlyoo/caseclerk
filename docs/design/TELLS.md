# Slop tells and the check that decides each (drafts A and B, round 1 for CaseClerk)

Source: `s3/SLOP-qloo-round1.md` (14 tells) plus the brief's list. Source checks run with `bash docs/design/check-tells.sh` (greps over `src/app/drafts/**`). Screenshot checks are counts on `docs/design/shots/*-1920.png`.

| # | Tell | Check | Result |
|---|---|---|---|
| 1 | Tracked-uppercase eyebrow labels | grep `text-transform: uppercase` and `letter-spacing` ≥ .05em: 0 | PASS (0, 0) |
| 2 | Generic hero copy, filler sentences | grep marketing words (seamless, powerful, unlock, "let the agent"…): 0. Read the first screen: each h1 states a fact about the data ("Daniel Okafor says the Olympus OM-1n he bought is not as described."; "Seven open disputes, $4,348.45 at stake, two waiting for your answer."). A has no h1 sentence at all, only names and numbers | PASS (0) |
| 3 | Boxed dashed drop zones | grep `dashed`: 0 | PASS |
| 4 | Middle-dot meta strings | grep `·`, `&middot;`, `·`: 0. Facts sit in their own columns (A) or rows (B) | PASS |
| 5 | Arrows on links | grep `→ › » &rarr;`: 0 | PASS |
| 6 | Letter-avatar squares | grep `avatar`, `initials`, `charAt(0)`: 0. A person is their name and city | PASS |
| 7 | Fake charts | grep `<svg <canvas sparkline <progress <meter`: 0. The only graphics are the deadline lane (A) and the 14-day calendar (B), both positioned from each case's `dueAt` via `dayOffset()` | PASS |
| 8 | Tool-call feed and counter as the face | A's first screen leads with the dispute header and the approval; the timeline is the middle column under the header. B's first screen is the claim and the recommendation; the timeline comes after. No call counter anywhere (the brief asks for the timeline, so it's there, but it isn't the hero) | PASS (review) |
| 9 | Underlined or boxed tabs | grep `text-decoration: underline`, `border-bottom: 2px/3px`: 0. The active nav word only gets darker (A also 500 weight) | PASS |
| 10 | Needless boxes, card/tile grids | Count rectangles with a fill or 4-sided border on each 1920 shot (pages and buttons count). A case: 6 (Approve button, 4 evidence-page previews, the contact sheet printed on page 4). A inbox: 1 (Open test dispute). B case: 1 (Approve). B inbox: 0. The only `border: 1px` rules are the two outline buttons; evidence pages are outlined because they are printed paper | PASS (6 / 1 / 1 / 0) |
| 11 | Bold SaaS grotesk at heavy weights | grep `font-weight` 600–900 or `bold` outside the PDF-page stylesheet: 0. A: Hanken Grotesk 300/400/500. B: Newsreader 300/400 | PASS (0) |
| 12 | Same template recoloured | A: three panes (`17.5em | 1fr | 31em`) with a dense table inbox; B: one centred column with a left margin for time and who and a right margin for money, inbox as a ledger grouped by who has the ball. Check greps each grid definition in its own stylesheet: 2/2. Shared: data, the PDF pages (the artifact itself), nothing else | PASS |
| 13 | Teal/cyan on dark | All hex colours in the drafts through an HLS filter (hue 150–200°, saturation > .25): 0. A: ink blue for actions, vermilion for deadlines under 72 h. B: green ink for the decision, red pencil for deadlines | PASS (0) |
| 14 | Generic row copy | grep placeholders (lorem, John Doe, Acme, example.com): 0. Every dispute id matches `PP-R-[A-Z]{3}-[0-9]{8}`; every amount has cents; every reason is in PayPal's enum; every tracking number passes its carrier's check digit (UPS 1Z mod 10, UPU S10 mod 11, USPS IMpb mod 10, FedEx 12-digit mod 11) | PASS (0, 0, 0, 0, 0) |
| + | Emoji icons | grep emoji ranges: 0 | PASS |
| + | Numbered eyebrows ("01 Statement") | grep `>0[1-9] `: 0 | PASS |
| + | Rounded-panel look | grep `border-radius` > 6px other than pill buttons: 0. Radius appears only on buttons and the deadline-bar ends | PASS |

Last run: 2026-10-25, every line PASS (see the report for the output).

Known judgement calls the PM may want to re-check:
- A's "Sandbox" word in the top bar is amber text, not a badge.
- B's buttons are pills (999px). They are the only filled shapes on B; a square button would also pass.
- The contact sheet on PDF page 4 is a grid of small rectangles. It is a picture of film frames printed in the PDF, not a UI tile grid.

## Round 2 (critic fixes, 2026-10-25)

Run: `bash docs/design/check-tells.sh <deploy-url>`. The static greps above run first, then `docs/design/check-ui.cjs` runs in headless Chromium on the Mac over ssh (fresh context, temp dir removed on exit).

| Critic finding | Check | Result |
|---|---|---|
| `/board` reachable from Deadlines (A1, B1, tell 1) | grep `/board` in drafts = 0; browser: every link on inbox, case and deadlines resolves 200 and none goes to `/board`; nav links stay inside their draft | PASS |
| Page doesn't change after Approve (A2, B3) | browser: click Approve, wait out the 4 s undo; nav count 2 to 1; no "Needs your approval" / "until you decide" on Daniel's case; timeline has "You approved the $180.00 offer" and "Sent to PayPal" with the make-offer endpoint and debug id | PASS |
| A way back to Approve after sending (A7, B9) | grep "Back to the proposal / Show the proposal again" = 0; browser: no Approve button after sending, nor after a reload | PASS |
| Every row opens the hero; no resolved state (A3, B4) | browser: every case link in the inbox opens a page with its own h1 and dispute id (11 of 11); the set covers approval, agent working and closed; sandbox "buyer accepts" gives CUSTOMER.DISPUTE.RESOLVED and "you kept $232.00" | PASS |
| B Approve below the fold (B2) | browser: Approve bottom ≤ innerHeight − 24 at 1920×940 and 1536×752 @1.25, both drafts | PASS (B 468/940, 439/752; A 228/940, 212/752) |
| Live PayPal loop not on the first screen (A5, B6) | browser: the "Live on PayPal sandbox" line with a webhook event and a debug id sits in the first viewport, ids ≥ 13 px, at both fold sizes | PASS |
| A base text 13.2 px (A6) | browser: root font at 1920 ≥ 15 px | PASS (15.06 px) |
| Calendar hides 2 days (B5) | browser: 14 day cells inside the list box, no cell with scrollWidth > clientWidth, no scrolling ancestor, at 1920×940, 1536×752 @1.25 and 2560×1440 | PASS |
| Grey below 4.5:1 (A10, B11) | browser: every visible text element against its first opaque background ≥ 4.5:1, on the first screen at both fold sizes and on 8 whole pages. Excluded: text inside the PDF page previews (`figure`), which are pictures of printed pages | PASS |
| Phone nav clipped, Approve late (A12, B12) | browser at 390×844: header nav scrollWidth = clientWidth, no sideways page scroll, Approve bottom ≤ 844; grep `<wbr>` in B's reason code | PASS (A 524, B 653) |
| Approve without amount (B8) | browser: button text contains "$180.00" | PASS |
| RESOLVED_WITH_PAYOUT label (A8) | grep `RESOLVED_WITH_PAYOUT: "PayPal covered it"` = 1 | PASS |
| Progress-meter lanes, stats trio (tells 2, 3) | grep `barHot`, `bar2`, `s.totals` = 0 | PASS |
| Per-step cost column (tell 4) | grep `cost(st.costUsd)`, `tlCost` = 0; one total per case with the split in a tooltip | PASS |

Last run: 87 PASS, 0 FAIL. Not covered by a check: the fairness of the expected-value maths (read by hand; see `_cases.ts`, Daniel's decision and `valueNote`) and the tracker attribution (A9: PayPal tracker row and UPS Track API row are now separate steps).
