# PayPal AI Hackathon — rules digest + product design

## 요약 (영인 님께)

| | |
|---|---|
| 참가 자격 | 한국 거주·만 22세라 참가 가능해요 (한국은 제외 국가 아님). 마감은 **11/13(금) 05:00 KST**, 결과 발표는 12/22 KST쯤이에요. |
| 추천 | **CaseClerk**: PayPal 소상공인 셀러의 분쟁(dispute)을 AI 에이전트가 증거 수집→환불/반박 결정→구매자와 협상→증거 제출까지 처리해요. 샌드박스에 분쟁 생성·판정 시뮬레이션 API가 있어서 데모를 끝까지 보여줄 수 있어요. |
| 노리는 상 | 본상(1~3등) 또는 Most Impactful / Best Use of PayPal + AI 중 하나, 그리고 스폰서 상 하나(Bryntum, 수상 3팀)를 함께 노려요. 규정상 한 프로젝트는 최대 "본상 또는 부문상 1개 + 스폰서 상 1개"까지예요. |
| 일정 | 10/31까지는 Qloo 우선이고, 그 사이 계정 개설과 하루짜리 스파이크만 해요. 본 개발은 11/1~11/11(SWARM 기간 11/2~6은 백그라운드 모듈만), 11/12는 예비일이에요. 런타임 비용은 Claude API 약 $60 이하(상한 설정)이고 호스팅은 무료예요. |
| 필요한 것 | PayPal 계정 가입 시 휴대폰 SMS 인증, 공개 저장소·유튜브 영상 게시 승인, API 예산 승인이에요 (맨 아래 목록 참고). |

---

## 1. Rules digest (all seen 2026-10-22)

Sources: overview `https://paypalaihackathon.devpost.com/` · rules `…/rules` · dates `…/details/dates` · FAQ `…/details/faqs` · resources `…/resources` · sponsor pages `…/details/<sponsor>` · forum `…/forum_topics`. Scrapes kept in `./.scratch/`.

| Topic | Fact | Source |
|---|---|---|
| Eligibility | Individuals at least the age of majority where they reside; teams; existing organizations. Excluded: residents of Brazil, Quebec, Russia, Crimea, Cuba, Iran, North Korea, OFAC-sanctioned countries; sponsor/admin/judges' staff and families. **Korea is not excluded; owner (22, Korean resident) is eligible.** | rules §3 |
| Teams | No maximum size; one Representative submits; a person can be on several teams and also enter solo. Teammates join via the Devpost project invite. | FAQ; rules §3 |
| Dates | Submissions 2026-10-01 09:15 PT → **2026-11-12 12:00 PT = 2026-11-13 05:00 KST**. Judging 12-01 14:00 PT → 12-15 08:00 PT. Winners ~12-21 14:00 PT (dates page says 12:00 EST; the rules prevail per §11.4). | rules §1; dates page |
| What to build | Build or update an app that integrates the PayPal developer platform (free sandbox) + any AI tool/model. PayPal family counts (Venmo, Braintree, Xoom, Honey, Zettle, Paidy, Hyperwallet, …). Must "meaningfully" use both. No tracks or problem statements. | rules §4; overview |
| Submission items | (1) project; (2) text description of features; (3) **functional demo**: hosted URL **or** complete setup/run instructions; mockups don't count; (4) tools used and how; (5) **public GitHub/GitLab/Bitbucket repo**, open-source licence visible in the About section, all source, assets and instructions; (6) **demo video < 3 min** on **public YouTube**, showing it running on the target device, no third-party trademarks or copyrighted music without permission. English, or English translations. | rules §4; overview |
| Testing access | Free, unrestricted access for sponsor, admin and judges **until judging ends (2026-12-15)**; include test credentials/sandbox logins in the testing instructions. Judges may judge from video and text alone. Manager (forum, ~2026-10-11): judges have no Anthropic key, so prefer a hosted demo; **never commit a live key**. | rules §4 "Testing"; forum 45465 |
| Pre-existing code | New, or existing and "significantly updated" during the Submission Period; explain the update. OSS allowed if licences are honoured **and** the entry builds upon it. Contractors may help, but the work must be the entrant's. | rules §4 |
| Multiple entries | Allowed if each is "unique and substantially different". | rules §4 |
| Judging | Stage 1 pass/fail (fits theme, reasonably applies the required APIs). Stage 2, equal weights, verbatim: **Technological Implementation**: "How thoroughly and skillfully does the project use PayPal Developer Platform and AI tool(s)? Does the project reflect genuine effort and a working, non-trivial implementation?" **Design**: "Does the project deliver a complete, coherent product experience — not just a technical proof of concept?" **Potential Impact**: "Does the project make a credible, specific case for solving a real problem for a real audience — and does the solution actually address that problem based on what's demonstrated?" **Innovation/Idea**: "How creative and novel is the concept and does the project differ from existing concepts?" **Presentation**: "Does the video clearly demonstrate the project working end-to-end? Does the pitch communicate what problem is solved, who it's for, and why it matters? Is the overall presentation easy to follow?" Ties are broken by criteria in that order (Tech Implementation first). Judging may use "automated AI-driven analysis". | rules §6 |
| Judges | PayPal: Jo Franchetti, Eddie Jaoude, Marco Podien (DevRel), Karthik Ravi (SWE), Himraj Singh (EM), Nathaniel Olson (Sr PM). Sponsors: AG Grid, APIMatic, Bryntum (CEO), Channel3, Elastic, Postman, Render. | overview |
| IP / licence | Entrant keeps IP; sponsor gets a non-exclusive licence for judging; sponsor and Devpost may promote the entry and use names, likeness and voice for 3 years. Repo must be OSS-licensed (so the code becomes public: business moat must sit elsewhere). | rules §4, §7, §10 |
| Prize stacking | "A project can only win up to one (1) Grand Prize and one (1) Sponsor Prize OR one (1) Honorable Mention Prize and one (1) Sponsor Prize." FAQ: you're considered for each sponsor tool you use but win at most one sponsor prize. | rules §8; FAQ |
| Prize payment | Winner affidavit within 10 business days, ID/role verification, W-8BEN for non-US; paid within 60 days; fees and taxes are the winner's; US withholding possible. | rules §8 |
| Total | $67,500 cash + $2,250 Render credits = $69,750 (both figures appear on the overview). | overview; computed |

### Prizes (rules §8)

| Prize | Award | Qty | Condition |
|---|---|---|---|
| 1st / 2nd / 3rd | $12,000 / $8,000 / $5,000 | 1 each | all eligible |
| Most Creative · Most Impactful · Best Demo Delivery · Best Use of PayPal + AI · Best Use of Agentic Commerce (Honorable Mentions) | $5,000 each | 1 each | all eligible (no extra conditions published) |
| Best Use of AG Grid 1st / 2nd / 3rd | $5,000 / $2,000 / $1,000 | 1 / 1 / **3** | uses any AG Grid tools. Page asks for polish (custom widgets, theming, layout) and the **AG Studio Agent Framework**; free 45-day trial; PayPal boilerplate `paypaldev/hackathon-paypal-ag-grid-boilerplate` (no licence file) |
| Best Use of APIMatic | $1,000 + 6 months APIMatic Business | **3** | uses any APIMatic tools, e.g. the **Context Plugin for PayPal** inside Claude Code at build time (claim form is a Google Form: not filled) |
| Best Use of Bryntum | $1,000 | **3** | uses Gantt/Scheduler/Calendar; ideas include a "**Dispute triage board**" and an "agent-driven rescheduler"; trial `@bryntum/scheduler-trial` 7.3.7 (2026-09-24, commercial trial licence) |
| Best Use of Channel3 | $1,500 | 1 | must call the Channel3 API or MCP meaningfully (search, enrichment, recommendations); free key, 20k credits with a promo code |
| Best Use of Render 1st / 2nd / 3rd | $1,000 / $750 / $500 Render credits | 1 each | uses Render tools (Workflows suggested); $50 credits via a claim link |
| Astropods, Elastic, KERNEL, Postman, Zapier | — | — | tools/credits only, **no prize** |

## 2. PayPal platform access (seen 2026-10-22)

| Item | Status / version | Fit | Source |
|---|---|---|---|
| Developer account | Needs a PayPal account (existing or new). Forum (2026-10-10): non-US sign-up goes through consumer KYC: **mobile SMS verification**, residential address; Korean guides (2025-06, 2026-01/02) agree: phone verification required, card linking optional, ID possibly later. FAQ: if sign-up fails by country, ask on Discord. | prerequisite | forum 45492; FAQ; yellowit.co.kr 2026-01-26 |
| Sandbox | Dashboard creates sandbox business + personal accounts and REST app credentials; `api-m.sandbox.paypal.com`. Fake money; sandbox logins can be shared with judges. | everything | developer.paypal.com/dashboard |
| Orders v2 / JS SDK v6 | `@paypal/paypal-js` 11.3.0 (2026-10-20), `@paypal/react-paypal-js` 10.6.0 (2026-10-05), server `@paypal/paypal-server-sdk` 2.5.0 (2026-08-21, MIT). AUTHORIZE→partial capture works as a "hold" in sandbox. | checkout, holds | npm registry; forum 45483 |
| **Disputes v1** | 15 endpoints, incl. provide-evidence, send-message, make-offer, accept-claim, appeal, acknowledge-return-item. **Sandbox-only simulators**: create dispute (buyer-side `POST /v1/customer/disputes`, needs a `PayPal-Auth-Assertion`), create chargeback (`/v2/customer-support/process-chargeback`), change-reason, require-evidence, adjudicate. Webhooks `CUSTOMER.DISPUTE.CREATED/UPDATED/RESOLVED`. Docs updated 2026-07-10. | CaseClerk core | developer.paypal.com/docs/api/customer-disputes/v1/ ; …/platforms/disputes/test-go-live |
| Payouts, Invoicing, Subscriptions, Tracking, Transaction Search, Webhooks | REST v1/v2; Payouts confirmed working in sandbox by a gallery entry ("Nightcall Pays", 2026-10-09). | various | resources page; devpost.com/software/nightcall-pays-… |
| **Agent Toolkit** (runtime library) | `@paypal/agent-toolkit` 1.11.0 and PyPI `paypal-agent-toolkit` 1.11.0 (both 2026-09-01); repo `paypal/agent-toolkit`, Apache-2.0. OpenAI Agents SDK, LangChain, Vercel AI SDK, MCP. 43 tools: invoices 20, orders/payments 5, **disputes 3 (list/get/accept only)**, tracking 3, catalog 3, subscriptions 7, reporting 2. **No Payouts, no provide-evidence/messages/offers.** | agent tools (extend) | github.com/paypal/agent-toolkit; npm |
| **MCP server** | Remote `https://mcp.sandbox.paypal.com` (`/sse`, `/http`), live `mcp.paypal.com`; local `npx -y @paypal/mcp --tools=all` (npm 1.8.1, 2025-10-28: stale). Same tool catalog. Forum (2026-10-07): sandbox MCP `create_invoice` error. → **call REST directly in runtime code; use MCP only for dev**. | dev aid | developer.paypal.com/ai-tools/mcp-server/ (updated 2026-06-30); forum 45463 |
| **AI Toolkit** (coding-agent plugin) | `paypal/AI-Toolkit` v1.1.0 (2026-10-06), Apache-2.0: Claude Code/Codex/Cursor plugin, skills, `/paypal:sandbox`, `/paypal:test-accounts`, MCP. | build-time for our agents | github.com/paypal/AI-Toolkit/releases |
| Agentic Commerce Services (Agent Ready, Store Sync) | **Not self-serve**: merchants request access by form; partners Wix, BigCommerce/Feedonomics, Shopware. Third parties (2026-04…09) say PayPal backs ACP (OpenAI/Stripe) and AP2 (Google). → not usable in 3 weeks; "agentic commerce" here = our agent driving Orders/Payouts/Subscriptions. | out of scope | developer.paypal.com/agentic-commerce-services/about (updated 2026-10-14) |
| Vault (charge buyer later) | Forum (2026-10-10): platform-app vaulting refused in sandbox (`NOT_ENABLED_TO_VAULT_PAYMENT_SOURCE`); fallback AUTHORIZE + partial capture. | avoid | forum 45483 |
| Docs links | `docs.paypal.ai/...` quickstart links on the resources page now 301 → 404; current hub is `developer.paypal.com/ai-tools/get-started` (updated 2026-06-10). | — | checked 2026-10-22 |

## 3. Field scan (2026-10-22)

- **Gallery not published** ("The hackathon managers haven't published this gallery yet"). 18,288 participants.
- Webinars (titles only, not watched): Start building with PayPal (10/6, 10/13: rules, AI Toolkit, sandbox setup); APIMatic Context Plugins (10/7); "Build a payments dashboard without building a dashboard" (AG Grid Studio, 10/12).
- Resources page "Inspiration": agents that actually transact (shopping checkout, pay contractors on completion, **agent-to-agent negotiation**), money movement, business tools, consumer budgeting, social impact.
- Public entries already visible (Devpost/GitHub/dev.to, 2026-10-02…19): shopping copilots with checkout (Agentic Commerce Copilot, O-BUY, PatronAI); **agent spend guardrails** (two "permit" repos, Sepilo/IntentLock, BOLT PayFlow Guard); invoice assistants (PayFlow AI); payout-on-completion agents (Nightcall Pays).
- **Patterns:** shopping→checkout and spend-permission layers are crowded; most entries use Orders + Invoicing, the toolkit's easy paths.
- **Gaps:** post-purchase money problems (**disputes, chargebacks, refunds**: the toolkit only exposes 3 of 15 dispute endpoints); merchant-side agents that act with real authority; cross-border small sellers; time-based UIs (Bryntum ideas unclaimed in public entries seen).

## 4. Concepts

### A. CaseClerk — an AI dispute desk for small PayPal sellers (**recommended**)
- **Pitch:** When a buyer opens a PayPal dispute, CaseClerk's agent pulls the order, shipping tracking, transaction history and the buyer's messages, estimates the odds of winning, and then either refunds or offers a partial refund at once (when fighting costs more than it's worth) or writes and submits an evidence pack, all before the deadline. Above a threshold it asks the seller first.
- **User:** small cross-border sellers (Etsy/eBay/own Shopify stores; Korean 역직구 sellers) who lose disputes by missing deadlines or submitting weak evidence; no chargeback team.
- **Why PayPal + AI are both essential:** disputes, evidence, offers, messages, tracking and refunds are PayPal objects; reading messy case text, matching evidence to reason codes, writing a rebuttal and negotiating with the buyer is LLM work. Remove either and nothing is left.
- **Agentic part:** webhook-triggered plan → tools (Disputes ×9, Orders, Tracking, Transaction Search, Refunds) → expected-value decision → actions (send-message, make-offer, provide-evidence, accept-claim) under a seller policy (auto ≤ $X, approval above) → watches UPDATED events and replies. Demo end-to-end with sandbox simulators: create dispute → agent acts → require-evidence → adjudicate SELLER_FAVOR.
- **Criteria fit:** Tech Impl **high** (extends the toolkit to 9 dispute tools + webhooks, which the official toolkit lacks); Design **med-high** (inbox + deadline board + evidence PDF); Impact **high** (concrete loss: amount + fees + time); Innovation **med** (Chargeflow/Justt exist for Stripe/Shopify, not an LLM agent negotiating on PayPal); Presentation **high** (a live dispute won in 90 s).
- **Prizes targeted:** Grand; else **Most Impactful** or **Best Use of PayPal + AI**; sponsor **Bryntum** (Scheduler "dispute triage board" is literally on their idea list; 3 winners). Also eligible for APIMatic at no extra cost (Context Plugin at build time).
- **Build risk (12 days): medium.** Spike first: buyer-side create-dispute needs a `PayPal-Auth-Assertion` (fallback: the secretary opens disputes in the sandbox buyer UI, or uses process-chargeback); "wait a few minutes" before actions; sandbox weirdness.
- **Business potential: high.** B2B SaaS with success fees (~20–25% of recovered funds is the market norm for chargeback tools), starts PayPal-only where incumbents are thin, then adds Stripe/Shopify. Fits an AI-agent founder in finance; the OSS repo is the hackathon core, while the moat is data (win-rate by reason/category) and integrations.

### B. Errand — a buying agent that acts on your spending plan (SameTaste synergy)
- **Pitch:** SameTaste writes a taste-preserving monthly plan; Errand turns each line ("≤ $45/month coffee beans, light roast, these roasters") into a signed mandate and shops within it: finds products (Channel3), waits for good prices, checks out via PayPal, sets up Subscriptions for staples, asks only when outside the mandate.
- **PayPal + AI:** Orders AUTHORIZE holds per envelope, Subscriptions, Transaction Search for reconciliation; LLM matching taste and plan, AP2-style mandate.
- **Prizes:** Grand / **Best Use of Agentic Commerce**; sponsor **Channel3** (1 winner).
- **Risk: high.** Crowded (shopping copilots + spend guardrails); Channel3 products belong to real retailers, so payments go to our own sandbox "merchants", which weakens realism; vaulting refused in sandbox, so "agent pays without you" needs the AUTHORIZE workaround. Depends on SameTaste shipping 10/31.
- **Business:** consumer, hard to monetize early; best as a SameTaste feature later.

### C. Handshake — agent-to-agent task escrow and payout
- **Pitch:** a buyer agent posts a task with a budget; worker agents (representing freelancers) bid and negotiate; the winning price is held with an Orders AUTHORIZE; an AI reviewer checks the delivery against acceptance criteria; capture + Payouts split to contributors; failed delivery → void/refund.
- **Prizes:** **Most Creative** / Agentic Commerce; sponsor Bryntum (Gantt of milestones) or AG Grid.
- **Risk: medium.** "Agents negotiating" is on PayPal's own idea list, so expect many; payout-on-completion already seen (Nightcall Pays). Multiparty/marketplace APIs need partner onboarding.
- **Business:** marketplace, which needs liquidity; weak for a solo founder.

### Recommendation: **A. CaseClerk**
**Why:** it targets the least crowded part of the field we saw; it shows unusually deep, non-trivial PayPal use (Tech Impl breaks ties); the sandbox offers official simulators, so the video can show a real dispute won end-to-end; its business case is the clearest of the three.
**Counter-argument:** PayPal's headline theme is agentic *commerce*, and A is back-office: it gives up the Agentic Commerce prize, is less "wow" than an agent buying things (Innovation/Design may score lower), incumbents exist, and a dispute agent that judges can't trigger themselves may feel canned. **Mitigations:** a "Open a test dispute" button (sandbox simulator) so judges trigger it live; framing as "the agent that *defends* commerce: negotiates with the buyer"; a polished Bryntum board. If the 10/24–25 spike shows we can't create disputes programmatically **and** manual creation is unreliable, switch to C (shares the Orders/Payouts/agent core).

## 5. Build plan (CaseClerk)

**Architecture**
```
PayPal sandbox ──webhooks──▶ /api/webhooks/paypal (verify signature) ──▶ cases table (Neon Postgres)
        ▲                                              │
        │ REST (OAuth client-credentials)              ▼
lib/paypal/*  ◀── tool calls ── lib/agent/ (Claude tool-use loop, policy gate, audit log)
                                               │
UI (Next.js): Inbox · Case view (timeline, evidence pack, agent reasoning, approve/deny) · Bryntum Scheduler deadline board · Seller policy settings · "Open test dispute"
```
- **Stack:** Next.js 16.4 (App Router, TS), `@anthropic-ai/sdk` 1.1.0 (direct tool use; no framework), PayPal REST via fetch + `@paypal/paypal-server-sdk` 2.5.0 for Orders, `@bryntum/scheduler-trial` 7.3.7, Neon Postgres free tier, evidence PDF via `pdf-lib` (MIT). Repo licence: MIT.
- **Agent tools (ours, modelled on the agent-toolkit pattern):** get_dispute, list_disputes, send_message, make_offer, provide_evidence (multipart), accept_claim, acknowledge_return, get_order, get_tracking, search_transactions, refund_capture. A policy gate wraps every write tool (amount thresholds, approval queue, dry-run), and every action goes to an append-only audit log shown in the UI.
- **Models and cost (Claude list prices, 2026-10-22):** Haiku 5.5 ($0.10/$0.50 per MTok) for triage, reason classification and buyer-message replies; Sonnet 5.5 ($2/$10) for the decision and the rebuttal/evidence narrative; prompt caching on the system prompt and policy. ≈ $0.10–0.15 per dispute handled. Budget: dev ≤ $35, judging window (to 12/15) ≤ $25 with a hard global cap (e.g. 100 agent runs/day, then cached replay mode). **Total ≤ $60.**
- **Hosting (free, no card):** Vercel Hobby (Next.js + webhooks; set function `maxDuration`, verify the Hobby limit in the spike) + Neon free. Render free tier is skipped: sources conflict on whether a card is required (render.com 2026-04-23 says no; a 2026-06-10 note says card verification) → Render prize not targeted.
- **Judges:** hosted URL + sandbox buyer/seller logins in the private testing instructions; the "Open test dispute" button creates a fresh case; README with local run steps and `.env.example` (no keys).

**Worker paths (non-overlapping)**
| Worker | Path | Owns |
|---|---|---|
| W1 PayPal | `lib/paypal/` | OAuth, typed REST clients (disputes, orders, tracking, txn search, refunds, simulators), webhook verify; contract tests vs sandbox |
| W2 Agent | `lib/agent/` | tool schemas, loop, policy gate, prompts, EV model, audit log, replay fixtures |
| W3 UI | `app/` (except `app/board/`), `components/ui/` | inbox, case view, approvals, settings, landing |
| W4 Board + PDF | `app/board/`, `components/board/`, `lib/evidence/` | Bryntum Scheduler deadline board, evidence-pack PDF |
| W5 Data/Ops | `db/`, `scripts/`, `app/api/` routes, `README.md`, `docs/` | schema, seed (sandbox orders with tracking), webhook route, deploy, submission text |
Shared types in `lib/types.ts`: W2 owns it; others propose changes.

**Day plan (KST)**
| Date | Work |
|---|---|
| 10/22 | This design. |
| 10/23 | Owner: PayPal account SMS step; secretary: developer dashboard, sandbox accounts, REST app (secrets into the vault). Devpost registration (pending owner OK). |
| 10/24–25 | **Spike** (1 worker, ≤ 4 h, around Qloo): create dispute via simulator/chargeback, receive webhook on a Vercel preview, provide-evidence + adjudicate, Bryntum trial renders in Next 16. |
| 10/26 | Go/no-go on A (else C). Lock the schema and tool list. |
| 10/27–31 | Qloo first; no PayPal work beyond answering the spike. |
| 11/1 | Scaffold repo (private until submission), W1–W5 kick-off, sandbox seed. |
| 11/2–6 (SWARM) | Background only: W1 clients + contract tests, W2 agent with replay fixtures, W4 board + PDF. Daily 15-min check. |
| 11/7 | Integration: webhook → agent → actions end-to-end in sandbox. |
| 11/8 | UI polish, policy/approval flow, "Open test dispute", deploy to Vercel. |
| 11/9 | Hardening: rate cap, replay mode, README, tests; record raw demo footage. |
| 11/10 | Video edit + narration; submission text and tools section. |
| 11/11 | Publish repo (owner OK), upload YouTube, fill Devpost draft. Submit by evening. |
| 11/12 | **Buffer**; hard stop 11/13 05:00 KST. |

**Demo video (≤ 2:45):** 0:00 problem (a seller loses $ to a missed deadline) · 0:25 seller policy · 0:40 judge-style "Open test dispute" → webhook → agent timeline (reads tracking, classifies INR, messages buyer, builds evidence) · 1:40 approval for a high-value case · 2:00 simulator adjudicates SELLER_FAVOR, board updates · 2:20 impact + architecture · 2:40 end. **Narration: TTS** (English, clear, re-recordable; owner's voice optional if they'd like it). No music, or self-made only.

## 6. Open-source scan (2026-10-22, ~10 min)

| Candidate | Licence | Last activity | Fit | Decision |
|---|---|---|---|---|
| `paypal/agent-toolkit` (npm 1.11.0) | Apache-2.0 | 2026-09-01 | tool schema pattern; 3 dispute tools only | **Reference/borrow pattern**, write our own dispute tools (credit in README) |
| `paypal/AI-Toolkit` v1.1.0 | Apache-2.0 | 2026-10-16 | Claude Code plugin for our build agents | **Use at build time** |
| `@paypal/paypal-server-sdk` 2.5.0 | MIT | 2026-08-21 | typed Orders/Payments | **Use** (Orders only) |
| `vercel/ai` (`ai` 7.0.148) | Apache-2.0 | 2026-10-22 | agent loop/streaming | **Skip**: direct Anthropic SDK is simpler for one provider |
| `google-agentic-commerce/AP2` | Apache-2.0 | 2026-06-17 | signed mandates | Only if C/B is chosen |
| `paypaldev/hackathon-paypal-ag-grid-boilerplate` | none | 2026-10-12 | AG Studio + PayPal | **Don't copy** (no licence) |
No GPL/AGPL candidates needed.

## 7. Owner-needed list
1. PayPal account sign-up: SMS code to your phone (and an ID check if PayPal asks); 2FA codes at later logins.
2. OK to register on Devpost in your name (rules: entering means agreeing to them and to promotional use of name/voice).
3. OK to publish the repo (MIT) and a public YouTube video on 11/11.
4. Approve a Claude API budget of ≤ $60 for dev + the hosted demo until 12/15.
5. Only if we win: sign the winner affidavit + W-8BEN (identity) within 10 business days.

## RISKS / assumptions
- Sandbox create-dispute may need permissions we can't get (Auth-Assertion); fallback is manual creation in the buyer UI (secretary) or process-chargeback. Decided at the 10/26 go/no-go.
- Webinar content, honourable-mention judging specifics and the AI-driven screening are not public in detail; prize fit is our judgment.
- Field scan covers public entries only (gallery hidden); expect many more shopping/guardrail entries at the deadline.
- Bryntum/AG Grid are commercial trials; our repo stays MIT and installs the public trial package, so judges get a trial watermark.
- Vercel Hobby function duration and webhook latency are to be verified in the spike.
