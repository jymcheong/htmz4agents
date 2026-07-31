# Load More (P19)

htmz load-more pattern. No Alpine, no Basecoat — pure htmz + Express.

## Run

```bash
npm install
node server.js
# → http://localhost:8830
```

## How it works

One endpoint. One insight.

`GET /more?n=16` returns **all items from 0 to 16**, not just the new batch.  
htmz replaces `#item-list` entirely each time.  
The list appears to grow because the server re-renders everything accumulated so far.

```
Click "Load 8 more"
  → <a href="/more?n=16#item-list" target="htmz">
  → iframe loads /more?n=16
  → htmz reads hash → querySelector('#item-list')
  → replaceWith(iframe.body.childNodes)
  → host #item-list replaced with server's #item-list (items 1–16 + new button)
```

htmz always replaces. "Append" is a server contract, not a client primitive.

## Pattern reference

See [`../../PATTERNS.md`](../../PATTERNS.md) — P19 Load More.

**Key constraint:** the `/more` endpoint must include all previous items on every call.  
The `n` query param is the cumulative count, not a page number.
