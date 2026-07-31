# htmzAgent Patterns

> Living document. Each pattern discovered in practice gets added here.
> Goal: cover enough ground to make htmz a credible alternative to React for agent-driven UIs.

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Fragment transport | htmz (166B) | iframe + hash DOM targeting |
| Component library | **Basecoat** | HTML + Tailwind + Alpine.js; shadcn aesthetic; no React |
| Streaming | SSE + EventSource | token-by-token, browser-native |
| Backend | Go (Chi) or Node (Express) | serves fragments + SSE |

Basecoat adopted 2026-05-02 — Alpine.js MutationObserver auto-initialises any Basecoat component injected by htmz, zero re-init friction.

## Examples index

| Pattern | Example(s) |
|---------|-----------|
| Core htmz — iframe + hash swap | [animejs-swap](examples/animejs-swap/), [alpine-toast](examples/alpine-toast/), [static-demo](examples/static-demo/) |
| Pattern 1 — Fragment Button → Host Page API | [card-accordion](examples/card-accordion/), [basecoat](examples/basecoat/) |
| Pattern 2 — Server Returns HTML Fragment | [card-accordion](examples/card-accordion/), [loquix-chat](examples/loquix-chat/), [sse](examples/sse/), [basecoat-linear](examples/basecoat-linear/), [basecoat-notion](examples/basecoat-notion/) |
| Pattern 4 — Tab Control / sidebar nav | [apple-svg-landing](examples/apple-svg-landing/), [basecoat](examples/basecoat/), [basecoat-linear](examples/basecoat-linear/), [basecoat-notion](examples/basecoat-notion/), [static-demo](examples/static-demo/), [react-island](examples/react-island/) |
| Pattern 5 — Vanilla JS Controls | [theme-switch](examples/theme-switch/) — dark/light toggle, localStorage persistence, anti-FOUC |
| Pattern 6 — DOM as State Manager | [basecoat-linear](examples/basecoat-linear/), [basecoat-notion](examples/basecoat-notion/), [static-demo](examples/static-demo/) |
| Pattern 7 — Error States / server-gated fragments | [passkey-webauthn](examples/passkey-webauthn/) (SPEC) |
| Pattern 9 — Loading Skeleton | [card-accordion](examples/card-accordion/) |
| Pattern 11 — Toast Notifications | [alpine-toast](examples/alpine-toast/) |
| Pattern 13 — Backend Error Handling | [card-accordion](examples/card-accordion/), [basecoat](examples/basecoat/) |
| Pattern 14 — Fragment Timeout Watchdog | [card-accordion](examples/card-accordion/), [basecoat](examples/basecoat/) |
| Pattern 15 — React Island | [react-island](examples/react-island/) |
| Pattern 18 — Confirmation dialog | [confirm-dialog](examples/confirm-dialog/) |
| Pattern 21 — Polling | [polling](examples/polling/) |
| Pattern 17 — Inline editing | [inline-editing](examples/inline-editing/) |
| Pattern 19 — Load more | [load-more](examples/load-more/) — server accumulation, htmz always replaces |
| Pattern 23 — Server-Hydrated Templates | [server-hydrated](examples/server-hydrated/) — fixed template, static JSON, server fills real data into the template at request time |
| SSE hybrid (htmz + EventSource) | [loquix-chat](examples/loquix-chat/), [sse](examples/sse/), [chat](examples/chat/) (planned) |
| Alpine.js auto-init | [alpine-toast](examples/alpine-toast/), [basecoat](examples/basecoat/), [basecoat-linear](examples/basecoat-linear/), [basecoat-notion](examples/basecoat-notion/), [passkey-webauthn](examples/passkey-webauthn/) (SPEC) |
| Anime.js animated swaps | [animejs-swap](examples/animejs-swap/), [apple-svg-landing](examples/apple-svg-landing/) |

---

## Philosophy

### Cardinal Principle: The DOM is the State

> The DOM is not a rendering target. It is the application state.
> Write to it directly. Read from it directly. Everything else is overhead.

HTML has encoded state since the beginning. Every attribute was always a state variable:

| Attribute | State it holds |
|---|---|
| `hidden` | step reached / not reached |
| `disabled` | action available / not available |
| `data-*` | arbitrary structured app state |
| `class` | presentation state |
| `value` | input state |
| `checked`, `selected` | selection state |

Every pattern in this document follows from this principle:

| Pattern | How DOM-as-state manifests |
|---|---|
| Fragment swap | server writes new state directly into DOM |
| Tab control | `active` class IS the selected tab |
| Hidden slots | `hidden` attribute IS the step progress |
| host-state node | `data-*` attributes ARE the app state |
| Vanilla JS controls | `input.value` IS the input state |
| Server-derived state | server reads params, writes result — DOM receives truth |

React violated this principle and spent a decade building abstractions to manage the consequences — virtual DOM, reconciler, hooks, suspense, server components. Each layer solving a problem created by the previous one. htmz and HTMX are not new ideas. They are a return to what the web already was before that violation.

The 166 bytes is the proof: if you don't fight the DOM, you need almost nothing to build on top of it.

---

### The Hidden Slot Pattern — Cardinal Principle in Practice

The clearest demonstration. Slots encode wizard / progressive disclosure progress with zero JS state:

```html
<div id="step-1-slot"></div>
<div id="step-2-slot" hidden></div>   <!-- hidden IS "not yet reached" -->
<div id="step-3-slot" hidden></div>
```

```js
// where are we? ask the DOM — no JS variable needed
const currentStep = [...document.querySelectorAll('[id$="-slot"]')]
  .findIndex(slot => slot.hidden);

// advance — just remove hidden, htmz handles the content swap
function completeStep(n) {
  document.getElementById(`step-${n + 1}-slot`).hidden = false;
}
```

The `hidden` attribute is the state. Present = not yet reached. Absent = revealed. No mirroring, no sync, no reconciliation.

---

### Wizard vs Progressive Disclosure — Responsive Consideration

Same fragment chain underneath. Different layout on top depending on screen size:

```
Desktop / Tablet:              Mobile:
                               
[Step 1] [Step 2] [Step 3]    Step 1 content
   horizontal tabs             ↓ (revealed on complete)
   or sidebar wizard           Step 2 content
   user sees full structure    ↓ (revealed on complete)
   at all times                Step 3 content
                               scrolls naturally downward
```

On mobile, vertically stacked hidden slots map to the natural scroll gesture. No tab chrome eating screen real estate. On desktop, horizontal navigation gives the user orientation across the full flow. The fragments are identical — only the swap target layout changes.

---

### The Agent Corollary

An agent reading data and writing an HTML fragment is doing exactly what a server-side renderer has always done — producing stateful markup. The agent is just a smarter template engine. It does not need React's reconciler because it never produces a diff — it produces the final answer directly.

```
Traditional stack:   data → JS state → virtual DOM → reconcile → DOM
htmz + agent stack:  data → agent reasons → HTML fragment → DOM
```

The intermediate layers exist to manage complexity that the agent dissolves by reasoning at the content level rather than the component level.

---

### On Micro-lib Companions (Hyperscript, Alpine.js)

The original htmz site gestures at lightweight JS companions for when you need reactive behaviour without a full framework. Their value proposition was reducing the verbosity gap between developer intent and vanilla JS.

With agentic coding that gap closes differently. The agent writes the verbose vanilla JS — you describe the intent. The boilerplate cost is zero because you are not the one writing it.

```
Human: "filter cards when slider moves"
Agent: writes the 8-line addEventListener + querySelector + dataset update
```

The justification for the micro-lib dissolves. The more powerful companion for htmz in an agentic context is the agent's ability to generate and regenerate fragments on demand — that moves complexity off the client entirely, which no reactive micro-lib can match.

---

### Why htmz over HTMX

HTMX is a real framework with real features — WebSocket support, CSS transitions, request indicators, history API. htmz is a proof that you rarely need most of it. For agent-driven UIs where the server (or agent) owns the markup and the client just displays it, the 166-byte version is enough. Add HTMX when you genuinely need what it adds, not by default.

---

## Core Mental Model

htmz is not a framework — it is a single iframe that swaps DOM nodes. The "framework" is the convention you build around it.

```
fragment file on disk
  → loaded via iframe
  → nodes moved into main page via replaceWith()
  → onclick handlers resolve against main page globals
```

The agent writes fragments. The server serves them. The browser displays them. No virtual DOM, no hydration, no build step.

---

## Pattern 1 — Fragment Button → Host Page API Call

**Problem:** A button inside a fragment needs to trigger a backend call and update the UI.

**Solution:** Fragment carries no JS. Button `onclick` calls a global function defined in `index.html`. Works because htmz's `replaceWith()` moves nodes into the main document scope.

```html
<!-- fragment: host-001-card.html -->
<button onclick="callAPI('rescan', 'ENDPOINT-001', null)">↺ Rescan Asset</button>
```

```js
// index.html — global function, visible to all fragment nodes
async function callAPI(action, host, target) {
  // fetch + update UI
}
```

**Rule:** All JS lives in `index.html`. Fragments are pure HTML. Parameters flow in via `onclick` arguments.

---

## Pattern 2 — Server Returns HTML Fragment (not JSON)

**Problem:** API response needs to update a UI region after an action.

**Solution:** Server returns an HTML fragment. Client staples it directly into a stable container div. No JSON parsing, no client-side templating.

```js
const res  = await fetch('/api/rescan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ host })
});
const html = await res.text();
document.getElementById('modal-response').innerHTML = html;
```

```js
// Express — returns HTML, not JSON
app.post('/api/rescan', (req, res) => {
  const { host } = req.body;
  res.send(`
    <div class="modal-status success">
      <div class="modal-status-dot"></div>
      <span>Rescan queued for ${host}</span>
    </div>
  `);
});
```

**Rule:** Server owns the markup. Client owns the container. The agent (or backend) decides what the UI looks like — the browser just staples it in.

---

## Pattern 3 — Stale DOM Reference Bug (and fix)

**Problem:** Capturing element references before a DOM mutation causes silent failures — the modal opens blank, or updates go nowhere.

```js
// ❌ WRONG — reference captured before innerHTML nukes the element
const statusTxt = document.getElementById('modal-status-text');
document.getElementById('modal-response').innerHTML = `...`; // statusTxt is now detached
statusTxt.textContent = 'Dispatching…';                       // writing to a ghost
```

**Fix:** Write DOM first, then show UI. Never hold references across a mutation. Use fresh `getElementById` calls inline.

```js
// ✅ CORRECT — write content, then reveal
document.getElementById('modal-response').innerHTML = `
  <div class="modal-status pending">
    <div class="modal-status-dot"></div>
    <span>Dispatching…</span>
  </div>
`;
document.getElementById('api-modal').style.display = 'flex'; // show after content is ready
```

**Rule:** DOM first, display second. No variable should hold a reference across an `innerHTML` mutation.

---

## Pattern 4 — Tab Control with Parameterised Loading

**Problem:** User action in Tab 1 produces context (e.g. a selected host) that Tab 2 needs to render. Tab 2 should appear immediately with a spinner, then swap in real content when the fetch resolves.

**Solution:** Two-stage swap. First swap loads a spinner fragment instantly (zero wait). Second swap replaces it with server response. Parameter travels in the fetch URL — no shared state object needed.

```html
<!-- index.html — tab bar -->
<div class="tab-bar">
  <button class="tab-btn active" onclick="activateTab(1)">Overview</button>
  <button class="tab-btn"        onclick="activateTab(2)">CVEs</button>
  <button class="tab-btn"        onclick="activateTab(3)">Actions</button>
</div>
<div id="tab-content"></div>
```

```html
<!-- Tab 1 fragment — user picks a host and triggers the action -->
<div id="tab-content">
  <select id="host-select">
    <option value="ENDPOINT-001">ENDPOINT-001</option>
    <option value="ENDPOINT-002">ENDPOINT-002</option>
  </select>
  <button onclick="analyseCVEs(document.getElementById('host-select').value)">
    Analyse CVEs →
  </button>
</div>
```

```js
// index.html globals
async function analyseCVEs(host) {
  // 1. switch to tab 2 immediately with spinner — no wait
  activateTab(2);
  document.getElementById('tab-content').innerHTML = `
    <div class="tab-loading">
      <div class="spinner"></div>
      <span>Loading CVEs for ${host}…</span>
    </div>
  `;

  // 2. fetch real content — parameter from Tab 1 travels in the URL
  const res  = await fetch(`/api/cves?host=${host}`);
  const html = await res.text();

  // 3. swap spinner out, real content in
  document.getElementById('tab-content').innerHTML = html;
}

function activateTab(n) {
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i + 1 === n);
  });
}

function loadFragment(src, targetId) {
  const a = document.createElement('a');
  a.href = src + '#' + targetId;
  a.target = 'htmz';
  a.click();
}
```

```js
// Express — returns Tab 2 HTML fragment
app.get('/api/cves', (req, res) => {
  const { host } = req.query;
  res.send(`
    <div id="tab-content">
      <div class="detail-heading">CVEs for ${host}</div>
      <!-- server-rendered CVE rows -->
    </div>
  `);
});
```

**Key insight:** The parameter travels with the action, not with the tab. In low-code you'd set a page variable and the tab would read it on open — risk of stale value if user switches tabs mid-flight. Here the parameter goes directly into the fetch URL, scoped to that single call. No shared state, no bleed-across.

**UX pattern this replaces:** Low-code Tab control with page variable handoff.

---

## Pattern 5 — Vanilla JS Controls: Drop-in, No Adapter Needed

**Problem:** Complex input controls (sliders, date pickers, rich text, drag-reorder, charts) need to integrate with the UI without a framework wrapper.

**Solution:** Vanilla JS libraries operate directly on DOM elements and emit native events. htmz never takes ownership of the DOM, so any vanilla library just works — no adapter, no wrapper component, no version lag.

```html
<!-- drop the library in, target a DOM element in a fragment -->
<script src="https://cdn.jsdelivr.net/npm/nouislider/dist/nouislider.min.js"></script>
<div id="cvss-slider"></div>
```

```js
// initialise against the element — htmz doesn't care
const slider = noUiSlider.create(document.getElementById('cvss-slider'), {
  start: [0, 10],
  range: { min: 0, max: 10 }
});

// listen to its event — same pattern as everything else in htmz
slider.on('update', values => {
  document.getElementById('host-state').dataset.cvssRange = JSON.stringify(values);
  filterCards();
});
```

The event carries the value. Write it into `host-state`. Everything downstream reads from there.

**Ecosystem available with zero adapter tax:**

| Library | Control |
|---|---|
| noUiSlider | range sliders |
| Flatpickr | date / time pickers |
| Quill / TipTap | rich text editors |
| SortableJS | drag-to-reorder lists |
| Chart.js | charts and graphs |
| Leaflet | maps |
| Tagify | tag inputs |

**React requires a wrapper package** for each of these — a third party maintaining a thin adapter, often lagging versions behind, sometimes abandoned. htmz talks to the library directly.

**For genuinely complex controls** (canvas drawing, custom drag-resize): scope the complexity to the control, not the architecture. Let the library own its element. Extract the value on submit or on a specific event — do not let it infect the whole app.

```js
// Quill — extract once on submit, not on every keystroke
document.getElementById('submit-btn').onclick = () => {
  const notes = quill.getText();
  fetch('/api/save', { method: 'POST', body: JSON.stringify({ notes }) });
};
```

**Rule:** You do not need binding infrastructure for the whole app because two controls are complex. Scope complexity to the control, keep the architecture flat.

---

## Pattern 6 — DOM as State Manager

**Problem:** Multiple fragments need to share state — a selected host, a filter value, a notification status — without a JS state manager.

**Solution:** Keep a dedicated state node in `index.html` outside any swap target. It survives all fragment replacements. Any fragment can read from it or write to it.

```html
<!-- index.html — outside every swap target, never replaced -->
<div id="host-state"
     data-selected=""
     data-cvss-min="0"
     data-notified="false"
     data-rescanned="false"
     hidden>
</div>
```

```js
// any fragment button can write
document.getElementById('host-state').dataset.selected = 'ENDPOINT-001';

// any fragment or function can read
const host = document.getElementById('host-state').dataset.selected;
```

**One-way derived state** — when state changes, re-fetch the dependent regions explicitly. You decide what re-renders and when. In React that decision is implicit (anything reading the state re-renders). Here you own it — no surprise re-renders.

```js
async function selectHost(host) {
  document.getElementById('host-state').dataset.selected = host;

  // explicitly re-render only what depends on this value
  const html = await fetch(`/api/card?host=${host}`).then(r => r.text());
  document.getElementById('card-container').innerHTML = html;
}
```

**Two-way input state** — the DOM already handles this natively. `input.value` is always current. Never mirror it into a JS variable.

```js
// read directly — no useState, no onChange sync needed
const query = document.getElementById('search').value;
```

**Derived / computed state** — let the server compute it. Pass filter parameters in the fetch URL. The fragment returned IS the computed result.

```js
const html = await fetch(`/api/hosts?severity=critical&zone=finance`).then(r => r.text());
document.getElementById('card-container').innerHTML = html;
```

No `useMemo`, no selector functions. The server (or agent) does the derivation and returns HTML.

**Rule:** One `host-state` node per page, positioned outside all swap targets. State flows out via `dataset`, back in via direct assignment. Re-renders are explicit fetch calls, not automatic subscriptions.

---

## Pattern 7 — Error States: Session Auth, Action Errors, Form Validation

Three distinct error levels. Each handled differently.

---

### Level 1 — Session Auth (401)

Global check. When the server detects an unauthenticated request it returns a sentinel element. Client JS in `index.html` detects it after any fragment load and redirects the whole page.

```html
<!-- server returns on 401 — no visible content, just a signal -->
<div data-auth-required data-redirect="/login?next=/dashboard" hidden></div>
```

```js
// index.html — runs after every innerHTML swap
function checkAuthSentinel(container) {
  const sentinel = container.querySelector('[data-auth-required]');
  if (sentinel) window.location = sentinel.dataset.redirect;
}

// call it wherever you swap content in
document.getElementById('card-container').innerHTML = html;
checkAuthSentinel(document.getElementById('card-container'));
```

**Why sentinel, not HTTP status:** htmz's iframe doesn't expose HTTP status codes to the parent. Content level is the only channel. The `hidden` attribute keeps it invisible if something goes wrong with the redirect.

---

### Level 2 — Action / Logic Errors (403, business rule violations)

Server returns an error fragment into the same stable container as a success response. Same mechanism as Pattern 2 — different class, different message.

```js
// index.html — no special handling needed
const html = await res.text();
document.getElementById('modal-response').innerHTML = html;
```

```html
<!-- server returns on 403 or business rule failure -->
<div class="modal-status error">
  <div class="modal-status-dot"></div>
  <span>Rescan already queued for ENDPOINT-001 — job_id: rsn_3a7f2c1</span>
</div>
```

```css
.modal-status.error .modal-status-dot { background: #ef4444; }
```

No client branching. The server decides what the UI looks like. The client just staples it in.

---

### Level 3 — Form Validation (the tricky one)

In React, controlled inputs mirror values into state — form re-render preserves what the user typed. In htmz the form lives inside a fragment swap target. When validation fails, the server must **echo submitted values back** inside the re-rendered form fragment or the user loses their input.

The server does three things in one response: validate, re-render, annotate errors inline.

```js
// index.html — submit handler
async function submitForm(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));

  const res  = await fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const html = await res.text();
  document.getElementById('form-container').innerHTML = html;
  checkAuthSentinel(document.getElementById('form-container'));
}
```

```html
<!-- server re-renders full form on validation failure — values echoed, errors annotated -->
<form id="scan-form" onsubmit="submitForm(event)">
  <div class="field-group error">
    <label>Host</label>
    <input name="host" value="ENDPOINT-00" />       <!-- echoed: bad value preserved -->
    <span class="field-error">Must match ENDPOINT-NNN format</span>
  </div>
  <div class="field-group">
    <label>Owner email</label>
    <input name="email" value="finance@company.com" />  <!-- echoed: good value preserved -->
  </div>
  <button type="submit">Submit</button>
</form>
```

```html
<!-- server returns clean form on success (or redirect sentinel) -->
<div class="modal-status success">
  <div class="modal-status-dot"></div>
  <span>Scan queued — job_id: rsn_4b2e91a</span>
</div>
```

**Key insight:** Error display logic lives entirely in the server template — which fields failed, which values to echo, which error messages to show. No client-side field-by-field error injection. No mirroring state. The re-rendered fragment IS the error state.

**HTML5 client-side validation** (free, use it): `required`, `pattern`, `min`, `max`, `type="email"` — these catch obvious errors before the fetch fires. Server validation is still the authority; HTML5 validation is UX polish only.

```html
<input name="host" pattern="ENDPOINT-\d{3}" required title="Must match ENDPOINT-NNN" />
```

**Rule:** Server echoes all submitted values in every re-render. Client never manages form state. `checkAuthSentinel` runs after every swap.

---

## Pattern 8 — Fragment Chaining with Responsive Container

Fragment chaining is the mechanism underneath wizard flows and progressive disclosure. One fragment completing triggers the next slot to reveal and load. The container layout determines whether that feels like a left-to-right wizard (landscape) or a top-down unfolding (portrait/mobile). The fragments themselves never change — only the container does.

---

### Part 1 — Responsive Container

```html
<!-- index.html — slot container, outside any swap target -->
<div class="wizard-container">
  <div id="step-1-slot"></div>
  <div id="step-2-slot" hidden></div>
  <div id="step-3-slot" hidden></div>
</div>
```

```css
.wizard-container {
  display: flex;
  flex-direction: row;    /* landscape: steps appear left → right */
  align-items: flex-start;
  gap: 1.5rem;
}

/* portrait phones + narrow viewports: steps unfold top → down */
@media (orientation: portrait), (max-width: 768px) {
  .wizard-container {
    flex-direction: column;
  }
}
```

On desktop the user sees all revealed steps side by side — orientation across the full flow. On mobile, each completed step stays visible above and the next one unfolds below, mapping to the natural scroll gesture. Same fragments, same slot IDs, same JS — CSS does all the work.

---

### Part 2 — Chain Mechanism

Each fragment signals completion by calling a global `completeStep(n)`. That function reveals the next slot and fetches its content. The parameter context from the current step travels in the fetch URL — no shared state object.

```js
// index.html globals

async function completeStep(n, params = {}) {
  const nextSlot = document.getElementById(`step-${n + 1}-slot`);
  if (!nextSlot) return;  // last step

  // reveal next slot immediately — DOM records progress
  nextSlot.hidden = false;

  // show spinner while fetching
  nextSlot.innerHTML = `
    <div class="step-loading">
      <div class="spinner"></div>
      <span>Loading step ${n + 1}…</span>
    </div>
  `;

  // parameter from current step travels in URL — no page variable needed
  const query  = new URLSearchParams(params).toString();
  const res    = await fetch(`/fragments/step-${n + 1}?${query}`);
  const html   = await res.text();
  nextSlot.innerHTML = html;
  checkAuthSentinel(nextSlot);
}

// where are we? ask the DOM — no JS variable needed
function currentStep() {
  const slots = [...document.querySelectorAll('[id$="-slot"]')];
  const idx   = slots.findIndex(s => s.hidden);
  return idx === -1 ? slots.length : idx;  // all revealed = last step
}
```

```html
<!-- fragment: step-1 — completion button calls completeStep with context -->
<div class="step-card">
  <h3>Select Host</h3>
  <select id="host-select">
    <option value="ENDPOINT-001">ENDPOINT-001</option>
    <option value="ENDPOINT-002">ENDPOINT-002</option>
  </select>
  <button onclick="completeStep(1, { host: document.getElementById('host-select').value })">
    Next: Review CVEs →
  </button>
</div>
```

```html
<!-- fragment: step-2 — server received host param, rendered CVEs into fragment -->
<div class="step-card">
  <h3>CVEs for ENDPOINT-001</h3>
  <!-- server-rendered CVE rows -->
  <button onclick="completeStep(2, { host: 'ENDPOINT-001', action: 'patch' })">
    Next: Confirm Action →
  </button>
</div>
```

---

### Part 3 — Push Multi-Step Chains to the Server

When steps have complex dependencies (step 3 needs data from both step 1 and step 2), coordinate on the server rather than accumulating state across client-side calls. The server knows the full chain; the client just shows what it receives.

```js
// single fetch — server handles the chain internally
const res  = await fetch('/api/chain/scan-workflow', {
  method: 'POST',
  body: JSON.stringify({ host, action, recipient })
});
const html = await res.text();
document.getElementById('step-3-slot').innerHTML = html;
```

**When to push to server:** any step that needs data from more than one previous step, or where failure mid-chain requires rollback logic. Client-side chaining is fine for linear, independent steps. Anything more complex belongs on the server.

---

**Rule:** Container layout is CSS only — `flex-direction` switches on orientation, fragments never change. Each step calls `completeStep(n, params)` — params travel in the URL, never in a shared variable. `hidden` attribute IS the progress record — read the DOM to know where you are. Push multi-dependency chains to the server.

---

## Pattern 9 — Loading Skeleton

Show a placeholder that mirrors the shape of the real content while the fetch is in flight. Two-stage swap: skeleton in immediately (zero wait), real content in when fetch resolves. Same mechanism as the spinner in Pattern 8 — but shaped like the content instead of a generic spinner.

---

### The Skeleton Fragment

Skeleton lives as inline HTML in a global helper — no round-trip needed, it appears instantly.

```js
// index.html — reusable skeleton shapes
const SKELETONS = {
  card: `
    <div class="skeleton-card">
      <div class="skel skel-title"></div>
      <div class="skel skel-line"></div>
      <div class="skel skel-line short"></div>
      <div class="skel skel-badge"></div>
    </div>
  `,
  table: `
    <div class="skeleton-table">
      <div class="skel skel-row"></div>
      <div class="skel skel-row"></div>
      <div class="skel skel-row short"></div>
    </div>
  `
};

async function loadWithSkeleton(url, containerId, skeletonKey = 'card') {
  const container = document.getElementById(containerId);

  // stage 1 — skeleton appears immediately
  container.innerHTML = SKELETONS[skeletonKey];

  // stage 2 — real content swaps in
  const html = await fetch(url).then(r => r.text());
  container.innerHTML = html;
  checkAuthSentinel(container);
}
```

```html
<!-- call site — one line replaces spinner + fetch + swap -->
<button onclick="loadWithSkeleton('/api/card?host=ENDPOINT-001', 'card-container', 'card')">
  Load Report
</button>
```

---

### CSS — Shimmer Animation

```css
.skel {
  background: linear-gradient(90deg, #1e1e1e 25%, #2a2a2a 50%, #1e1e1e 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* shape variants — match the real fragment's proportions */
.skel-title  { height: 1.2rem; width: 60%; margin-bottom: 0.75rem; }
.skel-line   { height: 0.85rem; width: 100%; margin-bottom: 0.5rem; }
.skel-line.short { width: 40%; }
.skel-badge  { height: 1.4rem; width: 5rem; border-radius: 999px; }
.skel-row    { height: 2rem; width: 100%; margin-bottom: 0.4rem; }
.skel-row.short { width: 70%; }
```

The shimmer moves right-to-left across all skeleton elements simultaneously — gives the impression of a single light sweep across the whole card.

---

### Multiple Cards in Parallel

When loading a list, show N skeletons immediately then replace each as its fetch resolves.

```js
async function loadCardList(hosts) {
  const container = document.getElementById('card-container');

  // show N skeletons at once — user sees the full list shape immediately
  container.innerHTML = hosts.map(() => SKELETONS.card).join('');

  // fetch all in parallel, swap each slot as it resolves
  const slots = [...container.children];
  await Promise.all(hosts.map(async (host, i) => {
    const html = await fetch(`/api/card?host=${host}`).then(r => r.text());
    slots[i].outerHTML = html;  // safe here — replacing the skeleton node itself
  }));
}
```

`outerHTML` is safe in this specific case because we are replacing the skeleton node (which has no stable id), not a reusable container. The real card fragment takes its place in the DOM at the same index.

---

**Rule:** Skeleton shape mirrors real content proportions — title width, line count, badge position. Inline in JS (`SKELETONS` object) for zero-latency appearance. `loadWithSkeleton()` wraps the two-stage swap so call sites stay clean. `outerHTML` replace is valid for skeleton slots; `innerHTML` replace is correct for stable named containers.

---

## Pattern 10 — Form Submit Lifecycle (POST + Three Outcomes)

Form submission is a single round-trip with three possible server responses. The submit handler is identical for all three — the server signals the outcome via `data-outcome` on the root element, and the client branches after the swap.

---

### The Submit Handler

```js
// index.html global
async function submitForm(e) {
  e.preventDefault();
  const form      = e.target;
  const container = form.closest('[id]');  // stable ancestor with an id
  const data      = Object.fromEntries(new FormData(form));

  // show skeleton/spinner immediately
  container.innerHTML = SKELETONS.form;

  const res  = await fetch(form.action, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const html = await res.text();
  container.innerHTML = html;

  // branch on outcome — server signals, client reacts
  const root    = container.firstElementChild;
  const outcome = root?.dataset.outcome;

  if (outcome === 'success') onFormSuccess(root);
  if (outcome === 'error')   onFormError(root);
  // 'invalid' — re-rendered form already in DOM, nothing extra needed
  checkAuthSentinel(container);
}

function onFormSuccess(root) {
  // e.g. advance wizard, close modal, reload list
  const next = root.dataset.next;
  if (next) completeStep(parseInt(next));
}

function onFormError(root) {
  // e.g. flash the message, scroll to top of container
  root.scrollIntoView({ behavior: 'smooth' });
}
```

---

### Three Server Responses

**Success** — action completed, show confirmation:

```html
<div data-outcome="success" data-next="2" class="modal-status success">
  <div class="modal-status-dot"></div>
  <span>Scan queued — job_id: rsn_4b2e91a</span>
</div>
```

**Error** — logic/auth failure, show message without re-rendering the form:

```html
<div data-outcome="error" class="modal-status error">
  <div class="modal-status-dot"></div>
  <span>Host ENDPOINT-001 already has an active scan job.</span>
</div>
```

**Invalid** — validation failure, re-render full form with echoed values + annotated fields:

```html
<form data-outcome="invalid" action="/api/scan" onsubmit="submitForm(event)">
  <div class="field-group error">
    <label>Host</label>
    <input name="host" value="ENDPOINT-00" />
    <span class="field-error">Must match ENDPOINT-NNN format</span>
  </div>
  <div class="field-group">
    <label>Owner email</label>
    <input name="email" value="finance@company.com" />
  </div>
  <button type="submit">Submit</button>
</form>
```

---

### The Form Fragment (initial render)

The form fragment sets `action` and `onsubmit` — submit handler lives in index.html globals.

```html
<!-- fragments/scan-form.html -->
<form data-outcome="initial" action="/api/scan" onsubmit="submitForm(event)">
  <div class="field-group">
    <label>Host</label>
    <input name="host" required pattern="ENDPOINT-\d{3}" title="Must match ENDPOINT-NNN" />
  </div>
  <div class="field-group">
    <label>Owner email</label>
    <input name="email" type="email" required />
  </div>
  <button type="submit">Submit</button>
</form>
```

HTML5 `required` and `pattern` catch obvious errors before the fetch fires — server validation is still the authority.

---

**Rule:** Server always sets `data-outcome` on the root element — `success`, `error`, or `invalid`. Client reads it after swap and reacts. `invalid` response echoes all submitted values so the user never re-types. Submit handler is one function in index.html globals — fragments carry no JS.

---

## Pattern 11 — Toast Notifications

Three feedback channels exist in htmz. Each has a distinct role:

| Channel | Blocks UI | Lifetime | When to use |
|---|---|---|---|
| Modal | yes | until dismissed | action requiring confirmation or result |
| Global banner | no | until replaced | session-level state (auth, connectivity) |
| Toast | no | auto-dismiss 3–5s | ephemeral feedback — slider changed, button tapped, copy succeeded |

Toast is the non-blocking, non-interrupting channel. Multiple toasts stack. Each removes itself.

---

### Container + Global Function

```html
<!-- index.html — fixed position, outside all swap targets, never replaced -->
<div id="toast-container"></div>
```

```js
// index.html global
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast     = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
```

---

### CSS

```css
#toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 9999;
}

.toast {
  padding: 0.6rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  animation: toast-in 200ms ease-out;
}

@keyframes toast-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.toast-info    { background: #2a2a2a; color: #e5e5e5; }
.toast-success { background: #14532d; color: #86efac; }
.toast-error   { background: #7f1d1d; color: #fca5a5; }
```

---

### Call Sites

**Slider** — fires on every value change, non-blocking:

```js
slider.on('update', values => {
  document.getElementById('host-state').dataset.cvssRange = JSON.stringify(values);
  filterCards();
  showToast(`CVSS filter: ${values[0]}–${values[1]}`, 'info');
});
```

**Button action** — lightweight confirmation without opening a modal:

```js
async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
  showToast('Copied to clipboard', 'success');
}
```

**Form submit success** — toast instead of modal when the result needs no further action:

```js
function onFormSuccess(root) {
  showToast(root.dataset.message || 'Done', 'success');
}
```

---

**Rule:** Toast for ephemeral, non-blocking feedback. Modal when the user must see and acknowledge a result. Global banner for session-level state. Never use toast for errors that require user action — those belong in the modal or re-rendered form.

---

## Pattern 12 — Security (OWASP)

htmz's trust boundary is entirely server-side. React's JSX escapes user data by default. htmz's `innerHTML` does not — the client has no opportunity to sanitise. Every user-supplied value that reaches a fragment must be escaped on the server before it enters HTML.

---

### Risk Map

| Risk | Where it hits | OWASP | Mitigation |
|---|---|---|---|
| XSS via innerHTML | Every fragment swap — `container.innerHTML = html` | A03 | Server escapes all user-supplied values before writing into fragment |
| Form echo XSS | Pattern 10 re-render — submitted field values echoed back into HTML | A03 | Escape echoed values server-side; never reflect raw input |
| Open redirect | Pattern 7 auth sentinel — `data-redirect` sourced from URL param | A01 | Validate redirect target against allowlist; never reflect URL param directly |
| CSRF | POST endpoints — `/api/rescan`, `/api/notify`, form submissions | A01 | CSRF token in every form + verified server-side; or SameSite=Strict cookies |
| Fragment param injection | `/api/card?host=ENDPOINT-001` — param hits server unvalidated | A03/A01 | Validate and allowlist all fragment URL params server-side |

---

### XSS — Server Escaping is the Only Defence

```js
// Node/Express — escape before writing into fragment HTML
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

app.post('/api/notify', (req, res) => {
  const { host, recipient } = req.body;
  res.send(`
    <div class="modal-status success">
      <span>Notified ${esc(recipient)} for ${esc(host)}</span>
    </div>
  `);
});
```

```go
// Go — html/template auto-escapes; use it, never fmt.Sprintf raw HTML with user input
import "html/template"

var tmpl = template.Must(template.New("notify").Parse(`
  <div class="modal-status success">
    <span>Notified {{.Recipient}} for {{.Host}}</span>
  </div>
`))

// tmpl.Execute(w, data) — all fields escaped automatically
```

**Go rule:** use `html/template` not `fmt.Fprintf` for any fragment containing user-supplied values. `html/template` escapes contextually (attribute vs text node vs JS context). `fmt.Sprintf` does not.

---

### Form Echo XSS

Pattern 10 re-renders the form with submitted values echoed back. This is the highest-risk surface — attacker submits `"><script>alert(1)</script>` as a field value.

```go
// ❌ WRONG — raw echo into value attribute
fmt.Fprintf(w, `<input name="host" value="%s" />`, r.FormValue("host"))

// ✅ CORRECT — html/template escapes the value attribute context
tmpl.Execute(w, FormData{ Host: r.FormValue("host") })
```

```html
<!-- template — host is escaped in attribute context automatically -->
<input name="host" value="{{.Host}}" />
```

---

### Open Redirect — Allowlist the Redirect Target

Pattern 7 auth sentinel carries `data-redirect`. Never source this from a URL parameter directly.

```js
// ❌ WRONG — attacker sets ?next=https://evil.com
const redirect = new URLSearchParams(location.search).get('next');
res.send(`<div data-auth-required data-redirect="${redirect}"></div>`);

// ✅ CORRECT — validate against allowlist of known safe paths
const ALLOWED_REDIRECTS = ['/dashboard', '/scan', '/reports'];
const next  = req.query.next;
const safe  = ALLOWED_REDIRECTS.includes(next) ? next : '/dashboard';
res.send(`<div data-auth-required data-redirect="${safe}" hidden></div>`);
```

---

### CSRF — Token per Form

```html
<!-- server injects CSRF token into every form fragment -->
<form action="/api/scan" onsubmit="submitForm(event)">
  <input type="hidden" name="_csrf" value="{{.CSRFToken}}" />
  <!-- fields -->
</form>
```

```js
// submitForm picks up the token from FormData automatically
const data = Object.fromEntries(new FormData(form));
// data._csrf is included in the POST body
```

For non-form API calls (action buttons), send token as a header:

```js
// index.html — set once at page load from a meta tag
const CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]').content;

async function callAPI(action, host, target) {
  const res = await fetch('/api/rescan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': CSRF_TOKEN
    },
    body: JSON.stringify({ host })
  });
  // ...
}
```

```html
<!-- index.html head — server writes token once -->
<meta name="csrf-token" content="{{.CSRFToken}}" />
```

---

### Fragment Param Validation

URL params that reach server templates must be validated before use.

```js
// ❌ WRONG — raw param into query or fragment
const host = req.query.host;
db.query(`SELECT * FROM hosts WHERE name = '${host}'`);  // SQL injection

// ✅ CORRECT — allowlist known hosts, or parameterise the query
const KNOWN_HOSTS = ['ENDPOINT-001', 'ENDPOINT-002', 'ENDPOINT-003'];
const host = KNOWN_HOSTS.includes(req.query.host) ? req.query.host : null;
if (!host) return res.status(400).send('<div class="error-fragment">Invalid host</div>');
```

---

**Cardinal security rule:** The server is the only sanitisation point. Escape all user-supplied values before they enter HTML. Use `html/template` in Go — never `fmt.Sprintf` raw HTML. Validate all fragment URL params against an allowlist. CSRF tokens on every form and non-form POST.

---

## Pattern 13 — Backend Error Handling (The `#error-zone` pattern)

**Problem:** htmz swaps nodes blindly. If the backend returns an error (4xx/5xx), htmz may render an empty slot or a broken fragment, failing silently.

**Solution:** Designate an `#error-zone` in the host page. The API handler (`fetch`) checks the response status. On non-OK, it clears the primary target and staples the error fragment into the `#error-zone`.

```html
<!-- index.html — stable error zone inside a modal or layout -->
<div id="modal-response"></div>
<div id="modal-error"></div>   <!-- designated error zone -->
```

```js
// index.html — API handler
async function callAPI(endpoint, targetId) {
  const res = await fetch(endpoint);
  const html = await res.text();

  if (res.ok) {
    // success path: target the primary zone
    document.getElementById(targetId).innerHTML = html;
    document.getElementById('modal-error').innerHTML = ''; // clear errors
  } else {
    // error path: clear primary zone, target error zone
    document.getElementById(targetId).innerHTML = '';
    document.getElementById('modal-error').innerHTML = html;
  }
}
```

```go
// backend (Go) — returns an error fragment with 500 status
http.HandleFunc("/api/data", func(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusInternalServerError)
    fmt.Fprintf(w, `
        <div class="modal-status error">
            <div class="modal-status-dot"></div>
            <span>Backend failure — code: 500</span>
        </div>`)
})
```

**Key Insight:** This separates success markup from error markup. The server provides the "what" (the error UI), and the client provides the "where" (redirection to the error zone).

---

## Pattern 14 — Fragment Timeout Watchdog (Two-Layer Error Handling)

**Problem:** htmz swaps fragments blindly. Two distinct failure modes exist and require different mitigations:

1. **Server returns 500** — server is up but fragment generation failed. htmz still fires `onload` and injects whatever body it received.
2. **Server completely unreachable** — no response arrives. `onload` never fires. The skeleton slot sits forever.

A single mechanism cannot handle both. Each requires its own layer.

---

### Layer 1 — Backend: Always Return HTML

Fragment handlers wrap generation in `recover()`. On any panic or read error, they write an error fragment with the **correct slot ID** back to the response. htmz injects it normally — skeleton replaced by error card.

```go
func errorFragment(slotID, msg string) string {
    return fmt.Sprintf(`<div id="%s" class="error-card">
    <div class="card-body">
        <div class="error-state">
            <span class="error-icon">⚠</span>
            <span>%s</span>
        </div>
    </div>
</div>`, slotID, msg)
}

func fragmentHandler(slotID, filePath string) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "text/html")
        defer func() {
            if rec := recover(); rec != nil {
                fmt.Fprint(w, errorFragment(slotID, fmt.Sprintf("panic: %v", rec)))
            }
        }()
        content, err := os.ReadFile(filePath)
        if err != nil {
            w.WriteHeader(http.StatusInternalServerError)
            fmt.Fprint(w, errorFragment(slotID, "fragment unavailable"))
            return
        }
        w.Write(content)
    }
}
```

Register fragment routes **before** the catch-all static file server:

```go
http.HandleFunc("/fragments/host-001-card.html", fragmentHandler("card-container", "fragments/host-001-card.html"))
http.HandleFunc("/fragments/host-002-card.html", fragmentHandler("host-002-card",  "fragments/host-002-card.html"))
http.HandleFunc("/fragments/host-003-card.html", fragmentHandler("host-003-card",  "fragments/host-003-card.html"))
http.Handle("/", http.FileServer(http.Dir(".")))  // catch-all last
```

---

### Layer 2 — Frontend: Timeout Watchdog

`loadFragment()` replaces the bare htmz link click. It sets `data-loading` on the slot, drives htmz via `iframe.src`, then starts a watchdog timer. If `data-loading` is still present after `FRAGMENT_TIMEOUT` ms, the server never responded — inject error card directly.

```js
const FRAGMENT_TIMEOUT = 5000;

function loadFragment(src, slotId) {
    const slot = document.getElementById(slotId);
    if (slot) {
        slot.setAttribute('data-loading', '');
        slot.classList.add('fragment-loading'); // shimmer CSS
    }

    // Drive htmz via iframe.src — cache-bust with ?t= so same-URL re-nav
    // always fires onload (browser skips navigation if src hasn't changed)
    const iframe = document.querySelector('iframe[name="htmz"]');
    if (iframe) iframe.src = src + '?t=' + Date.now() + '#' + slotId;

    // Watchdog — fires only when backend is totally unreachable
    setTimeout(() => {
        const s = document.getElementById(slotId);
        if (s && s.hasAttribute('data-loading')) {
            s.outerHTML = errorCard(slotId, 'Request timed out — server unreachable');
        }
    }, FRAGMENT_TIMEOUT);
}

function errorCard(id, msg) {
    return `<div id="${id}" class="error-card">
        <div class="card-body">
            <div class="error-state">
                <span class="error-icon">⚠</span>
                <span>${msg}</span>
            </div>
        </div>
    </div>`;
}
```

The watchdog checks `data-loading` — present while the swap is in flight, gone once htmz completes (success or Layer 1 error fragment). Watchdog no-ops cleanly in both success paths.

**Why `iframe.src` not `a.click()`:** A synthetic anchor created via `createElement` and clicked without being in the document is unreliable — some browsers silently ignore the frame navigation. Setting `iframe.src` directly is explicit and always works.

**Why `?t=Date.now()`:** If the user navigates to the same fragment twice, `iframe.src` is already that URL. The browser sees no change and doesn't fire `onload`. The timestamp makes every call a unique URL, forcing a real navigation every time. Go's `http.ServeMux` strips query strings before route matching, so `?t=...` is invisible to the handler.

---

### Cards Array — Structured with Slot IDs

```js
const cards = [
    { href: 'fragments/host-001-card.html#card-container', slot: 'card-container' },
    { href: 'fragments/host-002-card.html#host-002-card',  slot: 'host-002-card'  },
    { href: 'fragments/host-003-card.html#host-003-card',  slot: 'host-003-card'  },
];

function loadNext() {
    if (step >= cards.length) return;
    const { href, slot } = cards[step];
    loadFragment(href, slot);
    step++;
    if (step < cards.length) setTimeout(loadNext, 320);
}
```

---

### Error Card CSS

```css
.error-card {
    background: #160b0b;
    border: 1px solid rgba(248,81,73,0.3);
    border-radius: 10px;
    overflow: hidden;
}
.error-state {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 24px;
    color: #ff7b72;
    font-size: 0.875rem;
}
.error-icon { font-size: 1.25rem; flex-shrink: 0; }
```

---

---

### Pitfall — Same-URL Re-navigation (iframe `onload` not firing)

**Symptom:** First load works. Clicking the same nav item again shows the shimmer indefinitely — watchdog fires after 5s with "server unreachable" even though the server is up.

**Root cause:** `iframe.src = '/fragments/dashboard.html#content-area'` on the second click sets the same URL that's already loaded. The browser detects no change and does **not** navigate — `onload` never fires, `data-loading` never clears, watchdog triggers.

**Fix — cache-bust with `Date.now()`:**

```js
iframe.src = src + '?t=' + Date.now() + '#' + tid;
```

`Date.now()` returns the current Unix timestamp in milliseconds (e.g. `1747310400123`), making every call a unique URL. The browser always navigates, always fires `onload`, swap completes cleanly.

**Why the query string is safe on the server:** Go's `http.ServeMux` strips the query string before route matching. `?t=1747310400123` is invisible to the handler — `/fragments/dashboard.html?t=...` still matches the `/fragments/dashboard.html` route exactly. The same applies to any static file server.

---

### Pitfall — Blank iframe fires `onload` on page load

**Symptom:** On initial page load, the htmz iframe fires `onload` once before any fragment is requested. At this point `contentWindow.location.hash` is `""`. `document.querySelector("")` throws a `SyntaxError` in the callback.

**Fix — guard against empty hash:**

```js
onload="setTimeout(()=>{
  const h = contentWindow.location.hash;
  if (!h) return;
  document.querySelector(h)?.replaceWith(...contentWindow.document.body.childNodes);
  if(window.basecoat) window.basecoat.initAll();
  initAccordions();
},0)"
```

The `if (!h) return` short-circuits the blank-iframe case. All subsequent real fragment loads have a non-empty hash and proceed normally.

---

**Rule:** Backend always returns HTML — never a bare status code. Layer 1 catches server-side failures. Layer 2 catches server-down failures. Watchdog self-cancels once the skeleton is replaced — no cleanup needed. Always cache-bust `iframe.src` with `?t=Date.now()` when driving htmz programmatically. Guard `onload` against empty hash. `loadFragment()` is the single entry point for all htmz fragment loads.

---

## Pattern 16 — SSE Streaming Into a Fragment (htmz + EventSource)

**Problem:** htmz swaps HTML fragments synchronously — one request, one response. Long-running tasks (LLM token streams, live log tails, progress updates) can't fit in a single response.

**Pattern:** Split into two requests with two different APIs:
1. htmz (POST/GET) → fragment swap to *set up* the streaming container
2. `EventSource` (GET) → append streamed lines into that container

htmz handles *navigation* (which task, which panel to show). `EventSource` handles *streaming* (the ongoing output). Neither replaces the other.

### The handoff mechanism — `data-*` attribute

The server embeds a `data-task` attribute in the swapped fragment to carry context from server → client:

```html
<!-- Server returns this fragment for POST /header?task=ps#output-panel -->
<div id="output-panel">
  <pre id="trace-body" data-task="ps"><span class="spinner"></span></pre>
</div>
```

After htmz swaps this in, the `onload` handler reads `data-task` and opens the SSE stream:

```js
htmzFrame.onload = function () {
  setTimeout(() => {
    // 1. Manual swap (same as standard htmz)
    const hash = htmzFrame.contentWindow.location.hash;
    if (!hash) return;
    const target = document.querySelector(hash);
    if (target) target.replaceWith(...htmzFrame.contentDocument.body.childNodes);

    // 2. Read context from newly-inserted element → start SSE
    const traceBody = document.getElementById('trace-body');
    if (traceBody && traceBody.dataset.task) {
      streamTask(traceBody.dataset.task);
    }
  }, 0);
};
```

The `setTimeout(0)` defers one tick so the DOM is fully settled before `getElementById` runs.

### Server — two endpoints

```go
// POST /header?task=ps#output-panel
// Returns the fragment. htmz swaps it; JS reads data-task and opens SSE.
http.HandleFunc("/header", func(w http.ResponseWriter, r *http.Request) {
    name := r.URL.Query().Get("task")
    fmt.Fprintf(w, `<div id="output-panel">
      <pre id="trace-body" data-task="%s"><span class="spinner"></span></pre>
    </div>`, name)
})

// GET /run?task=ps — SSE stream. Sends one line per event, [DONE] at end.
http.HandleFunc("/run", func(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("X-Accel-Buffering", "no")      // disable nginx buffering
    flusher := w.(http.Flusher)

    // ... run command, pipe stdout ...
    for scanner.Scan() {
        fmt.Fprintf(w, "data: %s\n\n", scanner.Text())
        flusher.Flush()
    }
    fmt.Fprintf(w, "data: [DONE]\n\n")
    flusher.Flush()
})
```

### Client — SSE consumer

```js
function streamTask(name) {
  const traceBody = document.getElementById('trace-body');
  let firstLine = true;

  const sse = new EventSource(`/run?task=${encodeURIComponent(name)}`);

  sse.onmessage = (e) => {
    if (e.data === '[DONE]') { sse.close(); return; }

    if (firstLine) {
      firstLine = false;
      traceBody.textContent = '';   // drop spinner
    }
    traceBody.textContent += e.data + '\n';
    traceBody.scrollTop = traceBody.scrollHeight;   // auto-scroll
  };

  sse.onerror = () => { sse.close(); };
}
```

### Key rules

| Rule | Why |
|------|-----|
| Cancel previous `EventSource` before a new htmz swap | Stale stream keeps appending to new task's panel |
| `X-Accel-Buffering: no` on the SSE response | nginx/proxy buffers SSE — lines arrive in batches without this |
| `[DONE]` sentinel (not just connection close) | Clean shutdown; error vs. completion is distinguishable |
| Drop spinner on first data line (`textContent = ''`) | Spinner lives as initial content; first real line replaces it |
| `scrollTop = scrollHeight` after each append | Auto-scroll to bottom as output streams |

### When to use this pattern vs. plain htmz

| Need | Use |
|------|-----|
| Single response, known content | Plain htmz fragment swap |
| Long-running output, live log tail | htmz (setup) + EventSource (stream) |
| Token-by-token LLM output | htmz (setup) + EventSource (stream) — see `examples/loquix-chat/` |
| Binary/file download | Server-Sent Events not suitable — use chunked XHR or a link |

**Examples:** `examples/sse/` (task runner, Go server), `examples/loquix-chat/` (LLM token streaming, Node server)

---

## Pattern Status

**Retired 2026-07-03** — this section used to keep its own `[x]`/`[ ]` completion checklist plus a separate "Known Issues" list, duplicating status the knowledge file also tracked (and drifting from it — Pattern 19/20 sat marked incomplete here for weeks after their examples were built). Single source of truth for done/pending/known-issues is now `# HOW` in [[../../knowledge/htmz-vanilla-assistant-ui.md]] — check there, not here. This file keeps the pattern catalog (below) and the Examples index (above) — reference content, not status.
