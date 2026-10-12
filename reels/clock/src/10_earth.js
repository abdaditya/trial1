// ======================================================================
// 3D Earth (NASA Blue Marble imagery, no borders): GPS beat, the Vienna/Beijing race, the finale
// ======================================================================
const EARTH = new THREE.Scene(); let EARTH_MAT; const E = {};
const ll2v = (lat, lon, r = 1) => { const ph = (lon + 180) * Math.PI / 180, th = (90 - lat) * Math.PI / 180; return new THREE.Vector3(-Math.cos(ph) * Math.sin(th) * r, Math.cos(th) * r, Math.sin(ph) * Math.sin(th) * r); };
const MUMBAI = [41.88, -87.63], VIENNA = [48.21, 16.37], BEIJING = [39.9, 116.4];
const spriteMat = (map, o = 1, blend = true) => new THREE.SpriteMaterial({ map, transparent: true, opacity: o, depthWrite: false, depthTest: false, blending: blend ? THREE.AdditiveBlending : THREE.NormalBlending });
function pinTexture(col = "#FFC55C") { const c = document.createElement("canvas"); c.width = 128; c.height = 160; const x = c.getContext("2d");
  x.shadowColor = "rgba(0,0,0,.6)"; x.shadowBlur = 10; x.fillStyle = col; x.beginPath(); x.arc(64, 58, 44, Math.PI * .85, Math.PI * .15, false); x.lineTo(64, 148); x.closePath(); x.fill(); x.shadowColor = "transparent";
  x.fillStyle = "#1a1228"; x.beginPath(); x.arc(64, 58, 17, 0, 7); x.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function ringTexture() { const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d"), gr = x.createRadialGradient(128, 128, 90, 128, 128, 126);
  gr.addColorStop(0, "rgba(255,200,110,0)"); gr.addColorStop(.55, "rgba(255,214,140,.95)"); gr.addColorStop(1, "rgba(255,200,110,0)"); x.fillStyle = gr; x.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function makeSat() {
  const g3 = new THREE.Group(), gold = new THREE.MeshStandardMaterial({ color: 0xdcae4a, metalness: .85, roughness: .32 }), panel = new THREE.MeshStandardMaterial({ color: 0x1f3f86, metalness: .5, roughness: .3, emissive: 0x0b1c46 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(.07, .07, .1), gold); g3.add(body);
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(.2, .004, .085), panel); p.position.x = sx * .15; g3.add(p); const arm = new THREE.Mesh(new THREE.BoxGeometry(.08, .006, .006), new THREE.MeshStandardMaterial({ color: 0xbfc6cf })); arm.position.x = sx * .06; g3.add(arm); }
  const dish = new THREE.Mesh(new THREE.ConeGeometry(.03, .025, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xe6e9ee, metalness: .6, roughness: .3, side: THREE.DoubleSide })); dish.rotation.x = Math.PI; dish.position.set(0, -.05, 0); g3.add(dish);
  const glow = new THREE.Sprite(spriteMat(GOLD, .0)); glow.scale.setScalar(.2); glow.position.set(0, 0, .06); g3.add(glow); g3.userData.glow = glow;
  g3.scale.setScalar(1.7); return g3;
}
function cyl(scene, col, r = .0035) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 8), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(m); return m; }
function setCyl(m, a, b) { const d = new THREE.Vector3().subVectors(b, a), len = d.length(); m.position.copy(a).addScaledVector(d, .5); m.scale.set(1, Math.max(len, 1e-4), 1); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); }
async function buildEarth() {
  const [day, night, hi] = await Promise.all([tex("img/earth_bm.jpg"), tex("img/earth_night.jpg"), tex("img/india_bm.jpg")]);
  EARTH_MAT = new THREE.ShaderMaterial({ uniforms: { day: { value: day }, night: { value: night }, hi: { value: hi }, sun: { value: new THREE.Vector3(.4, .5, 1).normalize() }, nightAmt: { value: .5 }, dayAmt: { value: .9 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform sampler2D day,night,hi; uniform vec3 sun; uniform float nightAmt,dayAmt; varying vec2 vUv; varying vec3 vN;
      void main(){ vec3 d=texture2D(day,vUv).rgb;
        vec2 h=vec2((vUv.x*360.0-180.0-58.0)/42.0,(vUv.y*180.0-90.0-2.0)/38.0);   // NASA imagery only, 120 px/degree over India
        float e=smoothstep(0.0,.04,h.x)*smoothstep(0.0,.04,1.0-h.x)*smoothstep(0.0,.04,h.y)*smoothstep(0.0,.04,1.0-h.y);
        if(e>0.0) d=mix(d,texture2D(hi,clamp(h,0.0,1.0)).rgb,e);
        vec3 n=texture2D(night,vUv).rgb; float l=dot(normalize(vN),normalize(sun)); float dl=smoothstep(-.2,.45,l);
        vec3 col=d*(.18+1.05*dl)*dayAmt + n*vec3(1.0,.78,.5)*nightAmt*2.2*(1.15-.55*dl); gl_FragColor=vec4(col,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  EARTH.add(new THREE.Mesh(new THREE.SphereGeometry(1, 160, 120), EARTH_MAT));
  EARTH.add(new THREE.Mesh(new THREE.SphereGeometry(1.07, 96, 72), new THREE.ShaderMaterial({ side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: `varying vec3 vN; void main(){ vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `varying vec3 vN; void main(){ float i=pow(.72-dot(vN,vec3(0,0,1.0)),3.0); gl_FragColor=vec4(.42,.66,1.0,1.0)*i*1.4; }` })));
  const sg = new THREE.BufferGeometry(), sp = []; for (let i = 0; i < 2600; i++) { const v = new THREE.Vector3(R() - .5, R() - .5, R() - .5).normalize().multiplyScalar(60 + R() * 40); sp.push(v.x, v.y, v.z); }
  sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); EARTH.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xcfd6ff, size: .16, transparent: true, opacity: .75 })));
  EARTH.add(new THREE.AmbientLight(0xb8c4ff, .7)); const sun = new THREE.DirectionalLight(0xfff0d8, 2.4); sun.position.set(6, 4, 8); EARTH.add(sun);
  // satellites: A is near the phone, B is far; both orbit slowly
  E.A = makeSat(); E.B = makeSat(); EARTH.add(E.A, E.B);
  const pt = pinTexture(), rt = ringTexture();
  E.pin = new THREE.Sprite(spriteMat(pt, 1, false)); E.pin.center.set(.5, .05); E.pin.scale.set(.11, .14, 1); E.pin.position.copy(ll2v(...MUMBAI, 1.006)); EARTH.add(E.pin);
  E.pinRing = [0, 1].map(() => { const s = new THREE.Sprite(spriteMat(rt, 0)); s.position.copy(ll2v(...MUMBAI, 1.004)); EARTH.add(s); return s; });
  E.ripple = [0, 1].map(() => { const s = new THREE.Sprite(spriteMat(rt, 0)); EARTH.add(s); return s; });
  E.beamA = cyl(EARTH, 0xffc35c); E.beamB = cyl(EARTH, 0xffc35c);
  E.pkA = new THREE.Sprite(spriteMat(GOLD, 0)); E.pkB = new THREE.Sprite(spriteMat(GOLD, 0)); E.pkA.scale.setScalar(.2); E.pkB.scale.setScalar(.2); EARTH.add(E.pkA, E.pkB);
  // the two labs
  E.vie = new THREE.Sprite(spriteMat(pinTexture("#B7A3F6"), 0, false)); E.bei = new THREE.Sprite(spriteMat(pinTexture("#FFC55C"), 0, false));
  for (const [s, ll] of [[E.vie, VIENNA], [E.bei, BEIJING]]) { s.center.set(.5, .05); s.scale.set(.11, .14, 1); s.position.copy(ll2v(...ll, 1.006)); EARTH.add(s); }
  E.vieRing = new THREE.Sprite(spriteMat(rt, 0)); E.beiRing = new THREE.Sprite(spriteMat(rt, 0)); E.vieRing.position.copy(ll2v(...VIENNA, 1.004)); E.beiRing.position.copy(ll2v(...BEIJING, 1.004)); EARTH.add(E.vieRing, E.beiRing);
}
function earthCam(lat, lon, d, offY = -160, fov = 35) { CAM.fov = fov; CAM.position.copy(ll2v(lat, lon, d)); CAM.up.set(0, 1, 0); CAM.lookAt(0, 0, 0); CAM.clearViewOffset(); CAM.setViewOffset(W, H, 0, offY, W, H); CAM.updateProjectionMatrix(); }
function lab3(text, v, dx, dy, a, id, col = "#F7D58A", fs = 36) {   // pill label pinned to a 3D point, kept inside the safe zone
  if (a <= 0) return; const [x, y] = screenOf(v); g.save(); g.globalAlpha = a; g.font = `700 ${fs}px Inter`; g.letterSpacing = "3px"; const tw = g.measureText(text).width + 3;
  const bx = clamp(dx < 0 ? x + dx - tw - 28 : x + dx, SAFE.x0 + 4, SAFE.x1 - tw - 32), by = clamp(y + dy - 30, 640, SAFE.y1 - 62), cx = bx + (dx < 0 ? tw + 28 : 0), cy = by + 30;
  g.strokeStyle = "rgba(247,213,138,.85)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(clamp(cx, SAFE.x0 + 4, SAFE.x1 - 4), cy); g.stroke();
  g.fillStyle = "rgba(12,10,16,.86)"; rrect(bx, by, tw + 28, 60, 12); g.fill(); g.fillStyle = col; g.fillText(text, bx + 14, by + 42); g.restore(); reg(id, bx, by, tw + 28, 60, a, fs, 10); }
// ---- the GPS beat: how late the signal arrives tells you how far away the satellite is ----
const GPS = { sA: () => ll2v(47, -88, 1.45), sB: () => ll2v(8, -22, 2.05) };
function gpsFrame(t) {
  const cam = track([[3.7, [30, -72, 4.8, -300]], [6.0, [30, -74, 5.0, -320]], [8.8, [28, -68, 5.4, -330]], [10.0, [24, -60, 5.9, -340]], [12.9, [22, -54, 6.2, -340]]], t);
  earthCam(cam[0], cam[1], cam[2], cam[3]); EARTH_MAT.uniforms.nightAmt.value = .55; EARTH_MAT.uniforms.dayAmt.value = .85; EARTH_MAT.uniforms.sun.value.copy(ll2v(15, -85)).normalize();
  const pinP = E.pin.position, orb = Math.sin(t * .35) * .02;
  const pA = GPS.sA().add(new THREE.Vector3(0, orb, 0)), pB = GPS.sB().add(new THREE.Vector3(0, -orb, 0));
  E.A.position.copy(pA); E.B.position.copy(pB); E.A.lookAt(0, 0, 0); E.B.lookAt(0, 0, 0);
  const appearA = eo(prog(t, 3.9, 5.0)), appearB = eo(prog(t, 9.7, 10.7));
  E.A.scale.setScalar(1.9 * appearA + .001); E.B.scale.setScalar(1.9 * appearB + .001);
  const dA = pA.distanceTo(pinP), dB = pB.distanceTo(pinP);
  // round 1: slow motion, one packet from A.  round 2: both packets at the same speed, launched together
  const t1a = tw("sending out"), tArr1 = te("arrives") - .05, v1 = dA / (tArr1 - (t1a + .35));
  const t2 = tw("later") + .35, vs = dB / 2.05;   // far packet takes ~2 s, near one takes dA/vs
  const u1 = prog(t, t1a + .35, tArr1), uA2 = clamp((t - t2) * vs / dA), uB2 = clamp((t - t2) * vs / dB);
  const round2 = t > t2 - .2;
  const tickGlow = (s, on) => { s.userData.glow.material.opacity = on * (.55 + .45 * Math.sin(t * 12)); };
  tickGlow(E.A, appearA * (t > tw("atomic clock") - .2 ? 1 : 0)); tickGlow(E.B, appearB * (round2 ? 1 : 0));
  // ripple when "sending out the time"
  E.ripple.forEach((r, i) => { const k = prog(t, t1a + i * .35, t1a + i * .35 + 1.0); r.position.copy(pA); r.scale.setScalar(.1 + .55 * eo(k)); r.material.opacity = (k > 0 && k < 1) ? .8 * (1 - k) : 0; });
  // beams + packets
  const showA = round2 ? 1 : u1 > 0 ? 1 : 0, uA = round2 ? uA2 : u1;
  setCyl(E.beamA, pA, pinP); E.beamA.material.opacity = .22 * (u1 > 0 ? 1 : 0) * (1 - prog(t, tArr1 + .6, tArr1 + 1.0) * (round2 ? 0 : 1)) * (round2 ? 1 : 1);
  E.pkA.position.lerpVectors(pA, pinP, clamp(uA)); E.pkA.material.opacity = (uA > 0 && uA < 1) ? 1 : 0;
  setCyl(E.beamB, pB, pinP); E.beamB.material.opacity = .22 * appearB * (round2 ? 1 : 0);
  E.pkB.position.lerpVectors(pB, pinP, clamp(uB2)); E.pkB.material.opacity = (uB2 > 0 && uB2 < 1) ? 1 : 0;
  // the phone pin reacts on arrival
  const arrA = round2 ? t2 + dA / vs : tArr1, arrB = t2 + dB / vs;
  E.pinRing.forEach((r, i) => { const ta = i === 0 ? arrA : arrB, k = prog(t, ta, ta + .9); r.scale.setScalar(.06 + .32 * eo(k)); r.material.opacity = k > 0 && k < 1 ? .85 * (1 - k) : 0; });
  E.pin.scale.set(.11 * (1 + .12 * Math.sin(Math.PI * prog(t, arrA, arrA + .4))), .14 * (1 + .12 * Math.sin(Math.PI * prog(t, arrA, arrA + .4))), 1);
  E.vie.material.opacity = 0; E.bei.material.opacity = 0; E.vieRing.material.opacity = 0; E.beiRing.material.opacity = 0;
  E.pin.material.opacity = eo(prog(t, 3.9, 4.7));
  draw3D(EARTH, 0x05060b); shade(.7, 760, .45);
  // pinned labels + the delay HUD
  lab3("ATOMIC CLOCK", pA.clone().add(new THREE.Vector3(.02, .06, 0)), 70, -90, win(t, tw("atomic clock") - .05, tw("sending out") - .1, .3, .4), "atomic");
  lab3("YOUR PHONE", pinP, -60, -170, win(t, tw("your phone", 1) - .1, 11.6, .35, .5), "phone", "#F5EFE3");
  const hudA = win(t, t1a + .2, 12.1, .5, .5); if (hudA > 0) {
    const row = (y, label, u, col, done, id) => { g.save(); g.globalAlpha = hudA; g.font = "700 36px Inter"; g.letterSpacing = "4px"; g.fillStyle = "#F5EFE3"; g.fillText(label, 120, y + 36);
      g.fillStyle = "rgba(255,255,255,.14)"; rrect(120, y + 56, 810, 26, 13); g.fill(); g.fillStyle = col; rrect(120, y + 56, Math.max(26, 810 * u), 26, 13); g.fill();
      if (done) { g.textAlign = "right"; g.fillStyle = col; g.fillText(done, 930, y + 36); } g.restore(); reg("hud:" + id, 120, y, 810, 90, hudA, 36, 9); };
    if (!round2) row(1370, "SIGNAL DELAY · SLOW MOTION", u1, "#FFC55C", u1 >= 1 ? "ARRIVED" : "", "d1");
    else { const uN = clamp((t - t2) * vs / dA), uF = clamp((t - t2) * vs / dB);
      row(1330, "NEAR SATELLITE", uN, "#7AE0A0", uN >= 1 ? "EARLY" : "", "near"); row(1440, "FAR SATELLITE", uF, "#FF8A6A", uF >= 1 ? "LATE" : "", "far"); }
  }
}
