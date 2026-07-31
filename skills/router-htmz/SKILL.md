# Skill: router-htmz

**Type:** on-demand
**Category:** DEV
**Triggers:** "build frontend", "create htmz UI", "htmz fragment", "add tab", "frontend work", "review htmz", "check htmz example", "htmz quality check", "animate this", "add animejs animation", "use animejs", "animating with animejs", "htmz", "frontend", "get design for", "copy site style", "match site look", "drop a DESIGN.md", "show me", "does it look right", "screenshot", "verify UI", "test in browser"

## Purpose

Single-hop frontend router. Routes htmz builds, design system setup, visual QA, and animation to the correct specialist skill.

## Procedure

1. Match the user's request against the table below:

| Trigger pattern | Specialist skill | Description |
|---|---|---|
| "build frontend", "create htmz UI", "htmz fragment", "add tab", "frontend work", building new UI | `htmz-frontend/SKILL.md` | Procedural guidance for htmz + Basecoat; enforces Patterns 1, 6, 13, 14 for robust partial swaps |
| "review htmz", "check htmz example", "htmz quality check", reviewing existing htmz code | `htmz-review/SKILL.md` | Pre-delivery quality gate — 10-point checklist covering swap isolation, dialog placement, event bridge, Alpine auto-init, empty states, fragment hygiene |
| "animate this", "add animejs animation", "use animejs", "animating with animejs", animation on existing htmz UI | `animejs/SKILL.md` | Driving CSS, SVG, DOM animations with Anime.js and wiring three-phase htmz swaps |
| "get design for", "copy site style", "match site look", "build a page that looks like", "drop a DESIGN.md", "use site design" | `getdesign/SKILL.md` | Drop DESIGN.md from 73-site catalog (npx getdesign) or arbitrary URL (designmdme); build htmz sample page matching the design system |
| "does it look right", "verify UI", "test in browser", "UI screenshot", "check the page", "check the frontend", UI/CSS changes on running local server | `chrome-visual-test/SKILL.md` | Full-fidelity UI screenshots via Chrome MCP or headless Chrome — replaces broken preview panel for CDN-dependent styles |

2. Load matched skill via `Skill` tool.
3. Execute per that skill's procedure.

## Notes

- Build vs review is the primary split — if user says "build and review", load htmz-frontend first, then htmz-review after output is ready.
- animejs always assumes an htmz page already exists — if it doesn't, load htmz-frontend first.
- getdesign comes before htmz-frontend in a new project — get design system first, then build.
- If ambiguous, default to `htmz-frontend`.

## Relations

- specialist skills: `../htmz-frontend/SKILL.md`, `../htmz-review/SKILL.md`, `../animejs/SKILL.md`, `../getdesign/SKILL.md`, `../chrome-visual-test/SKILL.md`
- companion router: `../router-diagram/SKILL.md`

## Changelog
### 2026-07-12
- Created — groups htmz-frontend + htmz-review + animejs under single router entry
→ [[../../sessions/2026-07/2026-07-12.ClaudeBot.md]]
