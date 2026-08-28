# Replay — Architecture & Production Readiness Guide

> **Vision:** Replay is an open-source, developer-first terminal session recorder and player (like Loom, but for the terminal). It captures interactive terminal sessions as structured, scrubbable event streams, replays them in a web player with xterm.js, and leverages AI for post-session summaries and reproducible blueprints.

---

## 1. System Overview

Replay bridges the gap between text logs and video screen shares. Instead of copying walls of unformatted terminal text into Slack or recording heavy video files, developers run `replay record`. Replay streams microsecond-timestamped terminal events into a `.replay` file, which is uploaded and played back with $O(1)$ seeking, text search, waveform visualization, and synced OS-level telemetry.

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

## 2. What We Have Built (Completed Features)

### Phase 1: Engine Hardening & Telemetry
- **Inline Data Loss Prevention (DLP) Scrubbing (`internal/recorder/scrub.go`):** Real-time interception and redaction of sensitive credentials (AWS keys, JWT tokens, DB passwords) before writing to stream.
- **$O(1)$ Terminal Checkpoint Snapshots (`internal/recorder/checkpoint.go`):** Generates screen buffer snapshots (`"c"` events) every 30s for sub-100ms instant seek in the web player.
- **OS Process Telemetry (`internal/recorder/telemetry.go`):** Polls system metrics (`"p"` events) capturing active working directory (`cwd`), PID, CPU %, and memory usage.

### Phase 2: Cloud Storage & Database Layer
- **PostgreSQL + `pgvector` Integration (`internal/server/postgres.go`):** Production database layer supporting full metadata persistence and vector embedding storage for semantic search.
- **S3 / Cloudflare R2 Blob Storage (`internal/server/s3blob.go`):** AWS S3 blob adapter with local filesystem fallback for scalable recording storage.
- **Zstd Streaming Compression (`internal/format/compress.go`):** High-performance Zstd compression reducing `.replay` stream file sizes by 80–90%.
- **Docker Compose Stack (`docker-compose.yml`):** Complete one-command container stack (`server`, `web`, `postgres`, `minio`).

### Phase 3: AI Intelligence Pipeline & Interactive Session Forking
- **AI Session Summarizer (`internal/ai/summarizer.go`):** Automated analysis engine extracting executed shell commands, detecting error log occurrences, and building executive summaries.
- **CLI Interactive Session Forking (`internal/recorder/fork.go`):** `replay fork <file> [time]` command reads replay checkpoint state and launches an interactive subshell directly in the session's recorded working directory context.
- **Web AI Copilot & Apple-Grade UI (`web/src/components/AICopilot.tsx`, `Player.tsx`):** macOS-style window titlebar with traffic light buttons, live OS telemetry overlay pill, activity waveform with timestamp hover tooltips, keyboard hotkeys (`Space`, `←`/`→`, `F`), and an interactive AI Copilot tab in the player drawer.

---

## 3. Implementation Matrix

| Pillar | Status | Implementation Details |
|---|---|---|
| 1. DLP / Secret Scrub | ✅ Completed | Real-time Regex & Aho-Corasick scrubbing (`internal/recorder/scrub.go`) |
| 2. Seek Checkpoints | ✅ Completed | $O(1)$ state snapshots (`internal/recorder/checkpoint.go`) |
| 3. OS Telemetry | ✅ Completed | Synced CWD, PID, RAM, CPU (`internal/recorder/telemetry.go`) |
| 4. AI Analysis Pipeline | ✅ Completed | Session summarizer & command extractor (`internal/ai/summarizer.go`) |
| 5. Interactive Forking | ✅ Completed | `replay fork <file> [time]` command (`internal/recorder/fork.go`) |
| 6. Cloud Storage & PG | ✅ Completed | PostgreSQL (`pgvector`) & S3 storage adapters (`internal/server/`) |
| 7. Streaming Compression | ✅ Completed | Zstd stream compression (`internal/format/compress.go`) |
| 8. Web Player & Copilot | ✅ Completed | macOS frame, hotkeys, AI Copilot drawer (`web/src/components/`) |

---

## 4. What We Are Going To Do Next (Phase 4: Web Polish & DevOps)

Below is the planned roadmap for **Phase 4**:

1. **Skip-Idle Playback Mode (`web/src/hooks/usePlayer.tsx`):**
   - Automatically fast-forward through long pauses or silent inactive periods (>3s) in terminal recordings for faster review.

2. **Embed Player Route (`/embed/[shortcode]`):**
   - Create a lightweight, iframe-embeddable player route without top navigation bars, optimized for embedding inside GitHub PR descriptions and documentation sites.

3. **Dynamic Terminal Window Resizing (`"r"` events):**
   - Smoothly update xterm.js grid dimensions dynamically whenever a terminal window resize event occurs mid-recording.

4. **CI/CD Pipeline & Multi-Architecture Binary Releases:**
   - GitHub Actions workflow (`.github/workflows/release.yml`) cross-compiling CLI binaries for `linux/amd64`, `linux/arm64`, `darwin/amd64`, `darwin/arm64`, and `windows/amd64`.

5. **Production Monitoring & Telemetry Integration:**
   - Structured JSON logging (`log/slog`) across API endpoints, HTTP panic recovery middleware, and Sentry error tracing.

---

*This document represents the updated architecture and status roadmap for Replay.*
