# CaseClerk demo film: how this folder works

A HyperFrames 0.8.201 project, 1920×1080, 30 fps, CSS and 2D only. The cut lives in `edit.json`; `docs/submission/video-script.md` mirrors it for people.

| Path | What it is |
|---|---|
| `edit.json` | The cut: sources, beats, shots, camera keys, crop windows, lines (N01–N26), caption breaks, overlays, sound cues. |
| `scripts/build.py` | Checks the cut (tiling, source ranges, camera bounds, ≤2.4 spoken words a second, gaps), then writes `index.html`, `compositions/captions.html` and `compositions/overlays.html`, filling `{count}` from `live/real-cases.json`. `--check` only checks; `--md` prints the script's tables. |
| `scripts/count_cases.py` | Reads the case ids in `docs/REAL-CASES.md`, GETs each from production (read-only) and writes `live/real-cases.json`: the cases that were filed by CaseClerk, resolved by PayPal and kept money from PayPal's own fund movements. |
| `live/real-cases.json` | The count the B7 cases shot shows (N24 itself says no number), with the time it was read and every case left out and why. |
| `index.html` | Generated. The footage clips in an untimed `#cam` wrapper moved by the root timeline, inside `#camwin`, which crops the footage to a shot's window; then the scene hosts, overlays, captions, sounds. |
| `compositions/title.html`, `arch.html`, `end.html`, `judge.html` | Hand-made scenes: the B1 title card, the B7 diagram, the end card, the B5J phase B slot. |
| `audio/cues.json` | Every sound cue with its CC0 source, the pack's zip hash and the wav's hash. |
| `assets/fonts/` | Archivo (OFL, licence alongside). |
| `assets/sfx/` | Four Kenney CC0 sounds, 48 kHz mono, peak −3 dBFS. |
| `assets/footage/` | Not in git. The normalised H.264 30 fps takes from `capture/normalize.sh`. |
| `capture/` | `rec.cjs` (Playwright takes against production with the guards), `normalize.sh`, `strip.sh` and `quad.sh` (frame sheets for checking). |
| `footage.md` | What each take shows, when it was captured, and the sync offsets. |

## Build, check, render (on win-guest)

```
python3 -I video/scripts/count_cases.py   # right before a render: the on-screen count is read live
python3 -I video/scripts/build.py
rsync -a --exclude capture --exclude out video/ win-guest-wsl:g251/video/hf/
ssh win-guest-wsl '~/g251/vscan/run-hf.sh check hf'
ssh win-guest-wsl 'cd ~/g251/video && ~/g251/vscan/run-hf.sh render hf --workers 1 --fps 30 --quality looks --no-browser-gpu --video-frame-format png --output out/NAME.raw.mp4'
ssh win-guest-wsl 'cd ~/g251/video && ffmpeg-static/bin/ffmpeg -i out/NAME.raw.mp4 -c copy -movflags +faststart out/NAME.mp4'
```

## Rules the build holds

- Never tween a `.clip` itself: animate a child. Footage moves only through `#cam`, and is cropped only through `#camwin`.
- No caption, title or text of ours names a camera brand or a carrier. Where a take's headline names one, the shot crops it with a window, and the crop never paints over UI text.
- Captions sit 112 px above the bottom edge, and each shot's camera keeps the part of the page being talked about above them.
- Only verified numbers appear (see the facts table in the script).
- Orange is used only for the ▼ index. There is no gradient text, no glow, no emoji and no music.
