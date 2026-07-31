# polling

**What it demonstrates:** Pattern P21 — `setInterval` + vanilla JS `replaceWith()` for auto-refreshing a DOM region. No server. Polls a public time API every 3 seconds.

## Patterns

| Pattern | Name |
|---------|------|
| Pattern P21 | Polling — `setInterval` drives periodic fragment swap |
| Pattern 1 | Fragment Button → Host Page API (Pause/Resume toggle) |

## Stack

- **htmz** — idle; present for architectural placement
- **Basecoat** — card, button styling
- **Alpine.js** — UI state only (`running`, `count`, play/pause toggle)
- **Vanilla JS** — `fetch`, `replaceWith()`, `setInterval`, `visibilitychange`
- **No server** — open `index.html` directly; polls `timeapi.io`

## Flow

```
init()
  → fetchAndSwap()          [immediate first poll]
  → setInterval(3000)       [start ticker]

every 3s:
  → fetchAndSwap()
    → fetch timeapi.io      [Vanilla JS — System API layer]
    → build div#clock-display
    → replaceWith()         [swap target updated]
  → count++                 [Alpine UI state]

visibilitychange (hidden):
  → clearInterval()         [pause — don't burn API calls in background]

visibilitychange (visible):
  → fetchAndSwap() + setInterval()  [resume]

Pause button (@click):
  → toggle() — clearInterval / setInterval
  → running = true/false    [Alpine drives indicator + button label]
```

## Layer rule applied

| Layer | Responsibility |
|-------|---------------|
| **Vanilla JS** | `fetch`, `replaceWith()`, `setInterval`, `visibilitychange` |
| **Alpine.js** | `running` indicator, `count` display, Pause/Resume button state |
| **Server** | none — public API |

## Notable techniques

- **`#clock-display` is a vanilla DOM target** — lives outside Alpine's `x-data` div; Alpine never touches it
- **`setInterval` inside Alpine** — interval is UI-state-coupled (pause/resume), so lifecycle lives where the state lives; the actual fetch is delegated to vanilla `fetchAndSwap()`
- **Error state** — catch block builds an error fragment with the same `id`, so `replaceWith()` always has a valid target for the next poll
- **`?t=Date.now()` not needed** — timeapi.io is inherently non-cacheable (live data); cache-busting only matters for static fragment files

## Run

```bash
open index.html
# or serve for stricter CORS contexts:
python3 -m http.server 8800
```

## See also

[PATTERNS.md](../../PATTERNS.md) — full pattern reference.
