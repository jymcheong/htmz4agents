# P17 — Inline Editing

A premium, interactive demonstration of **Pattern 17 (Inline Editing)** and **Pattern 10 (Form Submit Lifecycle & Validation)** built purely with **htmz** and the **Basecoat CSS library**.

This example models a secure server configuration panel with multiple fields that can be edited individually inline.

## 🛠️ Stack & Technologies
- **Frontend Core**: [htmz (166 bytes)](https://leanrada.com/htmz/) + Vanilla HTML5/JS
- **Styling Layer**: Basecoat CSS (Tailwind v4 CDN) + Custom HSL Glassmorphic Dark UI
- **Backend Service**: Node.js + Express (serving static assets + returning HTML fragments)
- **Zero-Dependency Core**: Requires no custom client framework runtime.

---

## 💡 Key Architectural Patterns Exhibited

### 1. Pattern 17 — Inline Editing Swap Flow
When clicking the "Edit" button next to any settings field:
1. The read-only row outerHTML is cached locally in client memory (`window.lastDisplayHTML[field]`).
2. The display row is instantly replaced with a shimmering loader to provide immediate visual feedback.
3. htmz fetches the edit form HTML fragment via `GET /api/edit/:field` and swaps it inline into the exact `#row-:field` target.

### 2. Client-Side Instant Cancellation (Zero-Latency)
If the user clicks "Cancel", instead of hitting the backend to re-fetch the original display value, the client-side JS instantly replaces the form element with the cached original display row (`window.lastDisplayHTML[field]`). This avoids unnecessary round-trips and keeps UI interactions instant.

### 3. Pattern 10 — Form Submit Validation (Server-Centered)
When the user submits an inline edit form:
- The form has `action="/api/save/:field#row-:field" target="htmz" method="POST"`.
- It submits standard urlencoded data to the Express backend.
- The server performs strict type and format checks (e.g. hostname format regex, valid email format, CPU cores numerical range).
- **If Valid (success)**: The server updates state in memory and returns the read-only display fragment with `data-outcome="success"`.
- **If Invalid (error)**: The server echoes the invalid user input, annotates the validation error message inline, and returns the form fragment with `data-outcome="invalid"`.
- htmz handles the clean DOM replacement transparently.

### 4. Pattern 11 — Toast Notifications Event Bridge
The central `htmzOnload()` handler parses the `data-outcome` attribute of incoming HTML fragments from the iframe body before/during swapping:
- `success` triggers a green success toast (`showToast("Successfully saved hostname!", "success")`).
- `invalid` triggers a red validation warning toast (`showToast("Validation error on hostname!", "error")`).
- `initial` triggers no notifications.
This decouples visual notifications entirely from the server templates and components!

---

## 🚀 How to Run Locally

### 1. Install dependencies
From this directory:
```bash
npm install
```

### 2. Start the server
```bash
npm start
```

Open your browser to [http://localhost:8810](http://localhost:8810) to interact with the demo.
