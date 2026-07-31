---
name: htmz-frontend
description: Procedural guidance for building assistant-style frontends using htmz + Basecoat. Enforces established patterns for partial swaps, error handling, and state management.
version: 1.0.0
platforms: [macos, linux]
metadata:
  hermes:
    tags: [frontend, htmz, basecoat, ui, development, patterns]
    category: development
---

# Skill: htmz-frontend

## Trigger Phrases
- "build frontend"
- "create htmz UI"
- "wire htmz fragment"
- "add a tab to the UI"
- "implement htmz error handling"
- "frontend work"

## What This Skill Does
Ensures that all htmz-based frontend modifications strictly follow the established patterns in `assets/htmzAgent/PATTERNS.md` to prevent regressions (silent failures, stale DOM references, and unhandled errors).

---

## Procedure

1. **Identify the swap target:** Ensure it has a unique ID and is inside a stable container.
2. **Draft the Fragment:** Use Basecoat components. Ensure no `<script>` tags. Use `onclick` for actions (Pattern 1).
3. **Update index.html Globals:** Add any new `callAPI` or navigation logic.
4. **Implement Backend Handler:** Ensure it returns a partial HTML fragment, not a full page.
5. **Implement Pattern 14 (Robust Swaps):**
    - Drive the swap via `loadFragment(src, slotId)`.
    - Always use `?t=Date.now()` for cache-busting.
    - Set `data-loading` on the slot.
    - Start the 5s watchdog timer.
6. **Verify Error Handling (Pattern 13):**
    - Ensure `res.ok` check in the fetch handler.
    - On error, clear content and target `#modal-error`.

---

## Rules

- **Patterns are mandatory.** Never use `a.click()` or bare `iframe.src` without a timestamp.
- **No scripts in fragments.** All JS must live in `index.html` or a global asset.
- **DOM is the state.** Use `data-*` attributes on `#host-state` for app state (Pattern 6).
- **Backend always returns HTML.** Even for errors, return an HTML fragment with a relevant `id` (Pattern 14, Layer 1).
- **Guard the iframe.** The `onload` handler must check `if (!h) return` to avoid SyntaxErrors on page load.
- **Auto-init Basecoat.** Always call `window.basecoat.initAll()` in the htmz `onload` handler.

## Layer rule

| Layer | Owns |
|-------|------|
| **Server** | Business logic → HTML fragments |
| **Vanilla JS** | System APIs — `fetch`, `dialog`, audio/video, `dispatchEvent` |
| **Alpine.js** | UI state only — classes, open/close, `x-text`; never async |

## Related Resources
- [[../../knowledge/htmz.md]] — Library facts.
- [[../../knowledge/htmz-vanilla-assistant-ui.md]] — Architecture decisions.
- `assets/htmzAgent/PATTERNS.md` — The full source of truth for patterns.
- `skills/basecoat-llms-reference/SKILL.md` — Component class reference.
- `skills/htmz-review/SKILL.md` — **Run before declaring work done.** 10-point quality gate.
