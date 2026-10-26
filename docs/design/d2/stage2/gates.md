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
