// ============================================================
//  저장 규칙 검사 (v1.5.15)
//
//  "전투 중에 저장하면 그 전투가 건너뛰어진다" 는 버그가 두 번 났다.
//    v1.5.8  — enterRoom 이 들어간 뒤에 저장하고 있었다
//    v1.5.15 — 전투 중에 물약을 쓰면 usePotion 끝의 저장이 그대로 돌았다
//  두 번째가 난 이유는 저장하는 곳이 main.js 에 열아홉 군데로 흩어져 있어서,
//  새 저장 지점이 생길 때마다 "전투 중인가" 를 다시 따져야 했기 때문이다.
//  이제 main.js 는 persist() 하나만 쓰고, 막는 일은 거기서 한 번만 한다.
//  이 검사는 그 약속이 깨지지 않았는지 본다.
//
//      node tools/check-save.mjs
// ============================================================
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
let fail = 0;
const say = (ok, msg) => { if (!ok) fail++; console.log(`${ok ? '  OK ' : '✗   '} ${msg}`); };

// ---- persist() 가 있고 전투를 막는가 ----
const m = src.match(/function persist\([^)]*\)\s*\{([\s\S]*?)\n\}/);
say(!!m, m ? 'persist() 가 있다' : 'persist() 가 없다 — main.js 의 저장 창구');
if (m) {
  // 주석을 걷어내고 본다 — 주석 처리된 `if (G.battle) return;` 에 속지 않으려고
  const body = m[1].replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  say(/if\s*\(\s*G\.battle\s*\)\s*return/.test(body),
    /if\s*\(\s*G\.battle\s*\)\s*return/.test(body)
      ? 'persist() 가 전투 중 저장을 막는다'
      : 'persist() 에 `if (G.battle) return;` 이 없다 — 전투가 건너뛰어진다');
  say(/saveRun\(/.test(body), 'persist() 가 saveRun 을 부른다');
}

// ---- main.js 가 saveRun 을 직접 부르지 않는가 ----
const lines = src.split('\n');
const persistStart = lines.findIndex((l) => /function persist\(/.test(l));
const direct = [];
lines.forEach((l, i) => {
  if (!/saveRun\(/.test(l)) return;
  if (i >= persistStart && i <= persistStart + 6) return;   // persist() 안쪽은 봐준다
  if (/^\s*(\*|\/\/)/.test(l)) return;                      // 주석은 봐준다
  direct.push(`${i + 1}행 : ${l.trim()}`);
});
say(!direct.length, direct.length
  ? `main.js 가 saveRun 을 직접 부른다 ${direct.length}곳 — persist() 를 쓸 것\n      ` + direct.join('\n      ')
  : 'main.js 는 saveRun 을 직접 부르지 않는다 (전부 persist 를 거친다)');

// ---- 방 안에서는 visibilitychange 가 저장하지 않는가 ----
const vis = src.match(/visibilitychange[\s\S]{0,420}?\n\s*\}\);/);
say(!!vis && /!G\.run\.room/.test(vis[0]), vis && /!G\.run\.room/.test(vis[0])
  ? 'visibilitychange 가 방 안에서는 저장하지 않는다'
  : 'visibilitychange 에 `!G.run.room` 이 없다 — 반쯤 진행된 방이 저장된다');

// ---- enterRoom 이 들어가기 **전**에 저장하는가 ----
const er = src.match(/function enterRoom\([\s\S]*?\n\}/);
if (er) {
  const save = er[0].indexOf('persist(');
  const enter = er[0].indexOf('run.enterNode(');
  say(save >= 0 && enter >= 0 && save < enter, save < enter && save >= 0
    ? 'enterRoom 이 방에 들어가기 전에 저장한다'
    : 'enterRoom 이 enterNode 뒤에 저장한다 — 전투가 건너뛰어진다 (v1.5.8 과 같은 버그)');
} else say(false, 'enterRoom 을 찾지 못했다');

console.log(fail ? `\nFAIL ${fail}건` : '\nOK');
process.exit(fail ? 1 : 0);
