"""UPI reel sound. Effects placed from out/cues.json.  KENNEY=<dir> python3 audio/mix.py -> audio/mix.wav"""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfxlib import *  # noqa
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
cues = json.load(open(os.path.join(ROOT, "out/cues.json"))); T = {}
for c in cues: T.setdefault(c["s"], c["t"])
DUR = float(os.environ.get("DUR", "8.5")); N = int(DUR * SR)
fx = np.zeros((N, 2)); amb = np.zeros((N, 2)); mus = np.zeros((N, 2))
click = norm(load("click_002.ogg")); glass = [norm(load(f"glass_00{i}.ogg")) for i in (1, 3, 5)]
# street ambience: low city rumble + chatter-like band noise + a far scooter horn; it stops dead at the freeze
rum = norm(filt(rng.standard_normal((N, 2)), 40, 400)) * db(-30)
chat = norm(filt(rng.standard_normal((N, 2)), 500, 2500)) * (filt(rng.standard_normal(N), None, 4)[:, None] * 2 + .6) * db(-40)
amb += rum + chat
horn = np.sin(2 * np.pi * 440 * tt(.35)) + .5 * np.sin(2 * np.pi * 554 * tt(.35)); place(amb, filt(horn * env(.35, .02, .1), 300, 3000), 3.4, db(-38), pan=.6)
# the payment
place(fx, click, T["tap"] - peak_at_start(click), db(-12))
for k, (f, dt) in enumerate([(1046.5, 0), (1568.0, .11)]): place(fx, bell(f, 1.4), T["ding"] + dt, db(-15))   # two-note success chime
# a warm, curious bed under the opening
place(mus, pad(DUR, [146.83, 220.0, 293.66, 369.99], bright=1600, a=1.5, r=.5), 0, db(-26))
# FREEZE: reverse swell into a hard stop; ambience and music cut, a high tone hangs
fr = T["freeze"]
place(fx, reverse_swell(.9), fr - .9, db(-16)); place(fx, sub_drop(1.4, 90, 38), fr, db(-10))
place(fx, tape_stop(np.stack([filt(rng.standard_normal(int(SR * 1.5)), 200, 3000)] * 2, 1) * .3, .5), fr - .05, db(-22))
hang = np.sin(2 * np.pi * 1760 * tt(DUR - fr)) * .3 + np.sin(2 * np.pi * 2637 * tt(DUR - fr)) * .15; place(mus, np.stack([hang, hang], 1) * env(DUR - fr, .8, .5)[:, None], fr, db(-34))
cut = np.ones(N); a = int(fr * SR); cut[a:] = np.linspace(1, 0, min(N - a, int(.25 * SR))).tolist() + [0] * max(0, N - a - int(.25 * SR)); amb *= cut[:, None]
mcut = np.ones(N); mcut[a:] = np.linspace(1, .15, min(N - a, int(.3 * SR))).tolist() + [.15] * max(0, N - a - int(.3 * SR)); mus[:, :] *= mcut[:, None]
fx = reverb(fx, 1.6, .2, 7000); mus = reverb(mus, 2.6, .3, 5000)
mix = fx + mus + amb; mix *= np.interp(np.arange(N) / SR, [0, .1, DUR - .3, DUR], [0, 1, 1, 0])[:, None]
mix = np.tanh(mix / (np.abs(mix).max() + 1e-9) * 1.1) * .89
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_f32le", os.path.join(HERE, "mix.wav")], input=mix.astype(np.float32).tobytes(), check=True)
print("wrote audio/mix.wav")
