#!/usr/bin/env bash
# ABA 克隆 · 一键启动（VPS / Linux 服务器）
# 用法: ./start.sh [web端口]   （默认 web=8090, 网关=5200）
set -e
cd "$(dirname "$0")"

WEB_PORT="${1:-8090}"
GATEWAY_PORT="${2:-5200}"

echo "==> 启动网关 (:$GATEWAY_PORT) ..."
(cd server && PORT=$GATEWAY_PORT nohup node --env-file=.env --enable-source-maps ./dist/index.mjs > ../gateway.log 2>&1 &)
echo "==> 启动前端+API 代理 (:$WEB_PORT) ..."
GATEWAY_PORT=$GATEWAY_PORT nohup node serve-public.js $WEB_PORT > web.log 2>&1 &

sleep 2
echo ""
echo "网关:  http://127.0.0.1:$GATEWAY_PORT/api/bakong/config"
echo "前端:  http://127.0.0.1:$WEB_PORT/app/app_17epebn0nyt/"
echo "日志:  gateway.log / web.log"
echo "停止:  pkill -f 'dist/index.mjs'; pkill -f serve-public.js"
