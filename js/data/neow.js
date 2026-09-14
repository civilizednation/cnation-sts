// ============================================================
//  시작 보너스 (원작의 네오우 축복 구성을 따름)
//  apply(run, ctx) -> 결과 메시지
//  ctx : { pickCard, pickUpgrade, chooseFrom, cardReward, gainRelic }
// ============================================================
import { mk } from './carddb.js';
import { CURSE_POOL } from './cards_colorless.js';

export const NEOW_BENEFITS = [
  { id: 'maxHp', icon: 'heart', label: '최대 체력 +10',
    desc: '최대 체력이 10 증가하고 그만큼 회복합니다.',
    apply: (run) => { run.gainMaxHp(10); return '최대 체력이 10 증가했다.'; } },

  { id: 'commonRelic', icon: 'star', label: '일반 유물 1개',
    desc: '무작위 일반 유물을 하나 얻습니다.',
    apply: async (run, ctx) => {
      const id = run.pickRelic('common');
      if (!id) return '얻을 유물이 없다.';
      await ctx.gainRelic(id);
      return `${ctx.relicName(id)}을(를) 얻었다.`;
    } },

  { id: 'removeCard', icon: 'minus', label: '카드 1장 제거',
    desc: '덱에서 카드 1장을 골라 제거합니다.',
    apply: async (run, ctx) => {
      const c = await ctx.pickCard((x) => !x.def.undeletable, '제거할 카드 선택');
      if (!c) return '아무것도 제거하지 않았다.';
      run.removeCard(c);
      return `${c.name}을(를) 제거했다.`;
    } },

  { id: 'upgradeCard', icon: 'arrowUp', label: '카드 1장 강화',
    desc: '덱에서 카드 1장을 골라 강화합니다.',
    apply: async (run, ctx) => {
      const c = await ctx.pickUpgrade((x) => x.canUpgrade(), '강화할 카드 선택');
      if (!c) return '아무것도 강화하지 않았다.';
      return `${c.name}을(를) 강화했다.`;
    } },

  { id: 'upgradeTwoRandom', icon: 'twinSword', label: '무작위 카드 2장 강화',
    desc: '덱의 무작위 카드 2장이 강화됩니다.',
    apply: (run) => {
      const before = run.deck.filter((c) => c.canUpgrade());
      run.upgradeRandom((c) => c.canUpgrade(), 2);
      const n = before.length - run.deck.filter((c) => c.canUpgrade()).length;
      return `무작위 카드 ${n}장이 강화되었다.`;
    } },

  { id: 'gold', icon: 'ring', label: '골드 +100',
    desc: '골드를 100 얻습니다.',
    apply: (run) => { run.gainGold(100); return '골드 100을 얻었다.'; } },

  { id: 'potions', icon: 'potion', label: '물약 3개',
    desc: '무작위 물약 3개를 얻습니다.',
    apply: (run) => {
      let n = 0;
      for (let i = 0; i < 3; i++) if (run.addPotion(run.randomPotion())) n++;
      return `물약 ${n}개를 얻었다.`;
    } },

  { id: 'newCard', icon: 'book', label: '카드 1장 획득',
    desc: '카드 3장 중 1장을 골라 덱에 넣습니다.',
    apply: async (run, ctx) => {
      const choices = run.cardReward('elite');
      const c = await ctx.chooseFrom(choices, '덱에 넣을 카드 선택');
      if (!c) return '아무것도 고르지 않았다.';
      run.addCard(c);
      return `${c.name}을(를) 얻었다.`;
    } },

  { id: 'transform', icon: 'spiral', label: '카드 1장 변환',
    desc: '카드 1장을 다른 무작위 카드로 바꿉니다.',
    apply: async (run, ctx) => {
      const c = await ctx.pickCard((x) => !x.def.undeletable, '변환할 카드 선택');
      if (!c) return '아무것도 변환하지 않았다.';
      run.removeCard(c);
      const nc = run.cardReward('normal')[0];
      if (nc) run.addCard(nc);
      return `${c.name} → ${nc ? nc.name : '?'}`;
    } },

  { id: 'healFull', icon: 'heart', label: '최대 체력 +6 · 완전 회복',
    desc: '최대 체력이 6 증가하고 체력을 모두 회복합니다.',
    apply: (run) => { run.gainMaxHp(6); run.player.hp = run.player.maxHp; return '몸이 완전히 회복되었다.'; } },
];

/** 대가가 따르는 강력한 보너스 */
export const NEOW_DRAWBACKS = [
  { id: 'rareRelicHp', icon: 'crown', label: '희귀 유물 · 최대 체력 -8',
    desc: '희귀 유물을 얻지만 최대 체력이 8 감소합니다.', risky: true,
    apply: async (run, ctx) => {
      const id = run.pickRelic('rare');
      run.loseMaxHp(8);
      if (!id) return '최대 체력이 8 감소했다.';
      await ctx.gainRelic(id);
      return `${ctx.relicName(id)}을(를) 얻고 최대 체력이 8 감소했다.`;
    } },

  { id: 'goldCurse', icon: 'skull', label: '골드 +250 · 저주 1장',
    desc: '골드를 250 얻지만 무작위 저주 카드를 1장 얻습니다.', risky: true,
    apply: (run) => {
      run.gainGold(250);
      const id = run.rng.pick(CURSE_POOL);
      run.addCurse(id);
      return `골드 250을 얻었지만 저주를 받았다.`;
    } },

  { id: 'uncommonRelicHp', icon: 'star', label: '고급 유물 · 체력 30% 감소',
    desc: '고급 유물을 얻지만 현재 체력의 30%를 잃습니다.', risky: true,
    apply: async (run, ctx) => {
      const id = run.pickRelic('uncommon');
      const d = Math.floor(run.player.hp * 0.3);
      run.player.hp = Math.max(1, run.player.hp - d);
      if (!id) return `체력을 ${d} 잃었다.`;
      await ctx.gainRelic(id);
      return `${ctx.relicName(id)}을(를) 얻고 체력을 ${d} 잃었다.`;
    } },

  { id: 'bigDeckCut', icon: 'axe', label: '카드 2장 제거 · 최대 체력 -5',
    desc: '카드 2장을 제거하지만 최대 체력이 5 감소합니다.', risky: true,
    apply: async (run, ctx) => {
      for (let i = 0; i < 2; i++) {
        const c = await ctx.pickCard((x) => !x.def.undeletable, `제거할 카드 선택 (${i + 1}/2)`);
        if (c) run.removeCard(c);
      }
      run.loseMaxHp(5);
      return '덱이 가벼워졌지만 몸이 약해졌다.';
    } },

  { id: 'bossRelicEarly', icon: 'gear', label: '보스 유물 · 저주 1장',
    desc: '보스 유물을 얻지만 저주 카드를 1장 얻습니다.', risky: true,
    apply: async (run, ctx) => {
      const id = run.pickRelic('boss');
      run.addCurse(run.rng.pick(CURSE_POOL));
      if (!id) return '저주만 남았다...';
      await ctx.gainRelic(id);
      return `${ctx.relicName(id)}을(를) 얻고 저주를 받았다.`;
    } },
];

/** 이번 런에서 제시할 보너스 4개 (혜택 3 + 대가 1) */
export function rollNeowOptions(rng) {
  const benefits = rng.shuffle(NEOW_BENEFITS.slice()).slice(0, 3);
  const drawback = rng.pick(NEOW_DRAWBACKS);
  return rng.shuffle([...benefits, drawback]);
}
