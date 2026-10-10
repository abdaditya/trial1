// Render index.html frame by frame with the preinstalled Playwright + ffmpeg.
//   node render.mjs stills 0 2 4.5 ...   -> out/stills/t_<sec>.png
//   node render.mjs video [fps]          -> out/picture.mp4 (muted)
import { createRequire } from "module";
import { spawn } from "child_process";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require("playwright");
const here = path.dirname(fileURLToPath(import.meta.url));
const [mode = "stills", ...rest] = process.argv.slice(2);

const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on("console", m => console.log("[page]", m.text()));
page.on("pageerror", e => { console.error("[page error]", e.message); process.exit(1); });
await page.goto("file://" + path.join(here, "index.html"));
console.log("ready", await page.evaluate(() => window.ready));

const grab = async t => {
  const b64 = await page.evaluate(t => { window.seek(t); return document.getElementById("c").toDataURL("image/png").split(",")[1]; }, t);
  return Buffer.from(b64, "base64");
};

if (mode === "stills") {
  const dir = path.join(here, "out/stills"); mkdirSync(dir, { recursive: true });
  const { writeFileSync } = await import("fs");
  for (const s of rest) writeFileSync(path.join(dir, `t_${s}.png`), await grab(+s));
} else {
  const fps = +(rest[0] || 30), dur = await page.evaluate(() => window.DUR), n = Math.round(dur * fps);
  mkdirSync(path.join(here, "out"), { recursive: true });
  const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    path.join(here, "out/picture.mp4")], { stdio: ["pipe", "inherit", "inherit"] });
  for (let i = 0; i < n; i++) {
    const buf = await grab(i / fps);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
    if (i % 90 === 0) console.log(`frame ${i}/${n}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on("close", r));
  console.log("wrote out/picture.mp4");
}
await browser.close();
