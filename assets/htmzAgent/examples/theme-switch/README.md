# Theme Switch

Basecoat + Alpine.js dark/light mode toggle. Standalone — no server, no htmz fragment swap.

## What this demonstrates

**Pattern 5 — Vanilla JS Controls: Drop-in, No Adapter Needed**

Theme switching is a drop-in vanilla JS operation: read/write `document.documentElement.classList` and `localStorage`. Alpine provides the reactive toggle state. htmz is not involved — this is a page-level concern that lives entirely in the host page.

## How it works

1. **Anti-FOUC inline script** (runs before CSS loads): reads `localStorage["bc-theme"]`, falls back to `prefers-color-scheme`, applies `class="dark"` on `<html>` before first paint — no flash.
2. **Alpine `x-data` on `<body>`**: tracks `isDark` boolean; `toggle()` calls `classList.toggle('dark', …)` and writes to `localStorage`.
3. **Basecoat dark mode**: class-based — `class="dark"` on `<html>` activates Tailwind v4 `dark:` variants across all Basecoat components (card, input, btn, badge, checkbox). No custom color vars needed.

## Key constraint

Basecoat's CDN bundle includes Tailwind v4 component styles but **not all layout utilities** (`flex`, `justify-between`, `max-w-*`, etc.). Layout is handled with custom CSS in `<style>`; Basecoat classes cover components only.

## Persistence

`localStorage` key: `bc-theme` — values `"dark"` or `"light"`.  
System preference (`prefers-color-scheme`) used as default when no saved value.

## Patterns reference

See [`../../PATTERNS.md`](../../PATTERNS.md):

- **Pattern 5** — Vanilla JS Controls: Drop-in, No Adapter Needed  
  The theme toggle is a canonical P5 example: zero adapter, direct DOM + storage manipulation, Alpine used only for reactive state binding.
