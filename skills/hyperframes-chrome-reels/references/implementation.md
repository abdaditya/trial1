# Implementing this style in JavaScript and HyperFrames

## Verified framework surface

Research date: 2026-09-21. The local executable identifies itself as HyperFrames **0.8.46**. Checked the local composition, determinism and keyframe contracts, runtime globals, CLI help and public official sources. Do not assume every future release has the same flags. Some local guidance differs: the minimal composition reference says `class="clip"` is a convention while other guidance calls it required. Use the class consistently, avoiding that ambiguity.

HyperFrames turns authored HTML into seekable video frames. HTML defines timed elements; CSS defines appearance; SVG supplies vector geometry; JavaScript/GSAP defines changes over time. The renderer controls the timeline and captures frames. It does not automatically invent chrome materials or convert a reference video into editable scenes.

There are three easily confused concepts:

1. **A composition root** is a normal element such as `<div data-composition-id="main">`, with canvas dimensions and duration.
2. **A timed clip** is an element carrying timing attributes. Use `class="clip"`, `data-start`, `data-duration`, and explicit layout. `data-track-index` organizes Studio lanes; it is not CSS depth. Use `z-index` for visual stacking.
3. **`<hyperframes-player>`** is an embeddable player for previewing compositions. It is not the object primitive used to draw a robot or coin. The `hyperframe.runtime.iife.js` filename is runtime infrastructure, not evidence of a `<hyperframe>` drawing API.

Do not invent `<Hyperframe>`, React hooks, `hf.scene()` or other APIs. Use plain DOM elements and the verified registered GSAP timeline contract. If using another adapter, read its current contract and prove arbitrary-time seeking.

## Element-level mapping

| Desired graphic | Best default | When to upgrade |
|---|---|---|
| Type, capsules, prompt panels, quote cards | HTML/CSS with masked child text | Use SVG for custom lettering only if justified |
| People, robots, banks, certificates, clocks | SVG groups with gradients | Use layered rendered art for unusually complex silhouettes |
| Chart, transaction chain, paths and orbit lines | SVG paths, masks, circles | Canvas if there are thousands of elements |
| Fixed-view coin or ring | SVG layered ellipses and gradients | Three.js or pre-rendered alpha sequence for meaningful perspective rotation |
| Vault/monitor with slight side depth | CSS/SVG front and side planes | True 3D for open door rotation or moving physical reflections |
| Opening metallic folded ribbon | Modeled or pre-rendered 3D | SVG approximation only for restricted fixed-view motion |
| Source interview footage | Local licensed/authorized media | No code-only substitute for the footage |
| Brand orange glow | CSS multi-layer gradients with restrained blur | Shader only if simple gradients cannot match visible motion |

For these recordings most typography and diagrams can be authored directly. The demanding part is material art direction, not a special rendering API. Prefer a hybrid of code geometry and a few high-quality local assets over forcing every scene into either flat CSS or full 3D.

## Composition contract

```html
<div id="root" data-composition-id="main"
     data-width="1080" data-height="1920" data-duration="12">
  <section class="clip" id="diagram-scene"
           data-start="0" data-duration="12" data-track-index="1">
    <div class="camera"><!-- persistent diagram elements --></div>
  </section>
  <section class="clip" id="word-one"
           data-start="0.8" data-duration="0.4" data-track-index="4">
    <div class="caption-word">Imagine</div>
  </section>
</div>
<script>
const tl = gsap.timeline({paused: true});
tl.fromTo('.camera', {scale: 1.18, x: 0, y: 70},
  {scale: 1, x: 0, y: 0, duration: .8, ease: 'power2.inOut'}, 1.5);
window.__timelines = window.__timelines || {};
window.__timelines.main = tl;
</script>
```

This is an illustrative skeleton; load a bundled GSAP file, set root sizing to 100%, define positioning and add visible assets. The included starter supplies a complete proof scene.

- The standalone root lives directly in body, not in a `<template>`.
- Modular sub-compositions use `data-composition-src`; their content, styles and scripts belong inside the imported template. Scope CSS and IDs to each composition; host ID, local composition ID and timeline key should agree.
- Root `data-duration` is authored before compilation. A runtime variable changing it is not a reliable way to change export length.
- Let HyperFrames own timed clip visibility and media playback. Animate inner wrappers. Never run a competing manual playback loop.
- Register a complete paused timeline under the exact composition ID. No `tl.play()` for render-critical motion; no `setTimeout`, wall clocks or unseeded randomness.
- Synchronous construction is the least fragile starter. If fonts must finish loading before building layout-dependent tweens, finish the asynchronous build first and register at the end. Local core docs permit this; a separate keyframes guide is stricter. Do not expose an empty registered timeline during async setup.
- Avoid conflicting CSS transforms and GSAP transforms on the same node. Use an outer position wrapper plus an inner animation wrapper, or set all transform starting values with GSAP.
- Repeated later `fromTo` tweens on the same property need deliberate `immediateRender:false` behavior. Check seeking backward, not just first playback.
- Bundle fonts, scripts, photos and media locally. Define named fonts with an in-file `@font-face`. Do not depend on CDN fetches completing during export.
- Give every audio element a unique `id`. Place media using timing attributes. Avoid a timed video inside another plain timed wrapper. Do not add `crossorigin` to timed media in this verified version.

## Geometry and material patterns

### Chrome without expensive blur

Build geometry at final scale and reuse named gradients. A metallic face needs several luminance transitions, for example pale rim → middle gray → dark face → thin bright reflection. Vary stop positions per surface so everything does not look like the same gray sticker.

```css
.chrome-face {
  background: linear-gradient(145deg,
    #f4fff8 0%, #a7b6ae 9%, #3d4943 24%,
    #151d18 55%, #52675a 78%, #d3ded6 100%);
  box-shadow: inset 0 2px 2px #ffffffa0,
              inset 0 -3px 5px #020603cc;
}
```

Use that on a clipped panel wrapper; place text in a separate centered child. The stops are an authored approximation, not a physically accurate reflection model. The silver edge can be a larger clipped shape behind a slightly inset face. A 1–3 px highlight at 1080 output matters more than a 40 px surrounding glow.

### SVG path drawing

```js
const path = document.querySelector('#route');
const length = path.getTotalLength();
gsap.set(path, {strokeDasharray: length, strokeDashoffset: length});
tl.to(path, {strokeDashoffset: 0, duration: 1.8, ease: 'none'}, 2.4);
```

For a dotted route, do not overwrite its decorative dash pattern with a reveal dash. Put the dotted path under an SVG mask and animate a separate solid stroke in the mask. Reuse the same geometry for a moving marker. Build its sampled coordinate keyframes once, from `getPointAtLength`, rather than using a free-running animation loop.

### Seek-safe packet along a curve

```js
function routeFrames(path, count = 80) {
  const length = path.getTotalLength();
  return Array.from({length: count + 1}, (_, i) => {
    const p = path.getPointAtLength(length * i / count);
    return {x: p.x, y: p.y};
  });
}
const poses = routeFrames(document.querySelector('#route'));
// Marker is an SVG <g> initially centered at 0,0 in the same viewBox.
gsap.set('#packet', poses[0]);
tl.to('#packet', {
  keyframes: poses.slice(1).map(p => ({...p, duration: 1.8 / 80, ease: 'none'})),
  ease: 'none'
}, 2.4);
```

Match the path's coordinate system to the marker parent. The code uses equal arc-length steps. If chart x means elapsed time, use data-space interpolation instead: visual arc length is not a faithful time axis.

### Persistent camera groups

Place a whole diagram in one `.camera` wrapper. Reframe it with `x/y/scale` while actors maintain local coordinates. Keep captions, backgrounds and source notes outside that wrapper. Animate a local actor for a local task; animate the parent only when the viewer's perspective should change. Set `transformOrigin` intentionally.

### Caption replacement

Generate one timed node per word or phrase with numeric start and end times. Keep upper caption words separate from hero typography and diagram labels. Do not rely on a sequence of `.call()` callbacks that mutate one node's `textContent`: arbitrary seeking may skip callbacks and show the wrong word. Native timed nodes are straightforward to inspect and deterministic to seek.

## Story and audio workflow

Make a beat table with fields: `start`, `end`, `spokenLine`, `captionWords`, `scene`, `objectState`, `cameraState`, `dataSource`, `assetPaths`, `soundCue`.

For an original ~60-second reel, a plausible starting structure is 0–4 s hook, 4–10 s reframe, 10–22 s worked example/evidence, 22–28 s short pivot, 28–45 s mechanism, 45–53 s consequence, 53–60 s solution/callback. This is a proposal, not the source creators' fixed template. The two captures may themselves be excerpts of longer originals.

Finalize narration length before locking scene times. Source or generate authorized narration, transcribe to word timestamps, and align meaning: the marker reaches its destination when the verb says “settles”; the intermediary disappears at “removed.” A visual can lead a word slightly for anticipation, but its explanation should land together.

Proposed sound language: restrained low pulse, short soft whooshes for camera travel, metallic ticks for nodes/locks, a muted impact at the main reveal. Avoid a whoosh on every word. Mix speech intelligibility first and verify on phone speakers. These are proposed choices; the recordings provide no audible evidence.

## Local implementation and validation

Existing workspace CLI (verified executable):

```sh
node /Users/apple/Desktop/behindventure.in/hyperframes/packages/cli/bin/hyperframes.mjs --help
```

For a portable project, pin the tested version or use an existing local install. Check current CLI help before adding unsupported flags. Typical commands run from the composition directory:

```sh
npx hyperframes lint
npx hyperframes check --at 0.8,2.5,5,7.8
npx hyperframes snapshot --at 0.8,2.5,5,7.8 --output snapshots
npx hyperframes preview
npx hyperframes render --fps 30 -o reel.mp4
```

These commands concern a video the user asked to create; analysis-only requests do not require a final render. Do not impose a redundant approval step when rendering is already requested. Publishing is a separate action.

Quality gates:

1. Structural lint clears. Runtime check has actual nonzero samples and no asset or script errors. A report with zero layout/contrast checks is not a pass.
2. Capture holds and transition midpoints. Check panel text during expansion, certificate occlusion, line/node order and ring cavity shading.
3. Compare the same moment reached directly, from a later moment, and during forward playback. All should agree. Avoid declaring deterministic behavior from syntax alone.
4. Check readability at ~360 px preview width, with a current platform overlay. Safe-zone coordinates in the study are guides only.
5. For a rendered deliverable, probe actual size, duration, frame rate, audio streams and end frame. Inspect the exported file, not just Studio.
6. Track similarity separately: silhouette, composition, material, typography, cadence, continuity, audio. Note unresolved differences rather than declaring an exact replica.

## Research sources

- [Official repository](https://github.com/heygen-com/hyperframes): framework identity and package structure.
- [Official composition documentation](https://hyperframes.app/docs/2-concepts/1-compositions): HTML roots, clips and nested compositions.
- [Official player documentation](https://hyperframes.app/docs/5-packages/player): player web component, separate from authoring primitives.
- Local `hyperframes/skills/hyperframes-core/references/minimal-composition.md`: minimal root/timeline and clip convention.
- Local `hyperframes/skills/hyperframes-core/references/determinism-rules.md`: deterministic seeking, async timeline registration and layout.
- Local `hyperframes/skills/hyperframes-keyframes/SKILL.md`: camera poses and keyframe diagnostics.
- Local `hyperframes/packages/core/src/inline-scripts/runtimeContract.ts`: runtime global names.
- Local CLI `--help`, `check --help`, `snapshot --help`, `render --help`: version and command verification.

The detailed contract above primarily follows the inspected local files for the tested version; public web documentation was used to cross-check product identity and composition structure. Recheck before upgrading.

## Included starter: actual verification

The original 10-second starter was checked locally with HyperFrames 0.8.46. Lint and runtime reported zero errors or warnings. Layout was sampled at 0.8, 2.5, 5 and 8 seconds, then at intermediate construction times 2.9, 3.6, 4.3 and 6.5 seconds. The two passes reported 22/22 and 21/21 text contrast checks passed. Five snapshots, including 9.7 seconds, were captured and visually inspected: token, people, route and labels appear in the expected successive states.

Reports and snapshots are in `/Users/apple/Desktop/behindventure.in/out/reel-reference-study/`. The reports explicitly show the motion analyzer disabled; these checks do not prove full motion quality or backward-seek determinism. No final MP4 or audio was produced for this analysis task. The starter demonstrates editable geometry and sequencing, not exact reference fidelity. It uses a system font for portability; replace it with a bundled chosen font during style matching. GSAP 3.15.0 is bundled with its upstream header intact.
