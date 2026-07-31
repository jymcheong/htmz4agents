# START PROMPT — Card Accordion

You are helping run a local htmz demo. Read this file fully, then execute the steps below.

## What this example teaches

htmz pattern: **fragment swap + skeleton loading + modal API response**.

Three cards load sequentially via htmz iframe swaps — each is a server-rendered HTML fragment. Clicking "Run triage" shows skeleton placeholders while fragments load. Action buttons POST to the server and render the response as an HTML fragment inside a modal. An error simulation route demonstrates Pattern 13 (backend error handling).

## Stack

- **Go** — stdlib `net/http`, zero dependencies
- **htmz** — 166-byte iframe+hash DOM routing
- **Fragments** in `fragments/` — server-rendered HTML injected via htmz swaps
- **API** — `POST /api/rescan`, `POST /api/notify`, `GET /error-sim` → HTML fragments → modal

## Prerequisites

```bash
go version   # need Go 1.18+
```

## Start

```bash
cd examples/card-accordion
nohup go run server.go > /tmp/htmz-card.log 2>&1 &
```

> Use `nohup` — bare `&` won't survive agent bash sessions.

## Verify

```bash
lsof -i :8743
```

Expected: a process listening on port 8743.

## Open

```bash
open http://localhost:8743
```

Walk through: click **Upload scan result** → **Run triage** → watch skeleton cards animate in → expand a card accordion → click Rescan or Notify to see the modal API response → click ⚠ Simulate Backend Error to trigger Pattern 13.

## Stop

```bash
kill $(lsof -t -i :8743)
```

## Key files

| File | Role |
|------|------|
| `index.html` | Shell + htmz iframe + all JS |
| `fragments/` | Server-rendered card fragments |
| `server.go` | Fragment routes + API stubs |
| `static/style.css` | Dark theme styles |
