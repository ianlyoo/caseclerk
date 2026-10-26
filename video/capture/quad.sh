#!/bin/bash
# quad.sh FILE OUT T1 T2 T3 T4: four labelled frames (960 wide) in a 2x2 sheet.
set -eu
F=${FFMPEG:-$HOME/g251/video/ffmpeg-static/bin/ffmpeg}
file=$1 out=$2; shift 2
tmp=$(mktemp -d "${TMPDIR:-/tmp}/quad.XXXXXX")
i=0
for t in "$@"; do
  "$F" -v error -y -ss "$t" -i "$file" -frames:v 1 \
    -vf "scale=960:-1,drawtext=text='$t':x=6:y=6:fontsize=26:fontcolor=red:box=1:boxcolor=white" "$tmp/$i.png"
  i=$((i+1))
done
"$F" -v error -y -i "$tmp/0.png" -i "$tmp/1.png" -i "$tmp/2.png" -i "$tmp/3.png" \
  -filter_complex "[0][1]hstack[a];[2][3]hstack[b];[a][b]vstack" "$out"
rm -r "$tmp"
