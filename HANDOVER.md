# HTMz Asset Handover — 2026-07-30

## Start Here
Read this file top to bottom. Follow each section in order.

## WHAT
tool — htmz is a 166-byte HTML micro-framework for partial page updates using an iframe + URL hash DOM targeting mechanism. No build step, no dependencies, no JavaScript API — pure HTML. Agent-written HTML fragments are the content layer; htmz is the swap mechanism.

Key architecture insight: **agent writes fragments to disk, UI picks them up** — the agent is the new webpack. Basecoat (Alpine.js MutationObserver) auto-initialises components injected by htmz.

---

## Assets — Runtime Requirements

### `assets/htmzAgent/` — static examples + pattern reference

Examples fall into 4 tiers by runtime requirement:

---

**Tier 1 — Fully offline** (open directly in browser, no server at all):
- `alpine-toast`, `animejs-swap`, `apple-svg-landing`
- `basecoat-notion`, `passkey-webauthn`
- `qa-evidence`, `static-demo`, `theme-switch`
- `PATTERNS.md`, `why-htmz.html`

```bash
# Serve the whole htmzAgent dir
cd assets/htmzAgent
python3 -m http.server 8080
# Open any Tier 1 example: http://localhost:8080/examples/alpine-toast/
```

---

**Tier 2 — Static HTML + public internet API** (works if online):
- `confirm-dialog` — POSTs to `jsonplaceholder.typicode.com`
- `polling` — fetches `timeapi.io`

Same `python3 -m http.server` as Tier 1, just needs internet access.

---

**Tier 3 — Node.js backend required**:

| Example | npm dep | node_modules in zip | Run |
|---------|---------|---------------------|-----|
| `inline-editing` | express | YES — run immediately | `node server.js` |
| `server-hydrated` | express | YES — run immediately | `node server.js` |
| `card-accordion` | express | NO — `npm install` first | `npm install && node server.js` |
| `load-more` | express | NO — `npm install` first | `npm install && node server.js` |
| `file-upload` | busboy | NO — `npm install` first | `npm install && node server.js` |
| `optimistic-update` | none (stdlib http) | n/a | `node server.js` |

**Agent rule — before running any Tier 3 example:**
```bash
# 1. Check for node_modules
ls assets/htmzAgent/examples/<name>/node_modules 2>/dev/null || echo "ABSENT"

# 2. If absent — install first (needs internet):
cd assets/htmzAgent/examples/<name> && npm install

# 3. Then start:
node server.js
```

> If `npm install` fails (no internet), that example cannot run. Use a Tier 1 example instead.

---

**Tier 4 — Go backend required** (needs `go run .`):
- `basecoat` — full Basecoat component server with `/api/host-detail`
- `basecoat-linear` — fetches `/onboard/ips` local endpoint
- `loquix-chat` — chat server
- `sse` — Server-Sent Events streaming

```bash
cd assets/htmzAgent/examples/sse
go run .
```

---

### `assets/htmz-wiki-viewer/` — Node.js markdown wiki

Requires Node.js ≥ 18.

```bash
cd assets/htmz-wiki-viewer
npm install            # only needed first time; node_modules may already exist
node server.js --port 8790 --host 127.0.0.1
# Open: http://127.0.0.1:8790/
```

Routes:
- `/view/<path>` — renders `.md` files as HTML (e.g. `/view/knowledge/htmz.md`)
- `/raw/<path>` — serves any file with correct Content-Type (images, HTML, binaries)

---

### `assets/postgrest-htmz-passkey-poc/` — PostgREST + htmz + passkey auth

Requires Docker. Uses official images only — no custom build, no Dockerfile.

**Agent setup procedure (inform user before running):**

```bash
# 1. Check ports 3000 and 8080 are free — if not, edit docker-compose.yml ports before step 2
ss -tlnp | grep -E ':3000|:8080'

# 2. If conflict found — adjust ports in docker-compose.yml:
#    postgrest ports: "3000:3000" → "3001:3000"  (or any free port)
#    frontend ports:  "8080:80"  → "8081:80"

# 3. Start the stack (pulls ~200MB of images on first run)
cd assets/postgrest-htmz-passkey-poc
docker compose up -d

# 4. Verify
curl http://localhost:3000/          # PostgREST schema response
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/  # 200
```

**Agent must tell the user:**
- Which ports will be used (after deconflict)
- That ~200MB will be pulled on first run
- Ask "proceed?" before running `docker compose up -d`

---

## Dependencies Check

| Tool | Check | Min version |
|------|-------|-------------|
| Python 3 | `python3 --version` | ≥ 3.8 |
| Node.js | `node --version` | ≥ 18 |
| npm | `npm --version` | ≥ 9 |
| Go | `go version` | ≥ 1.21 (Go examples only) |
| PostgreSQL | `psql --version` | ≥ 14 (postgrest POC only) |

---

## Quickstart (no deps beyond Python 3)

```bash
cd assets/htmzAgent
python3 -m http.server 8080
# Then open (Tier 1 — fully offline, no backend needed):
# http://localhost:8080/why-htmz.html
# http://localhost:8080/examples/basecoat-notion/
# http://localhost:8080/examples/alpine-toast/
# http://localhost:8080/examples/static-demo/
```

---

## Common Tasks

| Task | Skill to load |
|------|--------------|
| Build new htmz UI / fragment | `skills/router-htmz/SKILL.md` → htmz-frontend |
| Review htmz code quality | `skills/router-htmz/SKILL.md` → htmz-review |
| Add Anime.js animation | `skills/router-htmz/SKILL.md` → animejs |
| Match a site's design system | `skills/router-htmz/SKILL.md` → getdesign |
| Visual screenshot / UI verify | `skills/router-htmz/SKILL.md` → chrome-visual-test |
| Get a preview URL for a file | `skills/preview/SKILL.md` |

---

## Key Knowledge Files

- `knowledge/htmz.md` — core concept, patterns summary, architecture claims
- `knowledge/htmz-agent-evaluation-protocol.md` — evaluation protocol for htmz agent outputs
- `knowledge/htmz-vanilla-assistant-ui.md` — Vanilla UI Web Components integration with htmz

## Operating Loop
See `CLAUDE.md` / `AGENT.md` — recall → actuate → persist.
