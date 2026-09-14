// ============================================================
//  와쳐 카드 75종 — 자세(Stance) / 주문(Mantra) / 통찰(Scry)
// ============================================================
import { def, TYPE, TARGET, RARITY, COLOR, mk } from './carddb.js';

const W = COLOR.PURPLE;
const A = TYPE.ATTACK, S = TYPE.SKILL, P = TYPE.POWER;
const E = TARGET.ENEMY, ALL = TARGET.ALL, SELF = TARGET.SELF, NONE = TARGET.NONE;

const kw = (c) => {
  const t = [];
  if (c.innate) t.push('내재.');
  if (c.ethereal) t.push('소멸.');
  if (c.retain) t.push('보존.');
  if (c.exhaust) t.push('소각.');
  return t.length ? ' ' + t.join(' ') : '';
};
const D = (fn) => (c) => fn(c) + kw(c);

// ---------------- 특수(생성) 카드 ----------------
def({ id: 'insight', name: '통찰', en: 'Insight', type: S, rarity: RARITY.SPECIAL, color: W, cost: 0, target: NONE,
  mag: 2, magU: 3, retain: true, exhaust: true, noPool: true,
  text: D((c) => `카드를 ${c.v('mag')}장 뽑습니다.`),
  play: (x) => x.B.draw(x.c.v('mag')) });

def({ id: 'smite', name: '강타', en: 'Smite', type: A, rarity: RARITY.SPECIAL, color: W, cost: 1, target: E,
  dmg: 12, dmgU: 16, retain: true, exhaust: true, noPool: true,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg')) });

def({ id: 'miracle', name: '기적', en: 'Miracle', type: S, rarity: RARITY.SPECIAL, color: W, cost: 0, target: NONE,
  mag: 1, magU: 2, retain: true, exhaust: true, noPool: true,
  text: D((c) => `에너지를 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.gainEnergy(x.c.v('mag')) });

def({ id: 'safety', name: '안전', en: 'Safety', type: S, rarity: RARITY.SPECIAL, color: W, cost: 1, target: SELF,
  blk: 12, blkU: 16, retain: true, exhaust: true, noPool: true,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다.`),
  play: (x) => x.B.gainBlock(x.p, x.c.v('blk'), x.c) });

def({ id: 'throughViolence', name: '폭력을 통해', en: 'Through Violence', type: A, rarity: RARITY.SPECIAL, color: W, cost: 0, target: E,
  dmg: 20, dmgU: 30, retain: true, exhaust: true, noPool: true,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg')) });

def({ id: 'beta', name: '베타', en: 'Beta', type: S, rarity: RARITY.SPECIAL, color: W, cost: 2, costU: 1, target: NONE,
  exhaust: true, noPool: true,
  text: D(() => `뽑을 카드 더미에 오메가를 섞어 넣습니다.`),
  play: (x) => x.B.addCardToDrawRandom(mk('omegaCard', x.c.upgraded)) });

def({ id: 'omegaCard', name: '오메가', en: 'Omega', type: P, rarity: RARITY.SPECIAL, color: W, cost: 3, target: SELF,
  mag: 50, magU: 60, noPool: true,
  text: D((c) => `턴이 끝날 때마다 모든 적에게 피해를 ${c.v('mag')} 줍니다.`),
  play: (x) => x.B.addPower(x.p, 'omega', x.c.v('mag'), x.p) });

def({ id: 'judgmentStrike', name: '천벌', en: 'Wrath Strike', type: A, rarity: RARITY.SPECIAL, color: W, cost: 2, target: E,
  dmg: 10, dmgU: 15, noPool: true,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 분노 자세를 취합니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.setStance('wrath'); } });

// ---------------- 기본 ----------------
def({ id: 'strike_p', name: '타격', en: 'Strike', type: A, rarity: RARITY.BASIC, color: W, cost: 1, target: E,
  dmg: 6, dmgU: 9, noPool: true,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg')) });

def({ id: 'defend_p', name: '방어', en: 'Defend', type: S, rarity: RARITY.BASIC, color: W, cost: 1, target: SELF,
  blk: 5, blkU: 8, noPool: true,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다.`),
  play: (x) => x.B.gainBlock(x.p, x.c.v('blk'), x.c) });

def({ id: 'eruption', name: '분출', en: 'Eruption', type: A, rarity: RARITY.BASIC, color: W, cost: 2, costU: 1, target: E,
  dmg: 9, noPool: true,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 분노 자세를 취합니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.setStance('wrath'); } });

def({ id: 'vigilance', name: '경계', en: 'Vigilance', type: S, rarity: RARITY.BASIC, color: W, cost: 2, target: SELF,
  blk: 8, blkU: 12, noPool: true,
  text: D((c) => `방어도를 ${c.v('blk')} 얻고 평온 자세를 취합니다.`),
  play: (x) => { x.B.gainBlock(x.p, x.c.v('blk'), x.c); x.B.setStance('calm'); } });

// ---------------- 일반 19 ----------------
def({ id: 'bowlingBash', name: '볼링 강타', en: 'Bowling Bash', type: A, rarity: RARITY.COMMON, color: W, cost: 1, target: E,
  dmg: 7, dmgU: 10,
  text: D((c) => `적 1체당 피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => { const n = x.B.living().length; for (let i = 0; i < n; i++) x.B.attack(x, x.c.v('dmg')); } });

def({ id: 'consecrate', name: '신성화', en: 'Consecrate', type: A, rarity: RARITY.COMMON, color: W, cost: 0, target: ALL,
  dmg: 5, dmgU: 8,
  text: D((c) => `모든 적에게 피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => x.B.attackAll(x, x.c.v('dmg')) });

def({ id: 'crescendo', name: '크레센도', en: 'Crescendo', type: S, rarity: RARITY.COMMON, color: W, cost: 1, costU: 0, target: NONE,
  retain: true, exhaust: true,
  text: D(() => `분노 자세를 취합니다.`),
  play: (x) => x.B.setStance('wrath') });

def({ id: 'crushJoints', name: '관절 부수기', en: 'Crush Joints', type: A, rarity: RARITY.COMMON, color: W, cost: 1, target: E,
  dmg: 8, dmgU: 10, mag: 1, magU: 2,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 직전에 사용한 카드가 기술이면 취약을 ${c.v('mag')} 부여합니다.`),
  play: (x) => { const prev = x.B.lastCardType; x.B.attack(x, x.c.v('dmg')); if (prev === 'skill') x.B.addPower(x.t, 'vulnerable', x.c.v('mag'), x.p); } });

def({ id: 'cutThroughFate', name: '운명 가르기', en: 'Cut Through Fate', type: A, rarity: RARITY.COMMON, color: W, cost: 1, target: E,
  dmg: 7, dmgU: 9, mag: 2, magU: 3,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 통찰을 ${c.v('mag')} 사용한 뒤 카드를 1장 뽑습니다.`),
  play: async (x) => { x.B.attack(x, x.c.v('dmg')); await x.B.scry(x.c.v('mag')); x.B.draw(1); } });

def({ id: 'emptyBody', name: '공허한 몸', en: 'Empty Body', type: S, rarity: RARITY.COMMON, color: W, cost: 1, target: SELF,
  blk: 7, blkU: 10,
  text: D((c) => `방어도를 ${c.v('blk')} 얻고 무자세가 됩니다.`),
  play: (x) => { x.B.gainBlock(x.p, x.c.v('blk'), x.c); x.B.setStance('neutral'); } });

def({ id: 'emptyFist', name: '공허한 주먹', en: 'Empty Fist', type: A, rarity: RARITY.COMMON, color: W, cost: 1, target: E,
  dmg: 9, dmgU: 14,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 무자세가 됩니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.setStance('neutral'); } });

def({ id: 'evaluate', name: '평가', en: 'Evaluate', type: S, rarity: RARITY.COMMON, color: W, cost: 1, target: SELF,
  blk: 6, blkU: 10,
  text: D((c) => `방어도를 ${c.v('blk')} 얻고 뽑을 카드 더미에 통찰 1장을 넣습니다.`),
  play: (x) => { x.B.gainBlock(x.p, x.c.v('blk'), x.c); x.B.addCardToDrawRandom(x.B.newCard('insight')); } });

def({ id: 'flurryOfBlows', name: '연타', en: 'Flurry of Blows', type: A, rarity: RARITY.COMMON, color: W, cost: 0, target: E,
  dmg: 4, dmgU: 6,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 자세를 바꾸면 버린 카드 더미에서 손으로 돌아옵니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg')) });

def({ id: 'flyingSleeves', name: '나는 소매', en: 'Flying Sleeves', type: A, rarity: RARITY.COMMON, color: W, cost: 1, target: E,
  dmg: 4, dmgU: 6, hits: 2, retain: true,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 2회 반복합니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg'), 2) });

def({ id: 'followUp', name: '후속타', en: 'Follow-Up', type: A, rarity: RARITY.COMMON, color: W, cost: 1, target: E,
  dmg: 7, dmgU: 11,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 직전에 사용한 카드가 공격이면 에너지를 1 얻습니다.`),
  play: (x) => { const prev = x.B.lastCardType; x.B.attack(x, x.c.v('dmg')); if (prev === 'attack') x.B.gainEnergy(1); } });

def({ id: 'halt', name: '정지', en: 'Halt', type: S, rarity: RARITY.COMMON, color: W, cost: 0, target: SELF,
  blk: 3, blkU: 4, mag: 9, magU: 14,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다. 분노 자세라면 방어도를 ${c.v('mag')} 더 얻습니다.`),
  play: (x) => x.B.gainBlock(x.p, x.c.v('blk') + (x.B.stance === 'wrath' ? x.c.v('mag') : 0), x.c) });

def({ id: 'justLucky', name: '운 좋게', en: 'Just Lucky', type: A, rarity: RARITY.COMMON, color: W, cost: 0, target: E,
  dmg: 3, dmgU: 4, blk: 2, blkU: 3, mag: 1, magU: 2,
  text: D((c) => `통찰을 ${c.v('mag')} 사용하고 방어도를 ${c.v('blk')} 얻은 뒤 피해를 ${c.v('dmg')} 줍니다.`),
  play: async (x) => { await x.B.scry(x.c.v('mag')); x.B.gainBlock(x.p, x.c.v('blk'), x.c); x.B.attack(x, x.c.v('dmg')); } });

def({ id: 'pressurePoints', name: '압점', en: 'Pressure Points', type: S, rarity: RARITY.COMMON, color: W, cost: 1, target: E,
  mag: 8, magU: 11,
  text: D((c) => `적에게 표식을 ${c.v('mag')} 부여합니다. 표식을 가진 모든 적이 표식만큼 체력을 잃습니다.`),
  play: (x) => {
    if (x.t) x.B.addPower(x.t, 'mark', x.c.v('mag'), x.p);
    x.B.living().forEach((e) => { const m = x.B.pow(e, 'mark'); if (m > 0) x.B.loseHp(e, m, x.c); });
  } });

def({ id: 'prostrate', name: '부복', en: 'Prostrate', type: S, rarity: RARITY.COMMON, color: W, cost: 0, target: SELF,
  blk: 4, mag: 2, magU: 3,
  text: D((c) => `주문을 ${c.v('mag')} 얻고 방어도를 ${c.v('blk')} 얻습니다.`),
  play: (x) => { x.B.addMantra(x.c.v('mag')); x.B.gainBlock(x.p, x.c.v('blk'), x.c); } });

def({ id: 'protect', name: '보호', en: 'Protect', type: S, rarity: RARITY.COMMON, color: W, cost: 2, target: SELF,
  blk: 12, blkU: 16, retain: true,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다.`),
  play: (x) => x.B.gainBlock(x.p, x.c.v('blk'), x.c) });

def({ id: 'sashWhip', name: '허리띠 채찍', en: 'Sash Whip', type: A, rarity: RARITY.COMMON, color: W, cost: 1, target: E,
  dmg: 8, dmgU: 10, mag: 1, magU: 2,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 직전에 사용한 카드가 공격이면 약화를 ${c.v('mag')} 부여합니다.`),
  play: (x) => { const prev = x.B.lastCardType; x.B.attack(x, x.c.v('dmg')); if (prev === 'attack') x.B.addPower(x.t, 'weak', x.c.v('mag'), x.p); } });

def({ id: 'thirdEye', name: '제3의 눈', en: 'Third Eye', type: S, rarity: RARITY.COMMON, color: W, cost: 1, target: SELF,
  blk: 7, blkU: 9, mag: 3, magU: 5,
  text: D((c) => `방어도를 ${c.v('blk')} 얻고 통찰을 ${c.v('mag')} 사용합니다.`),
  play: async (x) => { x.B.gainBlock(x.p, x.c.v('blk'), x.c); await x.B.scry(x.c.v('mag')); } });

def({ id: 'tranquility', name: '고요', en: 'Tranquility', type: S, rarity: RARITY.COMMON, color: W, cost: 1, costU: 0, target: NONE,
  retain: true, exhaust: true,
  text: D(() => `평온 자세를 취합니다.`),
  play: (x) => x.B.setStance('calm') });

// ---------------- 고급 36 ----------------
def({ id: 'battleHymn', name: '전투 찬가', en: 'Battle Hymn', type: P, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: SELF,
  innateU: true,
  text: D(() => `턴이 시작될 때마다 강타 1장을 손에 넣습니다.`),
  play: (x) => x.B.addPower(x.p, 'battleHymn', 1, x.p) });

def({ id: 'carveReality', name: '현실 조각', en: 'Carve Reality', type: A, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: E,
  dmg: 6, dmgU: 10,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 강타 1장을 손에 넣습니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.addCardToHand(x.B.newCard('smite')); } });

def({ id: 'collect', name: '수집', en: 'Collect', type: S, rarity: RARITY.UNCOMMON, color: W, cost: -1, target: SELF,
  exhaust: true,
  text: D((c) => `다음 X${c.upgraded ? '+1' : ''}턴 동안 턴 시작 시 강화된 기적을 1장 얻습니다.`),
  play: (x) => x.B.addPower(x.p, 'collect', x.x + (x.c.upgraded ? 1 : 0), x.p) });

def({ id: 'conclude', name: '결론', en: 'Conclude', type: A, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: ALL,
  dmg: 12, dmgU: 16,
  text: D((c) => `모든 적에게 피해를 ${c.v('dmg')} 줍니다. 턴이 종료됩니다.`),
  play: (x) => { x.B.attackAll(x, x.c.v('dmg')); x.B.forceEndTurn = true; } });

def({ id: 'deceiveReality', name: '현실 기만', en: 'Deceive Reality', type: S, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: SELF,
  blk: 4, blkU: 7,
  text: D((c) => `방어도를 ${c.v('blk')} 얻고 안전 1장을 손에 넣습니다.`),
  play: (x) => { x.B.gainBlock(x.p, x.c.v('blk'), x.c); x.B.addCardToHand(x.B.newCard('safety')); } });

def({ id: 'emptyMind', name: '공허한 마음', en: 'Empty Mind', type: S, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: NONE,
  mag: 2, magU: 3,
  text: D((c) => `카드를 ${c.v('mag')}장 뽑고 무자세가 됩니다.`),
  play: (x) => { x.B.draw(x.c.v('mag')); x.B.setStance('neutral'); } });

def({ id: 'fasting', name: '단식', en: 'Fasting', type: P, rarity: RARITY.UNCOMMON, color: W, cost: 2, target: SELF,
  mag: 3, magU: 4,
  text: D((c) => `힘과 민첩을 ${c.v('mag')} 얻습니다. 턴마다 에너지를 1 적게 얻습니다.`),
  play: (x) => {
    x.B.addPower(x.p, 'strength', x.c.v('mag'), x.p);
    x.B.addPower(x.p, 'dexterity', x.c.v('mag'), x.p);
    x.B.baseEnergy = Math.max(0, x.B.baseEnergy - 1);
  } });

def({ id: 'fearNoEvil', name: '두려움 없이', en: 'Fear No Evil', type: A, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: E,
  dmg: 8, dmgU: 11,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 대상이 공격할 예정이라면 평온 자세를 취합니다.`),
  play: (x) => { const atk = x.t && x.B.isAttackIntent(x.t); x.B.attack(x, x.c.v('dmg')); if (atk) x.B.setStance('calm'); } });

def({ id: 'foreignInfluence', name: '외세의 영향', en: 'Foreign Influence', type: S, rarity: RARITY.UNCOMMON, color: W, cost: 0, target: NONE,
  exhaust: true,
  text: D((c) => `무작위 공격 카드 3장 중 1장을 손에 넣습니다.${c.upgraded ? ' 비용이 0이 됩니다.' : ''}`),
  play: async (x) => {
    const opts = [];
    for (let i = 0; i < 3; i++) { const c = x.B.randomCardOfType(A); if (c) opts.push(c); }
    if (!opts.length) return;
    const [s] = await x.B.chooseCards(opts, { count: 1, title: '카드 선택', virtual: true });
    if (s) { if (x.c.upgraded) s.costForTurn = 0; x.B.addCardToHand(s); }
  } });

def({ id: 'foresight', name: '예지', en: 'Foresight', type: P, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: SELF,
  mag: 3, magU: 4,
  text: D((c) => `턴이 시작될 때마다 통찰을 ${c.v('mag')} 사용합니다.`),
  play: (x) => x.B.addPower(x.p, 'foresight', x.c.v('mag'), x.p) });

def({ id: 'indignation', name: '분개', en: 'Indignation', type: S, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: ALL,
  mag: 3, magU: 5,
  text: D((c) => `분노 자세가 아니라면 분노 자세를 취합니다. 분노 자세라면 모든 적에게 취약을 ${c.v('mag')} 부여합니다.`),
  play: (x) => {
    if (x.B.stance !== 'wrath') x.B.setStance('wrath');
    else x.B.living().forEach((e) => x.B.addPower(e, 'vulnerable', x.c.v('mag'), x.p));
  } });

def({ id: 'innerPeace', name: '내면의 평화', en: 'Inner Peace', type: S, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: NONE,
  mag: 3, magU: 4,
  text: D((c) => `평온 자세라면 카드를 ${c.v('mag')}장 뽑습니다. 아니라면 평온 자세를 취합니다.`),
  play: (x) => { if (x.B.stance === 'calm') x.B.draw(x.c.v('mag')); else x.B.setStance('calm'); } });

def({ id: 'likeWater', name: '물처럼', en: 'Like Water', type: P, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: SELF,
  mag: 5, magU: 7,
  text: D((c) => `평온 자세일 때 턴이 끝나면 방어도를 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.addPower(x.p, 'likeWater', x.c.v('mag'), x.p) });

def({ id: 'meditate', name: '명상', en: 'Meditate', type: S, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: NONE,
  mag: 1, magU: 2,
  text: D((c) => `버린 카드 더미에서 카드 ${c.v('mag')}장을 손에 넣고 보존합니다. 평온 자세를 취하고 턴이 종료됩니다.`),
  play: async (x) => {
    if (x.B.discardPile.length) {
      const n = Math.min(x.c.v('mag'), x.B.discardPile.length);
      const sel = await x.B.chooseCards(x.B.discardPile.slice(), { count: n, title: '가져올 카드' });
      (sel || []).forEach((s) => { x.B.removeFrom(x.B.discardPile, s); s.retainOnce = true; x.B.addCardToHand(s); });
    }
    x.B.setStance('calm');
    x.B.forceEndTurn = true;
  } });

def({ id: 'mentalFortress', name: '정신 요새', en: 'Mental Fortress', type: P, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: SELF,
  mag: 4, magU: 6,
  text: D((c) => `자세를 바꿀 때마다 방어도를 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.addPower(x.p, 'mentalFortress', x.c.v('mag'), x.p) });

def({ id: 'nirvana', name: '열반', en: 'Nirvana', type: P, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: SELF,
  mag: 3, magU: 4,
  text: D((c) => `통찰할 때마다 방어도를 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.addPower(x.p, 'nirvana', x.c.v('mag'), x.p) });

def({ id: 'perseverance', name: '인내', en: 'Perseverance', type: S, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: SELF,
  blk: 5, blkU: 7, mag: 2, magU: 3, retain: true,
  text: D((c) => `방어도를 ${c.v('blk') + c.bonusDmg} 얻습니다. 보존될 때마다 방어도가 ${c.v('mag')} 증가합니다.`),
  play: (x) => x.B.gainBlock(x.p, x.c.v('blk') + x.c.bonusDmg, x.c),
  onRetain: (B, c) => { c.bonusDmg += c.v('mag'); } });

def({ id: 'pray', name: '기도', en: 'Pray', type: S, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: SELF,
  mag: 3, magU: 4,
  text: D((c) => `주문을 ${c.v('mag')} 얻고 뽑을 카드 더미에 통찰 1장을 넣습니다.`),
  play: (x) => { x.B.addMantra(x.c.v('mag')); x.B.addCardToDrawRandom(x.B.newCard('insight')); } });

def({ id: 'reachHeaven', name: '천국에 닿기', en: 'Reach Heaven', type: A, rarity: RARITY.UNCOMMON, color: W, cost: 2, target: E,
  dmg: 10, dmgU: 15,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 뽑을 카드 더미에 천벌 1장을 섞어 넣습니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.addCardToDrawRandom(x.B.newCard('judgmentStrike')); } });

def({ id: 'rushdown', name: '맹공', en: 'Rushdown', type: P, rarity: RARITY.UNCOMMON, color: W, cost: 1, costU: 0, target: SELF,
  mag: 2,
  text: D((c) => `분노 자세에 들어갈 때마다 카드를 ${c.v('mag')}장 뽑습니다.`),
  play: (x) => x.B.addPower(x.p, 'rushdown', x.c.v('mag'), x.p) });

def({ id: 'sanctity', name: '신성함', en: 'Sanctity', type: S, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: SELF,
  blk: 6, blkU: 9,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다. 직전에 사용한 카드가 기술이면 카드를 2장 뽑습니다.`),
  play: (x) => { const prev = x.B.lastCardType; x.B.gainBlock(x.p, x.c.v('blk'), x.c); if (prev === 'skill') x.B.draw(2); } });

def({ id: 'sandsOfTime', name: '시간의 모래', en: 'Sands of Time', type: A, rarity: RARITY.UNCOMMON, color: W, cost: 4, target: E,
  dmg: 20, dmgU: 26, retain: true,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 보존될 때마다 비용이 1 감소합니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg')),
  onRetain: (B, c) => { const cur = c.costOverride === null ? c.baseCost : c.costOverride; if (cur > 0) c.costOverride = cur - 1; } });

def({ id: 'signatureMove', name: '필살기', en: 'Signature Move', type: A, rarity: RARITY.UNCOMMON, color: W, cost: 2, target: E,
  dmg: 30, dmgU: 40,
  text: D((c) => `손에 다른 공격 카드가 없을 때만 사용할 수 있습니다. 피해를 ${c.v('dmg')} 줍니다.`),
  canPlay: (B) => B.hand.filter((h) => h.type === A).length <= 1,
  play: (x) => x.B.attack(x, x.c.v('dmg')) });

def({ id: 'simmeringFury', name: '끓어오르는 분노', en: 'Simmering Fury', type: S, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: SELF,
  mag: 2, magU: 3,
  text: D((c) => `다음 턴에 분노 자세를 취하고 카드를 ${c.v('mag')}장 뽑습니다.`),
  play: (x) => { x.B.addPower(x.p, 'wrathNext', 1, x.p); x.B.addPower(x.p, 'nextTurnDraw', x.c.v('mag'), x.p); } });

def({ id: 'studyCard', name: '연구', en: 'Study', type: P, rarity: RARITY.UNCOMMON, color: W, cost: 2, costU: 1, target: SELF,
  text: D(() => `턴이 끝날 때마다 뽑을 카드 더미에 통찰 1장을 넣습니다.`),
  play: (x) => x.B.addPower(x.p, 'study', 1, x.p) });

def({ id: 'swivel', name: '선회', en: 'Swivel', type: S, rarity: RARITY.UNCOMMON, color: W, cost: 2, target: SELF,
  blk: 8, blkU: 11,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다. 이번 턴 다음 공격 카드의 비용이 0이 됩니다.`),
  play: (x) => { x.B.gainBlock(x.p, x.c.v('blk'), x.c); x.B.addPower(x.p, 'freeAttack', 1, x.p); } });

def({ id: 'talkToTheHand', name: '손과 대화', en: 'Talk to the Hand', type: A, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: E,
  dmg: 5, dmgU: 7, mag: 3, magU: 4, exhaust: true,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 이 적을 공격할 때마다 방어도를 ${c.v('mag')} 얻습니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); if (x.t) x.B.addPower(x.t, 'blockReturn', x.c.v('mag'), x.p); } });

def({ id: 'tantrum', name: '성질부리기', en: 'Tantrum', type: A, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: E,
  dmg: 3, hits: 3, hitsU: 4,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. ${c.v('hits')}회 반복합니다. 분노 자세를 취하고 이 카드를 뽑을 더미에 섞어 넣습니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg'), x.c.v('hits')); x.B.setStance('wrath'); x.B.tantrumShuffle = x.c; } });

def({ id: 'waveOfTheHand', name: '손짓', en: 'Wave of the Hand', type: S, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: SELF,
  mag: 1, magU: 2,
  text: D((c) => `이번 턴에 방어도를 얻을 때마다 모든 적에게 약화를 ${c.v('mag')} 부여합니다.`),
  play: (x) => x.B.addPower(x.p, 'waveOfTheHand', x.c.v('mag'), x.p) });

def({ id: 'weave', name: '직조', en: 'Weave', type: A, rarity: RARITY.UNCOMMON, color: W, cost: 0, target: E,
  dmg: 4, dmgU: 6,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 통찰할 때 버린 카드 더미에서 손으로 돌아옵니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg')) });

def({ id: 'wheelKick', name: '돌려차기', en: 'Wheel Kick', type: A, rarity: RARITY.UNCOMMON, color: W, cost: 2, target: E,
  dmg: 15, dmgU: 20,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 카드를 2장 뽑습니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.draw(2); } });

def({ id: 'windUp', name: '동작 준비', en: 'Wind Up', type: A, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: E,
  dmg: 10, dmgU: 13, mag: 8, magU: 11,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 분노 자세라면 피해가 ${c.v('mag')} 증가합니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg') + (x.B.stance === 'wrath' ? x.c.v('mag') : 0)) });

def({ id: 'worship', name: '숭배', en: 'Worship', type: S, rarity: RARITY.UNCOMMON, color: W, cost: 2, target: SELF,
  mag: 5, retainU: true,
  text: D((c) => `주문을 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.addMantra(x.c.v('mag')) });

def({ id: 'wreathOfFlame', name: '화염의 화관', en: 'Wreath of Flame', type: S, rarity: RARITY.UNCOMMON, color: W, cost: 1, target: SELF,
  mag: 5, magU: 8,
  text: D((c) => `활력을 ${c.v('mag')} 얻습니다. (다음 공격 카드의 피해 증가)`),
  play: (x) => x.B.addPower(x.p, 'vigor', x.c.v('mag'), x.p) });

def({ id: 'conjureBlade', name: '칼날 소환', en: 'Conjure Blade', type: S, rarity: RARITY.UNCOMMON, color: W, cost: -1, target: NONE,
  exhaust: true,
  text: D((c) => `뽑을 카드 더미에 피해 X${c.upgraded ? '+1' : ''}의 '폭력을 통해'를 넣습니다.`),
  play: (x) => { const card = x.B.newCard('throughViolence'); card.bonusDmg = 0; x.B.addCardToDrawRandom(card); } });

def({ id: 'scrawl', name: '휘갈기기', en: 'Scrawl', type: S, rarity: RARITY.UNCOMMON, color: W, cost: 1, costU: 0, target: NONE,
  exhaust: true,
  text: D(() => `손이 가득 찰 때까지 카드를 뽑습니다.`),
  play: (x) => x.B.draw(Math.max(0, 10 - x.B.hand.length)) });

// ---------------- 희귀 16 ----------------
def({ id: 'alpha', name: '알파', en: 'Alpha', type: S, rarity: RARITY.RARE, color: W, cost: 1, target: NONE,
  exhaust: true, innateU: true,
  text: D(() => `뽑을 카드 더미에 베타를 섞어 넣습니다.`),
  play: (x) => x.B.addCardToDrawRandom(mk('beta', x.c.upgraded)) });

def({ id: 'blasphemy', name: '신성모독', en: 'Blasphemy', type: S, rarity: RARITY.RARE, color: W, cost: 1, target: SELF,
  retain: true, exhaust: true, retainU: true,
  text: D(() => `신성 자세를 취합니다. 이번 턴이 끝나면 사망합니다.`),
  play: (x) => { x.B.setStance('divinity'); x.B.addPower(x.p, 'blasphemer', 1, x.p); } });

def({ id: 'brilliance', name: '광휘', en: 'Brilliance', type: A, rarity: RARITY.RARE, color: W, cost: 1, target: E,
  dmg: 12, dmgU: 16,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 이번 전투에서 얻은 주문 1당 피해가 1 증가합니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg') + (x.B.totalMantra || 0)) });

def({ id: 'devaForm', name: '데바 형상', en: 'Deva Form', type: P, rarity: RARITY.RARE, color: W, cost: 3, target: SELF,
  ethereal: true, etherealU: false,
  text: D(() => `턴이 시작될 때마다 에너지를 얻고, 그 양이 매 턴 1씩 증가합니다.`),
  play: (x) => x.B.addPower(x.p, 'devaForm', 1, x.p) });

def({ id: 'devotion', name: '헌신', en: 'Devotion', type: P, rarity: RARITY.RARE, color: W, cost: 1, target: SELF,
  mag: 2, magU: 3,
  text: D((c) => `턴이 시작될 때마다 주문을 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.addPower(x.p, 'devotion', x.c.v('mag'), x.p) });

def({ id: 'deusExMachina', name: '기계장치의 신', en: 'Deus Ex Machina', type: S, rarity: RARITY.RARE, color: W, cost: -2, target: NONE,
  mag: 2, magU: 3, unplayable: true, exhaust: true,
  text: (c) => `사용할 수 없습니다. 이 카드를 뽑으면 기적 ${c.v('mag')}장을 손에 넣고 소각됩니다.`,
  onDraw: (B, c) => {
    for (let i = 0; i < c.v('mag'); i++) B.addCardToHand(B.newCard('miracle'));
    B.exhaustFromHand(c);
  } });

def({ id: 'establishment', name: '확립', en: 'Establishment', type: P, rarity: RARITY.RARE, color: W, cost: 1, target: SELF,
  innateU: true,
  text: D(() => `보존되는 카드의 비용이 1 감소합니다.`),
  play: (x) => x.B.addPower(x.p, 'establishment', 1, x.p) });

def({ id: 'judgment', name: '심판', en: 'Judgment', type: S, rarity: RARITY.RARE, color: W, cost: 1, target: E,
  mag: 30, magU: 40,
  text: D((c) => `대상의 체력이 ${c.v('mag')} 이하라면 즉시 사망합니다.`),
  play: (x) => { if (x.t && x.t.hp <= x.c.v('mag')) { x.t.hp = 0; x.B.killEnemy(x.t, x.p); } } });

def({ id: 'lessonLearned', name: '배운 교훈', en: 'Lesson Learned', type: A, rarity: RARITY.RARE, color: W, cost: 2, target: E,
  dmg: 10, dmgU: 13, exhaust: true,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 이 피해로 적이 죽으면 덱의 무작위 카드 1장이 영구히 강화됩니다.`),
  play: (x) => {
    const t = x.t, alive = t && t.alive;
    x.B.attack(x, x.c.v('dmg'));
    if (alive && t && !t.alive) { x.B.run.upgradeRandom((c) => c.canUpgrade(), 1); x.B.log('카드 1장이 영구히 강화되었다!'); }
  } });

def({ id: 'masterReality', name: '현실 조작', en: 'Master Reality', type: P, rarity: RARITY.RARE, color: W, cost: 1, costU: 0, target: SELF,
  text: D(() => `전투 중 생성되는 카드가 강화된 상태로 등장합니다.`),
  play: (x) => x.B.addPower(x.p, 'masterReality', 1, x.p) });

def({ id: 'omniscience', name: '전지', en: 'Omniscience', type: S, rarity: RARITY.RARE, color: W, cost: 4, costU: 3, target: NONE,
  exhaust: true,
  text: D(() => `뽑을 카드 더미의 카드 1장을 선택해 두 번 사용한 뒤 소각합니다.`),
  play: async (x) => {
    if (!x.B.drawPile.length) return;
    const [s] = await x.B.chooseCards(x.B.drawPile.slice(), { count: 1, title: '두 번 사용할 카드' });
    if (!s || !s.def.play) return;
    x.B.removeFrom(x.B.drawPile, s);
    const t = x.B.living()[0];
    for (let i = 0; i < 2; i++) await s.def.play({ B: x.B, p: x.p, t, c: s, x: 0 });
    x.B.exhaustCard(s);
  } });

def({ id: 'ragnarok', name: '라그나로크', en: 'Ragnarok', type: A, rarity: RARITY.RARE, color: W, cost: 3, target: NONE,
  dmg: 5, dmgU: 6, hits: 5, hitsU: 6,
  text: D((c) => `무작위 적에게 피해를 ${c.v('dmg')} 줍니다. ${c.v('hits')}회 반복합니다.`),
  play: (x) => { for (let i = 0; i < x.c.v('hits'); i++) x.B.attackRandom(x, x.c.v('dmg')); } });

def({ id: 'spiritShield', name: '영혼 방패', en: 'Spirit Shield', type: S, rarity: RARITY.RARE, color: W, cost: 2, target: SELF,
  mag: 3, magU: 4,
  text: D((c) => `손에 있는 카드 1장당 방어도를 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.gainBlock(x.p, x.B.hand.length * x.c.v('mag'), x.c) });

def({ id: 'vault', name: '금고', en: 'Vault', type: S, rarity: RARITY.RARE, color: W, cost: 3, costU: 2, target: NONE,
  exhaust: true,
  text: D(() => `턴이 종료되고 추가 턴을 얻습니다.`),
  play: (x) => { x.B.extraTurn = true; x.B.forceEndTurn = true; } });

def({ id: 'wish', name: '소원', en: 'Wish', type: S, rarity: RARITY.RARE, color: W, cost: 3, target: NONE,
  mag: 3, magU: 4, exhaust: true,
  text: D((c) => `힘 ${c.v('mag')}, 골드 ${25 * c.v('mag')}, 방어도 ${c.v('mag') * 2} 중 하나를 선택합니다.`),
  play: async (x) => {
    const opt = await x.B.ui.chooseOption
      ? await x.B.ui.chooseOption(['힘 ' + x.c.v('mag'), '골드 ' + 25 * x.c.v('mag'), '방어도 ' + x.c.v('mag') * 2], '소원을 빌다')
      : 0;
    if (opt === 1) x.B.gainGold(25 * x.c.v('mag'));
    else if (opt === 2) x.B.gainBlock(x.p, x.c.v('mag') * 2, x.c);
    else x.B.addPower(x.p, 'strength', x.c.v('mag'), x.p);
  } });

def({ id: 'blasphemerBook', name: '경전', en: 'Scripture', type: S, rarity: RARITY.RARE, color: W, cost: 1, target: SELF,
  mag: 4, magU: 6,
  text: D((c) => `주문을 ${c.v('mag')} 얻고 통찰을 ${c.v('mag')} 사용합니다.`),
  play: async (x) => { x.B.addMantra(x.c.v('mag')); await x.B.scry(x.c.v('mag')); } });
