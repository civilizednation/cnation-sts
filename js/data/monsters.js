// ============================================================
//  몬스터 정의 : 체력 / 의도(Intent) / 행동 패턴(AI)
//  shape 는 three.js 절차적 모델 생성용 파라미터입니다.
// ============================================================
import { mk } from './carddb.js';

export const MONSTERS = {};
const M = (o) => { MONSTERS[o.id] = o; return o; };

// 의도 종류 : attack / attackDefend / attackDebuff / attackBuff / defend
//            defendBuff / defendDebuff / buff / debuff / strongDebuff
//            unknown / sleep / stun / escape / magic
const last = (s) => s.history[s.history.length - 1];
const lastN = (s, n, id) => s.history.slice(-n).every((h) => h === id);
const cnt = (s, n, id) => s.history.slice(-n).filter((h) => h === id).length;

// ================================================================
// 1막 - 일반 몬스터
// ================================================================
M({ id: 'jawWorm', name: '턱벌레', en: 'Jaw Worm', hp: [40, 44],
  shape: { body: 'worm', color: '#8b4a2b', color2: '#c97b4a', size: 1.0, eyes: 2, teeth: true },
  moves: {
    chomp: { name: '깨물기', intent: 'attack', dmg: 11, run: (B, s) => B.enemyAttack(s, 11) },
    thrash: { name: '몸부림', intent: 'attackDefend', dmg: 7, blk: 5, run: (B, s) => { B.enemyAttack(s, 7); B.gainBlock(s, 5); } },
    bellow: { name: '포효', intent: 'defendBuff', blk: 6, run: (B, s) => { B.addPower(s, 'strength', 3, s); B.gainBlock(s, 6); } },
  },
  ai: (B, s) => {
    if (!s.history.length) return 'chomp';
    const r = B.rng.next();
    if (r < 0.25) return last(s) === 'chomp' ? (B.rng.chance(0.5625) ? 'bellow' : 'thrash') : 'chomp';
    if (r < 0.55) return lastN(s, 2, 'thrash') ? (B.rng.chance(0.357) ? 'chomp' : 'bellow') : 'thrash';
    return last(s) === 'bellow' ? (B.rng.chance(0.416) ? 'chomp' : 'thrash') : 'bellow';
  } });

M({ id: 'cultist', name: '광신도', en: 'Cultist', hp: [48, 54],
  shape: { body: 'robe', color: '#6b3fa0', color2: '#e8c34a', size: 1.05, eyes: 2, horns: true },
  moves: {
    incantation: { name: '주문', intent: 'buff', run: (B, s) => B.addPower(s, 'ritual', s.ritualAmt || 3, s) },
    darkStrike: { name: '어둠의 일격', intent: 'attack', dmg: 6, run: (B, s) => B.enemyAttack(s, 6) },
  },
  ai: (B, s) => (s.history.length === 0 ? 'incantation' : 'darkStrike') });

M({ id: 'louseRed', name: '붉은 벌레', en: 'Red Louse', hp: [10, 15],
  shape: { body: 'louse', color: '#b83b3b', color2: '#f0a0a0', size: 0.7, eyes: 2 },
  init: (B, s) => { B.addPower(s, 'curlUp', B.rng.range(3, 7), s, true); s.biteDmg = B.rng.range(5, 7); },
  moves: {
    bite: { name: '물기', intent: 'attack', dyn: (s) => s.biteDmg, run: (B, s) => B.enemyAttack(s, s.biteDmg) },
    grow: { name: '성장', intent: 'buff', run: (B, s) => B.addPower(s, 'strength', 3, s) },
  },
  ai: (B, s) => (B.rng.chance(0.25) ? (lastN(s, 1, 'grow') ? 'bite' : 'grow') : (lastN(s, 2, 'bite') ? 'grow' : 'bite')) });

M({ id: 'louseGreen', name: '초록 벌레', en: 'Green Louse', hp: [11, 17],
  shape: { body: 'louse', color: '#4a8b3b', color2: '#a8e08a', size: 0.7, eyes: 2 },
  init: (B, s) => { B.addPower(s, 'curlUp', B.rng.range(3, 7), s, true); s.biteDmg = B.rng.range(5, 7); },
  moves: {
    bite: { name: '물기', intent: 'attack', dyn: (s) => s.biteDmg, run: (B, s) => B.enemyAttack(s, s.biteDmg) },
    web: { name: '거미줄 뱉기', intent: 'debuff', run: (B, s) => B.addPower(B.player, 'weak', 2, s) },
  },
  ai: (B, s) => (B.rng.chance(0.25) ? (lastN(s, 1, 'web') ? 'bite' : 'web') : (lastN(s, 2, 'bite') ? 'web' : 'bite')) });

M({ id: 'acidSlimeS', name: '작은 산성 슬라임', en: 'Acid Slime (S)', hp: [8, 12],
  shape: { body: 'slime', color: '#4f9b3a', color2: '#8fe06a', size: 0.6, eyes: 2 },
  moves: {
    tackle: { name: '태클', intent: 'attack', dmg: 3, run: (B, s) => B.enemyAttack(s, 3) },
    lick: { name: '핥기', intent: 'debuff', run: (B, s) => B.addPower(B.player, 'weak', 1, s) },
  },
  ai: (B, s) => (s.history.length ? (last(s) === 'lick' ? 'tackle' : 'lick') : (B.rng.chance(0.5) ? 'tackle' : 'lick')) });

M({ id: 'acidSlimeM', name: '중간 산성 슬라임', en: 'Acid Slime (M)', hp: [28, 32],
  shape: { body: 'slime', color: '#4f9b3a', color2: '#8fe06a', size: 0.95, eyes: 2 },
  moves: {
    spit: { name: '부식성 침', intent: 'attackDebuff', dmg: 7, run: (B, s) => { B.enemyAttack(s, 7); B.addCardToDiscard(mk('slimed')); } },
    tackle: { name: '태클', intent: 'attack', dmg: 10, run: (B, s) => B.enemyAttack(s, 10) },
    lick: { name: '핥기', intent: 'debuff', run: (B, s) => B.addPower(B.player, 'weak', 1, s) },
  },
  ai: (B, s) => {
    const r = B.rng.next();
    if (r < 0.3) return lastN(s, 2, 'spit') ? (B.rng.chance(0.5) ? 'tackle' : 'lick') : 'spit';
    if (r < 0.7) return lastN(s, 1, 'tackle') ? (B.rng.chance(0.4) ? 'spit' : 'lick') : 'tackle';
    return lastN(s, 2, 'lick') ? (B.rng.chance(0.4) ? 'spit' : 'tackle') : 'lick';
  } });

M({ id: 'acidSlimeL', name: '큰 산성 슬라임', en: 'Acid Slime (L)', hp: [65, 69],
  shape: { body: 'slime', color: '#3f8b2a', color2: '#7fd05a', size: 1.45, eyes: 2 },
  splitInto: ['acidSlimeM', 'acidSlimeM'],
  moves: {
    spit: { name: '부식성 침', intent: 'attackDebuff', dmg: 11, run: (B, s) => { B.enemyAttack(s, 11); B.addCardToDiscard(mk('slimed')); B.addCardToDiscard(mk('slimed')); } },
    tackle: { name: '태클', intent: 'attack', dmg: 16, run: (B, s) => B.enemyAttack(s, 16) },
    lick: { name: '핥기', intent: 'debuff', run: (B, s) => B.addPower(B.player, 'weak', 2, s) },
    split: { name: '분열', intent: 'unknown', run: (B, s) => B.splitEnemy(s) },
  },
  ai: (B, s) => {
    if (s.hp <= s.maxHp / 2 && !s.didSplit) return 'split';
    const r = B.rng.next();
    if (r < 0.3) return lastN(s, 2, 'spit') ? (B.rng.chance(0.5) ? 'tackle' : 'lick') : 'spit';
    if (r < 0.7) return lastN(s, 1, 'tackle') ? (B.rng.chance(0.4) ? 'spit' : 'lick') : 'tackle';
    return lastN(s, 2, 'lick') ? (B.rng.chance(0.4) ? 'spit' : 'tackle') : 'lick';
  } });

M({ id: 'spikeSlimeS', name: '작은 가시 슬라임', en: 'Spike Slime (S)', hp: [10, 14],
  shape: { body: 'slime', color: '#9b7a3a', color2: '#e0c06a', size: 0.6, spikes: true, eyes: 1 },
  moves: { tackle: { name: '태클', intent: 'attack', dmg: 5, run: (B, s) => B.enemyAttack(s, 5) } },
  ai: () => 'tackle' });

M({ id: 'spikeSlimeM', name: '중간 가시 슬라임', en: 'Spike Slime (M)', hp: [28, 32],
  shape: { body: 'slime', color: '#9b7a3a', color2: '#e0c06a', size: 0.95, spikes: true, eyes: 1 },
  moves: {
    flame: { name: '화염 태클', intent: 'attackDebuff', dmg: 8, run: (B, s) => { B.enemyAttack(s, 8); B.addCardToDiscard(mk('slimed')); } },
    lick: { name: '핥기', intent: 'debuff', run: (B, s) => B.addPower(B.player, 'frail', 1, s) },
  },
  ai: (B, s) => (B.rng.chance(0.3) ? (lastN(s, 1, 'lick') ? 'flame' : 'lick') : (lastN(s, 2, 'flame') ? 'lick' : 'flame')) });

M({ id: 'spikeSlimeL', name: '큰 가시 슬라임', en: 'Spike Slime (L)', hp: [64, 70],
  shape: { body: 'slime', color: '#8b6a2a', color2: '#d0b05a', size: 1.45, spikes: true, eyes: 1 },
  splitInto: ['spikeSlimeM', 'spikeSlimeM'],
  moves: {
    flame: { name: '화염 태클', intent: 'attackDebuff', dmg: 16, run: (B, s) => { B.enemyAttack(s, 16); B.addCardToDiscard(mk('slimed')); B.addCardToDiscard(mk('slimed')); } },
    lick: { name: '핥기', intent: 'debuff', run: (B, s) => B.addPower(B.player, 'frail', 2, s) },
    split: { name: '분열', intent: 'unknown', run: (B, s) => B.splitEnemy(s) },
  },
  ai: (B, s) => {
    if (s.hp <= s.maxHp / 2 && !s.didSplit) return 'split';
    return B.rng.chance(0.3) ? (lastN(s, 1, 'lick') ? 'flame' : 'lick') : (lastN(s, 2, 'flame') ? 'lick' : 'flame');
  } });

M({ id: 'fungiBeast', name: '균사 야수', en: 'Fungi Beast', hp: [22, 28],
  shape: { body: 'fungus', color: '#7a5aa0', color2: '#c0a0e0', size: 0.9, eyes: 2 },
  init: (B, s) => B.addPower(s, 'spore', 2, s, true),
  moves: {
    bite: { name: '물기', intent: 'attack', dmg: 6, run: (B, s) => B.enemyAttack(s, 6) },
    grow: { name: '성장', intent: 'buff', run: (B, s) => B.addPower(s, 'strength', 3, s) },
  },
  ai: (B, s) => (B.rng.chance(0.6) ? (lastN(s, 2, 'bite') ? 'grow' : 'bite') : (lastN(s, 1, 'grow') ? 'bite' : 'grow')) });

M({ id: 'gremlinMad', name: '미친 그렘린', en: 'Mad Gremlin', hp: [20, 24],
  shape: { body: 'gremlin', color: '#b8503b', color2: '#f0c08a', size: 0.75, eyes: 2, horns: true },
  init: (B, s) => B.addPower(s, 'angry', 1, s, true),
  moves: { scratch: { name: '할퀴기', intent: 'attack', dmg: 4, run: (B, s) => B.enemyAttack(s, 4) } },
  ai: () => 'scratch' });

M({ id: 'gremlinSneaky', name: '교활한 그렘린', en: 'Sneaky Gremlin', hp: [10, 14],
  shape: { body: 'gremlin', color: '#3b8b6b', color2: '#8ad0b0', size: 0.7, eyes: 2 },
  moves: { puncture: { name: '찌르기', intent: 'attack', dmg: 9, run: (B, s) => B.enemyAttack(s, 9) } },
  ai: () => 'puncture' });

M({ id: 'gremlinFat', name: '뚱뚱한 그렘린', en: 'Fat Gremlin', hp: [13, 17],
  shape: { body: 'gremlin', color: '#7a7a3b', color2: '#d0d08a', size: 0.95, eyes: 2, fat: true },
  moves: {
    blabber: { name: '수다', intent: 'attackDebuff', dmg: 4, run: (B, s) => { B.enemyAttack(s, 4); B.addPower(B.player, 'weak', 1, s); B.addPower(B.player, 'frail', 1, s); } },
  },
  ai: () => 'blabber' });

M({ id: 'gremlinShield', name: '방패 그렘린', en: 'Shield Gremlin', hp: [12, 15],
  shape: { body: 'gremlin', color: '#5a6b9b', color2: '#a0b8e0', size: 0.8, eyes: 2, shield: true },
  moves: {
    protect: { name: '보호', intent: 'defend', blk: 7, run: (B, s) => { const o = B.living().filter((e) => e !== s); B.gainBlock(o.length ? B.rng.pick(o) : s, 7); } },
    bash: { name: '방패 강타', intent: 'attack', dmg: 6, run: (B, s) => B.enemyAttack(s, 6) },
  },
  ai: (B, s) => (B.living().filter((e) => e !== s).length ? 'protect' : 'bash') });

M({ id: 'gremlinWizard', name: '그렘린 마법사', en: 'Gremlin Wizard', hp: [21, 25],
  shape: { body: 'gremlin', color: '#8b3b8b', color2: '#e08ae0', size: 0.8, eyes: 2, hat: true },
  moves: {
    charge: { name: '충전', intent: 'unknown', run: () => {} },
    blast: { name: '궁극의 폭발', intent: 'attack', dmg: 25, run: (B, s) => B.enemyAttack(s, 25) },
  },
  ai: (B, s) => { s.charge = (s.charge || 0) + 1; return s.charge % 4 === 0 ? 'blast' : 'charge'; } });

M({ id: 'slaverBlue', name: '파란 노예상', en: 'Blue Slaver', hp: [46, 50],
  shape: { body: 'humanoid', color: '#3b5a9b', color2: '#c0a070', size: 1.0, eyes: 2, weapon: 'whip' },
  moves: {
    stab: { name: '찌르기', intent: 'attack', dmg: 12, run: (B, s) => B.enemyAttack(s, 12) },
    rake: { name: '긁기', intent: 'attackDebuff', dmg: 7, run: (B, s) => { B.enemyAttack(s, 7); B.addPower(B.player, 'weak', 1, s); } },
  },
  ai: (B, s) => (B.rng.chance(0.4) && !lastN(s, 2, 'rake') ? 'rake' : (lastN(s, 2, 'stab') ? 'rake' : 'stab')) });

M({ id: 'slaverRed', name: '붉은 노예상', en: 'Red Slaver', hp: [46, 50],
  shape: { body: 'humanoid', color: '#9b3b3b', color2: '#c0a070', size: 1.0, eyes: 2, weapon: 'whip' },
  moves: {
    stab: { name: '찌르기', intent: 'attack', dmg: 13, run: (B, s) => B.enemyAttack(s, 13) },
    scrape: { name: '할퀴기', intent: 'attackDebuff', dmg: 8, run: (B, s) => { B.enemyAttack(s, 8); B.addPower(B.player, 'vulnerable', 1, s); } },
    entangle: { name: '휘감기', intent: 'strongDebuff', run: (B, s) => { B.addPower(B.player, 'entangled', 1, s); s.usedEntangle = true; } },
  },
  ai: (B, s) => {
    if (!s.history.length) return 'stab';
    if (!s.usedEntangle && B.rng.chance(0.25)) return 'entangle';
    if (B.rng.chance(0.55) && !lastN(s, 2, 'scrape')) return 'scrape';
    return lastN(s, 2, 'stab') ? 'scrape' : 'stab';
  } });

M({ id: 'looter', name: '약탈자', en: 'Looter', hp: [44, 48],
  shape: { body: 'humanoid', color: '#6b6b3b', color2: '#d0c080', size: 0.95, eyes: 2, mask: true },
  moves: {
    mug: { name: '강도질', intent: 'attack', dmg: 10, run: (B, s) => { B.enemyAttack(s, 10); B.stealGold(s, 15); } },
    lunge: { name: '돌진', intent: 'attack', dmg: 12, run: (B, s) => { B.enemyAttack(s, 12); B.stealGold(s, 15); } },
    smoke: { name: '연막탄', intent: 'defend', blk: 6, run: (B, s) => B.gainBlock(s, 6) },
    escape: { name: '도주', intent: 'escape', run: (B, s) => B.fleeEnemy(s) },
  },
  ai: (B, s) => {
    const n = s.history.length;
    if (n < 2) return 'mug';
    if (n === 2) return B.rng.chance(0.5) ? 'lunge' : 'smoke';
    if (last(s) === 'smoke') return 'escape';
    if (last(s) === 'lunge') return 'smoke';
    return 'escape';
  } });

M({ id: 'sentry', name: '파수병', en: 'Sentry', hp: [38, 42],
  shape: { body: 'construct', color: '#5a5a7a', color2: '#c0e0ff', size: 1.05, eyes: 1, floating: true },
  init: (B, s) => B.addPower(s, 'artifact', 1, s, true),
  moves: {
    beam: { name: '광선', intent: 'attack', dmg: 9, run: (B, s) => B.enemyAttack(s, 9) },
    bolt: { name: '볼트', intent: 'debuff', run: (B) => { B.addCardToDiscard(mk('dazed')); B.addCardToDiscard(mk('dazed')); } },
  },
  ai: (B, s) => { s.alt = !s.alt; return (s.idx % 2 === 1 ? !s.alt : s.alt) ? 'bolt' : 'beam'; } });

// ================================================================
// 1막 - 정예
// ================================================================
M({ id: 'gremlinNob', name: '그렘린 귀족', en: 'Gremlin Nob', hp: [82, 86], kind: 'elite',
  shape: { body: 'brute', color: '#b85a3b', color2: '#f0c08a', size: 1.5, eyes: 2, horns: true },
  moves: {
    bellow: { name: '포효', intent: 'buff', run: (B, s) => B.addPower(s, 'enrage', 2, s) },
    rush: { name: '돌격', intent: 'attack', dmg: 14, run: (B, s) => B.enemyAttack(s, 14) },
    skullBash: { name: '해골 강타', intent: 'attackDebuff', dmg: 6, run: (B, s) => { B.enemyAttack(s, 6); B.addPower(B.player, 'vulnerable', 2, s); } },
  },
  ai: (B, s) => {
    if (!s.history.length) return 'bellow';
    if (B.rng.chance(0.33)) return 'skullBash';
    return lastN(s, 2, 'rush') ? 'skullBash' : 'rush';
  } });

M({ id: 'lagavulin', name: '라가불린', en: 'Lagavulin', hp: [109, 111], kind: 'elite',
  shape: { body: 'shell', color: '#3b4a6b', color2: '#7a90c0', size: 1.5, eyes: 2, asleep: true },
  init: (B, s) => { B.addPower(s, 'metallicize', 8, s, true); s.asleep = true; },
  moves: {
    sleep: { name: '수면', intent: 'sleep', run: () => {} },
    attack: { name: '강타', intent: 'attack', dmg: 18, run: (B, s) => B.enemyAttack(s, 18) },
    siphon: { name: '영혼 흡수', intent: 'debuff', run: (B, s) => { B.addPower(B.player, 'strength', -1, s); B.addPower(B.player, 'dexterity', -1, s); } },
  },
  ai: (B, s) => {
    if (s.asleep) {
      s.sleepTurns = (s.sleepTurns || 0) + 1;
      if (s.sleepTurns <= 3) return 'sleep';
      s.asleep = false; B.removePower(s, 'metallicize');
    }
    const n = s.history.filter((h) => h !== 'sleep').length;
    return n % 3 === 2 ? 'siphon' : 'attack';
  },
  onDamaged: (B, s) => { if (s.asleep) { s.asleep = false; B.removePower(s, 'metallicize'); } } });

// ================================================================
// 1막 - 보스
// ================================================================
M({ id: 'theGuardian', name: '수호자', en: 'The Guardian', hp: [240, 240], kind: 'boss',
  shape: { body: 'guardian', color: '#4a6b8b', color2: '#e0c060', size: 1.9, eyes: 1 },
  init: (B, s) => { B.addPower(s, 'modeShift', 30, s, true); s.mode = 'off'; s.shiftDmg = 30; },
  moves: {
    charge: { name: '충전', intent: 'defend', blk: 9, run: (B, s) => B.gainBlock(s, 9) },
    bash: { name: '맹렬한 강타', intent: 'attack', dmg: 32, run: (B, s) => B.enemyAttack(s, 32) },
    vent: { name: '증기 분출', intent: 'strongDebuff', run: (B, s) => { B.addPower(B.player, 'vulnerable', 2, s); B.addPower(B.player, 'weak', 2, s); } },
    whirl: { name: '회오리', intent: 'attack', dmg: 5, hits: 4, run: (B, s) => B.enemyAttack(s, 5, 4) },
    defensive: { name: '방어 형태', intent: 'buff', run: (B, s) => B.addPower(s, 'sharpHide', 3, s) },
    roll: { name: '구르기 공격', intent: 'attack', dmg: 9, run: (B, s) => B.enemyAttack(s, 9) },
    twinSlam: { name: '쌍둥이 강타', intent: 'attack', dmg: 8, hits: 2,
      run: (B, s) => { B.enemyAttack(s, 8, 2); s.mode = 'off'; B.removePower(s, 'sharpHide'); s.shiftDmg += 10; B.addPower(s, 'modeShift', s.shiftDmg, s, true); s.seq = 0; } },
  },
  ai: (B, s) => {
    if (s.mode === 'def') {
      s.seq = (s.seq || 0) + 1;
      if (s.seq === 1) return 'roll';
      return 'twinSlam';
    }
    const order = ['charge', 'bash', 'vent', 'whirl'];
    s.off = (s.off || 0);
    const mv = order[s.off % 4];
    s.off++;
    return mv;
  },
  onDamaged: (B, s, amount) => {
    if (s.mode === 'def') return;
    const cur = B.pow(s, 'modeShift') - amount;
    if (cur <= 0) {
      B.removePower(s, 'modeShift');
      s.mode = 'def'; s.seq = 0;
      B.addPower(s, 'sharpHide', 3, s);
      B.setIntentNow(s, 'defensive');
    } else B.setPower(s, 'modeShift', cur);
  } });

M({ id: 'hexaghost', name: '육각유령', en: 'Hexaghost', hp: [250, 250], kind: 'boss',
  shape: { body: 'ghost', color: '#e07a3a', color2: '#ffd070', size: 1.8, eyes: 6, floating: true },
  moves: {
    activate: { name: '활성화', intent: 'unknown', run: () => {} },
    divider: { name: '분할', intent: 'attack', hits: 6, dyn: (s, B) => Math.floor(B.player.hp / 12) + 1,
      run: (B, s) => B.enemyAttack(s, Math.floor(B.player.hp / 12) + 1, 6) },
    sear: { name: '태우기', intent: 'attackDebuff', dmg: 6, run: (B, s) => { B.enemyAttack(s, 6); const n = s.upgradedBurn ? 2 : 1; for (let i = 0; i < n; i++) B.addCardToDiscard(mk('burn')); } },
    tackle: { name: '태클', intent: 'attack', dmg: 5, hits: 2, run: (B, s) => B.enemyAttack(s, 5, 2) },
    inferno: { name: '지옥불', intent: 'attackDebuff', dmg: 2, hits: 6,
      run: (B, s) => { B.enemyAttack(s, 2, 6); for (let i = 0; i < 3; i++) B.addCardToDiscard(mk('burn')); s.upgradedBurn = true; B.upgradeAllBurns(); } },
    inflame: { name: '불꽃 강화', intent: 'defendBuff', blk: 12, run: (B, s) => { B.addPower(s, 'strength', 2, s); B.gainBlock(s, 12); } },
  },
  ai: (B, s) => {
    const seq = ['divider', 'sear', 'tackle', 'sear', 'inferno', 'tackle', 'sear', 'inferno'];
    if (!s.history.length) return 'activate';
    s.i = (s.i === undefined ? 0 : s.i + 1);
    if (s.i >= seq.length) s.i = 1;
    return seq[s.i];
  } });

M({ id: 'slimeBoss', name: '슬라임 보스', en: 'Slime Boss', hp: [140, 140], kind: 'boss',
  shape: { body: 'slime', color: '#2f7b2a', color2: '#7fd05a', size: 2.2, eyes: 2, king: true },
  splitInto: ['acidSlimeL', 'spikeSlimeL'],
  moves: {
    goop: { name: '점액 분사', intent: 'debuff', run: (B) => { for (let i = 0; i < 5; i++) B.addCardToDiscard(mk('slimed')); } },
    prepare: { name: '준비', intent: 'unknown', run: () => {} },
    slam: { name: '내리찍기', intent: 'attack', dmg: 35, run: (B, s) => B.enemyAttack(s, 35) },
    split: { name: '분열', intent: 'unknown', run: (B, s) => B.splitEnemy(s, true) },
  },
  ai: (B, s) => {
    if (s.hp <= s.maxHp / 2 && !s.didSplit) return 'split';
    const seq = ['goop', 'prepare', 'slam'];
    s.i = (s.i === undefined ? 0 : (s.i + 1) % 3);
    return seq[s.i];
  } });

// ================================================================
// 2막 - 일반 몬스터
// ================================================================
M({ id: 'byrd', name: '새', en: 'Byrd', hp: [25, 31],
  shape: { body: 'bird', color: '#c8b040', color2: '#f0e0a0', size: 0.85, eyes: 2, wings: true, floating: true },
  init: (B, s) => B.addPower(s, 'flight', 3, s, true),
  moves: {
    peck: { name: '쪼기', intent: 'attack', dmg: 1, hits: 5, run: (B, s) => B.enemyAttack(s, 1, 5) },
    swoop: { name: '급강하', intent: 'attack', dmg: 12, run: (B, s) => B.enemyAttack(s, 12) },
    caw: { name: '까악', intent: 'buff', run: (B, s) => B.addPower(s, 'strength', 1, s) },
    fly: { name: '날아오르기', intent: 'buff', run: (B, s) => { B.addPower(s, 'flight', 3, s); s.grounded = false; } },
    headbutt: { name: '박치기', intent: 'attack', dmg: 3, run: (B, s) => B.enemyAttack(s, 3) },
  },
  ai: (B, s) => {
    if (s.grounded) { if (last(s) === 'headbutt') return 'fly'; return 'headbutt'; }
    const r = B.rng.next();
    if (r < 0.5) return lastN(s, 2, 'peck') ? 'swoop' : 'peck';
    if (r < 0.8) return 'swoop';
    return 'caw';
  },
  onFlightBroken: (B, s) => { s.grounded = true; } });

M({ id: 'chosen', name: '선택받은 자', en: 'Chosen', hp: [95, 99],
  shape: { body: 'robe', color: '#4a3b7a', color2: '#c0a0e0', size: 1.1, eyes: 2, staff: true },
  moves: {
    poke: { name: '찌르기', intent: 'attack', dmg: 5, hits: 2, run: (B, s) => B.enemyAttack(s, 5, 2) },
    zap: { name: '전격', intent: 'attack', dmg: 18, run: (B, s) => B.enemyAttack(s, 18) },
    debilitate: { name: '쇠약', intent: 'attackDebuff', dmg: 10, run: (B, s) => { B.enemyAttack(s, 10); B.addPower(B.player, 'vulnerable', 2, s); } },
    drainLife: { name: '생명 흡수', intent: 'attackDebuff', dmg: 12, run: (B, s) => { B.enemyAttack(s, 12); B.addPower(B.player, 'strength', -1, s); } },
    hexMove: { name: '저주', intent: 'strongDebuff', run: (B, s) => B.addPower(B.player, 'hex', 1, s) },
  },
  ai: (B, s) => {
    if (!s.history.length) return 'hexMove';
    if (s.history.length === 1) return 'poke';
    const r = B.rng.next();
    if (r < 0.4 && !lastN(s, 2, 'zap')) return 'zap';
    if (r < 0.7 && !lastN(s, 2, 'debilitate')) return 'debilitate';
    if (!lastN(s, 2, 'drainLife')) return 'drainLife';
    return 'poke';
  } });

M({ id: 'shelledParasite', name: '껍질 기생충', en: 'Shelled Parasite', hp: [68, 72],
  shape: { body: 'shell', color: '#8b5a3b', color2: '#d0a070', size: 1.2, eyes: 3 },
  init: (B, s) => B.addPower(s, 'plated', 14, s, true),
  moves: {
    doubleStrike: { name: '이중 타격', intent: 'attack', dmg: 6, hits: 2, run: (B, s) => B.enemyAttack(s, 6, 2) },
    suck: { name: '흡혈', intent: 'attack', dmg: 10, run: (B, s) => { const d = B.enemyAttack(s, 10); B.heal(s, d); } },
    fell: { name: '베어넘기기', intent: 'attackDebuff', dmg: 18, run: (B, s) => { B.enemyAttack(s, 18); B.addPower(B.player, 'frail', 2, s); } },
    stunned: { name: '기절', intent: 'stun', run: () => {} },
  },
  ai: (B, s) => {
    const r = B.rng.next();
    if (r < 0.2 && !lastN(s, 2, 'fell')) return 'fell';
    if (r < 0.6 && !lastN(s, 2, 'doubleStrike')) return 'doubleStrike';
    return lastN(s, 2, 'suck') ? 'doubleStrike' : 'suck';
  } });

M({ id: 'sphericGuardian', name: '구체 수호자', en: 'Spheric Guardian', hp: [20, 20],
  shape: { body: 'orb', color: '#7a8b9b', color2: '#d0e0f0', size: 1.1, eyes: 1, floating: true },
  init: (B, s) => { B.addPower(s, 'barricade', 1, s, true); B.addPower(s, 'artifact', 3, s, true); B.gainBlock(s, 40); },
  moves: {
    slam: { name: '강타', intent: 'attack', dmg: 10, hits: 2, run: (B, s) => B.enemyAttack(s, 10, 2) },
    activate: { name: '활성화', intent: 'defendBuff', blk: 25, run: (B, s) => { B.gainBlock(s, 25); B.addPower(s, 'strength', 1, s); } },
    harden: { name: '경화', intent: 'attackDefend', dmg: 10, blk: 15, run: (B, s) => { B.enemyAttack(s, 10); B.gainBlock(s, 15); } },
    attackDebuff: { name: '속박', intent: 'attackDebuff', dmg: 10, run: (B, s) => { B.enemyAttack(s, 10); B.addPower(B.player, 'frail', 5, s); } },
  },
  ai: (B, s) => {
    const n = s.history.length;
    if (n === 0) return 'activate';
    if (n === 1) return 'attackDebuff';
    return B.rng.chance(0.5) ? 'slam' : 'harden';
  } });

M({ id: 'snecko', name: '스네코', en: 'Snecko', hp: [114, 120],
  shape: { body: 'snake', color: '#5a8b4a', color2: '#c0e090', size: 1.6, eyes: 2 },
  moves: {
    glare: { name: '혼란의 시선', intent: 'strongDebuff', run: (B, s) => B.addPower(B.player, 'confused', 1, s) },
    bite: { name: '물기', intent: 'attack', dmg: 15, run: (B, s) => B.enemyAttack(s, 15) },
    tail: { name: '꼬리 치기', intent: 'attackDebuff', dmg: 8, run: (B, s) => { B.enemyAttack(s, 8); B.addPower(B.player, 'vulnerable', 2, s); } },
  },
  ai: (B, s) => {
    if (!s.history.length) return 'glare';
    if (B.rng.chance(0.4) && !lastN(s, 2, 'tail')) return 'tail';
    return lastN(s, 3, 'bite') ? 'tail' : 'bite';
  } });

M({ id: 'snakePlant', name: '뱀 식물', en: 'Snake Plant', hp: [75, 79],
  shape: { body: 'plant', color: '#3b7a4a', color2: '#90d070', size: 1.3, eyes: 2 },
  init: (B, s) => B.addPower(s, 'malleable', 3, s, true),
  moves: {
    chomp: { name: '깨물기', intent: 'attack', dmg: 7, hits: 3, run: (B, s) => B.enemyAttack(s, 7, 3) },
    spores: { name: '쇠약 포자', intent: 'strongDebuff', run: (B, s) => { B.addPower(B.player, 'weak', 2, s); B.addPower(B.player, 'frail', 2, s); } },
  },
  ai: (B, s) => (cnt(s, 2, 'chomp') >= 2 ? 'spores' : (lastN(s, 1, 'spores') ? 'chomp' : (B.rng.chance(0.65) ? 'chomp' : 'spores'))) });

M({ id: 'centurion', name: '백부장', en: 'Centurion', hp: [76, 80],
  shape: { body: 'humanoid', color: '#9b8b3b', color2: '#e0d090', size: 1.25, eyes: 2, weapon: 'sword' },
  moves: {
    slash: { name: '베기', intent: 'attack', dmg: 12, run: (B, s) => B.enemyAttack(s, 12) },
    fury: { name: '분노', intent: 'attack', dmg: 6, hits: 3, run: (B, s) => B.enemyAttack(s, 6, 3) },
    defend: { name: '방어', intent: 'defend', blk: 15, run: (B, s) => { B.gainBlock(s, 15); const o = B.living().find((e) => e.mid === 'mystic'); if (o) B.gainBlock(o, 15); } },
  },
  ai: (B, s) => {
    if (!s.history.length) return 'slash';
    if (last(s) === 'defend') return B.rng.chance(0.65) ? 'slash' : 'fury';
    return B.rng.chance(0.5) ? 'defend' : (B.rng.chance(0.5) ? 'slash' : 'fury');
  } });

M({ id: 'mystic', name: '신비술사', en: 'Mystic', hp: [48, 56],
  shape: { body: 'robe', color: '#3b8b8b', color2: '#a0e0e0', size: 1.0, eyes: 2, staff: true },
  moves: {
    heal: { name: '치유', intent: 'buff', run: (B, s) => B.living().forEach((e) => B.heal(e, 16)) },
    buff: { name: '축복', intent: 'buff', run: (B, s) => B.living().forEach((e) => B.addPower(e, 'strength', 2, s)) },
    attackDebuff: { name: '주문 공격', intent: 'attackDebuff', dmg: 13, run: (B, s) => { B.enemyAttack(s, 13); B.addPower(B.player, 'frail', 2, s); } },
  },
  ai: (B, s) => {
    if (!s.history.length) return 'heal';
    if (B.living().some((e) => e.hp < e.maxHp * 0.5) && !lastN(s, 1, 'heal')) return 'heal';
    if (B.rng.chance(0.4) && !lastN(s, 2, 'buff')) return 'buff';
    return 'attackDebuff';
  } });

// ================================================================
// 2막 - 정예
// ================================================================
M({ id: 'gremlinLeader', name: '그렘린 대장', en: 'Gremlin Leader', hp: [140, 148], kind: 'elite',
  shape: { body: 'brute', color: '#9b3b6b', color2: '#f0a0c0', size: 1.5, eyes: 2, horns: true },
  moves: {
    rally: { name: '집결', intent: 'unknown', run: (B, s) => B.summonGremlins(s, 2) },
    encourage: { name: '격려', intent: 'defendBuff', blk: 6, run: (B, s) => { B.living().forEach((e) => { B.addPower(e, 'strength', 3, s); if (e !== s) B.gainBlock(e, 6); }); } },
    stab: { name: '난도질', intent: 'attack', dmg: 6, hits: 3, run: (B, s) => B.enemyAttack(s, 6, 3) },
  },
  ai: (B, s) => {
    const minions = B.living().filter((e) => e !== s).length;
    if (minions === 0) return B.rng.chance(0.75) ? 'rally' : 'stab';
    if (minions === 1) return B.rng.chance(0.5) ? 'rally' : (B.rng.chance(0.6) ? 'encourage' : 'stab');
    return B.rng.chance(0.66) ? 'encourage' : 'stab';
  } });

M({ id: 'bookOfStabbing', name: '찌르기의 책', en: 'Book of Stabbing', hp: [160, 162], kind: 'elite',
  shape: { body: 'book', color: '#7a2a2a', color2: '#e0c090', size: 1.5, eyes: 1 },
  init: (B, s) => { B.addPower(s, 'painfulStabs', 1, s, true); s.stabs = 1; },
  moves: {
    multiStab: { name: '연속 찌르기', intent: 'attack', dmg: 6, dynHits: (s) => s.stabs + 1,
      run: (B, s) => { B.enemyAttack(s, 6, s.stabs + 1); s.stabs++; } },
    singleStab: { name: '단일 찌르기', intent: 'attack', dmg: 21, run: (B, s) => B.enemyAttack(s, 21) },
  },
  ai: (B, s) => (B.rng.chance(0.15) && !lastN(s, 2, 'singleStab') ? 'singleStab' : 'multiStab') });

M({ id: 'taskmaster', name: '작업반장', en: 'Taskmaster', hp: [54, 60], kind: 'elite',
  shape: { body: 'humanoid', color: '#8b3b3b', color2: '#e0b070', size: 1.15, eyes: 2, weapon: 'whip' },
  moves: {
    scouringWhip: { name: '채찍질', intent: 'attackDebuff', dmg: 7,
      run: (B, s) => { B.enemyAttack(s, 7); const n = 1 + (s.wounds || 0); for (let i = 0; i < n; i++) B.addCardToDiscard(mk('wound')); s.wounds = (s.wounds || 0); } },
  },
  ai: () => 'scouringWhip' });

// ================================================================
// 2막 - 보스
// ================================================================
M({ id: 'bronzeAutomaton', name: '청동 자동인형', en: 'Bronze Automaton', hp: [300, 300], kind: 'boss',
  shape: { body: 'construct', color: '#b8863b', color2: '#f0d090', size: 2.0, eyes: 1 },
  init: (B, s) => B.addPower(s, 'artifact', 3, s, true),
  moves: {
    spawn: { name: '구체 소환', intent: 'unknown', run: (B, s) => B.summon(s, ['bronzeOrb', 'bronzeOrb']) },
    flail: { name: '도리깨질', intent: 'attack', dmg: 7, hits: 2, run: (B, s) => B.enemyAttack(s, 7, 2) },
    boost: { name: '강화', intent: 'defendBuff', blk: 9, run: (B, s) => { B.addPower(s, 'strength', 3, s); B.gainBlock(s, 9); } },
    hyperBeam: { name: '초강력 광선', intent: 'attack', dmg: 45, run: (B, s) => B.enemyAttack(s, 45) },
    stunned: { name: '기절', intent: 'stun', run: () => {} },
  },
  ai: (B, s) => {
    if (!s.history.length) return 'spawn';
    if (last(s) === 'hyperBeam') return 'stunned';
    s.c = (s.c || 0) + 1;
    if (s.c % 4 === 0) return 'hyperBeam';
    return s.c % 2 === 1 ? 'boost' : 'flail';
  } });

M({ id: 'bronzeOrb', name: '청동 구체', en: 'Bronze Orb', hp: [52, 58], minion: true,
  shape: { body: 'orb', color: '#c8a050', color2: '#fff0b0', size: 0.8, eyes: 1, floating: true },
  moves: {
    beam: { name: '광선', intent: 'attack', dmg: 8, run: (B, s) => B.enemyAttack(s, 8) },
    support: { name: '지원 광선', intent: 'defend', blk: 12, run: (B, s) => { const o = B.living().find((e) => e.mid === 'bronzeAutomaton'); B.gainBlock(o || s, 12); } },
    stasis: { name: '정체', intent: 'strongDebuff', run: (B, s) => B.stealCard(s) },
  },
  ai: (B, s) => {
    if (!s.history.length) return 'beam';
    if (s.history.length === 1 && B.rng.chance(0.5)) return 'stasis';
    return B.rng.chance(0.6) ? 'beam' : 'support';
  } });

M({ id: 'theChamp', name: '챔피언', en: 'The Champ', hp: [420, 420], kind: 'boss',
  shape: { body: 'brute', color: '#8b6b3b', color2: '#e0c060', size: 2.1, eyes: 2, weapon: 'axe' },
  moves: {
    heavySlash: { name: '강력한 베기', intent: 'attack', dmg: 16, run: (B, s) => B.enemyAttack(s, 16) },
    defensive: { name: '방어 태세', intent: 'defendBuff', blk: 15, run: (B, s) => { B.gainBlock(s, 15); B.addPower(s, 'metallicize', 5, s); } },
    execute: { name: '처형', intent: 'attack', dmg: 10, hits: 2, run: (B, s) => B.enemyAttack(s, 10, 2) },
    faceSlap: { name: '따귀', intent: 'attackDebuff', dmg: 12, run: (B, s) => { B.enemyAttack(s, 12); B.addPower(B.player, 'frail', 2, s); B.addPower(B.player, 'vulnerable', 2, s); } },
    gloat: { name: '뽐내기', intent: 'buff', run: (B, s) => B.addPower(s, 'strength', 3, s) },
    taunt: { name: '도발', intent: 'strongDebuff', run: (B, s) => { B.addPower(B.player, 'weak', 2, s); B.addPower(B.player, 'vulnerable', 2, s); } },
    anger: { name: '분노 폭발', intent: 'buff', run: (B, s) => { B.addPower(s, 'strength', 6, s); B.clearDebuffs(s); } },
  },
  ai: (B, s) => {
    if (s.hp <= s.maxHp / 2 && !s.angered) { s.angered = true; return 'anger'; }
    s.c = (s.c || 0) + 1;
    if (s.c % 4 === 0) return 'defensive';
    const r = B.rng.next();
    if (r < 0.15) return 'gloat';
    if (r < 0.3) return 'taunt';
    if (r < 0.5 && !lastN(s, 2, 'faceSlap')) return 'faceSlap';
    if (r < 0.75) return 'execute';
    return 'heavySlash';
  } });

M({ id: 'theCollector', name: '수집가', en: 'The Collector', hp: [282, 282], kind: 'boss',
  shape: { body: 'ghost', color: '#8b3b6b', color2: '#f0b0d0', size: 2.0, eyes: 2, crown: true, floating: true },
  moves: {
    spawn: { name: '소환', intent: 'unknown', run: (B, s) => B.summon(s, ['torchHead', 'torchHead']) },
    fireball: { name: '화염구', intent: 'attack', dmg: 18, run: (B, s) => B.enemyAttack(s, 18) },
    buff: { name: '강화', intent: 'defendBuff', blk: 15, run: (B, s) => { B.addPower(s, 'strength', 3, s); B.gainBlock(s, 15); } },
    megaDebuff: { name: '대형 약화', intent: 'strongDebuff', run: (B, s) => { B.addPower(B.player, 'weak', 3, s); B.addPower(B.player, 'frail', 3, s); B.addPower(B.player, 'vulnerable', 3, s); } },
  },
  ai: (B, s) => {
    const n = s.history.length;
    if (n === 0) return 'spawn';
    if (n === 3) return 'megaDebuff';
    if (B.living().filter((e) => e !== s).length === 0 && B.rng.chance(0.6)) return 'spawn';
    return B.rng.chance(0.35) ? 'buff' : 'fireball';
  } });

M({ id: 'torchHead', name: '횃불 머리', en: 'Torch Head', hp: [38, 40], minion: true,
  shape: { body: 'ghost', color: '#e07a3a', color2: '#ffd070', size: 0.75, eyes: 1, floating: true },
  moves: { tackle: { name: '태클', intent: 'attack', dmg: 7, run: (B, s) => B.enemyAttack(s, 7) } },
  ai: () => 'tackle' });

// ================================================================
// 3막 - 일반 몬스터
// ================================================================
M({ id: 'darkling', name: '어둠의 자손', en: 'Darkling', hp: [48, 56],
  shape: { body: 'blob', color: '#2a2a4a', color2: '#7a5ac0', size: 1.1, eyes: 3 },
  moves: {
    nip: { name: '물어뜯기', intent: 'attack', dmg: 9, run: (B, s) => B.enemyAttack(s, 9) },
    chomp: { name: '깨물기', intent: 'attack', dmg: 8, hits: 2, run: (B, s) => B.enemyAttack(s, 8, 2) },
    harden: { name: '경화', intent: 'defendBuff', blk: 12, run: (B, s) => { B.gainBlock(s, 12); B.addPower(s, 'strength', 2, s); } },
  },
  ai: (B, s) => {
    if (!s.history.length) return B.rng.chance(0.5) ? 'nip' : 'harden';
    if (lastN(s, 2, 'chomp')) return B.rng.chance(0.5) ? 'nip' : 'harden';
    return B.rng.chance(0.4) ? 'chomp' : (B.rng.chance(0.6) ? 'nip' : 'harden');
  } });

M({ id: 'orbWalker', name: '구체 보행자', en: 'Orb Walker', hp: [90, 96],
  shape: { body: 'construct', color: '#6b3b8b', color2: '#d0a0f0', size: 1.2, eyes: 1 },
  init: (B, s) => B.addPower(s, 'strength', 5, s, true),
  moves: {
    laser: { name: '레이저', intent: 'attackDebuff', dmg: 10, run: (B, s) => { B.enemyAttack(s, 10); B.addCardToDiscard(mk('burn')); B.addCardToDiscard(mk('burn')); } },
    claw: { name: '할퀴기', intent: 'attack', dmg: 15, run: (B, s) => B.enemyAttack(s, 15) },
  },
  ai: (B, s) => (B.rng.chance(0.6) ? 'laser' : 'claw') });

M({ id: 'spiker', name: '가시돌이', en: 'Spiker', hp: [42, 56],
  shape: { body: 'blob', color: '#4a2a2a', color2: '#c05a5a', size: 1.0, eyes: 2, spikes: true },
  init: (B, s) => B.addPower(s, 'thorns', 3, s, true),
  moves: {
    cut: { name: '베기', intent: 'attack', dmg: 7, run: (B, s) => B.enemyAttack(s, 7) },
    spike: { name: '가시 강화', intent: 'buff', run: (B, s) => B.addPower(s, 'thorns', 2, s) },
  },
  ai: (B, s) => (s.history.length < 5 && B.rng.chance(0.4) ? 'spike' : 'cut') });

M({ id: 'exploder', name: '폭발체', en: 'Exploder', hp: [30, 30],
  shape: { body: 'blob', color: '#8b3b2a', color2: '#ff8a5a', size: 1.0, eyes: 2 },
  moves: {
    slam: { name: '내리찍기', intent: 'attack', dmg: 9, run: (B, s) => B.enemyAttack(s, 9) },
    explode: { name: '폭발', intent: 'attack', dmg: 30, run: (B, s) => { B.enemyAttack(s, 30); B.killEnemy(s); } },
  },
  ai: (B, s) => (s.history.length >= 2 ? 'explode' : 'slam') });

M({ id: 'repulsor', name: '반발체', en: 'Repulsor', hp: [29, 35],
  shape: { body: 'orb', color: '#3b6b8b', color2: '#a0d0f0', size: 0.95, eyes: 1, floating: true },
  moves: {
    bash: { name: '강타', intent: 'attack', dmg: 11, run: (B, s) => B.enemyAttack(s, 11) },
    repulse: { name: '반발', intent: 'debuff', run: (B) => { B.addCardToDrawRandom(mk('dazed')); B.addCardToDrawRandom(mk('dazed')); } },
  },
  ai: (B, s) => (B.rng.chance(0.2) ? 'bash' : 'repulse') });

M({ id: 'transient', name: '덧없는 자', en: 'Transient', hp: [999, 999],
  shape: { body: 'ghost', color: '#6b6b8b', color2: '#d0d0f0', size: 1.6, eyes: 2, floating: true },
  init: (B, s) => { s.fade = 5; s.atk = 30; },
  moves: {
    attack: { name: '공격', intent: 'attack', dyn: (s) => s.atk, run: (B, s) => { B.enemyAttack(s, s.atk); s.atk += 10; } },
  },
  ai: (B, s) => { s.fade--; if (s.fade <= 0) B.fleeEnemy(s); return 'attack'; } });

M({ id: 'theMaw', name: '아가리', en: 'The Maw', hp: [300, 300],
  shape: { body: 'maw', color: '#5a2a3a', color2: '#e05a7a', size: 2.0, eyes: 0, teeth: true },
  moves: {
    roar: { name: '포효', intent: 'strongDebuff', run: (B, s) => { B.addPower(B.player, 'weak', 3, s); B.addPower(B.player, 'frail', 3, s); } },
    slam: { name: '내리찍기', intent: 'attack', dmg: 25, run: (B, s) => B.enemyAttack(s, 25) },
    nom: { name: '냠냠', intent: 'attack', dmg: 5, hits: 3, run: (B, s) => B.enemyAttack(s, 5, 3) },
    terrify: { name: '공포', intent: 'debuff', run: (B, s) => { for (let i = 0; i < 3; i++) B.addCardToDiscard(mk('wound')); } },
  },
  ai: (B, s) => {
    const n = s.history.length;
    if (n === 0) return 'roar';
    if (n === 1) return 'terrify';
    return B.rng.chance(0.5) ? 'slam' : 'nom';
  } });

M({ id: 'writhingMass', name: '꿈틀거리는 덩어리', en: 'Writhing Mass', hp: [160, 160],
  shape: { body: 'blob', color: '#3a2a4a', color2: '#8a5ac0', size: 1.5, eyes: 5 },
  init: (B, s) => B.addPower(s, 'malleable', 3, s, true),
  moves: {
    flail: { name: '휘두르기', intent: 'attack', dmg: 15, run: (B, s) => B.enemyAttack(s, 15) },
    wither: { name: '시들게 하기', intent: 'attackDebuff', dmg: 7, run: (B, s) => { B.enemyAttack(s, 7); B.addPower(B.player, 'vulnerable', 2, s); B.addPower(B.player, 'weak', 2, s); } },
    implant: { name: '이식', intent: 'strongDebuff', run: (B, s) => { B.addCardToDrawRandom(mk('parasite')); s.implanted = true; } },
    multiStrike: { name: '연속 강타', intent: 'attack', dmg: 7, hits: 3, run: (B, s) => B.enemyAttack(s, 7, 3) },
    strongStrike: { name: '강력한 강타', intent: 'attack', dmg: 32, run: (B, s) => B.enemyAttack(s, 32) },
  },
  ai: (B, s) => {
    const r = B.rng.next();
    if (r < 0.1 && !s.implanted) return 'implant';
    if (r < 0.4) return 'multiStrike';
    if (r < 0.6) return 'wither';
    if (r < 0.9) return 'flail';
    return 'strongStrike';
  } });

// ================================================================
// 3막 - 정예
// ================================================================
M({ id: 'nemesis', name: '네메시스', en: 'Nemesis', hp: [185, 185], kind: 'elite',
  shape: { body: 'humanoid', color: '#8b2a5a', color2: '#f0a0c0', size: 1.7, eyes: 2, wings: true },
  moves: {
    scythe: { name: '거대한 낫', intent: 'attack', dmg: 45, run: (B, s) => B.enemyAttack(s, 45) },
    attack: { name: '삼중 공격', intent: 'attack', dmg: 6, hits: 3, run: (B, s) => B.enemyAttack(s, 6, 3) },
    debuff: { name: '화상 부여', intent: 'debuff', run: (B) => { for (let i = 0; i < 3; i++) B.addCardToDiscard(mk('burn')); } },
  },
  ai: (B, s) => {
    s.t = (s.t || 0) + 1;
    if (s.t % 2 === 1) B.addPower(s, 'intangible', 2, s);
    if (s.t % 3 === 0) return 'scythe';
    return B.rng.chance(0.5) ? 'attack' : 'debuff';
  } });

M({ id: 'giantHead', name: '거대한 머리', en: 'Giant Head', hp: [500, 500], kind: 'elite',
  shape: { body: 'head', color: '#7a7a6b', color2: '#d0d0c0', size: 2.3, eyes: 2 },
  init: (B, s) => { B.setPower(B.player, 'slow', 0); },
  moves: {
    glare: { name: '노려보기', intent: 'debuff', run: (B, s) => B.addPower(B.player, 'weak', 1, s) },
    count: { name: '세기', intent: 'attack', dmg: 13, run: (B, s) => B.enemyAttack(s, 13) },
    itIsTime: { name: '때가 왔다', intent: 'attack', dyn: (s) => s.bigDmg || 30,
      run: (B, s) => { B.enemyAttack(s, s.bigDmg || 30); s.bigDmg = (s.bigDmg || 30) + 5; } },
  },
  ai: (B, s) => {
    s.t = (s.t || 0) + 1;
    if (s.t > 5) return 'itIsTime';
    return B.rng.chance(0.5) ? 'glare' : 'count';
  } });

M({ id: 'reptomancer', name: '파충류술사', en: 'Reptomancer', hp: [180, 190], kind: 'elite',
  shape: { body: 'snake', color: '#6b3b8b', color2: '#c090e0', size: 1.6, eyes: 2, crown: true },
  moves: {
    summon: { name: '단검 소환', intent: 'unknown', run: (B, s) => B.summon(s, ['daggerMinion']) },
    snakeStrike: { name: '뱀 공격', intent: 'attackDebuff', dmg: 13, hits: 2, run: (B, s) => { B.enemyAttack(s, 13, 2); B.addPower(B.player, 'weak', 1, s); } },
    bigBite: { name: '큰 물기', intent: 'attack', dmg: 30, run: (B, s) => B.enemyAttack(s, 30) },
  },
  ai: (B, s) => {
    if (!s.history.length) return 'summon';
    const r = B.rng.next();
    if (r < 0.33) return 'summon';
    if (r < 0.5) return 'bigBite';
    return 'snakeStrike';
  } });

M({ id: 'daggerMinion', name: '단검', en: 'Dagger', hp: [20, 25], minion: true,
  shape: { body: 'dagger', color: '#9b9b9b', color2: '#e0e0ff', size: 0.6, eyes: 0, floating: true },
  moves: {
    stab: { name: '찌르기', intent: 'attack', dmg: 9, run: (B, s) => B.enemyAttack(s, 9) },
    explode: { name: '폭발', intent: 'attack', dmg: 25, run: (B, s) => { B.enemyAttack(s, 25); B.killEnemy(s); } },
  },
  ai: (B, s) => (s.history.length ? 'explode' : 'stab') });

// ================================================================
// 3막 - 보스
// ================================================================
M({ id: 'awakenedOne', name: '깨어난 자', en: 'Awakened One', hp: [300, 300], kind: 'boss',
  shape: { body: 'humanoid', color: '#7a2a2a', color2: '#f0c060', size: 2.1, eyes: 2, wings: true },
  init: (B, s) => { B.addPower(s, 'curiosity', 1, s, true); B.addPower(s, 'unawakened', 1, s, true); s.phase = 1; },
  moves: {
    slash: { name: '베기', intent: 'attack', dmg: 20, run: (B, s) => B.enemyAttack(s, 20) },
    soulStrike: { name: '영혼 강타', intent: 'attack', dmg: 6, hits: 4, run: (B, s) => B.enemyAttack(s, 6, 4) },
    rebirth: { name: '부활', intent: 'unknown', run: (B, s) => { B.removePower(s, 'unawakened'); B.clearDebuffs(s); s.phase = 2; } },
    darkEcho: { name: '어둠의 메아리', intent: 'attack', dmg: 40, run: (B, s) => B.enemyAttack(s, 40) },
    sludge: { name: '진흙', intent: 'attackDebuff', dmg: 18, run: (B, s) => { B.enemyAttack(s, 18); B.addCardToDiscard(mk('void')); } },
    tackle: { name: '태클', intent: 'attack', dmg: 10, hits: 2, run: (B, s) => B.enemyAttack(s, 10, 2) },
  },
  ai: (B, s) => {
    if (s.phase === 1) {
      if (!s.history.length) return 'slash';
      return B.rng.chance(0.25) ? 'soulStrike' : 'slash';
    }
    if (s.justRevived) { s.justRevived = false; return 'darkEcho'; }
    const r = B.rng.next();
    if (r < 0.5) return 'sludge';
    if (r < 0.8) return 'tackle';
    return 'darkEcho';
  },
  onFatal: (B, s) => {
    if (s.phase === 1) {
      s.phase = 2; s.justRevived = true;
      s.hp = 300; s.maxHp = 300;
      B.removePower(s, 'unawakened');
      B.clearDebuffs(s);
      B.log(`${s.name}이(가) 진정한 모습으로 깨어났다!`);
      return true; // 죽지 않음
    }
    return false;
  } });

M({ id: 'timeEater', name: '시간 포식자', en: 'Time Eater', hp: [456, 456], kind: 'boss',
  shape: { body: 'brute', color: '#5a3b7a', color2: '#d0b0f0', size: 2.1, eyes: 2, clock: true },
  init: (B, s) => B.addPower(s, 'timeWarp', 0, s, true),
  moves: {
    reverberate: { name: '반향', intent: 'attack', dmg: 7, hits: 3, run: (B, s) => B.enemyAttack(s, 7, 3) },
    headSlam: { name: '머리 강타', intent: 'attackDebuff', dmg: 26, run: (B, s) => { B.enemyAttack(s, 26); B.addPower(B.player, 'drawReduction', 1, s); } },
    ripple: { name: '잔물결', intent: 'defendDebuff', blk: 20, run: (B, s) => { B.gainBlock(s, 20); B.addPower(B.player, 'weak', 1, s); B.addPower(B.player, 'frail', 1, s); } },
    haste: { name: '가속', intent: 'buff', run: (B, s) => { s.hp = Math.floor(s.maxHp / 2); B.clearDebuffs(s); B.gainBlock(s, 0); B.addPower(s, 'strength', 2, s); } },
  },
  ai: (B, s) => {
    if (s.hp <= s.maxHp * 0.5 && !s.hasted) { s.hasted = true; return 'haste'; }
    const r = B.rng.next();
    if (r < 0.45 && !lastN(s, 2, 'reverberate')) return 'reverberate';
    if (r < 0.8 && !lastN(s, 2, 'headSlam')) return 'headSlam';
    return 'ripple';
  } });

M({ id: 'donu', name: '도누', en: 'Donu', hp: [250, 250], kind: 'boss',
  shape: { body: 'orb', color: '#c0a040', color2: '#fff0a0', size: 1.7, eyes: 1, floating: true, ring: true },
  init: (B, s) => B.addPower(s, 'artifact', 2, s, true),
  moves: {
    circleOfPower: { name: '힘의 원', intent: 'buff', run: (B, s) => B.living().forEach((e) => B.addPower(e, 'strength', 3, s)) },
    beam: { name: '광선', intent: 'attack', dmg: 10, hits: 2, run: (B, s) => B.enemyAttack(s, 10, 2) },
  },
  ai: (B, s) => (s.history.length % 2 === 0 ? 'circleOfPower' : 'beam') });

M({ id: 'deca', name: '데카', en: 'Deca', hp: [250, 250], kind: 'boss',
  shape: { body: 'orb', color: '#a0a0c0', color2: '#e0e0ff', size: 1.7, eyes: 1, floating: true, ring: true },
  init: (B, s) => B.addPower(s, 'artifact', 2, s, true),
  moves: {
    squareOfProtection: { name: '보호의 사각', intent: 'defendBuff', blk: 16,
      run: (B, s) => B.living().forEach((e) => { B.gainBlock(e, 16); B.addPower(e, 'plated', 3, s); }) },
    beam: { name: '광선', intent: 'attackDebuff', dmg: 10, hits: 2,
      run: (B, s) => { B.enemyAttack(s, 10, 2); B.addCardToDiscard(mk('dazed')); B.addCardToDiscard(mk('dazed')); } },
  },
  ai: (B, s) => (s.history.length % 2 === 0 ? 'beam' : 'squareOfProtection') });

// ================================================================
// 조우(Encounter) 테이블
// ================================================================
export const ENCOUNTERS = {
  1: {
    weak: [['jawWorm'], ['cultist'], ['louseRed', 'louseGreen'], ['acidSlimeM'], ['spikeSlimeM'], ['acidSlimeS', 'spikeSlimeS']],
    strong: [['gremlinMad', 'gremlinSneaky', 'gremlinFat'], ['gremlinShield', 'gremlinWizard', 'gremlinMad'],
      ['acidSlimeL'], ['spikeSlimeL'], ['fungiBeast', 'fungiBeast'], ['louseRed', 'louseRed', 'louseGreen'],
      ['slaverBlue', 'slaverRed'], ['looter'], ['cultist', 'jawWorm'], ['acidSlimeM', 'spikeSlimeM', 'acidSlimeS']],
    elite: [['gremlinNob'], ['lagavulin'], ['sentry', 'sentry', 'sentry']],
    boss: [['theGuardian'], ['hexaghost'], ['slimeBoss']],
  },
  2: {
    weak: [['byrd', 'byrd'], ['chosen'], ['shelledParasite'], ['sphericGuardian'], ['snakePlant'], ['centurion', 'mystic']],
    strong: [['chosen', 'byrd'], ['snecko'], ['snakePlant', 'byrd'], ['centurion', 'mystic'],
      ['shelledParasite', 'fungiBeast'], ['cultist', 'chosen'], ['byrd', 'byrd', 'byrd'], ['sphericGuardian', 'slaverRed']],
    elite: [['gremlinLeader'], ['bookOfStabbing'], ['taskmaster', 'slaverRed', 'slaverBlue']],
    boss: [['bronzeAutomaton'], ['theChamp'], ['theCollector']],
  },
  3: {
    weak: [['darkling', 'darkling', 'darkling'], ['orbWalker'], ['spiker', 'repulsor'], ['exploder', 'exploder', 'repulsor']],
    strong: [['theMaw'], ['writhingMass'], ['darkling', 'darkling', 'darkling'], ['spiker', 'spiker', 'exploder'],
      ['orbWalker', 'repulsor'], ['transient'], ['snecko', 'darkling']],
    elite: [['nemesis'], ['giantHead'], ['reptomancer']],
    boss: [['awakenedOne'], ['timeEater'], ['donu', 'deca']],
  },
};

export const GREMLIN_POOL = ['gremlinMad', 'gremlinSneaky', 'gremlinFat', 'gremlinShield', 'gremlinWizard'];
