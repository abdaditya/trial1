#!/usr/bin/env bash
# Full v2 build: picture (+ text QA incl. reading time) -> sound -> master -> HD encode -> audio QA -> 28 MB preview
#   KENNEY=<kenney packs dir> ./finalize.sh
set -uo pipefail
cd "$(dirname "$0")"
node render.mjs video 30; TQA=$?
python3 audio/mix2.py || exit 1
M=$(ffmpeg -hide_banner -i audio/mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=20:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
LN=$(echo "$M" | python3 -c "import json,sys;d=json.load(sys.stdin);print('loudnorm=I=-14:TP=-1.5:LRA=20:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}:linear=true'.format(**d))")
ffmpeg -v error -y -i out/picture.mp4 -c:v libx264 -preset slow -tune animation -b:v 9500k -pass 1 -an -f null /dev/null
ffmpeg -v error -y -i out/picture.mp4 -i audio/mix.wav -af "$LN,aresample=48000" -map 0:v -map 1:a -c:v libx264 -preset slow -tune animation -b:v 9500k -maxrate 14M -bufsize 20M -pass 2 -pix_fmt yuv420p -c:a aac -b:a 320k -movflags +faststart -shortest out/final.mp4
ffmpeg -v error -y -i out/final.mp4 -c:v libx264 -preset slow -b:v 3100k -pass 1 -an -f null /dev/null
ffmpeg -v error -y -i out/final.mp4 -c:v libx264 -preset slow -b:v 3100k -maxrate 4.5M -bufsize 6M -pass 2 -c:a aac -b:a 192k -movflags +faststart out/preview.mp4
rm -f ffmpeg2pass-0.log*
python3 audio/qa.py out/final.mp4; AQA=$?
echo "TEXT_QA_EXIT=$TQA AUDIO_QA_EXIT=$AQA"
