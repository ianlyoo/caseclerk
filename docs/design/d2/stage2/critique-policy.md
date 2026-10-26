⚠️ DEGRADED: single-context (company rule: no subagents). Assessment A was written before Assessment B was read.

# Critique: /policy, the seller's rules, read-only (Read), 2026-10-26

Target: the rules page on production `GET /api/policy`, 1440×900 and 390×844, from the hosted build. Read-only: no PUT exists on the page.
Persisted here because `.impeccable/critique/` is outside d2's owned paths.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 4 | Each line is engraved on its own scale with the zone it governs; "Read from" carries the read time. |
| 2 | Match System / Real World | 3 | Rules in sentences first ("It asks before money moves."), then the lanes. |
| 3 | User Control and Freedom | n/a | Read-only by brief; the page says who changes the rules and where. |
| 4 | Consistency and Standards | 4 | Same log dollar axis as the landing ledger; orange only where it means "asks you". |
| 5 | Error Prevention | 4 | Nothing to edit here, so production rules can't be changed by a visitor. |
| 6 | Recognition Rather Than Recall | 3 | The 31 cases and the 14 decisions sit on the lanes as beads, so a line is read against real cases. |
| 7 | Flexibility and Efficiency | 3 | One page, two bands, five facts. |
| 8 | Aesthetic and Minimalist Design | 3 | Two lanes per band; the redundant $50 line is drawn dashed, not hidden. |
| 9 | Error Recovery | 3 | If the policy API is down the page says it can't read the rules and to try again; it never shows stale lines as current. |
| 10 | Help and Documentation | 3 | The money band explains why the $50 line never fires ($15 already asks). |
| **Total** | | **30/36** | **Excellent (83%)** |

Applicable max 36; n/a: User Control (read-only by brief).

## Design Specificity Verdict

**LLM assessment:** authored. The rules are the ledger lanes from the landing at full size: the evidence lane shows where the 31 cases fall against the $250 line, the refund lane shows the $15 limit with the redundant $50 approval line dashed, and the judgment lanes put the 14 decisions against the 45% minimum. The buyer voice sits on leather as a quote, not a setting.

**Deterministic scan (Assessment B):** `impeccable detect`: 1 advisory at 1440 (a one-word last line in a fact row), fixed with `text-wrap: pretty` on record rows; now 0 at both sizes. check.sh: 0 FAIL, 0 WARN at all five sizes.

## Priority Issues

- **[P2] "Settles" overstated the rule** (fixed). Below 45% CaseClerk prefers a refund or offer only when that costs less; the lane now says "Settles if cheaper". Command: /impeccable clarify.
- **[P2] One-word last line in a fact row** (fixed). Command: /impeccable typeset.
- **[P3] The refund lane's "Own" zone is short at the $15 line.** Open: the label is abbreviated to fit; the sentence beside it says it in full. Command: /impeccable layout.
- **[P3] The landing still says "$50 to refund or offer"** (approved copy), while this page shows the $15 line that really applies. Open for the PM. Command: /impeccable clarify.

P0: 0. P1: 0.

## Persona Red Flags

**Jordan (first-timer):** "45% minimum to fight" is the agent's threshold, not PayPal's; the sentence says "chance that PayPal sides with you".
**Sam (screen reader):** each lane is an `img` with a label that reads the line and both zones.

Questions skipped: autonomous run; company rule forbids user-input tools.
