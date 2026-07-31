# react-island

**What it demonstrates:** Pattern 15 — htmz owns page structure and fragment routing; a single `ReactDOM.createRoot` slot mounts a React component as an isolated island.

## Patterns

| Pattern | Name |
|---------|------|
| Pattern 15 | React Island + htmz |
| Pattern 4 | Tab Control with Parameterised Loading (outer nav) |

## Notable techniques

- **Island boundary** — `<div id="react-mount"></div>` is the only element React touches; htmz swaps everything else. The island persists across htmz navigations because it lives outside all swap targets.
- **`ReactDOM.createRoot` on swap** — when a fragment containing a React island trigger loads, the host-page global calls `ReactDOM.createRoot(document.getElementById('react-mount')).render(...)` once; React owns its subtree, htmz owns the rest.
- **No server fallback** — page operates without a backend; demonstrates the island pattern is a pure client-side concern independent of the fragment transport layer.
- **DEC-002 boundary** — clearly delineates where React's reconciler is legitimate (complex interactive widget) vs where htmz's direct DOM swap is sufficient (page structure, nav, content regions).

## See also

[PATTERNS.md](../../PATTERNS.md) — full pattern reference (Patterns 1–14).
