#!/usr/bin/env bash
# Re-render only the changed windows, splice them into out/picture.mp4, QA them, then master + encode + audio QA.
cd "$(dirname "$0")"; mkdir -p out/fix
RANGES=("0 2.6" "22.4 25.5" "54.4 57.6")
for i in 0 1 2; do set -- ${RANGES[$i]}; SEGMENT=1 START=$1 END=$2 OUT=out/fix/f$i.mp4 QAOUT=out/fix/qa$i.json node render.mjs video 30 > out/fix/log$i.txt 2>&1 & done
wait
# splice by frame number (frames 0-77, 672-764, 1632-1727 replaced)
ffmpeg -v error -y -i out/picture.mp4 -i out/fix/f0.mp4 -i out/fix/f1.mp4 -i out/fix/f2.mp4 -filter_complex \
 "[0:v]trim=start_frame=78:end_frame=672,setpts=PTS-STARTPTS[a];[0:v]trim=start_frame=765:end_frame=1632,setpts=PTS-STARTPTS[b];[0:v]trim=start_frame=1728,setpts=PTS-STARTPTS[c];[1:v]setpts=PTS-STARTPTS[f0];[2:v]setpts=PTS-STARTPTS[f1];[3:v]setpts=PTS-STARTPTS[f2];[f0][a][f1][b][f2][c]concat=n=6:v=1:a=0[v]" \
 -map "[v]" -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p out/picture_fixed.mp4
python3 - <<'PY'
import json
fails = []
inside = {0: ["title"], 1: ["c4"], 2: ["c12"]}   # captions whose whole life is inside a window
for i in range(3):
    d = json.load(open(f"out/fix/qa{i}.json")); fails += d["all"]
    for k in inside[i]:
        v = d["seen"].get(k, {"frames": 0, "words": 1}); need, got = .6 + .3 * v["words"], v["frames"] / 30
        if got + 1e-6 < need: fails.append({"kind": "too-short-to-read", "id": k, "seconds": round(got, 2), "need": round(need, 2)})
json.dump({"fails": len(fails), "all": fails}, open("out/fix/text-qa.json", "w"), indent=1)
print("FIX TEXT QA PASS" if not fails else f"FIX TEXT QA FAIL: {fails}")
PY
echo "frames: $(ffprobe -v error -count_frames -show_entries stream=nb_read_frames -of csv=p=0 out/picture_fixed.mp4)"
M=$(ffmpeg -hide_banner -i audio/mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=20:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
LN=$(echo "$M" | python3 -c "import json,sys;d=json.load(sys.stdin);print('loudnorm=I=-14:TP=-1.5:LRA=20:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}:linear=true'.format(**d))")
ffmpeg -v error -y -i out/picture_fixed.mp4 -c:v libx264 -preset slow -b:v 9500k -pass 1 -an -f null /dev/null
ffmpeg -v error -y -i out/picture_fixed.mp4 -i audio/mix.wav -af "$LN,aresample=48000" -map 0:v -map 1:a -c:v libx264 -preset slow -b:v 9500k -maxrate 14M -bufsize 20M -pass 2 -pix_fmt yuv420p -c:a aac -b:a 320k -movflags +faststart -shortest out/final.mp4
ffmpeg -v error -y -i out/final.mp4 -c:v libx264 -preset slow -b:v 2650k -pass 1 -an -f null /dev/null
ffmpeg -v error -y -i out/final.mp4 -c:v libx264 -preset slow -b:v 2650k -maxrate 4M -bufsize 6M -pass 2 -c:a aac -b:a 192k -movflags +faststart out/preview.mp4
rm -f ffmpeg2pass-0.log*
python3 audio/qa.py out/final.mp4; echo "AUDIO_QA_EXIT=$?"
