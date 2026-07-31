# basecoat-linear

**What it demonstrates:** Adapting an AI-generated design system (Linear brand tokens via `getdesign`) into a functional htmz dashboard with database-backed dynamic fragments.

## Patterns

| Pattern | Name |
|---------|------|
| Pattern 4 | Tab Control with Parameterised Loading |
| Pattern 2 | Server Returns HTML Fragment (not JSON) |
| Pattern 6 | DOM as State Manager |

## Notable techniques

- **Design token bridge** — 14 CSS variables map the Linear brand palette into Basecoat's `--color-*` tokens; any `<button class="btn">` or `<div class="badge">` inside a fragment automatically adopts the Linear aesthetic without per-fragment overrides.
- **Dynamic DB-backed endpoints** — `fragments/endpoints.html` is generated from a live data source; row click opens a modal with `data-*` row details fetched from the host-page `#state` node (Pattern 6).
- **Active/failed status filters** — filter buttons write to `dataset` on the state node, then re-fetch the filtered fragment; demonstrates Pattern 6's explicit re-render model (no subscriptions).
- **Chart.js tickers + sparklines** — metric cards use Chart.js initialised from host-page globals after fragment swap; Chart.js is a vanilla JS library requiring no adapter (Pattern 5 implicit).
- **`getdesign` workflow origin** — generated from `npx getdesign linear`; shows the full pipeline from design token extraction to working htmz UI.

## See also

[PATTERNS.md](../../PATTERNS.md) — full pattern reference (Patterns 1–14).
