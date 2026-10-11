#!/usr/bin/env bash
# Render the picture in 4 parallel segments (edited voice clock), then merge video + whole-reel text QA.
cd "$(dirname "$0")"; mkdir -p out/seg
DUR=$(node -e 'const fs=require("fs");const m=fs.readFileSync("index.html","utf8").match(/CUTD = ([\d.]+), DUR = 92 - CUTD/);console.log((92-+m[1]).toFixed(2))')
CUTS=(0 22 44 66 $DUR)
for i in 0 1 2 3; do
  SEGMENT=1 START=${CUTS[$i]} END=${CUTS[$((i+1))]} OUT=out/seg/p$i.mp4 QAOUT=out/seg/qa$i.json node render.mjs video 30 > out/seg/log$i.txt 2>&1 &
done
wait
printf "file 'p0.mp4'\nfile 'p1.mp4'\nfile 'p2.mp4'\nfile 'p3.mp4'\n" > out/seg/list.txt
ffmpeg -v error -y -f concat -safe 0 -i out/seg/list.txt -c copy out/picture.mp4
python3 - <<'PY'
import json
fails, seen = [], {}
for i in range(4):
    d = json.load(open(f"out/seg/qa{i}.json")); fails += d["all"]
    for k, v in d["seen"].items(): seen.setdefault(k, {"frames": 0, "words": v["words"]}); seen[k]["frames"] += v["frames"]
for k, v in seen.items():
    need, got = .6 + .3 * v["words"], v["frames"] / 30
    if got + 1e-6 < need: fails.append({"kind": "too-short-to-read", "id": k, "seconds": round(got, 2), "need": round(need, 2)})
json.dump({"fails": len(fails), "all": fails}, open("out/text-qa.json", "w"), indent=1)
print("TEXT QA PASS: no overlaps, all text inside safe zone" if not fails else f"TEXT QA FAIL: {len(fails)} problems")
PY
