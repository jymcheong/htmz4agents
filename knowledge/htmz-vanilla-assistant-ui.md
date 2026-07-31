# htmz + Vanilla JS Assistant UI

## Facts

### WHO
htmz: Lean Rada (leanrada.com). Research: user-prompted web research.

### WHAT
concept — architecture for building assistant-style chat UI controls WITHOUT React; htmz handles page structure/panels, SSE + native EventSource handles token streaming; composable split avoids React dependency entirely

### WHERE
https://leanrada.com/htmz/

### WHY
React is overkill for simple chat UIs embedded in tools, demos, or single-file apps; htmz + SSE provides the same UX with zero build tooling and ~200 bytes of framework overhead

### HOW
Split by responsibility:
- **htmz** (166 bytes) — layout, navigation, tabs, server-rendered panel swaps via iframe+hash DOM targeting
- **SSE + `EventSource`** — token-by-token streaming from server; append to message div incrementally
- **`fetch()`** — user message POST
- **HTMX `hx-ext="sse"`** — heavier alternative if htmz too minimal; handles server-push HTML fragments
- **QuikChat / DHTMLX Chatbot** — zero-dep or 65KB drop-in chat widgets with native streaming support

```js
// Core streaming pattern — no React needed
fetch('/api/chat', { method: 'POST', body: prompt })
const es = new EventSource('/api/stream?id=xxx')
es.onmessage = e => messageDiv.textContent += e.data
```

## Key Claims
- htmz is incompatible with token streaming — it waits for complete HTML before swapping; wrong tool for live typing effect
- SSE + native EventSource is the correct streaming layer — browser-native, no dependencies
- The two are composable: htmz for structure, EventSource for the stream
- HTMX `hx-ext="sse"` is the upgrade path if more server-push patterns needed beyond htmz's scope
- QuikChat (zero dep) and DHTMLX Chatbot (65KB MIT) are drop-in options if building from scratch is not desired

- Tab control = `#tab-content` div + htmz iframe + `loadTab()` in 5 lines — direct equivalent of low-code drag-in tab component
- Parameter handoff between tabs: pass via fetch URL, not via page variable — eliminates stale-value risk present in low-code platforms
- Fragment chaining is the hardest pattern: coordination without a state manager; tabs solve a large subset cleanly
- Two-stage swap (spinner → real content) is the correct UX for any tab that loads async data

## Tags
frontend, htmz, vanilla-js, sse, eventSource, no-react, chat-ui, streaming, assistant-ui, htmx, partial-page-update, server-sent-events, quikchat, dhtmlx

## Decisions

### DEC-001 — htmz as base component approach; React for sophisticated SSE (2026-05-15)
**Decision:** htmz is the default for standard web components (navigation, fragment swaps, modal dialogs, card loading, skeleton states, error handling). For sophisticated real-time patterns — particularly SSE where partial-stream recovery, heartbeat detection, reconnect control, and mid-stream state management are required — React (or equivalent component framework) is the appropriate layer.

**Rationale:** Validated through Pattern 14 (timeout watchdog) and the SSE task runner prototype. htmz's iframe-based swap has no built-in stream lifecycle — `EventSource` reconnect behavior, mid-stream drop recovery, and duplicate-on-reconnect suppression all require stateful client logic that vanilla JS can technically handle but React components do more cleanly. htmz excels at the request/response fragment model; SSE's stateful stream lifecycle is a different problem domain.

**Boundary:** htmz handles structure + navigation + one-shot fragment loads. React handles anything that maintains live stream state across reconnects or renders partial progressive output.

### DEC-002 — React islands for sophisticated custom components (2026-05-15)
**Decision:** The htmz + React split is not SSE-specific. htmz owns page structure and server-rendered fragment swaps (stateless, request/response shaped). React islands mount into designated slots for anything requiring local state, lifecycle, event coordination, or live data — SSE streams, multi-step forms, drag-and-drop, real-time charts, optimistic UI, complex validation.

**Pattern:** htmz is the shell. Specific `<div>` slots are React roots (`ReactDOM.createRoot`). A small bootstrap script (~10 lines) watches for fragment swaps containing `data-react-component` markers and mounts the right component into that slot on demand. htmz owns the page; React owns the islands.

**Rationale:** Keeps htmz's zero-build advantage for the majority of the UI. Isolates React to exactly the slots that need it. Boundary is clean and mechanical — not subjective. The two mental models coexist without conflict because the division of responsibility is structural, not per-feature.

## Timeline
### 2026-07-12T22:44
- SIP: removed brackets from deleted-link reference in Timeline note — `skills/verify/SKILL.md` was backtick-quoted as `[[../skills/verify/SKILL.md]]`, causing false positive in wikilink scanner.
→ [[../sessions/2026-07/2026-07-12.ClaudeBot.md]]

### 2026-07-17T20:41
- Added relates link to CopilotKit toolkit knowledge entry.
→ [[../sessions/2026-07/2026-07-17.GeminiBot.md]]

### 2026-07-04T08:16 ClaudeBot — SIP fixed a broken wikilink
- Step 1 broken-link scan: `## Next`'s Pattern 17 live-verify note linked `skills/verify/SKILL.md`, which doesn't exist in-repo — `verify` is a harness-level plugin skill, not an Alfred-authored file. Removed the dangling wikilink, kept the plain-text mention.
→ [[../sessions/2026-07/2026-07-04.ClaudeBot.md]]

### 2026-07-03T18:15 ClaudeBot — Pattern 23 built (Server-Hydrated Templates)
- User scoped the previously-unbuilt "LLM-authored Server-Hydrated Templates" item down to the simplest real version: "just do a static json filling up a template fragment n show up at frontend." Built `examples/server-hydrated/` (port 8840) — `data.json` (3 static items), a template-literal function hydrating real item data into a fixed HTML shape, `/hydrate?id=N` fragment endpoint. Live-tested via curl (all 3 stock states — ok/low/out — render with correct data and CSS class), test server stopped cleanly. Found and fixed a real pre-existing pattern-number collision while adding the `PATTERNS.md` row — `optimistic-update` was already informally called "P22" in this file's own status line despite never being in the canonical table; used 23 for the new pattern instead of untangling that (flagged, not fixed — same class of gap as SSE/16 and file-upload/20 also missing from the table).
→ [[../sessions/2026-07/2026-07-03.ClaudeBot.md]]

### 2026-07-03T12:42 ClaudeBot — pattern-status SSOT consolidation
- User flagged `assets/htmzAgent/PATTERNS.md` as a stale, competing status-tracker — its own internal "Pending Patterns" checklist had drifted both from `assets/htmzAgent/CLAUDE.md`'s separate "Pattern status" table AND from actual code (Pattern 19/load-more and Pattern 20/file-upload both fully built, both still marked incomplete in `PATTERNS.md`'s checklist; found by direct code read, not doc trust). Consolidated: added this file's first `# HOW` section (was missing despite KANBAN's `#HOW` entity link already pointing at it) as the single status source; retired the checklist in `PATTERNS.md` and the table in `htmzAgent/CLAUDE.md`, both now point here instead of keeping their own copy.
→ [[../sessions/2026-07/2026-07-03.ClaudeBot.md]]

### 2026-07-02T01:00 ClaudeBot — SIP Step 5b audit
- Found unlinked work: `go mod init` was run at `assets/htmzAgent/examples/passkey-webauthn/` on 2026-06-25, then explicitly paused same session (user redirected to the AskUserQuestion truncation bug instead) — never made it into KANBAN's "htmzAgent — Passkey / WebAuthn Example" item, which still said plain "new" with no note of the attempt. Fixed KANBAN Done field to reflect it.
→ [[../sessions/2026-06/2026-06-25.ClaudeBot.md]]
→ [[../sessions/2026-07/2026-07-02.ClaudeBot.md]]

### 2026-04-30T11:27
- Realisation: htmz + agent-written fragments = a complete inversion of the modern frontend stack
- Modern stack: component framework → state management → virtual DOM → hydration → build step
- This stack: agent writes a file → Chi serves it → iframe fetches it → replaceWith
- The "component" is an HTML file on disk. "State management" is which files exist in fragments/. The "framework" is 166 bytes.
- The agent is the new webpack — except instead of bundling, it reasons: reads data, decides what to render, writes the fragment. UI picks it up.
- Implication: agentic UI generation is not a future idea — it is the architecture already in place in assets/avara/ui/
→ [[../sessions/2026-04/2026-04-30.md]]

### 2026-05-02T21:37
- Basecoat adopted as component layer for htmz framework
- Alpine.js MutationObserver auto-initialises Basecoat components injected by htmz — zero re-init friction
- PATTERNS.md updated with stack table: htmz + Basecoat + SSE + Go/Node
→ [[../sessions/2026-05/2026-05-02.md]]

### 2026-04-29T21:11
- Researched htmz + vanilla JS patterns for assistant UI without React
- Architecture split identified: htmz for structure, SSE for streaming
- Two no-React chat libs noted: QuikChat, DHTMLX Chatbot
→ [[../sessions/2026-04/2026-04-29.md]]

### 2026-04-30T15:08
- Pattern 4 added: Tab control with parameterised loading
- Pattern 5 added: vanilla JS controls drop-in with no adapter — noUiSlider/Flatpickr/Quill/SortableJS/Chart.js all work natively; React wrapper tax eliminated
- Pattern 6 added: DOM as state manager — single `host-state` node outside swap targets; one-way via explicit re-fetch, two-way via native input.value, derived state via server
- Philosophy updated: micro-lib companions (Hyperscript, Alpine.js) become unnecessary when agent absorbs authoring cost; agent is the more powerful companion
- Key insight: vanilla JS ecosystem (older, more stable, larger) is an ecosystem advantage over React wrapper ecosystem
- UX insight: Tab control = named slots + switcher — same mental model as low-code drag-in tab component
- Two-stage swap: action in Tab 1 → immediate spinner swap into Tab 2 → fetch resolves → real content swap
- Key design decision: parameter travels with the action (in the fetch URL), not with the tab — eliminates shared state object and stale-value bleed-across that low-code page variables suffer from
- Fragment chaining complexity now understood: hardest when fragment B depends on data from fragment A; tabs solve a large subset of that problem cleanly
- PATTERNS.md updated: Pattern 4 added, accordion/tabs ticked off pending list, 7 remaining
→ [[../sessions/2026-04/2026-04-30.md]]

### 2026-04-30T15:01
- htmzAgent asset folder created — working prototype with Express backend
- Demonstrated Pattern 1: fragment buttons call host-page globals (no JS in fragments)
- Demonstrated Pattern 2: server returns HTML fragment, client staples into stable container
- Discovered Pattern 3: stale DOM reference bug — capturing getElementById before innerHTML mutation causes silent writes to detached nodes; fix is DOM-first, display-second
- PATTERNS.md started at assets/htmzAgent/PATTERNS.md — living doc, 3 patterns so far, 8 pending

### 2026-05-11T17:28
- Card-accordion demo (AVARA triage UI) started — Go server (stdlib, no deps) + htmz fragment swaps + modal API calls
- Nohup pattern for demo servers: `nohup go run server.go > /tmp/htmz-server.log 2>&1 &`
- START.md written in examples/ with launch/verify/stop instructions
→ [[../sessions/2026-05/2026-05-11.md]]

### 2026-06-22T00:00
- Audited assets/htmzAgent/examples/ against KANBAN "P17/P19-P22 Pattern Examples" (status: doing) — verified directly: inline-editing/ (P17), load-more/ (P19), polling/ (P21), optimistic-update/ (P22) all have working server.js/index.html and README.md — fully implemented, not stubs. passkey-webauthn/ is genuinely SPEC-only (README.md + SPEC.md, no server code) — KANBAN "new" status for that item is accurate.
- Folded assets/htmzAgent/examples/RESUME.md into this entry (file deleted after fold):
  - Per-example port/stack/status: card-accordion (8743), sse (8750), loquix-chat (8760), basecoat (8770), basecoat-linear (8771, static), basecoat-notion (static), static-demo (8780), alpine-toast (static), animejs-swap (static), apple-svg-landing (static), react-island (static), confirm-dialog (static, done via Gemini), polling (8800, static, P21), optimistic-update (static, "P22" per this line but not in `PATTERNS.md`'s canonical table — pre-existing gap, unresolved, done via Gemini), inline-editing (8810, P17, done via Gemini), theme-switch (8820, P5), load-more (8830, P19), server-hydrated (8840, P23), passkey-webauthn (spec only)
  - Layer rule (applies to all examples): Server owns business logic → HTML fragments; Vanilla JS owns system APIs (fetch, dialog, setInterval, dispatchEvent); Alpine.js owns UI state only (classes, open/close, x-text) — never async
  - Lesson (loquix-chat): `claude -p` CLI streams raw unstructured text — cannot detect thinking blocks, tool calls, or content types; useless for typed SSE. Loquix (pre-release, 29 stars) only useful for `<textarea>` + submit event. RAF drain pattern (4 chars/frame) works well for typewriter effect. Raw markdown renders as plain text — always run marked.parse() on block_stop.
  - Lesson (basecoat-linear porting from open-design): CSS token porting sufficient for static Basecoat components; dynamic components (Tabs, Select, Dropdown, Dialog) require exact Basecoat DOM structure ([role="tablist"] etc) — open-design output uses wrong structure and won't wire correctly. Rule: use Basecoat HTML structure + Linear/Notion CSS tokens + call window.basecoat.initAll() in htmz onload handler.
- Created assets/htmzAgent/CLAUDE.md pointing to this entry and skills/htmz-frontend/SKILL.md / skills/htmz-review/SKILL.md.
→ [[../sessions/2026-06/2026-06-22.ClaudeBot.md]]

# HOW

## Next
(none — all patterns complete)

## In Progress
- **Jym.sg Blog Revamp:** Redesign personal blog using obsidian-dark theme, custom background canvas nodes animation, and htmz partial swaps. Added 2026-07-15. (In progress: revamping Attack Life Cycle and Mental Model writeups).

## Done
- Pattern 19 — Load more/pagination (`examples/load-more/`) ✓ 2026-06-22 (was wrongly re-flagged "not started" in `PATTERNS.md`'s own separate checklist until this cleanup — that checklist has been retired in favor of this section, the single status source)
- Pattern 16 — SSE streaming into a fragment ✓ 2026-07-04 — write-up added to `PATTERNS.md` (htmz for navigation + EventSource for streaming; `data-task` attribute as server→client context channel; key rules: cancel stale SSE before new swap, `X-Accel-Buffering: no`, `[DONE]` sentinel, auto-scroll). Examples: `examples/sse/` (Go, task runner) + `examples/loquix-chat/` (Node, LLM tokens).
- Pattern 17 — Inline editing `htmzOnload is not defined` ✓ 2026-07-04 — verified by code analysis (no browser available on this machine): `htmzOnload` defined in first `<script>` block (lines 417–524), iframe at line 527 — inline scripts parse top-down, function is in global scope before iframe element is created. Initial `about:blank` onload guarded at line 455. Error cannot structurally reproduce.
- Pattern 23 — Server-Hydrated Templates (`examples/server-hydrated/`) ✓ 2026-07-03 — user-scoped down from "LLM-authored template" to the simplest real version: static `data.json` + a fixed template-literal function + `/hydrate?id=N` fragment endpoint. Built, dependencies installed, live-tested (all 3 dataset items — ok/low/out-of-stock CSS states all verified correct via curl), test server stopped cleanly after. Real number collision found and fixed while adding: `optimistic-update` was already informally labeled "P22" in this file's own per-example status line despite never appearing in `PATTERNS.md`'s canonical table at all — used 23 instead of untangling that pre-existing gap (out of scope here; SSE/16 and file-upload/20 have the same table-omission gap, flagged not fixed).
- Pattern 20 — File upload (`examples/file-upload/`) ✓ (busboy multipart parser, XHR upload-progress, Pattern-10 three-outcome fragments; found undocumented anywhere — not in `PATTERNS.md`'s checklist, not in `htmzAgent/CLAUDE.md`'s old status table — confirmed done by reading the actual code 2026-07-03)
- Patterns 1-15, 17, 18, 21, 22 — all have working examples per `assets/htmzAgent/PATTERNS.md`'s Examples index table (that table itself stayed accurate; only its separate Pending-Patterns checklist had rotted)

## Relations
## Timeline
### 2026-07-04T14:23 ClaudeBot
- P16 SSE write-up added to `PATTERNS.md`: htmz (navigation) + EventSource (streaming), `data-task` handoff, key rules (cancel stale SSE, X-Accel-Buffering, [DONE] sentinel, auto-scroll). P17 verified clean (code analysis — `htmzOnload` defined before iframe, error cannot reproduce). Both marked done in HOW.
→ [[../sessions/2026-07/2026-07-04.ClaudeBot.md]]

## Relations
- source: [[../sources/2026-04-29-htmz-vanilla-assistant-ui.md]]
- related: [[../knowledge/assistant-ui-react.md]]
- related: [[../knowledge/ai-sdk-streamText.md]]
- related: [[../knowledge/open-design.md]]
- backend-layer: [[../knowledge/go-chi-templ-sse-stack.md]]
- component-layer: [[../knowledge/basecoat.md]]
- relates: [[../knowledge/openui.md]]
- relates: [[ui-ux-pro-max.md]]
- relates: [[frontend-design.md]]
- relates: [[../knowledge/copilotkit-agent-native-toolkit.md]]

