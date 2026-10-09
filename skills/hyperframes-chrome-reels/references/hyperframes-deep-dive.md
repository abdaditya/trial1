# HyperFrames in depth — the framework behind these reels

Research date: 2026-09-21. Local executable: HyperFrames **0.8.46** at
`/Users/apple/Desktop/behindventure.in/hyperframes/packages/cli/bin/hyperframes.mjs`.
Everything marked **verified** was read from the local `hyperframes/` checkout (docs,
skills, CLI `--help`) or produced by running the CLI locally. Re-check after an upgrade.

Read this when you need to know *what the framework actually gives you* before deciding
how to build a scene. Read [implementation.md](implementation.md) for the style-specific
code patterns and [reference-analysis.md](reference-analysis.md) for the reference reels.

---

## 1. The one-sentence model

HyperFrames is a **seek-driven HTML-to-video renderer**: your HTML declares *what exists and
when* through `data-*` attributes, CSS/SVG decide *what it looks like*, and one paused GSAP
timeline decides *how it changes*. The renderer never plays your page — it asks "what does
frame 90 look like", seeks every animation runtime to exactly `90 / fps`, screenshots, and
hands frames to FFmpeg.

Consequences that change how you author:

- Any state that is not a pure function of time is a bug (clocks, unseeded random, input, network).
- Screenshots of *the same time* must be identical no matter what frame was requested before.
- A "transition" is just two clips overlapping plus tweens; there is no transition engine to fight.

## 2. The four layers you author

| Layer | Owns | Never used for |
|---|---|---|
| HTML `data-*` | start, duration, track lane, media offset, nested composition mounting | creative motion |
| CSS | layout, material, gradients, masks, `z-index`, `@font-face` | time |
| SVG / canvas | precise geometry: paths, rings, charts, bevels, routes | layout of ordinary text |
| JS + GSAP | every change over time on one paused timeline | showing/hiding clips, playing media |

If a scene needs a decision at 14.2 s, that decision belongs in HTML timing or in a tween
position — not in a callback that may be skipped by a backward seek.

## 3. Composition contract (verified)

### 3.1 Composition root

| Attribute | Required | Meaning |
|---|---|---|
| `data-composition-id` | yes | unique id; **must equal the `window.__timelines` key** |
| `data-start="0"` | yes on the top-level root | start of the composition |
| `data-width` / `data-height` | yes | authored frame size in px (e.g. `1080` / `1920`) |
| `data-duration` | usually | total render length, read **before** scripts run |
| `data-no-timeline` | only | tells the runtime not to wait for a timeline |

Two root shapes, not interchangeable:

- **Standalone** `index.html`: the root `<div data-composition-id>` sits directly in `<body>`.
  Wrapping it in `<template>` is a lint **error** (`standalone_composition_wrapped_in_template`).
- **Sub-composition** loaded with `data-composition-src`: wrap the root in `<template>`.
  The assembler drops that file's own `<head>` styles/scripts, so put `<style>` and `<script>`
  **inside** the template.

Author `#root` as `width: 100%; height: 100%` — the runtime stamps the `data-width/height`
pixels onto it. Hardcoding `1080px` on the root is a silent layout bug.

### 3.2 Timed clips

| Attribute | Meaning |
|---|---|
| `id` | stable identifier for timing, animation and frame injection |
| `data-start` | seconds, or a relative expression: `intro`, `intro + 0.5`, `intro - 0.5` |
| `data-duration` | visible slot length; required for DOM/image/nested clips |
| `data-track-index` | Studio lane only — the render ignores it and it does **not** control paint order |
| `class="clip"` | supplies the full-frame box; the runtime keys visibility off `data-start` |

Paint order is CSS `z-index`, never track index. Two clips may overlap on one track.
A relative `data-start` resolves only inside the same composition, needs a known duration for
the referenced clip, and may not form a cycle.

### 3.3 Media

| Attribute | Applies to | Meaning |
|---|---|---|
| `data-media-start` | `<video>`, `<audio>` | offset into the source file (trim). The engine's audio mixer reads **only** this name |
| `data-playback-start` | nested composition host | child-timeline offset; Studio writes this name |
| `data-playback-rate` | video, audio, nested | `0.1`–`5` |
| `data-volume` | video, audio | `1` = 0 dB, `0` = silence, up to `3.98` (+12 dB) |
| `data-has-audio="true"` | video | declares that the video contributes audio |

Rules that bite (each is a silent failure, not a warning):

- For a `<video>`/`<audio>` trim, use `data-media-start`. If you author only
  `data-playback-start`, the picture is trimmed but the audio renders **untrimmed**.
- Never `play()`, `pause()`, or set `currentTime` from a script.
- Every `<audio>` needs an `id` (`media_missing_id`) or the mixer never finds it → silent render.
- Never put `crossorigin` on timed media (`media_crossorigin_breaks_preview`, error, no suppression).
- Never put `<video data-start>` inside a plain element that also has `data-start`
  (`video_nested_in_timed_element`). Time the wrapper *or* the video. Sub-composition hosts are exempt.

### 3.4 Nested compositions and variables

```html
<div data-composition-id="card-pro"
     data-composition-src="compositions/card.html"
     data-start="0" data-duration="3" data-track-index="1"
     data-variable-values='{"title":"Pro","color":"#ff4d4f"}'></div>
```

- `data-composition-src` paths resolve from the **project root**, not from the referencing file.
- Give the host slot, the inner template root, and the `window.__timelines[key]` key the same id.
- Declare per-instance values on the child root with `data-composition-variables`
  (`[{id,type,label,default}]`) and read them with `window.__hyperframes.getVariables()`.
  HyperFrames does not wire `data-var-*` into your DOM for you.
- A child timeline can never animate host-root elements. Keep the child self-contained.

**Why this matters for the reference style:** each 3–6 s beat of a reel is a natural
sub-composition (`compositions/beat-trust.html`), which is also what the linter asks for when a
single file's track gets dense (`timeline_track_too_dense`, which the Google×Wiz study triggers).

## 4. The timeline contract

```js
const tl = gsap.timeline({ paused: true });
tl.fromTo('#hero', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .7, ease: 'power3.out' }, 1.2);
window.__timelines['my-composition-id'] = tl;   // key === data-composition-id
```

- Exactly **one** paused timeline per composition; register it after the build completes.
- The runtime creates the `__timelines` registry before your inline script runs; you do not need
  `window.__timelines = window.__timelines || {}` (harmless, but not required).
- Render length is the root `data-duration`, **not** the timeline length: a longer timeline is cut
  off, a shorter one holds its last frame. `data-duration` is compiled once and cannot be changed
  by a script or a variable.
- `document.fonts.ready(...)` builds are supported — but never register the key before the tweens
  exist (`gsap_timeline_registered_before_async_build`).
- Never `tl.play()` for render-critical motion. Never create empty tweens just to pad duration —
  use clip durations.
- Verified runtime globals (`packages/core/src/inline-scripts/runtimeContract.ts`):
  `__timelines`, `__player`, `__playerReady`, `__renderReady`, `__clipManifest`.

### 4.1 Seeking rules

- Use `fromTo` with explicit from-states so t=0 is correct under a direct seek.
- Use absolute values; a relative `+=` tween has no stable meaning after seeking backward.
- Re-owning a target later needs `immediateRender: false` or the second tween renders its
  from-state early.
- State must be a pure function of timeline time — no mutable trackers, no counters incremented
  in callbacks.
- Give important tweens an explicit position parameter so reordering edits don't shift the beat.

### 4.2 Property policy

`lint` enforces a **denylist**, not an allowlist, so `filter`, `clipPath`, `strokeDashoffset`,
`width`, `height` are all legal. Preference order for quality and speed:

1. `x` / `y` / `scale` / `rotation` / `opacity`,
2. paint-only properties (`color`, `backgroundColor`, `borderRadius`, `filter`, `clipPath`),
3. geometry properties when a diagram genuinely grows (`strokeDashoffset`, `scaleX` on a sized block).

Never tween `display`, raw `visibility`, or `autoAlpha` on a `class="clip"` element —
the framework owns clip visibility (`gsap_animates_clip_element`). Animate a child instead.

## 5. Determinism: the actual bans

Banned for anything that affects pixels:

- `Date.now()`, `performance.now()`, `requestAnimationFrame`, any wall clock.
- Unseeded `Math.random()` (use an index-derived or seeded pseudo-random).
- Render-time network fetches for required assets — bundle fonts, scripts, images, audio locally.
- Hover / scroll / pointer / focus state; the renderer sends no input.
- `repeat: -1`. Compute a finite count:
  `repeat: Math.max(0, Math.floor(duration / cycle) - 1)` — `ceil` overshoots `data-duration`
  and trips `gsap_repeat_ceil_overshoot`; a negative repeat becomes infinite.
- Two timelines animating the same property of the same element at the same time (overwrite order
  can flip between renders).

Layout contract that follows from seeking:

- Build the visible end-state in CSS first, then animate *from* a state.
- No `<br>` in body text — forced breaks ignore the rendered font and cause overlap; let text wrap
  with `max-width` (short display titles are the exception).
- Anything you scale must be block-level and sized; `scaleX` on an inline `<span>` is a no-op.
- Measure the DOM at build time only. In a multi-scene file later clips may not be laid out yet,
  so use authored constants; `lint` flags tween-time measurement patterns.
- Pulsing or overshooting decoratives need clearance at their **peak** size, plus `overflow` room.

## 6. What a render actually does

Verified phases (from a local render log):

```
compile  → resolve root data-duration, width/height, embed local fonts as data URIs
extract  → pre-extract frames for any <video> sources (none needed for vector-only reels)
hdr      → detect HDR sources, choose SDR/HDR path
audio    → mix <audio>/<video> tracks, apply trims, feed FFmpeg
file_server → serve the compiled project over a loopback HTTP server
capture  → Chrome loads the page, seeks frame by frame, grabs each frame
encode   → FFmpeg encodes during capture
assemble → mux audio, write the container
```

Two capture paths: Chrome's atomic `HeadlessExperimental.beginFrame`, or a **screenshot** fallback.
Local evidence: on an 8 GB machine the producer reports
`Low-memory render profile active — screenshot capture, auto-worker calibration skipped, pinned to 1 worker`,
and `mix-blend-mode` forces `drawElementImage` off. Practical guidance for this style:

- Expect ~40 s of capture for 900 frames at 1080×1920 on one worker (measured: 44.3 s total, 3.9 MB).
- `--docker` pins Chromium + fonts + FFmpeg when pixel-exact reproducibility across machines matters.
- Use `--quality draft` while iterating, `looks` (default, CRF 16) for the first real encode,
  `delivery` for final.

**Sandbox note (this workstation):** anything that opens a browser session binds a loopback
server, so `render`, `check` and `snapshot` all need permission to listen on `127.0.0.1`.
Observed behaviour under a restricted sandbox:

- `render` dies at `Starting frame capture`, exit status 1, **no error text at all**.
- `check` returns `ok:false` with the finding `check_runtime_failure: listen EPERM: operation not
  permitted 127.0.0.1`, `runtime.ok:false` — and, because the browser never opened, `layout`
  reports 0 samples and `contrast` 0/0, which silently *looks* like a clean run.

Both succeed when run outside the sandbox. Never trust a `check` report with `layout.samples === 0`.

## 7. Lint — the failures you will actually hit

These are caught, but only after you write them. Write them right the first time:

| Code | Trigger | Fix |
|---|---|---|
| `gsap_css_transform_conflict` | CSS `transform` + GSAP tween on the same property/node | set the start state inside `fromTo` |
| `media_crossorigin_breaks_preview` | `crossorigin` on timed media | delete it |
| `video_nested_in_timed_element` | `<video data-start>` inside an element with `data-start` | time one of them |
| `media_missing_id` | `<audio>` without `id` | add an id (else the render is silent) |
| `gsap_animates_clip_element` | tweening `autoAlpha`/`visibility` on `.clip` | animate a child |
| `font_family_without_font_face` | named font with no in-file `@font-face` | declare the local file |
| `standalone_composition_wrapped_in_template` | `<template>` around a standalone root | unwrap |
| `gsap_timeline_registered_before_async_build` | key registered before async build finishes | register at the end |
| `gsap_repeat_ceil_overshoot` | `repeat` computed with `ceil` | use `floor` + `max(0, …)` |
| `timeline_track_too_dense` | many timed elements on one track | split scenes into sub-compositions |

**A lint error switches off the layout and contrast audits.** `check` then reports
`0 sample(s)` / `0/0 text checks`, which reads like a clean file and means nothing ran.

## 8. CLI workflow that matches this style

```bash
HF="node hyperframes/packages/cli/bin/hyperframes.mjs"   # or npx hyperframes

$HF lint                                     # static structure
$HF check --at 0.5,1.8,4.9,8.5,12.7,22.5     # runtime + layout + contrast gate (includes lint)
$HF snapshot --at 2.5,6.4,14.2,22.5,26.8 --output review/snapshots
$HF snapshot --zoom ".caption-word" --at 3.0 # high-density crop of one element
$HF snapshot --against reference.mp4 --at 5,15,25   # render|reference pair sheets
$HF preview --background                     # Studio; hand the URL to the user
$HF render -o out.mp4 --fps 30 --quality looks
ffprobe -v error -show_format -show_streams out.mp4
```

Commands that matter for analysis and iteration:

| Command | Use it for |
|---|---|
| `catalog --query "<the move you want>"` | find an existing block/component before hand-authoring |
| `add <name>` | install that block into the project |
| `transcribe <audio> --json` | **word-level timestamps** — the input to a caption rail |
| `tts` | local narration (Kokoro-82M) when there is no voice track |
| `beats <audio>` | beat grid for music-driven cutting |
| `keyframes` | onion-shot diagnostics for camera/keyframe work |
| `compare` / `grade-compare` | labelled A/B sheets between takes or grades |
| `info` / `compositions` | project metadata and the composition list |
| `doctor` | missing Chrome/FFmpeg before a long render |

The `check` report shape (verified): `{ok, lint, runtime, layout, motion, contrast, hdr, snapshots, _meta}`.
A trustworthy pass needs non-zero `contrast.checked` **and** zero lint errors.

## 9. Registry: do not hand-author what already exists

394 registry moves are indexed locally; `catalog --query` searches them by intent (semantic
search needs a one-time on-device model download, local word match works offline). Directly
relevant to this style:

| Item | What it gives you |
|---|---|
| `caption-editorial-emphasis` | dual-font size contrast for emphasis words |
| `caption-weight-shift` | elegant font-weight transition between lines |
| `caption-pill-karaoke` | per-word karaoke highlight inside a pill |
| `caption-kinetic-slam` | full-screen single-word entrances |
| `mk-callout-highlight` | word-by-word emphasis driven by one scalar — closest to the reference rail |
| `per-word-crossfade` | calm word arrival (fade + short vertical drift) |
| `state-chip-rail` | mono status chips advancing a seek-safe state machine |
| `camera-dolly-zoom`, `cinematic-zoom`, `camera-rig-depth-stack` | reframes |
| `before-after-wipe`, `chromatic-radial-split` | motivated scene boundaries |
| `animated-bar-chart`, `chart-story` | data beats |

Component *code* is a starting point, never the final art direction: install it, then re-material
it to the charcoal/chrome/green system.

## 10. Mapping the reference-reel grammar onto HyperFrames primitives

| What the reference does | HyperFrames primitive |
|---|---|
| One word at a time in a top rail | one `.clip` per word on its own track, timed from `transcribe` word timestamps |
| Center statement with one emphasised word | two text layers; emphasis is a second child tweened in, or a weight/colour tween |
| World flip dark ↔ light | sibling scene clips with different background classes; a hard cut is adjacent `data-start` |
| Camera reframe | one `.world`/`.camera` wrapper tweened `x/y/scale`; captions live outside it |
| Line/node diagram that keeps growing | persistent SVG group + `strokeDashoffset` draw + staggered node entrances in one clip |
| Object travelling a route | one `<path>` for geometry + a marker driven by `getPointAtLength` keyframes |
| Certificate sinking into a vault | clipped stack descending behind a vault front face inside one clip |
| Reflective metal object | layered gradients + inner bevel + narrow seam highlight (see implementation.md) |
| End-of-beat hold | do nothing — a clip with no tween just holds; length is `data-duration` |
| Scene-to-scene transition | overlap two clips and tween opacity/`clipPath`/`filter: blur()` on *children* |

## 11. Verification protocol

1. `lint` clean — otherwise the layout/contrast audits do not run.
2. `check` with real samples: non-zero `contrast.checked`, zero runtime findings, zero layout findings.
3. Snapshot readable holds **and** transition midpoints; look at the actual PNGs.
4. Seek the same moment three ways — directly, from a later frame backward, and during forward
   playback — and confirm identical pixels.
5. For a delivered file, `ffprobe` the render: size, duration, fps, audio stream, end frame.
6. Report similarity honestly: silhouette, composition, material, typography, cadence, continuity,
   audio — and say what is still a reconstruction.
