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

**RESOLVED: not arrived.** XCS was still under review at 14:00Z (23:00 KST), 5 h 52 min after the ask; PayPal's last update on it was 08:10Z. GET-only, I polled `/api/cases/PP-R-XCS-10194591` every 10 minutes and kept the case page open in a recorder on win-guest from 08:21Z to 09:18Z, 09:38Z to 10:32Z (production) and 10:32Z to 14:00Z (dev, the fixed scale); then I gave up, as the PM set. The sandbox's timing varies: VAB resolved 47 min after its filing; JKB took about 24 h from adjudicate to RESOLVED. So the asked band now says the sandbox rules "from minutes to a day later" (it said "often minutes later").

## The clip

`judge-loop-1440.mp4`: 44.4 s, 1440×900, H.264 25 fps, three segments of the real run on XCS.

1. Take 1, 32.5 s: the waiting case, the yes (Approve and file), PayPal's 200 and "Filed. PayPal is reviewing." with the guide line, the band, Seller wins, Ask for the ruling, the 409 and "Asking the sandbox to rule for the seller" (Not open yet, Under review, 1 check).
2. **Cut: about 18 minutes of waiting.** Take 1's page reloaded at 07:49:2x because I synced source to the dev server mid-recording (the recorder's context died); take 2 opened the same page and asked again at 07:50:35, and the band asked once a minute until PayPal opened the step.
3. Take 2, 7.0 s: the last checks, up to the frame before the 200 (after it, take 2 shows the asked band's earlier wording, "often minutes later").
4. **Cut: 2 h 25 min.** Take 3, 5.0 s: the same page opened again at 10:32Z on the fixed scale: "Ruling asked for the seller" in the current wording ("from minutes to a day later") and the stop "You asked for a ruling". The 200 itself is not on screen; the scale's record line and the audit carry it (above).

**Not in the clip:** the RESOLVED webhook and the money (see above). Takes 1 and 2 were recorded on the Mac (before PM delta v8); take 3 on win-guest. No frame shows the earlier wording.

## Gates

The company gate (`gate.sh`, the pinned `impeccable.py gate`, win-guest). The shared dev proxy (4122) has no WebSocket upgrade, so next dev's pages don't hydrate through it (the board is then only its server shell). I ran the final gate through a private copy of the proxy with the upgrade added (4222, same `/api` forwarding), so every page was gated hydrated, the Bryntum board included.

| Viewport | URLs | Findings | Receipt |
|---|---|---|---|
| 1440x900 | `/`, `/cases`, `/policy`, `/board`, `/board?span=hours`, case VPY, XCS (asked), VAB, SGV, MFL, YDQ (band idle), MOL; hydrated | 0 | `gate-1440x900-1026-175058.json` |
| 390x844 | the same 12 | 0 | `gate-390x844-1026-175323.json` |
| 1440x900 | `/`, `/cases`, `/policy`, `/board`, case VPY, XCS, VAB, SGV; dev proxy | 0 | `gate-1440x900-1026-172146.json` |
| 390x844 | the same 8 | 0 | `gate-390x844-1026-172328.json` |
| 1440x900, 390x844 | case MFL, YDQ, MOL; dev proxy | 0 | `gate-1440x900-1026-174335.json`, `gate-390x844-1026-174406.json` |
| 1440x900, 390x844 | case XCS (asked, the new wording), YDQ; hydrated | 0 | `gate-1440x900-1026-181911.json`, `gate-390x844-1026-181935.json` |

Receipts are in `s3/redesign/receipts/`.

`check.sh` (G2 to G4; 1440, 1920, 1536, 2560, 390; win-guest):

| Page | Result |
|---|---|
| `/board`, `/board?span=hours` (hydrated: 81 to 117 text blocks) | 0 FAIL, 0 WARN, 1 exempt (stage 3's time-axis header) |
| `/`, `/cases`, `/policy` | 0 FAIL, 0 WARN |
| case XCS (asked), YDQ (band idle), MFL, MOL, VAB, SGV, VPY | 0 FAIL, 0 WARN |

**XCS before the ask** can't be gated now: the PM's test consumed it. Its waiting plate is the unchanged Decide component (gated as MFL, the same state), and `judge-before-1440.png` records it live. The first check of XCS after the filing found 6 G4 gaps in the band (8 + 12 px margins); fixed and re-checked to 0. The waiting band (`judge-checking-1440.png`) was seen live, not gated.

**Copy:** the band says "sandbox" in its label, its heading and its message; amounts carry cents; no middots, numbering, arrows or emoji; the action and debug ids appear only in the scale's record lines (G7).

## PM v9 and v10 (after the merge of 304a3d9)

**v9, G3 at 768 on the landing:** the waiting case's Go ("Review the $289.00 case") was stretched to its column below 900px, which centres its label, so the label's start moved with the item and amount and landed 2.9px off the facts' second column. The Go now keeps its label's width on the column's edge at every size (the inbox's phone rows the same), so it holds for any name and amount.

**Found on the way, the scale's labels on production:** XCS's "You said yes. Filed" and "You asked for a ruling" touched at 1440, and at 1280 the ruling's leader ran through "Now"; TZD had a leader clash at 1280. The labels now come from a small search over rows and sides (`src/app/d2/_lib/rows.ts`): two rows, a third only where two can't hold them, and last, "Now" gives up its label. A GET-only checker over the landing and every case page (overlaps, and leaders through labels): production 3 clashes over 70 pages (1440, 1280); dev 0 over 175 pages (1440, 1280, 1536, 1920, 2560), a third row on 2, "Now" never hidden. Production needs the deploy for this.

**v10, the agent's working words:** a case the agent is working (status `acting`) said "Sending to PayPal". It now says which way it goes from the seller's evidence line: "Reading it, then asking you" (at or over, the visitor's $289 to $449 test disputes), "Reading it, then answering on its own" (under), "Reading PayPal's update" (already decided, PayPal changed the case). The test-dispute wait's third step, the inbox, the board, the scale's "Now" and the case plate all read it from `caseState(c, line)`. Checked by a unit run of the words (both sides of $250.00, a re-run, no line) and in the browser: the landing's wait with a saved wait and the page's own `/api/cases` answer replaced by a case in `acting` at $289.00 and $42.00 (nothing sent anywhere; no test dispute opened).

| Check | Pages | Result |
|---|---|---|
| `check.sh`, 1440, 1920, 1536, 2560, 390, 768, 1280 | `/`, `/cases`, `/policy`, case VPY, XCS, MFL, SGV, VAB, YDQ, MOL, TZD | 0 FAIL; 1 WARN at 1280 on VPY and MFL (G2, "Don't file"; the same on production) |
| `check.sh`, the 5 sizes | `/board`, `/board?span=hours` | 0 FAIL, 0 WARN, 1 exempt |
| `gate.sh` 1440x900, hydrated | the 13 above | 0, `gate-1440x900-1026-192553.json` |
| `gate.sh` 390x844, hydrated | the same 13 | 0, `gate-390x844-1026-192823.json` |

**v10, second item, "asks before it moves money":** not true (refunds and offers up to $15 go out on their own). Gone from the landing's lede, the rules heading on the landing and /policy, and both page descriptions (`src/app/layout.tsx`, its `description` only; `d2/_ui/Shell.tsx`). Now "CaseClerk answers your PayPal disputes, within the limits you set." and "Your lines decide when it asks.", over the body that names both lines. `check.sh` on `/` and `/policy` at the 7 sizes: 0 FAIL, 0 WARN. `gate.sh` on `/`, `/policy`, `/cases`: 0 at 1440x900 (`gate-1440x900-1026-230401.json`) and 390x844 (`gate-390x844-1026-230439.json`).

`judge-asked-1440.png` is now XCS on the fixed scale with the asked band's current wording (dev, 10:32Z).

## Also in stage 4

- **P2 from the board critique, the phone board's inner scroll frame:** below 900px the board takes its rows' height (Bryntum `autoHeight`) and the page scrolls; the time header scrolls away with the page. `board-390.png` (first screen), `board-390-full.png` (the whole board).
- **PM v7b and v8, stragglers:** `text-wrap: pretty` on the world's body copy (`p`, `li`, `dd`), and on `.td-fine` and `.sc-caption`. The landing's `p.td-fine` ("visitor." alone) and /policy's "PayPal." straggler are gone; 0 findings at both viewports.

## Files

- `judge-before-1440.png`: XCS waiting for your yes (take 1, before the approve).
- `judge-filed-1440.png`: after the yes: Filed, the guide line and the band.
- `judge-checking-1440.png`: Not open yet, Under review, 17 checks.
- `judge-asked-1440.png`: Ruling asked for the seller, the new stop on the scale (retaken after v9: the fixed labels, the current wording).
- `case-ydq-control-1440.png`, `case-ydq-control-390.png`: another test dispute in review, the band idle.
- `case-mol-no-control-1440.png`: a live dispute in review, no band.
- `board-390.png`, `board-390-full.png`: the phone board without its inner frame.
- `judge-loop-1440.mp4`.

## Open

- XCS's RESOLVED webhook and money, not arrived by 14:00Z: to add as the clip's last take and a shot if it lands.
- The phone board's key still shows "Times in PT" (`.bd-key-fine` loses to `.bd-key li`); from stage 3, untouched.
