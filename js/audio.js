// ============================================================
//  내장 효과음 : 외부 파일 없이 WebAudio 로 합성
// ============================================================

// ---- 설정 (효과음 · 배경음 공용, localStorage 에 보관) ----
const PREF_KEY = 'cnation_sts_audio_v1';
const DEFAULTS = { sfx: true, sfxVol: 0.50, bgm: true, bgmVol: 0.50 };
let pref = { ...DEFAULTS };
try {
  const raw = localStorage.getItem(PREF_KEY);
  if (raw) pref = { ...DEFAULTS, ...JSON.parse(raw) };
} catch (e) { /* 저장소를 못 쓰면 기본값 */ }
function savePref() {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(pref)); } catch (e) { /* noop */ }
}
/** 배경음 모듈이 설정 변화를 받아 가는 구독 창구 */
const prefListeners = [];
export function onAudioPrefChange(fn) { prefListeners.push(fn); }
function notifyPref() { prefListeners.forEach((f) => { try { f(pref); } catch (e) { /* noop */ } }); }

let ctx = null;
let master = null;

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = pref.sfxVol;
    master.connect(ctx.destination);
  }
  return ctx;
}
/** 배경음 모듈이 같은 AudioContext 를 쓰도록 공유한다 */
export function getCtx() { return ac(); }
export function isAudioRunning() { return !!ctx && ctx.state === 'running'; }

/** 모바일 브라우저는 사용자 제스처 이후에만 오디오 허용 */
export function unlockAudio() {
  const c = ac();
  if (c.state === 'suspended') c.resume();
  unlockListeners.forEach((f) => { try { f(); } catch (e) { /* noop */ } });
  notifyWake();
}
const unlockListeners = [];
/** 처음 잠금이 풀렸을 때 배경음을 시작하기 위한 구독 창구 */
export function onAudioUnlock(fn) { unlockListeners.push(fn); }

// ---- 앱 전환 복귀 처리 ----------------------------------------------------
// iOS/Android 는 다른 앱으로 나가면 AudioContext 를 suspend 시킨다.
// 돌아왔을 때 resume 하지 않으면 효과음과 배경음이 전부 무음이 된다
// (둘 다 같은 컨텍스트를 쓰기 때문). 설정을 껐다 켜도 살아나지 않는다.
const wakeListeners = [];
/** 컨텍스트가 다시 살아났을 때 알림을 받는 창구 */
export function onAudioWake(fn) { wakeListeners.push(fn); }
function notifyWake() { wakeListeners.forEach((f) => { try { f(); } catch (e) { /* noop */ } }); }

let gestureArmed = false;
/** 다음 화면 터치에서 다시 깨우도록 예약 (resume 이 제스처를 요구하는 경우) */
function armGesture() {
  if (gestureArmed) return;
  gestureArmed = true;
  const h = () => {
    document.removeEventListener('pointerdown', h, true);
    gestureArmed = false;
    wakeAudio();
  };
  document.addEventListener('pointerdown', h, true);
}

/** 잠든 AudioContext 를 깨운다. 실패하면 다음 터치에서 다시 시도한다. */
export function wakeAudio() {
  if (!ctx) return;
  if (ctx.state === 'running') { notifyWake(); return; }
  let p;
  try { p = ctx.resume(); } catch (e) { armGesture(); return; }
  if (p && p.then) {
    p.then(() => { if (ctx.state === 'running') notifyWake(); else armGesture(); })
     .catch(() => armGesture());
  } else if (ctx.state === 'running') notifyWake();
  else armGesture();
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wakeAudio(); });
  addEventListener('pageshow', () => wakeAudio());
  addEventListener('focus', () => wakeAudio());
}

/** 진단용 */
export function audioState() { return ctx ? ctx.state : 'none'; }
if (typeof window !== 'undefined') window.__ctxSuspend = () => (ctx ? ctx.suspend() : Promise.resolve());   // 자동 테스트용

export function setSfxEnabled(v) { pref.sfx = !!v; savePref(); notifyPref(); }
export function isSfxEnabled() { return pref.sfx; }
export function setSfxVolume(v) { pref.sfxVol = clamp01(v); ac(); master.gain.value = pref.sfxVol; savePref(); notifyPref(); }
export function getSfxVolume() { return pref.sfxVol; }

export function setBgmEnabled(v) { pref.bgm = !!v; savePref(); notifyPref(); }
export function isBgmEnabled() { return pref.bgm; }
export function setBgmVolume(v) { pref.bgmVol = clamp01(v); savePref(); notifyPref(); }
export function getBgmVolume() { return pref.bgmVol; }

function clamp01(v) { return Math.max(0, Math.min(1, Number(v) || 0)); }

/** 예전 이름 (효과음 음량) */
export function setVolume(v) { setSfxVolume(v); }

/** 화이트 노이즈 버퍼(캐시) */
let noiseBuf = null;
function noise() {
  const c = ac();
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 1.2, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  return s;
}

function env(gain, t0, a, d, peak = 1) {
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t0 + a);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
}

/** 기본 톤 */
function tone({ freq = 440, type = 'sine', dur = 0.2, attack = 0.005, vol = 0.3, slide = null, delay = 0, detune = 0 }) {
  if (!pref.sfx) return;
  const c = ac(); const t0 = c.currentTime + delay;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0); o.detune.value = detune;
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
  env(g, t0, attack, dur, vol);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

/** 노이즈 기반 타격음 */
function hit({ dur = 0.18, vol = 0.4, freq = 1200, q = 1, type = 'bandpass', delay = 0, sweep = null }) {
  if (!pref.sfx) return;
  const c = ac(); const t0 = c.currentTime + delay;
  const s = noise(); const f = c.createBiquadFilter(); const g = c.createGain();
  f.type = type; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
  if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(60, sweep), t0 + dur);
  env(g, t0, 0.004, dur, vol);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(t0); s.stop(t0 + dur + 0.05);
}

export const SFX = {
  /** UI 탭 */
  tap() { tone({ freq: 660, type: 'triangle', dur: 0.06, vol: 0.18 }); },
  /** 카드 집기 */
  cardDraw(i = 0) {
    const d = i * 0.1;
    hit({ dur: 0.2, vol: 0.12, freq: 700, q: 0.7, sweep: 2800, delay: d });          // 날아오는 바람
    hit({ dur: 0.06, vol: 0.15, freq: 3000 + i * 120, q: 1.3, sweep: 1200, delay: d + 0.5 }); // 손에 닿는 순간
  },
  /** 카드 선택 */
  cardPick() { tone({ freq: 880, type: 'triangle', dur: 0.07, vol: 0.2, slide: 1180 }); },
  /** 카드를 버린 더미로 던짐 — 아래로 떨어지는 바람 소리 */
  cardToss(i = 0) {
    hit({ dur: 0.16, vol: 0.16, freq: 1900 - i * 90, q: 0.7, sweep: 320, delay: i * 0.05 });
    tone({ freq: 420, type: 'triangle', dur: 0.1, vol: 0.09, slide: 170, delay: i * 0.05 + 0.02 });
  },
  /** 카드 사용 */
  cardPlay() { hit({ dur: 0.12, vol: 0.22, freq: 1800, sweep: 600 }); },
  /** 베기 */
  slash() {
    hit({ dur: 0.16, vol: 0.5, freq: 3200, q: 0.6, sweep: 420 });
    tone({ freq: 180, type: 'sawtooth', dur: 0.12, vol: 0.22, slide: 60, delay: 0.02 });
  },
  /** 둔기 */
  bash() {
    hit({ dur: 0.26, vol: 0.55, freq: 260, q: 1.2, type: 'lowpass', sweep: 70 });
    tone({ freq: 90, type: 'square', dur: 0.2, vol: 0.3, slide: 40 });
  },
  /** 방어 획득 */
  block() {
    tone({ freq: 320, type: 'square', dur: 0.14, vol: 0.2, slide: 520 });
    hit({ dur: 0.1, vol: 0.2, freq: 900, q: 2 });
  },
  /** 방어막이 깨짐 */
  blockBreak() { hit({ dur: 0.22, vol: 0.4, freq: 700, q: 3, sweep: 180 }); },
  /** 피격(플레이어) */
  hurt() {
    tone({ freq: 220, type: 'sawtooth', dur: 0.22, vol: 0.35, slide: 70 });
    hit({ dur: 0.2, vol: 0.3, freq: 500, type: 'lowpass', sweep: 120 });
  },
  /** 강화 버프 */
  buff() {
    [523, 659, 784].forEach((f, i) => tone({ freq: f, type: 'sine', dur: 0.28, vol: 0.22, delay: i * 0.06 }));
  },
  /** 디버프 */
  debuff() {
    [520, 400, 300].forEach((f, i) => tone({ freq: f, type: 'sawtooth', dur: 0.22, vol: 0.16, delay: i * 0.06, slide: f * 0.7 }));
  },
  /** 회복 */
  heal() {
    [660, 880, 1320].forEach((f, i) => tone({ freq: f, type: 'sine', dur: 0.45, vol: 0.2, delay: i * 0.07 }));
  },
  /** 독 */
  poison() { tone({ freq: 140, type: 'sawtooth', dur: 0.3, vol: 0.2, slide: 90 }); hit({ dur: 0.3, vol: 0.15, freq: 380, sweep: 140 }); },
  /** 화염 */
  fire() { hit({ dur: 0.45, vol: 0.4, freq: 900, q: 0.4, sweep: 180 }); tone({ freq: 120, type: 'sawtooth', dur: 0.3, vol: 0.2, slide: 50 }); },
  /** 적 처치 */
  enemyDie() {
    tone({ freq: 300, type: 'square', dur: 0.5, vol: 0.3, slide: 55 });
    hit({ dur: 0.55, vol: 0.35, freq: 800, sweep: 90, delay: 0.04 });
  },
  /** 소각 */
  exhaust() { hit({ dur: 0.34, vol: 0.25, freq: 1400, sweep: 260 }); },
  /** 에너지 */
  energy() { tone({ freq: 1046, type: 'triangle', dur: 0.14, vol: 0.2, slide: 1568 }); },
  /** 유물 획득 */
  relic() {
    [784, 988, 1174, 1568].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.4, vol: 0.22, delay: i * 0.08 }));
  },
  /** 골드 */
  gold() {
    [1400, 1900, 2400].forEach((f, i) => tone({ freq: f, type: 'square', dur: 0.12, vol: 0.12, delay: i * 0.045 }));
  },
  /** 물약 */
  potion() { tone({ freq: 500, type: 'sine', dur: 0.3, vol: 0.25, slide: 1400 }); },
  /** 전투 시작 */
  battleStart() {
    tone({ freq: 110, type: 'sawtooth', dur: 0.9, vol: 0.3, slide: 220 });
    hit({ dur: 0.7, vol: 0.3, freq: 300, q: 0.5, sweep: 1200 });
  },
  /** 전투 승리 */
  victory() {
    [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.6, vol: 0.25, delay: i * 0.11 }));
  },
  /** 보스 등장 */
  boss() {
    tone({ freq: 70, type: 'sawtooth', dur: 1.6, vol: 0.4, slide: 45 });
    tone({ freq: 105, type: 'square', dur: 1.4, vol: 0.2, slide: 66, delay: 0.1 });
    hit({ dur: 1.2, vol: 0.3, freq: 200, q: 0.4, sweep: 60 });
  },
  /** 게임 오버 */
  defeat() {
    [440, 392, 330, 262].forEach((f, i) => tone({ freq: f, type: 'sine', dur: 0.8, vol: 0.28, delay: i * 0.22 }));
    tone({ freq: 65, type: 'sawtooth', dur: 2.2, vol: 0.25, delay: 0.5 });
  },
  /** 모닥불 */
  campfire() { hit({ dur: 1.1, vol: 0.16, freq: 700, q: 0.3, sweep: 200 }); },
  /** 번개 구체 발사 */
  thunder() {
    hit({ dur: 0.1, vol: 0.5, freq: 4200, q: 0.5, sweep: 1600 });
    tone({ freq: 1400, type: 'sawtooth', dur: 0.14, vol: 0.28, slide: 220, delay: 0.02 });
    hit({ dur: 0.55, vol: 0.45, freq: 260, q: 0.4, type: 'lowpass', sweep: 60, delay: 0.06 });
    tone({ freq: 70, type: 'square', dur: 0.4, vol: 0.22, slide: 38, delay: 0.08 });
  },
  /** 냉기 구체 */
  ice() {
    [1800, 2400, 3100].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.22, vol: 0.16, delay: i * 0.04, slide: f * 1.3 }));
    hit({ dur: 0.35, vol: 0.2, freq: 5200, q: 1.4, sweep: 1800 });
  },
  /** 암흑 구체 */
  darkBlast() {
    tone({ freq: 220, type: 'sawtooth', dur: 0.5, vol: 0.3, slide: 45 });
    hit({ dur: 0.5, vol: 0.32, freq: 700, q: 0.6, sweep: 90 });
  },
  /** 플라즈마 구체 */
  plasmaPop() {
    tone({ freq: 640, type: 'square', dur: 0.14, vol: 0.22, slide: 1900 });
    tone({ freq: 1300, type: 'triangle', dur: 0.24, vol: 0.18, slide: 2600, delay: 0.05 });
  },
  /** 구체 충전 */
  orbCharge() {
    tone({ freq: 420, type: 'sine', dur: 0.26, vol: 0.2, slide: 1250 });
    hit({ dur: 0.2, vol: 0.14, freq: 2600, q: 1.6, sweep: 5200 });
  },
  /** 카드 업그레이드 */
  upgrade() {
    [660, 990, 1320, 1760].forEach((f, i) => tone({ freq: f, type: 'sine', dur: 0.5, vol: 0.2, delay: i * 0.06 }));
  },
};
