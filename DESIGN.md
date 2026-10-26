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
    fontSize: "clamp(44px, 6.8vw, 124px)"
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
- **Hero** (720, clamp(44px, 6.8vw, 124px), line height 1.07, width 112, tracking -0.035em): the landing headline, two short lines of real figures: what was disputed, what was kept.
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
A horizontal log-time dial. Tick labels at shutter-like steps (15 s, 30 s, 1 min, 2 min, 4 min, 15 min on the landing; 1 min to 3 days on a case). Stops are 12px dots, labelled below in two alternating rows; stops too close to name separately are dots only. A triangular index rides above the track. The readout to the left of the track is a large figure (elapsed time) and a short label. Stops are buttons: selecting one moves the index and names PayPal's record of it. Narrow widths hide every other tick and switch stops to a vertical list with a left hairline.

### Decide Panel
Leather, 10px corners, 32px padding, sticky beside the case. Order inside: the amount as a figure, the question as a block heading, one line on why it waits, the Go/Quiet row, then a short definition list (chance PayPal sides with you, evidence strength, expected loss, what no answer costs).

### Evidence and Record
The evidence list is plain sentences, one per exhibit, a third for the label and two thirds for the content. The exact text sent and PayPal's raw record sit behind two disclosure toggles; raw ids and event names live only there.

### Ledger (policy)
A horizontal dollar scale from $5 to $1,000 (log, like a film-speed dial) with two engraved lines, the refund/offer line and the evidence line, and the cases on the page marked as dots. It replaces any table of rules.

### Navigation
A thin top bar on metal: the wordmark set in Archivo at width 125, two or three plain links, and the sandbox label pushed right.

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

## Stage 2 system notes

- **Inbox:** a list of cases, each row a thin scale of its own (arrived to deadline, the index at now), with the amount as a figure on the left and the Go action on the right only for rows that wait for the seller. Sorted by deadline.
- **Resolved case:** the case page with the panel turned to a result plate: the kept figure in Kept green, the fee, and the no-answer comparison; the scale ends on "Closed for the seller".
- **Approve flow:** on Yes, the index travels from "Now" to a new "Filed" stop as PayPal answers (HTTP status in plain words, the debug id in the record layer); the readout counts with NumberFlow.
- **Open a test dispute:** a quiet action in the top bar of the inbox, labelled as sandbox, that adds a fresh row whose scale starts at zero.
- **Policy:** the Ledger at full width, its two lines draggable, with the cases on file marked as dots so the seller sees which would have asked.
