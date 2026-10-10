"""Shared sound-design tools: Kenney loader, filters, designed sounds (braam, whooshes, Shepard riser, thunder…)."""
import os, subprocess
import numpy as np

SR = 48000
KEN = os.environ.get("KENNEY", "")
rng = np.random.default_rng(42)


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


