// ======================================================================
// 2D scenes: the clock in the wind, the energy/colour hunt (dark UI), the "not yet" chart (cream card)
// ======================================================================
function windGust(t, y0, y1, a, col) {   // soft wind streaks drifting across the card
  g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = 4; g.lineCap = "round";
  for (let i = 0; i < 9; i++) { const y = lerp(y0, y1, i / 8) + Math.sin(i * 2.3) * 24, sp = 520 + i * 40, x = (((t * sp + i * 311) % 1500) - 200), len = 130 + (i % 3) * 60;
    g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + len * .4, y - 18, x + len * .7, y + 18, x + len, y - 4); g.stroke(); } g.restore();
}
// S - a clock hanging out in the wind
function sWind(t) {
  creamBg(); g.save(); g.globalAlpha = .06; g.globalCompositeOperation = "multiply"; g.drawImage(grain, 0, 0, W, H); g.restore();
  const gust = eio(prog(t, tw("hanging") - .2, tw("wind") + .6)), sway = Math.sin(t * 2.6) * (.09 + .26 * gust) + Math.sin(t * 4.1) * .03 * gust, ax = CX, ay = 660, L = 430;
  windGust(t, 800, 1450, .35 + .4 * gust, "#9A8F7C");
  const cx = ax + Math.sin(sway) * L, cy = ay + Math.cos(sway) * L;
  g.save(); g.fillStyle = "#6b5718"; g.beginPath(); g.arc(ax, ay, 14, 0, 7); g.fill(); g.strokeStyle = "#3a3329"; g.lineWidth = 6; g.beginPath(); g.moveTo(ax, ay); g.lineTo(cx, cy - 200); g.stroke();
  g.translate(cx, cy); g.rotate(sway * .6); g.shadowColor = "rgba(60,40,20,.35)"; g.shadowBlur = 30; g.shadowOffsetY = 16; g.translate(-cx, -cy);
  clockFace(cx, cy, 200, (t - 37) * .02 * 6, 1, "#2a2420", null, "#FBF8F1"); g.restore();
  // the tick wave goes ragged: the clock cannot keep a steady beat
  const wa = eo(prog(t, tw("wind") - .2, tw("wind") + .5)); if (wa > 0) { g.save(); g.globalAlpha = wa; const y0 = 1400; g.strokeStyle = "#C0392B"; g.lineWidth = 5; g.beginPath(); for (let x = 120; x <= 960; x += 4) { const u = (x - 120) / 840, yy = y0 - Math.sin(u * 40 + t * 8) * (30 + 24 * Math.sin(u * 17 + t * 5)); x === 120 ? g.moveTo(x, yy) : g.lineTo(x, yy); } g.stroke(); g.restore(); }
}
// S - one problem, then thorium, then the exact colour (a dark UI world), then the 50-year hunt
const SP = { x0: 120, x1: 920, y: 1100 };   // spectrum strip; 100-800 nm
const spx = nm => SP.x0 + (nm - 100) / 700 * (SP.x1 - SP.x0);
function visGradient() { const gr = g.createLinearGradient(spx(400), 0, spx(700), 0); [[0, "#7a2cff"], [.18, "#2f5bff"], [.38, "#27d3ff"], [.52, "#37e06b"], [.7, "#ffe04a"], [.85, "#ff8a2a"], [1, "#ff3b2a"]].forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
function sSpectrum(t) {
  labBg(IM.nistion, .5, .5, 1.0, 1.12, 52, 70.9, t, .62, 6);
  // ---- A: the energy needed (huge for a usual nucleus, tiny for thorium) ----
  const A = win(t, 52.2, tw("except", 0) + .2, .6, .8) , A2 = win(t, tw("except", 0) - .1, 62.9, .7, .8);
  if (A > 0) { g.save(); g.globalAlpha = A; const bx = 300, by = 1380, bh = 700, bw = 150, k = eio(prog(t, tw("huge") - .5, tw("huge") + .9));
    g.fillStyle = "rgba(255,255,255,.1)"; rrect(bx, by - bh, bw, bh, 16); g.fill(); const gr = g.createLinearGradient(0, by, 0, by - bh); gr.addColorStop(0, "#FF9A5C"); gr.addColorStop(1, "#FF3B2A"); g.fillStyle = gr; rrect(bx, by - bh * k, bw, Math.max(8, bh * k), 16); g.fill();
    g.font = "700 38px Inter"; g.letterSpacing = "4px"; g.textAlign = "center"; g.fillStyle = "#F5EFE3"; g.fillText("A USUAL NUCLEUS", bx + bw / 2 + 60, by + 56); g.fillStyle = "#FF8A6A"; g.fillText("NEEDS HUGE ENERGY", bx + bw / 2 + 60, by + 104);
    const hk = eo(prog(t, tw("huge") + .3, tw("energy") + .3)); if (hk > 0) { g.globalAlpha = A * hk; g.font = "800 150px Playfair"; g.fillStyle = "#FF6B5A"; g.fillText("HUGE", bx + bw + 270, by - bh * .5 + 40); }
    g.restore(); regEl("bar1", bx - 20, by - bh - 10, 660, bh + 140, A); }
  // ---- B/C: thorium, its ultraviolet colour, and the hunt ----
  if (A2 > 0) {
    const tile = eob(prog(t, tw("thorium", 0) - .1, tw("thorium", 0) + .5)); g.save(); g.globalAlpha = A2 * clamp(tile); g.translate(210, 640); g.scale(.4 + .6 * tile, .4 + .6 * tile);
    g.shadowColor = "rgba(255,197,92,.55)"; g.shadowBlur = 40; g.fillStyle = "#FBF8F1"; rrect(-100, -100, 200, 200, 14); g.fill(); g.shadowColor = "transparent";
    g.strokeStyle = "#B4501F"; g.lineWidth = 5; rrect(-100, -100, 200, 200, 14); g.stroke(); g.fillStyle = "#2a2420"; g.textAlign = "left"; g.font = "700 40px Inter"; g.fillText("90", -78, -52); g.textAlign = "center"; g.font = "800 100px Playfair"; g.fillText("Th", 0, 38);
    g.font = "700 38px Inter"; g.fillText("229", 0, 84); g.restore(); regEl("tile", 90, 540, 240, 240, A2 * clamp(tile));
    const nm = A2 * eo(prog(t, tw("thorium", 0) + .15, tw("thorium", 0) + .7)); if (nm > 0) { g.save(); g.globalAlpha = nm; g.font = "700 38px Inter"; g.letterSpacing = "6px"; g.fillStyle = "#F7D58A"; g.textAlign = "left"; g.fillText("THORIUM", 350, 636); g.font = "700 36px Inter"; g.letterSpacing = "3px"; g.fillStyle = "#9FE8FF"; g.fillText("ONLY 8.4 eV NEEDED", 350, 712); g.restore(); reg("thname", 350, 596, 420, 54, nm, 38, 10); reg("thev", 350, 676, 560, 50, nm, 36, 10); }
    // the strip
    const sa = A2 * eo(prog(t, tw("one", 2) - .5, tw("one", 2) + .3)); if (sa > 0 || t > 63) { const sk = A2 * eo(prog(t, tw("exact") - .6, tw("exact") + .3)); g.save(); g.globalAlpha = sk;
      g.fillStyle = "rgba(10,12,22,.8)"; rrect(SP.x0 - 30, SP.y - 150, SP.x1 - SP.x0 + 60, 290, 22); g.fill();
      g.fillStyle = visGradient(); g.fillRect(spx(400), SP.y - 22, spx(700) - spx(400), 44);
      g.fillStyle = "rgba(142,92,255,.28)"; g.fillRect(spx(100), SP.y - 22, spx(400) - spx(100), 44); g.strokeStyle = "rgba(180,150,255,.6)"; g.lineWidth = 2; for (let x = spx(100); x < spx(400); x += 14) { g.beginPath(); g.moveTo(x, SP.y + 22); g.lineTo(x + 14, SP.y - 22); g.stroke(); }
      g.font = "700 36px Inter"; g.letterSpacing = "3px"; g.textAlign = "left"; g.fillStyle = "#C9A9FF"; g.fillText("ULTRAVIOLET", spx(100), SP.y + 84); g.textAlign = "right"; g.fillStyle = "#F5EFE3"; g.fillText("VISIBLE", spx(700), SP.y + 84); g.restore();
      regEl("strip", SP.x0 - 30, SP.y - 150, SP.x1 - SP.x0 + 60, 178, sk); reg("uv", spx(100), SP.y + 48, 330, 50, sk, 36, 9);
      // the hunt: a cursor that scans, misses, and finally locks on 148 nm
      const hunt = prog(t, tw("for", 0) + .1, tw("hit", 1) - .1), lock = eo(prog(t, tw("hit", 1) - .05, tw("hit", 1) + .3)), target = spx(148);
      const hx = lerp(spx(560) + Math.sin(t * 2.2) * 90, target, 0) , scan = (hunt < 1) ? (spx(150) + (spx(520) - spx(150)) * (.5 + .5 * Math.sin(t * 1.9 + Math.sin(t * .6) * 2)) * (1 - .55 * hunt) + (target - spx(150)) * .0) : target;
      const cx = lerp(scan, target, lock);
      if (t > tw("for", 0) + .1) { g.save(); g.globalAlpha = sk; g.strokeStyle = lock > .5 ? "#7AE0A0" : "#F5EFE3"; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, SP.y - 92); g.lineTo(cx, SP.y + 40); g.stroke(); g.fillStyle = lock > .5 ? "#7AE0A0" : "#F5EFE3"; g.beginPath(); g.moveTo(cx, SP.y - 40); g.lineTo(cx - 14, SP.y - 70); g.lineTo(cx + 14, SP.y - 70); g.closePath(); g.fill(); g.restore(); }
      // the target needle: one exact colour
      const ne = eo(prog(t, tw("one", 2), tw("one", 2) + .5)); if (ne > 0) { g.save(); g.globalAlpha = ne * sk; g.strokeStyle = "#C9A9FF"; g.lineWidth = 3; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(target, SP.y - 120); g.lineTo(target, SP.y + 30); g.stroke(); g.setLineDash([]);
        const pr = (t * .8) % 1; g.strokeStyle = `rgba(201,169,255,${.8 * (1 - pr)})`; g.lineWidth = 4; g.beginPath(); g.arc(target, SP.y, 14 + 56 * pr, 0, 7); g.stroke(); g.restore(); }
      if (lock > 0) { g.save(); g.globalAlpha = lock; const pr = ((t - tw("hit", 1)) * 1.2) % 1; g.strokeStyle = `rgba(122,224,160,${.9 * (1 - pr)})`; g.lineWidth = 6; g.beginPath(); g.arc(target, SP.y, 30 + 120 * pr, 0, 7); g.stroke(); g.restore(); }
      // labels that land on their words
      const chipc = (txt2, t0, t1, y, col, id) => { const a = A2 * win(t, t0, t1, .3, .4); if (a <= 0) return; g.save(); g.globalAlpha = a; g.font = "700 40px Inter"; g.letterSpacing = "4px"; const w2 = g.measureText(txt2).width + 4; g.fillStyle = "rgba(12,10,16,.9)"; rrect(CX - w2 / 2 - 28, y - 46, w2 + 56, 78, 39); g.fill(); g.strokeStyle = col; g.lineWidth = 3; g.stroke(); g.fillStyle = col; g.textAlign = "center"; g.fillText(txt2, CX + 2, y + 8); g.restore(); reg("chip:" + id, CX - w2 / 2 - 28, y - 46, w2 + 56, 78, a, 40, 10); };
      chipc("ONE EXACT COLOUR", tw("one", 2) - .05, tw("invisible") - .1, 880, "#C9A9FF", "exact"); chipc("INVISIBLE LIGHT", tw("invisible") - .05, te("light", 1) + .6, 880, "#C9A9FF", "invis");
      // the hunt: years counter; 2024 hit
      const ya = A2 * win(t, tw("for", 0) - .05, te("it", 3) + .6, .5, .8); if (ya > 0) { const yr = Math.floor(49 * eio(prog(t, tw("for", 0) + .1, tw("scientists", 2) - .3))); g.save(); g.globalAlpha = ya;
        g.font = "800 190px Playfair"; g.textAlign = "left"; g.fillStyle = "#F5EFE3"; g.fillText(String(yr), 130, 780); g.font = "700 40px Inter"; g.letterSpacing = "5px"; g.fillStyle = "#F7D58A"; g.fillText("YEARS OF SEARCHING", 130, 850); g.restore(); regEl("years", 110, 600, 520, 280, ya); reg("yrs", 130, 810, 500, 54, ya, 40, 10); }
      const va = A2 * win(t, tw("2024"), te("it", 3) + .8, .4, .6); if (va > 0) { const kk = eob(prog(t, tw("2024"), tw("2024") + .5)); g.save(); g.globalAlpha = va; g.translate(790, 760); g.scale(.7 + .3 * kk, .7 + .3 * kk);
        g.fillStyle = "rgba(10,12,22,.9)"; rrect(-190, -110, 380, 240, 20); g.fill(); g.strokeStyle = "#7AE0A0"; g.lineWidth = 3; g.stroke(); g.textAlign = "center"; g.fillStyle = "#7AE0A0"; g.font = "800 90px Playfair"; g.fillText("2024", 0, -14); g.fillStyle = "#F5EFE3"; g.font = "700 36px Inter"; g.letterSpacing = "4px"; g.fillText("VIENNA · TU WIEN", 0, 40); g.fillStyle = "#9FE8FF"; g.fillText("FIRST LASER HIT", 0, 92); g.restore(); regEl("v2024", 600, 650, 380, 240, va); }
    }
  }
}
// S - better than today's clocks? Not yet. (a cream chart card)
function sChart(t) {
  creamBg(); g.save(); g.globalAlpha = .06; g.globalCompositeOperation = "multiply"; g.drawImage(grain, 0, 0, W, H); g.restore();
  const CW = 840, CH = 940, TOP = 600, k = eo(prog(t, 87.9, 88.7)); g.save(); g.globalAlpha = k; g.translate(CX, TOP + CH / 2 + (1 - k) * 160);
  g.shadowColor = "rgba(60,40,20,.28)"; g.shadowBlur = 50; g.shadowOffsetY = 24; g.fillStyle = "#FBF8F1"; g.fillRect(-CW / 2, -CH / 2, CW, CH); g.shadowColor = "transparent"; g.strokeStyle = "#d8cfbd"; g.lineWidth = 2; g.strokeRect(-CW / 2 + 14, -CH / 2 + 14, CW - 28, CH - 28);
  const base = CH / 2 - 150, bw = 220, x1 = -170, x2 = 170;
  g.strokeStyle = "#2a2420"; g.lineWidth = 3; g.beginPath(); g.moveTo(-CW / 2 + 60, base); g.lineTo(CW / 2 - 60, base); g.stroke();
  const ak = eio(prog(t, 88.9, 89.9)), nk = eio(prog(t, 89.0, 90.0));
  g.fillStyle = "#2a2420"; g.fillRect(x1 - bw / 2, base - 300 * ak, bw, 300 * ak);
  g.fillStyle = "#F08C32"; g.fillRect(x2 - bw / 2, base - 180 * nk, bw, 180 * nk);
  g.font = "700 36px Inter"; g.letterSpacing = "2px"; g.textAlign = "center"; g.fillStyle = "#2a2420"; g.fillText("TODAY'S", x1, base + 50); g.fillText("ATOMIC CLOCKS", x1, base + 94); g.fillStyle = "#B4501F"; g.fillText("NUCLEAR", x2, base + 50); g.fillText("CLOCK (NOW)", x2, base + 94);
  // later: the nuclear bar is predicted to climb far higher (the researchers' estimate), shown breaking out of the card
  const gk = eio(prog(t, tw("improve") - .1, tw("times", 1) + .5)); if (gk > 0) { g.save(); g.beginPath(); g.rect(-CW / 2, -CH / 2, CW, CH); g.clip(); g.strokeStyle = "#B4501F"; g.lineWidth = 6; g.setLineDash([16, 12]); const hh = 180 + gk * 300; g.strokeRect(x2 - bw / 2, base - hh, bw, hh); g.fillStyle = `rgba(240,140,50,${.35 * gk})`; g.fillRect(x2 - bw / 2, base - hh, bw, hh); g.setLineDash([]); g.restore(); }
  g.restore();
  
  // stamps and the 10,000x counter
  const st = prog(t, tw("not") - .02, tw("not") + .4); if (st > 0) { g.save(); const s2 = lerp(2.2, 1, eob(clamp(st))); g.globalAlpha = clamp(st * 3) * (1 - eio(prog(t, 90.4, 90.9))); g.translate(CX + 120, 1360); g.rotate(-8 * Math.PI / 180); g.scale(s2, s2); g.font = "600 84px Oswald"; g.letterSpacing = "8px"; const w2 = g.measureText("NOT YET").width + 8; g.strokeStyle = "#C0392B"; g.lineWidth = 7; g.strokeRect(-w2 / 2 - 26, -70, w2 + 52, 104); g.fillStyle = "#C0392B"; g.textAlign = "center"; g.fillText("NOT YET", 4, 4); g.restore(); reg("noty", CX + 120 - 230, 1290, 460, 120, clamp(st * 3) * (1 - eio(prog(t, 90.4, 90.9))), 84, 8); }
  const ca = win(t, tw("improve") - .1, 94.5, .4, .5); if (ca > 0) { const n = Math.round(10000 * eio(prog(t, tw("10"), te("times", 1) - .05))); g.save(); g.globalAlpha = ca; g.textAlign = "center"; g.font = "800 150px Playfair"; g.fillStyle = "#B4501F"; g.fillText(n.toLocaleString("en-US") + "×", CX, 810); g.font = "700 36px Inter"; g.letterSpacing = "3px"; g.fillStyle = "#6b5718"; g.fillText("RESEARCHERS' ESTIMATE · NOT TO SCALE", CX, 870); g.restore(); reg("tenk", CX - 380, 690, 760, 130, ca, 150, 10); reg("est", CX - 400, 846, 800, 44, ca, 36, 9); }
}
