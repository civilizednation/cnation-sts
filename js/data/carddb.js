// ============================================================
//  카드 DB 코어 : 정의 레지스트리 + 카드 인스턴스
// ============================================================
import { uid } from '../util.js';

export const TYPE = { ATTACK: 'attack', SKILL: 'skill', POWER: 'power', STATUS: 'status', CURSE: 'curse' };
export const TARGET = { ENEMY: 'enemy', ALL: 'all', SELF: 'self', NONE: 'none' };
export const RARITY = { BASIC: 'basic', COMMON: 'common', UNCOMMON: 'uncommon', RARE: 'rare', SPECIAL: 'special', CURSE: 'curse' };
export const COLOR = { RED: 'red', GREEN: 'green', BLUE: 'blue', PURPLE: 'purple', COLORLESS: 'colorless', CURSE: 'curse', STATUS: 'status' };

export const TYPE_KR = { attack: '공격', skill: '기술', power: '힘', status: '상태이상', curse: '저주' };
export const RARITY_KR = { basic: '기본', common: '일반', uncommon: '고급', rare: '희귀', special: '특수', curse: '저주' };

/** id -> 카드 정의 */
export const CARD_DEFS = {};

/** 카드 정의 등록 */
export function def(o) {
  if (CARD_DEFS[o.id]) console.warn('중복 카드 id:', o.id);
  CARD_DEFS[o.id] = o;
  return o;
}

/** 카드 인스턴스 : 덱 안의 실제 카드 한 장 */
export class Card {
  constructor(id, upgraded = false) {
    const d = CARD_DEFS[id];
    if (!d) throw new Error('알 수 없는 카드: ' + id);
    this.uid = uid();
    this.id = id;
    this.def = d;
    this.upgraded = !!upgraded;
    this.upgradeCount = upgraded ? 1 : 0;
    this.costOverride = null;   // 이 전투 동안 비용 고정 (혼란, 광기 등)
    this.costForTurn = null;    // 이번 턴만 비용 (타락 등)
    this.freeOnce = false;      // 1회 무료
    this.bonusDmg = 0;          // 전투 중 영구 피해 증가 (광란 등)
    this.temporary = false;     // 전투 종료 시 사라지는 카드
    this.purgeOnEnd = false;
  }
  /** 업그레이드 반영 수치 */
  v(key) {
    const d = this.def;
    const up = d[key + 'U'];
    if (this.upgraded && up !== undefined) return up;
    return d[key];
  }
  get name() {
    if (!this.upgraded) return this.def.name;
    if (this.def.nameU) return this.def.nameU;
    return this.def.name + (this.upgradeCount > 1 ? `+${this.upgradeCount}` : '+');
  }
  get en() { return this.def.en; }
  get type() { return this.def.type; }
  get color() { return this.def.color; }
  get rarity() { return this.def.rarity; }
  get target() { return this.def.target || TARGET.NONE; }
  get exhaust() { return !!(this.upgraded && this.def.exhaustU !== undefined ? this.def.exhaustU : this.def.exhaust); }
  get ethereal() { return !!(this.upgraded && this.def.etherealU !== undefined ? this.def.etherealU : this.def.ethereal); }
  get innate() { return !!(this.upgraded && this.def.innateU !== undefined ? this.def.innateU : this.def.innate); }
  get retain() { return !!(this.upgraded && this.def.retainU !== undefined ? this.def.retainU : this.def.retain); }
  get unplayable() { return !!this.def.unplayable; }
  get isXCost() { return this.baseCost === -1; }
  get baseCost() { const c = this.v('cost'); return c === undefined ? 0 : c; }
  /** 실제 비용 (전투 상태 반영 전) */
  get cost() {
    if (this.freeOnce) return 0;
    if (this.costForTurn !== null) return this.costForTurn;
    if (this.costOverride !== null) return this.costOverride;
    return this.baseCost;
  }
  get costText() {
    if (this.unplayable) return '-';
    if (this.isXCost) return 'X';
    return String(this.cost);
  }
  get costChanged() {
    return !this.isXCost && this.cost !== this.baseCost;
  }
  /** 설명문 */
  text() { return this.def.text ? this.def.text(this) : ''; }
  /** 업그레이드 가능 여부 */
  canUpgrade() {
    if (this.def.noUpgrade) return false;
    if (this.def.infiniteUpgrade) return true;
    return !this.upgraded;
  }
  upgrade() {
    if (!this.canUpgrade()) return false;
    this.upgraded = true;
    this.upgradeCount++;
    if (this.def.onUpgrade) this.def.onUpgrade(this);
    return true;
  }
  copy() {
    const c = new Card(this.id, this.upgraded);
    c.upgradeCount = this.upgradeCount;
    c.bonusDmg = this.bonusDmg;
    c.costOverride = this.costOverride;
    if (this.def.infiniteUpgrade) c.searingN = this.searingN;
    return c;
  }
  /** 저장용 직렬화 */
  toJSON() { return { id: this.id, u: this.upgradeCount }; }
  static fromJSON(o) {
    const c = new Card(o.id, o.u > 0);
    c.upgradeCount = o.u || 0;
    return c;
  }
}

export const mk = (id, up = false) => new Card(id, up);

/** 카드 풀 조회 : 보상/상점용 */
export function pool({ color, rarity, exclude = [] }) {
  return Object.values(CARD_DEFS).filter((d) =>
    d.color === color && d.rarity === rarity && !d.noPool && !exclude.includes(d.id));
}

export function allOf(color) {
  return Object.values(CARD_DEFS).filter((d) => d.color === color && !d.noPool);
}
