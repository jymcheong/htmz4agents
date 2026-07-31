#!/usr/bin/env node
const http = require('http');
const { spawn } = require('child_process');
const fs   = require('fs');
const path = require('path');
const { URL } = require('url');

const DIR  = __dirname;
const PORT = 8750;

// Load .env
try {
  for (const line of fs.readFileSync(path.join(DIR, '.env'), 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
} catch {}

const TASKS = {
  'ps':      { display: 'ps aux',                        args: ['ps', 'aux'] },
  'disk':    { display: 'df -h',                         args: ['df', '-h'] },
  'git-log': { display: 'git log · Alfred',              args: ['git', '-C', '/Users/q/github/Alfred', 'log', '--oneline', '-20'] },
  'claude':  { display: 'claude -p · process baselining', args: ['claude', '-p', 'summarise what process baselining means in one paragraph'] },
};

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
};

const stripANSI = s => s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const mime = MIME[path.extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

http.createServer((req, res) => {
  const u        = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = u.pathname;

  // POST /header?task=<name> — htmz fragment: task header + empty trace body
  if (pathname === '/header' && req.method === 'POST') {
    const task = TASKS[u.searchParams.get('task')];
    if (!task) { res.writeHead(400); res.end('unknown task'); return; }
    const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      `<div id="output-panel">` +
        `<div class="task-header">` +
          `<span class="task-name">${esc(task.display)}</span>` +
          `<span class="task-ts">${ts}</span>` +
        `</div>` +
        `<pre id="trace-body" data-task="${esc(u.searchParams.get('task'))}"><span class="spinner"></span></pre>` +
      `</div>`
    );
    return;
  }

  // GET /run?task=<name>[&fail=mid|stall|never] — SSE stream
  if (pathname === '/run' && req.method === 'GET') {
    const name = u.searchParams.get('task');
    const task = TASKS[name];
    if (!task) { res.writeHead(400); res.end('unknown task'); return; }

    const fail = u.searchParams.get('fail'); // mid | stall | never

    res.writeHead(200, {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const send = line => res.write(`data: ${stripANSI(line).replace(/\n/g, ' ')}\n\n`);

    // Heartbeat — every 2s while stream is open; client can detect stall via missed beats
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 2000);

    const done = () => {
      clearInterval(heartbeat);
      res.write('data: [DONE]\n\n');
      res.end();
    };

    // fail=never — server never responds after headers (tests watchdog)
    if (fail === 'never') return;

    const child = spawn(task.args[0], task.args.slice(1), { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    let lineCount = 0;

    child.stdout.on('data', chunk => {
      for (const line of chunk.toString().split('\n')) {
        if (!line) continue;
        // fail=mid — drop connection after 3 lines (partial content)
        if (fail === 'mid' && lineCount >= 3) {
          child.kill();
          clearInterval(heartbeat);
          res.destroy();
          return;
        }
        // fail=stall — emit 3 lines then freeze (connection stays open, no more data)
        if (fail === 'stall' && lineCount >= 3) return;
        send(line);
        lineCount++;
      }
    });

    child.stderr.on('data', chunk => {
      for (const line of chunk.toString().split('\n')) {
        if (line) send('[ERROR] ' + line);
      }
    });

    child.on('close', () => { if (fail !== 'stall') done(); });
    child.on('error', err => { send('[ERROR] ' + err.message); done(); });
    req.on('close', () => { clearInterval(heartbeat); child.kill(); });
    return;
  }

  // Static files
  serveFile(res, pathname === '/' ? path.join(DIR, 'taskRunner.html') : path.join(DIR, pathname));

}).listen(PORT, () => console.log(`listening → http://localhost:${PORT}`));
