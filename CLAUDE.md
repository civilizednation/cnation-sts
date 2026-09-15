# cnation STS — 작업 규칙

## 🔴 작업 흐름 (사용자 지정 · 항상 지킬 것)

사용자가 **수정/기능 요청**을 하면, 별도 지시가 없는 한 아래를 **매번 자동으로** 수행한다.

1. **버전 세 번째 자리(patch)를 1 올린다.**
   - 파일 : `js/version.js` 의 `VERSION`
   - 예: `1.0.1` → `1.0.2` → `1.0.3` …
   - `VERSION_NOTE` 도 이번 변경을 한 줄로 요약해 갱신한다 (타이틀 화면 배지에 표시됨).
   - `README.md` 하단 **변경 이력**에 해당 버전 항목을 추가한다.
   - `js/data/changelog.js` 의 `CHANGELOG` 맨 위에도 같은 내용을 추가한다.
     (타이틀 화면 → `Revision History` 링크로 보이는 목록)
2. **작업 브랜치에서 개발 → `main` 에 머지 → 푸시까지 한 번에 끝낸다.**
   - 개발 브랜치 : `claude/slay-the-spire-mobile-mo3fo3`
   - 커밋 후 `git checkout main && git merge --ff-only <브랜치> && git push origin main`
   - 별도 승인을 다시 묻지 않는다. (사용자가 이미 상시 허가함)
   - 작업 브랜치도 함께 푸시해 둔다.

### 버전 자리수 규칙
| 자리 | 올리는 경우 |
|---|---|
| **patch** (`1.0.X`) | 기본값 — 사용자의 일반적인 수정·기능 요청 전부 |
| **minor** (`1.X.0`) | 사용자가 "마이너 올려줘" 라고 명시할 때만 |
| **major** (`X.0.0`) | 사용자가 명시할 때만 |

### 버전을 올리지 않는 경우
- 문서(README·CLAUDE.md)만 수정
- 사용자가 "버전 그대로 둬" 라고 지시
- 질문에 답만 하고 코드를 바꾸지 않은 경우

> 사용자는 **타이틀 화면의 버전 배지로 요청이 반영됐는지 판단**한다.
> 따라서 게임 동작이 바뀌지 않았는데 버전만 올리는 일은 없어야 한다.

---

## 프로젝트 개요

원작 Slay the Spire 1편의 규칙을 재현한 **모바일 세로형 웹 게임**.
빌드 도구 없는 순수 ES 모듈 + 정적 호스팅 (Vercel). 외부 이미지·음원·3D 에셋 0개.

* 카드/UI : HTML + CSS + 인라인 SVG
* 캐릭터·몬스터·지도 : three.js 절차적 저폴리 (`vendor/three.module.min.js` 로컬 동봉)
* 효과음 : WebAudio 합성 (`js/audio.js`)

## 구조

```
index.html                 진입점 (importmap + 화면 골격)
css/style.css              모바일 세로형 레이아웃 / 카드 스타일
js/version.js              ★ 버전 (수정 요청 시 여기부터 올린다)
js/main.js                 컨트롤러 : 화면 전환, 전투 UI, 보상/상점/이벤트/모닥불
js/audio.js                합성 효과음
js/data/
  carddb.js                Card 클래스 / 레지스트리
  cards.js                 카드 인덱스 (모든 카드 파일을 여기서 import)
  cards_ironclad.js        아이언클래드 75
  cards_silent.js          사일런트 77 (중독·단검)
  cards_defect.js          디펙트 76 (구체)
  cards_watcher.js         와쳐 83 (자세·주문·통찰)
  cards_colorless.js       무색 + 상태이상 + 저주
  characters.js            캐릭터 4종 정의 (체력/시작덱/시작유물/3D 모델)
  monsters.js              몬스터 57 + 조우 테이블 + 초반 약체 풀
  relics.js                유물 117 (캐릭터 전용 포함)
  potions.js / events.js / neow.js (시작 보너스)
  changelog.js             변경 이력 (타이틀 → Revision History)
js/engine/
  powers.js                힘·상태이상 정의
  battle.js                전투 엔진 (턴/피해/AI/구체/자세/통찰)
  run.js                   런 진행 : 지도 생성, 보상, 막 전환, 저장
js/ui/
  icons.js                 SVG 글리프 + 아이콘 매핑
  cardview.js              카드 렌더러 (ART 맵에 새 카드 id 반드시 추가)
js/three/
  scene3d.js               전투 씬 (캐릭터/몬스터/연출)
  map3d.js                 3D 지도 (노드 아이콘/경로/레이캐스트)
```

## 핵심 규칙 (게임 사양)

* 50층 3막 : 1막 1~17층 / 2막 18~34층 / 3막 35~50층, 보스는 17·34·50층
* **중간 보스(17·34층) 처치 시 다음 막을 체력 최대치로 시작** (`run.advanceAct()`)
* 피해 계산 : `기본 + 힘(+활력) → 자세 배율 → 약화 ×0.75 → 취약 ×1.5 → 내림 → 방어도 차감`
* 1막 첫 전투 체력 55%/피해 50%, 두 번째 전투 75%/70% (`run.makeEncounter` 의 `tuning`)

## 검증 방법

```bash
# 문법 체크
for f in $(find js -name '*.js'); do cp "$f" /tmp/c.mjs && node --check /tmp/c.mjs; done

# 헤드리스 전투 시뮬 (캐릭터 4종 × 전 카드 실행)
node <시뮬 스크립트>      # scratchpad/sim2.mjs 참고

# 브라우저 확인 (Chromium 사전 설치됨)
python3 -m http.server 8099
# playwright : executablePath '/opt/pw-browsers/chromium', args ['--enable-unsafe-swiftshader']
```

## 주의사항

* `jsdelivr` 등 외부 CDN 은 이 환경에서 차단됨 → three.js 는 `vendor/` 로컬 파일 사용 유지
* 새 카드를 추가하면 `js/ui/cardview.js` 의 `ART` 맵에 문양을 반드시 매핑할 것 (누락 시 기본 문양으로 표시)
* 새 힘/상태이상은 `js/engine/powers.js` 에 정의 + `js/ui/icons.js` 의 `POWER_GLYPH` 에 아이콘 매핑
* Slay the Spire 는 Mega Crit 저작물 — 비영리 팬 프로젝트로만 유지, 원작 에셋 반입 금지
