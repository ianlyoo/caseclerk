⚠️ DEGRADED: single-context (company rule: no subagents). Assessment A was written from the shots and a keyboard probe; the gate's own detect run (3 findings, below) had already been read, so A is not blind to it.

# Critique: /board, the deadline board (Operate), 2026-10-26

Target: `src/app/board/**` on dev (Mac, port 5122), on production data at the time of the review: 33 PayPal sandbox disputes (3 waiting for your yes, 7 open, 23 closed). 1440×900, 1440×3000, 390×844, 390×3200, both spans, one tooltip, the keyboard path. GET only.
Persisted here because `.impeccable/critique/` is outside d2's owned paths.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 4 | The orange now line runs through every band; each bar's end says what it is (PayPal's deadline and days left, the close and how long it took, or no deadline). The head's counts add up to the headline. |
| 2 | Match System / Real World | 3 | Days left, PT clock times, "Closed for you" or "for the buyer". A strip (moments in order, not to scale) is a board convention a seller has to learn from the tooltip. |
| 3 | User Control and Freedom | 3 | Two spans, kept in the address; bands collapse; a bar, a row or its name opens the case (a modifier click on the name opens a tab). No filter. |
| 4 | Consistency and Standards | 4 | The case page's scale vocabulary on every row: PayPal's moments are rings, CaseClerk's filled, an ask is orange, a kept close green, a lost one red; the inbox's bands in the inbox's order; the same top plate and metal. |
| 5 | Error Prevention | 3 | Read-only by design (drag, resize, edit and menus off); the reserved case says it is kept waiting for a demo recording. |
| 6 | Recognition Rather Than Recall | 3 | The key sits above the board; the tooltip lists each moment with its time. Strip order has to be remembered from the case page. |
| 7 | Flexibility and Efficiency | 3 | Arrow keys move through cases, Right reaches the bar, Enter opens it; `?span=hours` deep-links. No search; wheel zoom is off on purpose. |
| 8 | Aesthetic and Minimalist Design | 3 | One orange; tracks are hairlines; labels sit on metal plates. The Bryntum trial watermark adds a diagonal pattern we can't remove. |
| 9 | Error Recovery | 3 | A data outage gets the site's own page (top bar, plain words). There is nothing to undo on a read-only board. |
| 10 | Help and Documentation | 2 | The key and "Times in PT. Select a case to open it." No words on what a strip means beyond the tooltip. |
| **Total** | | **31/40** | **Good (78%)** |

## Design Specificity Verdict

**LLM assessment:** authored. This is not Bryntum's demo with a palette swap: rows are cases, not resources; a bar is a dispute's life from PayPal opening it to PayPal's seller-response deadline, drawn like the case page's scale (lit up to now, dashed after, an engraved end tick at the deadline); the moments on it are the same stops the case page tells, with the same ring and fill code. The bands are the inbox's, waiting for your yes first. The header plate is the top plate's metal, the type is Archivo engraved, and orange is reserved for the seller's turn and now. Two spans answer two questions a seller has: what is due when (to the deadlines) and what happened today (hour by hour).

**Deterministic scan (Assessment B):** `impeccable detect` at 1440×900 and 390×844 on `/board` and `/board?span=hours` first found 3 issues, all fixed: Bryntum's "Now" tag was white on orange at 3.1:1 and 9.8px (now the Go button's ink on orange, 12px), and the phone's case names had 1.25 leading (now 1.3). After the fixes: 0 at both sizes, both spans. check.sh: 0 FAIL, 0 WARN at 1440, 1920, 1536, 2560 and 390 in both spans, and at 1440×3000 and 390×3400 with every row rendered; 1 exempt (Bryntum's generated time-axis header, whose date labels sit on their ticks by date).

**Visual overlays:** not injected (headless run).

## Overall Impression

The board reads at a glance: three orange bars on top with 9 and 10 days left, the open cases under them, and 23 closed cases stamped with how long each took. The biggest opportunity: in the deadlines span every case's history is a short strip at the left (all 33 cases are under three days old; the deadlines are 8 to 10 days out), so the hour-by-hour span is where the moments get their real spacing.

## What's Working

- **The end of a bar says what it is.** "Due Nov 4, 8:59 pm PT, 9 days left" beside an engraved end tick, "Closed for you, 18 min after it opened", "The buyer has the next word". No legend needed for the most important fact on each row.
- **One orange.** Now, the three waiting bars and the "Asked you" moments. Everything else is ink on metal, so the eye goes where the seller has to act.
- **The case page's language, unchanged.** A seller who has read one case can read every row here.

## Priority Issues

- **[P1] A waiting case's first moment was cut off at 390** (fixed). The fitted deadlines span left about 31px before now, and a three-moment strip needs 45, so PayPal's ring was clipped at the timeline's edge. **Fix:** the span's start is solved so the longest live strip fits before now, whatever the width. Command: /impeccable adapt.
- **[P1] A three-line item name overflowed its phone row** (fixed). "Hand-thrown stoneware mug set (2 × 12 oz, speckled oat)" clipped its amount and its last line in a 76px row. **Fix:** each case's name is measured and its row gets Bryntum's per-record `rowHeight` when it wraps past the row's lines (also on desktop, where it now has room for two lines and its state). Command: /impeccable adapt.
- **[P2] Tab stops at the grid header** (fixed in words). Tab goes top bar, span, then Bryntum's "Case" header, whose own label offered a column menu the board turns off. Arrow keys were already the path (verified: Down to the first case, Right to its bar, Enter opens `/case/PP-R-XCS-10194591`). **Fix:** the header's label now says "Cases. Arrow down to a case, Enter opens it." Command: /impeccable harden.
- **[P2] On a phone the board scrolls inside a frame** (open). The page is one screen tall and the board scrolls under a head of about 380px, so about five cases show at once. A list fallback would lose the board; the band keeps it. Command: /impeccable adapt.
- **[P3] In the deadlines span, history is compressed into strips** (open, by design). The tooltip lists every moment's time and the hour-by-hour span spaces them. Command: /impeccable clarify.

P0: 0. P1: 2, both fixed.

## Persona Red Flags

**Alex (power user):** can't filter to one claim type or search an item; with 33 cases the bands do the sorting. Arrow keys and Enter work.
**Sam (keyboard, screen reader):** each bar is announced as "$449.00 Nikon FM2n body, black. Waiting for your yes. Due Nov 5, 8:59 pm PT, 10 days left. Opens the case." The dots are decoration inside it; the moments are in the tooltip and on the case page.
**Casey (phone):** the head and the span switch take the top 45% of the screen; after that the board is a band with the amount over the item and the short end words ("9 days left", "No deadline"). Hour by hour scrolls sideways, centred on now.

## Minor Observations

- Waiting rows repeat "Waiting for your yes" under their band's "3 waiting for your yes"; kept, because the reserved case's line is different and the row reads alone in a screen reader.
- The trial watermark is Bryntum's; it sits under the content and never covers words.

## Questions to Consider

- Should the closed band start collapsed once there are more than a screenful, so the board is only what's live?
- Would a seller want the deadlines span to start at today, with history only on hover?

Questions skipped: worker run with no user-input tool; the PM reads this file.
