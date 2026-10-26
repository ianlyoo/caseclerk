# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- Primary: a small online seller on PayPal (one person or a tiny shop, e.g. a used-camera dealer) who gets a dispute or chargeback, has days to answer, and no time or know-how to build an evidence file. Job: keep money that is rightly theirs without spending an evening on each case, and stay in control of anything that moves money.
- Evaluating audience (now): PayPal AI Hackathon judges on Devpost (PayPal DevRel, engineers, an EM, a senior PM; sponsor judges incl. Bryntum's CEO). They open the hosted URL cold, usually on a laptop, and decide in seconds whether this is a finished product. Criteria, equal weight: Technological Implementation, Design ("a complete, coherent product experience — not just a technical proof of concept"), Potential Impact, Innovation, Presentation.

## Product Purpose
CaseClerk is an AI dispute desk for small PayPal sellers. A PayPal dispute webhook arrives; a Claude agent triages it, gathers the order and shipping facts, decides (fight, offer, refund, accept), drafts the evidence and buyer message, and files through PayPal's Disputes API. Small cases it answers on its own, under the seller's rules; above the seller's lines (evidence filing on disputes ≥ $250, any refund or offer above $50) it stops and asks the seller to approve. Success: the seller approves in one click and PayPal resolves the case, with every step traceable.

## Positioning
It acts with real authority on PayPal's Disputes API (provide-evidence, offers, accept-claim), not as a chatbot that writes advice; and every action carries PayPal's own proof (HTTP status, PayPal-Debug-Id, verified webhook events). The seller's approval line is a hard gate in code.

## Operating Context
- Hosted on Vercel (sin1) with Neon Postgres; PayPal sandbox (US) seller account; real sandbox disputes are opened from a test buyer account and resolved by PayPal's sandbox adjudication (~10–12 min after filing).
- Pages: landing, inbox of cases, case page (pending approval → after approval → resolved), policy/settings, "Open a test dispute".
- Judges use it without logging in; there is no auth. Approve is a real sandbox filing.

## Capabilities and Constraints
- APIs (production, no auth): `GET /api/cases`, `GET /api/cases/[id]` (case, audit `wire` rows, `money` field), `GET /api/wire?since=`, `POST /api/actions/[id]/approve` → `{status, debugId, at}`, `POST /api/test-dispute` (capped per IP and globally), `GET/PUT /api/policy`.
- Claude API spend is capped in code (owner budget $60 through 12/15).
- Terms: dispute, chargeback, inquiry, evidence, adjudication, "seller keeps $X", approval line.
- Undecided: the visual world (being redesigned from scratch, 10/26).

## Evidence on Hand
- Nine real sandbox disputes filed by the agent after the seller's approval and resolved by PayPal in the seller's favour (e.g. a $389.00 case → seller kept $378.43), plus one small case ($27.95) filed by script; full list with IDs, debug ids and timings in `docs/REAL-CASES.md`.
- PP-R-VPY-10194485 ($412.00, Olympus OM-1n) is awaiting approval and is reserved for the demo video: never approve it.
- No customers, testimonials, revenue, win-rate statistics or logos exist. Never invent them. Sample/fixture content must be visibly labelled as a sample.

## Product Principles
1. The seller stays in charge of money: the approval line is visible wherever an action waits.
2. Show PayPal's proof, not our adjectives: real ids, statuses and timestamps over claims.
3. One case, start to finish, must be understandable by a stranger in under a minute.
4. Honest about what is sandbox, sample or pending.

## Accessibility & Inclusion
WCAG 2.2 AA contrast; keyboard reachable Approve; `prefers-reduced-motion` honoured.
