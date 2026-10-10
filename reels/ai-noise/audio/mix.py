"""Sound design + score for "How AI turns pure noise into an image" (78 s, no voice).

Real recordings: Kenney CC0 packs (keys, ticks, metal/bell/soft impacts, low explosions).
Designed sounds: braam, sub drops, whooshes, Shepard riser, reverse swells, thunder, D-minor score.
Every effect is placed from out/cues.json, which the picture exports from its own timeline.

  python3 audio/mix.py <kenney_dir>   ->  audio/mix.wav (48 kHz stereo float, unmastered)
"""
import json, os, subprocess, sys
import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
KEN = sys.argv[1]
DUR = 78.0
N = int(DUR * SR)
rng = np.random.default_rng(42)
cues = json.load(open(os.path.join(ROOT, "out/cues.json")))
T = {c["s"]: c["t"] for c in cues}          # last time of each cue name (unique ones are what we need)


def load(name):
    """Decode a Kenney .ogg to float32 stereo."""
    for d, _, fs in os.walk(KEN):
        if name in fs:
            raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(d, name), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                                 capture_output=True, check=True).stdout
            return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
    raise FileNotFoundError(name)


def db(x): return 10 ** (x / 20)
def tt(d): return np.arange(int(d * SR)) / SR


def bandmask(n, lo, hi, soft=.3):
    f = np.fft.rfftfreq(n, 1 / SR)
    m = np.ones_like(f)
    if lo: m *= 1 / (1 + (lo / np.maximum(f, 1)) ** (2 / soft * .5))
    if hi: m *= 1 / (1 + (f / hi) ** (2 / soft * .5))
    return m


def filt(x, lo=None, hi=None, soft=.3):
    """Zero-phase band filter via FFT (x mono or stereo)."""
    if x.ndim == 2: return np.stack([filt(x[:, i], lo, hi, soft) for i in range(x.shape[1])], 1)
    X = np.fft.rfft(x)
    return np.fft.irfft(X * bandmask(len(x), lo, hi, soft), len(x))


def sweep_noise(d, f0, f1, q=1.2, curve=1.0, stereo=True):
    """Noise whose band-pass centre glides f0 -> f1 (STFT), i.e. air moving past."""
    n = int(d * SR); hop, fr = 512, 2048
    out = np.zeros((n + fr, 2))
    win = np.hanning(fr)
    freqs = np.fft.rfftfreq(fr, 1 / SR)
    for ch in range(2 if stereo else 1):
        nz = rng.standard_normal(n + fr)
        for s in range(0, n, hop):
            k = (s / n) ** curve
            fc = f0 * (f1 / f0) ** k
            m = np.exp(-0.5 * (np.log2(np.maximum(freqs, 1) / fc) / (q * .5)) ** 2)
            seg = np.fft.irfft(np.fft.rfft(nz[s:s + fr] * win) * m, fr)
            out[s:s + fr, ch] += seg * win
    out = out[:n]
    if not stereo: out[:, 1] = out[:, 0]
    return out / (np.abs(out).max() + 1e-9)


def env(d, a, r, shape=2.0):
    n = int(d * SR); e = np.ones(n); na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na) ** shape
    if nr: e[-nr:] *= np.linspace(1, 0, nr) ** shape
    return e


def saw(freq, d, harmonics=24, detune=0.0):
    t = tt(d); x = np.zeros_like(t)
    for h in range(1, harmonics + 1):
        if freq * h > 16000: break
        x += np.sin(2 * np.pi * freq * h * t * (1 + detune)) / h
    return x


def place(bus, x, t0, gain=1.0, pan=0.0):
    """Mix x (mono or stereo) into bus at time t0 with constant-power pan."""
    if x.ndim == 1: x = np.stack([x, x], 1)
    x = x * gain * np.array([np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)]) * np.sqrt(2)
    i = int(round(t0 * SR))
    if i < 0: x, i = x[-i:], 0
    j = min(len(bus), i + len(x))
    if j > i: bus[i:j] += x[: j - i]


def peak_at_start(x):
    """Shift a sample so its loudest moment lands on the cue (peak-aligned placement)."""
    m = np.abs(x).max(1) if x.ndim == 2 else np.abs(x)
    return int(np.argmax(m[: int(.25 * SR)])) / SR


def norm(x, peak=1.0): return x / (np.abs(x).max() + 1e-9) * peak


def reverb(x, secs=2.4, wet=.25, damp=5000):
    """Convolution reverb with a synthetic decorrelated room (FFT)."""
    n = int(secs * SR); t = np.arange(n) / SR
    ir = np.stack([rng.standard_normal(n), rng.standard_normal(n)], 1) * np.exp(-t * 6.9 / secs)[:, None]
    ir = filt(ir, 180, damp); ir[: int(.012 * SR)] *= 0; ir /= np.sqrt((ir ** 2).sum(0))
    L = 1 << int(np.ceil(np.log2(len(x) + n)))
    y = np.stack([np.fft.irfft(np.fft.rfft(x[:, c], L) * np.fft.rfft(ir[:, c], L), L)[: len(x)] for c in range(2)], 1)
    return x * (1 - wet) + y * wet * 3.0


# ---------------------------------------------------------------------------
# designed sounds
# ---------------------------------------------------------------------------
def braam(d=3.2, root=36.71):
    """Inception-style brass blast: detuned saw stack through an opening low-pass + sub."""
    x = np.zeros(int(d * SR))
    for f, g in [(root, 1), (root * 2, .8), (root * 3, .45), (root * 2 * 1.003, .6), (root * 1.5 * 2, .35)]:
        x += saw(f, d, 40, detune=rng.uniform(-.002, .002)) * g
    t = tt(d)
    # time-varying brightness: open fast, close slow (STFT low-pass)
    hop, fr = 512, 2048; out = np.zeros(len(x) + fr); win = np.hanning(fr); fq = np.fft.rfftfreq(fr, 1 / SR)
    xp = np.concatenate([x, np.zeros(fr)])
    for s in range(0, len(x), hop):
        k = s / SR; cut = 180 + 2600 * np.exp(-k * 1.6) * min(1, k / .06)
        out[s:s + fr] += np.fft.irfft(np.fft.rfft(xp[s:s + fr] * win) / (1 + (fq / cut) ** 4), fr) * win
    y = out[: len(x)] * env(d, .02, 1.6, 1.4)
    y += np.sin(2 * np.pi * root * t) * np.exp(-t * .9) * 1.2
    y = np.tanh(norm(y) * 1.8)
    return np.stack([y, np.roll(y, 160)], 1)


def sub_drop(d=1.8, f0=72, f1=32):
    t = tt(d); ph = 2 * np.pi * np.cumsum(f0 * (f1 / f0) ** (t / d)) / SR
    return np.sin(ph) * np.exp(-t * 2.2) * env(d, .005, .3)


def whoosh(d=1.1, f0=300, f1=4200, back=False):
    x = sweep_noise(d, f0, f1, q=1.4) * (np.sin(np.pi * np.linspace(0, 1, int(d * SR))) ** 1.6)[:, None]
    # pan across
    p = np.linspace(-.7, .7, len(x)); x[:, 0] *= np.cos((p + 1) * np.pi / 4) * 1.4; x[:, 1] *= np.sin((p + 1) * np.pi / 4) * 1.4
    return x[::-1] if back else x


def reverse_swell(d=1.6):
    """A reversed cymbal: bright decaying noise, played backwards so it sucks in to the hit."""
    t = tt(d); x = filt(rng.standard_normal((len(t), 2)), 3000, 14000) * np.exp(-t * 3.2)[:, None]
    x += filt(rng.standard_normal((len(t), 2)), 600, 3000) * np.exp(-t * 5)[:, None] * .4
    return norm(x[::-1])


def thunder(d=4.5, crack=True):
    t = tt(d); n = len(t)
    rumble = filt(np.cumsum(rng.standard_normal((n, 2)), 0), 25, 220)
    rumble = norm(rumble - rumble.mean(0)) * (np.exp(-t * .9) * (1 - np.exp(-t * 12)))[:, None]
    # rolling: random swells
    roll = filt(rng.standard_normal(n), None, 3, soft=.3); roll = .6 + .4 * norm(roll)
    y = rumble * roll[:, None]
    if crack:
        c = filt(rng.standard_normal((int(.35 * SR), 2)), 900, 9000) * np.exp(-tt(.35) * 14)[:, None]
        y[: len(c)] += c * .9
    return norm(y)


def static_hiss(d, rate=15):
    """TV static, amplitude-stepping at the picture's own flicker rate."""
    n = int(d * SR); x = filt(rng.standard_normal((n, 2)), 900, 10000)
    steps = rng.uniform(.65, 1, int(d * rate) + 2); idx = (np.arange(n) / SR * rate).astype(int)
    return norm(x) * steps[idx][:, None]


def shepard(d, start_oct=0.0, speed=.9, base=55.0, voices=7):
    """Endless rising tone: octave-spaced sines glide up; a fixed log-gaussian keeps it rising forever."""
    t = tt(d); y = np.zeros(len(t))
    for v in range(voices):
        o = (v + start_oct + speed * t / d * 1.0 * d / 6.0) % voices      # octave position over time
        f = base * 2 ** o
        amp = np.exp(-0.5 * ((o - voices / 2) / 1.2) ** 2)
        y += np.sin(2 * np.pi * np.cumsum(f) / SR) * amp
    return norm(filt(y, 40, 6000))


def pad(d, freqs, bright=900, a=1.5, r=2.0):
    """Warm string-like pad: detuned saws, low-passed, slow attack."""
    x = np.zeros((int(d * SR), 2))
    for f in freqs:
        for k, det in enumerate((-.004, .0, .0045)):
            s = saw(f, d, 18, det) * (1 / 3)
            x[:, (k % 2)] += s
            x[:, 1 - (k % 2)] += s * .55
    return norm(filt(x, 50, bright)) * env(d, a, r, 1.5)[:, None]


def bell(f, d=3.0):
    """Soft struck bell/piano-ish tone (inharmonic partials, fast decay of the high ones)."""
    t = tt(d); y = np.zeros(len(t))
    for h, g, dec in [(1, 1, 1.4), (2.01, .5, 2.2), (3.0, .25, 3.0), (4.17, .12, 4.5), (5.43, .06, 6)]:
        y += np.sin(2 * np.pi * f * h * t) * g * np.exp(-t * dec)
    return norm(y) * env(d, .004, .6, 1)


def tape_stop(x, d):
    """Slow a sound to a halt (pitch + speed fall), like a reel stopping."""
    n = int(d * SR); rate = np.linspace(1, 0, n) ** 1.5; pos = np.cumsum(rate)
    pos = np.clip(pos, 0, len(x) - 2); i = pos.astype(int); fr = pos - i
    return (x[i] * (1 - fr)[:, None] + x[i + 1] * fr[:, None]) * np.linspace(1, 0, n)[:, None] ** .5


# ---------------------------------------------------------------------------
# buses
# ---------------------------------------------------------------------------
fx = np.zeros((N, 2))      # effects (get the shared room)
mus = np.zeros((N, 2))     # score
amb = np.zeros((N, 2))     # static / ambience (dry)

# --- real recordings (Kenney, CC0)
keys = [norm(load(f"click_00{i}.ogg"), .9) for i in range(1, 6)] + [norm(load(f"switch{i}.ogg"), .9) for i in (3, 7, 11)]
enter = norm(load("switch_005.ogg") if True else keys[0])
tick = [norm(load(f"tick_00{i}.ogg")) for i in (1, 2, 4)]
metal = norm(load("impactMetal_heavy_002.ogg"))
plate = norm(load("impactPlate_heavy_001.ogg"))
soft = norm(load("impactSoft_heavy_002.ogg"))
bellk = norm(load("impactBell_heavy_001.ogg"))
lowexp = [norm(load(f"lowFrequency_explosion_00{i}.ogg")) for i in (0, 1)]
glass = [norm(load(f"glass_00{i}.ogg")) for i in (1, 3, 5)]
force = norm(load("forceField_001.ogg"))

ki = 0
for c in cues:
    t0, s = c["t"], c["s"]
    if s == "key":
        k = keys[ki % len(keys)]; ki += 1
        place(fx, k, t0 - peak_at_start(k), db(-17 + rng.uniform(-2.5, 2)), pan=rng.uniform(-.25, .25))
    elif s == "enter":
        place(fx, enter, t0 - peak_at_start(enter), db(-12))
    elif s == "whoosh_big":
        w = whoosh(1.0, 200, 5000); place(fx, w, t0 - .5, db(-10))
    elif s == "sub":
        place(fx, sub_drop(2.0, 70, 30), t0, db(-7))
    elif s == "swell":
        place(fx, filt(force, None, 4000), t0, db(-20)); place(fx, reverse_swell(2.6)[::-1] * env(2.6, .8, 1.6)[:, None], t0, db(-24))
    elif s == "braam":
        place(fx, braam(3.6), t0, db(-2)); place(fx, metal, t0 - peak_at_start(metal), db(-10)); place(fx, lowexp[0], t0 - peak_at_start(lowexp[0]), db(-9))
    elif s == "reverse":
        r = reverse_swell(1.0); place(fx, r, t0, db(-16))
    elif s == "rewind":
        place(fx, whoosh(1.3, 4500, 250, back=False), t0, db(-11))
    elif s == "whoosh":
        place(fx, whoosh(.9, 260, 3800), t0 - .3, db(-13), pan=rng.uniform(-.3, .3))
    elif s == "spray":
        place(fx, sweep_noise(.8, 5000, 2500, q=2.2) * env(.8, .25, .45)[:, None], t0, db(-27))
    elif s == "lift":
        place(fx, reverse_swell(1.5)[::-1] * env(1.5, .6, .8)[:, None], t0, db(-20)); place(fx, filt(force, None, 3500), t0, db(-22))
    elif s == "settle":
        place(fx, soft, t0 + .9 - peak_at_start(soft), db(-13))
    elif s == "match":
        place(fx, bellk, t0 - peak_at_start(bellk), db(-17)); place(fx, glass[0], t0 + .05, db(-24))
    elif s == "slam":
        place(fx, plate, t0 - peak_at_start(plate), db(-9)); place(fx, sub_drop(1.6, 80, 34), t0, db(-8)); place(fx, lowexp[1], t0 - peak_at_start(lowexp[1]), db(-12))
    elif s == "impact":
        bi = braam(2.6, 36.71); bi *= np.interp(np.arange(len(bi)) / SR, [0, .35, 1.0, 2.6], [1, 1, .12, 0])[:, None]; place(fx, bi, t0, db(-2))   # ducks out for the thunder; place(fx, metal, t0 - peak_at_start(metal), db(-11)); place(fx, lowexp[0], t0 - peak_at_start(lowexp[0]), db(-8))
    elif s in ("thunder", "thunder2"):
        th = thunder(4.8, crack=True); c = filt(rng.standard_normal((int(.18 * SR), 2)), 1500, 12000) * np.exp(-tt(.18) * 30)[:, None]
        place(fx, th, t0, db(-7 if s == "thunder" else -12), pan=-.2 if s == "thunder" else .25)
        place(fx, norm(c), t0, db(2 if s == "thunder" else -6))
        place(fx, lowexp[1], t0 + .25, db(-17))
    elif s == "whoosh_long":
        place(fx, whoosh(3.2, 1800, 140), t0, db(-14))
    elif s == "shimmer":
        for q in range(14):
            g = glass[q % 3]; place(fx, filt(g, 2500, None), t0 + q * .11 + rng.uniform(0, .05), db(-30 + rng.uniform(-3, 2)), pan=rng.uniform(-.6, .6))
    elif s == "endhit":
        place(fx, soft, t0 - peak_at_start(soft), db(-12)); place(fx, sub_drop(2.4, 74, 36), t0, db(-12)); place(fx, bell(146.8, 4), t0, db(-17))

# --- ambience: TV static that follows the picture (dimmed under the title, fades as the pixels lift into 3D)
hs = static_hiss(9.4)
lvl = np.interp(np.arange(len(hs)) / SR, [0, .2, 2.3, 3.1, 5.8, 7.4, 9.4], [0, -31, -31, -24, -24, -38, -60])
place(amb, hs * db(lvl)[:, None], 0)
place(amb, static_hiss(1.6) * db(np.interp(np.arange(int(1.6 * SR)) / SR, [0, .4, 1.6], [-44, -30, -70]))[:, None], T["rewind"] + .1)   # static returns on the rewind

# --- score (D minor). D2 = 73.42 Hz
D1, D2, F2, A2, Bb1, C2 = 36.71, 73.42, 87.31, 110.0, 58.27, 65.41
# 1. opening drone under the title + hook
place(mus, pad(17.0, [D1, D2, A2], bright=500, a=2.5, r=.2), 0.0, db(-20))
# 2. Shepard riser: the pixels search for the picture (cuts dead before the snap)
sp = shepard(T["braam"] - .18 - 5.8, start_oct=0, speed=1.0)
place(mus, sp[:, None] * np.stack([1, .92]) * np.linspace(.15, 1, len(sp))[:, None] ** 1.5, 5.8, db(-21))
# 3. after the snap: a moment of wonder (Dm add9 pad), then tape-stop into the rewind
won = pad(T["rewind"] - T["braam"] + .8, [D2, F2, A2, D2 * 2 * 1.122], bright=1600, a=1.2, r=.1)
won_end = int((T["rewind"] - T["braam"]) * SR)
won[won_end:] = 0
place(mus, won, T["braam"] + .25, db(-19))
place(mus, tape_stop(pad(2.0, [D2, A2], bright=1200, a=.01, r=.01), .9), T["rewind"], db(-18))
# 4. training: Dunkirk tick accelerating + ostinato + chord walk i-VI-III-VII
t_tick, n_tick = 21.6, 0
while t_tick < 47.9:
    k = (t_tick - 21.6) / (47.9 - 21.6); iv = .72 * (1 - k) + .17 * k
    place(fx if False else mus, tick[n_tick % 3], t_tick, db(-19 + 6 * k), pan=(.2 if n_tick % 2 else -.2))
    if n_tick % 2 == 0: place(mus, sub_drop(.35, 76, 60) * env(.35, .003, .2, 1), t_tick, db(-20 + 5 * k))
    t_tick += iv; n_tick += 1
for i, (t0, ch) in enumerate([(22.0, [D2, F2, A2]), (28.5, [Bb1 * 2, D2, F2]), (34.2, [F2, A2, C2 * 2]), (39.6, [C2 * 2, 82.41, 98.0]), (44.2, [D2, F2, A2, D2 * 2])]):
    nxt = [28.5, 34.2, 39.6, 44.2, 48.0][i]
    p_ = pad(nxt - t0 + .6, ch, bright=700 + 250 * i, a=1.0, r=.6)
    place(mus, p_, t0, db(-21 + i * 1.2))
# 5. montage riser -> smash cut to silence at the black
mr = shepard(T["cut"] - .02 - 44.4, start_oct=2, speed=1.6)
place(mus, mr[:, None] * np.stack([1, .95]) * np.linspace(0, 1, len(mr))[:, None] ** 2, 44.4, db(-19))
place(fx, sweep_noise(3.0, 400, 9000, q=1.8, curve=2) * np.linspace(0, 1, int(3 * SR))[:, None] ** 2.5, T["cut"] - 3.0, db(-17))
# 6. generation: low heartbeat drone + riser; dead stop before the final impact
place(mus, pad(T["impact"] - T["slam"] + .2, [D1, D2, A2], bright=420, a=.4, r=.12), T["slam"], db(-19))
g2 = shepard(T["impact"] - .16 - T["slam"], start_oct=1, speed=1.2)
place(mus, g2[:, None] * np.stack([.94, 1]) * np.linspace(.1, 1, len(g2))[:, None] ** 1.6, T["slam"], db(-21))
# 7. resolve: D major (the picture exists), bells on "50 guesses / One image", carries the pull-back + end card
place(mus, pad(DUR - T["impact"] - .3, [D2, A2, 92.5 * 2 / 2 * 2, D2 * 2], bright=1400, a=2.2, r=3.0), T["impact"] + .5, db(-19))
for t0, f in [(65.3, 293.66), (66.0, 369.99), (66.9, 440.0), (68.2, 587.33)]:
    place(mus, bell(f, 3.5), t0, db(-21), pan=rng.uniform(-.3, .3))

# ---------------------------------------------------------------------------
# hero moments: a short dead stop of everything before the big hits (contrast is the drama)
# ---------------------------------------------------------------------------
def dip(t0, pre=.22, floor=-60, fade=.04):
    g = np.ones(N); a, b = int((t0 - pre) * SR), int(t0 * SR); f = int(fade * SR)
    g[a:b] = db(floor); g[a - f:a] = np.linspace(1, db(floor), f)
    return g

# shared room so everything sits in one space; music gets a larger hall
fx = reverb(fx, 1.8, .18, 6000)
mus = reverb(mus, 3.2, .3, 4500)
# dead stops are applied AFTER the reverb so no tail leaks into the silence
g = dip(T["braam"]) * dip(T["impact"], .2) * dip(T["thunder"], .07, -10, .02)   # short duck so the first thunder cracks through
blk = np.ones(N); a, b = int(T["cut"] * SR), int((T["cut"] + .5) * SR); blk[a:b] = 0; blk[a - 240:a] = np.linspace(1, 0, 240)
mus *= (g * blk)[:, None]; amb *= (g * blk)[:, None]; fx *= g[:, None]
mix = fx + mus * .95 + amb
mix *= np.interp(np.arange(N) / SR, [0, .05, DUR - 1.2, DUR], [0, 1, 1, 0])[:, None]
mix = np.tanh(mix / (np.abs(mix).max() + 1e-9) * 1.15) * .89      # gentle glue, no hard clipping
out = os.path.join(HERE, "mix.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_f32le", out],
               input=mix.astype(np.float32).tobytes(), check=True)
print("wrote", out, f"{len(cues)} cues")
