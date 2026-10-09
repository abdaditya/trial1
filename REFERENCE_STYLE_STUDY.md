# BehindVentures — Reference Style Study (for the Google × Wiz remake)

Study date: 23 Sep 2026. Sources: `reference_sketchy_videos/` (4 core refs, 2 animation examples, 2 ElevenLabs colour refs), `danger-zone*.png`, `QA_CATCH.md`, `skills/`, `camera-3d-captions/`, `hyperframes/`, `remotion/`.
Method: every reference was sampled at 2 fps into timestamped contact sheets (`review/ref_study/*.jpg`) and read frame by frame. Timestamps below (e.g. `R1 12.0s`) point to those sheets so anyone can check them.

R1 = core_reference1 (Mastercard / AI agents, 58s) · R2 = core_reference2 (BlackRock / tokenization, 61s) · R3 = core_reference3 (Buffett / S&P / supply wave, 50s) · R4 = core_reference_4 (financial nihilism, 53s).

---

## 1. The one idea: it's one world with a camera in it, not a set of slides

A slide deck swaps one full layout for another. These videos keep **one hero object on screen**. The object changes state, the camera moves around it, and the background changes behind it. A cut happens only when the *idea* changes, not when the sentence ends.

Proof from the refs:

- **R1 1.0–3.0s**: the Mastercard logo stays put. A dark-green dome with a $ rises underneath it, and "TRILLIONS of dollars" resolves from blur above it. That's three layers on one anchor, with no cut.
- **R1 3.5–8.5s**: the logo moves to the top-left and shrinks into a lockup ("Newest customer"). Robots pop up one at a time beneath it, and then the whole frame fades to orange. The logo is the carrier across three backgrounds.
- **R1 16–26s**: a prompt pill ("Put the flower shop online") types in and slides left. A robot appears, then a vertical checklist grows (domain → hosting → checkout → Site ready) with green dots running down a line, and a website card drops in. Then **the camera pulls out to show the whole flow, then dollies into the robot**. It's one diagram that builds for 10 seconds.
- **R2 3–8s**: a bar chart "0x → 1x → 2x", where the camera pushes *through* a curved glass lens that fills the frame (5.5–6.5s). That lens becomes the wipe into the next statement.
- **R2 38–60s**: two person-busts ("Seller", "You") stay in the scene the whole time. First a Stock card floats over them, then a dotted line with 6 middleman dots connects them, then it turns into a fee curve (2%), then a clock and computer appear above the same dotted line, and finally a "Tokenization" coin drops in and the dots disappear. **That's 22 seconds on one diagram.**
- **R4 30–45s**: a chrome bust ("you") sits under a bar. The bar fills green for rent, then red for inflation, then everything cuts to black for the statement, then back to chrome coin stacks with growing numbers.

**Rule:** each beat = claim → object → operation on the object → consequence. The next beat takes over the *same* object when it can.

## 2. Two text systems (plus a third for emphasis)

| Role | What it looks like | Where | When |
|---|---|---|---|
| ~~Word rail~~ **(DROPPED for BehindVentures, per Aditya 23 Sep)** | The refs run a one-word caption at the top the whole time. **We don't.** The screen goes to animation, objects and camera instead, and text appears only as the statement, display and label roles below | — | never |
| **Statement** | 1–2 lines, same geometric sans, sentence case, words arrive one by one *in place* (blur→sharp or small rise), with the stressed word in **bold** (R2 7s "obsessed.") or in red display type (R4 38–41s "waiting 30 years" … "scam") | optical centre | on a bare background, with no rail; these are the breath beats |
| **Display / emphasis** | condensed ultra-bold (Oswald / Bebas-like): "TRILLIONS of dollars", "financial system", "1960s", "$1 trillion", "1B dollar", "Need for Speed" | above the hero object | 3–6 times per video, 1–3s each, often resolving from blur or scaling down from oversize |
| **Labels** | tiny sans (~24–30px), grey, inside diagrams: "Seller / You", "domain purchase", "145 years", "rent / inflation" | attached to objects | whenever a diagram is up |

Fonts to use: **rail + statements = Montserrat / "Inter Display"-style geometric sans at 400/600** (the refs look like Montserrat or Gilroy). **Display = Oswald 700 or Bebas Neue**, tightly tracked, used rarely. Hindi/Hinglish words in the rail need a Devanagari pair (e.g. *Mukta* or *Hind*) at the same x-height, but keep the rail in Roman script if the VO is Hinglish.

Typography motion: words **blur-resolve** (R1 1.5s "TRILLIONS" blurred → sharp at 2.0s; R3 19.5s "And here is what" words arrive blurred and at different sizes/positions, then settle into a line). **Scatter-assemble** is used for the key sentence: R1 11.5–13s "payment network built only for AI agents" arrives as scattered words at mixed sizes and snaps into a 2-line block.

## 3. Camera language (the catalogue)

1. **Push-in on discovery.** A slow scale of 1.0→1.15 over the beat, plus a faster push when the key word lands (R1 23–26s into the robot, R2 26–29s magnifier onto "secret").
2. **Pull-out on consequence.** Reveal the whole system after building it piece by piece (R1 22s: the flow shrinks to show the user, the prompt, the checklist and the site at once).
3. **Lateral truck / pan.** Content leaves one side of the frame and new content is waiting on the other (R1 17–20s: the prompt pill slides off left as the checklist enters, and they share one plane).
4. **Orbit / Y-rotation of a hero object.** Coins and discs turn edge-on and back (R1 53–55s Stablecoins disc; R2 17–21s Tokenization coin turns edge-on and becomes a line on a chart; R3 38–41s S/P coins wobble in 3D; R3 37–38s phone tilts in perspective).
5. **Fly-through.** The camera passes through a foreground object that briefly fills the frame (R2 5.5–6.5s curved lens; R4 45–46s green light-sweep through the glass frame).
6. **Rack focus / depth blur.** Background objects are blurred and foreground ones sharp; things enter blurred and sharpen as they arrive (R1 1.0s, R3 34–36s bubbles).
7. **Follow the line.** The chart line is drawn while the camera stays on its tip, then pulls back to show the full curve (R3 8.5–17s S&P curve: the camera rides the curve, zooms onto the peak dot with a dashed drop-line, then pulls out to "145 years / S&P 500"). **This is how graphs should behave.**

The easing is soft and cinematic, roughly `power2.inOut` for moves and `expo.out` for arrivals. There's no bounce, no elastic, no idle wobble. Objects are either doing something or they're still.

## 4. Transitions (what actually happens at the seams)

| Transition | Where | Use it for |
|---|---|---|
| Hard cut (on a word) | most seams | the default. Cut on the stressed syllable |
| Luminance fade light→grey→dark | R1 42–43.5s, R3 18–19.5s | switching world (light ↔ dark) at a change of mood |
| Object carry across a world change | R1 3–4s (logo stays, the background flips dark→light) | when the subject continues |
| Lens / glass fly-through wipe | R2 5.5–6.5s | going from data to a statement |
| Iris / circle mask | R3 32.5–33s (houses shrink into a green circle on black) | zooming out into a symbol |
| Light-sweep / flare wipe to white | R4 46–47s | end-of-act, big reveal |
| Colour-wash world | R1 8.5s (grey → orange gradient), R2 39.5s (green flash on "stock") | brand moment or accent word |
| Blur-out/blur-in | R3 19–19.5s, R4 6–7s "Financial Nihilism" | into a statement |

Don't use the same transition twice in a row, and don't use more than 5 kinds in one video.

## 5. Worlds and colour

The refs alternate between worlds roughly every 5–12 seconds:
- **Charcoal** `#1c1c1c`–`#222` with a soft top-light vignette (most of the runtime, ~55%)
- **Pure black** for statements and suspense (~15%)
- **Light grey / porcelain** `#d9d9d9`–`#eee` (~25%). This is what makes it feel premium rather than just "dark mode"
- **One colour-wash beat** (orange, mint green, a green spotlight) for 1–2 moments

The materials are the same in every world: **chrome/silver-white with soft reflections, frosted glass cards, and one accent glow under objects** (the green rim-light under busts and coins).

### Our palette (ElevenLabs-inspired, not their green)
From the colour refs: black ground; **pixel mosaic of violet/pink/teal/blue** (EL1 0.5–4s); **soft glowing orbs** that fade in and out (EL1 8–11s); **teal-to-green smoky gradients** (EL2 8–11s); a **cream/white UI world** (EL2 12–19s); and **light bokeh orbs of yellow-green and teal** (EL2 0–8s).

Proposed BehindVentures tokens (this replaces "no purple" in `QA_CATCH.md §2`. Update that file if you agree):

| Token | Value | Job |
|---|---|---|
| ink | `#07080c` | black world |
| charcoal | `#16171c` | main world |
| porcelain | `#eceae6` | light world (warm, not blue-grey, so it looks different from the refs) |
| chrome | `#f4f6f8 → #8a9099` gradient | object material |
| **aurora-violet** | `#8b7cff` | signature accent (replaces their green): flow lines, active dots, rim-light |
| **aurora-teal** | `#3fd6c6` | second accent: growth, "good" |
| **aurora-blue** | `#4a8dff` | data, cloud, links |
| ember | `#ff6a4d` | danger / breach / loss only |
| smoke | radial gradients mixing violet+teal+blue at 8–18% opacity, slowly drifting | background atmosphere |

Each video gets **one lead accent per act**. For example: Google act = blue; Wiz act = violet (Wiz's own brand leans blue/purple, so it fits); the deal/money act = teal. The smoke drifts between them, and that's the "purplish, greenish, bluish mix". Brand colours (Google's 4 colours, Wiz's logo) show up only on the logos themselves.

## 6. People, logos and real footage

- **Hook with real people in B&W** (R2 0–4s: desaturated, high-contrast footage of Larry Fink and Jamie Dimon, with a bold white ALL-CAPS 2-line caption typed on with a cursor "THE MOST POWERFUL PEOPLE IN FINANCE|"). That's 3–4s of real faces, then it cuts to the 3D world.
- **Person chips inside the 3D world** (R2 2–3s: a glass card with a photo of Larry Fink + name + "Managing $11T"; R3 0–7s: a round avatar of Warren Buffett under a glass Berkshire card that rises as the valuation counter runs up $0.38 → $1.08 Trillion). People become **tokens that sit in the diagram** rather than full-screen photos.
- **Anonymous people = chrome busts** (sphere head + dome shoulders with an accent rim-light): "Seller", "You", buyers crowd (R3 34–36s). Faces with simple eyes for emotion (R4 22–37s).
- **Logos** appear as real brand marks on a frosted-glass tile or a chrome coin, never flat on the background (R3 SpaceX / OpenAI tiles with a tilted "Public" pill; R1 Mastercard lockups).

For Google × Wiz: Sundar Pichai and Assaf Rappaport as the B&W hook plus glass person-chips; Google "G" and the Wiz mark on chrome coins; a counter of "$32B" as display type.

## 7. Graphs, maps and data (from the two animation examples + refs)

- **Line charts are drawn live** with a glowing head dot, a faint grid, and an accent glow pooled under the curve (R2 12–17s, R3 3–7s, R4 9–13s "1960s"). Axes are thin and labels tiny. The display number updates at the head (e.g. "$3 billion → $30 billion").
- **Multi-series race** (animation example 2): each line has its own neon colour, and an end-label with its value rides the head of the line. The age counter under the chart ticks. Use this for "Google vs AWS vs Microsoft cloud share" type beats.
- **Maps** (animation example 1): a dark street/country map with thin blue lines, a path that lights up node by node with a glow, and a comparison layer in a second colour. Also R3 22.5–29s: a country silhouette in flag texture with coin stacks growing on it, and R4 2.5–5.5s: a chrome globe rotating under the camera. Use this for "Wiz = Israel → Google = US" or where cloud data sits.
- **Bars / progress** (R4 31–37s): a pill bar filling left to right with labelled brackets underneath.
- Numbers must finish counting on or before the narrator says them (already in QA_CATCH §5).

## 8. Safe zones (from danger-zone screenshots + QA_CATCH §3)

1080×1920. Keep faces, logos and statements inside **X 80–1000, Y 220–1560**. Nothing important goes above y ≈ 220: the danger-zone1 screenshot shows text colliding with the status bar at the top. The bottom 1600+ and the right column 960+ are only for atmosphere: smoke, ripple rings, line extensions, particles, and the bottom glow of a bust or dome bleeding off-frame (the refs do exactly this, with busts and globes cropped at the bottom edge).

## 9. Tooling decision

| Repo | Verdict for this style |
|---|---|
| **Remotion 4.0.526** (`remotion/`) | **Primary engine.** Frame-based React, so audio sync is exact (`<Audio>` + frame = time × fps). It has everything the refs need: `@remotion/three` (React Three Fiber) for **real 3D chrome coins, busts and glass with actual reflections and orbit cameras**, which is the biggest gap in the last attempt, where CSS gradients were faking 3D. It also has `@remotion/transitions` (fade, iris, zoom-blur, cross-zoom, linear-blur, wipe…), `@remotion/motion-blur` (camera moves), `@remotion/light-leaks` (flare wipe), `@remotion/noise` (drifting smoke), `@remotion/paths` (drawn chart lines), `@remotion/svg-3d-engine` (extruded logos), `@remotion/openai-whisper` / `install-whisper-cpp` (word timestamps for the rail), and `@remotion/google-fonts`. |
| **HyperFrames** (`hyperframes/`) | Keep as the fallback / QA tool. The `motion-doctrine` + `seam-craft` rules (vector law, no idle wobble, opaque stage) are worth following in Remotion too. `camera-3d-captions` is for talking-head footage, not this. |
| **Hand-drawn canvas** (`skills/hand-drawn-canvas-animation`) | **Not for this look** (riso/ink/paper). Possibly use `@remotion/rough-notation` for one hand-drawn circle or underline as a signature accent. Keep the sketchy look for the cream-theme series. |

The build is 1080×1920 @ 30fps with one `<Composition>`. It has a single scene graph per act, with the camera as a React state driven by `interpolate(frame, …)` and a `beats.json` generated from Whisper word times, so every visual landing is tied to a word.

## 10. Why the previous attempts read as a slideshow (to avoid repeating)

1. Every sentence got its own full layout → switch to **one object per idea, carried across 3–6 sentences**.
2. Motion only happened at entry and exit → the object should **operate** in the middle (fill, split, spin, connect, count).
3. The 3D was faked with CSS → use R3F for heroes.
4. One colour world for the whole video → **alternate charcoal / black / porcelain / one wash**.
5. Captions were full sentences → **no continuous captions at all. Use rare statements, rare display type and diagram labels, and let the animation carry the story**.
6. Audio was timed by hand → **drive the timing from word timestamps**, and verify sync by cross-correlation (QA_CATCH §6).

## 11. Draft visual spine for Google × Wiz (to be fitted to the real script)

| Act | World | Hero / carrier | Moves |
|---|---|---|---|
| Hook 0–4s | B&W footage | Sundar Pichai → Assaf Rappaport, typed ALL-CAPS 2-line caption | hard cuts on words |
| The number | black | "$32B" display type resolves from blur; a Google chrome coin drops beneath with blue rim-light | push-in |
| What is Wiz | charcoal + violet smoke | Wiz mark on a glass tile, a founder chip, then a cloud diagram (AWS/Azure/GCP nodes) with a Wiz scanner beam sweeping them | pull-out to reveal the whole cloud |
| The growth | porcelain | a live line chart of ARR with the camera riding the head; "$23B rejected" marker with a dashed drop-line | follow-the-line |
| Why Google paid | charcoal, blue | Google coin + Wiz tile slide onto one plane, dotted connection, and the competitor coins (AWS, Microsoft) move away | orbit + lateral truck |
| Map beat | black | chrome globe: Tel Aviv → Mountain View arc lights up | globe spin, arc glow |
| Consequence / CTA | light-sweep to porcelain | the merged coin flips to the BehindVentures mark | flare wipe, hold |

---

### Open items before building
1. **The Google × Wiz source files aren't in `zbacktrack`**: the narration audio (MP3/WAV), the script, and the earlier "normal animation" video with the Sundar Pichai cream/black theme. I need the VO audio at minimum to lock timing.
2. Confirm the palette change (aurora violet/teal/blue instead of "no purple"), then I'll update `QA_CATCH.md §2`.
3. Confirm Remotion as the engine for this series.
