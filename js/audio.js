// ============================================================
//  내장 효과음 : 외부 파일 없이 WebAudio 로 합성
// ============================================================

let ctx = null;
let master = null;
let enabled = true;
let musicNodes = null;

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
  }
  return ctx;
}

/** 모바일 브라우저는 사용자 제스처 이후에만 오디오 허용 */
export function unlockAudio() {
  const c = ac();
  if (c.state === 'suspended') c.resume();
}

export function setSfxEnabled(v) { enabled = v; }
export function isSfxEnabled() { return enabled; }
export function setVolume(v) { ac(); master.gain.value = v; }

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
  if (!enabled) return;
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
  if (!enabled) return;
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
  cardDraw(i = 0) { hit({ dur: 0.09, vol: 0.16, freq: 2600 + i * 130, q: 0.8, sweep: 900, delay: i * 0.05 }); },
  /** 카드 선택 */
  cardPick() { tone({ freq: 880, type: 'triangle', dur: 0.07, vol: 0.2, slide: 1180 }); },
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
  /** 카드 업그레이드 */
  upgrade() {
    [660, 990, 1320, 1760].forEach((f, i) => tone({ freq: f, type: 'sine', dur: 0.5, vol: 0.2, delay: i * 0.06 }));
  },
};

/** 아주 단순한 배경 앰비언스 (저음 드론 + 느린 박동) */
export function startAmbience() {
  if (musicNodes || !enabled) return;
  const c = ac(); const t = c.currentTime;
  const g = c.createGain(); g.gain.value = 0.0; g.connect(master);
  g.gain.linearRampToValueAtTime(0.05, t + 3);
  const o1 = c.createOscillator(); o1.type = 'sine'; o1.frequency.value = 55;
  const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = 82.5; o2.detune.value = 6;
  const lfo = c.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.08;
  const lfoG = c.createGain(); lfoG.gain.value = 0.025;
  lfo.connect(lfoG); lfoG.connect(g.gain);
  o1.connect(g); o2.connect(g);
  o1.start(t); o2.start(t); lfo.start(t);
  musicNodes = { g, o1, o2, lfo };
}

export function stopAmbience() {
  if (!musicNodes) return;
  const { g, o1, o2, lfo } = musicNodes;
  const t = ac().currentTime;
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(g.gain.value, t);
  g.gain.linearRampToValueAtTime(0, t + 1);
  [o1, o2, lfo].forEach((o) => o.stop(t + 1.1));
  musicNodes = null;
}
