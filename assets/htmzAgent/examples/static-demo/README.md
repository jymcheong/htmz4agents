# static-demo

**What it demonstrates:** htmz sidebar navigation with zero infrastructure — pure static `.html` fragment files, no server, no build step; deployable to GitHub Pages as-is.

## Patterns

| Pattern | Name |
|---------|------|
| Pattern 4 | Tab Control with Parameterised Loading (sidebar nav variant, static) |
| Pattern 6 | DOM as State Manager (pre-canned dialog data) |

## Notable techniques

- **No server required** — htmz loads fragment files directly via `file://` or any static HTTP server (`python3 -m http.server`); demonstrates the framework's zero-dependency floor.
- **Pre-canned dialog data** — host-detail dialog injects inline JS object data instead of a `fetch` call; Pattern 6's state node holds the selected host, and the dialog renders from a local data map. Replaces the API layer without changing the fragment contract.
- **Basecoat on CDN** — Tailwind + Basecoat loaded from CDN; no npm, no bundler; the entire app is a folder of `.html` files.
- **Fragment entrance animation** — same CSS `@keyframes` fade-in as the `basecoat` server example; proves the animation technique works identically in static and server contexts.
- **Comparison with `basecoat/`** — identical UX; `basecoat/` adds a Go server, live data, and Pattern 14 watchdog. `static-demo` is the minimal baseline showing htmz's irreducible footprint.

## See also

[PATTERNS.md](../../PATTERNS.md) — full pattern reference (Patterns 1–14).
