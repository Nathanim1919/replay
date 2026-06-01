package recorder

import (
	"github.com/Nathanim1919/replay/internal/format"
	"github.com/creack/pty"
	"golang.org/x/term"
	"os"
	"os/exec"
	"time"
)

type Recorder struct {
	writer    *format.ReplayWriter
	startTime time.Time
	ptyFile   *os.File
	oldState  *term.State
}

func NewRecorder() *Recorder {
	return &Recorder{}
}

func (r *Recorder) Start(outputPath string) error {
	// step 1: Detect shell:
	shell := os.Getenv("SHELL")
	if shell == "" {
		shell = "/bin/bash"
	}

	// step 2: Get current terminal size:
	width, height, err := term.GetSize(int(os.Stdin.Fd()))
	if err != nil {
		return err
	}

	// Step 3: Save terminal state and set raw mode:
	oldState, err := term.MakeRaw(int(os.Stdin.Fd()))
	if err != nil {
		return err
	}
	r.oldState = oldState

	restore := func() {
		term.Restore(int(os.Stdin.Fd()), r.oldState)
	}

	// Step 4: Spawn PTY with shell:
	cmd := exec.Command(shell)
	/**
		 — pty.Start creates a PTY pair, attaches shell to slave side
	     — Returns the master FD as *os.File
	     — Store in r.ptyFile
	*/
	ptyFile, err := pty.Start(cmd)
	if err != nil {
		restore()
		return err
	}
	r.ptyFile = ptyFile

	// Step 5: Set PTY size to match terminal size:
	err = pty.Setsize(ptyFile, &pty.Winsize{
		Rows: uint16(height),
		Cols: uint16(width),
	})

	if err != nil {
		restore()
		return err
	}

	// Step 6: Create writer and write header:
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
		// Term: "xterm-256color",
		// Title: "debugging api-server crashloop",
		// Env: os.Environ(),
		// Checkpoints: []float64{},
	}

	err = writer.WriteHeader(header)
	if err != nil {
		restore()
		return err
	}
	r.writer = writer

	// Step 7: Start recording:
	r.startTime = time.Now()

	// Allocate a buffer for reading
	buf := make([]byte, 4096)

	// INPUT: runs in background
	go func() {
		inputBuf := make([]byte, 4096) // separate buffer!
		for {
			n, err := os.Stdin.Read(inputBuf)
			if err != nil {
				break
			}
			r.ptyFile.Write(inputBuf[:n])
		}
	}()

	// OUTPUT: runs here, blocks until bash exits
	for {
		n, err := r.ptyFile.Read(buf)
		if err != nil {
			break
		}
		os.Stdout.Write(buf[:n])

		elapsed := time.Since(r.startTime).Seconds()
		r.writer.WriteEvent(format.Event{
			Time:    elapsed,
			Type:    format.EventOutput,
			RawData: buf[:n],
		})
	}

	// Bash has exited — clean up
	restore()
	r.writer.Close()
	return nil

}
