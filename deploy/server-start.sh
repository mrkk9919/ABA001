#!/bin/bash
export PATH=/home/bdnet/.nvm/versions/node/v20.20.2/bin:$PATH
cd ~/aba-deploy
cp serve-public.js serve-public.js.bak2-20261018
sed -i "s|const BASE = '/app/app_17epebn0nyt';|const BASE = '/';|" serve-public.js
cp -f ~/public_html/index.html web/index.html
rm -rf web/assets
cp -rf ~/public_html/assets web/assets
pkill -f serve-public.js 2>/dev/null || true
sleep 1
nohup node serve-public.js 8090 >> web.log 2>&1 &
echo "started pid $!" > start-status.txt
sleep 3
curl -s -m 6 -o /dev/null -w 'self root: %{http_code}\n' http://127.0.0.1:8090/ >> start-status.txt
curl -s -m 6 -o /dev/null -w 'self js: %{http_code}\n' http://127.0.0.1:8090/assets/index-DxAE2XlI.js >> start-status.txt
grep BASE serve-public.js | head -1 >> start-status.txt
