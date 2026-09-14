// ============================================================
//  카드 시각화 : HTML/CSS + SVG 조합 (외부 이미지 없음)
// ============================================================
import { GLYPH, svgIcon } from './icons.js';
import { TYPE_KR, RARITY_KR } from '../data/carddb.js';

/** 카드별 문양 매핑 */
const ART = {
  strike_r: 'sword', defend_r: 'shield', bash: 'hammer',
  anger: 'fist', armaments: 'hammer', bodySlam: 'shield', clash: 'twinSword', cleave: 'axe',
  clothesline: 'chain', flex: 'fist', havoc: 'spiral', headbutt: 'skull', heavyBlade: 'axe',
  ironWave: 'wave', perfectedStrike: 'sword', pommelStrike: 'hammer', shrugItOff: 'shield',
  swordBoomerang: 'twinSword', thunderclap: 'lightning', trueGrit: 'shield', twinStrike: 'twinSword',
  warcry: 'star', wildStrike: 'claw',
  battleTrance: 'eye', bloodForBlood: 'blood', bloodletting: 'drop', burningPact: 'flame',
  carnage: 'axe', combust: 'flame', darkEmbrace: 'wing', disarm: 'minus', dropkick: 'foot',
  dualWield: 'twinSword', entrench: 'shieldSpike', evolve: 'spiral', feelNoPain: 'shield',
  fireBreathing: 'flame', flameBarrier: 'flame', ghostlyArmor: 'shield', hemokinesis: 'blood',
  infernalBlade: 'sword', inflame: 'flame', intimidate: 'skull', metallicize: 'gear',
  powerThrough: 'shieldSpike', pummel: 'fist', rage: 'fist', rampage: 'claw',
  recklessCharge: 'foot', rupture: 'blood', searingBlow: 'flame', secondWind: 'wave',
  seeingRed: 'eye', sentinel: 'shield', severSoul: 'claw', shockwave: 'wave',
  spotWeakness: 'eye', uppercut: 'fist', whirlwind: 'spiral',
  barricade: 'shieldSpike', berserk: 'lightning', bludgeon: 'hammer', brutality: 'blood',
  corruption: 'skull', demonForm: 'skull', doubleTap: 'twinSword', exhume: 'spiral',
  feed: 'heart', fiendFire: 'flame', immolate: 'flame', impervious: 'shield',
  juggernaut: 'hammer', limitBreak: 'arrowUp', offering: 'drop', reaper: 'claw',
  bandageUp: 'heart', blind: 'eye', darkShackles: 'chain', deepBreath: 'wave', discovery: 'question',
  dramaticEntrance: 'star', enlightenment: 'eye', finesse: 'wing', flashOfSteel: 'sword',
  goodInstincts: 'shield', impatience: 'hourglass', jackOfAllTrades: 'star', madness: 'spiral',
  mindBlast: 'lightning', panacea: 'potion', panicButton: 'shield', purity: 'ring',
  swiftStrike: 'sword', trip: 'foot', apotheosis: 'star', handOfGreed: 'claw', magnetism: 'ring',
  masterOfStrategy: 'book', mayhem: 'spiral', metamorphosis: 'spiral', panache: 'star',
  sadisticNature: 'claw', secretTechnique: 'book', secretWeapon: 'sword', theBomb: 'bomb',
  thinkingAhead: 'hourglass', transmutation: 'spiral', violence: 'claw',
  // ---- 사일런트 ----
  strike_g: 'sword', defend_g: 'shield', neutralize: 'claw', survivor: 'shield', shiv: 'twinSword',
  acrobatics: 'wing', backflip: 'wing', bane: 'drop', bladeDance: 'twinSword', cloakAndDagger: 'twinSword',
  daggerSpray: 'star', daggerThrow: 'twinSword', deadlyPoison: 'drop', deflect: 'shield', dodgeAndRoll: 'foot',
  flyingKnee: 'foot', outmaneuver: 'hourglass', piercingWail: 'wave', poisonedStab: 'drop', prepared: 'book',
  quickSlash: 'sword', slice: 'sword', sneakyStrike: 'claw', suckerPunch: 'fist',
  accuracy: 'sword', allOutAttack: 'star', backstab: 'claw', blurCard: 'wing', bouncingFlask: 'potion',
  calculatedGamble: 'spiral', caltrops: 'thorn', catalyst: 'potion', choke: 'chain', concentrate: 'eye',
  cripplingCloud: 'drop', dash: 'foot', distraction: 'spiral', endlessAgony: 'blood', escapePlan: 'foot',
  eviscerate: 'claw', expertise: 'book', finisher: 'sword', flechettes: 'twinSword', footwork: 'wing',
  heelHook: 'foot', infiniteBlades: 'twinSword', legSweep: 'foot', masterfulStab: 'blood', noxiousFumes: 'drop',
  predator: 'claw', reflex: 'lightning', riddleWithHoles: 'star', setup: 'book', skewer: 'sword',
  stormOfSteel: 'spiral', tactician: 'star', terror: 'skull', unload: 'claw', wellLaidPlans: 'shield',
  alchemize: 'potion', bulletTime: 'hourglass',
  adrenaline: 'lightning', afterImage: 'wing', aThousandCuts: 'claw', burstCard: 'twinSword',
  corpseExplosion: 'bomb', dieDieDie: 'skull', doppelganger: 'twinSword', envenom: 'drop',
  glassKnife: 'twinSword', grandFinale: 'star', malaise: 'arrowDown', nightmare: 'skull',
  phantasmalKiller: 'skull', toolsOfTheTrade: 'gear', wraithForm: 'ring', venomThrow: 'drop',

  // ---- 디펙트 ----
  strike_b: 'sword', defend_b: 'shield', zap: 'lightning', dualcast: 'twinSword',
  ballLightning: 'lightning', barrage: 'star', beamCell: 'lightning', chargeBattery: 'ring', claw: 'claw',
  coldSnap: 'drop', compileDriver: 'gear', coolheaded: 'drop', goForTheEyes: 'eye', hologram: 'ring',
  leap: 'wing', rebound: 'spiral', recursion: 'spiral', stack: 'shield', steamBarrier: 'shield',
  streamline: 'lightning', sweepingBeam: 'wave', turbo: 'lightning',
  aggregate: 'gear', autoShields: 'shield', blizzard: 'drop', bootSequence: 'shield', bullseye: 'eye',
  capacitor: 'ring', chaos: 'spiral', chill: 'drop', consume: 'ring', darkness: 'ring',
  defragment: 'ring', doomAndGloom: 'skull', doubleEnergy: 'lightning', equilibrium: 'shield', ftl: 'wing',
  forceField: 'shield', fusion: 'star', geneticAlgorithm: 'gear', glacier: 'drop', heatsinks: 'gear',
  helloWorldCard: 'book', loopCard: 'spiral', melter: 'flame', overclock: 'flame', recycle: 'spiral',
  reinforcedBody: 'shield', reprogram: 'gear', ripAndTear: 'claw', scrapeCard: 'claw', selfRepair: 'heart',
  skim: 'book', staticDischargeCard: 'lightning', stormCard: 'lightning', sunder: 'hammer', tempest: 'lightning',
  whiteNoise: 'wave', lockOnCard: 'eye',
  allForOne: 'star', amplifyCard: 'lightning', biasedCognition: 'eye', bufferCard: 'shield', coreSurge: 'ring',
  creativeAICard: 'gear', echoForm: 'twinSword', electrodynamics: 'lightning', fission: 'spiral',
  hyperbeam: 'lightning', machineLearningCard: 'book', meteorStrike: 'hammer', multiCast: 'twinSword',
  rainbow: 'star', reboot: 'spiral', seek: 'eye', thunderStrike: 'lightning',

  // ---- 와쳐 ----
  strike_p: 'sword', defend_p: 'shield', eruption: 'flame', vigilance: 'shield',
  insight: 'eye', smite: 'lightning', miracle: 'star', safety: 'shield', throughViolence: 'claw',
  beta: 'ring', omegaCard: 'star', judgmentStrike: 'flame',
  bowlingBash: 'hammer', consecrate: 'star', crescendo: 'flame', crushJoints: 'fist', cutThroughFate: 'eye',
  emptyBody: 'ring', emptyFist: 'fist', evaluate: 'eye', flurryOfBlows: 'fist', flyingSleeves: 'wing',
  followUp: 'fist', halt: 'shield', justLucky: 'star', pressurePoints: 'eye', prostrate: 'ring',
  protect: 'shield', sashWhip: 'chain', thirdEye: 'eye', tranquility: 'wave',
  battleHymn: 'flame', carveReality: 'sword', collect: 'star', conclude: 'hourglass', deceiveReality: 'shield',
  emptyMind: 'ring', fasting: 'fist', fearNoEvil: 'wave', foreignInfluence: 'spiral', foresight: 'eye',
  indignation: 'flame', innerPeace: 'wave', likeWater: 'wave', meditate: 'ring', mentalFortress: 'shield',
  nirvana: 'ring', perseverance: 'shield', pray: 'ring', reachHeaven: 'crown', rushdown: 'foot',
  sanctity: 'shield', sandsOfTime: 'hourglass', signatureMove: 'sword', simmeringFury: 'flame',
  studyCard: 'book', swivel: 'spiral', talkToTheHand: 'fist', tantrum: 'flame', waveOfTheHand: 'wave',
  weave: 'spiral', wheelKick: 'foot', windUp: 'fist', worship: 'ring', wreathOfFlame: 'flame',
  conjureBlade: 'sword', scrawl: 'book',
  alpha: 'ring', blasphemy: 'skull', brilliance: 'star', devaForm: 'crown', devotion: 'ring',
  deusExMachina: 'gear', establishment: 'shield', judgment: 'crown', lessonLearned: 'book',
  masterReality: 'star', omniscience: 'eye', ragnarok: 'lightning', spiritShield: 'shield',
  vault: 'hourglass', wish: 'star', blasphemerBook: 'book',

  burn: 'flame', dazed: 'spiral', slimed: 'drop', void: 'ring', wound: 'blood',
};

const TYPE_THEME = {
  attack: { a: '#7a2222', b: '#c0392b', edge: '#e08060', glow: '#ff6a4a' },
  skill:  { a: '#1e4a52', b: '#2f8f7f', edge: '#66d0c0', glow: '#4ae0c0' },
  power:  { a: '#3a2a6a', b: '#6a4bbf', edge: '#b090ff', glow: '#a06aff' },
  status: { a: '#33383f', b: '#5a6472', edge: '#95a0b0', glow: '#90a0b0' },
  curse:  { a: '#1a1a22', b: '#3a2a3a', edge: '#8a6a8a', glow: '#c060c0' },
};

const RARITY_COLOR = { basic: '#9aa4b2', common: '#c8ccd4', uncommon: '#5ab9ff', rare: '#ffcf4a', special: '#b0b0b0', curse: '#a05ac0' };

const KEYWORDS = [
  ['취약', 'kw-debuff'], ['약화', 'kw-debuff'], ['허약', 'kw-debuff'], ['중독', 'kw-debuff'],
  ['휘감김', 'kw-debuff'], ['혼란', 'kw-debuff'], ['소각', 'kw-exhaust'], ['소멸', 'kw-exhaust'],
  ['내재', 'kw-key'], ['보존', 'kw-key'], ['방어도', 'kw-block'], ['에너지', 'kw-energy'],
  ['힘', 'kw-buff'], ['민첩', 'kw-buff'], ['인공물', 'kw-buff'], ['가시', 'kw-buff'],
  ['금속화', 'kw-buff'], ['재생', 'kw-buff'], ['무형', 'kw-buff'], ['활력', 'kw-buff'],
];

function decorate(text) {
  let t = text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  t = t.replace(/(\d+)/g, '<b class="num">$1</b>');
  for (const [k, cls] of KEYWORDS) {
    t = t.split(k).join(`<span class="${cls}">${k}</span>`);
  }
  return t;
}

/** 카드 문양 SVG */
export function cardArtSVG(card) {
  const th = TYPE_THEME[card.type] || TYPE_THEME.skill;
  const g = ART[card.id] || (card.type === 'attack' ? 'sword' : card.type === 'power' ? 'ring' : card.type === 'curse' ? 'skull' : 'star');
  const d = GLYPH[g] || GLYPH.star;
  const id = 'ag' + card.id.replace(/[^a-z0-9]/gi, '');
  const outline = (g === 'wing' || g === 'spiral');
  return `<svg class="card-art-svg" viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${th.b}"/><stop offset="1" stop-color="${th.a}"/>
      </linearGradient>
      <radialGradient id="${id}r" cx="0.5" cy="0.45" r="0.65">
        <stop offset="0" stop-color="${th.glow}" stop-opacity="0.55"/>
        <stop offset="1" stop-color="${th.a}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100" height="62" fill="url(#${id})"/>
    <rect width="100" height="62" fill="url(#${id}r)"/>
    <g opacity="0.18" stroke="${th.edge}" stroke-width="0.6" fill="none">
      <path d="M0 46 L22 24 L44 46 L66 20 L100 50"/>
      <path d="M0 58 L26 38 L52 58 L74 34 L100 60"/>
    </g>
    <g transform="translate(31,3) scale(0.62)">
      <path d="${d}" fill="${outline ? 'none' : '#ffffff'}" fill-opacity="0.92"
        ${outline ? `stroke="#ffffff" stroke-width="7" stroke-linecap="round"` : `stroke="${th.a}" stroke-width="3" stroke-linejoin="round"`}/>
    </g>
  </svg>`;
}

/** 에너지 비용 오브 */
function costOrbSVG(card) {
  const txt = card.costText;
  const cls = card.costChanged ? 'cost-changed' : '';
  return `<div class="card-cost ${cls}">
    <svg viewBox="0 0 40 40"><defs>
      <radialGradient id="co${card.uid}" cx="0.4" cy="0.35" r="0.8">
        <stop offset="0" stop-color="#ffe9a8"/><stop offset="0.5" stop-color="#e8a93a"/><stop offset="1" stop-color="#7a4a10"/>
      </radialGradient></defs>
      <circle cx="20" cy="20" r="18" fill="url(#co${card.uid})" stroke="#2a1a08" stroke-width="2.5"/>
      <circle cx="20" cy="20" r="13" fill="none" stroke="#ffe9a8" stroke-opacity="0.45" stroke-width="1.2"/>
    </svg><span>${txt}</span></div>`;
}

/** 카드 DOM 생성 */
export function renderCard(card, opts = {}) {
  const el = document.createElement('div');
  const th = TYPE_THEME[card.type] || TYPE_THEME.skill;
  el.className = `card t-${card.type} r-${card.rarity}${card.upgraded ? ' upgraded' : ''}${opts.small ? ' small' : ''}${opts.disabled ? ' disabled' : ''}`;
  el.style.setProperty('--c-a', th.a);
  el.style.setProperty('--c-b', th.b);
  el.style.setProperty('--c-edge', th.edge);
  el.style.setProperty('--c-glow', th.glow);
  el.style.setProperty('--c-rar', RARITY_COLOR[card.rarity] || '#ccc');
  el.dataset.uid = card.uid;
  el.innerHTML = `
    <div class="card-inner">
      <div class="card-art">${cardArtSVG(card)}</div>
      <div class="card-namebar"><span class="card-name">${card.name}</span></div>
      ${costOrbSVG(card)}
      <div class="card-body"><div class="card-desc">${decorate(card.text())}</div></div>
      <div class="card-footer"><span class="card-type">${TYPE_KR[card.type] || ''}</span>
        <span class="card-rar" title="${RARITY_KR[card.rarity] || ''}"></span></div>
    </div>`;
  el._card = card;
  return el;
}

/** 큰 상세보기 카드 */
export function renderCardBig(card) {
  const el = renderCard(card);
  el.classList.add('big');
  return el;
}
