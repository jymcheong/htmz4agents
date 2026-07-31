## Changelog
### 2026-07-01 (2)
- **Security hygiene bug found in the same route added below** — `server.js`'s `app.listen(PORT, ...)` had no host arg, Express defaults to `0.0.0.0` (all interfaces). Confirmed live this VM has a non-ZT interface (`eth0`) in addition to the 3 ZT networks — the unauthenticated `/raw/*` route was reachable off-ZT since it was created earlier the same day. Fixed in code: `--host`/`HOST` now required explicitly, no `0.0.0.0` fallback (fails loudly if missing). **pm2 restart with the corrected `--host <this-VM's-ZT-IP>` arg not yet applied** — code fix on disk, live process still on the old bind as of this entry. Not yet checked whether deepseekVM/geminiVM run the same server.
→ [[../../sessions/2026-07/2026-07-01.ClaudeBot.md]]

### 2026-07-01
- Created. Added `/raw/*` passthrough route to `assets/htmz-wiki-viewer/server.js` (the existing markdown-only viewer, pm2 port 8790) rather than building a second server — user identified the gap: no existing mechanism previewed non-markdown artifacts (images, HTML decks). Verified live: `curl` against `/raw/KANBAN.md` returns 200 after `pm2 restart htmz-wiki-viewer`.
→ [[../../sessions/2026-07/2026-07-01.ClaudeBot.md]]
