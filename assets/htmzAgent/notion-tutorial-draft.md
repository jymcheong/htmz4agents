# The Backend Developer's Guide to interactive UIs (Without React)

If you are a backend engineer, you have probably felt the pressure to build your next tool or internal dashboard as a React Single Page Application (SPA). And you've probably regretted it the moment you had to configure Webpack, debug hook dependency arrays, or watch `node_modules` consume gigabytes of disk space.

This guide is about a different path: building fast, interactive, SPA-like user interfaces using **pure HTML** and your favorite backend language.

---

## 1. The 166-Byte Solution: htmz

You don't need a 14KB library like HTMX, and you definitely don't need a megabyte of React runtime to swap a piece of HTML on a page. 

`htmz` is a micro-framework that fits in **166 bytes**. It uses a browser capability you already know: **iframes and URL hashes**.

### How It Works (Without JS)

1. You create a hidden iframe named `htmz`:
   ```html
   <iframe hidden name="htmz"></iframe>
   ```
2. You target your links or forms to this iframe:
   ```html
   <a href="/fragments/stats.html#dashboard-panel" target="htmz">Load Stats</a>
   ```
3. When the user clicks the link, the browser fetches the page inside the hidden iframe.
4. `htmz` intercepts the load, reads the hash `#dashboard-panel`, extracts the element with that ID from the iframe, and swaps it into the main page.

No Virtual DOM. No state synchronization. The backend simply renders HTML, and the browser displays it.

---

## 2. The Agentic Inversion: Let the Agent Deal with the DOM

The oldest argument against vanilla HTML/JS was the **tedium**: writing repetitive DOM query selectors, managing event listeners, and styling raw elements by hand. 

But in the agentic era, **you don't write the HTML or JavaScript.**

*   **The Agent is Your Frontend Developer:** You write the backend data endpoints and define the target swap structures. A competent coding agent (like Claude or Gemini) writes 100% of the Alpine.js triggers, tailwind class styling, and vanilla iframe routing details.
*   **Micro-Abstractions Are Obsolete:** Frameworks like React were built to hide DOM complexity from human developers. Since AI agents write DOM manipulation and HTML templates effortlessly, we can discard heavy abstractions and return to the lightweight, native web.
*   **Inverted Workflow:**
    1. You define the data endpoint in your Go/Python app.
    2. You describe the interactive UI feature to your AI coding agent.
    3. The agent writes the HTML/CSS/JS fragment directly.
    4. Your app serves the file, and `htmz` swaps it.

---

## 3. Why Backend Engineers Love This

*   **Zero Frontend Build Step:** No node, npm, Babel, or Vite. You serve static assets and compile a single binary in Go, Rust, or Python.
*   **Use Your Backend Template Engines:** Build pages using Go `html/template`, Jinja2, askama, or Tera. You get type safety, loops, and logic on the server.
*   **The Backend is the Single Source of Truth:** You don't have to keep a database, an API, and a Redux store in sync. The backend database directly dictates what HTML is rendered.
*   **Zero "Wrapper Tax":** In React, using a chart or date-picker library requires a React wrapper package that often goes out of date. With this stack, you use standard, vanilla JS libraries (Chart.js, Flatpickr) directly on the DOM.

---

## 4. The Architecture Stack

To build a production-ready system, combine these four pieces:

```
┌────────────────────────────────────────────────────────┐
│                      HTML Shell                        │
│  ┌──────────────────────┐    ┌──────────────────────┐  │
│  │   Layout & Swaps     │    │   Interactive UI     │  │
│  │     (htmz.js)        │    │    (Basecoat/Alpine) │  │
│  └──────────┬───────────┘    └──────────────────────┘  │
└─────────────┼──────────────────────────────────────────┘
              │ HTML fragments / Event stream
              ▼
┌────────────────────────────────────────────────────────┐
│                      Your Backend                      │
│     (Go templates / Python Jinja / Rust Askama)        │
└────────────────────────────────────────────────────────┘
```

1.  **htmz (166 bytes):** Handles page layouts, navigation tabs, and fragment swaps.
2.  **Basecoat (HTML + Tailwind + Alpine.js):** A shadcn/ui-style library providing ready-made UI components (buttons, dialogs, accordions).
    *   *Webcomponent-Style Organization:* Keeps HTML markup, CSS classes, and Alpine.js interactive behavior together in cohesive, copy-pasteable blocks without the React bloat.
    *   *Zero-Friction Injections:* Alpine.js uses `MutationObserver` to watch the DOM. Newly injected Basecoat components from `htmz` swaps are automatically initialized. You never write manual event-rebinding logic.
3.  **SSE (Server-Sent Events):** Handles real-time progress bars or token streaming (e.g. LLM outputs) natively via the browser's `EventSource` API.

---

## 5. Quick-Start: Zero-Code Example (Python http.server)

Because `htmz` is purely HTML-driven, you can test it locally using a static file server like Python's built-in module.

1.  **Create `index.html` (The Shell):**
    ```html
    <!DOCTYPE html>
    <html>
    <body>
        <!-- Hidden iframe router -->
        <iframe hidden name="htmz"></iframe>
        <script src="https://cdn.jsdelivr.net/npm/htmz@0.1.1/dist/htmz.min.js"></script>

        <!-- Swap Target -->
        <div id="dashboard-panel">
            <p>Loading stats...</p>
            <a href="fragment.html#dashboard-panel" target="htmz">Load Dashboard</a>
        </div>
    </body>
    </html>
    ```

2.  **Create `fragment.html` (The Fragment):**
    ```html
    <div id="dashboard-panel">
        <h3>Active Connections: 42</h3>
        <p>Loaded statically!</p>
    </div>
    ```

3.  **Run the Server:**
    ```bash
    python3 -m http.server 8080
    ```

Open `http://localhost:8080` in your browser. Click the link to watch the DOM swap happen instantly with zero JavaScript code written.

---

## 6. Dynamic Fragments: Template Engines and System Commands

For real applications, you want dynamic fragments. Because the browser expects plain HTML, you can construct fragments on-the-fly using standard backend template engines, or even by wrapping raw system command outputs.

### Example A: Pipe System Command Directly to UI (Python)

Need an internal dashboard to monitor server disk space? Write a simple Python handler that executes `df -h` and returns the output directly inside the targeted `#content` div:

```python
# server.py
from http.server import HTTPServer, SimpleHTTPRequestHandler
import subprocess

class MonitoringHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/disk-space":
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            
            # Execute unix command directly
            output = subprocess.check_output(["df", "-h"]).decode("utf-8")
            
            # Return raw HTML fragment
            fragment = f"<div id='content'><pre>{output}</pre></div>"
            self.wfile.write(fragment.encode("utf-8"))
        else:
            super().do_GET()

HTTPServer(("127.0.0.1", 8080), MonitoringHandler).serve_forever()
```

In your main `index.html`:
```html
<iframe hidden name="htmz"></iframe>
<div id="content">Disk stats will load here...</div>
<a href="/disk-space#content" target="htmz">Check Disk Space</a>
```

### Example B: Server-Side Templates (Go/Jinja)

Instead of sending JSON to the frontend and compiling templates in the browser, render templates directly on the server.

**Go html/template:**
```go
func UserProfileHandler(w http.ResponseWriter, r *http.Request) {
    user := GetUserFromDB()
    // Render only the profile panel fragment
    tmpl := template.Must(template.New("profile").Parse(`
        <div id="profile-panel">
            <h3>{{.Name}}</h3>
            <p>Role: {{.Role}}</p>
        </div>
    `))
    tmpl.Execute(w, user)
}
```

This keeps 100% of your business logic, formatting, and database queries centralized in your backend codebase. On the frontend, you do not maintain a complex JavaScript state store: the browser's DOM itself is the state.
