// serve-public.js — ABA 克隆 · 公网部署入口（部署包版本）
// 静态托管 web/ 前端 + SPA fallback + 代理 /api 到本地网关(5200)
// 用法: node serve-public.js [端口]  （默认 8090）
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2] || 8090);
const BASE = '/';
const ROOT = path.join(__dirname, 'web');
const UPSTREAM = { host: '127.0.0.1', port: Number(process.env.GATEWAY_PORT || 5200) };

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

function proxyApi(req, res) {
  const p = new URL(req.url, 'http://x');
  const proxyReq = http.request(
    { host: UPSTREAM.host, port: UPSTREAM.port, path: p.pathname + p.search, method: req.method, headers: req.headers },
    (pRes) => {
      res.writeHead(pRes.statusCode || 502, pRes.headers);
      pRes.pipe(res);
    }
  );
  proxyReq.on('error', () => {
    res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'gateway offline' }));
  });
  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = decodeURIComponent(url.pathname);

  // 1) API 代理 -> 网关
  if (p === '/api' || p.startsWith('/api/')) return proxyApi(req, res);

  // 2) 根路径 -> 重定向到 BASE (除非 BASE='/' 直接服务 index.html)
  if (p === '/' || p === '') {
    if (BASE !== '/') {
      res.writeHead(302, { location: BASE + '/' });
      return res.end();
    }
  }

  // 3) 剥掉 BASE 前缀
  let rel = p;
  if (p.startsWith(BASE)) rel = p.slice(BASE.length) || '/';
  else rel = '/';

  let file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }

  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');

  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    return fs.createReadStream(file).pipe(res);
  }

  // 4) SPA fallback
  const idx = path.join(ROOT, 'index.html');
  if (fs.existsSync(idx)) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return fs.createReadStream(idx).pipe(res);
  }
  res.writeHead(404); res.end('not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[serve-public] listening on 0.0.0.0:${PORT}  root=${ROOT}  base=${BASE}`);
});
