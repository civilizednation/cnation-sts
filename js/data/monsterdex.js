// ============================================================
//  몬스터 도감 자료 — 백과사전 "몬스터" 탭이 쓴다.
//
//  행동 설명을 손으로 쓰지 않는다. 몬스터의 `run` 을 **기록용 가짜 전투판**에
//  한 번 돌려 보고, 무슨 일이 일어나는지 받아 적어 문장으로 만든다.
//  이렇게 하면 밸런스 수치를 고쳤을 때 설명이 어긋날 수가 없다 —
//  설명의 출처가 실제로 돌아가는 그 코드이기 때문이다.
//
//  `run` 은 B(전투)와 s(자기 자신)만 만지고 바깥 상태를 건드리지 않아
//  이렇게 돌려 봐도 안전하다. 새 행동이 가짜 판이 모르는 걸 부르면
//  tools/check-monsterdex.mjs 가 잡아 준다.
// ============================================================
import { MONSTERS, ENCOUNTERS, GREMLIN_POOL } from './monsters.js';
import { powerName, isSingleton } from '../engine/powers.js';
import './cards.js';   // mk('slimed') 같은 호출이 있어 카드 목록이 먼저 올라와 있어야 한다

// ------------------------------------------------------------
//  어디서 나오는 몬스터인가 — 조우 테이블에서 뽑는다
// ------------------------------------------------------------
const TYPE_KR = { weak: '약체', strong: '강체', elite: '엘리트', boss: '보스' };

/** id → [{ act, type }] */
function buildWhere() {
  const w = {};
  const put = (id, act, type) => {
    (w[id] = w[id] || []);
    if (!w[id].some((x) => x.act === act && x.type === type)) w[id].push({ act, type });
  };
  Object.entries(ENCOUNTERS).forEach(([act, byType]) => {
    Object.entries(byType).forEach(([type, groups]) => {
      groups.forEach((g) => g.forEach((id) => put(id, Number(act), type)));
    });
  });
  // 그렘린 무리는 뽑기 주머니에서 골라 나온다 (1막 강체)
  (GREMLIN_POOL || []).forEach((id) => put(id, 1, 'strong'));
  return w;
}
const WHERE = buildWhere();

/** 이 몬스터가 나오는 막들 — 소환·분열로만 나오면 빈 배열 */
export function actsOf(id) {
  return [...new Set((WHERE[id] || []).map((x) => x.act))].sort();
}
/** "1막 약체 · 1막 강체" 처럼 */
export function whereText(id) {
  const w = WHERE[id] || [];
  if (!w.length) return '싸움 도중 나타납니다';
  const byAct = {};
  w.forEach((x) => { (byAct[x.act] = byAct[x.act] || new Set()).add(TYPE_KR[x.type] || x.type); });
  return Object.keys(byAct).sort().map((a) => `${a}막 ${[...byAct[a]].join('·')}`).join(' · ');
}

// ------------------------------------------------------------
//  기록용 가짜 전투판
// ------------------------------------------------------------
const cardName = (c) => (c && (c.name || c.id)) || '카드';

// 쓸 때마다 세지는 행동을 가려내는 자국 : s.x += n / s.x++ / s.x = (s.x || 30) + 5
const GROWS = [/\bs\.\w+\s*(?:\+=|\+\+)/, /\bs\.(\w+)\s*=[^;]*\bs\.\1\b/];

/**
 * @param {object} mon  몬스터 정의
 * @param {object} mv   행동 하나
 * @param {'lo'|'hi'} side  주사위를 낮게/높게 굴린 쪽 (두 번 돌려 폭을 본다)
 */
function probe(mon, mv, side) {
  const rec = { dmg: null, hits: 1, blk: 0, eff: [], grows: false, hpScaled: false };
  let recording = false;                     // init 이 하는 일은 설명에 넣지 않는다

  const self = { mid: mon.id, hp: 50, maxHp: 50 };
  const player = { isPlayer: true, hp: NaN }; // 체력에 비례하는 피해를 NaN 으로 잡아낸다
  // `B.living().find((e) => e.mid === 'mystic')` 같은 코드가 동료를 찾는다 —
  // 찾는 이름을 소스에서 읽어 맞춰 준다
  const wanted = /\.mid === '([A-Za-z]+)'/.exec(String(mv.run));
  const ally = { mid: wanted ? wanted[1] : '__ally__', hp: 40, maxHp: 40 };

  const pick = (a, b) => (side === 'lo' ? a : b);
  const add = (...e) => { if (recording) rec.eff.push(e); };

  const B = {
    player,
    rng: {
      next: () => pick(0, 0.99),
      chance: () => side !== 'lo',
      range: (a, b) => pick(a, b),
      pick: (arr) => arr[0],
      shuffle: (arr) => arr,
    },
    living: () => [self, ally],
    enemies: () => [self, ally],
    enemyAttack(t, n, times = 1) {
      if (recording) { rec.dmg = n; rec.hits = times; if (Number.isNaN(n)) rec.hpScaled = true; }
      return Number.isNaN(n) ? 0 : n;
    },
    gainBlock(t, n) { if (!recording) return; if (t === self) rec.blk += n; else if (n > 0) add('blkAlly', n); },
    addPower(t, id, amt) {
      if (!recording) return;
      if (t === player) add('pwYou', id, amt);
      else if (t === self) add('pwSelf', id, amt);
      else add('pwAlly', id, amt);
    },
    setPower(t, id, amt) { B.addPower(t, id, amt); },
    removePower(t, id) { if (t !== player) add('pwGone', id); },
    clearDebuffs() { add('clean'); },
    heal(t, n) { if (n > 0) add(t === self ? 'heal' : 'healAlly', n); },
    addCardToDiscard(c) { add('card', cardName(c)); },
    addCardToDrawRandom(c) { add('cardDraw', cardName(c)); },
    upgradeAllBurns() { add('burnUp'); },
    stealGold(t, n) { add('gold', n); },
    stealCard() { add('stealCard'); },
    splitEnemy() { add('split'); },
    fleeEnemy() { add('flee'); },
    killEnemy() { add('selfKill'); },
    summon(t, ids) { add('summon', ids.slice()); },
    summonGremlins(t, n) { add('summonGremlin', n); },
  };

  try {
    if (typeof mon.init === 'function') mon.init(B, self);
    recording = true;
    mv.run(B, self);
    // 쓸 때마다 세지는 행동 — 자기 수치를 늘리는지 코드에서 본다.
    // 값을 재는 방식은 s.phase = 2 처럼 '단계 표시' 를 성장으로 잘못 읽는다.
    rec.grows = GROWS.some((re) => re.test(String(mv.run)));
    // dmg 필드만 있고 run 이 공격을 부르지 않는 경우를 위한 보정
    if (rec.dmg === null && mv.dmg != null) rec.dmg = mv.dmg;
    if (rec.dmg === null && typeof mv.dyn === 'function') rec.dmg = mv.dyn(self);
  } catch (e) {
    rec.broken = String((e && e.message) || e);
  }
  return rec;
}

// ------------------------------------------------------------
//  받아 적은 것을 우리말로
// ------------------------------------------------------------
// 켜고 끄는 상태(혼란·휘감김 …)는 수치가 의미 없어 숫자를 뺀다
const amtOf = (id, n) => (isSingleton(id) ? '' : ` ${n}`);

function effText(e) {
  const [tag, a, b] = e;
  switch (tag) {
    case 'pwYou': return `나에게 ${powerName(a)}${amtOf(a, b)}`;
    case 'pwSelf': return `자신에게 ${powerName(a)}${amtOf(a, b)}`;
    case 'pwAlly': return `동료에게 ${powerName(a)}${amtOf(a, b)}`;
    case 'pwGone': return `자신의 ${powerName(a)} 없앰`;
    case 'blkAlly': return `동료에게 방어도 ${a}`;
    case 'clean': return '자신의 약화 상태를 모두 없앰';
    case 'heal': return `체력 ${a} 회복`;
    case 'healAlly': return `동료 체력 ${a} 회복`;
    case 'card': return `버린 더미에 ${a}`;
    case 'cardDraw': return `뽑을 더미 아무 곳에 ${a}`;
    case 'burnUp': return '내 화상이 더 아프게 바뀜';
    case 'gold': return `골드 ${a} 훔침`;
    case 'stealCard': return '내 카드 한 장을 가져가 가둠';
    case 'split': return '둘로 쪼개짐';
    case 'flee': return '달아남';
    case 'selfKill': return '터지며 스스로 죽음';
    case 'summon': return `${a.map((id) => (MONSTERS[id] ? MONSTERS[id].name : id)).join(' · ')} 불러냄`;
    case 'summonGremlin': return `그렘린 ${a}마리 불러냄`;
    default: return '';
  }
}

/** 같은 효과가 연달아 기록되면 한 줄로 묶는다 (점액 ×2 등) */
function squash(eff) {
  const out = [];
  eff.forEach((e) => {
    const prev = out[out.length - 1];
    if (prev && prev.key === JSON.stringify(e)) { prev.n++; return; }
    out.push({ key: JSON.stringify(e), e, n: 1 });
  });
  return out.map(({ e, n }) => {
    const t = effText(e);
    return t && n > 1 ? `${t} ×${n}` : t;
  }).filter(Boolean);
}

/**
 * 행동 하나를 설명한다.
 * @returns {{ name, intent, dmg, hits, blk, lines: string[], grows: boolean }}
 */
export function moveInfo(mon, key) {
  const mv = mon.moves[key];
  const lo = probe(mon, mv, 'lo');
  const hi = probe(mon, mv, 'hi');

  const range = (a, b) => (a === b || b == null ? a : `${Math.min(a, b)}~${Math.max(a, b)}`);
  let dmg = null;
  if (lo.hpScaled) dmg = '내 체력에 비례한';
  else if (lo.dmg != null) dmg = range(lo.dmg, hi.dmg);

  const lines = squash(lo.eff);
  const hiLines = squash(hi.eff);
  // 주사위에 따라 효과 자체가 갈리면 둘 다 보여 준다
  hiLines.forEach((t) => { if (!lines.includes(t)) lines.push(t); });

  return {
    name: mv.name,
    intent: mv.intent,
    dmg,
    hits: lo.hits,
    blk: lo.blk || null,
    lines,
    grows: lo.grows,
    broken: lo.broken || null,
  };
}

/** 몬스터 한 마리의 모든 행동 */
export function movesOf(mon) {
  return Object.keys(mon.moves || {}).map((k) => moveInfo(mon, k));
}

/** 백과사전 목록 순서 : 막 → 일반·엘리트·보스 → 체력 */
const RANK = { normal: 0, elite: 1, boss: 2 };
export function monsterList(group) {
  const ids = Object.keys(MONSTERS).filter((id) => {
    const m = MONSTERS[id];
    const acts = actsOf(id);
    if (group === 'act1') return acts.includes(1);
    if (group === 'act2') return acts.includes(2);
    if (group === 'act3') return acts.includes(3);
    if (group === 'summon') return acts.length === 0;
    return true;
  });
  return ids.sort((x, y) => {
    const a = MONSTERS[x]; const b = MONSTERS[y];
    return (RANK[a.kind || 'normal'] - RANK[b.kind || 'normal'])
      || (a.hp[0] - b.hp[0]) || a.name.localeCompare(b.name, 'ko');
  });
}

export const MONSTER_KIND_KR = { normal: '일반', elite: '엘리트', boss: '보스' };
