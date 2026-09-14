// ============================================================
//  디펙트 카드 75종 — 구체(Orb) 시스템
// ============================================================
import { def, TYPE, TARGET, RARITY, COLOR, mk } from './carddb.js';

const B_ = COLOR.BLUE;
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

// ---------------- 기본 ----------------
def({ id: 'strike_b', name: '타격', en: 'Strike', type: A, rarity: RARITY.BASIC, color: B_, cost: 1, target: E,
  dmg: 6, dmgU: 9, noPool: true,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => x.B.attack(x, x.c.v('dmg')) });

def({ id: 'defend_b', name: '방어', en: 'Defend', type: S, rarity: RARITY.BASIC, color: B_, cost: 1, target: SELF,
  blk: 5, blkU: 8, noPool: true,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다.`),
  play: (x) => x.B.gainBlock(x.p, x.c.v('blk'), x.c) });

def({ id: 'zap', name: '전기 충격', en: 'Zap', type: S, rarity: RARITY.BASIC, color: B_, cost: 1, costU: 0, target: NONE,
  noPool: true,
  text: D(() => `번개 구체를 1개 충전합니다.`),
  play: (x) => x.B.channel('lightning') });

def({ id: 'dualcast', name: '이중 시전', en: 'Dualcast', type: S, rarity: RARITY.BASIC, color: B_, cost: 1, costU: 0, target: NONE,
  noPool: true,
  text: D(() => `가장 앞의 구체를 2번 발동합니다.`),
  play: (x) => x.B.evokeFront(2) });

// ---------------- 일반 18 ----------------
def({ id: 'ballLightning', name: '볼 라이트닝', en: 'Ball Lightning', type: A, rarity: RARITY.COMMON, color: B_, cost: 1, target: E,
  dmg: 7, dmgU: 10,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 번개 구체를 1개 충전합니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.channel('lightning'); } });

def({ id: 'barrage', name: '연사', en: 'Barrage', type: A, rarity: RARITY.COMMON, color: B_, cost: 1, target: E,
  dmg: 4, dmgU: 6,
  text: D((c) => `보유한 구체 1개당 피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => { for (let i = 0; i < x.B.orbs.length; i++) x.B.attack(x, x.c.v('dmg')); } });

def({ id: 'beamCell', name: '광선 세포', en: 'Beam Cell', type: A, rarity: RARITY.COMMON, color: B_, cost: 0, target: E,
  dmg: 3, dmgU: 4, mag: 1, magU: 2,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 취약을 ${c.v('mag')} 부여합니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.addPower(x.t, 'vulnerable', x.c.v('mag'), x.p); } });

def({ id: 'chargeBattery', name: '배터리 충전', en: 'Charge Battery', type: S, rarity: RARITY.COMMON, color: B_, cost: 1, target: SELF,
  blk: 7, blkU: 10,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다. 다음 턴에 에너지를 1 얻습니다.`),
  play: (x) => { x.B.gainBlock(x.p, x.c.v('blk'), x.c); x.B.addPower(x.p, 'nextTurnEnergy', 1, x.p); } });

def({ id: 'claw', name: '발톱', en: 'Claw', type: A, rarity: RARITY.COMMON, color: B_, cost: 0, target: E,
  dmg: 3, dmgU: 5,
  text: D((c) => `피해를 ${c.v('dmg') + c.bonusDmg} 줍니다. 이번 전투 동안 모든 발톱의 피해량이 2 증가합니다.`),
  play: (x) => {
    x.B.attack(x, x.c.v('dmg') + x.c.bonusDmg);
    x.B.allCombatCards().forEach((k) => { if (k.id === 'claw') k.bonusDmg += 2; });
    x.c.bonusDmg += 2;
  } });

def({ id: 'coldSnap', name: '한파', en: 'Cold Snap', type: A, rarity: RARITY.COMMON, color: B_, cost: 1, target: E,
  dmg: 6, dmgU: 9,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 냉기 구체를 1개 충전합니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.channel('frost'); } });

def({ id: 'compileDriver', name: '컴파일 드라이버', en: 'Compile Driver', type: A, rarity: RARITY.COMMON, color: B_, cost: 1, target: E,
  dmg: 7, dmgU: 10,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 보유한 구체의 종류 수만큼 카드를 뽑습니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.draw(new Set(x.B.orbs.map((o) => o.type)).size); } });

def({ id: 'coolheaded', name: '냉정', en: 'Coolheaded', type: S, rarity: RARITY.COMMON, color: B_, cost: 1, target: NONE,
  mag: 1, magU: 2,
  text: D((c) => `냉기 구체를 1개 충전하고 카드를 ${c.v('mag')}장 뽑습니다.`),
  play: (x) => { x.B.channel('frost'); x.B.draw(x.c.v('mag')); } });

def({ id: 'goForTheEyes', name: '눈을 노려라', en: 'Go for the Eyes', type: A, rarity: RARITY.COMMON, color: B_, cost: 0, target: E,
  dmg: 3, dmgU: 4, mag: 1, magU: 2,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 대상이 공격할 예정이라면 약화를 ${c.v('mag')} 부여합니다.`),
  play: (x) => { const atk = x.t && x.B.isAttackIntent(x.t); x.B.attack(x, x.c.v('dmg')); if (atk) x.B.addPower(x.t, 'weak', x.c.v('mag'), x.p); } });

def({ id: 'hologram', name: '홀로그램', en: 'Hologram', type: S, rarity: RARITY.COMMON, color: B_, cost: 1, costU: 0, target: SELF,
  blk: 3, exhaust: true, exhaustU: false,
  text: D((c) => `방어도를 ${c.v('blk')} 얻고 버린 카드 더미에서 카드 1장을 손에 넣습니다.`),
  play: async (x) => {
    x.B.gainBlock(x.p, x.c.v('blk'), x.c);
    if (!x.B.discardPile.length) return;
    const [s] = await x.B.chooseCards(x.B.discardPile.slice(), { count: 1, title: '가져올 카드' });
    if (s) { x.B.removeFrom(x.B.discardPile, s); x.B.addCardToHand(s); }
  } });

def({ id: 'leap', name: '도약', en: 'Leap', type: S, rarity: RARITY.COMMON, color: B_, cost: 1, target: SELF,
  blk: 9, blkU: 12,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다.`),
  play: (x) => x.B.gainBlock(x.p, x.c.v('blk'), x.c) });

def({ id: 'rebound', name: '반동', en: 'Rebound', type: A, rarity: RARITY.COMMON, color: B_, cost: 1, target: E,
  dmg: 9, dmgU: 12,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 다음에 사용하는 카드를 뽑을 더미 맨 위에 놓습니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.reboundNext = true; } });

def({ id: 'recursion', name: '재귀', en: 'Recursion', type: S, rarity: RARITY.COMMON, color: B_, cost: 1, costU: 0, target: NONE,
  text: D(() => `가장 앞의 구체를 발동한 뒤 다시 충전합니다.`),
  play: (x) => { const o = x.B.orbs[0]; if (!o) return; const t = o.type; x.B.evokeFront(1); x.B.channel(t); } });

def({ id: 'stack', name: '스택', en: 'Stack', type: S, rarity: RARITY.COMMON, color: B_, cost: 1, target: SELF,
  mag: 0, magU: 3,
  text: D((c) => `버린 카드 더미의 카드 수만큼 방어도를 얻습니다.${c.upgraded ? ' (+3)' : ''}`),
  play: (x) => x.B.gainBlock(x.p, x.B.discardPile.length + (x.c.upgraded ? 3 : 0), x.c) });

def({ id: 'steamBarrier', name: '증기 방벽', en: 'Steam Barrier', type: S, rarity: RARITY.COMMON, color: B_, cost: 0, target: SELF,
  blk: 6, blkU: 8,
  text: D((c) => `방어도를 ${Math.max(0, c.v('blk') + c.bonusDmg)} 얻습니다. 사용할 때마다 수치가 1 감소합니다.`),
  play: (x) => { x.B.gainBlock(x.p, Math.max(0, x.c.v('blk') + x.c.bonusDmg), x.c); x.c.bonusDmg -= 1; } });

def({ id: 'streamline', name: '능률화', en: 'Streamline', type: A, rarity: RARITY.COMMON, color: B_, cost: 2, target: E,
  dmg: 15, dmgU: 20,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 사용할 때마다 비용이 1 감소합니다.`),
  play: (x) => {
    x.B.attack(x, x.c.v('dmg'));
    const cur = x.c.costOverride === null ? x.c.baseCost : x.c.costOverride;
    if (cur > 0) x.c.costOverride = cur - 1;
  } });

def({ id: 'sweepingBeam', name: '휩쓰는 광선', en: 'Sweeping Beam', type: A, rarity: RARITY.COMMON, color: B_, cost: 1, target: ALL,
  dmg: 6, dmgU: 9,
  text: D((c) => `모든 적에게 피해를 ${c.v('dmg')} 주고 카드를 1장 뽑습니다.`),
  play: (x) => { x.B.attackAll(x, x.c.v('dmg')); x.B.draw(1); } });

def({ id: 'turbo', name: '터보', en: 'Turbo', type: S, rarity: RARITY.COMMON, color: B_, cost: 0, target: NONE,
  mag: 2, magU: 3,
  text: D((c) => `에너지를 ${c.v('mag')} 얻습니다. 버린 카드 더미에 공허 1장을 넣습니다.`),
  play: (x) => { x.B.gainEnergy(x.c.v('mag')); x.B.addCardToDiscard(mk('void')); } });

// ---------------- 고급 36 ----------------
def({ id: 'aggregate', name: '집계', en: 'Aggregate', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: NONE,
  mag: 4, magU: 3,
  text: D((c) => `뽑을 카드 더미의 카드 ${c.v('mag')}장당 에너지를 1 얻습니다.`),
  play: (x) => x.B.gainEnergy(Math.floor(x.B.drawPile.length / x.c.v('mag'))) });

def({ id: 'autoShields', name: '자동 방패', en: 'Auto-Shields', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: SELF,
  blk: 11, blkU: 15,
  text: D((c) => `방어도가 0이라면 방어도를 ${c.v('blk')} 얻습니다.`),
  play: (x) => { if (x.p.block === 0) x.B.gainBlock(x.p, x.c.v('blk'), x.c); } });

def({ id: 'blizzard', name: '눈보라', en: 'Blizzard', type: A, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: ALL,
  dmg: 2, dmgU: 3,
  text: D((c) => `이번 전투에서 충전한 냉기 구체 1개당 모든 적에게 피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => { const n = x.B.channeledCount.frost || 0; for (let i = 0; i < n; i++) x.B.attackAll(x, x.c.v('dmg')); } });

def({ id: 'bootSequence', name: '부팅 절차', en: 'Boot Sequence', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: 0, target: SELF,
  blk: 10, blkU: 13, innate: true, exhaust: true,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다.`),
  play: (x) => x.B.gainBlock(x.p, x.c.v('blk'), x.c) });

def({ id: 'bullseye', name: '정조준', en: 'Bullseye', type: A, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: E,
  dmg: 8, dmgU: 11, mag: 2, magU: 3,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 조준을 ${c.v('mag')} 부여합니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.addPower(x.t, 'lockOn', x.c.v('mag'), x.p); } });

def({ id: 'capacitor', name: '축전기', en: 'Capacitor', type: P, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: SELF,
  mag: 2, magU: 3,
  text: D((c) => `구체 슬롯이 ${c.v('mag')} 증가합니다.`),
  play: (x) => { x.B.orbSlots += x.c.v('mag'); x.B.render(); } });

def({ id: 'chaos', name: '혼돈', en: 'Chaos', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: NONE,
  mag: 1, magU: 2,
  text: D((c) => `무작위 구체를 ${c.v('mag')}개 충전합니다.`),
  play: (x) => { for (let i = 0; i < x.c.v('mag'); i++) x.B.channel(x.B.rng.pick(['lightning', 'frost', 'dark', 'plasma'])); } });

def({ id: 'chill', name: '오한', en: 'Chill', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: 0, target: NONE,
  exhaust: true, exhaustU: false,
  text: D(() => `적 1체당 냉기 구체를 1개 충전합니다.`),
  play: (x) => x.B.channel('frost', x.B.living().length) });

def({ id: 'consume', name: '흡수', en: 'Consume', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: 2, target: SELF,
  mag: 2, magU: 3,
  text: D((c) => `집중을 ${c.v('mag')} 얻습니다. 구체 슬롯이 1 감소합니다.`),
  play: (x) => { x.B.addPower(x.p, 'focus', x.c.v('mag'), x.p); x.B.orbSlots = Math.max(0, x.B.orbSlots - 1); if (x.B.orbs.length > x.B.orbSlots) x.B.evokeFront(1); } });

def({ id: 'darkness', name: '어둠', en: 'Darkness', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: NONE,
  text: D((c) => `암흑 구체를 1개 충전합니다.${c.upgraded ? ' 모든 암흑 구체의 패시브를 발동합니다.' : ''}`),
  play: (x) => {
    x.B.channel('dark');
    if (x.c.upgraded) x.B.orbs.filter((o) => o.type === 'dark').forEach((o) => x.B.orbEffect(o, false));
  } });

def({ id: 'defragment', name: '조각 모음', en: 'Defragment', type: P, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: SELF,
  mag: 1, magU: 2,
  text: D((c) => `집중을 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.addPower(x.p, 'focus', x.c.v('mag'), x.p) });

def({ id: 'doomAndGloom', name: '파멸과 우울', en: 'Doom and Gloom', type: A, rarity: RARITY.UNCOMMON, color: B_, cost: 2, target: ALL,
  dmg: 10, dmgU: 14,
  text: D((c) => `모든 적에게 피해를 ${c.v('dmg')} 주고 암흑 구체를 1개 충전합니다.`),
  play: (x) => { x.B.attackAll(x, x.c.v('dmg')); x.B.channel('dark'); } });

def({ id: 'doubleEnergy', name: '이중 에너지', en: 'Double Energy', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: 1, costU: 0, target: NONE,
  exhaust: true,
  text: D(() => `현재 에너지가 2배가 됩니다.`),
  play: (x) => x.B.gainEnergy(x.B.energy) });

def({ id: 'equilibrium', name: '평형', en: 'Equilibrium', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: 2, target: SELF,
  blk: 13, blkU: 17,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다. 이번 턴에 손에 있는 카드를 버리지 않습니다.`),
  play: (x) => { x.B.gainBlock(x.p, x.c.v('blk'), x.c); x.B.hand.forEach((h) => { h.retainOnce = true; }); } });

def({ id: 'ftl', name: '초광속', en: 'FTL', type: A, rarity: RARITY.UNCOMMON, color: B_, cost: 0, target: E,
  dmg: 5, dmgU: 6, mag: 3, magU: 4,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 이번 턴에 카드를 ${c.v('mag')}장 미만 사용했다면 카드를 1장 뽑습니다.`),
  play: (x) => { const n = x.B.cardsPlayedThisTurn; x.B.attack(x, x.c.v('dmg')); if (n < x.c.v('mag')) x.B.draw(1); } });

def({ id: 'forceField', name: '역장', en: 'Force Field', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: 4, target: SELF,
  blk: 12, blkU: 16,
  text: D((c) => `이번 전투에서 사용한 힘 카드 1장당 비용이 1 감소합니다. 방어도를 ${c.v('blk')} 얻습니다.`),
  play: (x) => x.B.gainBlock(x.p, x.c.v('blk'), x.c) });

def({ id: 'fusion', name: '융합', en: 'Fusion', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: 2, costU: 1, target: NONE,
  text: D(() => `플라즈마 구체를 1개 충전합니다.`),
  play: (x) => x.B.channel('plasma') });

def({ id: 'geneticAlgorithm', name: '유전 알고리즘', en: 'Genetic Algorithm', type: A, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: E,
  dmg: 1, mag: 2, magU: 3, exhaust: true,
  text: D((c) => `피해를 ${c.v('dmg') + c.bonusDmg} 줍니다. 이 카드의 피해량이 영구히 ${c.v('mag')} 증가합니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg') + x.c.bonusDmg); x.c.bonusDmg += x.c.v('mag'); x.B.permanentBonus(x.c); } });

def({ id: 'glacier', name: '빙하', en: 'Glacier', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: 2, target: SELF,
  blk: 7, blkU: 10,
  text: D((c) => `방어도를 ${c.v('blk')} 얻고 냉기 구체를 2개 충전합니다.`),
  play: (x) => { x.B.gainBlock(x.p, x.c.v('blk'), x.c); x.B.channel('frost', 2); } });

def({ id: 'heatsinks', name: '방열판', en: 'Heatsinks', type: P, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: SELF,
  mag: 1, magU: 2,
  text: D((c) => `힘 카드를 사용할 때마다 카드를 ${c.v('mag')}장 뽑습니다.`),
  play: (x) => x.B.addPower(x.p, 'heatsinks', x.c.v('mag'), x.p) });

def({ id: 'helloWorldCard', name: '헬로 월드', en: 'Hello World', type: P, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: SELF,
  mag: 1, magU: 2,
  text: D((c) => `턴이 시작될 때마다 무작위 일반 카드 ${c.v('mag')}장을 손에 넣습니다.`),
  play: (x) => x.B.addPower(x.p, 'helloWorld', x.c.v('mag'), x.p) });

def({ id: 'loopCard', name: '순환', en: 'Loop', type: P, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: SELF,
  mag: 1, magU: 2,
  text: D((c) => `턴이 시작될 때마다 가장 앞의 구체 패시브가 ${c.v('mag')}번 추가로 발동합니다.`),
  play: (x) => x.B.addPower(x.p, 'loop', x.c.v('mag'), x.p) });

def({ id: 'melter', name: '용해기', en: 'Melter', type: A, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: E,
  dmg: 10, dmgU: 14,
  text: D((c) => `대상의 방어도를 모두 제거하고 피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => { if (x.t) x.t.block = 0; x.B.attack(x, x.c.v('dmg')); } });

def({ id: 'overclock', name: '오버클럭', en: 'Overclock', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: 0, target: NONE,
  mag: 2, magU: 3,
  text: D((c) => `카드를 ${c.v('mag')}장 뽑습니다. 버린 카드 더미에 화상 1장을 넣습니다.`),
  play: (x) => { x.B.draw(x.c.v('mag')); x.B.addCardToDiscard(mk('burn')); } });

def({ id: 'recycle', name: '재활용', en: 'Recycle', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: 1, costU: 0, target: NONE,
  text: D(() => `손에 있는 카드 1장을 소각하고 그 카드의 비용만큼 에너지를 얻습니다.`),
  play: async (x) => {
    const cand = x.B.hand.filter((h) => h.uid !== x.c.uid);
    if (!cand.length) return;
    const [s] = await x.B.chooseCards(cand, { count: 1, title: '소각할 카드' });
    if (!s) return;
    const cost = s.isXCost ? x.B.energy : Math.max(0, s.cost);
    x.B.exhaustFromHand(s);
    x.B.gainEnergy(cost);
  } });

def({ id: 'reinforcedBody', name: '강화된 몸', en: 'Reinforced Body', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: -1, target: SELF,
  blk: 7, blkU: 9,
  text: D((c) => `방어도를 ${c.v('blk')} 얻습니다. X회 반복합니다.`),
  play: (x) => { for (let i = 0; i < x.x; i++) x.B.gainBlock(x.p, x.c.v('blk'), x.c); } });

def({ id: 'reprogram', name: '재프로그래밍', en: 'Reprogram', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: SELF,
  mag: 1, magU: 2,
  text: D((c) => `집중이 ${c.v('mag')} 감소하고 힘과 민첩을 ${c.v('mag')} 얻습니다.`),
  play: (x) => {
    x.B.addPower(x.p, 'focus', -x.c.v('mag'), x.p);
    x.B.addPower(x.p, 'strength', x.c.v('mag'), x.p);
    x.B.addPower(x.p, 'dexterity', x.c.v('mag'), x.p);
  } });

def({ id: 'ripAndTear', name: '찢고 가르기', en: 'Rip and Tear', type: A, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: NONE,
  dmg: 7, dmgU: 9, hits: 2,
  text: D((c) => `무작위 적에게 피해를 ${c.v('dmg')} 줍니다. 2회 반복합니다.`),
  play: (x) => { for (let i = 0; i < 2; i++) x.B.attackRandom(x, x.c.v('dmg')); } });

def({ id: 'scrapeCard', name: '긁어모으기', en: 'Scrape', type: A, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: E,
  dmg: 7, dmgU: 10, mag: 4, magU: 5,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 카드를 ${c.v('mag')}장 뽑고, 뽑은 카드 중 비용이 0이 아닌 카드를 모두 버립니다.`),
  play: (x) => {
    x.B.attack(x, x.c.v('dmg'));
    const before = x.B.hand.map((h) => h.uid);
    x.B.draw(x.c.v('mag'));
    x.B.hand.filter((h) => !before.includes(h.uid) && h.cost !== 0).forEach((h) => x.B.discardFromHand(h));
  } });

def({ id: 'selfRepair', name: '자가 수리', en: 'Self Repair', type: P, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: SELF,
  mag: 7, magU: 10,
  text: D((c) => `전투가 끝나면 체력을 ${c.v('mag')} 회복합니다.`),
  play: (x) => { x.B.selfRepair = (x.B.selfRepair || 0) + x.c.v('mag'); x.B.addPower(x.p, 'regenPlayer', 0, x.p, true); } });

def({ id: 'skim', name: '훑어보기', en: 'Skim', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: NONE,
  mag: 3, magU: 4,
  text: D((c) => `카드를 ${c.v('mag')}장 뽑습니다.`),
  play: (x) => x.B.draw(x.c.v('mag')) });

def({ id: 'staticDischargeCard', name: '정전기 방전', en: 'Static Discharge', type: P, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: SELF,
  mag: 1, magU: 2,
  text: D((c) => `공격 피해를 받을 때마다 번개 구체를 ${c.v('mag')}개 충전합니다.`),
  play: (x) => x.B.addPower(x.p, 'staticDischarge', x.c.v('mag'), x.p) });

def({ id: 'stormCard', name: '폭풍', en: 'Storm', type: P, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: SELF,
  mag: 1,
  text: D((c) => `힘 카드를 사용할 때마다 번개 구체를 1개 충전합니다.`),
  play: (x) => x.B.addPower(x.p, 'storm', 1, x.p) });

def({ id: 'sunder', name: '분쇄', en: 'Sunder', type: A, rarity: RARITY.UNCOMMON, color: B_, cost: 3, costU: 2, target: E,
  dmg: 24, dmgU: 32,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 이 피해로 적이 죽으면 에너지를 3 얻습니다.`),
  play: (x) => { const t = x.t, alive = t && t.alive; x.B.attack(x, x.c.v('dmg')); if (alive && t && !t.alive) x.B.gainEnergy(3); } });

def({ id: 'tempest', name: '폭풍우', en: 'Tempest', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: -1, target: NONE,
  exhaust: true,
  text: D((c) => `번개 구체를 X${c.upgraded ? '+1' : ''}개 충전합니다.`),
  play: (x) => x.B.channel('lightning', x.x + (x.c.upgraded ? 1 : 0)) });

def({ id: 'whiteNoise', name: '백색 소음', en: 'White Noise', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: 1, costU: 0, target: NONE,
  exhaust: true,
  text: D(() => `무작위 힘 카드 1장을 손에 넣습니다. 이번 턴 그 카드의 비용은 0입니다.`),
  play: (x) => { const c = x.B.randomCardOfType(P); if (c) { c.costForTurn = 0; x.B.addCardToHand(c); } } });

def({ id: 'lockOnCard', name: '조준', en: 'Lock On', type: S, rarity: RARITY.UNCOMMON, color: B_, cost: 1, target: E,
  mag: 3, magU: 4,
  text: D((c) => `적에게 조준을 ${c.v('mag')} 부여합니다.`),
  play: (x) => x.B.addPower(x.t, 'lockOn', x.c.v('mag'), x.p) });

// ---------------- 희귀 17 ----------------
def({ id: 'allForOne', name: '모두를 위한 하나', en: 'All for One', type: A, rarity: RARITY.RARE, color: B_, cost: 2, target: E,
  dmg: 10, dmgU: 14,
  text: D((c) => `피해를 ${c.v('dmg')} 줍니다. 버린 카드 더미의 비용 0 카드를 모두 손에 넣습니다.`),
  play: (x) => {
    x.B.attack(x, x.c.v('dmg'));
    x.B.discardPile.filter((h) => h.cost === 0).slice(0, 10 - x.B.hand.length).forEach((h) => {
      x.B.removeFrom(x.B.discardPile, h); x.B.addCardToHand(h);
    });
  } });

def({ id: 'amplifyCard', name: '증폭', en: 'Amplify', type: S, rarity: RARITY.RARE, color: B_, cost: 1, target: SELF,
  mag: 1, magU: 2,
  text: D((c) => `이번 턴에 사용하는 힘 카드 ${c.v('mag')}장이 두 번 사용됩니다.`),
  play: (x) => x.B.addPower(x.p, 'amplify', x.c.v('mag'), x.p) });

def({ id: 'biasedCognition', name: '편향된 인식', en: 'Biased Cognition', type: P, rarity: RARITY.RARE, color: B_, cost: 1, target: SELF,
  mag: 4, magU: 5,
  text: D((c) => `집중을 ${c.v('mag')} 얻습니다. 턴이 시작될 때마다 집중이 1 감소합니다.`),
  play: (x) => { x.B.addPower(x.p, 'focus', x.c.v('mag'), x.p); x.B.addPower(x.p, 'biasedCognition', 1, x.p); } });

def({ id: 'bufferCard', name: '완충', en: 'Buffer', type: P, rarity: RARITY.RARE, color: B_, cost: 2, target: SELF,
  mag: 1, magU: 2,
  text: D((c) => `완충을 ${c.v('mag')} 얻습니다.`),
  play: (x) => x.B.addPower(x.p, 'buffer', x.c.v('mag'), x.p) });

def({ id: 'coreSurge', name: '핵심 급증', en: 'Core Surge', type: A, rarity: RARITY.RARE, color: B_, cost: 1, target: E,
  dmg: 11, dmgU: 15, exhaust: true,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 인공물을 1 얻습니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.addPower(x.p, 'artifact', 1, x.p); } });

def({ id: 'creativeAICard', name: '창조적 AI', en: 'Creative AI', type: P, rarity: RARITY.RARE, color: B_, cost: 3, costU: 2, target: SELF,
  text: D(() => `턴이 시작될 때마다 무작위 힘 카드 1장을 손에 넣습니다.`),
  play: (x) => x.B.addPower(x.p, 'creativeAI', 1, x.p) });

def({ id: 'echoForm', name: '메아리 형상', en: 'Echo Form', type: P, rarity: RARITY.RARE, color: B_, cost: 3, target: SELF,
  ethereal: true, etherealU: false,
  text: D(() => `매 턴 처음 사용하는 카드가 두 번 사용됩니다.`),
  play: (x) => x.B.addPower(x.p, 'echoForm', 1, x.p) });

def({ id: 'electrodynamics', name: '전기 역학', en: 'Electrodynamics', type: P, rarity: RARITY.RARE, color: B_, cost: 2, target: SELF,
  mag: 2, magU: 3,
  text: D((c) => `번개 구체가 모든 적을 공격하게 됩니다. 번개 구체를 ${c.v('mag')}개 충전합니다.`),
  play: (x) => { x.B.addPower(x.p, 'electro', 1, x.p); x.B.channel('lightning', x.c.v('mag')); } });

def({ id: 'fission', name: '핵분열', en: 'Fission', type: S, rarity: RARITY.RARE, color: B_, cost: 0, target: NONE,
  exhaust: true, exhaustU: false,
  text: D((c) => c.upgraded
    ? `모든 구체를 발동한 뒤 제거하고, 구체 1개당 에너지 1과 카드 1장을 얻습니다.`
    : `모든 구체를 제거하고, 구체 1개당 에너지 1과 카드 1장을 얻습니다.`),
  play: (x) => {
    const n = x.B.orbs.length;
    if (x.c.upgraded) x.B.evokeAll();
    else x.B.orbs = [];
    x.B.gainEnergy(n); x.B.draw(n);
  } });

def({ id: 'hyperbeam', name: '하이퍼빔', en: 'Hyperbeam', type: A, rarity: RARITY.RARE, color: B_, cost: 2, target: ALL,
  dmg: 26, dmgU: 34,
  text: D((c) => `모든 적에게 피해를 ${c.v('dmg')} 줍니다. 집중이 3 감소합니다.`),
  play: (x) => { x.B.attackAll(x, x.c.v('dmg')); x.B.addPower(x.p, 'focus', -3, x.p); } });

def({ id: 'machineLearningCard', name: '기계 학습', en: 'Machine Learning', type: P, rarity: RARITY.RARE, color: B_, cost: 1, target: SELF,
  mag: 1, magU: 2,
  text: D((c) => `턴이 시작될 때마다 카드를 ${c.v('mag')}장 더 뽑습니다.`),
  play: (x) => x.B.addPower(x.p, 'machineLearning', x.c.v('mag'), x.p) });

def({ id: 'meteorStrike', name: '유성 강타', en: 'Meteor Strike', type: A, rarity: RARITY.RARE, color: B_, cost: 5, costU: 4, target: E,
  dmg: 24, dmgU: 30,
  text: D((c) => `피해를 ${c.v('dmg')} 주고 플라즈마 구체를 3개 충전합니다.`),
  play: (x) => { x.B.attack(x, x.c.v('dmg')); x.B.channel('plasma', 3); } });

def({ id: 'multiCast', name: '다중 시전', en: 'Multi-Cast', type: S, rarity: RARITY.RARE, color: B_, cost: -1, target: NONE,
  text: D((c) => `가장 앞의 구체를 X${c.upgraded ? '+1' : ''}번 발동합니다.`),
  play: (x) => x.B.evokeFront(x.x + (x.c.upgraded ? 1 : 0)) });

def({ id: 'rainbow', name: '무지개', en: 'Rainbow', type: S, rarity: RARITY.RARE, color: B_, cost: 2, target: NONE,
  exhaust: true, exhaustU: false,
  text: D(() => `번개, 냉기, 암흑 구체를 각각 1개씩 충전합니다.`),
  play: (x) => { x.B.channel('lightning'); x.B.channel('frost'); x.B.channel('dark'); } });

def({ id: 'reboot', name: '재부팅', en: 'Reboot', type: S, rarity: RARITY.RARE, color: B_, cost: 0, target: NONE,
  mag: 4, magU: 6, exhaust: true,
  text: D((c) => `버린 카드 더미와 손을 뽑을 더미에 섞어 넣고 카드를 ${c.v('mag')}장 뽑습니다.`),
  play: (x) => {
    [...x.B.hand].forEach((h) => { if (h.uid !== x.c.uid) { x.B.removeFrom(x.B.hand, h); x.B.discardPile.push(h); } });
    x.B.shuffleDiscardIntoDraw();
    x.B.draw(x.c.v('mag'));
  } });

def({ id: 'seek', name: '탐색', en: 'Seek', type: S, rarity: RARITY.RARE, color: B_, cost: 0, target: NONE,
  mag: 1, magU: 2, exhaust: true,
  text: D((c) => `뽑을 카드 더미에서 카드 ${c.v('mag')}장을 손에 넣습니다.`),
  play: async (x) => {
    if (!x.B.drawPile.length) return;
    const n = Math.min(x.c.v('mag'), x.B.drawPile.length);
    const sel = await x.B.chooseCards(x.B.drawPile.slice(), { count: n, title: `가져올 카드 ${n}장` });
    (sel || []).forEach((s) => { x.B.removeFrom(x.B.drawPile, s); x.B.addCardToHand(s); });
  } });

def({ id: 'thunderStrike', name: '천둥 강타', en: 'Thunder Strike', type: A, rarity: RARITY.RARE, color: B_, cost: 3, target: NONE,
  dmg: 7, dmgU: 9,
  text: D((c) => `이번 전투에서 충전한 번개 구체 1개당 무작위 적에게 피해를 ${c.v('dmg')} 줍니다.`),
  play: (x) => { const n = x.B.channeledCount.lightning || 0; for (let i = 0; i < n; i++) x.B.attackRandom(x, x.c.v('dmg')); } });
