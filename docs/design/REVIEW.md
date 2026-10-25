# Self-review against three current references (2026-10-25)

## References
1. **Linear, UI refresh** (changelog, 2026-03-12, https://linear.app/changelog/2026-03-12-ui-refresh) and the issue sidebar change in "Text attribution and agent-assisted editing" (2026-07-23, https://linear.app/changelog/2026-07-23-agent-assisted-editing). Headers, nav and view controls work the same everywhere; quiet chrome; the list, the issue and its properties side by side; in July the properties were pulled closer to the main content.
2. **Mercury Command** (launched 2026-06-16, Business Wire via Morningstar, https://www.morningstar.com/news/business-wire/20260616596362/mercury-launches-command-a-new-way-to-run-your-business-through-banking; "Our security principles behind Command", Mercury blog, 2026-07-16, https://mercury.com/blog/security-principles-command). The AI stages an action, shows exactly what it will do, and waits for explicit confirmation. After approval the backend runs the action without the model in the loop.
3. **Stripe Dashboard, disputes** ("Respond to disputes", https://docs.stripe.com/disputes/responding, undated, read 2026-10-25; "Stripe Dashboard Design Breakdown", 925studios, 2026-03-27, https://www.925studios.co/blog/stripe-dashboard-design-breakdown). Deadlines are given as "Respond by [date]", not "Action required". The response is evidence grouped by dispute type, with supporting files. Plain nouns ("Disputes", not "Chargeback events").

## What each draft takes

| | Draft A, the desk | Draft B, the case file |
|---|---|---|
| Linear | Three panes: list, case, properties and decision. The list stays visible while you work a case. Top bar and filter rail are text only; the current item is darker with a 2px rule | Takes the July change further: properties are a short facts table inside the reading column; no sidebar. Same quiet nav |
| Mercury Command | The rail opens with the staged action: the amount, the policy line it crosses, the exact note PayPal will send, then Approve / Deny. After Approve it shows what PayPal returned (status, debug id) | The recommendation is a sentence ("Offer Daniel $180.00 and let him keep the camera."), then the expected-value table, then Approve / Decline, then the exact note. The margin says "Nothing reaches PayPal until you decide" |
| Stripe disputes | "8 days 14 h left to respond, due Mon Nov 2, 11:59 pm" next to the amount; in the inbox a "Respond within" column and a 14-day lane; evidence as exhibits A–E with page previews | "Respond by 8 days 14 h from now, Mon Nov 2 at 11:59 pm" as a fact row; a 14-day calendar on the inbox; the evidence pack shown as full pages you can read |

## Where each is weaker, and what I changed before reporting

**A**
- At 1920 the four evidence-page previews are about 90 px wide: they read as pages, but you can't read them. Kept, since the rail is for deciding and the PDF link opens the file; B is the draft that shows readable pages.
- The timeline repeats the decision in the rail (the "Recommends a $180.00 partial refund" row). Kept: the timeline is the audit log and has to be complete.
- Fixed: the deadline lane header was 14 crammed numbers. It now shows "Today" and the end date over hairline day ticks. Raised grey text contrast (`#93938d` to `#7f7f79`). On a phone the order is now header, approval, why, timeline, evidence, sandbox; before, the sandbox controls sat above the timeline.
- Still weaker than Linear: no keyboard or command layer, and the filter rail doesn't filter yet (it's a draft).

**B**
- Fixed: at 1920 the Approve button fell below the fold. It now sits right under the expected-value table, and the outgoing note follows it. Also tightened the header spacing.
- Fixed: on a phone the margin notes ran together ("Oct 2510:40") and the facts table overflowed on the reason code. Line breaks are kept and long codes now wrap.
- Fixed: hairlines ran edge to edge of the viewport; they now stop at the content width, like a printed page.
- Weaker than A for a seller with many cases: you see one case at a time and go back to the inbox to move on. The inbox gives up the sortable table for the narrative grouping.
- The serif and the large type set a calm "file" mood, but the case page is long (about 3.8 screens at 1920). The timeline is the long part.

## Which one for judges
A. Judges spend about two minutes per entry. A shows the whole loop on one screen: the dispute, the agent's tool calls with PayPal endpoints and costs, the decision, and the approval. That's the "real live sandbox loop" edge. B is the better read, and better for the video's narration beats.
