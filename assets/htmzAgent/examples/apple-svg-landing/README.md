# apple-svg-landing

**What it demonstrates:** Tab control with per-tab Anime.js SVG/canvas animations triggered on fragment swap — Apple-style dark landing page aesthetic.

## Patterns

| Pattern | Name |
|---------|------|
| Pattern 4 | Tab Control with Parameterised Loading |

## Notable techniques

- **`animateTabSwap(srcUrl, targetId, tabButton)`** — custom wrapper around htmz that (1) marks the active tab button, (2) drives the iframe swap, (3) runs a tab-specific animation function (`runArchitectureAnimation`, `runDecoyAnimations`, `runPerformanceAnimations`) after content is in the DOM.
- **Per-tab SVG animations** — each of the three fragments (`architecture-fragment.html`, `decoy-efficacy.html`, `performance-metrics.html`) triggers a distinct Anime.js animation sequence: node-graph path-drawing, animated progress bars, counter roll-ups.
- **Anime.js + htmz coordination** — animations are fired from the host page globals after swap, not inside fragments; fragments carry no JS.
- **Static, no backend** — demonstrates Pattern 4's tab mechanism works with pure static fragment files.

## See also

[PATTERNS.md](../../PATTERNS.md) — full pattern reference (Patterns 1–14).
