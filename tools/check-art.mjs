// ============================================================
//  카드 문양 검사
//
//  ▸ 같은 계열 안에서 문양이 겹치면 안 된다
//    게임에 익숙해지면 글자보다 문양을 먼저 보게 되는데, 겹쳐 있으면
//    문양을 보고 이름을 또 확인해야 해서 문양을 두는 의미가 없다.
//  ▸ 문양 없는 카드가 있으면 안 된다 (기본 문양으로 조용히 떨어진다)
//  ▸ 매핑이 가리키는 문양이 실제로 있어야 한다
//
//      node tools/check-art.mjs
// ============================================================
import { CARD_DEFS } from '../js/data/cards.js';
import { ART_GLYPH } from '../js/ui/cardart.js';
import { readFileSync } from 'fs';

const src = readFileSync(new URL('../js/ui/cardview.js', import.meta.url), 'utf8');
const body = src.match(/const ART = \{([\s\S]*?)\n\};/)[1];
const ART = Object.fromEntries([...body.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:\s*'([^']+)'/g)]
  .map((m) => [m[1], m[2]]));

const KR = { red: '아이언클래드', green: '사일런트', blue: '디펙트', purple: '와쳐',
  colorless: '무색', status: '상태이상', curse: '저주' };

const byClass = {};
Object.entries(CARD_DEFS).forEach(([id, d]) => {
  const c = d.color || 'colorless';
  (byClass[c] = byClass[c] || []).push({ id, name: d.name });
});

let fail = 0;
const missingGlyph = [];
const noArt = [];

for (const [cls, list] of Object.entries(byClass)) {
  const seen = new Map();
  const dups = [];
  list.forEach(({ id, name }) => {
    const g = ART[id];
    if (!g) { noArt.push(`${KR[cls] || cls} ${name}(${id})`); return; }
    if (!ART_GLYPH[g]) missingGlyph.push(`${name}(${id}) → ${g}`);
    if (seen.has(g)) dups.push(`${g} : ${seen.get(g)} / ${name}`);
    else seen.set(g, name);
  });
  const ok = dups.length === 0;
  if (!ok) fail = 1;
  console.log(`${ok ? '  OK  ' : ' FAIL '}${(KR[cls] || cls).padEnd(8)} ${String(list.length).padStart(3)}장 · 문양 ${seen.size}종 · 계열 내 중복 ${dups.length}`);
  dups.slice(0, 10).forEach((d) => console.log(`         ${d}`));
}

if (noArt.length) { fail = 1; console.log(`\n FAIL 문양이 지정되지 않은 카드 ${noArt.length}장`); noArt.slice(0, 10).forEach((x) => console.log('       ' + x)); }
else console.log('\n  OK  모든 카드에 문양이 지정돼 있다');

if (missingGlyph.length) { fail = 1; console.log(` FAIL 없는 문양을 가리키는 카드 ${missingGlyph.length}장`); missingGlyph.slice(0, 10).forEach((x) => console.log('       ' + x)); }
else console.log('  OK  매핑이 가리키는 문양이 모두 존재한다');

const total = Object.values(byClass).reduce((a, l) => a + l.length, 0);
console.log(`\n카드 ${total}장 · 문양 ${Object.keys(ART_GLYPH).length}종`);
process.exit(fail);
