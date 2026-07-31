# htmz

## Facts

### WHO
Lean Rada (leanrada.com)

### WHAT
tool — 166-byte HTML micro-framework for partial page updates using an iframe + URL hash DOM targeting mechanism; no build step, no dependencies, no JavaScript API — pure HTML

### WHERE
https://leanrada.com/htmz/ | https://github.com/leanrada/htmz

### WHY
Minimalist alternative to HTMX for server-rendered HTML fragment swaps; 166 bytes vs ~14KB HTMX; works declaratively via `<iframe hidden name="htmz">` + `action="..." target="htmz"` + hash-based DOM routing; zero JS API surface — just HTML attributes

### HOW
- Hidden iframe intercepts form submissions and link clicks
- Server returns full HTML page
- URL hash (`#element-id`) tells htmz which element to extract and swap
- `replaceWith(el)` performs the DOM swap — no virtual DOM, no diffing
- Fragment buttons call host-page globals via `window.parent` for stateful interactions

## Key Claims
- 166 bytes gzipped — smallest HTML2HTML swap library; HTMX is ~14KB
- Declarative-only: no JS API, no lifecycle hooks, just HTML
- Incompatible with token streaming — waits for complete HTML before swapping
- Composability with SSE EventSource for streaming: htmz handles structure/panels, EventSource handles live token updates
- Basecoat (Alpine.js MutationObserver) auto-initialises components injected by htmz — zero re-init friction
- Vanilla UI Web Components self-upgrade on DOM insert — compatible with htmz-injected fragments

## Tags
htmz, html-framework, partial-page-update, iframe, htmx-alternative, micro-framework, vanilla-js, server-rendered, dom-swap

## Timeline
### 2026-04-29T21:11
- Researched htmz for no-React assistant UI architecture
- Architecture split identified: htmz for structure panels, EventSource for streaming
→ [[../sessions/2026-04/2026-04-29.md]]

### 2026-04-30T15:01
- htmzAgent asset folder created with Express backend prototype
- PATTERNS.md started with 3 patterns: fragment→API, HTML fragment response, stale DOM ref fix
→ [[../sessions/2026-04/2026-04-30.md]]

### 2026-04-30T15:08
- Pattern 4 (tab control), 5 (vanilla JS drop-in), 6 (DOM as state) added
- Philosophy updated: agent is more powerful companion than micro-lib helpers
→ [[../sessions/2026-04/2026-04-30.md]]

### 2026-04-30T11:27
- Realisation: htmz + agent-written fragments inverts the modern frontend stack
- Agent is the new webpack — writes fragments to disk, UI picks them up
→ [[../sessions/2026-04/2026-04-30.md]]

### 2026-05-02T21:37
- Basecoat adopted as component layer for htmz framework
- Alpine.js MutationObserver auto-init confirmed as zero-friction pattern
→ [[../sessions/2026-05/2026-05-02.md]]

### 2026-05-03T20:31
- Standalone htmz entity created — core library separated from htmz-vanilla-assistant-ui concept entity
→ [[../sessions/2026-05/2026-05-03.md]]

### 2026-05-11T17:28
- Card-accordion demo (AVARA triage UI) started at `assets/htmzAgent/examples/card-accordion/`
- Go server (stdlib net/http, no deps) serves static files + POST `/api/rescan` and `/api/notify` returning HTML fragments
- Nohup pattern established for demo servers: `nohup go run server.go > /tmp/htmz-server.log 2>&1 &`
  - `&` backgrounding fails in agent bash sessions (process dies with session); `nohup` detaches and persists
  - Verify with `lsof -i :8743` after 2s sleep
→ [[../sessions/2026-05/2026-05-11.md]]

### 2026-05-11T17:28
- Card-accordion demo (AVARA triage UI) started at `assets/htmzAgent/examples/card-accordion/`
- Go server (stdlib net/http, no deps) serves static files + POST `/api/rescan` and `/api/notify` returning HTML fragments
- Nohup pattern established for demo servers: `nohup go run server.go > /tmp/htmz-server.log 2>&1 &`
  - `&` backgrounding fails in agent bash sessions (process dies with session); `nohup` detaches and persists
  - Verify with `lsof -i :8743` after 2s sleep
→ [[../sessions/2026-05/2026-05-11.md]]

## Relations
- related: [[../knowledge/htmz-vanilla-assistant-ui.md]]
- related: [[../knowledge/basecoat.md]]
- related: [[../knowledge/vanilla-ui.md]]
- related: [[../knowledge/go-chi-templ-sse-stack.md]]
- related: [[../knowledge/open-design.md]]
