# Fresh-reader answers (run-sonnet-a)

## Pass 1 (640 px)

### 1-landing-640
1. CaseClerk handles PayPal chargeback disputes for small online sellers: it gathers order and tracking info, files evidence, and asks the seller before money moves.
2. A specific story with a case ID, times, a $389.00 amount, and a "debug f8469524f503f" id, plus links to open the resolved case.
3. It says "Sandbox only", so it's unclear whether it wins anything on a real account; the 12-minute close looks like a sandbox result, not a real one.

### 2-inbox-640
1. It's a disputes inbox for a seller: ten open disputes, $4,828.35 at stake, three waiting on the user, with a deadline strip by day.
2. Listed cases carry PayPal case IDs, "you keep $386.23"-style amounts, and "provide-evidence 200" calls with timestamps and debug ids.
3. Every visible case is a "real sandbox case" for the same Olympus OM-1n body at about $391–397, so it's unclear how it handles varied or live disputes. The deadline-strip amounts aren't tied to any visible case.

### 3-case-pending-640
1. It prepares evidence for a $412.00 chargeback and holds it until the seller approves, because the amount is over a $250.00 evidence line.
2. PayPal case ID, open time, a PayPal response deadline (Nov 4, 8:59 pm PT), and a list of what PayPal will receive (letter plus 3 exhibits).
3. I can't see the evidence itself at this width ("Review the evidence" is a link), so I can't judge its quality. I can't see why this case needs the seller's yes beyond the $250 rule.

### 4-case-filed-640
1. It files evidence with PayPal under the seller's rules and then waits for PayPal's decision on a $17.95 ceramic ring dish case.
2. PayPal answered 200 at 21:57:39 PT with a debug id, and the timeline lists the calls to PayPal.
3. The headline says "filed the evidence twice" but I can't see why. The timeline shows "Sandbox control: PayPal was asked to rule for the seller", which means the sandbox outcome is staged. The case is still undecided.

### 5-case-resolved-640
1. It closes the loop: PayPal closed the $389.00 chargeback and the seller keeps $378.43 after a $10.57 fee.
2. A verified CUSTOMER.DISPUTE.RESOLVED event with a webhook ID, filing and answer times (01:40:27 and 01:40:31), and an itemised fee calculation.
3. "Sandbox only: PayPal decides on its own" appears on the page, so the win is staged and doesn't show a real win rate. I can't tell whether "You approved it" came from a real click.

## Pass 2 (1280 px)

**(a) Who decides when money moves?** The user. The landing page says "asks you before any money moves". The pending case says "Over your $250.00 evidence line, so it waits for you", with a button "File the evidence on the $412.00 case". Strictly, what I see gated is *filing evidence*, not a payment. I see no screen where CaseClerk moves money itself. PayPal decides the outcome, and the page says "On a live account PayPal decides on its own". Cases under $250 get filed automatically ("Filed under your rules" on the $17.95 case).

**(b) Headline result?** A $389.00 chargeback came in at 1:37 am, was approved at 1:40, and PayPal closed it 12 minutes later, with the seller keeping $378.43. It's compared to nothing. There's no baseline such as manual handling time or a typical resolution time. Also, the "12 minutes" is odd: the landing replay says "16 min compressed to 9 s", and the resolved case shows close at 01:52:42 against a 01:37:10 open, which is about 15 minutes.

**(c) Real vs sample/target:**
- Real (as labelled): PayPal sandbox IDs, timestamps, HTTP 200s, debug ids, webhook events marked "verified", and fee math ($389.00 − $10.57 = $378.43).
- Sandbox, not live: all outcomes. The sandbox was told to rule ("Sandbox control: PayPal was asked to rule for the seller").
- Samples: product photos ("Similar item, not the seller's"). The seller name "Northlight Camera Exchange" and the other open disputes ($1,240, $319, $75, $689 in the deadline strip) have no visible source.
- Estimates: the "35% chance of winning" is the agent's own number, with no basis shown.
- No targets are stated, and there is no aggregate win rate or time saved anywhere.

**(d) First click:** "Review the $412.00 case waiting for you". It's the one place where the seller's decision and the evidence are visible, so it shows whether the approval gate is real.

**(e) Confusing:**
- "Ten open disputes, $4,828.35 at stake" but the visible rows are Closed.
- The case recommends fighting at 35% odds yet the headline says "The evidence is ready".
- "Filed the evidence twice" is unexplained.
- Waiting for you is "3", but I only saw one such case.
