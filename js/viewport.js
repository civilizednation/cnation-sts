// ============================================================
//  화면 틀 — 이 게임은 스마트폰 세로 화면을 겨냥해 만들었다.
//  태블릿이나 컴퓨터에서 열면 가로가 넓어져 레이아웃이 늘어나 버리므로,
//  폰에 가까운 가로/세로 비율의 상자 안에만 그리고 양옆을 비운다.
//
//  ★ 크기 계산은 CSS 가 한다 (css/style.css 의 --app-w / --app-h).
//    js 로 재서 심으면 첫 프레임에 전체 너비로 한 번 깜빡인다.
//    여기서는 창 좌표가 필요한 몇 곳에 쓸 자(尺)만 내준다.
//
//  ★ 상자 안에서는 vw/vh 를 쓰지 말 것. 그건 바깥 창 기준이라 상자가
//    좁아져도 따라 줄지 않는다. 대신 --vw / --vh 를 쓴다 (상자의 1%).
// ============================================================

/** 화면 틀의 위치·크기 (창 좌표). 툴팁처럼 창 좌표로 계산하는 곳에 필요하다 */
export function appRect() {
  const el = document.getElementById('app');
  if (el) return el.getBoundingClientRect();
  return { left: 0, top: 0, width: innerWidth, height: innerHeight,
    right: innerWidth, bottom: innerHeight };
}

/** 지금 여백이 생긴 상태인가 (태블릿·컴퓨터) */
export function isBoxed() {
  const b = appRect();
  return b.width < innerWidth - 1 || b.height < innerHeight - 1;
}

/** 관리자 화면에 보여 줄 한 줄 */
export function boxInfo() {
  const b = appRect();
  return `${Math.round(b.width)}×${Math.round(b.height)}`
    + ` · 비율 ${(b.width / b.height).toFixed(3)}`
    + (isBoxed() ? ' (여백 있음)' : ' (꽉 참)');
}
