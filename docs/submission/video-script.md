# Demo video script: CaseClerk (draft, ≤ 2:50)

For the owner's review. Nothing is recorded or uploaded by this draft.

- **Length:** 2:50 at most (the rules require under 3 minutes). The narration below is about 380 words, roughly 2:37 at a calm TTS pace of 145 words a minute, which leaves room for the pauses marked in the shot lists. The tightest beat is 8 (50 words in 19 s): read it a little faster or trim it.
- **Voice:** English TTS, one voice, no music (or only self-made music; no third-party tracks).
- **Screen:** the live product at https://caseclerk.vercel.app, desktop 1440×900, browser chrome hidden or neutral. Record the screen as video: the rules ask for the project shown running, so stills are fallbacks only.
- **Honesty lines that must stay in:** "sandbox" (beats 2 and 6), and that we asked the sandbox to rule (beat 6).
- **Reserved case:** PP-R-VPY-10194485 ($412.00, Olympus OM-1n body, chrome) is approved **only on camera**, once, in beat 5. Do a full dry run of beats 1 to 4 first, and don't click File the evidence on VPY until the take that counts. The pages hold VPY on purpose ("Kept waiting for a demo recording"), and the API refuses to approve or deny it (403) while it is listed in `RESERVED_CASE_IDS`. Lifting the hold for the take takes two steps (see the checklist): the PM sets `RESERVED_CASE_IDS=""` in Vercel and redeploys, and the page's own hold (`RESERVED_CASES` in `src/app/d2/_lib/routes.ts`) must be lifted in the same deploy (W3); otherwise the page answers the click with its "held" state and never calls the API.
- **TTS reading:** case ids are on screen only, never read aloud. Read amounts as written ("$412" → "four hundred twelve dollars").

Shot status key: **EXISTS** = a usable file is already in `docs/design/d2/**` (path given). **FALLBACK** = a still exists, but the beat needs live footage, so use the still only if recording fails. **RECORD** = must be recorded or made.

---

## Beat 1 · 0:00–0:15 · The problem

**Narration**
> A buyer opens a chargeback on a four-hundred-dollar camera. The seller has about ten days to answer with evidence. If nobody answers, PayPal rules for the buyer, and the seller loses the sale and the fee.

**Shots**
| # | Time | Shot | Status |
|---|---|---|---|
| 1a | 0:00–0:06 | Title card on the product's own metal ground: "A chargeback. Ten days to answer." (Archivo, product colours; no logos other than our own) | RECORD (make the card) |
| 1b | 0:06–0:15 | VPY case page, slow push-in on the line "No answer at all: PayPal rules for the buyer: you lose $412.00 and the fee" | RECORD · FALLBACK `docs/design/d2/stage2/case-pending-vpy-1440.png` |

## Beat 2 · 0:15–0:37 · The landing

**Narration**
> This is CaseClerk, an AI dispute desk for small PayPal sellers, running live on PayPal's sandbox. The landing replays one real case on a scale, like a camera's shutter dial: the chargeback arrives, the evidence goes in, PayPal closes the case, and the seller keeps the money.

**Shots**
| # | Time | Shot | Status |
|---|---|---|---|
| 2a | 0:15–0:28 | Landing at load: the index sweeps the scale from "Chargeback in" to "$386.23 kept" (the load replay; don't use reduced motion) | RECORD · FALLBACK `stage2/landing-waiting-1440.png` |
| 2b | 0:28–0:37 | Click the "Seller said yes. Filed" stop; its record opens | RECORD · FALLBACK `stage2/landing-stop-read-1440.png` |

## Beat 3 · 0:37–1:02 · A real dispute arriving

**Narration**
> Anyone can start one. Open a test dispute makes a real sandbox payment for a used camera, adds USPS tracking, and files a chargeback through PayPal's simulator. A few minutes later, PayPal's webhook arrives. CaseClerk verifies it with PayPal, and the case is on the desk. It's over the seller's line, so the agent will prepare the evidence and wait for a yes.

**Shots**
| # | Time | Shot | Status |
|---|---|---|---|
| 3a | 0:37–0:46 | Landing or Cases: press **Open a test dispute**; the button reads "Opening in PayPal's sandbox", then the wait message | RECORD (uses one of the recorder's three test disputes for the day) · FALLBACK `stage2/landing-testdispute-wait-1440.png` (shows the old Deadlines link) |
| 3b | 0:46–0:48 | On-screen caption "+3 min" over a cut (keep the real clock; don't hide the wait) | RECORD |
| 3c | 0:48–0:54 | Cases page after refresh: the new case at the top of Open | RECORD · FALLBACK `stage2/inbox-testdispute-1440.png` |
| 3d | 0:54–1:02 | The new case page: the camera, its amount over the $250 line, and the agent's state as PayPal's links allow (waiting for PayPal, or "File this evidence with PayPal?") | RECORD (no matching still: the stills show the old small test disputes, which filed on their own; since main `100cc31` a visitor's test dispute is a $289 to $449 camera that waits for a yes) |

Tip: open the test dispute about 6 minutes before recording beat 3, so 3c and 3d can be filmed without a long wait. Film 3a as its own take.

## Beat 4 · 1:02–1:32 · The agent's work, on the scale

**Narration**
> Here is one that has been waiting: four hundred twelve dollars, item not as described. Ninety-eight seconds after it arrived, the agent had read the order and the tracking. It is candid: tracking proves delivery, not condition, so it puts the chance at about thirty-five percent. Filing still costs less than refunding. It wrote the evidence PayPal will receive, and stopped, because this is over the seller's two-hundred-fifty-dollar line.

**Shots**
| # | Time | Shot | Status |
|---|---|---|---|
| 4a | 1:02–1:10 | VPY case page top: "$412.00 chargeback, not as described", "File this evidence with PayPal?" | RECORD · FALLBACK `stage2/case-pending-vpy-1440.png` |
| 4b | 1:10–1:18 | Scale: select "Chargeback in", then "Asked you, 98 s after it arrived"; the record shows the webhook id and the order and tracking reads | RECORD |
| 4c | 1:18–1:26 | The decision panel: "About 35%", "Weak: tracking proves delivery, not condition", expected loss "Filing $292.22, refunding $442.87" | RECORD |
| 4d | 1:26–1:32 | Scroll to "What CaseClerk will send PayPal": order details, shipment and tracking, seller statement, "Goes to PayPal as one PDF" | RECORD |

## Beat 5 · 1:32–1:52 · The seller's yes (approval on VPY, on camera)

**Narration**
> The seller decides. One click files it. There's a moment to undo, then CaseClerk calls PayPal's Disputes API. PayPal answers: HTTP two hundred, with its own debug id. That id is PayPal's record, not ours.

**Shots**
| # | Time | Shot | Status |
|---|---|---|---|
| 5a | 1:32–1:38 | Cursor to **File the evidence** on VPY; click; confirm | RECORD (the one real approval of PP-R-VPY-10194485, action `dce5fede-e03a-4d4e-8e99-d88af7bb177d`). Before the take: the PM sets `RESERVED_CASE_IDS=""` and redeploys (with W3's page-hold change in the same deploy); without it the API answers 403 "This case is held for the demo recording." |
| 5b | 1:38–1:43 | The undo window counting down; let it run out | RECORD |
| 5c | 1:43–1:52 | "Sending to PayPal", then PayPal's answer: HTTP 200, debug id, time; the scale's index moves to "Filed" | RECORD · reference only: `stage2/approve-1440.mp4` and `stage2/approve-{confirm,undo,sending,answer}-1440.png` (the same flow on VAB, $399.00; shows the old Deadlines link, so not for the final cut) |

Write down the debug id and time PayPal returns; beat 6 and the Devpost text can quote them.

## Beat 6 · 1:52–2:10 · PayPal's ruling

**Narration**
> In the sandbox, we then asked PayPal to rule. PayPal resolved the case and released the seller's hold. CaseClerk shows what the seller kept, using PayPal's own fund movements and the resolved webhook, and only when PayPal states it.

**Shots**
| # | Time | Shot | Status |
|---|---|---|---|
| 6a | 1:52–1:55 | Caption "About 10 minutes later. Sandbox ruling requested by us." | RECORD |
| 6b | 1:55–2:04 | VPY resolved: "PayPal ruled for you", "You kept $[from PayPal] of $412.00", the fee line | RECORD after the ruling lands (W1 adjudicates SELLER_FAVOR once the `adjudicate` link appears; earlier cases took 7 to 12.5 minutes, one took about 48) · FALLBACK `stage2/case-resolved-kept-sgv-1440.png` (a $397.00 case; change the narration's amounts if used) |
| 6c | 2:04–2:10 | Its record: the RESOLVED webhook id; "Held, then released" with times | RECORD · FALLBACK `stage2/case-vab-stop-filed-1440.png` |

## Beat 7 · 2:10–2:25 · The seller's rules

**Narration**
> The seller's rules are lines in code, not hints in a prompt. Evidence under two hundred fifty dollars, and refunds up to fifteen, go out on their own. Anything above waits for a yes.

**Shots**
| # | Time | Shot | Status |
|---|---|---|---|
| 7a | 2:10–2:25 | Rules page: the two lanes ("Filing evidence: asks at $250 and up", "Refunds and offers: asks over $15"), then "45% minimum to fight" | RECORD · FALLBACK `stage2/policy-readonly-1440.png` |

## Beat 8 · 2:25–2:44 · Impact and architecture

**Narration**
> Under the hood: PayPal webhooks in, Claude Haiku triages, Claude Opus decides and writes with tools, a policy gate checks, and PayPal's Disputes API files, all under a hard spend cap. Eleven sandbox chargebacks have run this loop. For a one-person shop, that's money kept instead of lost by default.

**Shots**
| # | Time | Shot | Status |
|---|---|---|---|
| 8a | 2:25–2:37 | Architecture slide: the README's mermaid diagram, rendered in the product's colours (webhook → triage on Haiku → decide on Opus → policy gate → Disputes API → webhooks back) | RECORD (make the slide) |
| 8b | 2:37–2:44 | Cases page, scrolled to Closed: the rows marked "For you" with "kept" amounts | RECORD · FALLBACK `stage2/inbox-all-1440.png` |

"Eleven" is the count in `docs/submission/devpost.md` (ten approved cases from `docs/REAL-CASES.md`, nine on 10/25 plus PP-R-VAB-10194570, and PP-R-JKB-10194463, filed on its own). Once VPY resolves it becomes twelve; update both files together.

## Beat 9 · 2:44–2:50 · End

**Narration**
> CaseClerk. It answers your PayPal disputes, and asks before it moves money.

**Shots**
| # | Time | Shot | Status |
|---|---|---|---|
| 9a | 2:44–2:50 | End card: "CaseClerk", caseclerk.vercel.app, "Built for the PayPal AI Hackathon. PayPal sandbox." | RECORD (make the card) |

---

## Recording checklist

1. Dry run beats 1 to 4 and 7 to 8 on the live site. Don't touch VPY's File button.
2. About 6 minutes before beat 3, open a test dispute so it arrives during the take; film the button press as a separate take.
3. Before beat 5, lift the hold: the PM sets `RESERVED_CASE_IDS=""` in Vercel (production) and redeploys, and W3 lifts the page hold (`RESERVED_CASES` and `RESERVED_ACTIONS` in `src/app/d2/_lib/routes.ts`) in the same deploy. Check that VPY no longer reads "Kept waiting for a demo recording", without clicking File.
4. Beat 5: the single real approval of VPY. Note PayPal's debug id and time. Right after the take, the PM can restore the hold (unset `RESERVED_CASE_IDS` again; the default is VPY) so nobody else approves or denies it.
5. Ask W1 to adjudicate VPY `SELLER_FAVOR` once PayPal shows the `adjudicate` link, then film beat 6 after the `RESOLVED` webhook. Fill in the kept amount.
6. Make the three cards (1a, 9a, 8a) in the product's colours and type.
7. Generate the TTS, cut to the timecodes, and check the total stays at or under 2:50.

## Files already in `docs/design/d2/**` (for reference)

| File | What it shows | Use |
|---|---|---|
| `stage2/landing-waiting-1440.png`, `landing-stop-read-1440.png` | landing, a selected stop | fallback 2a, 2b |
| `stage2/landing-testdispute-wait-1440.png` | test-dispute wait message (old Deadlines link) | fallback 3a |
| `stage2/inbox-testdispute-1440.png`, `inbox-all-1440.png` | Cases with a new test dispute; all cases | fallback 3c, 8b |
| `stage2/case-testdispute-ydq-1440.png`, `case-autofiled-kept-jkb-1440.png` | small cases the agent filed on its own | not a match for 3d any more (visitor test disputes now wait for a yes) |
| `stage2/case-pending-vpy-1440.png`, `case-record-vpy-390.png` | VPY waiting for the yes (desktop; mobile record) | fallback 1b, 4a |
| `stage2/approve-1440.mp4` + `approve-*-1440.png` | the approval flow on VAB (18.8 s) | reference for 5a–5c |
| `stage2/case-resolved-kept-sgv-1440.png`, `case-resolved-kept-vab-1440.png`, `case-vab-stop-filed-1440.png` | resolved cases, kept amounts, a stop's record | fallback 6b, 6c |
| `stage2/policy-readonly-1440.png` | Rules page | fallback 7a |
| `firstlook/first-look.mp4` | an earlier stage of the design | don't use |
