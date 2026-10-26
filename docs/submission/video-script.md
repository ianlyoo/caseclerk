# Demo video script: CaseClerk, locked cut A (revised for PM deltas v1 and v2)

This is the locked cut and the source of truth for the film. The machine copy is `video/edit.json`. The two tables below are printed from it by `python3 -I video/scripts/build.py --md`, and `build.py` refuses any cut that breaks the rules below. To change a time or a line, edit `edit.json`, rebuild, and paste the tables back here.

- **Length:** 2:48.5 with the judge-loop slot (B5J), or 2:42.3 if that beat is dropped (`"skip": true` on B5J).
- **Voice:** 영인 님 reads the 26 English lines (N01–N26) as 32 sentences: a line of two sentences is two rows, N01a and N01b, recorded and timed one sentence at a time. The recording guide is `docs/submission/narration-guide.md`. The final cut has no TTS and no music at all.
- **Sound:** nine short CC0 interface sounds, one on each real click (licences in `video/audio/cues.json`).
- **Picture:** the live product at https://caseclerk.vercel.app, recorded 10/26 at 1920×1080 against production with the real clock. The takes are listed in `video/footage.md`; the originals are in `s4/video/footage/`. Only B4 is a stand-in until phase B.
- **Pace:** at most 2.4 spoken words a second per line, counted with amounts said in full ("$388.18" is seven words) and letters said one by one ("API" is three), with at least 0.3 s between lines (a line's two sentences abut). The film has 312 spoken words.
- **Text on screen:** one caption per sentence, never a sentence split across two; each repeats its sentence word for word, sits 112 px above the bottom edge (the two longest, N23 and N25, on two lines), and never covers the part of the page being talked about. No caption, title or text of ours names a camera brand or a carrier. Where a take's headline names one (the case pages lead with the item), the shot is cropped below it; small incidental text in rows stays. PayPal and Claude appear as words, never as logos.

## Beats

**B1 · 0:00–0:13.6 · The problem, and who it's for.** A metal title card in the product's look. "$412.00 chargeback" and "Not as described. Due Nov 4, 8:59 pm PT." sit above a scale running from "Chargeback in, Oct 25" to "Due Nov 4". The orange index travels it while N01 plays. A leather band rises at N02: "No answer at all: PayPal rules for the buyer. The seller loses $412.00 and the fee." At N03 the card cuts to the wordmark and "CaseClerk answers PayPal disputes for small sellers, within the limits they set."

**B2 · 0:13.6–0:37.2 · A real sandbox dispute arrives (by 0:37).** The cases page with 33 disputes. The camera pushes in as the cursor clicks **Open a test dispute**. That was the take's one real `POST /api/test-dispute`, on 10/26 at 17:56:24 KST. The wait plate follows: a $289.00 chargeback filed, with PayPal's wire rows (201, 200, 200, 201). A cut carries the chip "+3 min / Real wait, cut. The page's own clock keeps counting."; the page's own clock reads 3 min 8 s. PayPal's webhook then lands, with "verified" and the signature check's 200. Last, the new case (PP-R-RSL-10194603) shows the stop "Asked you, 89 s after it arrived" and "Over your $250 evidence line".

**B3 · 0:37.2–1:04.2 · The agent's call on a harder case.** PP-R-VPY-10194485, waiting for a yes, framed below the item headline. Chargeback in, then Asked you, 98 s after it arrived. The camera pushes in to "About 35%" and "Weak: tracking proves delivery, not condition", then to the cost of each choice: filing $292.22 against refunding $442.87. At N11 it cuts to the same page scrolled down: "What CaseClerk will send PayPal" (order details, shipment and tracking, the seller statement) beside the panel's "Over your $250 evidence line, so CaseClerk asks first" and File the evidence (never clicked). That shot is cropped above the exact-text toggle, so the caption sits on an empty band under the evidence, not on it.

**B4 · 1:04.2–1:22.4 · The seller's yes. Phase B replaces this footage.** For now it holds a stand-in: the real approval of the $399.00 case (VAB) on 10/25, from an older build at 1440×900, with the tag "Stand-in: the $399.00 case, Oct 25 · Phase B records the $412.00 case." in the band the headline crop leaves. The take shows File the evidence, Yes, file it, the 5 s undo (`UNDO_MS = 5000`), Sending, then PayPal's answer: "200 accepted", the debug id f95638041ab53, and the record line "Call POST …/provide-evidence, Status 200". The crop opens 34 px while the panel is blank, so the 200 shows whole. N13b ("PayPal returns success…") starts at 1:18.65, on PayPal's answer panel, and the 200 settles 0.45 s in (1:19.1), not on Sending. Phase B swaps in the same flow on VPY at 1920×1080, and the tag goes.

**B5 · 1:22.4–1:42.4 · PayPal's ruling.** The cut leaves the pending $412.00 case, and the screen says so: "An earlier case, same flow · The $399.00 case, ruled Oct 25." PP-R-VAB-10194570, closed, framed below the item headline: "PayPal ruled for you", $388.18 kept of $399.00. $388.18 belongs to VAB and is never said of VPY. The stops shown are Closed for you, then You said yes, whose record reads POST provide-evidence, 200, debug id f95638041ab53. Then Held, then released.

**B5J · 1:42.4–1:48.6 · Judge-loop slot (conditional).** It keeps its slot and holds a placeholder card for now. Phase B fills it if the judge-loop footage exists: a visitor asking the sandbox to rule on their own test case, and N17 stays. Otherwise set `"skip": true`; the beat drops with N17, and the film runs 2:42.3.

**B6 · 1:48.6–2:07.0 · The seller's rules.** Your rules, "It asks before money moves". The camera moves to the two lanes: evidence asks at $250 and up, refunds and offers ask over $15. The cursor hovers each Asks you.

**B7 · 2:07.0–2:32.8 · How it works, and what it has done.** A drawn scale in the app's style, with five stops lit as the narration names them:
1. PayPal webhook: "Its signature checked with PayPal first".
2. Claude Haiku: "Sorts the case".
3. Claude Opus: "Reads the order and tracking with tools, writes the evidence".
4. Your limits: "Checked in code. Over a limit, it asks you".
5. PayPal Disputes API: "PayPal answers with a status and its debug id".

A band adds "Ruling: PayPal's webhooks bring it back, checked the same way." and "Spend: Hard caps on every AI call. Over a cap, the call is never sent." Then the real cases page, cropped to the nine rows of the documented cohort under Closed, each "For you, $… kept", with the chip "10 so far, each one kept / We asked the sandbox to rule on each. A working loop, not a win rate." N24 says no number; the chip's count is read from production at render time by `video/scripts/count_cases.py` (see the facts table).

The real enforcement (the panel's "Over your $250 evidence line, so CaseClerk asks first" and the record "Rule A $412.00 dispute is at or above your $250 review level for evidence") is already on screen in B2 and B3, so B7 adds no extra insert: five stops, two band rows and three lines already fill its 21 s.

**B8 · 2:32.8–2:48.5 · Close.** The landing replays PP-R-SGV-10194507: $397.00 disputed, $386.23 kept, 12 min 31 s from chargeback to closed. The landing's own hero copy still reads "asks before it moves money"; that is app text (`src/`), not ours. The end card follows: ▼ CaseClerk, "It answers your PayPal disputes, within the limits you set.", then caseclerk.vercel.app and "Built for the PayPal AI Hackathon. Runs on PayPal's sandbox." N26a and N26b are spoken over the card, which already shows their words, so they have no burned caption (they are in `captions.srt` and `captions.vtt`).

## Shots

| Beat | Shot | Film | Footage (in-point) | Camera |
|---|---|---|---|---|
| B1 | title | 0:00.0–0:13.6 | `video/compositions/title.html` | none |
| B2 | arrival-click | 0:13.6–0:21.6 | `footage/arrival.webm` from 1.6 s | 1x, 1.45x over 2.2 s |
| B2 | arrival-plate | 0:21.6–0:24.6 | `footage/arrival.webm` from 13.55 s | 1.8x |
| B2 | arrival-webhook | 0:24.6–0:33.6 | `footage/arrival.webm` from 201 s | 1.8x |
| B2 | rsl-asked | 0:33.6–0:37.2 | `footage/rsl.webm` from 6.9 s | 1.3x |
| B3 | vpy | 0:37.2–0:56.4 | `footage/vpy.webm` from 4 s | 1.25x, 2x over 1 s |
| B3 | vpy-evidence | 0:56.4–1:04.2 | `footage/vpy.webm` from 28.2 s | 1.1x, cropped to y 0–884 |
| B4 | approve | 1:04.2–1:22.4 | `docs/design/d2/stage2/approve-1440.mp4` from 0.6 s | 1.15x, cropped to y 120–1080, then y 86–1080 over 0.15 s |
| B5 | vab | 1:22.4–1:42.4 | `footage/vab.webm` from 0.9 s | 1.3x |
| B5J | judge | 1:42.4–1:48.6 | `video/compositions/judge.html` | none |
| B6 | rules | 1:48.6–2:07.0 | `footage/rules.webm` from 1 s | 1.4x, 1.8x over 1 s |
| B7 | arch | 2:07.0–2:28.0 | `video/compositions/arch.html` | none |
| B7 | cases | 2:28.0–2:32.8 | `footage/cases.webm` from 14.7 s | 1.2x, cropped to y 0–746 |
| B8 | landing | 2:32.8–2:40.4 | `footage/landing.webm` from 0.9 s | 1x |
| B8 | end | 2:40.4–2:48.5 | `video/compositions/end.html` | none |

The camera column gives each zoom from the cut, and each later move with how long it takes. Every move eases (power2.inOut). In `edit.json`, `cam` gives the exact frame position.

## Lines

Words are spoken words, with amounts read in full. The guide spells out how to say each amount (`edit.json` → `spoken`).

| Id | Beat | Start–end | Secs | Words | wps | Line |
|---|---|---|---|---|---|---|
| N01a | B1 | 0:00.4–0:02.65 | 2.25 | 5 | 2.22 | A buyer files a chargeback. |
| N01b | B1 | 0:02.65–0:05.2 | 2.55 | 6 | 2.35 | The seller has days to answer. |
| N02 | B1 | 0:05.6–0:09.2 | 3.6 | 8 | 2.22 | Miss it, and PayPal rules for the buyer. |
| N03 | B1 | 0:09.7–0:13.3 | 3.6 | 7 | 1.94 | CaseClerk answers them for small PayPal sellers. |
| N04 | B2 | 0:14.0–0:17.3 | 3.3 | 7 | 2.12 | Here it is, live on PayPal's sandbox. |
| N05 | B2 | 0:17.6–0:22.5 | 4.9 | 11 | 2.24 | One click opens a real sandbox chargeback on a test order. |
| N06 | B2 | 0:24.8–0:29.7 | 4.9 | 11 | 2.24 | Three minutes later, PayPal's webhook arrives, and CaseClerk checks its signature. |
| N07 | B2 | 0:30.2–0:36.8 | 6.6 | 15 | 2.27 | A Claude agent reads the order and the tracking, then stops to ask the seller. |
| N08 | B3 | 0:37.8–0:44.4 | 6.6 | 15 | 2.27 | A harder one: a $412.00 camera the buyer says isn't as described. |
| N09a | B3 | 0:45.0–0:47.75 | 2.75 | 5 | 1.82 | Tracking proves delivery, not condition. |
| N09b | B3 | 0:47.75–0:50.6 | 2.85 | 6 | 2.11 | It estimates a 35% chance. |
| N10 | B3 | 0:51.2–0:55.4 | 4.2 | 10 | 2.38 | It still recommends filing, because the expected loss is smaller. |
| N11 | B3 | 0:56.0–1:03.2 | 7.2 | 16 | 2.22 | Over the $250 line, it stops and asks, with the evidence already written. |
| N12a | B4 | 1:04.8–1:06.45 | 1.65 | 3 | 1.82 | The seller decides. |
| N12b | B4 | 1:06.45–1:10.2 | 3.75 | 9 | 2.40 | A yes files it, with five seconds to undo. |
| N13a | B4 | 1:15.3–1:18.65 | 3.35 | 8 | 2.39 | CaseClerk files through PayPal's Disputes API. |
| N13b | B4 | 1:18.65–1:22.4 | 3.75 | 9 | 2.40 | PayPal returns success and its own debug ID. |
| N14 | B5 | 1:23.0–1:27.1 | 4.1 | 9 | 2.20 | We asked PayPal's sandbox to rule for the seller. |
| N15 | B5 | 1:27.6–1:35.1 | 7.5 | 17 | 2.27 | It ruled for the seller and released the hold: $388.18 kept. |
| N16 | B5 | 1:35.6–1:41.1 | 5.5 | 10 | 1.82 | This amount comes from PayPal's own hold and release records. |
| N17 | B5J | 1:42.8–1:48.6 | 5.8 | 13 | 2.24 | You can ask the sandbox to rule on your own test case, too. |
| N18 | B6 | 1:49.1–1:53.6 | 4.5 | 10 | 2.22 | The seller's limits are enforced in code, not a prompt. |
| N19 | B6 | 1:54.4–2:02.0 | 7.6 | 17 | 2.24 | Evidence under $250 and refunds up to $15 go out on their own. |
| N20 | B6 | 2:02.6–2:05.6 | 3.0 | 6 | 2.00 | Anything bigger waits for a yes. |
| N21 | B7 | 2:07.5–2:11.9 | 4.4 | 9 | 2.05 | Under the hood, every PayPal webhook is verified first. |
| N22a | B7 | 2:12.4–2:14.7 | 2.3 | 5 | 2.17 | Claude Haiku sorts the case. |
| N22b | B7 | 2:14.7–2:19.4 | 4.7 | 10 | 2.13 | Claude Opus works it with tools, and writes the evidence. |
| N23 | B7 | 2:19.9–2:26.7 | 6.8 | 16 | 2.35 | Every action is checked against those limits before reaching PayPal, and AI spend is capped. |
| N24 | B7 | 2:27.3–2:32.2 | 4.9 | 11 | 2.24 | Real sandbox chargebacks have run this whole loop, every answer kept. |
| N25 | B8 | 2:33.3–2:40.7 | 7.4 | 17 | 2.30 | For a one-person shop, every dispute gets an answer with evidence ready, not a loss by default. |
| N26a | B8 | 2:41.2–2:42.0 | 0.8 | 1 | 1.25 | CaseClerk. |
| N26b | B8 | 2:42.0–2:46.8 | 4.8 | 10 | 2.08 | It answers your PayPal disputes, within the limits you set. |

Each row is one sentence and one caption; `build.py` refuses a row that holds two sentences. A caption opens 0.1 s before its sentence and hands over to the next sentence of the same line at the split; a line's last caption may hang 0.25 s, but never into the next line or past its beat. A sentence of more than 84 characters (N23, N25) is set on two balanced lines. The same 32 sentences, on the same clock, are in `video/captions.srt` and `video/captions.vtt` (cue ids in the .vtt are the row ids).

Where a line splits, the split is the sentences' share of the line's time by spoken length, held to 2.4 words a second on both sides and rounded to 0.05 s. N12 and N13 sit at that limit: N12b and N13b both read at 2.40.

## Facts on screen and in the lines, and where each was checked

| Fact | Where | Checked against |
|---|---|---|
| $412.00, not as described, due Nov 4, 8:59 pm PT, chargeback in Oct 25 | B1 card, N08 | `GET /api/cases/PP-R-VPY-10194485` on 10/26: amount 412.00, MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED, sellerResponseDueDate 2026-11-05T04:59:59Z (PST), created 2026-10-25 |
| About 35%; filing $292.22 vs refunding $442.87 | N09b, N10, B3 | the same GET: winProbability 0.35, expectedValueUsd −292.22 / −442.87; also on screen in `vpy.webm` |
| Asked you 98 s after it arrived (VPY), 89 s (RSL) | B3, B2 | `vpy.webm`, `rsl.webm` |
| A real sandbox chargeback, about three minutes to the webhook, signature checked | N05, N06 | `arrival.webm`: the POST at 17:56:24 KST; 3 min 10 s of waiting; the webhook rows "verified" and the signature check's 200 |
| $250 evidence line, $15 refund line | N11, N19 | `rules.webm` (production policy) |
| Five seconds to undo | N12b | `src/app/d2/_ui/Decide.tsx`: `UNDO_MS = 5000` |
| Filing through the Disputes API; PayPal answers with success (200) and its own debug id | N13a, N13b, B4, B5 | `vab.webm`: POST provide-evidence, 200, debug id f95638041ab53; the B4 stand-in shows the same answer ("200 accepted") |
| $388.18 kept of $399.00, held then released | N15 | `vab.webm` (VAB only, never VPY) |
| The amount comes from PayPal's own hold and release records | N16 | `GET /api/cases/PP-R-VAB-10194570` on 10/26: money.source `paypal_fund_movements`; the page row "Held, then released: $388.18, 6:56 pm to 9:56 pm PT" |
| The seller's limits enforced in code | N18, N23, B7 | `src/lib/agent/policy.ts` (`policyGate`: "every write action passes here before PayPal is called"); on screen as RSL's "Over your $250 evidence line" (B2) and VPY's record "Rule A $412.00 dispute is at or above your $250 review level" (B3) |
| Haiku sorts, Opus works with tools; spend caps | N22a, N22b, N23, B7 | `src/lib/agent/config.ts` (claude-haiku-5-5, claude-opus-5-5), `src/lib/spend/` |
| Webhooks verified first | N06, N21 | `src/lib/paypal/webhook.ts` (`/v1/notifications/verify-webhook-signature`) |
| Real sandbox chargebacks through the whole loop, every answer kept ("10 so far") | N24, B7 chip | `video/live/real-cases.json`, written by `video/scripts/count_cases.py` from production GETs at 2026-10-26T14:07:02Z. It reads only the ids in `docs/REAL-CASES.md` and counts a case when it is resolved by PayPal, CaseClerk's provide_evidence executed, and money from PayPal's fund movements shows a kept amount: 10 of 15 (AAJ, EGZ, IHX, IMW, LTK, NJA, SGV, TZD, UDP, VAB). Left out: GDS and RCJ (not filed by CaseClerk), MFL and VPY (waiting for a yes), YDQ (waiting on PayPal) |
| $397.00 disputed, $386.23 kept, 12 min 31 s | B8 | `landing.webm` |

N24 carries no number, so nothing in the lines changes when VPY is ruled on. Run `count_cases.py` right before each render; the chip shows whatever production says then.

## Phase B

1. **The VPY approval take (B4).** This needs the PM to lift VPY's hold first (`RESERVED_CASE_IDS` and the page hold in the same deploy). Record at 1920×1080 with `video/capture/rec.cjs`: File the evidence → Yes, file it → the 5 s undo runs out → Sending → PayPal's 200 and debug id, about 20 s of picture. Then set `sources.standin` to the new take, remove `ov-standin`, set the shot's in-point, give it a `window` below the item headline as B3 has, and retime N12a–N13b to the clicks, with N13b on the 200. B5's "An earlier case, same flow" note stays.
2. **Narration.** Transcribe 영인 님's takes (`hyperframes transcribe`), move each row's start and end in `edit.json` to that sentence's words (one take per row id, N01a, N01b, …), rebuild, check, render. Lines may move within their beat; if one runs long, the beat's footage gets the time, not a faster read.
3. **B5J.** Fill it with the judge-loop footage if it exists; otherwise skip it and drop N17.
4. **The count.** `python3 -I video/scripts/count_cases.py`, then build and render.
