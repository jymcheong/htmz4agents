const express = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const app = express();
const args = process.argv.slice(2);
const portArg = args.find(a => a.startsWith('--port=')) || args[args.indexOf('--port') + 1];
const PORT = parseInt(portArg) || parseInt(process.env.PORT) || 8791;
const hostArg = args.find(a => a.startsWith('--host=')) || args[args.indexOf('--host') + 1];
// Must be explicit — no 0.0.0.0 fallback. This process now serves an unauthenticated
// /raw/* passthrough over the whole repo; binding all interfaces would expose it on
// any non-ZT network this VM happens to have (confirmed live: eth0 in addition to ZT).
const HOST = hostArg || process.env.HOST;
if (!HOST) {
  console.error('FATAL: --host or HOST env var required (bind to this VM\'s ZT IP, never 0.0.0.0). See skills/preview/SKILL.md.');
  process.exit(1);
}
const REPO_ROOT = process.env.REPO_ROOT || path.join(__dirname, '..', '..');

// Enable standard styling for parsed markdown
marked.setOptions({
  gfm: true,
  breaks: true
});

// Helper to recursively list markdown files and directories
function getFileTree(dir, baseDir = REPO_ROOT) {
  const result = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    const relPath = path.relative(baseDir, filePath);
    
    // Ignore system / large folders
    if (file.startsWith('.') && file !== '.agents') return;
    if (['node_modules', 'chrome-headless-shell', 'filebrowser.db', 'scratch'].includes(file)) return;
    
    if (stat.isDirectory()) {
      const children = getFileTree(filePath, baseDir);
      if (children.length > 0) {
        result.push({
          name: file,
          type: 'directory',
          path: relPath,
          children: children.sort((a, b) => b.type.localeCompare(a.type) || a.name.localeCompare(b.name))
        });
      }
    } else if (file.endsWith('.md') || file === '.gitignore' || file === 'package.json') {
      result.push({
        name: file,
        type: 'file',
        path: relPath
      });
    }
  });
  
  return result.sort((a, b) => b.type.localeCompare(a.type) || a.name.localeCompare(b.name));
}

// Custom wiki link resolver
function resolveWikiLinks(html) {
  // matches [[target]] or [[target|alias]]
  return html.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, target, alias) => {
    const linkText = alias || target;
    let url = target;
    if (!url.endsWith('.md') && !url.includes('.')) {
      url += '.md';
    }
    return `<a class="wiki-link" href="${url}">${linkText}</a>`;
  });
}


// Serve main page shell
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API to get file tree
app.get('/api/tree', (req, res) => {
  try {
    const tree = getFileTree(REPO_ROOT);
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to view specific markdown file as htmz fragment
app.get('/view/*', (req, res) => {
  const relPath = req.params[0];
  let fullPath = path.join(REPO_ROOT, relPath);
  let resolvedRelPath = relPath;
  
  if (!fs.existsSync(fullPath) && fs.existsSync(fullPath + '.md')) {
    fullPath += '.md';
    resolvedRelPath += '.md';
  }
  
  if (!fs.existsSync(fullPath)) {
    return res.status(404).send(`<div id="main-slot" class="error">File not found: ${relPath}</div>`);
  }
  
  // If NOT requested via htmz iframe, redirect to main page with ?page query parameter for deep-linking
  const isHtmz = req.query.htmz === 'true' || req.headers['sec-fetch-dest'] === 'iframe';
  if (!isHtmz) {
    return res.redirect(`/?page=${resolvedRelPath}`);
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    let htmlContent = '';
    if (resolvedRelPath.endsWith('.md')) {
      // Parse markdown to HTML
      const rawHtml = marked.parse(content);
      // Resolve wiki links to htmz-compatible relative links
      htmlContent = resolveWikiLinks(rawHtml);
    } else {
      // Serve code files as plain preformatted text
      htmlContent = `<pre><code>${escapeHtml(content)}</code></pre>`;
    }
    
    // Return wrapped in target slot for htmz replacement
    res.send(`
      <div id="main-slot" class="markdown-body">
        <div class="file-header">
          <span class="file-path">${resolvedRelPath}</span>
        </div>
        <div class="content">
          ${htmlContent}
        </div>
      </div>
    `);
  } catch (err) {
    res.status(500).send(`<div id="main-slot" class="error">Error reading file: ${err.message}</div>`);
  }
});

// Parse KANBAN.md into bucketed card lists
function parseKanban(content) {
  const cols = { new: [], doing: [], done: [] };

  const topSections = content.split(/\n(?=## )/);
  for (const section of topSections) {
    const hdr = section.match(/^## (.+)/);
    if (!hdr) continue;
    const secName = hdr[1].trim().toLowerCase();
    const inActive = secName === 'active';
    const inDone   = secName === 'done';
    if (!inActive && !inDone) continue;

    const items = section.split(/\n(?=### )/);
    for (const item of items.slice(1)) {
      const titleLine = item.match(/^### (.+)/);
      if (!titleLine) continue;
      const rawTitle = titleLine[1].trim();
      const star  = rawTitle.startsWith('⭐');
      const title = rawTitle.replace(/^⭐\s*/, '');

      const statusRaw = (item.match(/\*\*Status:\*\*\s*([^\n]+)/) || [])[1] || (inDone ? 'done' : 'new');
      const statusKey = inDone ? 'done'
                      : statusRaw.toLowerCase().startsWith('doing') ? 'doing'
                      : statusRaw.toLowerCase().startsWith('done') ? 'done'
                      : 'new';

      const goal   = ((item.match(/\*\*Goal:\*\*\s*([^\n]+)/) || [])[1] || '').trim();
      const tracks = ((item.match(/\*\*Tracks:\*\*\s*`([^`]+)`/) || [])[1] || '').trim();
      const added  = ((item.match(/\*\*Added:\*\*\s*([^\n|]+)/) || [])[1] || '').trim();

      cols[statusKey].push({ title, star, goal, tracks, added, statusRaw: statusRaw.trim() });
    }
  }
  return cols;
}

function renderKanban(cols) {
  const statusMeta = {
    new:   { label: 'NEW',   bg: '#1d4ed8', badge: '#dbeafe', text: '#1e3a8a' },
    doing: { label: 'DOING', bg: '#b45309', badge: '#fef3c7', text: '#78350f' },
    done:  { label: 'DONE',  bg: '#15803d', badge: '#dcfce7', text: '#14532d' },
  };

  function card(item, status) {
    const m = statusMeta[status];
    const goalHtml = item.goal
      ? `<p class="card-goal">${escapeHtml(item.goal.length > 120 ? item.goal.slice(0, 117) + '…' : item.goal)}</p>`
      : '';
    const tracksHtml = item.tracks
      ? `<span class="card-tracks" title="${escapeHtml(item.tracks)}">${escapeHtml(item.tracks.split('/').pop())}</span>`
      : '';
    const starHtml = item.star ? '<span class="card-star">⭐</span>' : '';
    return `
      <div class="card">
        <div class="card-header">
          ${starHtml}<span class="card-title">${escapeHtml(item.title)}</span>
        </div>
        ${goalHtml}
        ${tracksHtml}
      </div>`;
  }

  const cols3 = ['doing', 'new', 'done'].map(k => {
    const m = statusMeta[k];
    const cards = cols[k].map(c => card(c, k)).join('');
    return `
      <div class="col" id="col-${k}">
        <div class="col-header" style="background:${m.bg}">
          ${m.label} <span class="col-count">${cols[k].length}</span>
        </div>
        <div class="col-body">${cards || '<p class="empty">—</p>'}</div>
      </div>`;
  }).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>KANBAN</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;padding:1.5rem}
h1{font-size:1.1rem;font-weight:600;color:#94a3b8;margin-bottom:1.25rem;letter-spacing:.05em}
.board{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
@media(max-width:900px){.board{grid-template-columns:repeat(2,1fr)}}
@media(max-width:580px){.board{grid-template-columns:1fr}}
.col{display:flex;flex-direction:column;background:#1e293b;border-radius:.75rem;overflow:hidden}
.col-header{display:flex;align-items:center;justify-content:space-between;padding:.6rem 1rem;font-size:.75rem;font-weight:700;letter-spacing:.1em;color:#fff}
.col-count{background:rgba(255,255,255,.25);border-radius:9999px;padding:.1rem .5rem;font-size:.7rem}
.col-body{padding:.75rem;display:flex;flex-direction:column;gap:.6rem;flex:1}
.empty{color:#475569;font-size:.8rem;text-align:center;padding:.5rem}
.card{background:#0f172a;border:1px solid #334155;border-radius:.5rem;padding:.75rem;display:flex;flex-direction:column;gap:.4rem}
.card-header{display:flex;align-items:flex-start;gap:.35rem}
.card-star{font-size:.85rem;flex-shrink:0;line-height:1.4}
.card-title{font-size:.82rem;font-weight:600;line-height:1.4;color:#e2e8f0}
.card-goal{font-size:.73rem;color:#94a3b8;line-height:1.45}
.card-tracks{display:inline-block;font-size:.65rem;background:#1e293b;border:1px solid #334155;border-radius:.25rem;padding:.15rem .4rem;color:#64748b;font-family:monospace;margin-top:.15rem;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.float-nav{display:none;position:fixed;bottom:1.25rem;left:50%;transform:translateX(-50%);background:rgba(15,23,42,.7);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.08);border-radius:9999px;padding:.35rem .5rem;gap:.35rem;z-index:100}
.float-nav a{color:rgba(226,232,240,.45);font-size:.7rem;font-weight:600;letter-spacing:.08em;text-decoration:none;padding:.3rem .75rem;border-radius:9999px;transition:background .15s,color .15s}
.float-nav a:hover{background:rgba(255,255,255,.08);color:#e2e8f0}
@media(max-width:580px){.float-nav{display:flex}}
</style>
</head>
<body>
<h1>KANBAN</h1>
<div class="board">${cols3}</div>
<nav class="float-nav">
  <a href="#col-doing">DOING</a>
  <a href="#col-new">NEW</a>
  <a href="#col-done">DONE</a>
</nav>
</body>
</html>`;
}

// Live Kanban board — parses KANBAN.md on each request
app.get('/kanban', (req, res) => {
  const kanbanPath = path.join(REPO_ROOT, 'KANBAN.md');
  if (!fs.existsSync(kanbanPath)) return res.status(404).send('KANBAN.md not found');
  try {
    const cols = parseKanban(fs.readFileSync(kanbanPath, 'utf-8'));
    res.send(renderKanban(cols));
  } catch (err) {
    res.status(500).send(`Kanban parse error: ${escapeHtml(err.message)}`);
  }
});

// Raw passthrough for non-markdown artifacts (images, HTML decks, etc.) —
// res.sendFile sets Content-Type from the extension, so the browser renders
// an image as an image and an .html file as real HTML, not escaped text.
app.get('/raw/*', (req, res) => {
  const relPath = req.params[0];
  const fullPath = path.join(REPO_ROOT, relPath);

  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    return res.status(404).send(`File not found: ${relPath}`);
  }

  res.sendFile(fullPath);
});

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

app.listen(PORT, HOST, () => {
  console.log(`htmz Wiki Viewer running on ${HOST}:${PORT}`);
});
