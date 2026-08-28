# Replay — Architecture & Production Readiness Guide

> **Vision:** Replay is an open-source, developer-first terminal session recorder and player (like Loom, but for the terminal). It captures interactive terminal sessions as structured, scrubbable event streams, replays them in a web player with xterm.js, and leverages AI for post-session summaries and reproducible blueprints.

---

## 1. System Overview

Replay bridges the gap between text logs and video screen shares. Instead of copying walls of unformatted terminal text into Slack or recording heavy video files, developers run `replay record`. Replay streams microsecond-timestamped terminal events into a `.replay` file, which is uploaded and played back with O(1) seeking, text search, waveform visualization, and synced OS-level telemetry.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       REPLAY SYSTEM                                         │
│                                                                                             │
│  ┌─────────────────────────┐   ┌─────────────────────────┐   ┌───────────────────────────┐  │
│  │       CLI Recorder       │   │       Web Player        │   │        AI Pipeline        │  │
│  │   (cmd/replay, Go)      │   │     (web/, Next.js)     │   │     (internal/ai, Go)     │  │
│  │                         │   │                         │   │                           │  │
│  │ • PTY Spawn & Forwarding│   │ • xterm.js Rendering    │   │ • AI Session Summaries    │  │
│  │ • Microsecond Timestamps│   │ • macOS Window Frame    │   │ • Command Extraction      │  │
│  │ • DLP Secret Scrubbing  │   │ • Waveform Density      │   │ • AI Copilot Web Drawer   │  │
│  │ • Interactive Forking   │   │ • OS Telemetry Badge    │   │ • Vector Search Ready     │  │
│  └────────────┬────────────┘   └────────────┬────────────┘   └─────────────┬─────────────┘  │
│               │                             │                              │                │
│               └─────────────────────────────┼──────────────────────────────┘                │
│                                             │                                               │
│                                  ┌──────────v───────────┐                                   │
│                                  │     Backend API      │                                   │
│                                  │ (cmd/server, Go)     │                                   │
│                                  │                      │                                   │
│                                  │ • JWT & Device Auth  │                                   │
│                                  │ • Zstd Streaming     │                                   │
│                                  │ • Storage Interfaces │                                   │
│                                  └──────────┬───────────┘                                   │
│                                             │                                               │
│                         ┌───────────────────┴───────────────────┐                           │
│                         │                                       │                           │
│                 ┌───────v───────┐                       ┌───────v───────┐                   │
│                 │   Databases   │                       │ Blob Storage  │                   │
│                 │ Postgres/pgvec│                       │   Local / S3  │                   │
│                 └───────────────┘                       └───────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Current Implementation Status

### 2.1. CLI Recorder & Client (`cmd/replay`, `internal/recorder`)
- **PTY Proxying:** Spawns a child shell (`/bin/bash` or `$SHELL`) attached to a master PTY using `github.com/creack/pty` and puts user terminal in raw mode.
- **DLP Redaction:** Real-time scrubbing of AWS keys, JWT tokens, and database passwords at the source (`internal/recorder/scrub.go`).
- **OS Telemetry:** Emits periodic `"p"` events containing working directory (`cwd`), process ID (`pid`), CPU, and memory usage (`internal/recorder/telemetry.go`).
- **Checkpoints:** Generates $O(1)$ terminal state snapshots (`"c"` events) for instant web playback seeking (`internal/recorder/checkpoint.go`).
- **Session Forking Engine:** `replay fork <file> [time]` command extracts shell context and launches an interactive subshell at timestamp $T$ (`internal/recorder/fork.go`).

### 2.2. Event Stream File Format & Compression (`internal/format`)
- **Zstd Streaming:** High-performance Zstd compression for compressed `.replay` stream storage.
- **JSON Lines Format:** Line 1 (Header) + Lines 2+ (Events `"o"`, `"i"`, `"r"`, `"c"`, `"m"`, `"p"`).

### 2.3. Backend API & Storage Engine (`cmd/server`, `internal/server`)
- **Pluggable Storage Backends:**
  - `SQLiteStore` / `PostgresStore` (PostgreSQL + `pgvector` extension for metadata & AI vector search).
  - `LocalBlobStore` / `S3BlobStore` (S3/Cloudflare R2 cloud blob storage adapter).
- **Authentication & Security:** JWT authentication, Bcrypt password hashing, and OAuth 2.0 CLI Device Authorization Flow.

### 2.4. Web Player & AI Copilot (`web/`)
- **macOS Window Frame & Telemetry:** Clean top header with traffic light controls, title badge, and live OS telemetry overlay pill.
- **Playback Engine & Waveform:** Audio-style activity bars with hover timestamp tooltips, hotkey controls (`Space`, `←`/`→`, `F`), and speed selectors (`0.5x`–`8x`).
- **AI Copilot Drawer:** Interactive **"AI Copilot"** tab in the player drawer for asking questions about the recorded terminal session (`web/src/components/AICopilot.tsx`).

---

## 3. Implementation Matrix

| Component | Status | Implementation Details |
|---|---|---|
| 1. DLP / Secret Scrub | ✅ Completed | Real-time Regex & Aho-Corasick scrubbing (`internal/recorder/scrub.go`) |
| 2. Seek Checkpoints | ✅ Completed | $O(1)$ state snapshots (`internal/recorder/checkpoint.go`) |
| 3. OS Telemetry | ✅ Completed | Synced CWD, PID, RAM, CPU (`internal/recorder/telemetry.go`) |
| 4. AI Analysis Pipeline | ✅ Completed | Session summarizer & command extractor (`internal/ai/summarizer.go`) |
| 5. Interactive Forking | ✅ Completed | `replay fork <file> [time]` command (`internal/recorder/fork.go`) |
| 6. Cloud Storage & PG | ✅ Completed | PostgreSQL (`pgvector`) & S3 storage adapters (`internal/server/`) |
| 7. Streaming Compression | ✅ Completed | Zstd stream compression (`internal/format/compress.go`) |
| 8. Web Player UI & Copilot | ✅ Completed | macOS frame, hotkeys, AI Copilot drawer (`web/src/components/`) |

---

*This document represents the definitive architecture and current status for Replay.*
