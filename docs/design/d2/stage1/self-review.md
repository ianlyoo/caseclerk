# d2 stage 1 self-review (2026-10-26)

Pages: `/d2` (landing, Persuade) and `/d2/case/PP-R-VPY-10194485` (pending, Operate), production build of 607189a served by `host.sh d2`, real production data.

## TELLS gates

| # | Tell | Check run | Landing | Case pending |
|---|---|---|---|---|
| G1 | impeccable anti-patterns | `impeccable detect --viewport` 1440×900 and 390×844 on the hosted URL | 0 anti-patterns, 0 advisories at both sizes (`[]`, exit 0) | 0, 0 at both sizes |
| G2 | Buttons placed badly | check.sh, 5 sizes | 0 FAIL, 0 WARN (2 buttons) | 0 FAIL, 0 WARN (2 buttons: File and Don't file share one row; one column at 390) |
| G3 | Text in the wrong place | check.sh, 5 sizes | 0 FAIL (32 text blocks; 30 at 390); no horizontal scroll at 390 | 0 FAIL (26; 25 at 390); no horizontal scroll |
| G4 | Spacing by eye | check.sh against `--space-*` (4…128) | 0 FAIL | 0 FAIL |
| G5 | Eyebrows, numbering, middle dots, arrows, avatars, fake meters, emoji, tile grids | grep of `src/app/d2/**` (no `·`, `→`, `text-transform`, `letter-spacing` > 0, `01 /`, emoji) plus a look at the 1440 shots | none; the orange triangle is the scale's index (a direction in the data) and the wordmark's mark | none |
| G6 | Hero as a paragraph | h1 lines; prose before product content | h1 is figures, 2 lines at 1440, 3 at 390; one sentence (lede) before the scale | title 1 line at 1440, 2 at 390 |
| G7 | Raw API strings as decoration | default view vs. record layer | no ids or event names in the default view | ids, PayPal paths and event names only inside "PayPal's record for this case, 12 entries" (closed by default) |
| G8 | Mixed CTA styles | primary count per view | one Go button per view (hero; repeated once in the waiting band, same style and label) | one Go (File the evidence) plus its Quiet partner in the same row |
| G9 | Text-heavy | prose words above the fold at 1440 | 38 (lede 13, fine print 13, CTA note 7, caption prose 5; labels and data excluded) | n/a (landing only) |
| G10 | Two directions alike | PM's side-by-side | the PM's check | |

Sizes for G2 to G4: 1440×900, 1920×1080, 1536×864, 2560×1440, 390×844. All 0 FAIL, 0 WARN, 0 exempt (no `data-align-ok` used).

## Three closest references (real shipped products, newest first)

| Reference | Seen | What I took | How mine differs |
|---|---|---|---|
| Leica M11, glossy black paint finish, product page, [leica-camera.com/en-GB/…/m11-glossy-black-paint-finish/shop-now](https://leica-camera.com/en-GB/photography/cameras/m/m11-glossy-black-paint-finish/shop-now) (page assets dated 2026-09; no page date shown) | 2026-10-26 | The top plate as a world: engraved markings, a knurled shutter-speed dial on a machined surface, black and metal as the only materials. | No product photography and no luxury copy. The dial is a working log-time scale fed by one dispute's real webhook, audit and money rows; the plate is satin metal and pebble leather drawn in CSS; one orange control instead of Leica's red dot (which this finish omits). |
| Ingrid, "Cleaner tracking experience focused on delivery dates", [ingrid.com/product-updates/…](https://www.ingrid.com/product-updates/cleaner-tracking-experience-focused-on-delivery-dates) (published 2026-02-20) | 2026-10-26 | Lead with the one figure the reader looks for first, then the progress below it with less clutter. | My first figure is money (disputed, kept), not a date, and the progress is a time-to-scale dial with the real elapsed time (12 min 31 s), not even steps. A case page adds a decision panel with one action; tracking pages have none. |
| Stripe Docs, "How disputes work", lifecycle diagram, [docs.stripe.com/disputes/how-disputes-work](https://docs.stripe.com/disputes/how-disputes-work) (no last-updated date shown; cites Stripe's June 2025 dispute-fee update) | 2026-10-26 | A dispute as a sequence of named stops (notified, evidence, decision), and stating what the fee and no response cost. | Stripe's diagram is generic and evenly spaced, in docs. Mine is one real PayPal case, spaced by real time on a log scale, with the no-answer cost (the amount and the fee) next to the result, in the product's first screen. |

Anti-references checked: round-1 shots (cream paper, serif head, black-square mark, mono event log). d2 has none of these: metal and leather, Archivo grotesque, an orange triangle mark, and the PayPal record behind a toggle.
