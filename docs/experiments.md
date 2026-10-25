# Experiments

Spikes and checks, with date, setup and result.

## Spike 2026-10-25 — CaseClerk go/no-go (in progress)

**Recommendation: PENDING (not decided yet).** No PayPal call has run so far. The sandbox keys and sandbox account emails haven't arrived, so criteria 1–3 are untested. The app scaffold, webhook route and Bryntum board build on Vercel, but the preview is behind Vercel Authentication. That blocks PayPal webhooks (2) and the board screenshot (4) until the project owner picks a protection setting (open items below). From the docs alone, route (b) process-chargeback needs only the app token. Route (a), buyer-side create-dispute, needs the `DISPUTE_CREATE` scope, which the docs say a PayPal account manager must add, plus a Log in with PayPal consent. (b) or (c) is therefore the likely route.

Worker: g251 spike, branch `spike`. Times KST. Started 10:16.

### Setup (done)
- Versions (npm, checked 2026-10-25): next 16.4.3, react/react-dom 19.3.1, @bryntum/scheduler-trial 7.3.7 installed as `@bryntum/scheduler` (npm alias, as Bryntum's AGENTS.md requires for the React wrapper), @bryntum/scheduler-react 7.3.7, @vercel/functions 3.10.3, pdf-lib 1.17.1. TypeScript **6.0.3**, not 7.0.2 (latest): TS 7 is the native port, and Next's build-time type check still loads the JS `typescript` API, so I took the safe option.
- Code: `src/app/api/webhooks/paypal/route.ts` (verify via `/v1/notifications/verify-webhook-signature`, raw body spliced in, logs event type + resource id + status/stage only; 503 when PayPal env missing so PayPal retries; GET = cold-start probe), `src/lib/paypal/{client,webhook}.ts`, `/board` (Bryntum, client-only `next/dynamic` with `ssr:false`), `scripts/spike/*.mjs` (orders, disputes incl. simulators + multipart evidence with generated PDF, webhooks), `scripts/spike/run.sh` (loads the key file; never prints). `.env.example` has key names only.
- Vercel: project `caseclerk` created in team `ianlyoo0412-4658s-projects`, Git repo connected, framework set via `vercel.json`.

### Findings so far
| # | Item | Result | Evidence |
|---|---|---|---|
| V1 | Git-triggered deploys (push to `spike`) and `vercel deploy` from the checkout | **Blocked**: "Vercel couldn't find a Git account for the commit author" (author `ahnryu0412@gmail.com` isn't linked to the Vercel account; Hobby blocks this) | dpl_2FZQnBtMwDSJJxRoK9q22uSRW9mp, dpl_H3xSnTBNqqUzimKzhxEivnkUXXf6 |
| V2 | `vercel deploy` from a `git archive` export (no git metadata) | Works (preview) | dpl for caseclerk-kzdxmqjx9 (Ready) |
| V3 | Turbopack build (`next build`, Next 16 default) | **OOM SIGKILL** in Vercel's 8 GB builder, ~56 s in, while bundling the 4.6 MB obfuscated Bryntum ESM | caseclerk-4km8xw4ln (Error) |
| V4 | Webpack build (`next build --webpack`) | **Ready**, build 34 s; routes: `/`, `/board` static, `/api/webhooks/paypal` dynamic | caseclerk-kzdxmqjx9 |
| V5 | Preview reachability | 302 → Vercel SSO login on every path (Deployment Protection `all_except_custom_domains`). PayPal can't deliver webhooks until changed | curl 2026-10-25 10:3x |

### Criterion 5 — Vercel Hobby limits
- maxDuration: Hobby with fluid compute = default 300 s, max 300 s (vercel.com/docs/functions/limitations, read 2026-10-25). The webhook route sets `maxDuration = 60`.
- Cold start of the webhook route: **not measured yet** (preview not reachable, V5).
- A ~60 s agent run fits inside 300 s. Still, ack the webhook at once and run the agent in `after()` (Next 16) / `waitUntil` (@vercel/functions): PayPal expects a fast 2xx and retries otherwise.
- Request body limit 4.5 MB: evidence uploads must stay under it (PM delta 2).

### Criterion 1 — sandbox dispute creation (docs read, not run)
- Spec `developer.paypal.com/api/customer-disputes/v1/schema.json` (fetched 2026-10-25) does **not** list `POST /v1/customer/disputes` (create). The testing guide `developer.paypal.com/disputes/test-go-live.md` does: multipart `input` part (JSON: `disputed_transactions[].buyer_transaction_id`, `reason`, `dispute_amount`, `extensions`), header `PayPal-Auth-Assertion` = unsigned JWT `{iss: client_id, email: buyer_email}`.
- Its prerequisite (`/disputes/set-up.md`): "Contact your PayPal account manager to add" scope `DISPUTE_CREATE` (`https://uri.paypal.com/services/disputes/create`) to the REST app, plus buyer consent via Log in with PayPal. → (a) is likely blocked for a self-serve developer; will confirm with one call once keys arrive.
- (b) `POST /v2/customer-support/process-chargeback` (JSON; `merchant_id`, `transaction.id_enc` = seller transaction id, `instrument.instrument_type=CARD`, `dispute.stage=CHARGEBACK`, Visa reason `C2`) needs only the app token. The guide says chargebacks need a card-funded transaction → `orders.mjs create-card` (sandbox test card, no buyer approval).
- (c) Resolution Center UI as the sandbox Personal account: fallback.
- Docs: "wait a few minutes after creating the dispute for the actions to become available".

### Criterion 3 — action shapes (from the docs; not run)
- send-message: JSON `{message}` (or multipart `input` + `file1`); INQUIRY stage only.
- make-offer: JSON `{note, offer_amount, offer_type}`; INQUIRY stage only.
- provide-evidence: multipart, `input` = `{"evidences":[{"evidence_type":"PROOF_OF_FULFILLMENT","evidence_info":{"tracking_info":[{"carrier_name":"USPS","tracking_number":"…"}]},"notes":"…"}]}` (type application/json) + `file1` PDF. Seller only when status `WAITING_FOR_SELLER_RESPONSE`. Sandbox internal-dispute scenarios use `OTHER` as the evidence type.
- require-evidence `{action: SELLER_EVIDENCE}` and adjudicate `{adjudication_outcome: SELLER_FAVOR}`: only when status `UNDER_REVIEW` and the matching HATEOAS link is present.

### Open items
1. **Vercel Deployment Protection** on project `caseclerk` (owner decision; my API change to `ssoProtection: null` was refused by the permission guard): either turn Vercel Authentication off for this project (Settings → Deployment Protection; there's no "production only" option), or create a Protection Bypass for Automation and register the webhook as `…/api/webhooks/paypal?x-vercel-protection-bypass=<secret>` (then that URL is a secret held by PayPal). URL: https://vercel.com/ianlyoo0412-4658s-projects/caseclerk/settings/deployment-protection
2. **Vercel ↔ Git author**: link `ahnryu0412@gmail.com` / GitHub `ianlyoo` to the Vercel login (or commit as the Vercel account's email) so pushes to `spike` deploy; until then deploy from a `git archive` export.
3. PayPal sandbox keys in the env file + sandbox account emails (PM delta pending). Vercel env (Rhea): `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`; me: `PAYPAL_WEBHOOK_ID`.
