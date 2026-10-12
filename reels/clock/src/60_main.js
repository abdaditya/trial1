// ======================================================================
// timeline: scenes overlap ~1 s during every transition (slow, never abrupt); captions and labels sit on top
// ======================================================================
const SC = [
  { id: "hook", t0: 0, t1: 4.7, f: sHook },
  { id: "gps", t0: 3.7, t1: 12.8, f: gpsFrame, tr: "push" },
  { id: "ruler", t0: 11.8, t1: 21.6, f: sRuler, tr: "fade" },
  { id: "atom1", t0: 20.6, t1: 37.8, f: t => { atomFrame(t); atomOverlay(t); }, tr: "fade" },
  { id: "wind", t0: 36.8, t1: 39.8, f: sWind, tr: "fade" },
  { id: "atom2", t0: 38.8, t1: 53.0, f: t => { atomFrame(t); atomOverlay(t); }, tr: "fade" },
  { id: "spec", t0: 52.0, t1: 70.9, f: sSpectrum, tr: "fade" },
  { id: "cry", t0: 69.9, t1: 83.6, f: t => { crystalFrame(t); crystalOverlay(t); }, tr: "fade" },
  { id: "race", t0: 82.6, t1: 88.6, f: raceFrame, tr: "fade" },
  { id: "chart", t0: 87.6, t1: 94.9, f: sChart, tr: "fade" },
  { id: "fin", t0: 93.9, t1: 120, f: finaleFrame, tr: "fade" },
];
const CAPS = [
  { id: "c0", i0: 0, i1: 13, t1: 3.95, size: 66, st: { clock: { hl: "lav" } } },
  { id: "c1", i0: 14, i1: 23, t1: 7.0, size: 62, st: { atomic: { hl: "lav" } } },
  { id: "c2", i0: 24, i1: 30, t1: 9.4, size: 66, st: { late: { it: 1, hl: "or" } } },
  { id: "c3", i0: 31, i1: 34, t1: 12.3, size: 70, st: { farther: { it: 1, hl: "or" } } },
  { id: "c4", i0: 35, i1: 44, t1: 15.75, size: 62, ink: true, st: { billionth: { it: 1, hl: "or" } } },
  { id: "c5", i0: 45, i1: 54, t1: 21.3, size: 62, ink: true, st: { tiny: { it: 1, hl: "red" }, off: { it: 1, hl: "red" } } },
  { id: "c6", i0: 55, i1: 65, t1: 25.2, size: 62, st: { atom: { it: 1, hl: "or" } } },
  { id: "c7", i0: 66, i1: 73, t1: 27.5, size: 64, st: { atom: { hl: "lav" } } },
  { id: "c8", i0: 74, i1: 82, t1: 31.2, size: 62, st: { electrons: { it: 1, hl: "or" }, outside: { it: 1, hl: "or" } } },
  { id: "c9", i0: 83, i1: 85, t1: 33.5, size: 74, st: { exposed: { it: 1, hl: "red" } } },
  { id: "c10", i0: 95, i1: 102, t1: 39.5, size: 64, ink: true, st: { wind: { it: 1, hl: "or" } } },
  { id: "c11", i0: 103, i1: 111, t1: 42.5, size: 62 },
  { id: "c12", i0: 112, i1: 117, t1: 45.05, size: 66, st: { nucleus: { hl: "lav" } } },
  { id: "c13", i0: 118, i1: 123, t1: 47.0, size: 66, st: { smaller: { it: 1, hl: "or" } } },
  { id: "c14", i0: 124, i1: 128, t1: 49.6, size: 66 },
  { id: "c15", i0: 129, i1: 135, t1: 52.3, size: 66, st: { vault: { it: 1, hl: "or" } } },
  { id: "c16", i0: 136, i1: 145, t1: 57.1, size: 62, st: { huge: { it: 1, hl: "red" } } },
  { id: "c17", i0: 146, i1: 147, t1: 58.6, size: 78, st: { thorium: { hl: "lav" } } },
  { id: "c18", i0: 160, i1: 167, t1: 66.6, size: 62, st: { hunted: { it: 1, hl: "or" } } },
  { id: "c19", i0: 168, i1: 174, t1: 70.4, size: 62, st: { hit: { it: 1, hl: "or" } } },
  { id: "c20", i0: 175, i1: 180, t1: 72.35, size: 66, st: { crystal: { hl: "lav" } } },
  { id: "c21", i0: 181, i1: 184, t1: 74.45, size: 72 },
  { id: "c22", i0: 204, i1: 211, t1: 83.2, size: 64, st: { counting: { it: 1, hl: "or" } } },
  { id: "c23", i0: 212, i1: 220, t1: 88.3, size: 60, st: { first: { it: 1, hl: "or" } } },
  { id: "c24", i0: 221, i1: 226, t1: 90.55, size: 66, ink: true, st: { yet: { it: 1, hl: "red" } } },
  { id: "c25", i0: 227, i1: 235, t1: 94.6, size: 62, ink: true, st: { improve: { it: 1, hl: "or" } } },
  { id: "c26", i0: 236, i1: 244, t1: 97.2, size: 64, st: { clock: { it: 1, hl: "or" } } },
  { id: "c27", i0: 245, i1: 252, t1: 1e3, size: 66, st: { tick: { it: 1, hl: "or" }, atom: { it: 1, hl: "or" } } },
];
const KICKS = [[0.05, 3.9, "HOW YOUR PHONE FINDS YOU"], [4.4, 12.6, "GPS · ATOMIC CLOCKS"], [12.5, 21.2, "ONE BILLIONTH OF A SECOND", true], [21.7, 25.3, "NATURE · 7 OCTOBER 2026"], [25.9, 36.6, "INSIDE AN ATOMIC CLOCK"],
  [37.1, 39.4, "A CLOCK IN THE WIND", true], [39.6, 52.4, "INSIDE THE ATOM"], [52.9, 70.5, "THORIUM-229"], [70.8, 83.2, "HOW THE CLOCK WORKS"], [83.8, 88.2, "OCTOBER 2026"], [88.3, 94.5, "THE REALITY CHECK", true]];
function transition(type, k, A, B) {   // A: outgoing canvas, B: incoming canvas, k: 0..1
  const e = eio(k); gm.save(); gm.fillStyle = "#000"; gm.fillRect(0, 0, W, H);
  const zs = (c, s, a, blur = 0, dx = 0, dy = 0) => { gm.save(); gm.globalAlpha = a; if (blur) gm.filter = `blur(${blur}px)`; gm.translate(W / 2 + dx, H / 2 + dy); gm.scale(s, s); gm.drawImage(c, -W / 2, -H / 2); gm.restore(); };
  if (type === "push") { zs(A, lerp(1, 1.22, e), 1); zs(B, lerp(.9, 1, e), e); }
  else { zs(A, lerp(1, 1.03, e), 1); zs(B, lerp(1.03, 1, e), e); }   // a slow cross-dissolve with a breath of zoom
  gm.restore();
}
function filmGrain(t) { gm.save(); gm.globalAlpha = .04; gm.globalCompositeOperation = "overlay"; const o = (t * 997 | 0) % 512; for (let y = -o; y < H; y += 512) for (let x = -(o % 512); x < W; x += 512) gm.drawImage(grain, x, y); gm.restore(); }
window.seek = function (t) {
  BOXES = []; gm.setTransform(1, 0, 0, 1, 0, 0); gm.globalAlpha = 1; gm.filter = "none";
  const act = SC.filter(s => t >= s.t0 && t < s.t1);
  if (act.length === 1) { g = gm; g.save(); act[0].f(t); g.restore(); }
  else if (act.length >= 2) { const [A, B] = act.slice(-2); g = ga; ga.setTransform(1, 0, 0, 1, 0, 0); g.save(); A.f(t); g.restore(); g = gb; gb.setTransform(1, 0, 0, 1, 0, 0); g.save(); B.f(t); g.restore(); g = gm; transition(B.tr, prog(t, B.t0, A.t1), bufA, bufB); }
  g = gm;
  for (const c of CAPS) caption(t, c);
  for (const [a, b, s, cream] of KICKS) kicker(t, s, a, b, 318, cream);
  filmGrain(t);
  return BOXES;
};
window.DUR = DUR; window.SAFE = SAFE; window.CUES = [];
window.ready = false;
Promise.all([...loads, buildEarth(), document.fonts.load("800 80px Playfair"), document.fonts.load("italic 800 80px Playfair"), document.fonts.load("700 30px Inter"), document.fonts.load("600 60px Oswald")])
  .then(() => { buildAtom(); buildCrystal(); window.seek(0); window.ready = true; });
