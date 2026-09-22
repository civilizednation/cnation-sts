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
| **patch** (`1.1.X`) | 기본값 — 사용자의 일반적인 수정·기능 요청 전부 |
| **minor** (`1.X.0`) | **사용자가 "큰 기능 추가/변화" 라고 말할 때** (예: 배경음악 추가). 또는 "마이너 올려줘" 라고 명시할 때. 자기 판단으로 올리지 않는다 — 사용자가 먼저 이야기한다 |
| **major** (`X.0.0`) | 사용자가 명시할 때만 |

> minor 를 올릴 때는 patch 를 `0` 으로 되돌린다. (`1.1.7` → `1.2.0`)
> 이력 : `1.1.0` 카드 상세 설명 · `1.2.0` 배경음악 · `1.3.0` 계정 · `1.4.0` 아이템 아이콘 전면 재설계

### 버전을 올리지 않는 경우
- 문서(README·CLAUDE.md)만 수정
- 사용자가 "버전 그대로 둬" 라고 지시
- 질문에 답만 하고 코드를 바꾸지 않은 경우

> 사용자는 **타이틀 화면의 버전 배지로 요청이 반영됐는지 판단**한다.
> 따라서 게임 동작이 바뀌지 않았는데 버전만 올리는 일은 없어야 한다.

---

## 프로젝트 개요

원작 Slay the Spire 1편의 규칙을 재현한 **모바일 세로형 웹 게임**.
빌드 도구 없는 순수 ES 모듈 + 정적 호스팅 (Vercel).
외부 이미지·3D 에셋 0개. 배경음악 mp3 15곡만 `audio/` 에 둔다 (128kbps, 약 34MB).

* 카드/UI : HTML + CSS + 인라인 SVG
* 캐릭터·몬스터·지도 : three.js 절차적 저폴리 (`vendor/three.module.min.js` 로컬 동봉)
* 효과음 : WebAudio 합성 (`js/audio.js`)
* 배경음악 : mp3 15곡 스트리밍 + 크로스페이드 (`js/bgm.js`)

## 구조

```
index.html                 진입점 (importmap + 화면 골격)
css/style.css              모바일 세로형 레이아웃 / 카드 스타일
css/fonts.css              동봉 웹폰트 @font-face (tools/fetch-fonts.py 가 생성 — 손으로 고치지 말 것)
fonts/                     웹폰트 woff2 조각 189개 (1.5MB) + OFL.txt
tools/fetch-fonts.py       폰트 꾸러미 생성기 (폰트를 새로 올릴 때만 실행)
js/version.js              ★ 버전 (수정 요청 시 여기부터 올린다)
js/viewport.js             화면 틀 자 (크기 계산은 CSS 가 한다 — 창 좌표가 필요한 곳만 여기)
js/main.js                 컨트롤러 : 화면 전환, 전투 UI, 보상/상점/이벤트/모닥불
js/account.js              계정 : 게스트 / 이메일+6자리 PIN 로그인, uid 기준 Firestore 전적 (전부 REST)
js/legacy.js               v1.3.x 로컬 5계정 잔재를 첫 로그인 때 한 번 들여오기
firestore.rules            Firestore 보안 규칙 (콘솔에 붙여 넣는 용도)
js/audio.js                합성 효과음 + 소리 설정(효과음·배경음 on/off, 음량) 저장
js/bgm.js                  배경음악 : 화면별 곡 지정 · 크로스페이드 · 전투곡 랜덤
audio/                     배경음악 mp3 15곡 (128kbps)
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
  monsterdex.js            몬스터 도감 자료 — 행동 설명을 실제 코드에서 뽑아낸다
  ending.js                캐릭터별 엔딩 문구 (원작 텍스트 아님 — 직접 쓴 것)
  changelog.js             변경 이력 (타이틀 → Revision History)
  keywords.js              키워드 사전 (카드 상세 설명 · 용어집 · 카드 텍스트 색 입히기)
js/engine/
  powers.js                힘·상태이상 정의
  battle.js                전투 엔진 (턴/피해/AI/구체/자세/통찰)
  run.js                   런 진행 : 지도 생성, 보상, 막 전환, 저장
js/ui/
  icons.js                 SVG 글리프 + 아이콘 매핑
  cardview.js              카드 렌더러 + ART 맵 (카드id → 문양 이름)
  cardart.js               카드 문양 224종 (색을 쓰는 여러 겹). '@a' 는 카드 종류 색
js/three/
  scene3d.js               전투 씬 (캐릭터/몬스터/연출)
  title3d.js               타이틀 화면 3D 무대 (캐릭터 4종 + 보스 그림자)
  ending3d.js              엔딩 무대 (빛기둥 아래 캐릭터 하나)
  parts3d.js               3D 부품 사전 (three 를 안 부르는 순수 데이터 — 검사 도구가 쓴다)
  relicshapes.js           유물 117개의 고유 형태
  potionshapes.js          물약 30개의 고유 형태
  items3d.js               유물·물약·골드·체력 3D 아이콘 굽기 (PNG 데이터 URL 캐시)
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

* **화면 안에서 `vw`/`vh` 를 쓰지 말 것** (v1.4.1). 태블릿·컴퓨터에서는 `#app` 이 창보다 작은
  상자라서 `vw` 가 상자를 따라 줄지 않는다 (데스크톱에서 `3.25vw` = 62px → 카드가 터진다).
  대신 `--vw` / `--vh` 를 쓴다 — 상자 너비·높이의 1% 다 (`calc(var(--vw) * 3.25)`).
  상자 크기는 `css/style.css` 의 `--app-w` / `--app-h` 가 `min()` 으로 정한다.
  **js 로 재서 심지 말 것** — 첫 프레임에 전체 너비로 한 번 깜빡인다.
  창 좌표가 필요하면 `js/viewport.js` 의 `appRect()` 로 상자 안에 가둔다
* `jsdelivr` 등 외부 CDN 은 이 환경에서 차단됨 → three.js 는 `vendor/` 로컬 파일 사용 유지
* 웹폰트도 같은 이유로 `fonts/` 에 동봉한다 (v1.3.3). 구글 폰트를 다시 `<link>` 로 부르지 말 것 —
  차단형 `<link>` 는 스크립트 실행까지 붙잡아 게임 시작을 늦춘다
* 새 카드를 추가하면 `js/ui/cardview.js` 의 `ART` 맵에 문양을 매핑하고 **`node tools/check-art.mjs` 를 돌릴 것**.
  같은 계열 안에서 문양이 겹치면 안 된다 — 익숙해지면 글자보다 문양을 먼저 보는데,
  겹치면 문양을 보고 이름을 또 확인해야 해서 문양을 두는 의미가 없다.
  쓸 문양이 없으면 `js/ui/cardart.js` 에 새로 만든다 (100x100 뷰박스, `[path, 색, 불투명도?]` 의 배열)
* 새 힘/상태이상은 `js/engine/powers.js` 에 정의 + `js/ui/icons.js` 의 `POWER_GLYPH` 에 아이콘 매핑
* 유물·물약을 새로 넣으면 `js/three/relicshapes.js` · `potionshapes.js` 에 **고유한 형태**를 만들고
  **`node tools/check-icons.mjs` 를 돌릴 것** (v1.4.0). 147개가 전부 달라야 한다 —
  카드 문양과 같은 이유다. 형태를 돌려 쓰고 색만 바꾸지 말 것.
  `parts3d.js` 는 three.js 를 부르지 않는다 (순수 데이터라야 검사가 Node 에서 돈다).
  Z축 회전은 +Y 를 `(-sinθ, cosθ)` 로 보낸다 — 기울인 막대의 끝을 잡을 때 부호를 틀리기 쉽다
* 몬스터의 행동(`moves`)을 고치거나 새로 만들면 **`node tools/check-monsterdex.mjs` 를 돌릴 것**.
  백과사전 몬스터 탭의 설명은 손으로 쓴 글이 아니라 `run` 을 가짜 전투판에 돌려 받아 적은 것이다
  (`js/data/monsterdex.js`). 가짜 판이 모르는 `B.*` 메서드를 부르면 그 행동의 설명이 비어 버리는데,
  이 검사가 잡아 준다. 설명을 데이터에 따로 적어 두지 말 것 — 수치를 고칠 때 반드시 둘이 갈라진다
* Slay the Spire 는 Mega Crit 저작물 — 비영리 팬 프로젝트로만 유지, 원작 에셋 반입 금지
* **익명 인증 백업을 다시 시도하지 말 것** (v1.3.2 에서 넣었다가 v1.3.4 에서 철회).
  익명 인증의 토큰이 계정 데이터와 같은 localStorage 에 있어, 저장소가 지워지면
  신원도 함께 날아가 새 uid 가 발급된다 → 예전 백업을 영영 못 찾는다.
  v1.3.10 의 이메일+PIN 로그인이 이 문제의 답이다 — 신원이 기기 밖(사용자의 머릿속과
  이메일함)에 있어 다시 로그인하면 같은 uid 가 나온다.
  전적을 남기려면 로그인이 필요하고, 게스트는 전적을 남기지 않는다
* 전적 기능을 건드릴 때 : 게스트(`Account.isGuest()`)에서는 `Records.add` 가 아무것도 하지
  않는다. 게스트에게 전적이 쌓이는 것처럼 보이는 UI 를 만들지 말 것
* 관리자 모드(v1.3.16, 설정 맨 아래 · 숫자 4자리)에서 시작하는 판은 **반드시 `run.cheat = true`**.
  테스트 판이 전적에 섞이면 통계가 망가진다. 새 항목을 더할 때도 이 규칙을 지킬 것.
  그리고 이 숫자는 자물쇠가 아니라 문고리다 — 브라우저 코드라 소스를 열면 보인다.
  **다른 사람의 자료를 보는 기능을 여기에 붙이지 말 것**. 그건 `firestore.rules` 로 막아야 하고,
  지금 규칙은 자기 문서(`users/{uid}`)만 읽게 되어 있다
* 로그인은 **이메일 + 숫자 6자리 PIN**, Firebase Auth REST 만 쓴다 (v1.3.10).
  Firebase SDK 를 다시 들이지 말 것 — 팝업이 필요 없어 REST 로 충분하고,
  SDK 를 쓰면 112KB 가 늘 뿐 아니라 iOS 사파리의 팝업·ITP 문제가 되살아난다
* 입력칸(`.name-input`, `.pin-real`)의 `font-size` 를 16px 아래로 내리지 말 것 —
  iOS 사파리가 입력칸을 누를 때 화면을 확대해 버린다
* PIN 네모(`pinBox()`)는 칸마다 input 을 두지 않는다. 투명한 input 하나가 입력을 받고
  네모는 그려 주기만 한다 — 칸마다 두면 지우기·붙여넣기·자동완성이 깨진다
* **한 이메일 = 한 닉네임.** 계정 하나 안에 프로필을 여러 개 두는 구조를 만들지 말 것 (v1.3.12 에서
  검토 후 접었다). Firebase 가 `이메일 1개 = uid 1개`, `displayName` 도 계정당 하나로 고정해 두어
  따로 막을 장치도 필요 없다. 두 개를 원하는 사람은 다른 이메일로 가입하면 되고, 그러면 전적·
  이어하기·동기화가 저절로 갈라진다. 프로필을 나누면 Firestore 문서 1MiB 안에서 전적 상한을
  쪼개야 하고, "내 전체 승률" 을 볼 수 없게 된다.
  전적을 갈래별로 보고 싶은 것뿐이라면 `computeStats().byChar` 가 이미 캐릭터 4종별로 내주고 있다
* PIN 을 4자리로 줄이지 말 것. Firebase 비밀번호 최소 길이가 6자라 뒤에 뭔가
  덧붙여야 하는데, 그러면 Firebase 재설정 페이지가 정한 새 비밀번호와 어긋나
  "PIN 찾기" 가 깨진다
