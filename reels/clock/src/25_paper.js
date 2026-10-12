// ======================================================================
// the newspaper: "This month, scientists built a clock that ticks inside the atom." is the front-page headline, typed word by word
// ======================================================================
function sPaper(t) {
  darkBg(1);
  const T0 = 20.8, k = eob(prog(t, T0, T0 + 1.5)), drift = prog(t, T0, 25.8), z = lerp(1.0, 1.07, eio(drift));
  const PX = 110, PW = 830, PY = 330, PH = 1130;
  g.save(); g.translate(W / 2, H / 2 + 20); g.scale(z, z); g.rotate((-.012 + .012 * eo(prog(t, T0, T0 + 2.2))) ); g.translate(-W / 2, -H / 2 - 20 + (1 - k) * 1500);
  g.shadowColor = "rgba(0,0,0,.65)"; g.shadowBlur = 70; g.shadowOffsetY = 30; g.fillStyle = "#EFE7D6"; g.fillRect(PX, PY, PW, PH); g.shadowColor = "transparent";
  const gr = g.createLinearGradient(PX, PY, PX + PW, PY + PH); gr.addColorStop(0, "rgba(255,252,240,.7)"); gr.addColorStop(1, "rgba(200,185,155,.35)"); g.fillStyle = gr; g.fillRect(PX, PY, PW, PH);
  // masthead
  g.fillStyle = "#16121c"; g.fillRect(PX + 40, PY + 40, PW - 80, 4); g.fillRect(PX + 40, PY + 136, PW - 80, 2);
  g.font = "800 54px Playfair"; g.textAlign = "center"; g.letterSpacing = "4px"; g.fillText("ZBACKTRACK STORIES", PX + PW / 2 + 3, PY + 108);
  g.font = "700 22px Inter"; g.letterSpacing = "5px"; g.fillStyle = "#6b5a3a"; g.fillText("SCIENCE · OCTOBER 2026", PX + PW / 2 + 2, PY + 176); g.fillStyle = "#16121c"; g.fillRect(PX + 40, PY + 196, PW - 80, 2);
  // headline = the voice, word by word
  g.font = "800 88px Playfair"; g.letterSpacing = "0px"; g.textAlign = "left";
  const words = []; for (let i = 55; i <= 65; i++) words.push([WD[i][0], WD[i][1]]);
  const maxW = PW - 100, lines = [[]]; let lw = 0;
  for (const w of words) { const wd = g.measureText(w[0] + " ").width; if (lw + wd > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push([...w, wd]); lw += wd; }
  const HY = PY + 330; let hx0 = 1e9, hx1 = 0;
  lines.forEach((ln, li) => { let x = PX + 50; for (const [w, tt, wd] of ln) { const a = eo(prog(t, tt - .04, tt + .28)); if (a > 0) { g.save(); g.globalAlpha = a; const key = w.replace(/[^a-z]/gi, "").toLowerCase();
        if (key === "atom") { g.fillStyle = "rgba(185,160,255,.75)"; g.fillRect(x - 6, HY + li * 100 - 66, g.measureText(w).width + 12, 86); }
        g.fillStyle = key === "inside" ? "#9A3F14" : "#16121c"; if (key === "inside") g.font = "italic 800 88px Playfair"; g.fillText(w, x, HY + li * 100 + (1 - a) * 14); g.restore(); g.font = "800 88px Playfair"; hx0 = Math.min(hx0, x); hx1 = Math.max(hx1, x + wd); } x += wd; } });
  g.fillStyle = "#16121c"; g.fillRect(PX + 40, HY + lines.length * 100 + 10, 220, 5);
  // a halftone photo of the planet the clocks work for (real NASA Blue Marble), hung under the headline
  const pa = eo(prog(t, 22.9, 24.0)); if (pa > 0) { g.save(); g.globalAlpha = pa; const ix = PX + 50, iy = HY + lines.length * 100 + 50, iw = PW - 100, ih = Math.min(470, PY + PH - 50 - iy); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip();
    const im = IM.jila; if (im && im.naturalWidth) { g.filter = "contrast(1.1) saturate(.85) sepia(.25)"; const sc = Math.max(iw / im.width, ih / im.height); g.drawImage(im, ix + iw / 2 - im.width * sc / 2, iy + ih / 2 - im.height * sc / 2, im.width * sc, im.height * sc); g.filter = "none"; }
    g.globalCompositeOperation = "multiply"; g.fillStyle = "rgba(255,240,205,.5)"; g.fillRect(ix, iy, iw, ih); g.restore(); }
  g.restore();
  regEl("paper", PX, PY, PW, PH, (k > .5 && t > 21.8 && t < 24.9) ? 1 : 0);
}
