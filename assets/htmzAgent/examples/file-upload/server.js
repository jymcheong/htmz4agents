const http = require('http');
const busboy = require('busboy');
const fs = require('fs');
const path = require('path');

const PORT = 8793;
const HOST = '10.246.231.47'; // ZeroTier qLab IP — reachable from iPad on same ZT network
const UPLOAD_DIR = '/tmp/uploads';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain'
]);

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function successFragment(filename, savedSize, mimeType) {
  const ext = path.extname(filename).toUpperCase().replace('.', '') || 'FILE';
  return `<div class="result-fragment result-success" data-outcome="success">
  <div class="result-icon success-icon">&#10003;</div>
  <div class="result-body">
    <div class="result-title">Upload complete</div>
    <div class="result-filename">${esc(filename)}</div>
    <div class="result-meta">
      <span class="badge">${esc(ext)}</span>
      <span>${formatBytes(savedSize)}</span>
    </div>
  </div>
</div>`;
}

function errorFragment(message) {
  return `<div class="result-fragment result-error" data-outcome="error">
  <div class="result-icon error-icon">&#10005;</div>
  <div class="result-body">
    <div class="result-title">Upload failed</div>
    <div class="result-detail">${esc(message)}</div>
  </div>
</div>`;
}

const server = http.createServer((req, res) => {

  // GET / → index.html
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) { res.writeHead(500); res.end('Error loading index.html'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // GET /fragments/:name.html → serve fragment file (for reference)
  const fragMatch = req.url.match(/^\/fragments\/([\w-]+)\.html$/);
  if (req.method === 'GET' && fragMatch) {
    fs.readFile(path.join(__dirname, 'fragments', fragMatch[1] + '.html'), (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // POST /upload → multipart file upload
  if (req.method === 'POST' && req.url === '/upload') {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(errorFragment('Invalid request: expected multipart/form-data.'));
      return;
    }

    let bb;
    try {
      bb = busboy({ headers: req.headers, limits: { fileSize: MAX_FILE_SIZE, files: 1 } });
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(errorFragment('Could not parse upload.'));
      return;
    }

    let originalName = '';
    let detectedType = '';
    let savedPath = '';
    let fileReceived = false;
    let typeRejected = false;
    let sizeExceeded = false;

    bb.on('file', (fieldname, file, info) => {
      fileReceived = true;
      originalName = info.filename || 'upload';
      detectedType = info.mimeType || 'application/octet-stream';

      if (!ALLOWED_TYPES.has(detectedType)) {
        typeRejected = true;
        file.resume(); // drain without saving
        return;
      }

      const safeName = Date.now() + '-' + path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, '_');
      savedPath = path.join(UPLOAD_DIR, safeName);
      const ws = fs.createWriteStream(savedPath);
      ws.on('error', (err) => console.error('[SERVER] write error:', err.message));
      file.pipe(ws);

      file.on('limit', () => {
        sizeExceeded = true;
        file.unpipe(ws); // stop the pipe cleanly before busboy truncates
        ws.end();
        file.resume();   // drain remaining bytes so busboy can finish
        fs.unlink(savedPath, () => {});
        savedPath = '';
      });
    });

    bb.on('finish', () => {
      if (!fileReceived) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(errorFragment('No file received.'));
        return;
      }
      if (typeRejected) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(errorFragment(
          `Type "${detectedType}" not allowed. Accepted: JPEG, PNG, GIF, WebP, PDF, plain text.`
        ));
        return;
      }
      if (sizeExceeded) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(errorFragment('File too large. Maximum allowed size is 5 MB.'));
        return;
      }

      let savedSize = 0;
      try { savedSize = fs.statSync(savedPath).size; } catch (_) {}
      console.log(`[SERVER] Saved: ${savedPath} (${formatBytes(savedSize)})`);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(successFragment(originalName, savedSize, detectedType));
    });

    bb.on('error', (err) => {
      console.error('[SERVER] busboy error:', err.message);
      if (!res.headersSent) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(errorFragment('Upload processing error: ' + err.message));
      }
    });

    req.pipe(bb);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, HOST, () => {
  console.log(`[P20 Server] Running at http://${HOST}:${PORT}/`);
  console.log(`[P20 Server] Upload dir: ${UPLOAD_DIR}`);
  console.log('[P20 Server] Press Ctrl+C to stop.');
});
