# Real sandbox cases (W1, read-only check 2026-10-25 08:04 UTC / 17:04 KST)

## PP-R-RCJ-10194476: the chargeback that reached RESOLVED_WITH_PAYOUT

| Fact | Value | Source |
|---|---|---|
| Dispute id | **PP-R-RCJ-10194476** | PayPal GET /v1/customer/disputes (debug_id f98430432f60f) |
| Amount | **$27.95 USD** (order: "Hand-carved walnut serving spoon" + $5.95 shipping) | PayPal + production case |
| Reason | MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED (Visa C2 chargeback) | PayPal |
| Capture | 5X314671C5018893S | PayPal |
| Created at PayPal | 2026-10-25T06:21:32.847Z | PayPal |
| Seller evidence | PROOF_OF_FULFILLMENT with USPS tracking + PDF, 06:25:38Z | PayPal `evidences` |
| Adjudication | PAYOUT_TO_BUYER, reason REPRESENTED_BY_PAYPAL (06:29:28Z and 06:33:13Z) | PayPal |
| Money | HOLD_PLACED $26.74 at 06:24:34Z, **HOLD_RELEASED $26.74 at 06:31:04Z**, so the seller keeps the money. PayPal paid the buyer the $27.95. | PayPal `fund_movements` |
| Outcome | **RESOLVED / RESOLVED_WITH_PAYOUT**, PayPal update_time 2026-10-25T06:34:03.618Z | PayPal |

### Production (GET https://caseclerk.vercel.app/api/cases/PP-R-RCJ-10194476 → 200)
- Case present: status `resolved`, `isTestDispute: true`, created 06:24:37.514Z, updated 06:34:40.076Z.
- **Wire rows: none (`wire: []`).** The wire log (W4, 37fe4f6/d9f5959) went live after this case closed: the earliest production wire row is 2026-10-25T06:46:54Z, and this case resolved at 06:34:37Z.
- **Actions: none.** My `demo-prep.ts` script submitted the evidence (~06:25) and the SELLER_FAVOR adjudication (~06:29, debug_id f643790380816); the agent did not. The agent only triaged the case (claude-haiku-5-5: not_as_described) and closed it.
- Audit trail (webhooks all verified):
  - CREATED `WH-4X035198EM048054T-040813534R2790401`, 06:24:38.203Z
  - UPDATED `WH-3GP120108W2227139-411187508C651145N`, 06:25:38Z (WAITING_FOR_SELLER_RESPONSE)
  - UPDATED `WH-47K20443GS488694K-1RW21363DD207445M`, 06:26:07Z (UNDER_REVIEW)
  - UPDATED `WH-1CC56286A37625154-0J425982N1965573T`, 06:32:08Z
  - **RESOLVED: `WH-26V93469T1874702X-69U593859W7826638` (CUSTOMER.DISPUTE.RESOLVED), received 2026-10-25T06:34:37.754Z**
  - Agent `run.done` at 06:34:40.295Z: "PayPal closed the dispute (RESOLVED_WITH_PAYOUT). Nothing left to do."

### What this means for the screen
- Real and showable: the RESOLVED webhook event id and its time, the outcome, the hold release, and the full audit trail.
- Not showable from this case: agent-filed evidence and wire rows. It is a $27.95 case, not the $412 Olympus one. For a case with the agent's actions, the wire rows and the approval on camera, use the Olympus cases below.
- Caveat: sandbox adjudication is slow and uneven. The sibling PP-R-GDS-10194475, adjudicated the same way, was still UNDER_REVIEW 65+ min later.

## Olympus demo cases (W1 demo-prep, created 2026-10-25 08:33 UTC / 17:33 KST)

Command: `scripts/run.sh scripts/demo-prep.ts --stage evidence --scenario not_as_described --item "Olympus OM-1n body, chrome" --amounts 412.00,389.00 --shop "Northlight Camera Exchange"` (Visa C2, USPS tracking DELIVERED, free shipping, recorded as test captures). Checked 08:40 UTC.

| Dispute | Amount | Role | PayPal | Production case | Pending action |
|---|---|---|---|---|---|
| **PP-R-VPY-10194485** | $412.00 | **camera: do not approve** | WAITING_FOR_SELLER_RESPONSE, `provide_evidence` + `accept_claim` allowed, seller evidence 0, seller response due 2026-11-05 | `awaiting_approval` | `dce5fede-e03a-4d4e-8e99-d88af7bb177d` provide_evidence, awaiting_approval (created 08:38:42Z) |
| **PP-R-NJA-10194486** | $389.00 | **spare: PM approves, then adjudicate for a real RESOLVED** | WAITING_FOR_SELLER_RESPONSE, `provide_evidence` + `accept_claim` allowed, seller evidence 0, seller response due 2026-11-05 | `awaiting_approval` | `478bef1d-2e9f-48a5-bb4b-ab69c388b60a` provide_evidence, awaiting_approval (created 08:38:39Z) |

- Captures: VPY 87A591269F243581A (order 8ET827791C8276834); NJA 3D572951SP109543G (order 96R38279S7930044E).
- **Nothing sent:** on both cases the wire has only GET calls (disputes, captures, orders, trackers) and webhook verifications, with no provide-evidence. PayPal itself shows 0 seller evidences on both.
- Timeline: dispute created 08:33Z → CREATED webhook and triage ~08:37Z → WAITING_FOR_SELLER_RESPONSE ~08:37Z → agent prepared the filing and stopped at 08:38:4xZ (`action.awaiting_approval`, `agent.run.done`).
- After the PM approves NJA: once PayPal shows the `adjudicate` link (~3.5–20 min after evidence), W1 runs `scripts/run.sh scripts/demo-prep.ts --ids PP-R-NJA-10194486 --stage resolved` (SELLER_FAVOR → RESOLVED_WITH_PAYOUT; can take 5 min to over an hour).

### PP-R-NJA-10194486 ($389.00 spare): RESOLVED (checked 08:53 UTC)
- PM approved at 08:40:27Z: provide-evidence 200 (debug f8469524f503f), tracker restore PUT 204 (f398082a39fff). Action `478bef1d-…` is now `executed`.
- `adjudicate` link appeared at 08:44Z (+190 s). W1 adjudicated SELLER_FAVOR, 200 (debug ca4fff000c87c).
- PayPal: **RESOLVED / RESOLVED_WITH_PAYOUT**, update_time 2026-10-25T08:52:28.407Z, about 12 min after approval. Tracking still DELIVERED.
- **RESOLVED webhook: `WH-01G68820AD177843M-8SL79965VW8605524` (CUSTOMER.DISPUTE.RESOLVED), received 2026-10-25T08:52:39.179Z**, verify SUCCESS, processed. Agent `run.done` 08:52:46Z: "PayPal closed the dispute (RESOLVED_WITH_PAYOUT). Nothing left to do."
- Production case: **status `resolved`, 30 wire rows** from CREATED (08:37:05Z) to RESOLVED. The rows cover:
  - 5 verified webhook events
  - the agent's GETs (dispute, capture, order, trackers)
  - **the approved `POST …/provide-evidence` 200 f8469524f503f**
  - the tracker restore
- PP-R-VPY-10194485 ($412, camera): still `awaiting_approval`, 0 provide-evidence calls.

## Ceremony cases for the finals recordings (W1 demo-prep, created 2026-10-25 ~09:37 UTC / 18:37 KST)

Same command as above with `--amounts 405.00,398.00` (Olympus OM-1n body, chrome; Visa C2; USPS tracking DELIVERED; recorded as test captures). Checked 09:42 UTC.

| Dispute | Amount | Label | PayPal | Production case | Pending action |
|---|---|---|---|---|---|
| **PP-R-UDP-10194489** | $405.00 | **ceremony A: W3 may approve on camera** | WAITING_FOR_SELLER_RESPONSE, seller evidence 0, due 2026-11-05 | `awaiting_approval` | `a5723516-3171-48a8-a051-b236a8e3dbe9` provide_evidence (created 09:41:25Z) |
| **PP-R-LTK-10194490** | $398.00 | **ceremony B: W5 may approve on camera** | WAITING_FOR_SELLER_RESPONSE, seller evidence 0, due 2026-11-05 | `awaiting_approval` | `f4a7b703-aa55-4a59-a03d-20ed9574f0cc` provide_evidence (created 09:41:43Z) |

- Captures: UDP 8MN60180883817530; LTK 3XF555001T731522H.
- Nothing sent: 12 wire rows on each case, all webhook verifications and GETs, with no provide-evidence. PayPal shows 0 seller evidences.
- PP-R-VPY-10194485 ($412, camera): untouched, still `awaiting_approval`.
- After an on-camera approval, the case can be taken to RESOLVED with `scripts/run.sh scripts/demo-prep.ts --ids <id> --stage resolved` (NJA took 12 min).

### Ceremony results: both RESOLVED (checked 10:03 UTC)

| | PP-R-UDP-10194489 ($405, ceremony A / W3) | PP-R-LTK-10194490 ($398, ceremony B / W5) |
|---|---|---|
| Approved provide-evidence | 09:53:30.290Z, 200, debug f1926738baa71 (action `a5723516-…` executed) | 09:49:44.949Z, 200, debug f9050504c99e6 (action `f4a7b703-…` executed) |
| Tracker restore | PUT 204 (f4155141e4cd7); tracking still DELIVERED | PUT 204 (f15717752d682); tracking still DELIVERED |
| W1 adjudicate SELLER_FAVOR | 200, debug ca5005b567ac0 (+225 s after approval) | 200, debug f51868433f0db (+228 s after approval) |
| PayPal outcome | **RESOLVED / RESOLVED_WITH_PAYOUT**, update_time 10:02:33.789Z | **RESOLVED / RESOLVED_WITH_PAYOUT**, update_time 09:57:03.626Z |
| RESOLVED webhook | **`WH-12H06419PU0672732-6LK96409LB5284130`**, received **10:03:05.071Z**, verify SUCCESS, processed | **`WH-89J13573XG714130M-86S77966SN769621P`**, received **09:57:35.067Z**, verify SUCCESS, processed |
| Production case | status `resolved`, 30 wire rows; agent `run.done` 10:03:11Z "PayPal closed the dispute (RESOLVED_WITH_PAYOUT)" | status `resolved`, 30 wire rows; agent `run.done` 09:57:42Z, same text |
| Approval → RESOLVED | ~9 min | ~7.5 min |

PP-R-VPY-10194485 ($412) was not touched.

## Ceremony A2 (W1 demo-prep, created 2026-10-25 ~10:12 UTC)

Same command with `--amounts 402.00`. Checked 10:17 UTC.

| Dispute | Amount | Label | PayPal | Production case | Pending action |
|---|---|---|---|---|---|
| **PP-R-TZD-10194493** | $402.00 | **ceremony A2: W3 may approve on camera** | WAITING_FOR_SELLER_RESPONSE, seller evidence 0, due 2026-11-05 | `awaiting_approval` | `c3ca42c2-a0dd-49dc-9992-044b3f5c00ee` provide_evidence (created 10:16:47Z) |

- Capture 3SF344296A2880101. 12 wire rows (webhook verifications and GETs only), no provide-evidence.
- W1 is watching: once the approval's provide-evidence 200 shows on the wire, it adjudicates SELLER_FAVOR to reach RESOLVED.

### Ceremony A2 result: RESOLVED (checked 10:38 UTC)
- W3 approved: provide-evidence 10:25:02.204Z, 200, debug f182178f16410 (action `c3ca42c2-…` executed). Tracker restore PUT 204 (f90360124f9b7); tracking still DELIVERED.
- W1 adjudicate SELLER_FAVOR: 200, debug ca50089c3d9a6 (+226 s after approval).
- PayPal: **RESOLVED / RESOLVED_WITH_PAYOUT**, update_time 10:37:33.531Z (~12.5 min after approval).
- **RESOLVED webhook: `WH-59C997273G6307249-6CL447948G196870Y`, received 2026-10-25T10:38:06.289Z**, verify SUCCESS, processed.
- Production case: status `resolved`, 30 wire rows; agent `run.done` 10:38:11Z "PayPal closed the dispute (RESOLVED_WITH_PAYOUT)."

## Fund movements (PayPal GET /v1/customer/disputes/{id} and GET /v2/payments/captures/{id}, read 2026-10-25 ~10:45 UTC)

Fields PayPal returns on these disputes: `fund_movements`, `dispute_outcome`, `adjudications`, `refund_details`. The capture returns `seller_receivable_breakdown`. There is no seller payout, chargeback-fee or settlement field in either response.

| Case | Capture (gross / PayPal fee / net), capture status | fund_movements (party RECEIVER) | Outcome |
|---|---|---|---|
| PP-R-NJA-10194486 | $389.00 / $10.57 / $378.43, COMPLETED (not refunded) | DEBIT HOLD_PLACED $378.43 at 08:36:50Z; CREDIT HOLD_RELEASED $378.43 at 08:45:34Z | RESOLVED_WITH_PAYOUT, REPRESENTED_BY_PAYPAL, amount_refunded $389.00; adjudications PAYOUT_TO_BUYER 08:44:08Z and 08:51:23Z |
| PP-R-UDP-10194489 | $405.00 / $10.98 / $394.02, COMPLETED | DEBIT HOLD_PLACED $394.02 at 09:40:04Z; CREDIT HOLD_RELEASED $394.02 at 09:58:34Z | RESOLVED_WITH_PAYOUT, REPRESENTED_BY_PAYPAL, amount_refunded $405.00; PAYOUT_TO_BUYER 09:57:24Z and 10:01:33Z |
| PP-R-LTK-10194490 | $398.00 / $10.80 / $387.20, COMPLETED | DEBIT HOLD_PLACED $387.20 at 09:40:04Z; CREDIT HOLD_RELEASED $387.20 at 09:55:04Z | RESOLVED_WITH_PAYOUT, REPRESENTED_BY_PAYPAL, amount_refunded $398.00; PAYOUT_TO_BUYER 09:53:42Z and 09:56:13Z |
| PP-R-TZD-10194493 | $402.00 / $10.90 / $391.10, COMPLETED | DEBIT HOLD_PLACED $391.10 at 10:15:34Z; CREDIT HOLD_RELEASED $391.10 at 10:30:34Z | RESOLVED_WITH_PAYOUT, REPRESENTED_BY_PAYPAL, amount_refunded $402.00; PAYOUT_TO_BUYER 10:29:06Z and 10:36:23Z |
| PP-R-AAJ-10194495 | $396.00 / $10.75 / $385.25, COMPLETED | DEBIT HOLD_PLACED $385.25 at 10:59:34Z; CREDIT HOLD_RELEASED $385.25 at 11:29:46Z | RESOLVED_WITH_PAYOUT, REPRESENTED_BY_PAYPAL, amount_refunded $396.00; PAYOUT_TO_BUYER 11:28:39Z and 11:31:24Z |
| PP-R-IMW-10194496 | $393.00 / $10.67 / $382.33, COMPLETED | DEBIT HOLD_PLACED $382.33 at 10:59:34Z; CREDIT HOLD_RELEASED $382.33 at 11:34:04Z | RESOLVED_WITH_PAYOUT, REPRESENTED_BY_PAYPAL, amount_refunded $393.00; PAYOUT_TO_BUYER 11:32:41Z and 11:36:13Z |
| PP-R-RCJ-10194476 | $27.95 / $1.21 / $26.74, COMPLETED | DEBIT HOLD_PLACED $26.74 at 06:24:34Z; CREDIT HOLD_RELEASED $26.74 at 06:31:04Z | RESOLVED_WITH_PAYOUT, REPRESENTED_BY_PAYPAL, amount_refunded $27.95; PAYOUT_TO_BUYER 06:29:28Z and 06:33:13Z |

What the seller ends up with, from what PayPal shows:
- **NJA ($389):** PayPal held the seller's $378.43 net and then released all of it, and the capture is still COMPLETED, so the seller keeps $378.43 ($389.00 minus PayPal's $10.57 transaction fee). The buyer's $389.00 was paid by PayPal ("represented by PayPal"). Chargeback fee: not stated.
- **UDP ($405):** The $394.02 hold was released in full and the capture is still COMPLETED, so the seller keeps $394.02 ($405.00 minus the $10.98 fee). The buyer's $405.00 was paid by PayPal. Chargeback fee: not stated.
- **LTK ($398):** The $387.20 hold was released in full and the capture is still COMPLETED, so the seller keeps $387.20 ($398.00 minus the $10.80 fee). The buyer's $398.00 was paid by PayPal. Chargeback fee: not stated.
- **TZD ($402):** The $391.10 hold was released in full and the capture is still COMPLETED, so the seller keeps $391.10 ($402.00 minus the $10.90 fee). The buyer's $402.00 was paid by PayPal. Chargeback fee: not stated.
- **AAJ ($396):** The $385.25 hold was released in full and the capture is still COMPLETED, so the seller keeps $385.25 ($396.00 minus the $10.75 fee). The buyer's $396.00 was paid by PayPal. Chargeback fee: not stated.
- **IMW ($393):** The $382.33 hold was released in full and the capture is still COMPLETED, so the seller keeps $382.33 ($393.00 minus the $10.67 fee). The buyer's $393.00 was paid by PayPal. Chargeback fee: not stated.
- **RCJ ($27.95):** The $26.74 hold was released in full and the capture is still COMPLETED, so the seller keeps $26.74 ($27.95 minus the $1.21 fee). The buyer's $27.95 was paid by PayPal. Chargeback fee: not stated.

Not stated by PayPal on any of these cases: a chargeback or dispute fee, whether the transaction fee is returned, a seller payout record, and a balance or settlement entry. The "PayPal fee" above is the normal transaction fee on the original capture, not a dispute fee. These cases were adjudicated with the sandbox simulator (SELLER_FAVOR); PayPal labels the result RESOLVED_WITH_PAYOUT / REPRESENTED_BY_PAYPAL.

Transaction Search now works (200 at ~10:47 UTC; it was 403 earlier today). Its data is refreshed only up to `last_refreshed_datetime` 2026-10-25T09:29:59Z, so **UDP, LTK and TZD aren't in it yet: not stated**. Balance entries for NJA (and RCJ, for comparison), with event code and status as PayPal returns them:
- NJA: T0005 capture 3D572951SP109543G +$389.00, fee −$10.57, status S, 08:33:51Z. T1110 (hold for dispute) −$378.43, status P, 08:36:50Z, id 27Y34379A0216354R. T1111 (hold cancellation) +$378.43, status D, 08:36:50Z, same id.
- RCJ: T0005 +$27.95, fee −$1.21. T1110 −$26.74 (P) and T1111 +$26.74 (D), both 06:24:33Z.
- In this listing there is no chargeback/reversal debit and no dispute-fee entry for either case. That is consistent with "seller keeps the net".

## Ceremony A3 / B3 (W1 demo-prep, created 2026-10-25 ~10:45 UTC)

Same command with `--amounts 396.00,393.00`. Checked 11:01 UTC.

| Dispute | Amount | Label | PayPal | Production case | Pending action |
|---|---|---|---|---|---|
| **PP-R-AAJ-10194495** | $396.00 | **ceremony A3: W3 may approve on camera** | WAITING_FOR_SELLER_RESPONSE, seller evidence 0, due 2026-11-05 | `awaiting_approval` | `13dfcfbe-18cd-4704-b5f1-363da8dc00a8` provide_evidence (created 11:00:58Z) |
| **PP-R-IMW-10194496** | $393.00 | **ceremony B3: W5 may approve on camera** | WAITING_FOR_SELLER_RESPONSE, seller evidence 0, due 2026-11-05 | `awaiting_approval` | `80ededdd-6ac8-4f45-bca1-aa21ac9909f2` provide_evidence (created 11:00:56Z) |

- Captures: AAJ 8BW77137DH722621Y; IMW 1PA13666SL883415A. 12 wire rows each (webhook verifications and GETs only), no provide-evidence.
- W1 is watching: after each one's on-camera approval shows a provide-evidence 200 on the wire, W1 adjudicates it SELLER_FAVOR to reach RESOLVED.

### Ceremony A3 / B3 results: both RESOLVED (checked 11:38 UTC)

| | PP-R-AAJ-10194495 ($396, A3 / W3) | PP-R-IMW-10194496 ($393, B3 / W5) |
|---|---|---|
| Approved provide-evidence | 11:24:52.288Z, 200, debug f4501995cc305 (action `13dfcfbe-…` executed) | 11:28:41.187Z, 200, debug f167343c32e7c (action `80ededdd-…` executed) |
| Tracker restore | PUT 204 (f70384936b23c); tracking still DELIVERED | PUT 204 (f2633787db352); tracking still DELIVERED |
| W1 adjudicate SELLER_FAVOR | 200, debug ca500e0fd5f32 | 200, debug f654732357982 |
| PayPal outcome | **RESOLVED / RESOLVED_WITH_PAYOUT**, update_time 11:32:07.875Z | **RESOLVED / RESOLVED_WITH_PAYOUT**, update_time 11:36:58.452Z |
| RESOLVED webhook | **`WH-8VY5994152651773G-10W95847GV830641L`**, received **11:32:35.052Z**, verify SUCCESS, processed | **`WH-37X69612F30440908-1JH52011XP306910D`**, received **11:37:09.640Z**, verify SUCCESS, processed |
| Production case | status `resolved`, 29 wire rows; agent `run.done` 11:32:38Z | status `resolved`, 29 wire rows; agent `run.done` 11:37:12Z |
| Approval → RESOLVED | ~7 min | ~8.5 min |

## Ceremony A4 / B4 (W1 demo-prep, created 2026-10-25 ~12:39 UTC)

Same command with `--amounts 394.00,391.00`. Checked 12:45 UTC.

| Dispute | Amount | Label | PayPal | Production case | Pending action |
|---|---|---|---|---|---|
| **PP-R-EGZ-10194505** | $394.00 | **ceremony A4: W3 may approve on camera** | WAITING_FOR_SELLER_RESPONSE, seller evidence 0, due 2026-11-05 | `awaiting_approval` | `cb9b747f-06fb-40db-9bba-27cb1d7bd93f` provide_evidence (created 12:44:31Z) |
| **PP-R-IHX-10194506** | $391.00 | **ceremony B4: W5 may approve on camera** | WAITING_FOR_SELLER_RESPONSE, seller evidence 0, due 2026-11-05 | `awaiting_approval` | `fa9fbb9c-ba0c-4862-aca4-b2c4e7d9aeaa` provide_evidence (created 12:44:32Z) |

- Captures: EGZ 2E877808LW833145X; IHX 99220792RT677781T. 12 wire rows each (webhook verifications and GETs only), no provide-evidence.
- W1 is watching: after each one's on-camera approval shows a provide-evidence 200, W1 adjudicates SELLER_FAVOR to reach RESOLVED and adds its fund movements.

## Ceremony A5 (W1 demo-prep, created 2026-10-25 ~12:47 UTC)

Same command with `--amounts 397.00`. Checked 12:52 UTC. (W3's A4 recording crashed after a real approval of EGZ; EGZ still goes to RESOLVED.)

| Dispute | Amount | Label | PayPal | Production case | Pending action |
|---|---|---|---|---|---|
| **PP-R-SGV-10194507** | $397.00 | **ceremony A5: W3 may approve on camera** | WAITING_FOR_SELLER_RESPONSE, seller evidence 0, due 2026-11-05 | `awaiting_approval` | `93212e24-326e-4093-933a-57152c0e71a3` provide_evidence (created 12:51:30Z) |

- Capture 0VJ18807MY614672J. 12 wire rows (webhook verifications and GETs only), no provide-evidence. W1 is watching: approval 200 → adjudicate → RESOLVED.

### Ceremony A4 / B4 / A5 results: all RESOLVED (checked 13:04 UTC)

| | PP-R-EGZ-10194505 ($394, A4 / W3; recording crashed) | PP-R-IHX-10194506 ($391, B4 / W5) | PP-R-SGV-10194507 ($397, A5 / W3) |
|---|---|---|---|
| Approved provide-evidence | 12:45:20.720Z, 200, ca501515c8c94 (action `cb9b747f-…` executed) | 12:46:24.119Z, 200, ca50152e8c8f8 (action `fa9fbb9c-…` executed) | 12:52:55.986Z, 200, ca5015c79eef8 (action `93212e24-…` executed) |
| Tracker restore | PUT 204; tracking DELIVERED | PUT 204; tracking DELIVERED | PUT 204; tracking DELIVERED |
| W1 adjudicate SELLER_FAVOR | 200, f211976ccff51 | 200, f760907c669e0 | 200, f1489265aba72 |
| PayPal outcome | RESOLVED_WITH_PAYOUT, update_time 12:56:58.714Z | RESOLVED_WITH_PAYOUT, update_time 12:57:03.784Z | RESOLVED_WITH_PAYOUT, update_time 13:02:33.628Z |
| RESOLVED webhook | **`WH-35918817WY730251Y-45A91289LM6957636`**, 12:57:34.830Z, SUCCESS, processed | **`WH-0RX02168P8982734Y-9TT31773BN730571G`**, 12:57:34.976Z, SUCCESS, processed | **`WH-77M53526VG305471F-9EM50732MT655884D`**, 13:03:05.745Z, SUCCESS, processed |
| Production case | resolved, 29 wire rows | resolved, 29 wire rows | resolved, 29 wire rows |

Fund movements (PayPal dispute + capture, read 13:04 UTC; same format as the "fund movements" section):

| Case | Capture (gross / PayPal fee / net), capture status | fund_movements (party RECEIVER) | Outcome |
|---|---|---|---|
| PP-R-EGZ-10194505 | $394.00 / $10.69 / $383.31, COMPLETED | DEBIT HOLD_PLACED $383.31 at 12:43:04Z; CREDIT HOLD_RELEASED $383.31 at 12:50:33Z | RESOLVED_WITH_PAYOUT, REPRESENTED_BY_PAYPAL, amount_refunded $394.00; PAYOUT_TO_BUYER 12:49:19Z and 12:56:13Z |
| PP-R-IHX-10194506 | $391.00 / $10.62 / $380.38, COMPLETED | DEBIT HOLD_PLACED $380.38 at 12:43:00Z; CREDIT HOLD_RELEASED $380.38 at 12:51:33Z | RESOLVED_WITH_PAYOUT, REPRESENTED_BY_PAYPAL, amount_refunded $391.00; PAYOUT_TO_BUYER 12:50:19Z and 12:56:13Z |
| PP-R-SGV-10194507 | $397.00 / $10.77 / $386.23, COMPLETED | DEBIT HOLD_PLACED $386.23 at 12:50:34Z; CREDIT HOLD_RELEASED $386.23 at 12:57:53Z | RESOLVED_WITH_PAYOUT, REPRESENTED_BY_PAYPAL, amount_refunded $397.00; PAYOUT_TO_BUYER 12:56:53Z and 13:01:33Z |

- **EGZ ($394):** The $383.31 hold was released in full and the capture is still COMPLETED, so the seller keeps $383.31 ($394.00 minus the $10.69 fee). The buyer's $394.00 was paid by PayPal. Chargeback fee: not stated.
- **IHX ($391):** The $380.38 hold was released in full and the capture is still COMPLETED, so the seller keeps $380.38 ($391.00 minus the $10.62 fee). The buyer's $391.00 was paid by PayPal. Chargeback fee: not stated.
- **SGV ($397):** The $386.23 hold was released in full and the capture is still COMPLETED, so the seller keeps $386.23 ($397.00 minus the $10.77 fee). The buyer's $397.00 was paid by PayPal. Chargeback fee: not stated.
