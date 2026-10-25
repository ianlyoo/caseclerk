# Fresh-reader answers (run-sonnet-b)

Only the 10 screenshots in this folder were used.

## Pass 1 (640 px)

**1 Landing**
1. CaseClerk answers PayPal chargeback disputes for small sellers: it reads the case, order and tracking, files evidence, and asks the seller before money moves.
2. A replay of a real PayPal sandbox chargeback ($389 Olympus camera) with PayPal event ids, a "verified" webhook tag, and a "closed 12 minutes later" headline.
3. It's a sandbox, not live money. The "12 minutes" is one replay, and I can't tell whether it would work on a live account or win real disputes.

**2 Inbox**
1. It lists a seller's open PayPal disputes ($4,416.35 at stake, nine open, two waiting for the seller's answer).
2. Each row has a PayPal call name, an HTTP 200 and a debug id, and is labeled "Real sandbox case".
3. "Real sandbox case" is a contradictory label. Every case is sandbox, so I can't tell whether any case is live. The inbox also doesn't say what the software does on its own.

**3 Case pending**
1. It builds the evidence for a $412 Olympus chargeback and asks the seller whether to file it.
2. A timeline of verified PayPal webhooks and API calls, plus a clear file / don't-file choice.
3. I can't see the evidence itself (statement, tracking) at this width. I also can't tell what "7 routine calls" means or what happens if I do nothing.

**4 Case filed**
1. It shows a chargeback on a $17.95 ceramic dish where evidence was filed and PayPal is deciding.
2. Timeline rows with HTTP 200 on provide-evidence and verified webhooks.
3. It's a different case from the camera, so this isn't the "after approval" view of the same case. The timeline also includes "Sandbox control: you asked PayPal to rule for the seller", which means the outcome was staged.

**5 Resolved**
1. It reports a closed Olympus case where the seller keeps $378.43 ($389 less a $10.57 PayPal fee).
2. A verified RESOLVED webhook, the event id, and the fee arithmetic ($389 − $10.57 = $378.43).
3. The ruling was requested from the sandbox, so the win proves nothing about real outcomes. The claim that the agent spent $0.05 is unverifiable from the page.

## Pass 2 (1280 px)

**(a) Who decides when money moves?**
The user does. The pending case says "Over your $250.00 evidence line, so it waits for you", with "File the evidence" and "Don't file; accept the chargeback" buttons. The landing page says it "asks you before money moves". Unclear: below $250, the "evidence line" wording implies it files on its own. I can't see a Policy page, so I can't confirm that.

**(b) Headline result?**
The seller keeps $378.43 of a $389 sale, and the case closed 12 minutes after filing. The "less PayPal's usual fee" wording implies the comparison is a lost chargeback, but no baseline is shown. There's no stated win rate or typical resolution time, and no comparison to handling disputes manually.

**(c) Real vs sample/target?**
- Measurements (from PayPal sandbox traffic): event ids, timestamps, HTTP 200s, the $10.57 fee, the $0.05 agent cost, and "47 min ago" for the last webhook.
- Samples: all of the cases are sandbox. The landing page says the ruling was requested from the sandbox.
- Unclear: the deadline strip (Rollei $319, Hasselblad $1,240, Kodak $75, Fujifilm $689) has no ids and no "real" label, and those cases are not in the visible list. They may be placeholders. The "$250 evidence line" is a setting, not a result.

**(d) What would I click first?**
"Review the $412.00 case waiting for you", because it's the one live decision and shows the approval step. Second would be "All PayPal traffic on this case (30 calls and webhooks)" to check the evidence.

**(e) Confusion**
The Olympus amounts disagree: $389 (landing and resolved), $412 (pending, inbox), $397 and $398 (neighbor links), and the case ids differ (PP-R-NJA-10194486 vs PP-R-VPY-10194485). I can't tell if these are separate cameras or an error. Also, the "after approval" screenshot is actually the $17.95 dish, not the camera.
