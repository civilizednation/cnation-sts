// ============================================================
//  예전 저장 들여오기 — v1.3.x 의 로컬 5계정 시스템 잔재
//
//  v1.3.0~1.3.4 는 한 기기 안에 계정을 최대 5개까지 두고 각자 전적을 쌓았다.
//  v1.4 부터는 구글 계정이 곧 플레이어라 그 구조를 걷어냈지만, 이미 쌓여 있던
//  기록까지 버릴 이유는 없다. 처음 구글로 로그인할 때 한 번 물어보고 들여온다.
//
//  들여왔거나 사용자가 거절하면 표시를 남겨 다시 묻지 않는다.
// ============================================================
const LIST_KEY = 'cnation_sts_profiles_v1';
const DONE_KEY = 'cnation_sts_legacy_done_v1';
const runsKeyOf = (id) => `cnation_sts_runs_${id}`;
const saveKeyOf = (id) => `cnation_sts_save_${id}`;

function read(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
  catch (e) { return fallback; }
}

/** 이미 처리했나 */
export function settled() {
  try { return !!localStorage.getItem(DONE_KEY); } catch (e) { return true; }
}
export function markSettled() {
  try { localStorage.setItem(DONE_KEY, '1'); } catch (e) { /* noop */ }
}

/**
 * 예전 계정들에 남아 있는 기록을 한 뭉치로 모은다.
 * @returns {{rows: Array, profiles: number}} 없으면 rows 는 빈 배열
 */
export function collect() {
  if (settled()) return { rows: [], profiles: 0 };
  const store = read(LIST_KEY, null);
  const list = store && Array.isArray(store.list) ? store.list : [];
  if (!list.length) return { rows: [], profiles: 0 };

  const rows = [];
  const seen = new Set();
  list.forEach((p) => {
    const a = read(runsKeyOf(p.id), []);
    if (!Array.isArray(a)) return;
    a.forEach((r) => {
      // 치트 판은 애초에 통계에서 뺐던 것이라 들여오지 않는다 (v1.3.1)
      if (!r || !r.id || r.cheat || seen.has(r.id)) return;
      seen.add(r.id);
      rows.push(r);
    });
  });
  rows.sort((x, y) => (x.endedAt || 0) - (y.endedAt || 0));
  return { rows, profiles: list.length };
}

/** 들여오기가 끝났으면 예전 흔적을 지운다 */
export function cleanup() {
  const store = read(LIST_KEY, null);
  const list = store && Array.isArray(store.list) ? store.list : [];
  try {
    list.forEach((p) => {
      localStorage.removeItem(runsKeyOf(p.id));
      localStorage.removeItem(saveKeyOf(p.id));
    });
    localStorage.removeItem(LIST_KEY);
  } catch (e) { /* noop */ }
  markSettled();
}

/**
 * 계정을 나누기 전(v1.2 이하)의 저장 하나.
 * 게스트의 "이어하기" 로 옮겨 준다.
 */
export function adoptOldestSave(targetKey) {
  const OLD = 'cnation_sts_save_v1';
  try {
    const old = localStorage.getItem(OLD);
    if (old && !localStorage.getItem(targetKey)) {
      localStorage.setItem(targetKey, old);
      localStorage.removeItem(OLD);
      return true;
    }
  } catch (e) { /* noop */ }
  return false;
}
