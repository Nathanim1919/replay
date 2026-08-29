package recorder

import (
	"os"
	"os/exec"
	"os/signal"
	"time"

	"github.com/Nathanim1919/replay/internal/format"
	"github.com/creack/pty"
	"golang.org/x/term"
)

// RecorderOptions configures recorder runtime behavior.
type RecorderOptions struct {
	RecordInput        bool
	EnableDLP          bool
	CheckpointInterval time.Duration
	TelemetryInterval  time.Duration
}

// DefaultOptions returns production-ready default recorder settings.
func DefaultOptions() RecorderOptions {
	return RecorderOptions{
		RecordInput:        true,
		EnableDLP:          true,
		CheckpointInterval: 30 * time.Second,
		TelemetryInterval:  5 * time.Second,
	}
}

type Recorder struct {
	opts              RecorderOptions
	writer            *format.ReplayWriter
	startTime         time.Time
	ptyFile           *os.File
	oldState          *term.State
	scrubber          *Scrubber
	checkpointTracker *CheckpointTracker
	stopCh            chan struct{}
}

func NewRecorder() *Recorder {
	return NewRecorderWithOptions(DefaultOptions())
}

func NewRecorderWithOptions(opts RecorderOptions) *Recorder {
	var scrubber *Scrubber
	if opts.EnableDLP {
		scrubber = NewScrubber()
	}
	return &Recorder{
		opts:     opts,
		scrubber: scrubber,
		stopCh:   make(chan struct{}),
	}
}

func (r *Recorder) Start(outputPath string) error {
	// Step 1: Detect shell
	shell := os.Getenv("SHELL")
	if shell == "" {
		shell = "/bin/bash"
	}

	// Step 2: Get current terminal size
	width, height, err := term.GetSize(int(os.Stdin.Fd()))
	if err != nil {
		width, height = 80, 24
	}

	r.checkpointTracker = NewCheckpointTracker(width, height)

	// Step 3: Save terminal state and set raw mode
	oldState, err := term.MakeRaw(int(os.Stdin.Fd()))
	if err != nil {
		return err
	}
	r.oldState = oldState

	restore := func() {
		term.Restore(int(os.Stdin.Fd()), r.oldState)
	}

	// Step 4: Spawn PTY with shell
	cmd := exec.Command(shell)
	ptyFile, err := pty.Start(cmd)
	if err != nil {
		restore()
		return err
	}
	r.ptyFile = ptyFile

	// Step 5: Set PTY size
	_ = pty.Setsize(ptyFile, &pty.Winsize{
		Rows: uint16(height),
		Cols: uint16(width),
	})

	// Step 6: Create format writer & write header
	writer, err := format.NewReplayWriter(outputPath)
	if err != nil {
		restore()
		return err
	}

	header := format.Header{
		Version:   1,
		Width:     width,
		Height:    height,
		Timestamp: time.Now().Unix(),
		Duration:  0,
		Shell:     shell,
	}

	err = writer.WriteHeader(header)
	if err != nil {
		restore()
		return err
	}
	r.writer = writer
	r.startTime = time.Now()

	// Step 7: Listen for terminal resize (SIGWINCH)
	sigCh := make(chan os.Signal, 1)
	notifySIGWINCH(sigCh)
	go func() {
		for {
			select {
			case <-r.stopCh:
				return
			case <-sigCh:
				w, h, e := term.GetSize(int(os.Stdin.Fd()))
				if e == nil {
					_ = pty.Setsize(r.ptyFile, &pty.Winsize{Rows: uint16(h), Cols: uint16(w)})
					r.checkpointTracker.UpdateSize(w, h)
					elapsed := time.Since(r.startTime).Seconds()
					_ = r.writer.WriteEvent(format.Event{
						Time: elapsed,
						Type: format.EventResize,
						Size: &format.TerminalSize{Width: w, Height: h},
					})
				}
			}
		}
	}()

	// Step 8: Periodic OS Telemetry ticker ("p" events)
	if r.opts.TelemetryInterval > 0 {
		go func() {
			ticker := time.NewTicker(r.opts.TelemetryInterval)
			defer ticker.Stop()
			for {
				select {
				case <-r.stopCh:
					return
				case <-ticker.C:
					elapsed := time.Since(r.startTime).Seconds()
					telemetry := CollectTelemetry(cmd.Process.Pid, shell)
					_ = r.writer.WriteEvent(format.Event{
						Time: elapsed,
						Type: format.EventTelemetry,
						Telemetry: &format.TelemetryData{
							PID:    telemetry.PID,
							CWD:    telemetry.CWD,
							Cmd:    telemetry.Cmd,
							CPU:    telemetry.CPU,
							Memory: telemetry.Memory,
						},
					})
				}
			}
		}()
	}

	// Step 9: Periodic Terminal Checkpoint ticker ("c" events)
	if r.opts.CheckpointInterval > 0 {
		go func() {
			ticker := time.NewTicker(r.opts.CheckpointInterval)
			defer ticker.Stop()
			for {
				select {
				case <-r.stopCh:
					return
				case <-ticker.C:
					elapsed := time.Since(r.startTime).Seconds()
					state := r.checkpointTracker.GenerateSnapshot()
					_ = r.writer.WriteEvent(format.Event{
						Time:  elapsed,
						Type:  format.EventCheckpoint,
						State: &state,
					})
				}
			}
		}()
	}

	// Step 10: Forward INPUT (stdin -> PTY)
	go func() {
		inputBuf := make([]byte, 4096)
		for {
			n, err := os.Stdin.Read(inputBuf)
			if err != nil {
				break
			}

			// Forward to shell PTY
			_, _ = r.ptyFile.Write(inputBuf[:n])

			// Record input event if enabled
			if r.opts.RecordInput {
				elapsed := time.Since(r.startTime).Seconds()
				data := inputBuf[:n]
				if r.scrubber != nil {
					data = r.scrubber.Scrub(data)
				}
				_ = r.writer.WriteEvent(format.Event{
					Time:    elapsed,
					Type:    format.EventInput,
					RawData: data,
				})
			}
		}
	}()

	// Step 11: Forward OUTPUT (PTY -> stdout) & Record
	buf := make([]byte, 4096)
	for {
		n, err := r.ptyFile.Read(buf)
		if err != nil {
			break
		}

		// Forward bytes to user stdout
		_, _ = os.Stdout.Write(buf[:n])

		// Update checkpoint line tracker
		r.checkpointTracker.ProcessOutput(buf[:n])

		// Apply DLP Scrubbing
		data := buf[:n]
		if r.scrubber != nil {
			data = r.scrubber.Scrub(data)
		}

		// Record output event
		elapsed := time.Since(r.startTime).Seconds()
		_ = r.writer.WriteEvent(format.Event{
			Time:    elapsed,
			Type:    format.EventOutput,
			RawData: data,
		})
	}

	// Cleanup
	close(r.stopCh)
	signal.Stop(sigCh)
	restore()
	return r.writer.Close()
}
