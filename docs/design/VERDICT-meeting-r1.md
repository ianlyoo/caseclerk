# Verdict, goal #251: CaseClerk web quality ("make it premium, striking and judge-winning")

Judge: fresh, not a debater. I read the topic, all five materials (briefing, both drafts' source and the 1920 shots, critique round 1, the owner's rejected tells, ARCHITECTURE), the 8 round files, the synthesis and the 4 agree/dissent files. I re-checked against the draft source the facts the remaining disputes depend on (listed at the end). I did not open the live Vercel pages or the web.

## Recommendation

Build **one product, not two drafts**, under the identity all four members accepted in the final pass: **"Paper and Wire"**.
- **Paper** is B's sentence-first case file on warm paper: Newsreader 400 at 48–60 px, with Hanken Grotesk for UI and money.
- **The Wire** is one full-height, near-black PayPal plane on the right. It shows only real PayPal traffic, and PayPal blue appears there and nowhere else.
- **The approval** is a paper slip. It crosses into the Wire and comes back with a real 200 and debug id.
- **Motion** happens only where data changes. Imagery is about 5 real, credited photos of the items.
- **"Live means real"** is a hard rule. Draft A's layout is dropped.

My rulings on what was still open:
1. **Evidence reader.** It opens in place, and it moves into the must-ship set. I uphold m4's dissent, on one condition: a parity check against the real PDF.
2. **Approval gate timing.** The PM decides the real-approval gate before the approval item is built, not by 11/3. I uphold m3's dissent.
3. **Moving between cases.** No rail. Previous/next must say where you are and name the neighbouring cases (m3's condition).
4. **Fold arithmetic.** The synthesis got the slip budget wrong. I fix it by making the recommendation sentence the slip's first line.
5. **Two guards of my own.** A hue band for the Wire blue (tell 13), and a daily real test dispute during judging so the Wire isn't stale. The second is a PM decision.

Before any motion work, the owner should see the case page at 1440×810. The dark plane is the one risk nobody could test.

## Strongest arguments

Grouped by what was contested. Who won, and why.

1. **Where the one dark surface goes.**
   - *Approval surface* (m3 r1, a dark decision sheet; m4 r1, an "obsidian command well"): money leaving the business is the highest stake, so it should be the heaviest thing on screen and a hard cut in the video.
   - *PayPal surface* (m1, m2): the briefing names a real sandbox loop as our only edge over three mocked entries, and the critic measured that loop as the faintest text on screen (A5/B6). m2: "Any entry can draw a dark approval box"; only we can fill a plane with real webhooks and debug ids.
   - m4 (r2) added the decisive point: a dark approval box disappears on every case that isn't waiting for approval, and the screen goes beige again. m1 and m2 added that a rising sheet is a modal that hides the case.
   - **Wire won.** m3 and m4 conceded in r2.
2. **Right plane or top band.**
   - *Band* (m2 r1, m1 r2): it looks the same on every page, reads as a channel rather than a log, and collapses on the phone.
   - *Plane* (m2 r2, m3, m4): the fold. A 56 px masthead plus a 152 px band leaves 544 of 752 px at 1536×752 (synthesis), and the case column would miss G14. The plane also gives the slip a long, readable sideways flight.
   - **Plane won.** m1 checked the arithmetic and withdrew. Unanimous.
3. **What the Wire contains.**
   - *Full timeline* (m2 r2, m4): one place shows cause and effect.
   - *PayPal-only* (m1, m3): the owner rejected "the agent log and tool-call feed as the face" (tell 8). As the seller, m3 added that reasoning set in light-on-dark mono is slower to read just before moving money. m3's hover link (a paper sentence lights its Wire line) keeps the cause and effect.
   - **PayPal-only won.** m2 and m4 conceded.
4. **Layout.**
   - *Rail or desk* (m4, m3): the critic gave B 4/10 on "finished product" because it shows one case at a time.
   - *Single column with previous/next* (m1, m2): a rail rebuilds A's Linear/Front silhouette (critic tell 5; A scored 5/10 on "not template" against B's 7), and the critic's own fix for B4 was a previous/next link.
   - **Single column won**, with m3's condition (see Unresolved).
5. **Type.**
   - *m4 r1:* weight 600, Plus Jakarta Sans, JetBrains Mono for money, and a 31 px h1, for density and the fold.
   - *m1, m2, m3:*
     - tell 11 bans heavy weights;
     - Geist and Plus Jakarta Sans are template faces (m1);
     - m2 identified m4's `#1D4ED8` as Tailwind `blue-700`, the same kind of tell;
     - monospace money reads as a terminal;
     - a 31 px h1 throws away B's best asset, a sentence you can read in a 1280 px player.
   - **m1's set won.** m4 conceded.
6. **Honesty.**
   - *m4:* let judges click Approve on Daniel's fixture case on `/`, the fastest payoff in 10 seconds.
   - *m2* (r2) made the meeting's most important find. The "Live on PayPal sandbox … 7f3a91c2e04b8" line is hard-coded (`_cases.ts:62`), and the same debug id appears on a different call (`_cases.ts:117`). I confirmed both. A PayPal engineer who spots that discounts the whole "real loop" claim, and an interactive fixture on `/` is exactly what we accuse the competitors of.
   - *m1* (r1) caught that the offer path depends on a buyer-consent route (ARCHITECTURE item 6). The hero must therefore be the chargeback-and-evidence path, which has really run end to end twice (briefing).
   - **"Live means real" won.** m4 conceded.
7. **The evidence pack.**
   - *m4* found the fake "photos" in r1: radial gradients for the lenses and 24 gradient "film frames" (`pages.module.css:99–123`, confirmed). m4 wanted dense documentary pages, a vector barcode and a 720 px drawer.
   - *m1, m2:* a barcode that encodes nothing is the same fake, and invented content ("AVS/CVV codes", "serial registration log") is not what the agent produces. The pages must mirror `buildEvidencePdf`.
   - *m4* (agree/dissent pass): zooming in place costs about 15 lines, because the pages already scale with container queries (`pages.module.css:4` `container-type: inline-size`, `:24` `3.4cqw`; confirmed). Chrome's grey PDF toolbar in the video would break the identity.
   - **Ruling:** the content mirrors the real PDF (m1, m2), and it is read in place (m4).
8. **How to build motion.**
   - *m3 r1:* no library.
   - *m1:* hand-rolling a cross-container slip flight and a digit roller costs more of 1.5 days than `motion` plus `@number-flow/react`. m3 conceded.
   - *Shimmer* (m3 r1, m4 r1) against *an in-flight rule shown only while a request is open* (m1). Shimmer is the AI "thinking" cliché. **The rule won.**

## Consensus

All four members AGREE on these points in their final agree/dissent files:

**Diagnosis**
- There are 0 `@keyframes` in either stylesheet, and the live dot is still on purpose (`a.module.css:740`).
- B is weight-300 serif and quiet. A is the three-pane template at 13 px.
- The edge is faint, and it is fabricated (the hard-coded line).
- The evidence art is made of CSS gradients.
- There is no photo, no landing and no ending, and several links are dead.

**Identity and structure**
- One product. Delete the drafts after porting the data and the store.
- B's voice. A is dropped as a layout.
- "Paper and Wire", with exactly one dark surface. It belongs to PayPal: a full-height plane on the right carrying PayPal-boundary traffic only.
- PayPal blue `#0059B8` (on paper) and `#6FB2FF` (on the Wire), only on `[data-origin=paypal]`. No PayPal logo.

**Type, colour and surfaces**
- Newsreader 400, Hanken Grotesk 400/500 with tabular figures, IBM Plex Mono. No weight ≥ 600. Banned: Geist, Inter, Plus Jakarta Sans, Manrope, Source Serif.
- Case h1 48 px and money 52 px at 1440. m1's palette.
- Shadows only on physical objects. One `well` tone, used in two places only.

**Imagery and evidence**
- About 5 credited item photos, and no photo where a licence is unclear.
- Exhibits mirror the real PDF: no gradients, barcodes or invented content.

**Motion and approval**
- `motion` + NumberFlow + CSS. Every animation has a data cause. No shimmer, typewriter or overshoot. Reduced motion becomes ≤ 120 ms fades.
- The slip ceremony:
  - 4 s undo, with Send now;
  - a hold for PayPal's real latency;
  - "Nothing was sent" on error;
  - no way back to Approve after sending;
  - every post-approve text updated.

**Honesty and the hero**
- "Live means real": the DB-checked ids rule (G12), "Sample case" marks, no reused ids, and "×N, real m:ss" on any sped-up video.
- The hero is the real chargeback → evidence → decision path, unless the offer path is live by 11/3.
- A real approval gate is needed.
- The ~3-minute webhook wait is designed as four stamped stages plus a clock.

**Capture and pages**
- Capture at 1440×810, DPR 2 (16:9).
- Inbox: B's headline sentence and the fixed 14-day strip.
- A one-screen landing with no interactive fixture.
- Bryntum styled through v7 variables only; licence it or unlink it, and never hide the watermark with CSS.
- Policy as sentences.
- The ending is a sentence.
- The exclusions list.

**Process**
- Scope is the binding risk, with the cut order shell → case → approve → Wire → landing → inbox → resolution.
- Owner screenshots before motion work.

## Unresolved dissent

1. **The evidence reader: in place (m4) or "click opens the PDF" with the reader as garnish (synthesis, m2, m3).** **I rule for m4.**
   - The real hero is now the evidence path, so the evidence pack is the hero object. The video beat at 1:00–1:40 opens one page.
   - The in-place zoom is cheap. I confirmed that the pages size by container query.
   - The truth concern from m1 and m2 is met by G21: the reader's text must equal the text of the PDF that was filed, with a "Download the PDF filed with PayPal" link beside it.
   - m1 also wanted a reader in the must-ship set, so the ruling needs no new consensus.
   - Cost: +0.5 h inside item 3.
2. **When the PM decides the real approval gate: by 11/3 (synthesis) or before the approval item (m3).** **I rule for m3.**
   - Item 4's done check, the slip's copy and the video script all depend on it, and the UI worker starts now.
   - The slip component is built to handle any action (offer, file evidence, accept claim, refund), so it is not blocked.
   - m2's condition is also adopted: if no real gate exists, the sample approval appears after the real loop, marked "Sample case", and never as the climax.
3. **Case navigation (m3, mild).** Previous/next alone doesn't tell the seller where they are. **I adopt m3's condition and drop the rail.**
   - The left margin shows "3 of 7 open, 2 need you".
   - Previous and next are words naming the neighbouring case's item, amount and due day (no arrows, which are an owner tell). J/K also work.
   - A collapsible rail at ≥ 1680 px is built only if the owner asks for it.
4. **The slip's height (m3's numbers flag).** m3 was right that it's tight, but the synthesis's arithmetic was wrong, not the layout.
   - The synthesis's own stack (56 + 28 + 162 + 60 + 80 + 60 = 446 px) leaves 340 px for the slip at 1440×810, not 240.
   - The binding size is 1536×752. There the `clamp()` sizes give a stack of about 456 px against a 728 px limit, which leaves about 270 px. m3's slip estimate is about 270 px.
   - **Fix (judge's change):** while an approval is pending, the recommendation sentence becomes the slip's first line instead of being repeated above it. The policy line moves to the margin (m3's own proposal). That puts Approve's bottom at about 560 px at 1536×752, with room to spare.
5. **Untested: the owner's reaction to a dark right plane.** No member can settle this. m2 and m4 named the "dashboard-like" risk.
   - **Ruling:** after item 3, the owner sees two 1440×810 PNGs of the case page.
   - If the owner rejects the plane, the Wire collapses to a 44 px one-line dark strip under the masthead that expands on click, and the slip travels up into it. This is m3's fallback, about 1 h.

## Dropped members

None. m1-claude, m2-claude, m3-claude and m4-antigravity each filed r1, r2 and an agree/dissent file.

## Confidence

**Medium.**
- I'm confident in the direction and the rules. They are unanimous after the synthesis, and every factual premise I checked holds: the source lines, the contrast ratios and the damping.
- The confidence is not high, for two reasons:
  - (a) Whether the result clears the owner's "premium and striking" bar is untested. The proposal is still a restrained palette, and the Wire is the one bold move.
  - (b) Every member's build list overran: about 16.5 h of work against about 12 h, with an 11.5 h must-ship set.
- What would raise it:
  - the owner approves the case-page screenshots;
  - items 1–4 land in about 7.5 h;
  - the PM confirms a real run to replay and a real approval gate.
- What would lower it:
  - W4's audit rows don't carry origin, status and debug id. The Wire then shows only samples and the hero weakens.

## Deliverable

# CaseClerk web product: build-ready spec, "Paper and Wire"

**Sizes and viewports**
- All sizes are CSS px at the **1440×810 capture viewport** (DPR 2, exported to 1080p), using `clamp()` up to 1920.
- Fold checks run at:
  - 1440×810;
  - 1920×940 (Chrome on a 1080p screen);
  - 1536×752 (1920 at 125 %).
- Routes follow ARCHITECTURE: `/`, `/inbox`, `/cases/[id]`, `/approvals`, `/settings`, `/board` (the nav label is "Deadlines").

### 1. Diagnosis: why the drafts read as "lacking"

Both drafts pass all 87 anti-slop checks. They read as lacking because the rules were applied as "remove everything". What's left is flat cream, hairlines, thin grey type and a pill button: no motion, no depth, no image, and no moment where money moves.

| Element (where) | Why it fails a premium bar |
|---|---|
| No motion: 0 `@keyframes` in `a.module.css` and `b.module.css`. The live dot is still on purpose (`a.module.css:740`). Approve swaps a sentence after a raw `setTimeout` (`_store.tsx`). | This is the failure the owner already named ("애니메이션 효과들이 너무 밋밋함", "the animation effects are too flat"). In a video, nothing shows cause and effect. |
| B: Newsreader 300 on `#fbfaf6`, grey body text, ~45 % empty margin at 1920, 3.8 screens long | Washed out, and close to the rejected round-1 editorial draft. Every line has the same weight. |
| A: list, detail and properties panes, Hanken Grotesk, a 6 px blue button, 13.2 px base text | The Linear/Front template silhouette, about 8.8 px tall in a 1280 player. |
| "Live on PayPal sandbox": ~14 px grey, **hard-coded** (`_cases.ts:62`). Its debug id `7f3a91c2e04b8` is reused on a send-message call (`_cases.ts:117`). | Our only edge over three mocked competitors is the faintest text on screen, and it is fixture data. |
| Evidence pack: `radial-gradient` "lenses" and 24 gradient "film frames" (`pages.module.css:99–123`), 90 px wide | Placeholder CSS art inside a legal exhibit, at a size nobody can read. |
| Approve: a green pill (B) or a 6 px blue button (A) that turns into a sentence | Money leaves the business with no ceremony and no visible destination. |
| No camera anywhere, no landing, no resolved state | A camera dealer's dispute tool with no camera, and the story stops at "waiting". |
| Dead ends: every row opens Daniel's case; Policy, PDF and Open test dispute do nothing; Deadlines opens a Bryntum trial with pastel pills, "·" and watermarks | A founder clicks three things and concludes it's a mock-up. |
| The wordmark is "CaseClerk" in 15 px body text | No identity, and nothing to remember after the video. |

### 2. Direction: "Paper and Wire"

**Base**
- B's structure: one reading column, a left margin for when and who, and the sentence voice.
- A's content: the PayPal trace and the approval rigour.
- Four new elements: the Wire, the slip, photos and motion.
- A's three-pane layout is dropped.
- *Why:* B scored 7/10 on "not template" against A's 5 (critique). B's two sentences tell the dispute in 10 seconds. A's one-screen loop survives because the PayPal trace sits on the Wire, not in a third pane.

**Type** (all three fonts are already loaded in the drafts: `a/layout.tsx`, `b/layout.tsx`)

| Role | Face | Size / line at 1440 | `clamp()` to 1920 |
|---|---|---|---|
| Landing h1 | Newsreader 400 | 60/64, −0.015em | `clamp(44px, 2.5vw + 24px, 72px)` |
| Case h1 | Newsreader 400 | 48/54, −0.015em | `clamp(40px, 1.67vw + 24px, 56px)` |
| Inbox headline | Newsreader 400 | 44/50 | `clamp(36px, 1.25vw + 26px, 50px)` |
| Recommendation / slip head | Newsreader 400 | 32/40 | `clamp(26px, 1.25vw + 14px, 38px)` |
| Policy sentences | Newsreader 400 | 28/38 | fixed |
| Buyer's words | Newsreader 400 italic | 20/30 | fixed |
| Body | Hanken Grotesk 400 | 17/26 | `clamp(16px, 0.21vw + 14px, 18px)` |
| Secondary, labels | Hanken Grotesk 400 | 15/22 and 14/20, sentence case | fixed |
| Case money figure | Hanken Grotesk 400, `tabular-nums` | 52 | `clamp(44px, 1.67vw + 28px, 60px)` |
| Slip amount | Hanken Grotesk 500, `tabular-nums` | 56 | fixed |
| Inbox row amount | Hanken Grotesk 400, `tabular-nums` | 22 | fixed |
| Wire lines, ids | IBM Plex Mono 400 | 14/22 | `clamp(14px, 0.21vw + 11px, 15px)` |

- Floors: 13 px anywhere, 14 px on the Wire.
- Weights: 400 and 500 only.
- Banned:
  - weight ≥ 600;
  - uppercase transforms;
  - tracking > 0;
  - the faces Geist, Inter, Plus Jakarta Sans, Manrope, Source Serif and Spline Sans Mono.

**Colour** (WCAG 2 contrast. I recomputed every pair on 2026-10-25.)

| Token | Hex | Contrast | Use |
|---|---|---|---|
| paper | `#F3EFE6` | n/a | page |
| sheet | `#FBF9F4` | n/a | slip, evidence pages, photo mats, tooltip |
| well | `#ECE7DB` | n/a | sandbox control bar and waiting-state well only, with no shadow |
| ink | `#16161A` | 15.7 on paper | text, primary button fill |
| ink2 | `#4F4C45` | 7.5 on paper | secondary prose |
| ink3 | `#67635B` | 5.2 paper, 5.7 sheet, 4.85 well | times, labels |
| hairline | `#DDD7CA` | n/a | rules |
| wire | `#0F1115` | n/a | the dark plane, the only dark surface |
| wire text / wire2 / wire3 | `#ECE8DF` / `#A29E95` / `#8C887F` | 15.5 / 7.1 / 5.4 | text on the Wire |
| PayPal blue | `#0059B8` on paper (5.9), `#6FB2FF` on the Wire (8.5); both hue 211–212° | | only on `[data-origin=paypal]` |
| kept green | `#2F5D2A` (hue 114°) | 6.7 | money kept, "won"; never on the Wire |
| vermilion | `#B3361A` on paper (5.3), `#FF7A59` on the Wire (7.4) | | deadlines under 72 h |
| button | `#FBF9F4` text on `#16161A` | 17.2 | primary actions, radius 6 px |

**Surface and depth**
- The page is flat paper with hairlines.
- The object shadow, `0 1px 1px rgba(22,20,14,.05), 0 8px 24px -10px rgba(22,20,14,.22), 0 28px 56px -28px rgba(22,20,14,.25)` with radius 2 px, appears only on `.slip`, `.sheet`, `.mat` and `.tooltip`.
- The slip also has a 2 px ink top rule. There is no perforation.
- The Wire runs full height to the viewport's right edge. It has no radius and no shadow, and a 1 px `#23262D` left seam.

**Layout geometry**
- Wire width:
  - landing: 42 %;
  - inbox, approvals, board and settings: 28 %;
  - case: `clamp(380px, 30vw, 520px)`, which is 432 px at 1440.
- Case paper:
  - a 176 px left margin;
  - a reading column of `clamp(640px, 52.8vw, 880px)`, which is 760 px at 1440, 811 at 1536 and 880 at 1920;
  - 36 px gutters, with paper slack centred at 1920.
- Masthead: 56 px, on paper only.
  - The wordmark is "CaseClerk" in Newsreader 400 at 22 px, followed by a 10 px ink square. The square is also the favicon.
  - Nav as text: Disputes, Waiting for you *n*, Deadlines, Policy. The active item is ink at weight 500, with no underline or box.
  - The seller's name sits on the right.
- The Wire header aligns with the masthead. It shows "PayPal sandbox", the live dot, and "last webhook verified 12 s ago", ticking.

**The Wire: content rules**
- PayPal-boundary lines only:
  - `CUSTOMER.DISPUTE.*` webhooks, marked verified;
  - GET and POST calls to `/v1/customer/disputes`, `/v2/checkout/orders` and `/v1/shipping/trackers`;
  - sandbox simulator calls.
- Each entry is two grid lines, with no "·":
  - line 1: time, `in` or `out`, the short name (`make-offer`, `provide-evidence`, `CUSTOMER.DISPUTE.CREATED`) and the status;
  - line 2, in wire2: the path, truncated in the middle, and `debug <id>`. The id is never truncated.
- Newest on top. About 13 entries fit at 810 px.
- Never on the Wire: model names, reasoning, costs, counters, the UPS call, policy saves.
- Sample cases render their lines in wire2, with no blue and no debug id, under the header "Sample case. Nothing here went to PayPal."

**Imagery**
- One real photo per scenario item, about 5 in total, from Wikimedia Commons (CC0 or CC BY):
  - WebP, ≤ 480 px and ≤ 40 KB;
  - a `data-credit` attribute on each;
  - listed in `public/items/CREDITS.md` and on `/about`.
- Placement:
  - 56×42 on open inbox rows;
  - 160×120 on a `.mat` in the case's left margin;
  - full width as the photo exhibit;
  - 28 px in the Bryntum resource column.
- Exhibit D, the test roll, becomes a typeset table: speed set, measured ms, tolerance.
- No illustrations, SVG art, barcodes, people or placeholders. If a licence is unclear, there is no photo.

**Motion**
- Libraries: `motion` for layout and presence, `@number-flow/react` for numbers, CSS for the rest. Per m1, `@number-flow/react` is MIT-licensed at v0.5.9, read 2026-10-25; I did not re-check it.
- Tokens:
  - easing: `--ease-out: cubic-bezier(.22,1,.36,1)` and `--ease-inout: cubic-bezier(.65,0,.35,1)`;
  - durations: micro 160 ms, state 320 ms, spatial 560 ms, number 900 ms;
  - object spring: `{stiffness: 420, damping: 41, mass: 1}`. Critical damping is 2√420 ≈ 40.99, so there is no overshoot.
- Every animated element carries `data-cause` ∈ {webhook, paypal-call, agent-step, approve, resolve, policy, nav}.

| Event | Motion |
|---|---|
| A webhook or PayPal response lands | The Wire entry drops 8 px with opacity 0→1 over 320 ms ease-out. Status and debug id fade in 120 ms later. The 2 px left marker decays from `#6FB2FF` at full opacity to 0.4 over 1.2 s. "verified n s ago" resets. |
| A PayPal request is in flight | A 1 px `#6FB2FF` rule runs left→right under the entry (1.4 s ease-inout). It loops only while the request is open. |
| An agent step completes | On paper, its "What the agent did" sentence rises 8 px with opacity over 320 ms; several are staggered 60 ms. Hovering a sentence lights its Wire entry (160 ms). |
| An exhibit is produced | The sheet rises in place (320 ms). The cross-seam fly-in (layoutId, 560 ms spring, −1.5°→0°) is garnish, item 12. |
| Decision lands | **Approval pending:** the slip rises 16 px on the spring, carrying its head sentence, then the expected-value rows stagger 60 ms. **No approval:** the decision sentence rises 12 px over 320 ms on paper. |
| Approve | The button presses (scale .98, 120 ms). A 1 px ink undo rule runs along the slip's bottom edge for 4 s (linear `scaleX` 1→0), with "Undo" and "Send now" beside the button. On send, the slip lifts (y −6 px, deeper shadow, 200 ms), travels right across the seam (560 ms spring, scale → .6) and becomes the `POST make-offer` or `provide-evidence` entry with the in-flight rule. If PayPal is slower, the slip holds at the seam. On the 200: status and debug id appear, the slip area re-sets to "Offered $180.00 to Daniel. Sent 10:42:08." (or "Evidence filed with PayPal. 10:42:08."), and the nav count rolls. |
| PayPal error | The slip springs back onto the paper with PayPal's error name and debug id: "Nothing was sent." |
| Resolved | `CUSTOMER.DISPUTE.RESOLVED` lands. The h1 crossfades over 320 ms to the ending sentence, the figure rolls (900 ms), and a 1 px kept-green rule draws left→right underneath over 600 ms. No confetti. |
| Inbox row → case | React `<ViewTransition>` (Next 16 `experimental.viewTransition`, per m1, read 2026-10-25) morphs the photo, title and amount into the mat, h1 and figure (420 ms). Elsewhere a 200 ms crossfade; a plain fade where unsupported. Garnish, capped at 1 h. |
| Live dot | 6 px, opacity .35↔1 over 2.4 s, **only while the last real webhook is under 24 h old**. Otherwise it is still and labelled with its date. |
| Reduced motion | Everything becomes ≤ 120 ms opacity. NumberFlow animation is off. |

**Density.** Paper is generous: a 760 px column with 26 px body leading. The Wire is dense: 14 px mono on 22 px lines. The contrast between the two is part of the look.

### 3. Hero moments

**First 10 seconds of the hosted demo** (`/`, server-rendered, no loader, no scroll)

The paper side (58 %) holds:
- the wordmark;
- an h1 that states the **actual outcome of the real recorded run**, filled from its data. For example: "A buyer charged back a $412.00 Olympus OM-1n. CaseClerk filed the evidence on PayPal, and PayPal decided for the seller." The words follow what the run really did (m2's condition);
- the item photo;
- the ink CTA "Open a test dispute on PayPal sandbox", with one line under it: "A real sandbox dispute. PayPal's webhook reaches us in about 3 minutes.";
- a text link, "Open this case".

The Wire side (42 %) holds:
- the header and the live dot;
- the label "Replay of PP-R-…, recorded <date>, 11 min compressed to 9 s. Real PayPal ids." (all values real).

| t | What moves |
|---|---|
| 0.0 s | Everything above is static and readable. |
| 0.4–4.6 s | Real Wire entries land about 0.6 s apart: `CUSTOMER.DISPUTE.CREATED` verified, GET dispute 200, GET order 200, GET tracker 200. |
| 2.5–5.0 s | Three evidence sheets rise into a small paper dossier. |
| 5.0–6.5 s | The decision sentence sets on paper (the run's real sentence). |
| 6.5–8.0 s | The evidence stack, or the slip if the run had a gate, crosses into the Wire, and `POST provide-evidence 200 debug …` lands. |
| 8.0–9.5 s | `CUSTOMER.DISPUTE.RESOLVED` lands, the figure rolls to "You kept $…", and the green rule draws. |
| ≥ 9.5 s | The final frame holds. The CTA never moves. |

Daniel's fixture never appears under a "real ids" label. If the offer path runs live by 11/3, the replay may be an offer case.

**After pressing Open a test dispute.** A `well` opens under the button with four stamped stages at their real times:
1. "Card payment created 201"
2. "Tracking added 201"
3. "Chargeback filed"
4. "Waiting for PayPal's webhook, 1:12 so far, usually under 3 min", with the in-flight rule.

Each real call also lands on the Wire. When `CREATED` arrives, line 4 becomes "Arrived. Open the case." and the inbox count rolls. A real resolved case stays explorable meanwhile.

**3-minute video** (1440×810 at DPR 2. Every sped-up stretch shows "×N, real m:ss". The video follows one continuous real case.)

| Time | On screen / what moves |
|---|---|
| 0:00–0:12 | The landing replay. Voice-over: who it's for (small cross-border sellers with no dispute staff) and what they lose (the item plus fees). |
| 0:12–0:30 | Inbox: the headline sentence, rows with photos, the 14-day strip; hover a vermilion case. |
| 0:30–1:00 | Open test dispute: the four stages stamp in, then "×8, real 3:05". `CREATED` lands on the Wire, the new row slides in with its photo, and the headline amount rolls. |
| 1:00–1:40 | Row → case. Wire entries land, the paper sentences say why, sheets rise into the dossier, and the decision and expected values set. **Open one evidence page in the in-place reader.** Evidence is allowed about 2.5–4 min after creation, so this stretch carries "×N" too. |
| 1:40–2:05 | **With a real gate:** the slip "File the evidence on the $412.00 case". Approve, Send now, the slip crosses into the Wire, and `provide-evidence 200` with its debug id returns. **Without a gate:** the agent files within policy, and the evidence stack crosses the seam the same way. |
| 2:05–2:25 | The labelled sandbox controls: require evidence, then adjudicate. `RESOLVED` lands, the ending sentence and the figure roll, and the green rule draws. |
| 2:25–2:42 | The Bryntum board: scroll a week, hover a line, click into a case. |
| 2:42–3:00 | Policy: change $50 to $200, and the consequence line rolls. *Only if there is no real gate:* show Daniel's slip for at most 8 s, with "Sample case" visible, before the policy beat. Voice-over: "about $0.05 per dispute", said once. End card: the wordmark and the URL. |

### 4. Per page

**Landing `/`**
- Layout: paper 58 % and Wire 42 %, on one screen. Below the fold there is only one footer line: "Built on PayPal Disputes, Orders, Tracking and Webhooks (sandbox). Claude Haiku 5.5 triages; Opus 5.5 decides."
- Changes:
  1. A fact sentence about the real run, not a pitch.
  2. A labelled real replay, where every id exists in the DB.
  3. One CTA with an honest ETA and the staged wait.
  4. No features, logos, testimonials, counters, arrow strips or interactive fixture.

**Inbox `/inbox`**
- Layout: paper 72 % and Wire 28 %, headed "PayPal, today".
- Changes:
  1. B's headline ("Seven open disputes, $4,348.45 at stake, two waiting for your answer.") with NumberFlow on the amount and the counts.
  2. Rows, each opening its own case:
     - a photo (open cases only);
     - the item (Hanken 500 at 17) over the buyer and city;
     - the agent's last action as a sentence;
     - a 22 px amount;
     - a due clock in the left margin, vermilion under 72 h;
     - on fixtures, "Sample case" in ink3.
  3. The 14-day strip on `repeat(14, minmax(0,1fr))`, amounts without cents, each mark bound to a real `dueAt`.
  4. A new row arrives together with the Wire entry that caused it.
  5. Closed rows show the settled amount ("Settled, kept $109.00"), never "Buyer favour" for a settlement.

**Case `/cases/[id]`**

*Paper column*, top to bottom, while an approval is pending:
1. The h1 sentence.
2. The money figure and deadline ("$412.00, respond within 8 days 14 h, by Mon Nov 2").
3. **The slip.** Its head line is the recommendation sentence, which is not repeated above it (see the Approval moment).
4. Why: the rationale in ink2 (at most 3 lines), then the expected-value table, which values the returned item (e.g. "$118.00: $240.00 resale after a $95.00 service, less $27.00 fees").
5. The dossier: sheets ≥ 160 px wide with a readable title and first lines. A click opens the in-place reader.
6. The buyer's words, in italic.
7. "What the agent did": one sentence per step with its reason, and one rounded agent cost for the case at the end.
8. The sandbox control bar, in `well`, docked at the bottom on test disputes only.

With no approval pending, the recommendation sentence (32/40) stands alone in place of the slip.

*Left margin* (176 px):
- the dispute id and opened date;
- the photo mat;
- "3 of 7 open, 2 need you";
- "Previous: Rollei 35 S, $318.50, due Mon" and "Next: Kodak Portra 400, $74.95, due Thu", as words with no arrows. J/K also work;
- beside the slip, the policy line in ink3 ("Above your $50.00 line, within your 45 % cap").

*In-place evidence reader:*
- Clicking a sheet zooms the existing container-query page component into a 640 px paper overlay over the column, with the object shadow and body text ≥ 16 px.
- Esc or a click outside closes it. Open and close take 320 ms ease-out.
- Beside it is the link "Download the PDF filed with PayPal".
- It renders from the same input object W1 passed to `buildEvidencePdf`, which W4 stores on the action.

*Fold, my arithmetic, worst case of a 3-line h1:*
- At 1536×752: 56 + 28 + 168 + 62 + 20 puts the slip's top at about 334. A slip ≤ 260 px puts Approve's bottom at about 574, under the 728 limit.
- At 1440×810 it is about 560 against a 786 limit.
- G14 decides.

Changes:
1. The slip.
2. The Wire replaces the grey live line.
3. Evidence truthfulness: gradients purged, Exhibit D typeset, the real photo, the reader.
4. The resolution sentence.
5. All post-approve text agrees: nav, inbox row and margin, with no "until you decide" left.

**Approval moment (the slip; the same component on `/approvals`)**
- The slip: sheet background, 2 px ink top rule, object shadow, radius 2, padding 20/24, height ≤ 260 px.
  - *Row 1:* the head sentence (Newsreader 32/40, at most 2 lines: "Offer Daniel $180.00 and let him keep the camera." or "File the evidence on the $412.00 case."), with the amount (Hanken 500 at 56, tabular) on the right.
  - *Row 2:* the exact note, or what PayPal receives, verbatim: Hanken 15/22, 2 lines, then "Show all", which expands in place.
  - *Row 3:* the ink button naming the action and the amount ("Approve the $180.00 offer" or "File the evidence on $412.00"), 52 px tall, and "Decline, fight with evidence" as text.
  - The undo rule runs along the bottom edge.
- The component accepts any action: offer, provide-evidence, accept-claim or refund.
- `/approvals`:
  - one column of slips, soonest deadline first;
  - three visible, then "2 more";
  - the empty state is one real sentence: "Nothing is waiting for you. The agent acted on *n* cases within your policy this week."
- Changes:
  1. The amount on the button.
  2. The note verbatim before the click.
  3. A 4 s undo plus Send now, then the real POST.
  4. Travel into the Wire, holding for real latency.
  5. The error state, with no path back to Approve after sending.

**Deadline board `/board`** (Bryntum Scheduler; nav label "Deadlines")
- Layout: paper 72 % holding the Scheduler, Wire 28 %.
- Styling only through v7 CSS variables and event renderers (Bryntum "migrate to new CSS" guide, per m1, m2 and m4, read 2026-10-25):
  - paper rows on hairlines, with no zebra striping;
  - resource column: a 28 px photo, "Okafor, OM-1n" in Hanken 15, and the amount in tabular figures;
  - the axis in IBM Plex Mono 13;
  - each case is a 2 px ink line from opened to due, ending in a 10 px tick at the due date. Vermilion under 72 h. Radius ≤ 2 px, no pills;
  - the today line is 1 px ink, labelled "Today 10:40";
  - hover thickens the line to 3 px (160 ms) and shows a `.tooltip` with the next-action sentence;
  - a click opens the case. Lines are not draggable.
- The h1 is computed, e.g. "Two cases are due in the next 72 hours."
- Changes:
  1. Same data as the inbox.
  2. No "·" and no bold heading.
  3. Ink lines with ticks instead of pastel pills.
  4. No trial watermark in public: the PM gets the sponsor key, and until then the nav hides Deadlines. Never hide the watermark with CSS.

**Settings `/settings`**
- Layout: paper 72 % and Wire 28 %.
- Policy as Newsreader 28 sentences with inline Hanken fields, which get a dotted 1 px ink rule on focus:
  - "Act on my own when the money is under [$50.00]."
  - "Never offer more than [45 %] of the order."
  - "Always fight when the carrier shows a signed delivery."
  - If the PM approves the gate: "Ask me before filing evidence or settling on any case over [$250.00]."
- Changes:
  1. Sentences, not a form grid.
  2. A live consequence line, "With this policy, *n* of your 7 open cases would wait for you", which rolls on each edit.
  3. Spend in plain words: "Demo budget left: $44.87 of $45.00."
  4. Saving calls `PUT /api/policy` and shows a confirmation sentence on paper, not on the Wire.

**Phone (390×844), approve path only.**
- The Wire collapses to a one-line bar under the masthead ("PayPal sandbox, last event 12 s ago") that expands on tap.
- The slip is sticky at the bottom, and Approve's bottom is ≤ 844.
- The nav is not clipped.

### 5. Anti-slop guardrails that still allow richness

All 87 existing checks stay, re-scoped from `src/app/drafts` to all of `src/app/**`, including `/board` and `/settings`. Each rule is decided by a script or a screenshot.

| # | Rule | Check |
|---|---|---|
| G1 | Motion exists where money or the agent moves | Probe: Approve → Send now. Within 600 ms, `document.getAnimations().length ≥ 2`, and the `.slip` box x moves ≥ 160 px toward `[data-wire]`. Injecting an audit row creates exactly one new `[data-wire-line]` with a running animation. |
| G2 | Motion has a cause | Every element with a motion class or `@keyframes` carries a `data-cause` from the list. 0 without one. |
| G3 | Motion is bounded | Every animation lasts ≤ 900 ms, except the replay root. `iterations === Infinity` only on `[data-live-dot]` and `[data-inflight]`, and `[data-inflight]` is absent when no request is open. |
| G4 | Reduced motion works | Under `reducedMotion: 'reduce'`, every duration is ≤ 150 ms. |
| G5 | One dark plane | Elements with background luminance < 0.1 and area > 4 % of the viewport exist only inside `[data-wire]`. `backdrop-filter`, `conic-gradient` and `filter: blur` = 0. |
| G6 | Blue means PayPal | Every element computed as `#0059B8` or `#6FB2FF` has `closest('[data-origin=paypal]')`. |
| G7 | The Wire is PayPal-only | Every `[data-wire-line]` has `data-origin="paypal"` or `data-sample`. 0 lines contain `claude-`, `$0.`, "Triage" or "policy". |
| G8 | Depth only on objects; the well stays small | grep `box-shadow` outside `.slip`, `.sheet`, `.mat` and `.tooltip` = 0. The `#ECE7DB` background appears only on `[data-well]`, at most 2 per page. Screenshot at 1440: shadowed rectangles ≤ 1 slip + 5 sheets + 1 photo. |
| G9 | Type floors and contrast | At 1440×810: all text ≥ 13 px, Wire text ≥ 14 px, case h1 ≥ 46 px, money ≥ 50 px. Contrast ≥ 4.5:1 on paper, sheet, well and the Wire. |
| G10 | Fonts and weights | grep `Geist\|Inter\b\|Plus_Jakarta\|Manrope\|Source_Serif\|Spline_Sans_Mono` = 0. grep `font-weight: *[6-9]00\|bold` = 0. |
| G11 | No placeholder art | grep `radial-gradient\|repeating-linear-gradient` in `src/app/**` = 0, and `linear-gradient` = 0 in evidence files. Every `<img>` has a `data-credit` that matches `CREDITS.md`. 0 `<svg>` files in `public/`. |
| G12 | "Live" means real | Script: every debug id, event id and dispute id shown on a non-sample case or in the replay exists in the DB audit table. No debug id is attached to two different events. Every fixture shows "Sample case". |
| G13 | The first screen proves it's live | At 1440×810 on `/`, `/inbox` and a real case, the first viewport contains `[data-wire]` with ≥ 1 entry matching `/CUSTOMER\.DISPUTE\.[A-Z_]+/` or a PayPal path, a debug id `/[0-9a-f]{12,13}/` at ≥ 14 px, and an amount with cents. On `/`, "Replay of" and its date are visible. |
| G14 | Fold | Approve's bottom ≤ innerHeight − 24 at 1440×810, 1920×940 and 1536×752. With the note collapsed, the slip is ≤ 260 px tall. At 390×844, the amount and Approve are visible without scrolling. |
| G15 | No dead clicks | Every `cursor: pointer` element changes the URL or the DOM. Every inbox row and board line opens a case whose h1 names that row's buyer. |
| G16 | No AI motion clichés | grep `typewriter\|shimmer\|steps(\|confetti\|particle\|gradient-border` = 0. No overshoot: grep `cubic-bezier([^)]*,\s*1\.[0-9]` = 0, and spring damping ≥ 2√(stiffness × mass). |
| G17 | No old tells | Uppercase transforms, tracking ≥ .1em, " · ", "→" outside PayPal paths, letter avatars, counters and four-decimal costs = 0 (the existing `check-tells.sh`, re-scoped). |
| G18 | The board is clean | On `/board`: 0 "Trial", 0 "·", event radius ≤ 2 px, fonts Hanken and Plex, and row ids equal the inbox's case ids. |
| G19 | The strip is honest | The 14 cells satisfy `scrollWidth == clientWidth` at 1440, 1920 and 2560, and every mark's `data-due` equals a case's `dueAt`. |
| G20 | *(judge's addition)* No teal or cyan on dark (tell 13) | Probe: the computed colour of every `[data-origin=paypal]` element on the Wire has an HLS hue of 205–225° (`#6FB2FF` = 212°). No text or fill inside `[data-wire]` has a hue of 150–200° with saturation > .25. |
| G21 | *(judge's addition)* The reader tells the truth | For each case with a pack, the reader's text (whitespace collapsed) equals the text extracted from `buildEvidencePdf(input)` for the same input. For filed packs, that is the PDF filed with PayPal. The download link returns 200 `application/pdf`. The reader's body text is ≥ 16 px. |

### 6. What not to do

- No WebGL, Three.js, Lottie, Rive, particles, glass, gradient mesh, glowing orbs or animated gradient borders. They cost hours, read as generated and fight the paper concept.
- No typewriter or token-streaming text, no shimmer "thinking" states, no confetti, no sound, no chat panel.
- No three-pane desk or persistent case rail (unless the owner asks), no dark approval modal or bottom sheet, no second dark surface, and not a band *and* a plane.
- No landing sections: no features, logos, testimonials, counters or architecture arrow strips.
- No weight ≥ 600, no monospace money, no Geist or Plus Jakarta Sans.
- No fake barcodes, photos or film frames, and no invented exhibit content. Exhibits mirror the real PDF.
- Don't show the browser's native PDF viewer in the video. Use the in-place reader; the PDF is a download.
- No PayPal logo or PayPal-style buttons. Blue is a meaning, not a brand costume.
- Never fake PayPal timing. No fixture shown as live, no reused debug ids, no interactive fixture on `/`, and no sample approval as the video's climax.
- No per-step cost column and no call counter: one rounded cost per case, on paper.
- Don't replace Bryntum with a custom timeline, and don't hide a trial watermark with CSS.
- Don't spend more than 1 h on the route ViewTransition; ship the crossfade if it's flaky.
- No dark-mode toggle, scroll-jacking, parallax or custom cursor, and no phone polish beyond the approve path.

### 7. Ranked build list (one UI worker; must-ship is items 1–8, about 11.5 h)

| # | Item | Est. | Done check |
|---|---|---|---|
| 1 | **One app, shell and tokens.** Port the data and the store, then delete `/drafts/a` and `/drafts/b`. Set up the fonts, colour tokens, masthead and wordmark, and a Wire plane on every page. Install `motion` and `@number-flow/react`, and add the easing tokens and reduced motion. | 1.5 h | G5, G9, G10 and G20 pass. 1440×810 shots of `/inbox` and a case show paper plus the right Wire, with 0 contrast failures. |
| 2 | **The Wire on real data, with the honesty plumbing.** Entries come from polled audit rows (`/api/cases/[id]` every 3 s), filtered to PayPal origin. Delete the hard-coded live line (`_cases.ts:62`). Add the "Sample case" marks and sample rendering, the arrival motion, the in-flight rule and the 24 h live-dot rule. *Depends on W4 rows carrying origin, status and debug id.* | 1.5 h | G6, G7 and G12 pass on the deploy. An injected audit row yields exactly one animated entry. |
| 3 | **Case view.** The column order of §4, with the slip as a static object. The expected-value table values the returned item. Dossier: purge `.ph1–.ph3` and `.frame`, typeset Exhibit D, sheets ≥ 160 px, and the **in-place reader**. "What the agent did" sentences with hover linking. The position line, worded previous/next, and J/K. The sandbox bar. | 2.5 h | G11, G13, G14 and G21 pass at all three desktop sizes. The slip's button contains its amount. J and K change the case. Esc closes the reader. |
| — | **Owner checkpoint.** Two 1440×810 PNGs of the case page: slip pending, and the resolved frame with `RESOLVED` stubbed. | 10 min | The owner approves, or the 44 px strip fallback (about 1 h) goes in before item 4. |
| 4 | **Approval ceremony.** The undo rule and Send now, the slip's travel into the Wire, the hold for real latency, the failure state, state propagation (nav, row, margin, h1 area) and no re-approve. Same component on `/approvals` with the real-count empty state. *The PM's gate decision is due before this item starts.* | 2 h | G1. After the 200: a Wire entry with `make-offer` or `provide-evidence` and `200`, the nav count down by 1, 0 "until you decide", and no Approve button. A forced 4xx from a mock shows "Nothing was sent" with a debug id. |
| 5 | **Landing** with the labelled real replay, reusing the case components at a smaller scale, and the staged wait for Open test dispute. *Depends on the PM naming the recorded run.* | 1.5 h | G12 and G13 on `/`. The replay ends within 10.5 s. Stage 1 shows within 1 s of the click, and the clock ticks. |
| 6 | **Inbox.** Headline with NumberFlow, rows with photos, own-case routing, the strip, new-row arrival tied to the Wire, settled amounts and the staged-wait well. | 1.25 h | G15 and G19 pass. Olivia's row shows "$40.00" settled, not "Buyer favour". An inserted case animates in. |
| 7 | **Resolution beat.** The `RESOLVED` entry, the h1 sentence swap, the figure roll and the green rule. | 0.5 h | After the sandbox adjudicate on a real test case, the h1 contains "You kept $", the inbox headline amount falls, and the `RESOLVED` entry carries a real event id (G12). |
| 8 | **Photos.** About 5 scenario items as WebP, plus `CREDITS.md` and `/about`. | 0.75 h | Every `<img>` is credited and ≤ 40 KB, with no placeholder names. An item with an unclear licence shows no photo. |
| 9 | **Bryntum board.** Variables, renderers, resource photos, click-through and the computed h1. Keep it out of the nav until the licence arrives. | 1.5 h | G18 on the deployed page. A screenshot shows ink lines and ticks, with no pills. |
| 10 | **Settings** as sentences with the live consequence line, plus the $250 gate if the PM approves it. | 1 h | Editing $50.00 to $200.00 changes *n* correctly, and `PUT /api/policy` returns 200. |
| 11 | **G1–G21 as one command**, plus shots at 1440×810, 1920×940, 1536×752, 2560×1440 and 390×844. Write G7, G12, G13, G14 and G21 alongside items 2–4. | 1 h | `npm run check:ui` prints all PASS. Any FAIL blocks the owner card. |
| 12 | **Garnish:** the row → case ViewTransition and the exhibit fly-in across the seam. | ≤ 1.5 h | With the flag on, `::view-transition` animations exist in Chromium, and the page works without them. The fly-in passes G1. |

**Cutting:**
- The total is about 16.5 h against roughly 12 h of UI time. If day 1 ends behind, cut 12, then 11 (beyond the checks already written with items 2–4), then 10.
- Item 9's fallback is to keep Deadlines unlinked (5 min) and style the board after integration.
- Never ship half-finished motion: an item's motion either passes G1 and G3, or ships as a 120 ms fade.

**Decisions the PM must make (not UI work), with deadlines:**
1. **Approval gate.** m2's "ask me before filing evidence or settling over $250" or m3's demo policy. *Due before item 4.*
2. **The recorded real run** that the landing replays, by dispute id. *Due before item 5.*
3. **The offer path.** Whether it runs live by **11/3**; if not, the hero stays chargeback.
4. **Bryntum sponsor licence key.** Due before Deadlines goes into the nav.
5. **Photo licences** for about 5 items. Due before item 8.
6. **W4 data.** Audit rows carry origin, status and debug id for every PayPal call, and the evidence action stores the input object passed to `buildEvidencePdf`. *Due before items 2 and 3.*
7. *(Judge's addition, not debated)* **A daily real sandbox test dispute during judging (12/1–12/15)**, so the Wire's last webhook is under 24 h old whenever a judge opens the site.
   - Cost: about $0.05 per run (briefing), inside the $4/day and $45 caps.
   - The PM checks the Vercel Hobby cron limits, or uses a scheduled GitHub Action.

## What I checked, and what is assumption

**Checked** in my folder's copy of the drafts (2026-10-25):
- 0 `@keyframes` in `a.module.css`, `b.module.css` and `pages.module.css`.
- `_cases.ts:62` hard-codes the live line with debug id `7f3a91c2e04b8`, and `_cases.ts:117` reuses it on `send-message`.
- `pages.module.css:99,103–104,109,123` draw the fake photos and frames with gradients.
- `pages.module.css:4` sets `container-type: inline-size`, and `:24` sizes text in `cqw`, so the in-place reader zoom is a CSS change.
- `a/layout.tsx` loads Hanken Grotesk and IBM Plex Mono; `b/layout.tsx` loads Newsreader and Spline Sans Mono.
- The 1920 shots of the A and B case and inbox pages.

**Computed by me:**
- The WCAG 2 contrast of every palette pair above. The lowest is ink3 on well, at 4.85.
- Hues: `#6FB2FF` 212°, `#0059B8` 211°, `#2F5D2A` 114°.
- Critical damping: 2√420 = 40.99.
- The `clamp()` endpoints.
- The fold arithmetic, including the error in the synthesis's slip budget.

**Not verified by me** (members' claims or my own assumptions):
- The critic's live-probe measurements.
- That Geist is the create-next-app default, Plus Jakarta Sans is a template staple, and `#1D4ED8` is Tailwind blue-700.
- The npm, Next and Bryntum facts, which members read on the web on 2026-10-25.
- Whether hiding a Bryntum trial mark breaches its terms.
- Vercel Hobby cron limits.
- The h1 line counts, which I estimated as 2–3 lines. G14 decides on the real render.
- The owner's reaction to the dark plane, which is untested.

RESULT: done, FILE: verdict.md


---
## Debate record (written by company debate)
- m1-claude: company-worker:claude-opus-5-5:high on oracle, stance "Award-level product designer for premium fintech and dev tools (Stripe, Mercury, Linear, Arc, Vercel); holds the owner's bar: top quality, premium, striking, rich smooth motion, never template"
- m2-claude: company-worker:claude-opus-5-5:high on oracle, stance "PayPal developer-relations judge scoring Design and Presentation from a 3-minute video and the first screen of the hosted demo; wants the live PayPal loop unmistakable and the story clear in 10 seconds"
- m3-claude: company-worker:claude-sonnet-5-5:high on oracle, stance "Small cross-border seller (vintage camera shop) who would use this daily with real money; values trust, clarity, calm, speed"
- m4-antigravity: antigravity:gemini-4-argon-medium:- on mac, stance "Second-family critic: spot what reads as AI-generated or generic, and propose what would make this memorable among 20,000 entries"
- phases run: r1, r2, synthesis, agree-dissent
