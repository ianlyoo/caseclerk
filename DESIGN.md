---
name: CaseClerk — the desk
description: Precise, restrained working surfaces for a seller's dispute decisions.
colors:
  primary: "#2058b4"
  primary-hover: "#184994"
  primary-active: "#113b7b"
  primary-soft: "#edf3fb"
  shell: "#153548"
  shell-selected: "#294b60"
  shell-muted: "#b6cbd8"
  ink: "#1d2d3a"
  muted: "#61717e"
  surface: "#ffffff"
  ground: "#f5f7f9"
  line: "#e0e7ec"
  success: "#237052"
  warning: "#8a591b"
  warning-soft: "#fff4df"
  disabled-bg: "#d8e2f0"
  disabled-text: "#455d7b"
typography:
  headline:
    fontFamily: "Public Sans, sans-serif"
    fontSize: "32px"
    fontWeight: 550
    lineHeight: 1.25
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Public Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "24px"
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Public Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Public Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  amount:
    fontFamily: "Public Sans, sans-serif"
    fontSize: "36px"
    fontWeight: 500
    lineHeight: "44px"
    letterSpacing: "-0.04em"
rounded:
  control: "6px"
  status: "5px"
  work-area: "12px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
  16: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-disabled:
    backgroundColor: "{colors.disabled-bg}"
    textColor: "{colors.disabled-text}"
  navigation-selected:
    backgroundColor: "{colors.shell-selected}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 12px"
  status-pending:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning}"
    rounded: "{rounded.status}"
    padding: "4px 10px"
---

# Design System: CaseClerk

## Overview

**Creative North Star: “The desk”**

A working seller's desk, viewed in ordinary daylight on a laptop or phone. A white task surface gives long evidence passages and financial amounts a clear ground. Maritime blue gives the navigation its own territory. The product's confidence comes from placement, hierarchy and accurate information.

This replaces the rejected cream ground, serif narrative and decorative technical logs. Public Sans carries the entire interface. The page-specific first-screen strategy lives in `docs/design/d1/surface-brief.md`; this file records the implemented reusable system.

## Colors

Primary blue belongs to the next action, active disclosure and keyboard focus. The deeper blue shell separates navigation from work. White and cool gray support reading; green means confirmed or closed, amber means pending or evidence uncertainty. State always has a text label.

**The meaning rule.** Do not add color without a state, location or action to explain.

Text selection uses pale blue with shell-colored ink. Focus is a visible 3px blue outline, offset by 4px. Body and label colors meet AA against their actual grounds.

## Typography

Self-hosted Public Sans variable, SIL OFL 1.1, with a sans-serif fallback. The same family handles labels, prose, headings and tabular numbers; raw proof records alone use the system monospace face. No display serif or tracked uppercase label role exists.

The main headline uses the headline token; case titles use 28px/36px. Pending item names use 24px/32px. Standard UI is 14px, compact data 13px, supporting labels 12px. On phones, headlines are 28px and case titles 26px, with all supporting text at least 12px. Document prose is 14px/1.75 with a 58ch CSS limit (about 65–80 actual characters in this face), reducing to 13px in narrow disclosure panels.

Amounts have tabular numerals and cents. Numeric columns align right. Heading tracking stays between -0.02em and -0.04em; body tracking is normal. Headings balance; paragraphs use pretty wrapping.

## Layout

A 208px fixed-width shell rail and fluid workspace; content is capped at 1328px including 48px horizontal padding. A 72px top bar carries identity and environment. The case view uses a fluid evidence column, a 328px decision column, and a 48px gap. The recent-case table has 72px rows and a 40px header.

Spacing is the ten-step scale in the frontmatter, also declared as `--space-*` on `.desk`. Use 4–12px within a fact, 16–24px within a work area, and 32–48px between sections. Borders add one pixel; optical text alignment is not a new spacing token.

At 1199px the rail is 184px and gutters become 32px. At 900px the rail becomes a horizontal header. At 650px, gutters become 20px, the recent table becomes paired item/amount rows, and case columns stack. A mobile case summary keeps amount, due date and approval threshold before evidence; the full decision follows the evidence. Large monitors retain the capped workspace instead of stretching text measures.

## Elevation & Depth

No drop shadows. Flat tonal fields and one-pixel rules separate work. The pending area is a pale-blue field; the decision area is cool gray. Neither uses nested cards. Disclosures unfold in place rather than opening overlays.

## Shapes

Work-area containers use the work-area radius; compact controls use the control radius. Status labels use the smaller status radius. The brand is an unboxed open file/check outline, not a black-square mark. Icons are consistent 1.6px round strokes, generally 20px, and 16px within dense rows.

## Components

Primary actions have a stable height, one-line centered labels and a consistent trailing edge. Hover darkens blue; active darkens further. The reserved sandbox action uses a clearly unavailable fill, `aria-disabled`, adjacent explanation and no write handler. It remains keyboard focusable so the reason is available.

Navigation has labeled icons, a selected field and `aria-current`. At phone widths the header preserves the current location; the brand and breadcrumb provide return paths. The skip link appears on focus.

Status labels use color plus words. The case table uses native table semantics; responsive positioning retains the same content order.

Evidence uses native `details` / `summary` controls in one accordion group. One document opens at a time in a keyboard-focusable reading region capped at 360px, with native scrolling, so the decision remains nearby. Opening reveals the document in place with a 220ms clip-and-opacity transition and a 200ms disclosure-chevron rotation. Easing is `cubic-bezier(.16,1,.3,1)`. Buttons and rows respond in 150ms. There are no entrance cascades or idle animations. Reduced motion removes spatial animation and keeps state visible.

Loading uses stationary placeholders. Initial errors identify the unavailable service and provide a retry. Polling errors keep existing data with a visible stale-data message. Live reads refresh each minute while the page is visible.

## Do's and Don'ts

- Do keep amounts, evidence quality and decision authority close together.
- Do align control edges and text to their actual content columns.
- Do preserve readable 12px supporting labels and visible focus.
- Do place exact IDs, event names and debug information inside the proof disclosure.
- Don't add decorative metrics, gauges, letter avatars or testimonial content.
- Don't add shadowed card grids, uppercase eyebrows or oversized narrative headlines.
- Don't animate the task into view or conceal content behind an entrance.
- Don't infer a successful financial outcome from a closed status.

The skill's sidecar is stored at `docs/design/d1/design-system.json` to respect this assignment's owned-path boundary. Its default `.impeccable/design.json` path is intentionally not written.
