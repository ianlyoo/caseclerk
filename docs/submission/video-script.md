# Demo video script: CaseClerk, locked cut A (revised for PM deltas v1–v3: the owner's narration, rehearsal D)

This is the locked cut and the source of truth for the film. The machine copy is `video/edit.json`. The two tables below are printed from it by `python3 -I video/scripts/build.py --md`, and `build.py` refuses any cut that breaks the rules below. To change a time or a line, edit `edit.json`, rebuild, and paste the tables back here.

- **Length:** 2:48.5. B5J plays the approval take's sandbox ruling control, so it stays.
- **Voice:** 영인 님 reads the 26 English lines (N01–N26) as 32 sentences: a line of two sentences is two rows, N01a and N01b. One take, recorded against rehearsal C (`s4/video/narration/caseclerk-owner-take1.m4a`, outside git). Each sentence is cut from the take at its row's Take span and moved to the row's start: time shifts only, no stretch, no pitch change. N26a and N26b are not in the take yet. The recording guide is `docs/submission/narration-guide.md`. No TTS.
- **Sound:** the narration; a quiet music bed we synthesize in code (`video/scripts/mix.py`, our own work), about 20 dB under the voice while it speaks; and six short CC0 cues on real picture events. Sources and licences are in `video/audio/cues.json` and `video/CREDITS.md`, loudness in `video/LISTEN.md`.
- **Picture:** the live product at https://caseclerk.vercel.app, recorded 10/26 at 1920×1080 against production with the real clock. The takes are listed in `video/footage.md`; the originals are in `s4/video/footage/`. B4 and B5J play D2's take of the real approval of the $412.00 case (10/26, production). Cuts between shots are short dissolves (0.3–0.4 s).
- **Pace:** the voice sets it. A voiced row lasts as long as its sentence does in the take; the plan's limit of 2.4 spoken words a second (amounts said in full, "API" as three words) still holds rows not yet voiced. The owner reads faster than the plan in places (N07 at about 4 words a second), and every caption stays at or under 19.3 characters a second. The film has 310 spoken words.
- **Text on screen:** one caption per sentence, never a sentence split across two; each shows the words the owner actually said (where they differ from the written line, `edit.json` keeps the written one as `script`), sits 112 px above the bottom edge (the two longest, N23 and N25, on two lines), and never covers the part of the page being talked about. No caption, title or text of ours names a camera brand or a carrier. Where a take's headline names one (the case pages lead with the item), the shot is cropped below it or, in B4, the headline is covered with a plate-coloured block; small incidental text in rows stays. PayPal and Claude appear as words, never as logos.

## Beats

**B1 · 0:00–0:13.6 · The problem, and who it's for.** A metal title card in the product's look. "$412.00 chargeback" and "Not as described. Due Nov 4, 8:59 pm PT." sit above a scale running from "Chargeback in, Oct 25" to "Due Nov 4". The orange index travels it while N01 plays. A leather band rises at N02: "No answer at all: PayPal rules for the buyer. The seller loses $412.00 and the fee." At N03 the card cuts to the wordmark and "CaseClerk answers PayPal disputes for small sellers, within the limits they set."

**B2 · 0:13.6–0:37.2 · A real sandbox dispute arrives (by 0:37).** The cases page with 33 disputes. The camera pushes in as the cursor clicks **Open a test dispute**. That was the take's one real `POST /api/test-dispute`, on 10/26 at 17:56:24 KST. The wait plate follows: a $289.00 chargeback filed, with PayPal's wire rows (201, 200, 200, 201). A cut carries the chip "+3 min / Real wait, cut. The page's own clock keeps counting."; the page's own clock reads 3 min 8 s. PayPal's webhook then lands, with "verified" and the signature check's 200. Last, the new case (PP-R-RSL-10194603) shows the stop "Asked you, 89 s after it arrived" and "Over your $250 evidence line".

**B3 · 0:37.2–1:04.2 · The agent's call on a harder case.** PP-R-VPY-10194485, waiting for a yes, framed below the item headline. Chargeback in, then Asked you, 98 s after it arrived. The camera pushes in to "About 35%" and "Weak: tracking proves delivery, not condition", then to the cost of each choice: filing $292.22 against refunding $442.87. At N11 it cuts to the same page scrolled down: "What CaseClerk will send PayPal" (order details, shipment and tracking, the seller statement) beside the panel's "Over your $250 evidence line, so CaseClerk asks first" and File the evidence (never clicked). That shot is cropped above the exact-text toggle, so the caption sits on an empty band under the evidence, not on it.

**B4 · 1:04.2–1:22.4 · The seller's yes.** D2's take of the real approval of PP-R-VPY-10194485 on production (10/26, 15:47 UTC), at 1.15× with the item headline covered. File the evidence, then Yes, file it, clicked at 1:06.5 as the owner says "A yes", the 5 s undo (`UNDO_MS = 5000`), Sending to PayPal, then PayPal's answer: "200 accepted", "Filed. PayPal is reviewing.", the debug id f411956448116, and the record line "Call POST /v1/customer/disputes/PP-R-VPY-10194485/provide-evidence, Status 200". The 200 arrives at 1:18.2 and settles at 1:19.2; N13b ("PayPal returns success…") starts at 1:19.4.

**B5 · 1:22.4–1:42.4 · PayPal's ruling.** The cut leaves the pending $412.00 case, and the screen says so: "An earlier case, same flow · The $399.00 case, ruled Oct 25." PP-R-VAB-10194570, closed, framed below the item headline: "PayPal ruled for you", $388.18 kept of $399.00. $388.18 belongs to VAB and is never said of VPY. The stops shown are Closed for you, then You said yes, whose record reads POST provide-evidence, 200, debug id f95638041ab53. Then Held, then released. VPY was ruled on too (PayPal for the seller, $400.84 kept of $412.00, Oct 26), but N15 as spoken names VAB's amount, so B5 stays on VAB.

**B5J · 1:42.4–1:48.6 · The judge loop.** The approval take's filed panel, which since 10/26 carries the sandbox control: "Sandbox control, test disputes only · Ask PayPal's sandbox to rule", Seller wins, Buyer wins and Ask for the ruling (never clicked). The camera eases in on it under N17.

**B6 · 1:48.6–2:07.0 · The seller's rules.** Your rules, "It asks before money moves". The camera moves to the two lanes: evidence asks at $250 and up, refunds and offers ask over $15. The cursor hovers each Asks you.

**B7 · 2:07.0–2:32.8 · How it works, and what it has done.** A drawn scale in the app's style, with five stops lit as the narration names them:
1. PayPal webhook: "Its signature checked with PayPal first".
2. Claude Haiku: "Sorts the case".
3. Claude Opus: "Reads the order and tracking with tools, writes the evidence".
4. Your limits: "Checked in code. Over a limit, it asks you".
5. PayPal Disputes API: "PayPal answers with a status and its debug id".

A band adds "Ruling: PayPal's webhooks bring it back, checked the same way." and "Spend: Hard caps on every AI call. Over a cap, the call is never sent." Then the real cases page, cropped to the nine rows of the documented cohort under Closed, each "For you, $… kept", with the chip "10 so far, each one kept / We asked the sandbox to rule on each. A working loop, not a win rate." N24 says no number; the chip's count is read from production at render time by `video/scripts/count_cases.py` (see the facts table).

The real enforcement (the panel's "Over your $250 evidence line, so CaseClerk asks first" and the record "Rule A $412.00 dispute is at or above your $250 review level for evidence") is already on screen in B2 and B3, so B7 adds no extra insert: five stops, two band rows and three lines already fill its 21 s.

**B8 · 2:32.8–2:48.5 · Close.** The landing replays PP-R-SGV-10194507: $397.00 disputed, $386.23 kept, 12 min 31 s from chargeback to closed. The landing's own hero copy still reads "asks before it moves money"; that is app text (`src/`), not ours. The end card follows: ▼ CaseClerk, "It answers your PayPal disputes, within the limits you set.", then caseclerk.vercel.app and "Built for the PayPal AI Hackathon. Runs on PayPal's sandbox." N26a and N26b belong over the card, which already shows their words, so they have no burned caption. They are not in the take yet (re-record asked); until they are, the card plays under the bed alone and the two sentences are left out of `captions.srt` and `captions.vtt`.

## Shots

| Beat | Shot | Film | Footage (in-point) | Camera |
|---|---|---|---|---|
| B1 | title | 0:00.0–0:13.6 | `video/compositions/title.html` | none |
| B2 | arrival-click | 0:13.6–0:21.6 | `footage/arrival.webm` from 1.6 s | 1x, 1.45x over 2.2 s; dissolves in over 0.4 s |
| B2 | arrival-plate | 0:21.6–0:24.6 | `footage/arrival.webm` from 13.55 s | 1.8x; dissolves in over 0.3 s |
| B2 | arrival-webhook | 0:24.6–0:33.6 | `footage/arrival.webm` from 201 s | 1.8x; dissolves in over 0.3 s |
| B2 | rsl-asked | 0:33.6–0:37.2 | `footage/rsl.webm` from 6.9 s | 1.3x; dissolves in over 0.3 s |
| B3 | vpy | 0:37.2–0:56.4 | `footage/vpy-b3-waiting.webm` from 4 s | 1.25x, 2x over 1 s; dissolves in over 0.35 s |
| B3 | vpy-evidence | 0:56.4–1:04.2 | `footage/vpy-b3-waiting.webm` from 28.2 s | 1.1x, cropped to y 0–884; dissolves in over 0.3 s |
| B4 | approve | 1:04.2–1:22.4 | `footage/vpy.webm` from 2.9 s | 1.15x, cropped to y 0–800, the headline covered; dissolves in over 0.35 s |
| B5 | vab | 1:22.4–1:42.4 | `footage/vab.webm` from 0.9 s | 1.3x; dissolves in over 0.35 s |
| B5J | judge | 1:42.4–1:48.6 | `footage/vpy.webm` from 19.1 s | 1.5x, 1.58x over 6.2 s, cropped to y 0–680; dissolves in over 0.35 s |
| B6 | rules | 1:48.6–2:07.0 | `footage/rules.webm` from 1 s | 1.4x, 1.8x over 1 s; dissolves in over 0.35 s |
| B7 | arch | 2:07.0–2:28.0 | `video/compositions/arch.html` | none; dissolves in over 0.35 s |
| B7 | cases | 2:28.0–2:32.8 | `footage/cases.webm` from 14.7 s | 1.2x, cropped to y 0–746; dissolves in over 0.35 s |
| B8 | landing | 2:32.8–2:40.4 | `footage/landing.webm` from 0.9 s | 1x; dissolves in over 0.35 s |
| B8 | end | 2:40.4–2:48.5 | `video/compositions/end.html` | none; dissolves in over 0.4 s |

The camera column gives each zoom from the cut, and each later move with how long it takes. Every move eases (power2.inOut). In `edit.json`, `cam` gives the exact frame position.

## Lines

Words are spoken words, with amounts read in full. The guide spells out how to say each amount (`edit.json` → `spoken`).

| Id | Beat | Start–end | Secs | Take | Words | wps | Line |
|---|---|---|---|---|---|---|---|
| N01a | B1 | 0:00.4–0:02.65 | 2.25 | 2.38–3.98 | 5 | 2.22 | The buyer files a chargeback. |
| N01b | B1 | 0:02.65–0:04.2 | 1.55 | 4.08–5.63 | 6 | 3.87 | The seller has days to answer. |
| N02 | B1 | 0:05.6–0:07.79 | 2.19 | 6.68–8.87 | 8 | 3.65 | Miss it, and PayPal rules for the buyer. |
| N03 | B1 | 0:09.7–0:12.39 | 2.69 | 10.92–13.61 | 7 | 2.60 | CaseClerk answers them for small PayPal sellers. |
| N04 | B2 | 0:14.0–0:16.26 | 2.26 | 15.57–17.83 | 7 | 3.10 | Here it is, live on PayPal's sandbox. |
| N05 | B2 | 0:17.7–0:20.95 | 3.25 | 19.23–22.48 | 11 | 3.38 | One click opens a real sandbox chargeback on a test order. |
| N06 | B2 | 0:24.8–0:28.74 | 3.94 | 26.57–30.51 | 11 | 2.79 | Three minutes later, PayPal's webhook arrives, and CaseClerk checks the signature. |
| N07 | B2 | 0:30.2–0:33.9 | 3.7 | 31.88–35.58 | 15 | 4.05 | A Claude agent reads the order and the tracking, then stops to ask the seller. |
| N08 | B3 | 0:37.8–0:42.53 | 4.73 | 39.71–44.44 | 15 | 3.17 | A harder one: a $412.00 camera the buyer says isn't as described. |
| N09a | B3 | 0:45.0–0:47.75 | 2.75 | 46.76–48.87 | 5 | 1.82 | Tracking proves delivery, not condition. |
| N09b | B3 | 0:47.75–0:50.21 | 2.46 | 49.53–51.99 | 6 | 2.44 | It estimates a 35% chance. |
| N10 | B3 | 0:51.2–0:54.63 | 3.43 | 53.02–56.45 | 10 | 2.92 | It still recommends filing, because the expected loss is smaller. |
| N11 | B3 | 0:56.0–1:00.12 | 4.12 | 57.90–62.02 | 16 | 3.88 | Over the $250 line, it stops and asks, with the evidence already written. |
| N12a | B4 | 1:04.8–1:05.69 | 0.89 | 66.77–67.62 | 3 | 3.37 | The seller decides. |
| N12b | B4 | 1:05.69–1:08.5 | 2.81 | 67.64–70.45 | 9 | 3.20 | A yes files it, with five seconds to undo. |
| N13a | B4 | 1:14.6–1:19.4 | 4.8 | 77.15–80.08 | 8 | 1.67 | CaseClerk files through PayPal's Disputes API. |
| N13b | B4 | 1:19.4–1:22.33 | 2.93 | 80.52–83.45 | 9 | 3.07 | PayPal returns success and its own debug ID. |
| N14 | B5 | 1:23.0–1:25.54 | 2.54 | 84.75–87.29 | 9 | 3.54 | We asked PayPal's sandbox to rule for the seller. |
| N15 | B5 | 1:27.6–1:32.15 | 4.55 | 89.21–93.76 | 14 | 3.08 | It ruled for a seller and released the hold: $388 kept. |
| N16 | B5 | 1:35.6–1:38.85 | 3.25 | 97.38–100.63 | 10 | 3.08 | This amount comes from PayPal's own hold and release records. |
| N17 | B5J | 1:42.8–1:45.63 | 2.83 | 104.55–107.38 | 13 | 4.59 | You can ask the sandbox to rule for your own test case, too. |
| N18 | B6 | 1:49.1–1:52.03 | 2.93 | 110.79–113.72 | 10 | 3.41 | The seller's limits are enforced in code, not a prompt. |
| N19 | B6 | 1:54.4–1:59.54 | 5.14 | 116.15–121.29 | 17 | 3.31 | Evidence under $250 and refunds up to $15 go out on their own. |
| N20 | B6 | 2:02.6–2:04.65 | 2.05 | 124.29–126.34 | 6 | 2.93 | Anything bigger waits for a yes. |
| N21 | B7 | 2:07.5–2:10.81 | 3.31 | 129.29–132.60 | 9 | 2.72 | Under the hood, every PayPal webhook is verified first. |
| N22a | B7 | 2:12.4–2:14.7 | 2.3 | 134.03–135.78 | 5 | 2.17 | Claude Haiku sorts the case. |
| N22b | B7 | 2:14.7–2:17.43 | 2.73 | 136.40–139.13 | 9 | 3.30 | Claude Opus works with tools, and writes the evidence. |
| N23 | B7 | 2:19.9–2:25.04 | 5.14 | 141.59–146.73 | 16 | 3.11 | Every action is checked against the limits before reaching PayPal, and AI spend is capped. |
| N24 | B7 | 2:27.3–2:32.42 | 5.12 | 149.15–154.27 | 12 | 2.34 | Real sandbox chargebacks have run this whole loop — every answer is kept. |
| N25 | B8 | 2:33.3–2:39.41 | 6.11 | 155.38–161.49 | 18 | 2.95 | For a one-person shop, every dispute gets an answer with every evidence ready, not a loss by default. |
| N26a | B8 | 2:41.2–2:42.0 | 0.8 | not in the take | 1 | 1.25 | CaseClerk. |
| N26b | B8 | 2:42.0–2:46.8 | 4.8 | not in the take | 10 | 2.08 | It answers your PayPal disputes, within the limits you set. |

Each row is one sentence and one caption; `build.py` refuses a row that holds two sentences. A caption opens 0.1 s before its sentence and hands over to the next sentence of the same line at the split; a line's last caption may hang 0.25 s, but never into the next line or past its beat. A sentence of more than 84 characters (N23, N25) is set on two balanced lines. The 30 voiced sentences, on the same clock, are in `video/captions.srt` and `video/captions.vtt` (cue ids in the .vtt are the row ids); N26a and N26b join them once they are recorded.

A voiced row starts where the owner's sentence starts on the film clock and ends where it ends; the Take column is the same sentence's span in the raw take. Where a line splits, the split is the owner's own pause between its sentences.

## Facts on screen and in the lines, and where each was checked

| Fact | Where | Checked against |
|---|---|---|
| $412.00, not as described, due Nov 4, 8:59 pm PT, chargeback in Oct 25 | B1 card, N08 | `GET /api/cases/PP-R-VPY-10194485` on 10/26: amount 412.00, MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED, sellerResponseDueDate 2026-11-05T04:59:59Z (PST), created 2026-10-25 |
| About 35%; filing $292.22 vs refunding $442.87 | N09b, N10, B3 | the same GET: winProbability 0.35, expectedValueUsd −292.22 / −442.87; also on screen in `vpy-b3-waiting.webm` |
| Asked you 98 s after it arrived (VPY), 89 s (RSL) | B3, B2 | `vpy-b3-waiting.webm`, `rsl.webm` |
| A real sandbox chargeback, about three minutes to the webhook, signature checked | N05, N06 | `arrival.webm`: the POST at 17:56:24 KST; 3 min 10 s of waiting; the webhook rows "verified" and the signature check's 200 |
| $250 evidence line, $15 refund line | N11, N19 | `rules.webm` (production policy) |
| Five seconds to undo | N12b | `src/app/d2/_ui/Decide.tsx`: `UNDO_MS = 5000` |
| Filing through the Disputes API; PayPal answers with success (200) and its own debug id | N13a, N13b, B4, B5 | `vpy.webm` (B4): POST provide-evidence, Status 200, debug id f411956448116, "200 accepted"; `vab.webm` (B5): the same call, 200, debug id f95638041ab53 |
| $388.18 kept of $399.00, held then released (said as "$388") | N15 | `vab.webm` (VAB only, never VPY) |
| The sandbox can be asked to rule on a test case | N17, B5J | `vpy.webm` from 19 s: the filed panel's "Sandbox control, test disputes only · Ask PayPal's sandbox to rule" with Seller wins, Buyer wins and Ask for the ruling |
| The amount comes from PayPal's own hold and release records | N16 | `GET /api/cases/PP-R-VAB-10194570` on 10/26: money.source `paypal_fund_movements`; the page row "Held, then released: $388.18, 6:56 pm to 9:56 pm PT" |
| The seller's limits enforced in code | N18, N23, B7 | `src/lib/agent/policy.ts` (`policyGate`: "every write action passes here before PayPal is called"); on screen as RSL's "Over your $250 evidence line" (B2) and VPY's record "Rule A $412.00 dispute is at or above your $250 review level" (B3) |
| Haiku sorts, Opus works with tools; spend caps | N22a, N22b, N23, B7 | `src/lib/agent/config.ts` (claude-haiku-5-5, claude-opus-5-5), `src/lib/spend/` |
| Webhooks verified first | N06, N21 | `src/lib/paypal/webhook.ts` (`/v1/notifications/verify-webhook-signature`) |
| Real sandbox chargebacks through the whole loop, every answer kept ("11 so far") | N24, B7 chip | `video/live/real-cases.json`, written by `video/scripts/count_cases.py` from production GETs at 2026-10-26T16:14:22Z. It reads only the ids in `docs/REAL-CASES.md` and counts a case when it is resolved by PayPal, CaseClerk's provide_evidence executed, and money from PayPal's fund movements shows a kept amount: 11 of 15 (AAJ, EGZ, IHX, IMW, LTK, NJA, SGV, TZD, UDP, VAB, VPY). Left out: GDS and RCJ (not filed by CaseClerk), MFL (waiting for a yes), YDQ (waiting on PayPal) |
| $397.00 disputed, $386.23 kept, 12 min 31 s | B8 | `landing.webm` |

N24 carries no number, so nothing in the lines changes when VPY is ruled on. Run `count_cases.py` right before each render; the chip shows whatever production says then.

## Phase B

Done in rehearsal D: the owner's narration (one take, synced sentence by sentence), the music bed, six cues, dissolves at the hard cuts, and the VPY approval take in B4 and B5J. Left: the re-recorded rows (N26a, N26b, N25, N23, N15; see `video/LISTEN.md`). When they land, set each row's `take` span (and its text to the words spoken), run `mix.py` on the new take, rebuild, check and render.
