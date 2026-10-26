# d2 stage 2: what was done and the gates, 2026-10-26

Served build: see the report (host.sh d2 builds the branch HEAD). Pages: `/`, `/cases`, `/case/[id]`, `/policy`; `/d2/*` redirects; `/board` untouched (200).

## Real actions taken (the only non-GET requests sent)

| What | When (KST) | Result |
|---|---|---|
| Approve PP-R-VAB-10194570 (action 6848026d-ee06-4e70-8d06-65fcfa51c8a5, $399.00), in the recorder, hosted build | seller approval 13:14:59, PayPal answered 13:15:03 (04:15:03Z) | HTTP 200, PayPal status 200, debug id f95638041ab53. Case now `waiting_on_paypal`; PayPal's CUSTOMER.DISPUTE.UPDATED arrived at 13:15:37 |
| Test dispute 1 of 2, from the hosted inbox | opened 13:27:19 | 202: dispute PP-R-YDQ-10194582, capture 36R0041384649325R, order 56J16503PK8103402, $27.95 not received. PayPal's webhook arrived 212 s after the click; CaseClerk triaged it, then filed evidence on its own (under $250), PayPal 200, debug id ca506bc0bfb43 |

Not touched: PP-R-VPY-10194485 (client-side hold, verified: "held" mode sends nothing), PP-R-MFL-10194569 (spare). Test dispute 2 was not used. The 429 cap was shown with a locally answered 429 (no request sent).

Live Claude spend from these actions, read from the case audit: $0.052285 (YDQ: Haiku triage $0.000108 + one Opus run $0.052177). The VAB approval ran no model ($0).

## Gates

| Page / state | check.sh (5 sizes) | detect 1440 / 390 | G5–G9 |
|---|---|---|---|
| `/` landing (waiting MFL) | 0 FAIL | 0 / 0 | pass (h1 2 lines; 35 words of prose above the fold) |
| `/cases` inbox | 0 FAIL | 0 / 0 | pass; critique 30/40, P0 0, P1 0 |
| `/policy` | 0 FAIL | 0 / 0 | pass; critique 30/36, P0 0, P1 0 |
| case pending VPY (held) | 0 FAIL | 0 / 0 | pass |
| case pending MFL | 0 FAIL | (not run) | pass |
| case VAB after approval (approve-flow end state) | 0 FAIL | 0 / 0 | pass |
| case resolved, kept SGV | 0 FAIL | 0 / 0 | pass |
| case resolved, lost YSE | 0 FAIL | 0 / 0 | pass |
| case auto-filed JKB | 0 FAIL | 0 / 0 | pass |
| case error TMU, buyer CTQ, read ACH | 0 FAIL | (not run) | pass |
| case new test dispute YDQ | 0 FAIL | 0 / 0 | pass |

G5: no middots, numbering, tracked caps, arrows or emoji in the routes' source (arrows only in code comments). G6: headlines ≤ 2 lines at 1440, ≤ 3 at 390. G7: raw ids only in the record line, the record tables and fine print. G8: one Go per view; Quiet partners share its row (the landing's test-dispute control has its own band). G9: landing above the fold 35 words of prose.

Mocked approve flow on dev (POSTs answered locally): success at 1440 and 390, reduced motion, 502 (error shown, "Try filing again"), 409 (error shown, case reloaded), undo (nothing sent), VPY held (nothing sent). Tick labels on all 32 case scales checked for overlap at 390 and 1440: none.

## Files

- `approve-1440.mp4`: 18.8 s, 1440×900, H.264 25 fps; the real VAB approval from the click through confirm, the 5 s undo and sending to PayPal's 200 and the updated page. Frames: `approve-{confirm,undo,sending,answer}-1440.png`.
- `<page>-<state>-{1440,390}.png`: landing, inbox, inbox test-dispute wait and capped, landing test-dispute wait, policy, and the case in each state.
- `critique-inbox.md`, `critique-policy.md` (degraded: single context).

## Delta v5: critic round 2 fixes, 2026-10-26

Every row was reproduced against the hosted build and production data before it was fixed. No POST, PUT or DELETE was sent; every shot and check ran GET-only.

| Row | Reproduced? | Result |
|---|---|---|
| P0-1 Deadlines → /board | yes, on every page ≥ 900px | fixed: link removed from the top bar; `/board` untouched (200) |
| P0-2 $15 truth | yes: landing said "or $50", ledger line at $50; /policy at $15 | fixed: landing and /policy say "Over $250 to file evidence, or over $15 to refund or offer, it asks you first." from `/api/policy` (the lower of `autoRefundMaxUsd` and `approvalAboveUsd`, fallback 15/250); the landing ledger draws the $15 line like /policy |
| P0-3 scale thinning | yes on VAB (Filed folded into Closed once PayPal resolved it); YDQ's "read" is folded on purpose, not thinned | fixed, changed approach: `foldClose` drops only passing stops (now, read); milestones are spaced ≥ ~20px along the rail; labels that would run past the rail hang left. VAB, YDQ, JKB and all 32 scales clean at 1440, 1536, 1920, 2560, 390 |
| P0-4 proof per stop | yes: stale "Chargeback in" webhook on later stops; blank on cases with no CREATED webhook | fixed: every stop carries its own record (webhook, call, status, debug id, capture, outcome; else the line CaseClerk logged: the rule it stopped at, the error); the record line shows the selected stop's, unselected the stop under the index |
| P1-5 mobile money / Claim repeat | yes (SGV, YSE, TMU at 390) | fixed: the plate keeps its figure under 900px once nothing waits; no Claim row when the title is the claim. Also: Kept green only for money PayPal stated (VAB, JKB show the disputed amount in ink) |
| P1-6 ids in mobile wire record | yes | fixed: each entry on two lines, PayPal's id under time, what, status |
| P2-7 policy lane labels | yes ("Own") | fixed: a line in the lowest quarter leaves its under-zone unlabelled (named in the accessible label); head says "Asks over $15"; bead captions at the lane's right edge |
| P2-8 /cases WARN | not reproduced: /cases was 0 WARN at all 5 sizes; `.td-lede` is already a `<p>` | the landing's try band had the same G2 WARN at 1536/1920/2560; fixed by putting the control under its band's words |
| VAB kept with Filed | VAB resolved 05:02:34Z (RESOLVED webhook) | shows in, Asked you, You said yes. Filed, Closed for you |

Gates on hosted 933049e (ffbe17f for pages the last commit doesn't touch):

| Page | check.sh (1440, 1920, 1536, 2560, 390) | detect 1440 / 390 |
|---|---|---|
| `/`, `/cases`, `/policy` | 0 FAIL, 0 WARN | 0 / 0 |
| case VPY, VAB, SGV, YSE, YDQ, JKB, TMU | 0 FAIL, 0 WARN | 0 / 0 |

Shots refreshed: landing, inbox, policy and every case shot; new: `case-resolved-kept-vab-*`, `case-autofiled-kept-jkb-*` (JKB was resolved for the seller 05:23Z; replaces `case-autofiled-jkb-*`), `case-vab-stop-filed-1440` and `case-tmu-stop-in-1440` (a selected stop's own record), `landing-stop-read-1440`, `case-record-vpy-390` (mobile wire record). Not refreshed: the approve frames and video, `case-filed-vab-after-approval-*` and the test-dispute wait shots: they record live moments that can't be replayed without new real actions (the 1440 ones still show the old Deadlines link).
