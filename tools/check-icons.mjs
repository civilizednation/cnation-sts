// ============================================================
//  유물·물약 3D 아이콘 검사.
//
//  익숙해지면 이름보다 모양을 먼저 본다. 그러려면 147개가 전부 달라야 한다.
//  · 빠진 것이 없는지 (유물 117 · 물약 30 전부 고유 형태를 가지는지)
//  · 겹치는 것이 없는지 (부품 배열을 그대로 견준다 — 색·위치·회전까지)
//  · 부품 종류와 값이 멀쩡한지
//
//  parts3d.js 가 three.js 를 부르지 않는 순수 데이터라서 브라우저 없이 돌아간다.
// ============================================================
import { RELICS } from '../js/data/relics.js';
import { POTIONS } from '../js/data/potions.js';
import { RELIC_SHAPE } from '../js/three/relicshapes.js';
import { POTION_SHAPE } from '../js/three/potionshapes.js';
import { fingerprint } from '../js/three/parts3d.js';

let fail = 0;
const ok = (c, t) => { console.log((c ? '  OK  ' : ' FAIL ') + t); if (!c) fail++; };

const KINDS = ['ball', 'box', 'cyl', 'cone', 'torus', 'gem', 'rock', 'tet', 'cap'];

/** 한 무리를 검사한다 */
function audit(label, defs, table, call) {
  const ids = Object.keys(defs);
  const made = Object.keys(table);

  const missing = ids.filter((id) => !table[id]);
  ok(missing.length === 0, `${label} ${ids.length}개에 모두 고유 형태가 있다`
    + (missing.length ? ` — 빠짐 : ${missing.join(', ')}` : ''));

  const ghost = made.filter((id) => !defs[id]);
  ok(ghost.length === 0, `${label} : 없는 항목을 가리키는 형태가 없다`
    + (ghost.length ? ` — ${ghost.join(', ')}` : ''));

  // 부품이 멀쩡한가
  const bad = [];
  const empty = [];
  const byPrint = new Map();
  ids.forEach((id) => {
    const make = table[id];
    if (!make) return;
    let parts;
    try { parts = call(make, defs[id]); } catch (e) { bad.push(`${defs[id].name} — ${e.message}`); return; }
    if (!Array.isArray(parts) || !parts.length) { empty.push(defs[id].name); return; }
    const before = bad.length;
    parts.forEach((p, i) => {
      if (!KINDS.includes(p.t)) bad.push(`${defs[id].name}[${i}] 모르는 부품 '${p.t}'`);
      else if (!Array.isArray(p.a) || p.a.some((n) => !Number.isFinite(n))) bad.push(`${defs[id].name}[${i}] 치수가 이상하다`);
      else if (typeof p.c !== 'string' || !/^#[0-9a-f]{6}$/i.test(p.c)) bad.push(`${defs[id].name}[${i}] 색이 이상하다 : ${p.c}`);
      ['x', 'y', 'z', 'rx', 'ry', 'rz', 'sx', 'sy', 'sz'].forEach((key) => {
        if (p[key] !== undefined && !Number.isFinite(p[key])) bad.push(`${defs[id].name}[${i}] ${key} 가 이상하다`);
      });
    });
    if (bad.length > before) return;                 // 값이 이상하면 지문을 내지 않는다
    const print = fingerprint(parts);
    (byPrint.get(print) || byPrint.set(print, []).get(print)).push(defs[id].name);
  });

  if (bad.length) bad.slice(0, 12).forEach((b) => console.log('       ' + b));
  ok(bad.length === 0, `${label} : 부품이 모두 멀쩡하다`);
  ok(empty.length === 0, `${label} : 빈 형태가 없다` + (empty.length ? ` — ${empty.join(', ')}` : ''));

  const dup = [...byPrint.values()].filter((v) => v.length > 1);
  dup.forEach((v) => console.log('       겹침 : ' + v.join(' = ')));
  ok(dup.length === 0, `${label} : 똑같이 생긴 것이 없다 (${byPrint.size}가지)`);

  return byPrint;
}

console.log('── 유물 ──');
const relicPrints = audit('유물', RELICS, RELIC_SHAPE, (make) => make());
console.log('── 물약 ──');
const potionPrints = audit('물약', POTIONS, POTION_SHAPE, (make, def) => make(def.color));

// 유물과 물약끼리도 겹치면 안 된다
const cross = [...relicPrints.keys()].filter((k) => potionPrints.has(k));
ok(cross.length === 0, `유물과 물약 사이에도 겹침이 없다`);

// 부품 수가 너무 적으면 실루엣이 밋밋하다
const thin = [];
Object.entries(RELIC_SHAPE).forEach(([id, make]) => {
  try { if (make().length < 3) thin.push(RELICS[id] ? RELICS[id].name : id); } catch (e) { /* 위에서 잡힘 */ }
});
ok(thin.length === 0, `부품이 3개 미만인 유물이 없다` + (thin.length ? ` — ${thin.join(', ')}` : ''));

const total = Object.keys(RELIC_SHAPE).length + Object.keys(POTION_SHAPE).length;
const parts = [...Object.entries(RELIC_SHAPE)].reduce((a, [, m]) => a + m().length, 0)
  + [...Object.entries(POTION_SHAPE)].reduce((a, [id, m]) => a + m(POTIONS[id] ? POTIONS[id].color : '#888888').length, 0);
console.log(`\n아이콘 ${total}종 · 부품 ${parts}개 (평균 ${(parts / total).toFixed(1)}개)`);

if (fail) { console.log(`\n실패 ${fail}건`); process.exit(1); }
console.log('  OK  147종 전부 고유하다');
