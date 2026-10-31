# Production Deployment (from server 208.116.17.8, cPanel user bdnet)

Production-only code not present in the main Replit workspace:

- `api-server/` — production Node/Express backend (MySQL + Drizzle ORM), runs on port 5200 as `node dist/index.js`. Endpoints: `/api/health`, `/api/accounts`, `/api/accounts/:id`, `/api/transfer`. (`/api/khmer-tts` is served by PHP, not Node.)
- `aba-proxy.php` — Apache reverse proxy from `/api/*` to the Node gateway (port 5200).
- `khmer-tts.php` — Khmer TTS endpoint (`/api/khmer-tts`), PHP implementation.
- `serve-public.js` — production static file server (server version).
- `deploy-new.sh`, `restart-8090.sh`, `run.sh`, `server-start.sh` — deployment / process management scripts.

Secrets (`.env`, Payway `.pem` keys) are intentionally excluded.
