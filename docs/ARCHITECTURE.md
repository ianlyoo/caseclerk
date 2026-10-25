# CaseClerk architecture (build contract, S3)

Status: locked 2026-10-25 by the PM. Changes go through the PM (one line in your report: what, why).
Read with `docs/DESIGN.md` §4 A, §5 and `docs/experiments.md` (spike facts: what the sandbox really does).

## What the demo must show (done = this works on the hosted URL)
1. A judge presses **Open test dispute** → we create a sandbox card payment with tracking and a sandbox chargeback (process-chargeback simulator) → PayPal's `CUSTOMER.DISPUTE.CREATED` webhook arrives (~3 min) → a case appears in the inbox.
2. The agent triages (cheap model), gathers context with tools (dispute, order, tracking, transactions), decides (fight / refund / offer / accept) with an expected-value estimate under the seller policy, and acts: builds the evidence PDF and calls provide-evidence, or proposes a refund/offer. Money above the policy threshold waits in **Approvals**.
3. Every step lands in the case **timeline** (audit log) with the agent's reasoning, tool calls and cost.
4. Each `UPDATED` webhook re-runs the agent on the new state (actions are gated by PayPal's HATEOAS links; see experiments.md: ~2.5–4 min before evidence is allowed, ~3.5 min before the simulators). Sandbox **demo controls** on the case page call require-evidence / adjudicate so a judge can finish a case.
5. The **deadline board** (Bryntum Scheduler) shows open cases on a timeline to their seller response due date.
6. Inquiry-stage disputes (buyer messages, offers) are added when the buyer-consent route works (PM tracks it); until then the code supports send_message / make_offer but they only appear when PayPal's links allow them.

## Data flow
```
PayPal sandbox ──webhook──▶ src/app/api/webhooks/paypal (verify → dedupe event id → fetch snapshot → upsert case → audit)
                                   │ after()  (respond 200 at once; agent runs after the response, Vercel max 300 s)
                                   ▼
                     src/lib/agent/run.ts  runAgent(caseId, trigger)
                       triage → tools (src/lib/paypal/*) → decide → policy gate → execute or queue approval
                                   │                                  │
                                   ▼                                  ▼
                     src/lib/db (Neon Postgres)  ◀──────────  UI (server components + /api routes)
```

## Modules, owners, interfaces (owned paths never overlap)

### W1 PayPal + evidence — owns `src/lib/paypal/**`, `src/lib/evidence/**`, `scripts/**`, `tests/paypal/**`
- `client.ts` (exists): `getAccessToken()`, `paypalFetch(path, init)`. Add retries on 5xx/429 and on the sandbox's spurious 400 right after a link appears (spike: one adjudicate 400 then 200), returning `{status, debugId, json}`.
- `disputes.ts`: `getDispute(id): Promise<DisputeSnapshot>`, `listDisputes(q)`, `sendMessage(id, text)`, `makeOffer(id, {offerType: "REFUND"|"REFUND_WITH_RETURN"|"REFUND_WITH_REPLACEMENT"|"REPLACEMENT_WITHOUT_REFUND", amount?, note})`, `provideEvidence(id, {evidences: [...], files: {name, bytes: Uint8Array, contentType}[]})` (multipart, < 4.5 MB total), `acceptClaim(id, {note, refundAmount?})`, `acknowledgeReturn(id, note)`, `toSnapshot(raw)`, `allowed(raw): DisputeLinkRel[]`.
- `simulators.ts` (sandbox only): `processChargeback({captureId, amount, reasonCode})`, `requireEvidence(id)`, `adjudicate(id, "SELLER_FAVOR"|"BUYER_FAVOR")`, `createInquiry(...)` (buyer-side; works only after buyer consent).
- `orders.ts`: `createPaidCardOrder({amount, items, shipping})` (spike route: card payment source, completes without buyer), `getOrder(id)`, `getCapture(id)`.
- `tracking.ts`: `addTracking(captureId, {carrier, trackingNumber, status})`, `getTracking(captureId)`.
- `refunds.ts`: `refundCapture(captureId, amount?)` — **refuses if the capture has an open dispute** (other entrants saw a double payout in sandbox).
- `transactions.ts`: `searchTransactions({transactionId | dateRange})` (needs Transaction Search on the app; PM gets it ticked: return a typed "not enabled" error until then).
- `testDispute.ts`: `openTestDispute({scenario})` → order + tracking + chargeback; returns `{disputeId?, captureId, orderId}` (the dispute id may need a lookup by capture: listed after 42–70 s).
- `webhook.ts` (exists): `verifyWebhookSignature(headers, raw)`.
- `src/lib/evidence/pdf.ts`: `buildEvidencePdf(input: {case: CaseRecord; order: OrderContext; narrative: string; exhibits: {title, body}[]}): Promise<Uint8Array>` (pdf-lib; one clean, judge-readable pack).
- Contract tests `tests/paypal/*.test.ts` against the sandbox (env from the env file), runnable with one command.

### W2 Agent — owns `src/lib/agent/**`, `src/lib/spend/**`, `src/lib/types.ts`, `tests/agent/**`, `eval/**`
- `runAgent(caseId, trigger: {kind: "webhook"|"approval"|"manual"; eventType?: string}): Promise<void>` — idempotent per (caseId, snapshot.updateTime); a per-case lock (DB advisory lock or row flag) so overlapping webhooks don't double-act.
- Triage: `claude-haiku-5-5` (effort per the triage check, see below). Decisions, evidence narrative, buyer messages: `claude-opus-5-5`, effort **medium**, set explicitly. `@anthropic-ai/sdk` direct tool use, `tool_choice: auto` (forced tool_choice returns 400 on Opus 5.5), strict tool schemas, prompt caching on tools + system prompt. Never Opus for triage (owner #436).
- Tools wrap W1 functions; every write tool passes `policyGate(action, policy)` → `execute | awaiting_approval | blocked`, honours `dryRun`, and only offers actions whose link rel is in `snapshot.allowed`.
- `executeApproved(actionId)` / `deny(actionId)` for the Approvals UI.
- `src/lib/spend/`: price table (per MTok: Opus 5.5 $4 in / $20 out, Haiku 5.5 $0.10 / $0.50, Sonnet 5.5 $2 / $10; cached-read and cache-write multipliers per the claude-api skill), `reserve(estimateUsd)` before each LLM call and `record(usage)` after, from the API's `usage`. **Hard caps (env, defaults):** `SPEND_CAP_TOTAL_USD=45` (all-time, covers judging to 12/15; the owner's budget is $60 incl. dev), `SPEND_CAP_DAILY_USD=4`, `AGENT_RUNS_PER_DAY=60`, `TEST_DISPUTES_PER_IP_PER_DAY=3`. Over a cap: no LLM call; the case shows "demo budget reached" and the agent's last recorded run for that scenario (replay fixtures in `src/lib/agent/fixtures/`).
- Triage check (owner #436 / CTO 10:3x): label ~10 sandbox disputes by hand; try in order Haiku 5.5 medium → Haiku 5.5 high → Sonnet 5.5 low → Sonnet 5.5 medium; take the first that gets all right. Script in `eval/`; result in `docs/experiments.md`.

### W3 UI — owns `src/app/**` except `src/app/api/**`; `src/components/**`; `public/**`; `docs/design/**`
- Pages: `/` landing (what it is, one CTA: Open test dispute), `/inbox`, `/cases/[id]` (timeline, evidence pack preview/download, agent reasoning, approve/deny, demo controls), `/approvals`, `/settings` (seller policy), `/board` (Bryntum deadline board; exists from the spike).
- Reads through W4's repo functions in server components, writes through W4's API routes. Live updates: poll `/api/cases/[id]` every few seconds (no websockets on Hobby).
- Design starts with two distinct drafts and the owner's pick (PM runs it); no build-out before the pick.

### W4 Data + routes + ops — owns `src/lib/db/**`, `db/**`, `src/app/api/**`, `vercel.json`, `next.config.ts`, `tests/db/**`
- Neon Postgres (free, via Vercel's Neon integration on project `caseclerk`; `DATABASE_URL` lands in Vercel env). `@neondatabase/serverless`. SQL migrations in `db/migrations/*.sql`, applied by one script.
- Repo (`src/lib/db/index.ts`): `cases.{upsertFromSnapshot, get, list, setTriage, setDecision, setStatus, setOrder}`, `actions.{insert, update, get, listByCase, listAwaitingApproval}`, `audit.{append, listByCase}`, `policy.{get, set}`, `spend.{add, totals}`, `webhookEvents.insertIfNew(eventId)`, `rateLimit.hit(key, limit, windowS)`, `locks.withCaseLock(caseId, fn)`. Ship an in-memory implementation behind the same interface first (others build against it), then Postgres.
- Routes: `api/webhooks/paypal` (exists; extend: verify → dedupe → `getDispute` → upsert → audit → `after(() => runAgent(...))`), `api/cases` (GET list), `api/cases/[id]` (GET case + actions + audit), `api/actions/[id]/approve|deny` (POST), `api/policy` (GET/PUT), `api/test-dispute` (POST, rate-limited per IP, calls W1 `openTestDispute`, records the capture so the webhook links it to `isTestDispute`), `api/cases/[id]/simulate` (POST require-evidence/adjudicate, test disputes only), `api/health`.
- Deploy: Git pushes to `main` deploy production on Vercel (commit author must be `ianlyoo <25081480+ianlyoo@users.noreply.github.com>`); `next build --webpack` (Turbopack OOMs on Bryntum).

## Conventions
- TypeScript strict; Next 16.4 App Router; Node runtime for routes; `export const maxDuration = 300` only on routes that run the agent.
- Secrets only from env. Server code never logs secrets, full names, emails, addresses or message bodies; IDs and states only.
- Each worker works on its own branch `s3-w<n>-<name>` in its own worktree, pushes often, and asks the PM to merge (PM merges to `main`). `package.json`/lockfile: add only what you need; the PM resolves lockfile merges.
- Tests: vitest. No local `next build` loops on Oracle (shared, loaded): typecheck + unit tests locally, builds on Vercel previews.
- Production (deploys from `main`): https://caseclerk.vercel.app — PayPal webhook URL: https://caseclerk.vercel.app/api/webhooks/paypal
