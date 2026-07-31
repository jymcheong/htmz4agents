# htmz4agents

> **166-byte micro-framework patterns and architecture for AI agent frontends.**

`htmz4agents` is a pattern catalog, architecture guide, and runnable example suite demonstrating how to build fast, low-overhead, no-React web interfaces for AI agents using **[htmz](https://leanrada.com/htmz/)** (Lean Rada's 166-byte HTML micro-framework), **Server-Sent Events (SSE)**, and **[Basecoat](https://basecoatui.com)**.

---

## 🚀 Key Highlights

* **166 Bytes Framework Overhead:** No React, no virtual DOM, no heavy bundlers.
* **The Agent as Webpack:** The server/agent renders raw HTML fragments; `htmz` swaps them directly into the DOM (`replaceWith`).
* **21 Runnable Pattern Examples:** From loading skeletons and tab controls to inline editing, file uploads, SSE streaming, and server-hydrated templates.
* **Basecoat Auto-Init:** Uses `MutationObserver` to automatically upgrade dynamic components as new HTML fragments arrive.

---

## ⚡ Get Started (Agent Quickstart)

### Option A — One-Liner (Fastest)

Run this single command to clone the repo, boot Claude CLI, and auto-serve the interactive examples:

```bash
git clone https://github.com/jymcheong/htmz4agents.git && cd htmz4agents && claude "Read HANDOVER.md. You are an HTMz agent. Confirm: (1) what htmz is, (2) which examples run offline with python3 -m http.server, (3) what to check before running a Tier 3 example. Then start the examples: cd assets/htmzAgent && python3 -m http.server 8080 and list the URLs."
```

---

### Option B — Step-by-Step

#### Step 1 — Clone repository & open CLI

```bash
git clone https://github.com/jymcheong/htmz4agents.git
cd htmz4agents
claude
```

#### Step 2 — Paste this prompt:

```text
Read HANDOVER.md. You are an HTMz agent. Confirm: (1) what htmz is, (2) which examples run offline with python3 -m http.server, (3) what to check before running a Tier 3 example. Then start the examples: cd assets/htmzAgent && python3 -m http.server 8080 and list the URLs."
```

That's it! The agent reads `HANDOVER.md`, orients itself across the 4 runtime tiers, and serves the interactive examples.

---

## 🎬 Demo (No Clone Needed)

Preview a few self-contained examples instantly in your browser — no clone, no server, via [htmlpreview.github.io](https://htmlpreview.github.io):

* **[theme-switch](https://htmlpreview.github.io/?https://raw.githubusercontent.com/jymcheong/htmz4agents/main/assets/htmzAgent/examples/theme-switch/index.html)** — pure client-side light/dark toggle, zero network calls.
* **[static-demo](https://htmlpreview.github.io/?https://raw.githubusercontent.com/jymcheong/htmz4agents/main/assets/htmzAgent/examples/static-demo/index.html)** — pre-canned host-detail view (no-backend variant of the fetch-based example).
* **[confirm-dialog](https://htmlpreview.github.io/?https://raw.githubusercontent.com/jymcheong/htmz4agents/main/assets/htmzAgent/examples/confirm-dialog/index.html)** — confirm/cancel dialog pattern backed by a real public API ([jsonplaceholder.typicode.com](https://jsonplaceholder.typicode.com)).

> Note: `raw.githubusercontent.com` always serves files as `text/plain` with `nosniff` — browsers refuse to render `.html` directly from it. `htmlpreview.github.io` proxies with the correct `text/html` content-type instead. Examples that call a local backend endpoint (`card-accordion`, `basecoat`, `sse`, etc.) won't work through this proxy — clone + run `python3 -m http.server` for those (see Quickstart above).

---

## 📚 Documentation & Reference

* **[HANDOVER.md](HANDOVER.md)** — Core asset handover guide (runtime tiers, quickstart commands, skill router mapping).
* **[PATTERNS.md](assets/htmzAgent/PATTERNS.md)** — Full 23-pattern catalog with code snippets and architecture guidelines.
* **[CLAUDE.md](CLAUDE.md)** — Agent workspace guide and pattern status index.
* **[dom-is-the-state.md](assets/htmzAgent/dom-is-the-state.md)** — Core philosophy on using the DOM as the state manager.
* **[why-htmz.html](assets/htmzAgent/why-htmz.html)** — Standalone visual introduction to htmz architecture.

---

## 📁 Examples Suite (`assets/htmzAgent/examples/`)

Explore individual runnable demos in `assets/htmzAgent/examples/`:

| Directory | Pattern / Technique |
| :--- | :--- |
| `card-accordion/` | Pattern 9 (Loading Skeleton) & Pattern 1/2 (Fragment Swaps) |
| `sse/` | Pattern 16 (SSE Token Streaming into Fragments) |
| `inline-editing/` | Pattern 17 (Inline Editing & Two-Zone Error Handling) |
| `load-more/` | Pattern 19 (Pagination & Append Swaps) |
| `file-upload/` | Pattern 20 (Multipart Upload Progress & Outcome Fragments) |
| `polling/` | Pattern 21 (Background Task Status Polling) |
| `optimistic-update/` | Pattern 22 (Optimistic UI & Server Reconciliation) |
| `server-hydrated/` | Pattern 23 (Server-Hydrated Template Fragments) |

---

## 🛡️ License

MIT / Open Source
