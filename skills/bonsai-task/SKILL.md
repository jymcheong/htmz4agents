# Skill: bonsai-task

**Type:** on-demand
**Triggers:** "bonsai: <task>", "run on bonsai", "use bonsai for <html/htmz task>", "bonsai do", "send to bonsai"

## Purpose

Drive BonsaiBot (Bonsai 27B local LLM on pop) as a tmux Claude Code session for bounded htmz/HTML/JS frontend coding tasks. Results tracked in a local git repo on pop — no remote push.

No NATS. No conductor. Pure tmux send + pane poll + git diff.

## Prerequisites

- llama-server running on pop at `:8083` — if down, stop and tell user
- `~/bonsai-alfred/` workspace on pop (init done 2026-07-20, contains PATTERNS.md + skills + knowledge)
- SSH to pop at `10.246.231.164` (q@)

## Constants

```
POP=q@10.246.231.164
SESSION=bonsai-task
WORK_DIR=~/bonsai-alfred
LLAMA_URL=http://127.0.0.1:8083
CLAUDE_BIN=~/.nvm/versions/node/v22.23.1/bin/claude
PREVIEW_PORT=8791
```

## Procedure

### Step 1 — Health check
```bash
ssh q@10.246.231.164 "curl -sf http://127.0.0.1:8083/health"
```
Expect `{"status":"ok"}`. If absent → stop: "llama-server not running on pop — start it first."

### Step 2 — Ensure tmux session + Claude Code running
```bash
ssh q@10.246.231.164 "
SESSION=bonsai-task
WORK_DIR=~/bonsai-alfred

# Create session if missing
if ! tmux has-session -t \$SESSION 2>/dev/null; then
  tmux new-session -d -s \$SESSION -c \$WORK_DIR \
    -e ANTHROPIC_BASE_URL=http://127.0.0.1:8083 \
    -e ANTHROPIC_API_KEY=sk-local
fi

# Check for ❯ idle prompt — if absent, start claude
PANE=\$(tmux capture-pane -t \$SESSION -p 2>/dev/null)
if ! echo \"\$PANE\" | grep -q '❯'; then
  tmux send-keys -t \$SESSION \
    'ANTHROPIC_BASE_URL=http://127.0.0.1:8083 ANTHROPIC_API_KEY=sk-local ~/.nvm/versions/node/v22.23.1/bin/claude --dangerously-skip-permissions' \
    Enter
fi
"
```

### Step 3 — Confirm Claude started (single-shot, max 30s)

Check pane once. If `❯` not yet visible (still booting), wait 10s and check again, up to 3 tries. Never block longer.

```bash
ssh q@10.246.231.164 '
for i in 1 2 3; do
  LAST=$(tmux capture-pane -t bonsai-task -p 2>/dev/null \
    | grep -v "^\s*$" \
    | grep -vE "^(──|▔▔|  ⏸|  ⏵⏵)" \
    | grep -vE "(manual mode|for shortcuts|bypass permissions)" \
    | tail -1)
  echo "$LAST" | grep -q "^❯" && echo "IDLE" && exit 0
  echo "try $i: $LAST"
  sleep 10
done
echo "NOT_IDLE — check pane manually"
'
```

**First-run trust gate:** only needed once ever. If transcript empty after 20s:
```bash
ssh q@10.246.231.164 "tmux capture-pane -t bonsai-task -p | grep -q 'trust' && tmux send-keys -t bonsai-task '1' Enter && echo trusted"
```

### Step 4 — Send task via paste-buffer

Do NOT use send-keys for the prompt body (special chars get mangled). Use paste-buffer:

```bash
TASK="<the task prompt — include target filename, what to produce>"
ssh q@10.246.231.164 "
tmux set-buffer -b bonsai-in -- '$TASK'
tmux paste-buffer -b bonsai-in -t bonsai-task -p
sleep 0.3
tmux send-keys -t bonsai-task Enter
"
```

### Step 5 — Check task completion (single-shot, on demand)

Do NOT block. Run once when user asks "is it done?" or at the end of the turn after sending the task. Returns current state immediately.

```bash
ssh q@10.246.231.164 '
PROJ_DIR="$HOME/.claude/projects/-home-q-bonsai-alfred"
JFILE=$(ls -t "$PROJ_DIR"/*.jsonl 2>/dev/null | head -1)
if [ -z "$JFILE" ]; then echo "NO_TRANSCRIPT — claude not started yet"; exit 0; fi

SIZE=$(stat -c%s "$JFILE")
LAST_STOP=$(grep -a "\"stop_reason\"" "$JFILE" 2>/dev/null | tail -1)
PANE=$(tmux capture-pane -t bonsai-task -p 2>/dev/null | tail -3)

echo "JSONL size: $SIZE"
echo "Last stop_reason: $LAST_STOP"
echo "Pane tail: $PANE"

echo "$LAST_STOP" | grep -q "end_turn" && echo "STATUS: DONE" || echo "STATUS: STILL RUNNING"
'
```

Report result to user. If DONE → proceed to Step 6. If STILL RUNNING → tell user to ask again later.

### Step 6 — Capture result + commit

```bash
ssh q@10.246.231.164 "
cd ~/bonsai-alfred
CHANGES=\$(git status --short)
if [ -n \"\$CHANGES\" ]; then
  git add -A
  git commit -m 'bonsai: <first-60-chars-of-task>'
  echo 'COMMITTED'
  git log --oneline -3
  git diff HEAD~1 --stat
else
  echo 'NO_CHANGES'
fi
"
```

### Step 7 — Preview (if HTML output)

If the task produced HTML files, serve them for preview:

```bash
# Kill any stale preview server first
ssh q@10.246.231.164 "pkill -f 'python3.*8791' 2>/dev/null; true"

# Start static server in bonsai-alfred root
ssh q@10.246.231.164 "
cd ~/bonsai-alfred
nohup python3 -m http.server 8791 --bind 0.0.0.0 > /tmp/bonsai-preview.log 2>&1 &
echo \$!
"
```

URL: `http://10.246.231.164:8791/<path-to-html-file>`
Access via ZeroTier (10.246.x.x network). Tell user the exact URL.

### Step 8 — Report

Tell user:
- Files changed (diff --stat)
- Commit hash and message
- Preview URL if HTML was produced
- Any error text visible in pane (grep for `Error:`, `failed`, `❌` in last 20 pane lines)

## isIdle Rule (for polling Steps 3 and 5)

Skip lines that:
- Are empty or whitespace-only
- Start with `──` or `▔▔` (separators)
- Start with `  ⏸` or `  ⏵⏵` (mode indicators)
- Contain `manual mode`, `for shortcuts`, `bypass permissions`, `← for agents`

Last remaining line must `startWith('❯')` and not contain: `Generating`, `Working`, `Searching`, `Reading`, `Writing`, `Thinking`, `⠋`, `⠙`, `⠹`, `⠸`

Require 2 consecutive idle polls (10s stable) before treating as truly done — avoids false idle during tool-call gaps.

## Prompt Engineering Rule

**Bonsai 27B hallucinates vague APIs.** ClaudeBot must convert user intent → engineering spec before dispatching. Spec must include:
- Exact HTML structure (element IDs, tag nesting)
- Exact JS APIs to call (method signatures, not library names)
- Data shapes and update mechanism
- Target filename + line count budget

Bad: "build a dashboard with charts"
Good: "Create X.html. Use canvas.getContext('2d'), ctx.beginPath/moveTo/lineTo/stroke. Data as Array(60).fill(0) circular buffer. setInterval(update,1000). 130 lines max."

## Notes

- **NATS progress hooks** — `~/bonsai-alfred/.claude/hooks/stop-notify.sh` (Stop) + `write-notify.sh` (PostToolUse Write, 60s rate-limit) publish to `claudeq.session.485101903`. Hooks load at startup — if hooks updated, restart Claude Code in bonsai-task pane: `tmux send-keys -t bonsai-task C-c Enter` then re-run claude command.
- **Never `git push`** — local history only; `~/bonsai-alfred/.git` tracks all work
- BonsaiBot loads htmz context automatically from `assets/htmzAgent/PATTERNS.md` on startup (BONSAI.md instructs this)
- Task prompt needs: target filename, what to build — no need to re-paste PATTERNS.md
- If session stuck: `tmux send-keys -t bonsai-task C-c` then retry
- llama-server context: 262K (`-c 262144`) — matches eval that proved capability; 128K was a regression
- Preview server port 8791 — kill with `pkill -f 'python3.*8791'` when done

## Relations

- involves: [[../../knowledge/bonsai-frontend-agent.md]]
- involves: [[../../knowledge/bonsai-27b-pop-eval.md]]
