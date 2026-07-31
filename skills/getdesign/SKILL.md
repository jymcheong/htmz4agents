---
name: getdesign
description: Drop a DESIGN.md from any catalogued site into a project, then build UI that matches it
version: 1.0.0
platforms: [macos, linux]
metadata:
  hermes:
    tags: [design, frontend, htmz, ai-agent, design-system]
    category: frontend
---

# Skill: getdesign

## Trigger Phrases
- "get design for", "copy [site] style", "use [site] design", "drop a DESIGN.md", "match [site] look"
- "what design systems are available", "list design slugs"
- "build a page that looks like [site]"

## What This Skill Does

Two-step workflow:
1. **Drop** a DESIGN.md from the catalog into the project
2. **Build** UI (htmz sample page or component) that follows it

---

## Tool Selection

| Case | Tool | Command |
|---|---|---|
| Known site (catalog) | getdesign | `npx getdesign add <slug>` |
| Arbitrary URL | designmdme CLI | `designmdme <url>` (4 credits) |
| See what's available | getdesign list | `npx getdesign list` |

---

## Procedure

### Step 1 — Resolve slug

If user named a site, match to slug:
```bash
npx getdesign list 2>/dev/null | grep -i "<site>"
```
If match found → use that slug.
If no match → inform user; offer designmdme fallback (costs credits) or pick closest catalog equivalent.

### Step 2 — Drop DESIGN.md

```bash
npx getdesign add <slug> --out DESIGN.md --force
```

Read the file back — extract key tokens for context:
- Primary accent color + name
- Font family (display + body)
- Border radius style (pill / square / soft)
- Surface style (dark / light / neutral)
- Design personality (1-line from top of file)

### Step 3 — Build htmz sample page

Load `skills/htmz-frontend/SKILL.md` for wiring rules.

Generate a single HTML file at `.superdesign/design_iterations/<slug>_1.html`:
- **One full page** — hero + nav + feature section + CTA + footer
- All styles inline (no external CSS file)
- Google Fonts loaded via `<link>`
- CSS custom properties from DESIGN.md in `:root {}`
- No React, no build step
- htmz-wired tabs/panels if relevant to the design
- Faithful to DESIGN.md: colors, type scale, spacing, radius, elevation

Prompt injected before generation:
> "Read DESIGN.md at the root. Match every token — colors, type scale, spacing, border radius, shadow levels, component patterns. Do not deviate. Treat it as law."

### Step 4 — Confirm

Present the file path + key design decisions made. Ask if user wants:
- Iterate style
- Add htmz interactivity (tabs, panels, modals)
- Extract as reusable component

---

## Catalog Quick Reference (73 sites as of 2026-05-27)

**Dev tools:** vercel, cursor, raycast, warp, expo, lovable, superhuman
**AI platforms:** claude, cohere, elevenlabs, ollama, opencode-ai, replicate, runway, together-ai, voltagent, x-ai
**Productivity:** linear.app, notion, cal, intercom, mintlify, resend, zapier
**Backend/DB:** supabase, sentry, posthog, mongodb, sanity, hashicorp, composio, clickhouse
**Design tools:** figma, framer, miro, webflow, airtable, clay
**Fintech:** stripe, coinbase, kraken, revolut, wise, binance, mastercard
**E-commerce:** airbnb, shopify, nike, meta, starbucks
**Media/Tech:** apple, nvidia, spotify, uber, ibm, spacex, the-verge, wired, playstation, pinterest, hp, vodafone
**Auto:** tesla, bmw, bmw-m, ferrari, lamborghini, bugatti, renault

Run `npx getdesign list` for current full list with descriptions.

---

## Rules

- Never invent tokens not in DESIGN.md
- Always inline styles — no external stylesheet
- Google Fonts only (already referenced in DESIGN.md typography section)
- Dark/light surface: match DESIGN.md, don't guess
- On slug mismatch: say so clearly, don't silently pick a different one

---

→ [[CHANGELOG.md]] for full history
