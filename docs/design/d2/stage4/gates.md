# d2 stage 4: the judge's full loop, gates, 2026-10-26

Built on e55ece0 (stage 3, merged). Previews ran on win-guest only (`dev.sh d2`, next dev on 5122 behind the proxy on 4122); since PM delta v8 nothing of d2's runs on the Mac. Data: production's API (the dev proxy forwards `/api/**` to caseclerk.vercel.app).

## What stage 4 adds

On a **test dispute** (`isTestDispute`), once the seller's yes has filed the evidence and PayPal is reviewing (state `review`), the case's leather plate gets one sandbox band under PayPal's answer: "Ask PayPal's sandbox to rule", Seller wins or Buyer wins, one Go. It says plainly that on a live account PayPal decides on its own. "Not open yet" (409) shows PayPal's state and asks again once a minute (at most 30 times, with Stop asking); 429 says when to ask again; 502, 503 and a lost connection say nothing was asked and offer Ask again; 403 has no button. After a 200 the band says "Ruling asked for the seller" with the time, the scale gains the stop "You asked for a ruling" (the adjudicate call as its record), and the page polls every 4 s for 15 minutes. When the RESOLVED webhook lands, the plate turns to "PayPal ruled for you" and the figure counts to what was kept once PayPal states the money; the kept plate keeps "Asked of the sandbox: by you, <time> PT". After the yes on a test dispute, the filed plate's line is "Next, ask PayPal's sandbox to rule, below." Full notes: DESIGN.md, "Stage 4 system notes".

**Never shown:** on a live dispute, on the reserved case (VPY, `RESERVED_CASES`), before a filing, after the close. Checked on the live data, GET-only:

| Case | Kind, state | Band |
|---|---|---|
| XCS ($449.00 Nikon FM2n) | test, review (before the ask) | shown, then asked |
| YDQ | test, review (filed on its own) | shown, idle (`case-ydq-control-*.png`) |
| MOL | live, review | none (`case-mol-no-control-1440.png`) |
| VPY | test, reserved, waiting for your yes | none |
| MFL | test, waiting for your yes | none (the band comes after the yes) |
| SGV | resolved | none |
| CTQ | live, waiting for the buyer (inquiry) | none |

## Real actions (all on PP-R-XCS-10194591, as the PM allowed)

| When (UTC) | What | Answer |
|---|---|---|
| 07:49:04 | approve (action 5bcc5906) | approved; PayPal `provide-evidence` 200 at 07:49:06, tracking PUT 204 |
| 07:49:19 | UPDATED webhook | under review |
| 07:49:19 | simulate adjudicate SELLER_FAVOR, take 1 | 409, allowed: provide_supporting_info |
| 07:50:35 to 08:06:56 | the same, once a minute, take 2 | 17 more 409s |
| 08:07:59 | the same | 200; PayPal `adjudicate` 200 at 08:08:02 (debug ca507f884fe2f), action 9b0d449a executed, audit `demo.adjudicate` "for the seller" |
| 08:10:25 | UPDATED webhook | still under review |

Totals: 1 approve, 19 simulate POSTs (18 × 409, 1 × 200). That is 19 of the API's 120 checks an hour and 1 of its 20 actions. PayPal opened the ruling step 18 min 56 s after the filing. No other POST anywhere: every shot, check and gate ran GET-only (non-GET aborted). PP-R-VPY-10194485 and the spare MFL were not touched; no test dispute was opened (1 of 2 still unused).

**RESOLVED: not arrived at the time of this commit** (XCS was still under review at 08:55Z, 47 min after the ask). The sandbox's timing varies: VAB resolved 47 min after its filing; JKB took about 24 h from adjudicate to RESOLVED. A GET-only recorder on win-guest watches XCS until about 10:00Z to catch it.

## The clip

`judge-loop-1440.mp4`: 46.6 s, 1440×900, H.264 25 fps, two segments of the real run on XCS.

1. Take 1, 32.5 s: the waiting case, the yes (Approve and file), PayPal's 200 and "Filed. PayPal is reviewing." with the guide line, the band, Seller wins, Ask for the ruling, the 409 and "Asking the sandbox to rule for the seller" (Not open yet, Under review, 1 check).
2. **Cut: about 18 minutes of waiting.** Take 1's page reloaded at 07:49:2x because I synced source to the dev server mid-recording (the recorder's context died); take 2 opened the same page and asked again at 07:50:35, and the band asked once a minute until PayPal opened the step.
3. Take 2, 14.1 s: the last checks, the 200, "Ruling asked for the seller" and the new stop on the scale.

**Not in the clip yet:** the RESOLVED webhook and the money (see above). Takes 1 and 2 were recorded on the Mac (before PM delta v8); the resolved take, if it comes, is win-guest's Linux rendering.

## Gates

The company gate (`gate.sh`, the pinned `impeccable.py gate`, win-guest). The shared dev proxy (4122) has no WebSocket upgrade, so next dev's pages don't hydrate through it (the board is then only its server shell). I ran the final gate through a private copy of the proxy with the upgrade added (4222, same `/api` forwarding), so every page was gated hydrated, the Bryntum board included.

| Viewport | URLs | Findings | Receipt |
|---|---|---|---|
| 1440x900 | `/`, `/cases`, `/policy`, `/board`, `/board?span=hours`, case VPY, XCS (asked), VAB, SGV, MFL, YDQ (band idle), MOL; hydrated | 0 | `gate-1440x900-1026-175058.json` |
| 390x844 | the same 12 | 0 | `gate-390x844-1026-175323.json` |
| 1440x900 | `/`, `/cases`, `/policy`, `/board`, case VPY, XCS, VAB, SGV; dev proxy | 0 | `gate-1440x900-1026-172146.json` |
| 390x844 | the same 8 | 0 | `gate-390x844-1026-172328.json` |
| 1440x900, 390x844 | case MFL, YDQ, MOL; dev proxy | 0 | `gate-1440x900-1026-174335.json`, `gate-390x844-1026-174406.json` |

Receipts are in `s3/redesign/receipts/`.

`check.sh` (G2 to G4; 1440, 1920, 1536, 2560, 390; win-guest):

| Page | Result |
|---|---|
| `/board`, `/board?span=hours` (hydrated: 81 to 117 text blocks) | 0 FAIL, 0 WARN, 1 exempt (stage 3's time-axis header) |
| `/`, `/cases`, `/policy` | 0 FAIL, 0 WARN |
| case XCS (asked), YDQ (band idle), MFL, MOL, VAB, SGV, VPY | 0 FAIL, 0 WARN |

**XCS before the ask** can't be gated now: the PM's test consumed it. Its waiting plate is the unchanged Decide component (gated as MFL, the same state), and `judge-before-1440.png` records it live. The first check of XCS after the filing found 6 G4 gaps in the band (8 + 12 px margins); fixed and re-checked to 0. The waiting band (`judge-checking-1440.png`) was seen live, not gated.

**Copy:** the band says "sandbox" in its label, its heading and its message; amounts carry cents; no middots, numbering, arrows or emoji; the action and debug ids appear only in the scale's record lines (G7).

## Also in stage 4

- **P2 from the board critique, the phone board's inner scroll frame:** below 900px the board takes its rows' height (Bryntum `autoHeight`) and the page scrolls; the time header scrolls away with the page. `board-390.png` (first screen), `board-390-full.png` (the whole board).
- **PM v7b and v8, stragglers:** `text-wrap: pretty` on the world's body copy (`p`, `li`, `dd`), and on `.td-fine` and `.sc-caption`. The landing's `p.td-fine` ("visitor." alone) and /policy's "PayPal." straggler are gone; 0 findings at both viewports.

## Files

- `judge-before-1440.png`: XCS waiting for your yes (take 1, before the approve).
- `judge-filed-1440.png`: after the yes: Filed, the guide line and the band.
- `judge-checking-1440.png`: Not open yet, Under review, 17 checks.
- `judge-asked-1440.png`: Ruling asked for the seller, the new stop on the scale.
- `case-ydq-control-1440.png`, `case-ydq-control-390.png`: another test dispute in review, the band idle.
- `case-mol-no-control-1440.png`: a live dispute in review, no band.
- `board-390.png`, `board-390-full.png`: the phone board without its inner frame.
- `judge-loop-1440.mp4`.

## Open

- XCS's RESOLVED webhook and money, to add as the clip's last take and a shot when it lands.
- The phone board's key still shows "Times in PT" (`.bd-key-fine` loses to `.bd-key li`); from stage 3, untouched.
