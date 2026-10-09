# The caption rail, the type scale and the cut rhythm

Measured from the two September 21 recordings on 2026-09-21 (re-measurement pass, deeper than
the first study). Method: `ffmpeg` full-frame 1 fps sheets, 12 fps and 30 fps crops of the
caption band, per-row luminance scans of raw RGB frames, `cropdetect`, FFmpeg scene-change
detection at two thresholds, and a 2 fps mean-colour signal computed from 1×1 downscales.
Everything below is an observation with the measurement attached; where a number depends on an
unknown (the original canvas size), both readings are given.

Source files:
`reference_sketchy_videos/screen-20260921-190141.mp4` (A) and `…-190256.mp4` (B),
720 × 1594, 58.43 s and 60.88 s, no audio stream.
Evidence sheets: `out/ref-deep/` in the workspace.

---

## 1. The caption rail is a word-by-word narration track

This corrects the first sketch of the style. The upper text is **not** a second, independent
"small word" layer and it is not a full-subtitle line. It shows **exactly one word at a time,
horizontally centred, at a fixed vertical position**, advancing at speaking speed.

Evidence:

- A 4 s crop of the caption band at 12 fps (A, 12.4–16.4 s) reads, row by row:
  `imagine · this · you tell · your agent` — i.e. the words of the narration in order, one per
  moment, each roughly 0.4–0.9 s.
- 1 fps sheets show the same behaviour at 1 s granularity: `now · customer · machine · explain`,
  `agent · shop · domain · hosting · checkout · sentence · of`, `AI · open · account`. Unrelated
  sentences never share a frame; single words do.
- The centre of the frame carries *different* text in the same beat (big statements,
  product lockups, diagram labels). So there are two text systems, not one.
- 30 fps sampling of a word change shows the swap is effectively instantaneous
  (within one or two frames at 30 fps) — a hard replace, not a long crossfade.

Two exceptions worth copying:

1. Some scenes carry **no rail at all** — e.g. the orange "Agent Pay for Machines" product
   beat and full-frame statement beats. The rail is narration, so it stops when narration stops
   or when a scene is meant to read as a poster.
2. The rail sometimes holds a single word across a whole beat (`imagine`, `you`) when the
   narration stresses it.

## 2. Measurements

### 2.1 Rail geometry (A @14.5–16.0 s, B @3.6 s)

| Quantity | Measured in the 720 px capture | Notes |
|---|---|---|
| Glyph rows (ascender→descender) | y 223–257 = **35 px** | raw RGB row scan, brightness > 150 |
| Cap/x-height band | ≈ 27–28 px | baseline ≈ y 250 |
| Horizontal position | centred on the frame centre | verified in 6-column 12 fps tiles |
| Vertical position | ≈ 13 % down the video card (card ≈ y 75–1420) | 250 → ≈ 0.13 |

Scale conversion. The reel is displayed inside a rounded card ≈ 682 px wide inside the 720 px
capture. Instagram renders reels at 1080 × 1920 and downscales, so the likely mapping is
**0.63×**: the 35 px glyph band corresponds to ≈ 56 px on a 1080-wide canvas.
(If the artwork had been authored at 720 px wide there would be no downscale and the value would
be ≈ 35–38 px. The 1080 reading is the better bet; it also matches the *perceived* size on a
phone.)

### 2.2 Centre statements use the same size (A @14.0 s, A @28.6 s)

Row scans of the two-line centre statements ("payment network / built only for AI agents",
"Now multiply that / by every business on Earth.") give glyph bands of 31–35 px with a
40–46 px line pitch — i.e. **the same optical size as the rail**, not larger. The centre text
feels bigger because it is 2 lines, centred in empty space; the size is doing no work.

### 2.3 Emphasis display type is a different register

Condensed display lines ("TRILLIONS of dollars", "financial system", "5000 yrs", "feel digital")
reach a glyph band of **≈ 60–85 px** in the same capture, roughly 2–2.5× the statement size, and
usually occupy a full-width line. These appear briefly, never as the everyday voice.

### 2.4 Practical 1080 × 1920 starting values

| Role | Start at | Reasoning |
|---|---|---|
| Word rail | **54 px**, weight 400, letter-spacing ≈ 0.01em, one line | 56 px from the 0.63× mapping, minus a little for optical weight |
| Word rail, emphasised word | same size, weight 600 | emphasis in these reels is weight, not size |
| Rail baseline | y ≈ **250** (or 13 % of the video height) | direct measurement |
| Centre statement | 54–58 px, 1.25 line-height, max-width ≈ 820 px | measured to be the same size as the rail |
| Diagram label | 28–34 px | the reference labels are small; going slightly larger is a readability improvement |
| Display / emphasis | 120–150 px condensed, used 2–4 times per reel | 2–2.5× the statement size |

Keep honest about uncertainty: the capture is compressed, rescaled and overlaid with platform
chrome, so these are reconstruction values, not recovered source values.

## 3. Cut rhythm and world alternation

### 3.1 Reel A — a light/dark alternation

Scene-change detection (threshold 0.07) plus a 2 fps mean-luminance signal give an approximate
cut list: **3.7, 8.2–8.4, 14.2, 26.8, 29.6, 43.3, 50.0, 53.1, 56.0 s**.

Mean luminance classifies the reel into two worlds that alternate with big jumps:

```
BLACK/dark   0–3.7      hook + logo
LIGHT        3.7–8.2    "newest customer", white robot group
dark/orange  8.2–14.2   product beat (the one scene with no rail)
BLACK        14.2–29.6  prompt → agent workflow → statement        (luminance jump −28 at 27.0)
LIGHT        29.6–42.5  quote panel → robot → blocked bank → bullets (+188 at 29.6)
BLACK        43.0–50.0  metallic people, historical contrast
LIGHT        50.0–53.0  short centred thesis (+175 at 50.0)
BLACK        53.0–58.4  stablecoin ring and connective network (−187 at 53.0)
```

The jumps of ±150–190 luminance are the *point*: the reel reframes by changing world, not by
adding a transition effect. Each light scene is a substantively different context.

### 3.2 Reel B — one dark world, local luminance only

Cuts ≈ **2.2, 6.2, 9.9, 26.5, 29.3, 31.7, 36.4, 38.4, 39.6–39.8, 53.5, 58.1, 59.8 s**.
The mean-luminance signal stays in `dark`/`BLACK` for virtually the whole reel; the largest
jumps are only +30 to +64. B therefore does **not** alternate worlds. It varies contrast
locally: a green chart floor, a lit vault dial, a silver clock face, a white monitor screen
inside a black frame, a lens-flare highlight in a corner.

Copy the distinction: within one reel, either alternate worlds hard (A) or hold one world and
place local luminance events (B). Mixing both idioms in one short reel reads as indecision.

### 3.3 Beat length

Both reels run 3–6 s per scene and change *internally* during the scene (a stack descends, a
chart marker climbs, a figure becomes a group). Cuts cluster around argument boundaries, roughly
every 4–7 s. Nothing in the sample cuts faster than ~2 s, and no scene cuts back to a previous
world except as a deliberate structure (A returns to light at 50 s for a thesis reset).

## 4. Implementing the rail in HyperFrames

The rail is the one part of this style that is cheap to get exactly right and it is what makes a
reel feel edited rather than designed. Build it as timed clips, **not** as a callback that
rewrites `textContent` (arbitrary seeking can skip callbacks and show the wrong word).

### 4.1 Shape

```html
<!-- one clip per word, on its own track, above every scene -->
<section id="w-0007" class="clip cap" data-start="4.30" data-duration="0.42" data-track-index="9">
  <div class="cap-word">trillion</div>
</section>
```

```css
.clip { position: absolute; inset: 0; overflow: hidden; }   /* full-frame slot */
.cap  { pointer-events: none; z-index: 90; display: block; } /* above scene content */
.cap-word {
  position: absolute; left: 50%; transform: translateX(-50%);
  top: 218px; width: 900px; text-align: center;
  font: 400 54px/1 InterLocal; letter-spacing: .01em;
  color: #f3f4f1;
}
.cap-word.is-strong { font-weight: 600; }
/* light-world scenes need the ink flipped — scope by scene class on a wrapper you control */
```

Practical points:

- One word per clip, all on one track, is the most inspectable form. Twenty-two such clips on
  one track triggers `timeline_track_too_dense` — that is a *warning*, not an error; the
  Google×Wiz study ships that way. Split the rail into a sub-composition when you want a clean report.
- Keep the rail **outside** any camera wrapper, so a reframe never moves the narration.
- For light scenes, either duplicate the rail with a dark ink colour or put the ink colour on a
  child element you can tween; never tween a `.clip` element itself.
- Hard replace (no fade) is what the reference does. If you want a soft version, fade *in* only:
  `fromTo(el, {opacity:0, y:8}, {opacity:1, y:0, duration:.14}, start)`.

### 4.2 Generating the rail from the voice track

1. Get word timestamps: `hyperframes transcribe assets/audio.mp3 --json` (Parakeet if installed,
   else `--model small.en`). Output is a segment array with `words: [{start,end,word}]`.
2. Run the bundled generator (`scripts/build-word-rail.mjs`, see below) to emit the clips.
3. Paste the block into `index.html` above the scene sections, or into
   `compositions/caption-rail.html` and mount it with `data-composition-src`.
4. Re-run `check` — the rail changes the timed-clip count, so re-verify layout and contrast.

```bash
node scripts/build-word-rail.mjs \
  --transcript reels/cyber/assets/transcript.json \
  --out reels/my_reel/caption-rail.html \
  --top 218 --size 54 --min-hold .22 --emphasis strong-words.txt
```

The generator:

- clamps every word to a minimum hold (`--min-hold`) and to the next word's start, so words never
  overlap and short words stay readable;
- prefixes ids with a stable `w-####` so a diff stays readable across re-runs;
- marks emphasis by rule: capitalised tokens, numbers/currency, and any word listed in the
  optional emphasis file get `is-strong`;
- uppercases nothing by default — the reference rail is sentence case, while the *centre*
  statements are often uppercase;
- drops punctuation-only tokens and never emits a zero- or negative-length clip.

## 5. Failure modes to avoid

| Symptom | Cause | Fix |
|---|---|---|
| Wrong word appears after seeking backward | one node rewritten by callbacks | one timed clip per word |
| The rail drifts during a camera move | rail inside the camera wrapper | move it out, or put the camera on a sibling |
| Rail unreadable on light scenes | white ink on light background | scene-scoped ink colour |
| Text jumps a frame at each swap | a CSS `transition` on the word | animate with GSAP only |
| Lint warning about a dense track | 20+ caption clips on one track | split into a rail sub-composition |
| Words overlap or collide | durations taken raw from ASR | clamp to `min(hold, next.start - start)` |
