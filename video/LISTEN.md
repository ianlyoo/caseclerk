# Listen: the final cut

`s4/video/final.mp4`: rehearsal E as the owner approved it (#541), with the narration 10% quieter. Every take is as in E; the only other change is N20's caption, back to "Anything bigger waits for a yes." (the owner hears the "a"). Mixed by `scripts/mix.py` (numbers from its `out/audio/loudness.json` and from the MP4 itself).

## Loudness and peaks

| Measured on | Final | Rehearsal E |
|---|---|---|
| The MP4's AAC track (what viewers get) | −15.3 LUFS, −1.8 dBTP, LRA 6.4 LU | −14.2 LUFS, −1.7 dBTP, LRA 6.5 LU |
| `mix.wav`, before the AAC encode | −15.2 LUFS, −1.6 dBTP, LRA 6.3 LU | −14.1 LUFS, −1.5 dBTP, LRA 6.5 LU |
| Voice stem | −15.4 LUFS, LRA 5.4 LU | −14.5 LUFS, LRA 5.4 LU |
| Bed stem, ducked | −32.3 LUFS, −13.7 dBTP | the same |
| Cues stem | −29.1 LUFS, −6.3 dBTP | the same |

- **The owner's change:** the voice stem is scaled by 0.9 (−0.92 dB, `audio.voiceTrim`) over the whole film, after the voice chain. The bed and the cues are untouched, and the master gain is pinned at E's +0.8 dB (`audio.masterGainDb`) instead of being worked out to −14 LUFS, so nothing pulls the voice back up: the film lands about 1 dB under E, as intended. A null test against E's mix shows it: in every pause (bed and cues only) the two mixes are bit-identical, and under speech the difference sits 20.5 dB under the mix: the tenth of the voice that was taken out.
- **True peak:** −1.8 dBTP on the MP4, inside the −1 dBTP ceiling.
- **Voice chain** (light, as in D and E): high-pass 80 Hz; −3 dB at 150 Hz (the take is boomy around 125 Hz); +1.5 dB at 2.8 kHz; −2 dB shelf from 8 kHz and a de-esser; 2.5:1 compression with a soft knee, about 3 dB of gain reduction on average. No de-clip: neither the take nor the retakes have clipped runs.
- **Bed under the voice:** while the owner speaks the bed now sits 19.2 dB under the voice (E: 20.1 dB; RMS over the spoken spans); in the pauses it comes up 10 dB, over 1 s. The lifts (+4 dB around the title's brand, 0:07.6–0:10.4; +5 dB on the end card) act in the pauses only, and the fade-out starts after the last word, over the last 2 s (2:46.4–2:48.4).
- **Master:** +0.8 dB of gain (pinned), then a limiter with 3 ms look-ahead at −2 dBFS. With the voice lower the limiter works less: the gained mix goes over its level in 0.7% of 10 ms blocks (E: 2.7%), 86% of those by under 1 dB, the most 2.2 dB (E: 3.1 dB).
- **Small speaker** (mono, nothing under 300 Hz or over 7 kHz, a 1.5 kHz bump): −19.9 LUFS, −0.7 dBTP (the bump's), LRA 6.6 LU (E: −19.0 LUFS, 6.6 LU).
- **Earbuds** (lows +5 dB, +4 dB at 3 kHz, air +2 dB): −13.4 LUFS, +0.1 dBTP (from the simulation's boosts; the file itself peaks at −1.8), LRA 6.4 LU (E: −12.3 LUFS, 6.5 LU), so speech and pauses keep the same balance as on the file.
- **Mono fold-down:** left/right correlation averages +0.45 and is below zero in 17% of 100 ms frames (E: +0.46, 17%). The voice and cues are identical in both channels; the bed's room is wide by design and unchanged from D (folded to mono it loses 2.9 dB, median over 100 ms windows).
- **Re-transcribed** (Parakeet, locally): 30 of the captions' 295 words come out differently from the final mix (10.2%; E's mix, against the same captions: 28, 9.5%) and 34 (11.5%; E: 31, 10.5%) from the small-speaker simulation. Most are names (PayPal as "Papal", CaseClerk as "Case cleric", Claude as "Clawed") and single-word endings. Every amount comes out right from the mix; the small-speaker simulation once hears N15's "$388.18" as "$380.18", which it got right in E, so the quieter voice costs a little there. N10 "filing", N17 "rule on" and N20 "for a yes" come out as written from the mix.

Spectrogram and waveform views of the MP4's sound are on win-guest in `tmp/qa-f/` (`f-spectrum.png`, `f-wave.png`, `small-spectrum.png`); I looked at them. I can't hear the file, so these views, the meters, the null test and the transcriptions are what I checked by; the owner listened to E. Speech and pauses alternate as in E, the bed stays under about 2.7 kHz with nothing above it in the pauses, and the bed's fade closes the file.

## Five places to listen

1. **0:51–1:01.5, N10 and N11 (retakes).** "It still recommends filing…" (sped up 4% to end before N11) and "Over the $250 line, it stops and asks…". Listen for "filing" and for the join from take 1's N09b into the retake and back to take 1 at N12a (1:04.8).
2. **1:27.6–1:33.4, N15 (retake).** "It ruled for the seller and released the hold: $388.18 kept." The amount now matches VAB's on screen. The owner finds it clear (#541).
3. **1:42.8–1:46.3 and 2:02.6–2:05.2, N17 and N20 (retakes).** "rule on your own test case", and "Anything bigger waits for a yes" (the owner hears the "a"; below).
4. **2:19.9–2:32.8, N23 and N24 (retakes).** "…against those limits before reaching PayPal, and AI spend is capped." and "…this whole loop, every answer kept." (sped up 3.3% to end on the cut to the landing at 2:32.8). The owner finds it clear.
5. **2:33.3–2:48.5, the close.** N25 (retake), then the end card: the mark lands with a soft book-down sound (2:40.8), "CaseClerk." at 2:41.2, "It answers your PayPal disputes, within the limits you set." at 2:42.4, the bed's lift around them and its fade after the last word.

## The retakes, reviewed

Ten files from rehearsal E, one sentence each, the same phone as the take: AAC 48 kHz, dual mono, gated to digital silence, 2.7–8.8 s. None clips (the longest full-scale run is 7 samples; the take's are up to 10). Each was transcribed locally (Parakeet) on its own and again in the mixed voice stem, and checked against its row.

Against take 1 the retakes were quieter and brighter: about 1.5 dB more at 2–4 kHz and 1 dB less under 250 Hz. `audio.retakeEq` (low shelf +1.5 dB at 160 Hz, −2 dB at 2.5 kHz, high shelf −0.5 dB at 7 kHz), set on N15, N23 and N25, brings both batches within 0.6 dB an octave of the same sentences in take 1 on average; each retake's gain (+0.7 to +3.9 dB) then sets it to take 1's loudness. In the voice stem the ten rows measure −14.1 to −14.7 LUFS, inside take 1's own rows (−14.9 to −13.3, median −14.2), and every one starts within 17 ms of its row.

| Row | Placed at | Verdict |
|---|---|---|
| N10 | 0:51.2–0:55.7, 4% faster | Says "filing", in every transcription. Fixed. |
| N11 | 0:56.0–1:01.3 | As written ("$250" heard as "250"). |
| N15 | 1:27.6–1:33.4 | "$388.18 kept" in full now, matching VAB. Worth a listen: "the seller" comes out as "a seller" in three of seven transcriptions and "the hold" as "a hold" in all seven ("the" run into "released", /d/ then /ð/, sounds much like "a"; in take 1 the transcriber heard "the hold"). Captioned as written; the owner finds it clear (#541). |
| N17 | 1:42.8–1:46.3 | Says "rule on", in every transcription. Fixed. |
| N20 | 2:02.6–2:05.2 | As written. The owner hears "waits for a yes" (#541), so the caption is back to the line. The transcriber mostly missed it (seven of eight transcriptions in rehearsal E heard "for yes"), and E's caption followed it. |
| N23 | 2:19.9–2:26.1 | As written ("those limits", "before reaching"); "An AI spend" for "and AI spend" in some transcriptions is the run-in "and". |
| N24 | 2:27.3–2:32.8, 3.3% faster | As written ("every answer kept", no "is"). Not a misread: on its own the sentence is heard as "every answer kept" at every stage (as recorded, sped up, cut, after the chain). Only whole-film transcriptions hear "caps" or "capped", likely primed by N23's "capped" just before; the final "t" is released with a long, strong burst. The owner finds it clear. |
| N25 | 2:33.3–2:39.8 | As written (no extra "every"). |
| N26a | 2:41.2–2:42.0 | As written ("CaseClerk" comes out as "Case Clerk"). |
| N26b | 2:42.4–2:46.3 | As written ("PayPal" comes out as "papal", as it often does for take 1 too). Placed 0.45 s after N26a. |

Kept from take 1 and captioned as spoken, as in D: N06 "checks the signature", N22b "works with tools". Every re-recorded row is captioned as written. The owner listened to rehearsal E and found the rest clear as well (#541).

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
