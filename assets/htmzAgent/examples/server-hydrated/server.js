const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 8840;

// Static JSON — the "data" side of server-hydrated templates.
const ITEMS = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));

// The template: fixed HTML shape, values interpolated per-item at request time.
// This is the whole pattern — a template string + real data, no template engine needed.
function itemCard(item) {
  const stockClass = item.stock === 0 ? 'out' : item.stock < 10 ? 'low' : 'ok';
  const stockLabel = item.stock === 0 ? 'Out of stock' : `${item.stock} in stock`;
  return `<div id="hydrated-card" class="card">
  <div class="card-header">
    <h1>${item.name}</h1>
    <span class="price">${item.price}</span>
  </div>
  <p class="stock ${stockClass}">${stockLabel}</p>
  <p class="note">${item.note}</p>
</div>`;
}

function pickerRow() {
  return ITEMS.map(item =>
    `<a class="pick-btn" href="/hydrate?id=${item.id}#hydrated-card" target="htmz">${item.name}</a>`
  ).join('\n    ');
}

function fullPage() {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Server-Hydrated Template · htmz P23</title>
  <style>
    :root {
      --bg: #0d1117; --bg-card: #161b22; --border: #21262d;
      --text: #e6edf3; --muted: #8b949e; --green: #3fb950; --yellow: #d29922; --red: #f85149;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, sans-serif;
      background: var(--bg); color: var(--text);
      min-height: 100vh; display: flex; flex-direction: column; align-items: center;
      padding: 3rem 1rem; margin: 0; gap: 1.5rem;
    }
    .picker { display: flex; gap: 0.5rem; }
    .pick-btn {
      padding: 0.5rem 1rem; border: 1px solid var(--border); border-radius: 6px;
      color: var(--muted); text-decoration: none; font-size: 0.875rem;
    }
    .pick-btn:hover { color: var(--text); border-color: var(--muted); }
    .card {
      background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px;
      width: 100%; max-width: 22rem; padding: 1.25rem 1.5rem;
    }
    .card-header { display: flex; justify-content: space-between; align-items: baseline; }
    .card-header h1 { font-size: 1rem; margin: 0; }
    .price { font-size: 0.9375rem; color: var(--muted); }
    .stock { font-size: 0.8125rem; margin: 0.75rem 0 0; }
    .stock.ok { color: var(--green); }
    .stock.low { color: var(--yellow); }
    .stock.out { color: var(--red); }
    .note { font-size: 0.8125rem; color: var(--muted); margin: 0.4rem 0 0; }
  </style>
</head>
<body>
  <div class="picker">
    ${pickerRow()}
  </div>

  ${itemCard(ITEMS[0])}

  <iframe hidden name="htmz" onload="setTimeout(()=>{
    const h = contentWindow.location.hash;
    if (!h) return;
    document.querySelector(h)?.replaceWith(...contentWindow.document.body.childNodes);
  },0)"></iframe>
</body>
</html>`;
}

app.get('/', (req, res) => res.send(fullPage()));

// Fragment endpoint — server hydrates the fixed template with one item's real data.
app.get('/hydrate', (req, res) => {
  const item = ITEMS.find(i => i.id === parseInt(req.query.id)) || ITEMS[0];
  res.send(itemCard(item));
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
