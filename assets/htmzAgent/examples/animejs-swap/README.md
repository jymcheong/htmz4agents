# animejs-swap

**What it demonstrates:** Animated htmz fragment swaps — three-phase (fade-out → swap → fade-in) using Anime.js wrapping the core htmz iframe mechanism.

## Patterns

| Pattern | Name |
|---------|------|
| Core htmz | Fragment swap via iframe + hash routing |
| Pattern 11 | Toast Notifications (implicit — success feedback) |

## Notable techniques

- **Three-phase animated swap** — `animateSwap(srcUrl, targetId)` runs: (1) Anime.js fade-out + scale-down on the current element, (2) drives htmz by setting `iframe.src`, (3) Anime.js fade-in + scale-up on the newly inserted content. This wraps the raw htmz mechanism rather than replacing it.
- **Email capture → success flow** — `email-capture.html` → `newsletter-promo.html` → `success.html` chain demonstrates fragment chaining with visible animated transitions at each step.
- **No backend** — pure static files; demonstrates that animated swaps work without a server.
- **Glassmorphic dark theme** — radial-gradient background + backdrop-filter blur; shows htmz is fully compatible with any CSS aesthetic.

## See also

[PATTERNS.md](../../PATTERNS.md) — full pattern reference (Patterns 1–14).
