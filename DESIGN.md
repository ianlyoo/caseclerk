---
name: CaseClerk, the case told (d2)
description: A camera top plate. Satin metal and pebbled leather, engraved type, and one log-time scale that tells a dispute from arrival to the money kept.
colors:
  metal-1: "#e9ebed"
  metal-2: "#dde0e3"
  metal-3: "#cfd3d7"
  seam: "#a9afb5"
  ink: "#101214"
  ink-2: "#3f444a"
  ink-3: "#4b5157"
  leather: "#151514"
  leather-2: "#1e1e1c"
  engrave: "#f2f1ec"
  engrave-2: "#b6b5af"
  engrave-3: "#8a8983"
  go: "#f26a1b"
  go-hover: "#ff7d2e"
  go-ink: "#170a02"
  kept: "#46b871"
  kept-ink: "#17683a"
  lost: "#e8604f"
typography:
  hero:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(44px, 6.2vw, 96px)"
    fontWeight: 720
    lineHeight: 1.07
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 112"
  case-title:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(36px, 3.9vw, 60px)"
    fontWeight: 700
    lineHeight: 1.07
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 112"
  section:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(28px, 2.5vw, 36px)"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 112"
  block:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 110"
  figure:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "40px"
    fontWeight: 650
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 118"
  lede:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'tnum' 1"
  label:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.3
    fontVariation: "'wdth' 110"
  proof:
    fontFamily: "ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  hairline: "2px"
  control: "6px"
  panel: "10px"
  dot: "50%"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-5: "24px"
  space-6: "32px"
  space-7: "48px"
  space-8: "64px"
  space-9: "96px"
  space-10: "128px"
  gutter: "24px"
  margin: "clamp(20px, 4.45vw, 96px)"
  max-width: "1600px"
components:
  button-go:
    backgroundColor: "{colors.go}"
    textColor: "{colors.go-ink}"
    rounded: "{rounded.control}"
    padding: "0 24px"
    height: "52px"
  button-go-hover:
    backgroundColor: "{colors.go-hover}"
    textColor: "{colors.go-ink}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 24px"
    height: "52px"
  waiting-plate:
    backgroundColor: "{colors.leather}"
    textColor: "{colors.engrave}"
    rounded: "{rounded.panel}"
    padding: "32px"
  decide-panel:
    backgroundColor: "{colors.leather}"
    textColor: "{colors.engrave}"
    rounded: "{rounded.panel}"
    padding: "32px"
  scale-stop-label:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
  more-toggle:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    height: "48px"
---

# Design System: CaseClerk, the case told (d2)

## 1. Overview

**Creative North Star: "The Top Plate"**

CaseClerk at /d2 is built like the top plate of a mechanical camera: a satin metal deck with engraved markings, a band of pebbled leather, and one dial that reads true. The dial is a time scale. Like a shutter-speed ring it runs on a logarithmic scale, so the first fifteen seconds of a dispute and the last twelve minutes get honest, equal room. One real PayPal sandbox dispute travels along it, from the moment it arrived to the money the seller kept. The landing is that dial, set large. The app pages are the same plate seen up close, quieter, with the one control the seller needs.

The system is for a hackathon judge who looks for five seconds and a small seller who looks for a decision. Both get the same thing first: a figure, a scale, and one orange control. Words come after the object, never before it. The register is a precise instrument, not a magazine and not a dashboard: no paper, no serif sentence, no event log as decoration, no grid of tiles.

It rejects, by name: cream paper and serif display heads (the rejected round 1), mono event logs as the face of the product, card grids of features, tracked-uppercase eyebrows, glows and gradient text, and anything that reads as a SaaS template.

**Key Characteristics:**
- Two materials only: satin metal (light) and pebbled leather (dark), stacked as horizontal bands.
- One family, Archivo, widened rather than swapped: display at width 112 to 118, text at 100.
- One action colour, signal orange, used only for the seller's single action and for "now" on a scale.
- One authored motion: the index travelling stop to stop along the log-time scale.
- Real production data in every figure; sandbox labelled as sandbox.

## 2. Colors

A neutral camera palette: cool satin metal, warm near-black leather, and one shutter-button orange. Green and red are reserved for money.

### Primary
- **Shutter Orange** (#f26a1b): the seller's one action (File the evidence, Review the case) and the "now" or "asked" mark on a scale. Hover lifts to #ff7d2e. Text on it is near-black (#170a02), never white.

### Neutral
- **Plate Light / Plate / Plate Shade** (#e9ebed, #dde0e3, #cfd3d7): the metal deck, as a vertical satin gradient from light to shade.
- **Seam** (#a9afb5): hairlines, quiet button borders, scale track on metal.
- **Engraving Ink** (#101214), **Ink 2** (#3f444a), **Ink 3** (#4b5157): text on metal. Ink 3 is the lightest text allowed on the plate shade (4.5:1 or better).
- **Leather / Leather Raised** (#151514, #1e1e1c): the dark band and the decide panel.
- **Paint Fill / Paint 2 / Paint 3** (#f2f1ec, #b6b5af, #8a8983): engraved text on leather, like the white paint in a camera's engraved numerals.

### Money
- **Kept** (#46b871 on leather, #17683a on metal): only for money the seller keeps.
- **Lost** (#e8604f): only for money a seller would lose.

### Named Rules
**The One Orange Rule.** Orange appears at most once per view as a filled control. A second orange thing on the screen must be a mark on a scale, never a second button.

**The Money Colour Rule.** Green means money kept, red means money lost. Neither is used for status, success toasts or decoration.

## 3. Typography

**Display and Text Font:** Archivo (variable, width axis 100 to 125), with Helvetica Neue and Arial as fallback.
**Proof Font:** the system monospace, only inside the opened record layer.

**Character:** a grotesque that widens like engraving on a camera body. The same family carries the 124px headline and the 13px scale label; hierarchy comes from width, weight and size, never from a second family. All figures are tabular.

### Hierarchy
- **Hero** (720, clamp(44px, 6.2vw, 96px), line height 1.07, width 112, tracking -0.035em): the landing headline, two short lines of real figures on one left edge, inside columns 1 to 8: what was disputed, what was kept.
- **Case Title** (700, clamp(36px, 3.9vw, 60px), width 112): the item and the claim on a case page.
- **Section** (650, clamp(28px, 2.5vw, 36px), width 112): one per band.
- **Block** (650, 22px, width 110, balanced wrapping): panel and evidence headings.
- **Figure** (650, 40px, width 118, tabular): the scale readout, the decide amount (56px).
- **Lede** (400, 19px, line height 1.45, max 48ch): the one sentence under a headline.
- **Body** (400, 16px, line height 1.5, max 60ch): everything else.
- **Label** (500, 13px, width 110): scale ticks, stop details, table heads. Sentence case, no tracking.

### Named Rules
**The Engraving Rule.** Labels are sentence case at normal tracking. No uppercase eyebrows, no letter-spaced labels, no numbered section prefixes.

**The Figures First Rule.** A headline is made of the case's real figures, not a claim about the product. A sentence never runs longer than the figure it explains.

## 4. Layout

A 12-column grid, 24px gutters, outer margin clamp(20px, 4.45vw, 96px), maximum width 1600px. Pages are stacked horizontal bands of metal and leather, each full bleed, each holding the same grid. On a case page the decide panel takes columns 9 to 12 and stays in view while the scale and evidence run in columns 1 to 8. Below 900px everything is one column and the panel follows the title.

Spacing is a 4-based scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Every vertical gap between sibling blocks is one of these values; band padding is 64 to 128, block gaps are 24 to 48, inside a component 8 to 16.

### Named Rules
**The One Edge Rule.** Lines of a headline share one left edge. No stair-stepped indents; emphasis comes from colour (Kept green), never from offset.

**The Band Rule.** Each band holds one idea: the claim (metal), the case told on the scale (leather), the rule (metal), the waiting case (leather). A band never holds two headings at the same level.

**The Scale Is the Layout Rule.** The time scale is full-width in its band and is the first real product content on every page that has a case. Nothing sits beside it.

## 5. Elevation & Depth

Depth is physical, not floating. Surfaces are lit from above: metal has a top-light satin gradient and a brushed grain along its length; leather has a 1px light catch on its top edge and a fine pebble grain. Both grains are a texture layer behind the content, so contrast is measured against the flat colour.

Only two things cast a shadow: the orange button (a 1px top highlight and a 2px contact shadow; it presses down 1px when active) and the decide panel (a soft 18px drop, the one object that sits on the plate rather than in it). Exact shadow values live in the sidecar, docs/design/d2/design.json.

### Named Rules
**The Flat Until Touched Rule.** No card shadows, no glows, no blur. If a thing is not a control or the decide panel, it is flush with its material.

## 6. Shapes

Corners are tight and machined: 6px on buttons, 10px on the decide panel, 2px on focus rings, circles only for scale dots. Lines are 1px hairlines in seam grey on metal and a faint light line on leather. The scale's track is 2px; the lit part of the track is the travelled time.

## 7. Components

### Buttons
- **Go** (Shutter Orange fill, near-black text, 52px tall, 24px side padding, 6px corners, weight 650 at width 108): the one action per view. Hover lifts the orange; active presses down 1px with an inner shadow; focus draws a 2px orange ring 3px out.
- **Quiet** (transparent with a 1px seam border, same size): the second choice in the same row, such as Don't file. Never on its own line under a Go button.
- **Confirm step:** a Go action that moves money or files evidence first turns into a confirm row (Yes, file it / Back) in place, same position, same sizes.

### The Scale (signature component)
A horizontal log-time dial. Tick labels at shutter-like steps (15 s, 30 s, 1 min, 2 min, 4 min, 15 min on the landing; 1 min to 1 day on a case, then the deadline engraved at the axis end as "Due Nov 4"). Stops are 12px dots, labelled below in two rows chosen so no labels touch, and every label's 1px leader runs up until it touches its dot. A label that would run past the end of the rail hangs left of its leader. Milestones (in, asked, filed, said no, error, closed) are never dropped: dots closer than about 20px are spaced along the rail, in order. Only passing moments fold into a neighbour (a filing's tracking read lives in "Asked you" or the filing; "Now" folds into a filing made moments ago; the landing's hold release lives in the close's record). A triangular index rides above the track. The readout to the left of the track is a large figure (elapsed time) and a short label. Stops are buttons: selecting one moves the index and shows that stop's own record in the line under the scale: PayPal's ids where PayPal sent one (webhook, call and debug id, capture, outcome), else the line CaseClerk logged (the rule it stopped at, the error it stopped on). Unselected, the line shows the record of the stop under the index, so a real id is on screen without a click. Narrow widths hide every other tick and switch stops to a vertical list with a left hairline.

### Waiting Plate
The other case on the landing is its own leather plate in columns 9 to 12, bottom-aligned with the headline block: a label (Another case, waiting for you), the amount as a figure, the item and "a separate sandbox test dispute", then the Go button at full plate width. It is the same object as the case page's decide panel, so the reader learns that a leather plate with an orange button means a case waiting for them.

### Decide Panel
Leather, 10px corners, 32px padding, sticky beside the case. Below 900px it follows the title, drops the amount figure (the title above states it), keeps Go and Quiet on one row, and sets its read as a two-column list, so the scale's readout still lands in the first phone screen. Order inside: the amount as a figure, the question as a block heading, one line on why it waits, the Go/Quiet row, then a short definition list (chance PayPal sides with you, evidence strength, expected loss, what no answer costs).

### Evidence and Record
The evidence list is plain sentences, one per exhibit, a third for the label and two thirds for the content. The exact text sent and PayPal's raw record sit behind two disclosure toggles; raw ids and event names live only there.

### Ledger (policy)
A horizontal dollar scale from $5 to $1,000 (log, like a film-speed dial) with two engraved lines, the refund/offer line and the evidence line, and the cases on the page marked as beads: a round-capped stroke over one value, or one bead spanning values that sit within 3% of the axis, so marks never touch. It replaces any table of rules.

### Navigation
A thin top bar on metal: the wordmark set in Archivo at width 125, three plain links (Cases, Deadlines, Rules), and the sandbox label pushed right.

## 8. Do's and Don'ts

### Do:
- **Do** put the case's real figures in the headline, with cents ($397.00 disputed. $386.23 kept.).
- **Do** say what no answer costs next to any result (PayPal rules for the buyer; the seller loses the amount and the fee).
- **Do** label every sandbox case as a sandbox test dispute, and say same-camera cases are separate disputes.
- **Do** keep one Go button per view and its Quiet partner in the same row.
- **Do** use the log-time scale whenever time is the story; park it on its last stop under reduced motion.
- **Do** measure contrast against the flat material colour, not the grain.

### Don't:
- **Don't** use cream paper, a serif display face, or a black-square logo mark (round 1, rejected).
- **Don't** show a mono event log, webhook names or debug ids in the default view.
- **Don't** use tracked-uppercase eyebrows, "01 /" numbering, middle-dot meta strings or arrows on links.
- **Don't** build a grid of same-size cards or number tiles, or fake sparklines and meters.
- **Don't** use gradient text, glows, blur, or side-stripe borders.
- **Don't** use orange for anything but the one action and "now"; don't use green or red for anything but money.

## Stage 2 system notes (as built)

- **Routes:** the product sits at the root: `/` landing, `/cases` inbox, `/case/[id]`, `/policy`. The old `/d2/*` paths redirect. `/board`, the deadline board, joined in stage 3 (below).
- **Inbox:** three bands whose counts add up to the headline. The leather band holds only cases waiting for a yes: amount as a figure, item and "a separate sandbox test dispute", a thin rail from arrival to PayPal's deadline with the index at now, and the deadline in words; the Go button only on the case a visitor may answer (the demo-reserved case says why it waits, with a Quiet "View the case"). Open cases are a metal table, soonest deadline first; closed cases state PayPal's ruling and what was kept. Under 900px a row is the amount beside a stack of item, state and deadline; column heads are dropped and the closed date says "Closed" inline.
- **Case page, every state:** the panel is a plate that changes with the case: the decide panel while it waits; "PayPal's answer" (the HTTP status as a figure, "accepted", the debug id, PayPal's latest webhook with a live dot) once filed; "PayPal ruled for you" with the kept figure in Kept green and the fee, or the buyer's ruling in Lost red; plain plates for reviewing, waiting on the buyer, read, received and stopped on an error. The title is the item, or the claim when no order is on file (then the plate doesn't repeat the claim). Under 900px the plate keeps its figure once nothing waits for a yes (PayPal's answer, kept, lost, disputed); PayPal's record table puts each entry on two lines, the id under time, what and status.
- **Approve flow:** Go turns into a confirm row in place, then a 5-second undo (the count rolls with NumberFlow and a bar drains), then "Sending" (at least 900 ms, so it can be read), then PayPal's answer: the plate turns into the record and the scale stamps a new "You said yes. Filed" stop where Now was. The page polls every 4 s for two minutes, then every 20 s, so later webhooks arrive live. Failures stay in the panel with a retry; a conflict reloads the case. Reduced motion swaps the travel for an instant change.
- **Open a test dispute:** a Quiet control in the inbox head and, on the landing, under the words of its own band ("Watch one arrive."); it becomes the Go action wherever no case is waiting. It shows the honest wait as three steps (filed in PayPal's sandbox, PayPal tells CaseClerk with the elapsed time, CaseClerk works the case), the matching wire rows as they arrive, and a link to the case once it lands. The daily cap is a plain message with the time it opens again. A wait survives a reload for 30 minutes.
- **The money rule, one sentence everywhere:** "Over $250 to file evidence, or over $15 to refund or offer, it asks you first." Values are read from `GET /api/policy`; a refund or offer asks above the lower of `autoRefundMaxUsd` and `approvalAboveUsd` (fallback $15 and $250). The landing ledger and /policy draw the same $15 line. A line in the lowest quarter of a lane leaves no room to name the zone under it: that zone is unlabelled on the lane and named in its accessible label, and the zone past it carries the figure ("Asks you over $15") or the lane head does ("Asks over $15").
- **Policy:** read-only lanes from `GET /api/policy`, two bands: money (evidence line at $250 with the cases on file as beads; refund limit at $15 with the redundant $50 approval line dashed) and judgment (the 45% minimum with the agent's decisions as beads; the 40% offer cap). Bead captions sit at the lane's right edge, under the line's name. The buyer voice is a leather quote. The page says the seller edits these in their account.
- **Narrow scales:** tick labels near the right end are hidden, so they never meet the deadline label.

## Stage 3 system notes: the deadline board (as built)

- **What it is:** `/board`, "Deadlines" in the top bar between Cases and Rules. A Bryntum Scheduler (trial 7.3.7, client-only) on real data from `GET /api/cases` and each case's audit and wire: one row per case, a bar from PayPal opening the dispute to PayPal's seller-response deadline (or to the close, or to now when PayPal has set none), the case's moments on it, and Bryntum's current-time line as now. The rows are built on the server (`src/app/d2/_lib/board.ts`); the client only draws them. Times are PT (`timeZone`).
- **Bands and order:** the inbox's bands through Bryntum's group feature: waiting for your yes first (the case a visitor may answer, the reserved case last), then open by deadline, then closed, latest first. Each band says its count ("3 waiting for your yes"); the head's counts add up to the headline.
- **A bar is the case's scale, told as a row:** lit up to now, dashed after it, an engraved end tick at PayPal's deadline; a closed case's line ends at the close in Kept green or Lost red; an open case with no deadline fades out at now. Moments use the scale's code: PayPal's are rings, CaseClerk's (and yours) filled, an ask orange, a kept close green, a lost one red. Moments too close to space sit in a strip, in order (a sequence, not a span of time), that never passes now; the tooltip lists each with its time. The bar's end says what it is in words ("Due Nov 4, 8:59 pm PT, 9 days left", "Closed for you, 18 min after it opened", "The buyer has the next word"), inside the bar when it fits, else after it; words sit on a small metal plate so the now line passes behind them.
- **Orange:** the seller's turn (waiting bars, "Asked you" moments) and now. Nothing else on the board is orange.
- **Two spans, one switch:** "To the deadlines" (days, fitted to the window; its start leaves room before now for the longest live strip) and "Hour by hour" (3-hour ticks since the first case). A radio pair above the board; `?span=hours` deep-links. Wheel and double-click zoom are off, so the page scrolls like a page.
- **Opening a case:** a bar, a row, the empty schedule beside it, or Enter on a focused bar opens `/case/<id>` (client navigation); the item name is a real link, so a modifier click opens a tab. Keyboard: Tab reaches the grid's header ("Cases. Arrow down to a case, Enter opens it."), arrows move through cases and onto the bar. A bar's accessible name is the amount, item, state and end words.
- **Theme:** Svalbard light is only the base; every surface, line and type colour is overridden through Bryntum's CSS variables on `.bd-sched .b-scheduler` (`src/app/board/board.css`): transparent panels on the board's metal, the header on the top plate's metal with engraved Archivo, hairline ticks, the Go button's ink on the orange "Now" tag. The tooltip floats outside the shell, so it carries its own dark plate.
- **Phone (under 900px):** the board stays a Bryntum band, not a list: a narrow case column (the amount over the item, no state line; the band and the bar's end say it), short end words ("9 days left", "No deadline"), a tick every three days. Hour by hour scrolls sideways, centred on now. A name that wraps past its row's lines gets a taller row (Bryntum's per-record `rowHeight`), never clipped words. Since stage 4 the board takes its rows' height (Bryntum `autoHeight`) and the page scrolls, instead of a frame inside one screen; the time header scrolls away with the page.
- **Gates exemption:** Bryntum's generated time-axis header carries `data-align-ok` (its date labels sit on their ticks, placed by date, not on the page's text edges). Nothing else is exempt.
- **Trial watermark:** Bryntum's diagonal "Trial Version" pattern sits under the content; it is the trial's and stays.

## Stage 4 system notes: the judge's full loop (as built)

- **Why it exists:** PayPal's sandbox never rules on a test dispute by itself. After the seller's yes files the evidence, a visitor would wait forever, so a test dispute gets one sandbox control: ask the sandbox to rule (`POST /api/cases/<id>/simulate`, `{"action":"adjudicate","outcome":…}`). On a live account PayPal decides on its own; the control says so.
- **Where:** in the case page's leather plate, under PayPal's answer ("Filed. PayPal is reviewing."), as its own band behind a dashed seam, labelled "Sandbox control, test disputes only". Only when the case is a test dispute (`isTestDispute`), PayPal is reviewing a filing (state `review`), and the case is not the reserved demo case (`RESERVED_CASES`, VPY). Never on a live dispute; the API refuses both too.
- **The choice:** a radio pair, "Seller wins" (default) and "Buyer wins", then one Go, "Ask for the ruling". One Go per view still holds: a filed plate has no other.
- **Not open yet (409):** PayPal opens the step minutes after a filing. The band turns into "Asking the sandbox to rule for the seller" with PayPal's state (from the case, refreshed by the API's own check) and the last check's time and count; it asks again once a minute, at most 30 times (well inside the API's 120 checks an hour), and "Stop asking" ends it. A retry keeps this view; nothing flashes back.
- **Errors:** 429 says the hourly cap and when to ask again (`resetAt`); 502 says the sandbox turned it down and often does the first time; 503 and a lost connection say nothing was asked; each offers "Ask again". 403 has no button.
- **Asked (200):** "Ruling asked for the seller", the time, and that the RESOLVED webhook lands on the scale. A reload shows the same from the audit (`demo.adjudicate`), so the control is not offered twice. The scale gains a stop, "You asked for a ruling" (filled: yours), with the adjudicate call, its status and debug id as its record. The page polls every 4 s for 15 minutes after the ask.
- **The ruling lands:** the RESOLVED webhook closes the case on the scale (the kept stamp) and the plate turns to "PayPal ruled for you"; the figure counts from the disputed amount to what was kept when PayPal states the money (`money`), and turns Kept green only then. A case that closed while open keeps listening up to ten minutes for the money. The kept plate adds "Asked of the sandbox: by you, <time> PT", so a sandbox ruling is never passed off as PayPal's own.
- **After the yes on a test dispute:** the filed plate's line says "Next, ask PayPal's sandbox to rule, below." (one line; the band itself is the only control). Opened later, it says "On a test dispute the sandbox rules only when asked, below."

