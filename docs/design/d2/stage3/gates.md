# d2 stage 3: the deadline board, gates, 2026-10-26

Built from da43423 (merged with main at 100cc31), served by `host.sh d2`; this file and the shots are the commit after it. Data: production `GET /api/cases` and each case's audit and wire, 33 PayPal sandbox disputes at the time (3 waiting for your yes, 7 open, 23 closed).

No POST, PUT or DELETE was sent: every check, shot and the clip ran GET-only (non-GET requests aborted). No test dispute was opened (1 of 2 still unused). PP-R-VPY-10194485 was not touched.

## What `/board` is

A Bryntum Scheduler (trial 7.3.7, client-only) themed to the top plate: one row per case, a bar from PayPal opening the dispute to PayPal's seller-response deadline (or the close, or now), the case's moments as the scale's rings and dots, Bryntum's current-time line as now, the inbox's bands with waiting for your yes on top. A bar, a row or Enter opens `/case/<id>`. Two spans: to the deadlines (days, fitted) and hour by hour (`?span=hours`). "Deadlines" is back in the top bar between Cases and Rules. Full notes: DESIGN.md, "Stage 3 system notes".

**Phone (390):** a Bryntum band, not a list fallback. The case column narrows to the amount over the item, the end words shorten ("9 days left", "No deadline"), the day ticks go every three days, and a name that wraps past its row gets a taller row. Hour by hour is a sideways-scrolling band centred on now. A list would duplicate `/cases`; the band keeps what only the board shows: every case against one clock.

## Gates

| Page | check.sh (1440, 1920, 1536, 2560, 390) | detect 1440 / 390 |
|---|---|---|
| `/board` (to the deadlines) | 0 FAIL, 0 WARN, 1 exempt | 0 / 0 |
| `/board?span=hours` | 0 FAIL, 0 WARN, 1 exempt | 0 / 0 |
| `/board`, both spans, 1440×3000 and 390×3400 (every row rendered) | 0 FAIL, 0 WARN, 1 exempt | |
| `/`, `/cases`, `/policy` (top bar changed) | 0 FAIL, 0 WARN | 0 / 0 |
| case VPY, VAB, SGV, YSE, YDQ, JKB, TMU (top bar changed) | 0 FAIL, 0 WARN | 0 / 0 |

`/board` was checked on dev and again on the hosted build (same result); the other pages on dev with the same code.

**The one exemption:** Bryntum's generated time-axis header carries `data-align-ok="Bryntum's generated time-axis header: its date labels sit on their ticks, placed by date, not on the page's text edges"`, set from the scheduler's paint event. Nothing else is exempt.

**Detector fixes:** Bryntum's "Now" tag was white on orange at 3.1:1 and 9.8px; it is now the Go button's ink on orange at 12px. Phone case names had 1.25 leading; now 1.3.

**Critique** (`critique-board.md`, degraded: single context): 31/40, P0 0, P1 2 (both fixed: a waiting case's first moment clipped at the timeline's start at 390; a three-line item name overflowing its phone row), P2 2 (the header's keyboard label, fixed; the phone board scrolling inside its frame, open), P3 1 (open).

**Keyboard:** Tab reaches the grid's header ("Cases. Arrow down to a case, Enter opens it."), Down to the first case, Right to its bar, Enter opened `/case/PP-R-XCS-10194591`. Clicks on a bar opened the case in both spans on the hosted build.

**Trial watermark:** Bryntum's diagonal "Trial Version" pattern sits under the content and never covers words; it stays.

G5: no middots, numbering, arrows or emoji in the board's copy. G7: no raw ids on the board (ids are in each case's record line). Counts: the head's 3 + 7 + 23 = the headline's 33, and each band's count matches its rows.

## Files

- `board-1440.png`, `board-390.png`: the board, to the deadlines, hosted build.
- `board-hours-1440.png`, `board-hours-390.png`: hour by hour.
- `board-tip-1440.png`: a waiting case's tooltip (its moments with their times).
- `board-1440.mp4`: 11.2 s, 1440×900, H.264 25 fps; the tooltip, a scroll through the bands and back, the switch to hour by hour, and a click on the Nikon FM2n bar into its case.
- `critique-board.md`.
