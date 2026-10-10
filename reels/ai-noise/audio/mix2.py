"""Sound for v2 ("What happens when you ask AI for an image"). Every effect is placed from out/cues.json.
  KENNEY=<dir> python3 audio/mix2.py   ->  audio/mix.wav
"""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfxlib import *   # noqa: F401,F403  (SR, load, filt, place, braam, whoosh, shepard, pad, bell, ...)

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
cues = json.load(open(os.path.join(ROOT, "out/cues.json")))
DUR = float(os.environ.get("DUR", "63.8")); N = int(DUR * SR)
first = {}
for c in cues: first.setdefault(c["s"], c["t"])
T = first

fx = np.zeros((N, 2)); mus = np.zeros((N, 2)); amb = np.zeros((N, 2))
keys = [norm(load(f"click_00{i}.ogg"), .9) for i in range(1, 6)] + [norm(load(f"switch{i}.ogg"), .9) for i in (3, 7, 11)]
click = norm(load("switch_005.ogg")); tick = [norm(load(f"tick_00{i}.ogg")) for i in (1, 2, 4)]
metal = norm(load("impactMetal_heavy_002.ogg")); plate = norm(load("impactPlate_heavy_001.ogg")); soft = norm(load("impactSoft_heavy_002.ogg"))
bellk = norm(load("impactBell_heavy_001.ogg")); lowexp = [norm(load(f"lowFrequency_explosion_00{i}.ogg")) for i in (0, 1)]
glass = [norm(load(f"glass_00{i}.ogg")) for i in (1, 3, 5)]; force = norm(load("forceField_001.ogg"))
pop = [norm(load(f"maximize_00{i}.ogg")) for i in (1, 3, 5)]

D2, F2, Fs2, A2, D1 = 73.42, 87.31, 92.50, 110.0, 36.71
ki = 0
for c in cues:
    t0, s = c["t"], c["s"]
    if s == "slam" and t0 < 5:           # "ASK AI" pops in: a tight punchy hit, not a trailer boom
        place(fx, soft, t0 - peak_at_start(soft), db(-9)); place(fx, sub_drop(.9, 90, 45), t0, db(-12)); place(fx, pop[0], t0, db(-20))
    elif s == "whoosh_up":
        place(fx, whoosh(.7, 400, 6000), t0 - .1, db(-12))
    elif s == "card":
        place(fx, whoosh(.55, 300, 2400), t0 - .2, db(-16)); place(fx, pop[1], t0 + .35, db(-18))
    elif s == "key":
        k = keys[ki % len(keys)]; ki += 1; place(fx, k, t0 - peak_at_start(k), db(-17 + rng.uniform(-2, 1.5)), pan=rng.uniform(-.2, .2))
    elif s == "enter":
        place(fx, click, t0 - peak_at_start(click), db(-10))
    elif s == "gen":
        place(fx, filt(force, None, 5000), t0, db(-18)); [place(fx, filt(glass[q % 3], 2500, None), t0 + .05 + q * .07, db(-30)) for q in range(6)]
    elif s == "push":
        place(fx, whoosh(1.4, 180, 5200), t0, db(-10)); place(fx, sub_drop(1.6, 70, 32), t0 + 1.2, db(-12))
    elif s == "boom":
        place(fx, lowexp[0], t0 - peak_at_start(lowexp[0]), db(-12)); place(fx, sub_drop(2.0, 64, 30), t0, db(-10))
    elif s == "scan":
        for q in range(int((T["riser"] - t0) / .5)): place(fx, filt(tick[q % 3], 1500, None), t0 + q * .5, db(-26), pan=(-.3 if q % 2 else .3))
    elif s == "step":
        k = c.get("k", 1); place(fx, sweep_noise(.35, 6000, 2200, q=2.0) * env(.35, .02, .25)[:, None], t0, db(-24 - k * .12), pan=rng.uniform(-.4, .4))
    elif s == "braam":
        place(fx, braam(3.4), t0, db(-2)); place(fx, metal, t0 - peak_at_start(metal), db(-10)); place(fx, lowexp[0], t0 - peak_at_start(lowexp[0]), db(-9))
    elif s == "question":
        place(fx, reverse_swell(1.6)[::-1] * env(1.6, .5, 1.0)[:, None], t0, db(-22))
    elif s == "whoosh_out":
        place(fx, whoosh(2.6, 3000, 160), t0 - .2, db(-13))
    elif s == "slam_soft":
        place(fx, plate, t0 - peak_at_start(plate), db(-12)); place(fx, sub_drop(1.2, 80, 40), t0, db(-13))
    elif s == "wave":
        place(fx, sweep_noise(4.5, 300, 7000, q=1.6) * env(4.5, 1.5, 2.0)[:, None], t0, db(-19))
    elif s == "wave_back":
        place(fx, sweep_noise(2.4, 7000, 300, q=1.6) * env(2.4, .6, 1.2)[:, None], t0, db(-19))
    elif s == "whoosh_in":
        place(fx, whoosh(1.8, 200, 4800), t0, db(-12))
    elif s == "slam" and t0 > 5:         # "50 STEPS": the final punch
        bi = braam(2.4); bi *= np.interp(np.arange(len(bi)) / SR, [0, .3, 1.0, 2.4], [1, 1, .2, 0])[:, None]
        place(fx, bi, t0, db(-6)); place(fx, metal, t0 - peak_at_start(metal), db(-11))
    elif s == "shimmer":
        for q in range(14): place(fx, filt(glass[q % 3], 2500, None), t0 + q * .11 + rng.uniform(0, .05), db(-30 + rng.uniform(-3, 2)), pan=rng.uniform(-.6, .6))
    elif s == "endhit":
        place(fx, soft, t0 - peak_at_start(soft), db(-12)); place(fx, sub_drop(2.4, 74, 36), t0, db(-13)); place(fx, bell(146.8, 4), t0, db(-18))

def at(t): return int(t * SR)
# ambience: static lives inside the app's image box, then fills the world after the push, thinning with every step
hs = static_hiss(DUR - T["gen"])
tl = np.arange(len(hs)) / SR + T["gen"]
lvl = np.interp(tl, [T["gen"], T["gen"] + .4, T["push"], T["push"] + 1.3, T["riser"], T["braam"] - .3, T["braam"]], [-60, -38, -36, -25, -27, -46, -80])
place(amb, hs * db(lvl)[:, None], T["gen"])
wind = filt(rng.standard_normal((N, 2)), 150, 1200); wind = norm(wind) * filt(rng.standard_normal(N), None, 1.5)[:, None] * 3
wl = np.interp(np.arange(N) / SR, [0, T["braam"], T["braam"] + 1.5, T["whoosh_out"], T["whoosh_in"], T["whoosh_in"] + 1.5, DUR], [-80, -80, -36, -42, -80, -38, -44])
amb += wind * db(wl)[:, None]

# score
# opening: bright and curious (D major pad + soft bell figure)
place(mus, pad(T["push"] + 1.5, [D2, A2, Fs2 * 2, D2 * 2], bright=1800, a=1.2, r=1.0), 0.2, db(-23))
for i, (t0, f) in enumerate([(.6, 587.33), (1.2, 739.99), (1.8, 880.0), (3.3, 587.33), (4.2, 659.25), (5.4, 739.99), (7.1, 880.0)]):
    place(mus, bell(f, 2.4), t0, db(-27), pan=(-.3 if i % 2 else .3))
# into the noise: mystery (D minor drone) + short riser to "this."
place(mus, pad(T["riser"] - T["push"] + .8, [D1, D2, A2, F2], bright=520, a=1.5, r=.6), T["push"] + .2, db(-21))
sr = shepard(T["boom"] - .05 - T["push"], start_oct=1, speed=1.4); place(mus, sr[:, None] * np.stack([1, .95]) * np.linspace(0, 1, len(sr))[:, None] ** 2, T["push"], db(-22))
# the 50 steps: endless rising tone, dead stop, braam
sp = shepard(T["braam"] - .18 - T["riser"], start_oct=0, speed=1.0)
place(mus, sp[:, None] * np.stack([1, .92]) * np.linspace(.2, 1, len(sp))[:, None] ** 1.5, T["riser"], db(-21))
place(mus, pad(T["braam"] - T["riser"], [D1, D2, A2], bright=420, a=2.0, r=.1), T["riser"], db(-22))
# the reveal + twist: D major wonder, then darker under the wall with an accelerating clock
place(mus, pad(T["whoosh_out"] - T["braam"] + .5, [D2, A2, Fs2 * 2, D2 * 2], bright=1500, a=1.0, r=.8), T["braam"] + .3, db(-20))
t_k, n_k = T["whoosh_out"] + .4, 0
while t_k < T["whoosh_in"]:
    k = (t_k - T["whoosh_out"]) / (T["whoosh_in"] - T["whoosh_out"]); place(mus, tick[n_k % 3], t_k, db(-21 + 6 * k), pan=(.2 if n_k % 2 else -.2))
    t_k += .62 * (1 - k) + .16 * k; n_k += 1
place(mus, pad(T["whoosh_in"] - T["whoosh_out"] + .5, [D2, F2, A2, D2 * 2], bright=800, a=1.0, r=.6), T["whoosh_out"], db(-21))
# payoff: resolve in D major with bells, carries the end card
place(mus, pad(DUR - T["slam"] + 1.0, [D2, A2, Fs2 * 2, D2 * 2], bright=1500, a=1.4, r=3.0), T["whoosh_in"] + .6, db(-19))
for t0, f in [(T["slam"] + 1.0, 293.66), (T["slam"] + 1.8, 369.99), (T["slam"] + 2.6, 440.0), (T["slam"] + 4.0, 587.33)]:
    place(mus, bell(f, 3.5), t0, db(-21), pan=rng.uniform(-.3, .3))

fx = reverb(fx, 1.8, .18, 6000); mus = reverb(mus, 3.0, .3, 4800)
def dip(t0, pre=.22, floor=-60, fade=.04):
    gg = np.ones(N); a, b = at(t0 - pre), at(t0); f = int(fade * SR); gg[a:b] = db(floor); gg[a - f:a] = np.linspace(1, db(floor), f); return gg
gd = dip(T["braam"]) * dip(T["slam"] if False else [c["t"] for c in cues if c["s"] == "slam"][-1], .12, -14)
mus *= gd[:, None]; amb *= gd[:, None]; fx *= dip(T["braam"])[:, None]
mix = fx + mus + amb
mix *= np.interp(np.arange(N) / SR, [0, .05, DUR - 1.0, DUR], [0, 1, 1, 0])[:, None]
mix = np.tanh(mix / (np.abs(mix).max() + 1e-9) * 1.15) * .89
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_f32le", os.path.join(HERE, "mix.wav")],
               input=mix.astype(np.float32).tobytes(), check=True)
print("wrote audio/mix.wav", len(cues), "cues")
