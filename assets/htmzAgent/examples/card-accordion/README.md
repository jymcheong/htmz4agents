# card-accordion

**What it demonstrates:** Sequential skeleton-loaded card grid with POST action buttons that render HTML responses into a modal — the canonical "AVARA triage UI" pattern.

## Patterns

| Pattern | Name |
|---------|------|
| Pattern 9 | Loading Skeleton (shimmer + two-stage swap) |
| Pattern 1 | Fragment Button → Host Page API Call |
| Pattern 2 | Server Returns HTML Fragment (not JSON) |
| Pattern 13 | Backend Error Handling (`#error-zone` pattern) |
| Pattern 14 | Fragment Timeout Watchdog |

## Notable techniques

- **Sequential card loading** — `loadNext()` loads `host-001-card.html`, `host-002-card.html`, `host-003-card.html` 320 ms apart, showing the skeleton shimmer between each; staggered load gives the impression of progressive data arrival.
- **`loadFragment(href, slotId)`** — sets `data-loading` on the slot, drives htmz via `iframe.src` (not `a.click()`), starts the 5 s watchdog timer; the watchdog self-cancels once htmz fires `onload` (Patterns 14).
- **Modal API response** — action buttons call `callAPI(action, host, target)` (Pattern 1); server returns an HTML status fragment (Pattern 2) stapled into `#modal-response`; non-OK responses route to `#modal-error` (Pattern 13).
- **Error simulation route** — `/api/error` returns a 500 with an error fragment; demonstrates the two-zone split (primary target cleared, error zone populated).
- **Go + Node dual servers** — `server.go` (Go stdlib) and `server.js` (Express) both provided; same fragment contract, different runtimes.

## See also

[PATTERNS.md](../../PATTERNS.md) — full pattern reference (Patterns 1–14).
