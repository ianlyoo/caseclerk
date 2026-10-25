# Finals shared fixtures (owned by Final A / W3; read-only for Final B)

- `data.ts`: the fixture clock (`NOW` = Sun Oct 25 2026, 10:40 am Pacific), seller, policy, labels, the 11 `CASES`, and formatting helpers (`usd`, `usd0`, `day`, `time`, `clock`, `countdown`, `dayOffset`, `nextDays`, `ago`).
- `cases.ts`: `caseDetail(id)` for every case. The hero is `HERO` (`PP-R-NKT-10227591`, Daniel Okafor, Olympus OM-1n, $412.00, **chargeback**). Filing evidence on cases of $250.00 or more waits for the seller, so the hero's slip is "File the evidence on $412.00". Its decision values the returned camera at $118.00: file = $259.70 on average, accept = $98.00. Resolved: RESOLVED_SELLER_FAVOUR, "You kept $392.00" ($412.00 less the $20.00 chargeback fee). Grace (`PP-R-TVA-10227066`) is the secondary inquiry beat: a $74.95 refund above the $50.00 line. `wireOf(d)` gives a case's PayPal lines.
- `real.ts`: the one real sandbox run, `PP-R-JKB-10194463`, with real webhook event ids and PayPal debug ids (`REAL_WIRE`). It has **no RESOLVED webhook**: the seller-favour ruling was requested with the sandbox simulator and PayPal still says UNDER_REVIEW.
- `store.tsx`: `DecisionProvider`, `useDecision(id)` (pending → undo 4 s → sending → filed → resolved; or declined), `entryFor("pending" | "approved" | "resolved")` for URL-driven states, `usePendingApprovals()`.

Every fixture case is a **sample case**: label it so. Its Wire lines have `origin: "sample"` and no debug ids, because nothing went to PayPal. Model names and costs (`Step.model`, `costUsd`) never go on the Wire.
