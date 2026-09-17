// ============================================================
//  계정 — 게스트 / 구글 로그인
//
//  ▸ 게스트 : 신원이 없다. 진행 중인 런만 이 기기에 저장하고 전적은 남기지 않는다.
//    남길 수가 없어서다 — 브라우저가 저장소를 비우면 "이 사람이 누구였는지" 알 방법이
//    없다. (v1.3.2 의 익명 인증 백업이 바로 그 이유로 실패했다.)
//
//  ▸ 구글 로그인 : uid 가 신원이 된다. 전적은 Firestore 에 uid 로 저장한다.
//    브라우저가 저장소를 비워도 다시 로그인하면 같은 uid 라 기록이 그대로 돌아온다.
//    이게 익명 인증과 결정적으로 다른 점이다 — 신원이 기기 밖(구글 계정)에 있다.
//
//  ▸ 로그인 SDK 는 "구글로 로그인" 을 누르는 순간에만 import() 한다.
//    게스트로 노는 사람은 한 바이트도 받지 않는다.
//
//  ▸ 통신이 안 되면 전적만 못 쌓일 뿐, 게임은 평소대로 돌아간다.
//    여기서 난 예외가 밖으로 새어 게임을 막는 일이 없어야 한다.
// ============================================================
import { VERSION } from './version.js';

const CFG = {
  apiKey: 'AIzaSyCTwOAC_LrrKH8CKepUOTf0pyd9qRv4y_8',
  authDomain: 'cnation-project.firebaseapp.com',
  projectId: 'cnation-project',
};

const MODE_KEY = 'cnation_sts_mode_v1';      // { mode, uid, name, photo }
const CACHE_KEY = (uid) => `cnation_sts_runs_${uid}`;
export const GUEST_SAVE_KEY = 'cnation_sts_save_guest';
export const saveKeyOf = (uid) => (uid ? `cnation_sts_save_${uid}` : GUEST_SAVE_KEY);

const MAX_RECORDS = 500;
const NET_TIMEOUT = 15000;
const PUSH_DELAY = 3000;

const docUrl = (uid) =>
  `https://firestore.googleapis.com/v1/projects/${CFG.projectId}/databases/(default)/documents/users/${uid}`;

// ---------------------------------------------------------------
//  상태
// ---------------------------------------------------------------
const S = {
  mode: 'none',        // 'none' 아직 고르지 않음 | 'guest' | 'google'
  uid: null,
  name: null,
  photo: null,
  /** 'idle' | 'working' | 'ok' | 'error' */
  sync: 'idle',
  syncError: null,
  lastSyncAt: 0,
};
let auth = null;          // Firebase Auth 인스턴스 (로그인을 시도한 뒤에만 생긴다)
let idToken = null;
let pushTimer = null;
let pushing = false;
let dirty = false;

const listeners = [];
export function onAccountChange(fn) { listeners.push(fn); }
function emit() { listeners.forEach((f) => { try { f(state()); } catch (e) { /* noop */ } }); }
export function state() { return { ...S }; }
export const isGuest = () => S.mode === 'guest';
export const isSignedIn = () => S.mode === 'google' && !!S.uid;

// ---------------------------------------------------------------
//  저수준
// ---------------------------------------------------------------
function read(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
  catch (e) { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch (e) { console.warn('저장 실패', key, e); return false; }
}

function saveMode() {
  write(MODE_KEY, { mode: S.mode, uid: S.uid, name: S.name, photo: S.photo });
}

/** 응답이 없어도 영원히 매달리지 않도록 시간 제한을 건다 */
async function req(url, opts = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), NET_TIMEOUT);
  try {
    const r = await fetch(url, { ...opts, signal: ac.signal });
    const text = await r.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch (e) { body = null; }
    if (!r.ok) {
      const err = new Error((body && body.error && body.error.message) || `HTTP ${r.status}`);
      err.status = r.status;
      throw err;
    }
    return body;
  } finally { clearTimeout(t); }
}

function setSync(sync, error = null) { S.sync = sync; S.syncError = error; emit(); }

// ---------------------------------------------------------------
//  로그인
// ---------------------------------------------------------------
let sdkPromise = null;
/** SDK 는 로그인이 필요해진 순간에만 불러온다 (게스트는 받지 않는다) */
function loadSdk() {
  if (!sdkPromise) sdkPromise = import('../vendor/firebase-auth.js');
  return sdkPromise;
}

async function ensureAuth() {
  if (auth) return auth;
  const m = await loadSdk();
  const app = m.initializeApp(CFG);
  auth = m.getAuth(app);
  auth.useDeviceLanguage?.();
  return auth;
}

/**
 * 게스트로 하던 진행 중인 런을 로그인한 계정으로 옮긴다.
 * 옮기지 않으면 저장 키가 uid 쪽으로 바뀌면서 하던 게임이 사라진 것처럼 보인다.
 * 그 계정에 이미 진행 중인 런이 있으면 건드리지 않는다 (그쪽이 더 최근일 수 있다).
 */
function adoptGuestSave(uid) {
  try {
    const guest = localStorage.getItem(GUEST_SAVE_KEY);
    if (!guest) return false;
    if (localStorage.getItem(saveKeyOf(uid))) return false;
    localStorage.setItem(saveKeyOf(uid), guest);
    localStorage.removeItem(GUEST_SAVE_KEY);
    return true;
  } catch (e) { return false; }
}

function applyUser(u) {
  adoptGuestSave(u.uid);
  S.mode = 'google';
  S.uid = u.uid;
  S.name = u.displayName || '플레이어';
  S.photo = u.photoURL || null;
  saveMode();
  emit();
}

/**
 * 구글 계정으로 로그인한다.
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
export async function signIn() {
  try {
    const m = await loadSdk();
    const a = await ensureAuth();
    const provider = new m.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const res = await m.signInWithPopup(a, provider);
    idToken = await res.user.getIdToken();
    applyUser(res.user);
    return { ok: true };
  } catch (e) {
    const code = e && (e.code || e.message) ? String(e.code || e.message) : 'unknown';
    // 사용자가 팝업을 그냥 닫은 건 오류가 아니다
    if (/popup-closed-by-user|cancelled-popup-request|user-cancelled/.test(code)) {
      return { ok: false, reason: 'cancelled' };
    }
    console.warn('구글 로그인 실패', e);
    if (/configuration-not-found|operation-not-allowed/.test(code)) {
      return { ok: false, reason: 'not-enabled' };
    }
    if (/popup-blocked/.test(code)) return { ok: false, reason: 'popup-blocked' };
    if (/unauthorized-domain/.test(code)) return { ok: false, reason: 'unauthorized-domain' };
    if (/network/.test(code)) return { ok: false, reason: 'network' };
    return { ok: false, reason: code };
  }
}

export async function signOutNow() {
  try { if (auth) { const m = await loadSdk(); await m.signOut(auth); } }
  catch (e) { /* 실패해도 로컬 상태는 내린다 */ }
  idToken = null;
  S.mode = 'guest'; S.uid = null; S.name = null; S.photo = null;
  S.sync = 'idle'; S.syncError = null;
  saveMode();
  emit();
}

export function chooseGuest() {
  S.mode = 'guest'; S.uid = null; S.name = null; S.photo = null;
  saveMode();
  emit();
}

/** 토큰은 한 시간이면 만료된다 — 쓸 때마다 SDK 에게 새로 받는다 */
async function token() {
  if (!auth || !auth.currentUser) throw new Error('로그인 상태가 아닙니다');
  idToken = await auth.currentUser.getIdToken();
  return idToken;
}

// ---------------------------------------------------------------
//  전적 — 로그인했을 때만 쌓인다
//
//  Firestore 가 정답이고 localStorage 는 화면을 바로 그리기 위한 사본이다.
//  통계는 저장하지 않고 읽을 때 계산한다 (어긋날 일이 없다).
// ---------------------------------------------------------------
function cached(uid) {
  const a = read(CACHE_KEY(uid), []);
  return Array.isArray(a) ? a : [];
}

async function pull(uid) {
  const doc = await req(docUrl(uid), { headers: { Authorization: `Bearer ${await token()}` } })
    .catch((e) => { if (e.status === 404) return null; throw e; });
  const raw = doc && doc.fields && doc.fields.runs ? doc.fields.runs.stringValue : null;
  if (!raw) return [];
  const a = JSON.parse(raw);
  return Array.isArray(a) ? a : [];
}

async function push(uid, rows) {
  await req(docUrl(uid), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` },
    body: JSON.stringify({
      fields: {
        runs: { stringValue: JSON.stringify(rows) },
        name: { stringValue: S.name || '' },
        at: { integerValue: String(Date.now()) },
        ver: { stringValue: VERSION },
      },
    }),
  });
}

async function flush() {
  if (pushing || !dirty || !isSignedIn()) return;
  pushing = true; dirty = false;
  setSync('working');
  try {
    await push(S.uid, cached(S.uid));
    S.lastSyncAt = Date.now();
    setSync('ok');
  } catch (e) {
    dirty = true;                      // 다음 기회에 다시 올린다
    setSync('error', e.message || String(e));
    console.warn('전적 올리기 실패 (게임에는 영향 없음)', e);
  } finally { pushing = false; }
}

function markDirty() {
  if (!isSignedIn()) return;
  dirty = true;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(flush, PUSH_DELAY);
}

export const Records = {
  /** 화면에 그릴 목록 (로컬 사본) */
  list() { return isSignedIn() ? cached(S.uid) : []; },

  /**
   * 한 판이 끝났다. 게스트면 아무것도 하지 않는다.
   * 로컬 사본에 먼저 넣고 Firestore 에는 잠잠해지면 올린다.
   */
  add(rec) {
    if (!isSignedIn()) return null;
    const a = cached(S.uid);
    const row = {
      id: 'r' + Date.now().toString(36),
      char: rec.char, charName: rec.charName,
      result: rec.result,                      // 'victory' | 'death' | 'abandon'
      floor: rec.floor | 0, act: rec.act | 0,
      kills: rec.kills | 0, elites: rec.elites | 0, bosses: rec.bosses | 0,
      deckSize: rec.deckSize | 0, relicCount: rec.relicCount | 0,
      seed: rec.seed, startedAt: rec.startedAt || null, endedAt: Date.now(),
    };
    a.push(row);
    while (a.length > MAX_RECORDS) a.shift();
    write(CACHE_KEY(S.uid), a);
    markDirty();
    return row;
  },

  /** 로그인 직후 : 서버 기록을 받아 로컬 사본과 합친다 */
  async sync() {
    if (!isSignedIn()) return { ok: false };
    setSync('working');
    try {
      const remote = await pull(S.uid);
      const merged = mergeRows(remote, cached(S.uid));
      write(CACHE_KEY(S.uid), merged);
      // 로컬에만 있던 게 있으면 올려 둔다
      if (merged.length !== remote.length) { dirty = true; await flush(); }
      else { S.lastSyncAt = Date.now(); setSync('ok'); }
      return { ok: true, count: merged.length };
    } catch (e) {
      setSync('error', e.message || String(e));
      console.warn('전적 불러오기 실패 (게임에는 영향 없음)', e);
      return { ok: false, reason: e.message };
    }
  },

  /** 예전 로컬 계정에 쌓여 있던 기록을 지금 계정으로 들여온다 */
  async importRows(rows) {
    if (!isSignedIn() || !Array.isArray(rows) || !rows.length) return 0;
    const merged = mergeRows(cached(S.uid), rows);
    write(CACHE_KEY(S.uid), merged);
    dirty = true;
    await flush();
    return merged.length;
  },

  stats() { return computeStats(Records.list()); },
};

/** id 로 겹치는 것을 걸러 합치고 끝난 시각 순으로 세운다 */
function mergeRows(a, b) {
  const seen = new Set();
  const out = [];
  [...(a || []), ...(b || [])].forEach((r) => {
    if (!r || !r.id || seen.has(r.id)) return;
    seen.add(r.id);
    out.push(r);
  });
  out.sort((x, y) => (x.endedAt || 0) - (y.endedAt || 0));
  return out.slice(-MAX_RECORDS);
}

/**
 * 통계.
 * 완주한 판(승리·사망)만 평균·클리어율에 넣고, 포기한 판은 따로 센다.
 */
function computeStats(all) {
  const done = all.filter((r) => r.result === 'victory' || r.result === 'death');

  const byChar = {};
  done.forEach((r) => {
    const c = (byChar[r.char] = byChar[r.char] || {
      char: r.char, name: r.charName || r.char, runs: 0, wins: 0, floorSum: 0, best: 0,
    });
    c.runs++;
    if (r.result === 'victory') c.wins++;
    c.floorSum += r.floor;
    if (r.floor > c.best) c.best = r.floor;
  });
  Object.values(byChar).forEach((c) => {
    c.avgFloor = c.runs ? c.floorSum / c.runs : 0;
    c.winRate = c.runs ? c.wins / c.runs : 0;
  });

  const acts = [0, 0, 0];
  done.forEach((r) => { acts[r.floor <= 17 ? 0 : r.floor <= 34 ? 1 : 2]++; });

  const wins = done.filter((r) => r.result === 'victory').length;
  const floorSum = done.reduce((a, r) => a + r.floor, 0);
  const playMs = all.reduce((a, r) => a + (r.startedAt && r.endedAt ? Math.max(0, r.endedAt - r.startedAt) : 0), 0);

  return {
    total: done.length,
    wins,
    winRate: done.length ? wins / done.length : 0,
    avgFloor: done.length ? floorSum / done.length : 0,
    bestFloor: done.reduce((a, r) => Math.max(a, r.floor), 0),
    abandoned: all.filter((r) => r.result === 'abandon').length,
    playMs,
    byChar: Object.values(byChar),
    acts,
    recent: all.slice(-30).reverse(),
  };
}

// ---------------------------------------------------------------
//  시작
// ---------------------------------------------------------------
/**
 * 부팅 시 1회.
 * 저장된 모드를 되살린다. 게스트면 할 일이 없고,
 * 구글이었으면 SDK 로 로그인 상태를 되찾아 전적을 맞춘다.
 *
 * @returns {Promise<'none'|'guest'|'google'>} 정해진 모드
 */
export async function init() {
  const saved = read(MODE_KEY, null);
  if (!saved || !saved.mode) { S.mode = 'none'; emit(); return 'none'; }

  if (saved.mode === 'guest') { S.mode = 'guest'; emit(); return 'guest'; }

  // 지난번에 구글로 로그인했었다 — 화면은 먼저 그 이름으로 그려 두고,
  // 실제 로그인 상태 확인은 뒤따라온다 (SDK 를 받아야 해서 시간이 걸린다).
  S.mode = 'google'; S.uid = saved.uid; S.name = saved.name; S.photo = saved.photo;
  emit();

  try {
    const m = await loadSdk();
    const a = await ensureAuth();
    const user = await new Promise((res) => {
      const off = m.onAuthStateChanged(a, (u) => { off(); res(u); }, () => { off(); res(null); });
    });
    if (user) { applyUser(user); await Records.sync(); }
    else {
      // 로그인이 풀렸다 (브라우저가 저장소를 비웠을 수 있다).
      // 기록은 서버에 그대로 있으니, 다시 로그인하면 돌아온다.
      S.mode = 'google'; S.uid = saved.uid;      // 이름은 그대로 두고 표시만 유지
      setSync('error', 'signed-out');
    }
  } catch (e) {
    setSync('error', e.message || String(e));
    console.warn('로그인 상태 확인 실패 (게임에는 영향 없음)', e);
  }
  return 'google';
}

/** 화면을 벗어날 때 밀린 것을 올려 본다 */
document.addEventListener('visibilitychange', () => { if (document.hidden && dirty) flush(); });

export const Account = {
  init, state, signIn, signOut: signOutNow, chooseGuest,
  isGuest, isSignedIn, onAccountChange, Records, saveKeyOf, GUEST_SAVE_KEY,
};
