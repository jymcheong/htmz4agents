# passkey-webauthn

**Status:** SPEC only — `SPEC.md` written, implementation not yet built.

**What it will demonstrate:** Server-gated fragments — protected routes check the session cookie and return either the requested fragment or a modal challenge fragment, never a redirect.

## Planned patterns

| Pattern | Name |
|---------|------|
| Pattern 7 | Error States — session auth sentinel (server-gated variant) |
| Pattern 10 | Form Submit Lifecycle (register/login ceremony as form flow) |
| Alpine.js | `x-data` ceremony state for WebAuthn credential exchange |

## Notable techniques (from SPEC)

- **Server-gated fragments** — `GET /fragments/dashboard` checks session cookie; on miss, returns `modal.html` (register + login UI) instead of redirecting; all transitions are htmz swaps, zero page reloads.
- **Option A script pattern** — WebAuthn JS (`navigator.credentials.create/get`) lives in a `<script>` block inside the modal fragment, executing once after swap; avoids the "all JS in index.html" rule for ceremony-specific code that has no other call sites.
- **Alpine `x-data` ceremonies** — registration and assertion flows managed as Alpine state machines within the modal fragment.
- **Stack** — Go + `go-webauthn/webauthn` + SQLite (`modernc`) + Chi router + htmz + Basecoat.

## See also

[PATTERNS.md](../../PATTERNS.md) — full pattern reference (Patterns 1–14).
