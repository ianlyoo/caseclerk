# Journey

Direction and decisions, newest last. Dates KST.

## 2026-10-25 — kickoff
- Concept A CaseClerk chosen (design 2026-10-22): AI dispute desk on PayPal sandbox Disputes, Orders, Tracking, Refunds APIs; Claude tool-use agent under a seller policy; Bryntum Scheduler deadline board.
- Stack: Next.js + @anthropic-ai/sdk direct tool use (Haiku 5.5 triage, Sonnet 5.5 decisions), Neon free, Vercel Hobby, MIT.
- Claude API budget approved: $60 through judging (2026-12-15), hard cap in code.
- Stages: S1 setup + rules re-read → S2 spike (sandbox dispute + webhook + evidence + adjudicate + Bryntum) → S3 build → S4 README/video/Devpost text → S5 submit after owner OK.
- Runtime models (owner on card #164, 10/25: "그런 작업엔 high 이상이 필요하지 않을것 같은데 opus"; CTO decision): claude-opus-5-5 at effort medium (set explicitly in output_config) for decisions, evidence/rebuttal text and buyer messages; claude-haiku-5-5 at effort low for triage and reason classification. Replaces DESIGN.md's Sonnet 5.5 rows. Prices $4/$20 (Opus 5.5), $0.10/$0.50 (Haiku 5.5) per MTok; prompt caching on tools + system prompt; ~$0.15–0.20 per dispute. Opus 5.5: thinking can't be disabled; forced tool_choice returns 400 → tool_choice auto with strict tools.
- PayPal sign-in is split (email page, then password page), so the saved-login tool can't fill it; the owner signs in once in the shared browser (owner step #22).

## 2026-10-25 — rules re-read (S1)
- Devpost rules, dates, FAQ, resources, updates, forum and sponsor pages: unchanged since 10/22 (participants now ~20.5k). Deadline still 2026-11-13 05:00 KST.
- Versions (npm, 10/25): next 16.4.3, @anthropic-ai/sdk 1.3.0, @neondatabase/serverless 1.2.0; others as designed. Vercel Hobby functions max 300 s, 4.5 MB body; Neon free 1 GB/project.
- Disputes sandbox guide moved to developer.paypal.com/disputes/test-go-live.md; simulators unchanged.
- Field: three public dispute entries exist (RebuttalForge, PayPal Dispute Copilot, Fizzl Guard). Each mocks or scripts the PayPal side (mock webhooks, simulated evidence submission, INR only, or refund guarding). Decision: keep CaseClerk; make the differentiator visible in the first 30 s of the video: a live sandbox webhook → agent action (message/offer/evidence) → simulator adjudication, plus buyer negotiation.
- Sandbox lesson from others: use US sandbox accounts; PayPal sandbox can refund a capture that has an open chargeback (double payout), so the agent checks for open disputes before any refund and prefers make-offer / accept-claim.
- Triage model effort (owner #435 asked whether Haiku at low keeps quality): Haiku 5.5 effort medium for triage/classification (cost difference < $0.01 per dispute). Check in S3: classify 10 sandbox disputes with Haiku and Opus; any mismatch → triage on Opus too.
- Triage model (owner #436, 10/25 10:26: "분류는 haiku 추론을 높이던가, sonnet 을 쓰던가 해보자. Opus 는 좀 사치같고"): triage/classification on claude-haiku-5-5 at effort high by default; S3 check classifies 10 sandbox disputes with Haiku high and Sonnet 5.5 against an Opus reference, and keeps the cheapest that matches. No Opus for triage. Decisions, evidence text and buyer messages stay on Opus 5.5 medium.
