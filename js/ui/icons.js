// ============================================================
//  SVG 아이콘 : 힘/상태이상, 의도, 유물 문양
//  모두 100x100 뷰박스 기준 path 데이터
// ============================================================

import { POWER_ART } from './powerart.js';

export const GLYPH = {
  sword: 'M50 6 L60 26 L57 62 L50 70 L43 62 L40 26 Z M30 62 H70 L66 72 H34 Z M46 72 h8 v20 h-8 Z',
  twinSword: 'M28 10 L38 26 L34 68 L28 74 L22 66 L24 26 Z M72 10 L78 26 L74 68 L68 74 L62 66 L66 26 Z M16 60 h28 l-3 8 H19 Z M56 60 h28 l-3 8 H59 Z',
  axe: 'M46 12 h8 v76 h-8 Z M54 16 c22 0 34 12 34 26 c0 10 -8 16 -18 16 c6 -14 -2 -30 -16 -32 Z',
  hammer: 'M20 16 c0 -5 4 -8 9 -8 h42 c5 0 9 3 9 8 v16 c0 5 -4 8 -9 8 H29 c-5 0 -9 -3 -9 -8 Z M44 40 h12 v50 h-12 Z M30 18 h8 v12 h-8 Z',
  shield: 'M50 8 L84 22 v28 c0 20 -16 34 -34 42 C32 84 16 70 16 50 V22 Z',
  shieldSpike: 'M50 8 L84 22 v28 c0 20 -16 34 -34 42 C32 84 16 70 16 50 V22 Z M50 24 L58 44 H42 Z M50 76 L42 58 h16 Z',
  flame: 'M50 6 C58 26 76 34 76 54 C76 74 64 90 50 90 C36 90 24 74 24 54 C24 40 34 36 38 26 C42 38 50 36 50 26 Z',
  blood: 'M50 8 C64 34 78 46 78 62 C78 78 66 90 50 90 C34 90 22 78 22 62 C22 46 36 34 50 8 Z',
  skull: 'M50 10 C72 10 84 26 84 44 C84 58 76 64 72 70 L70 88 H30 L28 70 C24 64 16 58 16 44 C16 26 28 10 50 10 Z M36 44 a7 7 0 1 0 0.1 0 Z M64 44 a7 7 0 1 0 0.1 0 Z',
  fist: 'M24 40 c0 -10 8 -14 14 -12 V20 c0 -8 14 -8 14 0 v8 c0 -8 14 -8 14 0 v10 c6 -2 12 2 12 10 v14 c0 16 -12 26 -28 26 S24 78 24 62 Z',
  lightning: 'M58 6 L26 54 h20 L38 94 L74 42 H52 Z',
  spiral: 'M50 50 m0 -36 a36 36 0 1 1 -25 62 a26 26 0 1 0 18 -44 a16 16 0 1 1 11 27',
  eye: 'M6 50 C22 24 78 24 94 50 C78 76 22 76 6 50 Z M50 36 a14 14 0 1 0 0.1 0 Z',
  heart: 'M50 88 C18 66 10 46 22 32 C32 20 46 24 50 36 C54 24 68 20 78 32 C90 46 82 66 50 88 Z',
  chain: 'M28 28 a16 16 0 1 1 22 22 l-8 -8 a6 6 0 1 0 -8 -8 Z M50 50 a16 16 0 1 1 22 22 l-8 -8 a6 6 0 1 0 -8 -8 Z M36 64 h28 v8 h-28 Z',
  wave: 'M8 40 c14 -18 28 18 42 0 c14 -18 28 18 42 0 v18 c-14 18 -28 -18 -42 0 c-14 18 -28 -18 -42 0 Z',
  star: 'M50 6 L62 38 L96 40 L70 60 L79 92 L50 74 L21 92 L30 60 L4 40 L38 38 Z',
  bomb: 'M46 26 c-18 4 -28 18 -28 34 c0 18 14 30 32 30 s32 -12 32 -30 c0 -16 -10 -30 -28 -34 Z M52 12 h10 v14 h-10 Z M62 8 l14 -6 4 8 l-14 6 Z',
  wing: 'M50 20 v60 M50 30 C30 22 12 34 8 54 c16 -6 30 0 42 12 M50 30 C70 22 88 34 92 54 c-16 -6 -30 0 -42 12',
  book: 'M10 20 c14 -9 30 -8 40 3 v58 c-10 -10 -26 -11 -40 -3 Z M90 20 c-14 -9 -30 -8 -40 3 v58 c10 -10 26 -11 40 -3 Z',
  potion: 'M40 10 h20 v18 l16 34 c6 14 -4 28 -26 28 s-32 -14 -26 -28 l16 -34 Z',
  thorn: 'M50 6 L58 32 L84 22 L64 44 L92 54 L62 58 L74 86 L50 64 L26 86 L38 58 L8 54 L36 44 L16 22 L42 32 Z',
  arrowUp: 'M50 10 L82 50 H62 v36 H38 V50 H18 Z',
  arrowDown: 'M50 90 L18 50 h20 V14 h24 v36 h20 Z',
  ring: 'M50 8 a42 42 0 1 0 0.1 0 Z M50 30 a20 20 0 1 1 -0.1 0 Z',
  question: 'M36 34 c0 -12 8 -20 16 -20 c10 0 16 8 16 16 c0 12 -14 14 -14 24 v6 h-10 v-8 c0 -14 14 -14 14 -22 c0 -4 -2 -8 -6 -8 c-5 0 -8 5 -8 12 Z M46 74 h12 v12 H46 Z',
  zzz: 'M24 20 h34 L26 50 h32 v10 H14 L46 30 H24 Z M58 56 h26 L60 82 h24 v8 H48 L72 64 H58 Z',
  foot: 'M34 12 c12 0 18 12 18 28 s-4 26 -14 26 s-16 -12 -16 -28 S22 12 34 12 Z M28 74 h26 v12 H28 Z',
  drop: 'M50 8 C66 32 76 46 76 60 a26 26 0 1 1 -52 0 C24 46 34 32 50 8 Z',
  gear: 'M50 18 l8 4 l8 -4 l4 10 l10 2 l-2 10 l8 6 l-8 6 l2 10 l-10 2 l-4 10 l-8 -4 l-8 4 l-4 -10 l-10 -2 l2 -10 l-8 -6 l8 -6 l-2 -10 l10 -2 Z M50 40 a10 10 0 1 0 0.1 0 Z',
  crown: 'M14 72 L20 26 L36 46 L50 18 L64 46 L80 26 L86 72 Z',
  claw: 'M24 12 c10 20 14 40 12 66 l-12 -4 C26 50 22 32 14 16 Z M48 8 c8 22 10 44 6 70 l-12 -2 C46 50 46 30 38 12 Z M72 12 c4 22 2 44 -6 66 l-12 -4 c10 -22 12 -42 10 -62 Z',
  hourglass: 'M22 10 h56 v10 L56 50 l22 30 v10 H22 V80 L44 50 L22 20 Z',
  plus: 'M42 14 h16 v28 h28 v16 H58 v28 H42 V58 H14 V42 h28 Z',
  minus: 'M14 42 h72 v16 H14 Z',
  trash: 'M38 8 h24 l4 8 h18 v12 H16 V16 h18 Z M22 34 h56 l-5 54 a6 6 0 0 1 -6 6 H33 a6 6 0 0 1 -6 -6 Z',

  // ── v1.3.9 : 카드 문양을 계열 안에서 겹치지 않게 하려고 늘린 것들 ──
  // 무기·타격
  dagger: 'M50 6 L58 30 L54 62 h-8 L42 30 Z M36 62 h28 v8 H36 Z M46 70 h8 v24 h-8 Z',
  spear: 'M50 4 L60 30 L54 44 h-8 L40 30 Z M46 44 h8 v50 h-8 Z M34 56 h32 v7 H34 Z',
  mace: 'M50 8 a20 20 0 1 1 -0.1 0 Z M50 2 v12 M50 44 v10 M24 28 l10 6 M76 28 l-10 6 M46 52 h8 v42 h-8 Z',
  whip: 'M18 88 C34 88 30 60 46 54 C60 49 58 28 74 20 L84 12 l2 10 l-10 4 C64 34 68 54 52 62 C36 70 40 94 20 96 Z',
  scythe: 'M46 90 h8 V26 h-8 Z M50 22 C70 22 86 34 90 52 C74 40 60 38 50 40 Z',
  bow: 'M30 10 C56 26 56 74 30 90 M30 10 L78 50 L30 90',
  arrows: 'M50 4 L62 28 H54 v28 h-8 V28 h-8 Z M20 52 L32 76 H24 v18 h-8 V76 H8 Z M80 52 L92 76 h-8 v18 h-8 V76 h-8 Z',
  cleaver: 'M18 20 h48 c8 0 12 6 12 14 v20 c0 8 -4 12 -12 12 H18 Z M66 34 h20 v8 H66 Z M40 66 h8 v28 h-8 Z',
  knuckle: 'M14 44 h72 v18 c0 14 -14 24 -36 24 S14 76 14 62 Z M24 30 a9 9 0 1 1 0.1 0 Z M50 26 a9 9 0 1 1 0.1 0 Z M76 30 a9 9 0 1 1 0.1 0 Z',
  kick: 'M16 74 c10 -26 22 -40 40 -46 l6 -16 l14 6 l-8 20 c10 8 14 20 12 36 l-16 -2 c2 -12 -2 -18 -10 -22 c-12 6 -20 16 -26 32 Z',
  // 방어·보호
  wall: 'M10 24 h80 v18 H10 Z M10 46 h80 v18 H10 Z M10 68 h80 v18 H10 Z M34 24 v18 M66 24 v18 M22 46 v18 M50 46 v18 M78 46 v18 M34 68 v18 M66 68 v18',
  tower: 'M26 34 h48 v56 H26 Z M22 20 h10 v14 H22 Z M40 20 h10 v14 H40 Z M58 20 h10 v14 H58 Z M76 20 h-4 v14 h4 Z M42 58 h16 v32 H42 Z',
  barrier: 'M50 10 L86 26 v24 c0 22 -18 36 -36 42 C32 86 14 72 14 50 V26 Z M26 40 h48 v10 H26 Z M26 58 h48 v10 H26 Z',
  helmet: 'M50 12 c20 0 32 14 32 32 v16 H62 l-4 26 h-16 l-4 -26 H18 V44 c0 -18 12 -32 32 -32 Z M30 44 h14 v12 H30 Z M56 44 h14 v12 H56 Z',
  anchor: 'M50 8 a10 10 0 1 1 -0.1 0 Z M46 28 h8 v58 h-8 Z M28 44 h44 v8 H28 Z M14 62 c0 18 16 30 36 30 s36 -12 36 -30 l-10 2 c-2 12 -12 18 -26 18 s-24 -6 -26 -18 Z',
  // 불·빛
  torch: 'M50 6 C58 22 70 28 70 42 C70 56 61 64 50 64 C39 64 30 56 30 42 C30 32 38 28 42 18 C45 30 50 28 50 18 Z M44 66 h12 v28 h-12 Z',
  sun: 'M50 28 a22 22 0 1 1 -0.1 0 Z M50 2 v14 M50 84 v14 M2 50 h14 M84 50 h14 M16 16 l10 10 M74 74 l10 10 M84 16 l-10 10 M26 74 l-10 10',
  moon: 'M62 8 C40 14 26 30 26 50 C26 72 42 90 64 92 C50 82 42 68 42 50 C42 32 50 18 62 8 Z',
  comet: 'M68 14 a16 16 0 1 1 -0.1 0 Z M54 34 L12 88 M66 46 L28 92 M44 26 L6 66',
  explosion: 'M50 2 L60 26 L84 14 L74 38 L98 44 L76 56 L92 78 L66 72 L64 96 L50 76 L36 96 L34 72 L8 78 L24 56 L2 44 L26 38 L16 14 L40 26 Z',
  ember: 'M50 12 C60 30 74 36 74 52 C74 70 62 84 50 84 C38 84 26 70 26 52 C26 40 34 36 38 26 Z M50 44 c6 8 10 12 10 18 c0 8 -5 12 -10 12 s-10 -4 -10 -12 c0 -6 4 -10 10 -18 Z',
  // 얼음·물·바람
  snow: 'M46 4 h8 v92 h-8 Z M8 26 l4 -7 l76 44 l-4 7 Z M88 26 l4 7 l-76 44 l-4 -7 Z M50 22 l-14 -12 l-5 6 l19 16 Z M50 22 l14 -12 l5 6 l-19 16 Z',
  icicle: 'M26 8 h48 v10 H26 Z M32 18 L38 62 L34 78 L30 62 Z M50 18 L58 76 L52 96 L46 76 Z M68 18 L72 58 L68 72 L64 58 Z',
  frost: 'M50 6 L62 30 L88 24 L74 46 L94 62 L68 66 L70 92 L50 76 L30 92 L32 66 L6 62 L26 46 L12 24 L38 30 Z M50 38 a12 12 0 1 1 -0.1 0 Z',
  splash: 'M50 12 C62 34 74 44 74 60 C74 76 63 88 50 88 C37 88 26 76 26 60 C26 44 38 34 50 12 Z M16 30 a8 8 0 1 1 -0.1 0 Z M84 30 a8 8 0 1 1 -0.1 0 Z M18 74 a6 6 0 1 1 -0.1 0 Z M82 74 a6 6 0 1 1 -0.1 0 Z',
  tornado: 'M10 16 h80 v10 H10 Z M18 34 h64 v10 H18 Z M28 52 h44 v10 H28 Z M38 70 h24 v10 H38 Z M46 88 h8 v8 h-8 Z',
  cloud: 'M26 70 c-11 0 -18 -8 -18 -17 c0 -9 7 -16 16 -17 c3 -14 15 -24 29 -24 c16 0 28 12 29 27 c9 1 16 8 16 17 c0 9 -8 14 -18 14 Z',
  // 몸·감각
  brain: 'M36 14 c-12 0 -20 8 -20 18 c-8 4 -10 14 -4 20 c-4 8 0 18 10 20 c2 10 12 16 22 12 V14 Z M64 14 c12 0 20 8 20 18 c8 4 10 14 4 20 c4 8 0 18 -10 20 c-2 10 -12 16 -22 12 V14 Z M50 14 v70',
  lungs: 'M46 8 h8 v38 h-8 Z M44 34 C30 34 18 46 18 64 c0 14 6 26 14 26 c8 0 12 -10 12 -22 Z M56 34 c14 0 26 12 26 30 c0 14 -6 26 -14 26 c-8 0 -12 -10 -12 -22 Z',
  bone: 'M22 32 a12 12 0 1 1 8 20 L70 68 a12 12 0 1 1 -8 -20 L30 32 Z M30 20 a12 12 0 1 1 -8 12 M78 80 a12 12 0 1 1 -8 -12',
  footprint: 'M34 14 c12 0 18 12 16 26 c-2 12 -8 20 -16 20 c-9 0 -14 -10 -14 -22 c0 -14 5 -24 14 -24 Z M30 68 c10 0 16 6 16 14 c0 8 -7 14 -16 14 s-16 -6 -16 -14 c0 -8 6 -14 16 -14 Z M68 30 a10 14 0 1 1 -0.1 0 Z M72 58 a9 12 0 1 1 -0.1 0 Z',
  mask: 'M20 16 h60 v34 c0 24 -14 40 -30 40 S20 74 20 50 Z M32 38 L46 44 L32 50 Z M68 38 L54 44 L68 50 Z M40 66 h20 l-10 10 Z',
  // 마음·수도
  lotus: 'M50 30 C60 42 62 58 50 78 C38 58 40 42 50 30 Z M50 78 C34 74 22 62 20 44 C36 46 46 58 50 78 Z M50 78 C66 74 78 62 80 44 C64 46 54 58 50 78 Z M50 78 C34 82 18 78 8 66 C22 58 40 62 50 78 Z M50 78 C66 82 82 78 92 66 C78 58 60 62 50 78 Z',
  bell: 'M50 10 a6 6 0 1 1 -0.1 0 Z M50 20 c16 0 24 12 24 30 c0 14 4 22 8 26 H18 c4 -4 8 -12 8 -26 c0 -18 8 -30 24 -30 Z M42 82 h16 a8 8 0 0 1 -16 0 Z',
  scroll: 'M20 16 h60 v68 H20 Z M14 16 a6 10 0 1 1 0 20 h6 V16 Z M86 64 a6 10 0 1 1 0 20 h-6 V64 Z M32 34 h36 v6 H32 Z M32 48 h36 v6 H32 Z M32 62 h24 v6 H32 Z',
  candle: 'M50 6 c6 10 10 14 10 20 c0 7 -5 11 -10 11 s-10 -4 -10 -11 c0 -6 4 -10 10 -20 Z M38 42 h24 v46 H38 Z M32 88 h36 v8 H32 Z',
  yinyang: 'M50 6 a44 44 0 1 1 -0.1 0 Z M50 6 a22 22 0 0 0 0 44 a22 22 0 0 1 0 44 a44 44 0 0 0 0 -88 Z M50 20 a6 6 0 1 1 -0.1 0 Z M50 68 a6 6 0 1 1 -0.1 0 Z',
  hourglassRun: 'M22 8 h56 v10 L58 44 l20 26 v10 H22 V70 l20 -26 L22 18 Z M34 70 h32 l-16 -18 Z',
  // 기계·회로
  chip: 'M28 28 h44 v44 H28 Z M40 16 h6 v12 h-6 Z M54 16 h6 v12 h-6 Z M40 72 h6 v12 h-6 Z M54 72 h6 v12 h-6 Z M16 40 h12 v6 H16 Z M16 54 h12 v6 H16 Z M72 40 h12 v6 H72 Z M72 54 h12 v6 H72 Z',
  battery: 'M20 24 h52 v52 H20 Z M76 40 h8 v20 h-8 Z M34 34 h10 v32 H34 Z M52 34 h10 v32 H52 Z',
  circuit: 'M10 50 h22 M68 50 h22 M50 10 v22 M50 68 v22 M36 36 h28 v28 H36 Z M10 50 a5 5 0 1 1 0.1 0 Z M90 50 a5 5 0 1 1 0.1 0 Z M50 10 a5 5 0 1 1 0.1 0 Z M50 90 a5 5 0 1 1 0.1 0 Z',
  antenna: 'M46 40 h8 v54 h-8 Z M50 26 a10 10 0 1 1 -0.1 0 Z M30 30 a28 28 0 0 1 40 0 M18 18 a45 45 0 0 1 64 0',
  magnet: 'M22 58 V42 c0 -16 12 -28 28 -28 s28 12 28 28 v16 H60 V42 a10 10 0 0 0 -20 0 v16 Z M22 64 h18 v22 H22 Z M60 64 h18 v22 H60 Z',
  // 설정 버튼용 톱니바퀴 — 톱니 8개 + 가운데 구멍 (누가 봐도 설정으로 읽히는 모양).
  // 구멍은 바깥과 반대 방향(sweep 0)으로 그려야 nonzero 규칙에서 뚫린다.
  cog: 'M38.3 17.0 L40.2 4.0 L59.8 4.0 L61.7 17.0 A35 35 0 0 1 65.1 18.4 L75.6 10.6 L89.4 24.4 L81.6 34.9 A35 35 0 0 1 83.0 38.3 L96.0 40.2 L96.0 59.8 L83.0 61.7 A35 35 0 0 1 81.6 65.1 L89.4 75.6 L75.6 89.4 L65.1 81.6 A35 35 0 0 1 61.7 83.0 L59.8 96.0 L40.2 96.0 L38.3 83.0 A35 35 0 0 1 34.9 81.6 L24.4 89.4 L10.6 75.6 L18.4 65.1 A35 35 0 0 1 17.0 61.7 L4.0 59.8 L4.0 40.2 L17.0 38.3 A35 35 0 0 1 18.4 34.9 L10.6 24.4 L24.4 10.6 L34.9 18.4 A35 35 0 0 1 38.3 17.0 Z M36 50 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z',
  cog2: 'M50 20 a30 30 0 1 1 -0.1 0 Z M50 36 a14 14 0 1 0 0.1 0 Z M46 2 h8 v14 h-8 Z M46 84 h8 v14 h-8 Z M2 46 h14 v8 H2 Z M84 46 h14 v8 H84 Z M16 20 l6 -6 l10 10 l-6 6 Z M68 72 l6 -6 l10 10 l-6 6 Z',
  // 별·운·신비
  sparkle: 'M50 4 C54 32 68 46 96 50 C68 54 54 68 50 96 C46 68 32 54 4 50 C32 46 46 32 50 4 Z',
  moonStar: 'M58 10 C38 16 26 32 26 50 C26 70 40 86 60 90 C48 80 40 66 40 50 C40 34 48 20 58 10 Z M76 14 L80 26 L92 30 L80 34 L76 46 L72 34 L60 30 L72 26 Z',
  dice: 'M18 18 h64 v64 H18 Z M34 34 a7 7 0 1 1 -0.1 0 Z M66 34 a7 7 0 1 1 -0.1 0 Z M50 50 a7 7 0 1 1 -0.1 0 Z M34 66 a7 7 0 1 1 -0.1 0 Z M66 66 a7 7 0 1 1 -0.1 0 Z',
  coin: 'M50 8 a42 42 0 1 1 -0.1 0 Z M50 20 a30 30 0 1 0 0.1 0 Z M44 34 h12 v6 h-6 v6 h6 v6 h-12 v-6 h6 v-6 h-6 Z M46 28 h8 v44 h-8 Z',
  bag: 'M30 32 h40 l12 56 H18 Z M38 32 c0 -14 5 -22 12 -22 s12 8 12 22',
  gem: 'M28 14 h44 l20 24 l-42 50 L8 38 Z M28 14 L38 38 L50 88 L62 38 L72 14 M8 38 h84',
  // 저주·어둠
  curse: 'M50 8 C64 8 76 20 76 36 c0 12 -8 18 -8 28 v18 H32 V64 c0 -10 -8 -16 -8 -28 C24 20 36 8 50 8 Z M38 34 l10 8 l-10 8 Z M62 34 l-10 8 l10 8 Z M36 88 h28 v6 H36 Z',
  chains: 'M24 22 a14 14 0 1 1 20 20 l-8 8 a14 14 0 0 1 -20 -20 Z M56 56 a14 14 0 1 1 20 20 l-8 8 a14 14 0 0 1 -20 -20 Z M40 46 l20 20 l-8 8 l-20 -20 Z',
  hole: 'M50 22 c26 0 44 12 44 28 S76 78 50 78 S6 66 6 50 S24 22 50 22 Z M50 36 c-14 0 -24 6 -24 14 s10 14 24 14 s24 -6 24 -14 s-10 -14 -24 -14 Z',
  webTrap: 'M50 6 v88 M6 50 h88 M18 18 l64 64 M82 18 l-64 64 M50 22 L70 50 L50 78 L30 50 Z M50 6 L86 30 L86 70 L50 94 L14 70 L14 30 Z',
  tombstone: 'M28 90 V40 c0 -16 10 -26 22 -26 s22 10 22 26 v50 Z M18 90 h64 v8 H18 Z M46 36 h8 v34 h-8 Z M36 46 h32 v8 H36 Z',
  // 그 밖
  swap: 'M18 34 h50 V18 l24 20 l-24 20 V42 H18 Z M82 66 H32 V50 L8 70 l24 20 V74 h50 Z',
  cards2: 'M14 26 l30 -10 l26 66 l-30 10 Z M52 14 h34 v72 H52 Z M60 28 h18 v6 H60 Z M60 42 h18 v6 H60 Z',
  scale: 'M46 10 h8 v80 h-8 Z M26 94 h48 v6 H26 Z M12 34 h76 v6 H12 Z M12 38 L2 62 h20 Z M88 38 L78 62 h20 Z',
  door: 'M22 10 h56 v84 H22 Z M34 22 h32 v60 H34 Z M60 50 a4 4 0 1 1 -0.1 0 Z',
  mirror: 'M50 6 c18 0 32 18 32 38 S68 82 50 82 S18 64 18 44 S32 6 50 6 Z M44 86 h12 v10 h-12 Z M30 90 h40 v8 H30 Z M38 22 l-8 22 l14 -6 Z',
  flask: 'M40 8 h20 v26 l22 42 c4 8 -1 16 -10 16 H28 c-9 0 -14 -8 -10 -16 l22 -42 Z M34 10 h32 v8 H34 Z M28 62 h44 l6 12 H22 Z',
  feather: 'M84 10 C56 12 30 34 22 62 l-8 26 l8 -6 l6 -20 C36 40 58 22 84 10 Z M84 10 c-2 22 -12 40 -28 50 l-18 4 C56 52 74 34 84 10 Z',
  banner: 'M28 8 h44 v72 L50 64 L28 80 Z M22 8 h6 v88 h-6 Z',
  crownFall: 'M16 74 h68 l-6 14 H22 Z M16 74 L24 32 L38 50 L50 24 L62 50 L76 32 L84 74 Z M46 6 h8 v12 h-8 Z',
  clover: 'M50 50 a16 16 0 1 1 0 -22 a16 16 0 1 1 22 0 a16 16 0 1 1 0 22 a16 16 0 1 1 -22 0 Z M48 52 l-10 42 h24 Z',
  // 이하 계열 내 중복을 완전히 없애기 위한 보조 문양
  runeA: 'M50 6 L86 50 L50 94 L14 50 Z M50 28 L68 50 L50 72 L32 50 Z',
  runeB: 'M18 18 h64 v64 H18 Z M34 34 h32 v32 H34 Z M50 6 v12 M50 82 v12 M6 50 h12 M82 50 h12',
  runeC: 'M50 6 a44 44 0 1 1 -0.1 0 Z M50 22 L64 50 L50 78 L36 50 Z M20 50 h60',
  runeD: 'M10 50 L50 10 L90 50 L50 90 Z M28 50 L50 28 L72 50 L50 72 Z M50 40 a10 10 0 1 1 -0.1 0 Z',
  runeE: 'M24 10 h52 l-14 34 h20 L28 94 l12 -38 H20 Z',
  runeF: 'M50 4 L58 34 L90 34 L64 54 L74 88 L50 68 L26 88 L36 54 L10 34 L42 34 Z M50 40 a8 8 0 1 1 -0.1 0 Z',
};


export const INTENT_GLYPH = {
  attack: 'sword', attackDefend: 'twinSword', attackDebuff: 'claw', attackBuff: 'axe',
  defend: 'shield', defendBuff: 'shieldSpike', defendDebuff: 'shield',
  buff: 'arrowUp', debuff: 'arrowDown', strongDebuff: 'skull',
  unknown: 'question', sleep: 'zzz', stun: 'spiral', escape: 'foot', magic: 'star',
};

export const INTENT_COLOR = {
  attack: '#ff5a4a', attackDefend: '#ff8a4a', attackDebuff: '#ff6a8a', attackBuff: '#ff7a5a',
  defend: '#5ab0ff', defendBuff: '#6ad0ff', defendDebuff: '#7aa0ff',
  buff: '#ffd24a', debuff: '#b06adf', strongDebuff: '#d04aff',
  unknown: '#c0c0c0', sleep: '#8090a0', stun: '#a0a0a0', escape: '#a0e0a0', magic: '#e0a0ff',
};

/** SVG 문자열 생성 */
export function svgIcon(glyphName, { size = 20, color = '#fff', stroke = null, className = '' } = {}) {
  const d = GLYPH[glyphName] || GLYPH.star;
  const strokeAttr = stroke ? `stroke="${stroke}" stroke-width="6" stroke-linejoin="round"` : '';
  const fill = glyphName === 'wing' || glyphName === 'spiral' ? 'none' : color;
  const extra = (glyphName === 'wing' || glyphName === 'spiral')
    ? `stroke="${color}" stroke-width="7" stroke-linecap="round" fill="none"` : '';
  return `<svg class="ic ${className}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
    <path d="${d}" fill="${fill}" ${strokeAttr} ${extra}/></svg>`;
}

/**
 * 상태 아이콘 (v1.4.3).
 * 그림은 `js/ui/powerart.js` 에 있다 — 118종이 전부 다른 모양이고,
 * color 는 '@a' 자리에 들어갈 상태 색이다 (버프 노랑 / 디버프 보라).
 * 여기서 별표로 떨어지는 상태가 생기면 `node tools/check-powerart.mjs` 가 잡는다.
 */
export function powerIcon(id, size = 18, color = '#fff') {
  const art = POWER_ART[id];
  if (!art) return svgIcon('star', { size, color });
  return `<svg class="ic pw-ic" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">`
    + art.map(([d, c, o]) => `<path d="${d}" fill="${c === '@a' ? color : c}"${o ? ` opacity="${o}"` : ''}/>`).join('')
    + '</svg>';
}
export function intentIcon(type, size = 26) {
  return svgIcon(INTENT_GLYPH[type] || 'question', { size, color: INTENT_COLOR[type] || '#fff' });
}

/** 유물 문양 → 기본 글리프 매핑 */
export const RELIC_GLYPH = {
  blood: 'drop', cow: 'crown', anchor: 'ring', tea: 'potion', scroll: 'book', marble: 'ring',
  bag: 'potion', vial: 'drop', scale: 'shield', puzzle: 'gear', fish: 'wave', dream: 'eye',
  flower: 'star', beads: 'ring', lantern: 'flame', bank: 'bomb', ticket: 'book', nunchaku: 'chain',
  stone: 'shield', charm: 'star', pen: 'sword', belt: 'potion', insect: 'claw', pillow: 'heart',
  mask: 'skull', berry: 'heart', boot: 'foot', chest: 'bomb', vajra: 'lightning', paint: 'axe',
  whet: 'sword', skull: 'skull', candle: 'flame', bflame: 'flame', blight: 'lightning', btorn: 'spiral',
  periapt: 'ring', feather: 'wing', egg: 'drop', horn: 'claw', cleat: 'shield', ink: 'drop',
  kunai: 'twinSword', shuriken: 'star', opener: 'sword', fan: 'wing', doll: 'crown', meat: 'heart',
  hourglass: 'hourglass', hand: 'fist', panto: 'gear', pear: 'heart', qcard: 'question', bowl: 'ring',
  dummy: 'sword', sundial: 'ring', courier: 'foot', statue: 'crown', urn: 'potion', caliper: 'gear',
  wheel: 'ring', branch: 'thorn', voodoo: 'skull', helix: 'spiral', chip: 'star', ginger: 'heart',
  weight: 'hammer', icecream: 'drop', incense: 'flame', tail: 'claw', mango: 'heart', coin: 'ring',
  pipe: 'potion', watch: 'hourglass', prayer: 'ring', shovel: 'hammer', thread: 'chain', torii: 'crown',
  rod: 'hammer', turnip: 'heart', top: 'spiral', wing: 'wing', crown: 'crown', coffee: 'potion',
  key: 'chain', ecto: 'drop', hammer: 'hammer', markpain: 'skull', pstone: 'star', dome: 'shield',
  sozu: 'potion', choker: 'chain', snecko: 'eye', pyramid: 'star', cage: 'chain', bark: 'book',
  collar: 'chain', astro: 'star', house: 'crown',
};

/** 문자열 → 색상(HSL) */
export function hashColor(str, s = 55, l = 62) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return `hsl(${h} ${s}% ${l}%)`;
}

export function relicIcon(relicDef, size = 16) {
  const g = RELIC_GLYPH[relicDef.glyph] || 'star';
  const rar = relicDef.rarity;
  const color = rar === 'boss' ? '#d89aff' : rar === 'rare' ? '#ffd24a' : rar === 'uncommon' ? '#8ad0ff' : hashColor(relicDef.id, 45, 78);
  return svgIcon(g, { size, color });
}
