# Review: rehearsal A

Rendered on win-guest with HyperFrames 0.8.201: one worker, 30 fps, `--quality looks`, PNG frame capture, then a stream-copy remux with `+faststart`. The film is silent apart from the CC0 cues, with captions burned in.

## Render 1 (10/26 18:34–18:43 KST, 9 min 28 s)

ffprobe gave h264 High, yuv420p, 1920×1080, 30/1, 5055 frames, 168.5 s, with an AAC track for the cues. A full decode (`-xerror`) logged no errors, and the moov atom sits before mdat. I looked at the frame at each beat's midpoint, a before/after pair at each of the 13 cuts, and 28 more frames between cuts. Three defects:

| Where | What | Fix |
|---|---|---|
| 0:21.6, arrival-plate | The first 4 frames after the cut showed the button still reading "Opening in PayPal's sandbox" at the new zoom; then the plate popped in. | In-point 13.4 → 13.55 (the plate is on screen from source 13.53). |
| 2:24.5–2:26.9, arch band | The N23 caption covered the "Spend: Hard caps on every AI call…" row (the `<dl>` default margin pushed the rows 32 px down). | `.a-row { margin: 0 }`, rows at 40 and 100 px into the band. |
| 2:31.4–2:32.8, cases | The list drifts up through the shot, and the "We asked the sandbox to rule on each." chip ended up over the "For you" rulings of the top rows. | The chip moved to the right edge, 440 px wide, over the Closed dates only. |

All three were checked again in HyperFrames snapshots (21.62, 21.7, 144.5, 146.5, 148.5, 149.0, 151.5, 152.6) before render 2.

## Known and accepted

- The VPY shot at 1.25× trims the top of the nav bar, to keep the case title whole.
- In the cases shot the pointer sits in the top-left corner (the take never moved it).
- Captions sometimes sit over page text that isn't being talked about (the evidence list under VAB, the "Chance PayPal sides with you" row under the rules lanes). They never cover the stop, panel, lane or row the line is about.
- The arch scene opens on an empty plate for 0.35 s before its heading fades in.
- B4 is the stand-in (an older build at 1440×900, scaled up 1.2×) and is tagged as one on screen. B5J is a labelled placeholder.
- Camera punch-ins scale the 1080p takes by 1.15–2.0×. Text stays legible at 2.0× (B3), but it is softer than native.

## Render 2, the rehearsal (10/26 18:49–19:00 KST, 11 min 26 s)

`s4/video/rehearsal-a.mp4`, sha256 d10e3c57b07c0e471ce38d8ead39b20e71c287979f9431890062e9937e4d3ea0, 47.3 MB.

- ffprobe: h264 High, yuv420p, 1920×1080, 30/1, 5055 frames, 168.5 s (2:48.5), 2.25 Mb/s, AAC LC.
- A full decode with `-xerror` logged 0 error lines. Atom order is ftyp moov free mdat (fast-start).
- Sound: silencedetect (−45 dB) finds exactly nine onsets, at 18.23, 24.68, 38.96, 43.80, 66.13, 69.03, 79.25, 88.16 and 93.95 s, matching `audio/cues.json`. Peak −7.3 dB. There is nothing else on the track.
- I looked at every frame below: the nine beat midpoints (`rehearsal-a-contact-sheet.png`) and the before/after pair at each of the 13 cuts. All three render 1 defects are gone, and nothing new turned up.

# Review: rehearsal B (PM delta v1)

Same pipeline as rehearsal A. What changed: the ten revised lines and their captions, the title and end-card taglines, B7's fourth stop ("Your limits"), crop windows (`#camwin`) so that no shot leads with a camera-brand headline, B3 split so N11's caption sits under the evidence, B4 reframed so N13's second half lands on PayPal's 200, B5's "An earlier case, same flow" note, and B7's cases shot cropped to the nine kept cohort rows with the live count chip.

## Snapshots before rendering (HyperFrames, 10/26)

| Where | What I found | Fix |
|---|---|---|
| 0:57–1:03, N11 | The caption sat on the seller statement (f016). | B3 split at 0:56.4: N11 plays on the scrolled take at 1.1×, cropped above the exact-text toggle, so the caption has an empty band under the evidence. |
| 1:04–1:22, B4 | At 1.3× the left column was sliced, and the 200 was half cut during a nudge. | 1.15×, one fixed frame; a top crop of 120 px hides the item headline, opening to 86 px while the panel is blank (1:18.25–1:18.4), so "200 accepted" shows whole. N13 starts at 1:15.3 so "PayPal returns success…" appears at 1:19.0, as the 200 settles (1:19.1); sfx-07 moved there. |
| 0:00–0:56, every shot | The B4 crop's `fromTo` painted its start (a 120 px top crop) as soon as the timeline was built. | The crop is opened at 0, and window tweens use `immediateRender: false`. Checked at 0:20, 0:30, 0:45 and 0:55.5. |
| 1:22.4–1:42.4, B5 note | The one-line note overflowed its box. | `.one { max-width: none }`. |

## Render 1 (10/26 19:50–19:59 KST, capture 8 min 17 s, overwritten by render 2)

ffprobe gave h264 High, yuv420p, 1920×1080, 30/1, 5055 frames, 168.5 s. The `-xerror` decode logged 0 error lines, and the atom order was ftyp moov free mdat. silencedetect (−45 dB) found the nine onsets at 18.23, 24.68, 38.96, 43.80, 65.53, 68.43, 79.10, 88.16 and 93.95 s, matching `edit.json` and `audio/cues.json`, with a peak of −7.3 dB. I looked at the nine beat midpoints and the before/after pair at each of the 14 cuts. Two defects:

| Where | What | Fix |
|---|---|---|
| 1:22.5, 1:48.7 | N13's and N17's last caption hung 0.25 s past their beat's cut, over VAB and over the rules page. | A caption now ends by its beat's last frame. |
| 1:42.4–1:48.6, B5J card | The note said "if the judge-loop control ships". | "Phase B fills this if the judge-loop footage exists. If not, this beat and its line drop, and the film runs 2:42.3." |

Both were checked in snapshots (82.35, 82.45, 105.5, 108.55, 108.65) before render 2.

## Render 2, the rehearsal (10/26 20:06–20:15 KST, capture 8 min 19 s)

`s4/video/rehearsal-b.mp4`, sha256 2b40247f799304c9e2d536c1d640df9d124e6c862a847fbd7ec669e50a4e7fa1, 40.1 MB. The on-screen count was read at 2026-10-26T10:50:25Z (10 of 15 documented cases).

- ffprobe: h264 High, yuv420p, 1920×1080, 30/1, 5055 frames, 168.5 s (2:48.5), 1.90 Mb/s, AAC LC.
- A full decode with `-xerror` logged 0 error lines. Atom order is ftyp moov free mdat (fast-start).
- Sound: silencedetect (−45 dB) finds exactly nine onsets, at 18.23, 24.68, 38.96, 43.80, 65.53, 68.43, 79.10, 88.16 and 93.95 s, matching `edit.json` and `audio/cues.json`. Peak −7.3 dB. There is nothing else on the track.
- I looked at every frame below: the nine beat midpoints (`rehearsal-b-contact-sheet.png`) and the before/after pair at each of the 14 cuts. Both render 1 defects are gone, and nothing new turned up.

## Known and accepted (rehearsal B)

- Small incidental UI text still names products and a carrier: "Olympus OM-1n body, chrome" in the order rows and the case lists, "Pentax MX body, silver" in RSL's order row (0:33.6–0:37.2), and "USPS" in the shipment rows. No headline with a brand is the hero of any shot, and nothing of ours names one.
- The app's own copy still says "asks before it moves money" (landing hero, B8) and "It asks before money moves" (rules page, B6). That text lives in `src/`; the film's own lines and taglines now say "within the limits you set".
- Crops leave a band in the plate colour: under the evidence in B3 (y 884–1080, where N11's caption sits), over B4 (holding the stand-in tag), and under the cases rows in B7.
- In B4 the top crop also hides the stand-in panel's "$399.00" until PayPal's answer; the subtitle and the tag carry the amount.
- PM visual fix 6 (an enforcement insert under the B7 diagram) is skipped: it crowds the beat. The real enforcement is on screen in B2 and B3 instead.
- N25's last caption group runs 0.55 s onto the end card's plate, inside the same beat, as in rehearsal A.
- Rehearsal A's other notes still apply (the arch's empty plate for 0.35 s, the pointer parked in the cases shot, the stand-in and placeholder slots, softer text at 2.0×).

# Review: rehearsal C (PM delta v2: one caption per sentence)

Same pipeline as rehearsal B. The lines and their times don't change. What changed: each line of two sentences (N01, N09, N12, N13, N22, N26) is now two rows, N01a and N01b and so on, that abut, and each row is one caption. No caption splits a sentence any more. Sentences of more than 84 characters (N23, N25) are set on two balanced lines, and the box hugs the text. `captions.srt` and `captions.vtt` carry the same 32 sentences on the same clock, N26a and N26b included. Each split is the sentences' share of the line's time by spoken length, held to 2.4 words a second on both sides: N01 at 0:02.65, N09 at 0:47.75, N12 at 1:06.45, N13 at 1:18.65, N22 at 2:14.7 and N26 at 2:42.0.

## Snapshots before rendering (HyperFrames, 10/26)

| Where | What I found | Fix |
|---|---|---|
| 2:19.8–2:27.0, N23 | On two lines, the caption covered the arch band's "Spend: Hard caps on every AI call…" row. | The band rises to y 690 and its rows sit at 30 and 84 px, so Spend ends about 36 px above the caption. |
| 0:24.7–0:30.0, N06; 2:33.2–2:41.0, N25 | With `text-wrap: balance` and a max width, a two-line box stayed 1,400 px wide around shorter lines. N06 on two lines also reached the wait plate's capture note. | `build.py` breaks a caption over 84 characters itself, between words and never after a weak word ("an", "the"…). N06 (82) stays on one line, under the plate. |

I snapshotted the middle of all 30 burned captions, every a/b handover, and the start and end of each two-line caption.

## Render (10/26 23:07–23:16 KST, capture 8 min 39 s)

`s4/video/rehearsal-c.mp4`, sha256 3f77d62c86f5068fcca4939b481aa0d9f3b8efcbc10d692724bf5c85a7521174, 39.6 MB, with `rehearsal-c.srt` and `rehearsal-c.vtt` beside it. The on-screen count was read at 2026-10-26T14:07:02Z (10 of 15 documented cases, as before).

- ffprobe: h264 High, yuv420p, 1920×1080, 30/1, 5055 frames, 168.5 s (2:48.5), 1.88 Mb/s, AAC LC.
- A full decode with `-xerror` logged 0 error lines. Atom order is ftyp moov free mdat (fast-start).
- Sound: silencedetect (−45 dB) finds exactly nine onsets, at 18.23, 24.68, 38.96, 43.80, 65.53, 68.43, 79.10, 88.16 and 93.95 s. Peak −7.3 dB.
- I looked at the nine beat midpoints (`rehearsal-c-contact-sheet.png`), the before/after pair at each of the 14 cuts, and a frame from the file at the middle of each of the 30 captions and just after each of the five a/b handovers. Every sentence shows whole, in order, and none covers the stop, panel, lane or row it is about. Nothing new turned up.

## Known and accepted (rehearsal C)

- N13b starts at 1:18.65, on PayPal's answer panel while its counter still runs up; the 200 settles 0.45 s later (1:19.1). A later start would put N13b over 2.4 words a second.
- At each a/b handover the caption dips for 0.1 s (a fades out, b fades in), as the old caption groups did.
- N25's two lines sit over the landing's Record row (the webhook id and "Replay the case"), which isn't being talked about.
- N26a and N26b stay off the picture (the end card shows their words); they are in the .srt and .vtt.
- Rehearsal B's notes still apply.
