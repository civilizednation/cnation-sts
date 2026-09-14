// ============================================================
//  아이언클래드 카드 (기본 / 일반 / 고급 / 희귀) - 원작 75종
// ============================================================
import { def, TYPE, TARGET, RARITY, COLOR, Card, mk } from './carddb.js';

const R = COLOR.RED;
const A = TYPE.ATTACK, S = TYPE.SKILL, P = TYPE.POWER;
const E = TARGET.ENEMY, ALL = TARGET.ALL, SELF = TARGET.SELF, NONE = TARGET.NONE;

// 키워드 접미 문구 생성
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
// 기본 카드
// ----------------------------------------------------------------
def({ id: 'strike_r', name: '타격', en: 'Strike', type: A, rarity: RARITY.BASIC, color: R, cost: 1, target: E,
  dmg: 6, dmgU: 9, noPool: true,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg')) });

def({ id: 'defend_r', name: '방어', en: 'Defend', type: S, rarity: RARITY.BASIC, color: R, cost: 1, target: SELF,
  blk: 5, blkU: 8, noPool: true,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다.`),
  play: (x) => x.B.gainBlock(x.p, x.c.v('blk'), x.c) });

def({ id: 'bash', name: '강타', en: 'Bash', type: A, rarity: RARITY.BASIC, color: R, cost: 2, target: E,
  dmg: 8, dmgU: 10, mag: 2, magU: 3, noPool: true,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 취약을 ${c.v('mag')} 부여합니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.addPower(x.t, 'vulnerable', x.c.v('mag'), x.p); } });

// ----------------------------------------------------------------
// 일반(Common) 20종
// ----------------------------------------------------------------
def({ id: 'anger', name: '분노', en: 'Anger', type: A, rarity: RARITY.COMMON, color: R, cost: 0, target: E,
  dmg: 6, dmgU: 8,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 버린 카드 더미에 이 카드의 복사본을 넣습니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.addCardToDiscard(x.c.copy()); } });

def({ id: 'armaments', name: '병기 준비', en: 'Armaments', type: S, rarity: RARITY.COMMON, color: R, cost: 1, target: SELF,
  blk: 5,
  text: D((c) => c.upgraded
    ? `방어도를 ${c.v('blk')} 얻습니다. 손에 있는 모든 카드를 이번 전투 동안 강화합니다.`
    : `방어도를 ${c.v('blk')} 얻습니다. 손에 있는 카드 1장을 이번 전투 동안 강화합니다.`),
  play: async (x) => {
    x.B.gainBlock(x.p, x.c.v('blk'), x.c);
    if (x.c.upgraded) { x.B.hand.forEach((h) => h.canUpgrade() && h.upgrade()); }
    else {
      const cand = x.B.hand.filter((h) => h.uid !== x.c.uid && h.canUpgrade());
      if (cand.length) {
        const [sel] = await x.B.chooseCards(cand, { count: 1, title: '강화할 카드 선택' });
        if (sel) sel.upgrade();
      }
    }
  } });

def({ id: 'bodySlam', name: '몸통 박치기', en: 'Body Slam', type: A, rarity: RARITY.COMMON, color: R, cost: 1, costU: 0, target: E,
  text: D(() => `현재 방어도와 같은 피해를 줍니다.`),
  play: (x) => x.B.attack(x, x.p.block) });

def({ id: 'clash', name: '충돌', en: 'Clash', type: A, rarity: RARITY.COMMON, color: R, cost: 0, target: E,
  dmg: 14, dmgU: 18,
  text: D((c) => `손에 공격 카드만 있어야 사용할 수 있습니다. 피해를 ${c.v('dmg')} 줍니다.`),
  canPlay: (B) => B.hand.every((h) => h.type === A),
  play: (x) => x.B.attack(x, x.c.v('dmg')) });

def({ id: 'cleave', name: '가르기', en: 'Cleave', type: A, rarity: RARITY.COMMON, color: R, cost: 1, target: ALL,
  dmg: 8, dmgU: 11,
  text: D((c) => `모든 적에게 피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => x.B.attackAll(x, x.c.v('dmg')) });

def({ id: 'clothesline', name: '목 조르기', en: 'Clothesline', type: A, rarity: RARITY.COMMON, color: R, cost: 2, target: E,
  dmg: 12, dmgU: 14, mag: 2, magU: 3,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 약화를 ${c.v('mag')} 부여합니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.addPower(x.t, 'weak', x.c.v('mag'), x.p); } });

def({ id: 'flex', name: '근육 강화', en: 'Flex', type: S, rarity: RARITY.COMMON, color: R, cost: 0, target: SELF,
  mag: 2, magU: 4,
  text: D((c) => `힘을 ${c.v('mag')} 얻습니다. 이번 턴이 끝나면 힘 ${c.v('mag')}을 잃습니다.`),
  play: (x) => { x.B.addPower(x.p, 'strength', x.c.v('mag'), x.p); x.B.addPower(x.p, 'loseStrength', x.c.v('mag'), x.p); } });

def({ id: 'havoc', name: '혼돈', en: 'Havoc', type: S, rarity: RARITY.COMMON, color: R, cost: 1, costU: 0, target: NONE,
  text: D(() => `뽑을 카드 더미의 맨 위 카드를 사용하고 소각합니다.`),
  play: async (x) => { await x.B.playTopOfDeck(); } });

def({ id: 'headbutt', name: '박치기', en: 'Headbutt', type: A, rarity: RARITY.COMMON, color: R, cost: 1, target: E,
  dmg: 9, dmgU: 12,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 버린 카드 더미의 카드 1장을 뽑을 카드 더미의 맨 위에 놓습니다.`),
  play: async (x) => {
    x.B.attack(x, x.c.v('dmg'));
    if (x.B.discardPile.length) {
      const [sel] = await x.B.chooseCards(x.B.discardPile.slice(), { count: 1, title: '뽑을 더미 맨 위로 보낼 카드' });
      if (sel) { x.B.removeFrom(x.B.discardPile, sel); x.B.drawPile.push(sel); }
    }
  } });

def({ id: 'heavyBlade', name: '대검', en: 'Heavy Blade', type: A, rarity: RARITY.COMMON, color: R, cost: 2, target: E,
  dmg: 14, mag: 3, magU: 5,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 힘이 ${c.v('mag')}배로 적용됩니다.`),
  play: (x) => { const s = x.B.pow(x.p, 'strength'); x.B.attack(x, x.c.v('dmg') + s * (x.c.v('mag') - 1)); } });

def({ id: 'ironWave', name: '강철 파도', en: 'Iron Wave', type: A, rarity: RARITY.COMMON, color: R, cost: 1, target: E,
  dmg: 5, dmgU: 7, blk: 5, blkU: 7,
  text: D((c) => `방어도를 ${c.v('blk')} 얻고 피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => { x.B.gainBlock(x.p, x.c.v('blk'), x.c); x.B.attack(x, x.c.v('dmg')); } });

def({ id: 'perfectedStrike', name: '완벽한 타격', en: 'Perfected Strike', type: A, rarity: RARITY.COMMON, color: R, cost: 2, target: E,
  dmg: 6, mag: 2, magU: 3,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 이름에 "타격"이 들어간 카드 1장당 피해량이 ${c.v('mag')} 증가합니다.`),
  play: (x) => {
    const n = x.B.allCombatCards().filter((k) => k.def.en.includes('Strike')).length;
    x.B.attack(x, x.c.v('dmg') + n * x.c.v('mag'));
  } });

def({ id: 'pommelStrike', name: '손잡이 가격', en: 'Pommel Strike', type: A, rarity: RARITY.COMMON, color: R, cost: 1, target: E,
  dmg: 9, dmgU: 10, mag: 1, magU: 2,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 카드를 ${c.v('mag')}장 뽑습니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.draw(x.c.v('mag')); } });

def({ id: 'shrugItOff', name: '어깨 으쓱', en: 'Shrug It Off', type: S, rarity: RARITY.COMMON, color: R, cost: 1, target: SELF,
  blk: 8, blkU: 11,
  text: D((c) => `방어도를 ${c.v('blk')} 얻고 카드를 1장 뽑습니다.`),
  play: (x) => { x.B.gainBlock(x.p, x.c.v('blk'), x.c); x.B.draw(1); } });

def({ id: 'swordBoomerang', name: '검 부메랑', en: 'Sword Boomerang', type: A, rarity: RARITY.COMMON, color: R, cost: 1, target: NONE,
  dmg: 3, hits: 3, hitsU: 4,
  text: D((c) => `무작위 적에게 피해를 ${c.v('dmg')} 줍니다. ${c.v('hits')}회 반복합니다.`),
  play: (x) => { for (let i = 0; i < x.c.v('hits'); i++) x.B.attackRandom(x, x.c.v('dmg')); } });

def({ id: 'thunderclap', name: '천둥 강타', en: 'Thunderclap', type: A, rarity: RARITY.COMMON, color: R, cost: 1, target: ALL,
  dmg: 4, dmgU: 7, mag: 1,
  text: D((c) => `모든 적에게 피해를 ${c.v('dmg')} 주고 취약을 ${c.v('mag')} 부여합니다.`),
  play: (x) => { x.B.attackAll(x, x.c.v('dmg'), 1, (e) => x.B.addPower(e, 'vulnerable', x.c.v('mag'), x.p)); } });

def({ id: 'trueGrit', name: '진정한 투지', en: 'True Grit', type: S, rarity: RARITY.COMMON, color: R, cost: 1, target: SELF,
  blk: 7, blkU: 9,
  text: D((c) => c.upgraded
    ? `방어도를 ${c.v('blk')} 얻습니다. 손에 있는 카드 1장을 선택해 소각합니다.`
    : `방어도를 ${c.v('blk')} 얻습니다. 손에 있는 무작위 카드 1장을 소각합니다.`),
  play: async (x) => {
    x.B.gainBlock(x.p, x.c.v('blk'), x.c);
    const cand = x.B.hand.filter((h) => h.uid !== x.c.uid);
    if (!cand.length) return;
    if (x.c.upgraded) {
      const [sel] = await x.B.chooseCards(cand, { count: 1, title: '소각할 카드 선택' });
      if (sel) x.B.exhaustFromHand(sel);
    } else x.B.exhaustFromHand(x.B.rng.pick(cand));
  } });

def({ id: 'twinStrike', name: '쌍검 공격', en: 'Twin Strike', type: A, rarity: RARITY.COMMON, color: R, cost: 1, target: E,
  dmg: 5, dmgU: 7, hits: 2,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 2회 반복합니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg'), 2) });

def({ id: 'warcry', name: '전투 함성', en: 'Warcry', type: S, rarity: RARITY.COMMON, color: R, cost: 0, target: NONE,
  mag: 1, magU: 2, exhaust: true,
  text: D((c) => `카드를 ${c.v('mag')}장 뽑고, 손에 있는 카드 1장을 뽑을 카드 더미의 맨 위에 놓습니다.`),
  play: async (x) => {
    x.B.draw(x.c.v('mag'));
    const cand = x.B.hand.filter((h) => h.uid !== x.c.uid);
    if (cand.length) {
      const [sel] = await x.B.chooseCards(cand, { count: 1, title: '뽑을 더미 맨 위로 보낼 카드' });
      if (sel) { x.B.removeFrom(x.B.hand, sel); x.B.drawPile.push(sel); }
    }
  } });

def({ id: 'wildStrike', name: '거친 타격', en: 'Wild Strike', type: A, rarity: RARITY.COMMON, color: R, cost: 1, target: E,
  dmg: 12, dmgU: 17,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 뽑을 카드 더미에 상처 1장을 섞어 넣습니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.addCardToDrawRandom(mk('wound')); } });

// ----------------------------------------------------------------
// 고급(Uncommon) 36종
// ----------------------------------------------------------------
def({ id: 'battleTrance', name: '전투 무아지경', en: 'Battle Trance', type: S, rarity: RARITY.UNCOMMON, color: R, cost: 0, target: SELF,
  mag: 3, magU: 4,
  text: D((c) => `카드를 ${c.v('mag')}장 뽑습니다. 이번 턴에 더 이상 카드를 뽑을 수 없습니다.`),
  play: (x) => { x.B.draw(x.c.v('mag')); x.B.addPower(x.p, 'noDraw', 1, x.p); } });

def({ id: 'bloodForBlood', name: '피에는 피로', en: 'Blood for Blood', type: A, rarity: RARITY.UNCOMMON, color: R, cost: 4, costU: 3, target: E,
  dmg: 18, dmgU: 22,
  text: D((c) => `이번 전투에서 체력을 잃을 때마다 비용이 1 감소합니다. 피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg')) });

def({ id: 'bloodletting', name: '사혈', en: 'Bloodletting', type: S, rarity: RARITY.UNCOMMON, color: R, cost: 0, target: SELF,
  mag: 2, magU: 3,
  text: D((c) => `체력을 3 잃습니다. 에너지를 ${c.v('mag')} 얻습니다.`),
  play: (x) => { x.B.loseHp(x.p, 3, x.c); x.B.gainEnergy(x.c.v('mag')); } });

def({ id: 'burningPact', name: '불타는 서약', en: 'Burning Pact', type: S, rarity: RARITY.UNCOMMON, color: R, cost: 1, target: NONE,
  mag: 2, magU: 3,
  text: D((c) => `손에 있는 카드 1장을 소각하고 카드를 ${c.v('mag')}장 뽑습니다.`),
  play: async (x) => {
    const cand = x.B.hand.filter((h) => h.uid !== x.c.uid);
    if (cand.length) {
      const [sel] = await x.B.chooseCards(cand, { count: 1, title: '소각할 카드 선택' });
      if (sel) x.B.exhaustFromHand(sel);
    }
    x.B.draw(x.c.v('mag'));
  } });

def({ id: 'carnage', name: '대학살', en: 'Carnage', type: A, rarity: RARITY.UNCOMMON, color: R, cost: 2, target: E,
  dmg: 20, dmgU: 28, ethereal: true,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg')) });

def({ id: 'combust', name: '연소', en: 'Combust', type: P, rarity: RARITY.UNCOMMON, color: R, cost: 1, target: SELF,
  mag: 5, magU: 7,
  text: D((c) => `턴이 끝날 때마다 체력을 1 잃고 모든 적에게 피해를 ${c.v('mag')} 줍니다.`),
  play: (x) => x.B.addPower(x.p, 'combust', x.c.v('mag'), x.p) });

def({ id: 'darkEmbrace', name: '어둠의 포옹', en: 'Dark Embrace', type: P, rarity: RARITY.UNCOMMON, color: R, cost: 2, costU: 1, target: SELF,
  text: D(() => `카드가 소각될 때마다 카드를 1장 뽑습니다.`),
  play: (x) => x.B.addPower(x.p, 'darkEmbrace', 1, x.p) });

def({ id: 'disarm', name: '무장 해제', en: 'Disarm', type: S, rarity: RARITY.UNCOMMON, color: R, cost: 1, target: E,
  mag: 2, magU: 3, exhaust: true,
  text: D((c) => `적의 힘을 ${c.v('mag')} 감소시킵니다.`),
  play: (x) => x.B.addPower(x.t, 'strength', -x.c.v('mag'), x.p) });

def({ id: 'dropkick', name: '드롭킥', en: 'Dropkick', type: A, rarity: RARITY.UNCOMMON, color: R, cost: 1, target: E,
  dmg: 5, dmgU: 8,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 대상이 취약 상태라면 에너지를 1 얻고 카드를 1장 뽑습니다.`),
  play: (x) => {
    const vul = x.B.pow(x.t, 'vulnerable') > 0;
    x.B.attack(x, x.c.v('dmg'));
    if (vul) { x.B.gainEnergy(1); x.B.draw(1); }
  } });

def({ id: 'dualWield', name: '쌍수 무기', en: 'Dual Wield', type: S, rarity: RARITY.UNCOMMON, color: R, cost: 1, target: NONE,
  mag: 1, magU: 2,
  text: D((c) => `손에 있는 공격 또는 힘 카드 1장을 선택해 복사본 ${c.v('mag')}장을 손에 넣습니다.`),
  play: async (x) => {
    const cand = x.B.hand.filter((h) => h.uid !== x.c.uid && (h.type === A || h.type === P));
    if (!cand.length) return;
    const [sel] = await x.B.chooseCards(cand, { count: 1, title: '복사할 카드 선택' });
    if (sel) for (let i = 0; i < x.c.v('mag'); i++) x.B.addCardToHand(sel.copy());
  } });

def({ id: 'entrench', name: '참호', en: 'Entrench', type: S, rarity: RARITY.UNCOMMON, color: R, cost: 2, costU: 1, target: SELF,
  text: D(() => `현재 방어도가 2배가 됩니다.`),
  play: (x) => x.B.gainBlock(x.p, x.p.block, x.c, true) });

def({ id: 'evolve', name: '진화', en: 'Evolve', type: P, rarity: RARITY.UNCOMMON, color: R, cost: 1, target: SELF,
  mag: 1, magU: 2,
  text: D((c) => `상태이상 카드를 뽑을 때마다 카드를 ${c.v('mag')}장 뽑습니다.`),
  play: (x) => x.B.addPower(x.p, 'evolve', x.c.v('mag'), x.p) });

def({ id: 'feelNoPain', name: '고통 감지 불가', en: 'Feel No Pain', type: P, rarity: RARITY.UNCOMMON, color: R, cost: 1, target: SELF,
  mag: 3, magU: 4,
  text: D((c) => `카드가 소각될 때마다 방어도를 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.addPower(x.p, 'feelNoPain', x.c.v('mag'), x.p) });

def({ id: 'fireBreathing', name: '화염 숨결', en: 'Fire Breathing', type: P, rarity: RARITY.UNCOMMON, color: R, cost: 1, target: SELF,
  mag: 6, magU: 10,
  text: D((c) => `상태이상 또는 저주 카드를 뽑을 때마다 모든 적에게 피해를 ${c.v('mag')} 줍니다.`),
  play: (x) => x.B.addPower(x.p, 'fireBreathing', x.c.v('mag'), x.p) });

def({ id: 'flameBarrier', name: '화염 방벽', en: 'Flame Barrier', type: S, rarity: RARITY.UNCOMMON, color: R, cost: 2, target: SELF,
  blk: 12, blkU: 16, mag: 4, magU: 6,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다. 이번 턴에 공격을 받으면 공격자에게 피해를 ${c.v('mag')} 줍니다.`),
  play: (x) => { x.B.gainBlock(x.p, x.c.v('blk'), x.c); x.B.addPower(x.p, 'flameBarrier', x.c.v('mag'), x.p); } });

def({ id: 'ghostlyArmor', name: '유령 갑옷', en: 'Ghostly Armor', type: S, rarity: RARITY.UNCOMMON, color: R, cost: 1, target: SELF,
  blk: 10, blkU: 13, ethereal: true,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다.`),
  play: (x) => x.B.gainBlock(x.p, x.c.v('blk'), x.c) });

def({ id: 'hemokinesis', name: '혈액 조종', en: 'Hemokinesis', type: A, rarity: RARITY.UNCOMMON, color: R, cost: 1, target: E,
  dmg: 15, dmgU: 20,
  text: D((c) => `체력을 2 잃습니다. 피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => { x.B.loseHp(x.p, 2, x.c); x.B.attack(x, x.c.v('dmg')); } });

def({ id: 'infernalBlade', name: '지옥의 칼날', en: 'Infernal Blade', type: S, rarity: RARITY.UNCOMMON, color: R, cost: 1, costU: 0, target: NONE,
  exhaust: true,
  text: D(() => `무작위 공격 카드 1장을 손에 넣습니다. 이번 턴 동안 그 카드의 비용이 0이 됩니다.`),
  play: (x) => {
    const card = x.B.randomCardOfType(A);
    if (card) { card.costForTurn = 0; x.B.addCardToHand(card); }
  } });

def({ id: 'inflame', name: '격노', en: 'Inflame', type: P, rarity: RARITY.UNCOMMON, color: R, cost: 1, target: SELF,
  mag: 2, magU: 3,
  text: D((c) => `힘을 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.addPower(x.p, 'strength', x.c.v('mag'), x.p) });

def({ id: 'intimidate', name: '위협', en: 'Intimidate', type: S, rarity: RARITY.UNCOMMON, color: R, cost: 0, target: ALL,
  mag: 1, magU: 2, exhaust: true,
  text: D((c) => `모든 적에게 약화를 ${c.v('mag')} 부여합니다.`),
  play: (x) => x.B.living().forEach((e) => x.B.addPower(e, 'weak', x.c.v('mag'), x.p)) });

def({ id: 'metallicize', name: '금속화', en: 'Metallicize', type: P, rarity: RARITY.UNCOMMON, color: R, cost: 1, target: SELF,
  mag: 3, magU: 4,
  text: D((c) => `턴이 끝날 때마다 방어도를 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.addPower(x.p, 'metallicize', x.c.v('mag'), x.p) });

def({ id: 'powerThrough', name: '힘으로 돌파', en: 'Power Through', type: S, rarity: RARITY.UNCOMMON, color: R, cost: 1, target: SELF,
  blk: 15, blkU: 20,
  text: D((c) => `손에 상처 2장을 넣습니다. 방어도를 ${c.v('blk')} 얻습니다.`),
  play: (x) => { x.B.addCardToHand(mk('wound')); x.B.addCardToHand(mk('wound')); x.B.gainBlock(x.p, x.c.v('blk'), x.c); } });

def({ id: 'pummel', name: '연타', en: 'Pummel', type: A, rarity: RARITY.UNCOMMON, color: R, cost: 1, target: E,
  dmg: 2, hits: 4, hitsU: 5, exhaust: true,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. ${c.v('hits')}회 반복합니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg'), x.c.v('hits')) });

def({ id: 'rage', name: '분노(방어)', en: 'Rage', type: S, rarity: RARITY.UNCOMMON, color: R, cost: 0, target: SELF,
  mag: 3, magU: 5,
  text: D((c) => `이번 턴에 공격 카드를 사용할 때마다 방어도를 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.addPower(x.p, 'rage', x.c.v('mag'), x.p) });

def({ id: 'rampage', name: '광란', en: 'Rampage', type: A, rarity: RARITY.UNCOMMON, color: R, cost: 1, target: E,
  dmg: 8, mag: 5, magU: 8,
  text: D((c) => `피해를 ${c.v('dmg') + c.bonusDmg} 줍니다. 이번 전투 동안 이 카드의 피해량이 ${c.v('mag')} 증가합니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg') + x.c.bonusDmg); x.c.bonusDmg += x.c.v('mag'); } });

def({ id: 'recklessCharge', name: '무모한 돌진', en: 'Reckless Charge', type: A, rarity: RARITY.UNCOMMON, color: R, cost: 0, target: E,
  dmg: 7, dmgU: 10,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 뽑을 카드 더미의 무작위 위치에 현혹 1장을 넣습니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.addCardToDrawRandom(mk('dazed')); } });

def({ id: 'rupture', name: '파열', en: 'Rupture', type: P, rarity: RARITY.UNCOMMON, color: R, cost: 1, target: SELF,
  mag: 1, magU: 2,
  text: D((c) => `카드 때문에 체력을 잃을 때마다 힘을 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.addPower(x.p, 'rupture', x.c.v('mag'), x.p) });

def({ id: 'searingBlow', name: '작열의 일격', en: 'Searing Blow', type: A, rarity: RARITY.UNCOMMON, color: R, cost: 2, target: E,
  infiniteUpgrade: true,
  text: D((c) => { const n = c.upgradeCount; return `피해를 ${4 + (n * (n + 7)) / 2} 줍니다. 여러 번 강화할 수 있습니다.`; }),
  play: (x) => { const n = x.c.upgradeCount; x.B.attack(x, 4 + (n * (n + 7)) / 2); } });

def({ id: 'secondWind', name: '재기', en: 'Second Wind', type: S, rarity: RARITY.UNCOMMON, color: R, cost: 1, target: SELF,
  mag: 5, magU: 7,
  text: D((c) => `손에 있는 공격이 아닌 카드를 모두 소각하고, 소각된 카드 1장당 방어도를 ${c.v('mag')} 얻습니다.`),
  play: (x) => {
    const list = x.B.hand.filter((h) => h.uid !== x.c.uid && h.type !== A);
    list.forEach((h) => { x.B.exhaustFromHand(h); x.B.gainBlock(x.p, x.c.v('mag'), x.c); });
  } });

def({ id: 'seeingRed', name: '붉게 보임', en: 'Seeing Red', type: S, rarity: RARITY.UNCOMMON, color: R, cost: 1, costU: 0, target: SELF,
  exhaust: true,
  text: D(() => `에너지를 2 얻습니다.`),
  play: (x) => x.B.gainEnergy(2) });

def({ id: 'sentinel', name: '파수꾼', en: 'Sentinel', type: S, rarity: RARITY.UNCOMMON, color: R, cost: 1, target: SELF,
  blk: 5, blkU: 8, mag: 2, magU: 3,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다. 이 카드가 소각되면 에너지를 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.gainBlock(x.p, x.c.v('blk'), x.c),
  onExhaust: (B, c) => B.gainEnergy(c.v('mag')) });

def({ id: 'severSoul', name: '영혼 절단', en: 'Sever Soul', type: A, rarity: RARITY.UNCOMMON, color: R, cost: 2, target: E,
  dmg: 16, dmgU: 22,
  text: D((c) => `손에 있는 공격이 아닌 카드를 모두 소각합니다. 피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => {
    x.B.hand.filter((h) => h.uid !== x.c.uid && h.type !== A).forEach((h) => x.B.exhaustFromHand(h));
    x.B.attack(x, x.c.v('dmg'));
  } });

def({ id: 'shockwave', name: '충격파', en: 'Shockwave', type: S, rarity: RARITY.UNCOMMON, color: R, cost: 2, target: ALL,
  mag: 3, magU: 5, exhaust: true,
  text: D((c) => `모든 적에게 약화와 취약을 ${c.v('mag')} 부여합니다.`),
  play: (x) => x.B.living().forEach((e) => {
    x.B.addPower(e, 'weak', x.c.v('mag'), x.p);
    x.B.addPower(e, 'vulnerable', x.c.v('mag'), x.p);
  }) });

def({ id: 'spotWeakness', name: '약점 포착', en: 'Spot Weakness', type: S, rarity: RARITY.UNCOMMON, color: R, cost: 1, target: E,
  mag: 3, magU: 4,
  text: D((c) => `대상이 공격할 예정이라면 힘을 ${c.v('mag')} 얻습니다.`),
  play: (x) => { if (x.t && x.B.isAttackIntent(x.t)) x.B.addPower(x.p, 'strength', x.c.v('mag'), x.p); } });

def({ id: 'uppercut', name: '어퍼컷', en: 'Uppercut', type: A, rarity: RARITY.UNCOMMON, color: R, cost: 2, target: E,
  dmg: 13, mag: 1, magU: 2,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 약화를 ${c.v('mag')}, 취약을 ${c.v('mag')} 부여합니다.`),
  play: (x) => {
    x.B.attack(x, x.c.v('dmg'));
    x.B.addPower(x.t, 'weak', x.c.v('mag'), x.p);
    x.B.addPower(x.t, 'vulnerable', x.c.v('mag'), x.p);
  } });

def({ id: 'whirlwind', name: '회오리바람', en: 'Whirlwind', type: A, rarity: RARITY.UNCOMMON, color: R, cost: -1, target: ALL,
  dmg: 5, dmgU: 8,
  text: D((c) => `모든 적에게 피해를 ${c.v('dmg')} 줍니다. X회 반복합니다.`),
  play: (x) => { for (let i = 0; i < x.x; i++) x.B.attackAll(x, x.c.v('dmg')); } });

// ----------------------------------------------------------------
// 희귀(Rare) 16종
// ----------------------------------------------------------------
def({ id: 'barricade', name: '바리케이드', en: 'Barricade', type: P, rarity: RARITY.RARE, color: R, cost: 3, costU: 2, target: SELF,
  text: D(() => `턴이 끝나도 방어도가 사라지지 않습니다.`),
  play: (x) => x.B.addPower(x.p, 'barricade', 1, x.p) });

def({ id: 'berserk', name: '광포화', en: 'Berserk', type: P, rarity: RARITY.RARE, color: R, cost: 0, target: SELF,
  mag: 2, magU: 1,
  text: D((c) => `취약을 ${c.v('mag')} 얻습니다. 턴이 시작될 때마다 에너지를 1 추가로 얻습니다.`),
  play: (x) => { x.B.addPower(x.p, 'vulnerable', x.c.v('mag'), x.p); x.B.addPower(x.p, 'berserk', 1, x.p); } });

def({ id: 'bludgeon', name: '몽둥이질', en: 'Bludgeon', type: A, rarity: RARITY.RARE, color: R, cost: 3, target: E,
  dmg: 32, dmgU: 42,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg')) });

def({ id: 'brutality', name: '잔혹', en: 'Brutality', type: P, rarity: RARITY.RARE, color: R, cost: 0, target: SELF,
  innateU: true,
  text: D(() => `턴이 시작될 때마다 체력을 1 잃고 카드를 1장 뽑습니다.`),
  play: (x) => x.B.addPower(x.p, 'brutality', 1, x.p) });

def({ id: 'corruption', name: '타락', en: 'Corruption', type: P, rarity: RARITY.RARE, color: R, cost: 3, costU: 2, target: SELF,
  text: D(() => `기술 카드의 비용이 0이 됩니다. 사용한 기술 카드는 소각됩니다.`),
  play: (x) => x.B.addPower(x.p, 'corruption', 1, x.p) });

def({ id: 'demonForm', name: '악마의 형상', en: 'Demon Form', type: P, rarity: RARITY.RARE, color: R, cost: 3, target: SELF,
  mag: 2, magU: 3,
  text: D((c) => `턴이 시작될 때마다 힘을 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.addPower(x.p, 'demonForm', x.c.v('mag'), x.p) });

def({ id: 'doubleTap', name: '연속 공격', en: 'Double Tap', type: S, rarity: RARITY.RARE, color: R, cost: 1, target: SELF,
  mag: 1, magU: 2,
  text: D((c) => `이번 턴에 사용하는 공격 카드 ${c.v('mag')}장이 두 번 사용됩니다.`),
  play: (x) => x.B.addPower(x.p, 'doubleTap', x.c.v('mag'), x.p) });

def({ id: 'exhume', name: '파헤치기', en: 'Exhume', type: S, rarity: RARITY.RARE, color: R, cost: 1, costU: 0, target: NONE,
  exhaust: true,
  text: D(() => `소각한 카드 1장을 손에 넣습니다.`),
  play: async (x) => {
    const cand = x.B.exhaustPile.filter((h) => h.uid !== x.c.uid);
    if (!cand.length) return;
    const [sel] = await x.B.chooseCards(cand, { count: 1, title: '되살릴 카드 선택' });
    if (sel) { x.B.removeFrom(x.B.exhaustPile, sel); x.B.addCardToHand(sel); }
  } });

def({ id: 'feed', name: '포식', en: 'Feed', type: A, rarity: RARITY.RARE, color: R, cost: 1, target: E,
  dmg: 10, dmgU: 12, mag: 3, magU: 4, exhaust: true,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 이 피해로 적이 죽으면 최대 체력이 ${c.v('mag')} 증가합니다.`),
  play: (x) => {
    const t = x.t;
    const before = t && t.alive;
    x.B.attack(x, x.c.v('dmg'));
    if (before && t && !t.alive && !t.isMinion) x.B.gainMaxHp(x.c.v('mag'));
  } });

def({ id: 'fiendFire', name: '악마 불꽃', en: 'Fiend Fire', type: A, rarity: RARITY.RARE, color: R, cost: 2, target: E,
  dmg: 7, dmgU: 10, exhaust: true,
  text: D((c) => `손에 있는 카드를 모두 소각합니다. 소각된 카드 1장당 피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => {
    const list = x.B.hand.filter((h) => h.uid !== x.c.uid);
    list.forEach((h) => x.B.exhaustFromHand(h));
    for (let i = 0; i < list.length; i++) x.B.attack(x, x.c.v('dmg'));
  } });

def({ id: 'immolate', name: '불사르기', en: 'Immolate', type: A, rarity: RARITY.RARE, color: R, cost: 2, target: ALL,
  dmg: 21, dmgU: 28,
  text: D((c) => `모든 적에게 피해를 ${c.v('dmg')} 줍니다. 버린 카드 더미에 화상 1장을 넣습니다.`),
  play: (x) => { x.B.attackAll(x, x.c.v('dmg')); x.B.addCardToDiscard(mk('burn')); } });

def({ id: 'impervious', name: '무적', en: 'Impervious', type: S, rarity: RARITY.RARE, color: R, cost: 2, target: SELF,
  blk: 30, blkU: 40, exhaust: true,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다.`),
  play: (x) => x.B.gainBlock(x.p, x.c.v('blk'), x.c) });

def({ id: 'juggernaut', name: '파쇄차', en: 'Juggernaut', type: P, rarity: RARITY.RARE, color: R, cost: 2, target: SELF,
  mag: 5, magU: 7,
  text: D((c) => `방어도를 얻을 때마다 무작위 적에게 피해를 ${c.v('mag')} 줍니다.`),
  play: (x) => x.B.addPower(x.p, 'juggernaut', x.c.v('mag'), x.p) });

def({ id: 'limitBreak', name: '한계 돌파', en: 'Limit Break', type: S, rarity: RARITY.RARE, color: R, cost: 1, target: SELF,
  exhaust: true, exhaustU: false,
  text: D(() => `현재 힘이 2배가 됩니다.`),
  play: (x) => { const s = x.B.pow(x.p, 'strength'); if (s !== 0) x.B.addPower(x.p, 'strength', s, x.p); } });

def({ id: 'offering', name: '제물', en: 'Offering', type: S, rarity: RARITY.RARE, color: R, cost: 0, target: SELF,
  mag: 3, magU: 5, exhaust: true,
  text: D((c) => `체력을 6 잃습니다. 에너지를 2 얻고 카드를 ${c.v('mag')}장 뽑습니다.`),
  play: (x) => { x.B.loseHp(x.p, 6, x.c); x.B.gainEnergy(2); x.B.draw(x.c.v('mag')); } });

def({ id: 'reaper', name: '사신', en: 'Reaper', type: A, rarity: RARITY.RARE, color: R, cost: 2, target: ALL,
  dmg: 4, dmgU: 5, exhaust: true,
  text: D((c) => `모든 적에게 피해를 ${c.v('dmg')} 줍니다. 이 카드로 준 피해량만큼 체력을 회복합니다.`),
  play: (x) => {
    let total = 0;
    x.B.attackAll(x, x.c.v('dmg'), 1, null, (dealt) => { total += dealt; });
    if (total > 0) x.B.heal(x.p, total);
  } });
