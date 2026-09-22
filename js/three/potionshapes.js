// ============================================================
//  물약 3D 형태 — 30개 전부 고유하다.
//
//  물약은 모두 "병" 이라 형태만으로는 금방 섞인다. 그래서 세 가지를 겹쳐 가른다.
//   1) **병 실루엣** — 둥근 플라스크 · 각진 병 · 호리병 · 시험관 · 주머니 …
//   2) **안에 든 것** — 불꽃 · 번개 · 톱니 · 가시 · 날개 …
//   3) **마개와 색** — 코르크 · 금속 · 왕관 뚜껑, 그리고 물약 고유색(def.color)
//
//  각 함수는 물약의 고유색(hex 문자열)을 받아 부품 배열을 돌려준다.
//  부품 적는 법은 js/three/parts3d.js 참고.
// ============================================================
import { P, C, MAT } from './parts3d.js';

const R = Math.PI / 180;
const MET = MAT.metal, SHINY = MAT.shiny, DULL = MAT.dull, SOFT = MAT.soft;
const glow = MAT.glow, glass = MAT.glass;

// 자주 쓰는 마개
const cork = (y) => P.cyl(0.12, 0.15, 0.18, C.wood, { y, ...DULL });
const capMetal = (y, c = C.bronze) => P.cyl(0.15, 0.17, 0.16, c, { y, ...MET });

export const POTION_SHAPE = {
  // ---------------- 일반 ----------------
  blockPotion: (k) => [                                   // 방어 물약 — 방패를 품은 각진 병
    P.box(0.62, 0.66, 0.4, k, { y: -0.18, ...glass(k) }),
    P.cone(0.26, 0.4, k, { y: -0.3, rz: 180 * R, ...glow(k) }),
    P.box(0.3, 0.26, 0.42, k, { y: -0.02, ...glow(k) }),
    P.cyl(0.14, 0.18, 0.26, k, { y: 0.3, ...glass(k) }),
    capMetal(0.5, C.steel),
  ],
  attackPotion: (k) => [                                  // 공격 물약 — 칼날이 잠긴 병
    P.ball(0.42, k, { y: -0.18, sy: 1.05, ...glass(k) }),
    P.cone(0.12, 0.56, k, { y: -0.1, ...glow(k) }),
    P.box(0.26, 0.07, 0.07, k, { y: -0.3, ...glow(k) }),
    P.cyl(0.14, 0.18, 0.3, k, { y: 0.34, ...glass(k) }),
    cork(0.58),
  ],
  skillPotion: (k) => [                                   // 기술 물약 — 톱니가 도는 병
    P.cyl(0.38, 0.42, 0.7, k, { y: -0.18, ...glass(k) }),
    P.torus(0.22, 0.06, k, { y: -0.16, ...glow(k) }),
    ...[0, 90, 180, 270].map((d) => P.box(0.12, 0.06, 0.06, k, {
      x: Math.cos(d * R) * 0.26, y: -0.16 + Math.sin(d * R) * 0.26, rz: d * R, ...glow(k) })),
    P.cyl(0.13, 0.17, 0.26, k, { y: 0.3, ...glass(k) }),
    cork(0.52),
  ],
  powerPotion: (k) => [                                   // 힘 물약 — 별이 갇힌 병
    P.gem(0.46, k, { y: -0.16, sy: 1.2, ...glass(k) }),
    ...[90, 210, 330].map((d) => P.cone(0.1, 0.3, k, {
      x: Math.cos(d * R) * 0.18, y: -0.16 + Math.sin(d * R) * 0.18, rz: (d - 90) * R, ...glow(k) })),
    P.cyl(0.13, 0.16, 0.24, k, { y: 0.36, ...glass(k) }),
    capMetal(0.56, C.gold),
  ],
  colorlessPotion: (k) => [                               // 무색 물약 — 텅 빈 맑은 병
    P.ball(0.4, k, { y: -0.2, sx: 0.9, sz: 0.9, ...glass(k) }),
    P.ball(0.28, k, { y: 0.06, sx: 0.9, sz: 0.9, ...glass(k) }),
    P.cyl(0.12, 0.16, 0.24, k, { y: 0.32, ...glass(k) }),
    P.torus(0.14, 0.035, C.silver, { rx: 90 * R, y: 0.2, ...SHINY }),
    cork(0.52),
  ],
  fearPotion: (k) => [                                    // 공포 물약 — 해골이 비치는 병
    P.ball(0.44, k, { y: -0.18, ...glass(k) }),
    P.ball(0.2, C.bone, { y: -0.12, sz: 0.8, ...SOFT }),
    ...[-1, 1].map((s) => P.ball(0.055, C.void, { x: s * 0.08, y: -0.08, z: 0.16 })),
    P.box(0.2, 0.1, 0.16, C.bone, { y: -0.3, ...SOFT }),
    P.cyl(0.13, 0.17, 0.28, k, { y: 0.32, ...glass(k) }),
    cork(0.54),
  ],
  weakPotion: (k) => [                                    // 약화 물약 — 아래로 꺾인 화살
    P.ball(0.44, k, { y: -0.18, sy: 0.92, ...glass(k) }),
    P.box(0.08, 0.4, 0.08, k, { y: -0.08, ...glow(k) }),
    P.cone(0.18, 0.24, k, { y: -0.38, rz: 180 * R, ...glow(k) }),
    P.cyl(0.13, 0.17, 0.3, k, { y: 0.32, ...glass(k) }),
    cork(0.56),
  ],
  firePotion: (k) => [                                    // 화염 물약 — 목이 긴 화염병
    P.ball(0.4, k, { y: -0.3, ...glass(k) }),
    P.cyl(0.1, 0.16, 0.62, k, { y: 0.16, ...glass(k) }),
    P.cone(0.16, 0.42, C.fire, { y: -0.26, ...glow(C.fire) }),
    P.cone(0.07, 0.2, C.volt, { y: -0.04, ...glow(C.volt) }),
    P.ball(0.1, C.cream, { y: 0.5, ...SOFT }),
  ],
  strengthPotion: (k) => [                                // 힘의 물약 — 근육처럼 부푼 병
    P.ball(0.46, k, { y: -0.22, sx: 1.1, sy: 0.9, ...glass(k) }),
    P.ball(0.3, k, { y: 0.06, sx: 1.15, sy: 0.75, ...glass(k) }),
    P.box(0.5, 0.12, 0.3, k, { y: -0.2, ...glow(k) }),
    P.cyl(0.12, 0.15, 0.2, k, { y: 0.34, ...glass(k) }),
    capMetal(0.52, C.blood),
  ],
  dexterityPotion: (k) => [                               // 민첩 물약 — 날개 달린 호리병
    P.ball(0.34, k, { y: -0.3, ...glass(k) }),
    P.ball(0.26, k, { y: 0.04, ...glass(k) }),
    ...[-1, 1].map((s) => P.ball(0.26, C.frost, {
      x: s * 0.44, y: 0.02, sx: 0.8, sz: 0.12, rz: s * -30 * R, ...glow(C.frost) })),
    P.cyl(0.11, 0.14, 0.2, k, { y: 0.28, ...glass(k) }),
    cork(0.46),
  ],
  energyPotion: (k) => [                                  // 에너지 물약 — 번개가 든 배터리꼴
    P.cyl(0.32, 0.32, 0.84, k, { y: -0.14, ...glass(k) }),
    P.box(0.08, 0.34, 0.06, C.volt, { y: -0.06, rz: 20 * R, ...glow(C.volt) }),
    P.box(0.22, 0.06, 0.06, C.volt, { y: -0.14, rz: -44 * R, ...glow(C.volt) }),
    P.disc(0.34, 0.08, C.bronze, { y: -0.58, rx: 0, ...MET }),
    P.cyl(0.12, 0.12, 0.16, C.copper, { y: 0.38, ...MET }),
  ],
  explosivePotion: (k) => [                               // 폭발 물약 — 심지 달린 둥근 폭탄
    P.ball(0.5, k, { y: -0.14, ...glass(k) }),
    P.rock(0.26, C.ember, { y: -0.12, ...glow(C.ember) }),
    P.cyl(0.13, 0.15, 0.18, C.iron, { y: 0.36, ...MET }),
    P.cyl(0.03, 0.03, 0.3, C.bark, { x: 0.08, y: 0.56, rz: -20 * R }),
    P.ball(0.08, C.fire, { x: 0.16, y: 0.72, ...glow(C.fire) }),
  ],
  swiftPotion: (k) => [                                   // 신속 물약 — 세 갈래 속도선
    P.ball(0.4, k, { y: -0.18, sx: 1.2, sz: 0.85, ...glass(k) }),
    ...[0.06, -0.14, -0.34].map((y, i) => P.box(0.44 - i * 0.1, 0.06, 0.06, C.frost, {
      x: -0.06 + i * 0.05, y, ...glow(C.frost) })),
    P.cyl(0.12, 0.16, 0.28, k, { y: 0.28, ...glass(k) }),
    cork(0.5),
  ],
  bloodPotion: (k) => [                                   // 피의 물약 — 심장 모양 병
    ...[-1, 1].map((s) => P.ball(0.26, k, { x: s * 0.2, y: 0.06, ...glass(k) })),
    P.cone(0.38, 0.6, k, { y: -0.32, rz: 180 * R, ...glass(k) }),
    P.ball(0.14, C.blood, { y: -0.06, ...glow(C.blood) }),
    P.cyl(0.1, 0.13, 0.18, k, { y: 0.32, ...glass(k) }),
    capMetal(0.48, C.darkBlood),
  ],
  blessingOfTheForge: (k) => [                            // 대장간의 축복 — 모루 위 불꽃
    P.box(0.66, 0.24, 0.4, C.iron, { y: -0.42, ...MET }),
    P.box(0.3, 0.2, 0.3, C.iron, { y: -0.2, ...MET }),
    P.ball(0.36, k, { y: 0.16, ...glass(k) }),
    P.cone(0.16, 0.4, C.fire, { y: 0.2, ...glow(C.fire) }),
    P.cyl(0.1, 0.13, 0.16, k, { y: 0.5, ...glass(k) }),
  ],

  // ---------------- 고급 ----------------
  ancientPotion: (k) => [                                 // 고대 물약 — 상형문자 항아리
    P.cyl(0.36, 0.44, 0.74, k, { y: -0.2, ...glass(k) }),
    P.disc(0.4, 0.08, C.gold, { y: -0.56, rx: 0, ...MET }),
    ...[0.0, -0.22].map((y, i) => P.box(0.16 - i * 0.04, 0.05, 0.03, C.gold, { y, z: 0.4, ...glow(C.gold) })),
    P.cyl(0.18, 0.22, 0.2, k, { y: 0.28, ...glass(k) }),
    P.gem(0.16, C.sand, { y: 0.5, ...MET }),
  ],
  distilledChaos: (k) => [                                // 증류된 혼돈 — 뒤틀린 나선 병
    P.ball(0.42, k, { y: -0.2, ...glass(k) }),
    ...[0, 120, 240].map((d, i) => P.torus(0.24 - i * 0.05, 0.04, C.arcane, {
      y: -0.3 + i * 0.2, rx: (70 + i * 14) * R, rz: d * R, ...glow(C.arcane) })),
    P.cyl(0.12, 0.16, 0.3, k, { y: 0.3, rz: 8 * R, ...glass(k) }),
    cork(0.54),
  ],
  liquidBronze: (k) => [                                  // 액체 청동 — 가시 돋친 병
    P.ball(0.42, k, { y: -0.18, ...glass(k) }),
    ...[30, 150, 270].map((d) => P.cone(0.09, 0.3, C.bronze, {
      x: Math.cos(d * R) * 0.42, y: -0.18 + Math.sin(d * R) * 0.42, rz: (d - 90) * R, ...MET })),
    P.cyl(0.13, 0.17, 0.26, k, { y: 0.3, ...glass(k) }),
    capMetal(0.5, C.bronze),
  ],
  liquidMemories: (k) => [                                // 액체 기억 — 책장이 잠긴 병
    P.box(0.56, 0.62, 0.36, k, { y: -0.2, ...glass(k) }),
    ...[-0.1, -0.26].map((y, i) => P.box(0.36, 0.06, 0.24, C.paper, { y, rz: (i ? -6 : 6) * R, ...SOFT })),
    P.ball(0.12, C.frost, { y: 0.06, ...glow(C.frost) }),
    P.cyl(0.13, 0.16, 0.24, k, { y: 0.3, ...glass(k) }),
    cork(0.5),
  ],
  regenPotion: (k) => [                                   // 재생 물약 — 새싹이 자라는 병
    P.ball(0.42, k, { y: -0.2, ...glass(k) }),
    P.cyl(0.04, 0.04, 0.34, C.vine, { y: -0.16 }),
    ...[-1, 1].map((s) => P.ball(0.15, C.leaf, {
      x: s * 0.16, y: 0.0, sz: 0.3, rz: s * -34 * R, ...glow(C.leaf) })),
    P.cyl(0.13, 0.16, 0.26, k, { y: 0.3, ...glass(k) }),
    cork(0.52),
  ],
  gamblersBrew: (k) => [                                  // 도박꾼의 양조주 — 주사위가 든 병
    P.ball(0.44, k, { y: -0.18, ...glass(k) }),
    P.box(0.26, 0.26, 0.26, C.cream, { x: -0.1, y: -0.26, rz: 18 * R, ...SOFT }),
    P.box(0.2, 0.2, 0.2, C.cream, { x: 0.16, y: -0.06, rz: -24 * R, ...SOFT }),
    ...[[-0.1, -0.26], [0.16, -0.06]].map(([x, y]) => P.ball(0.04, C.ink, { x, y, z: 0.16 })),
    P.cyl(0.13, 0.17, 0.26, k, { y: 0.3, ...glass(k) }),
    capMetal(0.5, C.gold),
  ],
  essenceOfSteel: (k) => [                                // 강철의 정수 — 판금을 두른 병
    P.cyl(0.34, 0.38, 0.72, k, { y: -0.2, ...glass(k) }),
    ...[-0.08, -0.34].map((y) => P.torus(0.38, 0.06, C.steel, { rx: 90 * R, y, ...MET })),
    P.box(0.14, 0.62, 0.42, C.steel, { y: -0.2, ...MET }),
    P.cyl(0.13, 0.16, 0.22, k, { y: 0.28, ...glass(k) }),
    capMetal(0.48, C.steel),
  ],
  duplicationPotion: (k) => [                             // 복제 물약 — 겹쳐진 두 병
    P.ball(0.34, k, { x: -0.16, y: -0.22, ...glass(k) }),
    P.cyl(0.11, 0.14, 0.24, k, { x: -0.16, y: 0.14, ...glass(k) }),
    P.ball(0.34, k, { x: 0.18, y: -0.14, z: -0.12, opacity: 0.55, flat: false, emit: k, ei: 0.5 }),
    P.cyl(0.11, 0.14, 0.24, k, { x: 0.18, y: 0.22, z: -0.12, opacity: 0.55, flat: false }),
    cork(0.34),
  ],

  // ---------------- 희귀 ----------------
  fruitJuice: (k) => [                                    // 과일 주스 — 빨대 꽂은 잔
    P.cyl(0.3, 0.38, 0.8, k, { y: -0.18, ...glass(k) }),
    P.cyl(0.03, 0.03, 0.8, C.cream, { x: 0.12, y: 0.24, rz: -14 * R }),
    P.ball(0.16, C.berry, { x: -0.26, y: 0.22, ...SOFT }),
    P.ball(0.14, C.leaf, { x: -0.3, y: 0.38, sz: 0.25, rz: 30 * R, ...SOFT }),
    P.disc(0.4, 0.06, C.cream, { y: 0.2, rx: 0, opacity: 0.6, flat: false }),
  ],
  fairyInABottle: (k) => [                                // 병 속의 요정
    P.ball(0.44, k, { y: -0.16, ...glass(k) }),
    P.ball(0.11, C.holy, { y: -0.14, ...glow(C.holy) }),
    ...[-1, 1].map((s) => P.ball(0.16, C.frost, {
      x: s * 0.16, y: -0.04, sx: 0.7, sz: 0.1, rz: s * -40 * R, ...glow(C.frost) })),
    ...[[-0.24, -0.3], [0.22, -0.34], [0.05, 0.08]].map(([x, y]) => P.ball(0.035, C.volt, { x, y, z: 0.22, ...glow(C.volt) })),
    P.cyl(0.13, 0.16, 0.26, k, { y: 0.32, ...glass(k) }),
    cork(0.54),
  ],
  smokeBomb: (k) => [                                     // 연막탄
    P.cyl(0.32, 0.34, 0.5, k, { y: -0.34, ...MET }),
    P.torus(0.33, 0.05, C.dark, { rx: 90 * R, y: -0.34 }),
    P.cyl(0.14, 0.14, 0.14, C.iron, { y: -0.02, ...MET }),
    P.torus(0.1, 0.03, C.iron, { x: 0.18, y: 0.06, ...MET }),
    ...[0.24, 0.46, 0.64].map((y, i) => P.ball(0.24 - i * 0.04, C.steel, {
      x: (i % 2 ? 0.14 : -0.1), y, opacity: 0.4, flat: false })),
  ],
  snecko: (k) => [                                        // 스네코 기름 — 뱀이 감긴 병
    P.ball(0.42, k, { y: -0.2, ...glass(k) }),
    ...[0, 1, 2].map((i) => P.torus(0.4 - i * 0.07, 0.055, C.leaf, {
      y: -0.42 + i * 0.26, rx: 78 * R, ...SOFT })),
    P.ball(0.13, C.leaf, { x: 0.24, y: 0.22, sz: 1.3, ...SOFT }),
    P.ball(0.045, C.mango, { x: 0.32, y: 0.26, z: 0.1, ...glow(C.mango) }),
    P.cyl(0.12, 0.15, 0.22, k, { y: 0.28, ...glass(k) }),
  ],
  entropicBrew: (k) => [                                  // 무질서한 양조주 — 작은 병 세 개
    P.ball(0.26, C.ruby, { x: -0.34, y: -0.3, ...glass(C.ruby) }),
    P.ball(0.26, C.jade, { x: 0.3, y: -0.32, ...glass(C.jade) }),
    P.ball(0.3, k, { y: 0.06, ...glass(k) }),
    ...[[-0.34, -0.02], [0.3, -0.04], [0, 0.36]].map(([x, y]) => P.cyl(0.08, 0.1, 0.16, C.wood, { x, y, ...DULL })),
    P.ball(0.07, C.holy, { y: 0.52, ...glow(C.holy) }),
  ],
  cultistPotion: (k) => [                                 // 광신도 물약 — 눈이 뜬 병
    P.ball(0.44, k, { y: -0.16, sz: 0.88, ...glass(k) }),
    P.ball(0.2, C.cream, { y: -0.14, z: 0.2, sy: 0.6, ...SOFT }),
    P.ball(0.1, C.arcane, { y: -0.14, z: 0.3, ...glow(C.arcane) }),
    P.ball(0.05, C.void, { y: -0.14, z: 0.36 }),
    P.cyl(0.13, 0.17, 0.28, k, { y: 0.32, ...glass(k) }),
    capMetal(0.54, C.rune),
  ],
  heartOfIron: (k) => [                                   // 무쇠 심장
    ...[-1, 1].map((s) => P.ball(0.28, C.iron, { x: s * 0.2, y: 0.12, ...MET })),
    P.cone(0.4, 0.66, C.iron, { y: -0.28, rz: 180 * R, ...MET }),
    ...[0.2, -0.02, -0.24].map((y, i) => P.box(0.6 - i * 0.12, 0.05, 0.5, C.steel, { y, ...SHINY })),
    P.ball(0.12, k, { y: 0.02, z: 0.26, ...glow(k) }),
    P.cyl(0.07, 0.09, 0.18, C.copper, { y: 0.44, ...MET }),
  ],
};
