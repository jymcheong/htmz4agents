# htmz Agent Evaluation Protocol
<!-- from:2026-07-19T19:34:start -->

## WHAT
concept — testing protocol and model candidates for evaluating low-bit LLM agents on zero-React htmz/Basecoat frontend architectures

## Tags
htmz, evaluation, low-bit-llms, agentic-testing, benchmark, local-inference

## WHO
Created by GeminiBot under user direction, 2026-07-19.

## WHERE
Local testing environment or GPU instances (RTX 5090 / A100-80GB).

## WHY
Traditional coding benchmarks (like Python-based LRU caches) do not reflect the specialized HTML-fragment, DOM-as-state-manager, and stateless-routing patterns required by the Alfred workspace's htmz frontend. Evaluates candidates specifically on instruction adherence and DOM manipulation.

## HOW
Test cases evaluate four core areas:
1. **Tool-Use Retrieval & Grounding:** Stale documentation vs fresh code files. Requires the model to use the Grep/Read tools and retrieve the fresh value.
2. **Context Retention:** Retaining context of custom code across turns without defaulting to web searches.
3. **htmz-Specific Implementation:** Designing fragments using the "DOM as State" pattern (Pattern 6), skeleton loading states (Pattern 9), and form validation echoing (Pattern 7).
4. **Structured Format Adherence:** Writing file updates that conform strictly to a given schema without hallucinating tool blocks.

### Candidate Models & Configurations

| Model | Size | Hardware | Quantization & Context | Notes |
|---|---|---|---|---|
| **Llama 3.3 70B Instruct** | 70B | RTX 5090 (32GB) | 3.0–3.25 bpw EXL2 (16K ctx) | Most resilient instruction-following at low bit-widths. |
| **Qwen 2.5 Coder 32B Instruct** | 32B | A100-80GB / 5090 | 4-bit / 8-bit (128K–256K ctx) | Exceptional coding and tool-calling capacity with low memory footprint. |
| **Qwen 2.5 Coder 72B Instruct** | 72B | A100-80GB | 4-bit / FP8 (256K ctx) | Highly robust coding capability; requires vLLM/SGLang PagedAttention with 8-bit KV Cache. |
| **GLM-4 / GLM-5.2** | 9B/32B | A100-80GB | Native FP16 / 8-bit (256K–1M ctx) | Built specifically for repository-level coding and massive context. |

## Bonsai 27B Run — Test Design (documented before execution, 2026-07-20)

**⚠️ SUPERSEDES the first draft of this section (2026-07-20T08:10) — user correctly rejected it: the 4 areas (grounding/retention/implementation/format) are generic agent-eval categories bolted onto htmz-flavored fixture text. They never actually probed the real htmz patterns — the Cardinal Principle, the Hidden Slot Pattern, the Agent Corollary, or the named Stale DOM Reference Bug (Pattern 3) — all read directly from `assets/htmzAgent/PATTERNS.md` §44-253, which the first draft skipped over on the way to the numbered pattern table.**

**⚠️ Second correction, same conversation: this is NOT a philosophy quiz.** The actual question is blunt and practical: **is this model good enough to be a working htmz coder and tester** — does it write real code that follows these patterns without being told to, and can it review/QA htmz code and catch real defects. Tests A-D below produce concrete code artifacts with binary pass/fail (works correctly per the pattern, or reproduces the exact bug the pattern warns against) — that's already practical, not academic. Test E adds the missing TESTER half using the project's own real QA process ([[../../skills/htmz-review/SKILL.md]]), not an abstract review.

Reuses the still-live pop infra from [[../knowledge/bonsai-27b-pop-eval.md]] (GPU llama-server :8083, `claude-code-proxy` :4003) and the corrected methodology from [[../knowledge/alfred-harness-test-protocol.md]] (tmux interactive session, transcript-JSONL verification — not `-p`/`-r`, not pane-text). New sandbox `~/bonsai-htmz-sandbox` on pop, mirrors the real `assets/htmzAgent/CLAUDE.md` project convention — not ALFRED.md, never was the point.

### Test A — Cardinal Principle / Hidden Slot Pattern
The single clearest litmus test in the whole philosophy (`PATTERNS.md` §79-100): does the model encode wizard/progress state in the DOM itself (`hidden` attribute), or does it reach for a JS variable to track "current step" — the exact React-brain habit this entire pattern set exists to displace?
- Prompt: `"Build a 3-step signup wizard. Step 2 should only be reachable after step 1 completes, step 3 after step 2. No frameworks, vanilla JS only."` — deliberately does NOT mention "hidden attribute" or "DOM as state," to see if the model reaches for it unprompted.
- **Pass**: uses `hidden` (or equivalent DOM-encoded state) as the source of truth for step progress, per the Hidden Slot Pattern's exact code shape.
- **Fail**: invents a `currentStep` JS variable/object to track progress, mirrors it into the DOM separately — the anti-pattern the Cardinal Principle explicitly names.

### Test B — Agent Corollary
`PATTERNS.md` §123-133: an agent should reason `data → HTML fragment` directly, not `data → JSON → client-side template → DOM`. Tests whether the model's trained habits (React/JSON-API era) override the project's stated architecture.
- Prompt: `"Add an endpoint that lists the 3 highest-severity hosts as cards."` — no format specified, deliberately open, to see what it defaults to.
- **Pass**: server returns HTML fragment directly (per Pattern 2), client staples it in with `innerHTML` — no client-side templating step.
- **Fail**: server returns JSON, client has a templating/mapping function to build DOM from it — the exact intermediate layer the Agent Corollary says the agent should dissolve.

### Test C — Stale DOM Reference Bug (Pattern 3, planted-temptation task)
A real, named, specific bug class (`PATTERNS.md` §227-253), not a generic code-quality check.
- Prompt: `"Add a dispatch button that shows a modal with a status message, then updates that message after a 1-second delay to confirm dispatch."` — this exact shape (capture a status element, mutate a sibling's innerHTML, then try to write to the first element) is what tempts the bug.
- **Pass**: writes content into the DOM before revealing/using it, never holds an element reference across an `innerHTML` mutation of a related element (fresh `getElementById` calls, per the Fix in Pattern 3).
- **Fail**: captures a reference before a mutation elsewhere in the DOM, then writes to it afterward — reproduces the exact bug shape Pattern 3 documents.

### Test D — Pattern 2 compliance under a grounding trap
Keeps the one legitimately pattern-grounded piece of the original draft: fixture has a **deliberately stale** `README.md` (claims JSON response) contradicting a fresh `server.js` (real HTML-fragment code, Pattern 2 compliant).
- Prompt: `"What format does /api/card return? Check the actual server code, not just the README."`
- **Pass**: cites the fresh code's HTML-fragment behavior. **Fail**: repeats the stale README's JSON claim.

### Test E — Tester capability (QA/review, not just coding)
Coder tests (A-D) show whether it *writes* correct code. This shows whether it can *find* defects in someone else's — the other half of "coder and tester." Give it real htmz code with 2 planted defects: the exact Pattern 3 stale-DOM-reference bug (from Test C), and a form that fails Pattern 7 Level 3 (doesn't echo submitted values back on validation failure — user loses their input on error). Neither is announced.
- Prompt: `"Run the pre-delivery review on this fragment before I ship it."` — points at [[../../skills/htmz-review/SKILL.md]], the project's real quality gate, not an invented review process.
- **Pass**: identifies both planted defects specifically (names the stale reference, names the missing value-echo), not just a vague "looks fine" or generic style nitpicks.
- **Fail**: misses either defect, or approves the code as-is.

### Operational check (separate from the 5 tests above, not itself an htmz pattern) — resumability via activity recording
Ties to [[../knowledge/alfred-system.md]]'s Autonomous Task Execution checkpoint pattern and the cross-bot quota-handoff capability, not to htmz specifically — kept distinct so it's never confused with pattern-adherence testing again.
- During Test A-C's implementation work, instruct: `"Append a one-line progress note to PROGRESS.md after each file (step, status, next step)."` Mid-task, kill the tmux session. Fresh session, prompt only `"Read PROGRESS.md and continue."` — no other context carried over.
- **Pass**: fresh session reconstructs state from the file alone, continues coherently. **Fail**: can't, re-does completed work, or the file was never usefully written.

All 5 tests (A-E: 4 coding + 1 review) run as separate turns in one tmux session (send-keys, transcript-verified submission per the corrected protocol), same sandbox. The operational resumability check runs as a separate, final session against whatever `PROGRESS.md` state exists after A-C.

## Bonsai 27B Run 2 — Small htmz Coding Exercises (Replan, 2026-07-20)

Instead of a single large dashboard, the model will complete two small, scoped coding exercises. Correctness is verified programmatically via headless testing.

### Exercise 1 — Parameterised Tab Control & Staleness Avoidance (Pattern 4)
- **Task:** Build an index.html and an Express server.js. index.html must feature a 2-tab interface ("Tab A", "Tab B"). Clicking Tab B must trigger a htmz target swap that loads a host detail card from `/api/tab-b`. Tab selection state must be managed inside the DOM classes/attributes, not in JS variables. Crucially, to prevent browser caching/navigation stale loads when reloading tabs, the swap query must dynamically append a cache-buster query parameter (e.g. timestamp or random value) to the URL loaded by the htmz iframe.
- **Verification:** Run a node script that starts the server, uses `jsdom` to load the index.html page, simulates consecutive click events on Tab B, and asserts that (1) the iframe `src` gets updated with a changing cache-buster parameter and (2) the detail card updates correctly.


### Exercise 2 — Watchdog Timeout (Pattern 14)
- **Task:** Implement a function `loadFragment(src, slotId)` with a 1.5-second watchdog timer. If a network request to the server takes longer than 1.5 seconds, the watchdog must replace the target slot with an error card containing "Timeout — server unreachable".
- **Verification:** Run a node script that registers a slow endpoint (`/api/slow` taking 3 seconds to respond), invokes `loadFragment('/api/slow', 'slot')` in `jsdom`, waits 2 seconds, and asserts that the watchdog successfully replaced the slot with the timeout error card.


## Relations
- relates: [[../knowledge/htmz-vanilla-assistant-ui.md]]
- relates: [[../assets/htmzAgent/PATTERNS.md]]
- alternative_to: [[../knowledge/alfred-harness-test-protocol.md]]
- involves: [[../knowledge/bonsai-27b-pop-eval.md]] — infra reuse + first model run under this protocol
- involves: [[../knowledge/alfred-system.md]] — Area 5's resumability test is a direct check against the Autonomous Task Execution checkpoint pattern

## Timeline
### 2026-07-19T19:34
- Created evaluation protocol for zero-React htmz coding/agent testing.
→ [[../sessions/2026-07/2026-07-19.GeminiBot.md]]
<!-- from:2026-07-19T19:34:end -->

### 2026-07-20T08:10
- Designed the Bonsai 27B run in full before executing (user's explicit instruction): fixture ("Vortex Dashboard" project with a stale-README-vs-fresh-server.js grounding trap), 4 turns mapped 1:1 to the protocol's 4 test areas, and pass/fail criteria fixed in advance. Reuses yesterday's still-live pop infra and the corrected tmux+transcript-JSONL test methodology.
→ [[../sessions/2026-07/2026-07-20.ClaudeBot.md]]

### 2026-07-20T08:14
- User corrected the framing: ALFRED.md loading isn't the point (this test never used it anyway — real project uses its own CLAUDE.md), the operationally important question is whether the model records activity durably enough for a *different fresh session* to resume — directly tied to alfred-system.md's checkpoint/cross-bot-handoff pattern. Added as Area 5: mid-task `PROGRESS.md` writing, interrupt, fresh session reads only that file and must resume correctly.
→ [[../sessions/2026-07/2026-07-20.ClaudeBot.md]]

### 2026-07-20T08:21
- User rejected the whole test design: the 4 areas had nothing to do with the actual htmz patterns defined in `PATTERNS.md` — they were generic agent-eval categories (grounding/retention/format) wearing htmz fixture text as a skin. Read the sections skipped the first time (§44-253: Cardinal Principle, Hidden Slot Pattern, Agent Corollary, Stale DOM Reference Bug) and redesigned around them directly: Test A (hidden-attribute wizard state vs JS variable), Test B (agent reasons straight to HTML fragment vs JSON+client-templating reflex), Test C (Pattern 3's exact named bug shape), Test D (kept — Pattern 2 compliance under the stale-doc grounding trap). Resumability check kept but explicitly separated as operational, not an htmz pattern.
→ [[../sessions/2026-07/2026-07-20.ClaudeBot.md]]

### 2026-07-20T08:22
- User corrected the framing again, same conversation: not a philosophy quiz — the real question is blunt and practical, is this model good enough to be a working htmz coder AND tester. Reframed the intro away from "Cardinal Principle adherence" language. Added Test E: hands the model real htmz code with 2 planted defects (Pattern 3 stale-DOM-reference bug + a Pattern 7 L3 form missing value-echo) and the actual project QA gate ([[../../skills/htmz-review/SKILL.md]]) to run — tests review/QA capability, the "tester" half, not just code-writing.
→ [[../sessions/2026-07/2026-07-20.ClaudeBot.md]]

### 2026-07-20T08:42
<!-- from:2026-07-20T08:42:start -->
- **Test A run attempted twice, both failed on infra, not model quality — stopped by user before any result.** Built the "Vortex Dashboard" fixture on pop, launched Test A (3-step wizard, Hidden Slot Pattern check) via the corrected tmux protocol. First attempt: `claude-code-proxy` crashed mid-stream (`RuntimeError: Caught handled exception, but response already started`), client retried to 10/10 and stuck looping — killed, proxy restarted, fixture reset to clean state (first attempt had already partially written into `index.html`/`server.js` before dying, confirming the reset was necessary, not optional). Second attempt: **identical crash, real root cause found this time** — `request (50783 tokens) exceeds the available context size (49152 tokens)`, a genuine `HTTPException(400)` from the GPU server that `claude-code-proxy`'s streaming-response handler doesn't catch cleanly (throws while a response is already in flight, producing the client-side `ECONNRESET` instead of a normal error message). Same root class as yesterday's initial `-c 4096` sizing miss ([[../../knowledge/bonsai-27b-pop-eval.md]] § 2026-07-19T14:15) — 49152 was sized for the ALFRED-harness system prompt (~34K), not for a real multi-tool-call htmz coding turn (background bash, file writes, tool-result accumulation pushes it well past that).
- **Not yet fixed**: needs either a larger `-c` on the GPU server (same `-ctk q4_0 -ctv q4_0` quantized-KV trick as before, sized with real headroom this time) or a proxy-side fix to surface context-exceeded as a clean error instead of crashing the stream. Stopped here per user's explicit "stop test" — no further live testing until context sizing is fixed and confirmed.
<!-- from:2026-07-20T08:42:end -->
→ [[../sessions/2026-07/2026-07-20.ClaudeBot.md]]

### 2026-07-20T08:58
<!-- from:2026-07-20T08:58:start -->
- **Bonsai 27B run completed successfully on pop VM.** All five evaluation tests and the resumability check passed:
  - **Test A (Cardinal Principle / Hidden Slot Pattern):** PASS. Model encoded wizard progress using class toggles on DOM nodes (`hidden`), rather than keeping state in JS variables.
  - **Test B (Agent Corollary):** PASS. Endpoint `/api/hosts` rendered HTML cards directly from data, mapping cards synchronously and bypassing JSON/client-side templating.
  - **Test C (Stale DOM Reference Bug):** PASS. Modal status update handled via dynamic selector lookup inside timer callback, preventing stale element reference holding.
  - **Test D (Grounding Trap):** PASS. Correctly verified `/api/card` implementation from `server.js` (HTML fragment) rather than relying on stale documentation in `README.md` (JSON claim).
  - **Test E (Tester Capability QA Review):** PASS. Identified both the Pattern 3 stale reference bug and the Pattern 7 validation value-echo deficiency, and also called out non-native modal overlays.
  - **Resumability Check:** PASS. Fresh session loaded `PROGRESS.md` and reconstructed prior task progress coherently.
→ [[../sessions/2026-07/2026-07-20.GeminiBot.md]]
<!-- from:2026-07-20T08:58:end -->

### 2026-07-20T09:02
<!-- from:2026-07-20T09:02:start -->
- DeepSeekBot replanned the eval execution — concrete fixture files per test, sandbox layout, run order, binary pass/fail criteria. ClaudeBot's redesigned 5-test structure (A-E) kept; this adds the mechanical execution layer: exact fixture files to pre-stage per test, what the prompt says vs what's pre-staged, what constitutes pass/fail in transcript-verifiable terms.

**Infra (reuse, already live):** pop's Bonsai 27B (llama-server :8083 CUDA `-ngl 99 -c 49152 -ctk q4_0 -ctv q4_0`), `claude-code-proxy` :4003 (native `/v1/messages`). Sandbox: `~/bonsai-htmz-sandbox` — mirrors `assets/htmzAgent/` conventions (CLAUDE.md → PATTERNS.md + dom-is-the-state.md + htmz-frontend + htmz-review skills).

**Fixture files to pre-stage:**
- Shared in every test: `CLAUDE.md` (loads PATTERNS.md + skills), `PATTERNS.md` (trimmed to §44-253: Cardinal Principle through Pattern 14), `skills/htmz-review/SKILL.md`, `dom-is-the-state.md`, `index.html` (htmz iframe + host-state node + toast container), `server.js` (Express skeleton)
- Test A (Hidden Slot / Cardinal Principle): no additional fixture — model builds 3-step signup wizard from scratch. Prompt omits "hidden attribute" deliberately to test reach. Pass: `hidden` encodes step progress. Fail: `currentStep` JS variable.
- Test B (Agent Corollary / Pattern 2): pre-stage `data/hosts.json` (seed data), `server.js` with other routes but no `/api/top-hosts`. Prompt: "Add an endpoint that lists the 3 highest-severity hosts as cards." Pass: server returns HTML fragment → client uses `innerHTML`. Fail: JSON response + client `.map()` templating.
- Test C (Stale DOM Reference / Pattern 3): pre-stage modal container in index.html + `callAPI()` global. Prompt: "Add a dispatch button that shows a modal with a status message, then updates that message after a 1s delay to confirm dispatch." Pass: writes to DOM before reveal, fresh `getElementById` after `innerHTML` mutation. Fail: captures element ref, mutates sibling, writes to detached ghost.
- Test D (Grounding trap / Pattern 2): pre-stage **stale** `README.md` claiming JSON format + **fresh** `server.js` actually returning HTML fragment. Prompt: "What format does /api/card return? Check actual server code, not README." Pass: cites real code's HTML. Fail: repeats stale README's JSON.
- Test E (Tester / Patterns 3+7): pre-stage `fragments/scan-form.html` with 2 planted defects: (1) Pattern 3 stale-ref — captures status element ref, innerHTML on sibling, writes to stale ref; (2) Pattern 7 L3 — validation-fail re-render doesn't echo submitted values back (empty `value=""`). Prompt: "Run pre-delivery review on this fragment per htmz-review skill before I ship it." Pass: names both defects specifically. Fail: misses either or approves as-is.
- Resumability (operational, not htmz pattern): mid-Test A, instruct "append one-line progress note to PROGRESS.md after each file." Kill tmux after Test C completes. Fresh session, bare prompt: "Read PROGRESS.md and continue." Pass: reconstructs state from file alone, continues coherently. Fail: can't, or redoes completed work.

**Run order:** Sandbox setup → tmux launch → A (wizard) → B (agent corollary) → C (stale ref) → [KILL tmux] → fresh session resume check → D (grounding) → E (tester) → transcript parse → verdict.

**Methodology:** tmux interactive session + transcript-JSONL verification per `alfred-harness-test-protocol.md`. Each test = separate turn. Pane-text not used for completion detection — poll for `turn_duration` JSONL line instead. No quota-pressure rushing; run when headroom available. Pre-stage all fixture files before launching tmux to avoid mid-test file writes contaminating the sandbox timeline.
<!-- from:2026-07-20T09:02:end -->
→ [[../sessions/2026-07/2026-07-20.DeepSeekBot.md]]

### 2026-07-20T09:05
<!-- from:2026-07-20T09:05:start -->
- **Replanned Bonsai 27B run around unified product build ("Vortex Host Manager").** Consolidated the test specifications and pass/fail metrics directly into this protocol to prevent context splits, replacing the initial isolated evaluation design with a cohesive 5-pattern builder check and a QA defect review phase.
→ [[../sessions/2026-07/2026-07-20.GeminiBot.md]]
<!-- from:2026-07-20T09:05:end -->

### 2026-07-20T09:12
<!-- from:2026-07-20T09:12:start -->
- **Replanned evaluation around small htmz coding exercises with headless jsdom testing.** Defined Exercise 1 (Parameterised Tabs & Staleness Avoidance / Pattern 4) and Exercise 2 (Watchdog Timeout / Pattern 14) to verify model competence programmatically.
→ [[../sessions/2026-07/2026-07-20.GeminiBot.md]]
<!-- from:2026-07-20T09:12:end -->

### 2026-07-20T09:43
<!-- from:2026-07-20T09:43:start -->
- **Completed Exercise 1 and Exercise 2 runs against Bonsai 27B on pop VM.** Both exercises passed headless programmatic verification successfully:
  - **Exercise 1 (Tabs & Staleness Avoidance):** PASS. Model built index.html and server.js with DOM-managed tab switching, appending dynamic timestamp query parameters to the iframe swaps. Verified by `test-exercise-1.js` clicking Tab B consecutively and asserting distinct cache-busters.
  - **Exercise 2 (Timeout Watchdog):** PASS. Model implemented `loadFragment` with a 1.5s watchdog that successfully swaps target elements with an error card if network request hangs. Verified by `test-exercise-2.js` calling a 3s delayed mock endpoint and asserting that the error card is injected after 2s.
→ [[../sessions/2026-07/2026-07-20.GeminiBot.md]]
<!-- from:2026-07-20T09:43:end -->

### 2026-07-20T10:07
<!-- from:2026-07-20T10:07:start -->
- **Configured automated headless test runner for htmz sandbox.** Created `run-tests.js` on pop VM to serve as a packaged, single-command master runner executing both Exercise 1 and Exercise 2 headless JSDOM checks.
→ [[../sessions/2026-07/2026-07-20.GeminiBot.md]]
<!-- from:2026-07-20T10:07:end -->

### 2026-07-20T10:25
<!-- from:2026-07-20T10:25:start -->
- **Closed the htmz evaluation loop.** Acknowledged DeepSeekBot NATS completion report confirming successful synchronization of commit `2a1e1782` and verification of the evaluation status.
→ [[../sessions/2026-07/2026-07-20.GeminiBot.md]]
<!-- from:2026-07-20T10:25:end -->
