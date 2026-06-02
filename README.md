# Replay

Open-source terminal session recorder and player (Loom for terminals, in Go).

Replay captures terminal output as structured events, writes a `.replay` file, and plays it back with accurate timing. The project is early-stage: today it ships a minimal CLI recorder/player and the core file format, with a broader roadmap for a web player, sharing, and AI summaries.

## Why Replay

Terminal sessions contain the real story behind fixes, incident response, and onboarding. Replay turns those sessions into a replayable artifact so others can scrub, search, and understand *what actually happened*.

## Features (today)

- **PTY-based recording** with microsecond timestamps.
- **`.replay` JSON Lines format** with a header and event stream.
- **Local playback** with timing control.
- **Foundational storage primitives** (SQLite + local blob store) in `internal/server/`.

## Quickstart

### Prerequisites

- Go **1.26+** (per `go.mod`)

### Build

```bash
go build -o bin/replay ./cmd/replay
```

### Record a session

```bash
./bin/replay record my-session.replay
```

### Play it back

```bash
./bin/replay play my-session.replay
# optional speed multiplier (e.g., 2.0)
./bin/replay play my-session.replay 2.0
```

## File Format (`.replay`)

The file is JSON Lines:

1. **Header** (JSON object) with terminal size, timestamp, and shell metadata.
2. **Events** (JSON arrays) with `[time, type, data]`.

Event types:

- `o` — output (raw bytes)
- `i` — input (keystrokes)
- `r` — resize
- `c` — checkpoint
- `m` — marker

See `internal/format/` for the implementation.

## Architecture & Roadmap

Replay’s long-term vision includes a web player, sharing/upload APIs, search, and AI summaries. The detailed design and roadmap live in:

- [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## Project Structure

```
cmd/replay/          CLI entrypoint (record/play)
internal/format/     .replay format reader/writer
internal/recorder/   PTY recorder
internal/server/     Storage abstractions (SQLite + local blob store)
web/                Frontend placeholder (future)
```

## Development

```bash
go test ./...
go build ./cmd/replay
golangci-lint run   # if installed
```

## Contributing

Issues and PRs are welcome. If you’re planning a larger change, open an issue first to discuss the approach.

## License

No license file is currently included. If you intend to use or contribute to Replay, please open an issue to clarify licensing.
