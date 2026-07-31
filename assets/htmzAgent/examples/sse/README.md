# sse

**What it demonstrates:** Two-phase fragment swap + SSE streaming — htmz handles the initial UI structure swap (Phase 1); SSE handles live stdout streaming (Phase 2). The two concerns never overlap.

## Patterns

| Pattern | Name |
|---------|------|
| Pattern 2 | Server Returns HTML Fragment (Phase 1 header + empty `<pre>`) |
| SSE hybrid | Phase 2 live output via `EventSource` |
| Pattern 1 | Fragment Button → Host Page API Call |

## Notable techniques

- **Phase 1 — htmz header swap** — clicking a task button POSTs to `/header`; server returns an HTML fragment containing the task title + an empty `<pre id="output">` with a spinner; htmz swaps this into `#output-panel`. Zero JS in the fragment.
- **Phase 2 — SSE stream** — immediately after the swap, the host page opens `EventSource('/run?task=…')`; each `data:` event appends a line to the `<pre>`; a `[DONE]` sentinel closes the connection and clears the spinner.
- **`spawnChat.html` vs `taskRunner.html`** — two sub-examples share the same architecture: `taskRunner` runs configurable shell commands; `spawnChat` spawns an AI chat subprocess — same two-phase split, different backend commands.
- **Go + Node dual servers** — `server.go` and `server.js` both provided; identical SSE protocol, different runtimes.
- **Why two phases** — htmz swap gives the user immediate visual feedback (task started, output area ready) before the first SSE byte arrives; SSE fills it live. Combining them in one mechanism would require either polling or losing the instant feedback.

## See also

[PATTERNS.md](../../PATTERNS.md) — full pattern reference (Patterns 1–14).
