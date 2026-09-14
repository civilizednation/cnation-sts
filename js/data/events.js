// ============================================================
//  ? 방 이벤트
//  effect(run, ctx) : ctx 는 { pickCard, addCard, battle, log, ui }
//  반환값은 결과 메시지 문자열(또는 Promise<string>)
// ============================================================
import { mk } from './carddb.js';
import { CURSE_POOL } from './cards_colorless.js';

export const EVENTS = {};
const E = (o) => { EVENTS[o.id] = o; return o; };

E({ id: 'goldenIdol', name: '황금 우상', acts: [1],
  text: '받침대 위에 황금 우상이 놓여 있다. 함정이 있는 것이 분명하다.',
  art: 'idol',
  options: [
    { label: '가져간다', desc: '유물을 얻지만 대가가 따른다.',
      effect: (run, ctx) => {
        run.addRelic('goldenIdolRelic') || run.gainGold(150);
        const roll = run.rng.next();
        if (roll < 0.34) { run.loseMaxHp(Math.floor(run.player.maxHp * 0.08)); return '천장이 무너졌다! 최대 체력이 감소하고 골드 150을 얻었다.'; }
        if (roll < 0.67) { const d = Math.floor(run.player.maxHp * 0.25); run.player.hp = Math.max(1, run.player.hp - d); return `바위가 굴러왔다! 체력 ${d}을 잃고 골드 150을 얻었다.`; }
        run.addCurse('injury'); return '저주가 깃들었다. 부상 카드를 얻고 골드 150을 얻었다.';
      } },
    { label: '떠난다', desc: '아무 일도 일어나지 않는다.', effect: () => '조용히 자리를 떠났다.' },
  ] });

E({ id: 'bigFish', name: '큰 물고기', acts: [1],
  text: '떠다니는 물체들이 보인다. 무엇을 잡을까?',
  art: 'fish',
  options: [
    { label: '바나나', desc: '최대 체력의 1/3을 회복한다.',
      effect: (run) => { const h = Math.floor(run.player.maxHp / 3); run.healPlayer(h); return `체력을 ${h} 회복했다.`; } },
    { label: '도넛', desc: '최대 체력이 5 증가한다.',
      effect: (run) => { run.gainMaxHp(5); return '최대 체력이 5 증가했다.'; } },
    { label: '상자', desc: '유물을 얻지만 저주도 함께 얻는다.',
      effect: (run) => { const r = run.relicReward(); if (r) run.addRelic(r); run.addCurse('regret'); return `${r ? '유물을 얻었다. ' : ''}그리고 "후회" 저주를 얻었다.`; } },
  ] });

E({ id: 'livingWall', name: '살아있는 벽', acts: [1],
  text: '벽이 꿈틀거리며 당신의 덱을 바라본다.',
  art: 'wall',
  options: [
    { label: '잊기', desc: '카드 1장을 제거한다.',
      effect: async (run, ctx) => { const c = await ctx.pickCard((x) => !x.def.undeletable, '제거할 카드'); if (c) { run.removeCard(c); return `${c.name}을(를) 제거했다.`; } return '아무것도 하지 않았다.'; } },
    { label: '변화', desc: '카드 1장을 다른 카드로 바꾼다.',
      effect: async (run, ctx) => {
        const c = await ctx.pickCard(() => true, '바꿀 카드');
        if (!c) return '아무것도 하지 않았다.';
        run.removeCard(c);
        const nc = run.cardReward('normal')[0];
        run.addCard(nc);
        return `${c.name}이(가) ${nc.name}(으)로 변했다.`;
      } },
    { label: '성장', desc: '카드 1장을 강화한다.',
      effect: async (run, ctx) => { const c = await ctx.pickCard((x) => x.canUpgrade(), '강화할 카드'); if (c) { c.upgrade(); return `${c.name}을(를) 강화했다.`; } return '강화할 카드가 없다.'; } },
  ] });

E({ id: 'scrapOoze', name: '고철 점액', acts: [1, 2],
  text: '점액 덩어리 속에 유물이 보인다. 손을 넣어볼까?',
  art: 'ooze',
  options: [
    { label: '손을 넣는다', desc: '체력을 잃지만 유물을 얻을 수도 있다.',
      effect: (run) => {
        const dmg = run.rng.range(3, 5);
        run.player.hp = Math.max(1, run.player.hp - dmg);
        if (run.rng.chance(0.25 + (run.flags.oozeTries || 0) * 0.1)) {
          const r = run.relicReward(); if (r) run.addRelic(r);
          return `체력을 ${dmg} 잃었지만 유물을 얻었다!`;
        }
        run.flags.oozeTries = (run.flags.oozeTries || 0) + 1;
        return `체력을 ${dmg} 잃었다. 아무것도 잡히지 않았다.`;
      }, repeatable: true },
    { label: '떠난다', desc: '', effect: () => '자리를 떠났다.' },
  ] });

E({ id: 'shiningLight', name: '빛나는 빛', acts: [1, 2],
  text: '눈부신 빛이 당신을 감싼다. 몸을 맡기겠는가?',
  art: 'light',
  options: [
    { label: '빛으로 들어간다', desc: '무작위 카드 2장을 강화하지만 체력을 잃는다.',
      effect: (run) => {
        const d = Math.floor(run.player.maxHp * 0.2);
        run.player.hp = Math.max(1, run.player.hp - d);
        run.upgradeRandom((c) => c.canUpgrade(), 2);
        return `체력을 ${d} 잃고 카드 2장이 강화되었다.`;
      } },
    { label: '떠난다', desc: '', effect: () => '빛을 등지고 떠났다.' },
  ] });

E({ id: 'worldOfGoop', name: '점액의 세계', acts: [1],
  text: '발밑이 온통 점액이다. 금화가 반짝인다.',
  art: 'goop',
  options: [
    { label: '금화를 줍는다', desc: '골드를 얻지만 체력을 잃고 점액질을 얻는다.',
      effect: (run) => {
        run.gainGold(75); run.player.hp = Math.max(1, run.player.hp - 11);
        for (let i = 0; i < 5; i++) run.addCard(mk('slimed'));
        return '골드 75를 얻었지만 체력 11을 잃고 점액질 5장을 얻었다.';
      } },
    { label: '점액을 털어낸다', desc: '골드를 잃는다.',
      effect: (run) => { const g = Math.min(run.gold, 100); run.spendGold(g); return `골드 ${g}를 잃었지만 깨끗해졌다.`; } },
  ] });

E({ id: 'deadAdventurer', name: '죽은 모험가', acts: [1, 2],
  text: '쓰러진 모험가의 시신이 있다. 무언가 남아있을지도 모른다.',
  art: 'corpse',
  options: [
    { label: '수색한다', desc: '보상을 얻지만 정예 몬스터를 만날 수 있다.',
      effect: async (run, ctx) => {
        const roll = run.rng.next();
        if (roll < 0.25) { const r = run.relicReward(); if (r) run.addRelic(r); return '유물을 발견했다!'; }
        if (roll < 0.6) { const g = run.rng.range(30, 80); run.gainGold(g); return `골드 ${g}를 발견했다.`; }
        await ctx.battle('elite');
        return '정예 몬스터가 나타났다!';
      } },
    { label: '떠난다', desc: '', effect: () => '경의를 표하고 떠났다.' },
  ] });

E({ id: 'cursedTome', name: '저주받은 서적', acts: [2, 3],
  text: '오래된 책이 스스로 페이지를 넘긴다.',
  art: 'tome',
  options: [
    { label: '읽는다', desc: '강력한 유물을 얻지만 체력을 크게 잃는다.',
      effect: (run) => {
        const d = Math.floor(run.player.maxHp * 0.25);
        run.player.hp = Math.max(1, run.player.hp - d);
        const r = run.pickRelic('rare'); if (r) run.addRelic(r);
        return `체력을 ${d} 잃고 희귀 유물을 얻었다!`;
      } },
    { label: '덮는다', desc: '', effect: () => '책을 덮었다.' },
  ] });

E({ id: 'bonfireSpirits', name: '모닥불의 정령들', acts: [1, 2, 3],
  text: '정령들이 제물을 요구한다. 카드 1장을 바치면 보답하겠다고 한다.',
  art: 'bonfire',
  options: [
    { label: '카드를 바친다', desc: '카드 1장을 제거하고 보상을 받는다.',
      effect: async (run, ctx) => {
        const c = await ctx.pickCard((x) => !x.def.undeletable, '바칠 카드');
        if (!c) return '바칠 카드가 없다.';
        run.removeCard(c);
        if (c.rarity === 'rare') { const r = run.relicReward('rare'); if (r) run.addRelic(r); return `${c.name}을(를) 바치고 희귀 유물을 얻었다!`; }
        if (c.rarity === 'uncommon') { run.player.hp = run.player.maxHp; return `${c.name}을(를) 바치고 체력을 완전히 회복했다!`; }
        if (c.type === 'curse') { run.gainMaxHp(10); return `저주를 바치고 최대 체력이 10 증가했다!`; }
        run.healPlayer(Math.floor(run.player.maxHp * 0.3));
        return `${c.name}을(를) 바치고 체력을 회복했다.`;
      } },
    { label: '떠난다', desc: '', effect: () => '정령들이 실망한 듯하다.' },
  ] });

E({ id: 'wingStatue', name: '날개 조각상', acts: [2],
  text: '날개 달린 조각상이 서 있다. 발밑에 가시가 돋아 있다.',
  art: 'statue',
  options: [
    { label: '기도한다', desc: '체력을 잃고 카드를 제거한다.',
      effect: async (run, ctx) => {
        run.player.hp = Math.max(1, run.player.hp - 7);
        const c = await ctx.pickCard((x) => !x.def.undeletable, '제거할 카드');
        if (c) run.removeCard(c);
        return `체력 7을 잃고 ${c ? c.name + '을(를) 제거했다.' : '아무것도 하지 않았다.'}`;
      } },
    { label: '파괴한다', desc: '골드를 얻지만 저주를 받는다.',
      effect: (run) => { run.gainGold(70); run.addCurse(run.rng.pick(CURSE_POOL)); return '골드 70을 얻었지만 저주를 받았다.'; } },
    { label: '떠난다', desc: '', effect: () => '조각상을 지나쳤다.' },
  ] });

E({ id: 'theLibrary', name: '도서관', acts: [2],
  text: '끝없이 늘어선 서가. 한 권을 고를 수 있다.',
  art: 'library',
  options: [
    { label: '책을 읽는다', desc: '카드 1장을 선택해 덱에 넣는다.',
      effect: async (run, ctx) => {
        const choices = run.cardReward('normal');
        const c = await ctx.chooseFrom(choices, '덱에 넣을 카드');
        if (c) { run.addCard(c); return `${c.name}을(를) 덱에 넣었다.`; }
        return '아무것도 고르지 않았다.';
      } },
    { label: '낮잠을 잔다', desc: '최대 체력의 1/3을 회복한다.',
      effect: (run) => { const h = Math.floor(run.player.maxHp / 3); run.healPlayer(h); return `체력을 ${h} 회복했다.`; } },
  ] });

E({ id: 'falling', name: '추락', acts: [3],
  text: '발밑이 무너진다! 무언가를 붙잡아야 한다.',
  art: 'falling',
  options: [
    { label: '기술을 버린다', desc: '기술 카드 1장을 잃는다.',
      effect: async (run, ctx) => { const c = await ctx.pickCard((x) => x.type === 'skill', '잃을 기술 카드'); if (c) { run.removeCard(c); return `${c.name}을(를) 잃고 무사히 착지했다.`; } return '기술 카드가 없다.'; } },
    { label: '힘을 버린다', desc: '힘 카드 1장을 잃는다.',
      effect: async (run, ctx) => { const c = await ctx.pickCard((x) => x.type === 'power', '잃을 힘 카드'); if (c) { run.removeCard(c); return `${c.name}을(를) 잃고 무사히 착지했다.`; } return '힘 카드가 없다.'; } },
    { label: '공격을 버린다', desc: '공격 카드 1장을 잃는다.',
      effect: async (run, ctx) => { const c = await ctx.pickCard((x) => x.type === 'attack', '잃을 공격 카드'); if (c) { run.removeCard(c); return `${c.name}을(를) 잃고 무사히 착지했다.`; } return '공격 카드가 없다.'; } },
  ] });

E({ id: 'mysteriousSphere', name: '신비한 구체', acts: [3],
  text: '떠다니는 구체가 당신을 유혹한다.',
  art: 'sphere',
  options: [
    { label: '연다', desc: '정예 2체와 싸우고 희귀 유물을 얻는다.',
      effect: async (run, ctx) => { await ctx.battle('elite', 'rare'); return '구체에서 수호자들이 튀어나왔다!'; } },
    { label: '떠난다', desc: '', effect: () => '구체를 남겨두고 떠났다.' },
  ] });

E({ id: 'purificationShrine', name: '정화의 사당', acts: [1, 2, 3],
  text: '고요한 사당. 마음의 짐을 내려놓을 수 있을 것 같다.',
  art: 'shrine',
  options: [
    { label: '정화한다', desc: '카드 1장을 제거한다.',
      effect: async (run, ctx) => { const c = await ctx.pickCard((x) => !x.def.undeletable, '제거할 카드'); if (c) { run.removeCard(c); return `${c.name}을(를) 제거했다.`; } return '아무것도 하지 않았다.'; } },
    { label: '기부한다', desc: '골드 50을 내고 최대 체력 5를 얻는다.', condition: (run) => run.gold >= 50,
      effect: (run) => { run.spendGold(50); run.gainMaxHp(5); return '최대 체력이 5 증가했다.'; } },
    { label: '떠난다', desc: '', effect: () => '사당을 지나쳤다.' },
  ] });

export function pickEvent(run) {
  const cand = Object.values(EVENTS).filter((e) => e.acts.includes(run.act) && !run.usedEvents.includes(e.id));
  const list = cand.length ? cand : Object.values(EVENTS).filter((e) => e.acts.includes(run.act));
  const ev = run.rng.pick(list);
  run.usedEvents.push(ev.id);
  return ev;
}
