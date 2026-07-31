# Skills Index

> 8 skills shipped in `skills/` — frontend/dev-loop procedures for building and reviewing htmz-based UIs with an agent. `router-htmz` is the entry point; the other 5 frontend skills are also directly invocable.

| Skill | Type | Category | Description |
|---|---|---|---|
| `router-htmz/SKILL.md` | router | FRONTEND | Single-hop router — matches "build frontend", "review htmz", "animate this", "get design for", "screenshot/verify UI" style requests to the correct specialist skill below. |
| `htmz-frontend/SKILL.md` | on-demand | FRONTEND | Procedural guidance for building htmz + Basecoat UIs — enforces Patterns 1, 6, 13, 14 (fragment→API, DOM as state, error handling) for robust partial swaps. |
| `htmz-review/SKILL.md` | on-demand | FRONTEND | Pre-delivery quality gate — 10-point checklist (swap isolation, dialog placement, event bridge, Alpine auto-init, empty states, fragment hygiene). Run before declaring any htmz work "done". |
| `animejs/SKILL.md` | on-demand | FRONTEND | Driving CSS/SVG/DOM animation with Anime.js; wiring three-phase animations into htmz partial swaps. |
| `getdesign/SKILL.md` | on-demand | FRONTEND | Drop a `DESIGN.md` from a catalogued site (or an arbitrary URL) into a project, then build UI matching that design system. |
| `chrome-visual-test/SKILL.md` | on-demand | FRONTEND | Real-browser UI verification via Claude-in-Chrome MCP — required (not the preview panel) for CDN-loaded CSS, Google Fonts, or GPU-composited effects, which the preview panel renders degraded or blank. |
| `bonsai-task/SKILL.md` | on-demand | DEV | Drive a local Bonsai 27B LLM (llama-server) as a tmux Claude Code session for bounded htmz/HTML/JS coding tasks — no cloud dispatch, local git tracking only. |
| `preview/SKILL.md` | on-demand | DEV | Serve any generated artifact (image, HTML deck, markdown) as a reachable URL via the htmz-wiki-viewer process — `/view/` for markdown, `/raw/` for everything else. |

## Relations

- Frontend build/patterns reference: [`assets/htmzAgent/PATTERNS.md`](assets/htmzAgent/PATTERNS.md)
- Runnable examples cross-referenced by pattern number: [`assets/htmzAgent/PATTERNS.md#examples-index`](assets/htmzAgent/PATTERNS.md)
- Runtime tiers + quickstart: [`HANDOVER.md`](HANDOVER.md)
