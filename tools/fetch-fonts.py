#!/usr/bin/env python3
"""
웹폰트를 저장소 안으로 가져온다 (fonts/ + css/fonts.css).

구글 폰트 CDN 을 런타임 의존에서 걷어 내기 위한 도구다. 결과물은 저장소에
커밋되므로 평소에는 돌릴 일이 없다. 폰트를 새 버전으로 올릴 때만 다시 돌린다.

    python3 tools/fetch-fonts.py

* IBM Plex Sans KR — 본문용. 400/700 두 굵기만 쓴다 (css/style.css 확인).
  계정 이름은 사용자가 아무 글자나 칠 수 있어 한글 전체 조각을 다 가져온다.
* Kirang Haerang — 타이틀 'cnation Slay the Spire' 전용이라 라틴 조각만 가져온다.

구글이 유니코드 구간별로 잘라 둔 조각을 그대로 옮기므로, 브라우저는 예전처럼
화면에 실제로 쓰인 글자에 해당하는 조각만 내려받는다.
"""
import os, re, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'fonts')
OUT_CSS = os.path.join(ROOT, 'css', 'fonts.css')
# woff2 를 받으려면 최신 브라우저인 척해야 한다
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

SOURCES = [
    ('IBM Plex Sans KR', 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;700&display=swap', 'all'),
    ('Kirang Haerang',   'https://fonts.googleapis.com/css2?family=Kirang+Haerang&display=swap',                'latin'),
]

def get(url, binary=False):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read() if binary else r.read().decode('utf-8')

def is_latin(unicode_range):
    """기본 라틴(영문·숫자·기본 문장부호)을 담고 있는 조각인가"""
    return 'U+0000-00FF' in unicode_range or re.search(r'U\+00[0-9a-f]{2}', unicode_range, re.I) is not None

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    blocks, want = [], {}
    for name, url, keep in SOURCES:
        css = get(url)
        found = re.findall(r'@font-face\s*\{[^}]*\}', css)
        kept = 0
        for blk in found:
            if keep == 'latin':
                ur = re.search(r'unicode-range:\s*([^;]+);', blk)
                if not ur or not is_latin(ur.group(1)):
                    continue
            src = re.search(r'url\((https://fonts\.gstatic\.com/[^)]+)\)', blk)
            if not src:
                continue
            remote = src.group(1)
            local = remote.rsplit('/', 1)[-1]
            want[local] = remote
            blocks.append(blk.replace(remote, f'../fonts/{local}'))
            kept += 1
        print(f'{name:20} 조각 {kept}/{len(found)}개')

    def grab(item):
        local, remote = item
        path = os.path.join(OUT_DIR, local)
        if os.path.exists(path) and os.path.getsize(path):
            return 0
        data = get(remote, binary=True)
        with open(path, 'wb') as f:
            f.write(data)
        return len(data)

    with ThreadPoolExecutor(max_workers=12) as ex:
        got = sum(ex.map(grab, want.items()))

    header = ('/* 저장소 안에 둔 웹폰트. tools/fetch-fonts.py 가 만든다 — 손으로 고치지 말 것.\n'
              '   구글 폰트 CDN 을 런타임에 부르지 않기 위해 조각을 그대로 옮겨 왔다.\n'
              '   IBM Plex Sans KR / Kirang Haerang 모두 SIL Open Font License 1.1 — fonts/OFL.txt 참고 */\n')
    with open(OUT_CSS, 'w', encoding='utf-8') as f:
        f.write(header + '\n'.join(blocks) + '\n')

    total = sum(os.path.getsize(os.path.join(OUT_DIR, n)) for n in want)
    print(f'\nwoff2 {len(want)}개 · {total/1024/1024:.2f} MB (이번에 새로 받은 양 {got/1024/1024:.2f} MB)')
    print(f'css/fonts.css {os.path.getsize(OUT_CSS)/1024:.1f} KB')

if __name__ == '__main__':
    sys.exit(main())
