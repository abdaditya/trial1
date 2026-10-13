# zbacktrack Reel Playbook

How to make a zbacktrack reel from nothing, written so any AI agent (or human) can follow it end to end.

Reels built so far:
- India cheap phone (AI vs budget phones, Oct 2026)
- Google × Wiz (the best performer, ~80k views)
- ISRO
- India chips
- EV magnets
- NavIC/GPS
- Google TPU in space (Suncatcher)
- Nvidia × Hugging Face

Channel: Instagram **@zbacktrack** (behindventures), in English, covering the real stories behind business, tech and history.
Format: 1080×1920, 30 fps, 75–110 s, one voiceover, rendered from HTML with **HyperFrames**.

---

## 0. The rules that matter most

1. **It must never feel like a slideshow.** Build a few continuous *worlds* (6–8 per reel) and move a camera inside each one: push in, pull out, truck, tilt. Never make 15+ hard cuts.
2. **Everything is synced to the voice.** Every word, number and animation starts on a word timestamp from `words.json`.
3. **Give people time to read.** Hold each caption at least ~1.5 s. If the voice is fast, drop text rather than speed it up.
4. **Minimal text. There is no caption rail and no running subtitles.**
   - Text only appears for the hook, a key question, a shocking fact or number, or one important line.
   - It is big (76–110 px), readable and often mid-screen.
   - Everything else is explained by animation.
   - **Never over-label.** Tags like "the gap", "SMARTER →" or titles on every box were hated. One short caption per idea, plus names under logos.
5. **Keep out of the danger zones.** Important text, logos, faces and numbers stay inside **x 90–950, y 250–1540**.
6. **Use real assets.**
   - Real logos (SVG), people, places and machines.
   - Show a brand's logo the moment it is mentioned.
   - Label model/open-source logos with their names (DeepSeek, Qwen, Llama, Mistral).
7. **Use 2–3 sound effects at most.** Keep them quiet, each with a reason, and never repeat one.
8. **Hide bad pronunciation** with a sound plus a voice dip, and show the name big on screen.
9. **End card:** the DP as a plain circle, `@zbacktrack`, "The real stories behind the biggest deals", and FOLLOW.
10. **HD matters.** Use static grain, a fully drawn frame 0 and a two-pass video encode.
11. **Deliver ONE mp4.** It goes to the user's "NOTTTTT posted" folder (§16.8).
12. **Nothing may look AI-generated.** No neon glows, purple/teal gradients or chrome.
13. **Frame 0 follows the Google × Wiz style** (§14): the full first line is already rendered in cream/white, a lavender highlight sweeps onto the key word and that word turns BLACK. It fills the screen, is alive and is hooky.
14. **Mix light and dark:** Broadsheet paper by default, with 2–4 dark "night" worlds for tension beats.
15. **Real photos of places and machines beat drawings.** Show the real photo, then animate over it.
16. **More animation per world.** Something is always alive: a slow push, counters, parts separating, rows re-sorting.
17. **Scripts follow the Wiz structure (§2):** plain step-by-step explanation, with a metaphor only when it truly helps.
18. **Literal beats metaphor for data.** When comparing companies or models, show the real thing: a live **leaderboard** (rows with logo, name and bar that race and re-sort), real charts, real cards.
    - **Rejected:** mountains and climbers, block buildings, hand-drawn doodles, over-labelled mini-charts.
19. **One idea chain, one world.** When a VO line links 2–3 ideas, keep ONE world and let it *transform*. For example, the same leaderboard flips its column from "how good" to "tokens used" and re-sorts, then its rows fly into the Hugging Face logo.
20. **Use the whole screen.** Main elements span x 80–1000 and y 500–1540. No tiny widgets floating in empty space.
21. **Never touch the voice** (§16.1): no speed change, no compression, limiting or gating, no pause cuts. Only a 48 kHz resample plus a fixed gain, and one lossy audio encode.

---

## 1. Pipeline overview

```
Research → Script (Wiz structure) → Voiceover (user records/TTS) → words.json
→ World plan → Assets → Build (HyperFrames HTML/GSAP) → Puppeteer QA frames
→ Sound mix (WAV) → Render (streaming) → 2-pass video encode + mux clean audio once → Deliver 1 mp4
```

---

## 2. Script (Google × Wiz structure)

1. **Hook (0–3 s):** a shocking sentence plus a contradiction.
   - "Meta built an AI that shops for you. Amazon kicked it out in less than two weeks."
   - "Nvidia just paid $13 billion for a company that makes almost no money."
2. **Name and context:** what it is in 1–2 plain lines, plus one big stat.
3. **The simple picture:** one everyday analogy for the mechanism, only if needed. For example, Amazon is a mall whose first shelves are paid ads.
4. **The conflict or real reason:** why it matters, with 2–3 hard numbers.
5. **The counter-move or irony:** a rival's opposite move, a double standard, or a court loss.
6. **The payoff line:** one quotable reframing sentence.
7. **CTA:** "Follow for the real stories behind the biggest deals."

Writing rules:
- 230–290 words (≈85–105 s). Research first, and put every number in the fact notes with its source.
- **Don't reuse stock transitions** like "Here's the twist" or "Here's the crazy part" across reels. Vary them, or cut straight to the fact.
- **Avoid words that sound alike when spoken:** "OpenAI" vs "open AI". Say "locked models" vs "free models".
- Write numbers as spoken ("thirteen billion dollars").
- Keep the angle business-first (money, strategy, rivals, customers).
- Always give an **images-to-download** list as a separate note.

---

## 3. Word timestamps (`words.json`)

- sherpa-onnx Whisper small.en transcription in ≤18 s chunks, plus pocketsphinx `set_align_text()`. Custom phonemes for brand words: nvidia, openai, deepseek, qwen, jensen, ceo.
- If a chunk fails ("does not match the grammar"), retry text variants: drop "dollars", or swap "a hundred and fifty" for "one hundred fifty".
- **When the user sends an updated voiceover, remap instead of rebuilding:**
  1. Align the old and the new audio.
  2. Run `difflib.SequenceMatcher` over the word lists to get matched start-time pairs.
  3. Patch `tl.to/from/fromTo/set` so every position goes through a piecewise-linear `TM(old→new)` and each duration becomes `TM(p+d)-TM(p)`.
  4. Rewritten sentences use new times directly (a `RAWT` flag).
  5. Everything else stays identical and in sync.
- Always verify with frames extracted from the real render at key word times.

---

## 4. World plan

- Write the table first: **World · time · canvas · camera path · one caption per beat · assets · SFX.**
- The camera glides between pages (0.8–1.0 s) and drifts while holding (scale 1.00→1.04).
- Timelines are a horizontal ribbon with stops, and the camera trucks along it. Nvidia × HF used 2023 $4.5B → 2025 "NO" stamp on $7B → 2026 phone-call card.
- Split-screen comparisons: top half locked (dark) vs bottom half free (paper), with the camera panning between halves.
- Page-turn wipes between worlds; no hard cuts.

---

## 5. Design system

- **Typography:** Playfair Display 800–900 for headlines and numbers, Manrope 700 uppercase for labels, Oswald 700 for stamps. Caveat was tested for handwriting and rejected as a style.
- **Broadsheet (default):** paper, card, ink, red signal, lavender highlighter, warm-black night beats.
- **Cosmos (space topics):** star field plus Milky Way, and the three.js globe (§13).
- **Highlighter `hl()`:** a lavender bar sweeps in and the word's colour tweens to black (`#16140F`). Add `.hl{text-shadow:none!important}` so dark words stay crisp. Put `white-space:nowrap` on the highlighted phrase so the bar never breaks across two lines.
- **Logo helper `ico(parent, file, size)`:** wide wordmark SVGs (DeepSeek, Meta, Gemini, Nvidia) are cropped to their symbol by showing only the left part of the image. Never let them squash or cut to "de" or "∞N".
- **Leaderboard component** (loved):
  - Dark rows 130 px tall with rank, logo circle, name at 38 px, a bar starting at x 400, and a lock or open-lock icon.
  - Locked rows are grey/cream; free rows are green with a glow.
  - Re-sort by tweening each row's `y` to `Y0 + position × rowHeight`, update ranks mid-move, and pulse a row when it overtakes.

---

## 6. Assets and downloads

- Wikimedia Commons: use the API (`action=query&prop=imageinfo&iiprop=url|size`, `list=search` with `srnamespace=6`).
- **Download trick (the device browser is the only route):**
  - Fetch everything inside ONE `javascript_tool` call.
  - Pack SVG text, plus images as base64 data URLs, into **one JSON file**.
  - Trigger a single `a.download`. Multiple downloads get blocked.
  - Use a normal HTML page as the origin (an SVG page has no `document.body`).
  - If the JSON doesn't appear under its own name, it is sitting in ~/Downloads as a hidden `.Q6L2SF6YDW…` temp file of the right size, so copy that.
  - Unpack it in the cloud with Python.
- Use thumbnails at 1280/1920 px for big photos (2400 px returns an error).
- **Downscale huge photos (4000+ px) before use.** They slow rendering.
- **Promo videos are gold:** they give real UI screens and animated mascots (§15).
- **Animation idea bank:** https://skillry.dev/ai-videos/opus-5-5 is a gallery of 389 Claude Opus 5.5 videos with their exact prompts: motion graphics, 3D scenes (Earth→atom zooms, cinematic flyovers) and interactive explainers. Check it for fresh animation ideas before planning each reel.
- Useful logos: OpenAI (symbol, wordmark), ChatGPT, Claude, Anthropic, Gemini, Google G, Nvidia (black/white), Hugging Face, GitHub, DeepSeek, Meta, Mistral, Qwen, Amazon (logo/icon).

---

## 7. Build (HyperFrames)

- One paused GSAP timeline, `window.__timelines.main`, and `build.sh` inlines head.js + map.js + scenes.js + tail.js into index.html.
- Extra libraries (gsap, three, rough) are loaded as local `<script>` files next to index.html.
- **GSAP gotchas:**
  - Never tween a scene to opacity 0 before its `autoAlpha` end-set; use `.01`.
  - `popIn`/`rise` animate `y`, so they overwrite a `gsap.set` position. Place elements with `left/top` and animate offsets instead.
  - Don't rotate or scale SVG `<g>` with CSS transforms; tween the `transform` attribute instead.
  - `counter()` with a snap tween breaks decimals, so use stepped `tl.set` for values like 4.5.
- **3D globe:** three.js r149 driven by an `hf-seek` listener, with a satellite chase-cam (`G.track`) (§13).

---

## 8. Sound and voice quality

> **Superseded by §16.1.** The voice stays untouched, like Google × Wiz: about −18 LUFS, no compressor, limiter or gate, no stretch.

- **Voice:**
  - Never change the VO speed or pitch, and never re-time it. The pipeline was measured: pauses match the source within milliseconds. If some lines feel fast, it's in the recording, so re-export it from the TTS.
  - Ask for the voiceover export at the highest quality (WAV or 192 kbps+ MP3). A 128 kbps mono MP3 source limits the quality.
  - Mix at the source sample rate and keep the channel count. Only downmix when the source is already mono.
- `sfx.mix(vo, cues, dur, out, fxgain=.34, bedgain=.015)`: 2–3 cues (boomS on the big number, a stamp on a rejection, a whoosh on a split).
- **The final mp4 audio is encoded ONCE:** mux `assets/mix.wav` directly into the final file at AAC 192 kbps. Never re-encode the render's AAC track, because a double AAC encode softened the voice.

```bash
ffmpeg -i video_2pass.mp4 -i assets/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart final.mp4
```

---

## 9. QA before render

- **Puppeteer harness** (`/tmp/qa.cjs`): load index.html, seek the timeline step by step (`tl.seek(x); return 1`), and screenshot the listed times. Make a contact sheet with PIL.
  - **Always `return 1` from `evaluate`.** Returning the GSAP timeline object hangs puppeteer.
- `hyperframes snapshot` can miss some CSS-transform states, so trust puppeteer frames or the real render.
- Check every changed frame: readability, danger zones, overlaps with captions, logos not cropped, and sync against the word times.

---

## 10. Render and encode

- Render with `--low-memory-mode`, plus `HF_DE_PARALLEL_STREAM=true` for streaming encode with 2 workers. Otherwise disk capture needs ~27 GB for 110 s and fails.
- Start it in the background from a wrapper script and poll `framesCompleted` (~12–13 min for 108 s).
- Stop a render by killing its PIDs (`pgrep -f "node.*hyperframes"`). Never `pkill -f` a pattern that matches your own shell.
- **Video:** two-pass x264, with the bitrate set to fill ≤30 MB (e.g. 1950k for 108 s).
- **Audio:** mux the WAV once (§8).

---

## 11. Delivery

> **Superseded by §16.8:** split into parts, commit them to NOTTTTT posted, join on the device, verify the md5.

- One mp4 of 30 MB or less, sent in the chat. Device commits are capped at 20 MB, so the user downloads the reel from the chat.

---

## 12. Feedback log

- Worlds with camera travel, not slideshows. Synced exactly to the VO.
- Broadsheet was loved. Neon purple read as AI slop.
- Real logos and photos, and a logo whenever a brand is mentioned (the Dell logo on the chips hook).
- The frame 0 Wiz style matters most: full line rendered, lavender sweep, the word turns black, full screen.
- Globe covers get a starry sky, and text never collides with the Earth.
- Minimal captions only; no subtitle rail. Too many captions and labels were rejected repeatedly.
- 3D globe/satellite reels were loved ("what a reel").
- Satellite shots need camera motion and must never leave the frame, so use a chase-cam, then pull out.
- Radiation/heat beats worked as line-art X-ray diagrams with a scan beam, like the Wiz X-ray.
- Hand-drawn (rough.js) mountains and building blocks were rejected: too metaphorical and small. A literal full-screen leaderboard was accepted.
- Names under open-source logos. The DeepSeek, Qwen, Llama and Mistral comparison was requested.
- Voice: don't speed up lines or reduce quality (§8).
- Don't repeat "Here's the twist" across scripts.
- **Amazon × Muse was rated "one of the best".** Key reasons:
  - The product's own mascot walked through the whole story as the main character.
  - The camera carried it between worlds.
  - It used real product UI.
  - The purple highlight was used only 3 times.

---

## 13. Real 3D in HyperFrames

- three.js r149 WebGL layer, with state in `G`, tweened by GSAP and rendered in the `hf-seek` handler (`preserveDrawingBuffer:true`).
- Earth: a day/night textures shader with a terminator, city lights and an atmosphere rim. Pin HTML labels via projection.
- **Chase-cam:** in `preRender`, if `G.track>0`, place the camera at `sat + normal·trUp·trD + (tangent·cos q + sunDir·sin q)·trD`, look at the satellite, and lerp by `track`.
  - Tween `trD` (close ≈1.05 → pull-out 2.7–3.3), `trAng` (avoid 0 = edge-on panels) and `offY` (to lift the subject above bottom UI).
- Keep headline text in the fixed scene layer at top ≥ 290.

---

## 14. Frame 0 recipe (Google × Wiz style)

- A real photo or 3D scene (HQ building, globe) dimmed with a gradient.
- The brand logo on top at ~y 280.
- The full headline at y 400–800, 88–100 px, cream.
- A key-word highlight sweep at 0.45 s, with the word turning black.
- A strong visual below (a price tag swinging on a mystery "?" box that flips to reveal the logo, a chip orbiting the Earth, etc.).
- Everything readable at t=0.
- **Word-by-word variant** (Amazon × Muse, loved):
  - The brand logo and the first word are visible at frame 0. Each next word blurs in on its timestamp (`head2`).
  - The main character enters on the verb ("an AI that **shops**").
  - A whip pan (0.4 s, world strip x −1080, blur 16 px) carries the character from photo 1 (Meta HQ) to photo 2 (Amazon HQ) on the rival's name.
  - The punchline action happens on the verb: the Amazon smile-arrow kicks the mascot off screen, with a red vignette pulse, a screen shake and a whoosh.
  - The next world opens as an iris (`clipPath: circle()`) from an icon that popped up in the previous scene.

---

## 15. Character journeys (the Amazon × Muse method)

**Idea:** when the story is about an agent, app or product, make its mascot (or a clear stand-in) the protagonist and let it physically go through each beat:
- climbs the chart;
- shops;
- ignores the ads;
- buys and leaves;
- hits the locked door;
- walks through the open door.

One character tying the worlds together beats any caption.

**Getting a real animated mascot:**
- Find the brand's promo video. Contact-sheet it every 3 s, then every 0.5 s where the character moves.
- Extract ~2 s at 24 fps and cut the character out with a colour key. For a light background with a beige mascot:
  - keep pixels where `R−B>14`, saturation < 0.42 and value > 70;
  - apply a binary opening, keep the largest connected component, then fill holes;
  - erode by 1 px and blur 1.5 px;
  - crop a fixed box so the character doesn't jitter.
- Pick one loop (16 frames looked seamless) and pack it into one strip PNG (330×408 per frame).
- Also crop still avatars (circle mask) and real UI screens from the promo (chat, product list, order card, "Done!").

**Seek-safe sprite animation (no onUpdate):**
- Give the sprite `background-repeat: repeat-x`.
- `walk(m,a,b)` tweens `backgroundPosition` from `0` to `-N*w` px with `ease: steps(N)`, where N = (b−a)×24. The wrap happens by itself.
- Move the wrapper's `x/y` in sync and flip it with `scaleX:-1` for direction. Add a blurred ellipse shadow under the feet.
- **Rider trick:** a small mascot rides inside a leaderboard row as the row climbs, and hops when it hits #1.

**Beat patterns that worked:**
- **App Store climb:** only ChatGPT and the subject app are real; the other rows are grey placeholders (no fake names). Rank counts down 48→1 in stepped sets, a DAY 1→10 chip counts up, and the row gets a blue glow at #1.
- **Tilt-down into a phone:** one tall world (0–3840) and the camera pans down.
  - Inside the phone, a typed user request is followed by the real UI crops sliding up.
  - Camera push to ×1.5 on the product row, rings on the prices for "compares", then a push on the Allow button with a tap ripple, then "Done!".
  - Pull back to ×0.72 and give the key line ("No scrolling. No searching.") the space above the phone.
- **Store aisle:** a search page built in HTML with product cards (hue-shifted variants of one real product photo). "Sponsored" tags slam in and coins fly into the logo, then the camera zooms out for a $ counter.
  - The agent walks across the cards: ads wiggle for attention and then go grey, and it walks to the organic item, a ✓ pops and the product attaches to the mascot.
- **Door beats:** a rolling shutter slams on "locked", with a padlock, a stamp SFX and a bounce-back. The opposite brand's door leaf swings open (`rotationY −78`) with a warm glow, and the mascot walks in and fades.
- **Real popup text** on a white card with the key phrase turning red and underlined. Claim vs counter-claim as two dark cards with white logos.
- **Rival agent:** its logo inside a pulsing orb hops between three generic browser windows (no brand names), ticking each. Then an "Opt me out" form whose checkbox tick is drawn in.
- **Court beat:** a paper document card, a line "Injunction: GRANTED" struck through, and a REVERSED stamp on "lost".
- **Payoff:** price tags drop away, then the assistant avatars in a row with names, a request bubble, and a dot hopping between them.

**Transitions used (vary them):**
- whip pan;
- iris from an icon;
- camera tilt within one world;
- page-turn wipe (`turn`) into dark or paper;
- mall photo push-in with blur into the next UI;
- a sideways slide with the old scene exiting left.

**Budget:** 93 s, 2,790 frames, rendered in ~11 min. Video 2-pass at 2250k plus AAC 192k gave 28 MB.

---

## 16. Learnings from the India cheap-phone reel (Oct 2026)

This reel ended at v5, 1:27. The audio was rated "very nice".

### 16.1 Voice: the final policy (supersedes the processing in older notes)

The recording leaves the pipeline **exactly as the user saved it**. Google × Wiz is the benchmark.
- **Allowed:**
  - one high-quality resample to 48 kHz (`aresample=48000:resampler=soxr:precision=28`);
  - one **fixed** gain (`volume=-1.5dB`), applied only so 0 dBFS peaks don't clip in AAC.
- **Not allowed:** compressor, limiter, de-clip, gating or "cleanup" in the pauses, pause trimming, and time-stretch, even the "high quality" Rubber Band R3.
- **Target:** about −18 LUFS integrated and −1.5 dBTP. For reference, Wiz was −18.8 LUFS.
  - The earlier heavy chain (gate → highpass → compressor → limiter to −16 LUFS) made the voice 2.8 dB louder and ~3 dB brighter above 8 kHz than Wiz, and it sounded "off".
- **Pacing check:** compare words per minute and pause stats with Wiz before blaming speed.
  - Wiz ran at ~181 wpm with a 0.37 s mean pause; this VO was ~177 wpm. The user records at 1.19× in his tool, and that is fine.
- **If a reel runs long, ask for a shorter script and a new recording.** Don't edit the audio.
  - Word cuts plus a 4.4% stretch were tried in v3 and later rejected.
- **Ask for the export:** WAV at 48 or 44.1 kHz, with peaks around −3 dB.
  - His tool exported 32 kHz with 0.0 dBFS peaks and a few clipped samples. WAV vs MP3 was not the issue.
- **SFX:** 3 at most, at −24 to −32 dB, added under the untouched voice.

### 16.2 New voiceover: remap instead of rebuilding

1. Transcribe and align the new take.
2. Run `difflib.SequenceMatcher` over the old and new word lists; every matched word gives an (old_t, new_t) anchor. 248 of ~250 words matched.
3. Apply a piecewise-linear map to every timeline child in the footer: `startTime ← M(st)`, and set `timeScale` so that `end ← M(st+dur)`.
4. **Scenes rewritten for the new take** (the new hook, the shopping-app scene) are authored directly in new-voice time:
   - snapshot `tl.getChildren()` into `window.__PRE` before W0;
   - after the last rewritten scene, add every new child to `window.__NOREMAP`;
   - the remap skips those.
5. **Deleted lines:**
   - Remove that beat's elements (e.g. the "Price ↑" chart).
   - Add two custom anchors that squeeze the gap into ~0.1 s.
   - Never let the map stretch a removed beat across the neighbouring words.

### 16.3 Determinism: no jitter, no one-frame flashes

- `gsap.defaults({lazy:false})` at the top of the core.
- **Chained `.to` tweens on the same prop:** after a remap, a later `.to` can record a stale start value (seen as a 2.4× chip pop and a dipping bar). Use `fromTo` with explicit from values for the second and later tweens.
- **Fade-ins:** turn the scene visible at `a+0.001`, never at the exact frame the opacity tween starts. Otherwise one frame flashes at full opacity.
- **Outgoing scenes:** keep them visible until the incoming one is fully opaque, or the paper base flashes between two dark scenes.
- Prime with `for(k…) tl.time(k/120)` after any remap, then `seek(0)`.

### 16.4 Strict QA set (run on every render)

1. `qaph.cjs`: every 0.25 s, range-rect of every visible `.disp/.lbl/.stamp/.pill`, for overlaps (>4 px) and the safe zone (x 88–952, y 245–1545).
   - **False positives:** backface-hidden card faces, word-built caption containers before their words appear, frames mid-pan or mid-zoom.
2. `qaui.cjs`: the same check over every leaf div and SVG `<text>` inside app-UI scenes.
   - Text scrolled under a sticky header shows up as "overlap"; it's hidden on screen, so ignore it.
3. Storyboard contact sheets at every scene boundary, plus `fps=1/2.5` tiles from the **final mp4**.
4. `jit.py` on the final mp4:
   - flicker: frame i+1 differs while frame i+2 ≈ frame i;
   - alternating: LK median-flow sign flips over 4 frames.
   - Then look at the flagged frames by eye. Two objects moving in opposite directions trip the alternating check; a ticking counter can trip the flicker check.
5. Loudness and true peak of the final file, and check the audio stream equals the previous version when only video changed.
6. Delivery md5 must match on the device.

### 16.5 Transitions that made it "not a slideshow"

- **Match cut into 3D:** the camera pushes into the product photo's phone, which crossfades to the CSS-3D phone at the same screen rect (start it at `rotationY −50`, scale 1.2). It turns, the back cover lifts off in 3D, and the camera **dives into the board**: the PCB layer scales 0.37→1 from the board rect while the phone scales up and fades.
- **Iris into a chip:** zoom into the memory chip, then `clipPath circle()` reveals the dark data-centre world from the chip centre.
- **Zoom-through:**
  - the camera zooms into the server memory tray, and the next scene's chip group starts at ×2.4 and settles to 1;
  - the outgoing camera ×1.5 + fade while the incoming camera goes 0.82→1.
- **Clip reveal from a shape:** the next photo opens out of the previous frame's phone outline: `clipPath inset(... round 64px)` → full screen.
- **Pans:** the outgoing scene moves with the incoming one (`x:−1080` or `y:−1920` together), like one camera.
- **Drift:** held frames get a slow `scale 1→1.03` on the scene, with the origin at x 520 so the right edge stays clear.

### 16.6 Scene patterns that worked

- **Shopping-app price story** (replaced a hand-and-price-tag frame the user hated):
  - A phone rises, and the search bar types the product. Results cards appear (only the subject product is real; the others are grey placeholders), and the subject card highlights and gets a tap ripple.
  - The product page slides in while the camera zooms until the app screen IS the frame. The bezel fades, the radius goes to 0, and the overflow becomes visible so the page continues below.
  - The page has a "LAUNCH PRICE · DEC 2025" chip, a big price that counts up through each real price with a date chip, and a price-history step chart that draws with it, then a "▲ ₹6,000 more than at launch" badge.
  - The page scrolls (not the camera) to a Specifications card where each row ticks "✓ SAME".
  - **No Amazon or Flipkart logo, name or exact colours.** A branded screen with prices we didn't take from that store would read as a fake screenshot. Use a neutral dark header with a search bar and a "Deliver to Mumbai" strip.
- **Inside the phone:** a full-screen PCB with RAM / CPU / STORAGE chips. Lavender data pulses run along gold bus lines (dash-offset loops).
  - Labels are big stamp text above each chip (Oswald 66 + Manrope sub).
  - **No decorative colour squares or photo thumbnails** (hated).
  - RAM and STORAGE slide together into one MEMORY chip.
- **Scale comparison:** a 15×8 grid of 120 phones builds row by row with a counter, then every phone flies into the one chip.
- **Choice beat:** a memory chip on top, two curved paths to "PHONE BRANDS" vs "AI COMPANIES" cards, pay bars, then "✓ CHOSE AI" with chips streaming down the AI path (keyframes).
- **Real street/store photos for India beats:**
  - opener: the Kolkata phone-market street with vivo / OPPO / Samsung / Mi signs (Unsplash);
  - "India hit hardest": the Dabri (Delhi) OPPO + vivo store at night (Wikimedia, 4080 px).
  - The user rejected generic people photos for phone beats; they must show phones or brands.
- **Bars with values:** the % counter rides on the end of its bar (`fromTo x 0→barWidth`), never parked at the final position while the bar grows.
- **"Here's why."** is written big above the phone right when it's said: Playfair 92 at top 262 with a highlight on "why.".

### 16.7 Images and tools

- Unsplash: WebFetch the search page for `images.unsplash.com/photo-…` IDs, then curl `?q=95&fm=jpg` for full HD.
- Pexels is robots-blocked, so don't use it.
- Wikimedia API from the device's curl (with a User-Agent) for store/brand photos and logos. Samsung, SK hynix, Micron, Crucial, REDMI and Xiaomi SVG/PNG are all there.
- Official product renders: scrape the brand page's image URLs (mi.com: `i02.appmifile.com/.../pc/*.jpg`).
- Cut out a product (e.g. a hand holding a phone) with `rembg` (`isnet-general-use`).
- If the cloud shell's safety check times out, the device's python/PIL can do crops directly in the folder.

### 16.8 Delivery (supersedes §11)

- Render the full reel at `--quality high`; the final is ~90–110 MB.
- Split it into 24 MB parts (the first part prefixed with `ZBKT`), commit one part per call into `NOTTTTT posted/_to_delete/<name>_parts`, then join on the device: `(tail -c +5 p00; cat p01 …) > file`.
- Verify the md5, and move the previous version into `_to_delete` (deleting isn't allowed).
- Chat upload is capped at 30 MB. If the device is offline, keep the parts and commit when it's back.

## 17. Learnings from the atomic-clock reel and topic hunts (Oct 2026)

### 17.1 Topics: what the channel is
- zbacktrack is an **AI / tech business + India tech** channel, not a science channel. Check the account first (vidIQ `vidiq_ig_profile_reels`, handle `zbacktrack`) before pitching.
- What performs: India tech stories (ISRO NavIC, 63K plays, ~6× anything else), then big-money deals with the number in the hook ("AMD just agreed to pay $8.2 billion", "Nvidia just paid $13 billion for a company that makes almost no money").
- Don't pitch generic concepts, well-known explainers or old history. Pitch this week's stories in the deal / India-tech format, each with a hook line, the verified facts, and what is single-source.
- Flag weak sourcing plainly (aggregator-only, anonymous, conflicting dates). Drop apocryphal stories (e.g. the cobra bounty).

### 17.2 Scripts
- Always send the **whole voiceover as flowing paragraphs**. Never numbered lines (hated).
- Plain words, short sentences, a dramatic first line. ~2.5 words/s on the user's recordings: 50 s ≈ 115–120 words.
- Keep the user's recording untouched and as recorded unless they ask; report the length against the target.

### 17.3 Look and motion
- **Frame 0:** a real, topic-related HD photo with the caption typing in. Never a random/unrelated photo (a city bridge for a GPS story was rejected).
- **No topic kicker above the caption.** Captions are the headline (Playfair), word by word.
- **Newspaper beat:** cream front page on dark, masthead "ZBACKTRACK STORIES" (never "India Ledger"), the spoken line typed as the headline, a real photo under it.
- **Earth:** show the whole globe; don't centre India unless the story is about India. Check orientation (north up, continents correct), no borders.
- Slow, unhurried animation; slow push on flat scenes; a very slight drifting light leak; mix dark and cream scenes; some frames only a big caption for a question/fact.
- **Text-light:** one label per beat at most; cut HUD captions/labels that repeat the voice.
- Real public-domain photos behind 3D: render three.js with `alpha: true`, clear alpha 0, and draw a dimmed, blurred photo underneath (`labBg`).

### 17.4 Images
- Wikimedia Commons API (`generator=search … filetype:bitmap`, `iiprop=size|extmetadata`) to find PD files; download with `Special:FilePath/<name>?width=1920` and a User-Agent. It rate-limits: sleep 8–30 s and retry; check the file is JPEG, not HTML.
- Good PD sources: NASA ISS night-city photos (Chicago, NYC), NIST/JILA atomic-clock lab photos, GPS.gov image library.

### 17.5 Render and QA
- SwiftShader 3D costs ~3–4 s/frame; a 100 s reel takes 60–75 min in 4 parallel segments. Balance the cuts by 3D load, not by time.
- The cloud container can restart mid-render (check `uptime`); start renders with `setsid nohup`, and re-check before trusting a long wait.
- Before a full render, render stills across the whole reel and fix QA there; after it, fix leftovers by **patch-rendering only the bad window** (`SEGMENT=1 START= END=`) and splicing with trim/concat inside the final encode.
- QA notes: gate element boxes during cross-dissolves (both scenes' labels exist mid-fade); keep label boxes 16 px clear of panels; extend each caption into the following pause (up to the next caption − 0.17 s) for reading time. Word-by-word lines will still flag "too short" when the voice is fast; report them, don't hide them.
- Numbers on screen must be real (e.g. thorium's 148 nm light ≈ 2.02 × 10^15 waves/s, not an arbitrary odometer).

### 17.6 Delivery
- HD: two-pass x264 ~7 Mbps (stays under GitHub's 100 MB), voice AAC 192k at the recording's native rate, encoded once. Chat copy: ~1.9 Mbps (< 30 MB).
- Push both with `git add -f` and **always give the GitHub links** (file and folder) in the reply.
