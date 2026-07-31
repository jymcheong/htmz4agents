# Your next MVP doesn't need a framework. It needs 166 bytes.

I'm a backend person. CGI Perl. PHP. Server-side JavaScript. The server takes a request, does a thing, returns a response. That model I understand.

Then React arrived. I tried the low-code route first — drag-and-drop builders, visual editors. Still tedious, just differently tedious. So I went by hand. Components, hooks, state trees, a build pipeline. I spent more time troubleshooting than building. Stack Overflow tabs outnumbering product tabs. A tourist who kept getting lost.

HTMX and htmz ([leanrada.com/htmz](https://leanrada.com/htmz/)) brought me back to familiar ground — server returns HTML, browser swaps it in. The mental model clicked. But hand-authoring fragments and wiring up templates was still tedious work I kept avoiding.

Then LLMs arrived. Suddenly the tedious part disappeared. The model writes the HTML, wires the fragments, handles the template logic. It doesn't hallucinate hook rules or invent component APIs that don't exist. It just writes HTML — the one thing it was trained on more than anything else.

---

## Frameworks vs htmz at a glance

| | React / Vue / Angular / Svelte | htmz |
|---|---|---|
| Setup | `npm create`, build pipeline, `node_modules` | One `<iframe>` tag |
| Size | MB of dependencies | 166 bytes |
| State | `useState` → sync to DOM | DOM attributes *are* the state |
| Forms | controlled inputs, `onChange`, reset logic | POST → server returns HTML, done |
| Vanilla libs (sliders, charts) | Need a React wrapper package | Drop in directly, no adapter |
| Streaming | Suspense / third-party | Native `EventSource`, 3 lines |
| Agent authoring | Needs component/hook context | Writes HTML files |
| Right for | Large teams, rich interaction, design systems | MVPs, tools, dashboards, demos |

---

## Where htmz breaks down

Considerations before committing:

- **Optimistic UI / offline-first.** htmz round-trips to the server on every interaction. If you need instant feedback without a network call — collaborative editing, offline mode, speculative updates — you need client-side state.
- **Highly interactive canvas-style UIs.** Drag-and-drop builders, animation timelines, drawing tools. The interaction surface is too dense and too fast for server round-trips.
- **Teams where React is the lingua franca.** This is convention, not architecture. Large projects run fine on Web Components — non-framework, no build pipeline, reusable across any stack. htmz scales the same way if the team agrees on the pattern. The real constraint is what your hiring pool knows and what your team is used to, not what the technology can handle.
- **Lots of real-time state across many regions.** If multiple parts of the page react simultaneously to the same event stream, coordinating innerHTML swaps manually gets messy fast. A reactive framework earns its keep here.

If none of those apply — and for most MVPs and internal tools, none do — htmz is enough.

---

## LLMs are already good at this entire stack

Modern LLMs are genuinely competent at everything htmz needs — not as a special case, but because it maps directly to what they were trained on.

- **CRUD logic** — reading data, writing queries, shaping results
- **Server routes** — a function that takes a request and returns a string; trivial in any language
- **HTML and CSS** — trained on the entire web; native territory
- **Fragment templating** — string interpolation with data; as simple as it gets

This is the LLM's comfort zone. It doesn't slip here.

Frameworks evolve. APIs change, patterns get deprecated, best practices shift between major versions. That churn has a hidden cost: your CLAUDE.md, your project context files, your prompts — all of it needs updating to stay accurate. Across multiple projects, that maintenance burden compounds quietly until the LLM is confidently generating code against a version you no longer run.

HTML, HTTP, and the DOM have been stable for decades. A fragment written today works the same way it did in 2005. There is no version to track, no migration to document, no context file to keep current.

Each fragment is self-contained: read the data, produce the HTML. No component graph to trace. No state ownership to reason about. Fixing something means rewriting one file — the LLM doesn't need context beyond that fragment.

The payoff is less back-and-forth, fewer wrong assumptions, and an LLM that spends its context on your product logic instead of framework plumbing.

---

## Backend flexibility

htmz has one contract with the server: return HTML. That's it. Any language, any framework, any runtime.

- **Python** (Flask/FastAPI) — great for data pipelines, ML outputs, quick internal tools
- **Go** — single binary, low memory, easy to deploy; ideal for security tools and agents
- **Node/Express** — familiar, fast to prototype, same language as your frontend scripts
- **Ruby, PHP, Elixir, Rust** — whatever your team already runs in production

No JSON shape to agree on. No API versioning. No serialisation layer between your data and what the user sees. The server renders the fragment directly — your template engine, your data, your HTML.

This also means htmz fits naturally into existing backends. You don't rewrite — you add a route that returns an HTML fragment alongside the JSON routes you already have. Incremental adoption, zero migration cost.

For agents: the backend is just another file the agent can write. Generate a route, generate a fragment template, done. No client-side type definitions to keep in sync.

---

## Patterns that cover most of what you need

These are the recurring building blocks. Each one replaces something you'd reach for a framework to handle.

**Fragment swap** — server returns HTML, client staples it into a named container. One `innerHTML` call. No JSON parsing, no client-side templating. This is 80% of what most UIs do.

**DOM as state manager** — one `<div id="host-state" data-* hidden>` outside all swap targets. Survives every fragment replacement. Fragments read from it, write to it. No Redux, no Context, no Zustand.

**Tab control** — `active` class on the button IS the selected tab. Content is a fetched fragment. Parameter from Tab 1 travels in the fetch URL to Tab 2 — no shared page variable, no stale-value risk.

**Form lifecycle** — POST to server, server returns one of three outcomes tagged `data-outcome`: success, error, or re-rendered form with values echoed back and errors annotated inline. One submit handler for every form in the app.

**Loading skeleton** — show a placeholder shaped like the real content instantly, swap in real content when fetch resolves. Two-stage swap: skeleton → real. No loading state variable.

**Fragment chaining** — wizard or progressive disclosure. Each step reveals the next slot (`hidden` attribute IS the progress). On desktop: horizontal tabs. On mobile: vertical scroll. Same fragments, CSS does the layout switch.

**Toast notifications** — ephemeral feedback without blocking the UI. `showToast(msg, type)` callable from any fragment button. Auto-dismisses. No notification state to manage.

**Vanilla JS drop-in** — sliders, date pickers, charts, rich text editors. Point any vanilla library at a DOM element and read its value on demand. No wrapper package, no version lag.

Full code for each pattern: [`PATTERNS.md`](PATTERNS.md)

---

The rule: if you can describe your UI as "show this, swap that when this happens" — you don't need React. You need a server that returns HTML and 166 bytes to put it on the page.
