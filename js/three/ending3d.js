// ============================================================
//  엔딩 무대 — 첨탑을 정복한 캐릭터 하나가 빛기둥 아래 천천히 돈다.
//  타이틀 무대(title3d)와 달리 인물 하나만 크게 세우는 자리라 따로 둔다.
// ============================================================
import * as THREE from 'three';
import { buildPlayer } from './scene3d.js';

let renderer = null, scene = null, camera = null, clock = null;
let rafId = null, ready = false, canvasEl = null;
let hero = null, motes = null, beam = null;

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({
  color: new THREE.Color(c), flatShading: o.flat !== false,
  roughness: o.rough ?? 0.7, metalness: o.metal ?? 0.1,
  emissive: new THREE.Color(o.emissive || 0x000000), emissiveIntensity: o.ei ?? 1,
  transparent: !!o.opacity, opacity: o.opacity ?? 1,
});

/** 인물이 올라설 낮은 단 */
function buildPlinth() {
  const g = new THREE.Group();
  // 단은 인물 발치에만 두른다. 크게 잡으면 금색 테가 화면을 가로질러
  // 제목 글씨를 통과해 버린다.
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.34, 0.3, 9), mat('#2a2138', { rough: 0.85 }));
  top.position.y = -0.15;
  g.add(top);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.038, 6, 28), mat('#e8c34a', { emissive: '#e8c34a', ei: 0.8, metal: 0.6 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.01;
  g.add(ring);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.24, 9), mat('#211a2e', { rough: 0.9 }));
  base.position.y = -0.42;
  g.add(base);
  return g;
}

/** 위에서 내려오는 빛기둥 */
function buildBeam() {
  // 위쪽은 화면 밖으로 넉넉히 빼야 원뿔의 테두리가 사다리꼴로 비쳐 보이지 않는다
  const geo = new THREE.CylinderGeometry(2.4, 3.2, 16, 18, 1, true);
  const m = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#ffe0a0'), transparent: true, opacity: 0.05,
    side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const c = new THREE.Mesh(geo, m);
  c.position.y = 7.4;
  return c;
}

/** 천천히 떠오르는 먼지 */
function buildMotes() {
  const n = 90;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  const spd = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 7;
    pos[i * 3 + 1] = Math.random() * 8 - 0.5;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
    spd[i] = 0.16 + Math.random() * 0.34;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({
    color: new THREE.Color('#ffd9a0'), size: 0.07, transparent: true,
    opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  p.userData.spd = spd;
  return p;
}

export function initEnding(canvas, model) {
  dispose();
  canvasEl = canvas;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
  clock = new THREE.Clock();

  scene.add(new THREE.HemisphereLight(0xb8c0f0, 0x3a3048, 1.0));
  const key = new THREE.DirectionalLight(0xfff0d0, 2.1);
  key.position.set(2.5, 8, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9a7aff, 1.15);
  rim.position.set(-5, 3, -4);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0xd6cdf2, 0.5));
  const glow = new THREE.PointLight(0xffc87a, 2.2, 14, 2);
  glow.position.set(0, 3.6, 1.4);
  scene.add(glow);
  scene.userData.glow = glow;

  const built = buildPlayer(model);
  hero = { group: built.group, parts: built.parts };
  hero.group.position.y = 0;
  scene.add(hero.group);
  scene.add(buildPlinth());
  beam = buildBeam();
  scene.add(beam);
  motes = buildMotes();
  scene.add(motes);

  ready = true;
  resizeEnding();
  loop();
}

export function resizeEnding() {
  if (!ready || !canvasEl) return;
  const w = canvasEl.clientWidth || 1, h = canvasEl.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  // 인물은 화면 위쪽 절반에 두고 아래는 글 자리로 비워 둔다.
  // 그래서 담을 높이를 인물 키(약 3.4)보다 넉넉히 잡고, 보는 점을 인물 가운데보다
  // 아래에 두어(lookAt < 인물 중심) 인물이 프레임 위로 올라가게 한다.
  const half = Math.tan((camera.fov * Math.PI / 180) / 2);
  const d = Math.max(5.4, Math.min(5.2 / half, 11));
  camera.position.set(0, 2.5, d);
  camera.lookAt(0, 1.1, 0);
}

function loop() {
  rafId = requestAnimationFrame(loop);
  if (!ready) return;
  const scr = document.getElementById('scr-ending');
  if (!scr || scr.hidden) { clock.getDelta(); return; }
  const t = clock.elapsedTime;
  clock.getDelta();

  if (hero) {
    hero.group.rotation.y = 0.5 + Math.sin(t * 0.22) * 0.55;       // 천천히 좌우로 돈다
    hero.group.position.y = Math.abs(Math.sin(t * 1.25)) * 0.05;
    const b = hero.parts && hero.parts.body;
    if (b) {
      if (b.userData.sy === undefined) { b.userData.sy = b.scale.y; b.userData.sx = b.scale.x; b.userData.sz = b.scale.z; }
      const br = Math.sin(t * 2.1);
      b.scale.y = b.userData.sy * (1 + br * 0.065);
      b.scale.x = b.userData.sx * (1 - br * 0.026);
      b.scale.z = b.userData.sz * (1 - br * 0.026);
    }
    const w = hero.parts && hero.parts.weapon;
    if (w) {
      if (w.userData.rz === undefined) w.userData.rz = w.rotation.z;
      w.rotation.z = w.userData.rz + Math.sin(t * 0.85) * 0.07;
    }
  }
  if (motes) {
    const p = motes.geometry.attributes.position;
    const spd = motes.userData.spd;
    for (let i = 0; i < spd.length; i++) {
      let y = p.array[i * 3 + 1] + spd[i] * 0.016;
      if (y > 8) y = -0.6;
      p.array[i * 3 + 1] = y;
    }
    p.needsUpdate = true;
  }
  if (beam) beam.material.opacity = 0.045 + Math.sin(t * 1.4) * 0.014;
  const glow = scene.userData.glow;
  if (glow) glow.intensity = 2.0 + Math.sin(t * 2.3) * 0.3;

  renderer.render(scene, camera);
}

function dispose() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null; ready = false;
  if (renderer) { try { renderer.dispose(); } catch (e) { /* noop */ } }
  renderer = null; scene = null; hero = null; motes = null; beam = null;
}
export const disposeEnding = dispose;
