# Replay

> High-performance terminal session engine & interactive player (Loom for terminals, in Go & Next.js).

Replay captures terminal stdout/stdin events as compressed microsecond-indexed streams, auto-scrubs credentials with real-time DLP filters, and renders interactive replays in a Next.js web dashboard with **AI session intelligence** and **time-travel shell forking**.

---

## 🌟 Key Capabilities

- **PTY Terminal Engine**: Native Go syscalls (`/dev/pty`) capturing microsecond-indexed ANSI streams, window resizes, and CWD process telemetry with `< 2MB` overhead.
- **Real-Time DLP Secret Redactor**: In-line regex scrubbing for AWS credentials, JWT bearer tokens, and private database keys before disk serialization.
- **Interactive Web Player**: Frame-accurate xterm.js canvas rendering with instant keyframe seeking, visual activity waveforms, variable speed (0.5x – 8x), and skip-idle silence scrubbing.
- **AI Session Copilot**: Integrated Gemini 3.5 Flash Lite assistant for real-time command summarization, error auditing, and terminal query Q&A.
- **Time-Travel Shell Forking**: `replay fork <session> <timestamp>` reconstitutes original CWD and environment snapshots into an interactive live terminal subshell.
- **Device Authorization**: Seamless CLI authentication (`replay login`) using browser verification codes.
- **Export & Embeds**: Export session previews to SVG or standard asciinema `.cast` formats, or embed responsive iframes (`/embed/:shortcode`) directly into PRs and docs.

---

## ⚡ Quickstart

### 1. Install CLI

```bash
curl -fsSL https://cdn.jsdelivr.net/gh/Nathanim1919/replay@trunk/install.sh | bash
```

Or build from source (Go 1.22+ required):

```bash
go build -o bin/replay ./cmd/replay
```

### 2. Authenticate CLI

```bash
replay login
```

Follow the prompt to verify your 8-digit device code in the web browser.

### 3. Record a Session

```bash
replay record my-session.replay
```

Execute your terminal commands as usual. Type `exit` or press `Ctrl+D` to stop recording.

### 4. Playback & Time-Travel

Play back locally in terminal:
```bash
replay play my-session.replay 2.0
```

Fork terminal state at 14.5 seconds into an interactive subshell:
```bash
replay fork my-session.replay 14.5
```

Export session preview to SVG:
```bash
replay export my-session.replay --format svg --output preview.svg
```

---

## 🛠️ CLI Reference

| Command | Description |
| :--- | :--- |
| `replay record [file]` | Start recording terminal PTY session to `.replay` file |
| `replay play <file> [speed]` | Play back recorded terminal session locally |
| `replay fork <file> <timestamp>` | Launch an interactive subshell restored at timestamp snapshot |
| `replay login` | Initiate device flow authentication |
| `replay export <file>` | Export session to `.svg` or `.cast` asciinema format |
| `replay list` | List recorded sessions stored in local buffer |

---

## 🏗️ Architecture Overview

Replay consists of two primary components:

1. **Go Core Engine (`/cmd/replay`, `/internal`)**:
   - `internal/recorder`: Intercepts system PTY events and redacts secrets.
   - `internal/format`: `Zstd`-compressed JSON Lines stream format (`.replay`).
   - `internal/server`: REST API server & OAuth device flow endpoints.
   - `internal/ai`: Streaming Gemini AI session intelligence provider.

2. **Web Dashboard (`/web`)**:
   - Built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **xterm.js**.
   - Features Industrial design tokens, tabular session metrics, activity waveforms, and iframe embedding.

---

## 💻 Local Development

### Run Backend API Server
```bash
make build-server && ./bin/server
```

### Run Web Frontend
```bash
cd web
npm install
NEXT_PUBLIC_API_URL=http://localhost:8080 npm run dev
```

---

## 📄 License

Distributed under the permissive **MIT License**. See [`LICENSE`](./LICENSE) for details.
