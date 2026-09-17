#!/usr/bin/env bash
# Firebase Auth SDK 를 단일 ESM 파일로 묶어 vendor/ 에 넣는다.
#
# 구글 로그인 때문에만 필요한 물건이라, 게임은 "구글로 로그인" 을 누르는 순간에만
# 이 파일을 import() 한다. 게스트로 노는 사람은 한 바이트도 받지 않는다.
# 평소에는 돌릴 일이 없고, SDK 를 새 버전으로 올릴 때만 다시 돌린다.
#
#   bash tools/build-firebase.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "→ SDK 내려받는 중"
cd "$WORK"
npm init -y >/dev/null 2>&1
npm i --no-save --silent esbuild @firebase/app @firebase/auth >/dev/null 2>&1

cat > entry.js <<'JS'
// 게임이 실제로 쓰는 것만 내보낸다 — 나머지는 번들에서 빠진다
export { initializeApp } from '@firebase/app';
export {
  getAuth, onAuthStateChanged, signInWithPopup, signInWithRedirect,
  getRedirectResult, signOut, GoogleAuthProvider,
  browserLocalPersistence, setPersistence,
} from '@firebase/auth';
JS

echo "→ 번들 만드는 중"
./node_modules/.bin/esbuild entry.js \
  --bundle --format=esm --platform=browser --target=es2020 \
  --minify --legal-comments=none \
  --define:process.env.NODE_ENV='"production"' \
  --outfile="$ROOT/vendor/firebase-auth.js" 2>&1 | grep -v "^$" || true

RAW=$(wc -c < "$ROOT/vendor/firebase-auth.js")
GZ=$(gzip -c "$ROOT/vendor/firebase-auth.js" | wc -c)
printf '→ vendor/firebase-auth.js  %dKB (gzip %dKB)\n' $((RAW/1024)) $((GZ/1024))
