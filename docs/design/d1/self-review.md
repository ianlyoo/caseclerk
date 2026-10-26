# Stage 1 self-review — the desk

Reviewed 2026-10-26. Direction: app-first. Mode: Operate. Public landing: https://supplemental-residents-informative-surveillance.trycloudflare.com/d1

The first screen is the seller's working dispute desk. A maritime-blue navigation rail gives the product a stable edge, while a white workspace presents the reserved $412.00 case, the delivery/condition distinction and one Review case action. A compact table grounds it in real activity. Public Sans and aligned amounts carry the precision; native evidence disclosures carry the motion. There is no marketing hero.

## TELLS

| Gate | Landing 1440 | Landing 390 | Pending 1440 | Pending 390 | Evidence |
|---|---|---|---|---|---|
| G1 | PASS | PASS | PASS | PASS | Rendered detector: 0 anti-patterns, 0 advisories at rest. Source scan: 0. Open-state scan recorded separately. |
| G2 | PASS | PASS | PASS | PASS | PM checker: aligned button centers/rows; no wrapping; 0 warnings and no exemptions. |
| G3 | PASS | PASS | PASS | PASS | PM checker: no near-miss edges, overlap, clipping or sideways scroll. Closed disclosures leave layout; open content stays in its reader. |
| G4 | PASS | PASS | PASS | PASS | PM checker: declared 4,8,12,16,20,24,32,40,48,64px scale; 0 off-scale gaps. |
| G5 | PASS | PASS | PASS | PASS | Source and visual review: no uppercase eyebrows, decorative numbering, middle-dot strings, avatars, fake charts, emoji, metric tiles or card grids. Chevrons are native disclosure/back-navigation affordances. |
| G6 | PASS | PASS | PASS | PASS | One-line page title at 1440 and 390; one identity sentence before the product. |
| G7 | PASS | PASS | PASS | PASS | Case references occupy one compact table column. Full IDs, event strings and debug IDs appear only in opened proof/document details. |
| G8 | PASS | PASS | PASS | PASS | One primary action per view. Review case opens the pending page; reserved approval is clearly unavailable. |
| G9 | PASS | PASS | n/a | n/a | Desktop first-screen prose: 15 words (identity 7, sandbox clarification 8), excluding labels/data. |
| G10 | PM-owned | PM-owned | PM-owned | PM-owned | No claim made about the other designer's direction. |

G2–G4 also pass at 1920×1080, 1536×864 and 2560×1440. `alignment.txt` contains the complete run. Keyboard-opened evidence states pass at both required sizes in `verification.json`. Two long readers have an exemption while open because the checker counts off-scrollport text as painted overlap; `reader-check.json` and visual inspection verify native clipping and keyboard scrolling. Resting pages have no exemptions. Source scan and screenshots are evidence for G5–G9, not a claim that a detector proves taste.

## Three closest shipped-product references

All three were consulted on 2026-10-26, newest observation first. No customer, logo or product image from these sources ships in CaseClerk.

| Reference and date | What informed this direction | How CaseClerk differs |
|---|---|---|
| [Linear: A calmer interface for a product in motion](https://linear.app/now/behind-the-latest-design-refresh), published 2026-03-12; seen 2026-10-26 | Stable action placement and a sidebar whose hierarchy supports the working content. | White financial workspace and maritime rail; a single consequential money decision instead of issue management or notification density. |
| [Ramp: Bill Pay approvals](https://support.ramp.com/bill-pay-approvals/), seen 2026-10-26; page gives no publication date | Keep approval work findable and show the amount-based policy beside the decision. | Evidence uncertainty is central; filing answers a dispute rather than releasing a bill payment. No bulk approval in this stage. |
| [Mercury: Transactions page](https://support.mercury.com/hc/en-us/articles/38790547830036-Viewing-cashflow-and-transactions-data-on-your-Transactions-page), seen 2026-10-26; page gives no publication date | A readable transaction table with clearly scoped data and aligned financial amounts. | No cash-flow graphs or invented aggregate performance. A pending dispute leads; recent cases remain a plainly counted subset. |

## Truth and limits

Production GET endpoints supply item names, amounts, case states, due dates, draft, order and PayPal record. The reference pending case is PP-R-VPY-10194485. Other sandbox cases may change while the preview runs, so counts are derived from the current response. “Closed by PayPal” does not claim the seller kept money.

Stage 1 intentionally excludes the full inbox, resolved detail experience, live approval, test-dispute creation and policy editing. The reserved approval has no handler; verification sent zero non-GET requests. The case draft remains unedited source material, with an explicit caution about unverified condition claims.

The skill's review and documentation steps ran inline because COMMON.md forbids subagents. Its default critique/sidecar locations were moved into this owned documentation directory. No new package was installed. The Next development proxy does not forward HMR WebSockets; all final checks and captures use the hosted production build, which works without HMR.

## Captures and provenance

All five PNGs under `stage1/` are browser captures of the public URL, with all non-GET requests blocked. The four named viewport images are 1440×900 or 390×844; `landing-1440-full.png` is the full page from the top. Every final image was opened and inspected. No image generation, stock photography or screenshot editing was used. Public Sans is self-hosted from Google Fonts' official OFL repository; its license is in `public/d1/fonts/OFL.txt`.
