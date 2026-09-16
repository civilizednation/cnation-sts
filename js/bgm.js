// ============================================================
//  배경음악 — mp3 스트리밍 + 크로스페이드
//
//  <audio> 두 개를 번갈아 쓰고, 각각을 효과음과 같은 AudioContext 에
//  MediaElementSource 로 물려 GainNode 로 페이드한다.
//  (decodeAudioData 로 전곡을 메모리에 올리면 15곡이면 수백 MB 가 되어
//   모바일에서 위험하다. <audio> 는 스트리밍이라 메모리를 거의 안 쓴다.)
// ============================================================
import { getCtx, onAudioUnlock, onAudioWake, onAudioPrefChange, isBgmEnabled, getBgmVolume, audioState, wakeAudio } from './audio.js';

const DIR = 'audio/';

/** 트랙 정의 : 키 → 파일 / 반복 여부 */
const TRACKS = {
  title:   { file: '01_main_theme.mp3',    loop: true },
  map:     { file: '02_spire_explore.mp3', loop: true },
  camp:    { file: '06_camp_event.mp3',    loop: true },
  shop:    { file: '07_merchant.mp3',      loop: true },
  boss1:   { file: '08_act1_boss.mp3',     loop: true },
  boss2:   { file: '09_act2_boss.mp3',     loop: true },
  boss3:   { file: '10_act3_boss.mp3',     loop: true },
  // 스팅어 — 반복하지 않고 한 번만 울린다
  fail:    { file: '11_fail.mp3',          loop: false },
  victory: { file: '12_victory.mp3',       loop: false },
};

/** 전투 곡 풀 — 직전에 쓴 곡을 빼고 고른다 */
const POOLS = {
  normal: ['03_normal_battle_a.mp3', '04_normal_battle_b.mp3', '03_normal_battle_c.mp3', '03_normal_battle_d.mp3'],
  elite:  ['05_elite_battle_a.mp3', '05_elite_battle_b.mp3'],
};

/**
 * 전환 방식 — out : 이전 곡 페이드아웃(초) / gap : 무음(초) / in : 새 곡 페이드인(초)
 * gap 이 0 이면 두 곡이 겹치는 크로스페이드가 된다.
 */
const FADE = {
  base:    { out: 1.5, gap: 0,   in: 1.5 },   // 지도 ↔ 모닥불 ↔ 상점, 전투 → 지도
  battle:  { out: 1.5, gap: 0.2, in: 0.8 },   // 지도 → 일반/엘리트 전투
  boss:    { out: 1.2, gap: 0.5, in: 1.5 },   // 지도 → 보스 (무음을 길게 둬 임팩트를 준다)
  fail:    { out: 0.8, gap: 0.3, in: 1.0 },   // 전투 → 게임 오버
  victory: { out: 1.5, gap: 0.6, in: 1.5 },   // 3막 보스 → 최종 승리
  first:   { out: 0,   gap: 0,   in: 1.0 },   // 무음에서 처음 시작
};

let ready = false;
// 슬롯 3장 : 재생 중 / 페이드아웃 중 / 미리 받는 중 이 동시에 있을 수 있다.
// 미리 받아 둔 슬롯을 그대로 재생에 쓰므로 프리페치가 헛되지 않는다.
const SLOTS = 3;
const deck = [];        // [{ el, gain, gen, file }]
let cur = -1;           // 지금 울리는 쪽 인덱스
let curKey = null;      // 지금 재생 중인 트랙 키 (같은 키면 다시 틀지 않는다)
let pending = null;     // 잠금이 풀리면 틀 것 { file, loop, fade }
let timer = null;
const lastOf = {};      // 풀별 직전 곡 (연속 반복 방지)
const reserved = {};    // 미리 정해 둔 다음 전투 곡 (프리페치한 것과 같은 곡을 쓴다)
const warmed = new Set();   // 이미 미리 받아 둔 파일
let warmIdx = -1;       // 지금 미리 받고 있는 슬롯
let hidden = false;

function vol() { return isBgmEnabled() ? getBgmVolume() : 0; }

/** <audio> 두 장을 만들어 AudioContext 에 물린다 */
function setup() {
  if (ready) return true;
  let ctx;
  try { ctx = getCtx(); } catch (e) { return false; }
  if (!ctx) return false;
  try {
    for (let i = 0; i < SLOTS; i++) {
      const el = new Audio();
      el.preload = 'none';
      const gain = ctx.createGain();
      gain.gain.value = 0;
      ctx.createMediaElementSource(el).connect(gain);
      gain.connect(ctx.destination);
      deck.push({ el, gain, gen: 0, file: null });
    }
  } catch (e) { deck.length = 0; return false; }
  ready = true;
  return true;
}

function fadeTo(slot, target, sec) {
  const g = slot.gain.gain;
  const now = getCtx().currentTime;
  g.cancelScheduledValues(now);
  g.setValueAtTime(g.value, now);
  if (sec <= 0) g.setValueAtTime(target, now);
  else g.linearRampToValueAtTime(target, now + sec);
}

/** 페이드아웃 후 정지. 그 사이 같은 슬롯이 재사용되면(gen 변화) 건드리지 않는다. */
function stopSlot(slot, sec) {
  if (!slot || !slot.el.src) return;
  fadeTo(slot, 0, sec);
  const gen = slot.gen;
  setTimeout(() => {
    if (slot.gen !== gen) return;
    slot.el.pause();
    slot.el.removeAttribute('src');
    slot.el.load();
    slot.file = null;
  }, Math.max(0, sec * 1000) + 80);
}

/**
 * 그 파일을 쓸 슬롯을 고른다.
 * 이미 그 파일을 물고 있는 슬롯(= 미리 받아 둔 슬롯)이 있으면 그대로 쓴다.
 * 없으면 재생 중이 아닌 슬롯 중 프리페치 중이 아닌 것부터 고른다.
 */
function slotFor(file) {
  for (let i = 0; i < SLOTS; i++) if (i !== cur && deck[i].file === file) return i;
  for (let i = 0; i < SLOTS; i++) if (i !== cur && i !== warmIdx) return i;
  for (let i = 0; i < SLOTS; i++) if (i !== cur) return i;
  return (cur + 1) % SLOTS;
}

function startFile(file, loop, fadeIn) {
  const idx = slotFor(file);
  const slot = deck[idx];
  slot.gen++;
  if (slot.file === file && slot.el.src) {
    // 미리 받아 둔 슬롯 — 새로 요청하지 않고 버퍼를 그대로 쓴다
    try { slot.el.currentTime = 0; } catch (e) { /* 아직 메타데이터 전 */ }
  } else {
    slot.el.pause();
    slot.el.src = DIR + file;
    slot.file = file;
  }
  slot.el.preload = 'auto';
  slot.el.loop = !!loop;
  slot.gain.gain.value = 0;
  const p = slot.el.play();
  if (p && p.catch) p.catch(() => { /* 자동재생 차단 — 다음 제스처에서 다시 시도한다 */ });
  fadeTo(slot, vol(), fadeIn);
  if (idx === warmIdx) warmIdx = -1;
  cur = idx;
}

/** 실제 전환 */
function swap(file, loop, fadeName) {
  const f = FADE[fadeName] || FADE.base;
  if (timer) { clearTimeout(timer); timer = null; }
  if (cur >= 0) stopSlot(deck[cur], f.out);
  if (f.gap <= 0) startFile(file, loop, f.in);   // 크로스페이드 : 바로 겹쳐 시작
  else timer = setTimeout(() => { timer = null; startFile(file, loop, f.in); }, (f.out + f.gap) * 1000);
}

/** 지금 틀 수 있으면 틀고, 아니면 잠금이 풀릴 때까지 보류한다 */
function request(file, loop, fadeName) {
  if (!setup() || getCtx().state !== 'running' || hidden) {
    pending = { file, loop, fade: fadeName };
    return;
  }
  pending = null;
  swap(file, loop, cur < 0 ? 'first' : fadeName);
}

/** 직전에 쓴 곡을 빼고 무작위로 고른다 */
function pick(pool, poolKey) {
  const last = lastOf[poolKey];
  const cand = pool.length > 1 ? pool.filter((f) => f !== last) : pool;
  const f = cand[Math.floor(Math.random() * cand.length)] || pool[0];
  lastOf[poolKey] = f;
  return f;
}

/**
 * 다음에 쓸 곡을 미리 받아 둔다.
 * 재생하지 않는 <audio> 에 물려 두면 브라우저가 알아서 버퍼를 채우고,
 * 실제로 틀 때는 HTTP 캐시에서 바로 나와 버퍼링 없이 시작한다.
 * (audio/ 는 immutable 캐시 헤더라 재요청이 캐시에 적중한다)
 */
function warm(file) {
  if (!file || !isBgmEnabled() || hidden) return;
  if (!setup()) return;
  for (let i = 0; i < SLOTS; i++) if (deck[i].file === file) return;   // 이미 물고 있다
  const idx = slotFor(file);
  if (idx === cur) return;
  const slot = deck[idx];
  slot.gen++;
  slot.el.pause();
  slot.gain.gain.value = 0;
  slot.el.preload = 'auto';
  slot.el.src = DIR + file;
  slot.file = file;
  slot.el.load();
  warmIdx = idx;
  warmed.add(file);
}

export const BGM = {
  /** 게임 시작 시 한 번. 잠금 해제 · 설정 변화 · 화면 이탈을 구독한다. */
  init() {
    onAudioUnlock(() => {
      if (!setup() || hidden) return;
      if (pending) { const p = pending; pending = null; swap(p.file, p.loop, cur < 0 ? 'first' : p.fade); }
      else if (cur >= 0 && deck[cur].el.src && deck[cur].el.paused && isBgmEnabled()) deck[cur].el.play().catch(() => {});
    });
    onAudioPrefChange(() => {
      if (!ready || cur < 0) return;
      if (audioState() === 'suspended') wakeAudio();
      fadeTo(deck[cur], vol(), 0.2);
      const el = deck[cur].el;
      if (!isBgmEnabled()) setTimeout(() => { if (!isBgmEnabled()) el.pause(); }, 260);
      else if (el.src && el.paused && !hidden) el.play().catch(() => {});
    });
    // 앱 전환 : 나갈 때는 멈추고, 돌아올 때는 컨텍스트가 깨어난 뒤(onAudioWake) 다시 튼다
    document.addEventListener('visibilitychange', () => {
      hidden = document.hidden;
      if (hidden && ready && cur >= 0) deck[cur].el.pause();
    });
    onAudioWake(() => {
      hidden = document.hidden;   // audio.js 쪽 리스너가 먼저 도는 경우가 있어 직접 읽는다
      if (!ready || cur < 0 || hidden) return;
      const el = deck[cur].el;
      // suspend 중에 예약해 둔 게인 램프가 날아갔을 수 있으므로 다시 맞춘다
      fadeTo(deck[cur], vol(), 0.2);
      if (isBgmEnabled() && el.src && el.paused) el.play().catch(() => {});
    });
  },

  /**
   * 트랙을 튼다. 이미 같은 트랙이 흐르고 있으면 아무것도 하지 않는다.
   * (모닥불을 닫고 지도로 나와도 지도 음악이 처음부터 다시 시작하지 않는다)
   */
  play(key, fadeName) {
    const t = TRACKS[key];
    if (!t || curKey === key) return;
    const prof = fadeName || 'base';
    curKey = key;
    request(t.file, t.loop, prof);
  },

  /** 전투 음악 — 종류(normal/elite/boss)와 막에 따라 고른다 */
  playBattle(kind, act) {
    if (kind === 'boss') { BGM.play('boss' + Math.min(3, Math.max(1, act || 1)), 'boss'); return; }
    const poolKey = kind === 'elite' ? 'elite' : 'normal';
    // 지도에서 미리 받아 둔 곡이 있으면 그걸 쓴다 (없으면 지금 고른다)
    const file = reserved[poolKey] || pick(POOLS[poolKey], poolKey);
    reserved[poolKey] = null;
    if (curKey === file) return;
    curKey = file;
    request(file, true, 'battle');
  },

  /** 곧 쓸 트랙을 미리 받아 둔다 */
  prefetch(key) {
    const t = TRACKS[key];
    if (t) warm(t.file);
  },

  /**
   * 다음 전투 곡을 지금 정해 두고 미리 받는다.
   * 정해 둔 곡은 실제 전투가 시작될 때 그대로 쓰인다.
   */
  prefetchBattle(kind = 'normal') {
    const poolKey = kind === 'elite' ? 'elite' : 'normal';
    if (!reserved[poolKey]) reserved[poolKey] = pick(POOLS[poolKey], poolKey);
    warm(reserved[poolKey]);
  },

  /** 완전히 멈춘다 */
  stop(sec = 1.0) {
    curKey = null; pending = null;
    if (timer) { clearTimeout(timer); timer = null; }
    if (ready && cur >= 0) stopSlot(deck[cur], sec);
  },

  /** 자동 테스트용 */
  current() { return curKey; },
  state() {
    if (!ready || cur < 0) return { key: curKey, playing: false, src: null, pending, warmed: [...warmed], reserved: { ...reserved }, ctx: audioState() };
    const el = deck[cur].el;
    return { key: curKey, playing: !el.paused, src: el.getAttribute('src'), loop: el.loop,
      gain: +deck[cur].gain.gain.value.toFixed(3), pending,
      time: +el.currentTime.toFixed(2), dur: el.duration || 0,
      buffered: el.buffered.length ? +el.buffered.end(el.buffered.length - 1).toFixed(1) : 0,
      warmed: [...warmed], reserved: { ...reserved }, ctx: audioState() };
  },
};

window.BGM = BGM;   // 자동 테스트용
