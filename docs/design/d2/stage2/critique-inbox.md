⚠️ DEGRADED: single-context (company rule: no subagents). Assessment A was written before Assessment B was read.

# Critique: /cases, the inbox (Operate), 2026-10-26

Target: the inbox on real production data (31 PayPal sandbox disputes at the time of the review: 2 waiting, 14 open, 15 closed), 1440×900 and 390×844, from the hosted build. GET only.
Persisted here because `.impeccable/critique/` is outside d2's owned paths.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 4 | Counts in the head match the three bands; every row says where it stands and when PayPal needs it. |
| 2 | Match System / Real World | 3 | Plain states ("Received. Not worked yet", "Filed. PayPal is reviewing"); PayPal's ids are small and secondary. |
| 3 | User Control and Freedom | 3 | Every row opens its case; the test-dispute wait can be stopped. |
| 4 | Consistency and Standards | 4 | Same metal/leather plates, Go/Quiet buttons and money type as the landing and case pages. |
| 5 | Error Prevention | 3 | Only one orange button on the page (the case a visitor may answer); the reserved case says why it is held. |
| 6 | Recognition Rather Than Recall | 3 | Item first, then claim and id; amounts lead each row. |
| 7 | Flexibility and Efficiency | 2 | No filter or search; fine at 31 rows, not at 300. |
| 8 | Aesthetic and Minimalist Design | 3 | Three bands, one table style; the waiting rows carry a thin deadline rail. |
| 9 | Error Recovery | 3 | Data outage has its own page; test-dispute errors and the daily cap are shown inline with when it opens again. |
| 10 | Help and Documentation | 2 | The shared-listing note explains the 12 Olympus cases; no help on the states themselves. |
| **Total** | | **30/40** | **Good (75%)** |

## Design Specificity Verdict

**LLM assessment:** authored. The inbox is the same top plate read as a ledger: the leather band holds only what waits for a yes, the open table runs soonest deadline first, the closed table states PayPal's ruling and what was kept. The 12 Olympus cases are named for what they are (separate sandbox test disputes on one listing), and the counts sentence adds up to the headline.

**Deterministic scan (Assessment B):** `impeccable detect` at 1440×900 and 390×844: 0. check.sh: 0 FAIL, 0 WARN at all five sizes, after three fixes A had missed: a 40px rail-to-deadline gap (off the spacing scale), the visually hidden mobile table head overlapping text, and a 70px state-to-deadline gap from the mobile grid order.

**Visual overlays:** not injected (headless run).

## Priority Issues

- **[P2] Mobile rows lost their column heads** (fixed). Rows now stack amount beside item, state, deadline; the closed date reads "Closed Oct 25" inline. Command: /impeccable adapt.
- **[P2] Case ids broke at hyphens on phones** (fixed, ids no longer wrap inside). Command: /impeccable typeset.
- **[P3] The waiting-row rail has no labels.** Open: it is decorative next to "Due Nov 4, 8:59 pm PT, 10 days left" and hidden from assistive tech. Command: /impeccable clarify.
- **[P3] No filter or search.** Open: 31 rows; the bands do the sorting. Command: /impeccable layout.

P0: 0. P1: 0.

## Persona Red Flags

**Alex (power user):** no keyboard path from row to row beyond Tab; acceptable at this size.
**Jordan (first-timer):** "Read. Nothing to answer yet" and "Received. Not worked yet" need the case page to mean much; the case page explains.
**Sam (keyboard, screen reader):** the tables keep real `th` heads on wide screens; on phones the heads are removed visually and the closed date carries its own label.

## Questions to Consider

- Should a case that just changed state (a webhook since the last visit) carry a mark in the inbox?

Questions skipped: autonomous run; company rule forbids user-input tools.
