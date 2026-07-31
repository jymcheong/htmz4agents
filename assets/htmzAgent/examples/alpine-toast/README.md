# alpine-toast

**What it demonstrates:** Alpine.js auto-initialisation on htmz-swapped content — no custom JS wiring needed.

## Patterns

| Pattern | Name |
|---------|------|
| Pattern 11 | Toast Notifications |

## Notable techniques

- **Alpine.js MutationObserver auto-init** — Alpine is loaded once in `index.html`; its `MutationObserver` detects the `x-data` node inserted by htmz and initialises it automatically. Zero manual re-init code.
- **Self-dismissing toast** — `x-init="setTimeout(() => show = false, 3000)"` drives the 3 s auto-dismiss entirely in Alpine declarative syntax.
- **Swap target preservation** — `toast.html` sets `id="toast-area"` on both the outer wrapper and the inner div, so the mount point survives after `outerHTML` replacement and subsequent swaps can re-target it.
- **Card swap proves re-init** — `new-card.html#card-area` swaps the card itself; the new card's `x-data` counter also auto-inits, confirming MutationObserver fires on any inserted subtree.
- **No backend** — pure static files; htmz loads `.html` fragments directly from disk.

## See also

[PATTERNS.md](../../PATTERNS.md) — full pattern reference (Patterns 1–14).
