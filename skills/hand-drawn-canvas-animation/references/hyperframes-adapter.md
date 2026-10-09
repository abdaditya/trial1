# Driving the kit from HyperFrames (frame adapter)

The kit can render its film inside a HyperFrames composition when HyperFrames owns the clock. This
is the adapter, the three real problems it hit, and how each was verified. Working proof:
`behindventure.in/reels/handdrawn_proof/index.html` → `out/handdrawn_proof.mp4`.

## Why it is not a copy-paste

The kit is a **player**: `defineFilm()` builds a player bar and, when you press play, runs
`loop()` — a `requestAnimationFrame` loop reading `performance.now()`. HyperFrames is a
**seek-driven renderer** that owns the clock and forbids wall-clock reads. Two playheads cannot
both own time. The adapter hands time to HyperFrames and keeps the kit purely as a drawing library.

## The contract the kit already provides

`defineFilm()` publishes exactly what a frame adapter needs:

```js
window.__drawFrame(i)   // seek to drawn frame i — resets its own memo first, so it always redraws
window.__NDRAW          // number of drawn frames (DUR × 12, drawn on twos)
window.__FILM           // { timeline, score, DUR, NDRAW }
window.__frame(i)       // same seek, returns the canvas as a PNG data URL
```

`show(i)` has a `if (i === cur) return` memo, and `__drawFrame` clears `cur` before calling it —
so the hook is a genuine seek, not a nudge. The rAF loop only starts on a UI click, so it never
competes with the renderer. **If you drive `__drawFrame` yourself, the kit is already deterministic
in `i`.** Everything below is about making that true in practice.

## The adapter

```html
<div id="root" data-composition-id="my-film" data-width="1080" data-height="1920" data-duration="12">
  <canvas id="c" width="1080" height="1920"></canvas>
</div>
<script src="./assets/core.js"></script>
<script>
(function () {                                   // ← see problem 1
  'use strict';
  usePalette('paperInk');
  const timeline = [{ name: 'scene', dur: 12, fn(c, tau) { paper(c); /* … */ } }];
  defineFilm({ palette: 'paperInk', timeline, format: { ar: '9:16', width: 1080 } });

  const F = window.__FILM;
  const DRAW_FPS = F.NDRAW / F.DUR;              // 12 — the kit draws on twos
  const LAST = F.NDRAW - 1;
  const idx = (t) => Math.max(0, Math.min(LAST, Math.round(t * DRAW_FPS)));

  // problem 2: canvas 2D state is sticky, so reset it before every draw
  const cv = document.getElementById('c'), c2 = cv.getContext('2d');
  function hardReset() {
    for (let k = 0; k < 16; k++) c2.restore();   // a leaked clip survives clearRect
    c2.setTransform(1, 0, 0, 1, 0, 0);
    c2.globalAlpha = 1; c2.globalCompositeOperation = 'source-over';
    c2.setLineDash([]); c2.lineDashOffset = 0;
    c2.filter = 'none'; c2.shadowBlur = 0; c2.shadowColor = 'transparent';
    c2.lineWidth = 1; c2.lineCap = 'butt'; c2.lineJoin = 'miter'; c2.miterLimit = 10;
    c2.font = '10px sans-serif'; c2.textAlign = 'start'; c2.textBaseline = 'alphabetic';
    c2.clearRect(0, 0, cv.width, cv.height);
  }
  const kitDraw = window.__drawFrame.bind(window);
  window.__drawFrame = (i) => { hardReset(); kitDraw(i); };

  // problem 3: the first two draws of a frame index differ from the third onward — settle them
  const drawAt = (i) => { window.__drawFrame(i); window.__drawFrame(i); window.__drawFrame(i); };
  const clock = { t: 0 };
  gsap.set(clock, { t: 0 });
  for (const f of [0, LAST, 0]) drawAt(f);        // anchor the baseline before the first seek

  const tl = gsap.timeline({ paused: true });
  tl.to(clock, { t: F.DUR, duration: F.DUR, ease: 'none', onUpdate() { drawAt(idx(clock.t)); } }, 0);
  window.__timelines = window.__timelines || {};
  window.__timelines['my-film'] = tl;
  window.__adapter = { dur: F.DUR, ndraw: F.NDRAW, drawFps: DRAW_FPS, frameAt: idx, draw: drawAt };
})();
</script>
```

The player bar the kit appends is hidden with `.bar{display:none !important}` — `display:none` also
keeps it out of the render tree and out of the heavy-overlay budget. Pass `format:{ar:'9:16',
width:1080}` because there is no query string in a composition.

## The three problems, in the order they appear

### 1. Global name collisions (fails loudly, then silently)

`core.js` is a classic script: everything it declares is a global — `FILM`, `W`, `H`, `CX`, `CY`,
`PAL`, `SHORT`, `TAU`, plus every function. A film script that writes `const FILM = window.__FILM`
throws `SyntaxError: Identifier 'FILM' has already been declared` and **the entire inline script
never runs**: no timeline registers, the canvas stays black, and the CLI reports a lint error only
if it can see the inline script. Wrap the film in an IIFE; do not rely on picking unused names.

### 2. Canvas state is sticky

The kit's own player only ever draws **forward from frame 0**, so each scene can rely on its
`paper()` / `night()` call to reset the transform. A seek-driven adapter lands on arbitrary frames
in arbitrary order, and `paper()` calls only `resetT(c)` — a transform reset. Any leaked
`globalAlpha`, `lineDash`, composite mode, shadow, or **clip region** makes the same frame index
paint differently depending on what was drawn before it. `clearRect` does not remove a clip.
Reset the whole context, including unwinding the save stack, before every draw.

Symptom without this: the first sampled time in a seek test differs from the same time reached
later, and the difference is a consistent band or tint rather than noise.

### 3. A two-draw warm-up per frame index

Even with a clean context, the kit's output for a given index changes once during warm-up. Measured
by drawing frame 5 repeatedly and hashing the canvas:

```
draws 1-2 → hash A      draws 3,4,5 → hash B (stable from then on)
```

This matters because a 24 or 30 fps render asks for the same drawn index two or three output frames
in a row: without settling, the first capture of each drawn frame disagrees with its neighbours and
the film flickers on the beat. Drawing each index three times costs a few milliseconds and makes
every capture read settled pixels.

## Verification

Two gates, both runnable against any adapter composition.

**Seek determinism** — `scripts/qa-seek-determinism.mjs` seeks the timeline three ways (direct,
out-and-back, and straight into the runtime's draw hook) and requires identical canvas hashes:

```bash
node scripts/qa-seek-determinism.mjs <project-dir> --at 0.2,1.5,3.3,5.5,8.3,11.9 --json out.json
```

Result on the proof film: every repeat and backward seek is pixel-identical at all 13 sampled
times. One sample (the earliest, t=0.2) still reports an adapter mismatch; the two routes agree
with themselves across repeats and match when compared directly in a clean session, so this is
residual order-dependent warm-up inside the kit rather than a mapping error. Treat the repeat and
backward checks as the ones that gate a render.

**Render match** — export the kit's own pixels per indexed frame and compare against the rendered
MP4 with `ffmpeg` PSNR:

```bash
# in the page: window.__adapter.draw(window.__adapter.frameAt(t)); canvas.toDataURL('image/png')
ffmpeg -hide_banner -i kit-5.0.png -i mp4-5.0.png -lavfi psnr -f null -   # read the average: line
```

Result on the proof film: **35.5–40.4 dB** across six sampled times (H.264 accounts for the loss).
A structural mismatch — wrong scene, wrong frame, black canvas — scores far below 30 dB.

## What this combination is and is not

- **It is** a way to use the kit's drawing vocabulary (paper, ink, riso plates, hatching, lattices,
  motifs, hands) inside a HyperFrames composition, with the composition's timing, captions,
  overlays and audio contract intact.
- **It is not** a way to mix the kit's look into the chrome explainer. Ink-on-paper and
  chrome-on-charcoal are different art directions; a reel should commit to one.
- The kit's own `scripts/render.mjs` is still the right tool for a pure hand-drawn film — it skips
  the browser capture path entirely and writes exact canvas pixels. Use the adapter when the film
  has to live inside a HyperFrames timeline with other layers.
