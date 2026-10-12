// ======================================================================
// 2D scenes: the hook (a real photo), the 30 cm ruler card
// ======================================================================
function clockFace(cx, cy, r, sec, a = 1, col = "#FFC55C", ghost = null, face = "rgba(14,12,22,.92)") {   // sec: second-hand angle in turns; ghost: a second hand that is slightly wrong
  g.save(); g.globalAlpha *= a; g.translate(cx, cy);
  const gl = g.createRadialGradient(0, 0, r * .6, 0, 0, r * 1.7); gl.addColorStop(0, "rgba(255,197,92,.35)"); gl.addColorStop(1, "rgba(255,197,92,0)"); g.fillStyle = gl; g.fillRect(-r * 2, -r * 2, r * 4, r * 4);
  g.fillStyle = face; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.strokeStyle = col; g.lineWidth = Math.max(3, r * .06); g.stroke();
  for (let i = 0; i < 60; i++) { const an = i / 60 * Math.PI * 2, big = i % 5 === 0, r0 = r * (big ? .78 : .86), r1 = r * .93; g.strokeStyle = big ? col : "rgba(245,239,227,.5)"; g.lineWidth = big ? r * .035 : r * .015; g.beginPath(); g.moveTo(Math.sin(an) * r0, -Math.cos(an) * r0); g.lineTo(Math.sin(an) * r1, -Math.cos(an) * r1); g.stroke(); }
  const hand = (turn, len, w, c) => { const an = turn * Math.PI * 2; g.strokeStyle = c; g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(-Math.sin(an) * r * .12, Math.cos(an) * r * .12); g.lineTo(Math.sin(an) * r * len, -Math.cos(an) * r * len); g.stroke(); };
  hand(.04, .5, r * .06, "#F5EFE3"); hand(.62, .68, r * .045, "#F5EFE3");
  if (ghost !== null) hand(sec + ghost, .84, r * .03, "rgba(255,90,78,.95)");
  hand(sec, .84, r * .03, col); g.fillStyle = col; g.beginPath(); g.arc(0, 0, r * .06, 0, 7); g.fill(); g.restore();
}
// S1 - the hook: Chicago at night, photographed from the ISS (NASA, public domain) - a street map made of light; on "map" a pin drops, on "clock" it turns into a clock
function sHook(t) {
  const k = eio(prog(t, 0, 4.7)), im = IM.chicago;
  const map = photo(im, .56, lerp(.40, .36, k), lerp(1.0, 1.2, k), `brightness(${lerp(.95, .7, k)}) contrast(1.1) saturate(1.15)`);
  vignette(.5); shade(.82, 860, .55);
  let [px, py] = map(.53, .34); px = clamp(px, 330, 750); py = clamp(py, 900, 1250);
  const reveal = eo(prog(t, tw("map") - .3, tw("map") + .35)), toClock = eio(prog(t, tw("clock") - .15, tw("clock") + .9)), drop = eob(prog(t, tw("map") - .15, tw("map") + .45));
  if (reveal > 0 && toClock < 1) { g.save(); g.globalAlpha = reveal * (1 - toClock); g.translate(px, py - (1 - drop) * 160); g.scale(1 - toClock * .5, 1 - toClock * .5);
    g.shadowColor = "rgba(0,0,0,.6)"; g.shadowBlur = 20; g.fillStyle = "#FFC55C"; g.beginPath(); g.arc(0, -66, 50, Math.PI * .85, Math.PI * .15, false); g.lineTo(0, 0); g.closePath(); g.fill(); g.shadowColor = "transparent"; g.fillStyle = "#1a1228"; g.beginPath(); g.arc(0, -66, 19, 0, 7); g.fill(); g.restore(); }
  if (toClock > 0) { const s = eob(prog(t, tw("clock") - .1, tw("clock") + .7)); clockFace(px, py - 40, 118 * Math.max(.01, s), (t - 3.0) / 3.2, toClock); regEl("clock", px - 130, py - 170, 260, 260, toClock); }
  for (let i = 0; i < 2; i++) { const rg = prog(t, tw("clock") + .4 + i * .5, tw("clock") + 1.6 + i * .5); if (rg > 0 && rg < 1) { g.save(); g.globalAlpha = .6 * (1 - rg); g.strokeStyle = "#FFC55C"; g.lineWidth = 4; g.beginPath(); g.arc(px, py - 40, 140 + 420 * eo(rg), 0, 7); g.stroke(); g.restore(); } }
}
// S3 - 30 cm in a billionth of a second: a light pulse races along a ruler, then the phone's clock is off by that much
function sRuler(t) {
  creamBg(); const RX0 = 150, RX1 = 900, RY = 1300, PXCM = (RX1 - RX0) / 30, tL = tw("light") - .05;
  g.save(); g.globalAlpha = .06; g.globalCompositeOperation = "multiply"; g.drawImage(grain, 0, 0, W, H); g.restore();
  // the ruler slides in
  const rk = eo(prog(t, 12.1, 13.0)); g.save(); g.globalAlpha = rk; g.translate(0, (1 - rk) * 60);
  g.shadowColor = "rgba(60,40,20,.3)"; g.shadowBlur = 40; g.shadowOffsetY = 18; g.fillStyle = "#F1C94A"; rrect(RX0 - 40, RY - 70, 830, 170, 14); g.fill(); g.shadowColor = "transparent";
  g.fillStyle = "#2a2420"; for (let i = 0; i <= 30; i++) { const x = RX0 + i * PXCM, big = i % 5 === 0; g.fillRect(x - 1.5, RY - 70, 3, big ? 62 : 36); if (big) { g.font = "700 38px Inter"; g.textAlign = "center"; g.fillText(String(i), x, RY + 20); } }
  g.font = "700 30px Inter"; g.letterSpacing = "4px"; g.textAlign = "left"; g.fillStyle = "#6b5718"; g.fillText("CM", RX0 - 20, RY + 78); g.restore(); regEl("ruler", RX0 - 40, RY - 70, 830, 170, rk);
  // the light pulse + the nanosecond counter
  const tr = prog(t, tw("30") + .05, te("second") - .1), lx = RX0 + (RX1 - RX0) * tr, ns1 = (tr * 1).toFixed(2);
  const ca = win(t, tw("travels"), 15.75, .35, .45); if (ca > 0) { g.save(); g.globalAlpha = ca; g.textAlign = "center"; g.fillStyle = "#16121c"; g.font = "800 130px Playfair"; g.fillText(ns1 + " ns", CX, 800);
    g.font = "700 34px Inter"; g.letterSpacing = "4px"; g.fillStyle = "#9A3F14"; g.fillText("ONE BILLIONTH OF A SECOND", CX, 860); g.restore(); reg("ns", CX - 300, 700, 600, 170, ca, 130, 14); }
  if (tr > 0) { g.save(); const trail = g.createLinearGradient(RX0, 0, lx, 0); trail.addColorStop(0, "rgba(255,160,40,0)"); trail.addColorStop(1, "rgba(255,150,30,.9)"); g.fillStyle = trail; g.fillRect(RX0, RY - 120, lx - RX0, 16);
    g.globalCompositeOperation = "source-over"; const gl = g.createRadialGradient(lx, RY - 112, 0, lx, RY - 112, 70); gl.addColorStop(0, "rgba(255,255,255,1)"); gl.addColorStop(.25, "rgba(255,196,90,.9)"); gl.addColorStop(1, "rgba(255,150,30,0)"); g.fillStyle = gl; g.fillRect(lx - 70, RY - 182, 140, 140); g.restore(); }
  const ba = eo(prog(t, tr >= 1 ? te("second") - .1 : 99, te("second") + .4)); if (ba > 0) { g.save(); g.globalAlpha = ba; g.strokeStyle = "#C0392B"; g.lineWidth = 6; g.beginPath(); g.moveTo(RX0, RY - 150); g.lineTo(RX1, RY - 150); g.moveTo(RX0, RY - 166); g.lineTo(RX0, RY - 134); g.moveTo(RX1, RY - 166); g.lineTo(RX1, RY - 134); g.stroke();
    g.font = "800 60px Playfair"; g.fillStyle = "#C0392B"; g.textAlign = "center"; g.fillText("30 cm", CX + 20, RY - 180); g.restore(); reg("30cm", CX - 120, RY - 240, 280, 80, ba, 60, 8); }
  // "one tiny clock mistake": the clock is off by a hair ...
  const clA = win(t, tw("so", 0) - .1, 20.9, .5, .6), tick = (t - 15.9) / 4.0;
  if (clA > 0) { g.save(); g.globalAlpha = clA; clockFace(250, 960, 96, tick, 1, "#B4501F", .035 * eo(prog(t, tw("tiny"), tw("mistake") + .3)), "#FBF8F1"); g.restore();
    const ea = eo(prog(t, tw("tiny") + .3, tw("mistake") + .4)); if (ea > 0) { g.save(); g.globalAlpha = ea * clA; g.font = "700 36px Inter"; g.letterSpacing = "3px"; g.fillStyle = "#C0392B"; g.textAlign = "left"; g.fillText("OFF BY 1 BILLIONTH", 390, 972); g.restore(); reg("off", 390, 936, 470, 50, ea * clA, 36, 8); }
    regEl("clock2", 140, 850, 220, 220, clA); }
  // ... and your phone puts you that far from where you really are
  const pk1 = eob(prog(t, tw("and", 0) + .05, tw("and", 0) + .5)), mv = eio(prog(t, tw("you're") + .3, te("off") - .2)), pa = win(t, tw("and", 0), 21.0, .35, .6);
  if (pa > 0) { const pin = (x, y, col, lbl, a) => { g.save(); g.globalAlpha = pa * a; g.translate(x, y); g.shadowColor = "rgba(60,40,20,.35)"; g.shadowBlur = 14; g.fillStyle = col; g.beginPath(); g.arc(0, -60, 40, Math.PI * .85, Math.PI * .15, false); g.lineTo(0, 0); g.closePath(); g.fill(); g.shadowColor = "transparent"; g.fillStyle = "#FBF8F1"; g.beginPath(); g.arc(0, -60, 15, 0, 7); g.fill(); g.restore(); };
    pin(RX0, RY - 72 - (1 - pk1) * 160, "#2E9E5B", "", pk1); pin(RX0 + (RX1 - RX0) * mv, RY - 72 - (1 - pk1) * 160, "#C0392B", "", pk1);
    const la = pk1 * pa; g.save(); g.globalAlpha = la; g.font = "700 34px Inter"; g.letterSpacing = "3px"; g.textAlign = "left"; g.fillStyle = "#1F7A45"; g.fillText("WHERE YOU ARE", RX0 - 30, RY + 152); g.textAlign = "right"; g.fillStyle = "#C0392B"; g.fillText("WHERE YOUR PHONE THINKS", RX1 + 30, RY + 214); g.restore();
    reg("p1", RX0 - 30, RY + 118, 400, 44, la, 36, 8); reg("p2", RX1 - 480, RY + 180, 510, 44, la, 36, 8); }
}
