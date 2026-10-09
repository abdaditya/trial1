#!/usr/bin/env node
/**
 * decode-reference.mjs — mechanical first pass over a screen-recorded reference reel.
 *
 * Turns one video file into an evidence bundle you (or an agent) can reason over:
 *   report.md    probe facts, shot list, world/luminance timeline, text-band map, palettes
 *   sheet-N.jpg  full-frame contact sheets built from the extracted stills
 *   frames/      sampled stills at shot midpoints (PPM, lossless)
 *
 * It measures; it does not interpret. Judgements (what the story is doing, which typeface class,
 * how to rebuild a material) still come from looking at the output.
 *
 * Usage:
 *   node decode-reference.mjs <video> [--out DIR] [--fps 1] [--scene 0.07] [--sheets 5]
 *
 * Requires ffmpeg + ffprobe on PATH. No network, no image libraries.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, copyFileSync, rmSync, readdirSync } from 'node:fs';
import path from 'node:path';

const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : dflt; };
const input = process.argv[2];
if (!input || input.startsWith('--')) {
  console.error('usage: decode-reference.mjs <video> [--out DIR] [--fps 1] [--scene 0.07] [--sheets 5]');
  process.exit(2);
}

const SAMPLE_FPS = Number(arg('fps', 1));
const SCENE_THRESHOLD = Number(arg('scene', 0.07));
const SHEETS = Number(arg('sheets', 5));
const name = path.basename(input).replace(/\.[^.]+$/, '');
const outDir = path.resolve(arg('out', path.join('out', 'reference-decode', name)));
const frameDir = path.join(outDir, 'frames');
rmSync(frameDir, { recursive: true, force: true });
mkdirSync(frameDir, { recursive: true });

const ffrun = (a) => spawnSync('ffmpeg', a, { maxBuffer: 1 << 30 });
const ffraw = (a) => ffrun(['-v', 'error', ...a, '-']).stdout;
const grab = (t, vf) => ffraw(['-ss', String(Math.max(0, t)), '-i', input, '-frames:v', '1', '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'rgb24']);

// ---------------------------------------------------------------- probe
const meta = JSON.parse(spawnSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', input], { maxBuffer: 1 << 28 }).stdout.toString());
const v = meta.streams.find((s) => s.codec_type === 'video');
const audioTracks = meta.streams.filter((s) => s.codec_type === 'audio');
const W = Number(v.width), H = Number(v.height);
const duration = Number(meta.format.duration);
const fps = (() => { const [n, d] = String(v.avg_frame_rate).split('/').map(Number); return d ? n / d : 30; })();
const bytes = Number(meta.format.size ?? 0);

// ---------------------------------------------------------------- shot list
const sceneOut = spawnSync('ffmpeg', ['-hide_banner', '-i', input,
  '-filter:v', `select='gt(scene,${SCENE_THRESHOLD})',showinfo`, '-f', 'null', '-'], { maxBuffer: 1 << 28 }).stderr.toString();
const rawCuts = [...sceneOut.matchAll(/pts_time:([0-9.]+)/g)].map((m) => Number(m[1]));
const bounds = [];
for (const t of rawCuts) if (!bounds.length || t - bounds.at(-1) > 0.45) bounds.push(t);
const starts = [0, ...bounds];
const ends = [...bounds, duration];
const shots = starts.map((s, i) => ({ i: i + 1, start: s, end: ends[i], mid: (s + ends[i]) / 2, len: ends[i] - s }));
if (rawCuts.length > bounds.length) console.log(`note: ${rawCuts.length - bounds.length} sub-cut(s) merged (typography swaps inside a shot)`);

// ---------------------------------------------------------------- luminance signal
const sigFps = 2;
const sig = ffraw(['-i', input, '-vf', `fps=${sigFps},scale=1:1`, '-f', 'rawvideo', '-pix_fmt', 'rgb24']);
const lum = [];
for (let i = 0; i * 3 + 2 < sig.length; i++) {
  const r = sig[i * 3], g = sig[i * 3 + 1], b = sig[i * 3 + 2];
  lum.push({ t: i / sigFps, L: 0.2126 * r + 0.7152 * g + 0.0722 * b, hex: '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('') });
}
const classify = (L) => (L > 170 ? 'LIGHT' : L > 90 ? 'mid' : L > 40 ? 'dark' : 'BLACK');
const worlds = [];
for (const p of lum) {
  const c = classify(p.L);
  if (!worlds.length || worlds.at(-1).c !== c) worlds.push({ c, from: p.t, to: p.t });
  else worlds.at(-1).to = p.t;
}
const worldRows = worlds.filter((s) => s.to - s.from >= 1);
const jumps = [];
for (let i = 1; i < lum.length; i++) { const d = lum[i].L - lum[i - 1].L; if (Math.abs(d) > 22) jumps.push(`${lum[i].t.toFixed(1)}s(${d > 0 ? '+' : ''}${d.toFixed(0)})`); }

// ---------------------------------------------------------------- text band map (greyscale)
const gray = ffraw(['-i', input, '-vf', `fps=${SAMPLE_FPS}`, '-f', 'rawvideo', '-pix_fmt', 'gray']);
const sampled = Math.floor(gray.length / (W * H));
// Scan only the middle columns: it removes the like/comment/share column and the avatar row of a
// phone-app recording, which otherwise dominate every row count.
const x0 = Math.round(W * 0.15), x1 = Math.round(W * 0.85);
const bandsPerSecond = [];
for (let n = 0; n < sampled; n++) {
  const off0 = n * W * H;
  const rows = new Array(H);
  for (let y = 0; y < H; y++) {
    const off = off0 + y * W;
    let sum = 0;
    for (let x = x0; x < x1; x += 2) sum += gray[off + x];
    const mean = sum / Math.ceil((x1 - x0) / 2);
    let c = 0;
    for (let x = x0; x < x1; x++) { const d = gray[off + x] - mean; if (d > 40 || d < -40) c++; }
    rows[y] = c;
  }
  const groups = [];
  for (let y = 0; y < H; y++) {
    if (rows[y] > 6) { if (groups.length && y - groups.at(-1).hi <= 5) groups.at(-1).hi = y; else groups.push({ lo: y, hi: y }); }
  }
  bandsPerSecond.push(groups.filter((g) => g.hi - g.lo >= 6 && g.hi - g.lo <= 160));
}
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
// Cluster every text band by vertical position. Two things usually show up: permanent platform
// chrome (present ~100% of seconds) and the reel's own text rails. Report both, let a reader decide.
const clusters = [];
for (const [second, groups] of bandsPerSecond.entries()) {
  for (const g of groups) {
    const c = clusters.find((c) => Math.abs(g.lo - c.lo) <= 16);
    if (c) { c.bands.push(g); c.lo = median(c.bands.map((b) => b.lo)); c.hi = median(c.bands.map((b) => b.hi)); c.seconds.add(second); }
    else clusters.push({ lo: g.lo, hi: g.hi, bands: [g], seconds: new Set([second]) });
  }
}
const bands = clusters
  .map((c) => ({ lo: Math.round(c.lo), hi: Math.round(c.hi), height: Math.round(c.hi - c.lo), present: c.seconds.size / Math.max(1, sampled) }))
  .sort((a, b) => b.present - a.present || a.lo - b.lo)
  .slice(0, 12);

// ---------------------------------------------------------------- palettes + stills
const hexOf = (r, g, b) => '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
const paletteOf = (buf) => {
  const buckets = new Map();
  for (let i = 0; i + 2 < buf.length; i += 3) {
    const k = `${buf[i] >> 4},${buf[i + 1] >> 4},${buf[i + 2] >> 4}`;
    const b = buckets.get(k) ?? { n: 0, r: 0, g: 0, bl: 0 };
    b.n++; b.r += buf[i]; b.g += buf[i + 1]; b.bl += buf[i + 2];
    buckets.set(k, b);
  }
  const total = buf.length / 3;
  return [...buckets.values()].sort((a, b) => b.n - a.n).slice(0, 5)
    .map((b) => ({ hex: hexOf(b.r / b.n, b.g / b.n, b.bl / b.n), share: b.n / total }));
};

const PPM = (buf) => Buffer.concat([Buffer.from(`P6\n${W} ${H}\n255\n`), buf]);
const stills = [];
for (const s of shots) {
  const full = grab(s.mid, 'null');
  const file = path.join(frameDir, `shot-${String(s.i).padStart(2, '0')}-at-${s.mid.toFixed(2)}s.ppm`);
  writeFileSync(file, PPM(full));
  const small = grab(s.mid, 'scale=96:-1:flags=area');
  s.palette = paletteOf(small);
  s.file = file;
  stills.push(file);
}

// ---------------------------------------------------------------- sheets (from stills, padded)
const sheets = [];
const per = 12;
for (let i = 0; i < Math.min(SHEETS, Math.ceil(shots.length / per)); i++) {
  const group = stills.slice(i * per, (i + 1) * per);
  const tmp = path.join(outDir, `.sheet${i + 1}`);
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  for (let k = 0; k < per; k++) copyFileSync(group[Math.min(k, group.length - 1)], path.join(tmp, `${String(k).padStart(2, '0')}.ppm`));
  const out = path.join(outDir, `sheet-${i + 1}.jpg`);
  ffrun(['-v', 'error', '-pattern_type', 'glob', '-i', path.join(tmp, '*.ppm'), '-vf', 'scale=300:-1,tile=4x3', '-frames:v', '1', out, '-y']);
  rmSync(tmp, { recursive: true, force: true });
  sheets.push(out);
}

// ---------------------------------------------------------------- report
const md = [];
const scaleW = 1080 / W, scaleH = 1920 / H;
md.push(`# Decode report — ${name}`, '');
md.push(`Source: \`${input}\``, '');
md.push('## Probe', '');
md.push(`- ${W} × ${H}, ${duration.toFixed(2)} s, ${fps.toFixed(3)} fps, ${v.codec_name}`);
md.push(`- audio streams: **${audioTracks.length}**${audioTracks.length ? '' : ' — silent capture, so no voice/music/SFX evidence exists in this file'}`);
md.push(`- ${(bytes / 1e6).toFixed(1)} MB ≈ ${(bytes * 8 / duration / 1e6).toFixed(2)} Mb/s — a screen capture, so treat every pixel as an approximation`);
md.push('', `## Shot list — ${shots.length} shots (scene threshold ${SCENE_THRESHOLD})`, '');
md.push('| # | start | end | len | top colours |', '|---|---|---|---|---|');
for (const s of shots) md.push(`| ${s.i} | ${s.start.toFixed(2)} | ${s.end.toFixed(2)} | ${s.len.toFixed(2)} s | ${s.palette.map((p) => `\`${p.hex}\` ${(p.share * 100).toFixed(0)}%`).join(' · ')} |`);
md.push('', '## World / luminance timeline (2 fps mean colour)', '');
md.push('| from | to | class |', '|---|---|---|');
for (const s of worldRows) md.push(`| ${s.from.toFixed(1)} | ${s.to.toFixed(1)} | ${s.c} |`);
md.push('', `Luminance jumps > 22 per 0.5 s step: ${jumps.join(', ') || 'none'}`);
md.push('', '## Text band positions (1 s sampling, greyscale row scan)', '');
if (bands.length) {
  md.push('| y range (capture) | zone | height | present in | ≈ y at 1920 | ≈ height at 1920 | likely |', '|---|---|---|---|---|---|---|');
  for (const b of bands) {
    const share = b.present;
    const zone = b.lo < H * 0.36 ? 'upper' : b.lo < H * 0.80 ? 'middle' : 'lower';
    const guess = (b.lo < H * 0.10 || b.lo > H * 0.88) && share > 0.9 ? 'platform chrome, not designed content'
      : share > 0.9 ? 'persistent overlay (username / caption / progress) or a permanent label'
        : share > 0.3 ? 'designed rail or recurring label — check the stills'
          : 'occasional statement';
    md.push(`| ${b.lo}–${b.hi} | ${zone} | ${b.height} | ${(share * 100).toFixed(0)} % of seconds | ${Math.round(b.lo * scaleH)}–${Math.round(b.hi * scaleH)} | ≈ ${Math.round(b.height * scaleH)} | ${guess} |`);
  }
  md.push('', 'Rule of thumb: a band present in ~100 % of seconds and sitting at the very top or bottom edge is the recording\u2019s own chrome. The reel\u2019s caption rail is an **upper** band whose presence tracks narration (often 40–90 %), so it is quieter in this table than the app UI. Confirm by opening the stills.');
} else md.push('- no text bands found');
md.push(`- bands per sampled second: ${bandsPerSecond.map((g, i) => `${i}:${g.length}`).join(' ')}`);
md.push('', '## Sheets', '');
for (const s of sheets) md.push(`- \`${path.relative(process.cwd(), s)}\``);
md.push('', '## Not answerable from this file', '');
md.push('- typeface identity, authoring tool, exact easing curves, layer structure — these need a reader looking at the frames');
md.push('- anything hidden behind platform UI overlays, and true 1080p detail (the capture is already downscaled)', '');
writeFileSync(path.join(outDir, 'report.md'), md.join('\n'));

console.log(`decoded ${name}: ${shots.length} shots · ${sampled} sampled seconds · ${sheets.length} sheet(s)`);
console.log(`report → ${path.join(outDir, 'report.md')}`);
for (const b of bands.slice(0, 4)) console.log(`  text band y ${b.lo}-${b.hi} (${b.height}px capture ≈ ${Math.round(b.height * scaleH)}px at 1920), present in ${(b.present * 100).toFixed(0)}% of seconds`);
