# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Replay is an open-source terminal session recorder and player (like Loom, but for the terminal). It captures terminal sessions as structured event streams with checkpoints, replays them in a web player with scrubbing, and generates AI summaries. Written in Go (backend/CLI) with a Next.js frontend.

Replay is not a passive playback tool — it is an **active execution blueprint**. Beyond recording and replaying, it provides inline secret redaction (DLP), process-level OS telemetry synced to the timeline, and session forking (generating reproducible scripts/Dockerfiles from recorded state).

## Build & Run Commands

```bash
# Frontend (web/) — start here, we build frontend-first
cd web && npm install && npm run dev

# Build CLI binary
go build -o bin/replay ./cmd/replay

# Build server binary
go build -o bin/replay-server ./cmd/replay-server

# Run all Go tests
go test ./...

# Run a single package's tests
go test ./internal/recorder/

# Run a specific test
go test ./internal/recorder/ -run TestCheckpoint

# Lint
golangci-lint run

# Docker (self-hosting)
docker-compose -f deploy/docker-compose.yml up
```

## Architecture

The system has five core components plus three enterprise pillars:

### Core Components

1. **CLI Recorder** (`cmd/replay/`, `internal/recorder/`) — Uses PTY proxying to transparently capture terminal I/O with microsecond timestamps. Generates periodic checkpoints (terminal state snapshots every 30s) for instant seeking. Supports user-placed markers via Ctrl+\. Includes inline DLP scrubbing middleware in the event writer pipeline.

2. **Replay File Format** (`internal/format/`) — JSON Lines format: a JSON header line followed by event lines `[timestamp, type, data]`. Event types: `o` (output), `i` (input), `r` (resize), `c` (checkpoint), `m` (marker), `e` (environment), `g` (git status), `n` (note), `p` (process snapshot). Files are zstd-compressed by default.

3. **Web Player** (`web/`) — Next.js app using xterm.js for terminal rendering. Features: timeline scrubber, activity waveform (output density visualization), in-session text search, speed control (0.5x-8x), embed mode, process telemetry sidebar, and session forking. Checkpoints enable O(1) seeking.

4. **AI Pipeline** (`internal/ai/`) — Multi-stage: preprocess (strip ANSI, extract commands/errors, condense transcript) → LLM analysis (extract problem/root cause/fix/key moments) → embedding generation for semantic search. Provider abstraction supports Ollama (local, default), Groq, and Claude API. Privacy-first: local AI by default.

5. **Backend API** (`cmd/replay-server/`, `internal/server/`, `internal/store/`) — Go HTTP server with PostgreSQL (+pgvector), S3/R2 blob storage, and Redis caching. Handles upload, streaming, sharing (short URLs), search (full-text + semantic), auth (JWT), and session fork generation.

### Enterprise Pillars (Triaged for Realistic Execution)

1. **DLP Scrubbing Engine** (`internal/recorder/scrub.go`) — Inline middleware in the event writer pipeline that scrubs secrets before they hit disk. Uses trie-matching and compiled regex arrays to detect patterns (AWS keys `AKIA...`, JWTs `eyJ...`, `PASSWORD=`, etc.). Built into the recorder from Day 1 — not bolted on after. Low-allocation, streaming design targeting <5ms latency per event.

2. **Process Tree Contextualization** (`internal/recorder/telemetry.go`) — Captures OS-level metadata (CWD changes, shell PID, memory/CPU via `gopsutil`) as `p`-type events synced to the recording timeline. The web player renders this as a sidebar showing real-time system stats alongside terminal output.

3. **Session Forking** (`internal/server/fork.go`, `web/components/ForkSession.tsx`) — Parses recorded command history, environment variables, and OS metadata to generate a reproducible bash script or Dockerfile. Users click "Fork Session" in the player to get an instant reproduction blueprint. No MicroVM infra needed — clean backend logic.

## Key Design Decisions

- **Frontend-first build order**: We build the web player first with hardcoded data to validate the file format and UX before writing the Go recorder. This gives instant visual feedback and catches schema issues early.
- **Checkpoints over replay-from-start**: Periodic terminal state snapshots allow seeking to any point in <100ms, unlike asciinema which must replay all events from the beginning.
- **DLP from Day 1**: Secret scrubbing is built into the recorder middleware pipeline, not as a post-processing step. Secrets never touch disk.
- **Privacy-first AI**: Default LLM provider is Ollama (local). External APIs require explicit user opt-in since terminal output may contain secrets.
- **JSON Lines format**: Human-readable, streamable, debuggable with `jq`, and gzipped JSON is nearly as compact as custom binary.
- **Config location**: `~/.replay/config.toml`

## Project Layout

- `cmd/replay/` — CLI entry point
- `cmd/replay-server/` — Backend API entry point
- `internal/recorder/` — PTY capture, checkpoints, markers, DLP scrubbing, OS telemetry
- `internal/format/` — `.replay` file format reader/writer, asciinema import
- `internal/player/` — Terminal-based local player with VT100 emulation
- `internal/ai/` — LLM analysis pipeline with provider abstraction
- `internal/server/` — HTTP handlers, upload, streaming, search, session fork generation
- `internal/store/` — PostgreSQL and S3 data access
- `internal/config/` — Config file parsing
- `web/` — Next.js frontend (player, dashboard, search, fork UI)
- `deploy/` — Docker Compose, Dockerfiles, nginx config

## Build Phases (1 Week Each)

### Phase 1: Web Player + File Format (Week 1)
- Next.js app with xterm.js-based terminal player
- `.replay` file parser in TypeScript
- Playback engine: play, pause, speed control (0.5x-8x)
- Checkpoint-based seeking (instant jump to any timestamp)
- Interactive timeline scrubber with marker display
- Activity waveform visualization
- Search inside terminal output
- Responsive dark-mode design
- Hardcoded sample `.replay` data for development

### Phase 2: Go CLI Recorder + DLP Engine (Week 2)
- PTY spawning and bidirectional I/O forwarding
- Event recording to `.replay` file format
- Terminal state checkpoints every 30 seconds
- User markers via Ctrl+\ during recording
- Inline DLP scrubbing middleware (trie + regex pattern matching for secrets)
- Local terminal player with speed control
- Basic CLI: `replay record`, `replay play <file>`
- Integration test: record a session, play it back in both terminal and web player

### Phase 3: Backend API + Process Telemetry + Sharing (Week 3)
- Go backend API (upload, metadata, streaming)
- PostgreSQL for session metadata, S3/R2 for blob storage
- Process tree contextualization: CWD, PID, memory/CPU snapshots as `p`-type events via `gopsutil`
- Web player sidebar displaying synced OS telemetry
- Short URL generation and privacy controls (private/unlisted/public)
- Embed mode for iframes
- CLI upload: `replay upload <file>`
- User auth (JWT) and Docker Compose for self-hosting

### Phase 4: AI Pipeline + Session Forking + Polish (Week 4)
- Transcript preprocessing (ANSI strip, command extraction, condensing)
- LLM analysis pipeline (problem/root cause/fix extraction)
- Key moment detection with timestamp mapping
- AI summary display in web player
- Vector embedding + semantic search (pgvector)
- Session forking: generate reproducible bash scripts / Dockerfiles from recorded state
- Asciinema `.cast` import
- Skip-idle mode in player
- CLI polish and comprehensive help text
