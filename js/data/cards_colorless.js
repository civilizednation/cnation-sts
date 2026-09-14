// ============================================================
//  무색(Colorless) 카드 + 상태이상 + 저주
// ============================================================
import { def, TYPE, TARGET, RARITY, COLOR, mk, CARD_DEFS } from './carddb.js';

const CL = COLOR.COLORLESS;
const A = TYPE.ATTACK, S = TYPE.SKILL, P = TYPE.POWER, ST = TYPE.STATUS, CU = TYPE.CURSE;
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

// ----------------------------------------------------------------
// 무색 - 일반
// ----------------------------------------------------------------
def({ id: 'bandageUp', name: '붕대 감기', en: 'Bandage Up', type: S, rarity: RARITY.UNCOMMON, color: CL, cost: 0, target: SELF,
  mag: 4, magU: 6, exhaust: true,
  text: D((c) => `체력을 ${c.v('mag')} 회복합니다.`),
  play: (x) => x.B.heal(x.p, x.c.v('mag')) });

def({ id: 'blind', name: '실명', en: 'Blind', type: S, rarity: RARITY.UNCOMMON, color: CL, cost: 0, target: E,
  mag: 2,
  text: D((c) => c.upgraded ? `모든 적에게 약화를 ${c.v('mag')} 부여합니다.` : `적에게 약화를 ${c.v('mag')} 부여합니다.`),
  play: (x) => {
    if (x.c.upgraded) x.B.living().forEach((e) => x.B.addPower(e, 'weak', x.c.v('mag'), x.p));
    else if (x.t) x.B.addPower(x.t, 'weak', x.c.v('mag'), x.p);
  } });

def({ id: 'darkShackles', name: '어둠의 족쇄', en: 'Dark Shackles', type: S, rarity: RARITY.UNCOMMON, color: CL, cost: 0, target: E,
  mag: 9, magU: 15, exhaust: true,
  text: D((c) => `이번 턴 동안 적의 힘을 ${c.v('mag')} 감소시킵니다.`),
  play: (x) => { if (x.t) { x.B.addPower(x.t, 'strength', -x.c.v('mag'), x.p); x.B.addPower(x.t, 'gainStrengthEOT', x.c.v('mag'), x.p); } } });

def({ id: 'deepBreath', name: '심호흡', en: 'Deep Breath', type: S, rarity: RARITY.UNCOMMON, color: CL, cost: 0, target: NONE,
  mag: 1, magU: 2,
  text: D((c) => `버린 카드 더미를 뽑을 카드 더미에 섞어 넣고 카드를 ${c.v('mag')}장 뽑습니다.`),
  play: (x) => { x.B.shuffleDiscardIntoDraw(); x.B.draw(x.c.v('mag')); } });

def({ id: 'discovery', name: '발견', en: 'Discovery', type: S, rarity: RARITY.UNCOMMON, color: CL, cost: 1, target: NONE,
  mag: 1, exhaust: true, exhaustU: false,
  text: D(() => `무작위 카드 3장 중 1장을 골라 손에 넣습니다. 이번 턴 동안 그 카드의 비용은 0입니다.`),
  play: async (x) => {
    const opts = x.B.randomCardChoices(3);
    const [sel] = await x.B.chooseCards(opts, { count: 1, title: '카드 1장 선택', virtual: true });
    if (sel) { sel.costForTurn = 0; x.B.addCardToHand(sel); }
  } });

def({ id: 'dramaticEntrance', name: '극적인 등장', en: 'Dramatic Entrance', type: A, rarity: RARITY.UNCOMMON, color: CL, cost: 0, target: ALL,
  dmg: 8, dmgU: 12, innate: true, exhaust: true,
  text: D((c) => `모든 적에게 피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => x.B.attackAll(x, x.c.v('dmg')) });

def({ id: 'enlightenment', name: '깨달음', en: 'Enlightenment', type: S, rarity: RARITY.UNCOMMON, color: CL, cost: 0, target: NONE,
  text: D((c) => c.upgraded
    ? `이번 전투 동안 손에 있는 카드 중 비용이 1보다 큰 카드의 비용이 1이 됩니다.`
    : `이번 턴 동안 손에 있는 카드 중 비용이 1보다 큰 카드의 비용이 1이 됩니다.`),
  play: (x) => x.B.hand.forEach((h) => {
    if (h.uid === x.c.uid) return;
    if (h.cost > 1) { if (x.c.upgraded) h.costOverride = 1; else h.costForTurn = 1; }
  }) });

def({ id: 'finesse', name: '기교', en: 'Finesse', type: S, rarity: RARITY.UNCOMMON, color: CL, cost: 0, target: SELF,
  blk: 2, blkU: 4,
  text: D((c) => `방어도를 ${c.v('blk')} 얻고 카드를 1장 뽑습니다.`),
  play: (x) => { x.B.gainBlock(x.p, x.c.v('blk'), x.c); x.B.draw(1); } });

def({ id: 'flashOfSteel', name: '강철 섬광', en: 'Flash of Steel', type: A, rarity: RARITY.UNCOMMON, color: CL, cost: 0, target: E,
  dmg: 3, dmgU: 6,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 카드를 1장 뽑습니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.draw(1); } });

def({ id: 'goodInstincts', name: '좋은 직감', en: 'Good Instincts', type: S, rarity: RARITY.UNCOMMON, color: CL, cost: 0, target: SELF,
  blk: 6, blkU: 9,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다.`),
  play: (x) => x.B.gainBlock(x.p, x.c.v('blk'), x.c) });

def({ id: 'impatience', name: '성급함', en: 'Impatience', type: S, rarity: RARITY.UNCOMMON, color: CL, cost: 0, target: NONE,
  mag: 2, magU: 3,
  text: D((c) => `손에 공격 카드가 없으면 카드를 ${c.v('mag')}장 뽑습니다.`),
  play: (x) => { if (!x.B.hand.some((h) => h.type === A)) x.B.draw(x.c.v('mag')); } });

def({ id: 'jackOfAllTrades', name: '만물박사', en: 'Jack of All Trades', type: S, rarity: RARITY.UNCOMMON, color: CL, cost: 0, target: NONE,
  mag: 1, magU: 2, exhaust: true,
  text: D((c) => `무작위 무색 카드 ${c.v('mag')}장을 손에 넣습니다.`),
  play: (x) => { for (let i = 0; i < x.c.v('mag'); i++) { const c = x.B.randomColorlessCard(); if (c) x.B.addCardToHand(c); } } });

def({ id: 'madness', name: '광기', en: 'Madness', type: S, rarity: RARITY.UNCOMMON, color: CL, cost: 1, costU: 0, target: NONE,
  exhaust: true,
  text: D(() => `손에 있는 무작위 카드 1장의 비용이 이번 전투 동안 0이 됩니다.`),
  play: (x) => {
    const cand = x.B.hand.filter((h) => h.uid !== x.c.uid && h.cost > 0);
    if (cand.length) x.B.rng.pick(cand).costOverride = 0;
  } });

def({ id: 'mindBlast', name: '정신 폭발', en: 'Mind Blast', type: A, rarity: RARITY.UNCOMMON, color: CL, cost: 2, costU: 1, target: E,
  innate: true,
  text: D(() => `뽑을 카드 더미에 있는 카드 수만큼 피해를 줍니다.`),
  play: (x) => x.B.attack(x, x.B.drawPile.length) });

def({ id: 'panacea', name: '만병통치약', en: 'Panacea', type: S, rarity: RARITY.UNCOMMON, color: CL, cost: 0, target: SELF,
  mag: 1, magU: 2, exhaust: true,
  text: D((c) => `인공물을 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.addPower(x.p, 'artifact', x.c.v('mag'), x.p) });

def({ id: 'panicButton', name: '비상 버튼', en: 'Panic Button', type: S, rarity: RARITY.UNCOMMON, color: CL, cost: 0, target: SELF,
  blk: 30, blkU: 40, exhaust: true,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다. 2턴 동안 방어도를 얻을 수 없습니다.`),
  play: (x) => { x.B.gainBlock(x.p, x.c.v('blk'), x.c); x.B.addPower(x.p, 'noBlock', 2, x.p); } });

def({ id: 'purity', name: '정화', en: 'Purity', type: S, rarity: RARITY.UNCOMMON, color: CL, cost: 0, target: NONE,
  mag: 3, magU: 5, exhaust: true,
  text: D((c) => `손에 있는 카드 중 최대 ${c.v('mag')}장을 선택해 소각합니다.`),
  play: async (x) => {
    const cand = x.B.hand.filter((h) => h.uid !== x.c.uid);
    if (!cand.length) return;
    const sel = await x.B.chooseCards(cand, { count: Math.min(x.c.v('mag'), cand.length), title: '소각할 카드 선택', optional: true });
    sel.forEach((s) => x.B.exhaustFromHand(s));
  } });

def({ id: 'swiftStrike', name: '재빠른 타격', en: 'Swift Strike', type: A, rarity: RARITY.UNCOMMON, color: CL, cost: 0, target: E,
  dmg: 7, dmgU: 10,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg')) });

def({ id: 'trip', name: '걸어 넘어뜨리기', en: 'Trip', type: S, rarity: RARITY.UNCOMMON, color: CL, cost: 0, target: E,
  mag: 2,
  text: D((c) => c.upgraded ? `모든 적에게 취약을 ${c.v('mag')} 부여합니다.` : `적에게 취약을 ${c.v('mag')} 부여합니다.`),
  play: (x) => {
    if (x.c.upgraded) x.B.living().forEach((e) => x.B.addPower(e, 'vulnerable', x.c.v('mag'), x.p));
    else if (x.t) x.B.addPower(x.t, 'vulnerable', x.c.v('mag'), x.p);
  } });

// ----------------------------------------------------------------
// 무색 - 희귀
// ----------------------------------------------------------------
def({ id: 'apotheosis', name: '신격화', en: 'Apotheosis', type: S, rarity: RARITY.RARE, color: CL, cost: 2, costU: 1, target: NONE,
  exhaust: true,
  text: D(() => `덱에 있는 모든 카드를 이번 전투 동안 강화합니다.`),
  play: (x) => x.B.allCombatCards().forEach((k) => k.canUpgrade() && k.upgrade()) });

def({ id: 'handOfGreed', name: '탐욕의 손', en: 'Hand of Greed', type: A, rarity: RARITY.RARE, color: CL, cost: 2, target: E,
  dmg: 20, dmgU: 25, mag: 20, magU: 25,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 이 피해로 적이 죽으면 골드를 ${c.v('mag')} 얻습니다.`),
  play: (x) => {
    const t = x.t; const alive = t && t.alive;
    x.B.attack(x, x.c.v('dmg'));
    if (alive && t && !t.alive) x.B.gainGold(x.c.v('mag'));
  } });

def({ id: 'magnetism', name: '자성', en: 'Magnetism', type: P, rarity: RARITY.RARE, color: CL, cost: 2, costU: 1, target: SELF,
  text: D(() => `턴이 시작될 때마다 무작위 무색 카드 1장을 손에 넣습니다.`),
  play: (x) => x.B.addPower(x.p, 'magnetism', 1, x.p) });

def({ id: 'masterOfStrategy', name: '전략의 대가', en: 'Master of Strategy', type: S, rarity: RARITY.RARE, color: CL, cost: 0, target: NONE,
  mag: 3, magU: 4, exhaust: true,
  text: D((c) => `카드를 ${c.v('mag')}장 뽑습니다.`),
  play: (x) => x.B.draw(x.c.v('mag')) });

def({ id: 'mayhem', name: '대혼란', en: 'Mayhem', type: P, rarity: RARITY.RARE, color: CL, cost: 2, costU: 1, target: SELF,
  text: D(() => `턴이 시작될 때마다 뽑을 카드 더미의 맨 위 카드를 사용합니다.`),
  play: (x) => x.B.addPower(x.p, 'mayhem', 1, x.p) });

def({ id: 'metamorphosis', name: '변신', en: 'Metamorphosis', type: S, rarity: RARITY.RARE, color: CL, cost: 2, costU: 1, target: NONE,
  mag: 3, magU: 5, exhaust: true,
  text: D((c) => `뽑을 카드 더미에 무작위 공격 카드 ${c.v('mag')}장을 넣습니다. 이 카드들의 비용은 0입니다.`),
  play: (x) => { for (let i = 0; i < x.c.v('mag'); i++) { const k = x.B.randomCardOfType(A); if (k) { k.costOverride = 0; x.B.addCardToDrawRandom(k); } } } });

def({ id: 'panache', name: '화려함', en: 'Panache', type: P, rarity: RARITY.RARE, color: CL, cost: 0, target: SELF,
  mag: 10, magU: 14,
  text: D((c) => `카드를 5장 사용할 때마다 모든 적에게 피해를 ${c.v('mag')} 줍니다.`),
  play: (x) => x.B.addPower(x.p, 'panache', x.c.v('mag'), x.p) });

def({ id: 'sadisticNature', name: '가학적 본성', en: 'Sadistic Nature', type: P, rarity: RARITY.RARE, color: CL, cost: 0, target: SELF,
  mag: 5, magU: 7,
  text: D((c) => `적에게 디버프를 적용할 때마다 그 적에게 피해를 ${c.v('mag')} 줍니다.`),
  play: (x) => x.B.addPower(x.p, 'sadistic', x.c.v('mag'), x.p) });

def({ id: 'secretTechnique', name: '비밀 기술', en: 'Secret Technique', type: S, rarity: RARITY.RARE, color: CL, cost: 0, target: NONE,
  exhaust: true, exhaustU: false,
  text: D(() => `뽑을 카드 더미에서 기술 카드 1장을 손에 넣습니다.`),
  play: async (x) => {
    const cand = x.B.drawPile.filter((h) => h.type === S);
    if (!cand.length) return;
    const [sel] = await x.B.chooseCards(cand, { count: 1, title: '가져올 기술 카드' });
    if (sel) { x.B.removeFrom(x.B.drawPile, sel); x.B.addCardToHand(sel); }
  } });

def({ id: 'secretWeapon', name: '비밀 무기', en: 'Secret Weapon', type: S, rarity: RARITY.RARE, color: CL, cost: 0, target: NONE,
  exhaust: true, exhaustU: false,
  text: D(() => `뽑을 카드 더미에서 공격 카드 1장을 손에 넣습니다.`),
  play: async (x) => {
    const cand = x.B.drawPile.filter((h) => h.type === A);
    if (!cand.length) return;
    const [sel] = await x.B.chooseCards(cand, { count: 1, title: '가져올 공격 카드' });
    if (sel) { x.B.removeFrom(x.B.drawPile, sel); x.B.addCardToHand(sel); }
  } });

def({ id: 'theBomb', name: '폭탄', en: 'The Bomb', type: S, rarity: RARITY.RARE, color: CL, cost: 2, target: NONE,
  mag: 40, magU: 50,
  text: D((c) => `3턴 후 모든 적에게 피해를 ${c.v('mag')} 줍니다.`),
  play: (x) => x.B.addBomb(x.c.v('mag')) });

def({ id: 'thinkingAhead', name: '앞서 생각하기', en: 'Thinking Ahead', type: S, rarity: RARITY.RARE, color: CL, cost: 0, target: NONE,
  exhaust: true, exhaustU: false,
  text: D(() => `카드를 2장 뽑고, 손에 있는 카드 1장을 뽑을 카드 더미의 맨 위에 놓습니다.`),
  play: async (x) => {
    x.B.draw(2);
    const cand = x.B.hand.filter((h) => h.uid !== x.c.uid);
    if (!cand.length) return;
    const [sel] = await x.B.chooseCards(cand, { count: 1, title: '뽑을 더미 맨 위로 보낼 카드' });
    if (sel) { x.B.removeFrom(x.B.hand, sel); x.B.drawPile.push(sel); }
  } });

def({ id: 'transmutation', name: '변환', en: 'Transmutation', type: S, rarity: RARITY.RARE, color: CL, cost: -1, target: NONE,
  exhaust: true,
  text: D((c) => `무작위 무색 카드 X장을 손에 넣습니다. 이 카드들의 비용은 0입니다.${c.upgraded ? ' 이 카드들은 강화된 상태입니다.' : ''}`),
  play: (x) => {
    for (let i = 0; i < x.x; i++) {
      const k = x.B.randomColorlessCard();
      if (!k) continue;
      k.costForTurn = 0;
      if (x.c.upgraded) k.upgrade();
      x.B.addCardToHand(k);
    }
  } });

def({ id: 'violence', name: '폭력', en: 'Violence', type: S, rarity: RARITY.RARE, color: CL, cost: 0, target: NONE,
  mag: 3, magU: 4, exhaust: true,
  text: D((c) => `뽑을 카드 더미에서 무작위 공격 카드 ${c.v('mag')}장을 손에 넣습니다.`),
  play: (x) => {
    const cand = x.B.drawPile.filter((h) => h.type === A);
    const picks = x.B.rng.shuffle(cand).slice(0, x.c.v('mag'));
    picks.forEach((k) => { x.B.removeFrom(x.B.drawPile, k); x.B.addCardToHand(k); });
  } });

// ----------------------------------------------------------------
// 상태이상 카드
// ----------------------------------------------------------------
def({ id: 'burn', name: '화상', en: 'Burn', type: ST, rarity: RARITY.SPECIAL, color: COLOR.STATUS, cost: -2, target: NONE,
  unplayable: true, noPool: true, mag: 2, magU: 4,
  text: (c) => `사용할 수 없습니다. 턴 종료 시 손에 있으면 피해를 ${c.v('mag')} 받습니다.`,
  onEndTurnInHand: (B, c) => B.loseHp(B.player, c.v('mag'), c) });

def({ id: 'dazed', name: '현혹', en: 'Dazed', type: ST, rarity: RARITY.SPECIAL, color: COLOR.STATUS, cost: -2, target: NONE,
  unplayable: true, ethereal: true, noPool: true, noUpgrade: true,
  text: () => `사용할 수 없습니다. 소멸.` });

def({ id: 'slimed', name: '점액질', en: 'Slimed', type: ST, rarity: RARITY.SPECIAL, color: COLOR.STATUS, cost: 1, target: NONE,
  exhaust: true, noPool: true, noUpgrade: true,
  text: () => `소각.`,
  play: () => {} });

def({ id: 'void', name: '공허', en: 'Void', type: ST, rarity: RARITY.SPECIAL, color: COLOR.STATUS, cost: -2, target: NONE,
  unplayable: true, ethereal: true, noPool: true, noUpgrade: true,
  text: () => `사용할 수 없습니다. 소멸. 이 카드를 뽑으면 에너지를 1 잃습니다.`,
  onDraw: (B) => B.loseEnergy(1) });

def({ id: 'wound', name: '상처', en: 'Wound', type: ST, rarity: RARITY.SPECIAL, color: COLOR.STATUS, cost: -2, target: NONE,
  unplayable: true, noPool: true, noUpgrade: true,
  text: () => `사용할 수 없습니다.` });

// ----------------------------------------------------------------
// 저주 카드
// ----------------------------------------------------------------
const curse = (o) => def(Object.assign({ type: CU, rarity: RARITY.CURSE, color: COLOR.CURSE, cost: -2, target: NONE, unplayable: true, noUpgrade: true, noPool: true }, o));

curse({ id: 'ascendersBane', name: '승천의 파멸', en: "Ascender's Bane", ethereal: true, undeletable: true,
  text: () => `사용할 수 없습니다. 소멸. 덱에서 제거할 수 없습니다.` });
curse({ id: 'clumsy', name: '서투름', en: 'Clumsy', ethereal: true,
  text: () => `사용할 수 없습니다. 소멸.` });
curse({ id: 'curseOfTheBell', name: '종의 저주', en: 'Curse of the Bell', undeletable: true,
  text: () => `사용할 수 없습니다. 덱에서 제거할 수 없습니다.` });
curse({ id: 'decay', name: '부패', en: 'Decay',
  text: () => `사용할 수 없습니다. 턴 종료 시 손에 있으면 피해를 2 받습니다.`,
  onEndTurnInHand: (B, c) => B.loseHp(B.player, 2, c) });
curse({ id: 'doubt', name: '의심', en: 'Doubt',
  text: () => `사용할 수 없습니다. 턴 종료 시 손에 있으면 약화를 1 얻습니다.`,
  onEndTurnInHand: (B) => B.addPower(B.player, 'weak', 1, B.player) });
curse({ id: 'injury', name: '부상', en: 'Injury',
  text: () => `사용할 수 없습니다.` });
curse({ id: 'necronomicurse', name: '네크로노미저주', en: 'Necronomicurse', undeletable: true,
  text: () => `사용할 수 없습니다. 덱에서 제거할 수 없습니다. 이 카드가 소각되면 손에 복사본이 생깁니다.`,
  onExhaust: (B, c) => B.addCardToHand(c.copy()) });
curse({ id: 'normality', name: '평범함', en: 'Normality',
  text: () => `사용할 수 없습니다. 이 카드가 손에 있으면 한 턴에 카드를 3장 넘게 사용할 수 없습니다.` });
curse({ id: 'pain', name: '고통', en: 'Pain',
  text: () => `사용할 수 없습니다. 다른 카드를 사용할 때마다 체력을 1 잃습니다.` });
curse({ id: 'parasite', name: '기생충', en: 'Parasite',
  text: () => `사용할 수 없습니다. 덱에서 제거되면 최대 체력이 3 감소합니다.` });
curse({ id: 'pride', name: '자만', en: 'Pride', cost: 1, unplayable: false, innate: true, exhaust: true,
  text: () => `턴 종료 시 이 카드의 복사본을 뽑을 카드 더미의 맨 위에 놓습니다. 내재. 소각.`,
  play: (x) => { x.B.prideQueue.push(x.c.copy()); } });
curse({ id: 'regret', name: '후회', en: 'Regret',
  text: () => `사용할 수 없습니다. 턴 종료 시 손에 있는 카드 1장당 체력을 1 잃습니다.`,
  onEndTurnInHand: (B, c) => B.loseHp(B.player, B.hand.length, c) });
curse({ id: 'shame', name: '수치', en: 'Shame',
  text: () => `사용할 수 없습니다. 턴 종료 시 손에 있으면 허약을 1 얻습니다.`,
  onEndTurnInHand: (B) => B.addPower(B.player, 'frail', 1, B.player) });
curse({ id: 'writhe', name: '발버둥', en: 'Writhe', innate: true,
  text: () => `사용할 수 없습니다. 내재.` });

export const CURSE_POOL = ['clumsy', 'decay', 'doubt', 'injury', 'normality', 'pain', 'parasite', 'regret', 'shame', 'writhe'];
export const STATUS_IDS = ['burn', 'dazed', 'slimed', 'void', 'wound'];
