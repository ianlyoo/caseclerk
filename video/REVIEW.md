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
