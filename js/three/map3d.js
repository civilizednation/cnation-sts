// ============================================================
//  3D 지도 : 절차적 입체 아이콘 + 경로, 터치 드래그 스크롤
// ============================================================
import * as THREE from 'three';

let renderer, scene, camera, raycaster, clock;
let canvasEl = null, ready = false, rafId = null;
const nodeMeshes = [];       // { group, pos, type, avail, visited, current, glow }
let onSelectCb = null;
let camY = 0, camYMin = 0, camYMax = 0;
let dragging = false, lastY = 0, moved = 0, velocity = 0;

export const ROOM_COLOR3D = {
  monster: 0xd06a5a, elite: 0xff5a4a, event: 0x7ab8ff,
  rest: 0xffa04a, shop: 0x6ae0a0, treasure: 0xffd24a, boss: 0xff4a6a,
};

const ROW_GAP = 2.7;
const COL_GAP = 2.0;

// ---------------- 초기화 ----------------
export function initMap(canvas) {
  if (ready && canvasEl === canvas) return;
  canvasEl = canvas;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x120e1c, 16, 42);
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  raycaster = new THREE.Raycaster();
  clock = new THREE.Clock();

  scene.add(new THREE.HemisphereLight(0xa0b0e0, 0x342a44, 1.25));
  const key = new THREE.DirectionalLight(0xffe0b0, 1.5);
  key.position.set(5, 12, 9);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9a7aff, 0.85);
  rim.position.set(-6, 4, -5);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0xd0c8f0, 0.5));

  bindInput();
  ready = true;
  resizeMap();
  loop();
}

export function resizeMap() {
  if (!ready || !canvasEl) return;
  const w = canvasEl.clientWidth || 1, h = canvasEl.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// ---------------- 절차적 아이콘 ----------------
const M = (color, o = {}) => new THREE.MeshStandardMaterial({
  color: new THREE.Color(color), flatShading: true,
  roughness: o.rough ?? 0.55, metalness: o.metal ?? 0.25,
  emissive: new THREE.Color(o.emissive || 0x000000), emissiveIntensity: o.ei ?? 1,
});

function buildIcon(type) {
  const g = new THREE.Group();
  const c = ROOM_COLOR3D[type];
  switch (type) {
    case 'monster': {          // 뿔 달린 작은 괴물 머리
      const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 0), M(c));
      head.scale.set(1, 0.92, 0.9);
      g.add(head);
      [-1, 1].forEach((sd) => {
        const h = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.34, 4), M(0xf0e0c0));
        h.position.set(sd * 0.3, 0.34, 0);
        h.rotation.z = sd * 0.5;
        g.add(h);
      });
      [-1, 1].forEach((sd) => {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), M(0xfff0a0, { emissive: 0xffcc40, ei: 2.4 }));
        e.position.set(sd * 0.16, 0.06, 0.42);
        g.add(e);
      });
      break;
    }
    case 'elite': {            // 큰 해골
      const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.56, 1), M(0xe8e0d0, { rough: 0.8, metal: 0.05 }));
      skull.scale.set(1, 1.05, 0.92);
      g.add(skull);
      [-1, 1].forEach((sd) => {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), M(0xff4a3a, { emissive: 0xff3020, ei: 2.6 }));
        e.position.set(sd * 0.2, 0.08, 0.46);
        g.add(e);
      });
      [-1, 1].forEach((sd) => {
        const h = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.6, 5), M(0xb03030));
        h.position.set(sd * 0.42, 0.42, -0.05);
        h.rotation.z = sd * 0.75;
        g.add(h);
      });
      break;
    }
    case 'event': {            // 물음표 : 열린 고리(윗획) + 꼬리 + 점
      const mat = M(c, { emissive: 0x4a90ff, ei: 1.2, rough: 0.25, metal: 0.35 });
      const q = new THREE.Group();
      const R = 0.24, TUBE = 0.082;
      // 윗획 — 250° 만 남긴 고리를 돌려서 오른쪽 아래가 열리게 한다
      const hook = new THREE.Mesh(new THREE.TorusGeometry(R, TUBE, 6, 20, Math.PI * 1.39), mat);
      hook.rotation.z = -Math.PI * 0.39;
      q.add(hook);
      // 꼬리 — 고리 끝에서 가운데 아래로 내려온다
      const a0 = -Math.PI * 0.39;
      const from = new THREE.Vector3(Math.cos(a0) * R, Math.sin(a0) * R, 0);
      const to = new THREE.Vector3(0, -0.36, 0);
      const dir = new THREE.Vector3().subVectors(to, from);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(TUBE, TUBE * 0.92, dir.length(), 6), mat);
      tail.position.copy(from).add(to).multiplyScalar(0.5);
      tail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      q.add(tail);
      // 아래 점
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.105, 8, 6), mat);
      dot.position.set(0, -0.58, 0);
      q.add(dot);
      q.position.y = 0.12;
      g.add(q);
      // 물음표는 정면을 유지 (회전시키면 옆면이 되어 안 읽힌다)
      break;
    }
    case 'rest': {             // 모닥불 : 장작 위로 솟는 세 갈래 불꽃
      const woodM = M(0x6b4a2a, { metal: 0, rough: 1 });
      // 장작 3개를 삼각으로 기대어 쌓는다
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.4;
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.62, 5), woodM);
        log.position.set(Math.cos(a) * 0.16, -0.36, Math.sin(a) * 0.16);
        log.rotation.set(Math.cos(a) * 0.42, 0, -Math.sin(a) * 0.42);
        g.add(log);
      }
      // 잉걸불
      const ember = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6),
        M(0xff6a20, { emissive: 0xff5010, ei: 2.4, rough: 0.5 }));
      ember.scale.set(1, 0.45, 1);
      ember.position.y = -0.4;
      g.add(ember);

      // 불꽃 세 갈래 — 가운데가 가장 높고 양옆이 바깥으로 기울어진다
      const outerM = M(0xff8a30, { emissive: 0xff5a10, ei: 2.0, rough: 0.3 });
      const innerM = M(0xffe07a, { emissive: 0xffc040, ei: 2.6, rough: 0.25 });
      const tongues = [
        { x: -0.19, y: -0.06, h: 0.56, r: 0.15, tilt: 0.40 },
        { x: 0.00, y: 0.10, h: 0.86, r: 0.20, tilt: 0.00 },
        { x: 0.19, y: -0.06, h: 0.56, r: 0.15, tilt: -0.40 },
      ];
      const flames = [];
      tongues.forEach((t, i) => {
        const fl = new THREE.Group();
        const outer = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 6), outerM);
        fl.add(outer);
        const core = new THREE.Mesh(new THREE.ConeGeometry(t.r * 0.5, t.h * 0.55, 5), innerM);
        core.position.y = -t.h * 0.16;
        fl.add(core);
        fl.position.set(t.x, t.y, i === 1 ? 0 : 0.03);
        fl.rotation.z = t.tilt;
        fl.userData.ph = i * 1.3;
        g.add(fl);
        flames.push(fl);
      });
      const lt = new THREE.PointLight(0xff8a3a, 1.8, 4.2);
      lt.position.set(0, 0.25, 0.4);
      g.add(lt);
      g.userData.flame = flames[1];
      g.userData.flames = flames;
      break;
    }
    case 'shop': {             // 노점 : 줄무늬 차양 + 판매대 + 진열품
      const woodM = M(0x7a5330, { metal: 0, rough: 0.9 });
      // 판매대(카운터)
      const counter = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.34, 0.5), woodM);
      counter.position.y = -0.36;
      g.add(counter);
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.09, 0.6), M(0x9a6b3e, { metal: 0, rough: 0.85 }));
      top.position.y = -0.15;
      g.add(top);
      // 차양 기둥
      [-1, 1].forEach((sd) => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.62, 5), woodM);
        pole.position.set(sd * 0.5, 0.16, -0.16);
        g.add(pole);
      });
      // 줄무늬 차양 (빨강/흰색 판을 번갈아 기울여 붙인다)
      for (let i = 0; i < 5; i++) {
        const col = i % 2 ? 0xf2f0e6 : 0xc8453a;
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.62),
          M(col, { metal: 0.05, rough: 0.7, emissive: i % 2 ? 0x000000 : 0x3a0e0c, ei: 0.5 }));
        slat.position.set(-0.5 + i * 0.25, 0.5, 0.06);
        slat.rotation.x = -0.34;
        g.add(slat);
      }
      // 차양 앞단 테두리
      const trim = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.07), M(0xe8c34a, { metal: 0.7, rough: 0.3, emissive: 0x5a4210, ei: 0.6 }));
      trim.position.set(0, 0.39, 0.29);
      g.add(trim);
      // 진열품 : 물약 병 + 금화 더미
      const bottle = new THREE.Mesh(new THREE.SphereGeometry(0.115, 8, 6), M(0x8affc0, { emissive: 0x30c070, ei: 1.3 }));
      bottle.position.set(-0.3, -0.02, 0.2);
      g.add(bottle);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.1, 5), M(0x8affc0, { emissive: 0x30c070, ei: 0.9 }));
      neck.position.set(-0.3, 0.08, 0.2);
      g.add(neck);
      for (let i = 0; i < 3; i++) {
        const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.035, 10),
          M(0xe8c34a, { metal: 0.9, rough: 0.2, emissive: 0x6a4a10, ei: 0.8 }));
        coin.position.set(0.3, -0.07 + i * 0.04, 0.18);
        coin.rotation.z = 0.06 * (i % 2 ? 1 : -1);
        g.add(coin);
      }
      break;
    }
    case 'treasure': {         // 금빛 보물 상자 : 황금 몸통 + 밝은 금테 + 보석 장식
      const gold = M(0xf5cf5a, { metal: 0.95, rough: 0.16, emissive: 0x8a6414, ei: 0.9 });
      const bright = M(0xfff0a8, { metal: 0.85, rough: 0.12, emissive: 0xc09a2a, ei: 1.3 });
      const deep = M(0xb8891f, { metal: 0.92, rough: 0.3, emissive: 0x4a3408, ei: 0.7 });

      // 몸통 (황금) + 안쪽 패널
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.44, 0.6), gold);
      body.position.y = -0.15;
      g.add(body);
      [-1, 1].forEach((sz) => {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.26, 0.02), deep);
        panel.position.set(0, -0.15, sz * 0.305);
        g.add(panel);
      });
      // 세로 금띠
      [-0.3, 0.3].forEach((x) => {
        const band = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.48, 0.64), bright);
        band.position.set(x, -0.15, 0);
        g.add(band);
      });
      // 상자 테두리
      const rim = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.67), bright);
      rim.position.y = 0.08;
      g.add(rim);

      // 반원 뚜껑 (황금) + 금테 후프
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.88, 14, 1, false, 0, Math.PI), gold);
      lid.rotation.z = Math.PI / 2;
      lid.position.y = 0.12;
      g.add(lid);
      [-0.3, 0, 0.3].forEach((x, i) => {
        const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.308, i === 1 ? 0.028 : 0.04, 5, 14, Math.PI),
          i === 1 ? deep : bright);
        hoop.rotation.y = Math.PI / 2;
        hoop.position.set(x, 0.12, 0);
        g.add(hoop);
      });
      // 뚜껑 위 보석 3알
      [[-0.22, 0x60e0ff], [0, 0xff6ab0], [0.22, 0x9aff8a]].forEach(([x, col]) => {
        const j = new THREE.Mesh(new THREE.OctahedronGeometry(0.058, 0),
          M(col, { emissive: col, ei: 1.8, metal: 0.4, rough: 0.12 }));
        j.position.set(x, 0.41, 0);
        g.add(j);
      });

      // 자물쇠판 + 큰 보석
      const lock = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.06), bright);
      lock.position.set(0, 0.0, 0.32);
      g.add(lock);
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.095, 0),
        M(0xff4a7a, { emissive: 0xd01050, ei: 2.2, metal: 0.4, rough: 0.12 }));
      gem.position.set(0, 0.01, 0.38);
      g.add(gem);

      // 모서리 금장 못
      [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => {
        const stud = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), bright);
        stud.position.set(sx * 0.41, -0.32, sz * 0.285);
        g.add(stud);
      }));

      // 뚜껑 틈에서 새어 나오는 빛
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.14),
        new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.5,
          blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.position.set(0, 0.085, 0.345);
      g.add(glow);
      const lt = new THREE.PointLight(0xffd070, 1.1, 3);
      lt.position.set(0, 0.35, 0.5);
      g.add(lt);
      g.userData.glow = glow;
      break;
    }
    case 'boss': {             // 왕관을 쓴 어둠의 결정
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.72, 0), M(0x5a1030, { emissive: 0xc02040, ei: 0.9, metal: 0.5, rough: 0.3 }));
      crystal.scale.set(1, 1.35, 1);
      g.add(crystal);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.5, 0.24, 6), M(0xe8c34a, { metal: 0.9, rough: 0.2, emissive: 0x6a4a10, ei: 0.6 }));
      crown.position.y = 0.82;
      g.add(crown);
      for (let i = 0; i < 6; i++) {
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.26, 4), M(0xe8c34a, { metal: 0.9, rough: 0.2 }));
        const a = (i / 6) * Math.PI * 2;
        sp.position.set(Math.cos(a) * 0.45, 1.0, Math.sin(a) * 0.45);
        g.add(sp);
      }
      const lt = new THREE.PointLight(0xff3060, 2, 6);
      lt.position.set(0, 0.4, 0.6);
      g.add(lt);
      g.userData.spin = crystal;
      break;
    }
  }
  return g;
}

/**
 * 범례용 아이콘 썸네일 — 지도에 쓰이는 실제 3D 아이콘을 작게 구워 PNG 데이터 URL 로 돌려준다.
 * 지도 렌더러와 별개의 일회용 컨텍스트를 사용하므로 지도 화면 밖에서도 호출 가능.
 */
export function iconThumbs(types, px = 44) {
  const out = {};
  let r = null;
  try {
    const cv = document.createElement('canvas');
    cv.width = cv.height = px;
    r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1);
    r.setSize(px, px, false);
    r.setClearColor(0x000000, 0);
    const sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight(0xa0b0e0, 0x342a44, 1.35));
    const key = new THREE.DirectionalLight(0xffe0b0, 1.7);
    key.position.set(4, 8, 8);
    sc.add(key);
    const rim = new THREE.DirectionalLight(0x9a7aff, 0.8);
    rim.position.set(-5, 3, -4);
    sc.add(rim);
    sc.add(new THREE.AmbientLight(0xd0c8f0, 0.7));
    const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
    types.forEach((type) => {
      const g = buildIcon(type);
      sc.add(g);
      const sph = new THREE.Box3().setFromObject(g).getBoundingSphere(new THREE.Sphere());
      const d = (sph.radius / Math.tan((38 * Math.PI / 180) / 2)) * 1.1;
      cam.position.set(sph.center.x + d * 0.10, sph.center.y + d * 0.14, sph.center.z + d);
      cam.lookAt(sph.center);
      r.render(sc, cam);
      out[type] = r.domElement.toDataURL('image/png');
      sc.remove(g);
      g.traverse((o) => {
        if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); }
      });
    });
  } catch (e) {
    /* WebGL 사용 불가 — 호출측에서 색 점으로 대체 */
  }
  if (r) r.dispose();
  return out;
}

function buildPedestal(color, big) {
  const g = new THREE.Group();
  const r = big ? 0.95 : 0.72;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.15, 0.2, 8), M(0x3b3350, { rough: 0.9, metal: 0.1 }));
  base.position.y = -0.7;
  g.add(base);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.96, 0.045, 6, 20), M(color, { emissive: color, ei: 0.9 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.58;
  g.add(ring);
  g.userData.ring = ring;
  return g;
}

/** 경로 위에 얹는 진행 방향 화살촉 (현재 위치 → 갈 수 있는 방) */
function buildPathArrow(color) {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.46, 4), new THREE.MeshBasicMaterial({ color }));
  g.add(cone);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.3, 4),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 }));
  tail.position.y = -0.42;
  g.add(tail);
  return g;
}

/** 현재 위치 표식 : 흰 빛기둥 + 바닥 링 */
function buildHereMarker() {
  const g = new THREE.Group();
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.66, 3.0, 12, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfff4c0, transparent: true, opacity: 0.13, side: THREE.DoubleSide,
      depthWrite: false, blending: THREE.AdditiveBlending }));
  beam.position.y = 0.75;
  g.add(beam);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.055, 6, 26),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.66;
  g.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.03, 6, 26),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
  ring2.rotation.x = Math.PI / 2;
  ring2.position.y = -0.66;
  g.add(ring2);
  g.userData.ring2 = ring2;
  return g;
}

/** 그룹 전체의 불투명도/채도를 낮춘다 */
function dimGroup(group, opacity, gray) {
  group.traverse((o) => {
    if (!o.isMesh) return;
    o.material = o.material.clone();
    o.material.transparent = true;
    o.material.opacity = opacity;
    if (gray && o.material.color) {
      const hsl = { h: 0, s: 0, l: 0 };
      o.material.color.getHSL(hsl);
      o.material.color.setHSL(hsl.h, hsl.s * 0.62, hsl.l * 0.82);
      if (o.material.emissive) o.material.emissive.multiplyScalar(0.55);
    }
  });
}

// ---------------- 지도 구성 ----------------
export function buildMap(run, onSelect) {
  if (!ready) return;
  onSelectCb = onSelect;
  // 기존 정리
  nodeMeshes.forEach((n) => scene.remove(n.group));
  nodeMeshes.length = 0;
  [...scene.children].forEach((o) => { if (o.userData.isLink) scene.remove(o); });

  const avail = run.availableNodes();
  const availMap = new Map(avail.map((a) => [a.boss ? 'boss' : `${a.row},${a.col}`, a]));
  const rows = run.map.length;

  const posOf = (r, c, n) => new THREE.Vector3((c - (n - 1) / 2) * COL_GAP, r * ROW_GAP, ((r + c) % 2) * 0.35 - 0.18);

  // 노드
  run.map.forEach((row, r) => {
    row.forEach((node, c) => {
      const key = `${r},${c}`;
      const a = availMap.get(key);
      const isAvail = !!a;
      const isCurrent = !!(run.mapPos && run.mapPos.row === r && run.mapPos.col === c);
      const grp = new THREE.Group();
      const color = ROOM_COLOR3D[node.type] || 0xffffff;
      grp.add(buildPedestal(isCurrent ? 0xffffff : isAvail ? 0xffd24a : color, false));
      const icon = buildIcon(node.type);
      icon.position.y = 0.05;
      grp.add(icon);
      grp.position.copy(posOf(r, c, row.length));
      grp.scale.setScalar(0.82);

      // 상태별 시각 구분 : 현재 위치 / 갈 수 있는 길 / 갈 수 없는 길
      let here = null;
      if (isCurrent) {
        here = buildHereMarker();
        grp.add(here);
      } else if (!isAvail) {
        // 갈 수 없는 길 — 완전히 묻히지 않도록 중간 밝기로만 낮춘다
        dimGroup(grp, node.visited ? 0.62 : 0.72, true);
      }
      scene.add(grp);
      nodeMeshes.push({
        group: grp, icon, here, r, c, type: node.type, avail: isAvail, fly: !!(a && a.fly),
        visited: node.visited, current: isCurrent,
        select: { row: r, col: c, fly: !!(a && a.fly) },
      });
    });
  });

  // 보스
  const bossAvail = availMap.has('boss');
  const bossGrp = new THREE.Group();
  bossGrp.add(buildPedestal(bossAvail ? 0xffd24a : 0xff4a6a, true));
  const bossIcon = buildIcon('boss');
  bossIcon.position.y = 0.25;
  bossGrp.add(bossIcon);
  bossGrp.position.set(0, rows * ROW_GAP + 0.6, 0);
  bossGrp.scale.setScalar(0.95);
  if (!bossAvail) dimGroup(bossGrp, 0.78, true);
  scene.add(bossGrp);
  nodeMeshes.push({ group: bossGrp, icon: bossIcon, r: rows, c: 0, type: 'boss', avail: bossAvail, select: { boss: true } });

  // 연결선
  const dullMat = new THREE.MeshBasicMaterial({ color: 0x6f6394, transparent: true, opacity: 0.55 });
  const doneMat = new THREE.MeshBasicMaterial({ color: 0xd2ae5c, transparent: true, opacity: 0.75 });
  const openMat = new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 1 });
  const addLink = (a, b, kind) => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const w = kind === 'open' ? 0.075 : 0.032;
    const geo = new THREE.CylinderGeometry(w, w, len, 6, 1, true);
    const mesh = new THREE.Mesh(geo, kind === 'open' ? openMat : kind === 'done' ? doneMat : dullMat);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    mesh.userData.isLink = true;
    if (kind === 'open') mesh.userData.pulse = true;
    scene.add(mesh);
    // 갈 수 있는 길에는 진행 방향 화살표를 경로 위에 얹는다 (노드 머리 위 화살표 대체)
    if (kind === 'open') {
      const ar = buildPathArrow(0xffd24a);
      ar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      ar.userData.isLink = true;
      ar.userData.flow = { a: a.clone(), b: b.clone() };
      scene.add(ar);
    }
  };
  const cur = run.mapPos;
  // 아직 첫 발을 딛지 않았다면 바닥에서 올라오는 진입 화살표를 그린다
  if (!cur) {
    run.map[0].forEach((_, c) => {
      if (!availMap.has(`0,${c}`)) return;
      const to = posOf(0, c, run.map[0].length).clone().add(new THREE.Vector3(0, -0.85, 0));
      addLink(to.clone().add(new THREE.Vector3(0, -1.6, 0)), to, 'open');
    });
  }
  run.map.forEach((row, r) => {
    if (r >= rows - 1) return;
    row.forEach((node, c) => {
      const from = posOf(r, c, row.length).clone().add(new THREE.Vector3(0, -0.45, 0));
      const fromCurrent = cur && cur.row === r && cur.col === c;
      node.next.forEach((nc) => {
        const to = posOf(r + 1, nc, run.map[r + 1].length).clone().add(new THREE.Vector3(0, -0.8, 0));
        const open = fromCurrent && availMap.has(`${r + 1},${nc}`);
        addLink(from, to, open ? 'open' : node.visited ? 'done' : 'dull');
      });
    });
  });
  run.map[rows - 1].forEach((_, c) => {
    const from = posOf(rows - 1, c, run.map[rows - 1].length).clone().add(new THREE.Vector3(0, -0.4, 0));
    const fromCurrent = cur && cur.row === rows - 1 && cur.col === c;
    addLink(from, new THREE.Vector3(0, rows * ROW_GAP - 0.4, 0), fromCurrent && bossAvail ? 'open' : 'dull');
  });

  // 카메라 범위 & 초기 위치 (선택 가능한 노드로)
  camYMin = -1.2;
  camYMax = rows * ROW_GAP + 1.5;
  const firstAvail = nodeMeshes.find((n) => n.avail);
  camY = firstAvail ? firstAvail.group.position.y + 2.4 : camYMin;
  camY = Math.max(camYMin, Math.min(camYMax, camY));
}

// ---------------- 입력 ----------------
function bindInput() {
  const el = canvasEl;
  el.addEventListener('pointerdown', (e) => { dragging = true; lastY = e.clientY; moved = 0; velocity = 0; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dy = e.clientY - lastY;
    lastY = e.clientY;
    moved += Math.abs(dy);
    camY = Math.max(camYMin, Math.min(camYMax, camY + dy * 0.022));
    velocity = dy * 0.022;
  });
  el.addEventListener('pointerup', (e) => {
    dragging = false;
    if (moved < 8) pick(e);
  });
  el.addEventListener('pointercancel', () => { dragging = false; });
  el.addEventListener('wheel', (e) => {
    camY = Math.max(camYMin, Math.min(camYMax, camY - e.deltaY * 0.01));
    e.preventDefault();
  }, { passive: false });
}

function pick(e) {
  if (!ready || !onSelectCb) return;
  const rect = canvasEl.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(mouse, camera);
  const targets = nodeMeshes.filter((n) => n.avail);
  for (const n of targets) {
    const hits = raycaster.intersectObject(n.group, true);
    if (hits.length) { onSelectCb(n.select); return; }
  }
  // 조금 빗나가도 가장 가까운 선택 가능 노드를 고른다
  let best = null, bestD = 1e9;
  targets.forEach((n) => {
    const v = n.group.position.clone().project(camera);
    const d = Math.hypot(v.x - mouse.x, v.y - mouse.y);
    if (d < bestD) { bestD = d; best = n; }
  });
  if (best && bestD < 0.22) onSelectCb(best.select);
}

// ---------------- 루프 ----------------
function loop() {
  rafId = requestAnimationFrame(loop);
  if (!ready) return;
  const t = clock.elapsedTime;
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!dragging && Math.abs(velocity) > 0.0005) {
    camY = Math.max(camYMin, Math.min(camYMax, camY + velocity));
    velocity *= 0.9;
  }
  // 세로 화면 폭에 맞춰 거리 자동 조정 (여러 층이 보이도록)
  const aspect = camera.aspect || 0.55;
  const needW = 8.6;
  const dist = Math.max(14, (needW / 2) / (Math.tan((camera.fov * Math.PI / 180) / 2) * aspect));
  camera.position.set(0, camY + 2.2, dist);
  camera.lookAt(0, camY, 0);

  nodeMeshes.forEach((n, i) => {
    const off = i * 0.7;
    if (n.avail) {
      n.group.position.y = n.baseY !== undefined ? n.baseY : (n.baseY = n.group.position.y);
      n.group.position.y = n.baseY + Math.sin(t * 2 + off) * 0.12;
      const base = n.baseScale !== undefined ? n.baseScale : (n.baseScale = n.group.scale.x);
      n.group.scale.setScalar(base * (1.1 + Math.sin(t * 3 + off) * 0.06));
      n.group.rotation.y = Math.sin(t * 0.8 + off) * 0.35;
    } else {
      n.group.rotation.y = Math.sin(t * 0.35 + off) * 0.18;
      if (n.baseScale === undefined) n.baseScale = n.group.scale.x;
    }
    if (n.here) {
      n.here.rotation.y += dt * 0.5;
      const r2 = n.here.userData.ring2;
      if (r2) { const k = 1 + (Math.sin(t * 2) * 0.5 + 0.5) * 0.5; r2.scale.set(k, k, 1); r2.material.opacity = 0.5 * (1.5 - k); }
    }
    const ic = n.icon && n.icon.userData;
    if (ic && ic.spin) ic.spin.rotation.y += dt * 1.1;
    if (ic && ic.ring) ic.ring.rotation.z += dt * 0.8;
    if (ic && ic.flames) {
      // 세 갈래 불꽃이 각자 다른 박자로 일렁인다
      ic.flames.forEach((fl) => {
        const k = 1 + Math.sin(t * 6.5 + fl.userData.ph + off) * 0.16;
        fl.scale.set(1 - (k - 1) * 0.5, k, 1);
      });
    } else if (ic && ic.flame) ic.flame.scale.setScalar(1 + Math.sin(t * 6 + off) * 0.12);
    if (ic && ic.glow) ic.glow.material.opacity = 0.4 + Math.sin(t * 2.6 + off) * 0.18;
  });
  scene.children.forEach((o) => {
    if (o.userData.pulse) o.material.opacity = 0.75 + Math.sin(t * 5) * 0.25;
    const fl = o.userData.flow;
    if (fl) {
      const k = 0.46 + Math.sin(t * 2.2) * 0.14;
      o.position.copy(fl.a).lerp(fl.b, k);
    }
  });
  renderer.render(scene, camera);
}

export function disposeMap() { if (rafId) cancelAnimationFrame(rafId); ready = false; }
