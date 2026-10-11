"""UPI reel sound (80 s). Every effect is placed from out/cues.json (the picture's own timeline).
  KENNEY=<dir> python3 audio/mix.py  ->  audio/mix.wav
"""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfxlib import *  # noqa: F401,F403

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
cues = json.load(open(os.path.join(ROOT, "out/cues.json")))
T = {}
for c in cues: T.setdefault(c["s"], c["t"])
_banks = [c["t"] for c in cues if c["s"] == "bank_in"]; T["you"], T["raju"] = _banks[0], _banks[1]
DUR = float(os.environ.get("DUR", "80")); N = int(DUR * SR)
fx = np.zeros((N, 2)); amb = np.zeros((N, 2)); mus = np.zeros((N, 2))
K = lambda n: norm(load(n))
click, confirm, glass = K("click_002.ogg"), [K(f"confirmation_00{i}.ogg") for i in (1, 2, 3)], [K(f"glass_00{i}.ogg") for i in (1, 3, 5)]
drop, soft, metal, lowexp, force = [K(f"drop_00{i}.ogg") for i in (1, 2, 3)], K("impactSoft_heavy_002.ogg"), K("impactMetal_heavy_002.ogg"), K("lowFrequency_explosion_000.ogg"), K("forceField_001.ogg")
def at(t): return int(t * SR)
def chime(notes, t0, gain, dt=.11, dur=1.4):
    for k, f in enumerate(notes): place(fx, bell(f, dur), t0 + k * dt, gain)

# ---------------- effects ----------------
for c in cues:
    t0, s = c["t"], c["s"]
    if s == "title":   chime([587.33, 880.0], t0 + .15, db(-24), dt=.18, dur=2.0)
    elif s == "tap":   place(fx, click, t0 - peak_at_start(click), db(-12))
    elif s == "ding":  chime([1046.5, 1568.0], t0, db(-15))
    elif s == "freeze":
        place(fx, reverse_swell(.9), t0 - .9, db(-16)); place(fx, sub_drop(1.4, 90, 38), t0, db(-10))
        place(fx, tape_stop(np.stack([filt(rng.standard_normal(int(SR * 1.5)), 200, 3000)] * 2, 1) * .3, .5), t0 - .05, db(-22))
    elif s == "launch":
        place(fx, filt(force, None, 6000), t0, db(-16)); place(fx, whoosh(1.2, 300, 6000), t0 + .2, db(-14)); [place(fx, filt(glass[q % 3], 2500, None), t0 + q * .06, db(-28)) for q in range(5)]
    elif s == "whoosh": place(fx, whoosh(1.1, 220, 5200), t0 - .35, db(-14), pan=rng.uniform(-.4, .4))
    elif s == "npci":
        hum = np.sin(2 * np.pi * 55 * tt(5)) * .6 + np.sin(2 * np.pi * 110.5 * tt(5)) * .3; place(fx, np.stack([hum, hum], 1) * env(5, 1.0, 1.5)[:, None], t0 - .5, db(-20))
        for q in range(24): place(fx, filt(glass[q % 3], 3000, None), t0 + q * .19 + rng.uniform(0, .08), db(-33 + rng.uniform(-3, 2)), pan=rng.uniform(-.7, .7))
    elif s == "bank_in": place(fx, soft, t0 - peak_at_start(soft), db(-15)); place(fx, sub_drop(.8, 80, 50), t0, db(-18))
    elif s == "check":  place(fx, confirm[0], t0 - peak_at_start(confirm[0]), db(-15))
    elif s == "debit":  place(fx, drop[0], t0 - peak_at_start(drop[0]), db(-13)); place(fx, sub_drop(.5, 120, 70), t0, db(-20))
    elif s == "credit": chime([1318.5, 1760.0], t0, db(-16), dt=.08)
    elif s == "dive":   place(fx, whoosh(2.6, 5000, 160), t0 + .1, db(-11))
    elif s == "soundbox":   # the soundbox's announcement jingle + its little speaker buzz
        chime([783.99, 987.77, 1174.66], t0, db(-12), dt=.13, dur=1.6)
        bz = np.sign(np.sin(2 * np.pi * 220 * tt(.9))) * .15; place(fx, filt(np.stack([bz, bz], 1) * env(.9, .05, .3)[:, None], 400, 3000), t0 + .5, db(-26))
    elif s == "unfreeze":
        place(fx, reverse_swell(.6)[::-1] * env(.6, .02, .4)[:, None], t0, db(-18)); place(fx, whoosh(.9, 2000, 300), t0, db(-16))
    elif s == "twist":  place(fx, lowexp, t0 - peak_at_start(lowexp), db(-13)); place(fx, sub_drop(2.0, 60, 30), t0, db(-12))
    elif s == "iou":    place(fx, sweep_noise(1.0, 3000, 1200, q=1.5) * env(1.0, .2, .6)[:, None], t0 + .2, db(-20))
    elif s == "settle": place(fx, sweep_noise(2.6, 400, 7000, q=1.7, curve=2) * np.linspace(0, 1, int(2.6 * SR))[:, None] ** 2, t0 + .1, db(-18))
    elif s == "rbi":    bi = braam(2.8, 36.71 * 1.5); place(fx, bi, t0, db(-9)); place(fx, metal, t0 - peak_at_start(metal), db(-16))
    elif s == "trust":  chime([293.66, 440.0, 587.33], t0, db(-17), dt=.0, dur=3.5)
    elif s == "end":    place(fx, soft, t0 + .3 - peak_at_start(soft), db(-18)); chime([587.33, 880.0], t0 + .4, db(-24), dt=.18, dur=2.4)

# ---------------- ambience ----------------
street = norm(filt(rng.standard_normal((N, 2)), 40, 400)) * db(-30) + norm(filt(rng.standard_normal((N, 2)), 500, 2500)) * (filt(rng.standard_normal(N), None, 4)[:, None] * 2 + .6) * db(-40)
for th in (3.4, 9.0 + 40, 52.5, 72.4):   # distant scooter horns (only audible while time runs)
    horn = np.sin(2 * np.pi * 440 * tt(.35)) + .5 * np.sin(2 * np.pi * 554 * tt(.35)); place(street, filt(np.stack([horn, horn], 1) * env(.35, .02, .1)[:, None], 300, 3000), th, db(-38), pan=.6)
alive = np.interp(np.arange(N) / SR, [0, T["freeze"] - .02, T["freeze"] + .2, T["unfreeze"], T["unfreeze"] + .5, T["twist"], T["twist"] + 1, T["payoff"] - .5, T["payoff"] + .5, DUR], [1, 1, 0, 0, 1, 1, .35, .35, 1, 1])
amb += street * alive[:, None]
air = norm(filt(rng.standard_normal((N, 2)), 200, 1800)) * filt(rng.standard_normal(N), None, 1.2)[:, None] * 3
flying = np.interp(np.arange(N) / SR, [0, T["launch"], T["launch"] + 1.5, T["dive"] + 2.5, T["soundbox"], T["twist"], T["twist"] + 2, T["payoff"] - .6, T["payoff"], DUR], [0, 0, 1, 1, 0, 0, .7, .7, 0, 0])
amb += air * (flying * db(-34))[:, None]

# ---------------- score ----------------
D2, Fs2, A2, B2, D1 = 73.42, 92.50, 110.0, 123.47, 36.71
place(mus, pad(T["freeze"] + .3, [D2 * 2, A2 * 2, Fs2 * 4, D2 * 4], bright=1800, a=1.5, r=.4), 0, db(-26))                       # curious, warm
place(mus, pad(T["launch"] - T["freeze"] + .5, [D2 * 2, A2 * 2, 2 * 82.41], bright=900, a=.3, r=.6), T["freeze"], db(-29))       # suspended
# the journey: a light pulse (120 bpm) with a sub on every beat, building towards the soundbox
bt, n = T["launch"] + .2, 0
while bt < T["soundbox"] - .1:
    k = (bt - T["launch"]) / (T["soundbox"] - T["launch"])
    place(mus, sub_drop(.4, 70, 52) * env(.4, .003, .25, 1), bt, db(-23 + 5 * k))
    if n % 2: place(mus, filt(np.stack([rng.standard_normal(int(.05 * SR))] * 2, 1) * env(.05, .001, .04)[:, None], 5000, None), bt, db(-34 + 4 * k))
    bt += .5; n += 1
for i, (t0, ch) in enumerate([(T["launch"], [D2, A2, Fs2 * 2]), (T["npci"], [B2 / 2 * 2, Fs2 * 2, D2 * 2]), (T["you"], [D2 * 1.335 * 2 / 2, A2, D2 * 2]), (T["raju"], [A2, 138.59, D2 * 2 * 1.25 / 1.25 * 1.125])]):
    nxt = [T["npci"], T["you"], T["raju"], T["soundbox"]][i]
    place(mus, pad(nxt - t0 + .6, ch, bright=900 + 200 * i, a=.8, r=.6), t0, db(-24 + i))
# time restarts: bright resolve; then the twist darkens (B minor) and the settlement builds into the RBI hit
place(mus, pad(T["twist"] - T["soundbox"] + .6, [D2, A2, Fs2 * 2, D2 * 2], bright=1700, a=.3, r=.8), T["soundbox"], db(-22))
place(mus, pad(T["settle"] - T["twist"] + .5, [B2 / 2, Fs2, D2 * 2 / 2 * 2, B2], bright=700, a=1.0, r=.6), T["twist"], db(-23))
sp = shepard(T["rbi"] - .1 - T["settle"], start_oct=1, speed=1.4); place(mus, sp[:, None] * np.stack([1, .94]) * np.linspace(.1, 1, len(sp))[:, None] ** 1.6, T["settle"], db(-22))
place(mus, pad(DUR - T["rbi"] + .5, [D2, A2, Fs2 * 2, D2 * 2], bright=1500, a=1.6, r=2.5), T["rbi"], db(-21))

# dead stops before the big moments
def dip(t0, pre=.18, floor=-40, fade=.04):
    gg = np.ones(N); a, b = at(t0 - pre), at(t0); f = int(fade * SR); gg[a:b] = db(floor); gg[a - f:a] = np.linspace(1, db(floor), f); return gg
gd = dip(T["soundbox"]) * dip(T["rbi"], .14)
fx = reverb(fx, 1.6, .2, 7000); mus = reverb(mus, 2.6, .3, 5000)
mus *= gd[:, None]; amb *= gd[:, None]; fx *= gd[:, None]
mix = fx + mus + amb
mix *= np.interp(np.arange(N) / SR, [0, .1, DUR - .6, DUR], [0, 1, 1, 0])[:, None]
mix = np.tanh(mix / (np.abs(mix).max() + 1e-9) * 1.1) * .89
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_f32le", os.path.join(HERE, "mix.wav")], input=mix.astype(np.float32).tobytes(), check=True)
print("wrote audio/mix.wav", len(cues), "cues")
