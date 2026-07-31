# loquix-chat

**What it demonstrates:** htmz for structural UI bootstrapping (suggestion chips) + SSE `EventSource` for live Claude CLI token streaming — the canonical htmz/SSE split.

## Patterns

| Pattern | Name |
|---------|------|
| Pattern 2 | Server Returns HTML Fragment (suggestion chips panel) |
| SSE hybrid | htmz handles structure; `EventSource` handles live data |

## Notable techniques

- **htmz bootstrap only** — on page load, htmz fetches `/suggestions` and injects a chip panel into `#suggestions-panel`; this is the only htmz swap in the app. All subsequent UI updates are pure DOM manipulation driven by the SSE stream.
- **SSE streaming** — clicking a chip or submitting a prompt opens `GET /stream?prompt=…`; Go server spawns `claude -p "<prompt>"` as a subprocess and pipes stdout token-by-token as `data:` SSE events; the browser appends each token into the `<pre>` output element.
- **Architecture split rationale** — htmz is incompatible with streaming (waits for full HTML before swapping); SSE is incompatible with structural routing (no DOM targeting); combining them gives each concern its best tool with zero overlap.
- **Loquix CSS** — token-based CSS library (CDN) for the chat aesthetic; no Tailwind, no Basecoat — demonstrates htmz works with any CSS layer.
- **Go stdlib, zero deps** — `server.go` uses only `net/http`; `claude` CLI is the only external binary dependency.

## See also

[PATTERNS.md](../../PATTERNS.md) — full pattern reference (Patterns 1–14).
