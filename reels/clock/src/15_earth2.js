// ---- Earth, scene 2: the two labs (Vienna and Beijing) ----
function raceFrame(t) {
  const cam = track([[82.6, [44, 62, 6.6, -330]], [86.0, [44, 64, 6.0, -330]], [88.6, [42, 66, 5.7, -330]]], t);
  earthCam(cam[0], cam[1], cam[2], cam[3]); EARTH_MAT.uniforms.nightAmt.value = .35; EARTH_MAT.uniforms.dayAmt.value = .95; EARTH_MAT.uniforms.sun.value.copy(ll2v(40, 60)).normalize();
  E.A.scale.setScalar(.001); E.B.scale.setScalar(.001); E.pin.material.opacity = 0; E.pkA.material.opacity = 0; E.pkB.material.opacity = 0; E.beamA.material.opacity = 0; E.beamB.material.opacity = 0; E.ripple.forEach(r => r.material.opacity = 0); E.pinRing.forEach(r => r.material.opacity = 0);
  const kv = eob(prog(t, tw("vienna", 0) - .1, tw("vienna", 0) + .5)), kb = eob(prog(t, tw("beijing") - .1, tw("beijing") + .5));
  E.vie.material.opacity = clamp(kv); E.bei.material.opacity = clamp(kb); E.vie.scale.set(.11 * kv + .001, .14 * kv + .001, 1); E.bei.scale.set(.11 * kb + .001, .14 * kb + .001, 1);
  const pulse = (ring, t0, per) => { const k = (((t - t0) / per) % 1 + 1) % 1; ring.scale.setScalar(.06 + .3 * eo(k)); ring.material.opacity = t > t0 ? .8 * (1 - k) : 0; };
  pulse(E.vieRing, tw("vienna", 0) + .3, 1.4); pulse(E.beiRing, tw("beijing") + .3, 1.4);
  const first = eo(prog(t, tw("first") - .1, tw("first") + .5));
  E.vie.material.color.setRGB(1, 1, 1); E.bei.material.color.setRGB(1, 1, 1);
  draw3D(EARTH, 0x05060b); shade(.7, 760, .45);
  const vp = E.vie.position.clone().multiplyScalar(1.0), bp = E.bei.position.clone();
  lab3("VIENNA", vp, -50, -120, win(t, tw("vienna", 0) + .1, 88.2, .4, .5), "vie", "#C9B7FF");
  lab3("BEIJING", bp, 60, -120, win(t, tw("beijing") + .1, 88.2, .4, .5), "bei", "#F7D58A");
  const sep = win(t, tw("working") - .05, tw("built", 1) + .2, .35, .4); if (sep > 0) { g.save(); g.globalAlpha = sep; g.font = "700 40px Inter"; g.letterSpacing = "5px"; const s2 = "WORKING SEPARATELY", w2 = g.measureText(s2).width + 5; g.fillStyle = "rgba(12,10,16,.9)"; rrect(CX - w2 / 2 - 30, 1330, w2 + 60, 82, 41); g.fill(); g.strokeStyle = "#9FE8FF"; g.lineWidth = 3; g.stroke(); g.fillStyle = "#9FE8FF"; g.textAlign = "center"; g.fillText(s2, CX + 3, 1384); g.restore(); reg("sep", CX - w2 / 2 - 30, 1330, w2 + 60, 82, sep, 40, 10); }
  if (first > 0) { g.save(); g.globalAlpha = first; g.font = "700 40px Inter"; g.letterSpacing = "5px"; const s2 = "THE WORLD'S FIRST NUCLEAR CLOCKS", w2 = g.measureText(s2).width + 5; g.fillStyle = "rgba(12,10,16,.9)"; rrect(CX - w2 / 2 - 28, 1420, w2 + 56, 82, 41); g.fill(); g.strokeStyle = "#FFC55C"; g.lineWidth = 3; g.stroke(); g.fillStyle = "#FFC55C"; g.textAlign = "center"; g.fillText(s2, CX + 3, 1474); g.restore(); reg("first", CX - w2 / 2 - 28, 1420, w2 + 56, 82, first, 40, 10); }
}
// ---- Earth, scene 3: the finale - your phone, the satellites, and the clock that might tick inside an atom ----
function finaleFrame(t) {
  const cam = track([[93.9, [28, -70, 6.2, -340]], [99.6, [26, -60, 7.4, -360]]], t);
  earthCam(cam[0], cam[1], cam[2], cam[3]); EARTH_MAT.uniforms.nightAmt.value = .6; EARTH_MAT.uniforms.dayAmt.value = .8; EARTH_MAT.uniforms.sun.value.copy(ll2v(15, -85)).normalize();
  const pA = GPS.sA().add(new THREE.Vector3(0, Math.sin(t * .35) * .02, 0)), pB = GPS.sB();
  E.A.position.copy(pA); E.B.position.copy(pB); E.A.lookAt(0, 0, 0); E.B.lookAt(0, 0, 0); const ap = eo(prog(t, 94.0, 95.0)); E.A.scale.setScalar(1.3 * ap + .001); E.B.scale.setScalar(1.3 * ap + .001);
  E.A.userData.glow.material.opacity = ap * (.55 + .45 * Math.sin(t * 12)); E.B.userData.glow.material.opacity = ap * (.55 + .45 * Math.sin(t * 12 + 1));
  E.vie.material.opacity = 0; E.bei.material.opacity = 0; E.vieRing.material.opacity = 0; E.beiRing.material.opacity = 0; E.pinRing.forEach(r => r.material.opacity = 0);
  // beams from both satellites to the phone, steady pulses
  E.pin.material.opacity = 1; E.pin.scale.set(.11, .14, 1); const pinP = E.pin.position;
  setCyl(E.beamA, pA, pinP); setCyl(E.beamB, pB, pinP); E.beamA.material.opacity = .2 * ap; E.beamB.material.opacity = .2 * ap;
  const u1 = ((t * .4) % 1), u2 = ((t * .4 + .5) % 1); E.pkA.position.lerpVectors(pA, pinP, u1); E.pkB.position.lerpVectors(pB, pinP, u2); E.pkA.material.opacity = ap; E.pkB.material.opacity = ap;
  E.ripple.forEach((r, i) => { const k = (((t - 94.5) / 1.8 + i * .5) % 1 + 1) % 1; r.position.copy(pinP); r.scale.setScalar(.08 + .5 * eo(k)); r.material.opacity = t > 94.5 ? .5 * (1 - k) : 0; });
  draw3D(EARTH, 0x05060b); shade(.7, 760, .45);
}
function atomIcon(px, py, t, ak) {
  g.save(); g.globalAlpha = ak; g.translate(px, py); const s = lerp(.2, 1, eob(ak)); g.scale(s, s);
  const gl = g.createRadialGradient(0, 0, 10, 0, 0, 150); gl.addColorStop(0, "rgba(255,197,92,.6)"); gl.addColorStop(1, "rgba(255,197,92,0)"); g.fillStyle = gl; g.fillRect(-150, -150, 300, 300);
  for (let i = 0; i < 3; i++) { g.save(); g.rotate(i * Math.PI / 3 + t * .5); g.strokeStyle = "rgba(159,232,255,.95)"; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 0, 92, 34, 0, 0, 7); g.stroke(); const an = t * 2 + i * 2.1; g.fillStyle = "#BFEAFF"; g.beginPath(); g.arc(Math.cos(an) * 92, Math.sin(an) * 34, 8, 0, 7); g.fill(); g.restore(); }
  g.fillStyle = "#FFB347"; g.beginPath(); g.arc(0, 0, 22, 0, 7); g.fill(); g.restore();
}
// the bookend: back to the same Chicago night; the phone's clock becomes an atom
function sEnd(t) {
  const k = eio(prog(t, 96.6, 99.6)), map = photo(IM.chicago, .56, lerp(.36, .40, k), lerp(1.2, 1.0, k), `brightness(${lerp(.7, .95, k)}) contrast(1.1) saturate(1.15)`);
  vignette(.5); shade(.82, 860, .55);
  let [px, py] = map(.53, .34); px = clamp(px, 330, 750); py = clamp(py, 900, 1250);
  const ak = eio(prog(t, tw("inside", 2) - .2, tw("atom", 2) + .35)), ck = 1 - ak;
  if (ck > 0) clockFace(px, py - 40, 118, (t - 3.0) / 3.2, ck);
  if (ak > 0) atomIcon(px, py - 40, t, ak);
}
