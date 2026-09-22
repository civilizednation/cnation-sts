// ============================================================
//  유물 3D 형태 — 117개 전부 고유하다.
//
//  익숙해지면 이름을 읽기 전에 모양으로 알아보게 하는 것이 목적이다.
//  그래서 두 가지를 지킨다.
//   1) **겹치지 않는다** — tools/check-icons.mjs 가 부품 배열을 견줘 검사한다
//   2) **이름과 뜻이 보인다** — 닻은 닻처럼, 딸기는 딸기처럼. 색도 뜻에 맞춘다
//      (얼어붙은 알은 얼음색, 녹아내린 알은 용암색, 유독성 알은 독색)
//
//  부품 적는 법은 js/three/parts3d.js 참고.
//  Y 는 위, Z 는 카메라 쪽. 원기둥·캡슐은 Y 축, 뿔은 +Y 를 향한다.
//  고리(torus)는 XY 평면이라 그대로 두면 정면을 본다.
// ============================================================
import { P, C, MAT } from './parts3d.js';

const R = Math.PI / 180;
const MET = MAT.metal, SHINY = MAT.shiny, DULL = MAT.dull, SOFT = MAT.soft;
const glow = MAT.glow, glass = MAT.glass;

export const RELIC_SHAPE = {
  // ---------------- 시작 유물 ----------------
  burningBlood: () => [                                   // 작열하는 피 — 핏방울이 타오른다
    P.ball(0.44, C.blood, { y: -0.18, sy: 1.05, ...SOFT }),
    P.cone(0.34, 0.66, C.blood, { y: 0.28, ...SOFT }),
    P.cone(0.2, 0.5, C.fire, { y: 0.66, ...glow(C.fire) }),
    P.cone(0.1, 0.3, C.volt, { y: 0.9, ...glow(C.volt) }),
  ],
  blackBlood: () => [                                     // 검은 피 — 식은 피와 검은 불
    P.ball(0.44, C.darkBlood, { y: -0.18, sy: 1.05, ...SOFT }),
    P.cone(0.34, 0.66, C.darkBlood, { y: 0.28, ...SOFT }),
    P.cone(0.22, 0.54, C.shadow, { y: 0.68, ...glow(C.arcane) }),
    P.ball(0.1, C.arcane, { y: 0.95, ...glow(C.arcane) }),
  ],
  ringOfTheSnake: () => [                                 // 뱀의 반지 — 반지를 감고 고개를 든 뱀
    P.torus(0.46, 0.1, C.emerald, { ...SHINY }),
    ...[200, 250, 300].map((d, i) => P.ball(0.13 + i * 0.015, C.leaf, {
      x: Math.cos(d * R) * 0.46, y: Math.sin(d * R) * 0.46, ...SOFT })),
    P.ball(0.24, C.leaf, { x: 0.44, y: 0.34, sz: 1.3, sy: 0.8, ...SOFT }),
    ...[-1, 1].map((s) => P.ball(0.06, C.volt, { x: 0.5, y: 0.42, z: s * 0.13, ...glow(C.volt) })),
    P.cone(0.05, 0.2, C.bone, { x: 0.5, y: 0.14, rz: 176 * R }),
  ],
  crackedCore: () => [                                    // 금 간 핵 — 갈라진 구체에서 번개
    P.ball(0.52, C.steel, { ...MET }),
    P.box(0.08, 1.06, 0.08, C.volt, { rz: 14 * R, ...glow(C.volt) }),
    P.box(0.9, 0.07, 0.07, C.volt, { rz: -34 * R, ...glow(C.volt) }),
    P.ball(0.16, C.volt, { z: 0.44, ...glow(C.volt) }),
  ],
  pureWater: () => [                                      // 순수한 물 — 물방울에 두른 후광
    P.ball(0.38, C.glass, { y: -0.14, ...glass(C.water) }),
    P.cone(0.3, 0.56, C.glass, { y: 0.3, ...glass(C.water) }),
    P.torus(0.62, 0.045, C.holy, { rx: 78 * R, y: 0.34, ...glow(C.holy) }),
  ],

  // ---------------- 일반 ----------------
  akabeko: () => [                                        // 아카베코 — 붉은 소
    P.ball(0.44, C.blood, { y: -0.05, sx: 1.35, sy: 0.85, ...SOFT }),
    P.ball(0.28, C.blood, { x: -0.52, y: 0.2, ...SOFT }),
    P.cone(0.09, 0.26, C.bone, { x: -0.64, y: 0.46, rz: 28 * R }),
    P.cone(0.09, 0.26, C.bone, { x: -0.38, y: 0.46, rz: -28 * R }),
    P.ball(0.09, C.cream, { x: 0.2, y: 0.2, z: 0.36 }),
    P.ball(0.07, C.cream, { x: 0.5, y: -0.1, z: 0.32 }),
  ],
  anchor: () => [                                         // 닻 — 위에 고리, 아래로 갈고리 두 갈래
    P.torus(0.19, 0.06, C.iron, { y: 0.74, ...MET }),
    P.cyl(0.08, 0.08, 1.3, C.iron, { y: -0.06, ...MET }),
    P.box(0.96, 0.13, 0.13, C.iron, { y: 0.4, ...MET }),
    ...[-1, 1].map((s) => P.ball(0.08, C.bronze, { x: s * 0.48, y: 0.4, ...MET })),
    ...[-1, 1].map((s) => P.cyl(0.1, 0.1, 0.5, C.iron, { x: s * 0.26, y: -0.56, rz: s * 58 * R, ...MET })),
    ...[-1, 1].map((s) => P.cone(0.18, 0.4, C.iron, { x: s * 0.52, y: -0.5, rz: s * 34 * R, ...MET })),
  ],
  ancientTeaSet: () => [                                  // 고대 다기 — 찻주전자
    P.ball(0.44, C.clay, { y: -0.06, sy: 0.82, ...SOFT }),
    P.cyl(0.26, 0.3, 0.12, C.clay, { y: 0.32 }),
    P.ball(0.1, C.gold, { y: 0.46, ...MET }),
    P.cyl(0.06, 0.1, 0.44, C.clay, { x: 0.46, y: 0.16, rz: -36 * R }),
    P.torus(0.2, 0.05, C.clay, { x: -0.52, y: 0.02, ry: 90 * R }),
  ],
  artOfWar: () => [                                       // 전쟁의 기술 — 병법 두루마리
    P.cyl(0.3, 0.3, 0.9, C.paper, { rz: 90 * R, ...SOFT }),
    P.cyl(0.11, 0.11, 1.1, C.wood, { rz: 90 * R }),
    P.ball(0.13, C.gold, { x: 0.56, ...MET }),
    P.ball(0.13, C.gold, { x: -0.56, ...MET }),
    P.box(0.5, 0.06, 0.02, C.ink, { y: 0.14, z: 0.31 }),
  ],
  bagOfMarbles: () => [                                   // 구슬 주머니
    P.ball(0.46, C.leather, { y: -0.14, sy: 0.92, ...SOFT }),
    P.cyl(0.16, 0.24, 0.24, C.leather, { y: 0.34 }),
    P.torus(0.17, 0.04, C.cloth, { rx: 90 * R, y: 0.4 }),
    P.ball(0.15, C.sapphire, { x: -0.26, y: 0.6, ...SHINY }),
    P.ball(0.13, C.ruby, { x: 0.08, y: 0.68, ...SHINY }),
    P.ball(0.12, C.jade, { x: 0.32, y: 0.56, ...SHINY }),
  ],
  bagOfPreparation: () => [                               // 준비 가방
    P.box(0.86, 0.6, 0.44, C.leather, { y: -0.12 }),
    P.box(0.9, 0.2, 0.48, C.bark, { y: 0.24 }),
    P.torus(0.24, 0.05, C.leather, { y: 0.5, sy: 0.6 }),
    P.box(0.16, 0.24, 0.06, C.gold, { y: -0.1, z: 0.24, ...MET }),
  ],
  bloodVial: () => [                                      // 피 약병
    P.cyl(0.22, 0.26, 0.62, C.glass, { y: -0.14, ...glass(C.blood) }),
    P.ball(0.24, C.blood, { y: -0.26, sy: 0.7, ...glow(C.blood) }),
    P.cyl(0.13, 0.13, 0.2, C.glass, { y: 0.28, ...glass(C.glass) }),
    P.cyl(0.12, 0.14, 0.16, C.wood, { y: 0.46, ...DULL }),
  ],
  bronzeScales: () => [                                   // 청동 비늘
    P.ball(0.3, C.bronze, { x: -0.24, y: 0.2, sz: 0.35, ...MET }),
    P.ball(0.3, C.bronze, { x: 0.24, y: 0.2, sz: 0.35, ...MET }),
    P.ball(0.3, C.bronze, { y: -0.16, sz: 0.35, ...MET }),
    P.ball(0.3, C.copper, { x: -0.24, y: -0.52, sz: 0.35, ...MET }),
    P.ball(0.3, C.copper, { x: 0.24, y: -0.52, sz: 0.35, ...MET }),
  ],
  centennialPuzzle: () => [                               // 100년 퍼즐 — 퍼즐 조각
    P.box(0.74, 0.74, 0.18, C.arcane, { ...SOFT }),
    P.ball(0.17, C.arcane, { x: 0.44, ...SOFT }),
    P.ball(0.17, C.void, { y: 0.44, ...SOFT }),
    P.box(0.3, 0.3, 0.2, C.holy, { z: 0.02, ...glow(C.holy) }),
  ],
  ceramicFish: () => [                                    // 도자기 물고기
    P.ball(0.4, C.water, { sx: 1.3, sy: 0.85, ...SOFT }),
    P.cone(0.3, 0.44, C.water, { x: -0.58, rz: 90 * R, ...SOFT }),
    P.cone(0.18, 0.3, C.sapphire, { y: 0.3, ...SOFT }),
    P.ball(0.07, C.cream, { x: 0.32, y: 0.1, z: 0.26 }),
    P.ball(0.04, C.ink, { x: 0.36, y: 0.1, z: 0.32 }),
  ],
  dreamCatcher: () => [                                   // 꿈 수집가 — 그물 고리 + 깃털
    P.torus(0.48, 0.06, C.wood, { y: 0.16 }),
    P.box(0.9, 0.035, 0.035, C.cloth, { y: 0.16, rz: 32 * R }),
    P.box(0.9, 0.035, 0.035, C.cloth, { y: 0.16, rz: -32 * R }),
    P.ball(0.08, C.arcane, { y: 0.16, ...glow(C.arcane) }),
    P.cone(0.1, 0.44, C.cream, { y: -0.52, rz: 180 * R, ...SOFT }),
  ],
  happyFlower: () => [                                    // 행복한 꽃
    ...[0, 72, 144, 216, 288].map((d) => P.ball(0.24, C.cloth, {
      x: Math.cos(d * R) * 0.42, y: Math.sin(d * R) * 0.42, sz: 0.45, ...SOFT })),
    P.ball(0.22, C.volt, { z: 0.1, ...glow(C.volt) }),
    P.cyl(0.05, 0.05, 0.5, C.vine, { y: -0.68 }),
  ],
  juzuBracelet: () => [                                   // 염주 팔찌
    ...[0, 45, 90, 135, 180, 225, 270, 315].map((d) => P.ball(0.15, C.bark, {
      x: Math.cos(d * R) * 0.5, y: Math.sin(d * R) * 0.5, ...SOFT })),
    P.ball(0.19, C.gold, { y: 0.66, ...MET }),
  ],
  lantern: () => [                                        // 등불
    P.box(0.54, 0.62, 0.54, C.volt, { ...glow(C.volt) }),
    P.box(0.66, 0.1, 0.66, C.dark, { y: 0.36 }),
    P.box(0.62, 0.1, 0.62, C.dark, { y: -0.36 }),
    P.cyl(0.05, 0.05, 0.2, C.dark, { y: 0.5 }),
    P.torus(0.16, 0.04, C.iron, { y: 0.68, ...MET }),
  ],
  mawBank: () => [                                        // 아귀 은행 — 이빨을 드러낸 저금통
    P.box(0.84, 0.66, 0.6, C.iron, { y: -0.1, ...MET }),
    P.box(0.86, 0.14, 0.62, C.bronze, { y: -0.48, ...MET }),
    P.box(0.62, 0.3, 0.12, C.void, { y: 0.16, z: 0.3 }),
    ...[-0.2, 0, 0.2].map((x) => P.cone(0.09, 0.24, C.bone, { x, y: 0.22, z: 0.32, rz: 180 * R })),
    ...[-0.1, 0.1].map((x) => P.cone(0.08, 0.2, C.bone, { x, y: 0.06, z: 0.32 })),
    P.disc(0.19, 0.05, C.gold, { x: 0.1, y: 0.56, rx: 0, rz: 24 * R, ...MET }),
  ],
  mealTicket: () => [                                     // 식권
    P.box(0.92, 0.5, 0.06, C.paper, { rz: -8 * R, ...SOFT }),
    P.box(0.06, 0.5, 0.08, C.cloth, { x: 0.22, rz: -8 * R }),
    P.ball(0.07, C.heart, { x: -0.24, y: 0.06, z: 0.06, rz: -8 * R }),
    P.box(0.34, 0.06, 0.08, C.ink, { x: -0.24, y: -0.12, z: 0.04, rz: -8 * R }),
  ],
  nunchaku: () => [                                       // 쌍절곤 — 막대 둘을 사슬이 잇는다
    P.cyl(0.12, 0.12, 0.9, C.bark, { x: -0.3, y: -0.2, rz: 6 * R }),
    P.cyl(0.12, 0.12, 0.9, C.bark, { x: 0.3, y: -0.2, rz: -6 * R }),
    ...[-1, 1].map((s) => P.disc(0.13, 0.06, C.gold, { x: s * 0.33, y: 0.24, rx: 0, ...MET })),
    ...[-1, 1].map((s) => P.disc(0.13, 0.06, C.gold, { x: s * 0.27, y: -0.64, rx: 0, ...MET })),
    ...[-0.2, 0, 0.2].map((x, i) => P.torus(0.09, 0.03, C.silver, {
      x, y: 0.42 - (i === 1 ? 0.06 : 0), rx: (i % 2 ? 0 : 90) * R, ...MET })),
  ],
  oddlySmoothStone: () => [                               // 매끄러운 돌 — 닳고 닳아 반들반들하다
    P.ball(0.58, C.stone, { sy: 0.78, sz: 0.86, flat: false, rough: 0.12, metal: 0.2 }),
    P.ball(0.16, C.cream, { x: -0.2, y: 0.24, z: 0.42, flat: false, rough: 0.05, opacity: 0.5 }),
    P.ball(0.07, C.cream, { x: 0.26, y: -0.08, z: 0.44, flat: false, rough: 0.05, opacity: 0.35 }),
    P.torus(0.5, 0.03, C.steel, { rx: 80 * R, y: -0.3, sy: 0.9, flat: false, metal: 0.5, opacity: 0.4 }),
  ],
  omamori: () => [                                        // 부적 — 비단 주머니와 매듭 끈
    P.box(0.54, 0.8, 0.22, C.rune, { y: -0.12, ...SOFT }),
    P.box(0.58, 0.16, 0.24, C.amethyst, { y: 0.3, ...SOFT }),
    P.box(0.44, 0.1, 0.25, C.gold, { y: 0.06, ...MET }),
    ...[-1, 1].map((s) => P.cyl(0.022, 0.022, 0.34, C.holy, { x: s * 0.1, y: 0.52, rz: s * -16 * R })),
    P.ball(0.1, C.holy, { y: 0.68, sy: 0.7, ...glow(C.holy) }),
    ...[-1, 1].map((s) => P.cone(0.06, 0.2, C.blood, { x: s * 0.16, y: -0.62, rz: 180 * R, ...SOFT })),
  ],
  penNib: () => [                                         // 펜촉 — 각진 어깨에서 좁아지고, 앞면에 숨구멍과 틈
    P.box(0.5, 0.3, 0.1, C.gold, { y: 0.4, ...SHINY }),
    ...[-1, 1].map((s) => P.box(0.26, 0.4, 0.1, C.gold, { x: s * 0.17, y: 0.14, rz: s * 22 * R, ...SHINY })),
    P.cone(0.26, 0.74, C.gold, { y: -0.3, rz: 180 * R, sz: 0.38, ...SHINY }),
    P.cyl(0.11, 0.11, 0.14, C.void, { y: 0.2, z: 0.06, rx: 90 * R }),
    P.box(0.07, 0.64, 0.08, C.void, { y: -0.16, z: 0.07 }),
    P.ball(0.06, C.ink, { y: -0.66, ...glow(C.ink) }),
  ],
  potionBelt: () => [                                     // 물약 벨트
    P.box(1.2, 0.2, 0.2, C.leather, { y: 0.34 }),
    P.box(0.18, 0.26, 0.24, C.gold, { y: 0.34, ...MET }),
    ...[[-0.4, C.ruby], [0, C.jade], [0.4, C.sapphire]].map(([x, c]) => P.cyl(0.11, 0.14, 0.4, c, { x, y: -0.06, ...glass(c) })),
    ...[-0.4, 0, 0.4].map((x) => P.cyl(0.08, 0.08, 0.12, C.wood, { x, y: 0.2 })),
  ],
  preservedInsect: () => [                                // 보존된 곤충 — 호박 속
    P.gem(0.62, C.mango, { sy: 1.15, ...glass(C.mango) }),
    P.ball(0.15, C.dark, { y: 0.06, sx: 0.7, sz: 0.7 }),
    P.ball(0.1, C.dark, { y: -0.14 }),
    ...[-1, 1].map((s) => P.box(0.3, 0.03, 0.03, C.dark, { x: s * 0.16, y: 0.04, rz: s * 22 * R })),
  ],
  regalPillow: () => [                                    // 고급 베개
    P.ball(0.52, C.cloth2, { sx: 1.25, sy: 0.72, sz: 0.85, ...SOFT }),
    P.box(1.2, 0.06, 0.06, C.gold, { y: 0.2, ...MET }),
    ...[-1, 1].map((s) => P.ball(0.09, C.gold, { x: s * 0.66, y: -0.3, ...MET })),
  ],
  smilingMask: () => [                                    // 웃는 가면
    P.ball(0.56, C.cream, { sz: 0.5, sy: 1.08, ...SOFT }),
    P.ball(0.1, C.ink, { x: -0.2, y: 0.18, z: 0.26, sy: 0.55 }),
    P.ball(0.1, C.ink, { x: 0.2, y: 0.18, z: 0.26, sy: 0.55 }),
    P.torus(0.26, 0.05, C.ink, { y: 0.02, z: 0.22, sy: 0.55 }),
    P.box(0.5, 0.2, 0.06, C.cream, { y: 0.12, z: 0.3 }),
  ],
  strawberry: () => [                                     // 딸기
    P.cone(0.44, 0.86, C.berry, { y: -0.14, rz: 180 * R, ...SOFT }),
    ...[0, 72, 144, 216, 288].map((d) => P.cone(0.13, 0.26, C.leaf, {
      x: Math.cos(d * R) * 0.22, z: Math.sin(d * R) * 0.22, y: 0.34, rz: 24 * R })),
    P.cyl(0.05, 0.05, 0.22, C.vine, { y: 0.52 }),
    ...[[-0.16, -0.1], [0.14, -0.06], [0, -0.34]].map(([x, y]) => P.ball(0.04, C.volt, { x, y, z: 0.34 })),
  ],
  theBoot: () => [                                        // 부츠
    P.box(0.4, 0.74, 0.4, C.leather, { y: 0.16 }),
    P.box(0.44, 0.22, 0.86, C.leather, { y: -0.3, z: 0.2 }),
    P.box(0.48, 0.12, 0.92, C.dark, { y: -0.44, z: 0.2 }),
    P.box(0.44, 0.1, 0.44, C.bronze, { y: 0.5, ...MET }),
  ],
  tinyChest: () => [                                      // 작은 상자
    P.box(0.86, 0.44, 0.56, C.wood),
    P.ball(0.44, C.bark, { y: 0.22, sy: 0.55, sx: 0.98, sz: 0.64 }),
    P.box(0.9, 0.08, 0.6, C.gold, { y: 0.22, ...MET }),
    P.box(0.18, 0.24, 0.62, C.gold, { y: 0.12, ...MET }),
    P.ball(0.07, C.volt, { y: 0.06, z: 0.32, ...glow(C.volt) }),
  ],
  vajra: () => [                                          // 금강저 — 가운데를 쥐고 양끝이 갈라진다
    P.cyl(0.15, 0.15, 0.44, C.gold, { ...MET }),
    ...[-0.24, 0, 0.24].map((y) => P.torus(0.16, 0.035, C.oldGold, { rx: 90 * R, y, ...MET })),
    ...[-1, 1].flatMap((s) => [
      P.ball(0.19, C.gold, { y: s * 0.36, sy: 0.8, ...MET }),
      P.cone(0.08, 0.36, C.gold, { y: s * 0.68, rz: s > 0 ? 0 : 180 * R, ...MET }),
      ...[-1, 1].map((d) => P.cone(0.06, 0.32, C.oldGold, {
        x: d * 0.19, y: s * 0.62, rz: (s * d * -26) * R, ...MET })),
    ]),
  ],
  warPaint: () => [                                       // 전쟁 물감 — 물감통과 붓
    P.cyl(0.32, 0.36, 0.5, C.bronze, { y: -0.34, ...MET }),
    P.cyl(0.3, 0.3, 0.12, C.blood, { y: -0.06, ...glow(C.blood) }),
    P.cyl(0.05, 0.05, 0.86, C.wood, { x: 0.22, y: 0.36, rz: -14 * R }),
    P.cone(0.12, 0.3, C.blood, { x: 0.36, y: 0.82, rz: -14 * R, ...SOFT }),
  ],
  whetstone: () => [                                      // 숫돌
    P.box(0.92, 0.26, 0.4, C.stone, { y: -0.3, rz: -6 * R }),
    P.box(0.86, 0.06, 0.16, C.silver, { y: 0.06, rz: 10 * R, ...SHINY }),
    P.cone(0.12, 0.26, C.silver, { x: 0.5, y: 0.16, rz: -72 * R, ...SHINY }),
    P.box(0.2, 0.1, 0.12, C.wood, { x: -0.48, y: -0.02, rz: 10 * R }),
  ],
  redSkull: () => [                                       // 붉은 해골
    P.ball(0.48, C.blood, { y: 0.14, sz: 0.9, ...SOFT }),
    P.box(0.52, 0.24, 0.5, C.blood, { y: -0.3 }),
    ...[-1, 1].map((s) => P.ball(0.13, C.void, { x: s * 0.2, y: 0.2, z: 0.3 })),
    P.cone(0.09, 0.16, C.blood, { y: -0.02, z: 0.34, rz: 180 * R }),
    ...[-0.14, 0, 0.14].map((x) => P.box(0.06, 0.16, 0.06, C.void, { x, y: -0.32, z: 0.26 })),
  ],
  dataDisk: () => [                                       // 자료 디스크
    P.disc(0.6, 0.1, C.steel, { ...SHINY }),
    P.disc(0.42, 0.13, C.sapphire, { ...glow(C.sapphire) }),
    P.disc(0.14, 0.16, C.dark),
    ...[0, 90, 180, 270].map((d) => P.box(0.26, 0.05, 0.02, C.volt, {
      x: Math.cos(d * R) * 0.3, y: Math.sin(d * R) * 0.3, z: 0.09, rz: d * R, ...glow(C.volt) })),
  ],
  damaru: () => [                                         // 다마루 — 모래시계 모양 손북
    P.cyl(0.34, 0.16, 0.34, C.wood, { y: 0.2 }),
    P.cyl(0.16, 0.34, 0.34, C.wood, { y: -0.2 }),
    P.disc(0.34, 0.06, C.cream, { y: 0.36, rx: 0 }),
    P.disc(0.34, 0.06, C.cream, { y: -0.36, rx: 0 }),
    P.cyl(0.02, 0.02, 0.5, C.cloth, { x: 0.36, rz: 90 * R }),
    P.ball(0.09, C.gold, { x: 0.6, ...MET }),
  ],
  // ---------------- 고급 ----------------
  blueCandle: () => [                                     // 파란 양초 — 저주를 태운다
    P.cyl(0.19, 0.21, 0.96, C.cloth2, { y: -0.16, ...SOFT }),
    P.cyl(0.02, 0.02, 0.12, C.dark, { y: 0.38 }),
    P.cone(0.13, 0.34, C.ice, { y: 0.56, ...glow(C.ice) }),
    P.ball(0.06, C.frost, { y: 0.74, ...glow(C.frost) }),
    P.disc(0.3, 0.06, C.bronze, { y: -0.66, rx: 0, ...MET }),
  ],
  bottledFlame: () => [                                   // 병에 담긴 화염
    P.ball(0.42, C.glass, { y: -0.1, ...glass(C.fire) }),
    P.cone(0.16, 0.42, C.fire, { y: -0.04, ...glow(C.fire) }),
    P.cone(0.08, 0.22, C.volt, { y: 0.18, ...glow(C.volt) }),
    P.cyl(0.14, 0.18, 0.28, C.glass, { y: 0.42, ...glass(C.glass) }),
    P.cyl(0.13, 0.15, 0.16, C.wood, { y: 0.62, ...DULL }),
  ],
  bottledLightning: () => [                               // 병에 담긴 번개
    P.ball(0.42, C.glass, { y: -0.1, ...glass(C.volt) }),
    P.box(0.07, 0.34, 0.07, C.volt, { y: -0.04, rz: 22 * R, ...glow(C.volt) }),
    P.box(0.26, 0.06, 0.06, C.volt, { y: -0.1, rz: -46 * R, ...glow(C.volt) }),
    P.cyl(0.14, 0.18, 0.28, C.glass, { y: 0.42, ...glass(C.glass) }),
    P.cyl(0.13, 0.15, 0.16, C.steel, { y: 0.62, ...MET }),
  ],
  bottledTornado: () => [                                 // 병에 담긴 폭풍
    P.ball(0.42, C.glass, { y: -0.1, ...glass(C.storm) }),
    P.cone(0.26, 0.5, C.storm, { y: -0.12, rz: 180 * R, ...glow(C.storm) }),
    P.torus(0.2, 0.035, C.frost, { rx: 74 * R, y: 0.02, ...glow(C.frost) }),
    P.cyl(0.14, 0.18, 0.28, C.glass, { y: 0.42, ...glass(C.glass) }),
    P.cyl(0.13, 0.15, 0.16, C.leather, { y: 0.62, ...DULL }),
  ],
  darkstonePeriapt: () => [                               // 흑요석 목걸이
    P.torus(0.5, 0.045, C.dark, { y: 0.22, sy: 0.78 }),
    P.gem(0.3, C.obsidian, { y: -0.34, sy: 1.5, ...SHINY }),
    P.ball(0.1, C.arcane, { y: -0.3, z: 0.18, ...glow(C.arcane) }),
    P.cyl(0.07, 0.1, 0.14, C.silver, { y: -0.04, ...MET }),
  ],
  eternalFeather: () => [                                 // 영원한 깃털
    P.cyl(0.035, 0.02, 1.28, C.cream, { rz: -12 * R }),
    ...[0.36, 0.14, -0.08, -0.3].map((y, i) => P.ball(0.3 - i * 0.045, C.holy, {
      x: -0.16 - i * 0.02, y, sx: 0.95, sz: 0.16, rz: 34 * R, ...SOFT })),
    ...[0.36, 0.14, -0.08, -0.3].map((y, i) => P.ball(0.3 - i * 0.045, C.holy, {
      x: 0.1 - i * 0.02, y, sx: 0.95, sz: 0.16, rz: -34 * R, ...SOFT })),
  ],
  frozenEgg: () => [                                      // 얼어붙은 알 — 서리 결정이 돋았다
    P.ball(0.46, C.frost, { sy: 1.24, ...glass(C.ice) }),
    ...[30, 150, 270].map((d) => P.cone(0.08, 0.34, C.ice, {
      x: Math.cos(d * R) * 0.36, y: Math.sin(d * R) * 0.42, rz: (90 - d) * R, ...glow(C.ice) })),
    P.gem(0.12, C.frost, { y: 0.52, ...glow(C.frost) }),
  ],
  moltenEgg: () => [                                      // 녹아내린 알 — 용암이 흘러내린다
    P.ball(0.46, C.dark, { sy: 1.24, ...SOFT }),
    P.ball(0.3, C.ember, { y: 0.12, sy: 1.2, sz: 0.5, ...glow(C.ember) }),
    P.cyl(0.05, 0.02, 0.4, C.fire, { x: -0.2, y: -0.3, rz: 10 * R, ...glow(C.fire) }),
    P.cyl(0.04, 0.02, 0.28, C.fire, { x: 0.22, y: -0.34, rz: -14 * R, ...glow(C.fire) }),
    P.ball(0.07, C.volt, { y: 0.5, ...glow(C.volt) }),
  ],
  toxicEgg: () => [                                       // 유독성 알 — 독액이 맺혔다
    P.ball(0.46, C.toxic, { sy: 1.24, ...SOFT }),
    P.ball(0.13, C.poison, { x: -0.22, y: 0.2, z: 0.3, ...glow(C.poison) }),
    P.ball(0.1, C.poison, { x: 0.24, y: -0.06, z: 0.3, ...glow(C.poison) }),
    P.cone(0.09, 0.26, C.poison, { y: -0.6, rz: 180 * R, ...glow(C.poison) }),
    P.ball(0.07, C.void, { y: 0.42, z: 0.28 }),
  ],
  gremlinHorn: () => [                                    // 그렘린 뿔
    P.cone(0.24, 1.0, C.bone, { y: 0.1, rz: 16 * R }),
    P.cone(0.17, 0.62, C.bone, { x: 0.08, y: 0.38, rz: 28 * R }),
    ...[0.32, 0.02, -0.28].map((y, i) => P.torus(0.2 - i * 0.03, 0.045, C.stone, {
      x: 0.14 - i * 0.06, y, rx: 84 * R, rz: 16 * R })),
    P.ball(0.15, C.leaf, { y: -0.58, sy: 0.7 }),
  ],
  hornCleat: () => [                                      // 뿔 장식 — 바닥에 못이 박힌 신발 징
    P.box(0.78, 0.16, 0.52, C.iron, { y: 0.3, ...MET }),
    P.box(0.62, 0.1, 0.42, C.bronze, { y: 0.42, ...MET }),
    ...[-0.26, 0, 0.26].map((x) => P.cone(0.11, 0.42, C.steel, { x, y: -0.02, rz: 180 * R, ...SHINY })),
    ...[-0.13, 0.13].map((x) => P.cone(0.09, 0.32, C.steel, { x, y: 0.02, z: 0.2, rz: 180 * R, ...SHINY })),
    ...[-1, 1].map((s) => P.ball(0.06, C.gold, { x: s * 0.32, y: 0.46, ...MET })),
  ],
  inkBottle: () => [                                      // 잉크병 + 깃펜
    P.box(0.56, 0.5, 0.56, C.glass, { y: -0.3, ...glass(C.ink) }),
    P.cyl(0.14, 0.18, 0.18, C.dark, { y: 0.02 }),
    P.cyl(0.03, 0.015, 0.9, C.cream, { x: 0.22, y: 0.42, rz: -20 * R }),
    ...[0.24, 0.48, 0.68].map((y, i) => P.ball(0.17 - i * 0.03, C.paper, {
      x: 0.12 + i * 0.09, y: y + 0.08, sz: 0.14, rz: -56 * R, ...SOFT })),
  ],
  kunai: () => [                                          // 쿠나이
    P.gem(0.3, C.steel, { y: 0.34, sy: 2.0, sz: 0.3, ...SHINY }),
    P.cyl(0.07, 0.07, 0.5, C.leather, { y: -0.36 }),
    P.torus(0.14, 0.04, C.iron, { y: -0.72, ...MET }),
    P.box(0.34, 0.06, 0.1, C.iron, { y: -0.08, ...MET }),
  ],
  shuriken: () => [                                       // 수리검
    ...[45, 135, 225, 315].map((d) => P.cone(0.2, 0.66, C.steel, {
      x: Math.cos(d * R) * 0.34, y: Math.sin(d * R) * 0.34,
      rz: (d - 90) * R, sz: 0.28, ...SHINY })),
    P.disc(0.19, 0.12, C.iron, { ...MET }),
    P.disc(0.08, 0.16, C.void),
  ],
  letterOpener: () => [                                   // 편지 개봉기
    P.box(0.16, 1.02, 0.05, C.silver, { y: 0.18, rz: 8 * R, ...SHINY }),
    P.cone(0.12, 0.28, C.silver, { x: 0.1, y: 0.82, rz: 8 * R, ...SHINY }),
    P.cyl(0.11, 0.09, 0.44, C.rune, { x: -0.1, y: -0.52, rz: 8 * R }),
    P.ball(0.11, C.amethyst, { x: -0.14, y: -0.76, ...glow(C.amethyst) }),
  ],
  ornamentalFan: () => [                                  // 장식 부채 — 아래 한 점에서 펼쳐진다
    ...[-56, -28, 0, 28, 56].map((d) => P.box(0.07, 0.96, 0.04, C.wood, {
      x: Math.sin(d * R) * 0.42, y: -0.18 + Math.cos(d * R) * 0.44, rz: -d * R })),
    ...[-56, -28, 0, 28, 56].map((d) => P.ball(0.22, C.paper, {
      x: Math.sin(d * R) * 0.66, y: -0.14 + Math.cos(d * R) * 0.7, sz: 0.09, rz: -d * R, ...SOFT })),
    P.ball(0.42, C.cloth, { y: 0.34, sy: 0.55, sz: 0.09, ...SOFT }),
    P.ball(0.13, C.gold, { y: -0.6, ...MET }),
    P.torus(0.08, 0.03, C.blood, { y: -0.72 }),
  ],
  matryoshka: () => [                                     // 마트료시카
    P.ball(0.42, C.cloth, { y: -0.2, sy: 1.15, ...SOFT }),
    P.ball(0.3, C.cream, { y: 0.16, sz: 0.85, ...SOFT }),
    P.ball(0.3, C.cloth2, { y: 0.3, sy: 0.55, sz: 1.02, ...SOFT }),
    ...[-1, 1].map((sx) => P.ball(0.045, C.ink, { x: sx * 0.11, y: 0.18, z: 0.25 })),
    P.ball(0.16, C.berry, { y: -0.34, z: 0.3, sz: 0.2, ...SOFT }),
  ],
  meatOnTheBone: () => [                                  // 뼈에 붙은 고기
    P.cyl(0.09, 0.09, 1.0, C.bone, { rz: 62 * R }),
    ...[[-0.44, -0.24], [0.44, 0.24]].flatMap(([x, y]) => [
      P.ball(0.15, C.bone, { x: x - 0.06, y: y - 0.1 }),
      P.ball(0.15, C.bone, { x: x + 0.06, y: y + 0.1 }),
    ]),
    P.ball(0.4, C.meat, { x: -0.06, y: 0.04, sx: 1.15, sz: 0.85, ...SOFT }),
    P.ball(0.18, C.blood, { x: 0.16, y: 0.18, z: 0.26, sz: 0.4, ...SOFT }),
  ],
  mercuryHourglass: () => [                               // 수은 모래시계
    P.cyl(0.36, 0.06, 0.44, C.glass, { y: 0.26, ...glass(C.glass) }),
    P.cyl(0.06, 0.36, 0.44, C.glass, { y: -0.26, ...glass(C.glass) }),
    P.cyl(0.3, 0.05, 0.3, C.silver, { y: 0.3, ...SHINY }),
    P.cyl(0.02, 0.02, 0.5, C.silver, { ...SHINY }),
    P.disc(0.44, 0.1, C.bronze, { y: 0.56, rx: 0, ...MET }),
    P.disc(0.44, 0.1, C.bronze, { y: -0.56, rx: 0, ...MET }),
  ],
  mummifiedHand: () => [                                  // 미라의 손
    P.box(0.44, 0.44, 0.2, C.sand, { y: -0.16, ...SOFT }),
    ...[-0.24, -0.08, 0.08, 0.24].map((x, i) => P.cap(0.065, 0.3 + (i === 1 || i === 2 ? 0.12 : 0), C.sand, {
      x, y: 0.28 + (i === 1 || i === 2 ? 0.06 : 0), ...SOFT })),
    P.cap(0.07, 0.22, C.sand, { x: -0.34, y: -0.08, rz: 52 * R, ...SOFT }),
    ...[0.1, -0.16].map((y) => P.box(0.5, 0.07, 0.24, C.cream, { y, rz: 8 * R, ...SOFT })),
  ],
  pantograph: () => [                                     // 팬터그래프 — 마름모 링크
    ...[[-0.3, 0.3, 42], [0.3, 0.3, -42], [-0.3, -0.3, -42], [0.3, -0.3, 42]].map(([x, y, d]) =>
      P.box(0.09, 0.78, 0.09, C.bronze, { x, y, rz: d * R, ...MET })),
    ...[[0, 0.66], [-0.58, 0], [0.58, 0], [0, -0.66]].map(([x, y]) =>
      P.ball(0.11, C.gold, { x, y, ...MET })),
    P.ball(0.13, C.volt, { ...glow(C.volt) }),
  ],
  pear: () => [                                           // 배
    P.ball(0.44, C.pear, { y: -0.22, ...SOFT }),
    P.ball(0.3, C.pear, { y: 0.22, ...SOFT }),
    P.cyl(0.045, 0.045, 0.28, C.bark, { y: 0.56 }),
    P.ball(0.2, C.leaf, { x: 0.24, y: 0.62, sz: 0.2, rz: -30 * R, ...SOFT }),
  ],
  questionCard: () => [                                   // 물음표 카드
    P.box(0.68, 0.94, 0.06, C.paper, { rz: -7 * R, ...SOFT }),
    P.box(0.56, 0.82, 0.02, C.rune, { z: 0.04, rz: -7 * R }),
    P.torus(0.17, 0.055, C.holy, { y: 0.18, z: 0.07, rz: -7 * R, ...glow(C.holy) }),
    P.box(0.11, 0.2, 0.05, C.holy, { x: 0.04, y: -0.06, z: 0.07, ...glow(C.holy) }),
    P.ball(0.07, C.holy, { x: 0.0, y: -0.28, z: 0.07, ...glow(C.holy) }),
  ],
  singingBowl: () => [                                    // 노래하는 그릇
    P.ball(0.52, C.oldGold, { y: 0.06, sy: 0.62, ...MET }),
    P.disc(0.5, 0.06, C.gold, { y: 0.22, rx: 0, ...SHINY }),
    P.disc(0.34, 0.08, C.bark, { y: -0.34, rx: 0 }),
    P.cyl(0.05, 0.07, 0.56, C.wood, { x: 0.56, y: 0.3, rz: -22 * R }),
    ...[0.42, 0.56].map((r, i) => P.torus(r, 0.02, C.holy, { y: 0.36 + i * 0.08, rx: 74 * R, ...glow(C.holy) })),
  ],
  strikeDummy: () => [                                    // 타격 허수아비
    P.cyl(0.07, 0.07, 1.3, C.wood, { y: -0.24 }),
    P.box(0.86, 0.09, 0.09, C.wood, { y: 0.3 }),
    P.ball(0.32, C.sand, { y: 0.56, ...SOFT }),
    P.box(0.5, 0.56, 0.3, C.leather, { y: 0.06 }),
    ...[0.16, -0.02, -0.2].map((y, i) => P.torus(0.16 - i * 0.03, 0.03, C.blood, { y, z: 0.18, ...glow(C.blood) })),
  ],
  sundial: () => [                                        // 해시계
    P.disc(0.6, 0.1, C.stone, { rx: 0 }),
    P.cone(0.1, 0.66, C.bronze, { y: 0.34, rz: 16 * R, sz: 0.24, ...MET }),
    ...[0, 45, 90, 135, 180].map((d) => P.box(0.12, 0.03, 0.03, C.bronze, {
      x: Math.cos(d * R) * 0.44, z: -Math.sin(d * R) * 0.44, y: 0.06, ry: -d * R, ...MET })),
    P.ball(0.12, C.volt, { x: -0.52, y: 0.5, ...glow(C.volt) }),
  ],
  theCourier: () => [                                     // 배달부 — 끈 묶은 소포에 깃털 날개
    P.box(0.62, 0.5, 0.42, C.sand, { y: -0.14, ...SOFT }),
    P.box(0.66, 0.09, 0.44, C.blood, { y: -0.14 }),
    P.box(0.1, 0.54, 0.44, C.blood, { y: -0.14 }),
    P.ball(0.1, C.blood, { y: 0.14, z: 0.06, sy: 0.6, ...SOFT }),
    ...[-1, 1].flatMap((s) => [0, 1, 2].map((i) => P.ball(0.2 - i * 0.03, C.frost, {
      x: s * (0.44 + i * 0.16), y: 0.24 - i * 0.12, sx: 0.55, sz: 0.1,
      rz: s * -(30 + i * 10) * R, ...glow(C.frost) }))),
  ],
  whiteBeastStatue: () => [                               // 흰 짐승 조각상
    P.box(0.62, 0.14, 0.44, C.stone, { y: -0.6 }),
    P.ball(0.34, C.cream, { y: -0.22, sx: 1.2, sy: 0.9, ...SOFT }),
    P.ball(0.26, C.cream, { x: -0.2, y: 0.32, ...SOFT }),
    ...[-1, 1].map((s) => P.cone(0.09, 0.24, C.cream, { x: -0.2 + s * 0.13, y: 0.56, rz: s * 16 * R })),
    P.ball(0.05, C.ruby, { x: -0.34, y: 0.34, z: 0.2, ...glow(C.ruby) }),
    ...[-1, 1].map((s) => P.cyl(0.07, 0.05, 0.3, C.cream, { x: s * 0.2, y: -0.52 })),
  ],
  paperPhrog: () => [                                     // 종이 개구리 — 종이접기
    P.tet(0.5, C.leaf, { y: -0.1, sy: 0.7, rx: -20 * R, ...SOFT }),
    P.tet(0.3, C.leaf, { y: 0.26, z: 0.1, rx: 22 * R, ...SOFT }),
    ...[-1, 1].map((s) => P.ball(0.1, C.cream, { x: s * 0.16, y: 0.42, z: 0.14 })),
    ...[-1, 1].map((s) => P.ball(0.05, C.ink, { x: s * 0.16, y: 0.44, z: 0.22 })),
    ...[-1, 1].map((s) => P.box(0.36, 0.06, 0.16, C.vine, { x: s * 0.38, y: -0.34, rz: s * 26 * R })),
  ],
  duality: () => [                                        // 이원성 — 엇갈린 두 칼
    ...[-1, 1].map((s) => P.box(0.1, 1.0, 0.03, s > 0 ? C.silver : C.dark, {
      y: 0.1, rz: s * 26 * R, ...SHINY })),
    ...[-1, 1].map((s) => P.cone(0.09, 0.22, s > 0 ? C.silver : C.dark, {
      x: s * 0.28, y: 0.66, rz: s * 26 * R, ...SHINY })),
    ...[-1, 1].map((s) => P.box(0.3, 0.07, 0.07, s > 0 ? C.gold : C.bronze, {
      x: s * -0.16, y: -0.28, rz: s * 26 * R, ...MET })),
    P.ball(0.11, C.arcane, { y: 0.16, z: 0.1, ...glow(C.arcane) }),
  ],
  // ---------------- 희귀 ----------------
  birdFacedUrn: () => [                                   // 새 얼굴 항아리
    P.ball(0.46, C.clay, { y: -0.16, sy: 1.05, ...SOFT }),
    P.cyl(0.24, 0.3, 0.2, C.clay, { y: 0.34 }),
    P.ball(0.24, C.clay, { y: 0.52, sz: 0.8, ...SOFT }),
    P.cone(0.1, 0.36, C.gold, { y: 0.5, z: 0.3, rx: 84 * R, ...MET }),
    ...[-1, 1].map((sx) => P.ball(0.06, C.ruby, { x: sx * 0.15, y: 0.6, z: 0.16, ...glow(C.ruby) })),
    P.torus(0.3, 0.04, C.gold, { rx: 84 * R, y: -0.16, ...MET }),
  ],
  calipers: () => [                                       // 캘리퍼스
    P.box(0.1, 1.0, 0.07, C.steel, { x: -0.2, y: 0.08, rz: 11 * R, ...MET }),
    P.box(0.1, 1.0, 0.07, C.steel, { x: 0.2, y: 0.08, rz: -11 * R, ...MET }),
    P.ball(0.13, C.gold, { y: 0.56, ...MET }),
    P.box(0.86, 0.09, 0.07, C.bronze, { y: -0.34, ...MET }),
    ...[-1, 1].map((s) => P.cone(0.08, 0.2, C.steel, { x: s * 0.42, y: -0.52, rz: 180 * R, ...MET })),
  ],
  captainsWheel: () => [                                  // 선장의 키
    P.torus(0.5, 0.09, C.wood),
    P.disc(0.16, 0.14, C.bronze, { ...MET }),
    ...[0, 45, 90, 135].map((d) => P.box(0.08, 1.18, 0.08, C.wood, { rz: d * R })),
    ...[0, 45, 90, 135, 180, 225, 270, 315].map((d) => P.ball(0.08, C.bark, {
      x: Math.cos(d * R) * 0.62, y: Math.sin(d * R) * 0.62 })),
  ],
  deadBranch: () => [                                     // 죽은 나뭇가지
    P.cyl(0.08, 0.11, 1.18, C.bark, { y: -0.06, rz: -9 * R }),
    P.cyl(0.05, 0.07, 0.52, C.bark, { x: -0.3, y: 0.3, rz: 52 * R }),
    P.cyl(0.045, 0.06, 0.44, C.bark, { x: 0.28, y: 0.14, rz: -58 * R }),
    P.cyl(0.035, 0.05, 0.3, C.bark, { x: 0.3, y: 0.54, rz: -26 * R }),
    P.ball(0.09, C.arcane, { x: -0.5, y: 0.5, ...glow(C.arcane) }),
  ],
  duVuDoll: () => [                                       // 두-부 인형
    P.ball(0.24, C.cloth, { y: 0.4, ...SOFT }),
    P.box(0.4, 0.56, 0.24, C.cloth, { y: -0.02, ...SOFT }),
    ...[-1, 1].map((s) => P.cap(0.07, 0.24, C.cloth, { x: s * 0.32, y: 0.06, rz: s * 40 * R, ...SOFT })),
    ...[-1, 1].map((s) => P.cap(0.07, 0.24, C.cloth, { x: s * 0.14, y: -0.48, ...SOFT })),
    P.cyl(0.02, 0.02, 0.56, C.silver, { x: 0.1, y: 0.0, rz: 62 * R, ...SHINY }),
    ...[-1, 1].map((s) => P.box(0.13, 0.03, 0.03, C.ink, { x: s * 0.09, y: 0.44, z: 0.2, rz: s * 30 * R })),
  ],
  fossilizedHelix: () => [                                // 화석화된 나선 — 점점 굵어지며 감기는 껍데기
    ...[0, 50, 100, 150, 200, 250, 300, 350, 400].map((d, i) => P.disc(0.08 + i * 0.03, 0.22, C.stone, {
      x: Math.cos(d * R) * (0.05 + i * 0.062), y: Math.sin(d * R) * (0.05 + i * 0.062), ...SOFT })),
    ...[200, 250, 300, 350, 400].map((d, i) => P.disc(0.05 + i * 0.024, 0.26, C.sand, {
      x: Math.cos(d * R) * (0.05 + (i + 4) * 0.062), y: Math.sin(d * R) * (0.05 + (i + 4) * 0.062), ...SOFT })),
    P.disc(0.09, 0.3, C.bronze, { ...MET }),
  ],
  gamblingChip: () => [                                   // 도박 칩
    P.disc(0.46, 0.13, C.blood, { y: -0.3, rx: 0, ...SOFT }),
    P.disc(0.46, 0.13, C.cloth2, { y: -0.14, x: 0.06, rx: 0, ...SOFT }),
    P.disc(0.46, 0.13, C.cream, { y: 0.02, x: -0.04, rx: 0, ...SOFT }),
    P.disc(0.46, 0.14, C.gold, { y: 0.2, x: 0.02, rx: 0, ...MET }),
    P.disc(0.2, 0.18, C.void, { y: 0.2, x: 0.02, rx: 0 }),
    ...[0, 90, 180, 270].map((d) => P.box(0.13, 0.06, 0.02, C.void, {
      x: 0.02 + Math.cos(d * R) * 0.34, z: Math.sin(d * R) * 0.34, y: 0.28, ry: -d * R })),
  ],
  ginger: () => [                                         // 생강 뿌리
    P.ball(0.34, C.ginger, { y: -0.08, sx: 1.25, sy: 0.85, ...SOFT }),
    P.ball(0.22, C.ginger, { x: -0.42, y: 0.16, rz: 30 * R, sx: 1.2, ...SOFT }),
    P.ball(0.19, C.ginger, { x: 0.42, y: 0.2, sy: 1.3, ...SOFT }),
    P.ball(0.15, C.ginger, { x: 0.2, y: -0.42, sy: 1.2, ...SOFT }),
    P.cone(0.07, 0.26, C.leaf, { x: 0.44, y: 0.5 }),
  ],
  girya: () => [                                          // 기랴 — 케틀벨
    P.ball(0.5, C.dark, { y: -0.2, sy: 0.92, ...MET }),
    P.torus(0.26, 0.09, C.iron, { y: 0.34, sy: 0.9, ...MET }),
    P.box(0.5, 0.1, 0.3, C.iron, { y: 0.16, ...MET }),
    P.box(0.34, 0.1, 0.03, C.gold, { y: -0.24, z: 0.42, ...MET }),
  ],
  iceCream: () => [                                       // 아이스크림
    P.cone(0.3, 0.74, C.sand, { y: -0.36, rz: 180 * R }),
    P.ball(0.3, C.cream, { y: 0.12, ...SOFT }),
    P.ball(0.25, C.berry, { x: -0.13, y: 0.36, ...SOFT }),
    P.ball(0.22, C.ice, { x: 0.16, y: 0.4, ...SOFT }),
    P.ball(0.09, C.ruby, { y: 0.62, ...glow(C.ruby) }),
  ],
  incenseBurner: () => [                                  // 향로
    P.cyl(0.34, 0.24, 0.12, C.bronze, { y: -0.52, ...MET }),
    P.ball(0.4, C.bronze, { y: -0.2, sy: 0.72, ...MET }),
    P.ball(0.36, C.oldGold, { y: -0.02, sy: 0.55, ...MET }),
    ...[-1, 1].map((s) => P.torus(0.13, 0.035, C.gold, { x: s * 0.42, y: -0.18, ry: 90 * R, ...MET })),
    ...[0.24, 0.48, 0.7].map((y, i) => P.ball(0.13 - i * 0.02, C.pearl, {
      x: (i % 2 ? 0.1 : -0.08), y, opacity: 0.5, flat: false })),
  ],
  lizardTail: () => [                                     // 도마뱀 꼬리
    ...[0, 1, 2, 3, 4].map((i) => P.ball(0.26 - i * 0.045, C.leaf, {
      x: -0.5 + i * 0.26, y: -0.3 + Math.sin(i * 1.1) * 0.26, ...SOFT })),
    P.cone(0.09, 0.32, C.vine, { x: 0.56, y: 0.42, rz: -38 * R }),
    P.ball(0.07, C.volt, { x: -0.5, y: -0.3, z: 0.2, ...glow(C.volt) }),
  ],
  mango: () => [                                          // 망고
    P.ball(0.46, C.mango, { y: -0.08, sx: 1.18, sy: 0.92, rz: 16 * R, ...SOFT }),
    P.ball(0.2, C.ember, { x: -0.3, y: 0.14, z: 0.26, sz: 0.3, ...SOFT }),
    P.cyl(0.04, 0.04, 0.2, C.bark, { x: 0.36, y: 0.42, rz: -24 * R }),
    P.ball(0.2, C.leaf, { x: 0.52, y: 0.56, sz: 0.18, rz: -40 * R, ...SOFT }),
  ],
  oldCoin: () => [                                        // 오래된 동전
    P.disc(0.58, 0.14, C.oldGold, { ...MET }),
    P.disc(0.48, 0.17, C.gold, { ...SHINY }),
    P.disc(0.3, 0.19, C.oldGold, { ...MET }),
    P.box(0.26, 0.26, 0.22, C.void, { rz: 45 * R }),
    ...[0, 90, 180, 270].map((d) => P.box(0.12, 0.05, 0.03, C.bronze, {
      x: Math.cos(d * R) * 0.39, y: Math.sin(d * R) * 0.39, z: 0.1, rz: d * R })),
  ],
  peacePipe: () => [                                      // 평화 담뱃대
    P.cyl(0.045, 0.045, 1.1, C.bark, { x: 0.12, y: -0.1, rz: 74 * R }),
    P.cyl(0.17, 0.21, 0.34, C.clay, { x: -0.44, y: 0.1 }),
    P.ball(0.1, C.ember, { x: -0.44, y: 0.28, ...glow(C.ember) }),
    ...[0.42, 0.6].map((y, i) => P.ball(0.12 - i * 0.03, C.pearl, { x: -0.38 + i * 0.1, y, opacity: 0.45, flat: false })),
    P.ball(0.18, C.cream, { x: 0.62, y: -0.32, sx: 0.9, sz: 0.14, rz: -30 * R, ...SOFT }),
  ],
  pocketwatch: () => [                                    // 회중시계
    P.disc(0.5, 0.15, C.gold, { y: -0.12, ...MET }),
    P.disc(0.4, 0.18, C.cream, { y: -0.12 }),
    P.box(0.05, 0.28, 0.02, C.ink, { y: 0.0, z: 0.1 }),
    P.box(0.22, 0.05, 0.02, C.ink, { x: 0.08, y: -0.12, z: 0.1, rz: 30 * R }),
    P.cyl(0.07, 0.09, 0.12, C.gold, { y: 0.44, ...MET }),
    P.torus(0.12, 0.035, C.gold, { y: 0.62, ...MET }),
  ],
  prayerWheel: () => [                                    // 기도 바퀴 — 마니차
    P.cyl(0.36, 0.36, 0.66, C.oldGold, { y: 0.08, ...MET }),
    P.disc(0.38, 0.07, C.gold, { y: 0.44, rx: 0, ...SHINY }),
    P.cone(0.2, 0.26, C.gold, { y: 0.62, ...MET }),
    P.cyl(0.05, 0.05, 1.3, C.wood, { y: -0.04 }),
    ...[0.2, 0.04, -0.12].map((y) => P.torus(0.37, 0.025, C.ruby, { rx: 90 * R, y, ...glow(C.ruby) })),
    P.ball(0.11, C.ruby, { x: 0.46, y: -0.3, ...glow(C.ruby) }),
  ],
  shovel: () => [                                         // 삽
    P.cyl(0.055, 0.055, 1.1, C.wood, { y: 0.24 }),
    P.box(0.3, 0.1, 0.07, C.wood, { y: 0.76 }),
    P.box(0.5, 0.46, 0.07, C.steel, { y: -0.4, ...MET }),
    P.cone(0.3, 0.3, C.steel, { y: -0.74, rz: 180 * R, sz: 0.2, ...MET }),
    P.ball(0.1, C.bark, { x: 0.34, y: -0.66 }),
  ],
  threadAndNeedle: () => [                                // 실과 바늘 — 바늘귀에 실을 꿰었다
    P.cone(0.05, 0.9, C.silver, { x: 0.3, y: -0.12, rz: 200 * R, ...SHINY }),
    P.torus(0.1, 0.035, C.silver, { x: 0.44, y: 0.42, ry: 70 * R, ...SHINY }),
    P.cyl(0.03, 0.03, 0.3, C.cloth, { x: 0.3, y: 0.48, rz: 68 * R, ...SOFT }),
    ...[0.3, 0.08, -0.16].map((y, i) => P.torus(0.2, 0.038, C.cloth, {
      x: -0.32 + (i % 2 ? 0.08 : 0), y, rx: 70 * R, ...SOFT })),
    P.ball(0.24, C.cloth, { x: -0.38, y: -0.52, ...SOFT }),
  ],
  torii: () => [                                          // 토리이
    P.box(1.34, 0.12, 0.14, C.blood, { y: 0.62 }),
    P.box(1.1, 0.1, 0.12, C.blood, { y: 0.38 }),
    ...[-1, 1].map((s) => P.cyl(0.09, 0.11, 1.34, C.blood, { x: s * 0.44, y: -0.18 })),
    P.box(0.14, 0.24, 0.1, C.blood, { y: 0.5 }),
    ...[-1, 1].map((s) => P.box(0.24, 0.08, 0.2, C.dark, { x: s * 0.44, y: -0.88 })),
  ],
  tungstenRod: () => [                                    // 텅스텐 막대 — 길고 묵직한 금속 봉
    // rz 로 기울인 막대의 축 방향은 (-sin, cos) 이다. 끝 캡을 (+sin, cos) 에 두면 따로 논다.
    P.cyl(0.16, 0.16, 1.44, C.lead, { rz: 26 * R, ...MET }),
    ...[-1, 1].map((s) => P.cyl(0.21, 0.21, 0.14, C.steel, {
      x: -s * 0.32, y: s * 0.65, rz: 26 * R, ...SHINY })),
    ...[-1, 1].map((s) => P.cyl(0.19, 0.19, 0.08, C.bronze, {
      x: -s * 0.22, y: s * 0.45, rz: 26 * R, ...MET })),
    P.cyl(0.18, 0.18, 0.1, C.volt, { rz: 26 * R, ...glow(C.volt) }),
  ],
  turnip: () => [                                         // 순무
    P.ball(0.46, C.turnip, { y: -0.12, sy: 1.02, ...SOFT }),
    P.ball(0.3, C.amethyst, { y: 0.24, sy: 0.62, ...SOFT }),
    P.cone(0.14, 0.34, C.turnip, { y: -0.66, rz: 180 * R, ...SOFT }),
    ...[-26, 0, 26].map((d) => P.ball(0.2, C.leaf, {
      x: Math.sin(d * R) * 0.28, y: 0.62, sx: 0.4, sz: 0.24, rz: -d * R, ...SOFT })),
  ],
  unceasingTop: () => [                                   // 끊임없는 팽이
    P.cyl(0.46, 0.38, 0.22, C.cloth2, { y: 0.2 }),
    P.cone(0.4, 0.68, C.cloth2, { y: -0.22, rz: 180 * R }),
    P.cone(0.1, 0.22, C.steel, { y: -0.66, rz: 180 * R, ...SHINY }),
    P.disc(0.4, 0.1, C.cream, { y: 0.32, rx: 0 }),
    P.cyl(0.09, 0.12, 0.24, C.berry, { y: 0.46 }),
    P.ball(0.09, C.gold, { y: 0.62, ...MET }),
    P.torus(0.56, 0.02, C.holy, { rx: 76 * R, y: 0.1, ...glow(C.holy) }),
  ],
  wingBoots: () => [                                      // 날개 부츠
    P.box(0.38, 0.6, 0.38, C.leather, { x: -0.12, y: 0.18 }),
    P.box(0.42, 0.2, 0.78, C.leather, { x: -0.12, y: -0.22, z: 0.18 }),
    P.box(0.46, 0.1, 0.84, C.dark, { x: -0.12, y: -0.36, z: 0.18 }),
    ...[-1, 1].map((s) => P.ball(0.3, C.holy, {
      x: s * 0.46 - 0.12, y: 0.3, sx: 0.8, sz: 0.14, rz: s * -34 * R, ...glow(C.holy) })),
  ],
  emotionChip: () => [                                    // 감정 칩 — 회로판 위의 심장
    P.box(0.86, 0.72, 0.1, C.leaf, { ...SOFT }),
    ...[-1, 1].flatMap((s) => [0.2, 0, -0.2].map((y) =>
      P.box(0.1, 0.05, 0.04, C.gold, { x: s * 0.48, y, ...MET }))),
    ...[-1, 1].map((s) => P.ball(0.17, C.heart, { x: s * 0.13, y: 0.14, z: 0.1, ...glow(C.heart) })),
    P.cone(0.24, 0.34, C.heart, { y: -0.14, z: 0.1, rz: 180 * R, ...glow(C.heart) }),
  ],
  theSpecimen: () => [                                    // 표본 — 유리병에 꽂아 둔 곤충
    P.cyl(0.36, 0.36, 0.82, C.glass, { y: -0.04, opacity: 0.32, flat: false, rough: 0.05 }),
    P.disc(0.39, 0.1, C.bronze, { y: 0.44, rx: 0, ...MET }),
    P.disc(0.42, 0.12, C.wood, { y: -0.52, rx: 0 }),
    P.ball(0.16, C.toxic, { y: -0.04, sy: 1.5, sz: 0.7, ...glow(C.toxic) }),
    P.ball(0.11, C.poison, { y: 0.22, ...glow(C.poison) }),
    ...[-1, 1].flatMap((s) => [0.1, -0.1, -0.3].map((y) =>
      P.box(0.34, 0.035, 0.035, C.toxic, { x: s * 0.19, y, rz: s * 24 * R, ...glow(C.toxic) }))),
    P.cyl(0.02, 0.02, 0.9, C.silver, { y: 0.1, ...SHINY }),
  ],
  teardropLocket: () => [                                 // 눈물 로켓
    P.ball(0.3, C.silver, { y: -0.18, sz: 0.4, ...SHINY }),
    P.cone(0.24, 0.46, C.silver, { y: 0.2, sz: 0.4, ...SHINY }),
    P.ball(0.15, C.sapphire, { y: -0.16, z: 0.14, ...glow(C.sapphire) }),
    P.torus(0.1, 0.03, C.silver, { y: 0.52, ...SHINY }),
    P.torus(0.5, 0.03, C.steel, { y: 0.34, sy: 0.6, ...MET }),
  ],
  // ---------------- 보스 ----------------
  bustedCrown: () => [                                    // 부서진 왕관 — 한쪽이 깨졌다
    P.cyl(0.46, 0.5, 0.3, C.gold, { y: -0.24, ...MET }),
    ...[-72, -24, 24].map((d) => P.cone(0.12, 0.46, C.gold, {
      x: Math.sin(d * R) * 0.44, z: Math.cos(d * R) * 0.2, y: 0.12, ...MET })),
    P.cone(0.11, 0.2, C.gold, { x: 0.44, y: -0.02, rz: 38 * R, ...MET }),
    P.ball(0.1, C.ruby, { y: 0.2, z: 0.3, ...glow(C.ruby) }),
    P.box(0.18, 0.2, 0.1, C.void, { x: 0.28, y: 0.06, z: 0.3, rz: 24 * R }),
  ],
  coffeeDripper: () => [                                  // 커피 내리개
    P.cyl(0.44, 0.1, 0.56, C.glass, { y: 0.34, ...glass(C.glass) }),
    P.ball(0.2, C.bark, { y: 0.36, sy: 0.7, ...SOFT }),
    P.cyl(0.08, 0.1, 0.16, C.dark, { y: -0.02 }),
    P.ball(0.38, C.glass, { y: -0.4, sy: 0.85, ...glass(C.bark) }),
    P.ball(0.28, C.bark, { y: -0.5, sy: 0.6, ...glow(C.bark) }),
    P.torus(0.16, 0.035, C.steel, { x: 0.46, y: -0.38, ry: 90 * R, ...MET }),
  ],
  cursedKey: () => [                                      // 저주받은 열쇠
    P.torus(0.28, 0.08, C.oldGold, { y: 0.44, ...MET }),
    P.cyl(0.07, 0.07, 0.86, C.oldGold, { y: -0.16, ...MET }),
    P.box(0.26, 0.1, 0.08, C.oldGold, { x: 0.14, y: -0.42, ...MET }),
    P.box(0.18, 0.1, 0.08, C.oldGold, { x: 0.1, y: -0.62, ...MET }),
    P.ball(0.12, C.arcane, { y: 0.44, ...glow(C.arcane) }),
  ],
  ectoplasm: () => [                                      // 엑토플라즘 — 유령 덩어리
    P.ball(0.46, C.jade, { y: 0.12, opacity: 0.6, flat: false, emit: C.jade, ei: 0.7 }),
    ...[-0.3, 0, 0.3].map((x, i) => P.cone(0.16, 0.44, C.jade, {
      x, y: -0.42 - (i === 1 ? 0.08 : 0), rz: 180 * R, opacity: 0.55, flat: false, emit: C.jade, ei: 0.6 })),
    ...[-1, 1].map((s) => P.ball(0.08, C.void, { x: s * 0.16, y: 0.2, z: 0.3 })),
    P.torus(0.5, 0.025, C.emerald, { rx: 72 * R, y: 0.3, ...glow(C.emerald) }),
  ],
  fusionHammer: () => [                                   // 융합 망치
    P.cyl(0.08, 0.08, 1.16, C.bark, { y: -0.24, rz: -8 * R }),
    P.box(0.84, 0.42, 0.42, C.lead, { y: 0.48, rz: -8 * R, ...MET }),
    P.box(0.16, 0.5, 0.5, C.steel, { x: 0.44, y: 0.42, rz: -8 * R, ...SHINY }),
    P.ball(0.13, C.ember, { x: -0.4, y: 0.54, ...glow(C.ember) }),
    P.ball(0.1, C.bark, { x: -0.06, y: -0.78 }),
  ],
  markOfPain: () => [                                     // 고통의 징표 — 못으로 박은 낙인
    P.disc(0.54, 0.14, C.darkBlood, { ...SOFT }),
    P.box(0.2, 0.96, 0.14, C.void, { z: 0.06, rz: 40 * R }),
    P.box(0.2, 0.96, 0.14, C.void, { z: 0.06, rz: -40 * R }),
    ...[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy]) => P.cyl(0.08, 0.08, 0.18, C.iron, {
      x: sx * 0.31, y: sy * 0.37, z: 0.16, rx: 90 * R, ...MET })),
    P.ball(0.12, C.ember, { z: 0.16, ...glow(C.ember) }),
  ],
  philosophersStone: () => [                              // 현자의 돌
    P.cyl(0.42, 0.5, 0.18, C.dark, { y: -0.52 }),
    P.gem(0.44, C.ruby, { y: 0.06, sy: 1.5, ...glow(C.ruby) }),
    P.torus(0.4, 0.03, C.gold, { rx: 70 * R, y: -0.16, ...glow(C.gold) }),
    P.torus(0.3, 0.025, C.gold, { rx: 110 * R, y: 0.3, ...glow(C.gold) }),
    P.ball(0.08, C.holy, { y: 0.66, ...glow(C.holy) }),
  ],
  runicDome: () => [                                      // 룬 돔
    P.ball(0.58, C.rune, { y: -0.2, sy: 0.9, ...SOFT }),
    P.cyl(0.6, 0.64, 0.14, C.dark, { y: -0.44 }),
    ...[-50, 0, 50].map((d) => P.box(0.08, 0.26, 0.03, C.arcane, {
      x: Math.sin(d * R) * 0.36, y: 0.04, z: Math.cos(d * R) * 0.38, ry: d * R, ...glow(C.arcane) })),
    P.ball(0.12, C.void, { y: 0.4 }),
    P.torus(0.16, 0.03, C.arcane, { rx: 90 * R, y: 0.46, ...glow(C.arcane) }),
  ],
  sozu: () => [                                           // 소주 — 일본 정원의 대나무 물받이
    P.cyl(0.18, 0.18, 1.06, C.leaf, { y: -0.04, rz: 62 * R }),
    ...[-0.3, 0.1].map((t) => P.torus(0.19, 0.035, C.vine, { x: t * 0.47, y: t * 0.88, rx: 90 * R, rz: 62 * R })),
    P.cyl(0.06, 0.06, 0.8, C.bark, { x: 0.16, y: -0.3 }),
    P.ball(0.1, C.water, { x: -0.52, y: 0.46, ...glass(C.water) }),
    P.ball(0.07, C.water, { x: -0.56, y: 0.16, ...glass(C.water) }),
  ],
  velvetChoker: () => [                                   // 벨벳 초커
    P.torus(0.5, 0.11, C.cloth, { sy: 0.82, ...SOFT }),
    P.torus(0.5, 0.045, C.dark, { sy: 0.82, z: 0.09 }),
    P.gem(0.19, C.amethyst, { y: -0.38, ...glow(C.amethyst) }),
    ...[-1, 1].map((s) => P.ball(0.07, C.silver, { x: s * 0.3, y: -0.3, ...SHINY })),
  ],
  runicPyramid: () => [                                   // 룬 피라미드
    P.cone(0.62, 0.9, C.sand, { y: 0.0, sz: 0.8 }),
    P.box(0.86, 0.12, 0.7, C.stone, { y: -0.48 }),
    ...[0.1, -0.12].map((y, i) => P.box(0.2 - i * 0.05, 0.05, 0.03, C.arcane, { y, z: 0.28 - i * 0.06, ...glow(C.arcane) })),
    P.gem(0.14, C.rune, { y: 0.56, ...glow(C.rune) }),
  ],
  emptyCage: () => [                                      // 빈 새장
    P.disc(0.44, 0.1, C.iron, { y: -0.56, rx: 0, ...MET }),
    P.disc(0.3, 0.1, C.iron, { y: 0.44, rx: 0, ...MET }),
    ...[0, 60, 120, 180, 240, 300].map((d) => P.cyl(0.03, 0.03, 1.0, C.iron, {
      x: Math.cos(d * R) * 0.36, z: Math.sin(d * R) * 0.36, y: -0.06, rz: Math.cos(d * R) * 0.12, ...MET })),
    P.torus(0.13, 0.03, C.iron, { y: 0.62, ...MET }),
    P.box(0.3, 0.04, 0.04, C.oldGold, { y: -0.2, z: 0.36, ...MET }),
  ],
  sacredBark: () => [                                     // 신성한 나무껍질 — 세로로 벗겨 낸 조각
    P.cyl(0.36, 0.3, 1.22, C.bark, { sz: 0.34, rz: 4 * R }),
    ...[-1, 1].map((s) => P.cyl(0.14, 0.1, 1.2, C.wood, { x: s * 0.24, sz: 0.3, rz: 4 * R })),
    ...[0.42, 0.14, -0.16, -0.44].map((y, i) => P.box(0.04, 0.24, 0.06, C.leather, {
      x: (i % 2 ? 0.1 : -0.12), y, z: 0.14 })),
    P.ball(0.15, C.leaf, { x: 0.3, y: 0.62, sz: 0.3, rz: -40 * R, ...SOFT }),
    P.ball(0.11, C.holy, { x: -0.22, y: -0.2, z: 0.18, ...glow(C.holy) }),
  ],
  slaversCollar: () => [                                  // 노예상의 목줄 — 가시 박힌 가죽 띠
    P.torus(0.44, 0.14, C.leather, { sy: 0.8 }),
    ...[0, 51, 102, 153, 204, 255, 306].map((d) => P.cone(0.11, 0.34, C.steel, {
      x: Math.cos(d * R) * 0.6, y: Math.sin(d * R) * 0.48, rz: (d - 90) * R, ...SHINY })),
    P.box(0.22, 0.26, 0.18, C.bronze, { y: 0.4, ...MET }),
    P.torus(0.15, 0.05, C.iron, { y: -0.44, ...MET }),
  ],
  astrolabe: () => [                                      // 아스트롤라베
    P.torus(0.56, 0.05, C.bronze, { ...MET }),
    P.torus(0.44, 0.04, C.gold, { ry: 62 * R, ...MET }),
    P.torus(0.32, 0.035, C.oldGold, { rx: 62 * R, ...MET }),
    P.ball(0.14, C.volt, { ...glow(C.volt) }),
    P.box(1.0, 0.04, 0.04, C.bronze, { rz: 24 * R, ...MET }),
    P.ball(0.07, C.holy, { x: 0.46, y: 0.2, ...glow(C.holy) }),
  ],
  tinyHouse: () => [                                      // 작은 집
    P.box(0.74, 0.54, 0.6, C.cream, { y: -0.24, ...SOFT }),
    P.cone(0.62, 0.48, C.blood, { y: 0.28, sz: 0.85, ry: 45 * R }),
    P.box(0.16, 0.26, 0.16, C.bark, { x: -0.26, y: 0.42 }),
    P.box(0.2, 0.28, 0.06, C.wood, { y: -0.34, z: 0.32 }),
    P.box(0.16, 0.16, 0.06, C.volt, { x: 0.22, y: -0.12, z: 0.32, ...glow(C.volt) }),
  ],
  sneckoEye: () => [                                      // 스네코 눈 — 세로 동공
    P.ball(0.54, C.mango, { sz: 0.72, ...glow(C.mango) }),
    P.ball(0.36, C.ember, { z: 0.24, sz: 0.4, ...glow(C.ember) }),
    P.ball(0.3, C.void, { z: 0.36, sx: 0.28, sz: 0.3 }),
    P.torus(0.56, 0.06, C.leaf, { ...SOFT }),
    ...[-1, 1].map((s) => P.cone(0.1, 0.24, C.leaf, { x: s * 0.56, y: s * 0.22, rz: (s > 0 ? -50 : 50) * R })),
  ],
  twistedFunnel: () => [                                  // 뒤틀린 깔때기
    P.cone(0.52, 0.72, C.poison, { y: 0.24, rz: 186 * R, ...MET }),
    P.cyl(0.11, 0.09, 0.46, C.poison, { x: 0.05, y: -0.42, rz: 8 * R, ...MET }),
    P.torus(0.5, 0.05, C.toxic, { rx: 74 * R, y: 0.56, ...glow(C.toxic) }),
    P.ball(0.1, C.toxic, { x: 0.09, y: -0.72, ...glow(C.toxic) }),
    P.ball(0.07, C.toxic, { x: 0.12, y: -0.94, ...glow(C.toxic) }),
  ],
  ninjaScroll: () => [                                    // 닌자 두루마리
    P.cyl(0.26, 0.26, 1.0, C.paper, { rz: 78 * R, ...SOFT }),
    ...[-1, 1].map((s) => P.disc(0.3, 0.08, C.dark, { x: s * 0.1, y: s * 0.5, rx: 12 * R })),
    P.box(0.28, 0.06, 0.02, C.ink, { y: 0.06, z: 0.27, rz: 12 * R }),
    ...[-1, 1].map((s) => P.cone(0.13, 0.4, C.steel, {
      x: 0.42, y: 0.06 + s * 0.2, rz: (90 + s * 32) * R, sz: 0.25, ...SHINY })),
  ],
  goldPlatedCables: () => [                               // 금도금 케이블 — 다발로 묶여 늘어진 선
    ...[0, 1, 2].map((i) => P.torus(0.34 + i * 0.1, 0.055, C.gold, {
      y: 0.1 - i * 0.02, sy: 0.5, rz: (i - 1) * 6 * R, ...SHINY })),
    P.cyl(0.2, 0.22, 0.28, C.dark, { y: 0.16, rz: 90 * R }),
    ...[-1, 1].map((s) => P.cyl(0.11, 0.13, 0.26, C.copper, { x: s * 0.6, y: -0.3, rz: s * 24 * R, ...MET })),
    ...[-1, 1].map((s) => P.box(0.16, 0.2, 0.2, C.steel, { x: s * 0.68, y: -0.46, ...MET })),
    P.ball(0.1, C.volt, { y: 0.38, ...glow(C.volt) }),
  ],
  runicCapacitor: () => [                                 // 룬 축전기
    P.cyl(0.34, 0.34, 0.76, C.steel, { y: -0.08, ...MET }),
    P.disc(0.36, 0.1, C.rune, { y: 0.34, rx: 0, ...glow(C.rune) }),
    ...[0, 120, 240].map((d) => P.ball(0.13, C.arcane, {
      x: Math.cos(d * R) * 0.5, y: 0.52, z: Math.sin(d * R) * 0.5, ...glow(C.arcane) })),
    ...[0.1, -0.18].map((y) => P.torus(0.35, 0.03, C.volt, { rx: 90 * R, y, ...glow(C.volt) })),
    P.cyl(0.05, 0.05, 0.2, C.copper, { y: 0.56, ...MET }),
  ],
  violetLotus: () => [                                    // 보라 연꽃
    ...[0, 72, 144, 216, 288].map((d) => P.cone(0.2, 0.56, C.amethyst, {
      x: Math.cos(d * R) * 0.34, z: Math.sin(d * R) * 0.34, y: 0.06,
      rz: Math.cos(d * R) * 46 * R, rx: -Math.sin(d * R) * 46 * R, ...SOFT })),
    ...[36, 108, 180, 252, 324].map((d) => P.cone(0.15, 0.4, C.rune, {
      x: Math.cos(d * R) * 0.2, z: Math.sin(d * R) * 0.2, y: 0.24,
      rz: Math.cos(d * R) * 26 * R, rx: -Math.sin(d * R) * 26 * R, ...SOFT })),
    P.ball(0.15, C.holy, { y: 0.34, ...glow(C.holy) }),
    P.disc(0.5, 0.05, C.leaf, { y: -0.3, rx: 0, ...SOFT }),
  ],
};
