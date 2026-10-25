# Judging round 4: are CaseClerk's two UI finals competition-winning now?

## Context
Same product and contest as rounds 1–3 (read `VERDICT-judge-r3.md` first: context, official criteria, the round-3 ratings (A 8.2, B 8.1) and the must-fix lists (A 6 items, B 5)). Since round 3, each final's worker did its list (see `SELF-REVIEW.md`) and recorded a fresh, clean real approval on the current build (A: ceremony A5 $397 (SGV); B: ceremony B4 $391 (IHX); ids in `REAL-CASES.md`), each ending on that same case's real RESOLVED page; seller money outcomes come from PayPal's fund_movements (`REAL-CASES.md`). "Open a test dispute" is deliberately real (creates a real sandbox chargeback; capped per day) — a PM ruling, not a defect. Background from earlier rounds:
- **Real cases replace samples as the hero.** All are on PayPal's sandbox, through the production app; see `REAL-CASES.md`.
  - PP-R-NJA-10194486 ($389.00): the agent prepared evidence, stopped for seller approval (≥ $250 rule), was approved, filed (provide-evidence 200, debug f8469524f503f), adjudicated, and PayPal RESOLVED it 12 min after approval (real verified webhook).
  - PP-R-VPY-10194485 ($412.00): waits for approval, kept for the video.
  - Each final's `case-approve-real.mp4` shows its own real one-click approval (A: AAJ, B: IMW).
- Each final's worker did its round-1 must-fix list (see each `SELF-REVIEW.md`).
- Both finals are live through public links (`LINKS.md`); reads and Approve go to the production API. **Do not press Approve on PP-R-VPY-10194485.**

## Material
`finals/a/`, `finals/b/`: shots at DPR 2 (1440, 1920, 390), videos, self-reviews and check logs. `VERDICT-judge-r1.md` (round 1), `VERDICT-meeting-r1.md` (design spec and guardrails), `SLOP-qloo-round1.md` (tells the owner rejected), `REAL-CASES.md`, `LINKS.md`.

## Deliver (each member, then the judge)
Per final:
1. A rating from 1 to 10 for each of the five official criteria, as far as the UI, the videos and the live links decide them, plus an overall rating.
2. For each round-3 must-fix item: fixed / partly / not fixed, with the evidence (file or URL).
3. **"Competition-winning, submit as is: yes / no".** Yes only if it would place among the top entries' visual quality and the live PayPal loop is unmistakable in 10 seconds.
4. If "no", a must-fix list concrete enough to execute without asking: page, element, change. At most 8 items, ranked, with only what stands between this and a "yes".
5. Anything that reads AI-generated, template-like or fake-live.
Then: which final is stronger for winning, in three sentences. The judge decides the verdict line per final and the merged must-fix list per final.
