// ============================================================
//  전 카드 헤드리스 실행 (v1.5.1)
//
//  캐릭터 4종 × 카드 363장 × 강화 전/후 를 실제 전투판에서 한 장씩 사용해 본다.
//  카드가 터지는지, 엔진을 고친 뒤 무언가 깨지지 않았는지 한 번에 본다.
//  (구체를 async 로 바꾼 v1.5.1 처럼 엔진 구조를 건드렸을 때 꼭 돌릴 것)
//
//      node tools/sim-cards.mjs
// ============================================================
import { Run } from '../js/engine/run.js';
import { Battle } from '../js/engine/battle.js';
import { CARD_DEFS, Card } from '../js/data/cards.js';

const ui = {
  log() {}, sfx() {}, async wait() {}, render() {}, fx() {}, onBattleEnd() {},
  // 카드 고르기는 항상 앞에서부터 n장 고른 것으로 친다
  async chooseCards(list, n) { return list.slice(0, n); },
};
const CHARS = ['ironclad', 'silent', 'defect', 'watcher'];
let played = 0, skipped = 0;
const fails = [];

for (const ch of CHARS) {
  for (const id of Object.keys(CARD_DEFS)) {
    const d = CARD_DEFS[id];
    for (const up of [false, true]) {
      const run = new Run(12345, ch);
      run.floor = 8; run.act = 1;
      const enc = run.makeEncounter('normal');
      const B = new Battle(run, enc, ui);
      try {
        await B.start();
        B.energy = 99;
        B.orbSlots = Math.max(B.orbSlots, 3);
        const c = new Card(id, up);
        B.hand.push(c);
        const t = B.living()[0];
        await B.playCard(c, t);
        played++;
      } catch (e) {
        skipped++;
        fails.push(`${ch}/${id}${up ? '+' : ''} : ${e.message}`);
      }
    }
  }
}
console.log(`실행 ${played}회 · 실패 ${skipped}회`);
fails.slice(0, 25).forEach((f) => console.log('  ✗', f));
process.exit(fails.length ? 1 : 0);
