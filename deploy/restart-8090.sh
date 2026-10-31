#!/bin/bash
export PATH=/home/bdnet/.nvm/versions/node/v20.20.2/bin:$PATH
pkill -f 'node serve-public' 2>/dev/null || true
sleep 1
cd /home/bdnet/aba-deploy
setsid nohup node serve-public.js 8090 >> web.log 2>&1 < /dev/null &
echo "started $!" > /home/bdnet/aba-deploy/start-status.txt
sleep 3
curl -s -m 6 -o /dev/null -w 'root: %{http_code} size=%{size_download}\n' http://127.0.0.1:8090/ >> /home/bdnet/aba-deploy/start-status.txt
curl -s -m 6 -o /dev/null -w 'accounts: %{http_code}\n' http://127.0.0.1:8090/accounts >> /home/bdnet/aba-deploy/start-status.txt
