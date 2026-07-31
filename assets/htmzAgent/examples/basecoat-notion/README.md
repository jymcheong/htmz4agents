# basecoat-notion

**What it demonstrates:** High-fidelity Notion-style dashboard using htmz fragment routing and Basecoat, built from a `getdesign notion` design token extraction.

## Patterns

| Pattern | Name |
|---------|------|
| Pattern 4 | Tab Control with Parameterised Loading |
| Pattern 2 | Server Returns HTML Fragment (not JSON) |
| Pattern 6 | DOM as State Manager |

## Notable techniques

- **Notion design token port** — CSS variables extracted from Notion's live site via `getdesign`; Basecoat component classes are overridden with Notion's exact greys, sidebar background, and typography scale.
- **Two-fragment layout** — `fragments/endpoints.html` and `fragments/dashboard.html` cover the two primary views; sidebar nav swaps the content area via htmz (Pattern 4 sidebar variant).
- **MCP-generated content** — dashboard built via Notion MCP tooling session; demonstrates htmz as the rendering layer for programmatically generated UI.
- **Basecoat + Alpine.js** — table rows, badges, and dropdowns use Basecoat components that auto-init via Alpine MutationObserver after every swap.

## See also

[PATTERNS.md](../../PATTERNS.md) — full pattern reference (Patterns 1–14).
