---
name: preview
description: Serve any generated artifact — image, HTML deck, or markdown — as a reachable URL for the user to open, via the already-running htmz-wiki-viewer pm2 process (port 8790). Markdown uses its existing /view/ route; non-markdown (infographics, HTML decks, any binary) uses the new /raw/ passthrough route added for this.
version: 1.0.0
platforms: [linux]
metadata:
  hermes:
    tags: [preview, image, html, infographic, deck, viewer]
    category: dev-loop
---

# Skill: preview

## Trigger Phrases
- "preview this" / "show me this file"
- "url to view this image/deck/infographic"
- "preview the infographic" / "preview the HTML deck"

## Mermaid diagram preview (dedicated procedure)

When the user asks to draw/visualize a Mermaid diagram:

1. **Write the Mermaid code into the template.** `assets/mermaid-preview.html` has a `<pre class="mermaid">` block — replace its contents with the new diagram code. Keep rest of the HTML intact (toolbar, sizing, CDN, dark theme).
2. **Serve via /raw/** — build URL as: `http://<ZT-IP>:8790/raw/assets/mermaid-preview.html`
3. **Confirm 200** — `curl -s -o /dev/null -w "%{http_code}\n" "<url>"`
4. **Report URL.** Do NOT use mermaid.live — local preview is the canonical approach.

**Template location:** `assets/mermaid-preview.html` — CDN-loaded mermaid@11, responsive sizing (max-width 1200px), dark background, white diagram card. Includes an "Open in system browser" button in the top-right toolbar — clicking it fires `window.open(location.href, '_blank')` (user-gesture-initiated, bypasses popup blockers). After the page loads in Telegram's in-app browser, tapping this button opens the diagram in the device's native browser in a new tab.

**Telegram in-app browser note:** clicking the URL from the chat opens Telegram's embedded webview. The embedded page cannot force a new system tab from the link itself — that's the Telegram client's decision. The "Open in system browser" button on the page itself is the workaround.

## What This Skill Does
Gap this closes: `quartz-view` (decommissioned on claudeVM 2026-06-28) and its replacement `htmz-wiki-viewer` (pm2, port 8790 — the thing `SIP-report.md`'s "View:" links already point at) both only render **markdown**. Neither had a way to preview a generated image or a standalone HTML deck — those files existed on disk with no reachable URL, forcing manual `scp`/screenshot workarounds. Fixed by adding one small passthrough route to the already-running `htmz-wiki-viewer` process rather than standing up a second server.

**Not a new server.** `assets/htmz-wiki-viewer/server.js` already runs via pm2 on every bot VM that has it — this skill just documents (and, on 2026-07-01, added) its 2 relevant routes:

| Route | For | Behavior |
|---|---|---|
| `/view/<path>` | Markdown (`.md`) | Renders to HTML via `marked`, resolves `[[wikilinks]]`. Pre-existing. |
| `/raw/<path>` | Everything else (images, `.html` decks, any binary) | `res.sendFile` — Content-Type set from extension, browser renders/displays natively. Added 2026-07-01 for this skill. |

---

## Procedure

1. Get the file's path relative to Alfred root (e.g. `assets/output/infographic.png`, `assets/decks/q3-review.html`).
2. Get this VM's ZT IP — [[../../knowledge/telegram-dispatch.md]] → SSH Node Access Parameters table (claudeVM = `10.246.231.46`, deepseekVM = `10.246.231.163`, geminiVM = `10.246.231.203`). Never use `localhost` — unreachable from the user's own device.
3. Build the URL:
   - Markdown: `http://<ZT-IP>:8790/view/<relative-path>`
   - Non-markdown (image, HTML deck, anything else): `http://<ZT-IP>:8790/raw/<relative-path>`
4. Confirm reachability before reporting it: `curl -s -o /dev/null -w "%{http_code}\n" "<url>"` — expect `200`.
5. Report the URL to the user. In a Telegram dispatch reply this must be the ZT-IP form, not `localhost`, or it won't render as a clickable/reachable link.

## Notes
- `htmz-wiki-viewer` is pm2-managed, same caveat as `quartz-view` used to have: check `pm2 list` before touching it with `pkill`, and restart after any `server.js` edit (no watch mode on this one — restart is required, not automatic). **`--host` is a required arg as of 2026-07-01 — the process exits fatally without it** (was `0.0.0.0`, i.e. every network interface, not just ZT — fixed after finding this VM has a non-ZT interface too). Restart with the actual host bound explicitly, e.g.:
  ```bash
  pm2 delete htmz-wiki-viewer
  cd assets/htmz-wiki-viewer && pm2 start server.js --name htmz-wiki-viewer -- --port 8790 --host <this-VM's-ZT-IP>
  ```
  A bare `pm2 restart htmz-wiki-viewer` reuses whatever args it was last started with — only needs the `delete`+`start` dance if the args themselves are changing (e.g. first time applying this fix on a given VM).
- `/raw/*` has no size cap or auth — fine for this project's trust model (single-user, ZT-networked), but don't reuse this route pattern somewhere with different security requirements without adding one.
- Per-bot: each VM with `htmz-wiki-viewer` running needs this same `server.js` change — check whether it's deployed there before assuming the `/raw/` route exists on a VM other than claudeVM (added here first).
- This skill is about reachability (turning a local file into a URL), not generation — pair with [[../image-generation/SKILL.md]] or the deck-building skills for the artifact itself.

## Relations
- skill: [[../image-generation/SKILL.md]] — typical producer of the images this skill previews
- knowledge: [[../../knowledge/telegram-dispatch.md]] — per-VM ZT IPs

## Changelog
### 2026-07-28
- Added mermaid diagram preview procedure + Telegram in-app browser note
→ [[../../sessions/2026-07/2026-07-28.DeepSeekBot.md]]

→ [[CHANGELOG.md]] for full history
