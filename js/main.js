// ============================================================
//  cnation STS — 메인 컨트롤러
// ============================================================
import { $, $$, el, sleep, clamp } from './util.js';
import { VERSION } from './version.js';
import { CHANGELOG } from './data/changelog.js';
import { Run, ROOM, ROOM_KR, saveRun, loadRun, clearSave, ACT_RANGES } from './engine/run.js';
import { Battle } from './engine/battle.js';
import { POWERS, powerName, powerDesc } from './engine/powers.js';
import { CARD_DEFS, Card, mk, TYPE_KR, RARITY_KR } from './data/cards.js';
import { RELICS, RARITY_KR as RELIC_RARITY_KR } from './data/relics.js';
import { POTIONS } from './data/potions.js';
import { EVENTS, pickEvent } from './data/events.js';
import { CHARACTERS, CHAR_LIST, charOf } from './data/characters.js';
import { rollNeowOptions } from './data/neow.js';
import { STANCE_KR } from './engine/battle.js';
import { MONSTERS } from './data/monsters.js';
import { renderCard, renderCardBig } from './ui/cardview.js';
import { svgIcon, powerIcon, intentIcon, INTENT_COLOR, relicIcon, hashColor } from './ui/icons.js';
import { SFX, unlockAudio, setSfxEnabled, isSfxEnabled } from './audio.js';
import * as S3 from './three/scene3d.js';
import * as M3 from './three/map3d.js';

// ---------------- 전역 상태 ----------------
const G = {
  run: null,
  battle: null,
  selectedCard: null,
  targeting: false,
  sceneReady: false,
  overlayRAF: null,
  logLines: [],
  busy: false,
  pendingPotion: null,
};
window.G = G;
window.__enter = (pos) => enterRoom(pos);   // 자동 테스트용

const SCREENS = ['scr-title', 'scr-map', 'scr-battle', 'scr-history', 'scr-modal'];
function showScreen(id) {
  SCREENS.forEach((s) => { const e = $('#' + s); if (e) e.hidden = s !== id; });
}
function showOverlayScreen(id, on) { const e = $('#' + id); if (e) e.hidden = !on; }

function toast(msg) {
  const t = el('div', { class: 'toast', text: msg });
  $('#toast-layer').appendChild(t);
  setTimeout(() => t.remove(), 2400);
}

// ---------------- 모달 ----------------
let modalStack = [];
function openModal(builder, opts = {}) {
  const box = $('#modal-box');
  box.innerHTML = '';
  builder(box);
  // 보상·모닥불·상점 등에서 판단에 필요한 내 상태(체력·골드·물약칸)를 항상 띄워 준다
  renderModalStatus(opts.focus);
  $('#scr-modal').hidden = false;
  modalStack.push(builder);
}
function closeModal() {
  $('#scr-modal').hidden = true;
  $('#modal-box').innerHTML = '';
  const st = $('#modal-status');
  if (st) { st.hidden = true; st.innerHTML = ''; }
  modalStack = [];
}

/**
 * 모달 상단 상태 띠 — 체력 / 골드 / 물약 슬롯(빈 칸 포함).
 * focus: 'hp' | 'potion' 을 주면 해당 항목을 강조한다.
 */
function renderModalStatus(focus) {
  const bar = $('#modal-status');
  const run = G.run;
  if (!bar) return;
  if (!run) { bar.hidden = true; bar.innerHTML = ''; return; }

  const p = run.player;
  const pct = clamp(p.hp / Math.max(1, p.maxHp), 0, 1) * 100;
  const low = p.hp / Math.max(1, p.maxHp) <= 0.3;
  const free = run.potions.slice(0, run.potionSlots).filter((x) => !x).length;

  let slots = '';
  for (let i = 0; i < run.potionSlots; i++) {
    const pot = run.potions[i];
    const d = pot ? POTIONS[pot.id] : null;
    slots += d
      ? `<span class="ms-slot filled" style="border-color:${d.color}" title="${d.name}">${svgIcon('potion', { size: 15, color: d.color })}</span>`
      : `<span class="ms-slot"></span>`;
  }

  bar.innerHTML = `
    <div class="ms-hp${focus === 'hp' ? ' focus' : ''}${low ? ' low' : ''}">
      <span class="ms-label">체력</span>
      <div class="hpbar"><i style="width:${pct}%"></i><b>${p.hp} / ${p.maxHp}</b></div>
    </div>
    <div class="ms-gold">${run.gold}G</div>
    <div class="ms-potion${focus === 'potion' ? ' focus' : ''}">
      <span class="ms-label">물약</span>
      <span class="ms-slots">${slots}</span>
      <span class="ms-free${free === 0 ? ' none' : ''}">${free === 0 ? '가득참' : `빈칸 ${free}`}</span>
    </div>`;
  bar.hidden = false;
}
function modalTitle(text) { return el('h2', { class: 'modal-title', text }); }
function modalText(text) { return el('p', { class: 'modal-text', text }); }

// ============================================================
//  타이틀
// ============================================================
function initTitle() {
  const vb = $('#version-badge');
  if (vb) vb.textContent = `Version ${VERSION}`;
  $('#link-history').addEventListener('click', (e) => { e.preventDefault(); SFX.tap(); showHistory(); });
  $('#btn-history-home').addEventListener('click', () => { SFX.tap(); showScreen('scr-title'); });
  $('#btn-new').addEventListener('click', () => { unlockAudio(); SFX.tap(); newGame(); });
  $('#btn-continue').addEventListener('click', () => {
    unlockAudio(); SFX.tap();
    const r = loadRun();
    if (!r) { toast('저장된 게임이 없습니다.'); return; }
    G.run = r;
    goMap();
  });
  $('#btn-help').addEventListener('click', () => { unlockAudio(); SFX.tap(); showHelp(); });
  if (!localStorage.getItem('cnation_sts_save_v1')) $('#btn-continue').disabled = true;
}

/** 변경 이력 화면 : 1.0.0 부터의 기능 추가/개선 내역 */
function showHistory() {
  const body = $('#history-body');
  body.innerHTML = '';
  CHANGELOG.forEach((rel, i) => {
    const sec = el('section', { class: 'rel' + (i === 0 ? ' latest' : '') });
    sec.append(
      el('div', { class: 'rel-head' },
        el('span', { class: 'rel-ver', text: `v${rel.v}` }),
        el('span', { class: 'rel-note', text: rel.note }),
        i === 0 ? el('span', { class: 'rel-now', text: '현재' }) : null),
    );
    const ul = el('ul', { class: 'rel-list' });
    rel.items.forEach((t) => ul.appendChild(el('li', { text: t })));
    sec.appendChild(ul);
    body.appendChild(sec);
  });
  body.appendChild(el('p', { class: 'rel-foot',
    text: 'Slay the Spire 는 Mega Crit 의 저작물이며, 이 게임은 비영리 팬 프로젝트입니다.' }));
  body.scrollTop = 0;
  showScreen('scr-history');
}

function newGame() {
  showCharacterSelect();
}

/** 캐릭터 선택 */
function showCharacterSelect() {
  openModal((box) => {
    box.append(modalTitle('캐릭터 선택'));
    CHAR_LIST.forEach((id) => {
      const ch = CHARACTERS[id];
      const row = el('button', { class: 'char-row' });
      row.style.setProperty('--acc', ch.accent);
      row.innerHTML = `
        <div class="char-portrait">${svgIcon(id === 'ironclad' ? 'sword' : id === 'silent' ? 'twinSword' : id === 'defect' ? 'ring' : 'spiral',
          { size: 30, color: ch.accent })}</div>
        <div class="char-info">
          <b>${ch.name}</b><span class="char-tag">${ch.tagline}</span>
          <small>${ch.desc}</small>
          <div class="char-stats">체력 ${ch.maxHp} · ${RELICS[ch.relic] ? RELICS[ch.relic].name : ''}</div>
        </div>`;
      row.addEventListener('click', () => {
        SFX.tap();
        G.run = new Run(undefined, id);
        saveRun(G.run);
        closeModal();
        showNeow();
      });
      box.appendChild(row);
    });
    box.append(el('div', { class: 'modal-actions' },
      el('button', { class: 'btn ghost', text: '취소', onclick: () => { SFX.tap(); closeModal(); } })));
  });
}

/** 시작 보너스 (네오우의 축복) */
function showNeow() {
  const run = G.run;
  const opts = rollNeowOptions(run.rng);
  const ctx = {
    pickCard: async (filter, title) => {
      const cand = run.deck.filter(filter);
      if (!cand.length) return null;
      const [c] = await chooseCardsModal(cand, { count: 1, title });
      return c;
    },
    pickUpgrade: async (filter, title) => pickAndUpgrade(run.deck.filter(filter), title),
    chooseFrom: async (list, title) => { const [c] = await chooseCardsModal(list, { count: 1, title, virtual: true }); return c; },
    gainRelic: async (id) => gainRelic(id),
    relicName: (id) => (RELICS[id] ? RELICS[id].name : '유물'),
  };
  openModal((box) => {
    box.append(
      modalTitle('시작 보너스'),
      modalText(`${run.charName}(으)로 첨탑에 오릅니다.\n첫 걸음을 내딛기 전, 하나를 선택하세요.`),
    );
    opts.forEach((o) => {
      const row = el('button', { class: 'choice-row' + (o.risky ? ' risky' : '') });
      row.innerHTML = `<div class="ci">${svgIcon(o.icon, { size: 26, color: o.risky ? '#ff8a6a' : '#e8c34a' })}</div>
        <div><b>${o.label}</b><small>${o.desc}</small></div>`;
      row.addEventListener('click', async () => {
        SFX.relic();
        closeModal();
        const msg = await o.apply(run, ctx);
        saveRun(run);
        openModal((b2) => {
          b2.append(
            modalTitle(run.charName),
            modalText(`${msg}\n\n1층부터 50층까지 오릅니다.\n17층과 34층의 보스를 처치하면 체력이 모두 회복됩니다.`),
            el('div', { class: 'modal-actions' },
              el('button', { class: 'btn big gold', text: '첨탑에 오른다', onclick: () => { SFX.tap(); closeModal(); goMap(); } })),
          );
        });
      });
      box.appendChild(row);
    });
  });
}

function showHelp() {
  openModal((box) => {
    box.append(
      modalTitle('게임 방법'),
      el('div', { class: 'modal-text', html: `
<b>목표</b> — 1층부터 50층까지 올라가 최종 보스를 처치하세요.<br><br>
<b>전투</b> — 매 턴 에너지 3을 받고 카드를 5장 뽑습니다.<br>
카드를 탭해 선택하고, 한 번 더 탭하거나 위로 밀어 사용합니다.<br>
적이 여럿이면 대상을 탭해 지정합니다.<br>
턴을 마치면 적이 예고한 <b>의도</b>대로 공격합니다.<br><br>
<b>방어도</b>는 턴이 끝나면 사라집니다. 피해를 먼저 흡수합니다.<br>
<b>취약</b> 받는 피해 +50% / <b>약화</b> 주는 피해 -25% / <b>허약</b> 방어도 -25%<br><br>
<b>지도</b> — ⚔ 전투, ☠ 엘리트, ? 의문, 🔥 모닥불, 상점, 보물<br>
17층·34층·50층에 보스가 있으며, 막을 넘어가면 체력이 전부 회복됩니다.<br><br>
진행 상황은 자동 저장됩니다.` }),
      el('div', { class: 'modal-actions' },
        el('button', { class: 'btn', text: '닫기', onclick: () => { SFX.tap(); closeModal(); } })),
    );
  });
}

// ============================================================
//  상단바
// ============================================================
function renderTopbar(target) {
  const run = G.run;
  const bar = $(target);
  if (!run || !bar) return;
  bar.innerHTML = '';
  bar.append(
    el('div', { class: 'tb-floor', text: `${run.act}막 · ${run.floor || 0}층` }),
    (() => {
      const w = el('div', { class: 'tb-hp' });
      const pct = clamp(run.player.hp / run.player.maxHp, 0, 1) * 100;
      w.innerHTML = `<div class="hpbar"><i style="width:${pct}%"></i><b>${run.player.hp} / ${run.player.maxHp}</b></div>`;
      return w;
    })(),
    el('div', { class: 'tb-gold', text: `${run.gold}G` }),
    (() => {
      const r = el('div', { class: 'relic-row' });
      run.relics.forEach((ro) => {
        const d = RELICS[ro.id];
        if (!d) return;
        const b = el('div', { class: 'relic' + (d.rarity === 'boss' ? ' boss' : ''), html: relicIcon(d, 16) });
        b.addEventListener('click', (e) => showTooltip(e, d.name, d.desc + (ro.counter ? `\n(${ro.counter})` : '')));
        r.appendChild(b);
      });
      return r;
    })(),
    el('button', { class: 'menu-btn', html: '<span></span><span></span><span></span>',
      onclick: () => { SFX.tap(); showGameMenu(); } }),
  );
}

/** 전투/지도 공통 메뉴 */
function showGameMenu() {
  openModal((box) => {
    box.append(
      modalTitle('메뉴'),
      el('button', { class: 'btn', text: '덱 보기', onclick: () => { closeModal(); showDeck(); } }),
      el('button', { class: 'btn ghost', text: '유물 목록', onclick: () => { closeModal(); showRelicList(); } }),
      el('button', { class: 'btn ghost', text: '게임 방법', onclick: () => { closeModal(); showHelp(); } }),
      el('button', { class: 'btn ghost', text: '설정', onclick: () => { closeModal(); showSettings(); } }),
      el('div', { class: 'modal-actions' }, el('button', { class: 'btn', text: '닫기', onclick: () => closeModal() })),
    );
  });
}

let tipTimer = null;
function showTooltip(ev, title, text) {
  const tip = $('#tooltip');
  tip.innerHTML = `<b>${title}</b>${text.replace(/\n/g, '<br>')}`;
  tip.hidden = false;
  const r = tip.getBoundingClientRect();
  const x = clamp(ev.clientX - r.width / 2, 8, innerWidth - r.width - 8);
  const y = clamp(ev.clientY + 16, 8, innerHeight - r.height - 8);
  tip.style.left = x + 'px';
  tip.style.top = y + 'px';
  clearTimeout(tipTimer);
  tipTimer = setTimeout(() => { tip.hidden = true; }, 2600);
}
document.addEventListener('pointerdown', (e) => {
  const tip = $('#tooltip');
  if (!tip.hidden && !e.target.closest('.relic, .pw, .potion-slot')) tip.hidden = true;
}, true);

// ============================================================
//  지도
// ============================================================
function goMap() {
  G.battle = null;
  stopOverlayLoop();
  showScreen('scr-map');
  renderTopbar('#battle-top');
  renderTopbar('#map-top');
  renderMap();
  renderPotions('#map-potion-row');
  saveRun(G.run);
}

const ROOM_GLYPH = { monster: 'sword', elite: 'skull', event: 'question', rest: 'flame', shop: 'potion', treasure: 'star', boss: 'crown' };
const ROOM_COLOR = { monster: '#d0a0a0', elite: '#ff6a5a', event: '#a0d0ff', rest: '#ffa04a', shop: '#8affc0', treasure: '#ffd24a', boss: '#ff5a4a' };

const LEGEND = [
  ['monster', '전투'], ['elite', '엘리트'], ['event', '의문'],
  ['rest', '모닥불'], ['shop', '상점'], ['treasure', '보물'], ['boss', '보스'],
];

let legendThumbs = null;   // 지도 3D 아이콘을 구운 썸네일 캐시

function renderLegend() {
  const box = $('#map-legend');
  if (!box) return;
  if (!legendThumbs) legendThumbs = M3.iconThumbs(LEGEND.map(([t]) => t), 64) || {};
  box.innerHTML = '';
  LEGEND.forEach(([type, label]) => {
    const color = ROOM_COLOR[type];
    // 범례도 지도에서 쓰는 실제 3D 아이콘을 축소해 보여준다 (썸네일 실패 시 색 점)
    const mark = legendThumbs[type]
      ? el('img', { class: 'legend-icon', src: legendThumbs[type], alt: label })
      : el('i', { class: 'legend-dot', style: { color } });
    box.appendChild(el('div', { class: 'legend-item' }, mark, el('span', { text: label })));
  });
}

function renderMap() {
  const run = G.run;
  renderLegend();
  const canvas = $('#map-canvas');
  M3.initMap(canvas);
  M3.resizeMap();
  M3.buildMap(run, (pos) => enterRoom(pos));
  const t = $('#map-title-3d');
  if (t) {
    const boss = MONSTERS[run.bossEncounter[0]];
    t.textContent = `${run.act}막 · ${ACT_RANGES[run.act - 1].start}~${ACT_RANGES[run.act - 1].boss}층 · 보스 ${boss ? boss.name : ''}`;
  }
}

// ---------------- 방 진입 ----------------
function enterRoom(pos) {
  SFX.tap();
  const run = G.run;
  const node = run.enterNode(pos);
  renderTopbar('#map-top');
  const type = node.type;
  if (type === ROOM.MONSTER) startBattle(run.makeEncounter(ROOM.MONSTER));
  else if (type === ROOM.ELITE) startBattle(run.makeEncounter(ROOM.ELITE));
  else if (type === ROOM.BOSS) startBattle(run.makeEncounter(ROOM.BOSS));
  else if (type === ROOM.REST) showRest();
  else if (type === ROOM.SHOP) showShop();
  else if (type === ROOM.TREASURE) showTreasure();
  else {
    // ? 방 : 실제 방 종류를 굴린다 (염주 팔찌 / 작은 상자 반영)
    const real = run.resolveUnknown();
    if (real === ROOM.MONSTER) { toast('매복이다!'); startBattle(run.makeEncounter(ROOM.MONSTER)); }
    else if (real === ROOM.SHOP) showShop();
    else if (real === ROOM.TREASURE) showTreasure();
    else showEvent();
  }
  saveRun(run);
}

// ============================================================
//  전투
// ============================================================
function startBattle(encounter) {
  showScreen('scr-battle');
  G.logLines = [];
  const canvas = $('#three-canvas');
  if (!G.sceneReady) { S3.initScene(canvas); G.sceneReady = true; }
  // 막마다 색 계통이 다르고, 층마다 조금씩 다른 배경을 만든다
  S3.setEnvironment(G.run.act, G.run.floor);
  S3.resize();

  const B = new Battle(G.run, encounter, battleUI);
  G.battle = B;
  G.selectedCard = null;
  S3.setupBattle(B);
  startOverlayLoop();
  renderBattle();
  B.start();
}

const battleUI = {
  log(msg) {
    G.logLines.push(msg);
    if (G.logLines.length > 4) G.logLines.shift();
    const box = $('#battle-log');
    if (box) box.innerHTML = G.logLines.map((l) => `<div>${l}</div>`).join('');
  },
  sfx(name, i) { if (SFX[name]) SFX[name](i); },
  async wait(ms) { await sleep(ms); },
  render() { renderBattle(); },
  fx(type, data) { battleFx(type, data); },
  async chooseCards(list, opts) { return chooseCardsModal(list, opts); },
  async chooseOption(labels, title) { return chooseOptionModal(labels, title); },
  onBattleEnd(B) { setTimeout(() => endBattle(B), 700); },
};

function battleFx(type, d) {
  const B = G.battle;
  if (!B) return;
  switch (type) {
    case 'attack':
      S3.fxAttack(d.src, d.dst);
      break;
    case 'damage':
      S3.fxHit(d.actor);
      popup(d.actor, `-${d.amount}`, 'dmg');
      if (d.actor.isPlayer) S3.fxScreenShake(Math.min(2, d.amount / 14));
      break;
    case 'blocked':
      popup(d.actor, '방어', 'block');
      break;
    case 'block':
      S3.fxBlock(d.actor);
      popup(d.actor, `+${d.amount}`, 'block');
      break;
    case 'heal':
      S3.fxHeal(d.actor);
      popup(d.actor, `+${d.amount}`, 'heal');
      break;
    case 'power': {
      const pd = POWERS[d.id];
      const deb = pd && pd.type === 'debuff';
      S3.fxPower(d.actor, deb);
      if (!d.blocked && !pd?.hidden) popup(d.actor, `${powerName(d.id)}${d.amount > 0 ? '+' : ''}${d.amount}`, deb ? 'debuff' : 'buff');
      break;
    }
    case 'die':
      S3.fxDeath(d.actor);
      break;
    case 'flee':
      S3.fxDeath(d.actor);
      break;
    case 'enemyAct':
      S3.fxCast(d.actor, 0xff9a4a);
      break;
    case 'buffer':
      popup(d.actor, '무효', 'block');
      break;
    case 'orbChannel':
      S3.syncOrbs(B.orbs, B.orbSlots);
      S3.fxOrbChannel(d.type);
      SFX.orbCharge();
      break;
    case 'orbFire': {
      // 구체마다 자기 위치에서, 서로 겹치지 않게 시차를 두고 발사
      const delay = d.evoke ? 0 : (d.index || 0) * 0.22;
      S3.fxOrb(d.type, d.targets, d.evoke, B.player, d.index || 0, delay);
      const playSfx = () => {
        if (d.type === 'lightning') SFX.thunder();
        else if (d.type === 'frost') SFX.ice();
        else if (d.type === 'dark') SFX.darkBlast();
        else SFX.plasmaPop();
      };
      if (delay > 0) setTimeout(playSfx, delay * 1000); else playSfx();
      if (d.evoke && d.type === 'lightning') S3.fxScreenShake(0.8);
      break;
    }
    case 'exhaust': case 'shuffle': case 'draw': case 'gainCard': case 'play':
      break;
  }
}

function popup(actor, text, cls) {
  const p = S3.screenPos(actor, actor.isPlayer ? 2.2 : 1.6);
  if (!p) return;
  const e = el('div', { class: `pop ${cls}`, text });
  e.style.left = (p.x + (Math.random() - 0.5) * 26) + 'px';
  e.style.top = p.y + 'px';
  $('#float-layer').appendChild(e);
  setTimeout(() => e.remove(), 1050);
}

// ---------------- 전투 화면 렌더 ----------------
function renderBattle() {
  const B = G.battle;
  if (!B) return;
  renderTopbar('#battle-top');
  $('#draw-count').textContent = B.drawPile.length;
  $('#discard-count').textContent = B.discardPile.length;
  $('#exhaust-count').textContent = B.exhaustPile.length;
  $('#energy-text').textContent = `${B.energy}/${B.baseEnergy}`;
  renderPotions();
  renderHand();
  renderUnits();
  if (B.usesOrbs) { S3.syncOrbs(B.orbs, B.orbSlots); renderOrbLabels(B); }
  const et = $('#btn-endturn');
  et.disabled = !B.playerTurn || B.over;
  et.classList.toggle('ready', B.playerTurn && !B.hand.some((c) => B.canPlay(c)));
}

function renderPotions(sel = '#potion-row') {
  const row = $(sel);
  const run = G.run;
  if (!row || !run) return;
  row.innerHTML = '';
  for (let i = 0; i < run.potionSlots; i++) {
    const p = run.potions[i];
    const slot = el('div', { class: 'potion-slot' + (p ? ' filled' : '') });
    if (p) {
      const d = POTIONS[p.id];
      slot.style.borderColor = d.color;
      slot.innerHTML = svgIcon('potion', { size: 20, color: d.color });
      slot.addEventListener('click', (e) => { e.stopPropagation(); usePotionPrompt(i); });
    }
    row.appendChild(slot);
  }
}

function renderUnits() {
  const B = G.battle;
  const ov = $('#stage-overlay');
  ov.innerHTML = '';
  const mk2 = (actor, isPlayer) => {
    const u = el('div', { class: 'unit' + (G.targeting && !isPlayer ? ' targetable' : '') });
    u.dataset.uid = actor.uid;
    const pct = clamp(actor.hp / actor.maxHp, 0, 1) * 100;
    // 최대 체력에 따라 막대 길이를 차등하되, 차이를 1/4 로 압축해 과하지 않게 한다
    //  예) 적 최대체력이 내 2배 → 길이 +25% / 내 60% → 길이 -10%
    const BASE_W = 104;
    const ratio = isPlayer ? 1 : (actor.maxHp / Math.max(1, B.player.maxHp));
    const barW = Math.round(BASE_W * clamp(1 + (ratio - 1) / 4, 0.55, 2.1));

    let html = '';
    if (!isPlayer && actor.intent && B.playerTurn && !G.run.hasRelic('runicDome')) {
      const it = actor.intent;
      let label = '';
      const dmg = B.intentDamage(actor);
      if (dmg !== null && dmg !== undefined) label = it.hits > 1 ? `${dmg}×${it.hits}` : `${dmg}`;
      else if (it.type === 'defend' || it.type === 'defendBuff' || it.type === 'defendDebuff') label = it.blk ? `${it.blk}` : '';
      html += `<div class="intent" style="border-color:${INTENT_COLOR[it.type] || '#888'}">${intentIcon(it.type)}<span>${label}</span></div>`;
    }
    html += `<div class="unit-name">${actor.name}</div>`;
    html += `<div class="unit-hp${isPlayer ? ' me' : ''}" style="width:${barW}px"><i style="width:${pct}%"></i><b>${Math.max(0, actor.hp)}/${actor.maxHp}</b></div>`;
    u.innerHTML = html;
    if (actor.block > 0) {
      u.appendChild(el('div', { class: 'unit-block', text: String(actor.block) }));
    }
    if (isPlayer && B.stance && B.stance !== 'neutral') {
      u.appendChild(el('div', { class: 'stance-badge s-' + B.stance, text: STANCE_KR[B.stance] }));
    }
    const pw = el('div', { class: 'powers' });
    Object.entries(actor.powers).forEach(([id, n]) => {
      const pd = POWERS[id];
      if (!pd || pd.hidden || n === 0) return;
      const b = el('div', { class: 'pw ' + (pd.type === 'debuff' ? 'debuff' : 'buff'),
        html: powerIcon(id, 12, pd.type === 'debuff' ? '#e0a0ff' : '#ffe08a') + `<span>${pd.stack === 'none' ? '' : n}</span>` });
      b.addEventListener('click', (e) => { e.stopPropagation(); showTooltip(e, pd.name, powerDesc(id, n)); });
      pw.appendChild(b);
    });
    if (pw.children.length) u.appendChild(pw);
    if (!isPlayer) {
      u.addEventListener('click', () => onTargetTap(actor));
    }
    return u;
  };
  const units = [mk2(B.player, true), ...B.enemies.filter((e) => e.alive).map((e) => mk2(e, false))];
  units.forEach((u) => ov.appendChild(u));
  // 몬스터 본체를 직접 탭해서 대상을 고를 수 있게 하는 투명 영역
  B.enemies.filter((e) => e.alive).forEach((e) => {
    const hit = el('div', { class: 'unit-hit' + (G.targeting ? ' targetable' : '') });
    hit.dataset.uid = e.uid;
    hit.addEventListener('click', () => onTargetTap(e));
    ov.appendChild(hit);
  });
  if (B.usesOrbs) renderOrbLabels(B);
  if (G.targeting) {
    ov.appendChild(el('div', { class: 'hint-banner', text: '공격할 대상을 선택하세요' }));
  }
  positionUnits();
}

/** 3D 구체 위에 표시할 수치(암흑 구체) 라벨 */
function renderOrbLabels(B) {
  let box = $('#orb-labels');
  if (!box) {
    box = el('div', { class: 'orb-labels', id: 'orb-labels' });
    $('#stage-overlay').appendChild(box);
  }
  box.innerHTML = '';
  (B.orbs || []).forEach((o, i) => {
    const lb = el('div', { class: 'orb-label o-' + o.type });
    lb.dataset.i = i;
    lb.textContent = o.type === 'dark' ? String(o.amount) : '';
    if (o.type !== 'dark') lb.classList.add('dot');
    box.appendChild(lb);
  });
}

function positionOrbLabels() {
  const box = $('#orb-labels');
  if (!box) return;
  $$('.orb-label', box).forEach((lb) => {
    const p = S3.orbScreenPos(Number(lb.dataset.i));
    if (!p) { lb.style.display = 'none'; return; }
    lb.style.display = '';
    lb.style.left = p.x + 'px';
    lb.style.top = p.y + 'px';
  });
}

function positionUnits() {
  const B = G.battle;
  if (!B) return;
  $$('#stage-overlay .unit-hit').forEach((hit) => {
    const actor = B.enemies.find((a) => a.uid === hit.dataset.uid);
    const r = actor && S3.bodyScreenRect(actor);
    if (!r || !r.visible) { hit.style.display = 'none'; return; }
    hit.style.display = '';
    hit.style.left = (r.x - r.r) + 'px';
    hit.style.top = (r.y - r.r) + 'px';
    hit.style.width = (r.r * 2) + 'px';
    hit.style.height = (r.r * 2) + 'px';
  });
  $$('#stage-overlay .unit').forEach((u) => {
    const actor = [B.player, ...B.enemies].find((a) => a.uid === u.dataset.uid);
    if (!actor) return;
    const p = S3.screenPos(actor);
    if (!p) { u.style.display = 'none'; return; }
    u.style.display = '';
    const stage = u.parentElement.getBoundingClientRect();
    u.style.left = clamp(p.x, 60, stage.width - 60) + 'px';
    u.style.top = clamp(p.y, 26, stage.height - 40) + 'px';
  });
}

function startOverlayLoop() {
  stopOverlayLoop();
  const loop = () => { positionUnits(); positionOrbLabels(); G.overlayRAF = requestAnimationFrame(loop); };
  G.overlayRAF = requestAnimationFrame(loop);
}
function stopOverlayLoop() { if (G.overlayRAF) cancelAnimationFrame(G.overlayRAF); G.overlayRAF = null; }

// ---------------- 손패 ----------------
function renderHand() {
  const B = G.battle;
  const handEl = $('#hand');
  handEl.innerHTML = '';
  const n = B.hand.length;
  const w = handEl.clientWidth || innerWidth - 100;
  const cw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-w')) || 88;
  const preview = (card, key, base) => B.previewValue(card, key, base);
  B.hand.forEach((card, i) => {
    const c = renderCard(card, { preview });
    const t = n === 1 ? 0.5 : i / (n - 1);
    const spread = Math.min(w - cw - 42, Math.max(0, (n - 1) * cw * 0.86));
    const x = w / 2 + (t - 0.5) * spread - cw / 2;
    const ang = n === 1 ? 0 : (t - 0.5) * Math.min(13, n * 2.2);
    const y = -Math.cos((t - 0.5) * Math.PI) * Math.min(10, n * 1.6) + 8;
    c.style.left = x + 'px';
    c.style.transform = `translateY(${y}px) rotate(${ang}deg)`;
    c.style.zIndex = 10 + i;
    // 선택 취소 시 되돌아갈 원래 자리
    c.dataset.homeLeft = x + 'px';
    c.dataset.homeTransform = c.style.transform;
    if (!B.canPlay(card)) c.classList.add('unplayable-now');
    if (G.selectedCard && G.selectedCard.uid === card.uid) {
      c.classList.add('selected');
      // 선택된 카드는 손패 가운데로 띄워 크게 보여준다
      c.style.left = (w / 2 - cw / 2) + 'px';
    }
    attachCardEvents(c, card);
    handEl.appendChild(c);
  });
  const cz = $('#cancel-zone');
  if (cz) cz.classList.toggle('armed', !!G.selectedCard);
}

/** 선택한 카드(및 물약 대상 지정)를 취소하고 원래 자리로 되돌린다 */
function clearSelection() {
  if (!G.selectedCard && G.pendingPotion === null && !G.targeting) return false;
  const sel = $('#hand .card.selected');
  G.selectedCard = null;
  G.targeting = false;
  G.pendingPotion = null;
  SFX.tap();

  const cz = $('#cancel-zone');
  if (cz) cz.classList.remove('armed');
  $$('#stage-overlay .unit, #stage-overlay .unit-hit').forEach((u) => u.classList.remove('targetable'));

  if (sel && sel.dataset.homeLeft) {
    // 떠올라 있던 카드를 손패 제자리로 미끄러지듯 되돌린 뒤 다시 그린다
    sel.classList.remove('selected');
    sel.style.left = sel.dataset.homeLeft;
    sel.style.transform = sel.dataset.homeTransform;
    setTimeout(() => { if (G.battle && !G.selectedCard) renderBattle(); }, 200);
  } else {
    renderBattle();
  }
  return true;
}

function attachCardEvents(elm, card) {
  let sx = 0, sy = 0, moved = false, dragging = false;
  elm.addEventListener('pointerdown', (e) => {
    if (G.battle.playing || !G.battle.playerTurn) return;
    sx = e.clientX; sy = e.clientY; moved = false; dragging = true;
    elm.setPointerCapture(e.pointerId);
  });
  elm.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dy = e.clientY - sy, dx = e.clientX - sx;
    if (Math.abs(dy) > 14 || Math.abs(dx) > 14) moved = true;
    if (dy < -20) {
      elm.style.transform = `translate(${dx}px, ${dy}px) scale(1.1)`;
      elm.style.zIndex = 60;
    }
  });
  elm.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    const dy = e.clientY - sy;
    if (moved && dy < -60) { tryPlay(card); return; }
    renderHand();
    onCardTap(card);
  });
  elm.addEventListener('pointercancel', () => { dragging = false; renderHand(); });
}

function onCardTap(card) {
  const B = G.battle;
  if (!B.playerTurn || B.playing) return;
  SFX.cardPick();
  if (G.selectedCard && G.selectedCard.uid === card.uid) { tryPlay(card); return; }
  G.selectedCard = card;
  G.targeting = card.target === 'enemy' && B.living().length > 1 && B.canPlay(card);
  renderBattle();
}

function onTargetTap(enemy) {
  const B = G.battle;
  if (G.pendingPotion !== null) {
    const idx = G.pendingPotion;
    G.pendingPotion = null;
    G.targeting = false;
    usePotion(idx, enemy);
    return;
  }
  if (!G.targeting || !G.selectedCard) return;
  const card = G.selectedCard;
  G.targeting = false;
  playCardNow(card, enemy);
}

function tryPlay(card) {
  const B = G.battle;
  if (!B.canPlay(card)) {
    if (card.unplayable) toast('사용할 수 없는 카드입니다.');
    else if (card.type === 'attack' && B.pow(B.player, 'entangled') > 0) toast('휘감김 상태입니다!');
    else toast('에너지가 부족합니다.');
    G.selectedCard = null; G.targeting = false;
    renderBattle();
    return;
  }
  if (card.target === 'enemy' && B.living().length > 1) {
    G.selectedCard = card;
    G.targeting = true;
    renderBattle();
    toast('대상을 선택하세요');
    return;
  }
  playCardNow(card, B.living()[0]);
}

async function playCardNow(card, target) {
  const B = G.battle;
  G.selectedCard = null; G.targeting = false;
  await B.playCard(card, target);
  S3.layoutEnemies(B);
  renderBattle();
  if (B.over) return;
}

// ---------------- 물약 ----------------
function usePotionPrompt(idx) {
  const run = G.run;
  const p = run.potions[idx];
  if (!p) return;
  const d = POTIONS[p.id];
  const mult = run.hasRelic('sacredBark') ? 2 : 1;
  openModal((box) => {
    box.append(
      modalTitle(d.name),
      el('div', { class: 'relic-big', html: svgIcon('potion', { size: 26, color: d.color }) }),
      modalText(d.desc(mult)),
      el('div', { class: 'modal-actions' },
        el('button', {
          class: 'btn gold', text: '사용',
          onclick: () => {
            closeModal();
            if (d.battleOnly && !G.battle) { toast('전투 중에만 사용할 수 있습니다.'); return; }
            if (d.target === 'enemy' && G.battle && G.battle.living().length > 1) {
              G.pendingPotion = idx; G.targeting = true; renderBattle(); toast('대상을 선택하세요');
            } else usePotion(idx, G.battle ? G.battle.living()[0] : null);
          },
        }),
        el('button', { class: 'btn ghost', text: '버리기', onclick: () => { closeModal(); run.potions[idx] = null; renderPotions(); saveRun(run); } }),
        el('button', { class: 'btn ghost', text: '취소', onclick: () => closeModal() })),
    );
  });
}

async function usePotion(idx, target) {
  const run = G.run;
  const p = run.potions[idx];
  if (!p) return;
  const d = POTIONS[p.id];
  const mult = run.hasRelic('sacredBark') ? 2 : 1;
  run.potions[idx] = null;
  SFX.potion();
  await d.use(G.battle, mult, target, run);
  if (G.battle) { S3.layoutEnemies(G.battle); renderBattle(); G.battle.checkEnd(); if (G.battle.over) G.battle.finish(); }
  else { renderTopbar('#map-top'); renderPotions('#map-potion-row'); }
  saveRun(run);
}

// ---------------- 더미 보기 ----------------
function showPile(title, cards, sorted = false) {
  const list = sorted ? [...cards].sort((a, b) => a.name.localeCompare(b.name)) : [...cards].reverse();
  openModal((box) => {
    box.append(modalTitle(`${title} (${list.length})`));
    const grid = el('div', { class: 'card-grid' });
    list.forEach((c) => grid.appendChild(renderCard(c, { small: true })));
    box.append(grid, el('div', { class: 'modal-actions' },
      el('button', { class: 'btn', text: '닫기', onclick: () => { SFX.tap(); closeModal(); } })));
  });
}

function chooseOptionModal(labels, title) {
  return new Promise((resolve) => {
    openModal((box) => {
      box.append(modalTitle(title || '선택'));
      labels.forEach((lb, i) => {
        const row = el('button', { class: 'choice-row' });
        row.innerHTML = `<div><b>${lb}</b></div>`;
        row.addEventListener('click', () => { SFX.tap(); closeModal(); resolve(i); });
        box.appendChild(row);
      });
    });
  });
}

// ---------------- 카드 선택 모달 ----------------
function chooseCardsModal(list, opts = {}) {
  return new Promise((resolve) => {
    const chosen = [];
    const count = opts.count || 1;
    openModal((box) => {
      box.append(modalTitle(opts.title || '카드 선택'));
      const info = el('p', { class: 'modal-text', text: `${count}장 선택 (${chosen.length}/${count})` });
      box.append(info);
      const grid = el('div', { class: 'card-grid' });
      list.forEach((c) => {
        const ce = renderCard(c, { small: true });
        ce.addEventListener('click', () => {
          SFX.cardPick();
          // autoPick : 1장 선택이면 고르는 즉시 확정 (건너뛰기 버튼은 유지)
          if (opts.autoPick && count === 1) { chosen.length = 0; chosen.push(c); finish(); return; }
          const i = chosen.findIndex((x) => x.uid === c.uid);
          if (i >= 0) { chosen.splice(i, 1); ce.classList.remove('selected'); }
          else if (chosen.length < count) { chosen.push(c); ce.classList.add('selected'); }
          info.textContent = `${count}장 선택 (${chosen.length}/${count})`;
          if (chosen.length === count && count === 1 && !opts.optional) finish();
        });
        grid.appendChild(ce);
      });
      box.append(grid);
      const actions = el('div', { class: 'modal-actions' });
      actions.append(el('button', { class: 'btn gold', text: '확인', onclick: finish }));
      if (opts.optional) actions.append(el('button', { class: 'btn ghost', text: '건너뛰기', onclick: () => { closeModal(); resolve([]); } }));
      box.append(actions);
      function finish() { closeModal(); resolve(chosen); }
    });
  });
}


/** 유물 획득 : 획득 즉시 선택/보상이 필요한 유물 처리 */
async function gainRelic(id) {
  const run = G.run;
  if (!id || !run.addRelic(id)) return false;
  SFX.relic();
  const pick = async (filter, title) => {
    const cand = run.deck.filter(filter);
    if (!cand.length) return null;
    const [c] = await chooseCardsModal(cand, { count: 1, title });
    return c;
  };
  if (id === 'bottledFlame' || id === 'bottledLightning' || id === 'bottledTornado') {
    const want = { bottledFlame: 'attack', bottledLightning: 'skill', bottledTornado: 'power' }[id];
    const c = await pick((x) => x.type === want, `${RELICS[id].name} — 담을 카드 선택`);
    if (c) { run.relicObj(id).cardUid = c.uid; toast(`${c.name}을(를) 병에 담았다.`); }
  } else if (id === 'emptyCage') {
    for (let i = 0; i < 2; i++) {
      const c = await pick((x) => !x.def.undeletable, '제거할 카드 선택 (2장)');
      if (c) run.removeCard(c);
    }
    toast('덱에서 카드 2장을 제거했다.');
  } else if (id === 'astrolabe') {
    for (let i = 0; i < 3; i++) {
      const c = await pick((x) => !x.def.undeletable, '변환할 카드 선택 (3장)');
      if (!c) break;
      run.removeCard(c);
      const nc = run.cardReward('normal')[0];
      if (nc) { if (nc.canUpgrade()) nc.upgrade(); run.addCard(nc); }
    }
    toast('카드 3장이 변환되고 강화되었다.');
  } else if (id === 'tinyHouse') {
    run.gainGold(50);
    run.gainMaxHp(5);
    run.addPotion(run.randomPotion());
    run.upgradeRandom((c) => c.canUpgrade(), 1);
    const cards = run.cardReward('normal');
    saveRun(run);
    showRewards([{ type: 'card', cards }], () => goMap());
    return true;
  }
  saveRun(run);
  return true;
}


// ---------------- 강화 미리보기 / 확인 ----------------
/** 강화 전-후를 비교해 보여주고 확인을 받는다. */
function showUpgradePreview(card) {
  return new Promise((resolve) => {
    const after = card.copy();
    after.upgrade();
    const diff = [];
    const label = { cost: '비용', dmg: '피해', blk: '방어도', mag: '수치', hits: '횟수' };
    ['cost', 'dmg', 'blk', 'mag', 'hits'].forEach((k) => {
      const a = card.v(k), b = after.v(k);
      if (a !== undefined && b !== undefined && a !== b) diff.push(`${label[k]} ${a} → ${b}`);
    });
    if (!card.exhaust && after.exhaust) diff.push('소각 추가');
    if (card.exhaust && !after.exhaust) diff.push('소각 제거');
    if (!card.innate && after.innate) diff.push('내재 추가');
    if (!card.retain && after.retain) diff.push('보존 추가');
    if (card.ethereal && !after.ethereal) diff.push('소멸 제거');
    if (!diff.length) diff.push('효과가 강화됩니다');

    openModal((box) => {
      box.append(modalTitle('강화하시겠습니까?'));
      const row = el('div', { class: 'upgrade-compare' });
      const left = el('div', { class: 'uc-side' }, renderCardBig(card), el('span', { class: 'uc-label', text: '현재' }));
      const arrow = el('div', { class: 'uc-arrow', html: svgIcon('arrowUp', { size: 26, color: '#7cff9a' }) });
      const right = el('div', { class: 'uc-side' }, renderCardBig(after), el('span', { class: 'uc-label up', text: '강화 후' }));
      row.append(left, arrow, right);
      box.append(row);
      box.append(el('div', { class: 'uc-diff', html: diff.map((d) => `<span>${d}</span>`).join('') }));
      box.append(el('div', { class: 'modal-actions' },
        el('button', { class: 'btn gold', text: '강화한다', onclick: () => { SFX.upgrade(); closeModal(); resolve(true); } }),
        el('button', { class: 'btn ghost', text: '다시 고르기', onclick: () => { SFX.tap(); closeModal(); resolve(false); } })));
    });
  });
}

/** 카드 제거 전 확인 */
function confirmRemove(card, price) {
  return new Promise((resolve) => {
    openModal((box) => {
      box.append(modalTitle('이 카드를 제거하시겠습니까?'));
      const big = renderCardBig(card);
      big.style.margin = '0 auto';
      box.append(big);
      if (price !== undefined) box.append(el('p', { class: 'modal-text', text: `비용 ${price} 골드 · 되돌릴 수 없습니다.` }));
      box.append(el('div', { class: 'modal-actions' },
        el('button', { class: 'btn danger', text: '제거한다', onclick: () => { closeModal(); resolve(true); } }),
        el('button', { class: 'btn ghost', text: '취소', onclick: () => { SFX.tap(); closeModal(); resolve(false); } })));
    });
  });
}

/** 카드를 고르고 → 미리보기 확인 → 강화. 취소하면 null */
async function pickAndUpgrade(cands, title = '강화할 카드 선택') {
  if (!cands.length) { toast('강화할 카드가 없습니다.'); return null; }
  for (let guard = 0; guard < 30; guard++) {
    const [c] = await chooseCardsModal(cands, { count: 1, title, optional: true, autoPick: true });
    if (!c) return null;
    const ok = await showUpgradePreview(c);
    if (ok) { c.upgrade(); return c; }
  }
  return null;
}

// ============================================================
//  전투 종료 & 보상
// ============================================================
function endBattle(B) {
  stopOverlayLoop();
  const run = G.run;
  if (!B.won) { gameOver(); return; }
  SFX.victory();
  const kind = B.encounter.kind;
  run.stats.kills += B.enemies.length;
  if (kind === 'elite') run.stats.elites++;
  if (kind === 'boss') run.stats.bosses++;
  run.relicHook('onBattleEnd', run, B);
  if (B.selfRepair) run.healPlayer(B.selfRepair);
  // 훔쳐간 골드 회수
  B.enemies.forEach((e) => { if (e.stolenGold && !e.alive && !e.fled) run.gainGold(e.stolenGold); });

  if (B.escaped) { G.battle = null; goMap(); return; }

  const rewards = [];
  const gold = run.goldReward(kind);
  rewards.push({ type: 'gold', amount: gold });
  if (run.rollPotionDrop()) rewards.push({ type: 'potion', id: run.randomPotion() });
  rewards.push({ type: 'card', cards: run.cardReward(kind === 'boss' ? 'elite' : kind) });
  if (kind === 'elite') rewards.push({ type: 'relic', id: run.relicReward() });
  if (run.flags.pendingRelic) { rewards.push({ type: 'relic', id: run.pickRelic(run.flags.pendingRelic) }); run.flags.pendingRelic = null; }
  if (kind === 'boss') { rewards[0].amount = run.goldReward('boss'); }

  G.battle = null;
  showRewards(rewards, () => {
    if (kind === 'boss') afterBoss();
    else goMap();
  });
}

function showRewards(rewards, done) {
  const taken = new Set();
  const hasPotion = rewards.some((rw) => rw.type === 'potion');
  const build = () => {
    openModal((box) => {
      box.append(modalTitle('보상'));
      const list = el('div', { style: { width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' } });
      rewards.forEach((rw, i) => {
        const row = rewardRow(rw, i, taken, build);
        if (row) list.appendChild(row);
      });
      box.append(list, el('div', { class: 'modal-actions' },
        el('button', { class: 'btn gold', text: '계속', onclick: () => { SFX.tap(); closeModal(); done(); } })));
    }, { focus: hasPotion ? 'potion' : null });
  };
  build();
}

function rewardRow(rw, idx, taken, rebuild) {
  const run = G.run;
  const row = el('button', { class: 'reward-row' + (taken.has(idx) ? ' taken' : '') });
  const take = () => { taken.add(idx); saveRun(run); renderTopbar('#map-top'); rebuild(); };

  if (rw.type === 'gold') {
    row.innerHTML = `<div class="relic-big" style="border-color:#e8c34a">${svgIcon('ring', { size: 22, color: '#e8c34a' })}</div><span>골드 ${rw.amount}</span>`;
    row.addEventListener('click', () => { SFX.gold(); run.gainGold(rw.amount); take(); });

  } else if (rw.type === 'potion') {
    const d = POTIONS[rw.id];
    if (!d) return null;
    row.innerHTML = `<div class="relic-big" style="border-color:${d.color}">${svgIcon('potion', { size: 22, color: d.color })}</div><div><b style="color:#e8c34a">${d.name}</b><br><small style="color:#9a92a8">${d.desc(1)}</small></div>`;
    row.addEventListener('click', () => {
      if (!run.addPotion(rw.id)) { toast('물약 슬롯이 가득 찼습니다.'); return; }
      SFX.potion(); take();
    });

  } else if (rw.type === 'relic') {
    const d = RELICS[rw.id];
    if (!d) return null;
    row.innerHTML = `<div class="relic-big">${relicIcon(d, 24)}</div><div><b style="color:#e8c34a">${d.name}</b><br><small style="color:#9a92a8">${d.desc}</small></div>`;
    row.addEventListener('click', async () => { await gainRelic(rw.id); take(); });

  } else if (rw.type === 'card') {
    row.innerHTML = `<div class="relic-big" style="border-color:#8ad0ff">${svgIcon('book', { size: 22, color: '#8ad0ff' })}</div><span>카드 보상 (${rw.cards.length}장 중 택 1)</span>`;
    row.addEventListener('click', () => {
      SFX.tap();
      openModal((b2) => {
        b2.append(modalTitle('카드 1장 선택'));
        const grid = el('div', { class: 'card-grid' });
        rw.cards.forEach((c) => {
          const ce = renderCard(c);
          ce.style.position = 'relative';
          ce.addEventListener('click', () => {
            SFX.cardPick();
            run.addCard(c);
            toast(`${c.name} 획득!`);
            take();
          });
          grid.appendChild(ce);
        });
        b2.append(grid);
        const acts = el('div', { class: 'modal-actions' });
        if (run.hasRelic('singingBowl')) acts.append(el('button', {
          class: 'btn ghost', text: '최대 체력 +2',
          onclick: () => { run.gainMaxHp(2); take(); },
        }));
        acts.append(el('button', { class: 'btn ghost', text: '건너뛰기', onclick: () => take() }));
        b2.append(acts);
      });
    });

  } else return null;

  if (taken.has(idx)) { row.classList.add('taken'); }
  return row;
}

// ---------------- 보스 클리어 ----------------
function afterBoss() {
  const run = G.run;
  if (run.act >= 3) { victory(); return; }
  // 보스 유물 선택
  const choices = run.bossRelicChoices();
  openModal((box) => {
    box.append(modalTitle('보스 유물'), modalText('하나를 선택하세요.'));
    choices.forEach((id) => {
      const d = RELICS[id];
      const row = el('button', { class: 'reward-row' });
      row.innerHTML = `<div class="relic-big" style="border-color:#b04aff">${relicIcon(d, 24)}</div><div><b style="color:#e8c34a">${d.name}</b><br><small style="color:#9a92a8">${d.desc}</small></div>`;
      row.addEventListener('click', async () => {
        closeModal();
        await gainRelic(id);
        nextAct();
      });
      box.appendChild(row);
    });
    box.append(el('div', { class: 'modal-actions' },
      el('button', { class: 'btn ghost', text: '건너뛰기', onclick: () => { closeModal(); nextAct(); } })));
  });
}

function nextAct() {
  const run = G.run;
  run.advanceAct();       // 체력 전체 회복 + 다음 막 지도 생성
  SFX.heal();
  openModal((box) => {
    box.append(
      modalTitle(`${run.act}막`),
      modalText(`보스를 쓰러뜨렸습니다!\n체력이 모두 회복되었습니다.\n(${run.player.hp}/${run.player.maxHp})\n\n${ACT_RANGES[run.act - 1].start}층부터 다시 오릅니다.`),
      el('div', { class: 'modal-actions' },
        el('button', { class: 'btn gold', text: '계속 오른다', onclick: () => { SFX.tap(); closeModal(); goMap(); } })),
    );
  });
  saveRun(run);
}

// ============================================================
//  모닥불
// ============================================================
function showRest() {
  const run = G.run;
  showScreen('scr-map');
  renderMap();
  const opts = [];
  if (!run.hasRelic('coffeeDripper')) opts.push({
    icon: 'flame', color: '#ff9a4a', label: '휴식',
    desc: `체력을 ${restHeal(run)} 회복합니다. `
      + `(${run.player.hp} → ${Math.min(run.player.maxHp, run.player.hp + restHeal(run))} / ${run.player.maxHp})`,
    act: () => { SFX.campfire(); run.healPlayer(restHeal(run)); run.flags.teaSet = true; finishRest('편안히 쉬었다.'); },
  });
  if (!run.hasRelic('fusionHammer')) opts.push({
    icon: 'hammer', color: '#8ad0ff', label: '대장간',
    desc: '카드 1장을 강화합니다.',
    act: async () => {
      const c = await pickAndUpgrade(run.deck.filter((x) => x.canUpgrade()), '강화할 카드 선택');
      if (c) { run.flags.teaSet = true; finishRest(`${c.name} 강화 완료!`); }
    },
  });
  if (run.hasRelic('peacePipe')) opts.push({
    icon: 'potion', color: '#8affc0', label: '흡연',
    desc: '카드 1장을 제거합니다.',
    act: async () => {
      const cand = run.deck.filter((c) => !c.def.undeletable);
      const [c] = await chooseCardsModal(cand, { count: 1, title: '제거할 카드' });
      if (c) { run.removeCard(c); finishRest(`${c.name} 제거됨.`); }
    },
  });
  if (run.hasRelic('shovel')) opts.push({
    icon: 'hammer', color: '#e8c34a', label: '파헤치기',
    desc: '유물을 하나 얻습니다.',
    act: async () => { const id = run.relicReward(); if (id) { await gainRelic(id); finishRest(`${RELICS[id].name} 획득!`); } },
  });
  const girya = run.relicObj('girya');
  if (girya && girya.counter < 3) opts.push({
    icon: 'fist', color: '#ff7a5a', label: '들어올리기',
    desc: `힘을 영구히 1 얻습니다. (${girya.counter}/3)`,
    act: () => { girya.counter++; run.flags.giryaStr = (run.flags.giryaStr || 0) + 1; finishRest('힘이 강해졌다!'); },
  });

  openModal((box) => {
    box.append(modalTitle('모닥불'), modalText('불꽃이 타오른다. 무엇을 하겠는가?'));
    opts.forEach((o) => {
      const row = el('button', { class: 'choice-row' });
      row.innerHTML = `<div class="ci">${svgIcon(o.icon, { size: 28, color: o.color })}</div><div><b>${o.label}</b><small>${o.desc}</small></div>`;
      row.addEventListener('click', () => { SFX.tap(); o.act(); });
      box.appendChild(row);
    });
  }, { focus: 'hp' });
}

function restHeal(run) {
  let h = Math.floor(run.player.maxHp * 0.3);
  if (run.hasRelic('regalPillow')) h += 15;
  if (run.hasRelic('eternalFeather')) h += Math.floor(run.deck.length / 5) * 3;
  return h;
}

function finishRest(msg) {
  const run = G.run;
  closeModal();
  toast(msg);
  saveRun(run);
  if (run.hasRelic('dreamCatcher')) {
    const cards = run.cardReward('normal');
    showRewards([{ type: 'card', cards }], () => goMap());
  } else goMap();
}

// ============================================================
//  보물 방
// ============================================================
function showTreasure() {
  const run = G.run;
  showScreen('scr-map');
  renderMap();
  const roll = run.rng.next();
  const tier = roll < 0.5 ? 'common' : roll < 0.83 ? 'uncommon' : 'rare';
  const items = [];
  const rid = run.pickRelic(tier);
  if (rid) items.push({ type: 'relic', id: rid });
  const mat = run.relicObj('matryoshka');
  if (mat && mat.counter > 0) { mat.counter--; const r2 = run.relicReward(); if (r2) items.push({ type: 'relic', id: r2 }); }
  if (run.rng.chance(0.5)) items.push({ type: 'gold', amount: run.rng.range(25, 75) });
  if (run.hasRelic('cursedKey')) { run.addCurse(run.rng.pick(['clumsy', 'decay', 'doubt', 'injury', 'pain', 'regret', 'shame'])); toast('저주받은 열쇠가 저주를 불렀다!'); }
  SFX.relic();
  showRewards(items, () => goMap());
}

// ============================================================
//  상점
// ============================================================
function showShop() {
  const run = G.run;
  showScreen('scr-map');
  renderMap();
  run.relicHook('onEnterShop', run);
  const discount = run.hasRelic('theCourier') ? 0.8 : 1;

  const cards = [];
  for (let i = 0; i < 5; i++) {
    const rar = i < 2 ? 'common' : i < 4 ? 'uncommon' : 'rare';
    const list = Object.values(CARD_DEFS).filter((d) => d.color === run.charColor && d.rarity === rar && !d.noPool);
    if (list.length) cards.push(new Card(run.rng.pick(list).id));
  }
  for (let i = 0; i < 2; i++) {
    const c = run.colorlessReward(i === 0 ? 'uncommon' : 'rare');
    if (c) cards.push(c);
  }
  const basePrice = { basic: 50, common: 50, uncommon: 75, rare: 150, special: 90, curse: 50 };
  const cardItems = cards.map((c) => ({ card: c, price: Math.round(basePrice[c.rarity] * (c.color === 'colorless' ? 1.2 : 1) * discount * run.rng.range(9, 11) / 10) }));

  const relicItems = [];
  for (let i = 0; i < 3; i++) {
    const rar = i === 0 ? 'common' : i === 1 ? 'uncommon' : 'rare';
    const id = run.pickRelic(rar);
    if (id && !relicItems.some((r) => r.id === id)) relicItems.push({ id, price: Math.round({ common: 150, uncommon: 250, rare: 300, boss: 300, shop: 150 }[RELICS[id].rarity] * discount) });
  }
  const potionItems = [];
  for (let i = 0; i < 3; i++) {
    const id = run.randomPotion();
    potionItems.push({ id, price: Math.round({ common: 50, uncommon: 75, rare: 100 }[POTIONS[id].rarity] * discount) });
  }
  const removalPrice = run.hasRelic('smilingMask') ? 50 : 75 + (run.flags.removals || 0) * 25;

  // 무작위 상품 1개 할인 (반값 또는 80% 할인)
  const allItems = [...cardItems, ...relicItems, ...potionItems];
  if (allItems.length) {
    const sale = run.rng.pick(allItems);
    const rate = run.rng.chance(0.5) ? 0.5 : 0.2;   // 50% 할인 / 80% 할인
    sale.saleRate = rate;
    sale.oldPrice = sale.price;
    sale.price = Math.max(1, Math.round(sale.price * rate));
    sale.saleLabel = rate === 0.5 ? '반값' : '80% 할인';
  }

  const rebuild = () => {
    openModal((box) => {
      box.append(modalTitle('상점'), el('p', { class: 'modal-text', text: `보유 골드 : ${run.gold}G` }));
      // 카드
      const grid = el('div', { class: 'card-grid' });
      cardItems.forEach((it) => {
        if (it.sold) return;
        const wrap = el('div', { class: 'shop-item' + (it.saleRate ? ' on-sale' : '') });
        const ce = renderCard(it.card, { small: true });
        ce.style.position = 'relative';
        if (it.saleRate) ce.appendChild(el('div', { class: 'sale-badge', text: it.saleLabel }));
        wrap.append(ce, el('div', { class: 'price' + (run.gold < it.price ? ' cant' : ''),
          html: it.saleRate ? `<s>${it.oldPrice}G</s> ${it.price}G` : `${it.price}G` }));
        wrap.addEventListener('click', () => {
          if (run.gold < it.price) { toast('골드가 부족합니다.'); return; }
          run.spendGold(it.price); run.addCard(it.card); it.sold = true;
          SFX.gold(); toast(`${it.card.name} 구매!`); rebuild();
        });
        grid.appendChild(wrap);
      });
      box.append(grid);
      // 유물 / 물약
      relicItems.forEach((it) => {
        if (it.sold) return;
        const d = RELICS[it.id];
        const row = el('button', { class: 'reward-row' });
        row.innerHTML = `<div class="relic-big">${relicIcon(d, 24)}</div><div style="flex:1"><b style="color:#e8c34a">${d.name}</b>${it.saleRate ? ` <span class="sale-tag">${it.saleLabel}</span>` : ''}<br><small style="color:#9a92a8">${d.desc}</small></div><span class="price${run.gold < it.price ? ' cant' : ''}">${it.saleRate ? `<s>${it.oldPrice}G</s> ` : ''}${it.price}G</span>`;
        row.addEventListener('click', async () => {
          if (run.gold < it.price) { toast('골드가 부족합니다.'); return; }
          run.spendGold(it.price); it.sold = true;
          await gainRelic(it.id);
          rebuild();
        });
        box.appendChild(row);
      });
      potionItems.forEach((it) => {
        if (it.sold) return;
        const d = POTIONS[it.id];
        const row = el('button', { class: 'reward-row' });
        row.innerHTML = `<div class="relic-big" style="border-color:${d.color}">${svgIcon('potion', { size: 22, color: d.color })}</div><div style="flex:1"><b style="color:#e8c34a">${d.name}</b>${it.saleRate ? ` <span class="sale-tag">${it.saleLabel}</span>` : ''}<br><small style="color:#9a92a8">${d.desc(1)}</small></div><span class="price${run.gold < it.price ? ' cant' : ''}">${it.saleRate ? `<s>${it.oldPrice}G</s> ` : ''}${it.price}G</span>`;
        row.addEventListener('click', () => {
          if (run.gold < it.price) { toast('골드가 부족합니다.'); return; }
          if (!run.addPotion(it.id)) { toast('물약 슬롯이 가득 찼습니다.'); return; }
          run.spendGold(it.price); it.sold = true; SFX.potion(); rebuild();
        });
        box.appendChild(row);
      });
      // 카드 제거
      if (!run.flags.shopRemoved) {
        const row = el('button', { class: 'reward-row' });
        row.innerHTML = `<div class="relic-big" style="border-color:#ff7a7a">${svgIcon('minus', { size: 22, color: '#ff7a7a' })}</div><div style="flex:1"><b style="color:#e8c34a">카드 제거</b><br><small style="color:#9a92a8">덱에서 카드 1장을 제거합니다.</small></div><span class="price${run.gold < removalPrice ? ' cant' : ''}">${removalPrice}G</span>`;
        row.addEventListener('click', async () => {
          if (run.gold < removalPrice) { toast('골드가 부족합니다.'); return; }
          const cand = run.deck.filter((c) => !c.def.undeletable);
          const [c] = await chooseCardsModal(cand, { count: 1, title: '제거할 카드', optional: true, autoPick: true });
          if (c && await confirmRemove(c, removalPrice)) {
            run.spendGold(removalPrice); run.removeCard(c);
            run.flags.removals = (run.flags.removals || 0) + 1;
            run.flags.shopRemoved = true;
            SFX.exhaust();
            toast(`${c.name} 제거됨.`);
          }
          rebuild();
        });
        box.appendChild(row);
      }
      box.append(el('div', { class: 'modal-actions' },
        el('button', { class: 'btn', text: '나가기', onclick: () => { SFX.tap(); run.flags.shopRemoved = false; closeModal(); saveRun(run); goMap(); } })));
    }, { focus: 'potion' });
  };
  rebuild();
}

// ============================================================
//  이벤트
// ============================================================
function showEvent() {
  const run = G.run;
  showScreen('scr-map');
  renderMap();
  const ev = pickEvent(run);
  const ctx = {
    pickCard: async (filter, title) => {
      const cand = run.deck.filter(filter);
      if (!cand.length) return null;
      const [c] = await chooseCardsModal(cand, { count: 1, title });
      return c;
    },
    pickUpgrade: async (filter, title) => pickAndUpgrade(run.deck.filter(filter), title),
    chooseFrom: async (list, title) => {
      const [c] = await chooseCardsModal(list, { count: 1, title, virtual: true });
      return c;
    },
    battle: async (kind, relicRarity) => {
      closeModal();
      const enc = run.makeEncounter(kind === 'elite' ? ROOM.ELITE : ROOM.MONSTER);
      if (relicRarity) run.flags.pendingRelic = relicRarity;
      startBattle(enc);
      return 'battle';
    },
  };
  openModal((box) => {
    box.append(
      modalTitle(ev.name),
      el('div', { class: 'relic-big', style: { width: '64px', height: '64px' }, html: svgIcon('question', { size: 34, color: '#a0d0ff' }) }),
      modalText(ev.text),
    );
    ev.options.forEach((o) => {
      if (o.condition && !o.condition(run)) return;
      const row = el('button', { class: 'choice-row' });
      row.innerHTML = `<div><b>${o.label}</b>${o.desc ? `<small>${o.desc}</small>` : ''}</div>`;
      row.addEventListener('click', async () => {
        SFX.tap();
        row.disabled = true;
        const res = await o.effect(run, ctx);
        if (res === 'battle' || !res) return;
        saveRun(run);
        openModal((b2) => {
          b2.append(modalTitle(ev.name), modalText(res),
            el('div', { class: 'modal-actions' },
              el('button', { class: 'btn gold', text: '계속', onclick: () => { closeModal(); goMap(); } })));
        }, { focus: 'hp' });
      });
      box.appendChild(row);
    });
  }, { focus: 'hp' });
}

// ============================================================
//  덱 보기 / 설정 / 종료 화면
// ============================================================
function showDeck() {
  const run = G.run;
  const sorted = [...run.deck].sort((a, b) => {
    const order = { attack: 0, skill: 1, power: 2, status: 3, curse: 4 };
    return (order[a.type] - order[b.type]) || a.baseCost - b.baseCost || a.name.localeCompare(b.name);
  });
  openModal((box) => {
    box.append(modalTitle(`덱 (${run.deck.length}장)`));
    const counts = {};
    run.deck.forEach((c) => { counts[c.type] = (counts[c.type] || 0) + 1; });
    box.append(el('p', { class: 'modal-text', text: Object.entries(counts).map(([k, v]) => `${TYPE_KR[k]} ${v}`).join(' · ') }));
    const grid = el('div', { class: 'card-grid' });
    sorted.forEach((c) => {
      const ce = renderCard(c, { small: true });
      ce.addEventListener('click', () => {
        openModal((b2) => {
          const big = renderCardBig(c);
          b2.append(big, el('div', { class: 'modal-actions' },
            el('button', { class: 'btn', text: '닫기', onclick: () => { closeModal(); showDeck(); } })));
        });
      });
      grid.appendChild(ce);
    });
    box.append(grid, el('div', { class: 'modal-actions' },
      el('button', { class: 'btn', text: '닫기', onclick: () => { SFX.tap(); closeModal(); } })));
  });
}

function showSettings() {
  openModal((box) => {
    box.append(modalTitle('설정'));
    const sfxBtn = el('button', { class: 'btn', text: `효과음 : ${isSfxEnabled() ? '켜짐' : '꺼짐'}` });
    sfxBtn.addEventListener('click', () => {
      setSfxEnabled(!isSfxEnabled());
      sfxBtn.textContent = `효과음 : ${isSfxEnabled() ? '켜짐' : '꺼짐'}`;
      if (isSfxEnabled()) { unlockAudio(); SFX.tap(); }
    });
    box.append(
      sfxBtn,
      el('button', { class: 'btn ghost', text: '게임 방법', onclick: () => { closeModal(); showHelp(); } }),
      el('button', { class: 'btn ghost', text: '유물 목록', onclick: () => { closeModal(); showRelicList(); } }),
      el('button', { class: 'btn danger', text: '런 포기 (타이틀로)', onclick: () => {
        if (!confirm('현재 런을 포기하고 타이틀로 돌아갈까요?')) return;
        clearSave(); G.run = null; G.battle = null; stopOverlayLoop(); closeModal(); showScreen('scr-title');
        $('#btn-continue').disabled = true;
      } }),
      el('div', { class: 'modal-actions' }, el('button', { class: 'btn', text: '닫기', onclick: () => closeModal() })),
    );
  });
}

function showRelicList() {
  const run = G.run;
  openModal((box) => {
    box.append(modalTitle(`보유 유물 (${run.relics.length})`));
    run.relics.forEach((ro) => {
      const d = RELICS[ro.id];
      if (!d) return;
      const row = el('div', { class: 'reward-row' });
      row.innerHTML = `<div class="relic-big">${relicIcon(d, 24)}</div><div><b style="color:#e8c34a">${d.name}</b> <small style="color:#7a7288">${RELIC_RARITY_KR[d.rarity]}</small><br><small style="color:#9a92a8">${d.desc}</small></div>`;
      box.appendChild(row);
    });
    box.append(el('div', { class: 'modal-actions' },
      el('button', { class: 'btn', text: '닫기', onclick: () => closeModal() })));
  });
}

function gameOver() {
  const run = G.run;
  SFX.defeat();
  clearSave();
  stopOverlayLoop();
  openModal((box) => {
    box.append(
      modalTitle('당신은 쓰러졌다'),
      el('div', { class: 'relic-big', style: { width: '72px', height: '72px', borderColor: '#8a2a2a' }, html: svgIcon('skull', { size: 40, color: '#d04a4a' }) }),
      modalText(`도달 층수 : ${run.floor}층 (${run.act}막)\n처치한 적 : ${run.stats.kills}\n엘리트 처치 : ${run.stats.elites}\n보스 처치 : ${run.stats.bosses}\n덱 : ${run.deck.length}장 · 유물 : ${run.relics.length}개`),
      el('div', { class: 'modal-actions' },
        el('button', { class: 'btn gold', text: '다시 도전', onclick: () => { closeModal(); newGame(); } }),
        el('button', { class: 'btn ghost', text: '타이틀', onclick: () => { closeModal(); showScreen('scr-title'); $('#btn-continue').disabled = true; } })),
    );
  });
}

function victory() {
  const run = G.run;
  SFX.victory();
  clearSave();
  stopOverlayLoop();
  openModal((box) => {
    box.append(
      modalTitle('첨탑 정복!'),
      el('div', { class: 'relic-big', style: { width: '78px', height: '78px', borderColor: '#e8c34a' }, html: svgIcon('crown', { size: 44, color: '#ffd884' }) }),
      modalText(`50층의 최종 보스를 쓰러뜨렸습니다!\n\n남은 체력 : ${run.player.hp}/${run.player.maxHp}\n처치한 적 : ${run.stats.kills}\n덱 : ${run.deck.length}장 · 유물 : ${run.relics.length}개`),
      el('div', { class: 'modal-actions' },
        el('button', { class: 'btn gold', text: '새 게임', onclick: () => { closeModal(); newGame(); } }),
        el('button', { class: 'btn ghost', text: '타이틀', onclick: () => { closeModal(); showScreen('scr-title'); $('#btn-continue').disabled = true; } })),
    );
  });
}

// ============================================================
//  초기화
// ============================================================
function bind() {
  $('#btn-endturn').addEventListener('click', () => {
    const B = G.battle;
    if (!B || !B.playerTurn || B.playing) return;
    SFX.tap();
    G.selectedCard = null; G.targeting = false;
    B.endTurn();
  });
  $('#btn-draw').addEventListener('click', () => { SFX.tap(); showPile('뽑을 카드 더미', G.battle.drawPile, true); });
  $('#btn-discard').addEventListener('click', () => { SFX.tap(); showPile('버린 카드 더미', G.battle.discardPile); });
  $('#btn-exhaust').addEventListener('click', () => { SFX.tap(); showPile('소각한 카드', G.battle.exhaustPile); });
  $('#btn-deck').addEventListener('click', () => { SFX.tap(); showDeck(); });
  $('#btn-settings').addEventListener('click', () => { SFX.tap(); showSettings(); });
  $('#stage-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'stage-overlay' && G.selectedCard) {
      G.selectedCard = null; G.targeting = false; renderBattle();
    }
  });
  // 화면 맨 아래 빈 띠 + 액션바의 빈 공간을 탭하면 선택 취소
  $('#cancel-zone').addEventListener('click', () => { clearSelection(); });
  $('.actionbar').addEventListener('click', (e) => {
    if (e.target.closest('button, .potion-slot, .energy-orb')) return;
    clearSelection();
  });
  addEventListener('resize', () => {
    S3.resize();
    if (G.battle) renderBattle();
    if (G.run && !$('#scr-map').hidden) { M3.resizeMap(); }
  });
  addEventListener('visibilitychange', () => { if (document.hidden && G.run) saveRun(G.run); });
}

initTitle();
bind();
console.log('%ccnation STS 준비 완료', 'color:#e8c34a');
