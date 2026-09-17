// 몬스터 도감 : 행동 168개가 전부 설명으로 바뀌는지 확인한다.
// 가짜 전투판이 모르는 걸 부르는 새 행동이 들어오면 여기서 걸린다.
import { MONSTERS } from '../js/data/monsters.js';
import { movesOf, whereText, monsterList } from '../js/data/monsterdex.js';

let fail = 0;
const ok = (c, t) => { if (!c) { fail++; console.log(' FAIL ' + t); } };

let moves = 0; const empty = []; const broken = [];
Object.values(MONSTERS).forEach((m) => {
  movesOf(m).forEach((mv) => {
    moves++;
    if (mv.broken) broken.push(`${m.name}.${mv.name} — ${mv.broken}`);
    // 피해도 방어도 효과도 없는 행동은 '아무것도 안 함' 이 맞는 경우에만 허용한다
    if (!mv.dmg && !mv.blk && !mv.lines.length) empty.push(`${m.name}.${mv.name} [${mv.intent}]`);
  });
});

console.log(`몬스터 ${Object.keys(MONSTERS).length}종 · 행동 ${moves}개`);
if (broken.length) broken.forEach((b) => console.log('   깨짐 : ' + b));
ok(broken.length === 0, `설명을 만들다 멈춘 행동 ${broken.length}개`);

// 아무 일도 안 하는 행동은 실제로 그런 것들뿐이어야 한다 (수면 · 충전 · 기절 …)
const ALLOWED_EMPTY = ['sleep', 'stun', 'unknown'];
const bad = [];
Object.values(MONSTERS).forEach((m) => {
  movesOf(m).forEach((mv) => {
    if (!mv.dmg && !mv.blk && !mv.lines.length && !ALLOWED_EMPTY.includes(mv.intent)) {
      bad.push(`${m.name}.${mv.name} [${mv.intent}]`);
    }
  });
});
if (bad.length) bad.forEach((b) => console.log('   빈 설명 : ' + b));
ok(bad.length === 0, `설명이 비어 버린 행동 ${bad.length}개`);
console.log(`   (일부러 비운 것 ${empty.length - bad.length}개 : 수면·충전·기절)`);

// 등장 위치가 모든 몬스터에 대해 나오는지
const noWhere = Object.keys(MONSTERS).filter((id) => !whereText(id));
ok(noWhere.length === 0, `등장 위치가 비었다 : ${noWhere.join(', ')}`);

// 분류가 모든 몬스터를 빠짐없이 담는지
const groups = ['act1', 'act2', 'act3', 'summon'];
const covered = new Set();
groups.forEach((g) => monsterList(g).forEach((id) => covered.add(id)));
const missed = Object.keys(MONSTERS).filter((id) => !covered.has(id));
ok(missed.length === 0, `어느 분류에도 안 들어간 몬스터 : ${missed.join(', ')}`);
groups.forEach((g) => console.log(`   ${g} : ${monsterList(g).length}종`));

if (fail) { console.log(`\n실패 ${fail}건`); process.exit(1); }
console.log('\n  OK  행동 전부 설명으로 바뀐다');
