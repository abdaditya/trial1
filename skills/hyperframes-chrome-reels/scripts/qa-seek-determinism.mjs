#!/usr/bin/env node
/**
 * qa-seek-determinism.mjs — prove that a composition's pixels are a pure function of time.
 *
 * This is the gate for canvas / adapter compositions, where a runtime owns its own draw state
 * (the hand-drawn kit is the reference case). For each sampled time it checks three routes to
 * the same moment and requires identical pixels:
 *
 *   A  seek the registered timeline to t             (the way a renderer reaches the frame)
 *   B  seek far past t, then seek back to t          (backward seeking)
 *   C  drive the underlying runtime directly at t    (window.__adapter.frameAt, if exposed)
 *
 * A != B means state is leaking between frames. A != C means the adapter is off by a frame.
 *
 * Usage:
 *   node qa-seek-determinism.mjs <project-dir> [--at 0.5,3,7.2] [--samples 12] [--json out.json]
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dir = path.resolve(process.argv[2] ?? '.');
const ENTRY = arg('entry', 'index.html');
const JSON_OUT = arg('json', null);
const CHROME = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => existsSync(p));
if (!CHROME) { console.error('no Chrome/Chromium found'); process.exit(2); }

async function loadPuppeteer() {
  const tried = [];
  try { return (await import('puppeteer-core')).default; } catch { tried.push('bare import'); }
  let cur = dir;
  for (let i = 0; i < 5; i++) {
    for (const b of [cur, path.join(cur, 'hyperframes')]) {
      try {
        const req = createRequire(path.join(b, '__r.cjs'));
        const mod = await import(pathToFileURL(req.resolve('puppeteer-core')).href);
        return mod.default?.launch ? mod.default : mod;
      } catch (e) { tried.push(b + ': ' + String(e.message).slice(0, 40)); }
    }
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  console.error('puppeteer-core not found. Tried:\n  ' + tried.join('\n  '));
  process.exit(2);
}
const puppeteer = await loadPuppeteer();

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
const server = createServer((rq, rs) => {
  const f = path.resolve(dir, '.' + decodeURIComponent(new URL(rq.url, 'http://x').pathname));
  if (!f.startsWith(dir) || !existsSync(f)) { rs.writeHead(404); rs.end(); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] ?? 'application/octet-stream' });
  rs.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--font-render-hinting=none'] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920 });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));
await page.goto(`http://127.0.0.1:${server.address().port}/${ENTRY}`, { waitUntil: 'networkidle0' });

const times = (arg('at', '') ? arg('at').split(',').map(Number) : null)
  ?? Array.from({ length: Number(arg('samples', 12)) }, (_, k) => +(k * 0.97 + 0.4).toFixed(2));

const result = await page.evaluate(async (times) => {
  const tl = Object.values(window.__timelines ?? {})[0];
  const cv = document.querySelector('canvas');
  if (!tl) return { error: 'no registered timeline' };
  if (!cv) return { error: 'no canvas found' };
  const g = cv.getContext('2d');
  const dur = tl.duration();

  // FNV-1a over a strided sample of the canvas — cheap and plenty sensitive for a frame compare
  const hash = () => {
    const d = g.getImageData(0, 0, cv.width, cv.height).data;
    let h = 2166136261;
    for (let i = 0; i < d.length; i += 97) { h ^= d[i]; h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16);
  };
  const seek = (t) => { tl.pause(); tl.seek(t, false); };

  const rows = [];
  for (const t of times) {
    const tt = Math.max(0, Math.min(dur, t));
    seek(tt);                       const a = hash();
    seek(Math.min(dur, tt + 1.7));  seek(tt);  const b = hash();   // out and back
    let c = null, note = '';
    // Prefer the adapter's own draw entry point. If a runtime settles lazily, its draw routine may
    // legitimately draw more than once per frame, and a single __drawFrame call would then be
    // comparing a half-settled canvas against a settled one.
    if (window.__adapter?.frameAt && typeof window.__adapter.draw === 'function') {
      window.__adapter.draw(window.__adapter.frameAt(tt));
      c = hash();
    } else if (window.__adapter?.frameAt && typeof window.__drawFrame === 'function') {
      window.__drawFrame(window.__adapter.frameAt(tt));
      c = hash();
      note = 'compared against a single __drawFrame call';
    } else note = 'runtime has no __drawFrame hook';
    rows.push({ t: tt, a, b, c, backStable: a === b, adapterMatch: c === null ? null : a === c, note });
  }
  return { duration: +dur.toFixed(3), canvas: { w: cv.width, h: cv.height }, rows };
}, times);

await browser.close();
server.close();

if (result.error) { console.error('determinism QA failed:', result.error); process.exit(2); }

const backBad = result.rows.filter((r) => !r.backStable);
const adapterBad = result.rows.filter((r) => r.adapterMatch === false);
const adapterChecked = result.rows.some((r) => r.adapterMatch !== null);

console.log(`\nseek determinism — ${path.basename(dir)}/${ENTRY}`);
console.log(`duration ${result.duration}s · canvas ${result.canvas.w}×${result.canvas.h} · ${result.rows.length} sampled times`);
if (pageErrors.length) console.log(`page errors: ${pageErrors.slice(0, 2).join(' | ')}`);
console.log('');
for (const r of result.rows) {
  const marks = `${r.backStable ? 'ok ' : 'FAIL'}${r.adapterMatch === null ? '' : r.adapterMatch ? ' ok' : ' FAIL'}`;
  console.log(`  t=${String(r.t).padStart(6)}s  ${r.a}  repeat=${r.backStable ? 'same' : 'DIFFERENT'}  runtime=${r.adapterMatch === null ? 'n/a' : r.adapterMatch ? 'same' : 'DIFFERENT'}   ${marks}`);
}
console.log('');
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ ...result, pageErrors }, null, 2));

if (backBad.length || adapterBad.length) {
  console.log(`FAIL — ${backBad.length} non-deterministic seek(s), ${adapterBad.length} adapter mismatch(es)\n`);
  process.exit(1);
}
console.log(adapterChecked
  ? 'PASS — forward, backward and direct-runtime routes all produce identical pixels\n'
  : 'PASS — repeat and backward seeks are pixel-identical (no runtime hook to cross-check)\n');
