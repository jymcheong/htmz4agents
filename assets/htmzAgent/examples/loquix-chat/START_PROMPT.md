# START PROMPT — Loquix Chat (Claude SSE)

You are helping run a local htmz demo. Read this file fully, then execute the steps below.

## What this example teaches

htmz pattern: **htmz fragment for initial UI load + SSE for live Claude streaming**.

On page load, htmz fetches `/suggestions` and injects a chip panel into `#suggestions-panel`. Clicking a chip (or submitting a prompt) opens a `GET /stream?prompt=` SSE connection — the server spawns `claude -p` and streams stdout token-by-token back to the browser. Demonstrates htmz for structural UI bootstrapping alongside SSE for long-running AI output — no React, no build step.

## Stack

- **Go** — stdlib `net/http`, zero dependencies
- **htmz** — 166-byte iframe+hash DOM routing (suggestion chips fragment)
- **SSE** — `EventSource` streaming Claude CLI output
- **Loquix** — CSS token library (CDN)
- **Claude CLI** — `claude -p "<prompt>"` spawned as subprocess

## Prerequisites

```bash
go version      # need Go 1.18+
claude --version  # need Claude Code CLI installed
```

Set your API key:

```bash
cp .env.example .env
# edit .env — add ANTHROPIC_API_KEY=your-key
```

## Start

```bash
cd examples/loquix-chat
nohup go run server.go > /tmp/htmz-chat.log 2>&1 &
```

> Use `nohup` — bare `&` won't survive agent bash sessions.

## Verify

```bash
lsof -i :8760
```

Expected: a process listening on port 8760.

## Open

```bash
open http://localhost:8760
```

Walk through: observe suggestion chips load via htmz → click a chip to prefill the prompt → submit → watch Claude stream token-by-token into the response area.

## Stop

```bash
kill $(lsof -t -i :8760)
```

## Key files

| File | Role |
|------|------|
| `loquixChat.html` | Shell + SSE EventSource client + chat UI |
| `server.go` | `/suggestions` (htmz fragment) + `/stream` (SSE → claude CLI) |
| `.env.example` | API key template |

## Customising suggestions

Edit the `/suggestions` handler in `server.go` — replace the chip labels and `data-prompt` values with your own prompts.
