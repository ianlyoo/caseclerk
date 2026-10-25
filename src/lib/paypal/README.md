# src/lib/paypal: PayPal sandbox clients

Server-only. Import from `@/lib/paypal` (barrel) or the single files. Sandbox only: `paypalFetch` refuses any API base that isn't `*.sandbox.paypal.com`. Env: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, optional `PAYPAL_API_BASE`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_MERCHANT_ID` (fallback for the chargeback simulator), `PAYPAL_SANDBOX_BUYER_EMAIL` (inquiry simulator).

## Functions

| File | Function | Notes |
|---|---|---|
| `client.ts` | `getAccessToken()`, `getToken()`, `paypalFetch(path, init)` | Returns `{status, debugId, json}` or throws `PayPalError` (`status`, `debugId`, `errorName`, `issue`). Retries 429/5xx/network errors (1 s, 3 s, 8 s; honours `Retry-After`) and refreshes the token once on 401. `retryOn400: true` also retries 400 after 5 s and 15 s (the sandbox's spurious 400 right after a link appears). `requestId` sets `PayPal-Request-Id`. |
| `disputes.ts` | `getDispute`, `getDisputeRaw`, `listDisputes`, `sendMessage`, `makeOffer`, `provideEvidence`, `acceptClaim`, `acknowledgeReturn`, `toSnapshot`, `allowed` | `provideEvidence` sends multipart (`input` JSON + `file1..n`), PDF/PNG/JPG/GIF only, < 4.5 MB in total, and retries the spurious 400. Write calls return `{status, debugId}`. |
| `simulators.ts` | `processChargeback`, `requireEvidence`, `adjudicate`, `createInquiry` | Sandbox only. `createInquiry` needs the buyer's Log in with PayPal consent (see `consent.ts`). |
| `orders.ts` | `createPaidCardOrder`, `getOrder`, `getCapture`, `toOrderContext` | Card route with PayPal's sandbox Visa test number: COMPLETED in one call, no buyer step. `toOrderContext` drops names and addresses (country only). |
| `tracking.ts` | `addTracking`, `getTracking`, `trackingUrl` | `/v1/shipping/trackers-batch` on the capture id. A 200 that contains only `errors` is thrown as `PayPalError`. |
| `refunds.ts` | `refundCapture(captureId, amount?)` | Throws `RefundBlockedError` when any dispute on the capture isn't RESOLVED (refund + chargeback = double payout), or the capture isn't COMPLETED/PARTIALLY_REFUNDED. |
| `transactions.ts` | `searchTransactions({transactionId} \| {dateRange})` | Throws `NotEnabledError` on 403/NOT_AUTHORIZED (Transaction Search not ticked on the app). Window max 31 days. |
| `testDispute.ts` | `openTestDispute({scenario})` | Order from a handmade-goods shop (1–2 items + $5.95 shipping) → USPS tracking DELIVERED → chargeback. Returns `{disputeId, orderId, captureId, amount, order: OrderContext, debugIds}`. |
| `webhook.ts` | `verifyWebhookSignature(headers, raw)` | Raw body spliced in unchanged. |
| `consent.ts` | `consentUrl`, `consentRedirectUri` | Buyer consent for the inquiry simulator. |
| `../evidence/pdf.ts` | `buildEvidencePdf({case, order, narrative, exhibits, seller?, amountCharged?})` | pdf-lib, US Letter, 1–3 pages, ~6 KB. Sample: `docs/samples/evidence-sample.pdf`. |

## Test-dispute scenarios and reason codes (sandbox, checked 2026-10-25)

| Scenario | Code sent to process-chargeback | Dispute reason |
|---|---|---|
| `not_received` | Visa `13.1` | MERCHANDISE_OR_SERVICE_NOT_RECEIVED |
| `not_as_described` | Visa `C2` | MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED |

Mastercard `4855` and Visa `30` also give NOT_RECEIVED. Visa `10.4` (fraud), `12.6.1` (duplicate) and `13.7` (cancelled) all come back as reason `OTHER`, so those scenarios aren't offered.

## Sandbox quirks

- **The chargeback simulator returns the dispute id** (`{"dispute_id": "PP-R-..."}`) and `GET /disputes/{id}` works at once. Listing by capture (`disputed_transaction_id`) lags 42–70 s. `openTestDispute` only polls the list when the id is missing (up to 90 s).
- **Timings:** OPEN → UNDER_REVIEW in about 30 s → WAITING_FOR_SELLER_RESPONSE after 2.5–4 min (`provide_evidence`, `accept_claim` links). After evidence: UNDER_REVIEW at once, then `require_evidence`/`adjudicate` appear after about 3.5 min. Adjudicate → RESOLVED takes 4–8 min. The `CUSTOMER.DISPUTE.CREATED` webhook arrives about 3 min after creation.
- **Link gating:** every action needs its HATEOAS link (`snapshot.allowed`); otherwise PayPal answers 422 `ACTION_NOT_ALLOWED_IN_CURRENT_DISPUTE_STATE`. Chargebacks never offer `send_message`/`make_offer` (INQUIRY only), even though the guide lists make-offer for chargebacks.
- **Spurious 400:** adjudicate once returned 400 `MISSING_OR_INVALID_REQUEST_BODY` in the same poll that first showed the link; the identical body later returned 200. Simulator and evidence calls retry 400 twice.
- **`RESOLVED_WITH_PAYOUT`:** adjudicating SELLER_FAVOR on a chargeback ends with this outcome (`outcome_reason REPRESENTED_BY_PAYPAL`, adjudication `PAYOUT_TO_BUYER`). PayPal covered the buyer and released the seller's hold (`fund_movements` HOLD_PLACED then HOLD_RELEASED), so the seller keeps the money. Show it as "won: PayPal covered the chargeback".
- **Tracking:** `last_updated_time` comes back as epoch ms in a string; `getTracking` converts it to ISO.
- **Refund guard blind spot:** a chargeback filed less than about a minute ago isn't listed by capture yet, so `refundCapture` can't see it.
- **Transaction Search:** 403 NOT_AUTHORIZED until the feature is ticked on the REST app → `NotEnabledError`.

## Tests

```bash
npx vitest run tests/paypal                 # unit tests with real (PII-stripped) fixtures, no network
scripts/test-live.sh                        # live sandbox suite (PAYPAL_LIVE_TESTS=1, keys from the key file)
scripts/test-live.sh -t provideEvidence     # one live test
```

Live suite: token scopes, list/get, `toSnapshot` on a live payload, `openTestDispute` for both scenarios (incl. tracking, capture, order, listed by capture), `provideEvidence` on a dispute in WAITING_FOR_SELLER_RESPONSE (set `PAYPAL_LIVE_EVIDENCE_DISPUTE` to pick one), Transaction Search.

Scripts (keys loaded by `scripts/run.sh`, which runs TypeScript with Node's type stripping):

```bash
scripts/run.sh scripts/open-test-dispute.ts not_received     # prints ids
scripts/run.sh scripts/fetch-dispute-fixture.ts <id> <name>  # new PII-stripped fixture
node --import ./scripts/lib/register.mjs scripts/build-sample-evidence.ts   # docs/samples/evidence-sample.pdf
```
