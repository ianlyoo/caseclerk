# Judging round 1: are CaseClerk's two UI finals competition-winning?

## Context
CaseClerk is an entry in PayPal's official AI hackathon on Devpost (≈20,500 participants, $67,500, deadline 11/13). An AI agent works a small seller's real PayPal disputes end to end on PayPal's sandbox APIs: webhook in (signature verified) → triage (Haiku) → investigation → fight / refund / partial offer / message decision with expected value (Opus) → seller policy gate (money actions above $50 and evidence on disputes ≥ $250 wait for the seller's Approve) → live PayPal calls (provide-evidence with a generated PDF, make-offer, send-message) → PayPal's decision. A real production run, PP-R-JKB-10194463, went from dispute creation through adjudication with no human.
Official criteria, each 20 %: Technological implementation, Design ("a complete product experience, not a tech demo"), Potential impact, Quality of the idea, Presentation (the ≤ 3-minute video must show it working end to end). Judges are PayPal developer relations, engineers, managers and product people; they may judge from the video and first screen alone.
A first quality meeting produced the spec in `VERDICT-meeting-r1.md` (material). Two distinct finals were built from it: **A "Paper and Wire"** (paper case file + a dark right-hand "Wire" plane showing only real PayPal traffic) and **B "Darkroom paper"** (paper case file, PayPal traffic inline in the timeline, one dark decision sheet that rises for approvals). The owner will pick one; the other is dropped.

## Material
`finals/a/` and `finals/b/`: per final, shots of landing, inbox and the case page in pending, approved and resolved states at 1440, 1920 and 390 px, plus `case-approve.mp4` (the approval ceremony at 1440×810). `VERDICT-meeting-r1.md`: the spec and guardrails. `SLOP-qloo-round1.md`: tells the owner rejected on an earlier product. Live previews (members on the oracle host can open them): see `LINKS.md`.

## Deliver (each member, then the judge)
Per final:
1. Rating 1–10 against the five official criteria, as far as the UI and the approval ceremony decide them (Design, Presentation, and how visibly they prove Technological implementation).
2. **"Competition-winning, submit as is: yes / no"**: yes only if it would place among the top entries' visual quality and the live PayPal loop is unmistakable in 10 seconds.
3. A must-fix list, concrete enough to execute without asking (page, element, what to change, to what), ranked; at most 10 items.
4. Anything that reads AI-generated, template-like, or fake-live.
Then: which final is stronger for winning, and why, in three sentences. The judge decides the two verdict lines per final and the merged must-fix list per final.
