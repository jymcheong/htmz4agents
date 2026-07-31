# P20 · File Upload

**Pattern:** XHR progress event · Alpine.js state · Pattern 10 three-outcome fragments

## Run

```bash
npm install
node server.js
# → http://localhost:8793
```

## What this demonstrates

**Why XHR, not fetch:** `xhr.upload.onprogress` fires with `loaded`/`total` bytes during the upload. The Fetch API has no upload progress hook — XHR is the only way to drive a real-time progress bar.

**Why not htmz iframe:** The htmz iframe submit mechanism works for form data but cannot surface upload progress events. P20 bypasses the htmz iframe and uses XHR directly. The result fragment swap (injecting server HTML into `#upload-result`) replicates exactly what htmz would do — the pattern is the same, the transport differs.

**Pattern 10 three outcomes:**
| Outcome | Trigger | Fragment |
|---------|---------|----------|
| `pending` | XHR starts | `uploadingHTML` (inline JS constant) |
| `success` | Server receives + saves file | `successFragment()` — filename, size, type |
| `error` | Wrong type, too large, or parse error | `errorFragment()` — reason string |

## Files

| File | Role |
|------|------|
| `index.html` | Drop zone, progress bar, `#upload-result` slot, Alpine `uploader()` component |
| `server.js` | Node.js `http` stdlib + `busboy` multipart parser; returns HTML fragment as response body |
| `fragments/uploading.html` | Pending fragment template (served at `GET /fragments/uploading.html` for reference) |
| `fragments/success.html` | Success fragment template (server populates filename/size at runtime) |
| `fragments/error.html` | Error fragment template (server populates error message at runtime) |

## Constraints

- `xhr.upload.onprogress` → Alpine `progress` field → CSS width on `.progress-fill`
- No `<script>` in fragments — all ceremony JS lives in `index.html`
- Server is the validation authority (Pattern 10): type whitelist + 5 MB cap enforced server-side
- `busboy` `limits.fileSize` enforces the cap at the stream level — no full file buffered into memory

## Accepted types

JPEG · PNG · GIF · WebP · PDF · plain text (max 5 MB). Files saved to `/tmp/uploads/`.

See [PATTERNS.md](../../PATTERNS.md) for the full htmz pattern library.
