---
name: Chrome Visual Test
description: Use Claude in Chrome MCP for real-browser UI verification during frontend coding sessions — full fidelity, no headless degradation
type: on-demand
---

# Chrome Visual Test Skill

## When to trigger

- Any session involving HTML/CSS/JS changes that are observable in a browser
- When preview panel is used and returns blank or degraded screenshots
- When verifying CDN-dependent styles (Tailwind, Basecoat, Google Fonts, backdrop filters)
- When user asks "show me" or "does it look right" during UI work

## Never use the preview panel for

- CDN-loaded CSS frameworks (Basecoat, Tailwind CDN, Flowbite)
- Google Fonts (`fonts.googleapis.com`)
- `backdrop-filter`, `blur()`, GPU-composited effects
- Anything where colour accuracy or font rendering matters

The preview panel uses stripped-down headless Chromium — it will return blank or degraded screenshots for these cases.

## Workflow

### 1. Ensure Chrome is open and Claude in Chrome extension is active

The extension must be running in the target Chrome instance. If not connected, ask user to open Chrome with the extension.

### 2. Navigate to the URL

```
mcp__Claude_in_Chrome__navigate(url="http://localhost:PORT")
```

### 3. Take a screenshot

```
mcp__Claude_in_Chrome__computer(action="screenshot")
```

Returns a real Chrome screenshot — pixel-identical to what the user sees.

### 4. Interact if needed

```
mcp__Claude_in_Chrome__find(query="button text or element description")
mcp__Claude_in_Chrome__javascript_tool(script="document.querySelector('#nav-hosts').click()")
```

Then screenshot again to verify the result.

### 5. Hard refresh after file changes

CDN fragments may be cached. Force a fresh load:

```
mcp__Claude_in_Chrome__javascript_tool(script="location.reload(true)")
```

Or navigate with cache-bust:

```
mcp__Claude_in_Chrome__navigate(url="http://localhost:PORT/?cb=" + Date.now())
```

## Background alternative (no visible window)

When Chrome is not open, use `chrome --headless=new` — same rendering engine as headed Chrome:

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless=new \
  --screenshot=/tmp/screenshot.png \
  --window-size=1280,900 \
  "http://localhost:PORT"
```

Then read the PNG with the Read tool to view it.

## Tool load note

Claude in Chrome tools are deferred — load before use:

```
ToolSearch: query="Claude_in_Chrome", max_results=15
```

## Why

Preview panel = headless Chromium with degraded CSS/font rendering.
Claude in Chrome = actual Chrome instance the user is running.
`--headless=new` = same engine as Chrome, no extension needed.
