#!/bin/bash
# Normalise takes for HyperFrames: 1920x1080, 30 fps CFR, H.264 yuv420p, GOP 30, no audio.
set -eu
cd ~/g251/video
F=ffmpeg-static/bin/ffmpeg
OUT=hf/assets/footage
# footage/raw/vpy.webm here is the cut-A waiting take (s4's vpy-b3-waiting.webm, sha256 77464e76...);
# footage/raw/vpy-approve.webm is D2's phase B approval take (s4's vpy.webm, sha256 79697fc8...).
for t in arrival rsl inbox vpy vpy-approve vab rules cases landing; do
  $F -v error -y -i footage/raw/$t.webm -vf "fps=30,format=yuv420p" -c:v libx264 -preset medium -crf 14 -g 30 -keyint_min 30 -sc_threshold 0 -an -movflags +faststart $OUT/$t.mp4
  echo "done $t"
done
