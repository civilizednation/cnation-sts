// ============================================================
//  물약(Potion) 정의
// ============================================================
import { mk, CARD_DEFS } from './carddb.js';

export const POTIONS = {};
const P = (o) => { POTIONS[o.id] = o; return o; };

// rarity : common / uncommon / rare
// target : 'enemy' 면 적을 지정해야 함, 'none'/'self' 는 즉시
// battleOnly : 전투 중에만 사용 가능

P({ id: 'blockPotion', name: '방어 물약', en: 'Block Potion', rarity: 'common', color: '#5aa0d0', battleOnly: true,
  desc: (m) => `방어도를 ${12 * m} 얻습니다.`,
  use: (B, m) => B.gainBlock(B.player, 12 * m, null) });
P({ id: 'attackPotion', name: '공격 물약', en: 'Attack Potion', rarity: 'common', color: '#d05a5a', battleOnly: true,
  desc: (m) => `무작위 공격 카드 ${m}장을 손에 넣습니다. 이번 턴 비용은 0입니다.`,
  use: (B, m) => { for (let i = 0; i < m; i++) { const c = B.randomCardOfType('attack'); if (c) { c.costForTurn = 0; B.addCardToHand(c); } } } });
P({ id: 'skillPotion', name: '기술 물약', en: 'Skill Potion', rarity: 'common', color: '#5ad0a0', battleOnly: true,
  desc: (m) => `무작위 기술 카드 ${m}장을 손에 넣습니다. 이번 턴 비용은 0입니다.`,
  use: (B, m) => { for (let i = 0; i < m; i++) { const c = B.randomCardOfType('skill'); if (c) { c.costForTurn = 0; B.addCardToHand(c); } } } });
P({ id: 'powerPotion', name: '힘 물약', en: 'Power Potion', rarity: 'common', color: '#a05ad0', battleOnly: true,
  desc: (m) => `무작위 힘 카드 ${m}장을 손에 넣습니다. 이번 턴 비용은 0입니다.`,
  use: (B, m) => { for (let i = 0; i < m; i++) { const c = B.randomCardOfType('power'); if (c) { c.costForTurn = 0; B.addCardToHand(c); } } } });
P({ id: 'colorlessPotion', name: '무색 물약', en: 'Colorless Potion', rarity: 'common', color: '#d0d0d0', battleOnly: true,
  desc: (m) => `무작위 무색 카드 ${m}장을 손에 넣습니다. 이번 턴 비용은 0입니다.`,
  use: (B, m) => { for (let i = 0; i < m; i++) { const c = B.randomColorlessCard(); if (c) { c.costForTurn = 0; B.addCardToHand(c); } } } });
P({ id: 'fearPotion', name: '공포 물약', en: 'Fear Potion', rarity: 'common', color: '#8b5ad0', battleOnly: true, target: 'enemy',
  desc: (m) => `적에게 취약을 ${3 * m} 부여합니다.`,
  use: (B, m, t) => B.addPower(t, 'vulnerable', 3 * m, B.player) });
P({ id: 'weakPotion', name: '약화 물약', en: 'Weak Potion', rarity: 'common', color: '#5a8bd0', battleOnly: true, target: 'enemy',
  desc: (m) => `적에게 약화를 ${3 * m} 부여합니다.`,
  use: (B, m, t) => B.addPower(t, 'weak', 3 * m, B.player) });
P({ id: 'firePotion', name: '화염 물약', en: 'Fire Potion', rarity: 'common', color: '#e07a3a', battleOnly: true, target: 'enemy',
  desc: (m) => `적에게 피해를 ${20 * m} 줍니다.`,
  use: (B, m, t) => B.dealDamage(B.player, t, 20 * m, null, 'potion') });
P({ id: 'strengthPotion', name: '힘의 물약', en: 'Strength Potion', rarity: 'common', color: '#d04a4a', battleOnly: true,
  desc: (m) => `힘을 ${2 * m} 얻습니다.`,
  use: (B, m) => B.addPower(B.player, 'strength', 2 * m, B.player) });
P({ id: 'dexterityPotion', name: '민첩 물약', en: 'Dexterity Potion', rarity: 'common', color: '#4ad0a0', battleOnly: true,
  desc: (m) => `민첩을 ${2 * m} 얻습니다.`,
  use: (B, m) => B.addPower(B.player, 'dexterity', 2 * m, B.player) });
P({ id: 'energyPotion', name: '에너지 물약', en: 'Energy Potion', rarity: 'common', color: '#e0d040', battleOnly: true,
  desc: (m) => `에너지를 ${2 * m} 얻습니다.`,
  use: (B, m) => B.gainEnergy(2 * m) });
P({ id: 'explosivePotion', name: '폭발 물약', en: 'Explosive Potion', rarity: 'common', color: '#e05a2a', battleOnly: true,
  desc: (m) => `모든 적에게 피해를 ${10 * m} 줍니다.`,
  use: (B, m) => B.living().forEach((e) => B.dealDamage(B.player, e, 10 * m, null, 'potion')) });
P({ id: 'swiftPotion', name: '신속 물약', en: 'Swift Potion', rarity: 'common', color: '#7ad0e0', battleOnly: true,
  desc: (m) => `카드를 ${3 * m}장 뽑습니다.`,
  use: (B, m) => B.draw(3 * m) });
P({ id: 'bloodPotion', name: '피의 물약', en: 'Blood Potion', rarity: 'common', color: '#a02a2a',
  desc: (m) => `최대 체력의 ${20 * m}%만큼 체력을 회복합니다.`,
  use: (B, m, t, run) => run.healPlayer(Math.floor(run.player.maxHp * 0.2 * m)) });

P({ id: 'ancientPotion', name: '고대 물약', en: 'Ancient Potion', rarity: 'uncommon', color: '#c0a060', battleOnly: true,
  desc: (m) => `인공물을 ${1 * m} 얻습니다.`,
  use: (B, m) => B.addPower(B.player, 'artifact', m, B.player) });
P({ id: 'distilledChaos', name: '증류된 혼돈', en: 'Distilled Chaos', rarity: 'uncommon', color: '#a040a0', battleOnly: true,
  desc: (m) => `뽑을 카드 더미의 맨 위 카드 ${3 * m}장을 사용합니다.`,
  use: async (B, m) => { for (let i = 0; i < 3 * m; i++) await B.playTopOfDeck(false); } });
P({ id: 'liquidBronze', name: '액체 청동', en: 'Liquid Bronze', rarity: 'uncommon', color: '#b08040', battleOnly: true,
  desc: (m) => `가시를 ${3 * m} 얻습니다.`,
  use: (B, m) => B.addPower(B.player, 'thorns', 3 * m, B.player) });
P({ id: 'liquidMemories', name: '액체 기억', en: 'Liquid Memories', rarity: 'uncommon', color: '#40a0c0', battleOnly: true,
  desc: (m) => `버린 카드 더미에서 카드 ${m}장을 손으로 가져옵니다. 이번 턴 비용은 0입니다.`,
  use: async (B, m) => {
    if (!B.discardPile.length) return;
    const sel = await B.chooseCards(B.discardPile.slice(), { count: Math.min(m, B.discardPile.length), title: '가져올 카드' });
    sel.forEach((c) => { B.removeFrom(B.discardPile, c); c.costForTurn = 0; B.addCardToHand(c); });
  } });
P({ id: 'regenPotion', name: '재생 물약', en: 'Regen Potion', rarity: 'uncommon', color: '#50c070', battleOnly: true,
  desc: (m) => `재생을 ${5 * m} 얻습니다.`,
  use: (B, m) => B.addPower(B.player, 'regeneration', 5 * m, B.player) });
P({ id: 'gamblersBrew', name: '도박꾼의 양조주', en: "Gambler's Brew", rarity: 'uncommon', color: '#c04080', battleOnly: true,
  desc: () => `원하는 만큼 카드를 버리고, 버린 수만큼 카드를 뽑습니다.`,
  use: async (B) => {
    if (!B.hand.length) return;
    const sel = await B.chooseCards(B.hand.slice(), { count: B.hand.length, title: '버릴 카드 선택', optional: true });
    sel.forEach((c) => B.discardFromHand(c));
    B.draw(sel.length);
  } });
P({ id: 'essenceOfSteel', name: '강철의 정수', en: 'Essence of Steel', rarity: 'uncommon', color: '#8090a0', battleOnly: true,
  desc: (m) => `도금 갑옷을 ${4 * m} 얻습니다.`,
  use: (B, m) => B.addPower(B.player, 'plated', 4 * m, B.player) });
P({ id: 'duplicationPotion', name: '복제 물약', en: 'Duplication Potion', rarity: 'uncommon', color: '#6060d0', battleOnly: true,
  desc: (m) => `이번 턴에 다음 카드 ${m}장을 두 번 사용합니다.`,
  use: (B, m) => B.addPower(B.player, 'duplication', m, B.player) });
P({ id: 'blessingOfTheForge', name: '대장간의 축복', en: 'Blessing of the Forge', rarity: 'common', color: '#e0a040', battleOnly: true,
  desc: () => `손에 있는 모든 카드를 강화합니다.`,
  use: (B) => B.hand.forEach((c) => c.canUpgrade() && c.upgrade()) });

P({ id: 'fruitJuice', name: '과일 주스', en: 'Fruit Juice', rarity: 'rare', color: '#e06090',
  desc: (m) => `최대 체력이 ${5 * m} 증가합니다.`,
  use: (B, m, t, run) => run.gainMaxHp(5 * m) });
P({ id: 'fairyInABottle', name: '병 속의 요정', en: 'Fairy in a Bottle', rarity: 'rare', color: '#90e0d0', passive: true,
  desc: (m) => `죽을 때 자동으로 사용되어 최대 체력의 ${30 * m}%를 회복하며 부활합니다.`,
  use: () => {} });
P({ id: 'smokeBomb', name: '연막탄', en: 'Smoke Bomb', rarity: 'rare', color: '#707070', battleOnly: true,
  desc: () => `보스가 아닌 전투에서 보상 없이 탈출합니다.`,
  use: (B) => B.escapeBattle() });
P({ id: 'snecko', name: '스네코 기름', en: 'Snecko Oil', rarity: 'rare', color: '#70a050', battleOnly: true,
  desc: (m) => `카드를 ${5 * m}장 뽑고, 손에 있는 카드의 비용이 무작위로 정해집니다.`,
  use: (B, m) => { B.draw(5 * m); B.hand.forEach((c) => { if (!c.unplayable) c.costOverride = B.rng.int(4); }); } });
P({ id: 'entropicBrew', name: '무질서한 양조주', en: 'Entropic Brew', rarity: 'rare', color: '#c060c0',
  desc: () => `빈 물약 슬롯을 무작위 물약으로 모두 채웁니다.`,
  use: (B, m, t, run) => run.fillPotions() });
P({ id: 'cultistPotion', name: '광신도 물약', en: 'Cultist Potion', rarity: 'rare', color: '#8040c0', battleOnly: true,
  desc: (m) => `의식을 ${m} 얻습니다. (턴 종료 시 힘 획득)`,
  use: (B, m) => B.addPower(B.player, 'ritual', m, B.player) });
P({ id: 'heartOfIron', name: '무쇠 심장', en: 'Heart of Iron', rarity: 'rare', color: '#a08060', battleOnly: true,
  desc: (m) => `금속화를 ${6 * m} 얻습니다.`,
  use: (B, m) => B.addPower(B.player, 'metallicize', 6 * m, B.player) });

export const POTION_POOL = Object.values(POTIONS).filter((p) => p.id !== 'fairyInABottle');
export const potionById = (id) => POTIONS[id];
