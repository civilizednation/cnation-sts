// ============================================================
//  배경음악 — mp3 스트리밍 + 크로스페이드
//
//  <audio> 두 개를 번갈아 쓰고, 각각을 효과음과 같은 AudioContext 에
//  MediaElementSource 로 물려 GainNode 로 페이드한다.
//  (decodeAudioData 로 전곡을 메모리에 올리면 15곡이면 수백 MB 가 되어
//   모바일에서 위험하다. <audio> 는 스트리밍이라 메모리를 거의 안 쓴다.)
// ============================================================
import { getCtx, onAudioUnlock, onAudioPrefChange, isBgmEnabled, getBgmVolume } from './audio.js';

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
const deck = [];        // [{ el, gain, gen }] 두 장
let cur = -1;           // 지금 울리는 쪽 인덱스
let curKey = null;      // 지금 재생 중인 트랙 키 (같은 키면 다시 틀지 않는다)
let pending = null;     // 잠금이 풀리면 틀 것 { file, loop, fade }
let timer = null;
const lastOf = {};      // 풀별 직전 곡 (연속 반복 방지)
let hidden = false;

function vol() { return isBgmEnabled() ? getBgmVolume() : 0; }

/** <audio> 두 장을 만들어 AudioContext 에 물린다 */
function setup() {
  if (ready) return true;
  let ctx;
  try { ctx = getCtx(); } catch (e) { return false; }
  if (!ctx) return false;
  try {
    for (let i = 0; i < 2; i++) {
      const el = new Audio();
      el.preload = 'none';
      const gain = ctx.createGain();
      gain.gain.value = 0;
      ctx.createMediaElementSource(el).connect(gain);
      gain.connect(ctx.destination);
      deck.push({ el, gain, gen: 0 });
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
  }, Math.max(0, sec * 1000) + 80);
}

function startFile(file, loop, fadeIn) {
  const next = (cur + 1) % 2;
  const slot = deck[next];
  slot.gen++;
  slot.el.pause();
  slot.el.src = DIR + file;
  slot.el.loop = !!loop;
  slot.gain.gain.value = 0;
  const p = slot.el.play();
  if (p && p.catch) p.catch(() => { /* 자동재생 차단 — 다음 제스처에서 다시 시도한다 */ });
  fadeTo(slot, vol(), fadeIn);
  cur = next;
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
      fadeTo(deck[cur], vol(), 0.2);
      const el = deck[cur].el;
      if (!isBgmEnabled()) setTimeout(() => { if (!isBgmEnabled()) el.pause(); }, 260);
      else if (el.src && el.paused && !hidden) el.play().catch(() => {});
    });
    document.addEventListener('visibilitychange', () => {
      hidden = document.hidden;
      if (!ready || cur < 0) return;
      if (hidden) deck[cur].el.pause();
      else if (isBgmEnabled() && deck[cur].el.src) deck[cur].el.play().catch(() => {});
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
    const file = pick(POOLS[poolKey], poolKey);
    if (curKey === file) return;
    curKey = file;
    request(file, true, 'battle');
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
    if (!ready || cur < 0) return { key: curKey, playing: false, src: null, pending };
    const el = deck[cur].el;
    return { key: curKey, playing: !el.paused, src: el.getAttribute('src'), loop: el.loop,
      gain: +deck[cur].gain.gain.value.toFixed(3), pending,
      time: +el.currentTime.toFixed(2), dur: el.duration || 0,
      buffered: el.buffered.length ? +el.buffered.end(el.buffered.length - 1).toFixed(1) : 0 };
  },
};

window.BGM = BGM;   // 자동 테스트용
