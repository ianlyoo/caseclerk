⚠️ DEGRADED: single-context (company rule: no subagents). Assessment A was written before Assessment B was read.

# Critique: /d2/case/PP-R-VPY-10194485, pending (Operate), 2026-10-26

Target: the pending case page on real production data ($412.00, Olympus OM-1n body, chrome; chargeback, not as described; due Nov 4, 8:59 pm PT), 1440×900 and 390×844. Approve and deny are never sent for this case (reserved for the owner's demo).
Persisted here because `.impeccable/critique/` is outside d2's owned paths.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 4 | "Now" on the scale, time since arrival, deadline end label, days left. |
| 2 | Match System / Real World | 3 | Evidence in plain sentences; PayPal's record behind a toggle. |
| 3 | User Control and Freedom | 3 | Confirm step with Back; disclosures open and close in place. |
| 4 | Consistency and Standards | 3 | Same Go/Quiet pair and the same scale as the landing. |
| 5 | Error Prevention | 4 | Filing needs a second, explicit yes; nothing moves on one click. |
| 6 | Recognition Rather Than Recall | 3 | The panel restates amount, question, why, and what no answer costs. |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcut, no next-case navigation (stage 2 inbox). |
| 8 | Aesthetic and Minimalist Design | 3 | One panel, one scale, one list; ids only in the record layer. |
| 9 | Error Recovery | 2 | A failed POST shows the error message, but no retry or guidance. |
| 10 | Help and Documentation | 2 | "How CaseClerk works" links home; no inline help on chance or expected loss. |
| **Total** | | **29/40** | **Good (73%)** |

Applicable max 40; n/a: none.

## Design Specificity Verdict

**LLM assessment:** authored. The page is the same top plate as the landing, seen close: the title is the item and the claim, the scale runs from arrival to PayPal's deadline on the same log rule, and the leather decide panel holds the one decision. The agent's numbers (35% chance, weak evidence, expected loss $292.22 vs $442.87) are stated in words a seller can weigh, and the raw PayPal record (12 entries) is one click away, not the face.

**Deterministic scan (Assessment B):** `impeccable detect` at 1440×900 and 390×844: **0 anti-patterns, 0 advisories** after the shared fixes (contrast against the grain layer, button text colour, line length). check.sh: 0 FAIL, 0 WARN at all five sizes. Earlier check.sh FAILs that A had missed: closed `<details>` overlapping their own summaries (replaced with a disclosure that renders its body only when open) and a 56px gap from a sticky offset at 390 (`top: auto` on mobile).

**Visual overlays:** not injected (headless run, no user browser in this context).

## Overall Impression

Calm and exact: a seller sees what is at stake, what CaseClerk will send, and one orange button. The biggest opportunity is the stage-2 approve moment, where the index should travel from "Now" to a new "Filed" stop as PayPal answers.

## What's Working

- The decide panel stays beside the case at desktop sizes and follows the title on a phone, so the question and the evidence are never apart.
- The "no answer at all" row makes the cost of doing nothing concrete ($412.00 and the fee).
- Raw ids are in the opened record only (G7).

## Priority Issues

- **[P2] Expected-loss wording was ambiguous** (fixed). It read as two losses; now "Filing $292.22, refunding $442.87" under "Expected loss". Command: /impeccable clarify.
- **[P2] The title broke inside "OM-1n" at 1440** (fixed with non-breaking spans). Command: /impeccable typeset.
- **[P2] No next-case navigation.** Open; belongs to the stage-2 inbox. Command: /impeccable layout.
- **[P3] Error recovery after a failed file is a sentence only.** Open; stage 2 adds retry with PayPal's debug id in the record layer. Command: /impeccable harden.
- **[P3] Chance and evidence strength have no "why" on demand.** Open; a disclosure under the panel in stage 2. Command: /impeccable clarify.

P0: 0. P1: 0.

## Persona Red Flags

**Alex (power user):** no keyboard shortcut for File; with one decision per page this is a stage-2 inbox concern.
**Jordan (first-timer):** "chargeback" and "provide evidence" are PayPal's words; the panel says "File this evidence with PayPal?" and the evidence list is plain sentences.
**Sam (keyboard, screen reader):** File and Don't file are buttons in DOM order before the details; the confirm row keeps focus in place; disclosure toggles carry `aria-expanded`.

## Minor Observations

- "11 days left" rounds up; at under a day it should switch to hours.
- On a phone the proof table drops the PayPal id column; the ids remain in the list under it.

## Questions to Consider

- Should the panel show the policy line that made it wait ($250) as a mark on a small ledger?
- Should Don't file explain what happens next (PayPal rules for the buyer) in its confirm row?

Questions skipped: autonomous run; company rule forbids user-input tools (2 questions recorded above instead).
