// ============================================================
//  유물(Relic) 정의
//  hooks 는 전투/맵 진행 중 호출됩니다.
// ============================================================
import { mk } from './carddb.js';

export const RELICS = {};
export const RARITY_KR = { starter: '시작', common: '일반', uncommon: '고급', rare: '희귀', boss: '보스', shop: '상점', event: '이벤트' };

function R(o) { RELICS[o.id] = o; return o; }

// ---------------- 시작 유물 ----------------
R({ id: 'burningBlood', name: '작열하는 피', en: 'Burning Blood', rarity: 'starter', glyph: 'blood',
  desc: '전투가 끝날 때마다 체력을 6 회복합니다.',
  onBattleEnd: (run) => run.healPlayer(6) });

R({ id: 'blackBlood', name: '검은 피', en: 'Black Blood', rarity: 'boss', glyph: 'blood',
  desc: '전투가 끝날 때마다 체력을 12 회복합니다. (작열하는 피 대체)',
  onBattleEnd: (run) => run.healPlayer(12) });

// ---------------- 일반 ----------------
R({ id: 'akabeko', name: '아카베코', en: 'Akabeko', rarity: 'common', glyph: 'cow',
  desc: '전투에서 사용하는 첫 공격 카드가 추가로 피해를 8 줍니다.',
  onBattleStart: (B) => B.addPower(B.player, 'vigor', 8, B.player) });

R({ id: 'anchor', name: '닻', en: 'Anchor', rarity: 'common', glyph: 'anchor',
  desc: '전투 시작 시 방어도를 10 얻습니다.',
  onBattleStart: (B) => B.gainBlock(B.player, 10, null) });

R({ id: 'ancientTeaSet', name: '고대 다기', en: 'Ancient Tea Set', rarity: 'common', glyph: 'tea',
  desc: '모닥불에서 휴식한 뒤 다음 전투를 시작할 때 에너지를 2 얻습니다.',
  onBattleStart: (B) => { if (B.run.flags.teaSet) { B.gainEnergy(2); B.run.flags.teaSet = false; } } });

R({ id: 'artOfWar', name: '전쟁의 기술', en: 'Art of War', rarity: 'common', glyph: 'scroll',
  desc: '한 턴 동안 공격 카드를 사용하지 않으면 다음 턴에 에너지를 1 더 얻습니다.',
  onTurnStart: (B) => { if (B.run.flags.artOfWar) { B.gainEnergy(1); } B.run.flags.artOfWar = true; },
  onCardPlayed: (B, c) => { if (c.type === 'attack') B.run.flags.artOfWar = false; } });

R({ id: 'bagOfMarbles', name: '구슬 주머니', en: 'Bag of Marbles', rarity: 'common', glyph: 'marble',
  desc: '전투 시작 시 모든 적에게 취약을 1 부여합니다.',
  onBattleStart: (B) => B.living().forEach((e) => B.addPower(e, 'vulnerable', 1, B.player)) });

R({ id: 'bagOfPreparation', name: '준비 가방', en: 'Bag of Preparation', rarity: 'common', glyph: 'bag',
  desc: '전투 시작 시 카드를 2장 더 뽑습니다.',
  onFirstTurn: (B) => B.draw(2) });

R({ id: 'bloodVial', name: '피 약병', en: 'Blood Vial', rarity: 'common', glyph: 'vial',
  desc: '전투 시작 시 체력을 2 회복합니다.',
  onBattleStart: (B) => B.heal(B.player, 2) });

R({ id: 'bronzeScales', name: '청동 비늘', en: 'Bronze Scales', rarity: 'common', glyph: 'scale',
  desc: '전투 시작 시 가시를 3 얻습니다.',
  onBattleStart: (B) => B.addPower(B.player, 'thorns', 3, B.player) });

R({ id: 'centennialPuzzle', name: '100년 퍼즐', en: 'Centennial Puzzle', rarity: 'common', glyph: 'puzzle',
  desc: '전투 중 처음으로 체력을 잃을 때 카드를 3장 뽑습니다.',
  onBattleStart: (B) => { B.run.flags.puzzle = true; },
  onHpLost: (B) => { if (B.run.flags.puzzle) { B.run.flags.puzzle = false; B.draw(3); } } });

R({ id: 'ceramicFish', name: '도자기 물고기', en: 'Ceramic Fish', rarity: 'common', glyph: 'fish',
  desc: '덱에 카드를 넣을 때마다 골드를 9 얻습니다.',
  onObtainCard: (run) => run.gainGold(9) });

R({ id: 'dreamCatcher', name: '꿈 수집가', en: 'Dream Catcher', rarity: 'common', glyph: 'dream',
  desc: '모닥불에서 휴식하면 카드 보상을 받습니다.' });

R({ id: 'happyFlower', name: '행복한 꽃', en: 'Happy Flower', rarity: 'common', glyph: 'flower',
  desc: '3턴마다 에너지를 1 얻습니다.', counter: 0,
  onTurnStart: (B, r) => { r.counter = (r.counter || 0) + 1; if (r.counter >= 3) { r.counter = 0; B.gainEnergy(1); } } });

R({ id: 'juzuBracelet', name: '염주 팔찌', en: 'Juzu Bracelet', rarity: 'common', glyph: 'beads',
  desc: '일반 전투가 더 이상 나타나지 않습니다. (? 방)' });

R({ id: 'lantern', name: '등불', en: 'Lantern', rarity: 'common', glyph: 'lantern',
  desc: '전투의 첫 턴에 에너지를 1 더 얻습니다.',
  onFirstTurn: (B) => B.gainEnergy(1) });

R({ id: 'mawBank', name: '아귀 은행', en: 'Maw Bank', rarity: 'common', glyph: 'bank',
  desc: '층을 오를 때마다 골드를 12 얻습니다. 골드를 사용하면 효과가 사라집니다.',
  onClimb: (run, r) => { if (!r.dead) run.gainGold(12); },
  onSpendGold: (run, r) => { r.dead = true; } });

R({ id: 'mealTicket', name: '식권', en: 'Meal Ticket', rarity: 'common', glyph: 'ticket',
  desc: '상점에 들어갈 때마다 체력을 15 회복합니다.',
  onEnterShop: (run) => run.healPlayer(15) });

R({ id: 'nunchaku', name: '쌍절곤', en: 'Nunchaku', rarity: 'common', glyph: 'nunchaku',
  desc: '공격 카드를 10장 사용할 때마다 에너지를 1 얻습니다.', counter: 0,
  onCardPlayed: (B, c, r) => { if (c.type !== 'attack') return; r.counter = (r.counter || 0) + 1; if (r.counter >= 10) { r.counter = 0; B.gainEnergy(1); } } });

R({ id: 'oddlySmoothStone', name: '매끄러운 돌', en: 'Oddly Smooth Stone', rarity: 'common', glyph: 'stone',
  desc: '전투 시작 시 민첩을 1 얻습니다.',
  onBattleStart: (B) => B.addPower(B.player, 'dexterity', 1, B.player) });

R({ id: 'omamori', name: '부적', en: 'Omamori', rarity: 'common', glyph: 'charm',
  desc: '저주를 2개까지 무효화합니다.', counter: 2 });

R({ id: 'penNib', name: '펜촉', en: 'Pen Nib', rarity: 'common', glyph: 'pen',
  desc: '공격 카드를 10장 사용할 때마다 다음 공격 카드의 피해가 2배가 됩니다.', counter: 0 });

R({ id: 'potionBelt', name: '물약 벨트', en: 'Potion Belt', rarity: 'common', glyph: 'belt',
  desc: '물약 슬롯이 2개 늘어납니다.',
  onEquip: (run) => { run.potionSlots += 2; } });

R({ id: 'preservedInsect', name: '보존된 곤충', en: 'Preserved Insect', rarity: 'common', glyph: 'insect',
  desc: '정예 몬스터의 체력이 25% 감소한 상태로 시작합니다.' });

R({ id: 'regalPillow', name: '고급 베개', en: 'Regal Pillow', rarity: 'common', glyph: 'pillow',
  desc: '모닥불에서 휴식할 때 체력을 15 더 회복합니다.' });

R({ id: 'smilingMask', name: '웃는 가면', en: 'Smiling Mask', rarity: 'common', glyph: 'mask',
  desc: '상점의 카드 제거 비용이 항상 50 골드입니다.' });

R({ id: 'strawberry', name: '딸기', en: 'Strawberry', rarity: 'common', glyph: 'berry',
  desc: '최대 체력이 7 증가합니다.',
  onEquip: (run) => run.gainMaxHp(7) });

R({ id: 'theBoot', name: '부츠', en: 'The Boot', rarity: 'common', glyph: 'boot',
  desc: '공격으로 4 이하의 피해를 줄 때 피해량이 5로 증가합니다.' });

R({ id: 'tinyChest', name: '작은 상자', en: 'Tiny Chest', rarity: 'common', glyph: 'chest',
  desc: '4번째 ? 방마다 보물 방이 됩니다.', counter: 0 });

R({ id: 'vajra', name: '금강저', en: 'Vajra', rarity: 'common', glyph: 'vajra',
  desc: '전투 시작 시 힘을 1 얻습니다.',
  onBattleStart: (B) => B.addPower(B.player, 'strength', 1, B.player) });

R({ id: 'warPaint', name: '전쟁 물감', en: 'War Paint', rarity: 'common', glyph: 'paint',
  desc: '획득 시 무작위 고급 카드 2장을 강화합니다.',
  onEquip: (run) => run.upgradeRandom((c) => c.rarity === 'uncommon', 2) });

R({ id: 'whetstone', name: '숫돌', en: 'Whetstone', rarity: 'common', glyph: 'whet',
  desc: '획득 시 무작위 공격 카드 2장을 강화합니다.',
  onEquip: (run) => run.upgradeRandom((c) => c.type === 'attack', 2) });

R({ id: 'redSkull', name: '붉은 해골', en: 'Red Skull', rarity: 'common', glyph: 'skull',
  desc: '체력이 50% 이하일 때 힘을 3 얻습니다.',
  onBattleStart: (B) => { if (B.player.hp <= B.player.maxHp / 2) B.addPower(B.player, 'strength', 3, B.player); },
  onHpChange: (B) => {
    const on = B.player.hp <= B.player.maxHp / 2;
    const has = !!B.run.flags.redSkull;
    if (on && !has) { B.run.flags.redSkull = true; B.addPower(B.player, 'strength', 3, B.player); }
    else if (!on && has) { B.run.flags.redSkull = false; B.addPower(B.player, 'strength', -3, B.player); }
  } });

// ---------------- 고급 ----------------
R({ id: 'blueCandle', name: '파란 양초', en: 'Blue Candle', rarity: 'uncommon', glyph: 'candle',
  desc: '저주 카드를 사용할 수 있습니다. 사용하면 체력을 1 잃고 소각됩니다.' });

R({ id: 'bottledFlame', name: '병에 담긴 화염', en: 'Bottled Flame', rarity: 'uncommon', glyph: 'bflame',
  desc: '획득 시 공격 카드 1장을 선택합니다. 그 카드는 항상 첫 손패에 들어옵니다.' });
R({ id: 'bottledLightning', name: '병에 담긴 번개', en: 'Bottled Lightning', rarity: 'uncommon', glyph: 'blight',
  desc: '획득 시 기술 카드 1장을 선택합니다. 그 카드는 항상 첫 손패에 들어옵니다.' });
R({ id: 'bottledTornado', name: '병에 담긴 폭풍', en: 'Bottled Tornado', rarity: 'uncommon', glyph: 'btorn',
  desc: '획득 시 힘 카드 1장을 선택합니다. 그 카드는 항상 첫 손패에 들어옵니다.' });

R({ id: 'darkstonePeriapt', name: '흑요석 목걸이', en: 'Darkstone Periapt', rarity: 'uncommon', glyph: 'periapt',
  desc: '저주를 얻을 때마다 최대 체력이 6 증가합니다.',
  onObtainCurse: (run) => run.gainMaxHp(6) });

R({ id: 'eternalFeather', name: '영원한 깃털', en: 'Eternal Feather', rarity: 'uncommon', glyph: 'feather',
  desc: '휴식할 때 덱의 카드 5장당 체력을 3 회복합니다.' });

R({ id: 'frozenEgg', name: '얼어붙은 알', en: 'Frozen Egg', rarity: 'uncommon', glyph: 'egg',
  desc: '힘 카드를 획득할 때 강화된 상태로 얻습니다.' });
R({ id: 'moltenEgg', name: '녹아내린 알', en: 'Molten Egg', rarity: 'uncommon', glyph: 'egg',
  desc: '공격 카드를 획득할 때 강화된 상태로 얻습니다.' });
R({ id: 'toxicEgg', name: '유독성 알', en: 'Toxic Egg', rarity: 'uncommon', glyph: 'egg',
  desc: '기술 카드를 획득할 때 강화된 상태로 얻습니다.' });

R({ id: 'gremlinHorn', name: '그렘린 뿔', en: 'Gremlin Horn', rarity: 'uncommon', glyph: 'horn',
  desc: '적이 죽을 때마다 에너지를 1 얻고 카드를 1장 뽑습니다.',
  onEnemyKilled: (B) => { B.gainEnergy(1); B.draw(1); } });

R({ id: 'hornCleat', name: '뿔 장식', en: 'Horn Cleat', rarity: 'uncommon', glyph: 'cleat',
  desc: '전투의 2번째 턴에 방어도를 14 얻습니다.',
  onTurnStart: (B) => { if (B.turn === 2) B.gainBlock(B.player, 14, null); } });

R({ id: 'inkBottle', name: '잉크병', en: 'Ink Bottle', rarity: 'uncommon', glyph: 'ink',
  desc: '카드를 10장 사용할 때마다 카드를 1장 뽑습니다.', counter: 0,
  onCardPlayed: (B, c, r) => { r.counter = (r.counter || 0) + 1; if (r.counter >= 10) { r.counter = 0; B.draw(1); } } });

R({ id: 'kunai', name: '쿠나이', en: 'Kunai', rarity: 'uncommon', glyph: 'kunai',
  desc: '한 턴에 공격 카드를 3장 사용할 때마다 민첩을 1 얻습니다.', counter: 0,
  onCardPlayed: (B, c, r) => { if (c.type !== 'attack') return; r.counter = (r.counter || 0) + 1; if (r.counter >= 3) { r.counter = 0; B.addPower(B.player, 'dexterity', 1, B.player); } },
  onTurnEnd: (B, r) => { r.counter = 0; } });

R({ id: 'shuriken', name: '수리검', en: 'Shuriken', rarity: 'uncommon', glyph: 'shuriken',
  desc: '한 턴에 공격 카드를 3장 사용할 때마다 힘을 1 얻습니다.', counter: 0,
  onCardPlayed: (B, c, r) => { if (c.type !== 'attack') return; r.counter = (r.counter || 0) + 1; if (r.counter >= 3) { r.counter = 0; B.addPower(B.player, 'strength', 1, B.player); } },
  onTurnEnd: (B, r) => { r.counter = 0; } });

R({ id: 'letterOpener', name: '편지 개봉기', en: 'Letter Opener', rarity: 'uncommon', glyph: 'opener',
  desc: '한 턴에 기술 카드를 3장 사용할 때마다 모든 적에게 피해를 5 줍니다.', counter: 0,
  onCardPlayed: (B, c, r) => { if (c.type !== 'skill') return; r.counter = (r.counter || 0) + 1; if (r.counter >= 3) { r.counter = 0; B.living().forEach((e) => B.dealDamage(B.player, e, 5, null, 'relic')); } },
  onTurnEnd: (B, r) => { r.counter = 0; } });

R({ id: 'ornamentalFan', name: '장식 부채', en: 'Ornamental Fan', rarity: 'uncommon', glyph: 'fan',
  desc: '한 턴에 공격 카드를 3장 사용할 때마다 방어도를 4 얻습니다.', counter: 0,
  onCardPlayed: (B, c, r) => { if (c.type !== 'attack') return; r.counter = (r.counter || 0) + 1; if (r.counter >= 3) { r.counter = 0; B.gainBlock(B.player, 4, null); } },
  onTurnEnd: (B, r) => { r.counter = 0; } });

R({ id: 'matryoshka', name: '마트료시카', en: 'Matryoshka', rarity: 'uncommon', glyph: 'doll',
  desc: '다음 보물 상자 2개에서 유물을 1개 더 얻습니다.', counter: 2 });

R({ id: 'meatOnTheBone', name: '뼈에 붙은 고기', en: 'Meat on the Bone', rarity: 'uncommon', glyph: 'meat',
  desc: '전투 종료 시 체력이 50% 이하면 체력을 12 회복합니다.',
  onBattleEnd: (run) => { if (run.player.hp <= run.player.maxHp / 2) run.healPlayer(12); } });

R({ id: 'mercuryHourglass', name: '수은 모래시계', en: 'Mercury Hourglass', rarity: 'uncommon', glyph: 'hourglass',
  desc: '턴이 시작될 때마다 모든 적에게 피해를 3 줍니다.',
  onTurnStart: (B) => B.living().forEach((e) => B.dealDamage(B.player, e, 3, null, 'relic')) });

R({ id: 'mummifiedHand', name: '미라의 손', en: 'Mummified Hand', rarity: 'uncommon', glyph: 'hand',
  desc: '힘 카드를 사용할 때마다 손에 있는 무작위 카드 1장의 비용이 0이 됩니다.',
  onCardPlayed: (B, c) => { if (c.type !== 'power') return; const cand = B.hand.filter((h) => h.cost > 0); if (cand.length) B.rng.pick(cand).costForTurn = 0; } });

R({ id: 'pantograph', name: '팬터그래프', en: 'Pantograph', rarity: 'uncommon', glyph: 'panto',
  desc: '보스 전투를 시작할 때 체력을 25 회복합니다.',
  onBattleStart: (B) => { if (B.encounter.kind === 'boss') B.heal(B.player, 25); } });

R({ id: 'pear', name: '배', en: 'Pear', rarity: 'uncommon', glyph: 'pear',
  desc: '최대 체력이 10 증가합니다.',
  onEquip: (run) => run.gainMaxHp(10) });

R({ id: 'questionCard', name: '물음표 카드', en: 'Question Card', rarity: 'uncommon', glyph: 'qcard',
  desc: '카드 보상을 1개 더 받습니다.' });

R({ id: 'singingBowl', name: '노래하는 그릇', en: 'Singing Bowl', rarity: 'uncommon', glyph: 'bowl',
  desc: '카드 보상 대신 최대 체력을 2 얻을 수 있습니다.' });

R({ id: 'strikeDummy', name: '타격 허수아비', en: 'Strike Dummy', rarity: 'uncommon', glyph: 'dummy',
  desc: '이름에 "타격"이 들어간 카드의 피해량이 3 증가합니다.' });

R({ id: 'sundial', name: '해시계', en: 'Sundial', rarity: 'uncommon', glyph: 'sundial',
  desc: '카드를 3번 섞을 때마다 에너지를 2 얻습니다.', counter: 0,
  onShuffle: (B, r) => { r.counter = (r.counter || 0) + 1; if (r.counter >= 3) { r.counter = 0; B.gainEnergy(2); } } });

R({ id: 'theCourier', name: '배달부', en: 'The Courier', rarity: 'uncommon', glyph: 'courier',
  desc: '상점의 물건이 떨어지지 않고 가격이 20% 저렴해집니다.' });

R({ id: 'whiteBeastStatue', name: '흰 짐승 조각상', en: 'White Beast Statue', rarity: 'uncommon', glyph: 'statue',
  desc: '전투 후 항상 물약을 얻습니다.' });

// ---------------- 희귀 ----------------
R({ id: 'birdFacedUrn', name: '새 얼굴 항아리', en: 'Bird-Faced Urn', rarity: 'rare', glyph: 'urn',
  desc: '힘 카드를 사용할 때마다 체력을 2 회복합니다.',
  onCardPlayed: (B, c) => { if (c.type === 'power') B.heal(B.player, 2); } });

R({ id: 'calipers', name: '캘리퍼스', en: 'Calipers', rarity: 'rare', glyph: 'caliper',
  desc: '턴이 시작될 때 방어도를 15만 잃습니다.' });

R({ id: 'captainsWheel', name: '선장의 키', en: "Captain's Wheel", rarity: 'rare', glyph: 'wheel',
  desc: '전투의 3번째 턴에 방어도를 18 얻습니다.',
  onTurnStart: (B) => { if (B.turn === 3) B.gainBlock(B.player, 18, null); } });

R({ id: 'deadBranch', name: '죽은 나뭇가지', en: 'Dead Branch', rarity: 'rare', glyph: 'branch',
  desc: '카드를 소각할 때마다 무작위 카드 1장을 손에 넣습니다.',
  onExhaust: (B) => { const c = B.randomCardAny(); if (c) B.addCardToHand(c); } });

R({ id: 'duVuDoll', name: '두-부 인형', en: 'Du-Vu Doll', rarity: 'rare', glyph: 'voodoo',
  desc: '덱에 있는 저주 1장당 전투 시작 시 힘을 1 얻습니다.',
  onBattleStart: (B) => { const n = B.run.deck.filter((c) => c.type === 'curse').length; if (n) B.addPower(B.player, 'strength', n, B.player); } });

R({ id: 'fossilizedHelix', name: '화석화된 나선', en: 'Fossilized Helix', rarity: 'rare', glyph: 'helix',
  desc: '전투마다 처음 받는 피해를 1회 방지합니다.',
  onBattleStart: (B) => B.addPower(B.player, 'buffer', 1, B.player) });

R({ id: 'gamblingChip', name: '도박 칩', en: 'Gambling Chip', rarity: 'rare', glyph: 'chip',
  desc: '전투 시작 시 원하는 만큼 카드를 버리고 같은 수만큼 다시 뽑습니다.' });

R({ id: 'ginger', name: '생강', en: 'Ginger', rarity: 'rare', glyph: 'ginger',
  desc: '더 이상 약화 상태가 되지 않습니다.' });

R({ id: 'girya', name: '기랴', en: 'Girya', rarity: 'rare', glyph: 'weight',
  desc: '모닥불에서 힘을 1 얻을 수 있습니다. (최대 3회)', counter: 0 });

R({ id: 'iceCream', name: '아이스크림', en: 'Ice Cream', rarity: 'rare', glyph: 'icecream',
  desc: '에너지가 턴이 끝나도 사라지지 않습니다.' });

R({ id: 'incenseBurner', name: '향로', en: 'Incense Burner', rarity: 'rare', glyph: 'incense',
  desc: '6턴마다 무형을 1 얻습니다.', counter: 0,
  onTurnStart: (B, r) => { r.counter = (r.counter || 0) + 1; if (r.counter >= 6) { r.counter = 0; B.addPower(B.player, 'intangible', 1, B.player); } } });

R({ id: 'lizardTail', name: '도마뱀 꼬리', en: 'Lizard Tail', rarity: 'rare', glyph: 'tail',
  desc: '죽을 때 체력을 최대 체력의 50%까지 회복하며 부활합니다. (1회)', counter: 1 });

R({ id: 'mango', name: '망고', en: 'Mango', rarity: 'rare', glyph: 'mango',
  desc: '최대 체력이 14 증가합니다.',
  onEquip: (run) => run.gainMaxHp(14) });

R({ id: 'oldCoin', name: '오래된 동전', en: 'Old Coin', rarity: 'rare', glyph: 'coin',
  desc: '골드를 300 얻습니다.',
  onEquip: (run) => run.gainGold(300) });

R({ id: 'peacePipe', name: '평화 담뱃대', en: 'Peace Pipe', rarity: 'rare', glyph: 'pipe',
  desc: '모닥불에서 카드를 1장 제거할 수 있습니다.' });

R({ id: 'pocketwatch', name: '회중시계', en: 'Pocketwatch', rarity: 'rare', glyph: 'watch',
  desc: '한 턴에 카드를 3장 이하로 사용하면 다음 턴에 카드를 3장 더 뽑습니다.' });

R({ id: 'prayerWheel', name: '기도 바퀴', en: 'Prayer Wheel', rarity: 'rare', glyph: 'prayer',
  desc: '일반 전투에서 카드 보상을 1개 더 받습니다.' });

R({ id: 'shovel', name: '삽', en: 'Shovel', rarity: 'rare', glyph: 'shovel',
  desc: '모닥불에서 땅을 파 유물을 얻을 수 있습니다.' });

R({ id: 'threadAndNeedle', name: '실과 바늘', en: 'Thread and Needle', rarity: 'rare', glyph: 'thread',
  desc: '전투 시작 시 도금 갑옷을 4 얻습니다.',
  onBattleStart: (B) => B.addPower(B.player, 'plated', 4, B.player) });

R({ id: 'torii', name: '토리이', en: 'Torii', rarity: 'rare', glyph: 'torii',
  desc: '5 이하의 공격 피해를 받을 때 피해가 1로 감소합니다.' });

R({ id: 'tungstenRod', name: '텅스텐 막대', en: 'Tungsten Rod', rarity: 'rare', glyph: 'rod',
  desc: '체력을 잃을 때마다 잃는 양이 1 감소합니다.' });

R({ id: 'turnip', name: '순무', en: 'Turnip', rarity: 'rare', glyph: 'turnip',
  desc: '더 이상 허약 상태가 되지 않습니다.' });

R({ id: 'unceasingTop', name: '끊임없는 팽이', en: 'Unceasing Top', rarity: 'rare', glyph: 'top',
  desc: '손에 카드가 없을 때 카드를 1장 뽑습니다.' });

R({ id: 'wingBoots', name: '날개 부츠', en: 'Wing Boots', rarity: 'rare', glyph: 'wing',
  desc: '지도에서 원하는 방으로 이동할 수 있습니다. (3회)', counter: 3 });

// ---------------- 보스 ----------------
R({ id: 'bustedCrown', name: '부서진 왕관', en: 'Busted Crown', rarity: 'boss', glyph: 'crown',
  desc: '에너지를 1 더 얻습니다. 카드 보상 선택지가 2개 줄어듭니다.', energy: 1 });
R({ id: 'coffeeDripper', name: '커피 내리개', en: 'Coffee Dripper', rarity: 'boss', glyph: 'coffee',
  desc: '에너지를 1 더 얻습니다. 더 이상 모닥불에서 휴식할 수 없습니다.', energy: 1 });
R({ id: 'cursedKey', name: '저주받은 열쇠', en: 'Cursed Key', rarity: 'boss', glyph: 'key',
  desc: '에너지를 1 더 얻습니다. 보물 상자를 열 때마다 저주를 1장 얻습니다.', energy: 1 });
R({ id: 'ectoplasm', name: '엑토플라즘', en: 'Ectoplasm', rarity: 'boss', glyph: 'ecto',
  desc: '에너지를 1 더 얻습니다. 더 이상 골드를 얻을 수 없습니다.', energy: 1 });
R({ id: 'fusionHammer', name: '융합 망치', en: 'Fusion Hammer', rarity: 'boss', glyph: 'hammer',
  desc: '에너지를 1 더 얻습니다. 더 이상 모닥불에서 카드를 강화할 수 없습니다.', energy: 1 });
R({ id: 'markOfPain', name: '고통의 징표', en: 'Mark of Pain', rarity: 'boss', glyph: 'markpain',
  desc: '에너지를 1 더 얻습니다. 전투 시작 시 뽑을 더미에 상처 2장이 들어갑니다.', energy: 1,
  onBattleStart: (B) => { B.addCardToDrawRandom(mk('wound')); B.addCardToDrawRandom(mk('wound')); } });
R({ id: 'philosophersStone', name: '현자의 돌', en: "Philosopher's Stone", rarity: 'boss', glyph: 'pstone',
  desc: '에너지를 1 더 얻습니다. 모든 적이 힘을 1 얻은 채로 시작합니다.', energy: 1,
  onBattleStart: (B) => B.living().forEach((e) => B.addPower(e, 'strength', 1, B.player, true)) });
R({ id: 'runicDome', name: '룬 돔', en: 'Runic Dome', rarity: 'boss', glyph: 'dome',
  desc: '에너지를 1 더 얻습니다. 적의 의도를 볼 수 없습니다.', energy: 1 });
R({ id: 'sozu', name: '소주', en: 'Sozu', rarity: 'boss', glyph: 'sozu',
  desc: '에너지를 1 더 얻습니다. 더 이상 물약을 얻을 수 없습니다.', energy: 1 });
R({ id: 'velvetChoker', name: '벨벳 초커', en: 'Velvet Choker', rarity: 'boss', glyph: 'choker',
  desc: '에너지를 1 더 얻습니다. 한 턴에 카드를 6장까지만 사용할 수 있습니다.', energy: 1 });
R({ id: 'snecko Eye', name: '스네코 눈', en: 'Snecko Eye', rarity: 'boss', glyph: 'snecko', id2: 'sneckoEye',
  desc: '카드를 2장 더 뽑습니다. 전투 시작 시 혼란 상태가 됩니다.',
  onBattleStart: (B) => B.addPower(B.player, 'confused', 1, B.player, true) });
R({ id: 'runicPyramid', name: '룬 피라미드', en: 'Runic Pyramid', rarity: 'boss', glyph: 'pyramid',
  desc: '턴이 끝날 때 손에 있는 카드를 버리지 않습니다.' });
R({ id: 'emptyCage', name: '빈 새장', en: 'Empty Cage', rarity: 'boss', glyph: 'cage',
  desc: '획득 시 덱에서 카드 2장을 제거합니다.' });
R({ id: 'sacredBark', name: '신성한 나무껍질', en: 'Sacred Bark', rarity: 'boss', glyph: 'bark',
  desc: '물약의 효과가 2배가 됩니다.' });
R({ id: 'slaversCollar', name: '노예상의 목줄', en: "Slaver's Collar", rarity: 'boss', glyph: 'collar',
  desc: '정예/보스 전투에서 에너지를 1 더 얻습니다.' });
R({ id: 'astrolabe', name: '아스트롤라베', en: 'Astrolabe', rarity: 'boss', glyph: 'astro',
  desc: '획득 시 무작위 카드 3장을 변환하고 강화합니다.' });
R({ id: 'tinyHouse', name: '작은 집', en: 'Tiny House', rarity: 'boss', glyph: 'house',
  desc: '획득 시 물약, 골드 50, 카드 보상, 카드 강화, 최대 체력 5를 얻습니다.' });

// 스네코 눈 id 정리
RELICS.sneckoEye = RELICS['snecko Eye'];
RELICS.sneckoEye.id = 'sneckoEye';
delete RELICS['snecko Eye'];

export const RELIC_POOLS = {
  common: Object.values(RELICS).filter((r) => r.rarity === 'common').map((r) => r.id),
  uncommon: Object.values(RELICS).filter((r) => r.rarity === 'uncommon').map((r) => r.id),
  rare: Object.values(RELICS).filter((r) => r.rarity === 'rare').map((r) => r.id),
  boss: Object.values(RELICS).filter((r) => r.rarity === 'boss').map((r) => r.id),
};
export const relic = (id) => RELICS[id];
