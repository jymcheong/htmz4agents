# Server-Hydrated Templates (P23)

htmz server-hydration pattern. Fixed HTML template, static JSON data, server fills the template with real data at request time, returns as a fragment.

## Run

```bash
npm install
node server.js
# → http://localhost:8840
```

## How it works

`data.json` — static dataset, no database.
`itemCard(item)` — the template: fixed HTML shape, item fields interpolated in.
`GET /hydrate?id=N` — looks up item N, hydrates the template, returns the fragment.
htmz swaps `#hydrated-card` with whatever the server just rendered.

```
Click "Widget Beta"
  → <a href="/hydrate?id=2#hydrated-card" target="htmz">
  → iframe loads /hydrate?id=2
  → server: ITEMS.find(id===2) → itemCard(item) → HTML string
  → htmz reads hash → querySelector('#hydrated-card') → replaceWith(iframe.body.childNodes)
```

No template engine, no build step — the "template" is a plain JS template literal with `${}` interpolation. The pattern is: keep the HTML shape fixed in the function, swap only the data.

## Pattern reference

See [`../../PATTERNS.md`](../../PATTERNS.md) — P23 Server-Hydrated Templates.
