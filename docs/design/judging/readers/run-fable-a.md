# Fresh-reader answers — run-fable-a

## Pass 1 (640 px, 5-second glances)

### 1-landing-640
(1) CaseClerk answers PayPal chargebacks for small online sellers: it reads the dispute, pulls the order and tracking, drafts the evidence, and waits for the seller's approval before filing. (2) A concrete timeline — $389 chargeback at 1:37 am, approved at 1:40, closed by PayPal 12 minutes later — plus a PayPal debug id and a link to the resolved case. (3) Everything is explicitly "sandbox only"; the page says PayPal was *asked* to rule, so no evidence a live PayPal ever decided anything, and I can't tell how many real sellers or live cases exist.

### 2-inbox-640
(1) A disputes inbox for one seller: ten open cases, dollars at stake, deadlines on a week strip, and a list of cases with status. (2) Each row shows a PayPal dispute id, a "provide-evidence 200" call with timestamp and a debug id, and "Closed by PayPal; you keep $386.23". (3) The visible rows are all the same item ("Olympus OM-1n body") at near-identical prices closed within minutes of each other, which looks like a test loop rather than real trade; also the headline says "ten open" but every visible row is "Closed".

### 3-case-pending-640
(1) A single case page where the evidence is drafted and the software is waiting for the seller to say yes before filing. (2) A real-looking PayPal id, a PayPal deadline (Nov 4), and a timeline entry "Evidence ready 01:38:42 PT"; the rule "Over your $250 evidence line, so it waits for you" shows the approval gate is policy-driven. (3) I cannot see the actual letter or exhibits from this view, so whether the evidence is any good is unproven.

### 4-case-filed-640
(1) The same case layout after filing: CaseClerk filed evidence for a $17.95 item automatically ("under your rules") and PayPal is now deciding. (2) Timeline rows with "To PayPal provide-evidence 200" and a debug id at 21:57:39 PT. (3) "Filed the evidence twice" is unexplained, and "Sandbox control: PayPal was asked to rule for the seller" means the outcome is being steered by the test harness, not earned.

### 5-case-resolved-640
(1) A closed case: PayPal resolved the chargeback, seller keeps $378.43 of a $389 sale after a $10.57 fee. (2) An inbound PayPal webhook CUSTOMER.DISPUTE.RESOLVED marked "verified" with a WH- event id, plus the outbound provide-evidence 200 with debug id. (3) The win was requested from the sandbox ("we asked PayPal's sandbox to rule"), so it proves the plumbing works, not that the evidence wins disputes.

## Pass 2 (1280 px)

**(a) Who decides when money moves?** Neither, strictly: PayPal decides the dispute. What the user controls is whether evidence gets *filed*. The landing copy says it "asks you before any money moves." The case pages say this is conditional: above a $250 "evidence line" it waits for the user (3-case-pending: "Over your $250.00 evidence line, so it waits for you"); below it the software files on its own (4-case-filed: "Filed under your rules", $17.95, no approval step visible). So for small cases the software acts without asking, which the landing-page sentence glosses over.

**(b) Headline result, compared to what?** Landing: a $389 chargeback came in at 1:37 am, user approved at 1:40, PayPal closed it 12 minutes later; outcome "you keep $378.43". It is compared to nothing — no baseline for how long a seller takes by hand, no win rate, no before/after. The inbox headline ("Ten open disputes, $4,828.35 at stake, three waiting") is an inventory, not a result.

**(c) Real measurements vs samples/targets?**
- Real (recorded from the PayPal sandbox): timestamps, dispute ids (PP-R-…), debug ids, WH- event ids, HTTP 200s, the "verified" webhook flags, amounts like $389.00 / $10.57 fee / $378.43, deadline Nov 4 8:59 pm PT. Real *against a sandbox*, not live money.
- Steered/not earned: every "Closed by PayPal; you keep …" outcome, because an `adjudicate` call ("PayPal was asked to rule for the seller") precedes it. The repeated Olympus OM-1n rows at $391/$394/$397 look like a scripted batch.
- Estimate/target: "chance of winning at 35%" on the pending case is the agent's guess, not a measurement. The $250 evidence line is a user setting. The "16 min compressed to 9 s" replay is a presentation choice.
- Unverifiable here: "PayPal and the card issuer usually decide within 30 days" (asserted, no data).

**(d) Click first, and why?** "Review the evidence" on the $412 pending case (3-case-pending). The whole pitch is that the drafted evidence is worth filing, and that is the one thing none of the screens actually show. Second choice: "Show them" next to "3 calls" in the traffic panel, to see whether the outbound calls are what the labels claim.

**(e) One thing that confused me.** The inbox says "Ten open disputes" but every visible case row reads "Closed", and the week strip only shows five deadlines totaling about $2,735, not $4,828.35. I can't reconcile the headline with the list from what's on screen. Runner-up: "CaseClerk filed the evidence twice" on the $17.95 case, with a `require-evidence` sandbox call in between — it isn't explained whether the double filing was intended, a retry, or a bug.
