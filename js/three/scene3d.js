// ============================================================
//  three.js 전투 씬 : 절차적 저폴리 캐릭터 (외부 모델/이미지 없음)
// ============================================================
import * as THREE from 'three';

let renderer, scene, camera, clock;
let root, groundMesh;
const models = new Map();   // actor.uid -> { group, parts, base, shape }
const tweens = [];
let canvasEl = null;
let ready = false;
let frameCount = 0;
let lastError = null;

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------- 블롭 그림자 ----------------
let blobTex = null;
function makeBlobTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0,0,0,0.75)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.35)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  blobTex = new THREE.CanvasTexture(c);
}
function addBlobShadow(group, radius = 1) {
  if (!blobTex) return null;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 3.1, radius * 3.1),
    new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: 0.85 }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  m.renderOrder = -1;
  group.add(m);
  return m;
}

// ============================================================
//  배경(막별 색조 + 층별 변주)
// ============================================================
const lights = {};
let envObjs = [];
let envKey = '';

/** 막마다 다른 색 계통. 1막=어두운 회색 석조, 2막=어두운 갈색, 3막=어두운 보라. */
const ACT_THEME = [
  { // 1막 — 첨탑 하부 감옥 : 어두운 회색 석조
    name: '석조',
    fog: 0x1b1b22, ground: 0x4c4c56, pillar: 0x3a3a46, arch: 0x30303c,
    accent: 0xffb070, accent2: 0x9fb4d8,
    sky: 0xa8b4cc, gnd: 0x3a3a46, key: 0xffe8d4, rim: 0x7a88ac, amb: 0xc4c8d8,
    fireCol: 0xff9a5a, fogNear: 17, fogFar: 40,
  },
  { // 2막 — 도시 : 어두운 갈색 목조/벽돌
    name: '목조',
    fog: 0x241a12, ground: 0x5c4834, pillar: 0x4a3626, arch: 0x3e2d1f,
    accent: 0xffb45a, accent2: 0x8fc07a,
    sky: 0xd8b890, gnd: 0x402c1c, key: 0xffd8a0, rim: 0xa87a4a, amb: 0xd8c0a0,
    fireCol: 0xffa050, fogNear: 16, fogFar: 38,
  },
  { // 3막 — 첨탑 상부 : 어두운 보라
    name: '심층',
    fog: 0x180f2c, ground: 0x4a3a6e, pillar: 0x3a2c5a, arch: 0x32254c,
    accent: 0xc070ff, accent2: 0x70e0ff,
    sky: 0xb0a0f0, gnd: 0x3a2850, key: 0xe8d4ff, rim: 0x9a6aff, amb: 0xc8b8f0,
    fireCol: 0xc060ff, fogNear: 16, fogFar: 39,
  },
];

/** 층 번호로 고정되는 난수 (같은 층은 늘 같은 배경) */
function seeded(n) {
  let a = (n * 1831565813 + 0x6d2b79f5) >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 기본 색에 층마다 살짝 다른 색조를 얹는다 */
function jitter(hex, rng, dh = 0.03, ds = 0.08, dl = 0.05) {
  const c = new THREE.Color(hex);
  const o = { h: 0, s: 0, l: 0 };
  c.getHSL(o);
  c.setHSL(
    (o.h + (rng() - 0.5) * dh + 1) % 1,
    Math.max(0, Math.min(1, o.s + (rng() - 0.5) * ds)),
    Math.max(0.02, Math.min(0.95, o.l + (rng() - 0.5) * dl)));
  return c;
}

function addEnv(obj) { envObjs.push(obj); scene.add(obj); return obj; }

function clearEnv() {
  envObjs.forEach((o) => {
    scene.remove(o);
    o.traverse((m) => {
      if (!m.isMesh) return;
      m.geometry.dispose();
      (Array.isArray(m.material) ? m.material : [m.material]).forEach((mm) => mm && mm.dispose());
    });
  });
  envObjs = [];
}

/**
 * 전투 배경을 막(색 계통) + 층(형태 변주) 에 맞게 다시 만든다.
 * 같은 층은 언제 다시 들어와도 같은 모습이고, 층이 바뀌면 조금씩 달라진다.
 */
export function setEnvironment(act = 1, floor = 1) {
  if (!scene) return;
  const a = Math.max(1, Math.min(3, act | 0));
  const f = Math.max(1, floor | 0);
  const key = `${a}:${f}`;
  if (key === envKey) return;
  envKey = key;
  clearEnv();

  const th = ACT_THEME[a - 1];
  const rng = seeded(f * 7919 + a * 104729);

  // 안개 / 조명 색조
  const fogC = jitter(th.fog, rng, 0.02, 0.06, 0.03);
  scene.fog = new THREE.Fog(fogC.getHex(), th.fogNear + rng() * 3 - 1.5, th.fogFar + rng() * 6 - 3);
  if (lights.hemi) { lights.hemi.color.set(th.sky); lights.hemi.groundColor.set(th.gnd); }
  if (lights.key) lights.key.color.set(th.key);
  if (lights.rim) lights.rim.color.set(th.rim);
  if (lights.amb) lights.amb.color.set(th.amb);
  if (lights.fire) lights.fire.color.set(th.fireCol);

  // 바닥
  const gMat = new THREE.MeshStandardMaterial({
    color: jitter(th.ground, rng, 0.02, 0.07, 0.05), roughness: 0.92, metalness: 0.05, flatShading: true });
  groundMesh = new THREE.Mesh(new THREE.CircleGeometry(16, 40 + Math.floor(rng() * 5) * 4), gMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.rotation.z = rng() * Math.PI;
  groundMesh.receiveShadow = true;
  addEnv(groundMesh);

  // 바닥 무늬 링 (층마다 크기/개수가 다름)
  const ringN = 1 + Math.floor(rng() * 3);
  for (let i = 0; i < ringN; i++) {
    const r = 3.2 + i * (1.6 + rng() * 1.4);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r, r + 0.10 + rng() * 0.16, 36),
      new THREE.MeshBasicMaterial({ color: jitter(th.accent2, rng, 0.04, 0.1, 0.06), transparent: true, opacity: 0.10 + rng() * 0.08 }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.015;
    addEnv(ring);
  }

  // 배경 기둥 (무대 뒤쪽에만 — 카메라 앞을 가리지 않는다)
  const pMat = new THREE.MeshStandardMaterial({ color: jitter(th.pillar, rng, 0.02, 0.06, 0.05), roughness: 1, flatShading: true });
  const pN = 7 + Math.floor(rng() * 5);
  const sides = 5 + Math.floor(rng() * 3);
  for (let i = 0; i < pN; i++) {
    const h = 6 + rng() * 7;
    const x = -13.5 + (i + rng() * 0.8) * (27 / pN);
    const z = -7.5 - rng() * 9;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.42 + rng() * 0.3, 0.62 + rng() * 0.4, h, sides), pMat);
    p.position.set(x, h / 2 - 0.5, z);
    p.rotation.y = rng() * Math.PI;
    p.receiveShadow = true;
    addEnv(p);
  }

  // 뒤쪽 아치 (개수·높이·간격이 층마다 다름)
  const aMat = new THREE.MeshStandardMaterial({ color: jitter(th.arch, rng, 0.02, 0.06, 0.05), roughness: 1, flatShading: true });
  const aN = 2 + Math.floor(rng() * 3);
  const aGap = 5.5 + rng() * 2.6;
  for (let i = 0; i < aN; i++) {
    const rr = 2.6 + rng() * 1.2;
    const arch = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.28 + rng() * 0.16, 5, 14, Math.PI), aMat);
    arch.position.set((i - (aN - 1) / 2) * aGap, 1.9 + rng() * 1.2, -11 - rng() * 2.5);
    addEnv(arch);
  }

  buildProps(th, rng);
}

/** 층마다 다른 소품 2종을 골라 배치한다 */
function buildProps(th, rng) {
  const kinds = ['rubble', 'chain', 'torch', 'crystal', 'step'];
  const pick = [];
  while (pick.length < 2) {
    const k = kinds[Math.floor(rng() * kinds.length)];
    if (!pick.includes(k)) pick.push(k);
  }
  const em = (col, i = 1.4) => new THREE.MeshStandardMaterial({
    color: col, emissive: new THREE.Color(col), emissiveIntensity: i, roughness: 0.4, flatShading: true });
  const side = () => (rng() < 0.5 ? -1 : 1) * (5.5 + rng() * 6);

  pick.forEach((k) => {
    if (k === 'rubble') {                    // 흩어진 돌무더기
      const m = new THREE.MeshStandardMaterial({ color: jitter(th.pillar, rng, 0.02, 0.08, 0.08), roughness: 1, flatShading: true });
      const n = 4 + Math.floor(rng() * 5);
      for (let i = 0; i < n; i++) {
        const sz = 0.3 + rng() * 0.6;
        const r = new THREE.Mesh(new THREE.IcosahedronGeometry(sz, 0), m);
        r.position.set(side(), sz * 0.45, -2 - rng() * 7);
        r.rotation.set(rng() * 3, rng() * 3, rng() * 3);
        addEnv(r);
      }
    } else if (k === 'chain') {              // 위에서 늘어진 사슬
      const m = new THREE.MeshStandardMaterial({ color: jitter(th.arch, rng, 0.02, 0.08, 0.12), roughness: 0.7, metalness: 0.6 });
      const n = 3 + Math.floor(rng() * 4);
      for (let i = 0; i < n; i++) {
        const h = 3 + rng() * 5;
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, h, 4), m);
        c.position.set(side(), 10 - h / 2, -6 - rng() * 5);
        addEnv(c);
      }
    } else if (k === 'torch') {              // 벽 횃불 (조명 대신 발광 메시)
      const poleM = new THREE.MeshStandardMaterial({ color: 0x2e2620, roughness: 1 });
      const flameM = em(th.accent, 2.2);
      const n = 2 + Math.floor(rng() * 3);
      for (let i = 0; i < n; i++) {
        const g = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.6, 5), poleM);
        pole.position.y = 1.3;
        g.add(pole);
        const fl = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.62, 6), flameM);
        fl.position.y = 2.75;
        g.add(fl);
        g.position.set(side(), 0, -5 - rng() * 6);
        g.userData.flicker = fl;
        addEnv(g);
      }
    } else if (k === 'crystal') {            // 떠 있는 수정
      const m = em(th.accent2, 1.1);
      const n = 3 + Math.floor(rng() * 4);
      for (let i = 0; i < n; i++) {
        const sz = 0.22 + rng() * 0.4;
        const c = new THREE.Mesh(new THREE.OctahedronGeometry(sz, 0), m);
        c.position.set(side(), 1.6 + rng() * 4, -4 - rng() * 7);
        c.userData.float = { y: c.position.y, sp: 0.5 + rng(), ph: rng() * 6 };
        addEnv(c);
      }
    } else if (k === 'step') {               // 뒤쪽 계단/단
      const m = new THREE.MeshStandardMaterial({ color: jitter(th.ground, rng, 0.02, 0.06, 0.08), roughness: 1, flatShading: true });
      const n = 2 + Math.floor(rng() * 3);
      const w = 7 + rng() * 5;
      for (let i = 0; i < n; i++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(w - i * 1.2, 0.5, 1.6), m);
        b.position.set((rng() - 0.5) * 3, 0.25 + i * 0.5, -8.5 - i * 1.5);
        addEnv(b);
      }
    }
  });
}

// ---------------- 초기화 ----------------
export function initScene(canvas) {
  canvasEl = canvas;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = false;   // 블롭 그림자 사용

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x1a1626, 17, 40);

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 120);
  camera.position.set(0, 3.4, 11);
  camera.lookAt(0, 1.7, 0);

  lights.hemi = new THREE.HemisphereLight(0xa8b8e8, 0x4a3040, 1.35);
  scene.add(lights.hemi);
  lights.key = new THREE.DirectionalLight(0xffe6c0, 1.9);
  lights.key.position.set(4, 9, 7);
  scene.add(lights.key);
  lights.rim = new THREE.DirectionalLight(0x8a7aff, 1.0);
  lights.rim.position.set(-6, 5, -6);
  scene.add(lights.rim);
  lights.amb = new THREE.AmbientLight(0xc8c0e8, 0.62);
  scene.add(lights.amb);
  const fire = new THREE.PointLight(0xff9a5a, 1.5, 26, 2);
  fire.position.set(0, 2.5, 5);
  scene.add(fire);
  scene.userData.fire = fire;
  lights.fire = fire;

  root = new THREE.Group();
  scene.add(root);

  setEnvironment(1, 1);   // 기본 배경 (전투 시작 시 층에 맞게 다시 만든다)

  makeBlobTexture();
  clock = new THREE.Clock();
  ready = true;
  resize();
  animate();
}

let frameWidth = 7.6;   // 화면에 담아야 할 가로 폭(월드 단위)
export function resize() {
  if (!ready || !canvasEl) return;
  const w = canvasEl.clientWidth || 1, h = canvasEl.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  frameCamera();
}

/** 세로 화면에서도 인물이 가운데 잘 보이도록 카메라 거리/화각 조정 */
function frameCamera() {
  if (!camera) return;
  const aspect = camera.aspect || 1;
  const dist = 11.5;
  // 가로 폭이 frameWidth 만큼 보이도록 수직 화각을 역산
  const halfH = (frameWidth / 2) / aspect;
  let fov = 2 * Math.atan(halfH / dist) * (180 / Math.PI);
  fov = Math.max(28, Math.min(72, fov));
  camera.fov = fov;
  camera.position.set(0, 3.3, dist);
  camera.lookAt(0, 0.95, 0);
  camera.updateProjectionMatrix();
}
export function setFrameWidth(w) { frameWidth = Math.max(6.4, w); frameCamera(); }

// ---------------- 재질 헬퍼 ----------------
/** 전체 톤을 밝게 : 명도 +0.16, 채도 +0.06 */
export function brighten(color, l = 0.16, sat = 0.06) {
  const c = new THREE.Color(color);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, Math.min(1, hsl.s + sat), Math.min(0.92, hsl.l + l));
  return c;
}

const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({
  color: opts.raw ? new THREE.Color(color) : brighten(color),
  flatShading: true, roughness: opts.rough ?? 0.62,
  metalness: opts.metal ?? 0.1, emissive: new THREE.Color(opts.emissive || 0x000000),
  emissiveIntensity: opts.ei ?? 1, transparent: !!opts.transparent, opacity: opts.opacity ?? 1,
});

function meshOf(geo, m, pos, group, castShadow = true) {
  const mesh = new THREE.Mesh(geo, m);
  if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addEyes(group, n, y, z, r = 0.1, color = 0xfff0a0, spread = 0.28) {
  const eyes = [];
  const m = mat(color, { emissive: color, ei: 2.2, rough: 0.3 });
  for (let i = 0; i < n; i++) {
    const off = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread * 2;
    const e = meshOf(new THREE.SphereGeometry(r, 8, 6), m, [off, y + (n > 2 ? Math.sin(i * 2) * 0.12 : 0), z], group, false);
    eyes.push(e);
  }
  return eyes;
}

// ---------------- 절차적 모델 생성 ----------------
function buildEnemy(shape) {
  const g = new THREE.Group();
  const parts = { eyes: [], body: null, limbs: [] };
  const c1 = shape.color || '#8b4a2b';
  const c2 = shape.color2 || '#c97b4a';
  const s = shape.size || 1;
  const body = shape.body || 'blob';

  const M1 = mat(c1, { rough: 0.75 });
  const M2 = mat(c2, { rough: 0.6 });

  switch (body) {
    case 'slime': {
      const b = meshOf(new THREE.SphereGeometry(0.95 * s, 10, 8), mat(c1, { rough: 0.35, transparent: true, opacity: 0.92 }), [0, 0.85 * s, 0], g);
      b.scale.set(1.12, 0.86, 1.05);
      parts.body = b;
      const core = meshOf(new THREE.IcosahedronGeometry(0.42 * s, 0), mat(c2, { emissive: c2, ei: 0.35 }), [0, 0.8 * s, 0], g, false);
      parts.core = core;
      if (shape.spikes) for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        meshOf(new THREE.ConeGeometry(0.13 * s, 0.5 * s, 4), M2,
          [Math.cos(a) * 0.8 * s, 0.95 * s, Math.sin(a) * 0.75 * s], g).rotation.set(Math.PI * 0.12, a, Math.cos(a) * 0.5);
      }
      if (shape.king) {
        const cr = meshOf(new THREE.ConeGeometry(0.5 * s, 0.55 * s, 5), mat('#e8c34a', { metal: 0.6, rough: 0.3 }), [0, 1.9 * s, 0], g);
        parts.crown = cr;
      }
      parts.eyes = addEyes(g, shape.eyes ?? 2, 1.0 * s, 0.82 * s, 0.11 * s);
      break;
    }
    case 'worm': {
      let prev = null;
      for (let i = 0; i < 5; i++) {
        const r = (0.55 - i * 0.07) * s;
        const seg = meshOf(new THREE.SphereGeometry(r, 8, 6), i % 2 ? M2 : M1, [0, 0.55 * s + i * 0.02, -i * 0.55 * s], g);
        parts.limbs.push(seg);
        prev = seg;
      }
      const head = meshOf(new THREE.SphereGeometry(0.62 * s, 8, 6), M1, [0, 0.72 * s, 0.5 * s], g);
      head.scale.set(1, 0.85, 1.25);
      parts.head = head;
      if (shape.teeth) for (let i = 0; i < 6; i++) {
        meshOf(new THREE.ConeGeometry(0.08 * s, 0.26 * s, 4), mat('#f0e8d0'),
          [(i / 5 - 0.5) * 0.7 * s, 0.5 * s, 1.02 * s], g).rotation.x = Math.PI;
      }
      parts.eyes = addEyes(g, 2, 0.95 * s, 0.95 * s, 0.1 * s, 0xff5050);
      break;
    }
    case 'louse': {
      const b = meshOf(new THREE.SphereGeometry(0.7 * s, 10, 8), M1, [0, 0.62 * s, 0], g);
      b.scale.set(1.2, 0.8, 1.4);
      parts.body = b;
      for (let i = 0; i < 6; i++) {
        const side = i % 2 ? 1 : -1;
        const leg = meshOf(new THREE.CylinderGeometry(0.05 * s, 0.03 * s, 0.6 * s, 4), M2,
          [side * 0.6 * s, 0.3 * s, (Math.floor(i / 2) - 1) * 0.4 * s], g);
        leg.rotation.z = side * 0.7;
        parts.limbs.push(leg);
      }
      parts.eyes = addEyes(g, 2, 0.8 * s, 0.85 * s, 0.09 * s, 0xffffff, 0.2);
      break;
    }
    case 'gremlin': case 'humanoid': case 'brute': {
      const scale = body === 'brute' ? 1.25 : 1;
      const torso = meshOf(new THREE.CapsuleGeometry(0.42 * s * scale, 0.6 * s * scale, 3, 8), M1, [0, 1.05 * s * scale, 0], g);
      parts.body = torso;
      if (shape.fat) torso.scale.set(1.5, 0.9, 1.4);
      const head = meshOf(new THREE.IcosahedronGeometry(0.36 * s * scale, 0), M2, [0, 1.8 * s * scale, 0.02], g);
      parts.head = head;
      for (const side of [-1, 1]) {
        const arm = meshOf(new THREE.CapsuleGeometry(0.13 * s, 0.55 * s, 3, 6), M2,
          [side * 0.58 * s * scale, 1.1 * s * scale, 0], g);
        arm.rotation.z = side * 0.35;
        parts.limbs.push(arm);
        const leg = meshOf(new THREE.CapsuleGeometry(0.15 * s, 0.5 * s, 3, 6), M1,
          [side * 0.24 * s * scale, 0.38 * s * scale, 0], g);
        parts.limbs.push(leg);
      }
      if (shape.horns) for (const side of [-1, 1]) {
        meshOf(new THREE.ConeGeometry(0.1 * s, 0.4 * s, 5), mat('#e8e0c0'),
          [side * 0.26 * s * scale, 2.1 * s * scale, 0], g).rotation.z = side * 0.5;
      }
      if (shape.hat) meshOf(new THREE.ConeGeometry(0.4 * s, 0.8 * s, 7), mat(c1, { rough: 0.9 }), [0, 2.25 * s, 0], g);
      if (shape.shield) {
        const sh = meshOf(new THREE.CylinderGeometry(0.42 * s, 0.42 * s, 0.1 * s, 6), mat('#9aa4b8', { metal: 0.7, rough: 0.35 }),
          [-0.8 * s, 1.1 * s, 0.25 * s], g);
        sh.rotation.set(Math.PI / 2, 0, 0);
        parts.shield = sh;
      }
      if (shape.weapon) {
        const wcol = shape.weapon === 'axe' ? '#c0c8d8' : '#d8dce8';
        const w = new THREE.Group();
        const handle = meshOf(new THREE.CylinderGeometry(0.06 * s, 0.06 * s, 1.3 * s, 5), mat('#5a3a22'), [0, 0, 0], w);
        if (shape.weapon === 'axe') {
          const blade = meshOf(new THREE.CylinderGeometry(0.42 * s, 0.42 * s, 0.08 * s, 3), mat(wcol, { metal: 0.8, rough: 0.25 }), [0.22 * s, 0.55 * s, 0], w);
          blade.rotation.set(Math.PI / 2, 0, 0);
        } else if (shape.weapon === 'whip') {
          for (let i = 0; i < 4; i++) meshOf(new THREE.SphereGeometry(0.07 * s, 6, 4), mat('#402a1a'), [0.1 * i * s, -0.7 * s - i * 0.18 * s, 0], w);
        } else {
          meshOf(new THREE.BoxGeometry(0.1 * s, 1.1 * s, 0.03 * s), mat(wcol, { metal: 0.8, rough: 0.25 }), [0, 0.9 * s, 0], w);
        }
        w.position.set(0.78 * s * scale, 1.25 * s * scale, 0.1);
        w.rotation.z = -0.4;
        g.add(w);
        parts.weapon = w;
      }
      parts.eyes = addEyes(g, shape.eyes ?? 2, 1.85 * s * scale, 0.34 * s * scale, 0.075 * s, 0xffe060, 0.16);
      break;
    }
    case 'robe': {
      const robe = meshOf(new THREE.ConeGeometry(0.78 * s, 2.0 * s, 8), M1, [0, 1.0 * s, 0], g);
      parts.body = robe;
      const hood = meshOf(new THREE.SphereGeometry(0.4 * s, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.65), M2, [0, 2.0 * s, 0], g);
      parts.head = hood;
      if (shape.horns) for (const side of [-1, 1])
        meshOf(new THREE.ConeGeometry(0.09 * s, 0.45 * s, 5), mat(c2), [side * 0.3 * s, 2.3 * s, 0], g).rotation.z = side * 0.6;
      if (shape.staff) {
        const st = meshOf(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 2.2 * s, 5), mat('#5a3a22'), [0.7 * s, 1.2 * s, 0.1], g);
        meshOf(new THREE.IcosahedronGeometry(0.18 * s, 0), mat(c2, { emissive: c2, ei: 1.6 }), [0.7 * s, 2.35 * s, 0.1], g, false);
        parts.weapon = st;
      }
      parts.eyes = addEyes(g, 2, 2.0 * s, 0.34 * s, 0.08 * s, 0xff3030, 0.16);
      break;
    }
    case 'construct': {
      const core = meshOf(new THREE.BoxGeometry(1.0 * s, 1.2 * s, 0.9 * s), mat(c1, { metal: 0.75, rough: 0.35 }), [0, 1.3 * s, 0], g);
      parts.body = core;
      meshOf(new THREE.BoxGeometry(1.3 * s, 0.25 * s, 1.1 * s), mat(c2, { metal: 0.8, rough: 0.3 }), [0, 2.0 * s, 0], g);
      for (const side of [-1, 1]) {
        const arm = meshOf(new THREE.BoxGeometry(0.25 * s, 0.9 * s, 0.25 * s), mat(c2, { metal: 0.7 }), [side * 0.78 * s, 1.3 * s, 0], g);
        parts.limbs.push(arm);
      }
      if (!shape.floating) for (const side of [-1, 1])
        meshOf(new THREE.BoxGeometry(0.3 * s, 0.7 * s, 0.3 * s), mat(c1, { metal: 0.7 }), [side * 0.3 * s, 0.35 * s, 0], g);
      parts.eyes = addEyes(g, shape.eyes ?? 1, 1.5 * s, 0.5 * s, 0.14 * s, 0x60e0ff, 0.3);
      break;
    }
    case 'orb': {
      const b = meshOf(new THREE.IcosahedronGeometry(0.8 * s, 1), mat(c1, { metal: 0.6, rough: 0.3 }), [0, 1.5 * s, 0], g);
      parts.body = b;
      const ringM = mat(c2, { metal: 0.8, rough: 0.2, emissive: c2, ei: 0.3 });
      const r1 = meshOf(new THREE.TorusGeometry(1.1 * s, 0.06 * s, 6, 24), ringM, [0, 1.5 * s, 0], g, false);
      r1.rotation.x = Math.PI / 2.4;
      parts.ring = r1;
      if (shape.ring) {
        const r2 = meshOf(new THREE.TorusGeometry(1.32 * s, 0.05 * s, 6, 24), ringM, [0, 1.5 * s, 0], g, false);
        r2.rotation.set(Math.PI / 2, 0.6, 0);
        parts.ring2 = r2;
      }
      parts.eyes = addEyes(g, 1, 1.5 * s, 0.85 * s, 0.16 * s, 0xfff0a0);
      break;
    }
    case 'ghost': {
      const b = meshOf(new THREE.ConeGeometry(0.78 * s, 1.9 * s, 8), mat(c1, { transparent: true, opacity: 0.82, emissive: c1, ei: 0.35 }), [0, 1.4 * s, 0], g);
      b.rotation.x = Math.PI;
      parts.body = b;
      const head = meshOf(new THREE.SphereGeometry(0.58 * s, 10, 8), mat(c2, { emissive: c2, ei: 0.6, transparent: true, opacity: 0.9 }), [0, 2.2 * s, 0], g, false);
      parts.head = head;
      if (shape.crown) meshOf(new THREE.ConeGeometry(0.42 * s, 0.5 * s, 5), mat('#e8c34a', { metal: 0.7 }), [0, 2.8 * s, 0], g, false);
      const n = shape.eyes ?? 2;
      parts.eyes = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        parts.eyes.push(meshOf(new THREE.SphereGeometry(0.12 * s, 8, 6), mat(0xfff0c0, { emissive: 0xffd070, ei: 2.4 }),
          [Math.cos(a) * 0.62 * s, 2.2 * s + Math.sin(a) * 0.5 * s, 0.42 * s], g, false));
      }
      break;
    }
    case 'bird': {
      const b = meshOf(new THREE.SphereGeometry(0.52 * s, 8, 6), M1, [0, 1.5 * s, 0], g);
      b.scale.set(1, 1.15, 1.3);
      parts.body = b;
      meshOf(new THREE.ConeGeometry(0.14 * s, 0.42 * s, 4), mat('#e0a030'), [0, 1.6 * s, 0.72 * s], g, false).rotation.x = Math.PI / 2;
      for (const side of [-1, 1]) {
        const w = meshOf(new THREE.BoxGeometry(0.9 * s, 0.06 * s, 0.5 * s), M2, [side * 0.72 * s, 1.55 * s, -0.1], g);
        w.rotation.z = side * 0.2;
        parts.limbs.push(w);
      }
      parts.wings = parts.limbs.slice();
      parts.eyes = addEyes(g, 2, 1.72 * s, 0.5 * s, 0.08 * s, 0xffffff, 0.22);
      break;
    }
    case 'shell': {
      const dome = meshOf(new THREE.SphereGeometry(1.0 * s, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(c1, { rough: 0.9 }), [0, 0.75 * s, 0], g);
      dome.scale.set(1.25, 1, 1.1);
      parts.body = dome;
      meshOf(new THREE.SphereGeometry(0.42 * s, 8, 6), M2, [0, 0.55 * s, 0.9 * s], g);
      parts.eyes = addEyes(g, shape.eyes ?? 2, 0.72 * s, 1.18 * s, 0.09 * s, 0xffd060, 0.22);
      break;
    }
    case 'guardian': {
      const b = meshOf(new THREE.BoxGeometry(1.7 * s, 1.7 * s, 1.3 * s), mat(c1, { metal: 0.7, rough: 0.4 }), [0, 1.5 * s, 0], g);
      parts.body = b;
      meshOf(new THREE.BoxGeometry(2.0 * s, 0.3 * s, 1.5 * s), mat(c2, { metal: 0.85, rough: 0.25 }), [0, 2.45 * s, 0], g);
      for (const side of [-1, 1]) {
        const arm = meshOf(new THREE.BoxGeometry(0.45 * s, 1.5 * s, 0.45 * s), mat(c2, { metal: 0.8 }), [side * 1.25 * s, 1.4 * s, 0], g);
        parts.limbs.push(arm);
      }
      for (const side of [-1, 1]) meshOf(new THREE.BoxGeometry(0.5 * s, 0.7 * s, 0.6 * s), mat(c1, { metal: 0.7 }), [side * 0.5 * s, 0.35 * s, 0], g);
      parts.eyes = addEyes(g, 1, 1.7 * s, 0.72 * s, 0.24 * s, 0xffcc40);
      break;
    }
    case 'snake': {
      for (let i = 0; i < 6; i++) {
        const r = (0.45 - i * 0.05) * s;
        const seg = meshOf(new THREE.SphereGeometry(r, 8, 6), i % 2 ? M2 : M1,
          [Math.sin(i * 0.9) * 0.3 * s, 0.5 * s + i * 0.32 * s, -Math.cos(i * 0.7) * 0.2 * s], g);
        parts.limbs.push(seg);
      }
      const head = meshOf(new THREE.ConeGeometry(0.45 * s, 0.9 * s, 6), M1, [Math.sin(5.4) * 0.3 * s, 2.4 * s, 0.2 * s], g);
      head.rotation.x = Math.PI / 2.2;
      parts.head = head;
      if (shape.crown) meshOf(new THREE.ConeGeometry(0.3 * s, 0.4 * s, 5), mat('#e8c34a', { metal: 0.7 }), [0, 2.9 * s, 0], g, false);
      parts.eyes = addEyes(g, 2, 2.5 * s, 0.5 * s, 0.09 * s, 0xffee40, 0.18);
      break;
    }
    case 'plant': {
      const stem = meshOf(new THREE.CylinderGeometry(0.18 * s, 0.3 * s, 1.6 * s, 6), mat(c1), [0, 0.8 * s, 0], g);
      parts.body = stem;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const pet = meshOf(new THREE.ConeGeometry(0.3 * s, 0.8 * s, 4), M2, [Math.cos(a) * 0.45 * s, 1.9 * s, Math.sin(a) * 0.45 * s], g);
        pet.rotation.set(Math.cos(a) * 0.7, 0, -Math.sin(a) * 0.7);
        parts.limbs.push(pet);
      }
      meshOf(new THREE.SphereGeometry(0.36 * s, 8, 6), mat(c2, { emissive: c2, ei: 0.4 }), [0, 1.95 * s, 0], g, false);
      parts.eyes = addEyes(g, 2, 2.0 * s, 0.34 * s, 0.08 * s, 0xff4040, 0.16);
      break;
    }
    case 'book': {
      const b = meshOf(new THREE.BoxGeometry(1.4 * s, 1.8 * s, 0.45 * s), mat(c1, { rough: 0.85 }), [0, 1.5 * s, 0], g);
      parts.body = b;
      meshOf(new THREE.BoxGeometry(1.2 * s, 1.6 * s, 0.5 * s), mat('#e8dfc0', { rough: 0.9 }), [0, 1.5 * s, 0.02], g);
      parts.eyes = addEyes(g, 1, 1.6 * s, 0.4 * s, 0.2 * s, 0xff4040);
      break;
    }
    case 'maw': {
      const b = meshOf(new THREE.SphereGeometry(1.3 * s, 10, 8), M1, [0, 1.4 * s, 0], g);
      b.scale.set(1.2, 0.95, 0.9);
      parts.body = b;
      const jaw = new THREE.Group();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        meshOf(new THREE.ConeGeometry(0.13 * s, 0.5 * s, 4), mat('#f0e8d0'),
          [Math.cos(a) * 0.7 * s, 1.4 * s + Math.sin(a) * 0.55 * s, 1.0 * s], jaw);
      }
      g.add(jaw);
      parts.jaw = jaw;
      meshOf(new THREE.SphereGeometry(0.6 * s, 8, 6), mat('#2a0a12', { rough: 1 }), [0, 1.4 * s, 0.95 * s], g, false);
      break;
    }
    case 'head': {
      const b = meshOf(new THREE.IcosahedronGeometry(1.5 * s, 1), mat(c1, { rough: 0.95 }), [0, 1.8 * s, 0], g);
      parts.body = b;
      parts.eyes = addEyes(g, 2, 2.1 * s, 1.35 * s, 0.22 * s, 0xff6030, 0.5);
      break;
    }
    case 'dagger': {
      const b = meshOf(new THREE.ConeGeometry(0.2 * s, 1.4 * s, 4), mat(c1, { metal: 0.85, rough: 0.2 }), [0, 1.4 * s, 0], g);
      b.rotation.x = Math.PI;
      parts.body = b;
      meshOf(new THREE.BoxGeometry(0.5 * s, 0.1 * s, 0.1 * s), mat('#6a4a2a'), [0, 2.1 * s, 0], g, false);
      break;
    }
    case 'fungus': {
      const stem = meshOf(new THREE.CylinderGeometry(0.32 * s, 0.45 * s, 1.1 * s, 7), mat('#e8e0d0'), [0, 0.55 * s, 0], g);
      parts.body = stem;
      const cap = meshOf(new THREE.SphereGeometry(0.85 * s, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M1, [0, 1.1 * s, 0], g);
      cap.scale.set(1.1, 0.8, 1.1);
      parts.head = cap;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        meshOf(new THREE.SphereGeometry(0.12 * s, 6, 5), M2, [Math.cos(a) * 0.5 * s, 1.35 * s, Math.sin(a) * 0.5 * s], g, false);
      }
      parts.eyes = addEyes(g, 2, 0.75 * s, 0.42 * s, 0.08 * s, 0x40ff80, 0.18);
      break;
    }
    default: { // blob
      const b = meshOf(new THREE.IcosahedronGeometry(0.95 * s, 1), M1, [0, 1.0 * s, 0], g);
      b.scale.set(1.1, 0.95, 1);
      parts.body = b;
      if (shape.spikes) for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        meshOf(new THREE.ConeGeometry(0.12 * s, 0.55 * s, 4), M2,
          [Math.cos(a) * 0.85 * s, 1.0 * s + Math.sin(i) * 0.3 * s, Math.sin(a) * 0.8 * s], g)
          .lookAt(V(Math.cos(a) * 3, 1.0 * s, Math.sin(a) * 3));
      }
      parts.eyes = addEyes(g, shape.eyes ?? 2, 1.15 * s, 0.85 * s, 0.11 * s, 0xff6060, 0.3);
    }
  }
  if (shape.wings) {
    for (const side of [-1, 1]) {
      const w = meshOf(new THREE.BoxGeometry(1.2 * s, 0.08 * s, 0.7 * s), mat(c2, { transparent: true, opacity: 0.8 }),
        [side * 1.0 * s, 1.9 * s, -0.3 * s], g);
      w.rotation.z = side * 0.35;
      parts.limbs.push(w);
      (parts.wings = parts.wings || []).push(w);
    }
  }
  return { group: g, parts };
}

/** 캐릭터별 플레이어 모델 (절차적) */
function buildPlayer(spec) {
  const sp = Object.assign({
    armor: '#8b2f2f', trim: '#c8b8a0', skin: '#d8b090', cape: '#9a2626',
    weapon: 'sword', horns: true, eye: '#ff5030',
  }, spec || {});
  const g = new THREE.Group();
  const parts = { limbs: [] };
  const armor = mat(sp.armor, { metal: 0.4, rough: 0.5 });
  const trim = mat(sp.trim, { metal: 0.75, rough: 0.3 });
  const skin = mat(sp.skin, { rough: 0.75 });

  const torso = meshOf(new THREE.CapsuleGeometry(0.45, 0.75, 4, 10), armor, [0, 1.25, 0], g);
  parts.body = torso;
  meshOf(new THREE.BoxGeometry(1.25, 0.28, 0.6), trim, [0, 1.72, 0], g);

  // 머리 : 캐릭터별 장식
  const head = meshOf(new THREE.IcosahedronGeometry(0.35, 1), sp.hood ? armor : trim, [0, 2.05, 0], g);
  parts.head = head;
  if (sp.horns) {
    for (const side of [-1, 1]) {
      const horn = meshOf(new THREE.ConeGeometry(0.09, 0.42, 5), mat('#e8e0c8'), [side * 0.3, 2.28, 0], g);
      horn.rotation.z = side * 0.7;
    }
  }
  if (sp.hood) {
    const hood = meshOf(new THREE.ConeGeometry(0.42, 0.62, 7), armor, [0, 2.28, -0.06], g);
    hood.rotation.x = -0.18;
  }
  if (sp.blindfold) {
    meshOf(new THREE.BoxGeometry(0.74, 0.16, 0.74), mat(sp.cape || '#6a3fa0', { rough: 0.9 }), [0, 2.07, 0], g, false);
  }
  parts.eyes = addEyes(g, sp.blindfold ? 0 : 2, 2.05, 0.33, 0.06, new THREE.Color(sp.eye).getHex(), 0.14);

  // 팔 / 다리
  for (const side of [-1, 1]) {
    const arm = meshOf(new THREE.CapsuleGeometry(0.15, 0.62, 3, 6), skin, [side * 0.62, 1.25, 0], g);
    arm.rotation.z = side * 0.3;
    parts.limbs.push(arm);
    if (side === -1) parts.armL = arm; else parts.armR = arm;
  }
  for (const side of [-1, 1]) {
    const leg = meshOf(new THREE.CapsuleGeometry(0.17, 0.55, 3, 6), armor, [side * 0.25, 0.45, 0], g);
    parts.limbs.push(leg);
  }

  // 무기
  const w = new THREE.Group();
  const steel = mat('#dfe6f0', { metal: 0.9, rough: 0.18 });
  if (sp.weapon === 'dagger') {
    meshOf(new THREE.CylinderGeometry(0.05, 0.05, 0.24, 5), mat('#2a2a2a'), [0, 0, 0], w);
    meshOf(new THREE.ConeGeometry(0.09, 0.56, 4), steel, [0, 0.42, 0], w);
    const d2 = new THREE.Group();
    meshOf(new THREE.CylinderGeometry(0.05, 0.05, 0.24, 5), mat('#2a2a2a'), [0, 0, 0], d2);
    meshOf(new THREE.ConeGeometry(0.09, 0.56, 4), steel, [0, 0.42, 0], d2);
    d2.position.set(-1.45, 0, -0.1);
    d2.rotation.z = 0.7;
    w.add(d2);
  } else if (sp.weapon === 'staff') {
    meshOf(new THREE.CylinderGeometry(0.05, 0.05, 2.1, 6), mat('#5a3a22'), [0, 0.6, 0], w);
    meshOf(new THREE.TorusGeometry(0.17, 0.045, 6, 16), mat(sp.trim, { metal: 0.8, emissive: sp.trim, ei: 0.8 }), [0, 1.72, 0], w, false);
  } else if (sp.weapon === 'orb') {
    // 디펙트는 무기를 들지 않는다. 충전한 구체가 주위를 돌기 때문에
    // 장식용으로 떠 있던 오브/후광은 구체와 겹쳐서 제거했다.
  } else {
    meshOf(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 6), mat('#4a2a18'), [0, 0, 0], w);
    meshOf(new THREE.BoxGeometry(0.34, 0.08, 0.08), trim, [0, 0.2, 0], w, false);
    meshOf(new THREE.BoxGeometry(0.13, 1.3, 0.045), steel, [0, 0.9, 0], w);
  }
  w.position.set(0.85, 1.35, 0.15);
  w.rotation.z = -0.35;
  g.add(w);
  parts.weapon = w;

  // 망토
  if (sp.cape) {
    const cape = meshOf(new THREE.ConeGeometry(0.6, 1.5, 6, 1, true), mat(sp.cape, { rough: 0.95 }), [0, 1.15, -0.32], g);
    cape.rotation.x = 0.14;
    parts.cape = cape;
  }
  return { group: g, parts };
}

// ---------------- 씬 구성 ----------------
export function setupBattle(battle) {
  if (!ready) return;
  models.forEach((m) => root.remove(m.group));
  models.clear();
  tweens.length = 0;
  if (orbGroup) { root.remove(orbGroup); orbGroup = null; }
  orbObjs.length = 0;
  emptyRings = [];

  const p = buildPlayer(battle.run && battle.run.character ? battle.run.character.model : null);
  const pBlob = addBlobShadow(p.group, 1);
  p.group.position.set(-1.8, 0, 2.3);
  p.group.rotation.y = 0.5;
  root.add(p.group);
  models.set(battle.player.uid, { ...p, blob: pBlob, base: p.group.position.clone(), actor: battle.player, shape: { size: 1 } });

  layoutEnemies(battle);
}

export function layoutEnemies(battle) {
  if (!ready) return;
  const list = battle.enemies.filter((e) => e.alive);
  list.forEach((e, i) => {
    if (models.has(e.uid)) return;
    const m = buildEnemy(e.shape || {});
    const blob = addBlobShadow(m.group, (e.shape && e.shape.size) || 1);
    root.add(m.group);
    models.set(e.uid, { ...m, blob, actor: e, shape: e.shape || {}, base: new THREE.Vector3() });
  });
  // 배치
  const n = list.length;
  const gap = n > 3 ? 1.32 : n > 2 ? 1.6 : 1.85;
  let maxX = 2;
  list.forEach((e, i) => {
    const m = models.get(e.uid);
    if (!m) return;
    const x = 1.85 + (i - (n - 1) / 2) * gap;
    const z = -0.3 - Math.abs(i - (n - 1) / 2) * 0.85;
    const target = new THREE.Vector3(x, 0, z);
    m.base.copy(target);
    m.group.position.copy(target);
    m.group.rotation.y = -0.4;
    const half = (m.shape.size || 1) * 1.1;
    maxX = Math.max(maxX, x + half);
  });
  // 카메라 프레임 폭 : 플레이어(-2.3) ~ 가장 오른쪽 적까지 + 여백
  setFrameWidth(Math.max(maxX + 3.4, 8.0) * 1.05);
  // 죽은 적 정리
  models.forEach((m, uid) => {
    if (m.actor && m.actor.isPlayer) return;
    if (m.actor && !m.actor.alive && !m.dying) { m.group.visible = false; }
  });
}

// ---------------- 화면 좌표 투영 ----------------
export function screenPos(actor, heightOffset = 0) {
  const m = models.get(actor.uid);
  if (!m || !canvasEl) return null;
  const v = new THREE.Vector3();
  m.group.getWorldPosition(v);
  const h = (m.shape && m.shape.size ? m.shape.size : 1);
  // 구체가 떠 있으면 이름/체력바를 조금 더 위로 올려 겹치지 않게 한다
  v.y += heightOffset || (actor.isPlayer ? (orbObjs.length ? 3.5 : 2.9) : 1.6 + h * 1.5);
  v.project(camera);
  const rect = canvasEl.getBoundingClientRect();
  return {
    x: (v.x * 0.5 + 0.5) * rect.width,
    y: (-v.y * 0.5 + 0.5) * rect.height,
    visible: v.z < 1,
  };
}

export function hasModel(actor) { return models.has(actor.uid); }

/** 몬스터 본체의 화면상 위치/반지름 (탭 영역 계산용) */
export function bodyScreenRect(actor) {
  const m = models.get(actor && actor.uid);
  if (!m || !canvasEl || !m.group.visible) return null;
  const h = (m.shape && m.shape.size) ? m.shape.size : 1;
  const center = new THREE.Vector3();
  m.group.getWorldPosition(center);
  center.y += h * 0.95;
  const edge = center.clone().add(new THREE.Vector3(h * 1.15, 0, 0));
  const rect = canvasEl.getBoundingClientRect();
  const p = center.clone().project(camera);
  const q = edge.project(camera);
  const cx = (p.x * 0.5 + 0.5) * rect.width;
  const cy = (-p.y * 0.5 + 0.5) * rect.height;
  const qx = (q.x * 0.5 + 0.5) * rect.width;
  const r = Math.max(30, Math.abs(qx - cx));
  return { x: cx, y: cy, r, visible: p.z < 1 };
}

// ---------------- 애니메이션 ----------------
function tween(o) { tweens.push({ t: 0, dur: 0.3, delay: 0, started: false, ...o }); }

export function fxAttack(src, dst) {
  const m = models.get(src.uid);
  const d = models.get(dst.uid);
  if (!m) return;
  const dir = d ? d.group.position.clone().sub(m.base).normalize() : new THREE.Vector3(1, 0, 0);
  tween({
    dur: 0.84,
    update: (k) => {
      const p = Math.sin(k * Math.PI);
      m.group.position.copy(m.base).addScaledVector(dir, p * 1.25);
      if (m.parts.weapon) m.parts.weapon.rotation.z = -0.35 - p * 2.4;
      m.group.rotation.z = -p * 0.16;
    },
    done: () => {
      m.group.position.copy(m.base);
      m.group.rotation.z = 0;
      if (m.parts.weapon) m.parts.weapon.rotation.z = -0.35;
    },
  });
}

export function fxHit(actor) {
  const m = models.get(actor.uid);
  if (!m) return;
  const meshes = [];
  m.group.traverse((o) => { if (o.isMesh && o.material && o.material.emissive && o !== m.blob) meshes.push(o); });
  const prev = meshes.map((o) => o.material.emissive.clone());
  tween({
    dur: 0.6,
    update: (k) => {
      const f = 1 - k;
      meshes.forEach((o, i) => o.material.emissive.setRGB(f * 0.9, f * 0.05, f * 0.05));
      m.group.position.x = m.base.x + Math.sin(k * 26) * 0.12 * f;
      m.group.position.y = m.base.y + Math.sin(k * 20) * 0.06 * f;
    },
    done: () => {
      meshes.forEach((o, i) => o.material.emissive.copy(prev[i]));
      m.group.position.copy(m.base);
    },
  });
}

export function fxBlock(actor) {
  const m = models.get(actor.uid);
  if (!m) return;
  const geo = new THREE.SphereGeometry(1.4, 12, 8);
  const mt = new THREE.MeshBasicMaterial({ color: 0x66c8ff, transparent: true, opacity: 0.45, wireframe: true });
  const sh = new THREE.Mesh(geo, mt);
  sh.position.copy(m.group.position).add(V(0, 1.3, 0));
  root.add(sh);
  tween({
    dur: 0.55,
    update: (k) => { sh.scale.setScalar(0.7 + k * 0.7); mt.opacity = 0.5 * (1 - k); },
    done: () => { root.remove(sh); geo.dispose(); mt.dispose(); },
  });
}

export function fxHeal(actor) {
  const m = models.get(actor.uid);
  if (!m) return;
  const grp = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const s = new THREE.Mesh(new THREE.TetrahedronGeometry(0.12),
      new THREE.MeshBasicMaterial({ color: 0x7cff9a, transparent: true, opacity: 0.9 }));
    s.position.set((Math.random() - 0.5) * 1.4, Math.random() * 0.5, (Math.random() - 0.5) * 1.4);
    grp.add(s);
  }
  grp.position.copy(m.group.position);
  root.add(grp);
  tween({
    dur: 1.0,
    update: (k) => { grp.children.forEach((c, i) => { c.position.y += 0.035; c.material.opacity = 0.9 * (1 - k); c.rotation.y += 0.1; }); },
    done: () => root.remove(grp),
  });
}

export function fxPower(actor, isDebuff) {
  const m = models.get(actor.uid);
  if (!m) return;
  const color = isDebuff ? 0xb060ff : 0xffd24a;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.06, 6, 20),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.copy(m.group.position).add(V(0, isDebuff ? 2.6 : 0.12, 0));
  root.add(ring);
  tween({
    dur: 0.7,
    update: (k) => {
      ring.position.y += isDebuff ? -0.035 : 0.04;
      ring.scale.setScalar(1 + k * 0.6);
      ring.material.opacity = 0.85 * (1 - k);
    },
    done: () => root.remove(ring),
  });
}

export function fxDeath(actor) {
  const m = models.get(actor.uid);
  if (!m) return;
  m.dying = true;
  const meshes = [];
  m.group.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; meshes.push(o); } });
  tween({
    dur: 1.2,
    update: (k) => {
      m.group.position.y = m.base.y - k * 0.5;
      m.group.rotation.z = k * 1.1;
      m.group.scale.setScalar(1 - k * 0.35);
      meshes.forEach((o) => { o.material.opacity = 1 - k; });
    },
    done: () => { m.group.visible = false; m.dying = false; },
  });
}

export function fxCast(actor, color = 0xff7a3a) {
  const m = models.get(actor.uid);
  if (!m) return;
  const light = new THREE.PointLight(color, 3, 8);
  light.position.copy(m.group.position).add(V(0, 1.8, 0.5));
  root.add(light);
  tween({ dur: 0.5, update: (k) => { light.intensity = 3 * (1 - k); }, done: () => root.remove(light) });
}

export function fxScreenShake(power = 1) {
  tween({
    dur: 0.35,
    update: (k) => {
      const f = (1 - k) * 0.18 * power;
      camera.position.x = Math.sin(k * 60) * f;
      camera.position.y = 3.3 + Math.cos(k * 50) * f;
    },
    done: () => { frameCamera(); },
  });
}

// ---------------- 루프 ----------------
let rafId = null;
function animate() {
  rafId = requestAnimationFrame(animate);
  if (!ready) return;
  frameCount++;
  try {
  renderFrame();
  } catch (e) { lastError = e && e.message; }
}

function renderFrame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 아이들 모션
  models.forEach((m) => {
    if (!m.group.visible || m.dying) return;
    const s = (m.shape && m.shape.size) || 1;
    const fl = m.shape && m.shape.floating;
    const off = m.actor ? (m.actor.idx || 0) * 0.7 : 0;
    if (fl) m.group.position.y = m.base.y + 0.55 + Math.sin(t * 1.6 + off) * 0.18;
    if (m.blob) m.blob.position.y = 0.02 - (m.group.position.y - m.base.y);
    else m.group.position.y = m.base.y + Math.abs(Math.sin(t * 1.3 + off)) * 0.055 * s;
    // 호흡 : 몸통이 천천히 커졌다 작아진다 (폭 2배)
    if (m.parts && m.parts.body) {
      const b = m.parts.body;
      if (b.userData.sy === undefined) { b.userData.sy = b.scale.y; b.userData.sx = b.scale.x; b.userData.sz = b.scale.z; }
      const br = Math.sin(t * 2.2 + off);
      b.scale.y = b.userData.sy * (1 + br * 0.07);
      b.scale.x = b.userData.sx * (1 - br * 0.028);
      b.scale.z = b.userData.sz * (1 - br * 0.028);
    }
    // 전체 실루엣도 아주 미세하게 (숨쉬는 느낌)
    if (!m.dying) {
      const breath = Math.sin(t * 1.55 + off * 0.6);
      const k = m.actor && m.actor.isPlayer ? 0.026 : 0.018;
      m.group.scale.set(1 + breath * k * 0.45, 1 + breath * k, 1 + breath * k * 0.45);
    }
    if (m.parts && m.parts.head) {
      m.parts.head.position.y = (m.parts.head.userData.py !== undefined
        ? m.parts.head.userData.py
        : (m.parts.head.userData.py = m.parts.head.position.y)) + Math.sin(t * 2.2 + off) * 0.035;
    }
    if (m.parts && m.parts.ring) m.parts.ring.rotation.z += dt * 0.7;
    if (m.parts && m.parts.ring2) m.parts.ring2.rotation.y += dt * 0.9;
    if (m.parts && m.parts.wings) m.parts.wings.forEach((w, i) => { w.rotation.z = (i ? 1 : -1) * (0.3 + Math.sin(t * 6) * 0.35); });
    if (m.parts && m.parts.cape) m.parts.cape.rotation.x = 0.14 + Math.sin(t * 1.1) * 0.04;
  });

  // ---- 디펙트 구체 : 주인공을 따라다니며 자기 슬롯으로 부드럽게 이동 ----
  if (orbGroup) {
    const pm = [...models.values()].find((m) => m.actor && m.actor.isPlayer);
    if (pm) orbGroup.position.set(pm.base.x, 0, pm.base.z);
    const lerp = Math.min(1, dt * 7);
    orbObjs.forEach((o, i) => {
      const bob = Math.sin(t * 2.1 + i * 1.3) * 0.09;
      const tgt = o.target.clone();
      tgt.y += bob;
      o.group.position.lerp(tgt, lerp);
      const sc = o.group.scale.x;
      if (sc < 1) o.group.scale.setScalar(Math.min(1, sc + dt * 4.5));
      const ud = o.group.userData;
      if (ud.core) { ud.core.rotation.y += dt * 1.6; ud.core.rotation.x += dt * 0.9; }
      if (ud.ring) ud.ring.rotation.z += dt * 1.1;
      if (ud.halo) ud.halo.scale.setScalar(1 + Math.sin(t * 3.4 + i) * 0.08);
    });
    emptyRings.forEach((r, k) => { r.rotation.z += dt * 0.4; });
  }

  // 불빛 흔들림
  const fire = scene.userData.fire;
  if (fire) fire.intensity = 1.0 + Math.sin(t * 7.3) * 0.18 + Math.sin(t * 13.1) * 0.09;

  // 배경 소품 : 횃불 일렁임 / 수정 부유
  envObjs.forEach((o, i) => {
    const fl = o.userData.flicker;
    if (fl) fl.scale.set(1, 1 + Math.sin(t * 8 + i) * 0.16, 1);
    const fo = o.userData.float;
    if (fo) {
      o.position.y = fo.y + Math.sin(t * fo.sp + fo.ph) * 0.22;
      o.rotation.y += dt * 0.5;
    }
  });

  // 트윈
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    if (tw.t < tw.delay) continue;
    if (!tw.started) { tw.started = true; tw.start && tw.start(); }
    const k = Math.min(1, (tw.t - tw.delay) / tw.dur);
    tw.update && tw.update(k);
    if (k >= 1) { tw.done && tw.done(); tweens.splice(i, 1); }
  }
  renderer.render(scene, camera);
}

export function disposeScene() {
  if (rafId) cancelAnimationFrame(rafId);
  ready = false;
}

/** 디버그용 상태 조회 */
export function debugInfo() {
  if (!renderer) return { ready: false };
  return {
    ready, frames: frameCount,
    size: renderer.getSize(new THREE.Vector2()).toArray(),
    tris: renderer.info.render.triangles,
    calls: renderer.info.render.calls,
    models: models.size,
    sceneChildren: scene.children.length,
    rootChildren: root.children.length,
    env: envKey,
    envSig: envObjs.map((o) => [o.type[0], o.position.toArray().map((v) => v.toFixed(2)).join(',')].join(':')).join('|'),
    fog: scene.fog ? '#' + scene.fog.color.getHexString() : null,
    cam: { fov: camera.fov, pos: camera.position.toArray(), aspect: camera.aspect },
    firstModelPos: models.size ? [...models.values()][0].group.position.toArray() : null,
    lastError: lastError ? String(lastError) : null,
  };
}

/** 디버그 : 배경색 강제 (렌더 가시성 확인용) */
export function debugClear(hex, alpha = 1) { if (renderer) renderer.setClearColor(hex, alpha); }
export function debugAmbient(v) { if (scene) { const a = new THREE.AmbientLight(0xffffff, v); scene.add(a); } }

/** 디버그 : 오프스크린 렌더 후 픽셀 샘플링 (헤드리스 환경 검증용) */
export function debugPixelTest(w = 390, h = 473) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const r2 = new THREE.WebGLRenderer({ canvas: c, antialias: false, alpha: false, preserveDrawingBuffer: true });
  r2.setPixelRatio(1);
  r2.setSize(w, h, false);
  r2.setClearColor(0x000000, 1);
  r2.render(scene, camera);
  const gl = r2.getContext();
  const buf = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  let nonBlack = 0, maxL = 0;
  const cols = {};
  for (let i = 0; i < buf.length; i += 4) {
    const l = buf[i] + buf[i + 1] + buf[i + 2];
    if (l > 24) nonBlack++;
    if (l > maxL) maxL = l;
    if (l > 60) { const k = `${buf[i] >> 5},${buf[i + 1] >> 5},${buf[i + 2] >> 5}`; cols[k] = (cols[k] || 0) + 1; }
  }
  const info = { total: w * h, nonBlack, pct: (nonBlack / (w * h) * 100).toFixed(1), maxLum: maxL,
    top: Object.entries(cols).sort((a, b) => b[1] - a[1]).slice(0, 6),
    glRenderer: gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL || gl.RENDERER) };
  r2.dispose();
  return info;
}

// ============================================================
//  디펙트 구체 : 주인공 주위를 도는 구체 배치 + 발사 연출
//  배열 순서 : orbs[0] = 가장 먼저 발동(오른쪽/몬스터 쪽)
//              index 가 커질수록 머리 위 → 왼쪽으로
//  새 구체는 왼쪽에서 충전되어 오른쪽으로 밀려간다.
// ============================================================
let orbGroup = null;
const orbObjs = [];
let emptyRings = [];

const ORB_STYLE = {
  lightning: { color: 0xffe14a, glow: 0xffb020, size: 0.30, geo: () => new THREE.IcosahedronGeometry(0.30, 0) },
  frost: { color: 0xa8e8ff, glow: 0x3aa0ff, size: 0.32, geo: () => new THREE.OctahedronGeometry(0.33, 0) },
  dark: { color: 0xb388f0, glow: 0x7a30d0, size: 0.30, geo: () => new THREE.SphereGeometry(0.30, 10, 8) },
  plasma: { color: 0xffe08a, glow: 0xff8a20, size: 0.29, geo: () => new THREE.SphereGeometry(0.29, 10, 8) },
};

/** 구체 슬롯 위치 : i=0 이 오른쪽(몬스터 쪽), 커질수록 머리 위 → 왼쪽 */
function orbSlotPos(i, slots) {
  const total = Math.max(3, slots || 3);
  const tt = total <= 1 ? 0.5 : Math.min(1, i / (total - 1));
  const a = (26 + 116 * tt) * Math.PI / 180;
  const r = 1.4;
  // 중심을 살짝 오른쪽으로 밀어 왼쪽 구체가 화면 밖으로 나가지 않게 한다
  return new THREE.Vector3(0.25 + Math.cos(a) * r, 1.5 + Math.sin(a) * r * 0.82, 0.5);
}

function ensureOrbGroup() {
  if (orbGroup) return;
  orbGroup = new THREE.Group();
  root.add(orbGroup);
}

function buildOrb(type) {
  const st = ORB_STYLE[type] || ORB_STYLE.lightning;
  const g = new THREE.Group();
  const core = new THREE.Mesh(st.geo(), new THREE.MeshStandardMaterial({
    color: st.color, emissive: new THREE.Color(st.glow), emissiveIntensity: 1.8,
    roughness: 0.25, metalness: 0.35, flatShading: true }));
  g.add(core);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(st.size * 1.6, 10, 8),
    new THREE.MeshBasicMaterial({ color: st.glow, transparent: true, opacity: 0.2, depthWrite: false }));
  g.add(halo);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(st.size * 1.5, 0.028, 5, 18),
    new THREE.MeshBasicMaterial({ color: st.color, transparent: true, opacity: 0.8 }));
  ring.rotation.x = Math.PI / 2.6;
  g.add(ring);
  const light = new THREE.PointLight(st.glow, 1.0, 3.4);
  g.add(light);
  g.userData = { core, ring, halo, type };
  return g;
}

function updateEmptyRings(used, slots) {
  const need = Math.max(0, (slots || 3) - used);
  while (emptyRings.length > need) { const r = emptyRings.pop(); orbGroup.remove(r); }
  while (emptyRings.length < need) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.02, 4, 16),
      new THREE.MeshBasicMaterial({ color: 0x9a90b8, transparent: true, opacity: 0.28 }));
    r.rotation.x = Math.PI / 2.6;
    orbGroup.add(r);
    emptyRings.push(r);
  }
  emptyRings.forEach((r, k) => r.position.copy(orbSlotPos(used + k, slots)));
}

/** 전투 상태의 구체 배열을 3D 에 반영 */
export function syncOrbs(orbs, slots) {
  if (!ready) return;
  ensureOrbGroup();
  while (orbObjs.length > orbs.length) {
    const o = orbObjs.pop();
    orbGroup.remove(o.group);
  }
  orbs.forEach((orb, i) => {
    let o = orbObjs[i];
    if (!o || o.type !== orb.type) {
      if (o) orbGroup.remove(o.group);
      const grp = buildOrb(orb.type);
      grp.scale.setScalar(0.01);
      // 새 구체는 왼쪽 바깥에서 등장
      grp.position.copy(orbSlotPos(Math.max(i, (slots || 3) - 1), slots)).add(new THREE.Vector3(-1.1, -0.2, 0));
      orbGroup.add(grp);
      o = { type: orb.type, group: grp, target: new THREE.Vector3(), fresh: true };
      orbObjs[i] = o;
    }
    o.amount = orb.amount;
    o.index = i;
    o.target.copy(orbSlotPos(i, slots));
  });
  updateEmptyRings(orbs.length, slots);
}

/** 화면 좌표 (암흑 구체 수치 라벨용) */
export function orbScreenPos(i) {
  const o = orbObjs[i];
  if (!o || !canvasEl) return null;
  const v = new THREE.Vector3();
  o.group.getWorldPosition(v);
  v.project(camera);
  const rect = canvasEl.getBoundingClientRect();
  return { x: (v.x * 0.5 + 0.5) * rect.width, y: (-v.y * 0.5 + 0.5) * rect.height, type: o.type, amount: o.amount };
}
export function orbCount() { return orbObjs.length; }

// ---------------- 발사 연출 ----------------
function actorPos(actor, yOff = 1.4) {
  const m = models.get(actor && actor.uid);
  if (!m) return new THREE.Vector3(3, 1.4, 0);
  const v = new THREE.Vector3();
  m.group.getWorldPosition(v);
  v.y += yOff;
  return v;
}

/** 들쭉날쭉한 번개 줄기 */
function spawnBolt(from, to, color, width = 0.07, life = 0.32, delay = 0) {
  const pts = [];
  const seg = 7;
  for (let i = 0; i <= seg; i++) {
    const p = from.clone().lerp(to, i / seg);
    if (i > 0 && i < seg) {
      p.x += (Math.random() - 0.5) * 0.55;
      p.y += (Math.random() - 0.5) * 0.55;
      p.z += (Math.random() - 0.5) * 0.35;
    }
    pts.push(p);
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 22, width, 5, false),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false }));
  root.add(mesh);
  const light = new THREE.PointLight(color, 0, 9);
  light.position.copy(to);
  root.add(light);
  tween({
    dur: life, delay,
    start: () => { mesh.material.opacity = 1; },
    update: (k) => { mesh.material.opacity = 1 - k; light.intensity = 3 * (1 - k); },
    done: () => { root.remove(mesh); root.remove(light); mesh.geometry.dispose(); mesh.material.dispose(); },
  });
}

/** 구체에서 대상으로 날아가는 투사체 */
function spawnProjectile(from, to, color, size = 0.26, life = 0.3, delay = 0) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 6),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 }));
  m.position.copy(from);
  root.add(m);
  const light = new THREE.PointLight(color, 0, 6);
  root.add(light);
  tween({
    dur: life, delay,
    start: () => { m.material.opacity = 0.95; light.intensity = 2; },
    update: (k) => { m.position.copy(from).lerp(to, k); light.position.copy(m.position); m.scale.setScalar(1 + k * 0.6); },
    done: () => { root.remove(m); root.remove(light); burst(to, color); },
  });
}

function burst(pos, color, n = 10) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(new THREE.TetrahedronGeometry(0.12),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 }));
    s.userData.dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    g.add(s);
  }
  g.position.copy(pos);
  root.add(g);
  tween({
    dur: 0.45,
    update: (k) => g.children.forEach((c) => {
      c.position.copy(c.userData.dir).multiplyScalar(k * 1.5);
      c.material.opacity = 1 - k;
      c.rotation.x += 0.2; c.rotation.y += 0.2;
    }),
    done: () => root.remove(g),
  });
}

/** 구체 발동 연출. evoke 면 맨 앞 구체를 소모한다. */
export function fxOrb(type, targets, isEvoke, player, orbIndex = 0, delay = 0) {
  if (!ready) return;
  ensureOrbGroup();
  let fromObj = null;
  if (isEvoke) fromObj = orbObjs.shift();
  else fromObj = orbObjs[orbIndex] || orbObjs[0];
  const from = fromObj
    ? fromObj.group.getWorldPosition(new THREE.Vector3())
    : actorPos(player, 2.6);

  const st = ORB_STYLE[type] || ORB_STYLE.lightning;
  const list = (targets || []).filter(Boolean);

  if (type === 'lightning') {
    (list.length ? list : [null]).forEach((t, k) => {
      if (t) spawnBolt(from, actorPos(t), st.color, isEvoke ? 0.09 : 0.06, isEvoke ? 0.7 : 0.5, delay + k * 0.08);
    });
  } else if (type === 'dark') {
    (list.length ? list : [null]).forEach((t, k) => {
      if (t) spawnProjectile(from, actorPos(t), st.color, isEvoke ? 0.34 : 0.2, 0.6, delay + k * 0.08);
    });
  } else if (type === 'frost') {
    const to = actorPos(player, 1.3);
    spawnProjectile(from, to, st.color, isEvoke ? 0.3 : 0.18, 0.5, delay);
  } else if (type === 'plasma') {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8),
      new THREE.MeshBasicMaterial({ color: st.color, transparent: true, opacity: 0.9 }));
    m.position.copy(from);
    root.add(m);
    m.material.opacity = 0;
    tween({
      dur: 0.8, delay,
      start: () => { m.material.opacity = 0.9; },
      update: (k) => { m.position.y = from.y + k * 1.1; m.material.opacity = 0.9 * (1 - k); m.scale.setScalar(1 + k); },
      done: () => root.remove(m),
    });
  }

  if (isEvoke && fromObj) {
    const grp = fromObj.group;
    tween({
      dur: 0.22,
      update: (k) => { grp.scale.setScalar(Math.max(0.01, 1 - k)); },
      done: () => orbGroup.remove(grp),
    });
  }
}

/** 구체 충전 연출 */
export function fxOrbChannel(type) {
  if (!ready || !orbObjs.length) return;
  const o = orbObjs[orbObjs.length - 1];
  if (!o) return;
  const st = ORB_STYLE[type] || ORB_STYLE.lightning;
  const pos = o.group.getWorldPosition(new THREE.Vector3());
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 6, 20),
    new THREE.MeshBasicMaterial({ color: st.color, transparent: true, opacity: 0.9 }));
  ring.position.copy(pos);
  ring.rotation.x = Math.PI / 2.6;
  root.add(ring);
  tween({
    dur: 0.5,
    update: (k) => { ring.scale.setScalar(1.8 - k * 1.1); ring.material.opacity = 0.9 * (1 - k); },
    done: () => root.remove(ring),
  });
}
