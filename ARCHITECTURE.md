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
│  │ • PTY Spawn & Forwarding│   │ • xterm.js Rendering    │   │ • Transcript Condensing   │  │
│  │ • Microsecond Timestamps│   │ • Waveform Density      │   │ • LLM Analysis (Ollama/   │  │
│  │ • Event Writer          │   │ • In-Terminal Search    │   │   Groq/Claude)            │  │
│  │ • Device Auth Client    │   │ • Device Auth Approval  │   │ • Vector Embeddings       │  │
│  └────────────┬────────────┘   └────────────┬────────────┘   └─────────────┬─────────────┘  │
│               │                             │                              │                │
│               └─────────────────────────────┼──────────────────────────────┘                │
│                                             │                                               │
│                                  ┌──────────v───────────┐                                   │
│                                  │     Backend API      │                                   │
│                                  │ (cmd/replay-server)  │                                   │
│                                  │                      │                                   │
│                                  │ • JWT & Device Auth  │                                   │
│                                  │ • Recording Metadata │                                   │
│                                  │ • Blob Storage       │                                   │
│                                  └──────────┬───────────┘                                   │
│                                             │                                               │
│                         ┌───────────────────┴───────────────────┐                           │
│                         │                                       │                           │
│                 ┌───────v───────┐                       ┌───────v───────┐                   │
│                 │   Databases   │                       │ Blob Storage  │                   │
│                 │ (SQLite / PG) │                       │ (Local / S3)  │                   │
│                 └───────────────┘                       └───────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Current Implementation Status (What is Built)

The project currently has a functional end-to-end prototype covering terminal recording, authentication, local storage, API routing, and web playback.

### 2.1. CLI Recorder & Client (`cmd/replay`, `internal/recorder`, `internal/client`)
- **PTY Proxying:** Spawns a child shell (`/bin/bash` or `$SHELL`) attached to a master PTY using `github.com/creack/pty` and puts user terminal in raw mode using `golang.org/x/term`.
- **Event Forwarding & Capture:** Dual goroutines capture stdin and PTY stdout/stderr, stream events with relative elapsed timestamps to `.replay` files, and forward bytes to user stdout smoothly.
- **CLI Commands:**
  - `replay help` — Interactive colored terminal help menu.
  - `replay version` — Reports CLI build version and backend target URL.
  - `replay login` — CLI Device Authorization Flow (OAuth 2.0 RFC 8628). Displays user code and polls backend until browser authorization completes. Stores session token locally in `~/.replay/session.json`.
  - `replay record [file]` — Starts PTY session, records events, and auto-uploads to server upon exit if authenticated.
  - `replay play <file> [speed]` — Offline terminal playback with configurable speed multiplier.
  - `replay upload <file>` — Uploads existing local `.replay` recording file to server.

### 2.2. Event Stream File Format (`internal/format`)
- **JSON Lines Format:**
  - **Line 1 (Header):** `{"version": 1, "width": 80, "height": 24, "timestamp": 1740000000, "duration": 45.2, "shell": "/bin/bash"}`
  - **Line 2+ (Events):** `[timestamp, "type", data]`
- **Event Types Supported in Code:**
  - `"o"` — Output payload string (terminal screen writes).
  - `"i"` — Input payload string (user keystrokes).
  - `"r"` — Terminal resize event `{"Width": 120, "Height": 40}`.
  - `"m"` — User marker event `{"Label": "Error spotted"}`.
- **Go Reader/Writer:** Full encoding, decoding, stream parsing, and error-handling utilities (`writer.go`, `reader.go`, `event.go`, `header.go`).

### 2.3. Backend API & Auth Engine (`cmd/server`, `internal/server`, `internal/server/auth`)
- **Go HTTP Router:** Built on standard library `http.NewServeMux()` with custom CORS middleware allowing cross-origin requests from the web frontend.
- **Authentication & Security (`internal/server/auth`):**
  - Full JWT-based auth pipeline (`jwt.go`, `middleware.go`).
  - Bcrypt password hashing (`password.go`).
  - In-memory & SQLite backed CLI Device Authorization Flow (`device.go`, `device_auth.go`, `/api/auth/device/init`, `/api/auth/device/poll`, `/api/auth/device/approve`).
  - User registration, login, logout, and identity inspection (`POST /api/auth/signup`, `/login`, `/logout`, `GET /api/auth/me`).
- **Persistence Layer:**
  - **Metadata Store (`sqlite.go`):** SQLite database (`sessions.db`) tracking recording ID, shortcode, title, user_id, duration, dimensions, shell, and timestamp.
  - **Blob Store (`localblob.go`):** Local filesystem storage saving `.replay` files inside `blobs/{shortcode}.replay`.
- **API Endpoints:**
  - `POST /api/upload` — Authenticated multipart/raw payload upload. Returns shortcode & URL.
  - `GET /api/recordings` — Lists user's recordings with concurrent blob preview fetching.
  - `GET /api/recordings/{shortcode}` — Raw `.replay` blob stream for playback.
  - `PUT /api/recordings/{id}` — Updates session title.

### 2.4. Web Player & Frontend (`web/`)
- **Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, `@xterm/xterm`.
- **Parser (`web/src/lib/replay-parser.ts`):** Parses raw `.replay` string (and Base64 payloads), computes activity waveforms, strips ANSI escape sequences, and builds searchable text index with line-to-timestamp mapping.
- **xterm.js Integration (`web/src/components/Terminal.tsx`):** Imperative ref interface wrapping xterm.js instance with `write()`, `reset()`, and `fit()` capabilities.
- **Playback Engine (`web/src/hooks/usePlayer.tsx`, `Player.tsx`):**
  - RequestAnimationFrame (rAF) wall-clock anchored loop.
  - Controls: Play, Pause, Restart, Seek, Speed selection (1x, 2x, 4x, 8x), Fullscreen.
  - Dynamic Activity Waveform (`Waveform.tsx`): Renders output density per bucket with 95th-percentile scaling.
  - In-Terminal Search (`Search.tsx`): Interactive search drawer finding text in terminal output with jump-to-timestamp links.
- **App Routes & Pages:**
  - `/` — Landing Page (Hero, Features, HowItWorks, CTA, Header, Footer).
  - `/signin`, `/signup` — Authentication interfaces.
  - `/auth/device/verify` — CLI device authorization code verification screen.
  - `/s/[shortcode]` — Shareable recording playback page.
  - Dashboard — User recording list with inline preview and management (`RecordingList.tsx`).

---

## 3. Production Gap Analysis (What is Missing & Unimplemented)

While the core pipeline is operational, critical enterprise pillars and infrastructure components are missing before this can be deployed to production.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  PRODUCTION GAP MATRIX                                      │
├──────────────────────────┬─────────────────────────────┬────────────────────────────────────┤
│ Component                │ Current Status              │ Required for Production            │
├──────────────────────────┼─────────────────────────────┼────────────────────────────────────┤
│ 1. DLP / Secret Scrub    │ ❌ Not Implemented          │ Inline stream redaction (AWS keys, │
│                          │                             │ JWTs, DB passwords) before storage │
├──────────────────────────┼─────────────────────────────┼────────────────────────────────────┤
│ 2. Seek Checkpoints      │ ❌ Not Implemented          │ Headless VT100 snapshots every 30s │
│                          │ (Replays from t=0 on seek)  │ for O(1) instant seeking in player │
├──────────────────────────┼─────────────────────────────┼────────────────────────────────────┤
│ 3. OS Telemetry          │ ❌ Not Implemented          │ Sync CWD, PID, CPU/Memory (`p`)    │
│                          │                             │ events to timeline & player drawer │
├──────────────────────────┼─────────────────────────────┼────────────────────────────────────┤
│ 4. AI Pipeline           │ ❌ Not Implemented          │ LLM summary (problem/cause/fix),   │
│                          │ (No `internal/ai` pkg)      │ key moments, pgvector embeddings   │
├──────────────────────────┼─────────────────────────────┼────────────────────────────────────┤
│ 5. Session Forking       │ ❌ Not Implemented          │ Generate executable Bash scripts / │
│                          │                             │ Dockerfiles from terminal state    │
├──────────────────────────┼─────────────────────────────┼────────────────────────────────────┤
│ 6. Storage & Database    │ ⚠️ Dev-Only (SQLite + Local) │ PostgreSQL (+pgvector) + AWS S3 /  │
│                          │                             │ Cloudflare R2 + Redis caching      │
├──────────────────────────┼─────────────────────────────┼────────────────────────────────────┤
│ 7. Streaming Compression │ ⚠️ Raw JSON Lines           │ Zstd/Gzip compression pipeline for │
│                          │                             │ 80-90% bandwidth reduction         │
├──────────────────────────┼─────────────────────────────┼────────────────────────────────────┤
│ 8. Enterprise Security   │ ⚠️ Basic CORS & Hardcoded   │ Dynamic CORS origin, rate limits,  │
│                          │    Upload Limits            │ CSRF tokens, TLS, Sentry tracking  │
└──────────────────────────┴─────────────────────────────┴────────────────────────────────────┘
```

---

## 4. Architectural Deep Dive: Required Production Pillars

### Pillar 1: Inline Data Loss Prevention (DLP) Scrubbing Engine
**Problem:** Users frequently record terminal sessions containing sensitive credentials (`AWS_SECRET_ACCESS_KEY`, JWT tokens, database connection strings, `.env` files). Saving these unredacted risks severe security leaks.

**Solution Architecture:**
- Implement an **inline scrubbing pipeline** in `internal/recorder/scrub.go` that intercepts PTY bytes before writing to disk/network.
- Combine a high-performance **Aho-Corasick trie** for static keywords (`password=`, `bearer `, `secret=`) with compiled **Regex Arrays** for standard token patterns (`AKIA[0-9A-Z]{16}`, `eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*`).
- Target performance: `< 5ms` processing latency per event, zero heap allocation per unflagged buffer.

```
PTY Output Stream ──► [ Trie Keyword Match ] ──► [ Regex Pattern Scrub ] ──► Scrubbed Event Writer ──► Disk/S3
                                                         │
                                               Matches: "AKIA..."
                                               Replaced with: "[REDACTED_AWS_KEY]"
```

---

### Pillar 2: O(1) Seeking via Terminal Checkpoints (`c` events)
**Problem:** Currently, when a user seeks to 08:30 in a 10-minute session, `usePlayer.tsx` resets xterm.js and replays every event from 00:00 to 08:30. For long sessions with high output density, this causes noticeable UI freeze.

**Solution Architecture:**
1. **Go Headless VT100 Emulator:** Embed a headless terminal state machine (using `github.com/danielgatis/go-vte` or equivalent) inside `internal/recorder/checkpoint.go`.
2. **Periodic State Snapshot:** Every 30 seconds, serialize the active screen buffer, cursor position, active ANSI attributes, scroll region, and terminal mode into a `"c"` event in the stream.
3. **Player Delta Replay:** On player seek to target time $T$, locate the latest checkpoint $C \le T$. Restore terminal state from $C$ instantly, then replay only delta events $(C \to T]$. Seeking time drops to `< 100ms`.

```json
[
  30.000,
  "c",
  {
    "cursor": {"row": 4, "col": 12},
    "buffer": [
      "$ kubectl get pods",
      "NAME                    READY   STATUS",
      "api-server-7db86        1/1     Running"
    ],
    "alternate_screen": false
  }
]
```

---

### Pillar 3: OS Process Telemetry (`p` events)
**Problem:** Terminal playback lacks system context. Developers watching a recording cannot tell which process consumed high memory, what background directory changed, or why a build timed out.

**Solution Architecture:**
- Implement `internal/recorder/telemetry.go` using `github.com/shirou/gopsutil/v3`.
- Poll child process tree of the PTY every 2 seconds.
- Record `"p"` events containing: active working directory (`cwd`), shell PID, process count, CPU percentage, and RSS memory consumption.
- Render a synchronized **System Telemetry Sidebar** in the Web Player displaying real-time CPU/RAM spikes aligned with command execution.

---

### Pillar 4: AI Analysis Pipeline & Vector Search (`internal/ai`)
**Problem:** Raw terminal recordings are long and hard to navigate for teammates.

**Solution Architecture:**
```
.replay Uploaded ──► [ Stage 1: Condenser ] ──► [ Stage 2: LLM Engine ] ──► [ Stage 3: Vector Embed ]
                          │                           │                          │
                    Strip ANSI codes,           Extract:                   Generate 1536d
                    extract commands &          • Problem                  pgvector embedding
                    error stacktraces           • Root Cause               for semantic search
                                                • Applied Fix
                                                • Key Moments
```

1. **Preprocessing (`internal/ai/preprocess.go`):** Strips ANSI escape codes, filters out repetitive spinner animations, identifies prompt boundaries, and extracts error output.
2. **LLM Extraction (`internal/ai/analyzer.go`):** Sends condensed transcript to LLM provider abstraction:
   - **Local Default:** Ollama (`llama3:8b`).
   - **Cloud Options:** Groq (`llama3-70b`) or Anthropic Claude API.
3. **Structured Output:** Generates JSON payload with session title, problem summary, root cause, verified fix, command list, modified files, and key moment timestamps.
4. **Semantic Search (`internal/ai/embedder.go`):** Embeds problem & error logs into PostgreSQL `vector(1536)` using `pgvector`. Enables natural language queries like *"how did we fix the Redis connection pool exhaustion error?"*.

---

### Pillar 5: Session Forking Engine
**Problem:** Developers often want to reproduce the exact steps from a recording on their own machine or in CI.

**Solution Architecture:**
- Implement `internal/server/fork.go` and `web/components/ForkSession.tsx`.
- Parse recorded input commands (`"i"`), environment snapshot (`"e"`), and process context (`"p"`).
- Filter out read-only inspection commands (`ls`, `cat`, `kubectl get`).
- Generate a clean, reproducible **Bash Script** or **Dockerfile** representing the state changes performed in the session.

---

### Pillar 6: Scalable Cloud Architecture & Storage
**Problem:** SQLite and local disk files (`blobs/`) cannot scale horizontally across multiple instances or handle high-concurrency video/replay streaming.

**Target Infrastructure Schema:**
- **Primary Database:** PostgreSQL 16 with `pgvector` extension.
- **Blob Storage:** AWS S3 or Cloudflare R2 (with MinIO fallback for local development & self-hosting).
- **Cache & Pub/Sub:** Redis for JWT token revocation, rate-limiting counters, and real-time live streaming sockets.
- **Compression Pipeline:** Compress `.replay` streams using `zstd` (or `gzip` fallback) during upload, reducing file sizes from ~3MB to ~300KB per hour.

```sql
-- Production PostgreSQL Schema
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recordings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shortcode       VARCHAR(16) UNIQUE NOT NULL,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    visibility      VARCHAR(20) DEFAULT 'unlisted', -- private | unlisted | public
    duration_secs   DOUBLE PRECISION NOT NULL,
    width           INT NOT NULL,
    height          INT NOT NULL,
    shell           VARCHAR(100),
    storage_path    TEXT NOT NULL, -- S3 Key
    compressed      BOOLEAN DEFAULT TRUE,
    
    -- AI Analysis Output
    ai_status       VARCHAR(20) DEFAULT 'pending', -- pending | processing | done | failed
    ai_summary      JSONB,
    ai_key_moments  JSONB,
    ai_tags         TEXT[],
    
    -- Search & Vector Embeddings
    text_content    TEXT,
    embedding       vector(1536),
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recordings_shortcode ON recordings(shortcode);
CREATE INDEX idx_recordings_user ON recordings(user_id);
CREATE INDEX idx_recordings_text ON recordings USING GIN(to_tsvector('english', text_content));
CREATE INDEX idx_recordings_embedding ON recordings USING ivfflat (embedding vector_cosine_ops);
```

---

## 5. Implementation Roadmap to Production Readiness

Below is the structured step-by-step execution roadmap to transform Replay from a local prototype into a battle-tested, production-ready system.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                               PRODUCTION ROADMAP TIMELINE                                   │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 1: Engine Hardening & Core Features (DLP, Checkpoints, Telemetry)                     │
│ PHASE 2: Storage Infrastructure & Cloud Data Layer (Postgres, S3, Zstd)                     │
│ PHASE 3: AI Pipeline, Semantic Search & Session Forking                                     │
│ PHASE 4: Web UX Polish, Embed Mode, Skip-Idle & Production DevOps                           │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Engine Hardening & Recorder Features
- [ ] **Implement Inline DLP Scrubbing (`internal/recorder/scrub.go`):**
  - Integrate Aho-Corasick trie and regex arrays for secret redaction.
  - Wire middleware directly into `Recorder.Start()` event stream writer.
  - Add CLI `--no-input` and `--scrub-pattern` override options.
- [ ] **Implement Terminal State Checkpoints (`internal/recorder/checkpoint.go`):**
  - Integrate headless VT100 emulator in Go.
  - Emit `"c"` events every 30 seconds into `.replay` file.
  - Update `usePlayer.tsx` to utilize checkpoints for instant O(1) seeking.
- [ ] **Implement OS Process Telemetry (`internal/recorder/telemetry.go`):**
  - Add `gopsutil` dependency to record `"p"` telemetry events (CWD, PID, CPU, RAM).
  - Update Web Player UI to show collapsible OS context drawer.

### Phase 2: Production Data Layer & Storage Scaling
- [ ] **PostgreSQL + pgvector Integration:**
  - Create database migration scripts (`internal/store/migrations/001_init.sql`).
  - Implement `PostgresStore` satisfying `RecordingStore` interface in `internal/store/postgres.go`.
- [ ] **S3 / Cloudflare R2 Blob Storage:**
  - Implement `S3BlobStore` in `internal/store/s3.go` using AWS SDK v2.
  - Retain `LocalBlobStore` as default for local dev and single-container self-hosting.
- [ ] **Zstd Compression Pipeline:**
  - Add streaming `klauspost/compress/zstd` writer in Go CLI & server handler.
  - Add browser-side decompressor (`fzstd` or `DecompressionStream`) in web parser.

### Phase 3: AI Pipeline & Session Forking
- [ ] **Build `internal/ai` Package:**
  - `preprocess.go`: ANSI stripping, prompt detection, transcript condensing.
  - `analyzer.go`: Ollama / Groq / Claude provider adapters for structured JSON extraction.
  - `moments.go`: Map AI-detected key moments to exact timeline timestamps.
  - `embedder.go`: Vector embedding generation and pgvector storage.
- [ ] **Build Session Forking Generator:**
  - Implement `internal/server/fork.go` to convert session commands & env into clean Bash scripts and Dockerfiles.
  - Add "Fork Session" button and copyable modal in `web/src/components/Player.tsx`.

### Phase 4: Web UX Polish, Embeds & Production DevOps
- [ ] **Web Player UX Enhancements:**
  - **Skip-Idle Mode:** Auto fast-forward playback through long silent breaks.
  - **Embed Player Mode (`/embed/[shortcode]`):** Lightweight iframe player with clean borderless UI for documentation and PR embedding.
  - **Dynamic Terminal Resize (`r` events):** Handle terminal window dimensions change during live playback smoothly in xterm.js.
- [ ] **Production Security & Hardening:**
  - Configure dynamic CORS domain allowlists based on environment variables.
  - Add rate-limiting middleware on upload & auth endpoints using Redis token bucket.
  - Set up structured logging (`log/slog`) and HTTP panic recovery middleware.
- [ ] **DevOps & Distribution:**
  - Create GitHub Actions workflow for cross-platform CLI binary builds (`linux/amd64`, `linux/arm64`, `darwin/amd64`, `darwin/arm64`).
  - Maintain production `Dockerfile.server`, `Dockerfile.web`, and `deploy/docker-compose.yml` for instant one-command self-hosting.

---

## 6. Verification & Quality Assurance Strategy

To ensure production reliability across CLI, Server, and Web Player:

1. **Unit Testing:**
   - Go: Run `go test ./...` covering format serialization, PTY creation, auth JWT validation, and DLP scrubbing.
   - Frontend: Unit tests for `replay-parser.ts`, search index matching, and waveform bucket calculations.
2. **Integration Testing:**
   - Execute end-to-end recording flow: `replay record test_session.replay` -> `replay login` -> `replay upload test_session.replay`.
   - Verify uploaded session renders properly in xterm.js at `/s/[shortcode]`.
3. **Performance Benchmarks:**
   - Verify recorder CPU overhead remains `< 1%`.
   - Confirm seeking latency remains `< 100ms` for 30-minute sessions using checkpoints.
   - Validate DLP scrubbing adds `< 5ms` delay per event block.

---

*This document represents the definitive architecture and production readiness roadmap for Replay.*
