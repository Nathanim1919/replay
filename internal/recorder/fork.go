package recorder

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/Nathanim1919/replay/internal/format"
	"github.com/creack/pty"
	"golang.org/x/term"
)

// ForkState holds the reconstructed terminal environment state for session forking.
type ForkState struct {
	TargetTime float64
	Shell      string
	CWD        string
	LastState  string
}

// ExtractForkState reads a replay file up to target time T and extracts the last working directory and shell context.
func ExtractForkState(data []byte, targetTime float64) (*ForkState, error) {
	decompressed, err := format.DecompressZstd(data)
	if err != nil {
		return nil, fmt.Errorf("failed decompressing replay stream for fork: %w", err)
	}

	lines := bytes.Split(decompressed, []byte("\n"))
	if len(lines) == 0 {
		return nil, fmt.Errorf("empty replay stream")
	}

	var header format.Header
	if err := json.Unmarshal(lines[0], &header); err != nil {
		return nil, fmt.Errorf("invalid header: %w", err)
	}

	state := &ForkState{
		TargetTime: targetTime,
		Shell:      header.Shell,
		CWD:        ".",
	}

	if state.Shell == "" {
		state.Shell = "/bin/bash"
	}

	for _, line := range lines[1:] {
		line = bytes.TrimSpace(line)
		if len(line) == 0 {
			continue
		}

		var event format.Event
		if err := json.Unmarshal(line, &event); err != nil {
			continue
		}

		if targetTime > 0 && event.Time > targetTime {
			break
		}

		if event.Type == format.EventTelemetry && event.Telemetry != nil {
			if event.Telemetry.CWD != "" {
				state.CWD = event.Telemetry.CWD
			}
		}

		if event.Type == format.EventCheckpoint && event.State != nil {
			state.LastState = event.State.ScreenBuffer
		}
	}

	return state, nil
}

// LaunchForkedSession starts an interactive PTY shell in the extracted CWD context.
func LaunchForkedSession(forkState *ForkState) error {
	shell := forkState.Shell
	if _, err := exec.LookPath(shell); err != nil {
		shell = "/bin/bash"
	}

	cmd := exec.Command(shell)

	// Set target CWD if directory exists
	if forkState.CWD != "" {
		if absPath, err := filepath.Abs(forkState.CWD); err == nil {
			if info, err := os.Stat(absPath); err == nil && info.IsDir() {
				cmd.Dir = absPath
			}
		}
	}

	cmd.Env = os.Environ()

	fmt.Printf("\n🚀 Forking session into live terminal shell...\n")
	fmt.Printf("   Shell: %s | Directory: %s | Offset: %.2fs\n\n", shell, cmd.Dir, forkState.TargetTime)

	ptmx, err := pty.Start(cmd)
	if err != nil {
		return fmt.Errorf("failed to start pty for fork: %w", err)
	}
	defer ptmx.Close()

	oldState, err := term.MakeRaw(int(os.Stdin.Fd()))
	if err == nil {
		defer term.Restore(int(os.Stdin.Fd()), oldState)
	}

	go func() {
		_, _ = os.Stdout.ReadFrom(ptmx)
	}()

	go func() {
		_, _ = ptmx.ReadFrom(os.Stdin)
	}()

	_ = cmd.Wait()
	fmt.Println("\nForked session ended.")
	return nil
}
