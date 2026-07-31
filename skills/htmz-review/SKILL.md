---
name: htmz-review
description: Pre-delivery quality gate for htmz examples and UI work. Run before declaring any htmz fragment, example, or pattern implementation "done".
version: 1.1.0
platforms: [macos, linux]
metadata:
  hermes:
    tags: [frontend, htmz, review, quality, patterns]
    category: development
---

# Skill: htmz-review

## Trigger Phrases
- "review htmz work"
- "check htmz example"
- "htmz quality check"
- before saying "done" on any htmz fragment, example, or pattern

## AUTO-TRIGGER (mandatory)

**Run this checklist silently before declaring any htmz work complete.**
Never say "done", "looks good", or "ready" on htmz work without passing every applicable check below.

---

## Checklist

### 1. Swap target isolation
- [ ] Every `<dialog>`, overlay, toast container, or persistent UI element lives **outside** all htmz swap targets
- [ ] A htmz swap of any list/content region cannot destroy dialog state, Alpine component state, or event listeners
- [ ] Rule: if `replaceWith()` fires on `#target`, does it wipe anything that shouldn't be wiped?

### 2. Cross-boundary communication (Pattern 1)
- [ ] Fragment buttons call globals (e.g. `openConfirm()`) — they never reach Alpine internals directly
- [ ] Globals dispatch `window.dispatchEvent(new CustomEvent(...))` — Alpine uses `@event-name.window`
- [ ] No fragment uses `document.getElementById` to poke state in another component

### 3. Native `<dialog>` for modals
- [ ] Confirmation gates use native `<dialog>` + `.showModal()` / `.close()` — not `<div>` with CSS display toggle
- [ ] `::backdrop` is styled
- [ ] `dialog[open]` has an entry animation
- [ ] Cancel button calls `$el.closest('dialog').close()` — not `hidden` toggle

### 4. htmz fires AFTER confirmation
- [ ] Destructive actions: `<dialog>.showModal()` runs first; htmz fragment load (if any) runs only inside the confirm callback
- [ ] htmz iframe is never the trigger for the dialog — it is the consequence of confirmation
- [ ] Rule: dialog gate → user confirms → then `callAPI()` / `loadFragment()`

### 5. Alpine auto-init
- [ ] htmz `onload` calls `if (window.basecoat) window.basecoat.initAll()` after `replaceWith()`
- [ ] No Alpine component relies on inline `x-init` to compensate for missing auto-init
- [ ] Alpine's MutationObserver handles injected `x-data` — no manual `Alpine.initTree()` calls

### 6. Empty / terminal states
- [ ] After destructive actions, check if the container is now empty and show a message
- [ ] Loading skeleton is removed on both success and error (Pattern 9)
- [ ] 5s watchdog is cleared on both success and error (Pattern 14)

### 7. Fragment hygiene
- [ ] No `<script>` tags inside returned HTML fragments
- [ ] All JS lives in `index.html` globals or a loaded asset file
- [ ] Fragments return partial HTML only — never a full `<!DOCTYPE html>` page

### 8. Error handling
- [ ] Fetch calls check `res.ok` before processing the response
- [ ] On error, an error message is shown — never a silent failure
- [ ] Pattern 13: backend returns an HTML error fragment with an `id` on failure

### 9. Example correctness
- [ ] README flow diagram matches the actual code path
- [ ] Example demonstrates the documented pattern — not a workaround or approximation
- [ ] **Run the bundled `verify` skill against the running example — never a manual walkthrough.** Drives the actual page headless (Playwright/`chromium-cli` under the hood, see bundled `run` skill), captures real screenshots/console output as evidence, probes beyond the happy path. Attach its PASS/FAIL/BLOCKED/SKIP report before declaring the example done. Changed 2026-06-25 — this step previously said "open index.html and manually walk every interaction path," which meant trusting self-report with no captured evidence; `verify` already existed bundled with Claude Code, nothing new needed.

### 10. PATTERNS.md sync
- [ ] If implementing a new pattern: PATTERNS.md TODO checkbox is marked `[x]`
- [ ] Example folder is referenced in the Examples index table
- [ ] If a new pattern is introduced: it is documented with a code snippet in PATTERNS.md

---

## Common failure modes (learned)

| Mistake | Rule violated | Fix |
|---------|--------------|-----|
| Dialog inside `#item-list` (swap wipes it) | Check 1 | Move dialog to body level, outside all swap targets |
| Fragment button reaches Alpine state directly | Check 2 | Global function + `window.dispatchEvent` bridge |
| `<div class="modal">` instead of `<dialog>` | Check 3 | Replace with native `<dialog>` + `.showModal()` |
| htmz fires immediately on delete click | Check 4 | Gate behind `<dialog>` confirm; load fragment inside confirm callback only |
| Basecoat dropdown/accordion dead after swap | Check 5 | Add `window.basecoat.initAll()` to htmz `onload` |
| List deleted to empty with no feedback | Check 6 | Check `querySelector('[data-item-id]')` count after removal |
| **dialog top-left instead of centered** | Check 3 | Tailwind/Basecoat Preflight sets `dialog { margin: 0 }` globally — always add `margin: auto !important` to any `<dialog>` CSS rule |
| **`$el.close()` inside async `.then()`** | Check 3 | `$el` is only valid in synchronous Alpine expression phase — dies in Promise callbacks; capture `const dialog = document.getElementById('...')` before the async call |
| **`this.$el.close()` inside Alpine method** | Check 3 | `this.$el` in Alpine custom methods returns the Alpine Proxy, not `HTMLDialogElement` — Proxy doesn't have `.close()`; always use `document.getElementById` to get the raw DOM node |

---

## Layer rule (memorise this)

| Layer | Owns | Never |
|-------|------|-------|
| **Server** | Business logic → returns HTML fragments | Client state, DOM manipulation |
| **Vanilla JS** | System APIs — `fetch`, `dialog.showModal()/.close()`, audio/video, `dispatchEvent` | Reactive bindings, template logic |
| **Alpine.js** | UI state — active tab classes, open/close menus, `x-text` interpolation | `fetch`, async/await, raw DOM element access |

When something breaks, ask: *is this code in the wrong layer?*

---

## Alpine.js + async invariants (learned the hard way)

These are not obvious from docs. Memorise them.

**`$el` dies in async context.**
`$el`, `$event`, `$dispatch` etc. are only valid during the synchronous Alpine expression evaluation. Inside a `.then()` or `async/await` after an `await`, they are `undefined` or throw. Capture what you need before going async:
```javascript
// BAD — $el is undefined inside .then()
fetch(...).then(() => { $el.close() })

// GOOD — capture reference synchronously first
confirm() {
  const dialog = document.getElementById('confirm-dialog');
  fetch(...).then(() => { dialog.close() })
}
```

**`this.$el` in Alpine methods returns the Proxy, not the DOM element.**
Alpine wraps the component data in a Proxy for reactivity. `this.$el` on that Proxy does not expose native `HTMLDialogElement` methods like `.close()`, `.showModal()`. Always bypass:
```javascript
// BAD
this.$el.close()           // TypeError — Proxy has no .close()

// GOOD
document.getElementById('confirm-dialog').close()
```

**Tailwind/Basecoat Preflight nukes dialog centering.**
Preflight sets `dialog { margin: 0 }` globally. Without override, `<dialog>` appears top-left. Always add:
```css
dialog {
  margin: auto !important;   /* restore browser native centering */
}
```

---

## Related
- `assets/htmzAgent/PATTERNS.md` — authoritative pattern source
- `skills/htmz-frontend/SKILL.md` — build-time guidance
- `assets/htmzAgent/examples/confirm-dialog/` — canonical P18 reference (Gemini)

→ [[CHANGELOG.md]] for full history
