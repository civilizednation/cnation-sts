// ============================================================
//  상태 아이콘 검사 (v1.5.0)
//
//  ▸ 전투에 나오는 모든 상태에 아이콘이 있어야 한다
//    없으면 powerIcon 이 조용히 별표로 떨어진다 — 예전에 118종 중 50종이 그랬다.
//  ▸ 118종의 모양이 전부 달라야 한다 (색만 바꾼 것도 같은 것으로 본다)
//    유물·카드와 같은 이유다. 익숙해지면 글자보다 그림을 먼저 보는데
//    겹치면 그림을 보고 이름을 또 확인해야 한다.
//  ▸ path 가 성한지, 겹이 너무 적거나 많지 않은지도 본다
//
//      node tools/check-powerart.mjs
// ============================================================
import { POWER_ART } from '../js/ui/powerart.js';
import { POWERS } from '../js/engine/powers.js';

let fail = 0;
const say = (ok, msg) => { if (!ok) fail++; console.log(`${ok ? '  OK ' : '✗   '} ${msg}`); };

// ---- 빠진 것 / 남는 것 ----
const need = Object.entries(POWERS).filter(([, p]) => !p.hidden && p.name).map(([id]) => id);
const missing = need.filter((id) => !POWER_ART[id]);
const ghost = Object.keys(POWER_ART).filter((id) => !POWERS[id]);
say(!missing.length, missing.length ? `아이콘 없는 상태 ${missing.length}종 : ${missing.join(', ')}` : '전투에 나오는 상태 전부에 아이콘이 있다');
say(!ghost.length, ghost.length ? `POWERS 에 없는 id ${ghost.length}개 : ${ghost.join(', ')}` : 'POWERS 에 없는 아이콘은 없다');

// ---- path 가 성한가 ----
let parts = 0;
Object.entries(POWER_ART).forEach(([id, art]) => {
  if (!Array.isArray(art) || !art.length) { say(false, `${id} : 겹이 비어 있다`); return; }
  parts += art.length;
  if (art.length > 4) say(false, `${id} : 겹이 ${art.length}장이다 (12px 에서는 4장까지)`);
  art.forEach(([d, c, o], i) => {
    if (typeof d !== 'string' || !d.startsWith('M')) say(false, `${id}[${i}] : path 가 M 으로 시작하지 않는다`);
    else if (/NaN|undefined|Infinity/.test(d)) say(false, `${id}[${i}] : path 에 NaN/undefined 가 있다`);
    else if (d.length < 12) say(false, `${id}[${i}] : path 가 너무 짧다 (${d.length}자)`);
    if (typeof c !== 'string' || !(c === '@a' || /^#[0-9a-f]{3,8}$/i.test(c))) say(false, `${id}[${i}] : 색이 이상하다 (${c})`);
    if (o !== undefined && !(o > 0 && o <= 1)) say(false, `${id}[${i}] : 불투명도가 이상하다 (${o})`);
  });
});

// ---- 모양이 겹치지 않는가 ----
const fp = new Map();
Object.entries(POWER_ART).forEach(([id, art]) => {
  const key = art.map(([d]) => d).join('|');            // 색은 빼고 모양만 본다
  (fp.get(key) || fp.set(key, []).get(key)).push(id);
});
const dup = [...fp.values()].filter((v) => v.length > 1);
dup.forEach((ids) => say(false, `모양이 같다 : ${ids.map((i) => POWERS[i] ? POWERS[i].name : i).join(' = ')} (${ids.join(', ')})`));
say(!dup.length, dup.length ? `겹치는 모양 ${dup.length}쌍` : `${Object.keys(POWER_ART).length}종 전부 고유하다`);

console.log(`\n아이콘 ${Object.keys(POWER_ART).length}종 · 겹 ${parts}장 (평균 ${(parts / Object.keys(POWER_ART).length).toFixed(1)}장)`);
console.log(fail ? `\nFAIL ${fail}건` : '\nOK');
process.exit(fail ? 1 : 0);
