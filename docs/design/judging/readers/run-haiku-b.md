# Fresh-reader answers (run-haiku-b)

Note on test validity: I opened all the 1280 images before writing Pass 1, so Pass 1 is not a true first glance. I tried to answer Pass 1 from the 640 images only, but I could not unsee the 1280 content.

## Pass 1 (640 px)

CaseClerk appears to be a tool that answers PayPal chargebacks for small sellers by reading the case, order, and tracking, filing evidence, and asking the seller before money moves. The strongest proof is the replay of a "real PayPal sandbox chargeback" with PayPal event IDs, timestamps, "verified" webhook tags, and a "last real webhook 47 min ago" status line. Unclear: whether this is a demo or a live product with real money, what it costs, and what the seller actually gets on a live account, since the result shown is a sandbox ruling.

## Pass 2 (1280 px)

**(a) Who decides when money moves?** The user decides above a line, the software decides below it. The pending case says "File this evidence with PayPal?" with "Over your $250.00 evidence line, so it waits for you," and buttons to file or accept the chargeback. The resolved page says "Sandbox only: we asked PayPal's sandbox to rule. On a live account PayPal decides on its own." The landing says CaseClerk "asks you before money moves," but the $17.95 ceramic dish case was filed by CaseClerk with no approval step visible on screen. I could not see the policy page, so I can't confirm the $250 rule or whether it's the only threshold.

**(b) Headline result, compared to what?** "You keep $378.43: the $389.00 sale less PayPal's usual fee." The comparison is only to the sale price. There is no comparison to accepting the chargeback or to a baseline. The arithmetic checks out ($389.00 − $10.57 = $378.43). The sandbox caveat is in small print.

**(c) Real measurements vs. samples or targets.**
- Looks real (system data): PayPal event IDs, debug IDs, timestamps, "verified" webhook tags, call counts, and the "Real sandbox case" labels.
- Can't verify: "$4,416.35 at stake" (the six other cases aren't shown), "last real webhook 47 min ago," "The agent spent $0.05," "shared limit: three a day," and the model claims ("Haiku 5.5 triages; Opus 5.5 decides").
- Samples or unclear: the calendar deadlines (Rollei $319, Hasselblad $1,240, Kodak $75, Fujifilm $689) and the neighbor prices ($397, $398, $27.95). I can't tell if these are real PayPal deadlines or placeholder data.

**(d) What would I click first, and why?** "Review the $412.00 case waiting for you" on the landing. It's the only thing on the page that needs my decision, and it's the largest amount. The replay's "Open this case" would be my second click, to check the proof.

**(e) One thing that confused me.** The landing says the product asks before money moves, but the $17.95 ceramic dish was filed without any prompt I can see. Also, the landing headline says "$389 Olympus camera," while the CTA and inbox say "$412 case," and the neighbor on the resolved page is "Olympus OM-1n body, $398.00." I couldn't tell whether these are different cases.
