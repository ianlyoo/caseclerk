# Fresh-reader answers — CaseClerk screenshots

## Pass 1 (640 px, 5-second glances)

### 1-landing-640
(1) CaseClerk handles PayPal chargeback disputes for small online sellers: it reads the case, order and tracking, files evidence, and asks the seller before money moves.
(2) The footer shows a replay of a named PayPal case id (PP-R-NJA-10194486) recorded Oct 25, 2026, a "last real webhook 47 min ago" status, and a live "Review the $412.00 case waiting for you" button.
(3) Everything is labelled "sandbox" and the proof at this width is a headline claim ("closed the case 12 minutes later") with no visible evidence of a real-money, live-account outcome.

### 2-inbox-640
(1) A dispute inbox for a seller: open PayPal chargebacks listed with amount, status, and the last PayPal API call made.
(2) Each row shows a PayPal API call with a 200 status and a debug id, product photos, and timestamps, and each is tagged "Real sandbox case".
(3) The headline says nine open disputes and $4,416.35 at stake, but only three rows are visible, and nothing shows the software has ever won or lost a case here.

### 3-case-pending-640
(1) A case page where the software has prepared evidence for a $412 chargeback and is waiting for the seller to approve or decline filing it.
(2) A verified PayPal webhook, seven named API calls with a debug id, and the explicit rule "Over your $250.00 evidence line, so it waits for you."
(3) I can't see what evidence was built (no preview of the seller statement, order, or tracking), so I can't judge whether approving it is wise.

### 4-case-filed-640
(1) A case page after the evidence was filed for a $17.95 chargeback; PayPal is now deciding.
(2) The timeline shows a provide-evidence 200 call followed by verified PayPal webhooks moving the case to "under review".
(3) An "adjudicate" call labelled "Sandbox control: you asked PayPal to rule for the seller" means the outcome here was forced by the tester, not won on the evidence.

### 5-case-resolved-640
(1) A resolved case: the seller kept $378.43 of a $389 sale after PayPal closed the chargeback.
(2) A verified CUSTOMER.DISPUTE.RESOLVED webhook with id, exact close timestamp, a fee breakdown ($10.57 PayPal fee, no chargeback fee), and the agent's cost ($0.05).
(3) The page itself says "Sandbox only: we asked PayPal's sandbox to rule," so the win was scripted, and the $389 case here differs from the $412 case I was told to review, which I can't reconcile.

## Pass 2 (1280 px)

**(a) Who decides when money moves?** The user, above a threshold. The landing copy says it "asks you before money moves." The pending case page says "Over your $250.00 evidence line, so it waits for you," with buttons "File the evidence on $412.00" and "Don't file; accept the chargeback." Implication: below $250 the software files on its own (the $17.95 ring dish shows "CaseClerk filed the evidence" with no approval step visible). The $250 line is only mentioned in passing; I can't see where it is set. Also note that strictly PayPal decides the money; CaseClerk only decides whether to contest.

**(b) Headline result, compared to what?** "A buyer's bank charged back a $389 Olympus camera. The seller said yes; CaseClerk filed the evidence, and PayPal closed the case 12 minutes later." Resolved page: seller kept $378.43 of $389.00. It is compared to nothing: no baseline for how long manual responses take, no win rate, no count of cases won vs lost. The 12 minutes is one sandbox case where the tester told PayPal to rule for the seller.

**(c) Real measurements vs samples/targets.**
- Real measurements (visible as PayPal-sourced data): webhook ids and event names marked "verified", API call paths with 200 status and debug ids, timestamps (01:37:05 created, 01:40:27 evidence filed, 01:52:39 resolved), the $10.57 fee and $378.43 released, "last real webhook 47 min ago", "30 calls and webhooks" on the replay.
- Real but staged: the outcome itself. "adjudicate ... Sandbox control: you asked PayPal to rule for the seller" and "Sandbox only" disclaimers mean the win and the 12-minute close are sandbox artefacts, not a live result.
- Samples/unverifiable: "Nine open disputes, $4,416.35 at stake" (only three rows shown), the deadlines calendar (Rollei $319, Hasselblad $1,240, Kodak $75, Fujifilm $689, none of which appear in the list), "The agent spent $0.05 on it" (no source shown), "Claude Haiku 5.5 triages; Opus 5.5 decides" (a claim, not a measurement). The $250 evidence line is a setting, not a result.

**(d) What I'd click first.** "Review the $412.00 case waiting for you" on the landing page. It's the primary button, there's real money attached, and the pending page is where I'd learn whether the product shows me the actual evidence before I approve it. Second choice: "All PayPal traffic on this case (30 calls and webhooks)" to check the replay is complete.

**(e) One thing that confused me.** The Olympus OM-1n amounts don't line up: landing and resolved page say $389.00 (case PP-R-NJA-10194486), the pending page says $412.00 (case PP-R-VPY-10194485), and the sidebars list other Olympus OM-1n cases at $397.00 and $398.00. These may be separate test disputes for the same product, but nothing says so, and the landing headline reads as if the $389 story and the $412 button are the same case. Smaller one: timelines are labelled "newest first" but on the pending page 01:38:05 sits above 01:38:41, and on the resolved page 01:52:39 sits above 01:52:46 and 01:52:43.
