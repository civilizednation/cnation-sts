// ============================================================
//  용어 설명 검사
//
//  ▸ 카드 글에 나오는 상태(POWERS) 이름은 모두 용어 사전에 있어야 한다
//    카드를 길게 누르면 뜨는 "용어" 칸과 백과사전 용어집이 이 사전을 읽는다.
//    빠져 있으면 "적에게 조준을 3 부여합니다" 만 보이고 조준이 뭔지는
//    어디에도 안 나온다 (v1.4.2 에서 실제로 그랬다).
//  ▸ 사전에 같은 낱말이 두 번 들어가면 안 된다 (앞의 것만 쓰이고 뒤는 죽는다)
//  ▸ 백과사전 상세 글(statehelp/cardhelp)이 실제로 있는 것을 가리키는지 (v1.5.1)
//
//      node tools/check-keywords.mjs
// ============================================================
import { CARD_DEFS, Card } from '../js/data/cards.js';
import { POWERS } from '../js/engine/powers.js';
import { KEYWORDS, KEYWORD_MAP } from '../js/data/keywords.js';
import { STATE_HELP } from '../js/data/statehelp.js';
import { CARD_HELP } from '../js/data/cardhelp.js';

/** 이름이 같을 뿐 그 상태를 가리키는 게 아닌 것들 — 검사에서 뺀다 */
const NOT_A_POWER = {
  '저주': '카드 종류를 가리키는 말이다 ("상태이상 또는 저주 카드")',
  '오메가': '카드 이름이다 (베타가 덱에 넣어 주는 카드)',
  '분노': '와쳐의 자세 이름으로 이미 사전에 있다',
};

let fail = 0;

// ---- 사전 자체 ----
const seen = new Set();
KEYWORDS.forEach(([name]) => {
  if (seen.has(name)) { console.log(`✗ 사전에 "${name}" 이 두 번 있다`); fail++; }
  seen.add(name);
});

// ---- 카드 글에 나오는 상태 이름 ----
const powerNames = Object.entries(POWERS)
  .filter(([, p]) => p.name)
  .map(([id, p]) => [p.name, id])
  .sort((a, b) => b[0].length - a[0].length);

const hits = new Map();
Object.keys(CARD_DEFS).forEach((id) => {
  const texts = [];
  for (const up of [false, true]) {
    try { texts.push(new Card(id, up).text()); } catch { /* 강화형이 없을 수 있다 */ }
  }
  const t = texts.join(' | ');
  powerNames.forEach(([name]) => {
    if (!t.includes(name)) return;
    if (!hits.has(name)) hits.set(name, []);
    hits.get(name).push(CARD_DEFS[id].name);
  });
});

const missing = [...hits.entries()].filter(([name]) => !KEYWORD_MAP.has(name) && !NOT_A_POWER[name]);
missing.forEach(([name, cards]) => {
  console.log(`✗ "${name}" — ${cards.length}장이 언급하는데 사전에 설명이 없다 (${cards.join(', ')})`);
  fail++;
});

// ---- 쓸모없어진 예외는 알려 준다 ----
Object.keys(NOT_A_POWER).forEach((name) => {
  if (!hits.has(name)) console.log(`· 예외 "${name}" 은 이제 카드 글에 안 나온다 — NOT_A_POWER 에서 빼도 된다`);
  if (KEYWORD_MAP.has(name) && !POWERS[name]) { /* 사전에 따로 있는 건 정상 */ }
});

// ---- 백과사전 상세 글 ----
const needHelp = Object.entries(POWERS).filter(([, p]) => !p.hidden && p.name).map(([id]) => id);
const noHelp = needHelp.filter((id) => !STATE_HELP[id]);
const ghostHelp = Object.keys(STATE_HELP).filter((id) => !POWERS[id]);
if (noHelp.length) { console.log(`✗ 상세 설명 없는 상태 ${noHelp.length}종 : ${noHelp.join(', ')}`); fail++; }
if (ghostHelp.length) { console.log(`✗ POWERS 에 없는 상세 설명 : ${ghostHelp.join(', ')}`); fail++; }
const ghostCard = Object.keys(CARD_HELP).filter((id) => !CARD_DEFS[id]);
if (ghostCard.length) { console.log(`✗ 없는 카드의 상세 설명 : ${ghostCard.join(', ')}`); fail++; }

console.log(`\n용어 ${KEYWORDS.length}개 · 카드 글에 나오는 상태 ${hits.size}종`
  + ` (예외 ${Object.keys(NOT_A_POWER).filter((n) => hits.has(n)).length}종)`);
console.log(`상세 설명 : 상태 ${Object.keys(STATE_HELP).length}종 · 카드 ${Object.keys(CARD_HELP).length}장`);
console.log(fail ? `\nFAIL ${fail}건` : '\nOK 카드 글의 모든 상태에 설명이 있다');
process.exit(fail ? 1 : 0);
