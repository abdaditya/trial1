# Reverse engineering the two reference reels

## Evidence and limits

Inspected September 21, 2026. These are screen recordings of reels displayed under the visible account name `0x100x`. That is an observation of the UI, not verification of authorship or production software.

| Reference | Current source location | Measured capture |
|---|---|---|
| A — Mastercard / agents / stablecoins | `/Users/apple/Desktop/behindventure.in/reference_sketchy_videos/screen-20260921-190141.mp4` | 720 × 1594, 58.4295 seconds, video only |
| B — tokenization / financial infrastructure | `/Users/apple/Desktop/behindventure.in/reference_sketchy_videos/screen-20260921-190256.mp4` | 720 × 1594, 60.8764 seconds, video only |

The files initially existed directly on Desktop and were subsequently found in the workspace reference folder. Original media remains unmodified. Both contain zero audio streams, so voice, music, sound effects and word-to-speech synchronization are unknown. Visible top captions suggest a narration rail, but that is an inference.

The capture includes phone/Instagram UI, engagement buttons and caption overlays. 720 × 1594 describes the capture, not the original author's canvas. Design new reels at 1080 × 1920; that is a proposed output format. Do not stretch the screen capture to recover supposedly exact original artwork. Obscured pixels and original easing curves cannot be recovered from these files alone.

Inspection used full-frame 3-second contact sheets, 1-second cropped sequences covering both recordings, and 4-fps detail sequences for A's prompt expansion and B's certificate-to-vault handoff. Shot boundaries below are approximate recording-relative seconds, generally within about one second. They are not an EDL or frame-exact transcript. Frame sampling establishes pose changes, not the author's exact easing or tools.

Evidence sheets in the workspace: `/Users/apple/Desktop/behindventure.in/out/reel-reference-study/`. `a-01.jpg` / `b-01.jpg` cover the first ~30 seconds; `a-02.jpg` / `b-02.jpg` continue. Cropped sheets intentionally favor artwork and are not clean source masters. `video-a-sheet.jpg` and `video-b-sheet.jpg` retain the capture context.

## What makes these work

The apparent luxury comes from a small consistent material vocabulary, generous empty space and precise hierarchy. The conceptual interest comes from transforming a familiar noun into the machinery behind it. A certificate enters a vault. A buyer and seller pull apart, exposing intermediaries. An agent request expands into a completed workflow. Large graphics are earned by the argument, rather than appearing as decoration.

The main rhythm is: establish a thing → change or move it → reveal a relationship → pause on a short conclusion. Several scenes last multiple seconds while changing internally. Cutting to an unrelated illustration every second would destroy this rhythm.

**Corrected in the second measurement pass.** The upper text is a **word-by-word rail of the
narration**: one word at a time, horizontally centred, at a fixed height, replacing hard with no
crossfade (evidence and millisecond-level detail in [caption-and-rhythm.md](caption-and-rhythm.md)).
So there are three typography layers: that narration rail, centre statements/phrases in the action
area, and occasional large condensed emphasis. "Small changing word near the top" from the first
pass was right about position and wrong about what it is. Some scenes carry no rail at all — notably
the product lockup beat — so absence of the rail is a deliberate signal, not a gap.

The two captures also differ in structure: A alternates a light world and a black world with
luminance jumps of ±150–190, while B stays in one dark world and varies contrast locally.

## A: approximate visual shot map

| Recording time | Observed visual state/change | Story job | Reconstruction mechanism |
|---|---|---|---|
| 0–4 s | Mastercard circles, small hook, condensed “TRILLIONS of dollars,” green sculptural arcs | Establish familiar scale | Local SVG logo, masked green arcs, headline reveal; short logo blur resolve |
| 4–8 s | Hard shift to pale gray; logo plus “Newest customer”; a white robot becomes a group | Introduce unexpected customer | Bright scene background, one reusable beveled robot component instantiated three times with staggered scale/position |
| 8–14 s | Orange/red/yellow diffuse field behind logo, divider and “Agent Pay for Machines”; lower phrase assembles | Product reveal and definition | Oversized blurred gradient layers; sharp foreground lockup; short phrase reveals |
| 14–18 s | Dark field; metallic user icon; long beveled green prompt expands across the frame | Concrete relatable task | Persistent user object; actual panel width/mask expansion; text stays unscaled; camera/panel translation |
| 18–24 s | Prompt and robot connect to domain purchase, hosting, checkout and site-ready sequence; website appears | Show what the agent does | A single diagram group, staggered task labels, growing vertical connector, active green point, mock website preview |
| 24–27 s | Camera closes on robot while prior details leave the frame | Name the actor doing the work | Transform parent camera group; reduce peripheral opacity without replacing the robot |
| 27–30 s | Black statement: multiply this by every business | Expand scope through a pause | Brief line-by-line reveal, then a clean reading hold |
| 30–37 s | Pale scene; brand/partners label and translucent quote panel; quotation builds | Evidence-shaped beat | Rounded frosted panel, gentle rim highlight, word or phrase reveal. Verify quotation before reuse |
| 37–43 s | White robot points toward bank; red cross overlays bank; missing-identity bullets appear | Explain obstacle | Shared robot; SVG bank; red translucent diagonals; staggered bullet list; reframe toward bank/list |
| 43–49 s | Dark system diagram; metallic people at different scales; “financial system,” then “5000 yrs” | Historical contrast | Persistent silhouettes, thin baseline, replacement emphasis titles, controlled lateral camera move |
| 49–52 s | Bright scene with concise software/money statement | Thesis reset | Full-frame light cut, centered black sans text, minimal movement |
| 52–56 s | Black field, silver oval ring labeled stablecoins, many curved dotted lines | Introduce connective infrastructure | SVG elliptical ring/shading or a 3D torus; cubic Bézier stream paths; masked line flow |
| 56–58.43 s | Ring shrinks into an agent/payment diagram with small capsules | Connect solution back to protagonist | Shared ring transform into new diagram scale; robot and label reveals. Capture ends mid-explanation |

A's strongest reusable sequence is the user → prompt → agent workflow → zoom-out. It presents an abstract financial topic as a concrete job getting done. Its bright scenes are substantive changes of context, not random flash transitions.

## B: approximate visual shot map

| Recording time | Observed visual state/change | Story job | Reconstruction mechanism |
|---|---|---|---|
| 0–2 s | Monochrome finance-person footage and bold opening text | Attention and authority | Source/authorized footage, grayscale treatment, deliberate title. Faces are footage, not a JavaScript effect |
| 2–6 s | AI symbol crossed out; chip-like object; reflective bar and 1x/2x states | Reframe attention toward financial incentive | SVG symbols, reflective bar with bottom-origin growth, independent numeric label |
| 6–8 s | Short centered statement with “obsessed” emphasized | Setup pause | Word/phrase reveal and readable hold; restrained blur at handoff |
| 8–12 s | “2024”; opening silver ribbon-like forms; green-faced token; small display labels | Establish early state | Prefer modeled ribbon if the fold changes perspective; static layered SVG if it only rotates in-plane |
| 12–17 s | Thin rising chart, quiet grid, green light beneath; token marker and changing labels; year bracket updates | Show growth | SVG path reveal, marker sampled along same path, data-driven axis/labels, glow independent of line |
| 17–22 s | “Every forecast 2030”; reflective green token at baseline; rising projection graphic | Future scale | Same token component, reflective floor, new path/labels. Values shown are reference content, not verified projections |
| 22–27 s | Short “Even the pessimists…” text then an explanatory pivot | Reset information load | Sparse text scenes, phrase reveal, ordinary sans with selected emphasis |
| 27–29 s | Paper stack marked stock market; magnifier passes across it | Look beneath familiar surface | Layered paper rectangles, clipped duplicate text inside glass lens, handle and rim |
| 29–32 s | Metallic stock certificate under “feel digital” | Introduce apparent digitization | Local SVG certificate, modest highlights, headline reveal |
| 32–36 s | Certificates stack and sink into metallic vault; map pin appears | Reveal physical infrastructure | Persistent certificate component; clipped descent behind vault face; shaded door/side planes; reflection and pin |
| 36–38 s | “And that system has a price.” | Consequence bridge | Calm text-only scene |
| 38–45 s | Seller and buyer under stock certificate; they separate; intermediary dots appear | Make hidden chain visible | Same two metallic figures, shared camera zoom-out, a connector path with ordered nodes |
| 45–51 s | Figures fade away, path and fee diagram remain, “2% per $,” then 140-years claim | Isolate economic consequence | Persistent baseline, cost wedge/bracket, labels and text hold. Source the claim independently before publishing |
| 51–58 s | Reflective large clock and computer over intermediary chain; hands move | Distinguish faster processing from structural change | SVG clock face and hands; layered monitor; persistent chain below |
| 58–60.88 s | Large dark coin/ring labeled Tokenization over seller and buyer; light at base | Reveal proposed structural change | Ring, rim highlights, low fog-like elliptical glow, return to original person pair. Capture ends before full resolution |

B's defining move is the shift from **surface object** to **underlying mechanism**. Copying the coin and colors without this causal progression would only copy its decoration.

## Shared design system: proposed starting values

These are reconstruction tokens estimated by visual inspection, not exact sampled source values. Instagram compression, recording scale and overlays affect appearance.

| Role | Proposed 1080 × 1920 starting point | Why |
|---|---|---|
| Dark scene | `#1d1d1d` / `#202020` | Matte neutral field; lets white rims register |
| Black emphasis | `#030504` or `#000000` | Makes ring networks and mechanism beats more dramatic |
| Light scene | `#dedede` to `#ededed` | Neutral silver-gray rather than a warm paper palette |
| Primary type | `#f4f4ef` dark scenes; `#161916` light scenes | Clean reading without coloring all text green |
| Green light | `#a5dcc1` rim, `#396c50` body, `#102b1c` shadow | A physical light/material cue; reserve brighter green for active states |
| Chrome ramp | near-white → gray → dark gray → narrow white seam | Multiple luminance reversals imply reflective metal |
| Upper word rail | **54 px** regular (56 px from measurement), baseline ≈ y 250, centred | Word-by-word narration track; see caption-and-rhythm.md |
| Ordinary statement | 46–62 px, 1.1–1.2 line height, width 760–870 px | Mobile readability with generous surrounding space |
| Hero figure/year | 90–136 px | Limited emphasis rather than constant shouting |
| Diagram labels | 28–36 px where possible | Improve on very small reference labels |
| Condensed display | 86–120 px, used selectively | Matches the occasional tall narrow emphasis, not the everyday voice |
| Main object zone | roughly y=560–1310, centered near x=500 | Strong central stage; leave room for caption rail and platform UI |
| UI-aware starting guides | x=80–920, y=180–1550 for essential copy | Production guides to preview with current platform overlays, not a guaranteed Instagram specification |

Choose a locally licensed geometric sans such as an available Inter/Manrope-like face after side-by-side testing. A tall condensed face can approximate the emphasis style. The exact original font is unidentified. Do not declare it to be a specific paid typeface without evidence.

### Material anatomy

A reference-style object has a readable outer contour, a darker face, a directional broad highlight, a very narrow bright bevel, an opposing dark seam, and usually a small grounding reflection or glow. A simple gray fill plus white border will look flat. A heavily blurred glow around every edge will look neon. Most volume comes from controlled value contrast, not saturation.

The people are almost pictograms: a circular head and a shoulder dome. Head rims are bright; centers are dark. The shoulder dome receives a silver or green top light and fades to black below. This makes them easy to reproduce with SVG gradients while keeping the material consistent.

Robots use clipped corners, tiny horizontal eyes, side ear plates and a luminous top bevel. The torso can be another beveled plate. Preserve restrained faces: emoji-like expressions would change the tone.

The metallic ring needs an outer highlight and inner cavity shadow with different lighting. A flat `border: solid silver` cannot reproduce this. SVG multi-stop radial gradients work for fixed frontal views; changing perspective or thick torus rotation merits true 3D.

### Motion grammar

Observed: staged assembly, text blur resolves, expanding panels, lateral travel, shared camera reframes, moving chart markers, progressive line/node appearance, local highlight movement and clean hard cuts.

Suggested starting settings (not measured recovered curves): object arrivals 0.45–0.8 s with `power3.out`; reframes 0.65–1.0 s with `power2.inOut`; phrase reveals 0.3–0.55 s; label offsets 0.08–0.16 s; readable statement holds 1.2–2.0 s; data draws 1.4–2.4 s with linear progression where data mapping requires it. Use a measured reference segment to refine these, not the presets as law.

Use one major focus change at a time. Arrival → settle → explain → depart is more legible than every element drifting continuously. Allow the silver object to carry motion while explanatory type settles. Group camera transforms create continuity; independent element flies often look like a slideshow.

A's prompt detail samples show panel growth/travel and text entering the visible region. The safe implementation is an expanding masked panel with unscaled type, not scaling the entire text box horizontally. B's vault samples show certificates above the vault and then progressively occluded: animate the same stack downward behind a front face rather than simply crossfading certificate and safe.

## How to go beyond the references

Improve label readability and factual clarity first. Keep the central figures larger on dense diagrams. Use a consistent visual identity for buyer, seller and agent across the reel. Make each dot in a transaction chain correspond to a named operation when the story needs it. Show a measurable before/after rather than a decorative up-and-right line. Add quiet source notes to claim-heavy frames where space permits.

Add richer visuals only when they explain something: a settlement lock unlocking at completion; a transaction packet losing fee slices through intermediaries; an ownership certificate splitting into token units; a synchronized ledger that updates two sides together. Keep the same silver/green materials and restrained camera language.

A faithful future recreation requires original/approved assets, the intended script and audio, exact typography choices, and iterative frame comparison. This analysis establishes a practical visual system; it does not establish which editor, renderer, assets or fonts the original creator used.
