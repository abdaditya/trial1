"""Audio QA on the final MP4: hero-cue sync, loudness, true peak, silence where intended.
  python3 audio/qa.py out/final.mp4   (exit 1 on any FAIL)
"""
import json, os, re, subprocess, sys
import numpy as np

SR = 48000
video = sys.argv[1]
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cues = json.load(open(os.path.join(root, "out/cues.json")))
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vn", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(raw, np.float32)
hop = int(.005 * SR)
rms = np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, "same"))[::hop] + 1e-7
lvl = 20 * np.log10(rms)
fails = []

print("hero cue sync (onset within ±40 ms):")
for c in cues:
    if c["s"] not in ("braam", "slam", "impact", "thunder", "enter", "endhit", "sub", "boom"): continue
    i0, i1 = int((c["t"] - .1) / .005), int((c["t"] + .1) / .005)
    d = np.diff(lvl[i0:i1]); k = int(np.argmax(d)); onset = (i0 + k) * .005
    jump = lvl[i0 + k + 4] - lvl[max(0, i0 + k - 6)]
    off = (onset - c["t"]) * 1000
    ok = abs(off) <= 40 and jump > 4
    print(f"  {c['s']:<8} {c['t']:6.2f}s  onset {off:+5.0f} ms  rise {jump:4.1f} dB  {'ok' if ok else 'FAIL'}")
    if not ok: fails.append(f"sync {c['s']} @ {c['t']}")

# intended dead-stops before hero hits must be quiet relative to the hit
for name, pre in (("braam", .15), ("impact", .14)):
    if not any(c["s"] == name for c in cues): continue
    t = next(c["t"] for c in cues if c["s"] == name)
    before = lvl[int((t - pre) / .005):int((t - .03) / .005)].mean(); after = lvl[int(t / .005):int((t + .3) / .005)].max()
    ok = after - before > 18
    print(f"  dead stop before {name}: {after - before:.1f} dB contrast {'ok' if ok else 'FAIL'}")
    if not ok: fails.append(f"stop {name}")

er = subprocess.run(["ffmpeg", "-hide_banner", "-i", video, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", er)[-1]); tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", er)[-1])
print(f"loudness {I:.1f} LUFS (target -14 ±1)  true peak {tp:.1f} dBTP (max -1.0)")
if abs(I + 14) > 1: fails.append("loudness")
if tp > -1.0: fails.append("true peak")
print("AUDIO QA", "PASS" if not fails else f"FAIL: {fails}")
sys.exit(1 if fails else 0)
