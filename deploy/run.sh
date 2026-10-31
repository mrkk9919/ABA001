#!/usr/bin/env bash
# ABA 应用启动脚本
APP=/home/bdnet/aba-deploy
NODE=/home/bdnet/nodevenv/public_html/cambet89/server/22/bin/node

pkill -f "dist/index.mjs" 2>/dev/null
pkill -f "serve-public.js" 2>/dev/null
sleep 1

cd $APP/server
PORT=5200 setsid nohup $NODE --env-file=.env ./dist/index.mjs > $APP/gateway.log 2>&1 < /dev/null &

cd $APP
GATEWAY_PORT=5200 setsid nohup $NODE serve-public.js 8090 > $APP/web.log 2>&1 < /dev/null &

sleep 3
echo "=== gateway ==="
curl -s -m 5 http://127.0.0.1:5200/api/bakong/config; echo
echo "=== web 8090 ==="
curl -s -m 5 -o /dev/null -w '%{http_code} %{size_download}\n' http://127.0.0.1:8090/app/app_17epebn0nyt/
echo "=== api via 8090 ==="
curl -s -m 5 http://127.0.0.1:8090/api/bakong/config; echo
