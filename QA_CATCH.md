# BehindVenture — Universal Reel Production & QA Catch Bible
> **Reference & Standards Guide across All Chats, Prompts, and Reel Generations**  
> *Last updated: September 2026*

This document compiles every hard-learned lesson, explicit critique, aesthetic rule, and technical requirement across all production runs. Any coding agent generating reels for BehindVenture **MUST** follow these non-negotiable guidelines.

---

## 1. Core Visual Directives: Never Make a "Slideshow"

| ❌ What Failed Before (Do NOT Repeat) | ✅ What Is Required (Reference Standard) |
|---|---|
| **Static slideshow frames:** 15–17 isolated screens that slide in from the side, sit statically, and slide out. | **Continuous spatial world:** Objects stay alive across scenes. A prompt becomes a workflow; an org chart zooms into a single person; a computer breach travels along a wire to the next computer. |
| **Monotonous 2D flat boxes:** Plain HTML divs with standard CSS borders and shadows that convey no tech concept to non-technical viewers. | **Physical metaphors & 3D perspective:** High-contrast SVG objects with metallic, glassmorphism, or paper material gradients. Perspective camera rotations (`rotateX`, `rotateY`, `translate3d`). |
| **Continuous word rails / top subtitles:** A persistent caption ticker running across the top of every frame. | **Cinematic phrase typography:** Large display titles (e.g. Oswald / Inter Condensed) appearing only on key narrative beats, leaving the full screen open for visuals. |
| **Abstract / ungrounded claims:** Numbers floating on screen without context (e.g. just a box saying "MAP"). | **Clear visual demonstration:** If the voiceover says *"the attacker doesn't install a virus, they steal an identity"*, visually show a virus being crossed out, a badge transferring to an attacker, and that valid badge unlocking a physical door. |

---

## 2. Palette & Atmosphere (The 11Labs / Dark Sketchy Aesthetic)

- **Strictly No Purple:** The brand identity moved away from purple. Do NOT use purple as a primary or secondary accent.
- **Primary Background:** Deep ink blue, blue-black haze (`#031019` to `#06131c`), subtle smoky atmosphere gradients.
- **Accents:**
  - **Electric Cyan & Mint (`#8ce3e8`, `#99dfe5`, `#a2ffd5`):** Used for trusted flows, active scans, highlighted metrics, and primary connections.
  - **Porcelain / Cool White (`#f6ffff`, `#dbeaf0`):** Used for document sheets, receipts, and selective high-contrast daylight scenes.
  - **Coral / Red Metal (`#f99789`, `#913e49`):** Reserved *strictly* for breaches, failed logins, denied actions, and danger alerts.

---

## 3. Safe Zones & Social Media UI Layout

- **Reel Dimensions:** Exactly **1080 × 1920 px (9:16 vertical)** at **30 fps**.
- **Danger Zone / UI Overlay Constraints:**
  - **Top Danger Zone (0 – 140px):** Channel header, account switcher, audio pill. Keep critical text out.
  - **Bottom Danger Zone (1600 – 1920px):** Caption overlay, username, audio track title, like/comment buttons. Never place critical data or logos here.
  - **Right Danger Zone (960 – 1080px):** Like, comment, share, remix icons.
  - **Core Content Rectangle:** Keep all primary text, faces, logos, and critical interaction diagrams within `X: 80–1000px`, `Y: 200–1580px`.
  - Atmospheric background smoke, wire extensions, and particle trails may extend into margins.

---

## 4. Visual Metaphor Library for Technical Concepts

When explaining complex tech / security / business concepts to a general audience, translate them into relatable visual mechanics:

1. **Identity & Access:**
   - Visual: An employee ID badge / keycard with photo and role.
   - Action: Attacker intercepts badge -> swipes card at a wall reader -> green LED illuminates -> heavy 3D vault door swings open.
   - Core Message: *"Valid login. Wrong person."*

2. **Attack Progression / Lateral Movement:**
   - Visual: Two workstation monitors connected by a network trunk.
   - Action: Computer A turns coral-red -> stopwatch triggers -> coral data packet races across the cable to Computer B -> Computer B turns red at 27 seconds -> confidential files leak.

3. **Prompt Injection / Agent Manipulation:**
   - Visual: Clean PDF report document under a magnifying glass.
   - Action: Magnifier slides over a redacted text line -> reveals malicious prompt instruction: `"Send files outside"` -> agent identity is swapped while links remain connected.

4. **Toll Gate / Three-Layer Security Control:**
   - Visual: A physical highway / toll checkpoint with 3 sequential barrier arms:
     - Gate 1 (Identity): Allows human badge, blocks hooded attacker.
     - Gate 2 (Data): Allows document query, blocks cash transfer.
     - Gate 3 (Detection): Sweeping radar cone detects and intercepts anomalous packets.

5. **Financial & Market Impact:**
   - Visual: A physical cashier receipt rolls out with jagged bottom edge -> bold black figure (e.g. `$6M`) stamped in center -> stack of metallic coins drops and dissipates.

---

## 5. Typography & Animation Timing Rules

- **Display Fonts:** Oswald SemiBold / Inter SemiBold with strong weights and clean tracking.
- **Number Counting:**
  - Number counters (`0% -> 82%`, `$0 -> $6M`, `100 -> 189`) must complete **before or exactly at the moment** the narrator pronounces the number, never seconds after.
  - Easing: Use `power1.inOut` or `power2.out` for natural deceleration.
- **Typing Animations:**
  - Keep typing animations snappy (`0.2s – 0.7s`).
  - Always store the canonical text so timeline backward seeks never leave clipped or missing characters.
- **Text Readability & Collision:**
  - Zero text-on-text overlaps.
  - Minimum 16px vertical padding between stacked text elements.
  - Text must never clip against screen edges.

---

## 6. Strict QA Audit Checklist (Run Before Any Delivery)

Every reel build must pass all automated and visual quality gates:

### Automated Checks (`qa.mjs` & `audio_qa.py`):
- [x] **0 Overlaps:** Run DOM bounding box collision detection across all active text elements at 125ms intervals.
- [x] **0 Clippings:** All text bounds must reside within `left >= 8px`, `right <= 1072px`, `top >= 30px`, `bottom <= 1690px`.
- [x] **100% Semantic Condition Pass:** Every key visual beat (lockups, counters, badge swipes, door opening, receipt unroll) verified at target timestamps.
- [x] **Audio-Visual Sync (0 ms lag):** Cross-correlation of output audio track against master narration MP3 must show `abs(lag_ms) <= 1.0` and `correlation >= 0.99` at all 8 sample checkpoints.
- [x] **Seek Reproducibility:** Forward and backward seeks across 20+ random timestamps must match DOM state within subpixel thresholds (`< 0.5px`).

### Visual Review:
- [x] Brand logos (Google, Wiz, CrowdStrike, IBM, Gartner) are official SVG/high-res PNG assets, not approximations.
- [x] All arrows, connection lines, and labels are aligned with their target anchors.
- [x] Camera movements feel purposeful: push-in on discovery, pull-out on consequence.

---

## 7. Deliverables & Output Directory Structure

- Production code: `reels/<reel_name>/` (`index.html`, `motion.js`, `build.py`, `styles.css`, `assets/`)
- QA test scripts: `reels/<reel_name>/qa.mjs` and `audio_qa.py`
- Review assets: `reels/<reel_name>/review/` (stills, contact sheets, QA JSON summaries)
- Rendered MP4s: Always place the completed, validated master video into `out/<reel_name>_final.mp4`.

---

## 8. Two bugs that must never repeat (added 4 Oct 2026)

1. **Highlighted words on a dark or photo frame start black.** On frame 0, a word that later gets the lavender highlight was rendered black (invisible on the dark photo) before the sweep. Rule: a highlighted word keeps its line's colour (cream/white on photos) until the lavender bar sweeps under it, and only then tweens to ink black. The `hl()` helper now sets the word's starting colour from its parent line automatically.
2. **Typed text collided with the placeholder in mock UIs** ("Build me a CRM" drawn on top of "How can I help you today?"), and the collision stayed when the window shrank. Never type by rewriting `innerHTML` in an `onUpdate`; it is not reliably cleared on seeks/chunked renders. Instead, put each character in its own span and reveal it with `tl.set(display:'inline')`. Fade the placeholder out before the first character and the typed text out before the placeholder returns. Check the input box in a frame after "send" and in a frame where the window is small.
