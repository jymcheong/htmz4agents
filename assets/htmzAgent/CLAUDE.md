# htmzAgent

## Alfred Knowledge

[[../../knowledge/htmz-vanilla-assistant-ui.md]] — architecture, pattern catalog, per-example status table, lessons learned
[[../../knowledge/htmz.md]] — core htmz library facts (166-byte micro-framework, iframe+hash swap mechanism)

> Load both before reading any example or adding a new pattern.

## Skills — load before touching any file in this project

→ Skill: [[../../skills/htmz-frontend/SKILL.md]] — Patterns 1, 6, 13, 14 enforcement for robust partial swaps
→ Skill: [[../../skills/htmz-review/SKILL.md]] — 10-point pre-delivery quality gate, run before declaring any example done

## Components

| Dir | Role |
|-----|------|
| `examples/` | One subdirectory per pattern demo — each has its own README.md, server (Go/Node/static), and status |
| `PATTERNS.md` | Living pattern catalog — stack table + examples index, ~1382 lines |
| `dom-is-the-state.md` | Core philosophy doc — DOM as state manager |
| `why-htmz.html` | Standalone pitch doc |

## Pattern status

**Retired 2026-07-03** — this table duplicated status also kept in `PATTERNS.md`'s own checklist, and the two drifted apart (this table said P19 done; `PATTERNS.md`'s checklist still said not-started, for weeks). Single source of truth is now `# HOW` in [[../../knowledge/htmz-vanilla-assistant-ui.md]] — check there for done/pending/known-issues.

## Coding Constraints

- No build step, no bundler — every example ships as plain HTML/JS files servable by a stdlib server.
- Server owns business logic → HTML fragments. Vanilla JS owns system APIs (`fetch`, `dialog`, `setInterval`, `dispatchEvent`). Alpine.js owns UI state only (classes, open/close, `x-text`) — never async.
- Demo servers: use `nohup <cmd> > /tmp/htmz-server.log 2>&1 &` — plain `&` backgrounding dies when the agent bash session ends.
- Run `skills/htmz-review/SKILL.md` checklist before declaring any new example done.

graphify removed repo-wide 2026-06-21 (see root `CLAUDE.md` `## graphify`) — for pre-edit context here, use `rtk grep` over `examples/` + `PATTERNS.md`, not a dependency graph tool.
