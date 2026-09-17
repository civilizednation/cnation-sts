// ============================================================
//  클라우드 백업 — Firebase 익명 인증 + Firestore (REST)
//
//  ▸ 로컬이 언제나 정답이다. 이 파일은 "복사본을 한 벌 더 떠 두는" 일만 한다.
//    네트워크가 안 되든 Firebase 설정이 꺼져 있든 게임은 그대로 돌아간다.
//    여기서 예외가 밖으로 새어 나가면 안 된다 — 전부 안에서 삼킨다.
//
//  ▸ 기기 동기화가 아니다. 복구는 "이 기기에 계정이 하나도 없을 때" 만 한다.
//    (예 : iOS 사파리가 7일 미사용 시 localStorage 를 지워 버리는 경우)
//    이미 계정이 있으면 클라우드 내용으로 덮어쓰지 않는다.
//
//  ▸ SDK 를 쓰지 않고 REST 로 직접 부른다. 이 프로젝트는 빌드 도구도
//    외부 의존도 두지 않으며, SDK 배포처(gstatic)가 막힌 망에서도 돌아야 한다.
// ============================================================
import { Profiles, Records, onProfileChange, runsKeyOf, MAX_PROFILES, PROFILES_KEY } from './profile.js';
import { VERSION } from './version.js';

const CFG = {
  apiKey: 'AIzaSyCTwOAC_LrrKH8CKepUOTf0pyd9qRv4y_8',
  projectId: 'cnation-project',
};

const TOKEN_KEY = 'cnation_sts_cloud_v1';   // { uid, refreshToken }
const COLLECTION = 'backups';

const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${CFG.apiKey}`;
const REFRESH_URL = `https://securetoken.googleapis.com/v1/token?key=${CFG.apiKey}`;
const docUrl = (uid) =>
  `https://firestore.googleapis.com/v1/projects/${CFG.projectId}/databases/(default)/documents/${COLLECTION}/${uid}`;

const PUSH_DELAY = 4000;      // 로컬이 바뀐 뒤 이만큼 잠잠하면 올린다
const NET_TIMEOUT = 12000;
const RESTORE_WAIT = 4000;    // 첫 실행에 복구를 기다려 주는 최대 시간
const MAX_BYTES = 700 * 1024; // Firestore 문서 1MiB 제한에 여유를 둔다

// ---------------------------------------------------------------
//  상태
// ---------------------------------------------------------------
let idToken = null;
let tokenExpiry = 0;
let pushTimer = null;
let pushing = false;
let dirty = false;
let started = false;

const S = {
  /** 'off' 아직 시작 안 함 | 'idle' 대기 | 'working' 통신 중 | 'ok' 백업됨 | 'error' 실패 */
  status: 'off',
  lastAt: 0,
  uid: null,
  error: null,
};
const listeners = [];

function emit() { listeners.forEach((f) => { try { f(state()); } catch (e) { /* noop */ } }); }
function setStatus(status, error = null) { S.status = status; S.error = error; emit(); }

export function onCloudChange(fn) { listeners.push(fn); }
export function state() { return { ...S }; }

// ---------------------------------------------------------------
//  저수준 도구
// ---------------------------------------------------------------
function readToken() {
  try { const s = localStorage.getItem(TOKEN_KEY); return s ? JSON.parse(s) : null; }
  catch (e) { return null; }
}
function writeToken(t) {
  try { localStorage.setItem(TOKEN_KEY, JSON.stringify(t)); } catch (e) { /* noop */ }
}

/** 응답을 못 받고 영원히 매달리는 일이 없게 시간 제한을 건다 */
async function req(url, opts = {}, timeout = NET_TIMEOUT) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeout);
  try {
    const r = await fetch(url, { ...opts, signal: ac.signal });
    const text = await r.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch (e) { body = null; }
    if (!r.ok) {
      const msg = (body && body.error && body.error.message) || `HTTP ${r.status}`;
      const err = new Error(msg);
      err.code = msg;
      err.status = r.status;
      throw err;
    }
    return body;
  } finally { clearTimeout(t); }
}

/** 익명 계정을 만들거나, 갖고 있던 refreshToken 으로 새 idToken 을 받는다 */
async function auth() {
  if (idToken && Date.now() < tokenExpiry - 60000) return idToken;

  const saved = readToken();
  if (saved && saved.refreshToken) {
    try {
      const r = await req(REFRESH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(saved.refreshToken)}`,
      });
      idToken = r.id_token;
      tokenExpiry = Date.now() + (Number(r.expires_in) || 3600) * 1000;
      S.uid = r.user_id || saved.uid;
      if (r.refresh_token && r.refresh_token !== saved.refreshToken) {
        writeToken({ uid: S.uid, refreshToken: r.refresh_token });
      }
      return idToken;
    } catch (e) {
      // 토큰이 못 쓰게 됐으면 버리고 새로 만든다
      if (e.status >= 400 && e.status < 500) { try { localStorage.removeItem(TOKEN_KEY); } catch (x) { /* noop */ } }
      else throw e;
    }
  }

  const r = await req(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  idToken = r.idToken;
  tokenExpiry = Date.now() + (Number(r.expiresIn) || 3600) * 1000;
  S.uid = r.localId;
  writeToken({ uid: r.localId, refreshToken: r.refreshToken });
  return idToken;
}

// ---------------------------------------------------------------
//  백업 꾸러미
// ---------------------------------------------------------------
/**
 * 계정 목록과 계정별 전적을 한 덩어리로 만든다.
 * 진행 중인 런(저장)은 넣지 않는다 — 덩치가 크고, 잃어도 다시 하면 그만인 값이다.
 * 잃으면 아까운 것은 "누가 언제 몇 층까지 갔나" 쪽이다.
 */
function bundle() {
  const list = Profiles.all();
  const runs = {};
  list.forEach((p) => { runs[p.id] = Records.list(p.id); });

  let payload = { v: 1, ver: VERSION, at: Date.now(), list, activeId: Profiles.activeId(), runs };
  let json = JSON.stringify(payload);

  // 문서 크기 한계에 닿으면 오래된 기록부터 덜어 낸다 (최근 것이 더 값지다)
  while (json.length > MAX_BYTES) {
    let longest = null;
    Object.keys(runs).forEach((id) => {
      if (!longest || runs[id].length > runs[longest].length) longest = id;
    });
    if (!longest || runs[longest].length <= 20) break;
    runs[longest] = runs[longest].slice(Math.ceil(runs[longest].length / 4));
    json = JSON.stringify(payload);
  }
  return json;
}

/** 클라우드에서 받은 꾸러미를 로컬에 편다 */
function unbundle(json) {
  const d = JSON.parse(json);
  if (!d || !Array.isArray(d.list) || !d.list.length) return 0;
  const list = d.list.slice(0, MAX_PROFILES).filter((p) => p && p.id && p.name);
  if (!list.length) return 0;
  localStorage.setItem(PROFILES_KEY, JSON.stringify({
    list, activeId: d.activeId && list.some((p) => p.id === d.activeId) ? d.activeId : list[0].id,
  }));
  list.forEach((p) => {
    const rows = (d.runs && d.runs[p.id]) || [];
    if (Array.isArray(rows) && rows.length) localStorage.setItem(runsKeyOf(p.id), JSON.stringify(rows));
  });
  return list.length;
}

// ---------------------------------------------------------------
//  올리기 / 내려받기
// ---------------------------------------------------------------
async function upload() {
  const token = await auth();
  const json = bundle();
  await req(docUrl(S.uid), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      fields: {
        data: { stringValue: json },
        at: { integerValue: String(Date.now()) },
        ver: { stringValue: VERSION },
      },
    }),
  });
  S.lastAt = Date.now();
}

async function download() {
  const token = await auth();
  try {
    const doc = await req(docUrl(S.uid), { headers: { Authorization: `Bearer ${token}` } });
    const f = doc && doc.fields;
    return f && f.data ? f.data.stringValue : null;
  } catch (e) {
    if (e.status === 404) return null;   // 아직 백업이 없다 — 정상
    throw e;
  }
}

async function flush() {
  if (pushing || !dirty) return;
  pushing = true;
  dirty = false;
  setStatus('working');
  try {
    await upload();
    setStatus('ok');
  } catch (e) {
    dirty = true;                        // 다음 기회에 다시 시도한다
    setStatus('error', e.message || String(e));
    console.warn('클라우드 백업 실패 (게임에는 영향 없음)', e);
  } finally { pushing = false; }
}

/** 로컬이 바뀌었다 — 잠잠해지면 올린다 */
export function markDirty() {
  if (!started) return;
  dirty = true;
  if (S.status === 'ok' || S.status === 'idle') setStatus('idle');
  clearTimeout(pushTimer);
  pushTimer = setTimeout(flush, PUSH_DELAY);
}

// ---------------------------------------------------------------
//  시작
// ---------------------------------------------------------------
/**
 * 부팅 시 1회.
 * 이 기기에 계정이 하나도 없으면 클라우드에 백업이 있는지 잠깐 기다려 보고,
 * 있으면 되살린다. 계정이 이미 있으면 기다리지 않고 올리기만 한다.
 *
 * @returns {Promise<number>} 되살린 계정 수 (0 이면 복구 없음)
 */
export async function init() {
  if (started) return 0;
  started = true;
  onProfileChange(markDirty);

  // 화면을 벗어날 때 밀린 것을 먼저 올려 본다. (fetch 의 keepalive 는 본문이
  // 64KB 를 넘으면 못 쓰고 백업은 그보다 커질 수 있어 평범하게 보낸다.
  // 못 보내고 닫혀도 dirty 가 남아 다음 실행에 다시 올라간다.)
  document.addEventListener('visibilitychange', () => { if (document.hidden && dirty) flush(); });

  if (Profiles.count()) {                // 이미 쓰던 기기 — 올리기만 한다
    setStatus('idle');
    markDirty();
    return 0;
  }

  setStatus('working');                  // 계정이 없다 — 되살릴 게 있는지 본다
  try {
    const json = await Promise.race([
      download(),
      new Promise((res) => setTimeout(() => res(undefined), RESTORE_WAIT)),
    ]);
    if (json === undefined) { setStatus('idle'); return 0; }   // 시간 초과 — 그냥 진행한다
    if (!json) { setStatus('idle'); return 0; }
    const n = unbundle(json);
    setStatus(n ? 'ok' : 'idle');
    if (n) S.lastAt = Date.now();
    return n;
  } catch (e) {
    setStatus('error', e.message || String(e));
    console.warn('클라우드 복구 실패 (게임에는 영향 없음)', e);
    return 0;
  }
}

export const Cloud = { init, markDirty, state, onCloudChange, flush };
