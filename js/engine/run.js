// ============================================================
//  런(Run) 진행 : 지도 생성 / 방 처리 / 보상 / 저장
// ============================================================
import { RNG } from '../util.js';
import '../data/cards.js';
import { Card, CARD_DEFS, mk, pool } from '../data/carddb.js';
import { RELICS, RELIC_POOLS, relicAllowed } from '../data/relics.js';
import { CHARACTERS, charOf } from '../data/characters.js';
import { POTIONS, POTION_POOL } from '../data/potions.js';
import { ENCOUNTERS, MONSTERS, OPENING_ENCOUNTERS } from '../data/monsters.js';
import { Actor } from './battle.js';
import { CURSE_POOL } from '../data/cards_colorless.js';

// 총 50층 : 1막 1~17(보스 17) / 2막 18~34(보스 34) / 3막 35~50(보스 50)
export const ACT_RANGES = [
  { act: 1, start: 1, rows: 16, boss: 17 },
  { act: 2, start: 18, rows: 16, boss: 34 },
  { act: 3, start: 35, rows: 15, boss: 50 },
];

export const ROOM = {
  MONSTER: 'monster', ELITE: 'elite', EVENT: 'event',
  REST: 'rest', SHOP: 'shop', TREASURE: 'treasure', BOSS: 'boss',
};

export const ROOM_KR = {
  monster: '전투', elite: '엘리트', event: '의문', rest: '모닥불',
  shop: '상점', treasure: '보물', boss: '보스',
};

/** 캐릭터별 시작 덱 */
function starterDeck(ch) {
  const d = [];
  ch.deck.forEach(([id, n]) => { for (let i = 0; i < n; i++) d.push(mk(id)); });
  return d;
}

export class Run {
  constructor(seed, charId = 'ironclad') {
    this.seed = seed || Math.floor(Math.random() * 1e9);
    this.rng = new RNG(this.seed);
    const ch = charOf(charId);
    this.character = ch;
    this.charId = ch.id;
    this.charColor = ch.color;
    this.charName = ch.name;
    this.player = new Actor({ name: ch.name, maxHp: ch.maxHp, hp: ch.maxHp, isPlayer: true });
    this.deck = starterDeck(ch);
    this.relics = [{ id: ch.relic, counter: RELICS[ch.relic] && RELICS[ch.relic].counter !== undefined ? RELICS[ch.relic].counter : 0 }];
    this.potions = [null, null, null];
    this.potionSlots = 3;
    this.gold = ch.gold;
    this.floor = 1;
    this.act = 1;
    this.flags = {};
    this.cardRarityBonus = 0;   // 희귀 카드 등장 보정
    this.potionChance = 40;
    this.monsterQueue = [];
    this.eliteQueue = [];
    this.unknownChance = { monster: 10, shop: 3, treasure: 2 };
    this.startedAt = Date.now();   // 통계용 : 이 런을 시작한 시각
    // 오른 길 : 층마다 한 줄씩 쌓인다. 엔딩 화면이 1층부터 50층까지 되짚어 준다.
    // stats 는 합계만 세고 map 은 지금 막의 것만 남아서(막마다 새로 만든다)
    // 지나온 길을 알려면 따로 적어 두는 수밖에 없다.
    this.journal = [];
    // 시작 보너스 화면의 숨겨진 선택지 — 최대 체력·공격·방어·물약 효과가 2배
    this.cheat = false;
    this.usedEvents = [];
    this.stats = { kills: 0, elites: 0, bosses: 0, damageTaken: 0, floorsClimbed: 0 };
    this.buildAct(1);
  }

  // ---------------- 유물 ----------------
  hasRelic(id) { return this.relics.some((r) => r.id === id); }
  relicObj(id) { return this.relics.find((r) => r.id === id); }
  addRelic(id) {
    if (this.hasRelic(id)) return false;
    const d = RELICS[id];
    if (!d) return false;
    const r = { id, counter: d.counter !== undefined ? d.counter : 0 };
    // 검은 피는 작열하는 피를 대체
    if (id === 'blackBlood') this.relics = this.relics.filter((x) => x.id !== 'burningBlood');
    this.relics.push(r);
    if (d.onEquip) d.onEquip(this, r);
    if (id === 'potionBelt') { /* onEquip 에서 처리 */ }
    return true;
  }
  relicHook(name, ...args) {
    for (const r of [...this.relics]) {
      const d = RELICS[r.id];
      if (d && d[name]) d[name](...args, r);
    }
  }
  energyBonus(kind) {
    let e = 0;
    this.relics.forEach((r) => { if (RELICS[r.id] && RELICS[r.id].energy) e += RELICS[r.id].energy; });
    if (this.hasRelic('slaversCollar') && (kind === 'elite' || kind === 'boss')) e += 1;
    return e;
  }

  // ---------------- 체력 / 골드 ----------------
  healPlayer(n) { this.player.hp = Math.min(this.player.maxHp, this.player.hp + n); }
  gainMaxHp(n) { this.player.maxHp += n; this.player.hp += n; }
  loseMaxHp(n) { this.player.maxHp = Math.max(1, this.player.maxHp - n); this.player.hp = Math.min(this.player.hp, this.player.maxHp); }
  gainGold(n) { if (this.hasRelic('ectoplasm')) return; this.gold += this.cheat ? n * 2 : n; }   // 숨겨진 시작 보너스 : 얻는 골드 2배
  spendGold(n) { this.gold = Math.max(0, this.gold - n); this.relicHook('onSpendGold', this); }

  // ---------------- 덱 조작 ----------------
  addCard(card) {
    // 알 유물 : 획득 시 강화
    if (card.type === 'attack' && this.hasRelic('moltenEgg')) card.upgrade();
    if (card.type === 'skill' && this.hasRelic('toxicEgg')) card.upgrade();
    if (card.type === 'power' && this.hasRelic('frozenEgg')) card.upgrade();
    this.deck.push(card);
    this.relicHook('onObtainCard', this, card);
    if (card.type === 'curse') this.relicHook('onObtainCurse', this, card);
    return card;
  }
  addCurse(id) {
    if (this.hasRelic('omamori')) {
      const r = this.relicObj('omamori');
      if (r.counter > 0) { r.counter--; return null; }
    }
    return this.addCard(mk(id));
  }
  removeCard(card) {
    const i = this.deck.findIndex((c) => c.uid === card.uid);
    if (i >= 0) {
      if (card.id === 'parasite') this.loseMaxHp(3);
      this.deck.splice(i, 1);
    }
  }
  upgradeRandom(filter, n) {
    const cand = this.rng.shuffle(this.deck.filter((c) => c.canUpgrade() && filter(c)));
    cand.slice(0, n).forEach((c) => c.upgrade());
  }

  // ---------------- 물약 ----------------
  potionSpace() { return this.potions.slice(0, this.potionSlots).some((p) => p === null || p === undefined); }
  addPotion(id) {
    if (this.hasRelic('sozu')) return false;
    for (let i = 0; i < this.potionSlots; i++) {
      if (!this.potions[i]) { this.potions[i] = { id }; return true; }
    }
    return false;
  }
  fillPotions() {
    for (let i = 0; i < this.potionSlots; i++) {
      if (!this.potions[i]) this.potions[i] = { id: this.randomPotion() };
    }
  }
  randomPotion() {
    const roll = this.rng.next();
    const rar = roll < 0.65 ? 'common' : roll < 0.9 ? 'uncommon' : 'rare';
    const list = POTION_POOL.filter((p) => p.rarity === rar);
    return this.rng.pick(list.length ? list : POTION_POOL).id;
  }

  // ---------------- 지도 생성 ----------------
  buildAct(act) {
    this.act = act;
    const info = ACT_RANGES[act - 1];
    this.actInfo = info;
    this.map = this.generateMap(info);
    this.mapPos = null; // {row, col}
    this.monsterCount = 0;
    this.monsterQueue = this.rng.shuffle(ENCOUNTERS[act].weak.slice());
    this.strongQueue = this.rng.shuffle(ENCOUNTERS[act].strong.slice());
    this.eliteQueue = this.rng.shuffle(ENCOUNTERS[act].elite.slice());
    this.bossEncounter = this.rng.pick(ENCOUNTERS[act].boss);
  }

  generateMap(info) {
    const rows = info.rows;
    const map = [];
    for (let r = 0; r < rows; r++) {
      const n = r === 0 ? 3 : this.rng.range(2, 4);
      const nodes = [];
      for (let c = 0; c < n; c++) {
        nodes.push({ row: r, col: c, type: this.pickRoomType(r, rows), next: [], visited: false });
      }
      map.push(nodes);
    }
    // 연결 : 각 노드는 다음 행의 1~2개 노드와 연결
    for (let r = 0; r < rows - 1; r++) {
      const cur = map[r], nxt = map[r + 1];
      cur.forEach((node, i) => {
        const ratio = cur.length === 1 ? 0.5 : i / (cur.length - 1);
        let base = Math.round(ratio * (nxt.length - 1));
        const links = new Set([base]);
        if (this.rng.chance(0.45)) links.add(Math.max(0, Math.min(nxt.length - 1, base + (this.rng.chance(0.5) ? 1 : -1))));
        links.forEach((k) => node.next.push(k));
      });
      // 도달 불가 노드 방지
      nxt.forEach((_, j) => {
        if (!cur.some((node) => node.next.includes(j))) {
          const pick = cur[Math.min(cur.length - 1, Math.round((j / Math.max(1, nxt.length - 1)) * (cur.length - 1)))];
          pick.next.push(j);
        }
      });
    }
    return map;
  }

  pickRoomType(r, rows) {
    if (r === 0) return ROOM.MONSTER;
    if (r === 1) return this.rng.chance(0.5) ? ROOM.MONSTER : ROOM.EVENT;
    if (r === Math.floor(rows / 2)) return ROOM.TREASURE;
    if (r === rows - 1) return ROOM.REST;
    const w = [
      { w: 45, t: ROOM.MONSTER },
      { w: 22, t: ROOM.EVENT },
      { w: r >= 4 ? 16 : 0, t: ROOM.ELITE },
      { w: 12, t: ROOM.REST },
      { w: 5, t: ROOM.SHOP },
    ];
    return this.rng.weighted(w).t;
  }

  /** ? 방에 들어갔을 때 실제 방 종류를 결정 (원작의 누적 확률 방식) */
  resolveUnknown() {
    // 작은 상자 : 4번째 ? 방마다 보물 방
    const tc = this.relicObj('tinyChest');
    if (tc) {
      tc.counter = (tc.counter || 0) + 1;
      if (tc.counter % 4 === 0) return ROOM.TREASURE;
    }
    const c = this.unknownChance;
    const r = this.rng.next() * 100;
    // 염주 팔찌 : 일반 전투가 나타나지 않음
    const mon = this.hasRelic('juzuBracelet') ? 0 : c.monster;
    if (r < mon) { c.monster = 10; return ROOM.MONSTER; }
    if (r < mon + c.shop) { c.shop = 3; return ROOM.SHOP; }
    if (r < mon + c.shop + c.treasure) { c.treasure = 2; return ROOM.TREASURE; }
    c.monster += 10; c.shop += 3; c.treasure += 2;
    return ROOM.EVENT;
  }

  /** 현재 선택 가능한 노드들 */
  availableNodes() {
    if (!this.map) return [];
    if (this.mapPos === null) return this.map[0].map((n, i) => ({ row: 0, col: i }));
    const { row, col } = this.mapPos;
    if (row >= this.map.length - 1) return [{ row: -1, col: -1, boss: true }];
    const linked = this.map[row][col].next;
    const wb = this.relicObj('wingBoots');
    if (wb && wb.counter > 0) {
      // 날개 부츠 : 경로를 무시하고 다음 행의 아무 방이나 선택 가능
      return this.map[row + 1].map((n, i) => ({ row: row + 1, col: i, fly: !linked.includes(i) }));
    }
    return linked.map((c) => ({ row: row + 1, col: c }));
  }
  nodeAt(pos) {
    if (!pos || pos.boss) return { type: ROOM.BOSS };
    return this.map[pos.row][pos.col];
  }

  /** 노드 진입 */
  enterNode(pos) {
    if (pos.fly) {
      const wb = this.relicObj('wingBoots');
      if (wb && wb.counter > 0) wb.counter--;
    }
    this.mapPos = pos.boss ? { row: this.map.length, col: 0, boss: true } : pos;
    this.floor = pos.boss ? this.actInfo.boss : this.actInfo.start + pos.row;
    this.stats.floorsClimbed++;
    this.relicHook('onClimb', this);
    if (!pos.boss) this.map[pos.row][pos.col].visited = true;
    const node = pos.boss ? { type: ROOM.BOSS } : this.map[pos.row][pos.col];
    const row = { f: this.floor, a: this.act, t: node.type };
    if (node.type === ROOM.BOSS) row.b = this.bossEncounter.slice();   // 어느 보스였는지
    this.journal.push(row);
    return node;
  }

  // ---------------- 조우 생성 ----------------
  makeEncounter(type) {
    if (type === ROOM.BOSS) return { kind: 'boss', monsters: this.bossEncounter.slice() };
    if (type === ROOM.ELITE) {
      if (!this.eliteQueue.length) this.eliteQueue = this.rng.shuffle(ENCOUNTERS[this.act].elite.slice());
      return { kind: 'elite', monsters: this.eliteQueue.pop().slice() };
    }
    this.monsterCount++;
    const weakCount = this.act === 1 ? 3 : 2;
    let list;
    let tuning = null;
    // 1막 초반 2번의 전투는 몸풀기용으로 약하게 조정한다
    if (this.act === 1 && this.monsterCount === 1) {
      list = this.rng.pick(OPENING_ENCOUNTERS);
      tuning = { hp: 0.75, dmg: 0.7, label: '약함' };
    } else if (this.monsterCount <= weakCount) {
      if (!this.monsterQueue.length) this.monsterQueue = this.rng.shuffle(ENCOUNTERS[this.act].weak.slice());
      list = this.monsterQueue.pop();
    } else {
      if (!this.strongQueue.length) this.strongQueue = this.rng.shuffle(ENCOUNTERS[this.act].strong.slice());
      list = this.strongQueue.pop();
    }
    return { kind: 'normal', monsters: list.slice(), tuning };
  }

  // ---------------- 보상 ----------------
  goldReward(kind) {
    if (kind === 'boss') return this.rng.range(95, 105);
    if (kind === 'elite') return this.rng.range(25, 35);
    return this.rng.range(10, 20);
  }

  cardRewardCount(kind) {
    let n = 3;
    if (this.hasRelic('questionCard')) n++;
    if (this.hasRelic('bustedCrown')) n -= 2;
    if (this.hasRelic('prayerWheel') && kind === 'normal') n++;
    return Math.max(1, n);
  }

  rollCardRarity(kind) {
    let r = this.rng.next() * 100 + this.cardRarityBonus;
    if (kind === 'elite') r += 10;
    if (r > 96) { this.cardRarityBonus = -5; return 'rare'; }
    if (r > 60) return 'uncommon';
    this.cardRarityBonus = Math.min(40, this.cardRarityBonus + 1);
    return 'common';
  }

  cardReward(kind = 'normal') {
    const n = this.cardRewardCount(kind);
    const out = [];
    const used = new Set();
    let guard = 0;
    while (out.length < n && guard++ < 100) {
      const rar = this.rollCardRarity(kind);
      const list = Object.values(CARD_DEFS).filter((d) =>
        (d.color === this.charColor) && d.rarity === rar && !d.noPool && !used.has(d.id));
      if (!list.length) continue;
      const d = this.rng.pick(list);
      used.add(d.id);
      const c = new Card(d.id);
      // 획득 시 강화 확률 (1막 0%, 2막 12.5%, 3막 25%)
      const upChance = this.act === 1 ? 0 : this.act === 2 ? 0.125 : 0.25;
      if (this.rng.chance(upChance) && c.canUpgrade()) c.upgrade();
      out.push(c);
    }
    return out;
  }

  colorlessReward(rarity) {
    const list = Object.values(CARD_DEFS).filter((d) => d.color === 'colorless' && d.rarity === rarity && !d.noPool);
    return list.length ? new Card(this.rng.pick(list).id) : null;
  }

  rollPotionDrop() {
    if (this.hasRelic('whiteBeastStatue')) return true;
    const ok = this.rng.next() * 100 < this.potionChance;
    this.potionChance += ok ? -10 : 10;
    this.potionChance = Math.max(0, Math.min(100, this.potionChance));
    return ok;
  }

  relicReward(forcedRarity) {
    const rar = forcedRarity || (() => {
      const r = this.rng.next();
      return r < 0.5 ? 'common' : r < 0.83 ? 'uncommon' : 'rare';
    })();
    return this.pickRelic(rar);
  }

  pickRelic(rarity) {
    const order = ['common', 'uncommon', 'rare', 'boss'];
    let idx = order.indexOf(rarity);
    for (let k = 0; k < order.length; k++) {
      const rar = order[(idx + k) % order.length];
      const avail = (RELIC_POOLS[rar] || []).filter((id) =>
        !this.hasRelic(id) && !this.blockedRelic(id) && relicAllowed(id, this.charColor));
      if (avail.length) return this.rng.pick(avail);
    }
    return null;
  }
  blockedRelic(id) {
    if (id === 'blackBlood') return this.charColor !== 'red';
    if (id === 'bottledFlame' || id === 'bottledLightning' || id === 'bottledTornado') {
      const t = { bottledFlame: 'attack', bottledLightning: 'skill', bottledTornado: 'power' }[id];
      return !this.deck.some((c) => c.type === t);
    }
    return false;
  }

  bossRelicChoices() {
    const avail = RELIC_POOLS.boss.filter((id) => !this.hasRelic(id) && relicAllowed(id, this.charColor));
    return this.rng.shuffle(avail).slice(0, 3);
  }

  // ---------------- 막 전환 ----------------
  /** 보스 처치 후 : 원작 규칙대로 다음 막은 체력을 모두 회복한 상태로 시작 */
  advanceAct() {
    if (this.act >= 3) return false;
    this.buildAct(this.act + 1);
    this.floor = this.actInfo.start;      // 다음 막 시작 층
    this.player.hp = this.player.maxHp;   // 중간 보스 클리어 → 체력 완전 회복
    return true;
  }

  isFinalBossDone() { return this.act === 3 && this.floor >= 50 && this.finished; }

  // ---------------- 저장 / 불러오기 ----------------
  toJSON() {
    return {
      seed: this.seed, charId: this.charId, rngSeed: this.rng.seed, act: this.act, floor: this.floor,
      hp: this.player.hp, maxHp: this.player.maxHp, gold: this.gold,
      deck: this.deck.map((c) => c.toJSON()),
      relics: this.relics, potions: this.potions, potionSlots: this.potionSlots,
      map: this.map.map((row) => row.map((n) => ({ t: n.type, x: n.next, v: n.visited }))),
      mapPos: this.mapPos, flags: this.flags, stats: this.stats,
      monsterCount: this.monsterCount, cardRarityBonus: this.cardRarityBonus,
      potionChance: this.potionChance, bossEncounter: this.bossEncounter,
      usedEvents: this.usedEvents, unknownChance: this.unknownChance, cheat: this.cheat,
      startedAt: this.startedAt, journal: this.journal,
    };
  }

  static fromJSON(o) {
    const r = new Run(o.seed, o.charId || 'ironclad');
    r.rng.seed = o.rngSeed;
    r.act = o.act; r.floor = o.floor;
    r.actInfo = ACT_RANGES[r.act - 1];
    r.player.hp = o.hp; r.player.maxHp = o.maxHp;
    r.gold = o.gold;
    r.deck = o.deck.map((c) => Card.fromJSON(c));
    r.relics = o.relics; r.potions = o.potions; r.potionSlots = o.potionSlots;
    r.map = o.map.map((row, ri) => row.map((n, ci) => ({ row: ri, col: ci, type: n.t, next: n.x, visited: n.v })));
    r.mapPos = o.mapPos; r.flags = o.flags || {}; r.stats = o.stats || r.stats;
    r.monsterCount = o.monsterCount || 0;
    r.cardRarityBonus = o.cardRarityBonus || 0;
    r.potionChance = o.potionChance === undefined ? 40 : o.potionChance;
    r.bossEncounter = o.bossEncounter;
    r.usedEvents = o.usedEvents || [];
    r.unknownChance = o.unknownChance || { monster: 10, shop: 3, treasure: 2 };
    r.cheat = !!o.cheat;
    r.startedAt = o.startedAt || Date.now();
    r.journal = Array.isArray(o.journal) ? o.journal : [];   // 1.3.14 이전 저장에는 없다
    r.monsterQueue = r.rng.shuffle(ENCOUNTERS[r.act].weak.slice());
    r.strongQueue = r.rng.shuffle(ENCOUNTERS[r.act].strong.slice());
    r.eliteQueue = r.rng.shuffle(ENCOUNTERS[r.act].elite.slice());
    return r;
  }
}

// 저장 키는 계정(프로필)마다 다르다. main.js 가 계정을 고를 때 지정한다.
export const SAVE_KEY = 'cnation_sts_save_v1';   // 계정 도입 전 키 (이전용으로만 남겨 둔다)
let saveKey = SAVE_KEY;
export function setSaveKey(k) { saveKey = k || SAVE_KEY; }
export function getSaveKey() { return saveKey; }

export function saveRun(run) {
  try { localStorage.setItem(saveKey, JSON.stringify(run.toJSON())); } catch (e) { console.warn('저장 실패', e); }
}
export function loadRun() {
  try {
    const s = localStorage.getItem(saveKey);
    if (!s) return null;
    return Run.fromJSON(JSON.parse(s));
  } catch (e) { console.warn('불러오기 실패', e); return null; }
}
export function clearSave() { try { localStorage.removeItem(saveKey); } catch (e) {} }
