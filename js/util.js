// ============================================================
//  공용 유틸리티 : 난수(시드 기반), 배열, DOM, 비동기 헬퍼
// ============================================================

/** Mulberry32 : 시드 기반 결정론적 난수 생성기 (런 재현용) */
export class RNG {
  constructor(seed) { this.seed = (seed >>> 0) || 1; this.counter = 0; }
  next() {
    this.counter++;
    let t = (this.seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /** [0, n) 정수 */
  int(n) { return Math.floor(this.next() * n); }
  /** [min, max] 정수 */
  range(min, max) { return min + this.int(max - min + 1); }
  pick(arr) { return arr[this.int(arr.length)]; }
  /** 확률 p(0~1) */
  chance(p) { return this.next() < p; }
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  /** 가중치 선택 : [{w:숫자, ...}] */
  weighted(list) {
    const total = list.reduce((s, x) => s + x.w, 0);
    let r = this.next() * total;
    for (const x of list) { r -= x.w; if (r <= 0) return x; }
    return list[list.length - 1];
  }
  clone() { const r = new RNG(1); r.seed = this.seed; return r; }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** 간단한 DOM 생성기 */
export function el(tag, props = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'text') n.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) n.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return n;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** 객체 깊은 복사 (함수 제외한 순수 데이터용) */
export const deepCopy = (o) => JSON.parse(JSON.stringify(o));

/** 고유 인스턴스 ID */
let _uid = 0;
export const uid = () => `u${++_uid}`;
