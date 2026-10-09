#!/usr/bin/env node
/**
 * build-word-rail.mjs — turn word-level ASR timestamps into HyperFrames caption clips.
 *
 * The reference reels carry a top rail that shows ONE word at a time, centred, advancing at
 * speaking speed. This emits that rail as first-class timed clips so seeking is exact and no
 * callback ever rewrites a node.
 *
 * Usage:
 *   node build-word-rail.mjs --transcript assets/transcript.json --out compositions/caption-rail.html \
 *        --top 218 --size 54 --min-hold .22 --emphasis emphasis.txt
 *
 * Transcript input: either the HyperFrames/whisper shape
 *   [{ "start": 0, "end": 5.2, "text": "...", "words": [{ "start": 0, "end": .36, "word": " Why" }] }]
 * or a flat word list
 *   [{ "start": 0, "end": .36, "word": "Why" }]
 *
 * Output: a fragment of <section class="clip cap"> nodes plus an optional CSS block (--css).
 * Nothing is executed in the browser, so the output is deterministic by construction.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const out = {
    transcript: null,
    out: null,
    top: 218,
    size: 54,
    width: 900,
    track: 9,
    minHold: 0.22,
    font: 'InterLocal',
    color: '#f3f4f1',
    idPrefix: 'w',
    startOffset: 0,
    endAt: null,
    emphasis: [],
    dropRegex: null,
    css: false,
    title: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--transcript': out.transcript = next(); break;
      case '--out': out.out = next(); break;
      case '--top': out.top = Number(next()); break;
      case '--size': out.size = Number(next()); break;
      case '--width': out.width = Number(next()); break;
      case '--track': out.track = Number(next()); break;
      case '--min-hold': out.minHold = Number(next()); break;
      case '--font': out.font = next(); break;
      case '--color': out.color = next(); break;
      case '--id-prefix': out.idPrefix = next(); break;
      case '--offset': out.startOffset = Number(next()); break;
      case '--until': out.endAt = Number(next()); break;
      case '--emphasis': out.emphasis = readFileSync(next(), 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean); break;
      case '--drop': out.dropRegex = new RegExp(next()); break;
      case '--css': out.css = true; break;
      case '--title': out.title = next(); break;
      case '--help': case '-h': out.help = true; break;
      default:
        if (a.startsWith('--')) { console.error(`unknown flag ${a}`); process.exit(2); }
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (args.help || !args.transcript) {
  const src = readFileSync(new URL(import.meta.url), 'utf8');
  const help = src.slice(src.indexOf('/**') + 3, src.indexOf('*/'))
    .split('\n').map((l) => l.replace(/^\s*\* ?/, '')).join('\n').trim();
  console.log(args.help ? help : `${help}\n\n(a transcript is required — pass --transcript <file>)`);
  process.exit(args.help ? 0 : 2);
}

function flatten(raw) {
  const words = [];
  const push = (w) => {
    const text = String(w.word ?? w.text ?? '').trim();
    const start = Number(w.start ?? w.startTime ?? 0);
    const end = Number(w.end ?? w.endTime ?? start);
    if (!text || !Number.isFinite(start) || !Number.isFinite(end)) return;
    words.push({ text, start, end });
  };
  if (Array.isArray(raw) && raw.length && Array.isArray(raw[0]?.words)) raw.forEach((seg) => seg.words.forEach(push));
  else if (Array.isArray(raw)) raw.forEach(push);
  else if (Array.isArray(raw?.words)) raw.words.forEach(push);
  else if (Array.isArray(raw?.segments)) raw.segments.forEach((seg) => (seg.words ?? []).forEach(push));
  else throw new Error('unrecognised transcript shape: expected segment[] with words[], or a flat word list');
  return words.sort((a, b) => a.start - b.start);
}

const STOP = new Set([
  'a', 'an', 'and', 'as', 'at', 'be', 'but', 'by', 'for', 'from', 'has', 'have', 'in', 'into',
  'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'their', 'then', 'there', 'these', 'they',
  'this', 'to', 'was', 'were', 'with', 'you', 'your', 'we', 'are', 'so', 'if', 'not', 'no',
]);

function isStrong(text, emphasis) {
  const bare = text.replace(/[^\p{L}\p{N}$%.,]/gu, '');
  if (!bare) return false;
  if (emphasis.some((e) => e.toLowerCase() === bare.toLowerCase())) return true;
  if (/[$€£₹%]/.test(bare)) return true;
  if (/\d/.test(bare) && bare.length > 1) return true;
  const letters = bare.replace(/[^\p{L}]/gu, '');
  if (letters.length >= 3 && letters === letters.toUpperCase()) return true;   // TITLE/ACRONYM
  if (/^[A-Z][a-z]{2,}$/.test(letters) && !STOP.has(letters.toLowerCase())) return true; // proper noun
  return false;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const round = (n) => Math.round(n * 1000) / 1000;

const isPunct = (t) => !/[\p{L}\p{N}]/u.test(t);
let words = flatten(JSON.parse(readFileSync(args.transcript, 'utf8')))
  .filter((w) => !isPunct(w.text))
  .map((w) => ({ ...w, start: w.start + args.startOffset, end: w.end + args.startOffset }))
  .filter((w) => (args.endAt === null || w.start < args.endAt));

if (args.dropRegex) words = words.filter((w) => !args.dropRegex.test(w.text));

const clips = [];
for (let i = 0; i < words.length; i++) {
  const w = words[i];
  const nextStart = i + 1 < words.length ? words[i + 1].start : null;
  let start = w.start;
  let duration = Math.max(args.minHold, w.end - w.start);
  if (nextStart !== null) duration = Math.min(duration, Math.max(0.08, nextStart - start));
  if (args.endAt !== null) duration = Math.min(duration, args.endAt - start);
  if (duration <= 0.04) continue;
  clips.push({ id: `${args.idPrefix}-${String(i).padStart(4, '0')}`, text: w.text, start: round(start), duration: round(duration), strong: isStrong(w.text, args.emphasis) });
}

const body = clips
  .map((c) => `  <section id="${c.id}" class="clip cap" data-start="${c.start}" data-duration="${c.duration}" data-track-index="${args.track}"><div class="cap-word${c.strong ? ' is-strong' : ''}">${esc(c.text)}</div></section>`)
  .join('\n');

const css = `  .cap{pointer-events:none;z-index:90;display:block}
  .cap-word{position:absolute;left:50%;transform:translateX(-50%);top:${args.top}px;width:${args.width}px;text-align:center;font:400 ${args.size}px/1 ${args.font};letter-spacing:.01em;color:${args.color}}
  .cap-word.is-strong{font-weight:600}
  .light .cap-word{color:#161817}`;

const output = `${args.title ? `<!-- ${args.title} -->\n` : ''}<!-- generated by build-word-rail.mjs from ${path.basename(args.transcript)} — ${clips.length} words -->\n${body}\n`;

if (args.out) {
  mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
  writeFileSync(args.out, args.css ? `<style>\n${css}\n</style>\n${output}` : output);
  console.log(`${clips.length} caption clips → ${args.out}  (${clips[0]?.start ?? 0}s → ${round((clips.at(-1)?.start ?? 0) + (clips.at(-1)?.duration ?? 0))}s, ${clips.filter((c) => c.strong).length} emphasised)`);
} else {
  if (args.css) console.log(`<style>\n${css}\n</style>`);
  process.stdout.write(output);
}
