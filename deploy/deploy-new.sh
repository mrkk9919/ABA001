#!/bin/bash
set -e
cd ~
rm -rf /tmp/newdist && mkdir -p /tmp/newdist
tar -xzf aba-server-dist.tar.gz -C /tmp/newdist
cp -f /tmp/newdist/index.html public_html/index.html
rm -rf public_html/assets && mv /tmp/newdist/assets public_html/assets
cp -f public_html/index.html public_html/cambet89/index.html
rm -rf public_html/cambet89/assets && cp -rf public_html/assets public_html/cambet89/assets
rm -f aba-server-dist.tar.gz
echo "=== deployed files ==="
grep -o 'assets/index-[^"]*' public_html/index.html
grep -o 'BASE_PATH[^,]*' public_html/assets/index-IvNHGedm.js | head -c 120 || true
echo ""
echo "=== source tts check ==="
grep -n "? v : 'km'" ~/aba-mobile-full-project/artifacts/aba-mobile/src/lib/tts.ts
