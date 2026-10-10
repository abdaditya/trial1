#!/usr/bin/env bash
# Full build: picture (with text QA) -> sound (from the picture's cues) -> master -> mux -> audio QA.
#   ./build.sh <kenney_sounds_dir>
set -euo pipefail
cd "$(dirname "$0")"
KEN="${1:?path to the Kenney CC0 packs (impact, interface, scifi, ui-audio)}"

node render.mjs video 30                      # out/picture.mp4 + out/cues.json, fails on any text QA problem
python3 audio/mix.py "$KEN"                   # audio/mix.wav

# two-pass loudness: -14 LUFS, true peak -1.5 dBTP (Instagram / YouTube)
M=$(ffmpeg -hide_banner -i audio/mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=20:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
LN=$(echo "$M" | python3 -c "import json,sys;d=json.load(sys.stdin);print('loudnorm=I=-14:TP=-1.5:LRA=20:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}:linear=true'.format(**d))")

# final: re-encode picture at high quality (two-pass, ~16 Mbps) and mux the mastered audio once
ffmpeg -v error -y -i out/picture.mp4 -c:v libx264 -preset slow -b:v 16M -pass 1 -an -f null /dev/null
ffmpeg -v error -y -i out/picture.mp4 -i audio/mix.wav -af "$LN,aresample=48000" \
  -c:v libx264 -preset slow -b:v 16M -maxrate 20M -bufsize 32M -pass 2 -pix_fmt yuv420p \
  -c:a aac -b:a 320k -movflags +faststart -shortest out/final.mp4
rm -f ffmpeg2pass-0.log ffmpeg2pass-0.log.mbtree

python3 audio/qa.py out/final.mp4
