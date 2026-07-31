# START PROMPT — Basecoat + htmz Sidebar Nav

You are helping run a local htmz demo. Read this file fully, then execute the steps below.

## What this example teaches

htmz pattern: **sidebar navigation with full-page fragment routing + dialog modal**.

Clicking sidebar nav items swaps the entire content area via htmz — no page reload, no JS router. Each view is a server-rendered HTML fragment. A host detail dialog loads via `fetch` + `insertAdjacentHTML` + `showModal()`. Fragment entrance uses a CSS fade-in animation. Demonstrates how htmz pairs with a component library (Basecoat/Tailwind) without any framework.

## Stack

- **Go** — stdlib `net/http`, zero dependencies
- **htmz** — 166-byte iframe+hash DOM routing
- **Basecoat** — shadcn-style HTML+Tailwind component library (CDN)
- **Fragments** in `fragments/` — dashboard, host list, host detail
- **API** — `GET /api/host-detail?host=` → dialog HTML fragment

## Prerequisites

```bash
go version   # need Go 1.18+
```

## Start

```bash
cd examples/basecoat
nohup go run server.go > /tmp/htmz-basecoat.log 2>&1 &
```

> Use `nohup` — bare `&` won't survive agent bash sessions.

## Verify

```bash
lsof -i :8770
```

Expected: a process listening on port 8770.

## Open

```bash
open http://localhost:8770
```

Walk through: observe dashboard loads automatically → click **Host Inventory** in sidebar → watch content area swap via htmz → click a host row to open the detail dialog.

## Stop

```bash
kill $(lsof -t -i :8770)
```

## Key files

| File | Role |
|------|------|
| `index.html` | Shell + sidebar + htmz iframe + nav JS |
| `fragments/dashboard.html` | Dashboard fragment |
| `fragments/hosts.html` | Host list fragment |
| `fragments/host-detail.html` | Dialog fragment (loaded via fetch) |
| `server.go` | Fragment routes + host-detail API |
