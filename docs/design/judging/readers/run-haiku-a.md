# Fresh-reader answers (run-haiku-a)

Note: before viewing the images I listed the folder and read BRIEF.md. I had no other context about this product. Only the 10 PNG files were used.

## Pass 1 (640 px, 5-second glance, 3 sentences each)

### 1. Landing (1-landing-640.png)
(1) CaseClerk handles PayPal chargeback disputes for small online sellers: it reads the case, gathers the order and tracking, files the evidence, and asks you before any money moves.
(2) The example "Open this $389.00 resolved case" link and the debug code f8469524f503f suggest real records behind the claims, and the top banner says "Replay of PP-R-NJA-10194486."
(3) It is unclear whether this is a live product or a demo, and the page never says what a sale, fee, or "resolved" outcome means for the seller's money.

### 2. Inbox (2-inbox-640.png)
(1) It is a dashboard of open PayPal disputes for a seller, showing dollar amounts per case and a day-by-day deadline strip.
(2) Rows are labeled "Real sandbox cases, from PayPal" with PP-R case ids, PayPal call codes (provide-evidence 200), Pacific timestamps, and debug codes.
(3) It is unclear what "$4,828.35 at stake" includes, and the list starts with closed cases under the heading "Ten open disputes," so the counts do not obviously match.

### 3. Case pending (3-case-pending-640.png)
(1) A buyer's card issuer has charged back a $412.00 Olympus camera body, and the seller must answer PayPal by Nov 4.
(2) The label "Real PayPal sandbox case," the PP-R-VPY id, and the event log with PayPal ids and times show the case is pulled from PayPal.
(3) It is unclear what the seller's evidence package actually says, and the 640 view does not show the agent's recommendation or odds, which appear only at 1280.

### 4. Case filed (4-case-filed-640.png)
(1) A $17.95 ceramic ring dish chargeback where CaseClerk has already filed evidence and PayPal is deciding.
(2) The log shows "PayPal answered 200" with a debug id and timestamps, which is evidence of an actual API exchange.
(3) It is unclear why the evidence was filed twice, and the "sandbox ruling requested" entry is not explained, so I cannot tell who asked PayPal to rule.

### 5. Case resolved (5-case-resolved-640.png)
(1) PayPal closed the $389.00 camera chargeback and the seller keeps $378.43 after a $10.57 fee.
(2) The "CUSTOMER.DISPUTE.RESOLVED verified" event with a WH- event id, and the filing and answer timestamps, show a recorded exchange with PayPal.
(3) It is unclear whether $378.43 is final money or a sandbox figure, since the page says "Sandbox only: we asked PayPal's sandbox to rule."

## Pass 2 (1280 px)

(a) **Who decides when money moves?** The software files and asks, and the user approves, but the screenshots contradict the claim. The landing page says it "asks you before any money moves," and the pending case has a "File the evidence on the $412.00 case" button. But the case-filed page (4) shows "Filed under your rules" and "CaseClerk filed the evidence twice" on a $17.95 case with no visible approval step. The pending page says the case "waits for you" only because it is "over your $250.00 evidence line," which implies cases under $250 are filed automatically. Where your rules are set is not shown on any screen.

(b) **Headline result:** "PayPal closed the chargeback 12 minutes after you approved the evidence." It is compared to nothing: no baseline, no time-to-close average, no win rate. The only figure is one case (1:40 approval to 1:52 close, $378.43 kept). The "35%" win chance on the pending page is the agent's estimate for a different case, not a result.

(c) **Real vs sample/target:**
- Real (from PayPal sandbox logs): PP-R case ids, debug ids, HTTP 200 responses, webhook event ids marked "verified," and the timestamps.
- Replay or sample: the top banner says "Replay ... recorded Oct 25: 16 min compressed to 9 s." The page says "Sandbox only." The product photos are stock images, labeled "Similar item, not the seller's."
- Estimate or target: "chance of winning at 35%," "usually decide within 30 days" (general claim), and "$4,828.35 at stake" (a sum of open cases, not a measurement of outcomes).
- Unverified: the $10.57 fee and the $378.43 "you keep" figure are shown, but I cannot see how they were computed.

(d) **What I'd click first:** "Review the evidence" on the $412.00 pending case. It is the only open decision with money attached and a hard deadline (Nov 4), and it is the one step that would show what PayPal will receive before anything is filed.

(e) **What confused me:** Case 4 says "CaseClerk filed the evidence twice" and "Sandbox control: PayPal was asked to rule for the seller," on a $17.95 case, with no approval step visible. That directly conflicts with the landing page's claim that it asks before money moves, and nothing on screen explains who or what triggered the second filing.
