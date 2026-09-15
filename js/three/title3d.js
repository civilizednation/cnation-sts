// ============================================================
//  타이틀 화면 3D : 캐릭터 4종이 첨탑 앞에 모여 서 있는 장면
//  전투 씬의 절차적 모델을 그대로 재사용한다 (외부 에셋 0개)
// ============================================================
import * as THREE from 'three';
import { buildPlayer, buildEnemy } from './scene3d.js';
import { CHARACTERS, CHAR_LIST } from '../data/characters.js';

let renderer, scene, camera, clock, rafId = null;
let canvasEl = null, ready = false;
const actors = [];      // { group, parts, phase, baseY }
let layoutName = 'arc';

/* 배치안
 *  line   : 일직선 4명
 *  arc    : 카메라를 향해 벌어진 반원 (안쪽 2명이 앞)
 *  siege  : 가운데 보스를 4명이 에워싸는 포위 구도
 *  wedge  : 앞 1 · 중 2 · 뒤 1 의 쐐기형
 */
const LAYOUTS = {
  line: {
    slots: [
      { x: -2.55, z: 0, ry: 0.05 }, { x: -0.85, z: 0, ry: 0.02 },
      { x: 0.85, z: 0, ry: -0.02 }, { x: 2.55, z: 0, ry: -0.05 },
    ],
    cam: { y: 2.2, look: 1.35, w: 7.8 },
  },
  arc: {
    slots: [
      { x: -2.30, z: -1.55, ry: 0.44 }, { x: -0.85, z: 0.55, ry: 0.15 },
      { x: 0.85, z: 0.55, ry: -0.15 }, { x: 2.30, z: -1.55, ry: -0.44 },
    ],
    cam: { y: 2.05, look: 1.45, w: 6.1 },
  },
  siege: {
    monster: { body: 'blob', color: '#3a1030', color2: '#c02040', size: 1.9, eyes: 2, horns: true, teeth: true },
    slots: [
      { x: -2.95, z: 0.5, ry: 0.5 }, { x: -1.55, z: -1.85, ry: 0.85 },
      { x: 1.55, z: -1.85, ry: -0.85 }, { x: 2.95, z: 0.5, ry: -0.5 },
    ],
    cam: { y: 3.0, look: 1.6, w: 8.6 },
  },
  wedge: {
    slots: [
      { x: 0, z: 1.5, ry: 0 }, { x: -2.0, z: -0.2, ry: 0.3 },
      { x: 2.0, z: -0.2, ry: -0.3 }, { x: 0, z: -2.0, ry: 0 },
    ],
    cam: { y: 2.7, look: 1.5, w: 7.6 },
  },
  // 네 명이 반원으로 서고, 뒤쪽 아치 너머에 보스의 거대한 그림자가 내려다본다
  throne: {
    looming: { body: 'blob', color: '#1c0a18', color2: '#40102a', size: 3.4, eyes: 2, horns: true, teeth: true },
    slots: [
      { x: -2.25, z: -1.45, ry: 0.44 }, { x: -0.82, z: 0.60, ry: 0.15 },
      { x: 0.82, z: 0.60, ry: -0.15 }, { x: 2.25, z: -1.45, ry: -0.44 },
    ],
    cam: { y: 1.95, look: 1.50, w: 6.9 },
  },
};

// ---------------- 바닥 그림자 ----------------
let blobTex = null;
function makeBlob() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0,0,0,0.7)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.3)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  blobTex = new THREE.CanvasTexture(c);
}
function addBlob(group, r = 1) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 3, r * 3),
    new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: 0.8 }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  m.renderOrder = -1;
  group.add(m);
}

// ---------------- 무대 ----------------
function buildStage() {
  const g = new THREE.Group();
  // 바닥
  const ground = new THREE.Mesh(new THREE.CircleGeometry(11, 40),
    new THREE.MeshStandardMaterial({ color: 0x3a3350, roughness: 0.94, flatShading: true }));
  ground.rotation.x = -Math.PI / 2;
  g.add(ground);
  [3.6, 5.4].forEach((r, i) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.11, 40),
      new THREE.MeshBasicMaterial({ color: 0x9a86d8, transparent: true, opacity: 0.14 - i * 0.05 }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.015;
    g.add(ring);
  });
  // 뒤쪽 기둥 + 아치 (첨탑 입구 느낌)
  const pillarM = new THREE.MeshStandardMaterial({ color: 0x2f2942, roughness: 1, flatShading: true });
  for (let i = 0; i < 7; i++) {
    const h = 6 + (i % 3) * 2.4;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.58, h, 6), pillarM);
    p.position.set(-9 + i * 3, h / 2 - 0.4, -7.5 - (i % 2) * 2.4);
    g.add(p);
  }
  const archM = new THREE.MeshStandardMaterial({ color: 0x281f3c, roughness: 1, flatShading: true });
  for (let i = -1; i <= 1; i++) {
    const a = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.3, 5, 14, Math.PI), archM);
    a.position.set(i * 6.4, 2.1, -10.5);
    g.add(a);
  }
  return g;
}

// ---------------- 초기화 ----------------
export function initTitle(canvas, layout = 'throne') {
  if (ready && canvasEl === canvas) { setLayout(layout); return; }
  canvasEl = canvas;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x191128, 13, 30);
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  clock = new THREE.Clock();

  scene.add(new THREE.HemisphereLight(0xa8b4e8, 0x40304a, 1.25));
  const key = new THREE.DirectionalLight(0xffe4c0, 1.9);
  key.position.set(4, 9, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9a7aff, 1.05);
  rim.position.set(-6, 4.5, -5);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0xcfc6f0, 0.6));
  const fire = new THREE.PointLight(0xff9a5a, 1.6, 22, 2);
  fire.position.set(0, 2.4, 4.5);
  scene.add(fire);
  scene.userData.fire = fire;

  makeBlob();
  scene.add(buildStage());
  setLayout(layout);
  ready = true;
  resizeTitle();
  loop();
}

export function setLayout(name) {
  layoutName = LAYOUTS[name] ? name : 'arc';
  const L = LAYOUTS[layoutName];
  actors.forEach((a) => scene.remove(a.group));
  actors.length = 0;
  [...scene.children].forEach((o) => { if (o.userData.isActor) scene.remove(o); });

  // 가운데 몬스터 (있는 배치안만)
  if (L.monster) {
    const m = buildEnemy(L.monster);
    m.group.position.set(0, 0, -0.4);
    m.group.userData.isActor = true;
    addBlob(m.group, (L.monster.size || 1) * 1.15);
    scene.add(m.group);
    actors.push({ group: m.group, parts: m.parts, phase: 0.8, baseY: 0, boss: true });
  }
  // 뒤쪽에서 내려다보는 거대한 그림자 (아무도 가리지 않는다)
  if (L.looming) {
    const m = buildEnemy(L.looming);
    m.group.position.set(0, 1.1, -9.2);
    m.group.userData.isActor = true;
    m.group.traverse((o) => {
      if (!o.isMesh) return;
      o.material = o.material.clone();
      if (o.material.color) o.material.color.multiplyScalar(0.34);
      if (o.material.emissive) o.material.emissive.multiplyScalar(0.5);
    });
    scene.add(m.group);
    actors.push({ group: m.group, parts: m.parts, phase: 1.7, baseY: 1.1, boss: true });
    const glow = new THREE.PointLight(0xff2a50, 2.4, 16, 2);
    glow.position.set(0, 3.2, -11.5);
    glow.userData.isActor = true;
    scene.add(glow);
  }

  // 캐릭터 4종
  CHAR_LIST.forEach((id, i) => {
    const ch = CHARACTERS[id];
    const slot = L.slots[i];
    const p = buildPlayer(ch.model);
    p.group.position.set(slot.x, 0, slot.z);
    p.group.rotation.y = slot.ry;
    p.group.userData.isActor = true;
    addBlob(p.group, 1);
    scene.add(p.group);
    actors.push({ group: p.group, parts: p.parts, phase: i * 0.9, baseY: 0 });
  });
}

export function resizeTitle() {
  if (!ready || !canvasEl) return;
  const w = canvasEl.clientWidth || 1, h = canvasEl.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  frame();
}

function frame() {
  const L = LAYOUTS[layoutName];
  // 가로 폭 기준으로 거리를 잡되, 화면이 세로로 길면 너무 멀어지지 않게 상한을 둔다
  const aspect = camera.aspect || 0.9;
  const half = Math.tan((camera.fov * Math.PI / 180) / 2);
  const dW = (L.cam.w / 2) / (half * aspect);   // 가로가 담기는 거리
  const dH = 3.6 / half;                        // 인물 높이가 담기는 거리
  const d = Math.max(dH, Math.min(dW, 13));
  camera.position.set(0, L.cam.y, d);
  camera.lookAt(0, L.cam.look, 0);
}

function loop() {
  rafId = requestAnimationFrame(loop);
  if (!ready) return;
  // 타이틀이 보이지 않을 때는 그리지 않는다 (전투 중 배터리 낭비 방지)
  const scr = document.getElementById('scr-title');
  if (!scr || scr.hidden) { clock.getDelta(); return; }
  const t = clock.elapsedTime;
  const dt = Math.min(clock.getDelta(), 0.05);
  frame();

  // 전투 화면과 같은 아이들 모션 (호흡 · 상하 흔들림 · 고개)
  actors.forEach((a) => {
    const off = a.phase;
    a.group.position.y = a.baseY + Math.abs(Math.sin(t * 1.3 + off)) * 0.055;
    const b = a.parts && a.parts.body;
    if (b) {
      if (b.userData.sy === undefined) { b.userData.sy = b.scale.y; b.userData.sx = b.scale.x; b.userData.sz = b.scale.z; }
      const br = Math.sin(t * 2.2 + off);
      b.scale.y = b.userData.sy * (1 + br * 0.07);
      b.scale.x = b.userData.sx * (1 - br * 0.028);
      b.scale.z = b.userData.sz * (1 - br * 0.028);
    }
    const breath = Math.sin(t * 1.55 + off * 0.6);
    const k = a.boss ? 0.018 : 0.026;
    a.group.scale.set(1 + breath * k * 0.45, 1 + breath * k, 1 + breath * k * 0.45);
    const hd = a.parts && a.parts.head;
    if (hd) {
      if (hd.userData.py === undefined) hd.userData.py = hd.position.y;
      hd.position.y = hd.userData.py + Math.sin(t * 2.2 + off) * 0.035;
    }
    // 무기를 아주 천천히 흔든다
    const w = a.parts && a.parts.weapon;
    if (w) {
      if (w.userData.rz === undefined) w.userData.rz = w.rotation.z;
      w.rotation.z = w.userData.rz + Math.sin(t * 0.9 + off) * 0.06;
    }
  });

  const fire = scene.userData.fire;
  if (fire) fire.intensity = 1.2 + Math.sin(t * 6.1) * 0.22 + Math.sin(t * 11.3) * 0.1;
  renderer.render(scene, camera);
}

export function disposeTitle() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  ready = false;
}
export function titleLayouts() { return Object.keys(LAYOUTS); }
