// Render index.html frame by frame with the preinstalled Playwright + ffmpeg,
// and QA every frame's text boxes (safe zone + no overlaps). Exits 1 on any failure.
//   node render.mjs stills 0 2 4.5 ...   -> out/stills/t_<sec>.png
//   node render.mjs video [fps]          -> out/picture.mp4 (muted) + out/text-qa.json
import { createRequire } from "module";
import { spawn } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require("playwright");
const here = path.dirname(fileURLToPath(import.meta.url));
const [mode = "stills", ...rest] = process.argv.slice(2);

const browser = await chromium.launch({ args: ["--allow-file-access-from-files", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on("pageerror", e => { console.error("[page error]", e.message); process.exit(1); });
await page.goto("file://" + path.join(here, process.env.PAGE || "index.html"));
console.log("ready", await page.evaluate(() => window.ready));
const SAFE = await page.evaluate(() => window.SAFE);
mkdirSync(path.join(here, "out"), { recursive: true });
writeFileSync(path.join(here, "out/cues.json"), JSON.stringify(await page.evaluate(() => window.CUES), null, 1));

const fails = [], SEEN = {}; let FPS = 30;
function qa(t, boxes) {
  const vis = boxes.filter(b => b.a > 0.02);
  for (const b of boxes) if ((b.read ?? b.a) > 0.6 && b.words) { const v = SEEN[b.id] || (SEEN[b.id] = { frames: 0, words: b.words }); v.frames++; }
  for (const b of vis) {
    if (b.x < SAFE.x0 || b.x + b.w > SAFE.x1 || b.y < SAFE.y0 || b.y + b.h > SAFE.y1)
      fails.push({ t, kind: "outside-safe-zone", id: b.id, box: b });
  }
  for (const b of boxes.filter(b => (b.read ?? b.a) > 0.6)) {
    if (b.contrast < 7) fails.push({ t, kind: "low-contrast", id: b.id, contrast: b.contrast });
    if (b.size < 36) fails.push({ t, kind: "text-too-small", id: b.id, size: b.size });
  }
  for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
    const a = vis[i], b = vis[j], gap = 16; // boxes must keep a 16 px gap
    if (a.group && a.group === b.group) continue;   // a designed lockup (script over display word) may overlap itself
    if (a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap)
      fails.push({ t, kind: "overlap", ids: [a.id, b.id] });
  }
}
const grab = async t => {
  const [b64, boxes] = await page.evaluate(t => { const boxes = window.seek(t); return [document.getElementById("c").toDataURL("image/png").split(",")[1], boxes]; }, t);
  qa(t, boxes);
  return Buffer.from(b64, "base64");
};

if (mode === "qa") {   // every frame's text checks, no video encode
  FPS = +(rest[0] || 30); const dur = +(process.env.END || await page.evaluate(() => window.DUR)), n = Math.round(dur * FPS);
  for (let i = 0; i < n; i++) qa(i / FPS, await page.evaluate(t => window.seek(t), i / FPS));
} else if (mode === "stills") {
  const dir = path.join(here, "out/stills"); mkdirSync(dir, { recursive: true });
  for (const s of rest) writeFileSync(path.join(dir, `t_${s}.png`), await grab(+s));
} else {
  FPS = +(rest[0] || 30); const fps = FPS, dur = +(process.env.END || await page.evaluate(() => window.DUR)), n = Math.round(dur * fps);
  mkdirSync(path.join(here, "out"), { recursive: true });
  const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    path.join(here, "out/picture.mp4")], { stdio: ["pipe", "inherit", "inherit"] });
  for (let i = 0; i < n; i++) {
    const buf = await grab(i / fps);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
    if (i % 60 === 0) console.log(`frame ${i}/${n}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on("close", r));
  console.log("wrote out/picture.mp4");
}
// reading time: every phrase must be fully readable (a > 0.6) for at least 0.6 s + 0.3 s per word
if (mode !== "stills") for (const [id, v] of Object.entries(SEEN)) { const need = .6 + .3 * v.words, got = v.frames / FPS; if (got + 1e-6 < need) fails.push({ kind: "too-short-to-read", id, seconds: +got.toFixed(2), need: +need.toFixed(2) }); }
writeFileSync(path.join(here, "out/text-qa.json"), JSON.stringify({ fails: fails.length, first: fails.slice(0, 20), all: fails }, null, 1));
console.log(fails.length ? `TEXT QA FAIL: ${fails.length} problems (see out/text-qa.json)` : "TEXT QA PASS: no overlaps, all text inside safe zone");
await browser.close();
process.exit(fails.length ? 1 : 0);
