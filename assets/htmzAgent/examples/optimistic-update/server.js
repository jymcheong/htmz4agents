const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8795;

// Mock database state
let projectLikes = 42;

const server = http.createServer((req, res) => {
  // 1. Serve index.html statically
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html' || req.url === '')) {
    fs.readFile(path.join(__dirname, 'index.html'), 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
    return;
  }

  // 2. Handle POST /api/like
  if (req.method === 'POST' && req.url === '/api/like') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { liked, simulateFailure } = payload;

        // Simulated network latency (800ms)
        setTimeout(() => {
          if (simulateFailure) {
            console.log('[SERVER] Simulated 500 error triggered.');
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error', message: 'Failed to write to database.' }));
            return;
          }

          // Update DB state
          if (liked) {
            projectLikes++;
          } else {
            projectLikes--;
          }
          
          console.log(`[SERVER] Success. Updated project likes count: ${projectLikes}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, likes: projectLikes }));
        }, 800);
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bad Request' }));
      }
    });
    return;
  }

  // 3. Fallback 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`[P22 Server] Running at http://localhost:${PORT}/`);
  console.log(`[P22 Server] Press Ctrl+C to stop.`);
});
