// ============================================================
//  카드 시각화 : HTML/CSS + SVG 조합 (외부 이미지 없음)
// ============================================================
import { GLYPH, svgIcon } from './icons.js';
import { ART_GLYPH, layerColor } from './cardart.js';
import { TYPE_KR, RARITY_KR, setCardPreview } from '../data/carddb.js';
import { KEYWORDS as KEYWORD_LIST } from '../data/keywords.js';

/** 카드별 문양 매핑
 *
 *  같은 계열 안에서는 문양이 겹치지 않는다. 게임에 익숙해지면 글자보다 문양을
 *  먼저 보게 되는데, 겹쳐 있으면 문양을 보고 이름을 또 확인해야 해서 의미가 없다.
 *  문양 자체는 js/ui/cardart.js 의 ART_GLYPH 에 있다.
 *  tools/check-art.mjs 로 중복·누락을 검사한다.
 */
const ART = {
  // ── 아이언클래드 75장 ──
  strike_r: 'sword', defend_r: 'shield', bash: 'hammer', anger: 'wrath',
  armaments: 'plate', bodySlam: 'wall', clash: 'twinBlade', cleave: 'axe',
  clothesline: 'chain', flex: 'fistPunch', havoc: 'runeSpiral', headbutt: 'helmet',
  heavyBlade: 'cleaver', ironWave: 'wave', perfectedStrike: 'runeStar', pommelStrike: 'mace',
  shrugItOff: 'barrier', swordBoomerang: 'runeEdge', thunderclap: 'lightning', trueGrit: 'runeShield',
  twinStrike: 'daggerFan', warcry: 'banner', wildStrike: 'claw', battleTrance: 'aura',
  bloodForBlood: 'blood', bloodletting: 'vial', burningPact: 'candle', carnage: 'scythe',
  combust: 'ember', darkEmbrace: 'wing', disarm: 'swap', dropkick: 'kick',
  dualWield: 'twinBlade2', entrench: 'tower', evolve: 'runeBox', feelNoPain: 'knuckle',
  fireBreathing: 'brand', flameBarrier: 'flame', ghostlyArmor: 'cloud', hemokinesis: 'heart',
  infernalBlade: 'torch', inflame: 'sun', intimidate: 'mask', metallicize: 'anchor',
  powerThrough: 'runeGate', pummel: 'arrowVolley', rage: 'runeTri', rampage: 'runeBolt',
  recklessCharge: 'spear', rupture: 'bone', searingBlow: 'explosion', secondWind: 'lungs',
  seeingRed: 'eye', sentinel: 'runeCross', severSoul: 'dagger', shockwave: 'tornado',
  spotWeakness: 'thirdEye', uppercut: 'fistUp', whirlwind: 'spiralWind', barricade: 'runeWave',
  berserk: 'skull', bludgeon: 'runeHorn', brutality: 'lungs2', corruption: 'curse',
  demonForm: 'crown', doubleTap: 'cards2', exhume: 'tombstone', feed: 'feast',
  fiendFire: 'hellfire', immolate: 'meteor', impervious: 'runeRing', juggernaut: 'siege',
  limitBreak: 'runeFang', offering: 'bag', reaper: 'harvest',
  // ── 사일런트 77장 ──
  shiv: 'dagger', strike_g: 'sword', defend_g: 'shield', neutralize: 'claw',
  survivor: 'cloth', acrobatics: 'wing', backflip: 'footprint', bane: 'poison',
  bladeDance: 'daggerFan', cloakAndDagger: 'mask', daggerSpray: 'arrowVolley', daggerThrow: 'spear',
  deadlyPoison: 'vial', deflect: 'barrier', dodgeAndRoll: 'runeSpiral', flyingKnee: 'kick',
  outmaneuver: 'swap', piercingWail: 'bell', poisonedStab: 'poisonBlade', prepared: 'cards2',
  quickSlash: 'twinBlade', slice: 'cleaver', sneakyStrike: 'shadowStep', suckerPunch: 'fistPunch',
  accuracy: 'runeEye', allOutAttack: 'explosion', backstab: 'runeFang', blurCard: 'cloud',
  bouncingFlask: 'flask2', calculatedGamble: 'dice', caltrops: 'thorn', catalyst: 'poisonCloud',
  choke: 'chain', concentrate: 'runeRing', cripplingCloud: 'smokeCloud', dash: 'runeBolt',
  distraction: 'question', endlessAgony: 'runeWave', escapePlan: 'door', eviscerate: 'scythe',
  expertise: 'scroll', finisher: 'runeStar', flechettes: 'bow', footwork: 'boot',
  heelHook: 'hook', infiniteBlades: 'runeEdge', legSweep: 'sweep', masterfulStab: 'knife2',
  noxiousFumes: 'poisonFog', predator: 'eye', reflex: 'lightning', riddleWithHoles: 'web',
  setup: 'hourglass', skewer: 'skewerPin', stormOfSteel: 'bladeStorm', tactician: 'banner',
  terror: 'skull', unload: 'gunFan', wellLaidPlans: 'runeBox', alchemize: 'potion',
  bulletTime: 'hourglassSand', adrenaline: 'heart', afterImage: 'mirror', aThousandCuts: 'runeCross',
  burstCard: 'sparkle', corpseExplosion: 'bomb', dieDieDie: 'runeTri', doppelganger: 'twins',
  envenom: 'poisonDrop', glassKnife: 'gem', grandFinale: 'crown', malaise: 'weakness',
  nightmare: 'moon', phantasmalKiller: 'ghostBlade', toolsOfTheTrade: 'bag', wraithForm: 'wraith',
  venomThrow: 'splash',
  // ── 디펙트 76장 ──
  strike_b: 'sword', defend_b: 'shield', zap: 'lightning', dualcast: 'twinOrb',
  ballLightning: 'orbCore', barrage: 'arrowVolley', beamCell: 'beam', chargeBattery: 'battery',
  claw: 'claw', coldSnap: 'snow', compileDriver: 'gear', coolheaded: 'frost',
  goForTheEyes: 'eye', hologram: 'runeBox', leap: 'kick', rebound: 'swap',
  recursion: 'runeSpiral', stack: 'stackPlate', steamBarrier: 'steam', streamline: 'runeBolt',
  sweepingBeam: 'sweepBeam', turbo: 'turboFan', aggregate: 'cards2', autoShields: 'autoShield',
  blizzard: 'blizzard', bootSequence: 'door', bullseye: 'target', capacitor: 'capPlate',
  chaos: 'dice', chill: 'icicle', consume: 'hole', darkness: 'darkOrb',
  defragment: 'chip', doomAndGloom: 'stormCloud', doubleEnergy: 'twinBolt', equilibrium: 'scale',
  ftl: 'comet', forceField: 'runeShield', fusion: 'plasma', geneticAlgorithm: 'helix',
  glacier: 'glacierWall', heatsinks: 'heatFin', helloWorldCard: 'scroll', loopCard: 'runeRing',
  melter: 'melt', overclock: 'thermo', recycle: 'recycleArrow', reinforcedBody: 'plate',
  reprogram: 'runeCross', ripAndTear: 'cleaver', scrapeCard: 'scrape', selfRepair: 'wrench',
  skim: 'skimPage', staticDischargeCard: 'spark2', stormCard: 'tempestBolt', sunder: 'hammer',
  tempest: 'tornado', whiteNoise: 'waveNoise', lockOnCard: 'crosshair', allForOne: 'magnet',
  amplifyCard: 'amp', biasedCognition: 'brain', bufferCard: 'bufferRing', coreSurge: 'coreBurst',
  creativeAICard: 'chipStar', echoForm: 'echoRing', electrodynamics: 'arcNet', fission: 'fissionSplit',
  hyperbeam: 'hyperRay', machineLearningCard: 'learnGraph', meteorStrike: 'meteor', multiCast: 'tripleOrb',
  rainbow: 'rainbowArc', reboot: 'rebootPower', seek: 'runeEye', thunderStrike: 'thunderBolt',
  // ── 와쳐 83장 ──
  insight: 'thirdEye', smite: 'runeStar', miracle: 'sparkle', safety: 'shield',
  throughViolence: 'claw', beta: 'runeBox', omegaCard: 'runeRing', judgmentStrike: 'scale',
  strike_p: 'sword', defend_p: 'barrier', eruption: 'flame', vigilance: 'calm',
  bowlingBash: 'bowlPin', consecrate: 'divinity', crescendo: 'wrath', crushJoints: 'knuckle',
  cutThroughFate: 'runeEdge', emptyBody: 'hole', emptyFist: 'fistPunch', evaluate: 'scroll',
  flurryOfBlows: 'arrowVolley', flyingSleeves: 'sleeve', followUp: 'runeBolt', halt: 'wall',
  justLucky: 'clover', pressurePoints: 'acupoint', prostrate: 'bow2', protect: 'plate',
  sashWhip: 'whip', thirdEye: 'eye', tranquility: 'lotus', battleHymn: 'bell',
  carveReality: 'carve', collect: 'bag', conclude: 'runeCross', deceiveReality: 'mirror',
  emptyMind: 'cloud', fasting: 'hourglass', fearNoEvil: 'mask', foreignInfluence: 'door',
  foresight: 'moonStar', indignation: 'ember', innerPeace: 'yinyang', likeWater: 'wave',
  meditate: 'mantra', mentalFortress: 'tower', nirvana: 'lotusGlow', perseverance: 'anchor',
  pray: 'candle', reachHeaven: 'stair', rushdown: 'kick', sanctity: 'feather',
  sandsOfTime: 'hourglassSand', signatureMove: 'sword2', simmeringFury: 'torch', studyCard: 'book',
  swivel: 'spiralWind', talkToTheHand: 'palm', tantrum: 'stomp', waveOfTheHand: 'handWave',
  weave: 'weaveKnot', wheelKick: 'wheelSpin', windUp: 'coil', worship: 'prayHands',
  wreathOfFlame: 'flameRing', conjureBlade: 'conjure', scrawl: 'quill', alpha: 'runeTri',
  blasphemy: 'skull', brilliance: 'sun', devaForm: 'deva', devotion: 'beadString',
  deusExMachina: 'machineHand', establishment: 'seal', judgment: 'gavel', lessonLearned: 'lesson',
  masterReality: 'crownReal', omniscience: 'eyeAll', ragnarok: 'comet', spiritShield: 'spiritWall',
  vault: 'vaultDoor', wish: 'coin', blasphemerBook: 'tome',
  // ── 무색 33장 ──
  bandageUp: 'bandage', blind: 'eye', darkShackles: 'chains', deepBreath: 'lungs',
  discovery: 'question', dramaticEntrance: 'banner', enlightenment: 'sun', finesse: 'feather',
  flashOfSteel: 'sword', goodInstincts: 'shield', impatience: 'hourglass', jackOfAllTrades: 'cards2',
  madness: 'curse', mindBlast: 'brain', panacea: 'vial', panicButton: 'runeCross',
  purity: 'sparkle', swiftStrike: 'dagger', trip: 'footprint', apotheosis: 'divinity',
  handOfGreed: 'coin', magnetism: 'magnet', masterOfStrategy: 'scroll', mayhem: 'explosion',
  metamorphosis: 'runeSpiral', panache: 'flame', sadisticNature: 'claw', secretTechnique: 'book',
  secretWeapon: 'knuckle', theBomb: 'bomb', thinkingAhead: 'thirdEye', transmutation: 'swap',
  violence: 'fistPunch',
  // ── 상태이상 5장 ──
  burn: 'ember', dazed: 'zzz', slimed: 'poisonCloud', void: 'hole',
  wound: 'bandageTorn',
  // ── 저주 14장 ──
  ascendersBane: 'curse', clumsy: 'footprint', curseOfTheBell: 'bell', decay: 'skull',
  doubt: 'question', injury: 'bone', necronomicurse: 'tome2', normality: 'wall',
  pain: 'heart', parasite: 'web', pride: 'crown', regret: 'tombstone',
  shame: 'mask', writhe: 'chains',
};

const TYPE_THEME = {
  attack: { a: '#7a2222', b: '#c0392b', edge: '#e08060', glow: '#ff6a4a' },
  skill:  { a: '#1e4a52', b: '#2f8f7f', edge: '#66d0c0', glow: '#4ae0c0' },
  power:  { a: '#3a2a6a', b: '#6a4bbf', edge: '#b090ff', glow: '#a06aff' },
  status: { a: '#33383f', b: '#5a6472', edge: '#95a0b0', glow: '#90a0b0' },
  curse:  { a: '#1a1a22', b: '#3a2a3a', edge: '#8a6a8a', glow: '#c060c0' },
};

const RARITY_COLOR = { basic: '#9aa4b2', common: '#c8ccd4', uncommon: '#5ab9ff', rare: '#ffcf4a', special: '#b0b0b0', curse: '#a05ac0' };

const KEYWORDS = KEYWORD_LIST.map((k) => [k[0], k[2]]).sort((a, b) => b[0].length - a[0].length);

const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/**
 * 카드 설명 장식.
 * baseText 가 주어지면 두 문장의 숫자를 자리별로 비교해
 * 전투 보정으로 달라진 수치만 강조색으로 표시한다.
 */
function decorate(text, baseText) {
  let t = esc(text);
  if (baseText !== undefined && baseText !== null) {
    const a = esc(baseText).split(/(\d+)/);
    const b = t.split(/(\d+)/);
    if (a.length === b.length) {
      t = b.map((tok, i) => {
        if (!/^\d+$/.test(tok)) return tok;
        if (tok === a[i]) return `<b class="num">${tok}</b>`;
        const up = Number(tok) > Number(a[i]);
        return `<b class="num ${up ? 'buffed' : 'nerfed'}">${tok}</b>`;
      }).join('');
    } else {
      t = t.replace(/(\d+)/g, '<b class="num">$1</b>');
    }
  } else {
    t = t.replace(/(\d+)/g, '<b class="num">$1</b>');
  }
  for (const [k, cls] of KEYWORDS) {
    t = t.split(k).join(`<span class="${cls}">${k}</span>`);
  }
  return t;
}

/** 카드 문양 SVG */
export function cardArtSVG(card) {
  const th = TYPE_THEME[card.type] || TYPE_THEME.skill;
  const g = ART[card.id] || (card.type === 'attack' ? 'sword' : card.type === 'power' ? 'ring'
    : card.type === 'curse' ? 'curse' : card.type === 'status' ? 'weakness' : 'star');
  const id = 'ag' + card.id.replace(/[^a-z0-9]/gi, '');

  // 카드 문양(cardart.js)은 색을 쓰는 여러 겹이고, 없으면 유물용 단색 문양으로 떨어진다
  const layers = ART_GLYPH[g];
  let art;
  if (layers) {
    art = layers.map(([d, c, op]) => {
      const fill = layerColor(c, th.glow);
      // 선으로만 그린 겹 (path 에 닫힘이 없는 것) 은 stroke 로 살려 준다
      const strokeOnly = !/[Zz]/.test(d);
      return strokeOnly
        ? `<path d="${d}" fill="none" stroke="${fill}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="${op ?? 1}"/>`
        : `<path d="${d}" fill="${fill}" fill-rule="evenodd" opacity="${op ?? 1}"/>`;
    }).join('');
  } else {
    const d = GLYPH[g] || GLYPH.star;
    art = `<path d="${d}" fill="#ffffff" fill-opacity="0.92" stroke="${th.a}" stroke-width="3" stroke-linejoin="round"/>`;
  }

  return `<svg class="card-art-svg" viewBox="0 0 100 62" preserveAspectRatio="xMidYMin slice">
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
    <!-- 이름표가 그림 띠의 아래쪽을 덮으므로 문양은 위쪽에 둔다.
         YMin 으로 맞춰 어느 카드 비율에서든 띠의 윗부분이 항상 보이게 한다. -->
    <g transform="translate(33,2) scale(0.34)" stroke="rgba(0,0,0,.45)" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke">
      ${art}
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
/**
 * 설명이 길면 글자를 조금 줄여 글상자 안에 최대한 담는다.
 * (원작도 설명이 긴 카드는 글씨가 작다)
 */
function descLenClass(text) {
  const n = String(text).replace(/<[^>]*>/g, '').length;
  if (n >= 48) return ' d-xlong';
  if (n >= 39) return ' d-long';
  return '';
}

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
  el.__card = card;   // 길게 눌러 상세 설명을 띄울 때 참조

  // 전투 중이면 실제 적용될 수치로 다시 계산해 달라진 부분만 강조한다
  let baseText = null;
  let descText = card.text();
  if (opts.preview) {
    baseText = descText;
    setCardPreview(opts.preview);
    try { descText = card.text(); } finally { setCardPreview(null); }
    if (descText === baseText) baseText = null;
  }

  el.innerHTML = `
    <div class="card-inner">
      <div class="card-art">${cardArtSVG(card)}</div>
      <div class="card-namebar"><span class="card-name">${card.name}</span></div>
      ${costOrbSVG(card)}
      <div class="card-body"><div class="card-desc${descLenClass(descText)}">${decorate(descText, baseText)}</div></div>
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
