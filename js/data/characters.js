// ============================================================
//  플레이 가능한 캐릭터 4종
// ============================================================
export const CHARACTERS = {
  ironclad: {
    id: 'ironclad', name: '아이언클래드', en: 'Ironclad', color: 'red',
    maxHp: 80, gold: 99, relic: 'burningBlood',
    deck: [['strike_r', 5], ['defend_r', 4], ['bash', 1]],
    tagline: '체력과 화력의 전사',
    desc: '잃은 체력을 되찾으며 정면으로 부딪칩니다. 힘을 쌓아 한 방에 쓸어버리세요.',
    accent: '#d0392b',
    model: { armor: '#8b2f2f', trim: '#c8b8a0', skin: '#d8b090', cape: '#9a2626', weapon: 'sword', horns: true, eye: '#ff5030' },
  },
  silent: {
    id: 'silent', name: '사일런트', en: 'Silent', color: 'green',
    maxHp: 70, gold: 99, relic: 'ringOfTheSnake',
    deck: [['strike_g', 5], ['defend_g', 5], ['neutralize', 1], ['survivor', 1]],
    tagline: '독과 칼날의 암살자',
    desc: '중독을 쌓고 단검을 뿌립니다. 카드를 많이 뽑아 연계하세요.',
    accent: '#3fbf6a',
    model: { armor: '#2f6b45', trim: '#8ad0a0', skin: '#e0c0a0', cape: '#1f4a30', weapon: 'dagger', hood: true, eye: '#7cff9a' },
  },
  defect: {
    id: 'defect', name: '디펙트', en: 'Defect', color: 'blue',
    maxHp: 75, gold: 99, relic: 'crackedCore', orbSlots: 3,
    deck: [['strike_b', 4], ['defend_b', 4], ['zap', 1], ['dualcast', 1]],
    tagline: '구체를 부리는 자동인형',
    desc: '번개·냉기·암흑·플라즈마 구체를 충전하고 발동시켜 싸웁니다.',
    accent: '#4aa8e8',
    model: { armor: '#2f5a8b', trim: '#90d0ff', skin: '#a0c8e0', weapon: 'orb', orbs: true, eye: '#7cd0ff' },
  },
  watcher: {
    id: 'watcher', name: '와쳐', en: 'Watcher', color: 'purple',
    maxHp: 72, gold: 99, relic: 'pureWater',
    deck: [['strike_p', 4], ['defend_p', 4], ['eruption', 1], ['vigilance', 1]],
    tagline: '자세를 바꾸는 수도승',
    desc: '분노·평온·신성 자세를 오가며 폭발적인 피해를 냅니다.',
    accent: '#9a6ae0',
    model: { armor: '#4a2f7a', trim: '#d0b0ff', skin: '#e8c8a0', cape: '#6a3fa0', weapon: 'staff', blindfold: true, eye: '#c8a0ff' },
  },
};

export const CHAR_LIST = ['ironclad', 'silent', 'defect', 'watcher'];
export const charOf = (id) => CHARACTERS[id] || CHARACTERS.ironclad;
