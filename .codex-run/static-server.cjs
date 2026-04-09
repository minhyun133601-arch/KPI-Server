const http = require('http');
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};
function send(res, status, body, type='text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(body);
}
const server = http.createServer((req, res) => {
  const rawUrl = decodeURIComponent((req.url || '/').split('?')[0]);
  let rel = rawUrl === '/' ? '/KPI.html' : rawUrl;
  const filePath = path.join(root, rel.replace(/^\/+/, ''));
  if (!filePath.startsWith(root)) return send(res, 403, 'forbidden');
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return send(res, 404, 'not found');
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
});
server.listen(8123, '127.0.0.1', () => console.log('static-server http://127.0.0.1:8123'));
