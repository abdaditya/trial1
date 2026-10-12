// ======================================================================
// 3D crystal + laser: thorium sits in a crystal, a violet laser shines through, a sensor watches how much light gets absorbed
// ======================================================================
const CRY = new THREE.Scene(); const C3 = { dots: [], fronts: [] };
const YL = 1.55, YC = .4, YD = -1.55;   // laser / crystal half-height / sensor, along the vertical beam
function hsl(h, s = 1, l = .62) { return new THREE.Color().setHSL(h, s, l); }
function buildCrystal() {
  // reflections for the glass
  const envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), new THREE.MeshBasicMaterial({ color: 0x0a0c16, side: THREE.BackSide })));
  for (const [x, y, z, c, s] of [[-12, 14, 8, 0xffe2c0, 10], [14, 6, -10, 0x7f9fff, 8], [0, 18, -12, 0xffffff, 6]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); p.position.set(x, y, z); p.lookAt(0, 0, 0); envScene.add(p); }
  CRY.environment = PMREM.fromScene(envScene, .04).texture;
  CRY.add(new THREE.HemisphereLight(0x6f86c8, 0x0a0a10, .55)); const key = new THREE.DirectionalLight(0xfff0d8, 2.0); key.position.set(-4, 6, 6); CRY.add(key);
  const sg = new THREE.BufferGeometry(), sp = []; for (let i = 0; i < 1500; i++) { const v = new THREE.Vector3(R() - .5, R() - .5, R() - .5).normalize().multiplyScalar(26 + R() * 30); sp.push(v.x, v.y, v.z); }
  sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); CRY.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xcfd6ff, size: .12, transparent: true, opacity: .5 })));
  // the crystal: calcium fluoride, with thorium nuclei scattered inside
  C3.crystal = new THREE.Mesh(new THREE.BoxGeometry(1.05, YC * 2, 1.05), new THREE.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: .2, roughness: .04, metalness: 0, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.8, side: THREE.DoubleSide, depthWrite: false })); CRY.add(C3.crystal);
  C3.edges = new THREE.LineSegments(new THREE.EdgesGeometry(C3.crystal.geometry), new THREE.LineBasicMaterial({ color: 0xaad4ff, transparent: true, opacity: .9 })); CRY.add(C3.edges);
  for (let i = 0; i < 34; i++) { const s = new THREE.Sprite(spriteMat(GOLD, .9)); s.position.set((R() - .5) * .9, (R() - .5) * YC * 1.7, (R() - .5) * .9); s.scale.setScalar(.075); CRY.add(s); C3.dots.push({ s, ph: R() * 6.28, base: s.position.clone() }); }
  // the laser, the beam (three pieces) and the sensor
  const metal = new THREE.MeshStandardMaterial({ color: 0x2a2f3a, metalness: .85, roughness: .35 });
  C3.laser = new THREE.Mesh(new THREE.BoxGeometry(.55, .38, .55), metal); C3.laser.position.y = YL + .19; CRY.add(C3.laser);
  C3.lens = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .04, 24), new THREE.MeshBasicMaterial({ color: 0xb48cff })); C3.lens.position.y = YL - .02; CRY.add(C3.lens);
  C3.sensor = new THREE.Mesh(new THREE.BoxGeometry(.8, .12, .8), new THREE.MeshStandardMaterial({ color: 0x20242e, metalness: .7, roughness: .4 })); C3.sensor.position.y = YD - .06; CRY.add(C3.sensor);
  C3.sPlate = new THREE.Mesh(new THREE.CircleGeometry(.28, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: .1 })); C3.sPlate.position.y = YD + .002; CRY.add(C3.sPlate);
  const bm = (r) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 14), new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending })); CRY.add(m); return m; };
  C3.b1 = bm(.026); C3.b2 = bm(.026); C3.b3 = bm(.026); C3.halo = [bm(.07), bm(.07), bm(.07)]; C3.halo.forEach(h => h.material.opacity = .22);
  C3.hit = new THREE.Sprite(spriteMat(VIO, 0)); C3.hit.scale.setScalar(.9); CRY.add(C3.hit);
  // wave fronts that march down the beam when we "count the waves"
  for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(.07, .006, 8, 40), new THREE.MeshBasicMaterial({ color: 0xd9c4ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); m.rotation.x = Math.PI / 2; CRY.add(m); C3.fronts.push(m); }
}
const laserHue = t => .76 - .15 * eio(prog(t, 75.0, 76.1)) + .15 * eio(prog(t, 78.55, 79.85));
const absorbAt = t => Math.exp(-(((laserHue(t) - .76) / .05) ** 2));
function crystalFrame(t) {
  const cam = track([[69.9, [-34, 18, 4.9, 0]], [71.9, [-20, 14, 4.2, 0]], [72.4, [-14, 11, 4.8, .2]], [74.4, [-8, 9, 13.5, -.1]], [76.6, [-10, 10, 10.8, -.45]], [78.4, [-12, 10, 10.4, -.35]],
    [80.3, [-26, 8, 3.9, .75]], [83.2, [-30, 8, 3.7, .6]]], t);
  const az = cam[0] * Math.PI / 180, el = cam[1] * Math.PI / 180, d = cam[2], ty = cam[3];
  CAM.fov = 35; CAM.clearViewOffset(); CAM.setViewOffset(W, H, 0, -170, W, H); CAM.up.set(0, 1, 0); CAM.position.set(d * Math.cos(el) * Math.sin(az), ty + d * Math.sin(el), d * Math.cos(el) * Math.cos(az)); CAM.lookAt(0, ty, 0); CAM.updateProjectionMatrix();
  const hue = laserHue(t), col = hsl(hue), ab = absorbAt(t), on = eo(prog(t, tw("laser", 1) - .1, tw("laser", 1) + .5));   // the laser switches on at "A laser shines through"
  const pass = on * (1 - .88 * ab);   // light that makes it through
  [C3.b1, C3.b2, C3.b3, ...C3.halo].forEach(m => m.material.color.copy(col)); C3.lens.material.color.copy(col); C3.sPlate.material.color.copy(col);
  const seg = (m, y0, y1, a) => { m.position.y = (y0 + y1) / 2; m.scale.set(1, Math.abs(y1 - y0), 1); m.material.opacity = a; };
  seg(C3.b1, YL, YC, on * .95); seg(C3.halo[0], YL, YC, on * .2);
  seg(C3.b2, YC, -YC, on * (.95 - .5 * ab)); seg(C3.halo[1], YC, -YC, on * .12);
  seg(C3.b3, -YC, YD, pass * .95); seg(C3.halo[2], -YC, YD, pass * .22);
  C3.sPlate.material.opacity = .08 + .7 * pass; C3.hit.position.set(0, YD + .03, 0); C3.hit.material.opacity = .9 * pass; C3.hit.material.color.copy(col);
  // thorium nuclei light up when they soak the light
  C3.dots.forEach(p => { const lit = on * ab; p.s.material.map = lit > .35 ? VIO : GOLD; p.s.material.opacity = .45 + .5 * lit; p.s.scale.setScalar(.06 + .06 * lit * (.7 + .3 * Math.sin(t * 9 + p.ph)));
    p.s.position.set(p.base.x + Math.sin(t * .7 + p.ph) * .012, p.base.y + Math.cos(t * .9 + p.ph) * .01, p.base.z); });
  C3.crystal.rotation.y = 0; C3.edges.rotation.y = 0;
  // wave fronts
  const wk = win(t, tw("count", 1) - .1, 83.3, .35, .5);
  C3.fronts.forEach((m, i) => { const u = (((t - 80.4) * .85 + i * .0538) % 1 + 1) % 1, y = lerp(YL - .05, YC + .02, u); m.position.y = y; m.material.opacity = wk * on * .85 * Math.sin(Math.PI * u) ** .6; m.material.color.copy(col).offsetHSL(0, 0, .15); m.scale.setScalar(1 + .6 * Math.sin(Math.PI * u)); });
  draw3D(CRY, 0x04050b, () => labBg(IM.jila, .25, .5, 1.05, 1.0, 69.9, 83.6, t, .45, 5)); shade(.7, 760, .45);
  return { ab, pass, hue, on };
}
function crystalOverlay(t) {
  const ab = absorbAt(t), on = eo(prog(t, tw("laser", 1) - .1, tw("laser", 1) + .5)), pass = on * (1 - .88 * ab);
  // pinned labels
  lab3("THORIUM", C3.dots[3].s.position.clone(), -80, -60, win(t, tw("thorium", 1) - .05, tw("crystal") + .35, .3, .45), "th", "#F7D58A");
  lab3("CRYSTAL", new THREE.Vector3(.52, -.2, .52), 70, 90, win(t, tw("crystal") - .1, 72.35, .3, .35), "cry", "#9FD0FF");
  lab3("LASER", new THREE.Vector3(.3, YL + .1, 0), 110, 10, win(t, tw("laser", 1) - .05, 74.1, .3, .4), "las", "#C9A9FF");
  // labels that land on their words
  const bl = (txt2, t0, t1, y, col, id) => { const a = win(t, t0, t1, .3, .4); if (a <= 0) return; g.save(); g.globalAlpha = a; g.font = "700 40px Inter"; g.letterSpacing = "4px"; const w2 = g.measureText(txt2).width + 4; g.fillStyle = "rgba(12,10,16,.9)"; rrect(CX - w2 / 2 - 28, y - 46, w2 + 56, 78, 39); g.fill(); g.strokeStyle = col; g.lineWidth = 3; g.stroke(); g.fillStyle = col; g.textAlign = "center"; g.fillText(txt2, CX + 2, y + 8); g.restore(); reg("bl:" + id, CX - w2 / 2 - 28, y - 46, w2 + 56, 78, a, 40, 10); };
  bl("THE COLOUR DRIFTS", tw("drifts") - .1, tw("thorium", 2) - .05, 540, "#9FC4FF", "drift");
  bl("LESS LIGHT SOAKED UP", tw("soaking") - .1, te("light", 2) + .4, 540, "#FFC55C", "soak");
  bl("THE CLOCK FIXES THE LASER", tw("fix") - .25, te("laser", 2) + .35, 540, "#7AE0A0", "fix");
  // HUD: the laser's colour dial, the sensor bar, and the feedback arrow
  const hud = win(t, tw("a laser") + .4, 80.4, .5, .6); if (hud > 0) { g.save(); g.globalAlpha = hud;
    g.fillStyle = "rgba(10,12,22,.78)"; rrect(90, 1300, 870, 230, 22); g.fill();
    const dcx = 230, dcy = 1425, dr = 78; g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 16; g.beginPath(); g.arc(dcx, dcy, dr, Math.PI * .8, Math.PI * 2.2); g.stroke();
    const grd = g.createLinearGradient(dcx - dr, 0, dcx + dr, 0); grd.addColorStop(0, "hsl(215,100%,62%)"); grd.addColorStop(1, "hsl(272,100%,66%)"); g.strokeStyle = grd; g.lineWidth = 16; g.beginPath(); g.arc(dcx, dcy, dr, Math.PI * .8, Math.PI * 2.2); g.stroke();
    const na = lerp(Math.PI * .8, Math.PI * 2.2, clamp((laserHue(t) - .59) / (.76 - .59))); g.strokeStyle = "#F5EFE3"; g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.moveTo(dcx, dcy); g.lineTo(dcx + Math.cos(na) * (dr - 8), dcy + Math.sin(na) * (dr - 8)); g.stroke(); g.fillStyle = "#F5EFE3"; g.beginPath(); g.arc(dcx, dcy, 9, 0, 7); g.fill();
    g.font = "700 36px Inter"; g.letterSpacing = "3px"; g.textAlign = "center"; g.fillStyle = "#F5EFE3"; g.fillText("LASER COLOUR", dcx, 1340);
    const bx = 420, bw = 500; g.textAlign = "left"; g.fillText("LIGHT AT THE SENSOR", bx, 1384); g.fillStyle = "rgba(255,255,255,.14)"; rrect(bx, 1410, bw, 34, 17); g.fill(); g.fillStyle = pass > .6 ? "#FFC55C" : "#8F7BE0"; rrect(bx, 1410, Math.max(34, bw * pass), 34, 17); g.fill();
    g.fillStyle = pass > .6 ? "#FFC55C" : "#C9A9FF"; g.fillText(pass > .6 ? "MORE LIGHT GETS THROUGH" : "THORIUM SOAKS IT UP", bx, 1488);
    const fb = prog(t, tw("fix") - .2, tw("laser", 2) + .1); if (fb > 0 && fb < 1.2) { g.strokeStyle = "#7AE0A0"; g.lineWidth = 5; g.setLineDash([14, 10]); g.lineDashOffset = -t * 40; g.beginPath(); g.moveTo(bx - 10, 1427); g.lineTo(dcx + dr + 24, 1427); g.stroke(); g.setLineDash([]); g.fillStyle = "#7AE0A0"; g.beginPath(); g.moveTo(dcx + dr + 30, 1427); g.lineTo(dcx + dr + 52, 1415); g.lineTo(dcx + dr + 52, 1439); g.closePath(); g.fill(); }
    g.restore(); regEl("hud", 90, 1362, 860, 168, hud); reg("hudl1", 130, 1298, 220, 44, hud, 36, 9); }
  // counting the waves: waves -> ticks -> time
  const ca = win(t, tw("count", 1) - .05, 83.2, .4, .5); if (ca > 0) { g.save(); g.globalAlpha = ca; g.fillStyle = "rgba(10,12,22,.82)"; rrect(90, 1290, 870, 240, 22); g.fill();
    const wv = BigInt(Math.floor(Math.max(0, t - 80.4) * 2.0204e15)), s2 = wv.toString().padStart(16, "0").replace(/(\d)(?=(\d{3})+$)/g, "$1 ");
    g.font = "700 36px Inter"; g.letterSpacing = "4px"; g.fillStyle = "#C9A9FF"; g.textAlign = "left"; g.fillText("WAVES COUNTED", 130, 1348); g.font = "800 66px Oswald"; g.fillStyle = "#F5EFE3"; g.letterSpacing = "6px"; g.fillText(s2, 130, 1430);
    const sec = Math.floor(Math.max(0, t - 80.4)); g.font = "700 36px Inter"; g.letterSpacing = "4px"; g.fillStyle = "#FFC55C"; g.fillText("= TIME", 130, 1490); g.font = "800 40px Oswald"; g.fillText("00:00:" + String(sec).padStart(2, "0"), 330, 1492);
    g.restore(); regEl("count", 90, 1362, 860, 168, ca); reg("cnt", 130, 1298, 400, 44, ca, 36, 9); }
}
