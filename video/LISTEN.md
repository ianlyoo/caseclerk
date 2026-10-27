# Listen: the final cut

`s4/video/final.mp4`: rehearsal E as the owner approved it (#541), with the owner's notes on the sound (#542: the narration 15% quieter again, the cues louder and five more, the bed's dip under the voice made gradual), one zoom across the case-page dissolves (#543, picture only), and the narration 20% quieter again (#552). Every take is as in E, and N20's caption is the written line ("Anything bigger waits for a yes."). Mixed by `scripts/mix.py` (numbers from its `out/audio/loudness.json` and from the MP4 itself). The #543 final (03:51, the narration at 0.765×) is replaced; its picture is kept. #552 changes the voice stem only: the bed, the cues, the duck's timing, the picture and the captions are as they were.

## Loudness and peaks

| Measured on | Final cut (0.612×) | #542/#543 final (0.765×) | Rehearsal E |
|---|---|---|---|
| The MP4's AAC track (what viewers get) | −18.6 LUFS, −2.5 dBTP, LRA 6.1 LU | −16.5 LUFS, −2.0 dBTP, LRA 6.4 LU | −14.2 LUFS, −1.7 dBTP, LRA 6.5 LU |
| `mix.wav`, before the AAC encode | −18.5 LUFS, −2.4 dBTP, LRA 6.1 LU | −16.4 LUFS, −2.0 dBTP, LRA 6.4 LU | −14.1 LUFS, −1.5 dBTP, LRA 6.5 LU |
| Voice stem | −18.8 LUFS, LRA 5.4 LU | −16.8 LUFS, LRA 5.4 LU | −14.5 LUFS, LRA 5.4 LU |
| Bed stem, ducked | −34.6 LUFS, −16.9 dBTP | the same | −32.3 LUFS, −13.7 dBTP |
| Cues stem | −26.6 LUFS, −3.3 dBTP | the same | −29.1 LUFS, −6.3 dBTP |

- **The narration:** the voice stem is scaled by 0.612 (`audio.voiceTrim`: 0.9 after E, then 0.85 more, then 0.8 more in #552, −1.94 dB; −4.27 dB from E) over the whole film, after the voice chain. The master gain stays pinned at E's +0.8 dB (`audio.masterGainDb`), so nothing pulls the voice back up: the film lands about 4.4 dB under E and 2.1 dB under #542, as intended. In the pauses (more than 0.5 s from a sentence) the new mix is sample-for-sample #542's; under speech the difference is 14.1 dB under #542's mix, as a 0.8× voice predicts (14.0).
- **True peak:** −2.5 dBTP on the MP4, inside the −1 dBTP ceiling.
- **Voice chain** (light, as in D and E): high-pass 80 Hz; −3 dB at 150 Hz (the take is boomy around 125 Hz); +1.5 dB at 2.8 kHz; −2 dB shelf from 8 kHz and a de-esser; 2.5:1 compression with a soft knee, about 3 dB of gain reduction on average. No de-clip: neither the take nor the retakes have clipped runs.
- **Bed under the voice:** 16.4 dB under the voice while the owner speaks (RMS over the spoken spans; #542 18.3 dB, E 20.1 dB). #552 asked for the narration only, so the bed is as it was (`audio.bedLufs` −27) and sits 1.9 dB closer to the quieter voice; in the pauses it is exactly as before.
- **The bed's dip, made gradual** (the owner found E's abrupt): it now goes down over 0.8 s before a sentence (E: 0.35 s) and comes back up over 2 s after it (E: 1.0 s), on a raised-cosine curve with the corners rounded. It holds through pauses under 1.5 s as before. In a pause between 1.5 and 3 s it now rises only part of the way (E: all 10 dB in every one). Its fastest change is 19 dB a second (E: 45). Per pause:

| Pause | Length | Bed rises (E) | Bed rises now |
|---|---|---|---|
| 0:07.8–0:09.7 (the title's brand) | 1.9 s | 14 dB (with the lift) | 2.4 dB |
| 0:12.4–0:14.0 | 1.6 s | 10 dB | 0.1 dB |
| 1:17.5–1:19.4 (before the 200) | 1.9 s | 10 dB | 1.4 dB |
| 1:25.5–1:27.6 | 2.1 s | 10 dB | 3.1 dB |
| 1:33.4–1:35.6 | 2.3 s | 10 dB | 5.0 dB |
| 1:52.0–1:54.4, 2:05.2–2:07.5 | 2.4 s, 2.3 s | 10 dB | 6.2 dB, 5.7 dB |
| 0:42.5–0:45.0, 2:17.4–2:19.9 | 2.5 s | 10 dB | 7.2 dB |
| 2:10.8–2:12.4 | 1.6 s | 10 dB | 0.1 dB |
| The seven pauses of 2.85 s and longer | 2.85–6.1 s | 10 dB | 9.6–10 dB |

  Under every sentence the bed is fully down, as before (checked at each sentence's start, middle and end). The title's lift (+4 dB) and the end card's (+5 dB) still act in the pauses only; with the duck held, the title's is now mostly folded under it.
- **Master:** +0.8 dB of gain (pinned), then a limiter with 3 ms look-ahead at −2 dBFS. With the voice lower again it no longer acts: no 10 ms block reaches its level (#542: 4 of 16,850, the most 0.82 dB; E: 2.7% of blocks, the most 3.1 dB).
- **Small speaker** (mono, nothing under 300 Hz or over 7 kHz, a 1.5 kHz bump): −23.3 LUFS, LRA 6.5 LU (#542: −21.2 LUFS, 6.6 LU; E: −19.0). Its peaks reach about 0 dBFS: the simulation's 1.5 kHz bump on the louder cues; the file itself peaks at −2.5.
- **Earbuds** (lows +5 dB, +4 dB at 3 kHz, air +2 dB): −16.7 LUFS, LRA 6.2 LU (#542: −14.6 LUFS, 6.5 LU; E: −12.3), so speech and pauses keep the same balance as on the file. Its peaks reach −1.2 dBFS from the simulation's boosts; the file itself peaks at −2.5.
- **Mono fold-down:** left/right correlation averages +0.42 and is below zero in 17% of 100 ms frames (#542: +0.45, 17%; E: +0.46, 17%). The voice and cues are identical in both channels; the bed's room is wide by design and unchanged from D.
- **Re-transcribed** (Parakeet, locally): 32 of the captions' 295 words come out differently from the final mix (10.8%; #542: 28) and 34 (11.5%; #542: 34) from the small-speaker simulation. They are much the same words as before: names (PayPal as "Papal", CaseClerk as "Case cleric", Claude as "Clawed") and single-word endings. The four new ones from the mix are small words ("and" as "in" in N02, the "A" before "Claude agent", the "to" in "to undo") and N22a's "Claude", which drops out ("…Haiku sorts the case"). Every amount comes out right from the mix. The small-speaker simulation hears N15's "$388.18" as "$380.18", as before.

Spectrogram and waveform views of the MP4's sound are on win-guest in `tmp/qa-i/` (`f-spectrum.png`, `f-wave.png`, `small-spectrum.png`); I looked at them. I can't hear the file, so these views, the meters, the null test and the transcriptions are what I checked by. Speech and pauses alternate as before; the cues stand about 1.9 dB further out of the quieter voice. The bed's duck curve is #542's (the bed stem measures the same). The picture is the #543 final's: 4,609 of 5,055 frames are identical, and the rest differ only by encoder noise (PSNR 51.3 dB or more).

## The cues

Eleven, every one on something that happens on screen, all Kenney CC0 recordings (`audio/cues.json` has the files, hashes and licence; `CREDITS.md`). Every cue is 3 dB louder than in E, and five are new (sfx-12 to 16). The new clicks use `mouse.wav`, a whole mouse click: Kenney's press (`mouseclick1.ogg`) and release (`mouserelease1.ogg`), about 70 ms apart. The two clicks that fall between words keep the press alone (`click-a`), so nothing lands on the next word.

| Cue | At | Sound | On screen | Against the voice |
|---|---|---|---|---|
| sfx-01 | 0:18.23 | click (press) | The cursor clicks Open a test dispute | In the 50 ms gap between "click" and "opens"; 5 dB under the voice's level (#542: 7; E: 13) |
| sfx-02 | 0:24.68 | tick | The +3 min plate lands | In the pause |
| sfx-12 (new) | 0:36.82 | page flip | The page changes to the $412.00 case (dissolve 0:36.85–0:37.2) | In the pause |
| sfx-13 (new) | 0:43.77 | click (press and release) | The cursor clicks Asked you, 98 s after it arrived | In the pause |
| sfx-14 (new) | 1:04.26 | click (press and release) | The cursor clicks File the evidence | In the pause, 0.4 s before "The seller decides" |
| sfx-06 | 1:06.53 | click (press) | The cursor clicks Yes, file it | In the 30 ms gap between "A yes" and "files"; 5 dB under the voice's level (#542: 7; E: 13) |
| sfx-07 | 1:19.23 | pop | PayPal's 200 settles | In the pause |
| sfx-15 (new) | 1:33.92 | click (press and release) | The cursor clicks You said yes. Filed | In the pause, 0.6 s after "kept" |
| sfx-16 (new) | 1:48.22 | page flip | The page changes to Your rules (dissolve 1:48.25–1:48.6) | In the pause |
| sfx-10 | 2:06.95 | page turn | The diagram comes in | In the pause |
| sfx-11 | 2:40.80 | book down | The end card's mark lands | In the pause |

Three clicks in the footage stay silent: Chargeback in (0:38.9), which lands on "$412.00"; Closed for you (1:28.1), on "ruled for"; and the exact-text toggle (1:02.2), which the shot crops out. No typing is shown anywhere, so there is no typing sound.

## Five places to listen

1. **0:07.8–0:14.0, the title.** The two short pauses after "…rules for the buyer." and "…small PayPal sellers." In E the bed jumped 14 dB and 10 dB there; now it lifts about 2 dB and stays put.
2. **0:36.8–0:45.0, into the $412.00 case.** The page flip on the dissolve, then the click on Asked you (0:43.8) in the pause after "…isn't as described."
3. **1:04.2–1:14.6, the yes.** The click on File the evidence (1:04.3), then the click on Yes, file it, between "A yes" and "files" (1:06.5). Then comes the six-second pause: the bed rises over 2 s and dips again over 0.8 s before "CaseClerk files through…".
4. **1:33.4–1:35.6, VAB.** The click on You said yes. Filed (1:33.9), and the bed rising about 5 dB in the pause instead of 10.
5. **1:46.3–1:49.1, into the rules.** The page flip on the dissolve (1:48.2), in the pause before "The seller's limits…".

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

The cut times and lengths are unchanged from D. Every cut is a short dissolve. A dissolve into footage ends on the cut; a dissolve into the diagram or the end card starts on the cut, over the held footage. Either way the narration and the cut times don't move.

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

Four dissolves between two case pages hold one zoom (the owner, #543: at 0:36 the same page seemed to zoom out as it faded):
- **0:37.2** RSL → VPY: RSL takes VPY's opening framing, 1.25× (it was 1.3×). The two pages line up exactly.
- **1:04.2** VPY evidence → the approval: the approval drops from 1.15× to 1.1×, the evidence shot's zoom, with the same crop line. The two takes were recorded at different scroll positions, so the panel moves 35 px and the page under it 167 px. No framing lines up both, because the panel stays put when the page scrolls.
- **1:22.4** the approval → VAB: VAB opens on the approval's framing, 1.1× with the headline covered, and lines up exactly. After N14 (1:25.8, over 1.6 s) it pushes in to its old 1.3× framing.
- **1:42.4** VAB → the ruling control: the control opens on VAB's 1.3× framing and lines up exactly. It then eases in to the panel (1.5× by 1:44.2, then 1.58×), with the crop rising to y 680 over the same 1.8 s.

0:56.4 (VPY's 2× close-up on the panel → the same case scrolled to its evidence, 1.1×) is a deliberate reframe of one case, so it stays as it was. The other dissolves join different pages or scenes, or (0:24.6) shots that already share a framing.

## VPY

- **B4** plays D2's take of the real approval of PP-R-VPY-10194485 (production, 10/26 15:47 UTC): Yes, file it, the undo, Sending, then "200 accepted" with debug id f411956448116. N13b starts at 1:19.4, on the 200 (it arrives at 1:18.2 and settles at 1:19.2).
- **B5J** plays the same take's filed panel with the sandbox ruling control (Ask PayPal's sandbox to rule; never clicked).
- **B5 stays on VAB.** VPY has since been ruled on (PayPal for the seller, $400.84 kept of $412.00; `vpy-resolved.png`); N15 now says VAB's amount in full, $388.18, as B5 shows it.

## Credits

The narration is the owner's: one take and ten re-recorded rows. The music bed is our own work, synthesized in code by `scripts/mix.py` on 2026-10-27: no samples, recordings or models, so no licence, attribution or Content ID applies. The eleven cues play seven Kenney CC0 1.0 sounds (UI Audio, Interface Sounds, RPG Audio). Sources, hashes and licence URLs are in `audio/cues.json` and `CREDITS.md`.
