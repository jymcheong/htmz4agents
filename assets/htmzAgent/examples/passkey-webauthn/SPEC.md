# Passkey / WebAuthn Example — SPEC

> htmzAgent example: `assets/htmzAgent/examples/passkey-webauthn/`
> Stack: Go + go-webauthn/webauthn + SQLite (modernc) + Chi + htmz + Basecoat + Alpine.js

---

## Goal

Minimal passkey (WebAuthn) example — no IdP, no Auth0/Okta/Keycloak, raw WebAuthn only. Localhost operation (HTTP OK — browsers exempt localhost from HTTPS requirement). Register a passkey, close the browser, reopen, log in with the same passkey, see the dashboard.

Demonstrates the key htmz integration pattern: **server-gated fragments** — protected routes check session cookie and return either the requested fragment or a modal challenge fragment, never a redirect.

---

## Success Criteria

1. `go run server.go` starts on `localhost:8790`
2. Open browser → navigate to `http://localhost:8790`
3. `GET /fragments/dashboard` → server detects no session cookie → returns `modal.html` (modal fragment with register + login UI)
4. Enter username → click **Register** → OS passkey dialog appears → credential stored in SQLite
5. Click **Login** → OS passkey dialog appears → session cookie set → `dashboard.html` swaps in
6. Close browser entirely → reopen → navigate to `http://localhost:8790`
7. Session cookie gone → modal appears → click **Login** → passkey recognised → dashboard loads
8. No page reloads at any point — all transitions are htmz fragment swaps

---

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Router | `github.com/go-chi/chi/v5` | `net/http`-native, matches existing htmzAgent examples |
| WebAuthn | `github.com/go-webauthn/webauthn` | Canonical Go implementation, Level 2/3, handles CBOR/COSE |
| SQLite | `modernc.org/sqlite` | Pure Go, no cgo, no C toolchain dependency |
| Sessions | In-memory map + `net/http` signed cookie | Sufficient for demo; challenge data stored server-side |
| Frontend lib | `@github/webauthn-json` via CDN | Handles ArrayBuffer ↔ base64url for all WebAuthn fields |
| Components | Basecoat (CDN) + Alpine.js (CDN) | Zero build step; Alpine drives ceremony async state |
| Fragment swap | htmz `onload` + fetch+replaceWith | Pattern 14 — async result injection |

---

## Auth Flow

```
Browser                          Go Server
───────                          ─────────
GET /fragments/dashboard    →    check session cookie
                            ←    no cookie: return modal.html (not dashboard)

[modal renders — Alpine x-data component mounts]

click Register:
  Alpine.register()         →    POST /webauthn/register/begin  (JSON: username)
                            ←    JSON: PublicKeyCredentialCreationOptions
  navigator.credentials.create(opts)   ← browser OS dialog
  Alpine.register() cont.   →    POST /webauthn/register/complete (JSON: credential)
                            ←    HTML fragment: #register-success or #modal-error
  replaceWith(fragment)          modal content swaps to success state

click Login:
  Alpine.login()            →    POST /webauthn/login/begin  (JSON: username)
                            ←    JSON: PublicKeyCredentialRequestOptions
  navigator.credentials.get(opts)   ← browser OS dialog
  Alpine.login() cont.      →    POST /webauthn/login/complete (JSON: assertion)
                            ←    HTML fragment: dashboard.html (Set-Cookie: session)
  replaceWith(fragment)          modal dismissed, dashboard swaps in

Subsequent protected request:
GET /fragments/dashboard    →    session cookie present + valid
                            ←    dashboard.html
```

---

## Backend Endpoints

### `POST /webauthn/register/begin`
- Body: `{"username": "alice"}`
- Creates user in SQLite if not exists (generate UUID)
- Calls `webauthn.BeginRegistration(user)` → get `CredentialCreation`
- Store `SessionData` in challenge map (keyed by session ID cookie, new UUID)
- Set `session_id` cookie (HttpOnly, SameSite=Strict)
- Return: `200 application/json` — WebAuthn creation options

### `POST /webauthn/register/complete`
- Body: JSON credential from `@github/webauthn-json`
- Retrieve `SessionData` from challenge map via session cookie
- Call `webauthn.FinishRegistration(user, sessionData, parsedResponse)`
- Store `Credential` in SQLite (`credentials` table)
- Delete challenge from map
- Return: **HTML fragment** `#register-success` or `#modal-error`

### `POST /webauthn/login/begin`
- Body: `{"username": "alice"}`
- Look up user by name → get credentials from SQLite
- Call `webauthn.BeginLogin(user)` → get `CredentialAssertion`
- Store `SessionData` in challenge map
- Return: `200 application/json` — WebAuthn request options

### `POST /webauthn/login/complete`
- Body: JSON assertion from `@github/webauthn-json`
- Retrieve `SessionData` from challenge map
- Call `webauthn.FinishLogin(user, sessionData, parsedResponse)` → returns updated `Credential`
- **Update `sign_count` in SQLite** (mandatory — counter replay protection)
- Set authenticated session cookie (new UUID, store in sessions map)
- Delete challenge from map
- Return: **HTML fragment** `dashboard.html` with `Set-Cookie: session=<token>`

### `GET /fragments/dashboard`
- Check `session` cookie → look up in sessions map
- Not found / expired: return `modal.html`
- Found: return `dashboard.html`

### `POST /logout`
- Delete session from map + clear cookie
- Return: `modal.html`

---

## SQLite Schema

```sql
CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,       -- UUID
    name        TEXT NOT NULL UNIQUE,   -- username
    display_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS credentials (
    id              BLOB PRIMARY KEY,   -- credential ID (variable length bytes)
    user_id         TEXT NOT NULL REFERENCES users(id),
    public_key      BLOB NOT NULL,      -- CBOR-encoded COSE key
    attestation_type TEXT,
    transport       TEXT,               -- JSON array of transport hints
    sign_count      INTEGER NOT NULL DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## File Structure

```
passkey-webauthn/
├── SPEC.md                  ← this file
├── START_PROMPT.md          ← agent start prompt (build instructions)
├── go.mod
├── go.sum
├── server.go                ← Chi router, SQLite init, WebAuthn config, /fragments/dashboard gate
├── webauthn.go              ← 4 ceremony handlers (begin/complete × register/login)
├── storage.go               ← SQLite CRUD: users + credentials; implements WebAuthnUser interface
├── session.go               ← In-memory challenge + authenticated session maps; cookie helpers
└── fragments/
    ├── modal.html           ← Alpine.js x-data component: username input, register + login buttons
    ├── dashboard.html       ← Authenticated state: welcome message, logout button
    └── error.html           ← Shared error fragment: x-text error slot, retry button
```

**No `index.html` globals for ceremony JS.** All ceremony logic is in Alpine `x-data` on `modal.html`. See Alpine constraint below.

---

## Fragments

### `fragments/modal.html`

The Alpine component is the entire modal body. Mounted via `Alpine.initTree(el)` after htmz injects it.

```html
<div id="auth-modal"
     x-data="passkeyAuth()"
     class="...basecoat modal classes...">

  <div x-show="!registered && !loggedIn">
    <input x-model="username" type="text" placeholder="Username"
           class="...basecoat input..." />

    <div class="flex gap-2 mt-4">
      <button @click="register()" x-bind:disabled="loading"
              class="...basecoat btn-primary...">
        <span x-text="loading && phase === 'register' ? 'Creating…' : 'Register'"></span>
      </button>
      <button @click="login()" x-bind:disabled="loading"
              class="...basecoat btn-secondary...">
        <span x-text="loading && phase === 'login' ? 'Signing in…' : 'Sign In'"></span>
      </button>
    </div>

    <p x-show="error" x-text="error" class="text-red-500 mt-2 text-sm"></p>
  </div>

  <div x-show="registered" x-cloak>
    <p class="text-green-600">Passkey registered! Click Sign In to continue.</p>
  </div>
</div>

<script>
// Alpine component definition — only script allowed in a fragment
// Registered on window before Alpine.initTree() is called
window.passkeyAuth = function() {
  return {
    username: '',
    loading: false,
    phase: '',
    error: '',
    registered: false,

    async register() {
      if (!this.username) { this.error = 'Enter a username'; return; }
      this.loading = true; this.phase = 'register'; this.error = '';
      try {
        // Begin
        const beginRes = await fetch('/webauthn/register/begin', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({username: this.username})
        });
        if (!beginRes.ok) throw new Error(await beginRes.text());
        const opts = await beginRes.json();

        // Browser API — @github/webauthn-json handles base64url ↔ ArrayBuffer
        const cred = await window.webauthnJSON.create(opts);

        // Complete
        const completeRes = await fetch('/webauthn/register/complete', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(cred)
        });
        if (!completeRes.ok) throw new Error(await completeRes.text());

        // Server returns HTML fragment — inject into modal slot
        const html = await completeRes.text();
        this._injectFragment(html, '#auth-modal');
      } catch (e) {
        this.error = e.message || 'Registration failed';
      } finally {
        this.loading = false;
      }
    },

    async login() {
      if (!this.username) { this.error = 'Enter a username'; return; }
      this.loading = true; this.phase = 'login'; this.error = '';
      try {
        // Begin
        const beginRes = await fetch('/webauthn/login/begin', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({username: this.username})
        });
        if (!beginRes.ok) throw new Error(await beginRes.text());
        const opts = await beginRes.json();

        // Browser API
        const assertion = await window.webauthnJSON.get(opts);

        // Complete — server sets session cookie + returns dashboard fragment
        const completeRes = await fetch('/webauthn/login/complete', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(assertion)
        });
        if (!completeRes.ok) throw new Error(await completeRes.text());

        // Swap dashboard into #app-content (htmz host slot)
        const html = await completeRes.text();
        this._injectFragment(html, '#app-content');
      } catch (e) {
        this.error = e.message || 'Sign in failed';
      } finally {
        this.loading = false;
      }
    },

    _injectFragment(html, targetSelector) {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      const el = tmp.firstElementChild;
      if (el) {
        document.querySelector(targetSelector).replaceWith(el);
        if (window.Alpine) Alpine.initTree(el);
        if (window.basecoat) window.basecoat.initAll();
      }
    }
  };
};
</script>
```

> **Note on `<script>` in fragment:** `window.passkeyAuth` must be defined before `Alpine.initTree()` is called. Because htmz-injected `<script>` tags do NOT execute, `window.passkeyAuth` must be pre-registered in `index.html` OR — cleaner — the `<script>` tag in `modal.html` is executed manually: after `replaceWith(el)`, call `eval(el.querySelector('script').textContent)` before `Alpine.initTree(el)`. See Alpine constraint section.

### `fragments/dashboard.html`

```html
<div id="app-content" class="...">
  <h1 class="...">Welcome</h1>
  <p class="text-muted">Authenticated via passkey.</p>
  <form action="/logout" method="POST" target="htmz">
    <button type="submit" class="...basecoat btn...">Sign Out</button>
  </form>
</div>
```

The logout form uses htmz natively (no async needed — pure form POST returning a fragment).

### `fragments/error.html`

```html
<div id="modal-error" class="...basecoat alert-destructive...">
  <p><!-- server injects error text as text node --></p>
  <button onclick="history.back()" class="...">Try Again</button>
</div>
```

---

## Alpine Constraint — `<script>` Execution in Fragments

htmz-injected fragments with `<script>` tags **do not auto-execute**. Three options:

**Option A (recommended):** Pre-register `window.passkeyAuth` in `index.html` as a plain `<script>` block. `modal.html` has no `<script>` tag. `Alpine.initTree(el)` finds `x-data="passkeyAuth()"` and resolves it from `window`. Cleanest — no eval.

**Option B:** After `replaceWith(el)`:
```javascript
const scriptEl = el.querySelector('script');
if (scriptEl) {
    const s = document.createElement('script');
    s.textContent = scriptEl.textContent;
    document.head.appendChild(s);
}
Alpine.initTree(el);
```
Allows keeping the component definition co-located with the fragment. Slightly messier.

**Option C:** Use `htmz-frontend` Pattern 1 approach — all `onclick` handlers call globals defined in `index.html`; `x-data` uses an inline object literal instead of a named function. Works but collapses Alpine's composability.

**Decision:** Use Option A. `window.passkeyAuth` lives in `index.html`. `modal.html` contains only HTML + Alpine directives, no `<script>`.

---

## index.html Structure

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/flowbite@2.0.0/dist/flowbite.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.x.x/dist/cdn.min.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
  <!-- @github/webauthn-json via CDN -->
  <script type="module">
    import * as webauthnJSON from 'https://unpkg.com/@github/webauthn-json@2.1.1/dist/esm/webauthn-json.js';
    window.webauthnJSON = webauthnJSON;
  </script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/basecoat-css@latest/dist/basecoat.min.css">
</head>
<body>

  <!-- htmz iframe -->
  <iframe hidden name="htmz" onload="
    const h = this.contentDocument?.querySelector('[id]');
    if (!h) return;
    const slot = document.getElementById(h.id);
    if (!slot) return;
    slot.replaceWith(h);
    if (window.Alpine) Alpine.initTree(h);
    if (window.basecoat) window.basecoat.initAll();
  "></iframe>

  <!-- App shell — initial fragment loaded via fetch on DOMContentLoaded -->
  <div id="app-content" class="min-h-screen flex items-center justify-center">
    <p class="text-muted">Loading…</p>
  </div>

  <!-- Alpine component definition (Option A) -->
  <script>
    window.passkeyAuth = function() { /* ... full definition ... */ };
  </script>

  <script>
    // Initial load — server checks session cookie, returns modal or dashboard
    document.addEventListener('DOMContentLoaded', () => {
      fetch('/fragments/dashboard')
        .then(r => r.text())
        .then(html => {
          const tmp = document.createElement('div');
          tmp.innerHTML = html;
          const el = tmp.firstElementChild;
          document.getElementById('app-content').replaceWith(el);
          if (window.Alpine) Alpine.initTree(el);
          if (window.basecoat) window.basecoat.initAll();
        });
    });
  </script>

</body>
</html>
```

> **`@github/webauthn-json` import:** Uses ES module import assigned to `window.webauthnJSON`. All ceremony code calls `window.webauthnJSON.create(opts)` and `window.webauthnJSON.get(opts)`. This handles all ArrayBuffer ↔ base64url conversion — no manual encode/decode needed.

---

## Go WebAuthn Config

```go
wconfig := &webauthn.Config{
    RPDisplayName: "htmz Passkey Demo",
    RPID:          "localhost",
    RPOrigins:     []string{"http://localhost:8790"},
}
web, err := webauthn.New(wconfig)
```

RPID must exactly match the hostname. On `localhost` with HTTP this works — browsers exempt localhost from HTTPS for WebAuthn. Changing host (e.g. VPS) requires updating both `RPID` and `RPOrigins` and adding TLS.

---

## go-webauthn/webauthn User Interface

Storage must implement `webauthn.User`:

```go
type User struct {
    ID          string // UUID stored in SQLite
    Name        string
    DisplayName string
    Credentials []webauthn.Credential
}

func (u *User) WebAuthnID() []byte          { return []byte(u.ID) }
func (u *User) WebAuthnName() string        { return u.Name }
func (u *User) WebAuthnDisplayName() string { return u.DisplayName }
func (u *User) WebAuthnCredentials() []webauthn.Credential { return u.Credentials }
```

`storage.go` loads credentials from SQLite when the user is fetched — `webauthn.Credential` serializes to/from JSON or CBOR; simplest to use `encoding/json` and store as a BLOB column.

---

## Challenge Session Management

Two in-memory maps (keyed by cookie value):

```go
var (
    challengeStore  = map[string]*webauthn.SessionData{} // begin → complete window
    sessionStore    = map[string]string{}                 // session token → user ID
    mu              sync.Mutex
)
```

`challengeStore` entries are short-lived (Begin → Complete, typically <30s). Add a goroutine that sweeps entries older than 5 minutes to prevent accumulation.

`sessionStore` entries persist until logout or server restart. For demo purposes this is sufficient. Production would use SQLite + expiry.

Cookie helpers:
- `setChallengeCookie(w, id string)` — HttpOnly, SameSite=Strict, MaxAge=300
- `setSessionCookie(w, token string)` — HttpOnly, SameSite=Strict, MaxAge=86400
- `getChallengeCookie(r) string`
- `getSessionCookie(r) string`

---

## Credential Counter Update (Mandatory)

After `FinishLogin`, the library returns the updated credential with a new `AuthenticatorData.Counter`. This must be written back to SQLite before responding:

```go
updatedCred, err := web.FinishLogin(user, *sessionData, r)
if err != nil { /* return error fragment */ }

// MUST update — counter mismatch on next login = authentication failure
if err := storage.UpdateCredentialCounter(updatedCred.ID, updatedCred.Authenticator.SignCount); err != nil {
    /* log but don't fail the login — counter update failure is non-fatal for demo */
}
```

---

## Approximate LOC

| File | LOC | Notes |
|---|---|---|
| `server.go` | ~80 | Router, SQLite init, WebAuthn init, `/fragments/dashboard` gate, `/logout` |
| `webauthn.go` | ~150 | 4 ceremony handlers |
| `storage.go` | ~110 | SQLite open, users CRUD, credentials CRUD, counter update |
| `session.go` | ~50 | Challenge + session maps, cookie helpers, sweep goroutine |
| `index.html` | ~100 | htmz iframe, CDN imports, `window.passkeyAuth` definition, initial load fetch |
| `fragments/modal.html` | ~40 | Basecoat modal shell, Alpine directives (no `<script>`) |
| `fragments/dashboard.html` | ~20 | Welcome state, logout form |
| `fragments/error.html` | ~10 | Error display |
| **Total** | **~560** | |

---

## Gotchas

1. **RPID = hostname, not origin.** `RPID: "localhost"` not `"http://localhost:8790"`. RPOrigins includes the scheme+port.

2. **`@github/webauthn-json` is an ES module.** Import via `<script type="module">` and assign to `window`. All ceremony callers use `window.webauthnJSON.create()` / `.get()` — not a default import.

3. **`Alpine.initTree(el)` not `Alpine.start()`.** On fragment injection, call `Alpine.initTree(el)` on the root element only. Calling `Alpine.start()` again re-initialises the whole page and causes double-binding.

4. **`navigator.credentials.create/get` must be in a user gesture frame.** The Alpine `@click` handler satisfies this. Do not break the call chain with `setTimeout` or unrelated async awaits before calling the browser API.

5. **sign_count update before response.** If server crashes between FinishLogin and the SQLite write, next login will fail (counter mismatch). For demo, log and continue. For production, wrap in a transaction that also records the session.

6. **`webauthn.FinishRegistration` returns a `*webauthn.Credential`.** Serialize to JSON and store the entire struct as a BLOB — easiest approach. The struct contains the public key, transport, flags, and counter. Re-hydrate on login with `json.Unmarshal`.

7. **Logout uses native htmz form submit.** `POST /logout target="htmz"` returns `modal.html`. This is the one place htmz's native mechanism is used — no async needed, the server just returns the modal fragment after clearing the cookie.

8. **No `<script>` in htmz-swapped fragments** — use Option A (pre-register `window.passkeyAuth` in `index.html`). The htmz `onload` handler runs `Alpine.initTree(h)` after swap; it finds `x-data="passkeyAuth()"` and resolves from `window`.

---

## Build + Run

```bash
cd assets/htmzAgent/examples/passkey-webauthn
go mod init passkey-webauthn
go get github.com/go-chi/chi/v5
go get github.com/go-webauthn/webauthn
go get modernc.org/sqlite

go run server.go webauthn.go storage.go session.go
# → listening on http://localhost:8790
```

Port: **8790** (follows htmzAgent convention — each example on a distinct port).
