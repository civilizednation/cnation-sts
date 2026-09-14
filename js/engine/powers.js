// ============================================================
//  힘 / 상태이상(Powers) 정의
//  stack : 'int'(수치 누적) | 'dur'(턴 수) | 'none'(단일)
//  decay : 'end'(소유자 턴 종료 시 1 감소) | 'remove'(턴 종료 시 제거) | null
// ============================================================

export const POWERS = {
  // ---------- 공통 버프 ----------
  strength:    { name: '힘',       en: 'Strength',    type: 'buff',   icon: 'str',  d: (n) => `공격 카드의 피해량이 ${n} 증가합니다.` },
  dexterity:   { name: '민첩',     en: 'Dexterity',   type: 'buff',   icon: 'dex',  d: (n) => `카드로 얻는 방어도가 ${n} 증가합니다.` },
  vigor:       { name: '활력',     en: 'Vigor',       type: 'buff',   icon: 'vig',  d: (n) => `다음 공격 카드가 ${n}의 추가 피해를 줍니다.` },
  artifact:    { name: '인공물',   en: 'Artifact',    type: 'buff',   icon: 'art',  d: (n) => `다음에 받는 디버프 ${n}개를 무효화합니다.` },
  thorns:      { name: '가시',     en: 'Thorns',      type: 'buff',   icon: 'thorn',d: (n) => `공격받을 때 공격자에게 ${n}의 피해를 줍니다.` },
  plated:      { name: '도금 갑옷', en: 'Plated Armor',type: 'buff',  icon: 'plate',d: (n) => `턴 종료 시 방어도 ${n}을 얻습니다. 체력 피해를 받으면 1 감소합니다.` },
  metallicize: { name: '금속화',   en: 'Metallicize', type: 'buff',   icon: 'metal',d: (n) => `턴 종료 시 방어도 ${n}을 얻습니다.` },
  regeneration:{ name: '재생',     en: 'Regeneration',type: 'buff',   icon: 'regen',d: (n) => `턴 종료 시 체력을 ${n} 회복합니다.` },
  ritual:      { name: '의식',     en: 'Ritual',      type: 'buff',   icon: 'ritual',d:(n) => `턴 종료 시 힘 ${n}을 얻습니다.` },
  demonForm:   { name: '악마의 형상', en: 'Demon Form',type: 'buff',  icon: 'demon',d: (n) => `턴 시작 시 힘 ${n}을 얻습니다.` },
  barricade:   { name: '바리케이드', en: 'Barricade', type: 'buff',   stack: 'none', icon: 'barr', d: () => `턴이 끝나도 방어도가 사라지지 않습니다.` },
  darkEmbrace: { name: '어둠의 포옹', en: 'Dark Embrace', type: 'buff',icon: 'dark', d: (n) => `카드가 소각될 때마다 카드를 ${n}장 뽑습니다.` },
  evolve:      { name: '진화',     en: 'Evolve',      type: 'buff',   icon: 'evo',  d: (n) => `상태이상 카드를 뽑을 때마다 카드를 ${n}장 뽑습니다.` },
  feelNoPain:  { name: '고통 감지 불가', en: 'Feel No Pain', type: 'buff', icon: 'fnp', d: (n) => `카드가 소각될 때마다 방어도 ${n}을 얻습니다.` },
  fireBreathing:{name: '화염 숨결', en: 'Fire Breathing', type: 'buff', icon: 'fire', d: (n) => `상태이상/저주 카드를 뽑을 때마다 모든 적에게 ${n}의 피해를 줍니다.` },
  flameBarrier:{ name: '화염 방벽', en: 'Flame Barrier', type: 'buff', decay: 'remove', icon: 'fbar', d: (n) => `공격받을 때 공격자에게 ${n}의 피해를 줍니다. 턴 종료 시 사라집니다.` },
  juggernaut:  { name: '파쇄차',   en: 'Juggernaut',  type: 'buff',   icon: 'jugg', d: (n) => `방어도를 얻을 때마다 무작위 적에게 ${n}의 피해를 줍니다.` },
  rupture:     { name: '파열',     en: 'Rupture',     type: 'buff',   icon: 'rupt', d: (n) => `카드로 체력을 잃을 때마다 힘 ${n}을 얻습니다.` },
  brutality:   { name: '잔혹',     en: 'Brutality',   type: 'buff',   icon: 'brut', d: (n) => `턴 시작 시 체력 ${n}을 잃고 카드 ${n}장을 뽑습니다.` },
  corruption:  { name: '타락',     en: 'Corruption',  type: 'buff',   stack: 'none', icon: 'corr', d: () => `기술 카드의 비용이 0이 됩니다. 사용한 기술 카드는 소각됩니다.` },
  berserk:     { name: '광포화',   en: 'Berserk',     type: 'buff',   icon: 'bers', d: (n) => `턴 시작 시 에너지를 ${n} 추가로 얻습니다.` },
  combust:     { name: '연소',     en: 'Combust',     type: 'buff',   icon: 'comb', d: (n) => `턴 종료 시 체력 ${n > 0 ? 1 : 1}을 잃고 모든 적에게 ${n}의 피해를 줍니다.` },
  doubleTap:   { name: '연속 공격', en: 'Double Tap', type: 'buff',   icon: 'dtap', d: (n) => `이번 턴 공격 카드 ${n}장을 두 번 사용합니다.` },
  rage:        { name: '분노',     en: 'Rage',        type: 'buff',   decay: 'remove', icon: 'rage', d: (n) => `이번 턴 공격 카드를 사용할 때마다 방어도 ${n}을 얻습니다.` },
  intangible:  { name: '무형',     en: 'Intangible',  type: 'buff',   decay: 'end', icon: 'intan', d: (n) => `${n}턴 동안 받는 모든 피해가 1로 감소합니다.` },
  buffer:      { name: '완충',     en: 'Buffer',      type: 'buff',   icon: 'buff', d: (n) => `다음에 체력을 잃는 경우 ${n}회 무효화합니다.` },
  mayhem:      { name: '대혼란',   en: 'Mayhem',      type: 'buff',   icon: 'may',  d: (n) => `턴 시작 시 뽑을 카드 더미의 맨 위 카드 ${n}장을 사용합니다.` },
  panache:     { name: '화려함',   en: 'Panache',     type: 'buff',   icon: 'pan',  d: (n) => `카드를 5장 사용할 때마다 모든 적에게 ${n}의 피해를 줍니다.` },
  sadistic:    { name: '가학적 본성', en: 'Sadistic Nature', type: 'buff', icon: 'sad', d: (n) => `적에게 디버프를 적용할 때마다 ${n}의 피해를 줍니다.` },
  magnetism:   { name: '자성',     en: 'Magnetism',   type: 'buff',   icon: 'mag',  d: (n) => `턴 시작 시 무작위 무색 카드 ${n}장을 손에 넣습니다.` },
  nextTurnBlock:{name: '다음 턴 방어도', en: 'Next Turn Block', type: 'buff', decay: 'consume', icon: 'ntb', d: (n) => `다음 턴 시작 시 방어도 ${n}을 얻습니다.` },

  // ---------- 공통 디버프 ----------
  vulnerable:  { name: '취약',     en: 'Vulnerable',  type: 'debuff', decay: 'end', icon: 'vuln', d: (n) => `${n}턴 동안 받는 공격 피해가 50% 증가합니다.` },
  weak:        { name: '약화',     en: 'Weak',        type: 'debuff', decay: 'end', icon: 'weak', d: (n) => `${n}턴 동안 주는 공격 피해가 25% 감소합니다.` },
  frail:       { name: '허약',     en: 'Frail',       type: 'debuff', decay: 'end', icon: 'frail',d: (n) => `${n}턴 동안 얻는 방어도가 25% 감소합니다.` },
  poison:      { name: '중독',     en: 'Poison',      type: 'debuff', icon: 'pois', d: (n) => `턴 시작 시 ${n}의 피해를 받고 중독이 1 감소합니다.` },
  entangled:   { name: '휘감김',   en: 'Entangled',   type: 'debuff', decay: 'remove', icon: 'ent', d: () => `이번 턴 공격 카드를 사용할 수 없습니다.` },
  confused:    { name: '혼란',     en: 'Confused',    type: 'debuff', stack: 'none', icon: 'conf', d: () => `카드를 뽑을 때 비용이 무작위로 정해집니다.` },
  noDraw:      { name: '뽑기 불가', en: 'No Draw',    type: 'debuff', stack: 'none', decay: 'remove', icon: 'nodraw', d: () => `이번 턴에 더 이상 카드를 뽑을 수 없습니다.` },
  drawReduction:{name: '뽑기 감소', en: 'Draw Reduction', type: 'debuff', decay: 'remove', icon: 'drawdn', d: (n) => `다음 턴에 뽑는 카드가 ${n}장 감소합니다.` },
  constricted: { name: '압박',     en: 'Constricted', type: 'debuff', icon: 'cons', d: (n) => `턴 종료 시 ${n}의 피해를 받습니다.` },
  shackled:    { name: '속박',     en: 'Shackled',    type: 'debuff', icon: 'shack',d: (n) => `힘이 ${n} 감소했습니다. 턴 종료 시 회복됩니다.` },
  bias:        { name: '편향',     en: 'Bias',        type: 'debuff', icon: 'bias', d: (n) => `턴 시작 시 민첩이 ${n} 감소합니다.` },
  hex:         { name: '저주',     en: 'Hex',         type: 'debuff', icon: 'hex',  d: (n) => `공격이 아닌 카드를 사용할 때마다 현혹 ${n}장을 뽑을 더미에 넣습니다.` },

  duplication: { name: '복제',     en: 'Duplication', type: 'buff', decay: null, icon: 'dup', d: (n) => `이번 턴에 다음 카드 ${n}장을 두 번 사용합니다.` },
  loseStrength: { name: '힘 감소 예정', en: 'Lose Strength', type: 'debuff', hidden: true, icon: 'strdn', d: (n) => `턴 종료 시 힘이 ${n} 감소합니다.` },
  loseDexterityEOT: { name: '민첩 감소 예정', en: 'Lose Dexterity', type: 'debuff', hidden: true, icon: 'arrowDown', d: (n) => `턴 종료 시 민첩이 ${n} 감소합니다.` },
  gainStrengthEOT: { name: '힘 회복 예정', en: 'Gain Strength', type: 'buff', hidden: true, icon: 'strup', d: (n) => `턴 종료 시 힘이 ${n} 회복됩니다.` },
  noBlock:     { name: '방어 불가',  en: 'No Block',     type: 'debuff', decay: 'end', icon: 'noblk', d: (n) => `${n}턴 동안 방어도를 얻을 수 없습니다.` },
  bomb:        { name: '폭탄',       en: 'The Bomb',     type: 'buff',   icon: 'bomb', d: (n) => `${n}턴 후 모든 적에게 큰 피해를 줍니다.` },

  nextTurnEnergy:{ name: '다음 턴 에너지', en: 'Energy Next Turn', type: 'buff', icon: 'star', d: (n) => `다음 턴에 에너지를 ${n} 더 얻습니다.` },
  nextTurnDraw:{ name: '다음 턴 뽑기', en: 'Draw Next Turn', type: 'buff', icon: 'book', d: (n) => `다음 턴에 카드를 ${n}장 더 뽑습니다.` },
  wellLaidPlans:{ name: '치밀한 계획', en: 'Well-Laid Plans', type: 'buff', icon: 'shield', d: (n) => `턴 종료 시 카드 ${n}장을 보존합니다.` },
  choke:       { name: '질식',       en: 'Choke',        type: 'debuff', decay: 'remove', icon: 'chain', d: (n) => `이번 턴 카드를 사용할 때마다 체력을 ${n} 잃습니다.` },
  regenPlayer: { name: '재생(턴)',   en: 'Regen',        type: 'buff', hidden: true, icon: 'heart', d: (n) => `턴 종료 시 체력을 ${n} 회복합니다.` },

  // ---------- 사일런트 ----------
  envenom:     { name: '맹독',       en: 'Envenom',      type: 'buff', icon: 'pois', d: (n) => `공격으로 체력 피해를 줄 때마다 중독을 ${n} 부여합니다.` },
  accuracy:    { name: '정확도',     en: 'Accuracy',     type: 'buff', icon: 'sword', d: (n) => `단검의 피해량이 ${n} 증가합니다.` },
  thousandCuts:{ name: '천 번의 상처', en: 'Thousand Cuts', type: 'buff', icon: 'claw', d: (n) => `카드를 사용할 때마다 모든 적에게 ${n}의 피해를 줍니다.` },
  afterImage:  { name: '잔상',       en: 'After Image',  type: 'buff', icon: 'wing', d: (n) => `카드를 사용할 때마다 방어도 ${n}을 얻습니다.` },
  infiniteBlades:{ name: '무한의 칼날', en: 'Infinite Blades', type: 'buff', icon: 'twinSword', d: (n) => `턴 시작 시 단검 ${n}장을 손에 넣습니다.` },
  noxiousFumes:{ name: '유독 가스',  en: 'Noxious Fumes', type: 'buff', icon: 'drop', d: (n) => `턴 시작 시 모든 적에게 중독 ${n}을 부여합니다.` },
  burst:       { name: '연쇄',       en: 'Burst',        type: 'buff', icon: 'twinSword', d: (n) => `이번 턴 기술 카드 ${n}장을 두 번 사용합니다.` },
  doubleDamage:{ name: '환영의 살수', en: 'Phantasmal',  type: 'buff', decay: 'end', icon: 'skull', d: (n) => `${n}턴 동안 공격 피해가 2배가 됩니다.` },
  corpseExplosion:{ name: '시체 폭발', en: 'Corpse Explosion', type: 'debuff', icon: 'bomb', d: (n) => `이 적이 죽으면 중독 수치만큼 모든 적에게 피해를 줍니다.` },
  blur:        { name: '흐릿함',     en: 'Blur',         type: 'buff', icon: 'wing', d: (n) => `다음 ${n}번의 턴 시작 시 방어도가 사라지지 않습니다.` },
  toolsOfTheTrade:{ name: '도구 사용', en: 'Tools of the Trade', type: 'buff', icon: 'gear', d: (n) => `턴 시작 시 카드를 ${n}장 뽑고 ${n}장 버립니다.` },
  deadlyPoison:{ name: '치명적 독',  en: 'Deadly Poison', type: 'buff', icon: 'drop', d: (n) => `중독을 부여할 때 ${n} 추가로 부여합니다.` },

  // ---------- 디펙트 (구체) ----------
  focus:       { name: '집중',       en: 'Focus',        type: 'buff', icon: 'ring', d: (n) => `구체의 효과가 ${n} 증가합니다.` },
  lockOn:      { name: '조준',       en: 'Lock-On',      type: 'debuff', decay: 'end', icon: 'eye', d: (n) => `${n}턴 동안 번개/암흑 구체 피해를 50% 더 받습니다.` },
  electro:     { name: '전기 역학',  en: 'Electrodynamics', type: 'buff', stack: 'none', icon: 'lightning', d: () => `번개 구체가 모든 적을 공격합니다.` },
  loop:        { name: '순환',       en: 'Loop',         type: 'buff', icon: 'spiral', d: (n) => `턴 시작 시 첫 번째 구체의 패시브가 ${n}번 추가로 발동합니다.` },
  staticDischarge:{ name: '정전기 방전', en: 'Static Discharge', type: 'buff', icon: 'lightning', d: (n) => `공격 피해를 받을 때마다 번개 구체 ${n}개를 충전합니다.` },
  echoForm:    { name: '메아리 형상', en: 'Echo Form',   type: 'buff', icon: 'twinSword', d: (n) => `매 턴 처음 사용하는 카드 ${n}장을 두 번 사용합니다.` },
  creativeAI:  { name: '창조적 AI',  en: 'Creative AI',  type: 'buff', icon: 'gear', d: (n) => `턴 시작 시 무작위 힘 카드 ${n}장을 손에 넣습니다.` },
  heatsinks:   { name: '방열판',     en: 'Heatsinks',    type: 'buff', icon: 'gear', d: (n) => `힘 카드를 사용할 때마다 카드를 ${n}장 뽑습니다.` },
  storm:       { name: '폭풍',       en: 'Storm',        type: 'buff', icon: 'lightning', d: (n) => `힘 카드를 사용할 때마다 번개 구체 ${n}개를 충전합니다.` },
  machineLearning:{ name: '기계 학습', en: 'Machine Learning', type: 'buff', icon: 'gear', d: (n) => `턴 시작 시 카드를 ${n}장 더 뽑습니다.` },
  amplify:     { name: '증폭',       en: 'Amplify',      type: 'buff', decay: 'remove', icon: 'lightning', d: (n) => `이번 턴 힘 카드 ${n}장을 두 번 사용합니다.` },
  helloWorld:  { name: '헬로 월드',  en: 'Hello World',  type: 'buff', icon: 'book', d: (n) => `턴 시작 시 무작위 일반 카드 ${n}장을 손에 넣습니다.` },

  biasedCognition:{ name: '편향된 인식', en: 'Biased Cognition', type: 'debuff', icon: 'eye', d: (n) => `턴 시작 시 집중이 ${n} 감소합니다.` },

  // ---------- 와쳐 (자세/만트라) ----------
  mantra:      { name: '주문',       en: 'Mantra',       type: 'buff', icon: 'ring', d: (n) => `${n}/10 — 10이 되면 신성 자세에 들어갑니다.` },
  devotion:    { name: '헌신',       en: 'Devotion',     type: 'buff', icon: 'ring', d: (n) => `턴 시작 시 주문을 ${n} 얻습니다.` },
  establishment:{ name: '확립',      en: 'Establishment', type: 'buff', icon: 'shield', d: (n) => `보존되는 카드의 비용이 ${n} 감소합니다.` },
  battleHymn:  { name: '전투 찬가',  en: 'Battle Hymn',  type: 'buff', icon: 'flame', d: (n) => `턴 시작 시 강타 ${n}장을 손에 넣습니다.` },
  likeWater:   { name: '물처럼',     en: 'Like Water',   type: 'buff', icon: 'wave', d: (n) => `평온 자세에서 턴이 끝날 때 방어도 ${n}을 얻습니다.` },
  rushdown:    { name: '맹공',       en: 'Rushdown',     type: 'buff', icon: 'foot', d: (n) => `분노 자세에 들어갈 때 카드를 ${n}장 뽑습니다.` },
  mentalFortress:{ name: '정신 요새', en: 'Mental Fortress', type: 'buff', icon: 'shield', d: (n) => `자세를 바꿀 때마다 방어도 ${n}을 얻습니다.` },
  study:       { name: '연구',       en: 'Study',        type: 'buff', icon: 'book', d: (n) => `턴 종료 시 통찰 ${n}장을 뽑을 더미에 넣습니다.` },
  masterReality:{ name: '현실 조작', en: 'Master Reality', type: 'buff', stack: 'none', icon: 'star', d: () => `전투 중 생성되는 카드가 강화된 상태로 등장합니다.` },
  foresight:   { name: '예지',       en: 'Foresight',    type: 'buff', icon: 'eye', d: (n) => `턴 시작 시 통찰을 ${n} 사용합니다.` },
  nirvana:     { name: '열반',       en: 'Nirvana',      type: 'buff', icon: 'ring', d: (n) => `통찰할 때마다 방어도 ${n}을 얻습니다.` },
  devaForm:    { name: '데바 형상',  en: 'Deva Form',    type: 'buff', icon: 'crown', d: (n) => `턴 시작 시 에너지를 얻고 그 양이 매 턴 증가합니다. (현재 ${n})` },
  omega:       { name: '오메가',     en: 'Omega',        type: 'buff', icon: 'star', d: (n) => `턴 종료 시 모든 적에게 ${n}의 피해를 줍니다.` },
  wrathNext:   { name: '다음 턴 분노', en: 'Wrath Next Turn', type: 'buff', stack: 'none', icon: 'flame', d: () => `다음 턴에 분노 자세로 들어갑니다.` },
  freeSkill:   { name: '무료 기술',  en: 'Free Skill',   type: 'buff', decay: 'remove', icon: 'star', d: (n) => `이번 턴 기술 카드 ${n}장의 비용이 0이 됩니다.` },

  mark:        { name: '표식',       en: 'Mark',         type: 'debuff', icon: 'eye', d: (n) => `압점 카드를 사용하면 ${n}의 체력을 잃습니다.` },
  blockReturn: { name: '손과 대화',  en: 'Talk to the Hand', type: 'debuff', icon: 'shield', d: (n) => `이 적을 공격할 때마다 방어도 ${n}을 얻습니다.` },
  waveOfTheHand:{ name: '손짓',      en: 'Wave of the Hand', type: 'buff', decay: 'remove', icon: 'wave', d: (n) => `이번 턴 방어도를 얻을 때마다 모든 적에게 약화 ${n}을 부여합니다.` },
  blasphemer:  { name: '신성모독',   en: 'Blasphemer',   type: 'debuff', stack: 'none', decay: 'remove', icon: 'skull', d: () => `이번 턴이 끝나면 사망합니다.` },
  collect:     { name: '수집',       en: 'Collect',      type: 'buff', icon: 'star', d: (n) => `다음 ${n}턴 동안 턴 시작 시 강화된 기적을 1장 얻습니다.` },
  freeAttack:  { name: '무료 공격',  en: 'Free Attack',  type: 'buff', decay: 'remove', icon: 'sword', d: (n) => `이번 턴 공격 카드 ${n}장의 비용이 0이 됩니다.` },

  // ---------- 몬스터 전용 ----------
  curlUp:      { name: '웅크리기', en: 'Curl Up',     type: 'buff',   icon: 'curl', d: (n) => `처음 공격받을 때 방어도 ${n}을 얻습니다.` },
  angry:       { name: '성남',     en: 'Angry',       type: 'buff',   icon: 'angry',d: (n) => `공격받을 때마다 힘 ${n}을 얻습니다.` },
  spore:       { name: '포자 구름', en: 'Spore Cloud',type: 'buff',   icon: 'spore',d: (n) => `죽을 때 플레이어에게 취약 ${n}을 부여합니다.` },
  malleable:   { name: '가변성',   en: 'Malleable',   type: 'buff',   icon: 'mall', d: (n) => `공격받을 때 방어도 ${n}을 얻고, 이 수치가 증가합니다.` },
  flight:      { name: '비행',     en: 'Flight',      type: 'buff',   icon: 'flight',d:(n) => `받는 공격 피해가 절반이 됩니다. 공격받을 때마다 1 감소합니다.` },
  painfulStabs:{ name: '고통스러운 찌르기', en: 'Painful Stabs', type: 'buff', stack: 'none', icon: 'stab', d: () => `이 적의 공격은 버린 카드 더미에 상처를 넣습니다.` },
  sharpHide:   { name: '날카로운 가죽', en: 'Sharp Hide', type: 'buff', icon: 'hide', d: (n) => `공격 카드를 사용할 때마다 ${n}의 피해를 받습니다.` },
  modeShift:   { name: '형태 변환', en: 'Mode Shift', type: 'buff',   icon: 'mode', d: (n) => `피해를 ${n} 더 받으면 방어 형태로 전환합니다.` },
  beatOfDeath: { name: '죽음의 박동', en: 'Beat of Death', type: 'buff', icon: 'beat', d: (n) => `카드를 사용할 때마다 ${n}의 피해를 받습니다.` },
  invincible:  { name: '무적',     en: 'Invincible',  type: 'buff',   icon: 'inv',  d: (n) => `이번 턴에 최대 ${n}의 피해만 받을 수 있습니다.` },
  timeWarp:    { name: '시간 왜곡', en: 'Time Warp',  type: 'buff',   icon: 'time', d: (n) => `카드를 12장 사용하면 턴이 종료되고 힘 2를 얻습니다. (${n}/12)` },
  slow:        { name: '둔화',     en: 'Slow',        type: 'debuff', icon: 'slow', d: (n) => `이번 전투에서 사용한 카드 1장당 받는 피해가 10% 증가합니다. (${n}장)` },
  minion:      { name: '수하',     en: 'Minion',      type: 'buff',   stack: 'none', icon: 'minion', d: () => `이 적은 수하입니다. 주인이 죽으면 도망칩니다.` },
  unawakened:  { name: '각성 전',  en: 'Unawakened',  type: 'buff',   stack: 'none', icon: 'unaw', d: () => `아직 깨어나지 않았습니다.` },
  curiosity:   { name: '호기심',   en: 'Curiosity',   type: 'buff',   icon: 'curio',d: (n) => `플레이어가 힘 카드를 사용할 때마다 힘 ${n}을 얻습니다.` },
  lifeLink:    { name: '생명 연결', en: 'Life Link',  type: 'buff',   stack: 'none', icon: 'link', d: () => `다른 개체가 살아있으면 2턴 후 부활합니다.` },
  reactive:    { name: '반응',     en: 'Reactive',    type: 'buff',   stack: 'none', icon: 'react',d: () => `피해를 받으면 의도를 변경합니다.` },
  split:       { name: '분열',     en: 'Split',       type: 'buff',   stack: 'none', icon: 'split',d: () => `체력이 절반 이하가 되면 둘로 나뉩니다.` },
  enrage:      { name: '격노',     en: 'Enrage',      type: 'buff',   icon: 'enr',  d: (n) => `플레이어가 기술 카드를 사용할 때마다 힘 ${n}을 얻습니다.` },
  anger:       { name: '분노(적)', en: 'Anger',       type: 'buff',   icon: 'angry',d: (n) => `공격받을 때마다 힘 ${n}을 얻습니다.` },
  stasis:      { name: '정체',     en: 'Stasis',      type: 'buff',   stack: 'none', icon: 'stasis', d: () => `죽을 때 훔친 카드를 돌려줍니다.` },
  thievery:    { name: '도둑질',   en: 'Thievery',    type: 'buff',   icon: 'thief',d: (n) => `공격 시 골드를 ${n} 훔칩니다.` },
  // 디버프로 취급되지 않아야 하는 예외 처리를 위한 표식
};

/** 디버프 여부 */
export const isDebuff = (id) => POWERS[id]?.type === 'debuff';
export const powerName = (id) => POWERS[id]?.name || id;
export const powerDesc = (id, n) => (POWERS[id]?.d ? POWERS[id].d(n) : '');
/** 수치가 표시되지 않는(단일) 힘인지 */
export const isSingleton = (id) => POWERS[id]?.stack === 'none';
