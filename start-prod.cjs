// 生产环境静态服务器 + API 代理
// 用法: node start-prod.js [端口]
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2] || 8080);
const ROOT = path.join(__dirname, 'dist', 'public');
const UPSTREAM = { host: '127.0.0.1', port: 5200 };

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

  // API 代理
  if (p === '/api' || p.startsWith('/api/')) return proxyApi(req, res);

  let rel = p;
  if (rel === '/' || rel === '') rel = '/index.html';

  let file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }

  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');

  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    return fs.createReadStream(file).pipe(res);
  }

  // SPA fallback
  const idx = path.join(ROOT, 'index.html');
  if (fs.existsSync(idx)) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return fs.createReadStream(idx).pipe(res);
  }
  res.writeHead(404); res.end('not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ABA Mobile App running on http://0.0.0.0:${PORT}`);
  console.log(`Static root: ${ROOT}`);
  console.log(`API proxy:  /api -> http://127.0.0.1:5200`);
});
