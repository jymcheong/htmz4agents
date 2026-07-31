# basecoat

**What it demonstrates:** Sidebar navigation with full-page fragment routing, a `showModal()` host-detail dialog, and backend error handling — using Go stdlib + Basecoat component library.

## Patterns

| Pattern | Name |
|---------|------|
| Pattern 4 | Tab Control with Parameterised Loading (sidebar nav variant) |
| Pattern 13 | Backend Error Handling (`#error-zone` pattern) |
| Pattern 14 | Fragment Timeout Watchdog (two-layer error handling) |
| Pattern 1 | Fragment Button → Host Page API Call |

## Notable techniques

- **Sidebar nav as tab control** — clicking nav items swaps the entire `#content-area` via htmz; active state is a CSS class toggled in host-page globals (Pattern 4 generalised to sidebar).
- **`showModal()` dialog** — host-detail view loads via `fetch` + `insertAdjacentHTML` + native `<dialog>.showModal()` — no htmz involved; demonstrates mixing htmz and direct DOM manipulation.
- **CSS fade-in entrance** — fragment wrapper has a `@keyframes` entrance animation; the content area visually transitions on every swap.
- **Go `net/http` zero-dependency server** — `server.go` registers fragment routes before a catch-all `http.FileServer`; fulfils Pattern 14's Layer 1 requirement.
- **Basecoat + Alpine.js auto-init** — Basecoat components in swapped fragments re-initialise via the Alpine MutationObserver (same mechanism as `alpine-toast`).

## See also

[PATTERNS.md](../../PATTERNS.md) — full pattern reference (Patterns 1–14).
