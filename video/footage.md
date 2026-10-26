# Footage, cut A

Recorded 2026-10-26 on win-guest with Playwright against production (https://caseclerk.vercel.app): viewport and `recordVideo.size` 1920×1080, `deviceScaleFactor` 1, the real clock. Script: `video/capture/rec.cjs`. Each take has an `.events.json` with the wall time of every goto, click, hover and scroll.

Originals (VP9 WebM, 25 fps) live outside git in `/srv/company/work/g251-pm-104/s4/video/footage/`. `video/capture/normalize.sh` turns them into the H.264 30 fps clips the film reads (`video/assets/footage/`, also outside git).

Guards during every take: GET and HEAD only; every other request aborted in the browser; one `POST /api/test-dispute` allowed per flagged take, two in total (`test-dispute-budget.json`: 1 used). Nothing was approved, denied or filed. PP-R-VPY-10194485 got no POST. PP-R-XCS-10194591 was never opened. The visitor cases still waiting stayed waiting.

| File | What it shows | Case | Length | Captured (UTC / KST) |
|---|---|---|---|---|
| `arrival.webm` | The cases page (33 disputes). Clicks Open a test dispute (the one POST, 08:56:24Z, 202). The wait plate: four wire rows (201, 200, 200, 201), then 3 min 10 s of real waiting, then the webhook rows (verified, signature 200), Its webhook arrived, Open the $289.00 case, the inbox at 34, the new case page. The take ends on a script timeout at 284 s, waiting for a stop that wasn't there yet. From 280 s the panel says "Sending to PayPal" while the agent files nothing (it is about to ask); the cut never uses it. | PP-R-RSL-10194603 (new) | 284.08 s | 08:56:18 / 17:56:18 |
| `rsl.webm` | The new $289.00 case after the agent asked: the Asked you stop (1 min 29 s, 89 s after it arrived), About 65%, Filing $115.10 vs refunding $315.58, File the evidence hovered only, the evidence list. | PP-R-RSL-10194603 | 24.28 s | 09:02:42 / 18:02:42 |
| `vpy.webm` | The $412.00 case waiting for a yes: Chargeback in, Asked you (98 s after it arrived), About 35%, Weak: tracking proves delivery, not condition, Filing $292.22 vs refunding $442.87, File the evidence hovered only, the evidence list and the exact-text toggle. | PP-R-VPY-10194485 | 41.84 s | 08:56:36 / 17:56:36 |
| `vab.webm` | The $399.00 case PayPal ruled on: $388.18 kept of $399.00, Closed for you, You said yes. Filed (POST provide-evidence, 200, debug id f95638041ab53), Held, then released. | PP-R-VAB-10194570 | 21.52 s | 08:57:19 / 17:57:19 |
| `rules.webm` | Your rules: It asks before money moves; the evidence lane (asks at $250 and up) and the refund lane (asks over $15), each Asks you hovered. | none | 19.84 s | 09:11:25 / 18:11:25 |
| `policy.webm` | An earlier take of the rules page (same page, different moves). Not in the cut. | none | 18.12 s | 08:57:44 / 17:57:44 |
| `cases.webm` | The cases page scrolled to Closed (23): PayPal's rulings, newest first. | none | 19.52 s | 08:58:03 / 17:58:03 |
| `landing.webm` | The landing: $397.00 disputed, $386.23 kept, the scale replaying to 12 min 31 s from chargeback to closed. | PP-R-SGV-10194507 | 26.48 s | 08:58:26 / 17:58:26 |
| `inbox.webm` | The inbox after the arrival: 34 disputes, 3 waiting for your yes. Not in the cut. | none | 9.40 s | 09:03:08 / 18:03:08 |
| `standin-approve.mp4` (in `video/assets/footage/`) | Stand-in for B4: the real approval of the $399.00 case on Oct 25 (an older build, 1440×900, pillarboxed). From `docs/design/d2/stage2/approve-1440.mp4`. Phase B replaces it. | PP-R-VAB-10194570 | 18.80 s | 2026-10-25 |

Sync offsets for edit.json (`videoOffset`): a take's video runs ahead of its event clock by this much, so a click logged at t lands in the video at t − offset. Checked on frames: vpy's first click (t 6.137) changes the page at 5.7 s.

## Checksums (sha256 of the originals)

```
d8771689ff7ec1276915e0816d8c8c39e27bab25ce94f61fdf7a5701a184232b  arrival.webm
e1efd9a56f3c926062310b12fe82fbf9242cd5ec3df53bae1ee43cd81cb74c0b  cases.webm
c6fb1896b28e6a1a8c391326640936228d72f225c02af9adffd07788e92536b3  inbox.webm
2bce55bf9ccd5675d8aa5903b814bcd2cc54c1a8cf9e3492a5112dea5606ff9c  landing.webm
bdbc71527b7156efef040b4ec239ca47bccc23951aecb045b7e5a1e8323cbd92  policy.webm
f51f83a753c9e84f23d2069ab01e34a437f4891b1b81414dacc719750392c477  rsl.webm
fa32e7e98c86a0dc4017a37b3d0e88d2cbfd5617e00d107209fdbfac543c9053  rules.webm
95daaa1e575ebc65d736e68973f8bd63d4820e755fe6e7a8417dd0208278c326  vab.webm
77464e761408369b23d294fb13b582ed745bd32ed7ccbede6d44f531933b5e31  vpy.webm
c23fe8cb5c737a26e16ffaf0aafaebe5c31fd894ef9b9192f4e02e3c7fa9da03  arrival.events.json
cf23cec18340ace81dc48e1641825869b0df27680f91214ce98c873d8cb8a3ae  cases.events.json
d8f267a9d4534bc7e5b276ee61ded9f864c98d53e3c0fd722d8e1a59e7a125b1  inbox.events.json
2a71871d523e32b94b0e0a81371cca6601f7d972bb66ec364293ba68daed516a  landing.events.json
fefbc75a7a69b2ea4ff905fc093c01944fb43464935582c2865674991b93a8eb  policy.events.json
8d6803bdb48a48c6633eaed6d3955ab8317b6bee185af0c811f5977251fa5e60  rsl.events.json
5ed6676ce77de689be91ebf1f0919afd6ea426c7c62b33ee0894270d94c27252  rules.events.json
16986523319c75bdf24918fe04cdaf13399e3e8b8fc5199698bc5901549ded4f  vab.events.json
c16b70bc504331e90043a456ca8e20b5187d1472395d45bf82cd7317de320f43  vpy.events.json
5d814a44974125915a14099949c7bb20bf27c1bc68551c56de7dbe431119867e  test-dispute-budget.json
```
