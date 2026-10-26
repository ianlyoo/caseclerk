# Listen: rehearsal E

`s4/video/rehearsal-e.mp4`: rehearsal D's picture and sound, with ten of the owner's sentences re-recorded (N10, N11, N15, N17, N20, N23, N24, N25, N26a, N26b). N26a and N26b are now spoken over the end card. Spliced by `scripts/retakes.py`, mixed by `scripts/mix.py` (numbers from its `out/audio/loudness.json` and from the MP4 itself).

## Loudness and peaks

| Measured on | Integrated | True peak | LRA |
|---|---|---|---|
| The MP4's AAC track (what viewers get) | −14.2 LUFS | −1.7 dBTP | 6.5 LU |
| `mix.wav`, before the AAC encode | −14.1 LUFS | −1.5 dBTP | 6.5 LU |
| Voice stem | −14.5 LUFS | | 5.4 LU |
| Bed stem, ducked | −32.3 LUFS | −13.7 dBTP | |
| Cues stem | −29.1 LUFS | −6.3 dBTP | |

Target: about −14 LUFS integrated, true peak at or under −1 dBTP. Rehearsal D measured −14.3 LUFS, −1.5 dBTP, LRA 8.7 LU on its MP4.

- **Voice chain** (light, as in D): high-pass 80 Hz; −3 dB at 150 Hz (the take is boomy around 125 Hz); +1.5 dB at 2.8 kHz; −2 dB shelf from 8 kHz and a de-esser; 2.5:1 compression with a soft knee, about 3 dB of gain reduction on average. No de-clip: neither the take nor the retakes have clipped runs.
- **Bed under the voice:** while the owner speaks the bed sits 20.1 dB under the voice (RMS over the spoken spans); in the pauses it comes up 10 dB, over 1 s. The lifts (+4 dB around the title's brand, 0:07.6–0:10.4; +5 dB on the end card) now act in the pauses only, so a lift never rises under a word; with N26a and N26b spoken on the card, its lift plays around them and the fade-out starts after the last word, over the last 2 s (2:46.4–2:48.4).
- **Master:** +0.8 dB of gain, then a limiter with 3 ms look-ahead at −2 dBFS. The gained mix goes over the limiter's level in 2.7% of 10 ms blocks (D: 4%), 77% of those by under 1 dB; the most is 3.1 dB, on take-1 sentence onsets.
- **Small speaker** (mono, nothing under 300 Hz or over 7 kHz, a 1.5 kHz bump): −19.0 LUFS, −0.7 dBTP (the bump's), LRA 6.6 LU. D's small-speaker range was 11.6 LU, widened by the end card's 7 s of bed alone, mostly under 300 Hz; with N26 spoken over the card that stretch is gone, and the bed's upper partials (300 Hz–1.7 kHz) still show in the spectrogram.
- **Earbuds** (lows +5 dB, +4 dB at 3 kHz, air +2 dB): −12.3 LUFS, +0.3 dBTP (from the simulation's boosts; the file itself peaks at −1.7), LRA 6.5 LU, so speech and pauses keep the same balance as on the file.
- **Mono fold-down:** left/right correlation averages +0.46 and is below zero in 17% of 100 ms frames (D: +0.43, 19%). The voice and cues are identical in both channels; the bed's room is wide by design and unchanged from D (folded to mono it loses 2.9 dB, median over 100 ms windows).
- **Re-transcribed** (Parakeet, locally): 29 of the captions' 294 words come out differently from the final mix (9.9%), 31 from the voice stem and 30 (10.2%) from the small-speaker simulation, so the bed and a small speaker cost nothing. Most are names (PayPal as "Papal" nine times, CaseClerk as "Case cleric", Claude as "Clawed") and single-word endings (proves → proofs, prompt → prompts); no amount differs. The retake rows are under "The retakes, reviewed" below. (D counted against the take's own words, so its 3.8% isn't the same measure.)

Spectrogram and waveform views of the MP4's sound and of the small-speaker simulation are on win-guest in `tmp/qa-e/` (`e-spectrum.png`, `e-wave.png`, `small-spectrum.png`); I looked at them. I can't hear the file, so these views, the meters and the transcriptions are what I checked by; the five places below are for an ear. Speech and pauses alternate cleanly, the bed stays under about 2.7 kHz with nothing above it in the pauses, the end card now carries speech to 2:46.3, and the bed's fade closes the file.

## Five places to listen

1. **0:51–1:01.5, N10 and N11 (retakes).** "It still recommends filing…" (sped up 4% to end before N11) and "Over the $250 line, it stops and asks…". Listen for "filing" and for the join from take 1's N09b into the retake and back to take 1 at N12a (1:04.8).
2. **1:27.6–1:33.4, N15 (retake).** "It ruled for the seller and released the hold: $388.18 kept." The amount now matches VAB's on screen. Listen for "the seller" and "the hold" (below).
3. **1:42.8–1:46.3 and 2:02.6–2:05.2, N17 and N20 (retakes).** "rule on your own test case", and "Anything bigger waits for yes": listen for the "a" before "yes" (below).
4. **2:19.9–2:32.8, N23 and N24 (retakes).** "…against those limits before reaching PayPal, and AI spend is capped." and "…this whole loop, every answer kept." (sped up 3.3% to end on the cut to the landing at 2:32.8). Listen for "kept".
5. **2:33.3–2:48.5, the close.** N25 (retake), then the end card: the mark lands with a soft book-down sound (2:40.8), "CaseClerk." at 2:41.2, "It answers your PayPal disputes, within the limits you set." at 2:42.4, the bed's lift around them and its fade after the last word.

## The retakes, reviewed

Ten files, one sentence each, the same phone as the take: AAC 48 kHz, dual mono, gated to digital silence, 2.7–8.8 s. None clips (the longest full-scale run is 7 samples; the take's are up to 10). Each was transcribed locally (Parakeet) on its own and again in the mixed voice stem, and checked against its row.

Against take 1 the retakes were quieter and brighter: about 1.5 dB more at 2–4 kHz and 1 dB less under 250 Hz. `audio.retakeEq` (low shelf +1.5 dB at 160 Hz, −2 dB at 2.5 kHz, high shelf −0.5 dB at 7 kHz), set on N15, N23 and N25, brings both batches within 0.6 dB an octave of the same sentences in take 1 on average; each retake's gain (+0.7 to +3.9 dB) then sets it to take 1's loudness. In the voice stem the ten rows measure −14.1 to −14.7 LUFS, inside take 1's own rows (−14.9 to −13.3, median −14.2), and every one starts within 17 ms of its row.

| Row | Placed at | Verdict |
|---|---|---|
| N10 | 0:51.2–0:55.7, 4% faster | Says "filing", in every transcription. Fixed. |
| N11 | 0:56.0–1:01.3 | As written ("$250" heard as "250"). |
| N15 | 1:27.6–1:33.4 | "$388.18 kept" in full now, matching VAB. Worth a listen: "the seller" comes out as "a seller" in three of seven transcriptions and "the hold" as "a hold" in all seven ("the" run into "released", /d/ then /ð/, sounds much like "a"; in take 1 the transcriber heard "the hold"). Captioned as written; a possible misread. |
| N17 | 1:42.8–1:46.3 | Says "rule on", in every transcription. Fixed. |
| N20 | 2:02.6–2:05.2 | **Still a miss:** "Anything bigger waits for yes", without the "a". Seven of eight transcriptions (on its own, slowed 20%, band-limited, after the chain, in the mix, on the small speaker) hear "for yes"; one, of the whole final mix, hears "for a yes", so if the "a" is there it is barely voiced. Take 1's N20 was heard as "for a yes" every time. Captioned as said; the written line stays in `edit.json` as `script`. |
| N23 | 2:19.9–2:26.1 | As written ("those limits", "before reaching"); "An AI spend" for "and AI spend" in some transcriptions is the run-in "and". |
| N24 | 2:27.3–2:32.8, 3.3% faster | As written ("every answer kept", no "is"). Not a misread: on its own the sentence is heard as "every answer kept" at every stage (as recorded, sped up, cut, after the chain). Only whole-film transcriptions hear "caps" or "capped", likely primed by N23's "capped" just before; the final "t" is released with a long, strong burst. Worth a listen all the same. |
| N25 | 2:33.3–2:39.8 | As written (no extra "every"). |
| N26a | 2:41.2–2:42.0 | As written ("CaseClerk" comes out as "Case Clerk"). |
| N26b | 2:42.4–2:46.3 | As written ("PayPal" comes out as "papal", as it often does for take 1 too). Placed 0.45 s after N26a. |

Kept from take 1 and captioned as spoken, as in D: N06 "checks the signature", N22b "works with tools". N17 and N24 no longer differ from the written lines; N15, N23 and N25 no longer do either.

To splice more retakes: put `retake-<ID>.m4a` beside the take and rerun `scripts/retakes.py` (`SPEC.md`), then `mix.py`. Rows whose file hasn't changed are left as they are.

## Cuts that became dissolves

Unchanged from D. Every cut is a short dissolve. A dissolve into footage ends on the cut; a dissolve into the diagram or the end card starts on the cut, over the held footage. Either way the narration and the cut times don't move.

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
- **B5 stays on VAB.** VPY has since been ruled on (PayPal for the seller, $400.84 kept of $412.00; `vpy-resolved.png`); N15 now says VAB's amount in full, $388.18, as B5 shows it.

## Credits

The narration is the owner's: one take and ten re-recorded rows. The music bed is our own work, synthesized in code by `scripts/mix.py` on 2026-10-27: no samples, recordings or models, so no licence, attribution or Content ID applies. The six cues are Kenney CC0 1.0 sounds (UI Audio, Interface Sounds, RPG Audio). Sources, hashes and licence URLs are in `audio/cues.json` and `CREDITS.md`.
