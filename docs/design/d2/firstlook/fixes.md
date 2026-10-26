# D2 first look: critic round 1 fixes

Shots and video come from the hosted production build of commit `2edad3c`. Every capture is GET-only: the recorder aborts all non-GET requests, logged none, and "File the evidence" is hovered but never clicked.

| Critic row | Outcome | Check |
|---|---|---|
| P0 hero: two left edges, waiting case mixed into the copy | Changed approach. Both headline lines share one left edge (64 px at 1440, 20 px at 390). The waiting $412.00 case is a separate leather plate labelled "Another case, waiting for you", with its own CTA, bottom-aligned to the copy. | Left edges [64, 64] and [20, 20]; plate bottom = copy bottom (403 px) |
| P0 landing scale: leaders miss dots, colliding right-end stops | Fixed. Leaders run down to their dots. Only the last stop hangs right. "Hold released" is folded into the close's proof as PayPal's capture id. | 4 leaders at gap 0, dx 0; the close leader tucks 2 px under its dot; min dot gap 94 px (25 px at 390) |
| P0 case scale: detached "Deadline" box, overlapping quiet dot | Fixed. The deadline is engraved at the axis end as "Due Nov 4" with an end tick. The waiting case drops the "read" dot: reading happens inside "Asked you". | 3 dots; leaders at gap 0; min dot gap 73 px at 390 |
| P1 ledger circles collide | Fixed. Amounts within 3 % of the axis merge into one round-capped bead ($397.00–$412.00), so there are no circles. | 0 circles, 1 bead; label clearance 19 px |
| P1 mobile case page | Fixed. The back link stays visible (the sandbox label is hidden; sandbox is stated in the subtitle). The decision buttons share one row. The card is compact, and the amount figure is hidden on mobile because the subtitle states it. | Buttons share top 342 px; card bottom 642 px; readout bottom 805 px, under 844 |
| P1 proof hidden behind a click | Fixed. The latest stop's PayPal proof shows by default. The "Select a stop" hint appears on the case page only. | Landing: webhook and capture ids; case: webhook id |
| P2 NumberFlow ghost "-" | Fixed. The figure clips rolling digits to its line box. | 390 readout frames are clean |
| Case scale on metal, not leather (point 4) | Left. A second dark mass would compete with the decision panel. | n/a |

Gates on 2edad3c: check.sh 0 FAIL / 0 WARN on both pages at all 5 sizes; detect `[]` at 1440×900 and 390×844.

Video: `first-look.mp4` is 28.5 s at 1440×900, H.264 High, yuv420p, 25 fps, no audio, 5.6 MB.
