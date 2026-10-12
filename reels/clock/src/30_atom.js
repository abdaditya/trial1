// ======================================================================
// 3D atom: electrons on the outside, a tiny nucleus inside, a vault that locks it in
// ======================================================================
const ATOM = new THREE.Scene(); const A3 = { el: [], ring: [], parts: [] };
const CYAN = glowTex(110, 200, 255), VIO = glowTex(170, 120, 255);
function buildAtom() {
  ATOM.add(new THREE.AmbientLight(0x8fa6ff, .75)); const dl = new THREE.DirectionalLight(0xfff0d8, 2.4); dl.position.set(3, 4, 5); ATOM.add(dl);
  const sg = new THREE.BufferGeometry(), sp = []; for (let i = 0; i < 1800; i++) { const v = new THREE.Vector3(R() - .5, R() - .5, R() - .5).normalize().multiplyScalar(30 + R() * 30); sp.push(v.x, v.y, v.z); }
  sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); ATOM.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xcfd6ff, size: .14, transparent: true, opacity: .6 })));
  A3.root = new THREE.Group(); ATOM.add(A3.root);
  // nucleus: protons (gold) and neutrons (pale blue-grey) packed tight
  A3.nuc = new THREE.Group(); A3.root.add(A3.nuc);
  const pts = [[0, 0, 0]]; const ph = (1 + Math.sqrt(5)) / 2; for (const [a, b] of [[1, ph], [-1, ph], [1, -ph], [-1, -ph]]) { pts.push([0, a, b], [b, 0, a], [a, b, 0]); }
  pts.forEach((p, i) => { const v = new THREE.Vector3(...p).multiplyScalar(.02); const proton = i % 2 === 0;
    const m = new THREE.Mesh(new THREE.SphereGeometry(.03, 24, 18), new THREE.MeshStandardMaterial({ color: proton ? 0xffb347 : 0xc9d6ee, emissive: proton ? 0xff7a1a : 0x4a5f8a, emissiveIntensity: proton ? .55 : .2, roughness: .35, metalness: .1 })); m.position.copy(v); A3.nuc.add(m); });
  A3.nucGlow = new THREE.Sprite(spriteMat(GOLD, .55)); A3.nucGlow.scale.setScalar(.34); A3.nuc.add(A3.nucGlow);
  // three shells; the outermost shell is the one the clock ticks on
  const radii = [.4, .7, 1.0], counts = [2, 4, 6], tilts = [[.35, 0, .25], [1.15, .4, 0], [-.55, .9, .3]], speed = [1.25, .85, .55];
  radii.forEach((r, s) => { const grp = new THREE.Group(); grp.rotation.set(...tilts[s]); A3.root.add(grp);
    const pp = []; for (let i = 0; i <= 128; i++) { const a = i / 128 * Math.PI * 2; pp.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
    const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pp), new THREE.LineBasicMaterial({ color: s === 2 ? 0xffc35c : 0x7fa8ff, transparent: true, opacity: s === 2 ? .5 : .28 })); grp.add(ring); A3.ring.push(ring);
    for (let j = 0; j < counts[s]; j++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.026, 20, 14), new THREE.MeshStandardMaterial({ color: 0xbfeaff, emissive: 0x3bb8ff, emissiveIntensity: 1.1 })); const gl = new THREE.Sprite(spriteMat(CYAN, .75)); gl.scale.setScalar(.13); m.add(gl);
      grp.add(m); A3.el.push({ m, gl, r, s, j, ph: j / counts[s] * Math.PI * 2 + s, w: speed[s] * (s === 1 ? -1 : 1), grp }); } });
  // the vault: a heavy ring with bolts that slide in
  A3.vault = new THREE.Group(); A3.root.add(A3.vault); const steel = new THREE.MeshStandardMaterial({ color: 0xb9c0c8, metalness: .9, roughness: .3 });
  A3.vRing = new THREE.Mesh(new THREE.TorusGeometry(.5, .05, 18, 72), steel); A3.vault.add(A3.vRing);
  A3.vBolts = []; for (let i = 0; i < 10; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.032, .032, .26, 12), steel); b.userData.a = i / 10 * Math.PI * 2; A3.vault.add(b); A3.vBolts.push(b); }
  A3.vDisc = new THREE.Mesh(new THREE.CircleGeometry(.5, 48), new THREE.MeshBasicMaterial({ color: 0x8fb8ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); A3.vault.add(A3.vDisc);
  // things that disturb the outside: heat / shaking / magnets / (anything) as small glowing particles
  for (let i = 0; i < 70; i++) { const s = new THREE.Sprite(spriteMat(i % 3 === 0 ? REDG : GOLD, 0)); s.scale.setScalar(.12); ATOM.add(s); A3.parts.push({ s, dir: new THREE.Vector3(R() - .5, R() - .5, R() - .5).normalize(), ph: R(), stop: .55 + R() * .45 }); }
}
const ATOM_DOMAIN = { show: [24.4, 99], dive: [39.2, 44.3] };
function atomFrame(t) {
  const cam = track([[24.4, [20, 18, 11.5]], [25.0, [36, 16, 9.6]], [27.4, [52, 14, 8.2]], [33.0, [72, 18, 8.4]], [37.4, [92, 16, 8.8]],
    [39.2, [92, 16, 8.8]], [44.3, [150, 8, .95]], [45.4, [160, 8, .95]], [48.6, [188, 14, 6.6]], [49.7, [196, 12, 4.4]], [52.5, [212, 8, 4.0]]], t);
  const az = cam[0] * Math.PI / 180, el = cam[1] * Math.PI / 180, d = cam[2];
  CAM.fov = 35; CAM.clearViewOffset(); CAM.setViewOffset(W, H, 0, -190, W, H); CAM.up.set(0, 1, 0); CAM.position.set(d * Math.cos(el) * Math.sin(az), d * Math.sin(el), d * Math.cos(el) * Math.cos(az)); CAM.lookAt(0, 0, 0); CAM.updateProjectionMatrix();
  const appear = eo(prog(t, 24.9, 26.1)), ticks = prog(t, 25.34, 99), tickP = ((t - 25.34) / .9) % 1, flash = ticks > 0 ? Math.exp(-7 * tickP) : 0;
  const dist = (t < 38 ? eio(prog(t, 33.63, 34.9)) * (1 - eio(prog(t, 36.2, 36.9))) : 0), hl = win(t, tw("electrons"), te("outside") + .1, .3, .5);
  A3.root.scale.setScalar(Math.max(.001, appear));
  // shaking is the whole atom; the magnet tilts the orbits
  const shk = dist * (t > tw("shaking") ? 1 : .3);
  A3.root.position.set(Math.sin(t * 19) * .035 * shk, Math.sin(t * 23 + 1) * .03 * shk, 0);
  A3.root.rotation.z = Math.sin(t * 1.1) * .04 + (t > tw("magnet") && t < 36.9 ? Math.sin((t - tw("magnet")) * 5) * .12 * dist : 0);
  A3.el.forEach(e => { const th = e.ph + e.w * t * (1 + .5 * dist * Math.sin(t * 7 + e.j)); const jit = 1 + dist * .07 * Math.sin(t * 17 + e.j * 3 + e.s);
    e.m.position.set(Math.cos(th) * e.r * jit, Math.sin(t * 11 + e.j) * .03 * dist, Math.sin(th) * e.r * jit);
    const outer = e.s === 2, f = outer ? (flash * .9 + hl * .9) : 0, hot = outer ? dist : 0;
    e.m.material.emissive.setRGB(lerp(.23, 1, Math.max(f, hot)), lerp(.72, .55 - .3 * hot, Math.max(f, hot)), lerp(1, .15, Math.max(f, hot))); e.m.material.emissiveIntensity = 1.3 + 1.6 * f;
    e.gl.material.map = (f > .25 || hot > .3) ? GOLD : CYAN; e.gl.scale.setScalar(.13 + .16 * f); e.m.scale.setScalar(1 + .6 * hl * (outer ? 1 : 0)); });
  A3.ring[2].material.opacity = .5 + .4 * hl + .3 * flash; A3.ring[2].material.color.setHex(dist > .3 ? 0xff8a5c : 0xffc35c);
  A3.nuc.rotation.y = t * .5; A3.nucGlow.scale.setScalar(.32 + .04 * Math.sin(t * 4));
  // heat / shaking / magnet particles streaming at the outside (round 1: they hit the electrons) - and, later, fizzling out before the nucleus
  const inP1 = dist, inP2 = win(t, 45.5, 49.6, .5, .5);
  A3.parts.forEach((p, i) => { const u = ((t * .35 + p.ph) % 1), pos = p.dir.clone().multiplyScalar(lerp(3.2, p.stop, u)); p.s.position.copy(pos);
    const a1 = i < 36 ? inP1 * (u < .95 ? 1 : 0) : 0, a2 = i >= 24 ? inP2 * (u < .96 ? Math.min(1, (1 - u) * 3) : 0) : 0, op = Math.max(a1 * (u > .55 ? 1 : .5) * (i < 36 ? 1 : 0), a2); p.s.material.opacity = op * .95; p.s.scale.setScalar(.1 + .05 * Math.sin(t * 9 + i)); });
  // the vault closes around the nucleus: "like a clock locked in a vault"
  const vk = eio(prog(t, tw("locked") - .6, tw("vault") + .1)); A3.vault.visible = vk > .001; A3.vRing.scale.setScalar(lerp(2.4, 1, vk)); A3.vRing.material.opacity = 1;
  A3.vBolts.forEach(b => { const a = b.userData.a, rr = lerp(.95, .43, vk); b.position.set(Math.cos(a) * rr, Math.sin(a) * rr, 0); b.rotation.z = a + Math.PI / 2; b.scale.setScalar(Math.max(.01, vk)); });
  A3.vDisc.material.opacity = .22 * vk; A3.vault.rotation.y = .4 * (1 - vk); A3.vault.lookAt(CAM.position);
  // shells fade a little as the camera dives through them
  A3.ring.forEach((r, i) => { if (i < 2) r.material.opacity = .28 * (1 - .6 * prog(t, 42.5, 44)); });
  draw3D(ATOM, 0x04050c, t < 44 ? () => labBg(IM.jila, .62, .5, 1.0, 1.18, 24.4, 44, t, .42, 5) : () => labBg(IM.nistion, .5, .5, 1.0, 1.15, 44, 53, t, .5, 6)); shade(.7, 760, .45);
  return { dist, hl };
}
// pinned labels and HUD for the atom
function atomOverlay(t) {
  const wp = (e) => e.m.getWorldPosition(new THREE.Vector3());
  const outer = A3.el.filter(e => e.s === 2); const e0 = outer[0];
  lab3("ELECTRONS", wp(e0), -70, -110, win(t, tw("electrons") - .05, tw("outside", 0) - .05, .3, .4), "electrons", "#9FE8FF");
  lab3("OUTSIDE", wp(outer[3]), 70, 120, win(t, tw("outside", 0), tw("outside", 1) - .05, .3, .45), "outside", "#F7D58A");
  // the tick wave: a clean ticking wave that turns ragged when the outside is disturbed
  const wa = win(t, 25.34, 37.1, .6, .5); if (wa > 0) { const dist = (t < 38 ? eio(prog(t, 33.63, 34.9)) * (1 - eio(prog(t, 36.2, 36.9))) : 0);
    g.save(); g.globalAlpha = wa; const y0 = 1450, x0 = 130, x1 = 920; g.fillStyle = "rgba(10,12,22,.62)"; rrect(x0 - 20, y0 - 56, x1 - x0 + 40, 130, 18); g.fill();
    g.strokeStyle = dist > .25 ? "#FF8A6A" : "#FFC55C"; g.lineWidth = 5; g.lineJoin = "round"; g.beginPath();
    for (let x = x0; x <= x1; x += 4) { const u = (x - x0) / (x1 - x0), ph = (u * 7 - (t - 25.34) * 1.1) * Math.PI * 2, amp = 40 * (1 + dist * (Math.sin(ph * 2.7 + t * 9) * .6)), yy = y0 - Math.sin(ph + dist * Math.sin(t * 13 + u * 40) * 1.4) * amp + dist * (Math.sin(t * 31 + u * 90) * 12); x === x0 ? g.moveTo(x, yy) : g.lineTo(x, yy); } g.stroke();
    g.font = "700 36px Inter"; g.letterSpacing = "4px"; g.textAlign = "left"; g.fillStyle = dist > .25 ? "#FF8A6A" : "#F5EFE3";  g.restore(); regEl("wave", x0 - 20, y0 - 56, x1 - x0 + 40, 130, wa); 0; }
  // chips: heat / shaking / magnet land on their words
  const chip = (txt2, x, y, col, tt, draw, id) => { const a = win(t, tt - .05, 36.6, .3, .45) * eo(prog(t, tt - .05, tt + .35)); if (a <= 0) return; g.save(); g.globalAlpha = a; g.font = "700 38px Inter"; g.letterSpacing = "4px"; const tw2 = g.measureText(txt2).width + 4, bw = tw2 + 110;
    g.fillStyle = "rgba(12,10,16,.9)"; rrect(x, y, bw, 78, 39); g.fill(); g.strokeStyle = col; g.lineWidth = 3; g.stroke(); draw(x + 46, y + 39, col); g.fillStyle = col; g.textAlign = "left"; g.fillText(txt2, x + 84, y + 52); g.restore(); reg("chip:" + id, x, y, bw, 78, a, 38, 10); return bw; };
  const iconHeat = (x, y, c) => { g.strokeStyle = c; g.lineWidth = 4; g.lineCap = "round"; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(x + i * 11, y + 16); g.bezierCurveTo(x + i * 11 - 8, y + 6, x + i * 11 + 8, y - 6, x + i * 11, y - 16); g.stroke(); } };
  const iconShake = (x, y, c) => { g.strokeStyle = c; g.lineWidth = 4; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); g.moveTo(x - 20, y); for (let i = 0; i < 5; i++) g.lineTo(x - 20 + (i + 1) * 8, y + (i % 2 ? 12 : -12)); g.stroke(); };
  const iconMag = (x, y, c) => { g.strokeStyle = c; g.lineWidth = 8; g.lineCap = "butt"; g.beginPath(); g.arc(x, y - 2, 15, Math.PI, 0, false); g.lineTo(x + 15, y + 15); g.moveTo(x - 15, y - 2); g.lineTo(x - 15, y + 15); g.stroke(); g.strokeStyle = "#F5EFE3"; g.lineWidth = 8; g.beginPath(); g.moveTo(x - 15, y + 9); g.lineTo(x - 15, y + 17); g.moveTo(x + 15, y + 9); g.lineTo(x + 15, y + 17); g.stroke(); };
  chip("HEAT", 110, 520, "#FF9A5C", tw("heat"), iconHeat, "heat"); chip("SHAKING", 380, 520, "#9FC4FF", tw("shaking"), iconShake, "shake"); chip("MAGNET", 100, 620, "#FF6B6B", tw("magnet") - .1, iconMag, "mag");
  // scale: the nucleus is tens of thousands of times smaller
  const sa = win(t, tw("tens") - .1, tw("it", 2) + .1, .5, .6); if (sa > 0) { g.save(); g.globalAlpha = sa; const y0 = 1430; g.fillStyle = "rgba(10,12,22,.78)"; rrect(100, y0 - 110, 850, 190, 18); g.fill();
    g.fillStyle = "rgba(127,168,255,.9)"; rrect(140, y0 - 62, 780, 16, 8); g.fill(); g.fillStyle = "#F5EFE3"; g.font = "700 36px Inter"; g.letterSpacing = "4px"; g.textAlign = "left"; g.fillText("ATOM", 140, y0 - 76);
    g.fillStyle = "#FFC55C"; g.fillRect(140, y0 - 6, 3, 28); g.fillText("NUCLEUS", 160, y0 + 16); g.textAlign = "right"; g.fillStyle = "#9FE8FF"; g.fillText("NOT TO SCALE", 920, y0 + 56); g.restore(); regEl("scale", 100, y0 - 110, 850, 190, sa); }
}
