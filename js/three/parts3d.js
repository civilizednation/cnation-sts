// ============================================================
//  3D 부품 사전 — 유물·물약 아이콘을 "부품 목록" 으로 적기 위한 도구.
//
//  형태를 함수 안에서 직접 조립하지 않고 **데이터(부품 배열)로 적는다.**
//  · 읽기 쉽다 — 한 줄이 곧 "자루", "갈고리" 처럼 읽힌다
//  · 겹침을 기계가 검사할 수 있다 (배열을 그대로 견주면 된다 — tools/check-icons.mjs)
//  · 카드 문양(js/ui/cardart.js)이 [path, 색] 배열인 것과 같은 결이다
//
//  부품 하나 : { t: 종류, a: [치수…], c: 색, ...옵션 }
//  옵션 : x y z(위치) · rx ry rz(회전, 라디안) · sx sy sz(크기 비율)
//         metal rough emit ei opacity flat(기본 true — 저폴리 각진 느낌)
//
//  ★ 이 파일은 three.js 를 부르지 않는다. 순수 데이터라야
//    tools/check-icons.mjs 가 브라우저 없이 Node 에서 겹침을 검사할 수 있다.
//    실제 메시로 바꾸는 일(buildParts)은 items3d.js 가 맡는다.
// ============================================================

// ------------------------------------------------------------
//  색 — 이름으로 부른다. 뜻이 통하는 색을 골라야 모양만 보고 알아본다.
// ------------------------------------------------------------
export const C = {
  // 금속
  iron: '#7c8494', steel: '#9aa4b8', dark: '#3a3f4e', gold: '#e0b23c', oldGold: '#b08a2e',
  bronze: '#b07a3a', copper: '#c07848', silver: '#c8d0e0', lead: '#5e6472',
  // 살·피·생명
  blood: '#c0202c', darkBlood: '#5a0e16', flesh: '#e0a080', heart: '#d43a52',
  bone: '#e8e0cc', skull: '#d8d0b8',
  // 원소
  fire: '#ff7a2a', ember: '#ff4a10', ice: '#8ce0ff', frost: '#cceeff',
  volt: '#ffe14a', storm: '#9ad8f0', poison: '#7ad04a', toxic: '#a8e030',
  arcane: '#a86aff', void: '#2a1a3a', holy: '#ffe9a8', shadow: '#241a33',
  // 자연
  wood: '#8a6038', bark: '#6a4a28', leaf: '#5aa84a', vine: '#4a8a3a',
  stone: '#9a9488', clay: '#b08868', sand: '#d8c08a', water: '#4aa8d0',
  // 천·가죽·종이
  cloth: '#c05a6a', cloth2: '#4a6ac0', leather: '#8a6448', paper: '#e8dfc4', ink: '#2a2a3a',
  // 음식
  berry: '#e03a5a', pear: '#c8d060', mango: '#ffb02a', turnip: '#e8e0e8', ginger: '#d8a050',
  cream: '#fff0d8', meat: '#c06048',
  // 그 외
  glass: '#bcd8e8', pearl: '#f0e8f8', jade: '#4ac0a0', ruby: '#e02a4a', sapphire: '#2a6ae0',
  emerald: '#2ac070', amethyst: '#9a4ae0', obsidian: '#2a2432', rune: '#7a5ad0',
};

// ------------------------------------------------------------
//  부품 만들기
// ------------------------------------------------------------
const part = (t, a, c, o = {}) => ({ t, a, c, ...o });

export const P = {
  /** 공 (구슬 · 알 · 열매) */
  ball: (r, c, o) => part('ball', [r], c, o),
  /** 상자 (판 · 막대 · 벽돌) */
  box: (w, h, d, c, o) => part('box', [w, h, d], c, o),
  /** 원기둥 (자루 · 병목 · 원반) — 위 반지름, 아래 반지름, 높이 */
  cyl: (rt, rb, h, c, o) => part('cyl', [rt, rb, h], c, o),
  /** 뿔 (칼끝 · 갈고리 · 불꽃) */
  cone: (r, h, c, o) => part('cone', [r, h], c, o),
  /** 고리 (반지 · 사슬 · 후광) */
  torus: (R, r, c, o) => part('torus', [R, r], c, o),
  /** 보석 (팔면체) */
  gem: (r, c, o) => part('gem', [r], c, o),
  /** 결정 (이십면체 — 돌·운석) */
  rock: (r, c, o) => part('rock', [r], c, o),
  /** 사면체 (조각 · 이빨) */
  tet: (r, c, o) => part('tet', [r], c, o),
  /** 캡슐 (알약 · 손가락 · 통) */
  cap: (r, h, c, o) => part('cap', [r, h], c, o),
  /** 원판 (동전 · 뚜껑) — 얇은 원기둥의 준말 */
  disc: (r, h, c, o) => part('cyl', [r, r, h], c, { rx: Math.PI / 2, ...o }),
};

// 자주 쓰는 재질 묶음
export const MAT = {
  metal: { metal: 0.9, rough: 0.25 },
  shiny: { metal: 0.95, rough: 0.12 },
  dull: { metal: 0.1, rough: 0.85 },
  glow: (c) => ({ emit: c, ei: 0.9, metal: 0.3, rough: 0.2 }),
  glass: (c) => ({ emit: c, ei: 0.6, metal: 0.1, rough: 0.08, opacity: 0.88, flat: false }),
  soft: { flat: false, rough: 0.6, metal: 0.05 },
};

/** 겹침 검사용 지문 — 부품 배열을 그대로 견준다 (색까지 포함) */
export function fingerprint(parts) {
  return JSON.stringify(parts.map((p) => [
    p.t, p.a.map((n) => (typeof n === 'number' ? +n.toFixed(3) : String(n))), p.c,
    [p.x || 0, p.y || 0, p.z || 0].map((n) => +n.toFixed(3)),
    [p.rx || 0, p.ry || 0, p.rz || 0].map((n) => +n.toFixed(3)),
    [p.sx ?? 1, p.sy ?? 1, p.sz ?? 1].map((n) => +n.toFixed(3)),
  ]));
}
