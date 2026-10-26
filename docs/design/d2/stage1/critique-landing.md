⚠️ DEGRADED: single-context (company rule: no subagents). Assessment A was written before Assessment B was read.

# Critique: /d2 landing (Persuade), 2026-10-26

Target: `/d2` on real production data (story case PP-R-SGV-10194507, waiting case PP-R-VPY-10194485), 1440×900 and 390×844.
Persisted here because `.impeccable/critique/` is outside d2's owned paths.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | The index and readout show where the story is; with no JS, the scale sits on its first stop (no hydration on the dev proxy). |
| 2 | Match System / Real World | 3 | Plain money and time words; "chargeback" is PayPal's own term and kept. |
| 3 | User Control and Freedom | 3 | Stops are buttons; replay runs once, then the reader drives it. |
| 4 | Consistency and Standards | 3 | One Go style, same label in hero and waiting band. |
| 5 | Error Prevention | 3 | The CTA leads to a review page with a confirm step, never to an action. |
| 6 | Recognition Rather Than Recall | 3 | Each stop names itself; the ledger marks the two cases on the page. |
| 7 | Flexibility and Efficiency | n/a | Persuade surface, one path. |
| 8 | Aesthetic and Minimalist Design | 3 | Two materials, one orange; the hero is figures, not a sentence. |
| 9 | Error Recovery | 2 | Data-down state is a plain sentence, no retry control. |
| 10 | Help and Documentation | n/a | Persuade surface. |
| **Total** | | **23/32** | **Good (72%)** |

Applicable max 32; n/a: 7, 10.

## Design Specificity Verdict

**LLM assessment:** authored for this product. The headline is the case's own figures ($397.00 disputed. $386.23 kept.), and the first real content is a log-time scale fed by that case's webhook, audit and PayPal money rows. Nothing here could be moved to another SaaS landing without its data. The camera top plate (satin metal, pebble leather, engraved Archivo, one shutter-orange control) carries one world from the landing into the case page. Risk: the material grain is subtle at 1x and may read as flat grey on a low-quality screen.

**Deterministic scan (Assessment B):** `impeccable detect` on the URL at 1440×900 and 390×844: **0 anti-patterns, 0 advisories** after fixes. Earlier runs caught, and I fixed: light text on orange (an `a` colour rule beat the button), low contrast measured against the grain image (moved textures to a layer behind content), contrast on the gradient bottom ("Sent as one PDF", ink-3 darkened to #4b5157), line length in the footer (60ch), an unbalanced heading and a straggler, and the top-bar sandbox label at 4.2:1. Agreement with A: contrast and measure were also flagged in A's pass; the grain false positive was the detector being right about what it measures.

**Visual overlays:** not injected (headless run on the Mac, no user browser in this context).

## Overall Impression

A stranger sees two figures and a dial: what was disputed, what was kept, and the twelve and a half minutes in between. The biggest remaining opportunity is motion that earns the "animations too flat" note: the index travel is the one authored moment and it works, but the end stop could land harder (stage 2, with the approve flow).

## What's Working

- The headline is data, so G6 and the comparison rule are met by the case itself, with the no-answer cost in the next line.
- The log scale gives the 98 seconds to "asked" and the 12 min 31 s to "closed" honest room, like a shutter dial.
- The rule is shown as a ledger with the two cases marked, not as a paragraph.

## Priority Issues

- **[P1] The comparison was below the fold** (fixed). Why: a result without what no answer costs reads as a claim. Fix: the fine line "Kept after PayPal's $10.77 fee; unanswered, the seller loses $397.00 and the fee." sits beside the CTA in the first screen. Command: /impeccable clarify.
- **[P1] The hero CTA collided with headline line 1 at 1440** (fixed). Why: the owner named button placement as the main failure. Fix: two-row hero, CTA in columns 5–12 of row 2, lede in 1–4. Command: /impeccable layout.
- **[P2] The ledger's $397 and $412 dots overlapped with two labels** (fixed). Fix: one label for both marks. Command: /impeccable polish.
- **[P2] Scale hint read as instructions to a UI** (fixed). Now "Select a stop for PayPal's record of it." Command: /impeccable clarify.
- **[P3] No retry on the data-down state.** Open; stage 2 with the inbox error states. Command: /impeccable harden.

P0: 0. P1: 2 (both fixed).

## Persona Red Flags

**Jordan (first-timer):** nav said "The story", which explains nothing; renamed "The case" and "When it asks". The headline needs no jargon.
**Casey (mobile, distracted):** at 390 the CTA is in the first screen, full width, after the headline and the one-line comparison.
**Sam (keyboard, screen reader):** stops are real buttons with `aria-pressed`, the readout is `aria-live="polite"`, focus is a 2px orange ring. Decorative svg, lines and dots are `aria-hidden`; the rail itself is not, so its stops stay reachable.

## Minor Observations

- With reduced motion the scale parks on its last stop, so the shot and the reader both see "closed".
- "Built for the PayPal AI Hackathon." is the only meta line; no invented logos or quotes.

## Questions to Consider

- Should the end stop's "$386.23 kept" get a stronger landing moment (a short count-up in Kept green)?
- Should the waiting band show its own small scale, so the two cases read as one system?

Questions skipped: autonomous run; company rule forbids user-input tools (2 questions recorded above instead).
