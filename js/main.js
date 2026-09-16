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
import { KEYWORDS as KEYWORD_LIST, findKeywords } from './data/keywords.js';
import { RELICS, RARITY_KR as RELIC_RARITY_KR } from './data/relics.js';
import { POTIONS } from './data/potions.js';
import { EVENTS, pickEvent } from './data/events.js';
import { CHARACTERS, CHAR_LIST, charOf } from './data/characters.js';
import { rollNeowOptions } from './data/neow.js';
import { STANCE_KR } from './engine/battle.js';
import { MONSTERS } from './data/monsters.js';
import { renderCard, renderCardBig } from './ui/cardview.js';
import { svgIcon, powerIcon, intentIcon, INTENT_COLOR, relicIcon, hashColor } from './ui/icons.js';
import * as I3 from './three/items3d.js';
import * as T3 from './three/title3d.js';
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
window.__top = () => renderTopbar(G.battle ? '#battle-top' : '#map-top');   // 자동 테스트용
window.__fight = (ids) => startBattle({ monsters: ids, kind: 'boss' });     // 자동 테스트용

const SCREENS = ['scr-title', 'scr-map', 'scr-battle', 'scr-history', 'scr-modal'];
function showScreen(id) {
  SCREENS.forEach((s) => { const e = $('#' + s); if (e) e.hidden = s !== id; });
  if (id === 'scr-title') requestAnimationFrame(() => { try { T3.resizeTitle(); } catch (e) { /* noop */ } });
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
      ? `<span class="ms-slot filled" style="border-color:${d.color}" title="${d.name}">${potionHTML(d, 17)}</span>`
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
  startTitleScene();
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

/** 타이틀 3D 무대 (캐릭터 4종) — 타이틀이 보일 때만 돌린다 */
function startTitleScene() {
  const cv = $('#title-canvas');
  if (!cv) return;
  try { T3.initTitle(cv, 'throne'); T3.resizeTitle(); } catch (e) { /* WebGL 불가 시 무시 */ }
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

const HELP_SECTIONS = [
  ['목표', [
    ['첨탑 오르기', '1층부터 50층까지 올라가 최종 보스를 처치하세요. 17·34·50층에 보스가 있고, 막을 넘어가면 체력이 전부 회복됩니다.'],
    ['자동 저장', '진행 상황은 자동으로 저장됩니다. 타이틀의 "이어하기" 로 돌아올 수 있습니다.'],
  ]],
  ['전투 조작', [
    ['카드 사용', '카드를 탭하면 선택되어 위로 떠오릅니다. 한 번 더 탭하거나 위로 밀면 사용합니다.'],
    ['선택 취소', '화면 <b>맨 아래 빈 띠</b>(물약 줄 아래)나 액션바의 빈 공간을 탭하면 고른 카드가 손패 제자리로 돌아갑니다. 무대의 빈 곳을 탭해도 됩니다.'],
    ['대상 지정', '적이 여럿이면 <b>몬스터 본체를 탭</b>해 지정합니다. 지정 중인 적에게는 붉은 링이 표시됩니다.'],
    ['물약 사용', '상단바의 물약 칸을 탭하면 사용 여부를 고를 수 있습니다.'],
    ['턴 종료', '오른쪽 아래 "턴 종료" 를 누르면 적이 예고한 의도대로 행동합니다.'],
  ]],
  ['눌러서 보는 정보', [
    ['카드 상세', '<b>카드를 길게 누르면</b>(약 0.4초) 상세 설명 화면이 뜹니다. 강화 후 효과와 그 카드에 쓰인 용어의 뜻까지 함께 보여 줍니다. 손패·보상·상점·덱 보기 어디서나 됩니다.'],
    ['적의 다음 행동', '적 머리 위의 <b>의도 아이콘을 탭</b>하면 그 행동이 무엇인지, 예상 피해와 거는 효과가 무엇인지 설명이 나옵니다.'],
    ['유물 / 상태이상', '상단바의 유물이나 캐릭터 옆 상태이상 아이콘을 탭하면 설명이 나옵니다.'],
    ['카드 더미', '"뽑을 / 버린 / 소각" 을 탭하면 그 더미에 어떤 카드가 있는지 볼 수 있습니다.'],
    ['용어집', '이 화면의 "용어집" 버튼에서 게임에 나오는 용어 전체를 볼 수 있습니다.'],
  ]],
  ['화면 구성', [
    ['위쪽 1행', '체력 · 골드 · 물약 칸 · 현재 막/층'],
    ['위쪽 2행', '지금까지 얻은 유물이 왼쪽부터 나열됩니다.'],
    ['선택 화면', '보상·모닥불·상점·이벤트 화면 위쪽에는 항상 내 체력·골드·남은 물약 칸이 표시되어, 무엇을 고를지 바로 판단할 수 있습니다.'],
    ['메뉴 ☰', '덱 보기 · 유물 목록 · 게임 방법 · 설정으로 들어갑니다.'],
  ]],
  ['지도', [
    ['이동', '위아래로 밀어 둘러보고, 금색 화살표가 가리키는 <b>빛나는 방</b>을 탭해 이동합니다.'],
    ['방 종류', '상단 범례에 전투 · 엘리트 · 의문 · 모닥불 · 상점 · 보물 · 보스 아이콘이 있습니다. 엘리트와 보스는 아이콘이 더 크게 표시됩니다.'],
  ]],
  ['알아 두면 좋은 것', [
    ['방어도', '받는 피해를 대신 막아 주며, 턴이 끝나면 사라집니다.'],
    ['취약 · 약화 · 허약', '취약은 받는 피해 +50%, 약화는 주는 피해 −25%, 허약은 얻는 방어도 −25%.'],
    ['수치 표시', '카드와 적 의도에 적힌 숫자는 힘·약화·취약이 <b>이미 반영된 실제 값</b>입니다. 달라진 숫자는 색으로 강조됩니다.'],
  ]],
];

function showHelp() {
  openModal((box) => {
    box.append(modalTitle('게임 방법'));
    const body = el('div', { class: 'help-body' });
    HELP_SECTIONS.forEach(([title, rows]) => {
      const sec = el('div', { class: 'help-sec' });
      sec.appendChild(el('h4', { text: title }));
      const ul = el('ul');
      rows.forEach(([k, v]) => ul.appendChild(el('li', { html: `<b>${k}</b> — ${v}` })));
      sec.appendChild(ul);
      body.appendChild(sec);
    });
    box.append(body, el('div', { class: 'modal-actions' },
      el('button', { class: 'btn', text: '용어집', onclick: () => { SFX.tap(); closeModal(); showGlossary(); } }),
      el('button', { class: 'btn ghost', text: '닫기', onclick: () => { SFX.tap(); closeModal(); } })));
  });
}

/** 전체 용어집 */
function showGlossary() {
  openModal((box) => {
    box.append(modalTitle('용어집'));
    const ul = el('ul', { class: 'cd-kw glossary' });
    KEYWORD_LIST.forEach(([name, desc, cls]) => {
      ul.appendChild(el('li', {}, el('b', { class: cls, text: name }), ' — ' + desc));
    });
    box.append(ul, el('div', { class: 'modal-actions' },
      el('button', { class: 'btn', text: '게임 방법', onclick: () => { SFX.tap(); closeModal(); showHelp(); } }),
      el('button', { class: 'btn ghost', text: '닫기', onclick: () => { SFX.tap(); closeModal(); } })));
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

  // --- 1행 : 체력 · 골드 · 물약 · 층 ---
  const top = el('div', { class: 'tb-row1' });
  const hp = el('div', { class: 'tb-hp' + (run.player.hp / Math.max(1, run.player.maxHp) <= 0.3 ? ' low' : '') });
  hp.append(itemIcon(I3.heartIcon3D(), 'heart', 20),
    el('b', { text: `${run.player.hp}/${run.player.maxHp}` }));
  top.appendChild(hp);

  const gold = el('div', { class: 'tb-gold' });
  gold.append(itemIcon(I3.goldIcon3D(), 'ring', 20), el('b', { text: String(run.gold) }));
  top.appendChild(gold);

  top.appendChild(potionRow());
  top.appendChild(el('div', { class: 'tb-floor', text: `${run.act}막 · ${run.floor || 0}층` }));
  top.appendChild(el('button', { class: 'menu-btn', html: '<span></span><span></span><span></span>',
    onclick: () => { SFX.tap(); showGameMenu(); } }));
  bar.appendChild(top);

  // --- 2행 : 유물 (왼쪽부터 차례로) ---
  const r = el('div', { class: 'relic-row' });
  run.relics.forEach((ro) => {
    const d = RELICS[ro.id];
    if (!d) return;
    const b = el('div', { class: 'relic' + (d.rarity === 'boss' ? ' boss' : '') });
    b.appendChild(relicMark(d, 30));
    if (ro.counter) b.appendChild(el('i', { class: 'relic-count', text: String(ro.counter) }));
    b.addEventListener('click', (e) => showTooltip(e, d.name, d.desc + (ro.counter ? `\n(${ro.counter})` : '')));
    r.appendChild(b);
  });
  bar.appendChild(el('div', { class: 'tb-row2' + (run.relics.length ? '' : ' empty') }, r));
}

/** 데이터 URL 이 있으면 3D 아이콘 <img>, 없으면 SVG 로 대체 */
function itemIcon(url, fallbackGlyph, px, color) {
  return url
    ? el('img', { class: 'i3d', src: url, style: { width: px + 'px', height: px + 'px' } })
    : el('i', { class: 'i3d', style: { width: px + 'px', height: px + 'px' },
        html: svgIcon(fallbackGlyph, { size: px, color: color || '#d8d0e8' }) });
}

/** 유물 3D 마크 (실패 시 기존 SVG) */
function relicMark(def, px = 30) {
  const url = I3.relicIcon3D(def);
  return url
    ? el('img', { class: 'i3d', src: url, alt: def.name, style: { width: px + 'px', height: px + 'px' } })
    : el('i', { class: 'i3d', style: { width: px + 'px', height: px + 'px' }, html: relicIcon(def, px) });
}

/** innerHTML 템플릿에서 쓰는 3D 아이콘 문자열 (실패 시 기존 SVG) */
const imgTag = (url, px) => `<img class="i3d" src="${url}" style="width:${px}px;height:${px}px">`;
function relicHTML(d, px = 26) {
  const u = I3.relicIcon3D(d);
  return u ? imgTag(u, px) : relicIcon(d, px);
}
function potionHTML(d, px = 26) {
  const u = I3.potionIcon3D(d);
  return u ? imgTag(u, px) : svgIcon('potion', { size: px, color: d.color });
}
function goldHTML(px = 26) {
  const u = I3.goldIcon3D();
  return u ? imgTag(u, px) : svgIcon('ring', { size: px, color: '#e8c34a' });
}
function cardHTML(px = 26) {
  const u = I3.cardIcon3D();
  return u ? imgTag(u, px) : svgIcon('book', { size: px, color: '#8ad0ff' });
}

/** 물약 3D 마크 */
function potionMark(def, px = 28) {
  const url = I3.potionIcon3D(def);
  return url
    ? el('img', { class: 'i3d', src: url, alt: def.name, style: { width: px + 'px', height: px + 'px' } })
    : el('i', { class: 'i3d', style: { width: px + 'px', height: px + 'px' },
        html: svgIcon('potion', { size: px, color: def.color }) });
}

/** 상단바에 들어가는 물약 슬롯 줄 */
function potionRow() {
  const run = G.run;
  const row = el('div', { class: 'potion-row' });
  for (let i = 0; i < run.potionSlots; i++) {
    const p = run.potions[i];
    const slot = el('div', { class: 'potion-slot' + (p ? ' filled' : '') });
    if (p) {
      const d = POTIONS[p.id];
      slot.style.borderColor = d.color;
      slot.appendChild(potionMark(d, 24));
      slot.addEventListener('click', (e) => { e.stopPropagation(); usePotionPrompt(i); });
    }
    row.appendChild(slot);
  }
  return row;
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

/** 적 의도(다음 행동) 종류별 설명 */
const INTENT_DESC = {
  attack: ['공격', '다음 턴에 당신을 공격합니다.'],
  attackDefend: ['공격 + 방어', '당신을 공격하면서 자신도 방어도를 얻습니다.'],
  attackDebuff: ['공격 + 약화', '당신을 공격하면서 불리한 상태이상을 함께 겁니다.'],
  attackBuff: ['공격 + 강화', '당신을 공격하면서 자신을 더 강하게 만듭니다.'],
  defend: ['방어', '방어도를 얻어 당신의 공격을 막습니다. 이번 턴엔 피해를 주지 않습니다.'],
  defendBuff: ['방어 + 강화', '방어도를 얻고 자신을 강화합니다.'],
  defendDebuff: ['방어 + 약화', '방어도를 얻고 당신에게 불리한 상태이상을 겁니다.'],
  buff: ['강화', '자신이나 아군을 강하게 만듭니다. 이번 턴엔 피해를 주지 않습니다.'],
  debuff: ['약화', '당신에게 불리한 상태이상을 겁니다. 이번 턴엔 피해를 주지 않습니다.'],
  strongDebuff: ['강한 약화', '당신에게 특히 위험한 상태이상을 겁니다. 이번 턴엔 피해를 주지 않습니다.'],
  magic: ['주술', '피해 외의 특수한 효과를 사용합니다.'],
  unknown: ['알 수 없음', '무엇을 할지 예측할 수 없습니다.'],
  sleep: ['수면', '자고 있어 아무것도 하지 않습니다. 공격을 받으면 깨어납니다.'],
  stun: ['기절', '이번 턴을 아무것도 하지 못하고 넘깁니다.'],
  escape: ['도주', '전투에서 달아나려 합니다.'],
};

/**
 * 이 행동이 실제로 무엇을 거는지 몬스터 정의에서 읽어 낸다.
 * (moves 의 run 은 우리가 직접 쓴 정적 코드라 형태가 일정하다)
 */
function intentEffects(actor) {
  const mv = actor.def && actor.def.moves && actor.def.moves[actor.intent.move];
  if (!mv || !mv.run) return [];
  const src = String(mv.run);
  const out = [];

  const re = /addPower\(\s*([A-Za-z.]+)\s*,\s*'(\w+)'\s*(?:,\s*([^,)]+))?/g;
  let m;
  while ((m = re.exec(src))) {
    const toPlayer = /player/i.test(m[1]);
    const nm = powerName(m[2]) || m[2];
    let amt = null;
    if (m[3]) { const num = m[3].match(/-?\d+/); if (num) amt = Number(num[0]); }
    out.push(`${toPlayer ? '나에게' : '자신에게'} ${nm}${amt !== null ? ` ${amt}` : ''}`);
  }

  const counts = {};
  const re2 = /mk\('(\w+)'\)/g;
  while ((m = re2.exec(src))) counts[m[1]] = (counts[m[1]] || 0) + 1;
  Object.entries(counts).forEach(([id, n]) => {
    const d = CARD_DEFS[id];
    out.push(`내 덱에 ${d ? d.name : id}${n > 1 ? ` ${n}장` : ''} 넣음`);
  });

  if (/splitEnemy/.test(src)) out.push('체력을 나눠 둘로 분열');
  if (/heal\(/.test(src)) out.push('자신의 체력 회복');
  if (/summon|addEnemy/.test(src)) out.push('새로운 적을 부름');
  return out;
}

/** 의도 배지를 눌렀을 때 보여 줄 제목/설명 */
function intentTooltip(actor) {
  const B = G.battle;
  const it = actor && actor.intent;
  if (!B || !it) return null;
  const [kind, desc] = INTENT_DESC[it.type] || INTENT_DESC.unknown;
  const lines = [desc];

  const dmg = B.intentDamage(actor);
  if (dmg !== null && dmg !== undefined) {
    lines.push(it.hits > 1
      ? `예상 피해 : ${dmg} × ${it.hits}회 (합계 ${dmg * it.hits})`
      : `예상 피해 : ${dmg}`);
  }
  if (it.blk) lines.push(`얻는 방어도 : ${it.blk}`);
  const fx = intentEffects(actor);
  if (fx.length) lines.push(`효과 : ${fx.join(', ')}`);
  if (dmg !== null && dmg !== undefined) {
    lines.push('※ 힘·약화·취약이 반영된 현재 예상치입니다.');
  }
  const title = it.name ? `${kind} · ${it.name}` : kind;
  return { title, text: lines.join('\n') };
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
  if (!tip.hidden && !e.target.closest('.relic, .pw, .potion-slot, .intent')) tip.hidden = true;
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
  saveRun(G.run);
}

const ROOM_GLYPH = { monster: 'sword', elite: 'skull', event: 'question', rest: 'flame', shop: 'potion', treasure: 'star', boss: 'crown' };
const ROOM_COLOR = { monster: '#d0a0a0', elite: '#ff6a5a', event: '#a0d0ff', rest: '#ffa04a', shop: '#8affc0', treasure: '#ffd24a', boss: '#ff5a4a' };

const LEGEND = [
  ['monster', '전투'], ['elite', '엘리트'], ['event', '의문'],
  ['rest', '모닥불'], ['shop', '상점'], ['treasure', '보물'], ['boss', '보스'],
];
// 실제 몬스터 덩치를 반영해 범례 아이콘 크기를 차등한다 (일반 1 · 엘리트 1.2 · 보스 1.4)
const LEGEND_BASE = 29;
const LEGEND_SCALE = { elite: 1.2, boss: 1.4 };

let legendThumbs = null;   // 지도 3D 아이콘을 구운 썸네일 캐시

function renderLegend() {
  const box = $('#map-legend');
  if (!box) return;
  if (!legendThumbs) legendThumbs = M3.iconThumbs(LEGEND.map(([t]) => t), 112) || {};
  box.innerHTML = '';
  LEGEND.forEach(([type, label]) => {
    const color = ROOM_COLOR[type];
    const px = Math.round(LEGEND_BASE * (LEGEND_SCALE[type] || 1));
    // 범례도 지도에서 쓰는 실제 3D 아이콘을 축소해 보여준다 (썸네일 실패 시 색 점)
    const mark = legendThumbs[type]
      ? el('img', { class: 'legend-icon', src: legendThumbs[type], alt: label,
          style: { width: px + 'px', height: px + 'px' } })
      : el('i', { class: 'legend-dot', style: { color } });
    box.appendChild(el('div', { class: 'legend-item' + (LEGEND_SCALE[type] ? ' big' : '') },
      mark, el('span', { text: label })));
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
  if (B.stance && B.stance !== 'neutral') S3.setStance(B.stance, B.player);
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
    case 'stance':
      // 와쳐의 자세 기운 : 분노 붉은빛 / 평온 푸른빛 / 신성 금빛
      S3.setStance(d.stance, B.player);
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
  renderHand();
  renderUnits();
  if (B.usesOrbs) { S3.syncOrbs(B.orbs, B.orbSlots); renderOrbLabels(B); }
  const et = $('#btn-endturn');
  et.disabled = !B.playerTurn || B.over;
  et.classList.toggle('ready', B.playerTurn && !B.hand.some((c) => B.canPlay(c)));
}

/** 물약은 상단바 1행에 있으므로 해당 상단바를 다시 그린다 */
function renderPotions() {
  renderTopbar(G.battle ? '#battle-top' : '#map-top');
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
      // 의도 배지를 누르면 그 행동이 무엇인지 설명해 준다
      const badge = u.querySelector('.intent');
      if (badge) {
        badge.classList.add('tappable');
        badge.addEventListener('click', (ev) => {
          if (G.targeting || G.pendingPotion !== null) return;   // 대상 지정 중에는 선택을 우선
          ev.stopPropagation();
          SFX.tap();
          const info = intentTooltip(actor);
          if (info) showTooltip(ev, `${actor.name} — ${info.title}`, info.text);
        });
      }
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
    // .unit 은 translate(-50%,-100%) 이라 top 이 라벨 묶음의 '아래쪽'이다.
    // 의도 아이콘까지 화면 안에 들어오도록 실제 높이만큼 여유를 두고 잘라 낸다.
    const h = u.offsetHeight || 62;
    const halfW = Math.min(u.offsetWidth || 120, stage.width - 12) / 2;
    const minTop = Math.min(h + 8, stage.height - 40);
    u.style.left = clamp(p.x, halfW + 6, Math.max(halfW + 6, stage.width - halfW - 6)) + 'px';
    u.style.top = clamp(p.y, minTop, stage.height - 40) + 'px';
  });
}

function startOverlayLoop() {
  stopOverlayLoop();
  const loop = () => { positionUnits(); positionOrbLabels(); G.overlayRAF = requestAnimationFrame(loop); };
  G.overlayRAF = requestAnimationFrame(loop);
}
function stopOverlayLoop() { if (G.overlayRAF) cancelAnimationFrame(G.overlayRAF); G.overlayRAF = null; }

// ---------------- 손패 ----------------
// ============================================================
//  카드 상세 설명 (길게 누르기)
// ============================================================
const CARD_FLAG_DESC = [
  ['exhaust', '소각', '사용하면 이번 전투 동안 덱에서 빠집니다.'],
  ['ethereal', '소멸', '턴이 끝날 때 손에 남아 있으면 소각됩니다.'],
  ['retain', '보존', '턴이 끝나도 버려지지 않고 손에 남습니다.'],
  ['innate', '내재', '전투 시작 시 항상 손에 들고 시작합니다.'],
];

/** 카드 한 장의 상세 설명 화면 */
function showCardDetail(card) {
  const d = card.def || {};
  // 아직 강화하지 않은 카드는 강화 후 설명도 함께 보여 준다
  let after = null;
  if (!card.upgraded && card.canUpgrade()) {
    try { after = mk(card.id, true); } catch (e) { after = null; }
  }

  openModal((box) => {
    box.append(modalTitle(card.name));
    box.appendChild(el('div', { class: 'cd-card' }, renderCardBig(card)));

    // 유형 · 희귀도 · 비용 · 대상
    const meta = [];
    meta.push(TYPE_KR[card.type] || card.type);
    if (RARITY_KR[card.rarity]) meta.push(RARITY_KR[card.rarity]);
    const cost = card.baseCost;
    meta.push(cost < 0 ? '비용 X' : `비용 ${cost}`);
    if (card.target === 'enemy') meta.push('적 1체 지정');
    else if (card.target === 'all') meta.push('적 전체');
    box.appendChild(el('div', { class: 'cd-meta', text: meta.join(' · ') }));

    // 카드 효과 (현재 / 강화 후)
    const eff = el('div', { class: 'cd-sec' });
    eff.appendChild(el('h4', { text: '효과' }));
    eff.appendChild(el('p', { class: 'cd-text', text: card.text() }));
    if (after) {
      eff.appendChild(el('p', { class: 'cd-text up' }, el('b', { text: '강화하면 → ' }), after.text()));
    }
    // 카드 자체의 성질
    const flags = CARD_FLAG_DESC.filter(([k]) => card[k] || d[k]);
    if (flags.length) {
      const ul = el('ul', { class: 'cd-flags' });
      flags.forEach(([, name, desc]) => ul.appendChild(el('li', {}, el('b', { text: name }), ' — ' + desc)));
      eff.appendChild(ul);
    }
    box.appendChild(eff);

    // 이 카드에 등장하는 용어
    const words = findKeywords(card.text() + ' ' + (after ? after.text() : ''));
    if (words.length) {
      const sec = el('div', { class: 'cd-sec' });
      sec.appendChild(el('h4', { text: '용어' }));
      const ul = el('ul', { class: 'cd-kw' });
      words.forEach((k) => ul.appendChild(el('li', {},
        el('b', { class: k.cls, text: k.name }), ' — ' + k.desc)));
      sec.appendChild(ul);
      box.appendChild(sec);
    }

    box.append(el('div', { class: 'modal-actions' },
      el('button', { class: 'btn', text: '닫기', onclick: () => { SFX.tap(); closeModal(); } })));
  });
}

// ---- 길게 누르기 : 카드가 보이는 모든 화면에서 동작 ----
let lpTimer = null, lpNode = null, lpX = 0, lpY = 0, lpFiredAt = 0;
function cancelLongPress() {
  if (lpTimer) clearTimeout(lpTimer);
  lpTimer = null;
  if (lpNode) lpNode.classList.remove('pressing');
  lpNode = null;
}
/** 방금 길게 누르기가 발동했으면 true (뒤따르는 탭 동작을 막는다) */
function consumedLongPress() {
  if (performance.now() - lpFiredAt < 700) { lpFiredAt = 0; return true; }
  return false;
}
function initCardInspect() {
  document.addEventListener('pointerdown', (e) => {
    const node = e.target.closest && e.target.closest('.card');
    if (!node || !node.__card || node.closest('.card-ghost')) return;
    cancelLongPress();
    lpNode = node; lpX = e.clientX; lpY = e.clientY;
    lpTimer = setTimeout(() => {
      const card = lpNode && lpNode.__card;
      cancelLongPress();
      if (!card) return;
      lpFiredAt = performance.now();
      SFX.cardPick();
      showCardDetail(card);
    }, 420);
    node.classList.add('pressing');
  }, true);
  document.addEventListener('pointermove', (e) => {
    if (!lpNode) return;
    if (Math.abs(e.clientX - lpX) > 12 || Math.abs(e.clientY - lpY) > 12) cancelLongPress();
  }, true);
  ['pointerup', 'pointercancel', 'scroll'].forEach((ev) =>
    document.addEventListener(ev, cancelLongPress, true));
}

/** 더미 버튼(뽑을/버린/소각)의 화면 중심 좌표 */
function pileAnchor(sel) {
  const el = $(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** 뽑은 카드가 "뽑을" 더미에서 작게 날아와 제자리에서 커진다 */
function flyCardIn(c, order) {
  const src = pileAnchor('#btn-draw');
  const handEl = $('#hand');
  if (!src || !handEl) return false;
  const hr = handEl.getBoundingClientRect();
  const cw = c.offsetWidth || 88, ch = c.offsetHeight || 126;
  // .card 는 bottom:0 기준, transform-origin 은 50% 130%
  const ox = hr.left + parseFloat(c.__finalLeft || c.style.left || 0) + cw / 2;
  const oy = hr.top + hr.height - ch + ch * 1.3;
  const dx = Math.round(src.x - ox), dy = Math.round(src.y - oy);
  const delay = order * 0.055;

  c.classList.add('flying');
  // 출발 상태를 쓴 직후 다른 이유로 다시 그려지면 이 상태가 덮여 애니메이션이 사라진다.
  // flyPending 동안에는 renderHand 가 style 을 건드리지 않고 목표값만 갱신한다.
  c.dataset.flyPending = '1';
  c.style.transition = 'none';
  c.style.transform = `translate(${dx}px, ${dy}px) scale(0.16) ${c.__finalT}`;
  c.style.opacity = '0.2';
  // 두 프레임 뒤에 최종 상태로 전환해야 시작 상태가 확실히 그려진다
  requestAnimationFrame(() => requestAnimationFrame(() => {
    delete c.dataset.flyPending;
    c.style.transition = `transform .42s cubic-bezier(.2,.86,.3,1) ${delay}s, opacity .18s linear ${delay}s`;
    c.style.left = c.__finalLeft;
    c.style.transform = c.__finalT;
    c.style.opacity = '1';
  }));
  setTimeout(() => {
    c.classList.remove('flying');
    c.style.transition = '';
    c.style.opacity = '';
  }, 480 + delay * 1000);
  return true;
}

/** 손에서 빠진 카드가 해당 더미로 작아지며 날아가 사라진다 */
function flyCardOut(rec, targetSel, order = 0) {
  const target = pileAnchor(targetSel);
  if (!target) return;
  const g = el('div', { class: 'card-ghost' });
  g.appendChild(rec.node);   // 손패에서 떼어 낸 실제 노드를 그대로 재사용
  g.style.width = rec.w + 'px';
  g.style.height = rec.h + 'px';
  g.style.left = (rec.cx - rec.w / 2) + 'px';
  g.style.top = (rec.cy - rec.h / 2) + 'px';
  document.body.appendChild(g);
  const delay = order * 0.05;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    g.style.transition = `transform .40s cubic-bezier(.4,.02,.7,1) ${delay}s, opacity .34s ease-in ${delay + 0.06}s`;
    g.style.transform = `translate(${Math.round(target.x - rec.cx)}px, ${Math.round(target.y - rec.cy)}px) rotate(${rec.spin}deg) scale(0.14)`;
    g.style.opacity = '0';
  }));
  setTimeout(() => g.remove(), 520 + delay * 1000);
}

function renderHand() {
  const B = G.battle;
  const handEl = $('#hand');

  // 1) 이전 손패와 비교해 새로 들어온 카드 / 빠져나간 카드를 가린다.
  //    레이아웃 측정(getBoundingClientRect)은 실제로 빠져나간 카드에만 한다.
  const before = new Set();
  const gone = [];
  const handUids = new Set(B.hand.map((c) => c.uid));
  $$('#hand .card').forEach((node) => {
    const uid = node.dataset.uid;
    if (!uid) return;
    before.add(uid);
    if (!handUids.has(uid)) gone.push(node);
  });
  const outRecs = gone.map((node) => {
    const r = node.getBoundingClientRect();
    return {
      node, w: node.offsetWidth, h: node.offsetHeight,
      cx: r.left + r.width / 2, cy: r.top + r.height / 2,
      spin: Math.round(Math.random() * 40 - 20),
    };
  });
  // 날아오는 중인 카드는 노드를 살려 둔다 (중간에 다시 그려도 끊기지 않게)
  const flying = new Map();
  $$('#hand .card.flying').forEach((node) => {
    if (node.dataset.uid) { flying.set(node.dataset.uid, node); handEl.removeChild(node); }
  });

  handEl.innerHTML = '';
  const n = B.hand.length;
  const w = handEl.clientWidth || innerWidth - 100;
  const cw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-w')) || 88;
  const preview = (card, key, base) => B.previewValue(card, key, base);
  const fresh = [];
  B.hand.forEach((card, i) => {
    const reused = flying.get(card.uid);
    const c = reused || renderCard(card, { preview });
    c.dataset.uid = card.uid;
    const t = n === 1 ? 0.5 : i / (n - 1);
    const spread = Math.min(w - cw - 42, Math.max(0, (n - 1) * cw * 0.86));
    const x = w / 2 + (t - 0.5) * spread - cw / 2;
    const ang = n === 1 ? 0 : (t - 0.5) * Math.min(13, n * 2.2);
    const y = -Math.cos((t - 0.5) * Math.PI) * Math.min(10, n * 1.6) + 8;
    const isSel = !!(G.selectedCard && G.selectedCard.uid === card.uid);
    const leftPx = (isSel ? (w / 2 - cw / 2) : x) + 'px';
    const tf = `translateY(${y}px) rotate(${ang}deg)`;
    // 비행 애니메이션이 참조할 최종 목표 (렌더가 여러 번 돌아도 최신값을 따라간다)
    c.__finalLeft = leftPx;
    c.__finalT = tf;
    c.style.zIndex = 10 + i;
    // 선택 취소 시 되돌아갈 원래 자리
    c.dataset.homeLeft = x + 'px';
    c.dataset.homeTransform = tf;
    c.classList.toggle('unplayable-now', !B.canPlay(card));
    c.classList.toggle('selected', isSel);
    if (c.dataset.flyPending !== '1') {
      c.style.left = leftPx;
      c.style.transform = tf;
    }
    if (!reused) attachCardEvents(c, card);
    handEl.appendChild(c);
    if (!reused && !before.has(card.uid)) fresh.push(c);
  });

  // 2) 새로 들어온 카드 → "뽑을" 더미에서 날아온다
  fresh.forEach((c, k) => {
    if (flyCardIn(c, k)) SFX.cardDraw(k);
  });

  // 3) 손에서 사라진 카드 → 어느 더미로 갔는지 찾아 날려 보낸다
  outRecs.forEach((rec, k) => {
    const uid = rec.node.dataset.uid;
    let sel = '#btn-discard';
    let sound = 'cardToss';
    // 소각음은 엔진(exhaustCard)에서 이미 내므로 여기서는 내지 않는다
    if (B.exhaustPile.some((c) => c.uid === uid)) { sel = '#btn-exhaust'; sound = null; }
    else if (B.drawPile.some((c) => c.uid === uid)) sel = '#btn-draw';
    flyCardOut(rec, sel, k);
    if (sound && SFX[sound]) SFX[sound](k);
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
  if (consumedLongPress()) return;
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
      el('div', { class: 'relic-big', html: potionHTML(d, 30) }),
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
  else renderTopbar('#map-top');
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
    row.innerHTML = `<div class="relic-big" style="border-color:#e8c34a">${goldHTML(26)}</div><span>골드 ${rw.amount}</span>`;
    row.addEventListener('click', () => { SFX.gold(); run.gainGold(rw.amount); take(); });

  } else if (rw.type === 'potion') {
    const d = POTIONS[rw.id];
    if (!d) return null;
    row.innerHTML = `<div class="relic-big" style="border-color:${d.color}">${potionHTML(d, 26)}</div><div><b style="color:#e8c34a">${d.name}</b><br><small style="color:#9a92a8">${d.desc(1)}</small></div>`;
    row.addEventListener('click', () => {
      if (!run.addPotion(rw.id)) { toast('물약 슬롯이 가득 찼습니다.'); return; }
      SFX.potion(); take();
    });

  } else if (rw.type === 'relic') {
    const d = RELICS[rw.id];
    if (!d) return null;
    row.innerHTML = `<div class="relic-big">${relicHTML(d, 28)}</div><div><b style="color:#e8c34a">${d.name}</b><br><small style="color:#9a92a8">${d.desc}</small></div>`;
    row.addEventListener('click', async () => { await gainRelic(rw.id); take(); });

  } else if (rw.type === 'card') {
    row.innerHTML = `<div class="relic-big" style="border-color:#8ad0ff">${cardHTML(30)}</div><span>카드 보상 (${rw.cards.length}장 중 택 1)</span>`;
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
      row.innerHTML = `<div class="relic-big" style="border-color:#b04aff">${relicHTML(d, 28)}</div><div><b style="color:#e8c34a">${d.name}</b><br><small style="color:#9a92a8">${d.desc}</small></div>`;
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
        row.innerHTML = `<div class="relic-big">${relicHTML(d, 28)}</div><div style="flex:1"><b style="color:#e8c34a">${d.name}</b>${it.saleRate ? ` <span class="sale-tag">${it.saleLabel}</span>` : ''}<br><small style="color:#9a92a8">${d.desc}</small></div><span class="price${run.gold < it.price ? ' cant' : ''}">${it.saleRate ? `<s>${it.oldPrice}G</s> ` : ''}${it.price}G</span>`;
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
        row.innerHTML = `<div class="relic-big" style="border-color:${d.color}">${potionHTML(d, 26)}</div><div style="flex:1"><b style="color:#e8c34a">${d.name}</b>${it.saleRate ? ` <span class="sale-tag">${it.saleLabel}</span>` : ''}<br><small style="color:#9a92a8">${d.desc(1)}</small></div><span class="price${run.gold < it.price ? ' cant' : ''}">${it.saleRate ? `<s>${it.oldPrice}G</s> ` : ''}${it.price}G</span>`;
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
      row.innerHTML = `<div class="relic-big">${relicHTML(d, 28)}</div><div><b style="color:#e8c34a">${d.name}</b> <small style="color:#7a7288">${RELIC_RARITY_KR[d.rarity]}</small><br><small style="color:#9a92a8">${d.desc}</small></div>`;
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
    if (!$('#scr-title').hidden) T3.resizeTitle();
  });
  addEventListener('visibilitychange', () => { if (document.hidden && G.run) saveRun(G.run); });
}

initTitle();
bind();
initCardInspect();
console.log('%ccnation STS 준비 완료', 'color:#e8c34a');
