# Experiments

Spikes and checks, with date, setup and result.

## Spike 2026-10-25 — CaseClerk go/no-go

**Recommendation: GO (conditional).** We can create sandbox disputes by API without a browser: the process-chargeback simulator (route b) worked 3 times out of 3. Each dispute appeared in `GET /v1/customer/disputes` within 42–70 s. Real `CUSTOMER.DISPUTE.CREATED`, `UPDATED` and `RESOLVED` webhooks reached the Vercel preview. On 2 disputes, provide-evidence (multipart with a generated PDF and tracking), require-evidence and adjudicate took each case from creation to `RESOLVED` in 21 and 51 minutes, with no human step. Three conditions remain, and each costs a setting or a demo choice rather than the concept:
- **Signature verification on Vercel is still untested.** The route works, but `PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET` aren't set on the Vercel project yet, so every event logged `verify=NOT_CONFIGURED` and got a 503.
- **The buyer-negotiation part (send-message, make-offer) is untested.** Those actions only work on *inquiry*-stage disputes. Chargebacks return 422 `ACTION_NOT_ALLOWED_IN_CURRENT_DISPUTE_STATE` for both. Inquiry disputes need route (a), which needs buyer consent through Log in with PayPal (not enabled on the app), or route (c), which needs the sandbox buyer's login.
- **Adjudicating SELLER_FAVOR on a chargeback gave `RESOLVED_WITH_PAYOUT`, not `RESOLVED_SELLER_FAVOUR`.** PayPal's definition is "PayPal provided the merchant or customer with protection". The demo board/video must explain this code or use an inquiry dispute.

If (a) or (c) can't be unlocked by 11/1, CaseClerk still demos end to end: chargeback → webhook → agent writes and submits the evidence pack → settled. The "negotiates with the buyer" claim would then be dropped or shown on a replayed fixture.

Worker: g251 spike, branch `spike`. Times KST. Started 10:16.

### Setup (done)
- Versions (npm, checked 2026-10-25): next 16.4.3, react/react-dom 19.3.1, @bryntum/scheduler-trial 7.3.7 installed as `@bryntum/scheduler` (npm alias, as Bryntum's AGENTS.md requires for the React wrapper), @bryntum/scheduler-react 7.3.7, @vercel/functions 3.10.3, pdf-lib 1.17.1. TypeScript **6.0.3**, not 7.0.2 (latest): TS 7 is the native port, and Next's build-time type check still loads the JS `typescript` API, so I took the safe option.
- Code: `src/app/api/webhooks/paypal/route.ts` (verify via `/v1/notifications/verify-webhook-signature`, raw body spliced in, logs event type + resource id + status/stage only; 503 when PayPal env missing so PayPal retries; GET = cold-start probe), `src/lib/paypal/{client,webhook}.ts`, `/board` (Bryntum, client-only `next/dynamic` with `ssr:false`), `scripts/spike/*.mjs` (orders, disputes incl. simulators + multipart evidence with generated PDF, webhooks), `scripts/spike/run.sh` (loads the key file; never prints). `.env.example` has key names only.
- Vercel: project `caseclerk` created in team `ianlyoo0412-4658s-projects`, Git repo connected, framework set via `vercel.json`.

### Deploy findings
| # | Item | Result | Evidence |
|---|---|---|---|
| V1 | Git-triggered deploys (push to `spike`) and `vercel deploy` from the checkout | **Blocked**: "Vercel couldn't find a Git account for the commit author" (author `ahnryu0412@gmail.com` isn't linked to the Vercel account; Hobby blocks this) | dpl_2FZQnBtMwDSJJxRoK9q22uSRW9mp, dpl_H3xSnTBNqqUzimKzhxEivnkUXXf6 |
| V2 | `vercel deploy` from a `git archive` export (no git metadata) | Works (preview) | dpl for caseclerk-kzdxmqjx9 (Ready) |
| V3 | Turbopack build (`next build`, Next 16 default) | **OOM SIGKILL** in Vercel's 8 GB builder, ~56 s in, while bundling the 4.6 MB obfuscated Bryntum ESM | caseclerk-4km8xw4ln (Error) |
| V4 | Webpack build (`next build --webpack`) | **Ready**, build 34 s; routes: `/`, `/board` static, `/api/webhooks/paypal` dynamic | caseclerk-kzdxmqjx9 |
| V5 | Preview reachability | 302 → Vercel SSO login on every path (Deployment Protection `all_except_custom_domains`) | curl 2026-10-25 10:3x |
| V6 | Deployment Protection off | The PM ran `vercel project protection disable caseclerk --sso` (~11:1x) → `ssoProtection: null`; previews return 200 publicly (judges need a public demo anyway) | curl 11:2x: `/`, `/board`, `/api/webhooks/paypal` → 200 |
| V7 | Git deploys with the GitHub noreply author `ianlyoo <25081480+ianlyoo@users.noreply.github.com>` | **Works**: push of 6de901c → preview `caseclerk-pi3hwgaqy` Ready (build ~2 min); 14d72a3 → `caseclerk-qtkno4f3v` Ready. `vercel deploy` (git-less) no longer needed | Vercel deployments API, GitHub status "Vercel success" |
| V8 | Failed deployments serve HTTP 200 | `caseclerk-4km8xw4ln` (the OOM build) answers 200 with Vercel's error HTML on every path: check the body or deployment state, not the status code | curl 11:2x |

### Criterion 4 — Bryntum Scheduler trial on the preview: **worked**
- `/board` on `caseclerk-qtkno4f3v` (commit 14d72a3): 3 dispute rows, 3 bars on a deadline timeline, no console errors. Headless Playwright on the Mac (fresh context, temp dir removed): page ready in 3.8 s, `.b-sch-event` = 3. Screenshot: `docs/spike/board-2026-10-25.png`.
- Trial watermark: diagonal "Bryntum" / "Trial Version" text tiled across the timeline background (visible but light). Fine for the demo; the license question goes to the sponsor-prize rules.
- Bundle: Bryntum chunk is 1,395 KB over the wire (compressed), loaded only on `/board` via `next/dynamic({ ssr:false })`; no SSR issues once client-only.
- Build: **Turbopack OOM** (V3) → `next build --webpack` required (V4). Install needs the npm alias `@bryntum/scheduler@npm:@bryntum/scheduler-trial@7.3.7`; postinstall scripts of `@bryntum/scheduler-trial(-lib)` run on Vercel (npm warns "not yet covered by allowScripts", still fine).

### Criterion 5 — Vercel Hobby limits
- maxDuration: Hobby with fluid compute = default 300 s, max 300 s (vercel.com/docs/functions/limitations, read 2026-10-25). The webhook route sets `maxDuration = 60`.
- Cold start of the webhook route (fresh deployment `pi3hwgaqy`, GET probe from Oracle/KR): first call TTFB 0.76 s (`coldStart:true`), warm 0.28–0.84 s. Functions run in **hkg1** (Vercel log `region:hkg1`, `nodejs24.x`), not iad1. POST with no PayPal env → 503 in 0.68 s, log line seen in `vercel logs`.
- A ~60 s agent run fits inside 300 s. Still, ack the webhook at once and run the agent in `after()` (Next 16) / `waitUntil` (@vercel/functions): PayPal expects a fast 2xx and retries otherwise.
- Request body limit 4.5 MB: evidence uploads must stay under it (PM delta 2).

### Criterion 1 — sandbox dispute created programmatically: **worked (route b)**
App token scopes (11:32) include `disputes/create`, `disputes/read-seller`, `disputes/update-seller`, `disputes/read-buyer`, `documents/disputes/download`.

| Route | Request shape | Result |
|---|---|---|
| Payment | `POST /v2/checkout/orders` intent CAPTURE, `payment_source.card` (PayPal's sandbox Visa test number), no buyer redirect | 201, status COMPLETED at once (capture in the response). No buyer approval needed. Orders 6JA992408R656953R → capture 2UN05916MP311444Y ($12.00); 1SL02366B32958337 → 2AK992325N898981H ($9.50); a third $12.00. Seller merchant_id LNGYMM7567428 (US Business sb-gsgbb…). |
| (a) buyer-side create simulator | `POST /v1/customer/disputes`, multipart `input` (`disputed_transactions[].buyer_transaction_id`, `reason` INR, `dispute_amount`, `extensions`), header `PayPal-Auth-Assertion` = unsigned JWT `{iss: client_id, email: sandbox buyer}` | **400** `invalid_request` "No permissions to set target_client_id" (debug ca4fdd08b9994). The guide requires buyer consent through Log in with PayPal first, and that feature isn't ticked on the app. Only 1 attempt, because it's a known missing prerequisite (open item 4). Note: that call used the seller capture id, not a buyer transaction id; the buyer transaction id is in each dispute's `disputed_transactions`. |
| (b) process-chargeback simulator | `POST /v2/customer-support/process-chargeback` JSON: `adjacency PAYPAL`, `file_layout ATCK_CB`, `merchant_id`, `financial_institution.processor FDMS`, `transaction.id_enc` = capture id, `instrument CARD/VISA`, `dispute.stage CHARGEBACK`, `event_code CHARGEBACK_INITIATED`, `processor_info.reason_code C2`, dates now / +10 d | **201** ×3: `PP-R-ADC-10194432` (11:33:14), `PP-R-FHJ-10194434` (11:53), `PP-R-LSA-10194438` (12:4x). Run 2 accidentally omitted `merchant_id` and was still accepted. |
| (c) buyer Resolution Center UI | — | Not tried: no agent access to the sandbox buyer's password (delta 4). |

- `GET /v1/customer/disputes/{id}` works at once. `GET /v1/customer/disputes?disputed_transaction_id=…` lists the dispute after **42–70 s** (3 runs).
- Created dispute: reason `MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED` (Visa C2 maps to SNAD), stage `CHARGEBACK`, channel `EXTERNAL`, status `OPEN` → `UNDER_REVIEW` within 30 s → `WAITING_FOR_SELLER_RESPONSE` after **2.5–4 min**. Requested evidence: PROOF_OF_FULFILLMENT / PROOF_OF_REFUND / OTHER. `seller_response_due_date` 2026-11-04 (+10 d). `seller_protection_eligible: false`, transaction_status `HELD`.
- To repeat: `scripts/spike/run.sh flow.mjs chargeback 12.00` (one command; prints the dispute id and how long until it's listed).

### Criterion 2 — webhook on the Vercel preview: **partial (received, not yet verified)**
- Webhook `8WA28778R9206880F` registered (`POST /v1/notifications/webhooks` → 201) on the branch alias `https://caseclerk-git-spike-ianlyoo0412-4658s-projects.vercel.app/api/webhooks/paypal` for CUSTOMER.DISPUTE.CREATED/UPDATED/RESOLVED + PAYMENT.CAPTURE.COMPLETED/REVERSED/REFUNDED. `PAYPAL_WEBHOOK_ID` set on Vercel (preview + production).
- Real events received (Vercel logs, first delivery per event, UTC), dispute PP-R-ADC-10194432:

| UTC | Event | Resource | Status in payload |
|---|---|---|---|
| 02:33:51 | PAYMENT.CAPTURE.COMPLETED | 2UN05916MP311444Y | COMPLETED |
| 02:36:34 | CUSTOMER.DISPUTE.CREATED (3 min 18 s after creation) | PP-R-ADC-10194432 | UNDER_REVIEW |
| 02:37:04 | CUSTOMER.DISPUTE.UPDATED | 〃 | WAITING_FOR_SELLER_RESPONSE |
| 02:38:04 | CUSTOMER.DISPUTE.UPDATED (after evidence) | 〃 | UNDER_REVIEW |
| 02:42:34 | CUSTOMER.DISPUTE.UPDATED (after require-evidence) | 〃 | WAITING_FOR_SELLER_RESPONSE |
| 02:43:05 | CUSTOMER.DISPUTE.UPDATED (after evidence 2) | 〃 | UNDER_REVIEW |
| 02:49:04 | CUSTOMER.DISPUTE.UPDATED (after adjudicate) | 〃 | UNDER_REVIEW |
| 02:54:34 | CUSTOMER.DISPUTE.RESOLVED | 〃 | RESOLVED |

- Example log line: `[paypal-webhook] event=CUSTOMER.DISPUTE.RESOLVED event_id=WH-5AD658886Y7491104-9JS505336B8736906 resource_type=dispute resource_id=PP-R-ADC-10194432 status=RESOLVED … verify=NOT_CONFIGURED(PayPal env vars missing)`.
- Every delivery got 503 (by design while unconfigured), so PayPal retried each event several times (every ~30 s–2 min). No `PAYMENT.CAPTURE.REVERSED` arrived for the chargebacks.
- **Missing:** `verify-webhook-signature` = SUCCESS. It needs `PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET` on Vercel (open item 1), then one push to `spike` (to redeploy) and one new chargeback.

### Criterion 3 — act and settle: **worked for evidence + simulators; message/offer not possible on chargebacks**
Dispute PP-R-ADC-10194432 (all calls 200; seconds from creation 11:33:14):

| Step | Call | Result |
|---|---|---|
| +4 min | — | `WAITING_FOR_SELLER_RESPONSE`, links `provide_evidence, accept_claim` (no `send_message`/`make_offer`) |
| 11:37:44 | provide-evidence PROOF_OF_FULFILLMENT: multipart `input` JSON (`evidences[].evidence_type`, `evidence_info.tracking_info[{carrier_name USPS, tracking_number}]`, `notes`) + `file1` PDF (pdf-lib, 1 page) | 200 (debug f127334b45646) → `UNDER_REVIEW` in 9 s |
| +3.5 min | — | links `require_evidence, adjudicate` appear |
| 11:41:39 | require-evidence `{action: SELLER_EVIDENCE}` | 200 → `WAITING_FOR_SELLER_RESPONSE` after ~1 min |
| 11:42:40 | provide-evidence OTHER (notes + PDF) | 200 → `UNDER_REVIEW` |
| +3.5 min | — | `adjudicate` link back |
| 11:46:23 | adjudicate `{adjudication_outcome: SELLER_FAVOR}` | 200 → `RESOLVED` at 11:54:04 (7.7 min), outcome **RESOLVED_WITH_PAYOUT** |

- Dispute PP-R-FHJ-10194434 ($9.50), run unattended by `flow.mjs settle`: the same sequence, but the first adjudicate returned **400 MISSING_OR_INVALID_REQUEST_BODY** (same body; called in the same poll that first showed the link). A manual retry 35 min later → 200 → RESOLVED in 4 min, again RESOLVED_WITH_PAYOUT. The flow now retries failed actions.
- Dispute PP-R-LSA-10194438 at `WAITING_FOR_SELLER_RESPONSE`: make-offer (REFUND $3) → **422 ACTION_NOT_ALLOWED_IN_CURRENT_DISPUTE_STATE**; send-message → **422** same. Docs: send-message is INQUIRY-only. make-offer is listed for chargebacks in the guide, but the sandbox doesn't offer it (no link, 422). Left open.
- Waits and rules: every action is gated by its HATEOAS link. Expect ~2.5–4 min after creation before evidence is possible, and ~3.5 min after each evidence before require-evidence/adjudicate appear. Adjudicate → RESOLVED took 4–8 min. Allow ~20–25 min end to end for a demo run, or pre-create disputes.
- Refunds weren't touched, so the "refund on an open chargeback = double payout" report (delta 2) is unchecked.
- To repeat: `scripts/spike/run.sh flow.mjs settle <dispute_id>`.

### Open items
1. ~~Vercel Deployment Protection~~: done by the PM (V6).
2. ~~Vercel ↔ Git author~~: fixed by committing as the GitHub noreply address (V7).
3. ~~PayPal keys in the env file~~ (in since 11:32); sandbox emails in the gitignored `scripts/spike/.env.spike`.
4. **Vercel env (Rhea): `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`** (Sensitive, preview + production) on project `caseclerk`, the same sandbox values as the env file. Then push to `spike` and run one chargeback to show `verify=SUCCESS`.
5. **Inquiry disputes (send-message / make-offer)**: tick **Log in with PayPal** on the sandbox app `CaseClerk` (developer.paypal.com → Apps & Credentials → CaseClerk → Features), set a return URL, and have the sandbox buyer `sb-7qeht53532609@personal.example.com` grant consent once (needs that buyer's sandbox login, an owner step). Then retry route (a). Alternative: the owner opens one INR case in the sandbox buyer UI (route c).
6. Decide how the demo shows `RESOLVED_WITH_PAYOUT` (chargeback "won").
