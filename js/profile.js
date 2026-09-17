// ============================================================
//  계정(프로필) — 한 기기 안에서 여러 사람이 각자 기록을 갖는다
//
//  전부 localStorage 에 로컬로 저장한다. 서버는 쓰지 않는다.
// ============================================================

const LIST_KEY = 'cnation_sts_profiles_v1';
const OLD_SAVE_KEY = 'cnation_sts_save_v1';   // 계정 도입 전의 저장 (1회 이전한다)

export const MAX_PROFILES = 5;
export const MAX_NAME = 12;

export const saveKeyOf = (id) => `cnation_sts_save_${id}`;
export const runsKeyOf = (id) => `cnation_sts_runs_${id}`;

function read(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
  catch (e) { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch (e) { console.warn('저장 실패', key, e); return false; }
}
function del(key) { try { localStorage.removeItem(key); } catch (e) { /* noop */ } }


/** { list: [{ id, name, createdAt }], activeId } */
function store() {
  const s = read(LIST_KEY, null);
  if (s && Array.isArray(s.list)) return s;
  return { list: [], activeId: null };
}
function commit(s) { write(LIST_KEY, s); }

const newId = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** 이름 다듬기 — 공백 정리 + 길이 제한 */
export function cleanName(raw) {
  return String(raw || '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
}

export const Profiles = {
  all() { return store().list.slice(); },
  count() { return store().list.length; },
  canCreate() { return store().list.length < MAX_PROFILES; },

  active() {
    const s = store();
    return s.list.find((p) => p.id === s.activeId) || s.list[0] || null;
  },
  activeId() { const a = Profiles.active(); return a ? a.id : null; },

  setActive(id) {
    const s = store();
    if (!s.list.some((p) => p.id === id)) return false;
    s.activeId = id;
    commit(s);
    return true;
  },

  /** 같은 이름이 이미 있으면 null 을 돌려준다 */
  create(rawName) {
    const s = store();
    if (s.list.length >= MAX_PROFILES) return null;
    const name = cleanName(rawName);
    if (!name) return null;
    if (s.list.some((p) => p.name === name)) return null;
    const p = { id: newId(), name, createdAt: Date.now() };
    s.list.push(p);
    s.activeId = p.id;
    commit(s);
    return p;
  },

  rename(id, rawName) {
    const s = store();
    const p = s.list.find((x) => x.id === id);
    const name = cleanName(rawName);
    if (!p || !name) return false;
    if (s.list.some((x) => x.id !== id && x.name === name)) return false;
    p.name = name;
    commit(s);
    return true;
  },

  /** 계정과 그 계정의 저장·기록을 모두 지운다 */
  remove(id) {
    const s = store();
    const i = s.list.findIndex((p) => p.id === id);
    if (i < 0) return false;
    s.list.splice(i, 1);
    if (s.activeId === id) s.activeId = s.list.length ? s.list[0].id : null;
    commit(s);
    del(saveKeyOf(id));
    del(runsKeyOf(id));
    return true;
  },

  /** 진행 중인 런이 있는지 (이어하기 가능 여부) */
  hasSave(id) {
    try { return !!localStorage.getItem(saveKeyOf(id)); } catch (e) { return false; }
  },

  /**
   * 계정 도입 전에 쓰던 저장을 첫 계정으로 옮긴다.
   * 계정이 하나도 없고 옛 저장만 있는 경우에만 동작한다.
   */
  migrateLegacy(defaultName = '플레이어') {
    const s = store();
    if (s.list.length) return null;
    let old = null;
    try { old = localStorage.getItem(OLD_SAVE_KEY); } catch (e) { old = null; }
    if (!old) return null;
    const p = Profiles.create(defaultName);
    if (!p) return null;
    try { localStorage.setItem(saveKeyOf(p.id), old); localStorage.removeItem(OLD_SAVE_KEY); } catch (e) { /* noop */ }
    return p;
  },
};

// ---------------------------------------------------------------
//  런 기록 — 한 판이 끝날 때마다 한 건씩 쌓는다
//  통계는 저장하지 않고 읽을 때 계산한다 (어긋날 일이 없다)
// ---------------------------------------------------------------
const MAX_RECORDS = 500;

export const Records = {
  list(profileId) {
    const a = read(runsKeyOf(profileId), []);
    return Array.isArray(a) ? a : [];
  },

  add(profileId, rec) {
    if (!profileId) return null;
    const a = Records.list(profileId);
    const row = {
      id: 'r' + Date.now().toString(36),
      char: rec.char,
      charName: rec.charName,
      result: rec.result,            // 'victory' | 'death' | 'abandon'
      floor: rec.floor | 0,
      act: rec.act | 0,
      kills: rec.kills | 0,
      elites: rec.elites | 0,
      bosses: rec.bosses | 0,
      deckSize: rec.deckSize | 0,
      relicCount: rec.relicCount | 0,
      cheat: !!rec.cheat,
      seed: rec.seed,
      startedAt: rec.startedAt || null,
      endedAt: Date.now(),
    };
    a.push(row);
    while (a.length > MAX_RECORDS) a.shift();
    write(runsKeyOf(profileId), a);
    return row;
  },

  clear(profileId) { del(runsKeyOf(profileId)); },

  /**
   * 통계 계산.
   * 완주한 판(승리·사망)만 평균·클리어율에 넣고, 포기한 판은 따로 센다.
   *
   * 숨겨진 시작 보너스를 쓴 판은 게임 테스트용이라 통계에 넣지 않는다.
   * 지금은 아예 기록하지 않지만(main.js recordRun), 그 전에 쌓인 기록이
   * 남아 있을 수 있어 여기서도 한 번 더 걸러 낸다.
   */
  stats(profileId) {
    const all = Records.list(profileId);
    const used = all.filter((r) => !r.cheat);
    const done = used.filter((r) => r.result === 'victory' || r.result === 'death');

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

    // 막 구간별로 어디서 끝났는지
    const acts = [0, 0, 0];
    done.forEach((r) => {
      const i = r.floor <= 17 ? 0 : r.floor <= 34 ? 1 : 2;
      acts[i]++;
    });

    const wins = done.filter((r) => r.result === 'victory').length;
    const floorSum = done.reduce((a, r) => a + r.floor, 0);
    const playMs = used.reduce((a, r) => a + (r.startedAt && r.endedAt ? Math.max(0, r.endedAt - r.startedAt) : 0), 0);

    return {
      total: done.length,
      wins,
      winRate: done.length ? wins / done.length : 0,
      avgFloor: done.length ? floorSum / done.length : 0,
      bestFloor: done.reduce((a, r) => Math.max(a, r.floor), 0),
      abandoned: used.filter((r) => r.result === 'abandon').length,
      playMs,
      byChar: Object.values(byChar),
      acts,
      recent: used.slice(-30).reverse(),
    };
  },
};
