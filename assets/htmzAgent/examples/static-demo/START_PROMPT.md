# START PROMPT — Static htmz Demo

You are helping run a local htmz demo. Read this file fully, then execute the steps below.

## What this example teaches

htmz pattern: **sidebar navigation with fragment routing — no server, no build step**.

Clicking sidebar nav items swaps the entire content area via htmz using real static HTML fragment files. A host detail dialog injects pre-canned HTML inline via JS. Demonstrates that htmz works with plain `.html` files served statically — deployable to GitHub Pages with zero infrastructure.

## Stack

- **htmz** — 166-byte iframe+hash DOM routing
- **Basecoat** — shadcn-style HTML+Tailwind component library (CDN)
- **Vanilla JS** — pre-canned dialog data replaces the API layer
- **No server** — pure static files

## Prerequisites

Any HTTP server. Python ships with one:

```bash
python3 --version   # need Python 3.x
```

> **Why not `file://`?** Browsers block iframe cross-origin reads on `file://` URLs.
> A local HTTP server resolves this with one command — no install needed.

## Start

```bash
cd examples/static-demo
python3 -m http.server 8780
```

## Verify

```bash
lsof -i :8780
```

Expected: a process listening on port 8780.

## Open

```bash
open http://localhost:8780
```

Walk through:
- Dashboard loads via htmz fragment swap on page load
- Click **Host Inventory** in sidebar → content area swaps via htmz (watch network tab: only `fragments/hosts.html` is fetched)
- Click **Details** on any of the first three rows → modal opens with pre-canned data (no API call)
- Click **Inform Owner** or **Rescan Asset** → toast notification fires (pre-canned JS response)

## Stop

```bash
kill $(lsof -t -i :8780)
```

## Key files

| File | Role |
|------|------|
| `index.html` | Shell + sidebar + htmz iframe + pre-canned host detail data |
| `fragments/dashboard.html` | Priority threats view (accordion cards) |
| `fragments/hosts.html` | Host inventory table |

## GitHub Pages

Drop the folder into a repo, enable Pages → works instantly. No server. No config.

```
your-repo/
  index.html
  fragments/
    dashboard.html
    hosts.html
```

## Extending

Add a new view:
1. Create `fragments/my-view.html` with `<div id="content-area" ...>` as root element
2. Add to `NAV_MAP` in `index.html`: `myView: 'fragments/my-view.html'`
3. Add a nav button: `<button ... onclick="navigateTo('myView')">My View</button>`

Add a new pre-canned detail:
- Add an entry to `HOST_DETAIL` in `index.html` with the dialog HTML string
- Call `openHostDetail('YOUR-KEY')` from any button
