# START PROMPT — SSE Task Runner

You are helping run a local htmz demo. Read this file fully, then execute the steps below.

## What this example teaches

htmz pattern: **two-phase fragment swap + SSE streaming**.

Phase 1 — clicking a task button POSTs to `/header` which returns an htmz fragment: the task header + an empty `<pre>` with a spinner. htmz swaps this into `#output-panel`. Phase 2 — the client immediately opens an SSE connection to `/run`, streaming stdout line-by-line into the `<pre>` until a `[DONE]` sentinel closes the stream. Demonstrates how htmz handles the initial UI swap while SSE handles the live data stream — two separate concerns, no overlap.

## Stack

- **Go** — stdlib `net/http`, zero dependencies
- **htmz** — 166-byte iframe+hash DOM routing (Phase 1 header swap)
- **SSE** — `EventSource` streaming (Phase 2 live output)
- **Tasks** — configurable shell commands streamed live

## Prerequisites

```bash
go version   # need Go 1.18+
```

For the `claude` task: set `ANTHROPIC_API_KEY` in `.env` (copy from `.env.example`).

```bash
cp .env.example .env
# edit .env and add your key
```

## Start

```bash
cd examples/sse
nohup go run server.go > /tmp/htmz-sse.log 2>&1 &
```

> Use `nohup` — bare `&` won't survive agent bash sessions.

## Verify

```bash
lsof -i :8750
```

Expected: a process listening on port 8750.

## Open

```bash
open http://localhost:8750
```

Walk through: click **ps aux** → watch the task header snap in via htmz → output streams live line-by-line → try **df -h** or **git log** → try **claude** if API key is set.

## Stop

```bash
kill $(lsof -t -i :8750)
```

## Key files

| File | Role |
|------|------|
| `taskRunner.html` | Shell + task buttons + SSE EventSource client |
| `spawnChat.html` | Alternate chat-style SSE UI |
| `server.go` | `/header` (htmz fragment) + `/run` (SSE stream) |
| `.env.example` | API key template |

## Adding tasks

Edit the `tasks` map in `server.go`:

```go
var tasks = map[string]task{
    "myTask": {display: "my command", args: []string{"echo", "hello world"}},
}
```

Then add a button in `taskRunner.html`:

```html
<button onclick="runTask('myTask')">my command</button>
```
