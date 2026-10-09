# Graphic recipes and extensions

Use this as a production menu, selecting the graphics that advance the script. Numeric settings are starting points for 1080 × 1920 authoring, not measured original values.

## 1. Metallic person

Geometry: SVG circular head, dark center and thin silver/green illuminated rim; shoulder dome fading into black. Three layers are enough: silhouette, broad directional value gradient, narrow highlight. Optional transparent disc behind the portrait for A's agent-request scene.

Motion: 0.5 s opacity/scale arrival, then a 0.7 s paired reframe. Keep buyer on one side and seller on the other throughout the story. Green can consistently identify the automated participant.

Failure: uniformly white head plus gray body becomes a generic user icon. Preserve the dark interior and highlight asymmetry.

## 2. Beveled robot

Geometry: octagonal head plate with clipped top corners, two narrow eye slits, tiny side ears, top bevel and darker lower face. Add a second larger plate for shoulders when needed. Use one parameterized component with `tone`, `size`, `eyes`, and `rim`.

Motion: simple entrance and shared camera motion; stagger duplicate instances by ~0.12 s. Resist idle bobbing unless it supports the beat.

Upgrade: model only if the robot turns and exposes new surfaces. Swapping gradients during a fake rotation can look like its material is changing.

## 3. Expanding agent prompt

Geometry: beveled green capsule with chamfered ends. A decorative shell and content mask have separate children. Text remains a fixed font size.

Sequence: user holds → capsule appears narrow → shell/mask width grows → text becomes visible → entire prompt travels/reframes → smaller prompt becomes the header of a workflow.

Use local clip-path inset or a width tween. Do not `scaleX` the text. The source's oversized travel is expressive, but a new version should let the key request remain readable before zooming out.

## 4. Agent workflow

Geometry: prompt at top, robot beside a vertical spine, 3–4 task labels and completion markers, tiny finished website underneath. A label becomes active, the marker advances, then the preview appears.

Sequence: show one task at a time, accumulate completed states, then pull back once to show the full process. Build the spine once and preserve it. A rotating loader, if needed, uses finite timeline rotations.

Extension: draw payment debits as small packet/amount pairs exiting at the relevant task. This makes the payment infrastructure argument concrete.

## 5. Reflective growth chart

Geometry: faint grid, fine axis, one curve, green underglow, a small green-faced coin at the active point, sparse direct labels. Keep the source data table separate from rendering code.

Sequence: axes first; path grows; marker advances on that same path; labels arrive near milestones; year bracket expands. Retain enough time to read the final value.

Failure: easing the marker independently makes it detach from the line. Equal arc-length travel is suitable for decorative routes, while a time-series chart should map x to time. Do not use an arbitrary steepening curve as purported financial evidence.

## 6. Certificate into vault

Geometry: stock certificate plate; duplicates slightly offset in depth; vault rear/body; certificate clipping region; front face and knob; dark floor reflection. Order layers deliberately: back → papers → front door → highlight → labels.

Sequence: preserve the initial certificate, duplicate it into a stack, reveal safe around/below it, lower papers behind the front face, hold closed state. The visible certificate should not simply dissolve into a safe icon.

Extension: open the safe, extract a document, then split ownership into tokens. True 3D becomes valuable if the door rotates toward camera.

## 7. Magnifying glass reveal

Geometry: main paper text plus a duplicate enlarged copy clipped inside a circular lens; ring and angled handle on top. The lens reveals actual detail at its position.

Motion: lens crosses a word/region with a short pause. Move the clipped enlarged content in the opposite direction so it tracks the underlying paper correctly.

Failure: magnifying only a floating word detached from the document breaks the physical metaphor. CSS blur is not magnification.

## 8. Transaction intermediaries

Geometry: buyer/seller pair, central asset above, horizontal line with six or another story-justified number of nodes, restrained green accent at destination. Node count must follow the explanation, not the reference by habit.

Sequence: start close on two people and asset → separate/reframe → reveal line → nodes appear in order → packet traverses → fee overlay exposes accumulated cost.

Extension: show a packet of fixed width visibly lose a small portion per fee; place exact amounts in clear labels. If drawing a numerical comparison, derive the remaining width from actual input values.

## 9. Fee diagram

Geometry: baseline plus thin contrasting upper cost trajectory; endpoint bracket and fee label. Avoid suggesting statistical precision when the source only supplies a conceptual claim.

Sequence: people recede, chain stays, cost overlay becomes the focus. End on a short statement rather than a second busy chart.

Extension: alternative rails side by side, with the same transaction amount and unit labels. Keep a common scale so the comparison is honest.

## 10. Chrome clock and computer

Geometry: circular brushed-metal face using a multi-stop gradient, fine ticks, two hands, center pin, small monitor in front, transaction chain underneath. The face, hands, and monitor are separate groups.

Motion: deterministic hand rotations with finite revolutions; camera slowly reframes. A fast hand can represent speed but does not by itself demonstrate lower fees. Keep the persistent chain to express that distinction.

## 11. Stablecoin/token ring with network streams

Geometry: layered outer ellipse, dark inner ellipse, bright inner lip, label and optional base glow. Several cubic Bézier lines curve toward/away from the ring, distributed symmetrically with slight seeded variation.

Motion: gentle ring pose change; line dash offset moves packets or dashes; system pulls back into a smaller network diagram. Compute all path geometry once. Keep repetitions finite and tie offsets to timeline time.

Performance: reuse SVG definitions. Avoid individual huge blur filters on dozens of lines. One restrained global underglow can be enough. Three.js is warranted for a thick rotating torus; fixed front view can stay SVG.

## 12. Brand-color product reveal

Geometry: dark base with a few huge warm radial gradients, sharp logo and divider, clean product name. Warm field stays behind the content.

Motion: soft gradient translation/scale; lockup settles with a short blur resolve; supporting phrase assembles below. Keep maximum blur out of text holds.

Failure: saturated full-frame rainbow with tiny words changes the restrained art direction. The reference's orange belongs to a Mastercard-specific scene; it is not a universal accent.

## New graphics that fit this language

| Concept | Visual action | What it explains |
|---|---|---|
| Settlement | Two metallic ledger cards update, then a green lock closes | Both sides agree on completion |
| Tokenization | One certificate divides into a measured grid of token units | How a claim can be represented in smaller units |
| Liquidity | A narrow pipe opens into a wider channel as waiting packets clear | Bottleneck removal, with explicit units if quantitative |
| Permission | Agent approaches a silver gateway; approved credentials activate one path | Authorization rather than vague AI magic |
| Reconciliation | Two sparse ledgers align and mismatched entries are highlighted | Why systems require checking |
| Network effect | Repeated agent/token modules join a larger system after a camera pullback | Scale through repetition of a known unit |
| Escrow | Token enters a transparent chamber; release waits for two completion lights | Conditional payment |
| Risk | A physical shield intercepts one labeled failure path while others remain | A bounded protection rather than “zero risk” |

## Template for a new scene brief

Write: “At [time], the viewer believes [prior model]. Show [persistent object] doing [one action], revealing [mechanism]. Hold [readable conclusion]. Hand off [shared object/shape/direction] into [next scene].”

Example: “At 28 s, the viewer thinks a stock is just a digital card. Keep that card on screen; stack it and lower it into a metal vault. Hold the visible storage mechanism. Pull back from the vault into the buyer/seller infrastructure diagram.”

This brief forces the graphics to explain the script instead of decorating it.
