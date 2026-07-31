# optimistic-update

**What it demonstrates:** Pattern P22 — Optimistic updates. When the user interacts (likes the card), the DOM count and color are updated instantly without waiting for a server round-trip. If the network call subsequently fails (simulated via checkbox), the DOM is cleanly rolled back to its original state using a saved `outerHTML` backup.

## Patterns

| Pattern | Name |
|---------|------|
| Pattern P22 | Optimistic update — save `el.outerHTML` before action, revert on fetch failure |

## Stack

- **htmz** — idle in this static demo; shows placement logic
- **Basecoat** — card, text, checkbox styling
- **Vanilla JS** — state mutation, fetch handling, DOM backup/rollback

## Flow

```
Click Like Button
  → Save outerHTML backup in memory               [fallbackHTML = btn.outerHTML]
  → Apply instant UI state changes                 [count incremented, color set]
  → Trigger pop micro-animation                    [pop-active]
  → Fire fetch request to server                   [simulateAPI()]
  → Success: Maintain optimistic state
  → Failure:
    → Trigger shake animation                      [shake-active]
    → Revert DOM element to backup                 [btn.replaceWith(restoredBtn)]
    → Flash red alert outline                      [rollback-flash]
```

## Notable techniques

- **DOM outerHTML as local state backup** — Instead of complex virtual DOM tracking, state stores, or manual reverse-mutations (decrementing counts, removing classes), standard `el.outerHTML` captures the exact DOM slice before modification. Reverting is a simple, synchronous `el.replaceWith(backup)`.
- **Double click prevention** — `pointer-events: none` is set on the button during the network trip to prevent race conditions from double clicks.
- **Micro-feedback animation chain** — Click pops. Success keeps state silent. Failure shakes, reverts, and flashes red on border, visually explaining the rollback.

## Run

### Option A: Static File (Offline Simulation)
Open `index.html` directly in a browser (double-click or via CLI):
```bash
open index.html
```
The page automatically detects `file://` protocol and runs a simulated offline promise network loop.

### Option B: Real Node.js Server (Production Demo)
Run the zero-dependency, native Node.js HTTP server:
```bash
node server.js
```
Open [http://localhost:8795/](http://localhost:8795/) in your browser. This establishes real, live AJAX requests and updates database state on the server!

---

## Extrapolation Guide: Real Server API

In a real, production server-backed app, you bridge this static demo to your actual backend using two simple steps:

### 1. The Production `fetch` Call
Replace `simulateAPI(shouldFail)` with a real network call to your backend router (Go, Node, Python, etc.):

```javascript
// Production implementation
function toggleLike(btn) {
  const fallbackHTML = btn.outerHTML;
  const isLiked = btn.classList.contains('liked');
  
  // 1. Optimistic toggle (instantly count up + change colors)
  // ... [same instant DOM changes as the demo] ...

  // 2. Real async POST/DELETE to your backend API
  fetch('/api/projects/1/like', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': CSRF_TOKEN // security standard (P12)
    },
    body: JSON.stringify({ active: !isLiked })
  })
  .then(res => {
    if (!res.ok) throw new Error('Server returned error status: ' + res.status);
    console.log('Update confirmed by server.');
  })
  .catch(err => {
    console.error('Update failed! Triggering P22 rollback...', err);
    
    // 3. Rollback triggers immediately on server rejection or network loss
    btn.classList.add('shake-active');
    setTimeout(() => {
      const parser = document.createElement('div');
      parser.innerHTML = fallbackHTML;
      btn.replaceWith(parser.firstElementChild);
    }, 300);
  });
}
```

### 2. The Server Endpoint
Your backend endpoint simply handles the database increment/decrement and returns a standard status code:

```go
// Go production endpoint example
http.HandleFunc("/api/projects/1/like", func(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }
    
    // Perform database increment...
    err := db.ToggleLike(projectId, userId)
    if err != nil {
        // Trigger P22 rollback on client by returning 500
        http.Error(w, "Database error", http.StatusInternalServerError)
        return
    }
    
    // 200 OK confirms optimistic state on client
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"success":true}`))
})
```

### Why we bypass `htmz` iframe for this pattern:
Optimistic updates require **zero-latency** rendering. We cannot wait for a hidden iframe to navigate and load a server response before updating the button state. 

Therefore, **P22 is a Hybrid Pattern**:
* **UI State:** Toggled instantly on the client via Vanilla JS.
* **Synchronization:** Handled in the background via standard `fetch()`.
* **Rollback:** Standard DOM replacement (`outerHTML`) preserves pure client-side recovery.

