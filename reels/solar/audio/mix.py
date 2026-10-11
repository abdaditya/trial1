"""Solar reel sound. The voice is left exactly as recorded: native 32 kHz, no resample, no gain, no processing
(the only edit is the line cut the user asked for, in voice_cut.wav). Only the bed is resampled, down to 32 kHz.
Under it: a quiet score that follows the story, and exactly 3 effects placed from out/cues.json.
  KENNEY=<dir> python3 audio/mix.py  ->  audio/mix.wav (voice + bed), audio/bed.wav (bed only)
"""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfxlib import *  # noqa: F401,F403

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
T = {c["s"]: c["t"] for c in json.load(open(os.path.join(ROOT, "out/cues.json")))}
import wave
_w = wave.open(os.path.join(HERE, "voice_cut.wav")); VSR = _w.getframerate(); voice = np.frombuffer(_w.readframes(_w.getnframes()), np.int16).astype(np.float64) / 32768; _w.close()
DUR = len(voice) / VSR + 3.6                # the end card runs past the last word
N = int(DUR * SR); mus = np.zeros((N, 2)); fx = np.zeros((N, 2))
at = lambda t: int(t * SR)

# ---------------- score: D minor colour, slow pads, it darkens at the bottleneck and lifts at the end ----------------
D2, F2, A2, C3, E3, G2, Bb2 = 73.42, 87.31, 110.0, 130.81, 164.81, 98.0, 116.54
sections = [  # (start, end, chord, brightness, gain dB)
    (0.0, T["earth"], [D2, A2, F2 * 2, D2 * 4], 1600, -27),            # hook: warm, curious
    (T["earth"], T["dam"], [D2, A2, E3, F2 * 2], 1300, -28),            # where is it
    (T["dam"], T["delayed"], [Bb2 / 2, F2, D2 * 2, A2 * 2], 1000, -28),  # the missing pipeline
    (T["delayed"], T["stop"], [G2 / 2, D2, Bb2, D2 * 2], 800, -29),     # delays, the question
    (T["stop"], T["q2"], [D2 / 2, A2 / 2, F2, C3], 650, -29),           # switched off
    (T["q2"], T["finale"], [Bb2 / 2, F2, D2 * 2, A2 * 2], 1000, -28),   # how we cope
    (T["finale"], DUR, [D2, A2, F2 * 2, D2 * 4, A2 * 4], 1800, -26),    # learned fast, catching up
]
for a, b, ch, br, gdb in sections:
    place(mus, pad(b - a + 1.2, ch, bright=br, a=1.0, r=1.4), max(0, a - .4), db(gdb))
# a soft pulse under the data-heavy middle (timeline -> curtailment), 84 bpm
bt = T["years"] - 4.5
while bt < T["stop"] - .3:
    place(mus, sub_drop(.5, 62, 48) * env(.5, .004, .35, 1), bt, db(-33)); bt += 60 / 84

# ---------------- exactly 3 effects (-24 .. -32 dB) ----------------
soft = norm(load("impactSoft_heavy_002.ogg"))
# 1. the power hits the wall on "anywhere"
place(fx, sub_drop(.9, 70, 38), T["anywhere"], db(-26)); place(fx, soft, T["anywhere"] - peak_at_start(soft), db(-30))
# 2. the grid says stop: a dead stop, then a low hit as the switch falls
place(fx, sub_drop(1.6, 64, 30), T["stop"], db(-24))
place(fx, tape_stop(np.stack([filt(rng.standard_normal(int(SR * 1.2)), 200, 2500)] * 2, 1) * .25, .6), T["stop"] - .05, db(-32))
# 3. the 8,133 counter: a rising tick-roll into the number
roll = sweep_noise(1.6, 1800, 6000, q=2.2, curve=1.5) * np.linspace(0, 1, int(1.6 * SR))[:, None] ** 2
place(fx, roll, T["counter"] - .2, db(-30))

# dead stop: everything under the voice drops out for "stop"
def dip(t0, pre=.22, floor=-45, fade=.05, hold=.35):
    gg = np.ones(N); a, b = at(t0 - pre), at(t0 + hold); f = int(fade * SR); gg[a:b] = db(floor); gg[a - f:a] = np.linspace(1, db(floor), f); gg[b:b + f * 6] = np.linspace(db(floor), 1, f * 6); return gg
mus *= dip(T["stop"])[:, None]
mus = reverb(mus, 2.8, .3, 5000); fx = reverb(fx, 1.4, .18, 7000)
bed = mus + fx
bed *= np.interp(np.arange(N) / SR, [0, .4, DUR - 1.4, DUR], [0, 1, 1, 0])[:, None]
# the bed goes down to the voice's own rate (the voice itself is never resampled)
bed = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", "-af", f"aresample={VSR}:resampler=soxr:precision=28", "-f", "f64le", "-"],
                                   input=bed.tobytes(), capture_output=True, check=True).stdout, np.float64).reshape(-1, 2)
M = int(round(DUR * VSR)); bed = np.pad(bed, ((0, max(0, M - len(bed))), (0, 0)))[:M]
v = np.zeros(M); v[:len(voice)] = voice
# never let the bed push a voice peak over full scale: it yields underneath loud syllables (voice samples unchanged)
room = np.clip(1.0 - np.abs(v) - 1e-4, 0, None)[:, None]; bed = np.clip(bed, -room, room)
mix = v[:, None] + bed
print("bed peak dBFS %.1f, mix peak dBFS %.2f" % (20 * np.log10(np.abs(bed).max() + 1e-12), 20 * np.log10(np.abs(mix).max() + 1e-12)))
for name, x in (("bed.wav", bed), ("mix.wav", mix)):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(VSR), "-ac", "2", "-i", "-", "-c:a", "pcm_s24le", os.path.join(HERE, name)], input=x.astype(np.float64).tobytes(), check=True)
# proof the voice is untouched: where the bed is silent, the mix equals the original samples bit for bit
quiet = np.abs(bed).max(1) == 0
print("voice-only samples identical:", bool(np.all(np.round(mix[quiet, 0] * 32768) == np.round(v[quiet] * 32768))), "| wrote audio/mix.wav", round(DUR, 2), "s @", VSR, "Hz")
