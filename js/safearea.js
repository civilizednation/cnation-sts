// ============================================================
//  화면 안전 여백 (v1.5.6)
//
//  ★ iOS 의 `env(safe-area-inset-*)` 을 믿지 않는다.
//    아이폰 홈 화면 앱에서 실제(59/34)보다 작게 오거나 **0 으로 온다**.
//    v1.5.2~1.5.4 의 보정이 세 번 다 0 이 되어 화면이 한 픽셀도 안 움직였다.
//
//  ★ 그리고 이 계산을 `index.html` 의 인라인 스크립트에 두어도 소용없다 (v1.5.5).
//    iOS 홈 화면 앱은 **시작 문서(index.html)를 캐시에 묶어 두는 일이 있어서**,
//    js 는 새것인데 html 은 옛것인 상태가 된다 (타이틀 버전만 올라가고 배치는 그대로).
//    그래서 이 모듈이 `js/main.js` 에서 불린다 — js 는 확실히 새로 받아 온다.
//
//  판단 기준은 화면 비율이다. 노치·다이내믹 아일랜드 아이폰은 세로/가로가 2.1 을 넘는다
//  (375×812 = 2.17 … 440×956 = 2.17). 홈 버튼 아이폰은 1.78, 아이패드는 1.33.
//
//  사용자가 직접 더 내리거나 올릴 수도 있다 (관리자 모드 → 화면 여백 조정).
//  자동값이 안 맞는 기기가 또 나오면 그 자리에서 맞출 수 있게 둔 손잡이다.
// ============================================================

const KEY = 'sts.safeAdjust';

/** 사용자가 손으로 더한 값(px). 위·아래 같이 움직인다 */
export function getAdjust() {
  try { return Math.max(-40, Math.min(120, Number(localStorage.getItem(KEY)) || 0)); } catch (e) { return 0; }
}
export function setAdjust(px) {
  const v = Math.max(-40, Math.min(120, Math.round(px) || 0));
  try { localStorage.setItem(KEY, String(v)); } catch (e) { /* noop */ }
  apply();
  return v;
}

/** 이 기기가 노치·다이내믹 아일랜드 아이폰의 홈 화면 앱인가 */
export function iosApp() {
  const ua = navigator.userAgent || '';
  const ios = /iPhone|iPod|iPad/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!ios) return null;
  const sw = Math.min(screen.width, screen.height);
  const sh = Math.max(screen.width, screen.height);
  const app = navigator.standalone === true
    || (window.matchMedia && matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches)
    || Math.abs(window.innerHeight - sh) <= 2;
  if (!app) return null;
  return { notch: sh / sw >= 2.1, w: sw, h: sh };
}

/**
 * 자동으로 잡은 여백(px). 아이폰 홈 화면 앱이 아니면 null (그때는 css 의 env 를 그대로 쓴다).
 * 아래쪽은 건드리지 않는다 — 손패가 그만큼 올라와 판이 좁아지고, 지금도 충분하다는 것을
 * 실제 기기에서 확인했다 (v1.5.6). 문제는 위쪽뿐이다.
 */
export function autoInsets() {
  const info = iosApp();
  if (!info) return null;
  return info.notch ? { top: 62, bottom: 0 } : { top: 20, bottom: 0 };
}

/** 실제로 --safe-t / --safe-b 에 심는다 (인라인이라 어떤 스타일 규칙보다 세다) */
export function apply() {
  const d = document.documentElement;
  const info = iosApp();
  const auto = autoInsets();
  const adj = getAdjust();
  d.classList.toggle('ios-app', !!info);
  d.classList.toggle('ios-notch', !!(info && info.notch));
  if (auto) {
    d.style.setProperty('--safe-t', `${Math.max(0, auto.top + adj)}px`);
    if (auto.bottom) d.style.setProperty('--safe-b', `${auto.bottom}px`);
    else d.style.removeProperty('--safe-b');
  } else if (adj) {
    // 그 밖의 기기 : env 값 위에 사용자가 더한 만큼만 얹는다
    d.style.setProperty('--safe-t', `calc(env(safe-area-inset-top, 0px) + ${adj}px)`);
  } else {
    d.style.removeProperty('--safe-t');
    d.style.removeProperty('--safe-b');
  }
}

/** 관리자 화면에 보여 줄 한 줄 */
export function safeAreaInfo() {
  const info = iosApp();
  const auto = autoInsets();
  const adj = getAdjust();
  const cs = getComputedStyle(document.documentElement);
  const used = (cs.getPropertyValue('--safe-t') || '').trim() || '(css 의 env)';
  return `${info ? (info.notch ? '노치 아이폰 앱' : '아이폰 앱') : '해당 없음'}`
    + ` · 자동 ${auto ? `${auto.top}/${auto.bottom}` : '-'}`
    + ` · 손조정 ${adj >= 0 ? '+' : ''}${adj}`
    + ` · 적용 ${used}`;
}
