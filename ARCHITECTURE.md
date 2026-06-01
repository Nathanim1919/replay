# Replay — Open-Source Loom for Terminal Sessions

## Vision

Replay is a developer tool that records terminal sessions as structured event streams and replays them in a beautiful, scrubable web player with AI-generated summaries. It replaces pasting terminal output into Slack, recording Loom videos, and writing long bug reports.

```bash
replay record
# ... debug, fix, deploy, whatever ...
# ctrl+d to stop

# => Saved: bugfix-2026-06-15.replay (247 KB)
# => Uploading... done.
# => https://replay.sh/s/abc123
#
# AI Summary:
#   Problem: Nginx returning 502 after deploy
#   Root Cause: Upstream port changed from 8080 to 3000 in new version
#   Fix: Updated proxy_pass in nginx.conf
#   Duration: 4m 32s | Commands: 23 | Key moments: 3
```

---

## Why This Exists

### What developers do today (and why it sucks)

```
Scenario 1: Bug report
  Developer: "It's broken"
  Lead: "Show me"
  Developer: *pastes 200 lines of terminal output into Slack*
  Lead: *squints at wall of text, no context, no timeline*

Scenario 2: Incident postmortem
  Team: "What happened at 3 AM?"
  On-call: *tries to reconstruct from memory + bash history*
  Everyone: *writes a 2-page doc nobody reads*

Scenario 3: Onboarding
  Senior: "Just watch me do a deploy"
  Junior: *watches screen share, takes notes, forgets half*
  Senior: *does it again next week for another new hire*

Scenario 4: Code review context
  Author: "I debugged this for 2 hours, here's the fix"
  Reviewer: *sees 3-line diff, has no idea why*
```

### What Replay does

```
Scenario 1: Bug report
  Developer: replay record → reproduce bug → ctrl+d
  Developer: *shares link*
  Lead: *scrubs to the error, sees exact context, responds in 2 min*

Scenario 2: Incident postmortem
  On-call: replay record → triage → fix → ctrl+d
  Team: *replays session at 4x speed, AI summary highlights key moments*

Scenario 3: Onboarding
  Senior: replay record → deploy → ctrl+d
  Junior: *replays at own pace, pauses, copies commands*
  Next hire: *watches same replay*

Scenario 4: Code review context
  Author: *attaches replay link to PR*
  Reviewer: *watches 2-min replay, understands the "why"*
```

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REPLAY SYSTEM                                │
│                                                                      │
│  ┌─────────────────┐   ┌─────────────────┐   ┌──────────────────┐  │
│  │   CLI Recorder   │   │   Web Player    │   │  AI Pipeline     │  │
│  │                  │   │                  │   │                  │  │
│  │ • PTY capture    │   │ • VT100 emulator│   │ • LLM extraction │  │
│  │ • Event stream   │   │ • Scrubber      │   │ • Key moment     │  │
│  │ • Checkpoints    │   │ • Search        │   │   detection      │  │
│  │ • Markers        │   │ • Speed control │   │ • Embeddings     │  │
│  │ • Upload         │   │ • Embed mode    │   │ • Summary gen    │  │
│  └────────┬─────────┘   └────────┬────────┘   └────────┬─────────┘  │
│           │                      │                      │            │
│           └──────────────────────┼──────────────────────┘            │
│                                  │                                    │
│                        ┌─────────┴──────────┐                        │
│                        │   Backend API       │                        │
│                        │                     │                        │
│                        │ • Upload/download   │                        │
│                        │ • Share links       │                        │
│                        │ • Search            │                        │
│                        │ • User accounts     │                        │
│                        └─────────┬───────────┘                        │
│                                  │                                    │
│                    ┌─────────────┼─────────────┐                     │
│                    │             │             │                      │
│               ┌────┴────┐  ┌────┴────┐  ┌────┴────┐                │
│               │Postgres │  │  S3/R2  │  │  Redis  │                │
│               │+pgvector│  │ (blobs) │  │ (cache) │                │
│               └─────────┘  └─────────┘  └─────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component 1: CLI Recorder

### How Recording Works

```
┌──────────────────────────────────────────────────────────┐
│                    replay record                          │
│                                                          │
│   ┌──────────┐     ┌──────────────┐     ┌────────────┐  │
│   │  User's   │     │   PTY Proxy   │     │  Event     │  │
│   │  Terminal  │◄───►│              │     │  Writer    │  │
│   │           │     │  ┌────────┐  │     │            │  │
│   │  (stdin/  │     │  │ Spawned│  │────►│  Writes    │  │
│   │   stdout) │     │  │ Shell  │  │     │  events to │  │
│   │           │     │  │ (bash) │  │     │  .replay   │  │
│   │           │     │  └────────┘  │     │  file      │  │
│   └──────────┘     └──────────────┘     └────────────┘  │
│                                                          │
│   The user sees a normal shell. They don't notice        │
│   recording is happening. Everything works exactly       │
│   as usual — but every byte is captured with             │
│   microsecond timestamps.                                │
└──────────────────────────────────────────────────────────┘
```

### PTY Architecture

```
                   ┌─────────────────────────────────┐
                   │        replay process            │
                   │                                  │
  User's terminal  │   ┌───────────────────────┐     │
  ┌──────────┐     │   │    PTY Master         │     │
  │ stdin  ──┼─────┼──►│                       │     │
  │          │     │   │   Spawns child shell   │     │
  │ stdout ◄─┼─────┼───│   (bash/zsh/fish)     │     │
  │          │     │   │                       │     │
  │ (raw     │     │   │   Master FD reads     │     │
  │  mode)   │     │   │   all output          │     │
  └──────────┘     │   └───────────┬───────────┘     │
                   │               │                  │
                   │               │ every byte       │
                   │               │ timestamped      │
                   │               v                  │
                   │   ┌───────────────────────┐     │
                   │   │   Event Recorder      │     │
                   │   │                       │     │
                   │   │   • Output events     │     │
                   │   │   • Input events      │     │
                   │   │   • Resize events     │     │
                   │   │   • Checkpoints       │     │
                   │   │     (every 30s)       │     │
                   │   │   • User markers      │     │
                   │   └───────────┬───────────┘     │
                   │               │                  │
                   │               v                  │
                   │   ┌───────────────────────┐     │
                   │   │   .replay file        │     │
                   │   │   (append-only)       │     │
                   │   └───────────────────────┘     │
                   └─────────────────────────────────┘
```

**Implementation details:**

```go
// Simplified recording loop (Go)

func record(outputFile string) error {
    // 1. Put user's terminal into raw mode
    oldState, _ := term.MakeRaw(int(os.Stdin.Fd()))
    defer term.Restore(int(os.Stdin.Fd()), oldState)

    // 2. Create PTY with child shell
    shell := os.Getenv("SHELL")
    cmd := exec.Command(shell)
    ptyMaster, _ := pty.Start(cmd)

    // 3. Open event writer
    writer := NewEventWriter(outputFile)
    writer.WriteHeader(getTerminalSize(), shell, os.Environ())

    startTime := time.Now()

    // 4. Bidirectional copy with recording

    // User input → PTY (+ record input events)
    go func() {
        buf := make([]byte, 4096)
        for {
            n, err := os.Stdin.Read(buf)
            if err != nil { break }

            // Forward to shell
            ptyMaster.Write(buf[:n])

            // Record
            elapsed := time.Since(startTime)
            writer.WriteEvent(Event{
                Time: elapsed,
                Type: EventInput,
                Data: buf[:n],
            })
        }
    }()

    // PTY output → User terminal (+ record output events)
    buf := make([]byte, 4096)
    checkpointTicker := time.NewTicker(30 * time.Second)
    for {
        n, err := ptyMaster.Read(buf)
        if err != nil { break }

        // Forward to user
        os.Stdout.Write(buf[:n])

        // Record
        elapsed := time.Since(startTime)
        writer.WriteEvent(Event{
            Time: elapsed,
            Type: EventOutput,
            Data: buf[:n],
        })

        // Periodic checkpoint
        select {
        case <-checkpointTicker.C:
            writer.WriteCheckpoint(virtualTerminal.State())
        default:
        }
    }

    return writer.Close()
}
```

### Checkpoint System (What Makes Seeking Fast)

**Current state (v1):** The web player seeks by resetting xterm.js and replaying all events from time 0 to the target time. This works for sessions under ~10 minutes. For longer sessions, this becomes slow (replaying thousands of events takes visible time).

**The problem with asciinema:** To seek to minute 5 of a 10-minute recording, you must replay all events from 0:00 to 5:00. For long sessions, this takes seconds — unacceptable for scrubbing.

**Replay's solution: periodic terminal state snapshots.**

**Implementation requirements (TODO — not yet implemented):**
1. Go recorder: run a VT100 state machine alongside the PTY reader to track terminal state. Every 30 seconds, serialize the full state as a `"c"` checkpoint event.
2. Checkpoint format: must capture exactly what xterm.js needs to restore — use xterm.js serialize addon to determine the minimum viable state.
3. Web player: on seek, find nearest checkpoint before target time, restore terminal from checkpoint state, then replay only the events between checkpoint and target.
4. Go recorder needs a VT100 emulator (headless) to compute checkpoint state — this is a significant implementation effort. Libraries: `github.com/creack/pty` gives raw bytes, but interpreting them into screen state requires a parser like `github.com/danielgatis/go-vte` or a custom implementation.

```
Event Timeline:
─────────────────────────────────────────────────────────
│ events │ events │ events │ events │ events │ events │
─────────────────────────────────────────────────────────
         ▲                 ▲                 ▲
         │                 │                 │
    Checkpoint 1      Checkpoint 2      Checkpoint 3
    (t = 30s)         (t = 60s)         (t = 90s)
    Full terminal     Full terminal     Full terminal
    state snapshot    state snapshot    state snapshot

To seek to t = 75s:
  1. Load Checkpoint 2 (t = 60s) — instant, full terminal state
  2. Replay events from t = 60s to t = 75s — only 15s of events
  3. Terminal is now at correct state — total seek time < 100ms
```

**Checkpoint contents:**

```json
{
  "type": "checkpoint",
  "time": 60000,
  "state": {
    "screen_buffer": [
      ["$ kubectl get pods", "READY  STATUS"],
      ["api-server  1/1  Running  0  12m"],
      ["worker      0/1  CrashLoopBackOff  5  12m"]
    ],
    "cursor": {"row": 5, "col": 2},
    "cursor_visible": true,
    "attributes": {"fg": "default", "bg": "default", "bold": false},
    "scroll_region": {"top": 0, "bottom": 24},
    "alternate_screen": false,
    "terminal_title": "bash - ~/projects/api",
    "working_directory": "/home/nathan/projects/api"
  }
}
```

---

## Component 2: Replay File Format (`.replay`)

### Design Goals
- Streamable (can start playing before file fully downloads)
- Seekable (checkpoints enable O(1) seeking)
- Compact (binary output events, not base64)
- Extensible (new event types without breaking old players)
- Compatible (superset of asciinema v2 concepts, but better)

### File Structure

```
┌──────────────────────────────────────────────────────────┐
│                    .replay file                           │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  HEADER (JSON, single line, newline terminated)     │  │
│  │  {                                                  │  │
│  │    "version": 1,                                    │  │
│  │    "width": 120,                                    │  │
│  │    "height": 40,                                    │  │
│  │    "timestamp": 1719849600,                         │  │
│  │    "duration": 272.5,                               │  │
│  │    "shell": "/bin/bash",                            │  │
│  │    "term": "xterm-256color",                        │  │
│  │    "title": "debugging api-server crashloop",       │  │
│  │    "env": {"SHELL": "/bin/bash"},                   │  │
│  │    "checkpoints": [30.0, 60.0, 90.0, ...]          │  │
│  │  }                                                  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  EVENT STREAM (one JSON array per line)             │  │
│  │                                                     │  │
│  │  [0.000000, "o", "$ "]                              │  │
│  │  [0.500000, "i", "k"]                               │  │
│  │  [0.520000, "i", "u"]                               │  │
│  │  [0.540000, "i", "b"]                               │  │
│  │  [0.800000, "o", "kubectl"]                         │  │
│  │  [1.200000, "o", " get pods\r\n"]                   │  │
│  │  [1.800000, "o", "NAME   READY  STATUS...\r\n"]     │  │
│  │  ...                                                │  │
│  │  [30.000, "c", {"screen_buffer": [...], ...}]       │  │  ← checkpoint
│  │  ...                                                │  │
│  │  [45.300, "m", {"label": "found the bug"}]          │  │  ← user marker
│  │  ...                                                │  │
│  │  [60.000, "c", {"screen_buffer": [...], ...}]       │  │  ← checkpoint
│  │  ...                                                │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Event Types

| Code | Type | Description |
|------|------|-------------|
| `o` | Output | Terminal output bytes (what appears on screen) |
| `i` | Input | User keystrokes (optional, privacy-sensitive) |
| `r` | Resize | Terminal size change `{"w": 120, "h": 40}` |
| `c` | Checkpoint | Full terminal state snapshot (for fast seeking) |
| `m` | Marker | User-placed bookmark `{"label": "bug found here"}` |
| `e` | Environment | Env change or working directory change |
| `g` | Git | Git status snapshot `{"branch": "main", "dirty": true}` |
| `n` | Note | Text annotation added during or after recording |
| `p` | Process | OS telemetry snapshot `{"pid": 1234, "cwd": "/app", "mem_mb": 512, "cpu_pct": 23.5}` |

### Why JSON Lines (Not Binary)

- Human-readable and debuggable
- Streamable (parse line by line)
- Gzipped JSON lines are nearly as compact as custom binary
- Tools like `jq` can process them
- Asciinema compatibility (their v2 format is similar)
- Checkpoints are the only large events — they compress well

### Compression

```
Raw .replay file:  ~2-5 MB per hour (mostly terminal output bytes)
Gzipped (.replay.gz): ~200-500 KB per hour
Zstd (.replay.zst):   ~150-400 KB per hour (better streaming support)

Default: zstd compression with streaming decompression in player
```

---

## Component 3: Web Player

### Player Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     REPLAY WEB PLAYER                             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                 Terminal Canvas                            │    │
│  │                                                          │    │
│  │  ┌────────────────────────────────────────────────────┐  │    │
│  │  │ $ kubectl get pods -n production                   │  │    │
│  │  │ NAME            READY   STATUS             AGE     │  │    │
│  │  │ api-server      1/1     Running            12m     │  │    │
│  │  │ worker          0/1     CrashLoopBackOff   12m     │  │    │
│  │  │ redis           1/1     Running            45d     │  │    │
│  │  │                                                    │  │    │
│  │  │ $ kubectl logs worker --tail=20                    │  │    │
│  │  │ panic: runtime error: invalid memory address       │  │    │
│  │  │                                                    │  │    │
│  │  │ goroutine 1 [running]:                             │  │    │
│  │  │ main.processQueue(0x0)                             │  │    │
│  │  │     /app/worker/main.go:47 +0x1a2                  │  │    │
│  │  │ ▌                                                  │  │    │
│  │  └────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                Activity Waveform                          │    │
│  │  ▁▁▃▅▇█▇▅▃▁▁▁▁▁▃▅█▇▅▃▁▁▁▁▂▃▅▇███▇▅▃▂▁▁▁▁▁▁▁▃▅▇▅▃▁▁  │    │
│  │                                                          │    │
│  │  Tall bars = lots of output (something happened)         │    │
│  │  Flat = idle / thinking                                  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                Timeline Scrubber                          │    │
│  │                                                          │    │
│  │  0:00 ────●────────────────────────────────── 4:32       │    │
│  │           ▲          ▲              ▲                     │    │
│  │        error      root cause     fix verified            │    │
│  │        detected   found          ✓                       │    │
│  │                                                          │    │
│  │  [|◄] [◄◄] [ ▶ ] [►►] [►|]    Speed: 1x [2x] 4x 8x    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                Controls                                   │    │
│  │                                                          │    │
│  │  [🔍 Search output]  [📋 Copy visible]  [⬇ Download]    │    │
│  │  [< > Embed code]    [🔗 Share link]    [AI Summary ▼]   │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                AI Summary Panel (collapsible)             │    │
│  │                                                          │    │
│  │  Problem: Worker pod in CrashLoopBackOff                 │    │
│  │  Root Cause: Nil pointer dereference in processQueue()   │    │
│  │    when Redis connection drops — no nil check on conn.   │    │
│  │  Fix: Added connection nil check + reconnection logic    │    │
│  │    in worker/main.go:47                                  │    │
│  │                                                          │    │
│  │  Key Moments:                                            │    │
│  │  • 0:45 — Error spotted in kubectl logs     [Jump ►]     │    │
│  │  • 1:30 — Stack trace analyzed              [Jump ►]     │    │
│  │  • 2:15 — Root cause identified             [Jump ►]     │    │
│  │  • 3:00 — Fix applied and tested            [Jump ►]     │    │
│  │                                                          │    │
│  │  Commands Used: kubectl, vim, go test, go build          │    │
│  │  Files Modified: worker/main.go                          │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### VT100 Terminal Emulator (The Hard Part)

The web player must include a terminal emulator that interprets raw terminal output bytes and renders the screen state. This is the same problem terminal apps (iTerm, Alacritty) solve, but in JavaScript/WASM.

```
Terminal Output Bytes
  │
  │  "\x1b[2J"          (clear screen)
  │  "\x1b[1;1H"        (move cursor to 1,1)
  │  "\x1b[1;32m"       (set color: bold green)
  │  "$ "               (literal text)
  │  "\x1b[0m"          (reset color)
  │  "kubectl get pods"  (literal text)
  │  "\r\n"             (newline)
  │
  v
┌────────────────────────────────────────────┐
│         VT100 State Machine                 │
│                                            │
│  State:                                    │
│  • Screen buffer: char[][] (rows × cols)   │
│  • Per-cell attributes: fg, bg, bold, etc  │
│  • Cursor position: (row, col)             │
│  • Scroll region: (top, bottom)            │
│  • Mode flags: insert, wrap, origin, etc   │
│  • Saved cursor stack                      │
│  • Alternate screen buffer                 │
│  • Tab stops                               │
│                                            │
│  Parses:                                   │
│  • CSI sequences (\x1b[...)               │
│  • OSC sequences (\x1b]...)               │
│  • DCS sequences (\x1bP...)              │
│  • Simple escapes (\x1b + char)           │
│  • Control characters (BEL, BS, TAB, etc) │
│  • UTF-8 text                              │
└─────────────────┬──────────────────────────┘
                  │
                  v
┌────────────────────────────────────────────┐
│         Renderer (Canvas or DOM)            │
│                                            │
│  Converts screen buffer to visual output:  │
│  • Each cell → positioned character with   │
│    color, weight, decoration               │
│  • Cursor rendered as blinking block/line   │
│  • Selection highlight                     │
│  • Smooth scrolling                        │
└────────────────────────────────────────────┘
```

**CSI (Control Sequence Introducer) sequences to support:**

| Sequence | Meaning | Priority |
|----------|---------|----------|
| `\x1b[{n}A` | Cursor up n | Must have |
| `\x1b[{n}B` | Cursor down n | Must have |
| `\x1b[{n}C` | Cursor forward n | Must have |
| `\x1b[{n}D` | Cursor back n | Must have |
| `\x1b[{r};{c}H` | Cursor position | Must have |
| `\x1b[{n}J` | Erase display | Must have |
| `\x1b[{n}K` | Erase line | Must have |
| `\x1b[{n}m` | SGR (colors/attributes) | Must have |
| `\x1b[{t};{b}r` | Set scroll region | Must have |
| `\x1b[?25h/l` | Show/hide cursor | Must have |
| `\x1b[?1049h/l` | Alternate screen buffer | Must have |
| `\x1b[{n}S` | Scroll up | Should have |
| `\x1b[{n}T` | Scroll down | Should have |
| `\x1b[{n}L` | Insert lines | Should have |
| `\x1b[{n}M` | Delete lines | Should have |
| `\x1b[{n}@` | Insert characters | Nice to have |
| `\x1b[{n}P` | Delete characters | Nice to have |

**SGR (Select Graphic Rendition) — color/attribute support:**

```
Basic:     0-9 (reset, bold, dim, italic, underline, blink, reverse, hidden)
FG colors: 30-37 (standard), 90-97 (bright)
BG colors: 40-47 (standard), 100-107 (bright)
256-color: 38;5;{n} (FG), 48;5;{n} (BG)
True color: 38;2;{r};{g};{b} (FG), 48;2;{r};{g};{b} (BG)
```

**Implementation approach:**

Option A: Use xterm.js (battle-tested, full VT100 support) and feed it events at playback speed. Simpler, production-ready faster.

Option B: Build a custom VT100 emulator in TypeScript/WASM. Harder, but lighter weight (xterm.js is ~200KB) and gives full control over rendering (custom themes, activity heatmap, search highlighting).

**Recommendation:** Start with xterm.js for MVP. Replace with custom emulator in v2 if xterm.js becomes a bottleneck (it likely won't for replay-only use).

### Activity Waveform

The waveform shows output density over time — a visual fingerprint of the session:

```
Computation:

1. Divide session into N buckets (1 bucket per pixel of waveform width)
2. For each bucket: count bytes of terminal output
3. Normalize to 0-1 range
4. Render as bar heights

output_per_bucket = []
bucket_width = total_duration / num_buckets

for event in events where event.type == "output":
    bucket_index = floor(event.time / bucket_width)
    output_per_bucket[bucket_index] += len(event.data)

max_output = max(output_per_bucket)
normalized = [v / max_output for v in output_per_bucket]
```

**What the waveform tells you at a glance:**
- Tall spike = lots of output (command ran, logs dumped, error printed)
- Flat area = thinking/typing (user is figuring something out)
- Burst patterns = iterating (try → fail → try → fail → succeed)

Users learn to "read" sessions without watching them — jump to the interesting spikes.

### Search Inside Terminal Output

```
User types: "CrashLoopBackOff" in search bar

Search engine:

1. Iterate through all output events
2. Maintain a running text buffer (stripped of ANSI codes)
3. Find all occurrences of search term
4. Map each occurrence back to its timestamp
5. Highlight on timeline + show result list

Results:
  • 0:45 — "worker  0/1  CrashLoopBackOff  5  12m"   [Jump ►]
  • 1:12 — "Status: CrashLoopBackOff"                 [Jump ►]
  • 2:30 — "# CrashLoopBackOff was caused by OOM"     [Jump ►]
```

**Implementation:** Pre-index all text content at load time. Build a simple inverted index mapping words/phrases to timestamps. Search is then instant.

---

## Component 4: AI Analysis Pipeline

### Pipeline Architecture

```
.replay file uploaded
        │
        v
┌───────────────────────────────────┐
│  Stage 1: Preprocessing            │
│                                    │
│  • Parse .replay file              │
│  • Strip ANSI codes from output    │
│  • Extract clean text transcript   │
│  • Identify commands (lines        │
│    starting with $ or prompt)      │
│  • Identify errors (stderr         │
│    patterns, exit codes, stack     │
│    traces, common error formats)   │
│  • Identify phases:                │
│    exploration → diagnosis → fix   │
│    → verification                  │
│  • Trim to essential content       │
│    (skip idle time, long outputs   │
│    summarized to first/last N      │
│    lines)                          │
│                                    │
│  Output: condensed transcript      │
│  (~2-5 KB from 100KB+ raw)        │
└───────────────┬───────────────────┘
                │
                v
┌───────────────────────────────────┐
│  Stage 2: LLM Analysis             │
│                                    │
│  Input: condensed transcript       │
│                                    │
│  Prompt:                           │
│  "Analyze this terminal session.   │
│   Extract:                         │
│   1. Problem: What went wrong?     │
│   2. Root cause: Why?              │
│   3. Fix: What was done?           │
│   4. Key moments: List timestamps  │
│      where important things        │
│      happened (error found, root   │
│      cause identified, fix         │
│      applied, verification).       │
│   5. Commands: List significant    │
│      commands used.                │
│   6. Files: List files viewed/     │
│      edited.                       │
│   7. Tags: Categorize (e.g.,      │
│      kubernetes, debugging,        │
│      deployment).                  │
│   8. Title: Short descriptive      │
│      title for this session.       │
│                                    │
│   Return as structured JSON."      │
│                                    │
│  Output: structured analysis JSON  │
└───────────────┬───────────────────┘
                │
                v
┌───────────────────────────────────┐
│  Stage 3: Key Moment Detection      │
│                                    │
│  • LLM identifies conceptual      │
│    moments ("error found")         │
│  • Map to exact timestamps by      │
│    searching transcript for the    │
│    referenced output               │
│  • Validate timestamps exist in    │
│    the actual recording            │
│  • Place markers on timeline       │
└───────────────┬───────────────────┘
                │
                v
┌───────────────────────────────────┐
│  Stage 4: Embedding & Indexing      │
│                                    │
│  • Embed problem description       │
│  • Embed error messages            │
│  • Embed root cause                │
│  • Store vectors in pgvector       │
│  • Index title, tags, commands     │
│    in full-text search             │
│                                    │
│  Enables: "I have error X" →       │
│  "Here's a session where someone   │
│   solved that exact error"         │
└───────────────────────────────────┘
```

### LLM Provider Strategy

```
Priority order:
1. Local: Ollama (llama3, codellama) — free, private, no API dependency
2. Fast API: Groq (llama3-70b) — fast, cheap, good for extraction
3. Best quality: Claude API — best structured output, most expensive

User configures in ~/.replay/config.toml:

[ai]
provider = "ollama"           # or "groq" or "claude" or "none"
model = "llama3:8b"
auto_analyze = true           # analyze every recording automatically
```

**Privacy-first:** By default, AI runs locally via Ollama. Terminal output may contain secrets (API keys, passwords, internal URLs). Never send to external APIs without explicit user consent.

---

## Component 5: Backend API & Sharing

### API Routes

```
POST   /api/upload              Upload .replay file → returns share link
GET    /api/sessions/:id        Get session metadata + AI summary
GET    /api/sessions/:id/stream Stream .replay events (for player)
GET    /api/sessions/:id/embed  Embed-friendly player page
GET    /api/search              Search sessions by text, error, tags
DELETE /api/sessions/:id        Delete a session

GET    /api/users/:id           User profile + their sessions
POST   /api/auth/register       Create account
POST   /api/auth/login          Login → JWT

GET    /s/:shortcode            Short URL redirect to player
```

### Upload Flow

```
CLI                           Backend                    Storage
 │                               │                          │
 │── POST /api/upload ──────────►│                          │
 │   (multipart: .replay.zst)   │                          │
 │                               │── Store blob ───────────►│
 │                               │   (S3: /sessions/{id})  │
 │                               │                          │
 │                               │── Parse header ──────────│
 │                               │   Extract metadata       │
 │                               │                          │
 │                               │── Queue AI analysis ─────│
 │                               │   (async, background)    │
 │                               │                          │
 │                               │── Insert into Postgres ──│
 │                               │   (metadata, share link) │
 │                               │                          │
 │◄── 201 Created ──────────────│                          │
 │    {url: "replay.sh/s/abc",  │                          │
 │     id: "uuid",              │                          │
 │     status: "processing"}    │                          │
 │                               │                          │
 │   (AI analysis completes     │                          │
 │    in background, ~10-30s)   │                          │
```

### Privacy & Access Control

```
Session visibility levels:

  "private"   — only the creator can view (default)
  "unlisted"  — anyone with the link can view (like YouTube unlisted)
  "public"    — appears in search results, discoverable

Input recording:

  --no-input flag: don't record keystrokes (only output)
  Useful when typing passwords or secrets
  Player shows output only, no input replay

Scrubbing:

  replay scrub <file> --pattern "API_KEY=.*"
  Post-recording: redact sensitive patterns from output
  Replaces matched content with [REDACTED]
```

---

## Data Model

```sql
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    TEXT UNIQUE NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    shortcode       TEXT UNIQUE NOT NULL,        -- for short URLs
    title           TEXT,                         -- AI-generated or user-set
    visibility      TEXT DEFAULT 'unlisted',      -- private/unlisted/public
    duration_ms     INTEGER NOT NULL,
    terminal_width  INTEGER NOT NULL,
    terminal_height INTEGER NOT NULL,
    shell           TEXT,
    file_size_bytes BIGINT,
    storage_path    TEXT NOT NULL,                -- S3 key
    input_recorded  BOOLEAN DEFAULT TRUE,
    
    -- AI analysis (populated async)
    ai_status       TEXT DEFAULT 'pending',       -- pending/processing/done/failed
    ai_summary      JSONB,                        -- {problem, root_cause, fix, ...}
    ai_key_moments  JSONB,                        -- [{time, label, description}]
    ai_tags         TEXT[],
    ai_commands     TEXT[],
    ai_files        TEXT[],
    
    -- Search
    text_content    TEXT,                          -- stripped ANSI, for full-text search
    embedding       vector(1536),                 -- for semantic search
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    view_count      INTEGER DEFAULT 0
);

CREATE INDEX idx_sessions_shortcode ON sessions(shortcode);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_tags ON sessions USING GIN(ai_tags);
CREATE INDEX idx_sessions_text ON sessions USING GIN(to_tsvector('english', text_content));
CREATE INDEX idx_sessions_embedding ON sessions USING ivfflat(embedding vector_cosine_ops);
```

---

## CLI Interface

### Command Reference

```
replay record [options]
    Record a terminal session.
    
    Options:
      -o, --output <file>     Output file (default: auto-named)
      --title <title>         Session title
      --no-input              Don't record input keystrokes
      --no-upload             Don't upload after recording
      --checkpoint <secs>     Checkpoint interval (default: 30)
      --max-duration <mins>   Auto-stop after N minutes
    
    During recording:
      Ctrl+D or 'exit'        Stop recording
      Ctrl+\                  Place a marker (key moment)

replay play <file>
    Play a recording in the terminal (local, no server needed).
    
    Options:
      --speed <multiplier>    Playback speed (default: 1)
      --skip-idle <secs>      Skip pauses longer than N seconds

replay upload <file>
    Upload a recording to the server.
    
    Options:
      --visibility <level>    private/unlisted/public (default: unlisted)
      --title <title>         Override title

replay list
    List your uploaded sessions.

replay search <query>
    Search public sessions by error, topic, or command.

replay scrub <file> --pattern <regex>
    Redact sensitive content from a recording.

replay auth login
    Authenticate with replay server.

replay config
    Edit configuration (~/.replay/config.toml).
```

### Configuration File

```toml
# ~/.replay/config.toml

[recording]
checkpoint_interval = 30        # seconds between checkpoints
record_input = true             # record keystrokes
max_duration = 60               # minutes, 0 = unlimited
auto_upload = true              # upload after recording
default_visibility = "unlisted"

[ai]
provider = "ollama"             # ollama | groq | claude | none
model = "llama3:8b"
auto_analyze = true             # analyze every recording
api_key = ""                    # for groq/claude

[server]
url = "https://replay.sh"      # or self-hosted URL
```

---

## Differentiation vs Asciinema

| Feature | Asciinema | Replay |
|---------|-----------|--------|
| Recording | Good | Same quality |
| File format | .cast (events) | .replay (events + checkpoints + markers) |
| Seeking | Must replay from start (slow) | Instant seek via checkpoints |
| Search inside content | No | Yes (full-text search in terminal output) |
| Activity waveform | No | Yes (visual session fingerprint) |
| AI summary | No | Auto-generated problem/fix/key moments |
| Key moment markers | No | User-placed + AI-detected |
| Embed support | Basic iframe | Responsive embed with controls |
| Self-hosting | Docker available | Docker Compose, one-command setup |
| Input recording control | All or nothing | Granular (--no-input, scrub patterns) |
| Secret redaction | No | Post-recording scrub tool |
| Semantic search | No | "Find sessions about this error" |
| Player UX | Functional but dated | Modern dark-mode player with waveform |
| Speed control | Basic | 0.5x / 1x / 2x / 4x / 8x + skip idle |

---

## Directory Structure

```
replay/
├── ARCHITECTURE.md              # This file
├── cmd/
│   ├── replay/                  # CLI binary
│   │   └── main.go
│   └── replay-server/           # Backend API binary
│       └── main.go
├── internal/
│   ├── recorder/
│   │   ├── recorder.go          # PTY-based session recording
│   │   ├── pty.go               # PTY spawning and management
│   │   ├── checkpoint.go        # Periodic terminal state snapshots
│   │   ├── marker.go            # User-placed key moment markers
│   │   └── scrub.go             # Post-recording sensitive data redaction
│   ├── format/
│   │   ├── replay.go            # .replay file format reader/writer
│   │   ├── header.go            # File header parsing
│   │   ├── event.go             # Event types and serialization
│   │   └── compat.go            # Asciinema .cast import support
│   ├── player/
│   │   ├── player.go            # Terminal-based local player
│   │   ├── vt100.go             # VT100 state machine (for terminal player)
│   │   └── speed.go             # Playback speed and idle skip logic
│   ├── ai/
│   │   ├── analyzer.go          # Orchestrates AI analysis pipeline
│   │   ├── preprocess.go        # Transcript extraction and condensing
│   │   ├── provider.go          # LLM provider interface
│   │   ├── ollama.go            # Ollama (local) provider
│   │   ├── groq.go              # Groq API provider
│   │   ├── claude.go            # Claude API provider
│   │   ├── moments.go           # Key moment detection and timestamp mapping
│   │   └── embedder.go          # Vector embedding generation
│   ├── server/
│   │   ├── server.go            # HTTP server setup and routing
│   │   ├── handlers.go          # API route handlers
│   │   ├── upload.go            # Upload processing pipeline
│   │   ├── stream.go            # Event streaming for web player
│   │   └── search.go            # Full-text + semantic search
│   ├── store/
│   │   ├── postgres.go          # PostgreSQL queries
│   │   ├── s3.go                # S3/R2 object storage
│   │   └── migrations/
│   │       └── 001_initial.sql
│   └── config/
│       └── config.go            # Configuration file parsing
├── web/
│   ├── app/                     # Next.js frontend
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Landing page
│   │   ├── s/[shortcode]/
│   │   │   └── page.tsx         # Player page
│   │   ├── search/
│   │   │   └── page.tsx         # Search page
│   │   └── dashboard/
│   │       └── page.tsx         # User's sessions list
│   ├── components/
│   │   ├── Player.tsx           # Main player component
│   │   ├── Terminal.tsx         # xterm.js wrapper (or custom VT100)
│   │   ├── Timeline.tsx         # Scrubber with markers
│   │   ├── Waveform.tsx         # Activity waveform visualization
│   │   ├── Search.tsx           # Search bar with results
│   │   ├── AISummary.tsx        # AI summary panel
│   │   └── EmbedPlayer.tsx      # Lightweight embeddable player
│   └── lib/
│       ├── replay-parser.ts     # Parse .replay format in browser
│       ├── vt100.ts             # VT100 emulator (if not using xterm.js)
│       └── waveform.ts          # Activity waveform computation
├── deploy/
│   ├── Dockerfile.server
│   ├── Dockerfile.web
│   ├── docker-compose.yml       # One-command self-hosting
│   └── nginx.conf
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

---

## Build Phases

**Build order: Frontend-first.** We build the web player before the Go recorder to get instant visual feedback, validate the `.replay` file format early, and catch UX issues before committing to a backend schema.

### Phase 1: Web Player + File Format + Core Recorder (Week 1) — COMPLETED
- [x] Go format package: event types, header, JSON Lines writer/reader, round-trip test
- [x] Go recorder: PTY proxy, raw mode, dual goroutine I/O, signal-safe teardown
- [x] Go CLI: `replay record`, `replay play <file>` with speed control (1x-8x)
- [x] TypeScript replay parser (port of Go format package)
- [x] xterm.js Terminal component with forwardRef imperative API
- [x] rAF wall-clock anchored playback engine (no timer drift)
- [x] Play/pause, speed control (1x/2x/4x/8x) with mid-playback re-anchoring
- [x] Seek via replay-from-zero (reset terminal, replay events to target time)
- [x] Activity waveform visualization (output density per time bucket, 95th percentile normalization)
- [x] Search inside terminal output (ANSI stripping, text index with timestamp mapping)
- [x] Dark-mode polished UI (header bar, bordered terminal, controls, search)

**What's NOT done from original Phase 1 plan:**
- Checkpoint-based seeking (seek works via replay-from-zero, checkpoints needed for long sessions — see TODO in Checkpoint System section)
- User markers during recording (Ctrl+\ to place bookmarks)
- Embed mode for iframes

### Phase 2: DLP Engine + Checkpoints + Recorder Hardening (Week 2) — NEXT
- [ ] Inline DLP scrubbing middleware in recorder (trie + regex for `AKIA`, `eyJ`, `PASSWORD=`, etc.)
- [ ] Terminal state checkpoints every 30 seconds (requires Go VT100 state machine)
- [ ] Checkpoint-based seeking in web player (find nearest checkpoint, replay delta)
- [ ] User markers via Ctrl+\ during recording
- [ ] SIGWINCH handler for terminal resize propagation during recording
- [ ] `--no-input` flag to skip recording keystrokes
- [ ] `replay scrub <file> --pattern <regex>` post-recording redaction
- [ ] Integration test: record a session, play it back in both terminal and web player

### Phase 3: Backend API + Process Telemetry + Sharing (Week 3)
- [ ] Go backend API (upload, metadata, streaming)
- [ ] PostgreSQL for session metadata, S3/R2 for blob storage
- [ ] Process tree contextualization: CWD, PID, memory/CPU snapshots as `p`-type events (via `gopsutil`)
- [ ] Web player sidebar displaying synced OS telemetry
- [ ] Short URL generation (replay.sh/s/abc123) — anonymous upload, unguessable URL, no auth required
- [ ] Privacy controls (private/unlisted/public)
- [ ] Embed mode for iframes
- [ ] CLI upload: `replay upload <file>`
- [ ] User auth (JWT) — layered on top of anonymous sharing for dashboard + private recordings
- [ ] Docker Compose for self-hosting

### Phase 4: AI Pipeline + Session Forking + Polish (Week 4)
- [ ] Transcript preprocessing (ANSI strip, command extraction, condensing)
- [ ] LLM analysis pipeline (problem/root cause/fix extraction)
- [ ] Key moment detection with timestamp mapping
- [ ] AI summary display in web player
- [ ] Vector embedding + semantic search (pgvector)
- [ ] Session forking: generate reproducible bash scripts / Dockerfiles from recorded state
- [ ] Asciinema `.cast` import
- [ ] Skip-idle mode in player
- [ ] CLI polish + comprehensive help text
- [ ] Landing page (embedded live replay demo, install command, feature comparison with asciinema)

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Recording overhead (CPU) | < 1% (just copying bytes + timestamps) |
| Recording overhead (memory) | < 10 MB (event buffer + checkpoint state) |
| File size per hour | < 500 KB compressed (typical terminal session) |
| Player load time | < 1 second (stream first events immediately) |
| Seek to any timestamp | < 100ms (checkpoint + replay delta events) |
| Search within session | < 50ms (pre-indexed at load time) |
| Upload + share link | < 3 seconds (for typical 5-min session) |
| AI analysis completion | < 30 seconds (Ollama local), < 10s (Groq API) |
| Concurrent sessions served | 1000+ (mostly static file serving) |

---

## What This Proves on Your Resume

| Component | Senior Skill Demonstrated |
|-----------|--------------------------|
| PTY management | OS-level systems programming, file descriptors, process control, signal handling |
| Custom file format | Binary format design, streaming, backward compatibility thinking |
| Checkpoint system | State snapshotting for O(1) seeking — same concept used in databases (WAL + checkpoints) |
| VT100 emulator | Protocol parsing, state machines, ANSI escape code handling |
| Activity waveform | Signal processing, data visualization from raw byte streams |
| AI extraction pipeline | LLM integration done right: preprocessing, structured output, provider abstraction, privacy-first |
| Semantic search | Vector embeddings, pgvector, hybrid search (full-text + semantic) |
| Secret scrubbing | Security awareness, regex-based stream processing |
| Self-hostable Docker setup | DevOps, infrastructure-as-code thinking |
| Asciinema compatibility | Ecosystem awareness, migration path design |
