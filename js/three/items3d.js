// ============================================================
//  아이템 3D 아이콘 : 유물 / 물약 / 골드 / 체력을 three.js 로 구워
//  PNG 데이터 URL 로 돌려준다. (외부 이미지 0개 · 결과는 캐시)
// ============================================================
import * as THREE from 'three';
import { buildPlayer, buildEnemy } from './scene3d.js';

let renderer = null, scene = null, camera = null, ready = false, broken = false;
const cache = new Map();

const M = (color, o = {}) => new THREE.MeshStandardMaterial({
  color: new THREE.Color(color), flatShading: o.flat !== false,
  roughness: o.rough ?? 0.5, metalness: o.metal ?? 0.3,
  emissive: new THREE.Color(o.emissive || 0x000000), emissiveIntensity: o.ei ?? 1,
  transparent: !!o.opacity, opacity: o.opacity ?? 1,
});
const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
};

function init() {
  if (ready || broken) return ready;
  try {
    const cv = document.createElement('canvas');
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xbcc8ec, 0x3a3048, 1.3));
    const key = new THREE.DirectionalLight(0xfff0d8, 2.0);
    key.position.set(3.2, 5.5, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9a86ff, 0.95);
    rim.position.set(-4, 2.5, -3.5);
    scene.add(rim);
    scene.add(new THREE.AmbientLight(0xd6cdf2, 0.72));
    camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
    renderer.setSize(BAKE_PX, BAKE_PX, false);
    ready = true;
  } catch (e) {
    broken = true;
  }
  return ready;
}

// 굽는 해상도는 하나로 고정한다. 매번 setSize 하면 프레임버퍼를 다시 잡느라 느려지고,
// 머티리얼을 dispose 하면 셰이더 프로그램이 매번 재컴파일되어 훨씬 더 느려진다.
const BAKE_PX = 96;

/**
 * 그룹을 원하는 크기·비율로 한 장 굽는다.
 *
 * 정사각형(bake) 은 아이템용이다. 캐릭터는 세로로 길어 정사각형에 담으면
 * 좌우가 통째로 비고 그만큼 작게 보인다 — 세로로 긴 틀에 담아야 꽉 찬다.
 * 바운딩 박스의 가로·세로를 각각 화각에 맞춰 보고 더 빡빡한 쪽을 쓴다.
 * (깊이의 절반을 거리에 더해 앞쪽으로 튀어나온 부분이 잘리지 않게 한다)
 */
function bakeSized(group, w, h) {
  scene.add(group);
  const box = new THREE.Box3();
  group.traverse((o) => { if (o.isMesh && !o.userData.noFit) box.expandByObject(o); });
  const c = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  // h 를 비우면 모델 생김새에 맞춰 틀을 정한다. 납작한 슬라임을 세로로 긴 틀에
  // 담으면 위아래가 빈 채로 굽혀 화면에서 카드에 헛공간이 생긴다.
  if (h == null) {
    h = Math.round(w * Math.min(1.6, Math.max(0.62, size.y / Math.max(0.001, size.x))));
  }
  const vFov = (36 * Math.PI / 180);
  const aspect = w / h;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const d = Math.max((size.y / 2) / Math.tan(vFov / 2), (size.x / 2) / Math.tan(hFov / 2)) * 1.06
    + size.z / 2;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  camera.position.set(c.x + d * 0.10, c.y + d * 0.13, c.z + d);
  camera.lookAt(c);
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/png');
  scene.remove(group);
  group.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });   // 머티리얼은 살려 둔다
  // 아이템 쪽이 쓰는 정사각형 틀로 되돌려 둔다
  camera.aspect = 1;
  camera.updateProjectionMatrix();
  renderer.setSize(BAKE_PX, BAKE_PX, false);
  return url;
}

/** 그룹을 화면에 꽉 차게 담아 한 장 굽는다 */
function bake(group) {
  scene.add(group);
  const box = new THREE.Box3();
  group.traverse((o) => { if (o.isMesh && !o.userData.noFit) box.expandByObject(o); });
  const sph = box.getBoundingSphere(new THREE.Sphere());
  const d = (sph.radius / Math.tan((36 * Math.PI / 180) / 2)) * 1.06;
  camera.position.set(sph.center.x + d * 0.10, sph.center.y + d * 0.13, sph.center.z + d);
  camera.lookAt(sph.center);
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/png');
  scene.remove(group);
  group.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });   // 머티리얼은 살려 둔다
  return url;
}

// ------------------------------------------------------------
//  유물 형태 사전 — glyph 이름을 실루엣이 뚜렷한 3D 형태로 매핑
// ------------------------------------------------------------
const SHAPES = {
  ring(c) {                       // 고리 · 목걸이 · 원반
    const g = new THREE.Group();
    g.add(mesh(new THREE.TorusGeometry(0.62, 0.17, 8, 22), M(c.main, { metal: 0.85, rough: 0.22 })));
    g.add(mesh(new THREE.TorusGeometry(0.62, 0.07, 6, 22), M(c.accent, { metal: 0.6, emissive: c.accent, ei: 0.5 }), 0, 0, 0.12));
    return g;
  },
  gem(c) {                        // 보석 · 결정
    const g = new THREE.Group();
    const core = mesh(new THREE.OctahedronGeometry(0.62, 0), M(c.main, { metal: 0.45, rough: 0.12, emissive: c.main, ei: 0.75 }));
    core.scale.set(1, 1.35, 1);
    g.add(core);
    g.add(mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.16, 6), M(c.accent, { metal: 0.9, rough: 0.25 }), 0, -0.62, 0));
    return g;
  },
  flask(c) {                      // 병 · 주머니 · 항아리
    const g = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(0.56, 12, 10), M(c.main, { metal: 0.15, rough: 0.35, emissive: c.main, ei: 0.35 }), 0, -0.14, 0);
    body.scale.set(1, 0.95, 1);
    g.add(body);
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.42, 8), M(c.main, { metal: 0.15, rough: 0.35 }), 0, 0.42, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.18, 8), M(c.accent, { metal: 0.5, rough: 0.6 }), 0, 0.68, 0));
    return g;
  },
  drop(c) {                       // 물방울 · 알 · 잉크
    const g = new THREE.Group();
    const d = mesh(new THREE.SphereGeometry(0.55, 12, 10), M(c.main, { metal: 0.2, rough: 0.25, emissive: c.main, ei: 0.8 }), 0, -0.1, 0);
    d.scale.set(1, 1.05, 1);
    g.add(d);
    g.add(mesh(new THREE.ConeGeometry(0.34, 0.66, 10), M(c.main, { metal: 0.2, rough: 0.25, emissive: c.main, ei: 0.6 }), 0, 0.46, 0));
    return g;
  },
  skull(c) {                      // 해골 · 가면
    const g = new THREE.Group();
    const s = mesh(new THREE.IcosahedronGeometry(0.58, 1), M(c.main, { metal: 0.05, rough: 0.8 }), 0, 0.1, 0);
    s.scale.set(1.05, 1, 0.9);
    g.add(s);
    [-1, 1].forEach((sd) => {
      g.add(mesh(new THREE.SphereGeometry(0.13, 8, 6), M(c.accent, { emissive: c.accent, ei: 2.6 }), sd * 0.22, 0.14, 0.48));
    });
    g.add(mesh(new THREE.BoxGeometry(0.5, 0.2, 0.4), M(c.main, { metal: 0.05, rough: 0.8 }), 0, -0.36, 0.1));
    return g;
  },
  heart(c) {                      // 심장 · 과실 · 고기
    const g = new THREE.Group();
    const mat = M(c.main, { metal: 0.1, rough: 0.5, emissive: c.main, ei: 0.4 });
    [-1, 1].forEach((sd) => g.add(mesh(new THREE.SphereGeometry(0.38, 10, 8), mat, sd * 0.28, 0.28, 0)));
    const tip = mesh(new THREE.ConeGeometry(0.56, 0.78, 8), mat, 0, -0.3, 0);
    tip.rotation.z = Math.PI;
    g.add(tip);
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 5), M(c.accent, { rough: 0.9 }), 0, 0.72, 0));
    return g;
  },
  blade(c) {                      // 칼 · 붓 · 송곳
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(0.2, 1.0, 0.07), M(c.main, { metal: 0.9, rough: 0.16 }), 0, 0.3, 0));
    g.add(mesh(new THREE.ConeGeometry(0.15, 0.3, 4), M(c.main, { metal: 0.9, rough: 0.16 }), 0, 0.95, 0));
    g.add(mesh(new THREE.BoxGeometry(0.5, 0.11, 0.12), M(c.accent, { metal: 0.6, rough: 0.4 }), 0, -0.22, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.4, 6), M(c.accent, { metal: 0.3, rough: 0.7 }), 0, -0.48, 0));
    return g;
  },
  star(c) {                       // 별 · 표창 · 꽃
    const g = new THREE.Group();
    const mat = M(c.main, { metal: 0.7, rough: 0.25, emissive: c.main, ei: 0.5 });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const sp = mesh(new THREE.ConeGeometry(0.2, 0.72, 4), mat, Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0);
      sp.rotation.z = a - Math.PI / 2;
      g.add(sp);
    }
    g.add(mesh(new THREE.SphereGeometry(0.24, 10, 8), M(c.accent, { metal: 0.8, rough: 0.2 })));
    return g;
  },
  book(c) {                       // 책 · 두루마리 · 카드
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(0.86, 1.02, 0.2), M(c.main, { metal: 0.15, rough: 0.7 })));
    g.add(mesh(new THREE.BoxGeometry(0.76, 0.92, 0.22), M(0xf0e8d0, { metal: 0, rough: 0.9 }), 0.06, 0, 0.02));
    g.add(mesh(new THREE.BoxGeometry(0.16, 1.06, 0.24), M(c.accent, { metal: 0.7, rough: 0.3 }), -0.38, 0, 0));
    return g;
  },
  flame(c) {                      // 불꽃 · 초 · 향
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.6, 8), M(c.accent, { rough: 0.8 }), 0, -0.44, 0));
    g.add(mesh(new THREE.ConeGeometry(0.3, 0.86, 7), M(c.main, { emissive: c.main, ei: 2.2, rough: 0.3 }), 0, 0.34, 0));
    g.add(mesh(new THREE.ConeGeometry(0.15, 0.46, 6), M(0xfff0b0, { emissive: 0xffe080, ei: 2.8 }), 0, 0.24, 0.02));
    return g;
  },
  bolt(c) {                       // 번개 · 금강저
    const g = new THREE.Group();
    const mat = M(c.main, { emissive: c.main, ei: 2.0, metal: 0.5, rough: 0.2 });
    [[0.16, 0.42, 0.5], [-0.16, -0.16, 0.5], [0.1, -0.6, 0.35]].forEach(([x, y, h], i) => {
      const seg = mesh(new THREE.BoxGeometry(0.26, h, 0.12), mat, x, y, 0);
      seg.rotation.z = i % 2 ? 0.7 : -0.7;
      g.add(seg);
    });
    return g;
  },
  chain(c) {                      // 사슬 · 열쇠 · 족쇄
    const g = new THREE.Group();
    const mat = M(c.main, { metal: 0.9, rough: 0.28 });
    for (let i = 0; i < 4; i++) {
      const lk = mesh(new THREE.TorusGeometry(0.2, 0.062, 6, 14), mat, 0, 0.58 - i * 0.32, 0);
      lk.rotation.y = i % 2 ? Math.PI / 2 : 0;
      g.add(lk);
    }
    g.add(mesh(new THREE.BoxGeometry(0.34, 0.2, 0.1), M(c.accent, { metal: 0.8, rough: 0.3 }), 0.2, -0.64, 0));
    return g;
  },
  wing(c) {                       // 날개 · 깃털 · 부채
    const g = new THREE.Group();
    const mat = M(c.main, { metal: 0.2, rough: 0.55 });
    for (let i = 0; i < 5; i++) {
      const f = mesh(new THREE.BoxGeometry(0.16, 0.5 + i * 0.18, 0.06), mat, -0.34 + i * 0.17, (i * 0.09), 0);
      f.rotation.z = 0.5 - i * 0.2;
      g.add(f);
    }
    g.add(mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.9, 6), M(c.accent, { metal: 0.4, rough: 0.6 }), -0.2, -0.3, 0.06));
    return g;
  },
  hammer(c) {                     // 망치 · 삽 · 봉
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.085, 0.085, 1.1, 6), M(c.accent, { metal: 0.2, rough: 0.8 }), 0, -0.2, 0));
    g.add(mesh(new THREE.BoxGeometry(0.72, 0.34, 0.34), M(c.main, { metal: 0.85, rough: 0.28 }), 0, 0.5, 0));
    return g;
  },
  gear(c) {                       // 톱니 · 기계
    const g = new THREE.Group();
    const mat = M(c.main, { metal: 0.9, rough: 0.3 });
    g.add(mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.2, 14), mat));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const t = mesh(new THREE.BoxGeometry(0.18, 0.2, 0.2), mat, Math.cos(a) * 0.56, Math.sin(a) * 0.56, 0);
      t.rotation.z = a;
      g.add(t);
    }
    g.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.26, 10), M(c.accent, { metal: 0.6, emissive: c.accent, ei: 0.7 })));
    g.rotation.x = Math.PI / 2;
    return g;
  },
  crown(c) {                      // 왕관 · 조각상
    const g = new THREE.Group();
    const mat = M(c.main, { metal: 0.92, rough: 0.2, emissive: c.main, ei: 0.35 });
    g.add(mesh(new THREE.CylinderGeometry(0.5, 0.56, 0.32, 8), mat, 0, -0.18, 0));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      g.add(mesh(new THREE.ConeGeometry(0.13, 0.42, 4), mat, Math.cos(a) * 0.48, 0.2, Math.sin(a) * 0.48));
    }
    g.add(mesh(new THREE.OctahedronGeometry(0.15, 0), M(c.accent, { emissive: c.accent, ei: 1.8, metal: 0.4 }), 0, 0.02, 0.52));
    return g;
  },
  torii(c) {                      // 도리이 · 문
    const g = new THREE.Group();
    const mat = M(c.main, { metal: 0.2, rough: 0.7 });
    [-1, 1].forEach((sd) => g.add(mesh(new THREE.CylinderGeometry(0.1, 0.13, 1.1, 7), mat, sd * 0.42, -0.14, 0)));
    g.add(mesh(new THREE.BoxGeometry(1.24, 0.15, 0.2), mat, 0, 0.5, 0));
    g.add(mesh(new THREE.BoxGeometry(0.98, 0.11, 0.17), M(c.accent, { rough: 0.7 }), 0, 0.26, 0));
    return g;
  },
  hourglass(c) {                  // 모래시계 · 회중시계
    const g = new THREE.Group();
    const glass = M(c.main, { metal: 0.1, rough: 0.15, opacity: 0.75, emissive: c.main, ei: 0.5 });
    const top = mesh(new THREE.ConeGeometry(0.42, 0.5, 8), glass, 0, 0.3, 0);
    top.rotation.z = Math.PI;
    g.add(top);
    g.add(mesh(new THREE.ConeGeometry(0.42, 0.5, 8), glass, 0, -0.3, 0));
    [-1, 1].forEach((sd) => g.add(mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.12, 8), M(c.accent, { metal: 0.9, rough: 0.25 }), 0, sd * 0.6, 0)));
    return g;
  },
  eye(c) {                        // 눈 · 환영
    const g = new THREE.Group();
    const ball = mesh(new THREE.SphereGeometry(0.58, 14, 12), M(0xf2ecdc, { metal: 0.05, rough: 0.35 }));
    ball.scale.set(1.1, 0.9, 0.9);
    g.add(ball);
    g.add(mesh(new THREE.SphereGeometry(0.26, 12, 10), M(c.main, { emissive: c.main, ei: 1.4, metal: 0.2 }), 0, 0, 0.42));
    g.add(mesh(new THREE.SphereGeometry(0.12, 10, 8), M(0x120c1a, { metal: 0 }), 0, 0, 0.58));
    return g;
  },
  claw(c) {                       // 발톱 · 뿔 · 가시
    const g = new THREE.Group();
    const mat = M(c.main, { metal: 0.25, rough: 0.6 });
    [-1, 0, 1].forEach((sd, i) => {
      const cl = mesh(new THREE.ConeGeometry(0.15, 0.8 + (i === 1 ? 0.3 : 0), 5), mat, sd * 0.3, i === 1 ? 0.18 : 0, 0);
      cl.rotation.z = -sd * 0.45;
      g.add(cl);
    });
    g.add(mesh(new THREE.SphereGeometry(0.28, 10, 8), M(c.accent, { rough: 0.7 }), 0, -0.5, 0));
    return g;
  },
  shield(c) {                     // 방패 · 비늘 · 돔
    const g = new THREE.Group();
    const body = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.16, 6), M(c.main, { metal: 0.75, rough: 0.3 }), 0, 0.1, 0);
    body.rotation.x = Math.PI / 2;
    g.add(body);
    g.add(mesh(new THREE.ConeGeometry(0.58, 0.5, 6), M(c.main, { metal: 0.75, rough: 0.3 }), 0, -0.42, 0));
    g.add(mesh(new THREE.SphereGeometry(0.19, 10, 8), M(c.accent, { metal: 0.9, emissive: c.accent, ei: 0.8 }), 0, 0.08, 0.16));
    return g;
  },
  fish(c) {                       // 물고기 · 물결
    const g = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(0.46, 12, 10), M(c.main, { metal: 0.45, rough: 0.3, emissive: c.main, ei: 0.35 }), 0.1, 0, 0);
    body.scale.set(1.35, 0.85, 0.6);
    g.add(body);
    const tail = mesh(new THREE.ConeGeometry(0.3, 0.46, 4), M(c.accent, { metal: 0.4, rough: 0.4 }), -0.62, 0, 0);
    tail.rotation.z = Math.PI / 2;
    g.add(tail);
    g.add(mesh(new THREE.SphereGeometry(0.08, 8, 6), M(0x101018, { metal: 0 }), 0.42, 0.13, 0.24));
    return g;
  },
  boot(c) {                       // 장화 · 발
    const g = new THREE.Group();
    const mat = M(c.main, { metal: 0.15, rough: 0.75 });
    g.add(mesh(new THREE.BoxGeometry(0.42, 0.8, 0.42), mat, -0.1, 0.2, 0));
    g.add(mesh(new THREE.BoxGeometry(0.86, 0.34, 0.44), mat, 0.12, -0.36, 0));
    g.add(mesh(new THREE.BoxGeometry(0.92, 0.14, 0.48), M(c.accent, { metal: 0.3, rough: 0.6 }), 0.14, -0.58, 0));
    return g;
  },
  chest(c) {                      // 상자 · 금고
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(1.0, 0.56, 0.68), M(c.main, { metal: 0.35, rough: 0.55 }), 0, -0.2, 0));
    const lid = mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.0, 12, 1, false, 0, Math.PI), M(c.main, { metal: 0.35, rough: 0.55 }), 0, 0.1, 0);
    lid.rotation.z = Math.PI / 2;
    g.add(lid);
    g.add(mesh(new THREE.BoxGeometry(1.06, 0.1, 0.72), M(c.accent, { metal: 0.9, rough: 0.22, emissive: c.accent, ei: 0.5 }), 0, 0.06, 0));
    g.add(mesh(new THREE.BoxGeometry(0.2, 0.22, 0.08), M(c.accent, { metal: 0.9, rough: 0.22 }), 0, -0.12, 0.36));
    return g;
  },
  hand(c) {                       // 손 · 주먹
    const g = new THREE.Group();
    const mat = M(c.main, { metal: 0.3, rough: 0.6 });
    g.add(mesh(new THREE.BoxGeometry(0.66, 0.6, 0.44), mat, 0, 0.1, 0));
    for (let i = 0; i < 4; i++) {
      g.add(mesh(new THREE.BoxGeometry(0.15, 0.2, 0.42), mat, -0.24 + i * 0.16, 0.48, 0));
    }
    g.add(mesh(new THREE.BoxGeometry(0.2, 0.18, 0.2), mat, -0.42, 0.14, 0.1));
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8), M(c.accent, { metal: 0.85, rough: 0.3 }), 0, -0.3, 0));
    return g;
  },
};

/** glyph → 형태 */
const GLYPH_SHAPE = {
  anchor: 'ring', marble: 'ring', beads: 'ring', periapt: 'ring', bowl: 'ring', sundial: 'ring',
  wheel: 'ring', prayer: 'ring', coin: 'ring', ring: 'ring',
  pstone: 'gem', chip: 'gem', astro: 'gem', pyramid: 'gem', charm: 'gem',
  tea: 'flask', bag: 'flask', belt: 'flask', urn: 'flask', pipe: 'flask', sozu: 'flask',
  coffee: 'flask', potion: 'flask', bank: 'flask',
  blood: 'drop', vial: 'drop', ink: 'drop', ecto: 'drop', icecream: 'drop', egg: 'drop', drop: 'drop',
  skull: 'skull', mask: 'skull', voodoo: 'skull', markpain: 'skull',
  pillow: 'heart', berry: 'heart', meat: 'heart', pear: 'heart', ginger: 'heart', mango: 'heart', turnip: 'heart',
  pen: 'blade', whet: 'blade', opener: 'blade', kunai: 'blade', dummy: 'blade', twinSword: 'blade',
  shuriken: 'star', flower: 'star', top: 'star', helix: 'star', btorn: 'star',
  scroll: 'book', ticket: 'book', bark: 'book', qcard: 'book', panto: 'book',
  lantern: 'flame', candle: 'flame', bflame: 'flame', incense: 'flame',
  vajra: 'bolt', blight: 'bolt',
  nunchaku: 'chain', thread: 'chain', cage: 'chain', choker: 'chain', collar: 'chain', key: 'chain',
  feather: 'wing', fan: 'wing', wing: 'wing',
  weight: 'hammer', shovel: 'hammer', rod: 'hammer', hammer: 'hammer', paint: 'hammer',
  puzzle: 'gear', caliper: 'gear',
  cow: 'crown', doll: 'crown', statue: 'crown', crown: 'crown', house: 'crown',
  torii: 'torii',
  hourglass: 'hourglass', watch: 'hourglass',
  dream: 'eye', snecko: 'eye',
  insect: 'claw', horn: 'claw', tail: 'claw', branch: 'claw',
  scale: 'shield', stone: 'shield', cleat: 'shield', dome: 'shield',
  fish: 'fish',
  boot: 'boot', courier: 'boot',
  chest: 'chest',
  hand: 'hand',
};

/** 문자열 → 0~1 해시 (색 변주용) */
function hash01(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

const RARITY_ACCENT = {
  starter: 0xb8b0c8, common: 0xd8d0e8, uncommon: 0x7fd0ff, rare: 0xffd24a, boss: 0xd89aff, shop: 0x8affc0,
};

/** 유물 아이콘 (데이터 URL) */
export function relicIcon3D(def) {
  if (!def || !init()) return null;
  const k = `r:${def.id}`;
  if (cache.has(k)) return cache.get(k);
  const shape = SHAPES[GLYPH_SHAPE[def.glyph] || 'gem'];
  // 색상 : 같은 형태끼리도 확실히 구분되도록 색상환 전체 + 채도/명도까지 흩뿌린다
  const h = hash01(def.id);
  const h2 = hash01(def.id + '~');
  const main = new THREE.Color()
    .setHSL(h, 0.36 + h2 * 0.46, 0.40 + ((h * 7.13) % 1) * 0.28).getHex();
  const accent = RARITY_ACCENT[def.rarity] || 0xd8d0e8;
  let url = null;
  try { url = bake(shape({ main, accent })); } catch (e) { url = null; }
  cache.set(k, url);
  return url;
}

// ------------------------------------------------------------
//  물약 — 병 모양 6종 × 고유 색
// ------------------------------------------------------------
const BOTTLE = ['round', 'cone', 'tall', 'orb', 'square', 'teardrop'];

function buildPotion(colorHex, kind, rarity) {
  const g = new THREE.Group();
  const glassM = M(colorHex, { metal: 0.12, rough: 0.12, opacity: 0.92, emissive: colorHex, ei: 0.85, flat: false });
  const corkM = M(0x9a7040, { metal: 0.1, rough: 0.85 });
  const capM = M(RARITY_ACCENT[rarity] || 0xd8d0e8, { metal: 0.88, rough: 0.25 });

  if (kind === 'round') {
    const b = mesh(new THREE.SphereGeometry(0.5, 14, 12), glassM, 0, -0.16, 0);
    b.scale.set(1, 0.92, 1);
    g.add(b);
    g.add(mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.36, 10), glassM, 0, 0.34, 0));
  } else if (kind === 'cone') {
    const b = mesh(new THREE.ConeGeometry(0.54, 0.82, 10), glassM, 0, -0.2, 0);
    b.rotation.z = Math.PI;
    g.add(b);
    g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.4, 10), glassM, 0, 0.36, 0));
  } else if (kind === 'tall') {
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.96, 10), glassM, 0, -0.1, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.28, 10), glassM, 0, 0.5, 0));
  } else if (kind === 'orb') {
    g.add(mesh(new THREE.IcosahedronGeometry(0.52, 1), glassM, 0, -0.1, 0));
    g.add(mesh(new THREE.TorusGeometry(0.3, 0.06, 6, 16), capM, 0, 0.3, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.24, 8), glassM, 0, 0.36, 0));
  } else if (kind === 'square') {
    const b = mesh(new THREE.BoxGeometry(0.76, 0.72, 0.5), glassM, 0, -0.16, 0);
    g.add(b);
    g.add(mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.34, 8), glassM, 0, 0.34, 0));
  } else {                                   // teardrop
    const b = mesh(new THREE.SphereGeometry(0.46, 14, 12), glassM, 0, -0.24, 0);
    g.add(b);
    g.add(mesh(new THREE.ConeGeometry(0.34, 0.6, 10), glassM, 0, 0.22, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.22, 8), glassM, 0, 0.5, 0));
  }
  // 마개 + 등급 링
  g.add(mesh(new THREE.CylinderGeometry(0.19, 0.16, 0.2, 10), corkM, 0, 0.66, 0));
  g.add(mesh(new THREE.TorusGeometry(0.19, 0.045, 6, 14), capM, 0, 0.56, 0));
  // 떠오르는 기포
  for (let i = 0; i < 3; i++) {
    g.add(mesh(new THREE.SphereGeometry(0.055 - i * 0.012, 6, 5),
      M(0xffffff, { emissive: 0xffffff, ei: 1.4, metal: 0 }), -0.12 + i * 0.13, -0.28 + i * 0.16, 0.26));
  }
  return g;
}

/** 물약 아이콘 (데이터 URL) */
export function potionIcon3D(def) {
  if (!def || !init()) return null;
  const k = `p:${def.id}`;
  if (cache.has(k)) return cache.get(k);
  const kind = BOTTLE[Math.floor(hash01(def.id) * BOTTLE.length) % BOTTLE.length];
  let url = null;
  try { url = bake(buildPotion(def.color, kind, def.rarity)); } catch (e) { url = null; }
  cache.set(k, url);
  return url;
}

// ------------------------------------------------------------
//  골드 / 체력
// ------------------------------------------------------------
export function goldIcon3D() {
  if (!init()) return null;
  const k = 'g';
  if (cache.has(k)) return cache.get(k);
  let url = null;
  try {
    const g = new THREE.Group();
    // 금속성을 너무 높이면 환경맵이 없어 어둡게 죽는다 → 중간 금속감 + 자체 발광으로 금빛을 낸다
    const edge = M(0xd9a234, { metal: 0.5, rough: 0.34, emissive: 0x5a4008, ei: 0.7 });
    const face = M(0xffdf72, { metal: 0.42, rough: 0.26, emissive: 0x8a6a16, ei: 0.85 });
    const stamp = M(0xfff8d8, { metal: 0.3, rough: 0.18, emissive: 0xd8b040, ei: 1.35 });

    /** 앞면·테두리가 구분되는 금화 한 닢 */
    const coin = (r, thick) => {
      const c = new THREE.Group();
      c.add(mesh(new THREE.CylinderGeometry(r, r, thick, 26), edge));            // 두꺼운 테두리
      [1, -1].forEach((sd) => {                                                  // 살짝 튀어나온 앞뒷면
        c.add(mesh(new THREE.CylinderGeometry(r * 0.84, r * 0.84, thick * 1.14, 26), face, 0, sd * thick * 0.08, 0));
      });
      const em = mesh(new THREE.OctahedronGeometry(r * 0.34, 0), stamp, 0, thick * 0.62, 0);
      em.scale.set(1, 0.4, 1);
      c.add(em);                                                                 // 가운데 각인
      for (let i = 0; i < 10; i++) {                                             // 둘레 돋을새김
        const a = (i / 10) * Math.PI * 2;
        c.add(mesh(new THREE.SphereGeometry(r * 0.05, 6, 5), stamp,
          Math.cos(a) * r * 0.64, thick * 0.6, Math.sin(a) * r * 0.64));
      }
      c.rotation.x = Math.PI / 2;    // 앞면이 카메라를 보게 세운다
      return c;
    };

    // 뒤쪽 두 닢은 좌우로 크게 비켜 두어 원반 윤곽이 각각 드러나게 한다
    const back1 = coin(0.44, 0.13);
    back1.position.set(-0.62, -0.34, -0.3);
    back1.rotation.z = -0.5;
    g.add(back1);
    const back2 = coin(0.44, 0.13);
    back2.position.set(0.62, -0.36, -0.3);
    back2.rotation.z = 0.44;
    g.add(back2);
    const front = coin(0.6, 0.17);
    front.position.set(0, 0.12, 0.3);
    g.add(front);

    url = bake(g);
  } catch (e) { url = null; }
  cache.set(k, url);
  return url;
}

/** 카드 보상 아이콘 : 부채꼴로 펼친 카드 3장 */
export function cardIcon3D() {
  if (!init()) return null;
  const k = 'c';
  if (cache.has(k)) return cache.get(k);
  let url = null;
  try {
    const g = new THREE.Group();
    const backM = M(0x3b6ea8, { metal: 0.3, rough: 0.5, emissive: 0x15314f, ei: 0.6 });
    const faceM = M(0xf2ecdc, { metal: 0.05, rough: 0.7 });
    const trimM = M(0x8ad0ff, { metal: 0.6, rough: 0.25, emissive: 0x3a8ad0, ei: 1.0 });

    const card = (w, h, mat) => {
      const c = new THREE.Group();
      c.add(mesh(new THREE.BoxGeometry(w, h, 0.045), mat));
      return c;
    };
    // 뒤쪽 두 장은 카드 뒷면, 앞의 한 장은 앞면 + 문양
    const angles = [0.42, -0.4, 0.02];
    const offs = [[-0.3, -0.06, -0.09], [0.3, -0.08, -0.05], [0, 0.06, 0.06]];
    angles.forEach((a, i) => {
      const isFront = i === 2;
      const c = card(0.78, 1.08, isFront ? faceM : backM);
      if (isFront) {
        // 앞면 테두리 + 가운데 마름모 문양
        c.add(mesh(new THREE.BoxGeometry(0.84, 1.14, 0.03), trimM, 0, 0, -0.02));
        const dia = mesh(new THREE.OctahedronGeometry(0.2, 0), trimM, 0, 0.06, 0.04);
        dia.scale.set(1, 1.25, 0.35);
        c.add(dia);
        c.add(mesh(new THREE.BoxGeometry(0.44, 0.05, 0.03), trimM, 0, -0.32, 0.04));
        c.add(mesh(new THREE.BoxGeometry(0.34, 0.05, 0.03), trimM, 0, -0.42, 0.04));
      } else {
        c.add(mesh(new THREE.BoxGeometry(0.56, 0.84, 0.03), trimM, 0, 0, 0.026));
      }
      c.position.set(offs[i][0], offs[i][1], offs[i][2]);
      c.rotation.z = a;
      g.add(c);
    });
    url = bake(g);
  } catch (e) { url = null; }
  cache.set(k, url);
  return url;
}

/** 캐릭터 초상 — 전투 씬의 절차적 모델을 그대로 구워서 쓴다 */
export function characterIcon3D(charId, model) {
  if (!init()) return null;
  const k = `ch:${charId}`;
  if (cache.has(k)) return cache.get(k);
  let url = null;
  try {
    const { group } = buildPlayer(model);
    group.rotation.y = 0.42;
    url = bake(group);
  } catch (e) { url = null; }
  cache.set(k, url);
  return url;
}

/**
 * 백과사전 캐릭터 소개용 — 세로로 긴 큰 초상.
 * 목록의 작은 아이콘(characterIcon3D) 과 달리 크게 보여 주는 자리라
 * 해상도를 높여 굽는다. 4장뿐이고 한 번 구우면 캐시된다.
 */
export function characterPortrait3D(charId, model) {
  if (!init()) return null;
  const k = `chp:${charId}`;
  if (cache.has(k)) return cache.get(k);
  let url = null;
  try {
    const { group } = buildPlayer(model);
    group.rotation.y = 0.42;
    url = bakeSized(group, 264, 396);
  } catch (e) { url = null; }
  cache.set(k, url);
  return url;
}

/**
 * 백과사전 몬스터 소개용 초상. 캐릭터와 같은 방식이지만 몬스터는 옆으로
 * 퍼진 것(아가리·거대한 머리)부터 길쭉한 것(턱벌레)까지 폭이 넓어
 * 조금 덜 길쭉한 틀(3:4)에 담아야 어느 쪽도 손해를 보지 않는다.
 */
export function monsterPortrait3D(mid, shape) {
  if (!init()) return null;
  const k = `mon:${mid}`;
  if (cache.has(k)) return cache.get(k);
  let url = null;
  try {
    const { group } = buildEnemy(shape);
    group.rotation.y = 0.3;
    url = bakeSized(group, 240, null);
  } catch (e) { url = null; }
  cache.set(k, url);
  return url;
}

export function heartIcon3D() {
  if (!init()) return null;
  const k = 'h';
  if (cache.has(k)) return cache.get(k);
  let url = null;
  try {
    const g = new THREE.Group();
    const mat = M(0xe6304a, { metal: 0.2, rough: 0.34, emissive: 0x8a0c20, ei: 0.8, flat: false });
    [-1, 1].forEach((sd) => g.add(mesh(new THREE.SphereGeometry(0.4, 14, 12), mat, sd * 0.3, 0.3, 0)));
    const tip = mesh(new THREE.ConeGeometry(0.62, 0.86, 14), mat, 0, -0.3, 0);
    tip.rotation.z = Math.PI;
    g.add(tip);
    g.add(mesh(new THREE.SphereGeometry(0.12, 8, 6), M(0xffc0cc, { emissive: 0xff8098, ei: 1.2, flat: false }), -0.22, 0.42, 0.3));
    url = bake(g);
  } catch (e) { url = null; }
  cache.set(k, url);
  return url;
}
