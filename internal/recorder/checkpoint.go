package recorder

import (
	"strings"
	"sync"

	"github.com/Nathanim1919/replay/internal/format"
)

// CheckpointTracker keeps an active in-memory representation of terminal lines to generate state snapshots.
type CheckpointTracker struct {
	mu           sync.Mutex
	width        int
	height       int
	lines        []string
	cursorRow    int
	cursorCol    int
}

// NewCheckpointTracker creates a tracker with given terminal dimensions.
func NewCheckpointTracker(width, height int) *CheckpointTracker {
	if width <= 0 {
		width = 80
	}
	if height <= 0 {
		height = 24
	}
	return &CheckpointTracker{
		width:     width,
		height:    height,
		lines:     make([]string, 0, height),
		cursorRow: 0,
		cursorCol: 0,
	}
}

// ProcessOutput appends or updates terminal lines from output byte stream.
func (ct *CheckpointTracker) ProcessOutput(data []byte) {
	ct.mu.Lock()
	defer ct.mu.Unlock()

	text := string(data)
	rawLines := strings.Split(text, "\n")

	for i, l := range rawLines {
		cleanLine := stripBasicControlCodes(l)
		if i == 0 && len(ct.lines) > 0 {
			// Append to current line
			ct.lines[len(ct.lines)-1] += cleanLine
		} else {
			ct.lines = append(ct.lines, cleanLine)
		}
	}

	// Keep screen buffer capped to last max lines (e.g. 500 lines)
	if len(ct.lines) > 500 {
		ct.lines = ct.lines[len(ct.lines)-500:]
	}
}

// UpdateSize adjusts terminal dimensions.
func (ct *CheckpointTracker) UpdateSize(width, height int) {
	ct.mu.Lock()
	defer ct.mu.Unlock()
	ct.width = width
	ct.height = height
}

// GenerateSnapshot returns a format.TerminalState containing current active screen buffer.
func (ct *CheckpointTracker) GenerateSnapshot() format.TerminalState {
	ct.mu.Lock()
	defer ct.mu.Unlock()

	var snapshot string
	if len(ct.lines) > ct.height {
		snapshot = strings.Join(ct.lines[len(ct.lines)-ct.height:], "\n")
	} else {
		snapshot = strings.Join(ct.lines, "\n")
	}

	return format.TerminalState{
		ScreenBuffer: snapshot,
	}
}

func stripBasicControlCodes(s string) string {
	// Strip simple non-printable control characters, retaining ANSI color sequences if needed
	var b strings.Builder
	for _, r := range s {
		if r == '\r' {
			continue
		}
		b.WriteRune(r)
	}
	return b.String()
}
