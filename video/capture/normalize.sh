#!/bin/bash
# Normalise takes for HyperFrames: 1920x1080, 30 fps CFR, H.264 yuv420p, GOP 30, no audio.
set -eu
cd ~/g251/video
F=ffmpeg-static/bin/ffmpeg
OUT=hf/assets/footage
for t in arrival rsl inbox vpy vab rules cases landing; do
  $F -v error -y -i footage/raw/$t.webm -vf "fps=30,format=yuv420p" -c:v libx264 -preset medium -crf 14 -g 30 -keyint_min 30 -sc_threshold 0 -an -movflags +faststart $OUT/$t.mp4
  echo "done $t"
done
$F -v error -y -i ~/g251/vscan/proof/assets/approve-1440.mp4 -vf "scale=1728:1080:flags=lanczos,pad=1920:1080:96:0:color=0xdde0e3,fps=30,format=yuv420p" -c:v libx264 -preset medium -crf 14 -g 30 -keyint_min 30 -sc_threshold 0 -an -movflags +faststart $OUT/standin-approve.mp4
echo "done standin"
