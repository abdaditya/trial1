// "The clock inside the atom" — voiced reel, 1080x1920, deterministic: window.seek(t) draws frame t (t = the voice's own clock).
const W = 1080, H = 1920, DUR = 99.54;
const SAFE = { x0: 90, x1: 950, y0: 250, y1: 1540 }, CX = 520;   // playbook danger zones; text centres on x 520
const MAIN = document.getElementById("c"), gm = MAIN.getContext("2d", { willReadFrequently: true });
let g = gm;
const mk = () => { const c = document.createElement("canvas"); c.width = W; c.height = H; return c; };
const bufA = mk(), bufB = mk(), ga = bufA.getContext("2d"), gb = bufB.getContext("2d");
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, a, b) => clamp((t - a) / (b - a)), eo = k => 1 - (1 - k) ** 3, eio = k => k < .5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
const eob = k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (k - 1) ** 3 + c1 * (k - 1) ** 2; };
const win = (t, a, b, fi = .3, fo = .3) => Math.min(eo(prog(t, a, a + fi)), 1 - eio(prog(t, b - fo, b)));
const R = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(42);
function track(keys, t) {   // keys: [[t, [v...]], ...] eased between keys (slow-in / slow-out)
  if (t <= keys[0][0]) return keys[0][1].slice(); const L = keys[keys.length - 1]; if (t >= L[0]) return L[1].slice();
  for (let i = 0; i < keys.length - 1; i++) { const [t0, a] = keys[i], [t1, b] = keys[i + 1]; if (t <= t1) { const k = eio(prog(t, t0, t1)); return a.map((v, j) => lerp(v, b[j], k)); } }
}
const WD = window.WD, ws = i => WD[i][1];
const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, "");
function ix(phrase, nth = 0) { const p = norm(phrase).split(" "); let seen = 0; for (let i = 0; i + p.length <= WD.length; i++) { if (p.every((w, k) => norm(WD[i + k][0]) === w)) { if (seen++ === nth) return i; } } throw new Error("phrase not found: " + phrase); }
const tw = (phrase, nth = 0) => ws(ix(phrase, nth));       // start time of a phrase in the voice
const te = (phrase, nth = 0) => { const p = norm(phrase).split(" "), i = ix(phrase, nth); return WD[i + p.length - 1][2]; };   // end time of its last word

// ---------------- assets ----------------
const IM = {}; const loads = [];
for (const n of ["gps3", "dp"]) { const im = new Image(); im.src = `img/${n}.jpg`; IM[n] = im; loads.push(new Promise(r => { im.onload = r; im.onerror = r; })); }
const grain = mk(); grain.width = grain.height = 512;
{ const gg = grain.getContext("2d"), d = gg.createImageData(512, 512); for (let i = 0; i < d.data.length; i += 4) { const v = R() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } gg.putImageData(d, 0, 0); }

// ---------------- 2D helpers ----------------
function lum(p) { const l = v => (v /= 255) <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; return .2126 * l(p[0]) + .7152 * l(p[1]) + .0722 * l(p[2]); }
function contrastUnder(x, y, w, h, ink = false) { const X = clamp(x | 0, 0, W - 1), Y = clamp(y | 0, 0, H - 1), d = gm.getImageData(X, Y, clamp(w | 0, 1, W - X), clamp(h | 0, 1, H - Y)).data, L = [];
  for (let i = 0; i < d.length; i += 44) L.push(lum([d[i], d[i + 1], d[i + 2]])); L.sort((a, b) => a - b);
  return ink ? (L[Math.floor(L.length * .1)] + .05) / (.0065 + .05) : 1.05 / (L[Math.floor(L.length * .9)] + .05); }
let LAST = null, GOLDL = null, GOLD1 = null;
function photo(im, fx, fy, z, filter, dx = 0) {
  if (!im.naturalWidth) { g.fillStyle = "#1a1820"; g.fillRect(0, 0, W, H); return (u, v) => [u * W, v * H]; }
  const s = Math.max(W / im.width, H / im.height) * z, iw = im.width * s, ih = im.height * s;
  let x = W / 2 - fx * iw + dx, y = H / 2 - fy * ih; x = clamp(x, W - iw, 0); y = clamp(y, H - ih, 0);
  g.save(); g.filter = filter; g.drawImage(im, x, y, iw, ih); g.restore(); LAST = { x, y, iw, ih };
  return (u, v) => [x + u * iw, y + v * ih];
}
function shade(a = .8, to = 820, bottom = .55) {
  const gr = g.createLinearGradient(0, 0, 0, to); gr.addColorStop(0, `rgba(10,9,14,${a})`); gr.addColorStop(.55, `rgba(10,9,14,${a * .72})`); gr.addColorStop(1, "rgba(10,9,14,0)");
  g.fillStyle = gr; g.fillRect(0, 0, W, to);
  const gb2 = g.createLinearGradient(0, H - 480, 0, H); gb2.addColorStop(0, "rgba(10,9,14,0)"); gb2.addColorStop(1, `rgba(10,9,14,${bottom})`); g.fillStyle = gb2; g.fillRect(0, H - 480, W, 480);
}
function vignette(a = .45, col = "0,0,0") { const r = g.createRadialGradient(W / 2, H * .55, H * .32, W / 2, H * .55, H * .85); r.addColorStop(0, `rgba(${col},0)`); r.addColorStop(1, `rgba(${col},${a})`); g.fillStyle = r; g.fillRect(0, 0, W, H); }
function darkBg(warm = 0) {
  g.fillStyle = "#0b0a10"; g.fillRect(0, 0, W, H);
  const r = g.createRadialGradient(W / 2, H * .52, 0, W / 2, H * .52, H * .7); r.addColorStop(0, `rgba(${lerp(40, 70, warm) | 0},${lerp(36, 44, warm) | 0},${lerp(58, 40, warm) | 0},.9)`); r.addColorStop(1, "rgba(11,10,16,0)");
  g.fillStyle = r; g.fillRect(0, 0, W, H);
}
function creamBg() { g.fillStyle = "#EEE8DC"; g.fillRect(0, 0, W, H); const r = g.createRadialGradient(W / 2, H * .45, 0, W / 2, H * .45, H * .8); r.addColorStop(0, "rgba(255,252,244,.8)"); r.addColorStop(1, "rgba(214,204,186,.6)"); g.fillStyle = r; g.fillRect(0, 0, W, H); }
function txt(s, x, y, font, col, align = "center", ls = 0) { g.save(); g.font = font; g.fillStyle = col; g.textAlign = align; g.letterSpacing = ls + "px"; g.fillText(s, x, y); const w = g.measureText(s).width; g.restore(); return w; }
function rrect(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }

let BOXES = [], SHAKE = [0, 0];
const reg = (id, x, y, w, h, a, size, contrast = 12, words = 0, group) => BOXES.push({ id, group, words, x, y, w, h, a, read: a, contrast, size });
const regEl = (id, x, y, w, h, a, group) => a > .02 && BOXES.push({ id, group, el: 1, x, y, w, h, a, read: 0 });

// ---------------- captions (synced to the voice) ----------------
// tokens like "-of", ",133", ".4", "%" are glued to the word before
function tokens(i0, i1) { const out = []; for (let i = i0; i <= i1; i++) { const w = WD[i][0]; if (/^[-,.%]/.test(w) && out.length) out[out.length - 1][0] += w; else out.push([w, WD[i][1]]); } return out; }
const key = w => w.toLowerCase().replace(/[^a-z0-9%.,-]/g, "").replace(/[.,]$/, "");
// one caption: words appear as spoken, wrapped into balanced lines
function caption(t, c) {
  const { id, i0, i1, t1, y = 430, size = 64, ink = false, st = {}, center = false } = c, t0 = ws(i0) - .05;
  if (t < t0 || t > t1) return;
  const raw = tokens(i0, i1).map(([w, tt]) => [w, tt]);
  const out = eio(prog(t, t1 - .28, t1)), toks = raw.map(([w, tt]) => [w, tt, st[key(w)] || {}]);
  const fontOf = s => `${s.it ? "italic " : ""}800 ${size}px Playfair`, sp = size * .26, maxW = 800;
  g = gm; g.save();
  const wid = toks.map(([w, , s]) => { g.font = fontOf(s); return g.measureText(w).width; });
  // wrap: fewest lines that fit maxW, then balance the line widths
  const wrap = lim => { const L = []; let cur = [], cw = 0; toks.forEach((tk, i) => { const add = (cur.length ? sp : 0) + wid[i]; if (cur.length && cw + add > lim) { L.push(cur); cur = []; cw = 0; } cur.push(i); cw += (cur.length > 1 ? sp : 0) + wid[i]; }); L.push(cur); return L; };
  let lines = wrap(maxW); const nL = lines.length; for (let lim = maxW; lim > 200; lim -= 10) { const L2 = wrap(lim); if (L2.length > nL) break; lines = L2; }
  const lh = size * 1.14, yTop = center ? y - (lines.length * lh) / 2 + size * .8 : y;
  lines.forEach((L, li) => {
    const lw = L.reduce((a, i) => a + wid[i], 0) + sp * (L.length - 1); let x = CX - lw / 2; const yy = yTop + li * lh, x0 = x, y0 = yy - size * .8, firstT = toks[L[0]][1];
    const ga0 = eo(prog(t, firstT - .05, firstT + .3)) * (1 - out);
    if (!ink) { g.save(); g.filter = `blur(${size * .32}px)`; g.fillStyle = "rgba(8,6,12,1)"; g.globalAlpha = .78 * ga0; g.fillRect(x0 - size * .2, y0 - size * .05, lw + size * .4, size * 1.15); g.restore(); }
    const contrast = contrastUnder(x0, y0, lw, size, ink);
    L.forEach(i => {
      const [w, tt, s] = toks[i], k = eo(prog(t, tt - .05, tt + .25)); if (k <= 0) { x += wid[i] + sp; return; }
      g.save(); g.font = fontOf(s); g.globalAlpha = k * (1 - out); g.textBaseline = "alphabetic";
      const hk = s.hl === "lav" ? eio(prog(t, tt + .05, tt + .4)) : 0;
      if (hk > 0) { g.fillStyle = "#B7A3F6"; g.fillRect(x - 8, yy - size * .74, (wid[i] + 16) * hk, size * .92); }
      g.fillStyle = hk > .5 ? "#120d1e" : s.hl === "or" ? (ink ? "#C2410C" : "#FFA24D") : s.hl === "red" ? (ink ? "#B91C1C" : "#FF5A4E") : ink ? "#16121c" : "#F5EFE3";
      if (k < 1) g.filter = `blur(${(1 - k) * 6}px)`;
      g.fillText(w, x, yy + (1 - k) * 16 - out * 20); g.restore(); x += wid[i] + sp;
    });
    BOXES.push({ id: `${id}:${li}`, group: id, words: L.length, x: x0, y: y0, w: lw, h: size, a: ga0, read: t >= firstT + .25 && out < .02 ? 1 : 0, contrast, size });
  });
  g.restore();
}
// small uppercase kicker (gold on dark, rust on cream)
function kicker(t, s, t0, t1, y = 318, cream = false) {
  const a = win(t, t0, t1, .35, .3); if (a <= 0) return;
  g = gm; g.save(); g.font = "700 30px Inter"; g.letterSpacing = "5px"; const tw = g.measureText(s).width, x = CX - tw / 2 + 14;
  g.globalAlpha = a; g.fillStyle = cream ? "#B4501F" : "#F2B544"; g.beginPath(); g.arc(x - 26, y - 10, 7, 0, 7); g.fill();
  g.fillStyle = cream ? "#9A3F14" : "#F2C46A"; g.fillText(s, x, y - (1 - a) * 10); g.restore();
  reg("kick:" + s, x - 40, y - 26, tw + 40, 34, a, 36, 9);
}

// ======================================================================
// 3D (three.js) — only for the Earth, the dam, the land plots and the stop switch
// ======================================================================
const GLC = document.createElement("canvas"); GLC.width = W; GLC.height = H;
const RND = new THREE.WebGLRenderer({ canvas: GLC, antialias: true, preserveDrawingBuffer: true });
RND.setSize(W, H, false); RND.outputColorSpace = THREE.SRGBColorSpace; RND.toneMapping = THREE.ACESFilmicToneMapping; RND.toneMappingExposure = 1.05;
const CAM = new THREE.PerspectiveCamera(35, W / H, .01, 400);
const PMREM = new THREE.PMREMGenerator(RND);
const TL = new THREE.TextureLoader(); const tex = (u, srgb = true) => new Promise(r => TL.load(u, x => { if (srgb) x.colorSpace = THREE.SRGBColorSpace; x.anisotropy = 8; r(x); }, undefined, () => r(null)));
function draw3D(scene, bg) { RND.setClearColor(bg ?? 0x000000, 1); RND.render(scene, CAM); g.drawImage(GLC, 0, 0); }
function screenOf(v) { const p = v.clone().project(CAM); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H, p.z]; }
function glowTex(r, g2, b) { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(${r},${g2},${b},1)`); gr.addColorStop(.25, `rgba(${r},${g2},${b},.55)`); gr.addColorStop(1, `rgba(${r},${g2},${b},0)`); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const GOLD = glowTex(255, 196, 92), WARM = glowTex(255, 214, 160), REDG = glowTex(255, 80, 60);
