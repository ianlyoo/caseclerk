# CaseClerk demo film: how this folder works

A HyperFrames 0.8.201 project, 1920×1080, 30 fps, CSS and 2D only. The cut lives in `edit.json`; `docs/submission/video-script.md` mirrors it for people.

| Path | What it is |
|---|---|
| `edit.json` | The cut: sources, beats, shots, camera keys, crop windows, covers, dissolves, lines (N01–N26, one row per sentence: a line of two sentences is two rows, N01a and N01b; each voiced row carries its `take` span in the narration, and a re-recorded row its retake's `source`, `sourceSha`, `gainDb` and, if it needed one, `tempo`), overlays, sound cues, and the `audio` block (mix file, retake EQ, ducking, lifts, loudness target; for the final cut a voice trim, 0.765, and a pinned master gain, E's +0.8 dB). |
| `scripts/build.py` | Checks the cut (tiling, source ranges, camera bounds, dissolves, covers, ≤2.4 spoken words a second on rows not yet voiced, a voiced row long enough for its take, gaps, one sentence per row), then writes `index.html`, `compositions/captions.html`, `compositions/overlays.html` and `captions.srt`/`captions.vtt` (the same sentence captions on the same clock), filling `{count}` from `live/real-cases.json`. `--check` only checks; `--md` prints the script's tables. |
| `scripts/retakes.py` | Splices re-recorded rows in: each `retake-<ID>.m4a` beside the take is row `<ID>`'s sentence. It transcribes it, trims it, levels it to take 1 (through `audio.retakeEq`), places it at its row (sped up at most 5% if it has to be, else it stops) and writes the row, printing the line beside what was heard. Rows whose file hasn't changed are left alone, so the next retakes drop in with one rerun. |
| `scripts/mix.py` | Builds the one sound track, `assets/audio/mix.wav`: each sentence cut from the owner's take (or the row's retake, through the retake EQ and its gain, and its tempo if it has one) at its row's `take` span and placed at the row's start, the light voice chain, the music bed it synthesizes (ducked under speech, slowly: down over 0.8 s, up over 2 s, held through short pauses; lifted at the title's brand and the end card in the pauses, faded after the last word), the cues; then gain to −14 LUFS (or the pinned `masterGainDb`, so a voice trim isn't normalized away) and a limiter under −1 dBTP. Stems and `loudness.json` go to `out/audio/`. |
| `scripts/count_cases.py` | Reads the case ids in `docs/REAL-CASES.md`, GETs each from production (read-only) and writes `live/real-cases.json`: the cases that were filed by CaseClerk, resolved by PayPal and kept money from PayPal's own fund movements. |
| `live/real-cases.json` | The count the B7 cases shot shows (N24 itself says no number), with the time it was read and every case left out and why. |
| `index.html` | Generated. Each footage shot in its own window (`#w-ID`, the crop and the dissolve) and camera (`#c-ID`, the move), stacked in cut order; then the scene hosts, overlays, captions and the one `<audio>` track, `mix.wav`, from 0. |
| `compositions/title.html`, `arch.html`, `end.html` | Hand-made scenes: the B1 title card, the B7 diagram, the end card. (`judge.html`, the B5J placeholder, is unused since rehearsal D: B5J plays the approval take.) |
| `audio/cues.json` | The narration's use, the music bed (own work, synthesized), and every sound cue with its CC0 source, the pack's zip hash and the wav's hash. |
| `CREDITS.md` | Every source in picture and sound, with its licence. |
| `LISTEN.md` | The latest rehearsal's loudness and peak numbers, where to listen, and the cuts that became dissolves. |
| `assets/fonts/` | Archivo (OFL, licence alongside). |
| `assets/sfx/` | Eight Kenney CC0 sounds, 48 kHz mono, peak −3 dBFS (seven cued; `click-b` is spare). |
| `assets/audio/` | Not in git. `mix.wav` from `scripts/mix.py` (it carries the owner's voice). |
| `assets/footage/` | Not in git. The normalised H.264 30 fps takes from `capture/normalize.sh`. |
| `capture/` | `rec.cjs` (Playwright takes against production with the guards), `normalize.sh`, `strip.sh` and `quad.sh` (frame sheets for checking). |
| `footage.md` | What each take shows, when it was captured, and the sync offsets. |

## Build, check, render (on win-guest)

```
python3 -I video/scripts/count_cases.py   # right before a render: the on-screen count is read live
python3 -I video/scripts/build.py
rsync -a --exclude capture --exclude out video/ win-guest-wsl:g251/video/hf/
# when retakes arrive: put them beside the take, splice, bring the rows back, rebuild and sync again
scp ../s4/video/narration/retake-*.m4a win-guest-wsl:g251/video/narration/
ssh win-guest-wsl 'cd ~/g251/video/hf && python3 -I scripts/retakes.py --take ~/g251/video/narration/caseclerk-owner-take1.m4a --ffmpeg ~/g251/video/ffmpeg-static/bin/ffmpeg --transcribe ~/g251/vscan/run-hf.sh'
scp win-guest-wsl:g251/video/hf/edit.json video/edit.json   # then build.py and rsync as above
ssh win-guest-wsl 'cd ~/g251/video/hf && python3 -I scripts/mix.py --take ~/g251/video/narration/caseclerk-owner-take1.m4a --ffmpeg ~/g251/video/ffmpeg-static/bin/ffmpeg'
ssh win-guest-wsl '~/g251/vscan/run-hf.sh check hf'
ssh win-guest-wsl 'cd ~/g251/video && ~/g251/vscan/run-hf.sh render hf --workers 1 --fps 30 --quality looks --no-browser-gpu --video-frame-format png --output out/NAME.raw.mp4'
ssh win-guest-wsl 'cd ~/g251/video && ffmpeg-static/bin/ffmpeg -i out/NAME.raw.mp4 -c copy -movflags +faststart out/NAME.mp4'
```

## Rules the build holds

- Never tween a `.clip` itself: animate a wrapper. Footage moves only through its `#c-ID` camera, and is cropped and dissolved only through its `#w-ID` window.
- A dissolve (0.25–0.5 s) belongs to the incoming shot and starts that long before its cut, so the outgoing footage plays on under it; the narration clock never moves for one.
- No caption, title or text of ours names a camera brand or a carrier. Where a take's headline names one, the shot crops it with a window or, in B4, covers it with a plate-coloured block; neither hides text a line is about.
- One caption per sentence; a sentence is never split across captions. Over 84 characters it is set on two balanced lines. Captions sit 112 px above the bottom edge, and each shot's camera keeps the part of the page being talked about above them.
- Only verified numbers appear (see the facts table in the script).
- Orange is used only for the ▼ index. There is no gradient text, no glow and no emoji.
- Captions are the words the owner spoke; a row's `script` keeps the written line where they differ.
- Sound: the only music is the bed `mix.py` synthesizes; cues are CC0, sparse, on real picture events, and never on a key spoken word.
