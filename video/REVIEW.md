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

# Review: rehearsal D (PM delta v3/v3b/v3c: the owner's take, sound, VPY)

Same picture pipeline as rehearsal C, now with sound. What changed: the owner's narration (one take, each sentence moved in time to its row, nothing stretched), a bed synthesized by `scripts/mix.py`, six CC0 cues, a short dissolve at each of the 14 cuts, and D2's real VPY approval in B4 and B5J. Captions are the words as spoken, one per sentence, 30 of them; N26a and N26b aren't in the take, so they are off the .srt and .vtt until the re-record. `LISTEN.md` has the sound, the take review and the five places to listen.

## Snapshots before rendering (HyperFrames, 10/27)

I snapshotted the middle of every dissolve, B4 from Yes, file it through the 200 (1:04, 1:06, 1:10, 1:19.6, 1:21.8), B5J under N17, and the end card as it lands. All 14 dissolves read as one shot handing over to the next. B4's headline stays under its cover; "200 accepted" and debug id f411956448116 are on screen when N13b starts. B5J shows the sandbox ruling control (Seller wins, Buyer wins, Ask for the ruling), never clicked. Lint flagged the cover div for having no id; covers now get `k-SHOT-N` ids, 0 warnings.

## Render (10/27 01:16–01:25 KST, capture 8 min 12 s)

`s4/video/rehearsal-d.mp4`, sha256 b4b870ade4aaa931404817a01ca3f0a05847a5bb37206154e6fdcbcc443dfef8, 52.3 MB, with `rehearsal-d.srt`, `rehearsal-d.vtt` and `rehearsal-d-contact-sheet.png` beside it. Rendered on win-guest as rehearsal C was, not on the Mac. The on-screen count was read at 2026-10-26T16:14:22Z (11 of 15 documented cases, VPY now among them).

- ffprobe: h264 High, yuv420p, 1920×1080, 30/1, 5055 frames, 168.5 s (2:48.5), 2.49 Mb/s, AAC LC.
- A full decode with `-xerror` logged 0 error lines. Atom order is ftyp moov free mdat (fast-start).
- Sound: −14.3 LUFS, −1.5 dBTP, LRA 8.7 LU on the AAC track. Voice onsets match their rows (silencedetect on the voice stem: 0.39, 2.66, 5.59 …) and the cues land on their frames (18.23, 24.68, 66.525, 79.23, 126.95, 160.8).
- I looked at the nine beat midpoints (B8 now on the settled end card, 2:44.5), the before/after pair at each of the 14 cuts, N23 and N25 on two lines, and the end card at 2:44.5 and 2:48.3. For the sound I went through the whole mix by its spectrogram and waveform, a small-speaker and an earbud simulation, a mono fold-down, loudness and peak meters, and a fresh transcription; I can't hear it, so the five places in `LISTEN.md` are for an ear. Nothing to fix turned up.

## Known and accepted (rehearsal D)

- N26a and N26b aren't voiced yet: the end card shows their words under the bed's lift. Five rows to re-record are listed in `LISTEN.md`; the take as it is carries the film.
- Captions are clean verbatim: N15 is captioned "$388 kept" and "a seller" as said, N23 "the limits", N25 "every evidence". They change with the re-record.
- B4's headline is under a flat plate-coloured cover (y 0–92) for the whole shot.
- B5 stays on VAB (rehearsal C's footage): N15 as spoken names VAB's $388.
- The bed's room is wide; folded to mono the bed loses 2.9 dB (median), the voice nothing.
- The limiter takes up to 3.2 dB off a few sentence onsets; under 1 dB on most of the 4% of blocks it touches.
- N19's caption sits over the rules page's "Chance PayPal sides with you" heading, as in rehearsal C.
- At each a/b handover the caption still dips for 0.1 s.
- Rehearsal C's note on N13b no longer applies: it now starts on the settled 200 (1:19.4).

# Review: rehearsal E (PM 01:55, 01:58, 02:06: ten re-recorded rows)

Rehearsal D's picture and cut, with ten sentences re-recorded by the owner: N15, N23, N25, N26a and N26b, then N10, N11, N17, N20 and N24, folded into one render. `scripts/retakes.py` splices them (row id → file → trim, level, place) and `mix.py` mixes them through the same voice chain; N26a and N26b are now spoken over the end card and back in the .srt and .vtt (32 cues). Two rows are sped up to fit (N10 4%, N24 3.3%; atempo, no pitch change); every other row keeps its start and the cut doesn't move. `LISTEN.md` has the retake review and the five places to listen.

## Snapshots before rendering (HyperFrames, 10/27)

I snapshotted every re-recorded row's caption (0:53, 0:58.5, 1:30.5, 1:44.5, 2:03.8, 2:30, 2:37) and the end card under N26b (2:44). Each caption reads as the row's sentence, N25 on two balanced lines, all clear of the bands and the parts of the page being talked about; the end card carries N26's words with no burned caption. Lint: 0 errors, 0 warnings.

## Render (10/27 02:12–02:20 KST, capture 8 min 27 s)

`s4/video/rehearsal-e.mp4`, sha256 aad53c357185cebb9471434259089bab4bbfc5458224fe9363c8fcfdf5b3e3bf, 52.3 MB, with `rehearsal-e.srt`, `rehearsal-e.vtt` (32 cues) and `rehearsal-e-contact-sheet.png` beside it, and a copy at `board/narration/rehearsal-e.mp4` (same sha256). Rendered on win-guest, not on the Mac. The first E render (the first five retakes only) was stopped part-way when the second five arrived, and its partial output deleted, so E is one render with all ten. The on-screen count was read at 2026-10-26T17:10:55Z (11 of 15 documented cases, unchanged).

- ffprobe: h264 High, yuv420p, 1920×1080, 30/1, 5055 frames, 168.5 s (2:48.5), 2.49 Mb/s, AAC LC.
- A full decode with `-xerror` logged 0 error lines. Atom order is ftyp moov free mdat (fast-start).
- Sound: −14.2 LUFS, −1.7 dBTP, LRA 6.5 LU on the AAC track; the bed 20.1 dB under the voice. The ten retake rows sit at −14.1 to −14.7 LUFS in the voice stem, inside take 1's own range, and start within 17 ms of their rows.
- I looked at the nine beat midpoints (B8 on the settled end card, 2:44.5), the before/after pair at each of the 14 cuts (N11's caption across the 0:56.4 cut, N24's ending on the 2:32.8 cut), and the sound by spectrogram, waveform, small-speaker and earbud simulations, a mono fold-down, meters and fresh transcriptions; I can't hear it, so the five places in `LISTEN.md` are for an ear. N20 still drops the "a" (below); nothing else to fix turned up.

## Known and accepted (rehearsal E)

- N20 says "waits for yes" without the "a" (seven of eight transcriptions); captioned as said, the written line kept as `script`.
- N15 ("the hold" comes out as "a hold" in all seven transcriptions) and N24 ("kept", heard right on its own, "caps" in whole-film transcriptions) are worth an ear; their captions follow the written lines.
- B4's headline is under a flat plate-coloured cover (y 0–92) for the whole shot.
- The bed's room is wide; folded to mono the bed loses 2.9 dB (median), the voice nothing.
- N19's caption sits over the rules page's "Chance PayPal sides with you" heading, as in rehearsals C and D.
- At each a/b handover the caption still dips for 0.1 s.

# Review: the final cut (PM 02:35, the owner's verdict on E, #541)

The owner listened to rehearsal E: N20 is heard as "waits for a yes", the rest is clear, and the narration should come down about 10%. So the final cut is E's picture and takes, with two changes. N20's caption is back to "Anything bigger waits for a yes." (in the .srt and .vtt too). The voice stem is scaled by 0.9 (−0.92 dB) over the whole film; the bed and cues are unchanged, and the master gain is pinned at E's +0.8 dB, so no normalization pulls the voice back up. `LISTEN.md` has the numbers.

## Before rendering (10/27)

The new mix against E's: bit-identical in every pause (bed and cues only); under speech the difference sits 20.5 dB under the mix, the tenth of the voice taken out. Voice stem −15.4 LUFS (E −14.5), bed −32.3 and cues −29.1 LUFS as in E. A snapshot of N20 at 2:03.8 shows the restored caption clear of the rules page. The on-screen count was re-read at 2026-10-26T17:33:58Z (11 of 15, unchanged). Lint: 0 errors, 0 warnings.

## Render (10/27 02:35–02:44 KST, 8 min 37 s)

`s4/video/final.mp4`, sha256 8245078c506bed53d83a6f0e7d7e38162d22d28d232493bc89646df0c36e5d50, 52.4 MB, with `final.srt`, `final.vtt` (32 cues) and `final-contact-sheet.png` beside it, and a copy at `board/narration/final.mp4` (same sha256). Rendered on win-guest, not on the Mac.

- ffprobe: h264 High, yuv420p, 1920×1080, 30/1, 5055 frames, 168.5 s (2:48.5), 2.49 Mb/s, AAC LC.
- A full decode with `-xerror` logged 0 error lines. Atom order is ftyp moov free mdat (fast-start).
- Sound: −15.3 LUFS, −1.8 dBTP, LRA 6.4 LU on the AAC track (E: −14.2 LUFS, −1.7 dBTP); the bed 19.2 dB under the voice (E: 20.1).
- I looked at the nine beat midpoints and the before/after pair at each of the 14 cuts; the picture is E's, with N20's caption restored. For the sound: spectrogram, waveform, small-speaker and earbud simulations, a mono fold-down, meters, the null test against E and fresh transcriptions. Nothing to fix turned up.

# Review: the final cut, the owner's notes on the sound (PM 03:00, #542)

The owner's last notes: the narration 15% quieter again, the cues a little louder and a few more, from a proper open-source library, and the bed's rise and fall under the narration less abrupt. So the final cut is the first final's picture, takes and captions (N20 "waits for a yes"), with four changes to the sound:
- the voice stem at 0.765× (0.9 × 0.85; −2.33 dB from E), the master gain still pinned at E's +0.8 dB;
- the bed 0.5 dB lower (18.3 dB under the voice);
- the bed's dip slower (down over 0.8 s, up over 2 s, held through pauses under 1.5 s, rising only part way in pauses under 3 s);
- every cue 3 dB louder, with five new ones on real on-screen actions: the clicks on Asked you, File the evidence and You said yes. Filed, and page flips into the $412.00 case and into Your rules.

The sounds are all Kenney CC0 recordings: the UI Audio and RPG Audio packs already in `audio/cues.json`, their zip hashes checked again before use. `mouse.wav` joins UI Audio's press and release; `flip.wav` is RPG Audio's `bookFlip3.ogg`. Freesound's CC0 packs need an account to download, and this work uses none, so nothing came from there. `LISTEN.md` has the numbers and the cue list.

## Before rendering (10/27)

Mix: voice stem −16.8 LUFS (first final −15.4), the bed 18.3 dB under it, the mix −16.4 LUFS and −2.0 dBTP. The limiter went over its level in 4 of 16,850 blocks, the most 0.82 dB. The duck checks out: the bed is fully down at every sentence's start, middle and end, and its fastest change is 19 dB a second (E: 45). Every cue was measured against the voice stem. Nine land in silence. The arrival click and the Yes click land in the 50 ms and 30 ms gaps between words, as they did in D and E. Footage clicks left silent: Chargeback in (on "$412.00"), Closed for you (on "ruled for"), and the exact-text toggle, which the shot crops out. Lint: 0 errors, 0 warnings.

## Render (10/27 03:07–03:16 KST, 8 min 49 s)

`s4/video/final.mp4` (replaces the first final), sha256 6726d89ddfb6a2e5f557b59b1b2103830c29c1347cf937d3bc11d1c678669199, 52.3 MB. Beside it: `final.srt` and `final.vtt` (32 cues, unchanged) and `final-contact-sheet.png`. A copy is at `board/narration/final.mp4` (same sha256). Rendered on win-guest, not on the Mac.

- ffprobe: h264 High, yuv420p, 1920×1080, 30/1, 5055 frames, 168.5 s (2:48.5), 2.48 Mb/s, AAC LC.
- A full decode with `-xerror` logged 0 error lines. Atom order is ftyp moov free mdat (fast-start).
- Sound: −16.5 LUFS, −2.0 dBTP, LRA 6.4 LU on the AAC track (first final: −15.3 LUFS, −1.8 dBTP; E: −14.2, −1.7).
- Picture: against the first final, 4,602 of 5,055 frames are identical and the rest are at PSNR 51 dB or more. I looked at the nine beat midpoints and frames at each new click. For the sound I checked:
  - the spectrogram, the waveform and the bed stem's waveform;
  - small-speaker and earbud simulations, and a mono fold-down;
  - the meters and fresh transcriptions: 28 caption words differ from the mix's (first final: 30).

  Nothing to fix turned up.

# Review: one zoom across the case-page dissolves (PM 03:27, #543)

The owner's note: around 0:36 the screen is nearly the same on both sides of the dissolve, but it seems to change resolution and zoom out as it fades. Where only the case changes on the same kind of screen, keep one zoom level by matching one side to the other. The cause was the camera, not the footage. Every take involved is 1920×1080, and the RSL and VPY pages have the same layout pixel for pixel. RSL was framed at 1.3×, VPY at 1.25×, a little further left and up.

What changed (edit.json cams only; audio, cut times and captions as they were):
- **0:37.2 RSL → VPY:** RSL takes VPY's opening framing (1.25×, −240, −265). The two pages now line up exactly.
- **1:04.2 VPY evidence → the approval:** the approval drops to the evidence shot's 1.1× (it was 1.15×), with the same left edge and crop line (y 884). The approval take was recorded unscrolled and the evidence take 210 px down the page, and the panel is sticky. No framing lines up both, so the panel lands within 35 px and the page under it 167 px apart. Before, this dissolve had both offsets and a 1.15/1.1 zoom change.
- **1:22.4 the approval → VAB:** VAB opens on the approval's framing (1.1×, the headline covered by plate, as the approval's is) and lines up exactly. After N14 it pushes in to its old 1.3× framing (1:25.8, over 1.6 s, before N15 starts).
- **1:42.4 VAB → the ruling control:** the control opens on VAB's 1.3× framing and lines up exactly. It then eases in to the panel (1.5× by 1:44.2, then the old creep to 1.58×), the crop rising to y 680 over the same 1.8 s.
- Left as they were: 0:56.4 (VPY's 2× close-up on the panel → the same case's evidence at 1.1×) is a deliberate reframe of one case, not a case change. 0:24.6 already shares one framing, and the other dissolves join different pages or scenes.

## Render (10/27, done 03:49 KST, capture 10 min 12 s)

`s4/video/final.mp4` (replaces the #542 final), sha256 afec30d3e5f855346ee7892cdf43497afcfa08d68fbd329d3b34136aa84d55db, 54.9 MB, and `final-contact-sheet.png`; `final.srt`/`final.vtt` are unchanged. A copy is at `board/narration/final.mp4` (same sha256). Rendered on win-guest.

- ffprobe: h264 High, yuv420p, 1920×1080, 30/1, 5055 frames, 168.5 s, 2.60 Mb/s, AAC LC. A full decode with `-xerror` logged 0 error lines; atoms ftyp moov free mdat.
- Sound: the AAC stream is bit-identical to the #542 final (same packet MD5), so every loudness, duck and cue number in `LISTEN.md` stands.
- Picture against the #542 final: 2,980 of 5,055 frames identical. The ones that changed on purpose are in 0:33.3–0:37.2 and 1:03.85–1:48.6. The other 610 changed only at the encoder level (PSNR 48 dB or more).
- Checks: before/after stills and a 50% blend at each changed dissolve (0.4 s before the cut and just after it). At 0:37.2, 1:22.4 and 1:42.4 the header, timeline and panel line up. Below the timeline the page shifts by one wrapped record line where the content differs. At 1:04.2 the zoom and left edge match, with the offsets above. I also checked the contact sheet, the 14 cut pairs and the vab cover at 1:22.45 and 1:28.
