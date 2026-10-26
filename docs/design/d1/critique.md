# Impeccable critique — stage 1

⚠️ DEGRADED: single-context (COMMON.md explicitly forbids subagents). Design assessment A was recorded before consuming detector findings; browser/mechanical assessment B followed. This is the designer's self-critique, not the PM's independent critique.

Targets: `src/app/d1/page.tsx` (`src-app-d1-page-tsx`) and `src/app/d1/case/[id]/page.tsx` (`src-app-d1-case-id-page-tsx`). Mode: Operate. Date: 2026-10-26. Captures: all five `stage1/*.png` files, made on the public production URL. No prior ignore list or critique history was present.

## Design specificity

The working queue, reserved seller decision and explicit distinction between delivery and condition are specific to this product. The navigation and table deliberately follow familiar product conventions. The maritime rail and Public Sans establish a different visual world from the rejected serif/editorial compositions. There is no claim that a clean detector makes the design original or premium.

The key opportunity was density: the original pending block consumed more height than its facts earned. A second issue was mobile case context: amount, deadline and threshold were below the evidence list. Both were corrected in the review batch.

## Design health

| Heuristic | Landing /4 | Pending /4 | Evidence and limit |
|---|---:|---:|---|
| Visibility of system status | 3 | 3 | Live source, sandbox label, pending state and stale/error states are clear. No freshness timestamp yet. |
| Match with the real world | 4 | 4 | Plain claim labels, dollars with cents, due date and evidence quality. |
| User control and freedom | 3 | 3 | Back paths, native disclosures, no surprise writes. Reserved filing is intentionally unavailable. |
| Consistency and standards | 4 | 4 | Same shell, type, spacing, focus and control grammar. |
| Error prevention | 4 | 4 | No approve/deny handler; evidence weakness and draft caution remain visible. |
| Recognition rather than recall | 4 | 4 | Waiting case leads; mobile amount, due date and rule now precede evidence. |
| Flexibility and efficiency | 2 | 2 | Keyboard access works. Full inbox filters and action shortcuts are stage 2. |
| Aesthetic and minimalist design | 3 | 3 | Strong hierarchy and precise alignment; conventional table carries most of the desk. |
| Error recognition and recovery | 3 | 3 | API outage explains the problem and retry restores the view; existing data survives poll errors. |
| Help and documentation | 3 | 3 | Approval rules and draft warning are contextual; full policy experience is deferred. |
| **Total** | **33/40** | **33/40** | **Good** |

Initial scores were 31/40 and 30/40. These final scores concern the requested stage-1 read-only surfaces, not a complete end-to-end production flow.

## What works

- The pending decision dominates without hiding the existence of other real cases.
- Weak evidence is explicit; the interface does not turn the agent's draft into a certainty claim.
- Amounts, action edges and headings align. Desktop splits evidence from decision; the phone repeats the essential stakes before its linear review.

## Priority issues and disposition

| Priority | Finding | Applied change / disposition |
|---|---|---|
| P1 | Mobile case required recalling amount/deadline from the previous page. | **Resolved:** compact amount, deadline and threshold summary before evidence. `adapt`/`layout`. |
| P2 | The pending area delayed the recent queue. | **Resolved:** reduced desktop vertical padding with the same scale. `layout`. |
| P2 | Phone supporting text reached 11px. | **Resolved:** 12px supporting floor. `typeset`. |
| P2 | Simultaneous long documents stretched one desktop column and the draft measure ran long. | **Resolved:** one native accordion document at a time, a 360px accessible reader and 58ch CSS prose measure. `layout`/`typeset`. |
| P2 | Full inbox and filing cannot be completed here. | **Deferred by brief:** stage 2 owns these flows. The current view labels the reserved action honestly. |

No unresolved P0 or P1 findings in stage-1 scope.

## Cognitive load and emotional path

All eight checklist items pass after fixes: one focus, bounded groups, meaningful grouping, hierarchy, one decision, few choices, repeated context, progressive disclosure. The table is read-only context rather than six competing choices. Three findings lead to three document disclosures; the proof layer is separate. No decision point offers more than four actions.

The emotional path is controlled: a ready case, recognizable facts, visible uncertainty, then the seller's decision. No fake win probability meter or “money saved” claim introduces unjustified reassurance.

## Persona checks

- **Jordan, first-time judge:** identity is one line; “Review case” is the clear first action. Multiple camera disputes are explicitly separate sandbox tests. No initial wall of API text.
- **Sam, keyboard user:** native details open with Enter; focus rings remain visible; the scrollable document is focusable; reserved approval sends no request. Reduced motion preserves state and removes animation.
- **Casey, phone user:** full-width review action, no sideways scroll, readable amounts. The decision panel remains after evidence; the compact first-screen context removes the former memory burden.

Minor remaining limits: there is no direct freshness timestamp, live case counts can change between captures, and full case-list navigation awaits stage 2.

## Mechanical evidence and run notes

G2–G4: both pages at all five sizes, zero FAIL, zero WARN, zero exemptions (`alignment.txt`). Every individual open disclosure was checked at desktop/mobile (`verification.json`). Resting-page G1 scans and source scan have zero findings; open-state scan results are in `detect-open.json`. No detector rule is muted. The two long readers carry a narrowly scoped alignment exemption only while open: the checker counts unpainted text beyond an overflow scrollport as overlapping later content. Native clipping and keyboard scrolling were separately verified (`reader-check.json`). Resting pages have zero exemptions.

Hover/focus checks covered every visible link, button and disclosure across both pages and sizes; dimensions remained stable and the focus outline was 3px (`control-check.json`). The browser checks used Playwright on the Mac, blocked all non-GET requests, and recorded no page errors or attempted writes. API 503 then retry was exercised and recovered. The URL detector supplied browser rendering; no human-visible overlay was injected and no overlay server was started. This satisfies the brief's URL-scan procedure without claiming a visible overlay. The standard `.impeccable/critique` archive is outside owned paths, so this owned report is the snapshot. Slug resolution succeeded. There is no stored cross-session trend to report.

Questions skipped: COMMON.md explicitly forbids questions and requests autonomous fixes; the remaining P2 work is already assigned to stage 2. The PM runs the independent critic next.
