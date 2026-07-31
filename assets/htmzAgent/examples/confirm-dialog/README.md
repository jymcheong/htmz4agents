# confirm-dialog

**What it demonstrates:** Pattern P18 — native `<dialog>.showModal()` as the confirmation gate before a destructive action. No server. Items are removed from the DOM directly on confirm. The dialog lives outside the list container to show the architectural placement rule.

## Patterns

| Pattern | Name |
|---------|------|
| Pattern P18 | Confirmation dialog — `<dialog>.showModal()` before destructive actions |
| Pattern 1 | Fragment Button → Host Page API Call (`openConfirm()` global bridge) |

## Stack

- **htmz** — idle in this static demo; present to show architectural placement
- **Basecoat** — `card`, `btn`, `btn-destructive`, `btn-outline` components
- **Alpine.js** — dialog state (`itemName`, `itemId`); bundled in Basecoat JS
- **No server** — open `index.html` directly in a browser

## Flow

```
Delete button (inside #item-list)
  → openConfirm(id, name)                   [global JS]
  → window.dispatchEvent('open-confirm')     [custom event bridge]
  → Alpine @open-confirm.window              [sets itemName + itemId]
  → dialog.showModal()                       [native <dialog>]
  → Cancel: dialog.close()
  → Confirm: row.remove() + empty-state check + dialog.close()
```

## Notable techniques

- **Dialog outside all swap targets** — `<dialog>` is at body level, never inside `#item-list`. In a server-backed htmz app, htmz could replace the entire list without destroying the dialog element or resetting its Alpine state. The static demo preserves this structural rule.
- **Custom event bridge** — `openConfirm()` dispatches `open-confirm` on `window`; Alpine's `@open-confirm.window` picks it up. Fragment buttons can't reach Alpine component internals directly — the window event is the clean decoupling layer.
- **No loading state** — synchronous DOM removal needs no async feedback. `loading` was only needed for the server round-trip; drop it when the action is instant.
- **Empty-state check** — after `row.remove()`, `confirm()` checks whether any `[data-item-id]` elements remain and replaces the list contents with a message if not.

## Run

Open `index.html` directly in a browser. No server, no build step.

```bash
open index.html
```

Or serve statically for stricter browser security contexts:
```bash
python3 -m http.server 8795
```

---

## Extrapolation Guide: Real Server API

In a real, production server-backed htmz application, you bridge this confirmation dialog to a real backend database deletion in one of two standard ways:

### Option A: Background Fetch (API-style, same as current AJAX)
Keep the DOM removal logic on the client. Just swap out the mock `fetch` inside `confirm()` for a real request:

```javascript
// index.html dialog controller method
confirm() {
  const dialog = document.getElementById('confirm-dialog');
  
  // Real background DELETE call
  fetch('https://api.yoursite.com/projects/' + this.itemId, {
    method: 'DELETE',
    headers: { 'X-CSRF-Token': CSRF_TOKEN }
  })
  .then(res => {
    if (!res.ok) throw new Error('Delete failed on server');
    
    // On success: perform DOM removal locally
    const row = document.querySelector('[data-item-id=\'' + this.itemId + '\']');
    if (row) row.remove();
    
    const list = document.getElementById('item-list');
    if (list && !list.querySelector('[data-item-id]')) {
      list.innerHTML = '<div class=\'empty-msg\'>No items remaining.</div>';
    }
  })
  .catch(err => alert(err.message))
  .finally(() => {
    dialog.close(); // clean close
  });
}
```

---

### Option B: HTML Swap via `htmz` (HTML-first style)
Instead of writing DOM-removal JS, let the server return the updated HTML list fragment, and let `htmz` perform the swap automatically.

1. **The Dialog Confirm Button is a Form or Link targeting `htmz`:**
   ```html
   <!-- Inside the dialog in index.html -->
   <div class="dialog-footer">
     <button class="btn btn-outline" @click="dialog.close()">Cancel</button>
     
     <!-- Targets htmz, requests new list fragment, points target hash to #item-list -->
     <a id="dialog-confirm-btn"
        href=""
        target="htmz"
        class="btn btn-destructive"
        @click="dialog.close()">Delete</a>
   </div>
   ```

2. **The `openConfirm` Custom Event sets the href on the button dynamically:**
   ```javascript
   // Alpine controller inside <dialog>
   @open-confirm.window="
     itemName = $event.detail.name;
     itemId   = $event.detail.id;
     
     // Point the confirm button's href to the real endpoint + target slot hash
     document.getElementById('dialog-confirm-btn').href = '/api/projects/' + itemId + '/delete#item-list';
     
     $el.showModal();
   "
   ```

3. **The Server deletes the item and returns the remaining list fragment:**
   ```go
   // Go production endpoint example
   http.HandleFunc("/api/projects/1/delete", func(w http.ResponseWriter, r *http.Request) {
       // 1. Delete item in database...
       db.DeleteProject(1)
       
       // 2. Query remaining projects...
       projects := db.GetActiveProjects()
       
       // 3. Render the updated list fragment (with the same ID to swap)
       w.Write([]byte(`<div id="item-list">`))
       for _, p := range projects {
           fmt.Fprintf(w, `<div class="item-row" data-item-id="%d">...</div>`, p.Id)
       }
       w.Write([]byte(`</div>`))
   })
   ```

This preserves **pure HTML-first principles**: the client has zero DOM-manipulation JS; the server simply delivers the updated UI state, and the `htmz` hidden frame swaps it seamlessly!

---

## See also

[PATTERNS.md](../../PATTERNS.md) — full pattern reference (Patterns 1–14, P16–P22).

