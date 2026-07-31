const express = require('express');
const app = express();
const PORT = 8830;
const PAGE = 8;

const ITEMS = [
  "Make it work, make it right, make it fast.",
  "Premature optimization is the root of all evil.",
  "Simple things should be simple, complex things should be possible.",
  "Code is read more often than it is written.",
  "The best code is no code at all.",
  "Debugging is twice as hard as writing the code in the first place.",
  "Any fool can write code that a computer can understand.",
  "Good code is its own best documentation.",
  "First, solve the problem. Then, write the code.",
  "Talk is cheap. Show me the code.",
  "There are only two hard things in CS: cache invalidation and naming things.",
  "It works on my machine.",
  "Programs must be written for people to read, only incidentally for machines.",
  "Any code you haven't looked at for six months was written by someone else.",
  "Clean code always looks like it was written by someone who cares.",
  "Weeks of coding can save you hours of planning.",
  "The best error message is the one that never shows up.",
  "If debugging removes bugs, then programming must be putting them in.",
  "Good software, like wine, takes time.",
  "The most reliable components are those you don't have to use.",
  "Simplicity is prerequisite for reliability.",
  "Copying and pasting is a design error.",
  "Before software can be reusable it first has to be usable.",
  "Don't comment bad code — rewrite it.",
  "Software testing proves the presence of bugs, not their absence.",
  "The best programs are written when the programmer is supposed to be elsewhere.",
  "Make the easy things easy and the hard things possible.",
  "Measuring progress by lines of code is like measuring flight by aircraft weight.",
  "The function of good software is to make the complex appear simple.",
  "One man's crappy software is another man's full-time job.",
  "There is no place like 127.0.0.1.",
  "You don't have to be great to start, but you have to start to be great.",
  "A ship in harbor is safe, but that's not what ships are for.",
  "Programming isn't about what you know; it's about what you can figure out.",
  "Every great developer got there by solving problems they were unqualified to solve.",
  "You can't have great software without a great team.",
  "Good judgment comes from experience. Experience comes from bad judgment.",
  "The computer is incredibly fast, accurate, and stupid.",
  "Always code as if the person maintaining it is a violent psychopath who knows where you live.",
  "Software is eating the world.",
];

// Returns the #item-list fragment — used by both the full page and /more endpoint.
// Key: always renders from item 0 to `upTo`. Server accumulates; client replaces.
function itemList(upTo) {
  const items = ITEMS.slice(0, upTo);
  const hasMore = upTo < ITEMS.length;
  const nextUpTo = Math.min(upTo + PAGE, ITEMS.length);
  const loadCount = nextUpTo - upTo;

  return `<div id="item-list">
  <p class="list-meta">Showing <strong>${items.length}</strong> of ${ITEMS.length}</p>
  <ol class="items">
    ${items.map(item => `<li>${item}</li>`).join('\n    ')}
  </ol>
  <div class="list-foot">
    ${hasMore
      ? `<a class="load-btn" href="/more?n=${nextUpTo}#item-list" target="htmz">Load ${loadCount} more</a>`
      : `<span class="done-msg">✓ All ${ITEMS.length} loaded</span>`
    }
  </div>
</div>`;
}

// Full page — served once on initial load
function fullPage() {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Load More · htmz P19</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg:       #0d1117;
      --bg-card:  #161b22;
      --border:   #21262d;
      --border-l: #30363d;
      --text:     #e6edf3;
      --muted:    #8b949e;
      --green:    #3fb950;
      --accent:   #58a6ff;
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 3rem 1rem;
      margin: 0;
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      width: 100%;
      max-width: 26rem;
      overflow: hidden;
    }
    .card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
    }
    .card-header h1 {
      font-size: 0.9375rem;
      font-weight: 600;
      margin: 0 0 0.25rem;
    }
    .card-header p {
      font-size: 0.8125rem;
      color: var(--muted);
      margin: 0;
    }

    /* ── Swap target ──────────────────────────────────────────────── */
    #item-list {
      padding: 0 1.5rem;
    }
    .list-meta {
      font-size: 0.75rem;
      color: var(--muted);
      padding: 1rem 0 0.75rem;
      margin: 0;
      border-bottom: 1px solid var(--border);
    }
    .list-meta strong { color: var(--text); }
    .items {
      list-style: none;
      margin: 0;
      padding: 0;
      counter-reset: item;
    }
    .items li {
      counter-increment: item;
      display: flex;
      gap: 0.75rem;
      align-items: baseline;
      padding: 0.7rem 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.875rem;
      line-height: 1.5;
    }
    .items li::before {
      content: counter(item);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.6875rem;
      color: var(--muted);
      min-width: 1.5rem;
      text-align: right;
      flex-shrink: 0;
      padding-top: 0.1em;
    }
    .list-foot {
      padding: 1rem 0 1.25rem;
      display: flex;
      justify-content: center;
    }
    .load-btn {
      display: inline-block;
      padding: 0.5rem 1.25rem;
      background: transparent;
      border: 1px solid var(--border-l);
      border-radius: 6px;
      color: var(--muted);
      font-size: 0.8125rem;
      font-family: inherit;
      cursor: pointer;
      text-decoration: none;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
    }
    .load-btn:hover {
      border-color: var(--muted);
      color: var(--text);
      background: rgba(255,255,255,0.04);
    }
    .done-msg {
      font-size: 0.8125rem;
      color: var(--green);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <h1>Dev Aphorisms</h1>
      <p>htmz load-more — server accumulates, client always replaces</p>
    </div>

    ${itemList(PAGE)}
  </div>

  <!--
    htmz: loads href into hidden iframe.
    Reads hash from iframe URL → CSS selector → replaces that element
    in the host page with the iframe's body content.
  -->
  <iframe hidden name="htmz" onload="setTimeout(()=>{
    const h = contentWindow.location.hash;
    if (!h) return;
    document.querySelector(h)?.replaceWith(...contentWindow.document.body.childNodes);
  },0)"></iframe>
</body>
</html>`;
}

// Full page on first load
app.get('/', (req, res) => {
  res.send(fullPage());
});

// Fragment endpoint — returns #item-list only.
// Always sends items 0..n (accumulated), not just the new batch.
// htmz replaces the old #item-list with this entire div.
app.get('/more', (req, res) => {
  const n = Math.min(parseInt(req.query.n) || PAGE, ITEMS.length);
  res.send(itemList(n));
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
