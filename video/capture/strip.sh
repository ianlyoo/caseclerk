#!/bin/bash
# strip.sh FILE START DUR FPS CROP(w:h:x:y|none) WIDTH TILE(cxr) OUT
# A labelled frame strip for review; each frame carries its source time.
set -eu
F=${FFMPEG:-$HOME/g251/video/ffmpeg-static/bin/ffmpeg}
file=$1 ss=$2 dur=$3 fps=$4 crop=$5 w=$6 tile=$7 out=$8
vf="fps=$fps"
[ "$crop" != none ] && vf="crop=$crop,$vf"
vf="$vf,scale=$w:-1,drawtext=text='%{pts\:flt\:$ss}':x=4:y=4:fontsize=20:fontcolor=red:box=1:boxcolor=white,tile=$tile"
"$F" -v error -y -ss "$ss" -t "$dur" -i "$file" -vf "$vf" -frames:v 1 "$out"
