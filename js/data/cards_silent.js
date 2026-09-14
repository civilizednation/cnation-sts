// ============================================================
//  사일런트 카드 75종 (기본 4 / 일반 19 / 고급 36 / 희귀 16)
// ============================================================
import { def, TYPE, TARGET, RARITY, COLOR, mk } from './carddb.js';

const G = COLOR.GREEN;
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

// ---------------- 특수 : 단검 ----------------
def({ id: 'shiv', name: '단검', en: 'Shiv', type: A, rarity: RARITY.SPECIAL, color: G, cost: 0, target: E,
  dmg: 4, dmgU: 6, exhaust: true, noPool: true,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg') + x.B.pow(x.p, 'accuracy')) });

// ---------------- 기본 ----------------
def({ id: 'strike_g', name: '타격', en: 'Strike', type: A, rarity: RARITY.BASIC, color: G, cost: 1, target: E,
  dmg: 6, dmgU: 9, noPool: true,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg')) });

def({ id: 'defend_g', name: '방어', en: 'Defend', type: S, rarity: RARITY.BASIC, color: G, cost: 1, target: SELF,
  blk: 5, blkU: 8, noPool: true,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다.`),
  play: (x) => x.B.gainBlock(x.p, x.c.v('blk'), x.c) });

def({ id: 'neutralize', name: '무력화', en: 'Neutralize', type: A, rarity: RARITY.BASIC, color: G, cost: 0, target: E,
  dmg: 3, dmgU: 4, mag: 1, magU: 2, noPool: true,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 약화를 ${c.v('mag')} 부여합니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.addPower(x.t, 'weak', x.c.v('mag'), x.p); } });

def({ id: 'survivor', name: '생존자', en: 'Survivor', type: S, rarity: RARITY.BASIC, color: G, cost: 1, target: SELF,
  blk: 8, blkU: 11, noPool: true,
  text: D((c) => `방어도를 ${c.v('blk')} 얻고 카드 1장을 버립니다.`),
  play: async (x) => {
    x.B.gainBlock(x.p, x.c.v('blk'), x.c);
    const cand = x.B.hand.filter((h) => h.uid !== x.c.uid);
    if (cand.length) { const [s] = await x.B.chooseCards(cand, { count: 1, title: '버릴 카드 선택' }); if (s) x.B.discardFromHand(s); }
  } });

// ---------------- 일반 19 ----------------
def({ id: 'acrobatics', name: '곡예', en: 'Acrobatics', type: S, rarity: RARITY.COMMON, color: G, cost: 1, target: NONE,
  mag: 3, magU: 4,
  text: D((c) => `카드를 ${c.v('mag')}장 뽑고 카드 1장을 버립니다.`),
  play: async (x) => {
    x.B.draw(x.c.v('mag'));
    const cand = x.B.hand.filter((h) => h.uid !== x.c.uid);
    if (cand.length) { const [s] = await x.B.chooseCards(cand, { count: 1, title: '버릴 카드 선택' }); if (s) x.B.discardFromHand(s); }
  } });

def({ id: 'backflip', name: '백플립', en: 'Backflip', type: S, rarity: RARITY.COMMON, color: G, cost: 1, target: SELF,
  blk: 5, blkU: 8,
  text: D((c) => `방어도를 ${c.v('blk')} 얻고 카드를 2장 뽑습니다.`),
  play: (x) => { x.B.gainBlock(x.p, x.c.v('blk'), x.c); x.B.draw(2); } });

def({ id: 'bane', name: '파멸', en: 'Bane', type: A, rarity: RARITY.COMMON, color: G, cost: 1, target: E,
  dmg: 7, dmgU: 10,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 대상이 중독 상태라면 한 번 더 줍니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); if (x.t && x.B.pow(x.t, 'poison') > 0) x.B.attack(x, x.c.v('dmg')); } });

def({ id: 'bladeDance', name: '칼춤', en: 'Blade Dance', type: S, rarity: RARITY.COMMON, color: G, cost: 1, target: NONE,
  mag: 2, magU: 3,
  text: D((c) => `단검 ${c.v('mag')}장을 손에 넣습니다.`),
  play: (x) => x.B.addShivs(x.c.v('mag')) });

def({ id: 'cloakAndDagger', name: '은신과 단검', en: 'Cloak and Dagger', type: S, rarity: RARITY.COMMON, color: G, cost: 1, target: SELF,
  blk: 6, mag: 1, magU: 2,
  text: D((c) => `방어도를 ${c.v('blk')} 얻고 단검 ${c.v('mag')}장을 손에 넣습니다.`),
  play: (x) => { x.B.gainBlock(x.p, x.c.v('blk'), x.c); x.B.addShivs(x.c.v('mag')); } });

def({ id: 'daggerSpray', name: '단검 뿌리기', en: 'Dagger Spray', type: A, rarity: RARITY.COMMON, color: G, cost: 1, target: ALL,
  dmg: 4, dmgU: 6,
  text: D((c) => `모든 적에게 피해를 ${c.v('dmg')} 줍니다. 2회 반복합니다.`),
  play: (x) => x.B.attackAll(x, x.c.v('dmg'), 2) });

def({ id: 'daggerThrow', name: '단검 던지기', en: 'Dagger Throw', type: A, rarity: RARITY.COMMON, color: G, cost: 1, target: E,
  dmg: 9, dmgU: 12,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 카드를 1장 뽑은 뒤 1장을 버립니다.`),
  play: async (x) => {
    x.B.attack(x, x.c.v('dmg'));
    x.B.draw(1);
    const cand = x.B.hand.filter((h) => h.uid !== x.c.uid);
    if (cand.length) { const [s] = await x.B.chooseCards(cand, { count: 1, title: '버릴 카드 선택' }); if (s) x.B.discardFromHand(s); }
  } });

def({ id: 'deadlyPoison', name: '맹독 주입', en: 'Deadly Poison', type: S, rarity: RARITY.COMMON, color: G, cost: 1, target: E,
  mag: 5, magU: 7,
  text: D((c) => `적에게 중독을 ${c.v('mag')} 부여합니다.`),
  play: (x) => x.B.addPower(x.t, 'poison', x.c.v('mag'), x.p) });

def({ id: 'deflect', name: '받아넘기기', en: 'Deflect', type: S, rarity: RARITY.COMMON, color: G, cost: 0, target: SELF,
  blk: 4, blkU: 7,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다.`),
  play: (x) => x.B.gainBlock(x.p, x.c.v('blk'), x.c) });

def({ id: 'dodgeAndRoll', name: '구르기', en: 'Dodge and Roll', type: S, rarity: RARITY.COMMON, color: G, cost: 1, target: SELF,
  blk: 4, blkU: 6,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다. 다음 턴에 방어도를 ${c.v('blk')} 얻습니다.`),
  play: (x) => { x.B.gainBlock(x.p, x.c.v('blk'), x.c); x.B.addPower(x.p, 'nextTurnBlock', x.c.v('blk'), x.p); } });

def({ id: 'flyingKnee', name: '날아차기', en: 'Flying Knee', type: A, rarity: RARITY.COMMON, color: G, cost: 1, target: E,
  dmg: 8, dmgU: 11,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 다음 턴에 에너지를 1 얻습니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.addPower(x.p, 'nextTurnEnergy', 1, x.p); } });

def({ id: 'outmaneuver', name: '허를 찌르기', en: 'Outmaneuver', type: S, rarity: RARITY.COMMON, color: G, cost: 1, target: NONE,
  mag: 2, magU: 3,
  text: D((c) => `다음 턴에 에너지를 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.addPower(x.p, 'nextTurnEnergy', x.c.v('mag'), x.p) });

def({ id: 'piercingWail', name: '꿰뚫는 통곡', en: 'Piercing Wail', type: S, rarity: RARITY.COMMON, color: G, cost: 1, target: ALL,
  mag: 6, magU: 8, exhaust: true,
  text: D((c) => `이번 턴 동안 모든 적의 힘을 ${c.v('mag')} 감소시킵니다.`),
  play: (x) => x.B.living().forEach((e) => {
    x.B.addPower(e, 'strength', -x.c.v('mag'), x.p);
    x.B.addPower(e, 'gainStrengthEOT', x.c.v('mag'), x.p);
  }) });

def({ id: 'poisonedStab', name: '독이 묻은 일격', en: 'Poisoned Stab', type: A, rarity: RARITY.COMMON, color: G, cost: 1, target: E,
  dmg: 6, dmgU: 8, mag: 3, magU: 4,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 중독을 ${c.v('mag')} 부여합니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.addPower(x.t, 'poison', x.c.v('mag'), x.p); } });

def({ id: 'prepared', name: '준비', en: 'Prepared', type: S, rarity: RARITY.COMMON, color: G, cost: 0, target: NONE,
  mag: 1, magU: 2,
  text: D((c) => `카드를 ${c.v('mag')}장 뽑고 ${c.v('mag')}장을 버립니다.`),
  play: async (x) => {
    x.B.draw(x.c.v('mag'));
    const cand = x.B.hand.filter((h) => h.uid !== x.c.uid);
    if (!cand.length) return;
    const sel = await x.B.chooseCards(cand, { count: Math.min(x.c.v('mag'), cand.length), title: '버릴 카드 선택' });
    (sel || []).forEach((s) => x.B.discardFromHand(s));
  } });

def({ id: 'quickSlash', name: '빠른 베기', en: 'Quick Slash', type: A, rarity: RARITY.COMMON, color: G, cost: 1, target: E,
  dmg: 8, dmgU: 12,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 카드를 1장 뽑습니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.draw(1); } });

def({ id: 'slice', name: '베기', en: 'Slice', type: A, rarity: RARITY.COMMON, color: G, cost: 0, target: E,
  dmg: 6, dmgU: 9,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg')) });

def({ id: 'sneakyStrike', name: '기습', en: 'Sneaky Strike', type: A, rarity: RARITY.COMMON, color: G, cost: 2, target: E,
  dmg: 12, dmgU: 16,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 이번 턴에 카드를 버린 적이 있다면 에너지를 2 얻습니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); if (x.B.discardedThisTurn > 0) x.B.gainEnergy(2); } });

def({ id: 'suckerPunch', name: '뒤통수치기', en: 'Sucker Punch', type: A, rarity: RARITY.COMMON, color: G, cost: 1, target: E,
  dmg: 7, dmgU: 9, mag: 1, magU: 2,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 약화를 ${c.v('mag')} 부여합니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.addPower(x.t, 'weak', x.c.v('mag'), x.p); } });

// ---------------- 고급 36 ----------------
def({ id: 'accuracy', name: '정확도', en: 'Accuracy', type: P, rarity: RARITY.UNCOMMON, color: G, cost: 1, target: SELF,
  mag: 4, magU: 5,
  text: D((c) => `단검의 피해량이 ${c.v('mag')} 증가합니다.`),
  play: (x) => x.B.addPower(x.p, 'accuracy', x.c.v('mag'), x.p) });

def({ id: 'allOutAttack', name: '전면 공격', en: 'All-Out Attack', type: A, rarity: RARITY.UNCOMMON, color: G, cost: 1, target: ALL,
  dmg: 10, dmgU: 14,
  text: D((c) => `모든 적에게 피해를 ${c.v('dmg')} 주고 무작위 카드 1장을 버립니다.`),
  play: (x) => {
    x.B.attackAll(x, x.c.v('dmg'));
    const cand = x.B.hand.filter((h) => h.uid !== x.c.uid);
    if (cand.length) x.B.discardFromHand(x.B.rng.pick(cand));
  } });

def({ id: 'backstab', name: '등 찌르기', en: 'Backstab', type: A, rarity: RARITY.UNCOMMON, color: G, cost: 0, target: E,
  dmg: 11, dmgU: 15, innate: true, exhaust: true,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg')) });

def({ id: 'blurCard', name: '흐릿함', en: 'Blur', type: S, rarity: RARITY.UNCOMMON, color: G, cost: 1, target: SELF,
  blk: 5, blkU: 8,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다. 다음 턴이 시작될 때 방어도가 사라지지 않습니다.`),
  play: (x) => { x.B.gainBlock(x.p, x.c.v('blk'), x.c); x.B.addPower(x.p, 'blur', 1, x.p); } });

def({ id: 'bouncingFlask', name: '튀는 플라스크', en: 'Bouncing Flask', type: S, rarity: RARITY.UNCOMMON, color: G, cost: 2, target: NONE,
  mag: 3, hits: 3, hitsU: 4,
  text: D((c) => `무작위 적에게 중독을 ${c.v('mag')} 부여합니다. ${c.v('hits')}회 반복합니다.`),
  play: (x) => { for (let i = 0; i < x.c.v('hits'); i++) { const l = x.B.living(); if (l.length) x.B.addPower(x.B.rng.pick(l), 'poison', x.c.v('mag'), x.p); } } });

def({ id: 'calculatedGamble', name: '계산된 도박', en: 'Calculated Gamble', type: S, rarity: RARITY.UNCOMMON, color: G, cost: 0, target: NONE,
  exhaust: true, exhaustU: false,
  text: D(() => `손에 있는 카드를 모두 버리고 버린 수만큼 카드를 뽑습니다.`),
  play: (x) => {
    const list = x.B.hand.filter((h) => h.uid !== x.c.uid);
    list.forEach((h) => x.B.discardFromHand(h));
    x.B.draw(list.length);
  } });

def({ id: 'caltrops', name: '마름쇠', en: 'Caltrops', type: P, rarity: RARITY.UNCOMMON, color: G, cost: 1, target: SELF,
  mag: 3, magU: 5,
  text: D((c) => `가시를 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.addPower(x.p, 'thorns', x.c.v('mag'), x.p) });

def({ id: 'catalyst', name: '촉매', en: 'Catalyst', type: S, rarity: RARITY.UNCOMMON, color: G, cost: 1, target: E,
  mag: 2, magU: 3, exhaust: true,
  text: D((c) => `대상의 중독을 ${c.v('mag')}배로 만듭니다.`),
  play: (x) => { const ps = x.B.pow(x.t, 'poison'); if (ps > 0) x.B.addPower(x.t, 'poison', ps * (x.c.v('mag') - 1), x.p); } });

def({ id: 'choke', name: '질식', en: 'Choke', type: A, rarity: RARITY.UNCOMMON, color: G, cost: 2, target: E,
  dmg: 12, mag: 3, magU: 5,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 이번 턴에 카드를 사용할 때마다 대상이 체력을 ${c.v('mag')} 잃습니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.addPower(x.t, 'choke', x.c.v('mag'), x.p); } });

def({ id: 'concentrate', name: '집중', en: 'Concentrate', type: S, rarity: RARITY.UNCOMMON, color: G, cost: 0, target: NONE,
  mag: 3, magU: 2,
  text: D((c) => `카드 ${c.v('mag')}장을 버리고 에너지를 2 얻습니다.`),
  play: async (x) => {
    const cand = x.B.hand.filter((h) => h.uid !== x.c.uid);
    const n = Math.min(x.c.v('mag'), cand.length);
    if (n > 0) {
      const sel = await x.B.chooseCards(cand, { count: n, title: `버릴 카드 ${n}장 선택` });
      (sel || []).forEach((s) => x.B.discardFromHand(s));
    }
    x.B.gainEnergy(2);
  } });

def({ id: 'cripplingCloud', name: '불구의 구름', en: 'Crippling Cloud', type: S, rarity: RARITY.UNCOMMON, color: G, cost: 2, target: ALL,
  mag: 4, magU: 7, exhaust: true,
  text: D((c) => `모든 적에게 중독을 ${c.v('mag')}, 약화를 2 부여합니다.`),
  play: (x) => x.B.living().forEach((e) => { x.B.addPower(e, 'poison', x.c.v('mag'), x.p); x.B.addPower(e, 'weak', 2, x.p); }) });

def({ id: 'dash', name: '질주', en: 'Dash', type: A, rarity: RARITY.UNCOMMON, color: G, cost: 2, target: E,
  dmg: 10, dmgU: 13, blk: 10, blkU: 13,
  text: D((c) => `방어도를 ${c.v('blk')} 얻고 피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => { x.B.gainBlock(x.p, x.c.v('blk'), x.c); x.B.attack(x, x.c.v('dmg')); } });

def({ id: 'distraction', name: '교란', en: 'Distraction', type: S, rarity: RARITY.UNCOMMON, color: G, cost: 1, costU: 0, target: NONE,
  exhaust: true,
  text: D(() => `무작위 기술 카드 1장을 손에 넣습니다. 이번 턴 그 카드의 비용은 0입니다.`),
  play: (x) => { const c = x.B.randomCardOfType(S); if (c) { c.costForTurn = 0; x.B.addCardToHand(c); } } });

def({ id: 'endlessAgony', name: '끝없는 고통', en: 'Endless Agony', type: A, rarity: RARITY.UNCOMMON, color: G, cost: 0, target: E,
  dmg: 4, dmgU: 6, exhaust: true,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 이 카드를 뽑을 때마다 복사본 1장을 손에 넣습니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg')),
  onDraw: (B, c) => B.addCardToHand(c.copy()) });

def({ id: 'escapePlan', name: '탈출 계획', en: 'Escape Plan', type: S, rarity: RARITY.UNCOMMON, color: G, cost: 0, target: NONE,
  blk: 3, blkU: 5,
  text: D((c) => `카드를 1장 뽑습니다. 뽑은 카드가 기술이면 방어도를 ${c.v('blk')} 얻습니다.`),
  play: (x) => {
    const before = x.B.hand.length;
    x.B.draw(1);
    const got = x.B.hand[x.B.hand.length - 1];
    if (x.B.hand.length > before && got && got.type === S) x.B.gainBlock(x.p, x.c.v('blk'), x.c);
  } });

def({ id: 'eviscerate', name: '도려내기', en: 'Eviscerate', type: A, rarity: RARITY.UNCOMMON, color: G, cost: 3, target: E,
  dmg: 7, dmgU: 9, hits: 3,
  text: D((c) => `이번 턴에 버린 카드 1장당 비용이 1 감소합니다. 피해를 ${c.v('dmg')} 줍니다. 3회 반복합니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg'), 3) });

def({ id: 'expertise', name: '숙련', en: 'Expertise', type: S, rarity: RARITY.UNCOMMON, color: G, cost: 1, target: NONE,
  mag: 6, magU: 7,
  text: D((c) => `손에 카드가 ${c.v('mag')}장이 되도록 카드를 뽑습니다.`),
  play: (x) => x.B.draw(Math.max(0, x.c.v('mag') - x.B.hand.length)) });

def({ id: 'finisher', name: '마무리', en: 'Finisher', type: A, rarity: RARITY.UNCOMMON, color: G, cost: 1, target: E,
  dmg: 6, dmgU: 8,
  text: D((c) => `이번 턴에 사용한 공격 카드 1장당 피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => { const n = x.B.attacksThisTurn || 0; for (let i = 0; i < n; i++) x.B.attack(x, x.c.v('dmg')); } });

def({ id: 'flechettes', name: '화살 세례', en: 'Flechettes', type: A, rarity: RARITY.UNCOMMON, color: G, cost: 1, target: E,
  dmg: 4, dmgU: 6,
  text: D((c) => `손에 있는 기술 카드 1장당 피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => { const n = x.B.hand.filter((h) => h.type === S).length; for (let i = 0; i < n; i++) x.B.attack(x, x.c.v('dmg')); } });

def({ id: 'footwork', name: '발놀림', en: 'Footwork', type: P, rarity: RARITY.UNCOMMON, color: G, cost: 1, target: SELF,
  mag: 2, magU: 3,
  text: D((c) => `민첩을 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.addPower(x.p, 'dexterity', x.c.v('mag'), x.p) });

def({ id: 'heelHook', name: '발뒤꿈치 걸기', en: 'Heel Hook', type: A, rarity: RARITY.UNCOMMON, color: G, cost: 1, target: E,
  dmg: 5, dmgU: 8,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 대상이 약화 상태라면 에너지를 1 얻고 카드를 1장 뽑습니다.`),
  play: (x) => { const w = x.t && x.B.pow(x.t, 'weak') > 0; x.B.attack(x, x.c.v('dmg')); if (w) { x.B.gainEnergy(1); x.B.draw(1); } } });

def({ id: 'infiniteBlades', name: '무한의 칼날', en: 'Infinite Blades', type: P, rarity: RARITY.UNCOMMON, color: G, cost: 1, target: SELF,
  mag: 1, magU: 2,
  text: D((c) => `턴이 시작될 때마다 단검 ${c.v('mag')}장을 손에 넣습니다.`),
  play: (x) => x.B.addPower(x.p, 'infiniteBlades', x.c.v('mag'), x.p) });

def({ id: 'legSweep', name: '다리 후리기', en: 'Leg Sweep', type: S, rarity: RARITY.UNCOMMON, color: G, cost: 2, target: E,
  blk: 11, blkU: 14, mag: 2, magU: 3,
  text: D((c) => `약화를 ${c.v('mag')} 부여하고 방어도를 ${c.v('blk')} 얻습니다.`),
  play: (x) => { x.B.addPower(x.t, 'weak', x.c.v('mag'), x.p); x.B.gainBlock(x.p, x.c.v('blk'), x.c); } });

def({ id: 'masterfulStab', name: '훌륭한 찌르기', en: 'Masterful Stab', type: A, rarity: RARITY.UNCOMMON, color: G, cost: 0, target: E,
  dmg: 12, dmgU: 16, mag: 6, magU: 5,
  text: D((c) => `이 카드를 사용하려면 체력을 ${c.v('mag')} 잃어야 합니다. 피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => { x.B.loseHp(x.p, x.c.v('mag'), x.c); x.B.attack(x, x.c.v('dmg')); } });

def({ id: 'noxiousFumes', name: '유독 가스', en: 'Noxious Fumes', type: P, rarity: RARITY.UNCOMMON, color: G, cost: 1, target: SELF,
  mag: 2, magU: 3,
  text: D((c) => `턴이 시작될 때마다 모든 적에게 중독을 ${c.v('mag')} 부여합니다.`),
  play: (x) => x.B.addPower(x.p, 'noxiousFumes', x.c.v('mag'), x.p) });

def({ id: 'predator', name: '포식자', en: 'Predator', type: A, rarity: RARITY.UNCOMMON, color: G, cost: 2, target: E,
  dmg: 15, dmgU: 20,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 다음 턴에 카드를 2장 더 뽑습니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.addPower(x.p, 'nextTurnDraw', 2, x.p); } });

def({ id: 'reflex', name: '반사 신경', en: 'Reflex', type: S, rarity: RARITY.UNCOMMON, color: G, cost: -2, target: NONE,
  mag: 2, magU: 3, unplayable: true,
  text: (c) => `사용할 수 없습니다. 이 카드를 버리면 카드를 ${c.v('mag')}장 뽑습니다.`,
  onDiscard: (B, c) => B.draw(c.v('mag')) });

def({ id: 'riddleWithHoles', name: '벌집 만들기', en: 'Riddle with Holes', type: A, rarity: RARITY.UNCOMMON, color: G, cost: 2, target: E,
  dmg: 3, dmgU: 4, hits: 5,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 5회 반복합니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg'), 5) });

def({ id: 'setup', name: '준비하기', en: 'Setup', type: S, rarity: RARITY.UNCOMMON, color: G, cost: 1, costU: 0, target: NONE,
  text: D(() => `뽑을 카드 더미에서 카드 1장을 손에 넣습니다. 그 카드의 비용은 0이 됩니다.`),
  play: async (x) => {
    if (!x.B.drawPile.length) return;
    const [s] = await x.B.chooseCards(x.B.drawPile.slice(), { count: 1, title: '가져올 카드' });
    if (s) { x.B.removeFrom(x.B.drawPile, s); s.costOverride = 0; x.B.addCardToHand(s); }
  } });

def({ id: 'skewer', name: '꼬치', en: 'Skewer', type: A, rarity: RARITY.UNCOMMON, color: G, cost: -1, target: E,
  dmg: 7, dmgU: 10,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. X회 반복합니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg'), x.x) });

def({ id: 'stormOfSteel', name: '강철 폭풍', en: 'Storm of Steel', type: S, rarity: RARITY.UNCOMMON, color: G, cost: 1, target: NONE,
  text: D((c) => `손에 있는 카드를 모두 버리고, 버린 카드 1장당 단검 1장을 손에 넣습니다.${c.upgraded ? ' 단검이 강화됩니다.' : ''}`),
  play: (x) => {
    const list = x.B.hand.filter((h) => h.uid !== x.c.uid);
    list.forEach((h) => x.B.discardFromHand(h));
    for (let i = 0; i < list.length; i++) {
      const s = mk('shiv', x.c.upgraded);
      x.B.addCardToHand(s);
    }
  } });

def({ id: 'tactician', name: '전술가', en: 'Tactician', type: S, rarity: RARITY.UNCOMMON, color: G, cost: -2, target: NONE,
  mag: 1, magU: 2, unplayable: true,
  text: (c) => `사용할 수 없습니다. 이 카드를 버리면 에너지를 ${c.v('mag')} 얻습니다.`,
  onDiscard: (B, c) => B.gainEnergy(c.v('mag')) });

def({ id: 'terror', name: '공포', en: 'Terror', type: S, rarity: RARITY.UNCOMMON, color: G, cost: 1, costU: 0, target: E,
  exhaust: true,
  text: D(() => `적에게 취약을 99 부여합니다.`),
  play: (x) => x.B.addPower(x.t, 'vulnerable', 99, x.p) });

def({ id: 'unload', name: '쏟아내기', en: 'Unload', type: A, rarity: RARITY.UNCOMMON, color: G, cost: 1, target: E,
  dmg: 14, dmgU: 18,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 손에 있는 공격이 아닌 카드를 모두 버립니다.`),
  play: (x) => {
    x.B.attack(x, x.c.v('dmg'));
    x.B.hand.filter((h) => h.uid !== x.c.uid && h.type !== A).forEach((h) => x.B.discardFromHand(h));
  } });

def({ id: 'wellLaidPlans', name: '치밀한 계획', en: 'Well-Laid Plans', type: P, rarity: RARITY.UNCOMMON, color: G, cost: 1, target: SELF,
  mag: 1, magU: 2,
  text: D((c) => `턴이 끝날 때 카드 ${c.v('mag')}장을 보존합니다.`),
  play: (x) => x.B.addPower(x.p, 'wellLaidPlans', x.c.v('mag'), x.p) });

def({ id: 'alchemize', name: '연금술', en: 'Alchemize', type: S, rarity: RARITY.UNCOMMON, color: G, cost: 1, costU: 0, target: NONE,
  exhaust: true,
  text: D(() => `무작위 물약을 하나 얻습니다.`),
  play: (x) => { const id = x.B.run.randomPotion(); if (x.B.run.addPotion(id)) x.B.log('물약을 얻었다!'); else x.B.log('물약 슬롯이 가득 찼다.'); } });

def({ id: 'bulletTime', name: '총알 시간', en: 'Bullet Time', type: S, rarity: RARITY.UNCOMMON, color: G, cost: 3, costU: 2, target: NONE,
  text: D(() => `이번 턴에 카드를 뽑을 수 없습니다. 손에 있는 카드의 비용이 0이 됩니다.`),
  play: (x) => { x.B.addPower(x.p, 'noDraw', 1, x.p); x.B.hand.forEach((h) => { if (!h.unplayable) h.costForTurn = 0; }); } });

// ---------------- 희귀 16 ----------------
def({ id: 'adrenaline', name: '아드레날린', en: 'Adrenaline', type: S, rarity: RARITY.RARE, color: G, cost: 0, target: NONE,
  mag: 1, magU: 2, exhaust: true,
  text: D((c) => `에너지를 ${c.v('mag')} 얻고 카드를 2장 뽑습니다.`),
  play: (x) => { x.B.gainEnergy(x.c.v('mag')); x.B.draw(2); } });

def({ id: 'afterImage', name: '잔상', en: 'After Image', type: P, rarity: RARITY.RARE, color: G, cost: 1, target: SELF,
  mag: 1, magU: 2,
  text: D((c) => `카드를 사용할 때마다 방어도를 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.addPower(x.p, 'afterImage', x.c.v('mag'), x.p) });

def({ id: 'aThousandCuts', name: '천 번의 상처', en: 'A Thousand Cuts', type: P, rarity: RARITY.RARE, color: G, cost: 2, target: SELF,
  mag: 1, magU: 2,
  text: D((c) => `카드를 사용할 때마다 모든 적에게 피해를 ${c.v('mag')} 줍니다.`),
  play: (x) => x.B.addPower(x.p, 'thousandCuts', x.c.v('mag'), x.p) });

def({ id: 'burstCard', name: '연쇄', en: 'Burst', type: S, rarity: RARITY.RARE, color: G, cost: 1, target: SELF,
  mag: 1, magU: 2,
  text: D((c) => `이번 턴에 사용하는 기술 카드 ${c.v('mag')}장이 두 번 사용됩니다.`),
  play: (x) => x.B.addPower(x.p, 'burst', x.c.v('mag'), x.p) });

def({ id: 'corpseExplosion', name: '시체 폭발', en: 'Corpse Explosion', type: S, rarity: RARITY.RARE, color: G, cost: 2, target: E,
  mag: 6, magU: 9,
  text: D((c) => `적에게 중독을 ${c.v('mag')} 부여합니다. 그 적이 죽으면 최대 체력만큼 모든 적에게 피해를 줍니다.`),
  play: (x) => { x.B.addPower(x.t, 'poison', x.c.v('mag'), x.p); x.B.addPower(x.t, 'corpseExplosion', 1, x.p); } });

def({ id: 'dieDieDie', name: '죽어라', en: 'Die Die Die', type: A, rarity: RARITY.RARE, color: G, cost: 1, target: ALL,
  dmg: 13, dmgU: 17, exhaust: true,
  text: D((c) => `모든 적에게 피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => x.B.attackAll(x, x.c.v('dmg')) });

def({ id: 'doppelganger', name: '도플갱어', en: 'Doppelganger', type: S, rarity: RARITY.RARE, color: G, cost: -1, target: NONE,
  exhaust: true,
  text: D((c) => `다음 턴에 카드를 X${c.upgraded ? '+1' : ''}장 더 뽑고 에너지를 X${c.upgraded ? '+1' : ''} 더 얻습니다.`),
  play: (x) => {
    const n = x.x + (x.c.upgraded ? 1 : 0);
    x.B.addPower(x.p, 'nextTurnDraw', n, x.p);
    x.B.addPower(x.p, 'nextTurnEnergy', n, x.p);
  } });

def({ id: 'envenom', name: '맹독', en: 'Envenom', type: P, rarity: RARITY.RARE, color: G, cost: 2, costU: 1, target: SELF,
  text: D(() => `공격으로 체력 피해를 줄 때마다 중독을 1 부여합니다.`),
  play: (x) => x.B.addPower(x.p, 'envenom', 1, x.p) });

def({ id: 'glassKnife', name: '유리 칼', en: 'Glass Knife', type: A, rarity: RARITY.RARE, color: G, cost: 1, target: E,
  dmg: 8, dmgU: 12, hits: 2,
  text: D((c) => `피해를 ${Math.max(0, c.v('dmg') + c.bonusDmg)} 줍니다. 2회 반복합니다. 사용할 때마다 피해량이 2 감소합니다.`),
  play: (x) => { x.B.attack(x, Math.max(0, x.c.v('dmg') + x.c.bonusDmg), 2); x.c.bonusDmg -= 2; } });

def({ id: 'grandFinale', name: '대단원', en: 'Grand Finale', type: A, rarity: RARITY.RARE, color: G, cost: 0, target: ALL,
  dmg: 50, dmgU: 60,
  text: D((c) => `뽑을 카드 더미가 비어 있을 때만 사용할 수 있습니다. 모든 적에게 피해를 ${c.v('dmg')} 줍니다.`),
  canPlay: (B) => B.drawPile.length === 0,
  play: (x) => x.B.attackAll(x, x.c.v('dmg')) });

def({ id: 'malaise', name: '권태', en: 'Malaise', type: S, rarity: RARITY.RARE, color: G, cost: -1, target: E,
  exhaust: true,
  text: D((c) => `적의 힘을 X${c.upgraded ? '+1' : ''} 감소시키고 약화를 X${c.upgraded ? '+1' : ''} 부여합니다.`),
  play: (x) => {
    const n = x.x + (x.c.upgraded ? 1 : 0);
    if (!x.t) return;
    x.B.addPower(x.t, 'strength', -n, x.p);
    x.B.addPower(x.t, 'weak', n, x.p);
  } });

def({ id: 'nightmare', name: '악몽', en: 'Nightmare', type: S, rarity: RARITY.RARE, color: G, cost: 3, costU: 2, target: NONE,
  exhaust: true,
  text: D(() => `손에 있는 카드 1장을 선택합니다. 다음 턴에 그 카드의 복사본 3장을 손에 넣습니다.`),
  play: async (x) => {
    const cand = x.B.hand.filter((h) => h.uid !== x.c.uid);
    if (!cand.length) return;
    const [s] = await x.B.chooseCards(cand, { count: 1, title: '복사할 카드 선택' });
    if (s) x.B.nightmareCard = s.copy();
  } });

def({ id: 'phantasmalKiller', name: '환영의 살수', en: 'Phantasmal Killer', type: S, rarity: RARITY.RARE, color: G, cost: 1, costU: 0, target: SELF,
  text: D(() => `다음 턴에 주는 공격 피해가 2배가 됩니다.`),
  play: (x) => x.B.addPower(x.p, 'doubleDamage', 2, x.p) });

def({ id: 'toolsOfTheTrade', name: '도구 사용', en: 'Tools of the Trade', type: P, rarity: RARITY.RARE, color: G, cost: 1, costU: 0, target: SELF,
  text: D(() => `턴이 시작될 때마다 카드를 1장 뽑고 1장을 버립니다.`),
  play: (x) => x.B.addPower(x.p, 'toolsOfTheTrade', 1, x.p) });

def({ id: 'wraithForm', name: '망령 형상', en: 'Wraith Form', type: P, rarity: RARITY.RARE, color: G, cost: 3, target: SELF,
  mag: 2, magU: 3,
  text: D((c) => `무형을 ${c.v('mag')} 얻습니다. 턴이 시작될 때마다 민첩이 1 감소합니다.`),
  play: (x) => { x.B.addPower(x.p, 'intangible', x.c.v('mag'), x.p); x.B.addPower(x.p, 'bias', 1, x.p); } });

def({ id: 'venomThrow', name: '독 투척', en: 'Venom Throw', type: A, rarity: RARITY.RARE, color: G, cost: 2, target: ALL,
  dmg: 8, dmgU: 11, mag: 3, magU: 4,
  text: D((c) => `모든 적에게 피해를 ${c.v('dmg')} 주고 중독을 ${c.v('mag')} 부여합니다.`),
  play: (x) => x.B.attackAll(x, x.c.v('dmg'), 1, (e) => x.B.addPower(e, 'poison', x.c.v('mag'), x.p)) });
