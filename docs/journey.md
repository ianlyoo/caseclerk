# Journey

Direction and decisions, newest last. Dates KST.

## 2026-10-25 — kickoff
- Concept A CaseClerk chosen (design 2026-10-22): AI dispute desk on PayPal sandbox Disputes, Orders, Tracking, Refunds APIs; Claude tool-use agent under a seller policy; Bryntum Scheduler deadline board.
- Stack: Next.js + @anthropic-ai/sdk direct tool use (Haiku 5.5 triage, Sonnet 5.5 decisions), Neon free, Vercel Hobby, MIT.
- Claude API budget approved: $60 through judging (2026-12-15), hard cap in code.
- Stages: S1 setup + rules re-read → S2 spike (sandbox dispute + webhook + evidence + adjudicate + Bryntum) → S3 build → S4 README/video/Devpost text → S5 submit after owner OK.
- Runtime models (owner on card #164, 10/25: "그런 작업엔 high 이상이 필요하지 않을것 같은데 opus"; CTO decision): claude-opus-5-5 at effort medium (set explicitly in output_config) for decisions, evidence/rebuttal text and buyer messages; claude-haiku-5-5 at effort low for triage and reason classification. Replaces DESIGN.md's Sonnet 5.5 rows. Prices $4/$20 (Opus 5.5), $0.10/$0.50 (Haiku 5.5) per MTok; prompt caching on tools + system prompt; ~$0.15–0.20 per dispute. Opus 5.5: thinking can't be disabled; forced tool_choice returns 400 → tool_choice auto with strict tools.
- PayPal sign-in is split (email page, then password page), so the saved-login tool can't fill it; the owner signs in once in the shared browser (owner step #22).
