#!/bin/bash
# verify.sh MP4 OUTDIR "B1:6.8 B2:25.4 ..." "13.6 21.6 ..."
# ffprobe, a full decode, the moov/mdat order, a full frame at each beat's
# midpoint, a before|after pair at each cut, and a 3x3 sheet of the midpoints.
set -eu
B=${FFBIN:-$HOME/g251/video/ffmpeg-static/bin}
mp4=$1 out=$2 mids=$3 cuts=$4
mkdir -p "$out"
"$B/ffprobe" -v error -show_entries format=duration,size,bit_rate:stream=codec_name,profile,pix_fmt,width,height,r_frame_rate,avg_frame_rate,nb_frames,codec_type -of json "$mp4" > "$out/probe.json"
"$B/ffmpeg" -v error -xerror -i "$mp4" -f null - 2> "$out/decode.log" && echo "decode exit 0, $(wc -l < "$out/decode.log") error lines"
python3 -I -c '
import struct, sys
f = open(sys.argv[1], "rb"); order = []
while True:
    h = f.read(8)
    if len(h) < 8: break
    n, k = struct.unpack(">I4s", h)
    if n == 1: n = struct.unpack(">Q", f.read(8))[0]; f.seek(n - 16, 1)
    else: f.seek(n - 8, 1)
    order.append(k.decode())
print("atoms", " ".join(order), "| faststart", order.index("moov") < order.index("mdat"))
' "$mp4"
sheet=()
for m in $mids; do
  id=${m%%:*} t=${m#*:}
  "$B/ffmpeg" -v error -y -ss "$t" -i "$mp4" -frames:v 1 "$out/mid-$id.png"
  "$B/ffmpeg" -v error -y -i "$out/mid-$id.png" -vf "scale=640:360,drawtext=text='$id  $t s':x=8:y=8:fontsize=24:fontcolor=0x101214:box=1:boxcolor=0xf2f1ec:boxborderw=6" "$out/thumb-$id.png"
  sheet+=(-i "$out/thumb-$id.png")
done
n=$(( ${#sheet[@]} / 2 ))
"$B/ffmpeg" -v error -y "${sheet[@]}" -filter_complex "$(for i in $(seq 0 $((n-1))); do printf '[%d]' $i; done)xstack=inputs=$n:layout=0_0|w0_0|w0+w1_0|0_h0|w0_h0|w0+w1_h0|0_h0+h3|w0_h0+h3|w0+w1_h0+h3[v]" -map "[v]" "$out/contact-sheet-a.png"
rm -f "$out"/thumb-*.png
for t in $cuts; do
  a=$(python3 -I -c "print(round($t-0.1,3))") z=$(python3 -I -c "print(round($t+0.1,3))")
  "$B/ffmpeg" -v error -y -ss "$a" -i "$mp4" -frames:v 1 -vf "scale=960:540,drawtext=text='$a':x=6:y=6:fontsize=24:fontcolor=red:box=1:boxcolor=white" "$out/ca.png"
  "$B/ffmpeg" -v error -y -ss "$z" -i "$mp4" -frames:v 1 -vf "scale=960:540,drawtext=text='$z':x=6:y=6:fontsize=24:fontcolor=red:box=1:boxcolor=white" "$out/cz.png"
  "$B/ffmpeg" -v error -y -i "$out/ca.png" -i "$out/cz.png" -filter_complex hstack "$out/cut-$t.png"
done
rm -f "$out/ca.png" "$out/cz.png"
ls "$out" | wc -l
