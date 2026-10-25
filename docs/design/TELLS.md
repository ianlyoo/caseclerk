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
