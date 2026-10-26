# Listen: rehearsal D

`s4/video/rehearsal-d.mp4`: the owner's narration, the synthesized bed, six CC0 cues, dissolves at every cut, and the real VPY approval in B4 and B5J. Mixed by `scripts/mix.py` (numbers from its `out/audio/loudness.json` and from the MP4 itself).

## Loudness and peaks

| Measured on | Integrated | True peak | LRA |
|---|---|---|---|
| The MP4's AAC track (what viewers get) | −14.3 LUFS | −1.5 dBTP | 8.7 LU |
| `mix.wav`, before the AAC encode | −14.2 LUFS | −1.6 dBTP | 8.7 LU |
| Voice stem | −14.5 LUFS | | 6.1 LU |
| Bed stem, ducked | −30.8 LUFS | −13.2 dBTP | |
| Cues stem | −29.1 LUFS | −6.3 dBTP | |

Target: about −14 LUFS integrated, true peak at or under −1 dBTP.

- **Voice chain** (light): high-pass 80 Hz; −3 dB at 150 Hz (the take is boomy around 125 Hz); +1.5 dB at 2.8 kHz; −2 dB shelf from 8 kHz and a de-esser (the take is bright and sibilant above 4.5 kHz); 2.5:1 compression with a soft knee, about 3 dB of gain reduction on average. No de-clip: the raw take has no clipped runs (its +1.2 dBTP was inter-sample overs, gone after the chain).
- **Bed under the voice:** while the owner speaks the bed sits 20.2 dB under the voice (RMS over the spoken spans); in the pauses it comes up 10 dB, over 1 s. It is lifted 4 dB around the title's brand (0:08–0:10) and 5 dB on the end card, then fades out over the last 3.6 s.
- **Master:** +1.2 dB of gain, then a limiter with 3 ms look-ahead at −2 dBFS. It touches 4% of 10 ms blocks, three quarters of those by under 1 dB; the most is 3.2 dB, on a few sentence onsets.
- **Small speaker** (mono, nothing under 300 Hz or over 7 kHz, a 1.5 kHz bump): −18.7 LUFS, −0.7 dBTP (the bump's), LRA 11.6 LU. The range widens because most of the bed's energy is under 300 Hz, so the pauses drop further than the speech; the bed's upper partials (300 Hz–1.7 kHz) still show in its spectrogram, and the voice transcribes as well as the bare voice stem (below).
- **Earbuds** (lows +5 dB, +4 dB at 3 kHz, air +2 dB): −12.4 LUFS, +0.4 dBTP (from the simulation's boosts; the file itself peaks at −1.5), LRA 8.8 LU, so speech and pauses keep the same balance as on the file.
- **Mono fold-down:** left/right correlation averages +0.43 and is below zero in 19% of 100 ms frames. The voice and cues are identical in both channels, so those frames are the bed's room, which is wide by design; folded to mono the bed loses 2.9 dB (median over 100 ms windows), 5.9 dB at worst, with no holes.
- **Re-transcribed** (Parakeet, locally): 11 of the take's 287 words come out differently from the final mix (3.8%), 7 from the voice stem after the chain, 10 from the raw voice cut before it, and 7 (2.4%) from the small-speaker simulation. The differences are single words, mostly endings (refunds → refund, disputes → dispute) and two misses (days → stays, chargebacks → "tries backs"); no amount differs. The chain doesn't cost intelligibility.

Spectrogram and waveform views of the MP4's sound and of the small-speaker simulation are on win-guest in `tmp/qa-d/` (`d-spectrum.png`, `d-wave.png`, `small-spectrum.png`); I looked at all three. Speech and pauses alternate cleanly, the bed stays under about 2.7 kHz with nothing above it in the pauses, the landing cue on the end card is one thin stroke, and the end card's lift and fade close the file.

## Five places to listen

1. **0:00–0:14, the open.** The first sentence at 0:00.4, the bed already under it; the bed's swell in the pause before the wordmark (0:08–0:09.5); the dissolve into the cases page at 0:13.2–0:13.6.
2. **1:04–1:20, the seller's yes.** "The seller decides. A yes files it…": the click on Yes, file it at 1:06.5 lands between "A yes" and "files". The bed rises through the undo and Sending (1:09–1:14), then the soft pop as PayPal's 200 settles (1:19.2), just before "PayPal returns success…" (1:19.4).
3. **1:54–2:08, the rules.** The take's densest sibilants ("Evidence under $250 and refunds up to $15 go out on their own"), then the page turn as the diagram comes in (2:06.95), in the pause before "Under the hood".
4. **2:19.9–2:25, N23.** One of the rows to re-record (below): listen for "before it reaching".
5. **2:33–2:48.5, the close.** N25, then the end card: the mark lands with a soft book-down sound (2:40.8), the bed lifts and resolves to D, and fades out. N26a and N26b belong here and are not in the take yet.

## The take, reviewed

One take, 168.4 s, AAC 48 kHz, dual mono, gated to digital silence between phrases. Transcribed locally (Parakeet, word timestamps) twice, and diffed against the 32 sentence rows.

**Verdict: usable, with five rows to re-record.** Rehearsal D is built on this take as it is.

| Row | Why | The exact sentence to read |
|---|---|---|
| N26a | Missing from the take. | CaseClerk. |
| N26b | Missing from the take. | It answers your PayPal disputes, within the limits you set. |
| N25 | An extra "every": "with every evidence ready". | For a one-person shop, every dispute gets an answer with evidence ready, not a loss by default. |
| N23 | "before it reaching", and "the limits" for "those limits" (one transcription also heard "kept" for "capped"). | Every action is checked against those limits before reaching PayPal, and AI spend is capped. |
| N15 | The amount is said "three hundred eighty-eight dollars", without the cents; "a seller" for "the seller". | It ruled for the seller and released the hold: $388.18 kept. |

Worth a listen, not a re-record: N01a ("files" was once heard as "feels"; "The" for "A"), N13a ("through"), N18 ("prompt"), N24 ("loop"). Kept as spoken, and captioned that way: N06 "checks the signature", N17 "rule for your own test case", N22b "works with tools" (no "it"), N24 "every answer is kept". Captions are clean verbatim: N23's stray "it" is left out.

- **Clipping and distortion:** none measured. The raw take peaks at +1.2 dBTP from inter-sample overs; there are no flat-topped runs.
- **Noise:** none; the recorder gated every pause to digital silence (the bed fills them).
- **Timing:** the take runs a steady 1.4–2.0 s behind rehearsal C's rows. After moving each sentence to its row (time shifts only, no stretch), every sentence fits its slot; N24 runs 0.22 s past its planned length, still inside its slot.

## Cuts that became dissolves

Every cut in rehearsal C was hard; all fourteen are now short dissolves. A dissolve into footage ends on the cut; a dissolve into the diagram or the end card starts on the cut, over the held footage. Either way the narration and the cut times don't move.

| Cut | From → to | Dissolve |
|---|---|---|
| 0:13.6 | title → cases page (arrival) | 0.4 s |
| 0:21.6 | cases page → wait plate | 0.3 s |
| 0:24.6 | wait plate → webhook rows | 0.3 s |
| 0:33.6 | webhook → RSL asked you | 0.3 s |
| 0:37.2 | RSL → VPY | 0.35 s |
| 0:56.4 | VPY → VPY evidence | 0.3 s |
| 1:04.2 | VPY evidence → the approval | 0.35 s |
| 1:22.4 | the approval → VAB | 0.35 s |
| 1:42.4 | VAB → the sandbox ruling control | 0.35 s |
| 1:48.6 | ruling control → rules | 0.35 s |
| 2:07.0 | rules → diagram | 0.35 s |
| 2:28.0 | diagram → cases | 0.35 s |
| 2:32.8 | cases → landing | 0.35 s |
| 2:40.4 | landing → end card | 0.4 s |

## VPY

- **B4** plays D2's take of the real approval of PP-R-VPY-10194485 (production, 10/26 15:47 UTC): Yes, file it, the undo, Sending, then "200 accepted" with debug id f411956448116. N13b starts at 1:19.4, on the 200 (it arrives at 1:18.2 and settles at 1:19.2).
- **B5J** plays the same take's filed panel with the sandbox ruling control (Ask PayPal's sandbox to rule; never clicked).
- **B5 stays on VAB.** VPY has since been ruled on (PayPal for the seller, $400.84 kept of $412.00; `vpy-resolved.png`), but N15 as spoken names VAB's amount ("$388 kept"), so the resolved beat keeps showing VAB.

## Credits

The narration is the owner's. The music bed is our own work, synthesized in code by `scripts/mix.py` on 2026-10-27: no samples, recordings or models, so no licence, attribution or Content ID applies. The six cues are Kenney CC0 1.0 sounds (UI Audio, Interface Sounds, RPG Audio). Sources, hashes and licence URLs are in `audio/cues.json` and `CREDITS.md`.
