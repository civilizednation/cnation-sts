// ============================================================
//  상태 아이콘 (Power Art) — v1.4.3
//
//  전투 중 이름표 옆에 붙는 작은 그림 118종. 100x100 뷰박스 기준.
//  한 아이콘은 `[path, 색, 불투명도?]` 의 여러 겹이다 (카드 문양과 같은 규칙).
//  색에 '@a' 를 쓰면 그릴 때 상태 색(버프 노랑 / 디버프 보라)이 들어간다.
//
//  ▸ 118종이 전부 다른 모양이어야 한다 — `node tools/check-powerart.mjs`
//    유물·물약과 같은 이유다. 익숙해지면 글자보다 그림을 먼저 보는데,
//    겹치면 그림을 보고 이름을 또 확인해야 해서 그림을 두는 뜻이 없어진다.
//  ▸ 12px 로도 읽혀야 한다. 겹은 4장 이하, 가는 선은 두께 6 이상으로 둔다.
//  ▸ 각도는 도(°) 단위, 0°=오른쪽 · 90°=아래 · -90°=위 (SVG 는 y 가 아래로 자란다)
// ============================================================

const r1 = (n) => Math.round(n * 10) / 10;
const rad = (d) => (d * Math.PI) / 180;
/** 중심에서 각도·거리로 점 하나 */
const px = (cx, cy, r, a) => [r1(cx + r * Math.cos(rad(a))), r1(cy + r * Math.sin(rad(a)))];

// ---------------- 기본 도형 ----------------

/** 원. rev 를 주면 반대로 돌아 nonzero 규칙에서 구멍이 된다 */
const circle = (cx, cy, r, rev) =>
  `M${r1(cx - r)} ${r1(cy)}a${r1(r)} ${r1(r)} 0 1 ${rev ? 0 : 1} ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 ${rev ? 0 : 1} ${r1(-2 * r)} 0Z`;
/** 고리 (바깥 원 + 안쪽 구멍) */
const ring = (cx, cy, r, t) => circle(cx, cy, r) + circle(cx, cy, r - t, true);
/** 가운데 기준 네모 */
const rect = (cx, cy, w, h) => `M${r1(cx - w / 2)} ${r1(cy - h / 2)}h${r1(w)}v${r1(h)}h${r1(-w)}Z`;
const rectRev = (cx, cy, w, h) => `M${r1(cx - w / 2)} ${r1(cy - h / 2)}v${r1(h)}h${r1(w)}v${r1(-h)}Z`;
/** 테두리만 남긴 네모 */
const frame = (cx, cy, w, h, t) => rect(cx, cy, w, h) + rectRev(cx, cy, w - 2 * t, h - 2 * t);
/** 두 점을 잇는 두꺼운 막대 */
const bar = (x1, y1, x2, y2, w) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
  const nx = (-dy / L) * (w / 2), ny = (dx / L) * (w / 2);
  return `M${r1(x1 + nx)} ${r1(y1 + ny)}L${r1(x2 + nx)} ${r1(y2 + ny)}L${r1(x2 - nx)} ${r1(y2 - ny)}L${r1(x1 - nx)} ${r1(y1 - ny)}Z`;
};
/** 점 목록을 잇는 다각형 */
const poly = (...pts) => `M${pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L')}Z`;
const tri = (a, b, c) => poly(a, b, c);
/** 별 (ro 바깥 / ri 안쪽 / n 꼭지 / rot 첫 꼭지 각도) */
const star = (cx, cy, ro, ri, n = 5, rot = -90) => {
  const pts = [];
  for (let i = 0; i < n * 2; i++) pts.push(px(cx, cy, i % 2 ? ri : ro, rot + (i * 180) / n));
  return poly(...pts);
};
/** 두꺼운 호 (반지름 r 의 선을 두께 w 로) */
const arcBand = (cx, cy, r, w, a0, a1) => {
  const ro = r + w / 2, ri = r - w / 2;
  const big = (((a1 - a0) % 360) + 360) % 360 > 180 ? 1 : 0;
  const [x0, y0] = px(cx, cy, ro, a0), [x1, y1] = px(cx, cy, ro, a1);
  const [x2, y2] = px(cx, cy, ri, a1), [x3, y3] = px(cx, cy, ri, a0);
  return `M${x0} ${y0}A${r1(ro)} ${r1(ro)} 0 ${big} 1 ${x1} ${y1}L${x2} ${y2}A${r1(ri)} ${r1(ri)} 0 ${big} 0 ${x3} ${y3}Z`;
};
/** 부채꼴 */
const wedge = (cx, cy, r, a0, a1) => {
  const big = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const [x0, y0] = px(cx, cy, r, a0), [x1, y1] = px(cx, cy, r, a1);
  return `M${r1(cx)} ${r1(cy)}L${x0} ${y0}A${r1(r)} ${r1(r)} 0 ${big} 1 ${x1} ${y1}Z`;
};
/** 초승달 (원에서 살짝 옮긴 원을 뺀 모양) */
const crescent = (cx, cy, r, dx, dy, r2) => circle(cx, cy, r) + circle(cx + dx, cy + dy, r2 || r * 0.9, true);
/** 물방울 (뾰족한 쪽이 위) */
const drop = (cx, cy, s) =>
  `M${r1(cx)} ${r1(cy - 1.95 * s)}Q${r1(cx + 1.05 * s)} ${r1(cy - 0.5 * s)} ${r1(cx + 0.95 * s)} ${r1(cy + 0.3 * s)}` +
  `A${r1(s)} ${r1(s)} 0 1 1 ${r1(cx - 0.95 * s)} ${r1(cy + 0.3 * s)}Q${r1(cx - 1.05 * s)} ${r1(cy - 0.5 * s)} ${r1(cx)} ${r1(cy - 1.95 * s)}Z`;
/** 화살표 (a 방향으로 길이 L, 자루 두께 w) */
const arrow = (cx, cy, L, w, a = -90, hw = 0, hl = 0) => {
  const HW = hw || w * 2.1, HL = hl || L * 0.42;
  const [tx, ty] = px(cx, cy, L / 2, a);              // 촉 끝
  const [bx, by] = px(cx, cy, L / 2, a + 180);        // 자루 끝
  const [nx, ny] = [Math.cos(rad(a + 90)), Math.sin(rad(a + 90))];
  const [hx, hy] = px(tx, ty, HL, a + 180);           // 촉 밑변 중심
  return poly([tx, ty], [hx + nx * HW / 2, hy + ny * HW / 2], [hx + nx * w / 2, hy + ny * w / 2],
    [bx + nx * w / 2, by + ny * w / 2], [bx - nx * w / 2, by - ny * w / 2],
    [hx - nx * w / 2, hy - ny * w / 2], [hx - nx * HW / 2, hy - ny * HW / 2]);
};
/** 갈매기표(꺾쇠). a 는 뾰족한 쪽 방향 */
const chev = (cx, cy, w, h, t, a = -90) => {
  const s = Math.sin(rad(a + 90)), c = Math.cos(rad(a + 90));
  const R = ([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
  return poly(R([cx - w / 2, cy + h / 2]), R([cx, cy - h / 2]), R([cx + w / 2, cy + h / 2]),
    R([cx + w / 2 - t * 1.4, cy + h / 2]), R([cx, cy - h / 2 + t * 1.6]), R([cx - w / 2 + t * 1.4, cy + h / 2]));
};
/** 더하기 */
const plus = (cx, cy, r, t) => rect(cx, cy, r * 2, t) + rect(cx, cy, t, r * 2);
/** 가위표 */
const cross = (cx, cy, r, t) => bar(cx - r, cy - r, cx + r, cy + r, t) + bar(cx + r, cy - r, cx - r, cy + r, t);
/** 금지 표시 (고리 + 빗금) */
const ban = (cx, cy, r, t) => ring(cx, cy, r, t) + bar(...px(cx, cy, r, -45), ...px(cx, cy, r, 135), t);

// ---------------- 그림꼴 (뜻을 지닌 기본 모양) ----------------

/** 불꽃 */
const flame = (cx, cy, s) =>
  `M${r1(cx)} ${r1(cy - 2 * s)}C${r1(cx + 0.4 * s)} ${r1(cy - s)} ${r1(cx + 1.3 * s)} ${r1(cy - 0.6 * s)} ${r1(cx + 1.3 * s)} ${r1(cy + 0.3 * s)}` +
  `C${r1(cx + 1.3 * s)} ${r1(cy + 1.4 * s)} ${r1(cx + 0.7 * s)} ${r1(cy + 2 * s)} ${r1(cx)} ${r1(cy + 2 * s)}` +
  `C${r1(cx - 0.7 * s)} ${r1(cy + 2 * s)} ${r1(cx - 1.3 * s)} ${r1(cy + 1.4 * s)} ${r1(cx - 1.3 * s)} ${r1(cy + 0.3 * s)}` +
  `C${r1(cx - 1.3 * s)} ${r1(cy - 0.4 * s)} ${r1(cx - 0.7 * s)} ${r1(cy - 0.6 * s)} ${r1(cx - 0.5 * s)} ${r1(cy - 1.2 * s)}` +
  `C${r1(cx - 0.3 * s)} ${r1(cy - 0.5 * s)} ${r1(cx)} ${r1(cy - 0.6 * s)} ${r1(cx)} ${r1(cy - 2 * s)}Z`;
/** 심장 */
const heart = (cx, cy, s) =>
  `M${r1(cx)} ${r1(cy + 1.5 * s)}C${r1(cx - 1.9 * s)} ${r1(cy + 0.2 * s)} ${r1(cx - 2.1 * s)} ${r1(cy - 1 * s)} ${r1(cx - 1.1 * s)} ${r1(cy - 1.5 * s)}` +
  `C${r1(cx - 0.4 * s)} ${r1(cy - 1.8 * s)} ${r1(cx)} ${r1(cy - 1.2 * s)} ${r1(cx)} ${r1(cy - 0.7 * s)}` +
  `C${r1(cx)} ${r1(cy - 1.2 * s)} ${r1(cx + 0.4 * s)} ${r1(cy - 1.8 * s)} ${r1(cx + 1.1 * s)} ${r1(cy - 1.5 * s)}` +
  `C${r1(cx + 2.1 * s)} ${r1(cy - 1 * s)} ${r1(cx + 1.9 * s)} ${r1(cy + 0.2 * s)} ${r1(cx)} ${r1(cy + 1.5 * s)}Z`;
/** 방패 */
const shield = (cx, cy, w, h) =>
  `M${r1(cx)} ${r1(cy - h / 2)}L${r1(cx + w / 2)} ${r1(cy - h / 2 + h * 0.16)}V${r1(cy + h * 0.02)}` +
  `C${r1(cx + w / 2)} ${r1(cy + h * 0.3)} ${r1(cx + w * 0.26)} ${r1(cy + h / 2)} ${r1(cx)} ${r1(cy + h / 2)}` +
  `C${r1(cx - w * 0.26)} ${r1(cy + h / 2)} ${r1(cx - w / 2)} ${r1(cy + h * 0.3)} ${r1(cx - w / 2)} ${r1(cy + h * 0.02)}` +
  `V${r1(cy - h / 2 + h * 0.16)}Z`;
/** 번개 */
const bolt = (cx, cy, s) => poly([cx + 0.5 * s, cy - 2 * s], [cx - 1.1 * s, cy + 0.15 * s], [cx - 0.1 * s, cy + 0.15 * s],
  [cx - 0.5 * s, cy + 2 * s], [cx + 1.1 * s, cy - 0.2 * s], [cx + 0.1 * s, cy - 0.2 * s]);
/** 눈 (아몬드 + 눈동자) */
const eye = (cx, cy, w, h) =>
  `M${r1(cx - w / 2)} ${r1(cy)}Q${r1(cx)} ${r1(cy - h)} ${r1(cx + w / 2)} ${r1(cy)}Q${r1(cx)} ${r1(cy + h)} ${r1(cx - w / 2)} ${r1(cy)}Z`;
/** 해골 */
const skull = (cx, cy, s) =>
  `M${r1(cx)} ${r1(cy - 1.7 * s)}C${r1(cx + 1.5 * s)} ${r1(cy - 1.7 * s)} ${r1(cx + 1.6 * s)} ${r1(cy - 0.3 * s)} ${r1(cx + 1.3 * s)} ${r1(cy + 0.5 * s)}` +
  `L${r1(cx + 1.1 * s)} ${r1(cy + 1.6 * s)}L${r1(cx - 1.1 * s)} ${r1(cy + 1.6 * s)}L${r1(cx - 1.3 * s)} ${r1(cy + 0.5 * s)}` +
  `C${r1(cx - 1.6 * s)} ${r1(cy - 0.3 * s)} ${r1(cx - 1.5 * s)} ${r1(cy - 1.7 * s)} ${r1(cx)} ${r1(cy - 1.7 * s)}Z` +
  circle(cx - 0.62 * s, cy - 0.25 * s, 0.4 * s, true) + circle(cx + 0.62 * s, cy - 0.25 * s, 0.4 * s, true) +
  poly([cx, cy + 0.25 * s], [cx - 0.26 * s, cy + 0.75 * s], [cx + 0.26 * s, cy + 0.75 * s]);
/** 주먹 */
const fist = (cx, cy, s) =>
  `M${r1(cx - 1.3 * s)} ${r1(cy - 0.2 * s)}c0 ${r1(-0.7 * s)} ${r1(0.5 * s)} ${r1(-0.9 * s)} ${r1(0.8 * s)} ${r1(-0.7 * s)}` +
  `v${r1(-0.8 * s)}c0 ${r1(-0.5 * s)} ${r1(0.8 * s)} ${r1(-0.5 * s)} ${r1(0.8 * s)} 0v${r1(0.45 * s)}` +
  `c0 ${r1(-0.5 * s)} ${r1(0.8 * s)} ${r1(-0.5 * s)} ${r1(0.8 * s)} 0v${r1(0.6 * s)}` +
  `c${r1(0.35 * s)} ${r1(-0.1 * s)} ${r1(0.7 * s)} ${r1(0.15 * s)} ${r1(0.7 * s)} ${r1(0.6 * s)}` +
  `v${r1(0.8 * s)}c0 ${r1(0.95 * s)} ${r1(-0.7 * s)} ${r1(1.55 * s)} ${r1(-1.6 * s)} ${r1(1.55 * s)}` +
  `s${r1(-1.5 * s)} ${r1(-0.6 * s)} ${r1(-1.5 * s)} ${r1(-1.55 * s)}Z`;
/** 손바닥 (손가락 넷 + 엄지) */
const hand = (cx, cy, s) =>
  rect(cx - 0.75 * s, cy - 0.45 * s, 0.42 * s, 1.5 * s) + rect(cx - 0.25 * s, cy - 0.6 * s, 0.42 * s, 1.8 * s) +
  rect(cx + 0.25 * s, cy - 0.55 * s, 0.42 * s, 1.7 * s) + rect(cx + 0.75 * s, cy - 0.35 * s, 0.42 * s, 1.3 * s) +
  `M${r1(cx - 1.05 * s)} ${r1(cy + 0.25 * s)}h${r1(2.1 * s)}v${r1(0.75 * s)}a${r1(1.05 * s)} ${r1(1.05 * s)} 0 0 1 ${r1(-2.1 * s)} 0Z`;
/** 구름 */
const cloud = (cx, cy, s) =>
  `M${r1(cx - 1.6 * s)} ${r1(cy + 0.75 * s)}a${r1(0.75 * s)} ${r1(0.75 * s)} 0 0 1 ${r1(0.15 * s)} ${r1(-1.45 * s)}` +
  `a${r1(1.05 * s)} ${r1(1.05 * s)} 0 0 1 ${r1(2 * s)} ${r1(-0.35 * s)}a${r1(0.85 * s)} ${r1(0.85 * s)} 0 0 1 ${r1(1.55 * s)} ${r1(0.6 * s)}` +
  `a${r1(0.7 * s)} ${r1(0.7 * s)} 0 0 1 ${r1(-0.1 * s)} ${r1(1.2 * s)}Z`;
/** 카드 한 장 (기울일 수 있다) */
const card = (cx, cy, w, h, rot = 0) => {
  const s = Math.sin(rad(rot)), c = Math.cos(rad(rot));
  const R = (x, y) => [cx + x * c - y * s, cy + x * s + y * c];
  return poly(R(-w / 2, -h / 2), R(w / 2, -h / 2), R(w / 2, h / 2), R(-w / 2, h / 2));
};
/** 물결선 (좌→우, 골 두 번) */
const wave = (x0, x1, y, amp, t) => {
  const w = x1 - x0, q = w / 4;
  return `M${r1(x0)} ${r1(y)}q${r1(q / 2)} ${r1(-amp)} ${r1(q)} 0t${r1(q)} 0t${r1(q)} 0t${r1(q)} 0` +
    `v${r1(t)}q${r1(-q / 2)} ${r1(amp)} ${r1(-q)} 0t${r1(-q)} 0t${r1(-q)} 0t${r1(-q)} 0Z`;
};
/** 연꽃 */
const lotus = (cx, cy, s) =>
  `M${r1(cx)} ${r1(cy - 1.5 * s)}c${r1(0.75 * s)} ${r1(0.9 * s)} ${r1(0.9 * s)} ${r1(2.1 * s)} 0 ${r1(3 * s)}c${r1(-0.9 * s)} ${r1(-0.9 * s)} ${r1(-0.75 * s)} ${r1(-2.1 * s)} 0 ${r1(-3 * s)}Z` +
  `M${r1(cx)} ${r1(cy + 1.5 * s)}c${r1(-1.2 * s)} ${r1(-0.3 * s)} ${r1(-2.1 * s)} ${r1(-1.2 * s)} ${r1(-2.25 * s)} ${r1(-2.55 * s)}c${r1(1.2 * s)} ${r1(0.15 * s)} ${r1(1.95 * s)} ${r1(1.05 * s)} ${r1(2.25 * s)} ${r1(2.55 * s)}Z` +
  `M${r1(cx)} ${r1(cy + 1.5 * s)}c${r1(1.2 * s)} ${r1(-0.3 * s)} ${r1(2.1 * s)} ${r1(-1.2 * s)} ${r1(2.25 * s)} ${r1(-2.55 * s)}c${r1(-1.2 * s)} ${r1(0.15 * s)} ${r1(-1.95 * s)} ${r1(1.05 * s)} ${r1(-2.25 * s)} ${r1(2.55 * s)}Z` +
  `M${r1(cx)} ${r1(cy + 1.5 * s)}c${r1(-1.5 * s)} ${r1(0.3 * s)} ${r1(-2.85 * s)} ${r1(-0.15 * s)} ${r1(-3.6 * s)} ${r1(-1.2 * s)}c${r1(1.2 * s)} ${r1(-0.6 * s)} ${r1(2.55 * s)} ${r1(-0.3 * s)} ${r1(3.6 * s)} ${r1(1.2 * s)}Z` +
  `M${r1(cx)} ${r1(cy + 1.5 * s)}c${r1(1.5 * s)} ${r1(0.3 * s)} ${r1(2.85 * s)} ${r1(-0.15 * s)} ${r1(3.6 * s)} ${r1(-1.2 * s)}c${r1(-1.2 * s)} ${r1(-0.6 * s)} ${r1(-2.55 * s)} ${r1(-0.3 * s)} ${r1(-3.6 * s)} ${r1(1.2 * s)}Z`;
/** 날개 한 쪽 — 앞전은 매끈하고 뒷전은 깃 세 겹 (dir 1 오른쪽 / -1 왼쪽) */
const wing = (cx, cy, s, dir = 1) => {
  const X = (v) => cx + v * s * dir;
  return `M${r1(X(0))} ${r1(cy - 1.1 * s)}C${r1(X(1.7))} ${r1(cy - 1.3 * s)} ${r1(X(3.1))} ${r1(cy - 0.3 * s)} ${r1(X(3.5))} ${r1(cy + 0.9 * s)}` +
    `L${r1(X(2.55))} ${r1(cy + 0.3 * s)}L${r1(X(2.45))} ${r1(cy + 1 * s)}L${r1(X(1.7))} ${r1(cy + 0.35 * s)}` +
    `L${r1(X(1.6))} ${r1(cy + 0.95 * s)}L${r1(X(0.9))} ${r1(cy + 0.25 * s)}L${r1(X(0.8))} ${r1(cy + 0.8 * s)}` +
    `L${r1(X(0.1))} ${r1(cy + 0.05 * s)}Z`;
};
/** 정다각형 */
const ngon = (cx, cy, r, n, rot = -90) => poly(...Array.from({ length: n }, (_, i) => px(cx, cy, r, rot + (i * 360) / n)));
/** 마름모 (기술 카드 표식) */
const diamond = (cx, cy, w, h) => poly([cx, cy - h / 2], [cx + w / 2, cy], [cx, cy + h / 2], [cx - w / 2, cy]);
/** 톱니바퀴 */
const gear = (cx, cy, r, n = 8, hole = 0) => {
  const t = 360 / n, out = [];
  for (let i = 0; i < n; i++) {
    const a = i * t;
    out.push(px(cx, cy, r * 0.74, a - t * 0.34), px(cx, cy, r, a - t * 0.17),
      px(cx, cy, r, a + t * 0.17), px(cx, cy, r * 0.74, a + t * 0.34));
  }
  return poly(...out) + (hole ? circle(cx, cy, hole, true) : '');
};
/** 소용돌이 (호를 겹쳐 안으로 말아 들어간다) */
const spiral = (cx, cy, r, t, turns = 1.75) => {
  let d = '', a = -90;
  const steps = Math.round(turns * 4);
  for (let i = 0; i < steps; i++) {
    const rr = r - ((r * 0.68) / steps) * i;
    d += arcBand(cx, cy, rr - ((r * 0.68) / steps) * 0.5, t, a, a + 92);
    a += 90;
  }
  return d;
};
/** 모래시계 */
const hourglass = (cx, cy, w, h) =>
  poly([cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w * 0.09, cy], [cx + w / 2, cy + h / 2],
    [cx - w / 2, cy + h / 2], [cx - w * 0.09, cy]);
/** 다음 턴 표시 — 시계 방향으로 도는 화살표 (안쪽에 다른 그림을 넣어 쓴다) */
const turnArrow = (cx, cy, r, t) => {
  const [hx, hy] = px(cx, cy, r, 35);
  return arcBand(cx, cy, r, t, -150, 35) + poly([hx + t, hy - t * 1.1], [hx - t * 1.9, hy + t * 0.5], [hx + t * 0.6, hy + t * 2.1]);
};
/** 사슬 고리 하나 */
const chainLink = (cx, cy, r, t, rot = 0) => {
  const a = rad(rot), c = Math.cos(a), sn = Math.sin(a);
  const R = (x, y) => [cx + x * c - y * sn, cy + x * sn + y * c];
  return poly(R(-r, -r * 0.62), R(r, -r * 0.62), R(r, r * 0.62), R(-r, r * 0.62)) +
    poly(R(-r + t, r * 0.62 - t), R(r - t, r * 0.62 - t), R(r - t, -r * 0.62 + t), R(-r + t, -r * 0.62 + t));
};
/** 동전 (고리 + 가운데 세로 막대) */
const coin = (cx, cy, r) => ring(cx, cy, r, r * 0.22) + rect(cx, cy, r * 0.28, r * 1.1);
/** 심전도 선 */
const ekg = (x0, x1, y, amp, t) => {
  const w = (x1 - x0) / 6;
  return bar(x0, y, x0 + w * 1.6, y, t) + bar(x0 + w * 1.6, y, x0 + w * 2.4, y - amp, t) +
    bar(x0 + w * 2.4, y - amp, x0 + w * 3.2, y + amp * 0.8, t) + bar(x0 + w * 3.2, y + amp * 0.8, x0 + w * 4, y, t) +
    bar(x0 + w * 4, y, x1, y, t);
};
/** 칼날 (뾰족한 쪽이 위, 자루까지) */
const blade = (cx, cy, L, w) =>
  poly([cx, cy - L / 2], [cx + w / 2, cy - L / 2 + w], [cx + w * 0.38, cy + L * 0.12], [cx - w * 0.38, cy + L * 0.12], [cx - w / 2, cy - L / 2 + w]) +
  rect(cx, cy + L * 0.17, w * 1.5, L * 0.1) + rect(cx, cy + L * 0.33, w * 0.42, L * 0.24);
/** 책 (펼친 면) */
const book = (cx, cy, w, h) =>
  `M${r1(cx - 1)} ${r1(cy - h / 2)}c${r1(-w * 0.2)} ${r1(-h * 0.16)} ${r1(-w * 0.34)} ${r1(-h * 0.16)} ${r1(-w / 2 + 1)} 0v${r1(h)}c${r1(w * 0.16)} ${r1(-h * 0.14)} ${r1(w * 0.3)} ${r1(-h * 0.14)} ${r1(w / 2 - 1)} 0Z` +
  `M${r1(cx + 1)} ${r1(cy - h / 2)}c${r1(w * 0.2)} ${r1(-h * 0.16)} ${r1(w * 0.34)} ${r1(-h * 0.16)} ${r1(w / 2 - 1)} 0v${r1(h)}c${r1(-w * 0.16)} ${r1(-h * 0.14)} ${r1(-w * 0.3)} ${r1(-h * 0.14)} ${r1(-w / 2 + 1)} 0Z`;
/** 구슬 (고리 + 가운데 점) */
const orb = (cx, cy, r) => ring(cx, cy, r, r * 0.26) + circle(cx, cy, r * 0.3);
/** 바깥으로 뻗은 삼각 n개 (len 을 음수로 주면 안쪽을 향한다) */
const spikes = (cx, cy, r, len, n, w = 18, rot = -90, span = 360) => {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = rot + (span / (span === 360 ? n : n - 1)) * i;
    d += tri(px(cx, cy, r + len, a), px(cx, cy, r, a - w / 2), px(cx, cy, r, a + w / 2));
  }
  return d;
};
/** 중심에서 뻗는 살 n개 */
const rays = (cx, cy, r0, r1, n, w, rot = -90, span = 360) => {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = rot + (span / (span === 360 ? n : n - 1)) * i;
    d += bar(...px(cx, cy, r0, a), ...px(cx, cy, r1, a), w);
  }
  return d;
};
/** 고리 모양으로 늘어놓은 점 n개 (염주) */
const dotRing = (cx, cy, r, n, rr, rot = -90) => {
  let d = '';
  for (let i = 0; i < n; i++) d += circle(...px(cx, cy, r, rot + (i * 360) / n), rr);
  return d;
};
/** 왕관 */
const crown = (cx, cy, w, h) =>
  poly([cx - w / 2, cy + h / 2], [cx - w / 2, cy - h / 2], [cx - w / 4, cy], [cx, cy - h * 0.62],
    [cx + w / 4, cy], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2]);
/** 물음표 · 느낌표 (100 뷰박스 그대로) */
const QMARK = 'M33 36c0-14 9-24 19-24c12 0 19 9 19 19c0 14-16 16-16 27v5H44v-9c0-15 16-15 16-23c0-5-3-9-7-9c-6 0-9 6-9 14Z'
  + 'M45 72h14v14H45Z';
/** 유령 (아랫단이 물결) */
const ghost = (cx, cy, s) =>
  `M${r1(cx - 1.3 * s)} ${r1(cy + 1.5 * s)}V${r1(cy - 0.2 * s)}a${r1(1.3 * s)} ${r1(1.3 * s)} 0 0 1 ${r1(2.6 * s)} 0V${r1(cy + 1.5 * s)}` +
  `l${r1(-0.65 * s)} ${r1(-0.55 * s)}l${r1(-0.65 * s)} ${r1(0.55 * s)}l${r1(-0.65 * s)} ${r1(-0.55 * s)}Z`;

export const SHAPE = { circle, ring, rect, rectRev, frame, bar, poly, tri, star, arcBand, wedge,
  crescent, drop, arrow, chev, plus, cross, ban, flame, heart, shield, bolt, eye, skull, fist,
  hand, cloud, card, wave, lotus, wing, ngon, diamond, gear, spiral, hourglass, turnArrow,
  chainLink, coin, ekg, blade, book, orb, spikes, rays, ghost, dotRing, crown, px };

// ============================================================
//  상태 아이콘 118종
//  '@a' = 상태 색 (버프 노랑 / 디버프 보라). 나머지는 뜻을 나르는 색이다 —
//  불 주황 · 피 빨강 · 독 초록 · 번개 노랑 · 얼음 하늘 · 신성 미색 · 어둠 보라.
// ============================================================
const A = '@a';
const C = {
  fire: '#ff8a4a', blood: '#ff6a5a', poison: '#8ae05a', ice: '#7ac8ff', bolt: '#ffd24a',
  gold: '#ffcf4a', holy: '#fff3bc', void: '#b884ff', steel: '#cdd6e6', ink: '#191324',
  green: '#6ee08a', cyan: '#6fe0d0', pink: '#ff93d2', earth: '#c98a5a',
};

export const POWER_ART = {
  // ---------------- 공통 버프 ----------------
  strength:    [[fist(50, 52, 21), A], [rect(50, 44, 30, 5) + rect(50, 56, 30, 5), C.ink]],
  dexterity:   [[wing(40, 44, 10, -1) + wing(60, 44, 10, 1), A], [bar(50, 26, 50, 84, 9), A]],
  vigor:       [[blade(46, 52, 66, 24), A], [flame(80, 26, 10), C.fire]],
  artifact:    [[ngon(50, 50, 32, 6), A], [ngon(50, 50, 16, 6), C.holy, 0.9]],
  thorns:      [[bar(16, 80, 84, 26, 11), A], [tri([30, 54], [46, 62], [40, 40]) + tri([56, 38], [72, 46], [66, 24]), A]],
  plated:      [[shield(50, 50, 58, 70), A], [rect(50, 36, 44, 6) + rect(50, 50, 40, 6) + rect(50, 64, 28, 6), C.ink]],
  metallicize: [[shield(50, 50, 58, 70), A], [poly([34, 26], [50, 26], [40, 76], [28, 58]), C.holy, 0.85]],
  regeneration:[[heart(50, 52, 21), A], [plus(50, 52, 13, 8), C.green]],
  ritual:      [[ring(50, 50, 33, 7), A], [circle(50, 26, 8) + circle(29, 62, 8) + circle(71, 62, 8), A], [circle(50, 50, 10), A]],
  demonForm:   [[skull(50, 58, 19), A], [tri([24, 26], [36, 52], [16, 48]) + tri([76, 26], [84, 48], [64, 52]), A]],
  barricade:   [[shield(50, 52, 54, 66), A], [rect(50, 42, 80, 9) + rect(50, 62, 80, 9), C.ink]],
  darkEmbrace: [[crescent(30, 50, 29, 14, 0, 27), A], [crescent(70, 50, 29, -14, 0, 27), A], [card(50, 50, 22, 32), C.void]],
  evolve:      [[rect(24, 72, 22, 22) + rect(48, 62, 22, 42) + rect(72, 50, 22, 66), A], [rect(72, 24, 22, 14), C.green]],
  feelNoPain:  [[shield(50, 52, 56, 66), A], [flame(50, 52, 14), C.fire]],
  fireBreathing:[[wedge(12, 50, 28, -36, 36), A], [flame(56, 50, 14), C.fire], [flame(82, 50, 10), C.fire]],
  flameBarrier:[[ring(50, 50, 20, 8), A], [flame(50, 16, 9) + flame(84, 50, 9) + flame(50, 84, 9) + flame(16, 50, 9), C.fire]],
  juggernaut:  [[shield(34, 50, 44, 62), A], [arrow(74, 50, 36, 12, 0), C.fire]],
  rupture:     [[drop(50, 34, 16), C.blood], [arrow(50, 76, 30, 11), A]],
  brutality:   [[card(42, 54, 40, 56, -8), A], [drop(72, 32, 14), C.blood]],
  corruption:  [[card(44, 56, 40, 56, -8), A], [skull(70, 34, 14), C.void]],
  berserk:     [[ring(50, 50, 27, 9), A], [bolt(50, 50, 13), C.bolt]],
  combust:     [[star(50, 50, 42, 17, 8), A], [flame(50, 52, 14), C.fire]],
  doubleTap:   [[blade(36, 50, 62, 22), A, 0.45], [blade(60, 50, 62, 22), A]],
  rage:        [[shield(50, 52, 58, 68), A], [bar(28, 38, 47, 47, 9) + bar(72, 38, 53, 47, 9), C.ink]],
  intangible:  [[ghost(50, 46, 17), A, 0.42], [circle(43, 42, 4) + circle(57, 42, 4), A]],
  buffer:      [[shield(50, 50, 60, 72), A], [heart(50, 50, 15), C.ink]],
  mayhem:      [[card(26, 60, 28, 40, -24), A, 0.7], [card(74, 60, 28, 40, 24), A, 0.7], [card(50, 48, 30, 42, 4), A]],
  panache:     [[rays(50, 84, 12, 68, 5, 9, -150, 120), A], [circle(50, 84, 9), A]],
  sadistic:    [[blade(40, 50, 66, 20), A], [drop(72, 32, 11) + drop(80, 62, 9), C.blood]],
  magnetism:   [[arcBand(50, 48, 25, 15, 180, 360), A], [rect(27.5, 66, 15, 28) + rect(72.5, 66, 15, 28), A],
                [rect(27.5, 76, 15, 10), C.blood], [rect(72.5, 76, 15, 10), C.steel]],
  nextTurnBlock:[[turnArrow(50, 50, 34, 10), A], [shield(50, 52, 34, 42), A]],

  // ---------------- 공통 디버프 ----------------
  vulnerable:  [[shield(50, 50, 58, 70), A], [bar(44, 18, 56, 42, 7) + bar(56, 42, 42, 60, 7) + bar(42, 60, 54, 82, 7), C.ink]],
  weak:        [[blade(50, 40, 56, 22), A], [arrow(50, 80, 26, 10, 90), C.steel]],
  frail:       [[shield(50, 42, 52, 56), A], [arrow(50, 82, 24, 10, 90), C.steel]],
  poison:      [[drop(50, 48, 20), C.poison], [circle(43, 48, 4.5) + circle(57, 48, 4.5), C.ink], [rect(50, 60, 11, 5), C.ink]],
  entangled:   [[blade(50, 46, 66, 22), A], [arcBand(50, 30, 24, 9, -170, -10) + arcBand(50, 62, 24, 9, 10, 170), C.green]],
  confused:    [[spiral(50, 50, 35, 9), A]],
  noDraw:      [[card(42, 48, 40, 56), A], [ban(66, 66, 24, 8), C.blood]],
  drawReduction:[[card(40, 46, 38, 54), A], [arrow(74, 66, 32, 10, 90), C.steel]],
  constricted: [[rect(50, 50, 15, 66), A], [arrow(20, 50, 30, 10, 0) + arrow(80, 50, 30, 10, 180), C.blood]],
  shackled:    [[ring(23, 50, 18, 8) + ring(77, 50, 18, 8), A], [rect(50, 50, 28, 10), C.steel]],
  bias:        [[wing(34, 38, 11, 1), A], [arrow(50, 78, 26, 10, 90), C.steel]],
  hex:         [[ring(50, 50, 33, 8), A], [star(50, 50, 25, 11, 5, 90), A]],
  duplication: [[card(36, 46, 34, 50), A, 0.5], [card(58, 56, 34, 50), A]],
  noBlock:     [[shield(50, 50, 56, 66), A], [cross(50, 50, 16, 9), C.ink]],
  bomb:        [[circle(50, 62, 26), A], [rect(50, 32, 15, 14), A], [bar(56, 28, 72, 16, 7), A], [flame(76, 12, 8), C.fire]],
  nextTurnEnergy:[[turnArrow(50, 50, 34, 10), A], [circle(50, 52, 17), A], [bolt(50, 52, 10), C.ink]],
  nextTurnDraw:[[turnArrow(50, 50, 34, 10), A], [card(50, 52, 26, 36), A]],
  wellLaidPlans:[[card(42, 58, 38, 52), A], [arcBand(70, 40, 12, 7, 180, 360), C.gold], [rect(70, 56, 26, 22), C.gold]],
  choke:       [[circle(50, 28, 15), A], [rect(50, 52, 17, 24), A], [rect(50, 52, 48, 9) + rect(50, 68, 48, 9), C.blood]],

  // ---------------- 사일런트 ----------------
  envenom:     [[blade(42, 50, 66, 22), A], [drop(76, 40, 13) + drop(80, 68, 9), C.poison]],
  accuracy:    [[blade(42, 50, 66, 20), A], [plus(78, 36, 14, 8), C.gold]],
  thousandCuts:[[bar(20, 74, 44, 20, 8) + bar(44, 80, 68, 26, 8) + bar(66, 74, 86, 28, 8), A], [bar(32, 84, 52, 40, 6), C.blood]],
  afterImage:  [[shield(26, 56, 38, 46), A, 0.3], [shield(44, 52, 38, 46), A, 0.6], [shield(64, 48, 38, 46), A]],
  infiniteBlades:[[blade(50, 38, 58, 22), A], [ring(36, 76, 14, 6) + ring(64, 76, 14, 6), C.steel]],
  noxiousFumes:[[cloud(50, 40, 17), C.poison], [drop(30, 78, 9) + drop(50, 84, 9) + drop(70, 78, 9), C.poison]],
  burst:       [[diamond(38, 50, 40, 60), A, 0.5], [diamond(60, 50, 40, 60), A]],
  doubleDamage:[[circle(50, 50, 38), A, 0.22], [circle(50, 50, 27), A, 0.3], [blade(50, 50, 70, 24), C.holy]],
  corpseExplosion:[[star(50, 52, 42, 18, 10), C.poison], [skull(50, 54, 17), A]],
  blur:        [[shield(50, 48, 56, 64), A], [rect(50, 38, 66, 7) + rect(50, 52, 66, 7) + rect(50, 66, 66, 7), C.cyan, 0.85]],
  toolsOfTheTrade:[[card(38, 52, 38, 54), A], [arrow(72, 32, 30, 9) + arrow(72, 72, 30, 9, 90), C.steel]],
  deadlyPoison:[[drop(44, 50, 21), C.poison], [plus(78, 30, 13, 8), A]],

  // ---------------- 디펙트 (구체) ----------------
  focus:       [[ring(50, 50, 34, 7), A], [ring(50, 50, 21, 7), A], [circle(50, 50, 9), A]],
  lockOn:      [[ring(50, 50, 26, 8), A], [rays(50, 50, 30, 44, 4, 8, -90), A], [circle(50, 50, 7), A]],
  electro:     [[bolt(30, 50, 15) + bolt(50, 50, 15) + bolt(70, 50, 15), C.bolt]],
  loop:        [[turnArrow(50, 50, 34, 10), A], [orb(50, 52, 17), A]],
  staticDischarge:[[shield(50, 52, 56, 66), A], [bolt(50, 50, 15), C.bolt]],
  echoForm:    [[arcBand(24, 50, 16, 8, -70, 70) + arcBand(24, 50, 31, 8, -70, 70) + arcBand(24, 50, 46, 8, -70, 70), A], [circle(24, 50, 8), A]],
  creativeAI:  [[circle(50, 40, 24), A], [rect(50, 70, 22, 14) + rect(50, 84, 16, 10), A], [rays(50, 40, 28, 40, 4, 7, -135), C.holy]],
  heatsinks:   [[rect(28, 62, 11, 52) + rect(43, 62, 11, 52) + rect(58, 62, 11, 52) + rect(73, 62, 11, 52), A],
                [wave(18, 84, 20, 7, 7), C.fire]],
  storm:       [[cloud(48, 36, 16), A], [bolt(50, 74, 15), C.bolt]],
  machineLearning:[[rect(50, 56, 46, 42), A], [rays(50, 56, 23, 32, 4, 8, -45), A], [arrow(50, 54, 26, 9), C.ink]],
  amplify:     [[poly([22, 34], [46, 34], [46, 66], [22, 66]), A], [tri([46, 20], [46, 80], [16, 50]), A],
                [arcBand(52, 50, 14, 7, -60, 60) + arcBand(52, 50, 28, 7, -60, 60), C.cyan]],
  helloWorld:  [[`M22 22h56a8 8 0 0 1 8 8v30a8 8 0 0 1 -8 8H50l-16 14v-14h-12a8 8 0 0 1 -8 -8V30a8 8 0 0 1 8 -8Z`, A],
                [circle(36, 45, 5) + circle(50, 45, 5) + circle(64, 45, 5), C.ink]],
  biasedCognition:[[circle(50, 38, 22), A], [circle(50, 38, 9), C.ink], [arrow(50, 78, 26, 10, 90), C.steel]],

  // ---------------- 와쳐 (자세 / 주문) ----------------
  mantra:      [[dotRing(50, 50, 30, 10, 7), A], [circle(50, 50, 11), C.holy]],
  devotion:    [[poly([45, 12], [28, 48], [32, 84], [45, 82]), A], [poly([55, 12], [72, 48], [68, 84], [55, 82]), A]],
  establishment:[[rect(50, 22, 54, 12) + rect(50, 80, 58, 12), A], [rect(50, 51, 26, 46), A]],
  battleHymn:  [[circle(34, 74, 15), A], [rect(47, 46, 8, 44), A], [poly([43, 22], [76, 32], [76, 48], [43, 38]), A]],
  likeWater:   [[wave(10, 90, 32, 10, 9), C.ice], [wave(10, 90, 54, 10, 9), C.ice], [wave(10, 90, 76, 10, 9), A]],
  rushdown:    [[arrow(62, 50, 54, 16, 0), A], [rect(20, 36, 26, 9) + rect(14, 50, 26, 9) + rect(20, 64, 26, 9), A, 0.6]],
  mentalFortress:[[rect(50, 60, 60, 50), A], [rect(26, 28, 14, 20) + rect(50, 28, 14, 20) + rect(74, 28, 14, 20), A],
                [rect(50, 66, 20, 38), C.ink]],
  study:       [[book(50, 52, 74, 54), A]],
  masterReality:[[card(44, 54, 42, 58), A], [star(74, 30, 20, 8, 5), C.holy]],
  foresight:   [[eye(50, 58, 76, 34), A], [circle(50, 58, 11), C.ink], [rays(50, 58, 34, 46, 3, 7, -120, 60), A]],
  nirvana:     [[lotus(50, 44, 13), A]],
  devaForm:    [[poly([36, 34], [64, 34], [84, 92], [16, 92]), A], [ring(50, 24, 19, 7), C.holy]],
  omega:       [[arcBand(50, 44, 27, 12, 145, 35), A], [rect(26, 80, 26, 13) + rect(74, 80, 26, 13), A]],
  wrathNext:   [[turnArrow(50, 50, 34, 10), A], [flame(50, 54, 15), C.fire]],
  freeSkill:   [[diamond(42, 56, 50, 64), A], [ring(78, 28, 16, 6), C.gold]],
  mark:        [[diamond(50, 50, 56, 56), A], [diamond(50, 50, 30, 30), C.ink], [circle(50, 50, 8), A]],
  blockReturn: [[hand(50, 48, 21), A]],
  waveOfTheHand:[[hand(38, 44, 17), A], [wave(56, 96, 68, 9, 8), C.cyan]],
  blasphemer:  [[arcBand(50, 30, 24, 8, 200, 250) + arcBand(50, 30, 24, 8, 290, 340), C.holy], [skull(50, 62, 20), A]],
  collect:     [[rect(50, 64, 56, 38), A], [rect(50, 40, 64, 14), A], [star(50, 64, 15, 6, 5), C.ink]],
  freeAttack:  [[blade(40, 52, 68, 24), A], [ring(78, 30, 16, 6), C.gold]],

  // ---------------- 몬스터 전용 ----------------
  curlUp:      [[arcBand(54, 56, 32, 14, 170, 350), A], [circle(42, 64, 15), A], [circle(72, 76, 8), A]],
  angry:       [[bar(20, 22, 44, 34, 10) + bar(80, 22, 56, 34, 10), A], [circle(32, 56, 11) + circle(68, 56, 11), A]],
  spore:       [[`M18 56a32 32 0 0 1 64 0Z`, A], [rect(50, 70, 18, 26), A], [circle(22, 22, 7) + circle(78, 22, 7) + circle(50, 12, 6), C.poison]],
  malleable:   [[rect(50, 50, 40, 44), A], [arrow(16, 50, 26, 9, 180) + arrow(84, 50, 26, 9, 0), C.steel]],
  flight:      [[arcBand(32, 62, 22, 9, -150, -20) + arcBand(72, 62, 22, 9, -160, -30), A], [rect(24, 84, 30, 8) + rect(64, 90, 26, 8), A, 0.5]],
  painfulStabs:[[blade(24, 46, 52, 18) + blade(50, 58, 52, 18) + blade(76, 46, 52, 18), A]],
  sharpHide:   [[arcBand(50, 68, 32, 15, 180, 360), A], [spikes(50, 68, 32, 17, 5, 15, 190, 160), A]],
  modeShift:   [[gear(50, 50, 40, 8), A], [turnArrow(50, 50, 20, 7), C.ink]],
  beatOfDeath: [[ekg(8, 92, 56, 24, 9), A], [skull(78, 26, 13), C.blood]],
  invincible:  [[shield(50, 58, 56, 62), A], [crown(50, 20, 44, 24), C.gold]],
  timeWarp:    [[hourglass(50, 50, 48, 62), A], [arcBand(50, 50, 40, 8, 120, 300), C.void]],
  slow:        [[ring(58, 54, 24, 9), A], [circle(58, 54, 8), A], [rect(28, 68, 40, 18), A], [rect(18, 40, 8, 22) + rect(32, 36, 8, 26), A]],
  minion:      [[circle(36, 40, 18), A], [rect(36, 74, 30, 30), A], [circle(74, 56, 11), A], [rect(74, 78, 18, 20), A]],
  unawakened:  [[poly([16, 58], [46, 58], [46, 68], [32, 82], [46, 82], [46, 92], [16, 92], [16, 82], [30, 68], [16, 68]), A],
                [poly([50, 28], [76, 28], [76, 37], [65, 49], [76, 49], [76, 58], [50, 58], [50, 49], [61, 37], [50, 37]), A],
                [poly([78, 8], [96, 8], [96, 15], [88, 24], [96, 24], [96, 31], [78, 31], [78, 24], [86, 15], [78, 15]), A]],
  curiosity:   [[QMARK, A]],
  lifeLink:    [[circle(22, 62, 15) + circle(78, 62, 15), A], [rect(50, 62, 42, 9), A], [heart(50, 28, 15), C.blood]],
  reactive:    [[ngon(50, 58, 44, 3), A], [rect(50, 58, 11, 28) + rect(50, 80, 11, 11), C.ink]],
  split:       [[wedge(42, 50, 34, 100, 260), A], [wedge(58, 50, 34, -80, 80), A]],
  enrage:      [[diamond(38, 54, 44, 62), A], [flame(72, 42, 16), C.fire]],
  anger:       [[fist(40, 58, 18), A], [arrow(78, 42, 42, 12), C.blood]],
  stasis:      [[card(46, 54, 40, 56), A], [star(50, 50, 30, 12, 6), C.ice, 0.85]],
  thievery:    [[hand(36, 48, 17), A], [coin(74, 66, 20), C.gold]],
};
