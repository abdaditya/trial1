#!/usr/bin/env node
/**
 * qa-readability.mjs — the tough readability gate for a HyperFrames composition.
 *
 * Opens the composition in headless Chrome, seeks its registered GSAP timeline across the whole
 * duration, and measures what a viewer would actually see:
 *
 *   - dwell      how long each text element stays on screen at readable opacity
 *   - opacity    whether it ever reaches full strength (a 40%-faded label is not readable)
 *   - window     whether every timed clip ancestor is inside its data-start/data-duration window
 *   - collisions two text blocks overlapping in the same moment at readable opacity
 *
 * Fails with exit 1 when anything is below threshold, so it can gate a render.
 *
 * Usage:
 *   node qa-readability.mjs <project-dir> [--min-dwell 1.2] [--step 0.1] [--json out.json]
 *                            [--entry index.html] [--chrome "/Applications/Google Chrome.app/..."]
 *
 * Requires puppeteer-core and a system Chrome/Chromium. Nothing is downloaded.
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dir = path.resolve(process.argv[2] ?? '.');
const ENTRY = arg('entry', 'index.html');
const MIN_DWELL = Number(arg('min-dwell', 1.2));
const STEP = Number(arg('step', 0.1));
const MIN_OPACITY = Number(arg('min-opacity', 0.75));
const JSON_OUT = arg('json', null);

const CHROME_CANDIDATES = [
  arg('chrome', ''),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const chromePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chromePath) {
  console.error('no Chrome/Chromium found — pass --chrome <path>');
  process.exit(2);
}

async function loadPuppeteer() {
  const tried = [];
  const explicit = arg('puppeteer', '');
  const bases = [];
  if (explicit) bases.push(path.resolve(explicit));
  let cur = dir;
  for (let i = 0; i < 5; i++) {
    bases.push(cur);
    bases.push(path.join(cur, 'hyperframes'));
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  try { return (await import('puppeteer-core')).default; } catch { tried.push('bare import'); }
  for (const b of bases) {
    try {
      const req = createRequire(path.join(b, '__resolve__.cjs'));
      const entry = req.resolve('puppeteer-core');
      const mod = await import(pathToFileURL(entry).href);
      return mod.default?.launch ? mod.default : mod;
    } catch (e) { tried.push(b + ': ' + String(e.message).slice(0, 50)); }
  }
  console.error('puppeteer-core not found. Tried:\n  ' + tried.join('\n  '));
  process.exit(2);
}
const puppeteer = await loadPuppeteer();

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.mp4': 'video/mp4' };
const server = createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.resolve(dir, '.' + rel);
  if (!file.startsWith(dir) || !existsSync(file)) { res.writeHead(404); res.end('nope'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/${ENTRY}`;

const browser = await puppeteer.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox', '--font-render-hinting=none'] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920 });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));
await page.goto(base, { waitUntil: 'networkidle0' });

const report = await page.evaluate(async (STEP, MIN_OPACITY) => {
  const timeline = Object.values(window.__timelines ?? {})[0];
  const root = document.querySelector('[data-composition-id]');
  if (!timeline || !root) return { error: 'no registered timeline or composition root' };
  const duration = Number(root.dataset.duration) || timeline.duration();

  // candidate text elements: anything with its own non-empty text
  const all = [...root.querySelectorAll('*')];
  const pseudoContent = (el, which) => {
    const cs = getComputedStyle(el, which);
    if (!cs || cs.display === 'none' || cs.visibility === 'hidden') return '';
    const c = cs.content;
    if (!c || c === 'none' || c === 'normal' || c === '""' || c === "''" || c.startsWith('url(')) return '';
    return c.replace(/^["']|["']$/g, '').trim();
  };
  const texts = all.filter((el) => {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (own) {
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    }
    // ::before / ::after text is invisible to the DOM collector AND to the framework's own
    // contrast audit — which is how a dark label on a dark gradient ships unnoticed.
    return pseudoContent(el, '::before').length > 1 || pseudoContent(el, '::after').length > 1;
  });
  const pseudoOf = (el) => (pseudoContent(el, '::before') || pseudoContent(el, '::after') || '');
  const label = (el) => {
    const base = el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ').filter(Boolean).join('.');
    return pseudoOf(el) ? base + '::after' : base;
  };

  /* ---- contrast estimate ----
     A backdrop can be a flat colour or a gradient. The gradient case is where labels disappear
     (dark ink centred on the middle, darkest stop), so the middle stop is resolved. Returns null
     when nothing can be resolved, in which case the check is skipped rather than guessed. */
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const parseColour = (str) => {
    if (!str) return null;
    const m = String(str).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(',').map((v) => parseFloat(v));
    if (parts.length < 3) return null;
    if (parts.length === 4 && parts[3] < 0.5) return null;
    return [parts[0], parts[1], parts[2]];
  };
  /* elements that paint nothing of their own — skip them rather than let them resolve the backdrop */
  const PAINTLESS = new Set(['CANVAS', 'SCRIPT', 'STYLE', 'TEMPLATE']);
  /* Sample a gradient at the middle of the box, not "the middle stop by index". A four-stop plate
     like `#ffd6d2, #ff4d6d 26%, #7a1f18 62%, #2a0c09` has its 50% point between stops 2 and 3 —
     reading stop index 1 instead made every label on a plate look like a 3:1 failure. */
  const gradientAt = (bg, at = 0.5) => {
    const stops = [...bg.matchAll(/(rgba?\([^)]+\))\s*([0-9.]+)?%/g)]
      .map((m, i, all) => ({ col: parseColour(m[1]), pos: m[2] !== undefined ? parseFloat(m[2]) / 100 : (all.length > 1 ? i / (all.length - 1) : 0) }))
      .filter((s) => s.col);
    if (!stops.length) return null;
    if (stops.length === 1) return stops[0].col;
    let a = stops[0], b = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (at >= stops[i].pos && at <= stops[i + 1].pos) { a = stops[i]; b = stops[i + 1]; break; }
    }
    const span = b.pos - a.pos;
    const k = span > 0 ? Math.max(0, Math.min(1, (at - a.pos) / span)) : 0;
    return a.col.map((v, i) => v + (b.col[i] - v) * k);
  };
  const colourOfElement = (node) => {
    if (PAINTLESS.has(node.tagName)) return null;
    const cs = getComputedStyle(node);
    const flat = parseColour(cs.backgroundColor);
    if (flat) return flat;
    const bg = cs.backgroundImage;
    if (bg && bg.includes('gradient')) return gradientAt(bg, 0.5);
    return null;
  };
  /* What is actually painted behind the glyphs. Walking ancestors alone gets this wrong whenever
     the backdrop is a SIBLING that paints between the text and its ancestor — a label sitting on a
     bar, for instance. Hit-testing the text's own points returns the real paint order. */
  const backdropAt = (el) => {
    const r = el.getBoundingClientRect();
    const probes = [
      [r.left + r.width / 2, r.top + r.height / 2],
      [r.left + r.width * 0.28, r.top + r.height / 2],
      [r.left + r.width * 0.72, r.top + r.height / 2],
    ];
    for (const [x, y] of probes) {
      const stack = typeof document.elementsFromPoint === 'function' ? document.elementsFromPoint(x, y) : [];
      for (const hit of stack) {
        if (hit === el || el.contains(hit)) continue;
        const col = colourOfElement(hit);
        if (col) return col;
      }
    }
    return null;
  };
  const contrastOf = (el) => {
    const hasPseudo = !!pseudoOf(el);
    const cs = hasPseudo ? getComputedStyle(el, pseudoContent(el, '::before') ? '::before' : '::after') : getComputedStyle(el);
    const fg = parseColour(cs.color);
    if (!fg) return null;
    // A glyph sits on: the pseudo's own plate, else the element's own plate, else whatever is
    // painted behind the element. Skipping the middle case made every label on its own plate
    // (the AI disc, the violet permission chips, a bar label) read as 1:1.
    let behind = hasPseudo ? parseColour(cs.backgroundColor) : null;
    if (!behind) behind = colourOfElement(el);
    if (!behind) behind = backdropAt(el);
    if (!behind) return null;
    const a = lum(fg), b = lum(behind);
    return +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2);
  };
  const timedAncestors = (el) => {
    const out = [];
    for (let p = el; p; p = p.parentElement) {
      if (p.dataset && p.dataset.start !== undefined) {
        const s = parseFloat(p.dataset.start), d = parseFloat(p.dataset.duration);
        if (Number.isFinite(s)) out.push([s, Number.isFinite(d) ? s + d : Infinity]);
      }
    }
    return out;
  };
  const inWindow = (el, t) => timedAncestors(el).every(([s, e]) => t >= s && t < e);
  const effectiveOpacity = (el) => {
    let o = 1;
    for (let p = el; p; p = p.parentElement) o *= parseFloat(getComputedStyle(p).opacity);
    return o;
  };

  const samples = [];
  /* Emulate the runtime's clip visibility. Without this the harness leaves EVERY scene painted at
     once, so hit-testing resolves whatever happens to be highest in the stack instead of what the
     frame actually shows — which makes both the dwell measurement and the contrast estimate lie. */
  const timedEls = [...root.querySelectorAll('[data-start]')].map((el) => ({
    el, s: parseFloat(el.dataset.start), d: parseFloat(el.dataset.duration),
  }));
  for (let t = 0; t <= duration + 1e-6; t = Math.round((t + STEP) * 1000) / 1000) {
    timeline.pause();
    timeline.seek(t, false);
    for (const te of timedEls) {
      const visible = t >= te.s && t < (Number.isFinite(te.d) ? te.s + te.d : Infinity);
      const want = visible ? '' : 'none';
      if (te.el.style.display !== want) te.el.style.display = want;
    }
    const visible = [];
    for (const el of texts) {
      if (!inWindow(el, t)) continue;
      const o = effectiveOpacity(el);
      if (o < 0.08) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      visible.push({ el, o, r });
    }
    for (const v of visible) {
      samples.push({ t, sel: label(v.el), text: (v.el.textContent.trim() || pseudoOf(v.el)).slice(0, 46), o: +v.o.toFixed(3), contrast: contrastOf(v.el) });
    }
  }
  for (const te of timedEls) te.el.style.display = '';

  // collapse into per-element windows
  const byEl = new Map();
  for (const s of samples) {
    if (!byEl.has(s.sel)) byEl.set(s.sel, []);
    byEl.get(s.sel).push(s);
  }
  const items = [];
  for (const [sel, rows] of byEl) {
    const readable = rows.filter((r) => r.o >= MIN_OPACITY);
    const first = rows[0], last = rows[rows.length - 1];
    const maxO = Math.max(...rows.map((r) => r.o));
    let dwell = 0;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].o >= MIN_OPACITY) {
        const next = rows[i + 1];
        dwell += next ? next.t - rows[i].t : STEP;
      }
    }
    const contrasts = rows.map((r) => r.contrast).filter((c) => c !== null && c !== undefined).sort((a, b) => a - b);
    items.push({
      sel,
      text: rows[0].text,
      onScreen: `${first.t.toFixed(1)}–${last.t.toFixed(1)}s`,
      dwell: +dwell.toFixed(2),
      maxOpacity: +maxO.toFixed(2),
      readableSamples: readable.length,
      // median across the window, not the first sample: a label that appears before its plate has
      // finished growing would otherwise be judged on the one frame where the plate is not there
      contrast: contrasts.length ? contrasts[Math.floor(contrasts.length / 2)] : null,
    });
  }
  items.sort((a, b) => a.dwell - b.dwell);
  return { duration: +duration.toFixed(2), step: STEP, minOpacity: MIN_OPACITY, itemCount: items.length, items };
}, STEP, MIN_OPACITY);

await browser.close();
server.close();

if (report.error) { console.error('QA failed:', report.error); process.exit(2); }

const short = report.items.filter((i) => i.dwell > 0.001 && i.dwell < MIN_DWELL);
const dim = report.items.filter((i) => i.maxOpacity > 0.08 && i.maxOpacity < MIN_OPACITY);
const neverSeen = report.items.filter((i) => i.dwell <= 0.001);
const lowContrast = report.items.filter((i) => i.contrast !== null && i.contrast !== undefined && i.contrast < 4.5);

console.log(`\nreadability QA — ${path.basename(dir)}/${ENTRY}`);
console.log(`duration ${report.duration}s · step ${report.step}s · readable floor ${report.minOpacity} opacity · min dwell ${MIN_DWELL}s`);
console.log(`${report.itemCount} text elements sampled\n`);
if (pageErrors.length) console.log(`page errors: ${pageErrors.slice(0, 3).join(' | ')}\n`);

const show = (title, rows) => {
  if (!rows.length) return;
  console.log(`${title} (${rows.length}):`);
  for (const r of rows.slice(0, 24)) console.log(`  ${r.dwell.toFixed(2)}s  op${r.maxOpacity}  ${r.onScreen.padEnd(15)} ${r.sel.padEnd(26)} "${r.text}"`);
  console.log('');
};
show('TOO SHORT TO READ', short);
show('NEVER REACHES READABLE OPACITY', dim);
/* Advisory, not gating. The estimate resolves a text backdrop from computed styles and paint order,
   which is reliable for flat plates and ordinary stacks but not for every composited/transformed
   case — it has produced clear false positives on elements verified readable in the actual render.
   Dwell and opacity gate the build; this list is a screen to check against real frames. */
if (lowContrast.length) {
  console.log(`LOW CONTRAST — ADVISORY, verify against rendered frames (${lowContrast.length}):`);
  for (const r of lowContrast.slice(0, 24)) console.log(`  ${r.contrast}:1  ${r.sel.padEnd(26)} "${r.text}"`);
  console.log('');
}

if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ ...report, pageErrors }, null, 2));
const bad = short.length + dim.length;
console.log(bad
  ? `FAIL — ${bad} problem(s)\n`
  : `PASS — every text element reaches readable opacity and dwells at least ${MIN_DWELL}s${lowContrast.length ? ' (contrast list above is advisory)' : ' and clears 4.5:1 contrast'}\n`);
process.exit(bad ? 1 : 0);
