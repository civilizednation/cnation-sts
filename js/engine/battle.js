// ============================================================
//  전투 엔진 : 턴 진행 / 피해 계산 / 카드 사용 / 적 AI
// ============================================================
import { POWERS, isDebuff } from './powers.js';
import { MONSTERS, GREMLIN_POOL } from '../data/monsters.js';
import '../data/cards.js';
import { CARD_DEFS, Card, mk, TYPE } from '../data/carddb.js';
import { RELICS } from '../data/relics.js';
import { uid } from '../util.js';

export class Actor {
  constructor(o) {
    Object.assign(this, {
      uid: uid(), name: '?', maxHp: 10, hp: 10, block: 0, powers: {},
      alive: true, isPlayer: false, history: [], intent: null, idx: 0,
    }, o);
  }
  get hpPct() { return Math.max(0, this.hp) / this.maxHp; }
}

const A = TYPE.ATTACK, S = TYPE.SKILL, P = TYPE.POWER;
export const STANCE_KR = { neutral: '무자세', wrath: '분노', calm: '평온', divinity: '신성' };

export class Battle {
  constructor(run, encounter, ui) {
    this.run = run;
    this.ui = ui;
    this.rng = run.rng;
    this.encounter = encounter;
    this.player = run.player;
    this.enemies = [];
    this.hand = []; this.drawPile = []; this.discardPile = []; this.exhaustPile = [];
    this.energy = 0; this.baseEnergy = 3;
    this.turn = 0;
    this.over = false; this.won = false; this.escaped = false;
    this.cardsPlayedThisTurn = 0; this.cardsPlayedThisCombat = 0;
    this.panacheCount = 0;
    this.powersPlayed = 0;
    this.prideQueue = [];
    this.bombs = [];
    this.penNibActive = false;
    this.hpLostThisCombat = 0;
    // 디펙트 : 구체
    this.channeledCount = { lightning: 0, frost: 0, dark: 0, plasma: 0 };
    this.orbs = [];
    // 구체 시스템은 디펙트 전용. 다른 캐릭터는 빈 슬롯도 표시하지 않는다.
    this.usesOrbs = !!(run.character && run.character.orbSlots);
    this.orbSlots = this.usesOrbs ? run.character.orbSlots : 3;
    // 와쳐 : 자세
    this.stance = 'neutral';
    this.firstCardThisTurn = true;
    this.awaitingInput = false;
    this.spawnEnemies(encounter.monsters);
  }

  // ---------------- 로그 / 연출 ----------------
  log(msg) { this.ui.log && this.ui.log(msg); }
  fx(type, data = {}) { this.ui.fx && this.ui.fx(type, data); }
  async wait(ms) { if (this.ui.wait) await this.ui.wait(ms); }
  render() { this.ui.render && this.ui.render(); }

  // ---------------- 적 생성 ----------------
  spawnEnemies(ids) {
    ids.forEach((mid, i) => this.addEnemy(mid, i));
  }
  addEnemy(mid, idx) {
    const d = MONSTERS[mid];
    let hp = this.rng.range(d.hp[0], d.hp[1]);
    if (this.encounter.tuning && this.encounter.tuning.hp) hp = Math.max(1, Math.round(hp * this.encounter.tuning.hp));
    if (this.encounter.kind === 'elite' && this.run.hasRelic('preservedInsect')) hp = Math.ceil(hp * 0.75);
    const e = new Actor({
      name: d.name, en: d.en, mid, maxHp: hp, hp, idx: idx !== undefined ? idx : this.enemies.length,
      def: d, isMinion: !!d.minion, shape: d.shape,
    });
    this.enemies.push(e);
    return e;
  }

  living() { return this.enemies.filter((e) => e.alive); }
  allActors() { return [this.player, ...this.living()]; }

  // ---------------- 힘/상태이상 ----------------
  pow(a, id) { return a.powers[id] || 0; }
  setPower(a, id, v) { a.powers[id] = v; }
  removePower(a, id) { delete a.powers[id]; }

  addPower(target, id, amount, source = null, silent = false) {
    if (!target || !target.alive || amount === 0) return;
    const pdef = POWERS[id];
    const debuff = pdef ? pdef.type === 'debuff' : false;
    const isNegative = debuff || (id === 'strength' && amount < 0) || (id === 'dexterity' && amount < 0);

    if (target.isPlayer) {
      if (id === 'weak' && this.run.hasRelic('ginger')) { this.log('생강이 약화를 막았다.'); return; }
      if (id === 'frail' && this.run.hasRelic('turnip')) { this.log('순무가 허약을 막았다.'); return; }
    }
    // 인공물 : 디버프 1개 무효화
    if (isNegative) {
      if (this.pow(target, 'artifact') > 0 && source !== target) {
        this.setPower(target, 'artifact', this.pow(target, 'artifact') - 1);
        if (this.pow(target, 'artifact') <= 0) this.removePower(target, 'artifact');
        this.fx('power', { actor: target, id: 'artifact', blocked: true });
        this.log(`${target.name}의 인공물이 ${POWERS[id]?.name || id}을(를) 무효화했다.`);
        return;
      }
    }

    let amt = amount;
    if (id === 'poison' && amount > 0 && source && source.isPlayer) amt += this.pow(this.player, 'deadlyPoison');
    amount = amt;
    const cur = this.pow(target, id);
    const singleton = pdef && pdef.stack === 'none';
    target.powers[id] = singleton ? 1 : cur + amount;
    if (!singleton && target.powers[id] === 0 && id !== 'strength' && id !== 'dexterity') delete target.powers[id];

    if (!silent) {
      this.fx('power', { actor: target, id, amount });
      if (isNegative) this.ui.sfx && this.ui.sfx('debuff');
      else this.ui.sfx && this.ui.sfx('buff');
    }
    // 가학적 본성 : 플레이어가 적에게 디버프를 걸면 피해
    if (!silent && debuff && amount > 0 && source && source.isPlayer && !target.isPlayer) {
      const sad = this.pow(this.player, 'sadistic');
      if (sad > 0) this.dealDamage(this.player, target, sad, null, 'power');
    }
    // 비행이 0이 되면 추락
    if (id === 'flight' && target.powers.flight <= 0) {
      this.removePower(target, 'flight');
      target.def && target.def.onFlightBroken && target.def.onFlightBroken(this, target);
    }
    this.render();
  }

  clearDebuffs(a) {
    Object.keys(a.powers).forEach((k) => { if (POWERS[k] && POWERS[k].type === 'debuff') delete a.powers[k]; });
    if (a.powers.strength < 0) a.powers.strength = 0;
    this.render();
  }

  // ---------------- 피해 계산 ----------------
  /** 공격 피해 수치 계산 (힘/약화/취약 반영) */
  attackValue(src, dst, base, card) {
    let d = base;
    d += this.pow(src, 'strength');
    if (src.isPlayer) {
      d += this.pow(src, 'vigor');
      if (card && this.run.hasRelic('strikeDummy') && card.def.en.includes('Strike')) d += 3;
    }
    if (src.isPlayer) {
      if (this.stance === 'wrath') d *= 2;
      else if (this.stance === 'divinity') d *= 3;
      if (this.pow(src, 'doubleDamage') > 0) d *= 2;
    }
    if (dst.isPlayer && this.stance === 'wrath') d *= 2;
    if (this.pow(src, 'weak') > 0) d *= 0.75;
    if (this.pow(dst, 'vulnerable') > 0) d *= (!dst.isPlayer && this.run.hasRelic('paperPhrog')) ? 1.75 : 1.5;
    if (this.pow(dst, 'flight') > 0) d *= 0.5;
    if (src.isPlayer && this.penNibActive) d *= 2;
    if (dst.isPlayer && this.pow(dst, 'slow') > 0) d *= 1 + this.pow(dst, 'slow') * 0.1;
    if (!src.isPlayer && this.encounter.tuning && this.encounter.tuning.dmg) d *= this.encounter.tuning.dmg;
    d = Math.floor(d);
    if (src.isPlayer && this.run.hasRelic('theBoot') && d > 0 && d < 5) d = 5;
    return Math.max(0, d);
  }

  /** 실제 피해 적용. 반환값 = 체력에 들어간 피해량 */
  applyDamage(src, dst, amount, card, kind = 'attack') {
    if (!dst.alive || amount <= 0) return 0;
    let dmg = amount;
    if (this.pow(dst, 'intangible') > 0) dmg = Math.min(dmg, 1);
    if (dst.isPlayer && kind === 'attack' && this.run.hasRelic('torii') && dmg <= 5) dmg = 1;

    let blocked = 0;
    if (dst.block > 0) {
      blocked = Math.min(dst.block, dmg);
      dst.block -= blocked;
      dmg -= blocked;
    }
    if (blocked > 0) this.ui.sfx && this.ui.sfx(dmg > 0 ? 'blockBreak' : 'block');

    if (dmg > 0) {
      if (dst.isPlayer && this.run.hasRelic('tungstenRod')) dmg = Math.max(0, dmg - 1);
      if (this.pow(dst, 'buffer') > 0) {
        this.addPower(dst, 'buffer', -1, null, true);
        this.fx('buffer', { actor: dst });
        return 0;
      }
      if (this.pow(dst, 'invincible') > 0) {
        const left = this.pow(dst, 'invincible');
        dmg = Math.min(dmg, left);
        this.setPower(dst, 'invincible', left - dmg);
      }
      dst.hp -= dmg;
      if (this.pow(dst, 'plated') > 0) this.addPower(dst, 'plated', -1, null, true);
      this.fx('damage', { actor: dst, amount: dmg, kind });
      if (dst.isPlayer) {
        this.hpLostThisCombat += dmg;
        this.ui.sfx && this.ui.sfx('hurt');
        this.onPlayerHpLost(dmg);
        this.tookDamageThisTurn = true;
        if (kind === 'attack') {
          const sd = this.pow(dst, 'staticDischarge');
          if (sd > 0) this.channel('lightning', sd);
        }
      }
      if (dst.hp <= 0) this.killEnemy(dst, src);
    } else {
      this.fx('blocked', { actor: dst, amount: blocked });
    }
    if (!dst.isPlayer && dst.def && dst.def.onDamaged) dst.def.onDamaged(this, dst, amount);
    this.render();
    return dmg;
  }

  onPlayerHpLost(dmg) {
    // 100년 퍼즐
    const puz = this.run.relicObj('centennialPuzzle');
    if (puz && RELICS.centennialPuzzle.onHpLost) RELICS.centennialPuzzle.onHpLost(this, puz);
    // 붉은 해골
    if (this.run.hasRelic('redSkull')) RELICS.redSkull.onHpChange(this);
    // 피에는 피로 : 체력을 잃을 때마다 비용 1 감소
    this.allCombatCards().forEach((c) => {
      if (c.id !== 'bloodForBlood') return;
      const cur = c.costOverride === null ? c.baseCost : c.costOverride;
      if (cur > 0) c.costOverride = cur - 1;
    });
  }

  /** 범용 피해 (유물, 가시, 물약 등) */
  dealDamage(src, dst, amount, card, kind = 'power') {
    if (!dst || !dst.alive) return 0;
    const dealt = this.applyDamage(src, dst, amount, card, kind);
    return dealt;
  }

  /** 공격받을 때 반격 계열 처리 */
  onAttacked(src, dst) {
    const thorns = this.pow(dst, 'thorns');
    if (thorns > 0 && src.alive) this.applyDamage(dst, src, thorns, null, 'thorns');
    const fb = this.pow(dst, 'flameBarrier');
    if (fb > 0 && src.alive) this.applyDamage(dst, src, fb, null, 'thorns');
    // 성남 / 웅크리기 / 가변성
    if (!dst.isPlayer) {
      const angry = this.pow(dst, 'angry');
      if (angry > 0) this.addPower(dst, 'strength', angry, dst);
      const curl = this.pow(dst, 'curlUp');
      if (curl > 0) { this.gainBlock(dst, curl, null, true); this.removePower(dst, 'curlUp'); }
      const mall = this.pow(dst, 'malleable');
      if (mall > 0) { this.gainBlock(dst, mall, null, true); this.addPower(dst, 'malleable', 1, dst, true); }
      if (this.pow(dst, 'flight') > 0) this.addPower(dst, 'flight', -1, null, true);
    }
  }

  // ---------------- 플레이어 공격 ----------------
  attack(ctx, base, hits = 1) {
    const t = ctx.t;
    if (!t || !t.alive) {
      const alt = this.living()[0];
      if (!alt) return 0;
      ctx.t = alt;
    }
    let total = 0;
    for (let i = 0; i < hits; i++) {
      if (!ctx.t.alive) break;
      total += this.singleAttack(this.player, ctx.t, base, ctx.c);
    }
    return total;
  }
  attackAll(ctx, base, hits = 1, onHit = null, onDealt = null) {
    let total = 0;
    for (let i = 0; i < hits; i++) {
      this.living().slice().forEach((e) => {
        if (!e.alive) return;
        const d = this.singleAttack(this.player, e, base, ctx.c);
        total += d;
        if (onHit) onHit(e);
        if (onDealt) onDealt(d, e);
      });
    }
    return total;
  }
  attackRandom(ctx, base) {
    const l = this.living();
    if (!l.length) return 0;
    return this.singleAttack(this.player, this.rng.pick(l), base, ctx.c);
  }

  singleAttack(src, dst, base, card) {
    const val = this.attackValue(src, dst, base, card);
    this.fx('attack', { src, dst, amount: val, card });
    this.ui.sfx && this.ui.sfx(base >= 15 ? 'bash' : 'slash');
    const dealt = this.applyDamage(src, dst, val, card, 'attack');
    if (src.isPlayer) {
      const br = this.pow(dst, 'blockReturn');
      if (br > 0) this.gainBlock(src, br, null, true);
    }
    if (src.isPlayer && dealt > 0) {
      const env = this.pow(src, 'envenom');
      if (env > 0) this.addPower(dst, 'poison', env, src);
    }
    if (src.isPlayer) {
      // 활력 / 펜촉 소모
      if (this.pow(src, 'vigor') > 0) this.removePower(src, 'vigor');
      if (this.penNibActive) { this.penNibActive = false; const r = this.run.relicObj('penNib'); if (r) r.counter = 0; }
      if (this.run.hasRelic('akabeko')) { /* 활력으로 처리됨 */ }
    }
    this.onAttacked(src, dst);
    return dealt;
  }

  /** 몬스터의 공격 */
  enemyAttack(self, base, hits = 1) {
    let total = 0;
    for (let i = 0; i < hits; i++) {
      if (!self.alive) break;
      const val = this.attackValue(self, this.player, base, null);
      this.fx('attack', { src: self, dst: this.player, amount: val });
      this.ui.sfx && this.ui.sfx(base >= 15 ? 'bash' : 'slash');
      total += this.applyDamage(self, this.player, val, null, 'attack');
      this.onAttacked(self, this.player);
      // 고통스러운 찌르기
      if (this.pow(self, 'painfulStabs') > 0) this.addCardToDiscard(mk('wound'));
      if (this.pow(self, 'thievery') > 0) this.stealGold(self, this.pow(self, 'thievery'));
    }
    return total;
  }

  // ---------------- 방어도 ----------------
  gainBlock(actor, amount, card, raw = false) {
    if (amount <= 0) return;
    let v = amount;
    if (!raw) {
      v += this.pow(actor, 'dexterity');
      if (this.pow(actor, 'frail') > 0) v = Math.floor(v * 0.75);
    }
    if (actor.isPlayer && this.pow(actor, 'noBlock') > 0) { this.log('방어도를 얻을 수 없다!'); return; }
    v = Math.max(0, v);
    actor.block += v;
    this.fx('block', { actor, amount: v });
    this.ui.sfx && this.ui.sfx('block');
    if (actor.isPlayer) {
      const woh = this.pow(actor, 'waveOfTheHand');
      if (woh > 0) this.living().forEach((e) => this.addPower(e, 'weak', woh, actor));
    }
    // 파쇄차
    const jug = this.pow(actor, 'juggernaut');
    if (jug > 0 && actor.isPlayer) {
      const l = this.living();
      if (l.length) this.dealDamage(actor, this.rng.pick(l), jug, null, 'power');
    }
    this.render();
  }

  // ---------------- 체력 ----------------
  loseHp(actor, amount, card) {
    if (amount <= 0) return;
    let v = amount;
    if (actor.isPlayer && this.run.hasRelic('tungstenRod')) v = Math.max(0, v - 1);
    if (this.pow(actor, 'buffer') > 0) { this.addPower(actor, 'buffer', -1, null, true); return; }
    actor.hp -= v;
    this.fx('damage', { actor, amount: v, kind: 'hpLoss' });
    if (actor.isPlayer) {
      this.hpLostThisCombat += v;
      this.onPlayerHpLost(v);
      const rup = this.pow(actor, 'rupture');
      if (rup > 0 && card) this.addPower(actor, 'strength', rup, actor);
    }
    if (actor.hp <= 0) this.killEnemy(actor, null);
    this.render();
  }

  heal(actor, amount) {
    if (amount <= 0 || !actor.alive) return;
    actor.hp = Math.min(actor.maxHp, actor.hp + amount);
    this.fx('heal', { actor, amount });
    this.ui.sfx && this.ui.sfx('heal');
    this.render();
  }
  gainMaxHp(n) { this.run.gainMaxHp(n); this.render(); }
  gainGold(n) { this.run.gainGold(n); this.render(); }

  // ---------------- 적 사망 ----------------
  killEnemy(a, src) {
    if (a.isPlayer) {
      if (a.hp <= 0) this.playerDeathCheck();
      return;
    }
    if (!a.alive) return;
    if (a.def && a.def.onFatal && a.def.onFatal(this, a)) { a.hp = Math.max(1, a.hp); this.render(); return; }
    a.alive = false; a.hp = 0;
    this.fx('die', { actor: a });
    this.ui.sfx && this.ui.sfx('enemyDie');
    this.log(`${a.name} 처치!`);
    // 표본 : 남은 중독을 다른 적에게 전이
    if (this.run.hasRelic('theSpecimen')) {
      const ps = this.pow(a, 'poison');
      const others = this.living().filter((e) => e !== a);
      if (ps > 0 && others.length) this.addPower(this.rng.pick(others), 'poison', ps, this.player, true);
    }
    // 시체 폭발
    if (this.pow(a, 'corpseExplosion') > 0) {
      const ps = this.pow(a, 'poison');
      if (ps > 0) this.living().forEach((e) => this.dealDamage(this.player, e, ps, null, 'power'));
    }
    // 포자 구름
    const sp = this.pow(a, 'spore');
    if (sp > 0) this.addPower(this.player, 'vulnerable', sp, a);
    // 그렘린 뿔
    if (this.run.hasRelic('gremlinHorn')) RELICS.gremlinHorn.onEnemyKilled(this);
    // 수하 정리
    if (!a.isMinion) {
      this.living().forEach((e) => { if (e.isMinion && this.pow(e, 'minion')) this.fleeEnemy(e); });
    }
    this.render();
  }

  playerDeathCheck() {
    if (this.player.hp > 0) return false;
    // 병 속의 요정
    const fairy = this.run.potions.findIndex((p) => p && p.id === 'fairyInABottle');
    if (fairy >= 0) {
      this.run.potions[fairy] = null;
      this.player.hp = Math.floor(this.player.maxHp * (this.run.hasRelic('sacredBark') ? 0.6 : 0.3));
      this.log('병 속의 요정이 당신을 되살렸다!');
      this.ui.sfx && this.ui.sfx('heal');
      return false;
    }
    // 도마뱀 꼬리
    const tail = this.run.relicObj('lizardTail');
    if (tail && tail.counter > 0) {
      tail.counter = 0;
      this.player.hp = Math.floor(this.player.maxHp * 0.5);
      this.log('도마뱀 꼬리가 당신을 되살렸다!');
      return false;
    }
    this.player.hp = 0;
    this.player.alive = false;
    this.over = true; this.won = false;
    return true;
  }

  fleeEnemy(a) {
    if (!a.alive) return;
    a.alive = false; a.fled = true;
    this.fx('flee', { actor: a });
    this.log(`${a.name}이(가) 도망쳤다.`);
    this.render();
  }

  splitEnemy(self, boss = false) {
    self.didSplit = true;
    const ids = self.def.splitInto || [];
    const hp = boss ? null : Math.max(1, self.hp);
    self.alive = false;
    this.fx('die', { actor: self, split: true });
    ids.forEach((id) => {
      const e = this.addEnemy(id);
      if (hp !== null) { e.hp = hp; e.maxHp = hp; }
      e.intent = null;
      this.rollIntent(e);
    });
    this.log(`${self.name}이(가) 둘로 나뉘었다!`);
    this.render();
  }

  summon(self, ids) {
    ids.forEach((id) => {
      const e = this.addEnemy(id);
      this.addPower(e, 'minion', 1, e, true);
      const d = MONSTERS[id];
      if (d.init) d.init(this, e);
      this.rollIntent(e);
    });
    this.log(`${self.name}이(가) 수하를 소환했다!`);
    this.render();
  }
  summonGremlins(self, n) {
    const ids = [];
    for (let i = 0; i < n; i++) ids.push(this.rng.pick(GREMLIN_POOL));
    this.summon(self, ids);
  }

  stealGold(self, amount) {
    const g = Math.min(this.run.gold, amount);
    if (g <= 0) return;
    this.run.gold -= g;
    self.stolenGold = (self.stolenGold || 0) + g;
    this.log(`${self.name}이(가) 골드 ${g}를 훔쳤다!`);
    this.ui.sfx && this.ui.sfx('gold');
    this.render();
  }
  stealCard(self) {
    if (!this.hand.length) return;
    const c = this.rng.pick(this.hand);
    this.removeFrom(this.hand, c);
    self.stolenCard = c;
    this.addPower(self, 'stasis', 1, self, true);
    this.log(`${self.name}이(가) ${c.name}을(를) 가져갔다!`);
    this.render();
  }

  // ---------------- 카드 더미 조작 ----------------
  removeFrom(arr, card) {
    const i = arr.findIndex((c) => c.uid === card.uid);
    if (i >= 0) arr.splice(i, 1);
    return i >= 0;
  }
  allCombatCards() { return [...this.hand, ...this.drawPile, ...this.discardPile, ...this.exhaustPile]; }

  shuffleDiscardIntoDraw() {
    if (!this.discardPile.length) return;
    this.drawPile = this.rng.shuffle([...this.drawPile, ...this.discardPile]);
    this.discardPile = [];
    this.run.relicHook('onShuffle', this);
    this.fx('shuffle', {});
  }

  draw(n) {
    for (let i = 0; i < n; i++) {
      if (this.pow(this.player, 'noDraw') > 0) { this.log('더 이상 카드를 뽑을 수 없다.'); break; }
      if (this.hand.length >= 10) { this.log('손이 가득 찼다!'); break; }
      if (!this.drawPile.length) {
        if (!this.discardPile.length) break;
        this.shuffleDiscardIntoDraw();
      }
      const c = this.drawPile.pop();
      if (!c) break;
      this.hand.push(c);
      this.ui.sfx && this.ui.sfx('cardDraw', i);
      this.fx('draw', { card: c });
      this.onCardDrawn(c);
    }
    this.render();
  }

  onCardDrawn(c) {
    if (c.def.onDraw) c.def.onDraw(this, c);
    if (c.type === 'status') {
      const ev = this.pow(this.player, 'evolve');
      if (ev > 0) this.draw(ev);
    }
    if (c.type === 'status' || c.type === 'curse') {
      const fb = this.pow(this.player, 'fireBreathing');
      if (fb > 0) this.living().forEach((e) => this.dealDamage(this.player, e, fb, null, 'power'));
    }
    // 혼란 : 비용 무작위
    if (this.pow(this.player, 'confused') > 0 && !c.unplayable && !c.isXCost) {
      c.costOverride = this.rng.int(4);
    }
  }

  addCardToHand(c) {
    if (this.hand.length >= 10) { this.discardPile.push(c); this.log('손이 가득 차 버린 더미로 갔다.'); return; }
    this.hand.push(c);
    this.fx('draw', { card: c });
    this.render();
  }
  addCardToDiscard(c) { this.discardPile.push(c); this.fx('gainCard', { card: c }); this.render(); }
  addCardToDrawTop(c) { this.drawPile.push(c); this.render(); }
  addCardToDrawRandom(c) {
    const i = this.drawPile.length ? this.rng.int(this.drawPile.length + 1) : 0;
    this.drawPile.splice(i, 0, c);
    this.fx('gainCard', { card: c });
    this.render();
  }

  discardFromHand(c, byPlayer = true) {
    if (!this.removeFrom(this.hand, c)) return;
    this.discardPile.push(c);
    if (byPlayer) this.discardedThisTurn++;
    if (c.def.onDiscard) c.def.onDiscard(this, c);
    this.render();
  }

  exhaustFromHand(c) {
    if (!this.removeFrom(this.hand, c)) return;
    this.exhaustCard(c);
  }
  exhaustCard(c) {
    this.exhaustPile.push(c);
    this.fx('exhaust', { card: c });
    this.ui.sfx && this.ui.sfx('exhaust');
    if (c.def.onExhaust) c.def.onExhaust(this, c);
    const fnp = this.pow(this.player, 'feelNoPain');
    if (fnp > 0) this.gainBlock(this.player, fnp, null);
    const de = this.pow(this.player, 'darkEmbrace');
    if (de > 0) this.draw(de);
    if (this.run.hasRelic('deadBranch')) RELICS.deadBranch.onExhaust(this);
    this.render();
  }

  // ---------------- 무작위 카드 생성 ----------------
  randomCardOfType(type) {
    const pool = Object.values(CARD_DEFS).filter((d) => d.type === type && !d.noPool &&
      (d.color === this.run.charColor || d.color === 'colorless'));
    if (!pool.length) return null;
    return new Card(this.rng.pick(pool).id);
  }
  randomColorlessCard() {
    const pool = Object.values(CARD_DEFS).filter((d) => d.color === 'colorless' && !d.noPool);
    return pool.length ? new Card(this.rng.pick(pool).id) : null;
  }
  randomCommonCard() {
    const pool = Object.values(CARD_DEFS).filter((d) => d.rarity === 'common' && !d.noPool &&
      (d.color === this.run.charColor || d.color === 'colorless'));
    return pool.length ? new Card(this.rng.pick(pool).id) : null;
  }
  randomCardAny() {
    const pool = Object.values(CARD_DEFS).filter((d) => !d.noPool &&
      (d.color === this.run.charColor || d.color === 'colorless'));
    return pool.length ? new Card(this.rng.pick(pool).id) : null;
  }
  randomCardChoices(n) {
    const pool = Object.values(CARD_DEFS).filter((d) => !d.noPool &&
      (d.color === this.run.charColor || d.color === 'colorless'));
    return this.rng.shuffle(pool).slice(0, n).map((d) => new Card(d.id));
  }

  /** 전투 중 얻은 영구 보너스를 실제 덱 카드에 반영 (유전 알고리즘) */
  permanentBonus(card) {
    if (!card.srcUid) return;
    const src = this.run.deck.find((c) => c.uid === card.srcUid);
    if (src) src.bonusDmg = card.bonusDmg;
  }
  upgradeAllBurns() {
    this.allCombatCards().forEach((c) => { if (c.id === 'burn' && !c.upgraded) c.upgrade(); });
  }
  addBomb(dmg) { this.bombs.push({ turns: 3, dmg }); this.addPower(this.player, 'bomb', 3, this.player, true); }

  async chooseCards(list, opts) { return this.ui.chooseCards(list, opts); }


  // ================= 카드 생성 (현실 조작 반영) =================
  newCard(id, up = false) {
    const c = mk(id, up);
    if (this.pow(this.player, 'masterReality') > 0 && c.canUpgrade()) c.upgrade();
    return c;
  }
  /** 단검 n장을 손에 (사일런트) */
  addShivs(n) { for (let i = 0; i < n; i++) this.addCardToHand(this.newCard('shiv')); }

  // ================= 구체 (디펙트) =================
  get focus() { return this.pow(this.player, 'focus'); }

  channel(type, n = 1) {
    for (let i = 0; i < n; i++) {
      if (this.orbs.length >= this.orbSlots) this.evoke(1);
      this.orbs.push({ type, amount: type === 'dark' ? 6 + this.focus : 0 });
      this.channeledCount[type] = (this.channeledCount[type] || 0) + 1;
      this.render();
      this.fx('orbChannel', { type });
    }
    this.render();
  }
  /** 맨 앞 구체를 times 번 발동하고 제거 */
  evokeFront(times = 1) {
    const orb = this.orbs.shift();
    if (!orb) return;
    for (let i = 0; i < times; i++) this.orbEffect(orb, true, i === 0);
    this.render();
  }
  /** 맨 앞 구체 발동 후 제거 */
  evoke(n = 1, keep = false) {
    for (let i = 0; i < n; i++) {
      const orb = keep ? this.orbs[0] : this.orbs.shift();
      if (!orb) return;
      this.orbEffect(orb, true, !keep);
    }
    this.render();
  }
  evokeAll(times = 1) {
    const list = this.orbs.slice();
    this.orbs = [];
    for (let t = 0; t < times; t++) list.forEach((o) => this.orbEffect(o, true));
    this.render();
  }
  /**
   * 구체 효과. evokeIt=true 면 발동, false 면 턴 종료 패시브.
   * consume 은 연출에서 구체를 실제로 소모해 보일지 여부 (다중 시전 대응).
   */
  orbEffect(orb, evokeIt, consume = true, orbIndex = 0) {
    const f = this.focus;
    const living = this.living();
    const fire = (targets) => this.fx('orbFire', {
      type: orb.type, targets, evoke: !!evokeIt && consume, index: orbIndex,
    });
    switch (orb.type) {
      case 'lightning': {
        const dmg = (evokeIt ? 8 : 3) + f;
        if (!living.length) { fire([]); break; }
        if (this.pow(this.player, 'electro') > 0) {
          fire(living.slice());
          living.slice().forEach((e) => this.orbDamage(e, dmg));
        } else {
          const t = this.rng.pick(living);
          fire([t]);
          this.orbDamage(t, dmg);
        }
        break;
      }
      case 'frost':
        fire([]);
        this.gainBlock(this.player, (evokeIt ? 5 : 2) + f, null, true);
        break;
      case 'dark':
        if (evokeIt) {
          const t = living.slice().sort((a, b) => a.hp - b.hp)[0];
          fire(t ? [t] : []);
          if (t) this.orbDamage(t, orb.amount);
        } else { orb.amount += 6 + f; fire([]); }
        break;
      case 'plasma':
        fire([]);
        this.gainEnergy(evokeIt ? 2 : 1);
        break;
    }
  }
  orbDamage(target, amount) {
    let d = amount;
    if (this.pow(target, 'lockOn') > 0) d = Math.floor(d * 1.5);
    this.applyDamage(this.player, target, d, null, 'orb');
  }
  /** 턴 종료 시 구체 패시브 */
  orbPassives() {
    this.orbs.slice().forEach((o, i) => this.orbEffect(o, false, true, i));
    this.render();
  }
  removeOrb(i = 0) { this.orbs.splice(i, 1); this.render(); }

  // ================= 자세 (와쳐) =================
  setStance(next) {
    if (this.stance === next) return;
    const prev = this.stance;
    if (prev === 'calm') this.gainEnergy(this.run.hasRelic('violetLotus') ? 3 : 2);
    this.stance = next;
    if (next === 'divinity') this.gainEnergy(3);
    if (next === 'wrath') {
      const rd = this.pow(this.player, 'rushdown');
      if (rd > 0) this.draw(rd);
    }
    const mf = this.pow(this.player, 'mentalFortress');
    if (mf > 0) this.gainBlock(this.player, mf, null, true);
    this.discardPile.filter((c) => c.id === 'flurryOfBlows').slice(0, Math.max(0, 10 - this.hand.length)).forEach((c) => {
      this.removeFrom(this.discardPile, c); this.addCardToHand(c);
    });
    this.fx('stance', { stance: next, prev });
    this.ui.sfx && this.ui.sfx(next === 'wrath' ? 'fire' : next === 'divinity' ? 'relic' : 'buff');
    this.log(`자세 : ${STANCE_KR[next]}`);
    this.render();
  }
  addMantra(n) {
    if (n <= 0) return;
    this.totalMantra = (this.totalMantra || 0) + n;
    this.addPower(this.player, 'mantra', n, this.player);
    while (this.pow(this.player, 'mantra') >= 10) {
      this.addPower(this.player, 'mantra', -10, this.player, true);
      this.setStance('divinity');
    }
  }

  // ================= 통찰 (Scry) =================
  async scry(n) {
    if (n <= 0) return;
    if (this.drawPile.length < n) this.shuffleDiscardIntoDraw();
    const top = this.drawPile.slice(-n).reverse();
    if (!top.length) return;
    const sel = await this.chooseCards(top, { count: top.length, title: `통찰 — 버릴 카드 선택 (${top.length}장)`, optional: true });
    (sel || []).forEach((c) => { this.removeFrom(this.drawPile, c); this.discardPile.push(c); });
    this.discardPile.filter((c) => c.id === 'weave').slice(0, Math.max(0, 10 - this.hand.length)).forEach((c) => {
      this.removeFrom(this.discardPile, c); this.addCardToHand(c);
    });
    const nir = this.pow(this.player, 'nirvana');
    if (nir > 0) this.gainBlock(this.player, nir, null);
    this.render();
  }

  /** 카드에 표시할 실제 수치 (힘/약화/취약/자세/민첩/허약 반영) */
  previewValue(card, key, base) {
    if (key === 'dmg') {
      const t = (this.previewTarget && this.previewTarget.alive) ? this.previewTarget : this.living()[0];
      if (!t) return base;
      return this.attackValue(this.player, t, base, card);
    }
    if (key === 'blk') {
      let v = base + this.pow(this.player, 'dexterity');
      if (this.pow(this.player, 'frail') > 0) v = Math.floor(v * 0.75);
      return Math.max(0, v);
    }
    return base;
  }

  // ---------------- 의도(Intent) ----------------
  rollIntent(e) {
    if (!e.alive) return;
    const d = e.def;
    const id = d.ai(this, e);
    this.setIntentNow(e, id);
  }
  setIntentNow(e, moveId) {
    const mv = e.def.moves[moveId];
    if (!mv) return;
    e.nextMove = moveId;
    const hits = mv.dynHits ? mv.dynHits(e) : (mv.hits || 1);
    e.intent = {
      move: moveId, name: mv.name, type: mv.intent,
      baseDmg: mv.dmg, dyn: mv.dyn || null,
      hits, blk: mv.blk || null,
    };
    this.render();
  }
  /** 적 의도의 현재 예상 피해량 (약화/취약/힘 변화가 즉시 반영된다) */
  intentDamage(e) {
    if (!e || !e.intent) return null;
    let base = e.intent.baseDmg;
    if (e.intent.dyn) base = e.intent.dyn(e, this);
    if (base === undefined || base === null) return null;
    return this.attackValue(e, this.player, base, null);
  }
  isAttackIntent(e) {
    return e.intent && ['attack', 'attackDefend', 'attackDebuff', 'attackBuff'].includes(e.intent.type);
  }

  // ---------------- 전투 시작 ----------------
  async start() {
    this.player.block = 0;
    this.player.powers = {};
    this.player.alive = true;
    this.baseEnergy = 3 + this.run.energyBonus(this.encounter.kind);

    // 덱 준비
    this.drawPile = this.rng.shuffle(this.run.deck.map((c) => {
      const k = c.copy(); k.srcUid = c.uid; return k;
    }));
    // 내재 카드는 맨 위로
    const innate = this.drawPile.filter((c) => c.innate);
    if (innate.length) {
      this.drawPile = this.drawPile.filter((c) => !c.innate);
      this.drawPile.push(...innate);
    }
    // 병에 담긴 유물
    ['bottledFlame', 'bottledLightning', 'bottledTornado'].forEach((rid) => {
      const r = this.run.relicObj(rid);
      if (r && r.cardUid) {
        const i = this.drawPile.findIndex((c) => c.srcUid === r.cardUid);
        if (i >= 0) { const [c] = this.drawPile.splice(i, 1); this.drawPile.push(c); }
      }
    });

    this.enemies.forEach((e) => { if (e.def.init) e.def.init(this, e); });
    this.run.relicHook('onBattleStart', this);
    if (this.run.flags.giryaStr) this.addPower(this.player, 'strength', this.run.flags.giryaStr, this.player, true);
    this.enemies.forEach((e) => this.rollIntent(e));
    this.ui.sfx && this.ui.sfx(this.encounter.kind === 'boss' ? 'boss' : 'battleStart');
    this.log(`전투 시작! (${this.enemies.map((e) => e.name).join(', ')})`);
    this.render();
    await this.wait(1000);
    await this.startPlayerTurn();
  }

  handSize() {
    let n = 5;
    if (this.run.hasRelic('sneckoEye')) n += 2;
    n += this.pow(this.player, 'machineLearning');
    const ntd = this.pow(this.player, 'nextTurnDraw');
    if (ntd > 0) { n += ntd; this.removePower(this.player, 'nextTurnDraw'); }
    const dr = this.pow(this.player, 'drawReduction');
    if (dr > 0) n -= dr;
    if (this.extraDraw) { n += this.extraDraw; this.extraDraw = 0; }
    return Math.max(0, n);
  }

  async startPlayerTurn() {
    if (this.over) return;
    this.turn++;
    this.playerTurn = true;
    this.cardsPlayedThisTurn = 0;
    this.attacksThisTurn = 0;
    this.firstCardThisTurn = true;
    this.discardedThisTurn = 0;

    // 방어도 처리
    if (this.pow(this.player, 'blur') > 0) {
      this.addPower(this.player, 'blur', -1, null, true);
    } else if (this.pow(this.player, 'barricade') <= 0) {
      if (this.run.hasRelic('calipers')) this.player.block = Math.max(0, this.player.block - 15);
      else this.player.block = 0;
    }
    // 에너지
    if (!this.run.hasRelic('iceCream')) this.energy = 0;
    this.energy += this.baseEnergy;

    // 턴 시작 상태이상
    this.startActorTurn(this.player);
    if (this.over) return;

    // 유물 훅
    if (this.turn === 1) this.run.relicHook('onFirstTurn', this);
    this.run.relicHook('onTurnStart', this);

    // 카드 뽑기
    this.draw(this.handSize());

    const nte = this.pow(this.player, 'nextTurnEnergy');
    if (nte > 0) { this.gainEnergy(nte); this.removePower(this.player, 'nextTurnEnergy'); }

    // 도박 칩 : 전투 첫 턴에 원하는 만큼 버리고 같은 수만큼 다시 뽑는다
    if (this.turn === 1 && this.run.hasRelic('gamblingChip') && this.hand.length) {
      const sel = await this.chooseCards(this.hand.slice(), {
        count: this.hand.length, title: '도박 칩 — 버릴 카드 선택', optional: true });
      if (sel && sel.length) { sel.forEach((c) => this.discardFromHand(c)); this.draw(sel.length); }
    }

    const fs = this.pow(this.player, 'foresight');
    if (fs > 0) await this.scry(fs);

    // 악몽 : 지정한 카드의 복사본 3장
    if (this.nightmareCard) {
      for (let i = 0; i < 3; i++) this.addCardToHand(this.nightmareCard.copy());
      this.nightmareCard = null;
    }
    // 도구 사용 : 뽑고 버리기
    const tot = this.pow(this.player, 'toolsOfTheTrade');
    for (let i = 0; i < tot; i++) {
      this.draw(1);
      if (this.hand.length) {
        const sel = await this.chooseCards(this.hand.slice(), { count: 1, title: '도구 사용 — 버릴 카드' });
        if (sel && sel[0]) this.discardFromHand(sel[0]);
      }
    }

    // 대혼란 / 자성
    const may = this.pow(this.player, 'mayhem');
    for (let i = 0; i < may; i++) await this.playTopOfDeck(false);
    const mag = this.pow(this.player, 'magnetism');
    for (let i = 0; i < mag; i++) { const c = this.randomColorlessCard(); if (c) this.addCardToHand(c); }

    this.log(`--- ${this.turn}턴 ---`);
    this.render();
    // 턴 시작 피해(유물/중독/구체 등)로 마지막 적이 죽었을 수 있다
    if (this.checkEnd()) this.finish();
  }

  /** 해당 액터의 턴 시작 효과 (중독, 힘 증가 등) */
  startActorTurn(a) {
    // 중독
    const poison = this.pow(a, 'poison');
    if (poison > 0) {
      this.ui.sfx && this.ui.sfx('poison');
      this.loseHp(a, poison, null);
      this.addPower(a, 'poison', -1, null, true);
    }
    if (a.isPlayer) {
      // 와쳐
      const dev = this.pow(a, 'devotion');
      if (dev > 0) this.addMantra(dev);
      const col = this.pow(a, 'collect');
      if (col > 0) { this.addCardToHand(mk('miracle', true)); this.addPower(a, 'collect', -1, a, true); }
      const bh = this.pow(a, 'battleHymn');
      for (let i = 0; i < bh; i++) this.addCardToHand(this.newCard('smite'));
      if (this.pow(a, 'wrathNext') > 0) { this.removePower(a, 'wrathNext'); this.setStance('wrath'); }
      const dv = this.pow(a, 'devaForm');
      if (dv > 0) { this.gainEnergy(dv); this.addPower(a, 'devaForm', 1, a, true); }
      // 사일런트
      const ib = this.pow(a, 'infiniteBlades');
      if (ib > 0) this.addShivs(ib);
      const nf = this.pow(a, 'noxiousFumes');
      if (nf > 0) this.living().forEach((e) => this.addPower(e, 'poison', nf, a));
      // 디펙트
      if (this.run.hasRelic('emotionChip') && this.tookDamageLastTurn && this.orbs.length) {
        this.log('감정 칩 작동!');
        this.evokeAll();
      }
      this.tookDamageLastTurn = this.tookDamageThisTurn;
      this.tookDamageThisTurn = false;
      const loop = this.pow(a, 'loop');
      if (loop > 0 && this.orbs[0]) for (let i = 0; i < loop; i++) this.orbEffect(this.orbs[0], false, true, 0);
      const cai = this.pow(a, 'creativeAI');
      for (let i = 0; i < cai; i++) { const c = this.randomCardOfType(P); if (c) this.addCardToHand(c); }
      const hw = this.pow(a, 'helloWorld');
      for (let i = 0; i < hw; i++) { const c = this.randomCommonCard(); if (c) this.addCardToHand(c); }
      const df = this.pow(a, 'demonForm');
      if (df > 0) this.addPower(a, 'strength', df, a);
      const br = this.pow(a, 'brutality');
      if (br > 0) { this.loseHp(a, br, { id: 'brutality' }); this.draw(br); }
      const bs = this.pow(a, 'berserk');
      if (bs > 0) this.gainEnergy(bs);
      const bias = this.pow(a, 'bias');
      if (bias > 0) this.addPower(a, 'dexterity', -bias, a);
      const bc = this.pow(a, 'biasedCognition');
      if (bc > 0) this.addPower(a, 'focus', -bc, a);
      // 폭탄
      if (this.bombs.length) {
        this.bombs.forEach((b) => { b.turns--; });
        const ready = this.bombs.filter((b) => b.turns <= 0);
        ready.forEach((b) => {
          this.living().forEach((e) => this.dealDamage(this.player, e, b.dmg, null, 'power'));
          this.ui.sfx && this.ui.sfx('fire');
        });
        this.bombs = this.bombs.filter((b) => b.turns > 0);
        if (this.bombs.length) this.setPower(this.player, 'bomb', this.bombs[0].turns);
        else this.removePower(this.player, 'bomb');
      }
    } else {
      if (this.pow(a, 'barricade') <= 0) a.block = 0;
      const reg = this.pow(a, 'regeneration');
      if (reg > 0) this.heal(a, reg);
    }
  }

  /** 턴 종료 효과 */
  endActorTurn(a) {
    if (a.isPlayer) {
      const met = this.pow(a, 'metallicize');
      if (met > 0) this.gainBlock(a, met, null, true);
      const pl = this.pow(a, 'plated');
      if (pl > 0) this.gainBlock(a, pl, null, true);
      const comb = this.pow(a, 'combust');
      if (comb > 0) { this.loseHp(a, 1, null); this.living().forEach((e) => this.dealDamage(a, e, comb, null, 'power')); }
      const reg = this.pow(a, 'regeneration');
      if (reg > 0) this.heal(a, reg);
      const con = this.pow(a, 'constricted');
      if (con > 0) this.dealDamage(a, a, con, null, 'power');
      const ntb = this.pow(a, 'nextTurnBlock');
      if (ntb > 0) { this.removePower(a, 'nextTurnBlock'); this.pendingBlock = ntb; }
      // 와쳐
      if (this.stance === 'calm') {
        const lw = this.pow(a, 'likeWater');
        if (lw > 0) this.gainBlock(a, lw, null, true);
      }
      const st = this.pow(a, 'study');
      for (let i = 0; i < st; i++) this.addCardToDrawRandom(this.newCard('insight'));
      const om = this.pow(a, 'omega');
      if (om > 0) this.living().forEach((e) => this.dealDamage(a, e, om, null, 'power'));
      if (this.stance === 'divinity') this.setStance('neutral');
      if (this.pow(a, 'blasphemer') > 0) { this.log('신성모독의 대가...'); a.hp = 0; this.playerDeathCheck(); }
      // 디펙트 : 구체 패시브
      if (this.orbs.length) this.orbPassives();
    } else {
      const met = this.pow(a, 'metallicize');
      if (met > 0) this.gainBlock(a, met, null, true);
      const pl = this.pow(a, 'plated');
      if (pl > 0) this.gainBlock(a, pl, null, true);
      const rit = this.pow(a, 'ritual');
      if (rit > 0) this.addPower(a, 'strength', rit, a);
    }
    // 힘 감소/회복 예정
    const ls = this.pow(a, 'loseStrength');
    if (ls > 0) { this.addPower(a, 'strength', -ls, a, true); this.removePower(a, 'loseStrength'); }
    const ld = this.pow(a, 'loseDexterityEOT');
    if (ld > 0) { this.addPower(a, 'dexterity', -ld, a, true); this.removePower(a, 'loseDexterityEOT'); }
    const gs = this.pow(a, 'gainStrengthEOT');
    if (gs > 0) { this.addPower(a, 'strength', gs, a, true); this.removePower(a, 'gainStrengthEOT'); }

    // 지속시간 감소
    Object.keys(a.powers).forEach((k) => {
      const d = POWERS[k];
      if (!d) return;
      if (d.decay === 'end') {
        a.powers[k] -= 1;
        if (a.powers[k] <= 0) delete a.powers[k];
      } else if (d.decay === 'remove') delete a.powers[k];
    });
    this.render();
  }

  // ---------------- 에너지 ----------------
  gainEnergy(n) { this.energy += n; this.ui.sfx && this.ui.sfx('energy'); this.render(); }
  loseEnergy(n) { this.energy = Math.max(0, this.energy - n); this.render(); }

  costOf(card) {
    if (card.freeOnce) return 0;
    let c = card.cost;
    if (card.id === 'eviscerate') c = Math.max(0, c - (this.discardedThisTurn || 0));
    if (card.id === 'forceField') c = Math.max(0, c - (this.powersPlayed || 0));
    if (card.type === S && this.pow(this.player, 'corruption') > 0) c = 0;
    if (card.type === A && this.pow(this.player, 'freeAttack') > 0) c = 0;
    if (card.type === S && this.pow(this.player, 'freeSkill') > 0) c = 0;
    if (card.retain) c = Math.max(0, c - this.pow(this.player, 'establishment'));
    return c;
  }

  canPlay(card) {
    if (this.over || !this.playerTurn) return false;
    if (card.unplayable) {
      if (card.type === 'curse' && this.run.hasRelic('blueCandle')) return true;
      return false;
    }
    if (card.type === A && this.pow(this.player, 'entangled') > 0) return false;
    if (this.hand.some((c) => c.id === 'normality') && this.cardsPlayedThisTurn >= 3) return false;
    if (this.run.hasRelic('velvetChoker') && this.cardsPlayedThisCombat >= 0 && this.cardsPlayedThisTurn >= 6) return false;
    if (card.def.canPlay && !card.def.canPlay(this)) return false;
    if (card.isXCost) return this.energy >= 0;
    return this.energy >= this.costOf(card);
  }

  // ---------------- 카드 사용 ----------------
  async playCard(card, target) {
    if (!this.canPlay(card)) return false;
    this.playing = true;
    const cost = this.costOf(card);
    let x = 0;
    if (card.isXCost) { x = this.energy; this.energy = 0; }
    else this.energy -= cost;
    if (card.freeOnce) card.freeOnce = false;
    if (card.type === A && this.pow(this.player, 'freeAttack') > 0) this.addPower(this.player, 'freeAttack', -1, null, true);
    if (card.type === S && this.pow(this.player, 'freeSkill') > 0) this.addPower(this.player, 'freeSkill', -1, null, true);

    this.removeFrom(this.hand, card);
    this.cardInPlay = card;
    this.ui.sfx && this.ui.sfx('cardPlay');
    this.fx('play', { card, target });
    this.log(`${card.name} 사용`);

    // 파란 양초 : 저주 사용
    if (card.type === 'curse' && card.unplayable) {
      this.loseHp(this.player, 1, card);
      this.exhaustCard(card);
      this.cardInPlay = null; this.playing = false;
      this.afterCardPlayed(card);
      return true;
    }

    let times = 1;
    if (card.type === A && this.pow(this.player, 'doubleTap') > 0) { times = 2; this.addPower(this.player, 'doubleTap', -1, null, true); }
    if (card.type === S && this.pow(this.player, 'burst') > 0) { times = 2; this.addPower(this.player, 'burst', -1, null, true); }
    if (card.type === P && this.pow(this.player, 'amplify') > 0) { times = 2; this.addPower(this.player, 'amplify', -1, null, true); }
    if (this.firstCardThisTurn && this.pow(this.player, 'echoForm') > 0) times = Math.max(times, 2);
    if (this.pow(this.player, 'duplication') > 0) { times = Math.max(times, 2); this.addPower(this.player, 'duplication', -1, null, true); }

    for (let i = 0; i < times; i++) {
      if (this.over) break;
      if (card.def.play) {
        const ctx = { B: this, p: this.player, t: target && target.alive ? target : this.living()[0], c: card, x };
        await card.def.play(ctx);
      }
      if (i === 0) await this.wait(240);
    }

    this.cardInPlay = null;
    this.afterCardPlayed(card);

    // 카드 행선지
    const corrupted = card.type === S && this.pow(this.player, 'corruption') > 0;
    if (card.exhaust || corrupted) this.exhaustCard(card);
    else if (card.type === P) { /* 힘 카드는 사라짐 */ }
    else if (this.tantrumShuffle === card) { this.tantrumShuffle = null; this.addCardToDrawRandom(card); }
    else if (this.reboundNext && card.id !== 'rebound') { this.reboundNext = false; this.drawPile.push(card); }
    else this.discardPile.push(card);

    this.playing = false;
    if (this.checkEnd()) { this.finish(); return true; }
    this.render();
    if (this.forceEndTurn) { this.forceEndTurn = false; this.log('시간이 멈췄다! 턴이 강제 종료됩니다.'); setTimeout(() => this.endTurn(), 400); }
    return true;
  }

  afterCardPlayed(card) {
    this.cardsPlayedThisTurn++;
    this.cardsPlayedThisCombat++;
    if (card.type === P) this.powersPlayed++;
    this.lastCardType = card.type;
    // 고통 저주
    if (this.hand.some((c) => c.id === 'pain')) this.loseHp(this.player, 1, null);
    // 저주(Hex)
    if (card.type !== A && this.pow(this.player, 'hex') > 0) {
      for (let i = 0; i < this.pow(this.player, 'hex'); i++) this.addCardToDrawRandom(mk('dazed'));
    }
    // 분노
    if (card.type === A) {
      const rg = this.pow(this.player, 'rage');
      if (rg > 0) this.gainBlock(this.player, rg, null);
      this.attacksThisTurn++;
      // 펜촉
      const pn = this.run.relicObj('penNib');
      if (pn) { pn.counter = (pn.counter || 0) + 1; if (pn.counter >= 10) this.penNibActive = true; }
    }
    // 화려함
    const pan = this.pow(this.player, 'panache');
    if (pan > 0) {
      this.panacheCount++;
      if (this.panacheCount >= 5) { this.panacheCount = 0; this.living().forEach((e) => this.dealDamage(this.player, e, pan, null, 'power')); }
    }
    // 적의 반응형 힘
    this.living().forEach((e) => {
      const bod = this.pow(e, 'beatOfDeath');
      if (bod > 0) this.dealDamage(e, this.player, bod, null, 'power');
      const sh = this.pow(e, 'sharpHide');
      if (sh > 0 && card.type === A) this.dealDamage(e, this.player, sh, null, 'power');
      const enr = this.pow(e, 'enrage');
      if (enr > 0 && card.type === S) this.addPower(e, 'strength', enr, e);
      const cur = this.pow(e, 'curiosity');
      if (cur > 0 && card.type === P) this.addPower(e, 'strength', cur, e);
      if (this.pow(e, 'timeWarp') >= 0 && e.powers.timeWarp !== undefined) {
        e.powers.timeWarp++;
        if (e.powers.timeWarp >= 12) { e.powers.timeWarp = 0; this.addPower(e, 'strength', 2, e); this.forceEndTurn = true; }
      }

    });
    if (this.player.powers.slow !== undefined) this.player.powers.slow++;
    this.living().forEach((e) => {
      const ch = this.pow(e, 'choke');
      if (ch > 0) this.loseHp(e, ch, null);
    });
    // 사일런트
    const tc = this.pow(this.player, 'thousandCuts');
    if (tc > 0) this.living().forEach((e) => this.dealDamage(this.player, e, tc, null, 'power'));
    const ai = this.pow(this.player, 'afterImage');
    if (ai > 0) this.gainBlock(this.player, ai, null);
    // 디펙트
    if (card.type === P) {
      const storm = this.pow(this.player, 'storm');
      if (storm > 0) this.channel('lightning', storm);
      const hs = this.pow(this.player, 'heatsinks');
      if (hs > 0) this.draw(hs);
    }
    this.firstCardThisTurn = false;
    // 유물
    this.run.relicHook('onCardPlayed', this, card);
    // 끊임없는 팽이
    if (this.run.hasRelic('unceasingTop') && this.hand.length === 0 && this.playerTurn) this.draw(1);
  }

  /** 뽑을 더미 맨 위 카드를 사용 (혼돈 / 대혼란) */
  async playTopOfDeck(exhaustAfter = true) {
    if (!this.drawPile.length) this.shuffleDiscardIntoDraw();
    if (!this.drawPile.length) return;
    const c = this.drawPile.pop();
    if (c.unplayable) { this.discardPile.push(c); return; }
    const t = this.living()[0];
    this.log(`${c.name} 자동 사용`);
    if (c.def.play) {
      const ctx = { B: this, p: this.player, t, c, x: 0 };
      await c.def.play(ctx);
    }
    this.afterCardPlayed(c);
    if (exhaustAfter || c.exhaust) this.exhaustCard(c);
    else if (c.type !== P) this.discardPile.push(c);
    if (this.checkEnd()) this.finish();
    this.render();
  }

  // ---------------- 턴 종료 / 적 턴 ----------------
  async endTurn() {
    if (this.over || !this.playerTurn) return;
    this.playerTurn = false;
    this.forceEndTurn = false;

    // 손에 남은 카드 효과
    for (const c of [...this.hand]) {
      if (c.def.onEndTurnInHand) c.def.onEndTurnInHand(this, c);
    }
    if (this.over) return this.finish();

    // 소멸 카드
    for (const c of [...this.hand]) {
      if (c.ethereal) this.exhaustFromHand(c);
    }
    // 손패 버리기
    if (!this.run.hasRelic('runicPyramid')) {
      const keep = this.pow(this.player, 'wellLaidPlans');
      let kept = 0;
      for (const c of [...this.hand]) {
        if (c.retain || c.retainOnce) {
          c.retainOnce = false;
          if (c.def.onRetain) c.def.onRetain(this, c);
          continue;
        }
        if (kept < keep) { kept++; continue; }
        this.discardFromHand(c, false);
      }
    }
    // 회중시계
    if (this.run.hasRelic('pocketwatch') && this.cardsPlayedThisTurn <= 3) this.extraDraw = 3;
    // 자만 저주
    if (this.prideQueue.length) { this.prideQueue.forEach((c) => this.drawPile.push(c)); this.prideQueue = []; }

    this.run.relicHook('onTurnEnd', this);
    this.endActorTurn(this.player);
    this.render();
    await this.wait(500);

    if (this.extraTurn) {
      this.extraTurn = false;
      this.log('추가 턴!');
      await this.startPlayerTurn();
      return;
    }
    await this.enemyTurn();
    if (this.checkEnd()) return this.finish();
    await this.startPlayerTurn();
  }

  async enemyTurn() {
    for (const e of this.enemies.slice()) {
      if (!e.alive || this.over) continue;
      this.startActorTurn(e);
      if (!e.alive || this.over) continue;
      const mvId = e.nextMove || e.def.ai(this, e);
      const mv = e.def.moves[mvId];
      if (mv) {
        this.log(`${e.name} : ${mv.name}`);
        this.fx('enemyAct', { actor: e, move: mvId, intent: e.intent });
        await this.wait(560);
        mv.run(this, e);
        e.history.push(mvId);
        await this.wait(520);
      }
      if (this.over) return;
      this.endActorTurn(e);
      if (e.alive) this.rollIntent(e);
      this.render();
    }
  }

  checkEnd() {
    if (this.player.hp <= 0) {
      if (this.playerDeathCheck()) { this.over = true; this.won = false; return true; }
    }
    if (!this.living().length) { this.over = true; this.won = true; return true; }
    return false;
  }

  escapeBattle() { this.over = true; this.won = true; this.escaped = true; }

  finish() {
    if (this.finished) return;
    this.finished = true;
    this.playerTurn = false;
    this.render();
    this.ui.onBattleEnd && this.ui.onBattleEnd(this);
  }
}
