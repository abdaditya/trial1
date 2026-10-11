#!/usr/bin/env bash
# waits for the picture render, then: sound -> master -> HD + preview -> audio QA
cd "$(dirname "$0")"
until grep -q "^EXIT" out/render.log 2>/dev/null; do sleep 30; done
TQA=$(grep -c "TEXT QA PASS" out/render.log)
python3 audio/mix.py || exit 1
M=$(ffmpeg -hide_banner -i audio/mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=20:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
LN=$(echo "$M" | python3 -c "import json,sys;d=json.load(sys.stdin);print('loudnorm=I=-14:TP=-1.5:LRA=20:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}:linear=true'.format(**d))")
ffmpeg -v error -y -i out/picture.mp4 -c:v libx264 -preset slow -b:v 9500k -pass 1 -an -f null /dev/null
ffmpeg -v error -y -i out/picture.mp4 -i audio/mix.wav -af "$LN,aresample=48000" -map 0:v -map 1:a -c:v libx264 -preset slow -b:v 9500k -maxrate 14M -bufsize 20M -pass 2 -pix_fmt yuv420p -c:a aac -b:a 320k -movflags +faststart -shortest out/final.mp4
ffmpeg -v error -y -i out/final.mp4 -c:v libx264 -preset slow -b:v 2650k -pass 1 -an -f null /dev/null
ffmpeg -v error -y -i out/final.mp4 -c:v libx264 -preset slow -b:v 2650k -maxrate 4M -bufsize 6M -pass 2 -c:a aac -b:a 192k -movflags +faststart out/preview.mp4
rm -f ffmpeg2pass-0.log*
python3 audio/qa.py out/final.mp4; AQA=$?
echo "TEXT_QA_PASS=$TQA AUDIO_QA_EXIT=$AQA"
