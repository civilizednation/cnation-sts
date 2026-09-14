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

  const hemi = new THREE.HemisphereLight(0xa8b8e8, 0x4a3040, 1.35);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffe6c0, 1.9);
  key.position.set(4, 9, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8a7aff, 1.0);
  rim.position.set(-6, 5, -6);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0xc8c0e8, 0.62));
  const fire = new THREE.PointLight(0xff9a5a, 1.5, 26, 2);
  fire.position.set(0, 2.5, 5);
  scene.add(fire);
  scene.userData.fire = fire;

  root = new THREE.Group();
  scene.add(root);

  // 바닥
  const gGeo = new THREE.CircleGeometry(16, 48);
  const gMat = new THREE.MeshStandardMaterial({ color: 0x4a4062, roughness: 0.92, metalness: 0.05 });
  groundMesh = new THREE.Mesh(gGeo, gMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  // 배경 기둥 (카메라 뒤/앞을 가리지 않도록 무대 뒤쪽에만 배치)
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3b3350, roughness: 1 });
  for (let i = 0; i < 9; i++) {
    const h = 7 + (i % 4) * 2.5;
    const x = -13 + i * 3.25 + (i % 2 ? 0.9 : -0.7);
    const z = -7.5 - (i % 3) * 3.2;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, h, 6), pillarMat);
    p.position.set(x, h / 2 - 0.5, z);
    p.castShadow = false;
    p.receiveShadow = true;
    scene.add(p);
  }
  // 뒤쪽 아치 장식
  const archMat = new THREE.MeshStandardMaterial({ color: 0x342c48, roughness: 1 });
  for (let i = 0; i < 3; i++) {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.35, 5, 14, Math.PI), archMat);
    arch.position.set(-7 + i * 7, 2.4, -11.5);
    scene.add(arch);
  }

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
  if (sp.orbs) {
    const ringM = mat(sp.trim, { metal: 0.85, rough: 0.2, emissive: sp.trim, ei: 0.5 });
    const halo = meshOf(new THREE.TorusGeometry(0.52, 0.05, 6, 20), ringM, [0, 2.45, 0], g, false);
    halo.rotation.x = Math.PI / 2;
    parts.halo = halo;
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
    const core = meshOf(new THREE.IcosahedronGeometry(0.22, 1), mat(sp.trim, { emissive: sp.trim, ei: 1.4, metal: 0.5 }), [0, 0.6, 0], w, false);
    parts.orbCore = core;
    const r = meshOf(new THREE.TorusGeometry(0.34, 0.035, 6, 18), mat(sp.trim, { emissive: sp.trim, ei: 0.7 }), [0, 0.6, 0], w, false);
    r.rotation.x = Math.PI / 2.5;
    parts.orbRing = r;
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
  setFrameWidth(Math.max(maxX + 3.4, 7.6) * 1.05);
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
  v.y += heightOffset || (actor.isPlayer ? 2.9 : 1.6 + h * 1.5);
  v.project(camera);
  const rect = canvasEl.getBoundingClientRect();
  return {
    x: (v.x * 0.5 + 0.5) * rect.width,
    y: (-v.y * 0.5 + 0.5) * rect.height,
    visible: v.z < 1,
  };
}

export function hasModel(actor) { return models.has(actor.uid); }

// ---------------- 애니메이션 ----------------
function tween(o) { tweens.push({ t: 0, dur: 0.3, ...o }); }

export function fxAttack(src, dst) {
  const m = models.get(src.uid);
  const d = models.get(dst.uid);
  if (!m) return;
  const dir = d ? d.group.position.clone().sub(m.base).normalize() : new THREE.Vector3(1, 0, 0);
  tween({
    dur: 0.42,
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
    dur: 0.3,
    update: (k) => {
      const f = 1 - k;
      meshes.forEach((o, i) => o.material.emissive.setRGB(f * 0.9, f * 0.05, f * 0.05));
      m.group.position.x = m.base.x + Math.sin(k * 40) * 0.12 * f;
      m.group.position.y = m.base.y + Math.sin(k * 30) * 0.06 * f;
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
    dur: 0.85,
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
    if (m.parts && m.parts.halo) m.parts.halo.rotation.z += dt * 0.6;
    if (m.parts && m.parts.orbRing) m.parts.orbRing.rotation.z += dt * 1.4;
    if (m.parts && m.parts.orbCore) m.parts.orbCore.rotation.y += dt * 1.2;
    if (m.parts && m.parts.ring2) m.parts.ring2.rotation.y += dt * 0.9;
    if (m.parts && m.parts.wings) m.parts.wings.forEach((w, i) => { w.rotation.z = (i ? 1 : -1) * (0.3 + Math.sin(t * 6) * 0.35); });
    if (m.parts && m.parts.cape) m.parts.cape.rotation.x = 0.14 + Math.sin(t * 1.1) * 0.04;
  });

  // 불빛 흔들림
  const fire = scene.userData.fire;
  if (fire) fire.intensity = 1.0 + Math.sin(t * 7.3) * 0.18 + Math.sin(t * 13.1) * 0.09;

  // 트윈
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const k = Math.min(1, tw.t / tw.dur);
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
