package main

import (
	"fmt"
	"github.com/Nathanim1919/replay/internal/format"
	"io"
	"os"
	"time"
)

func playRecording(filePath string) error {
	// open reader
	reader, err := format.NewReplayReader(filePath)
	if err != nil {
		return err
	}
	defer reader.Close()

	// read header
	header, err := reader.ReadHeader()
	if err != nil {
		return err
	}
	fmt.Printf("Playing: %dx%d session\n", header.Width, header.Height)

	// Read and play events
	var lastTime float64 // which is the time of the last event we played

	for {
		event, err := reader.ReadEvent()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		// wait the time gap since last event
		delay := event.Time - lastTime
		if delay > 0 {
			time.Sleep(time.Duration(delay * float64(time.Second)))
		}
		lastTime = event.Time

		// Write output to screen
		if event.Type == format.EventOutput {
			os.Stdout.Write(event.RawData)
		}
	}

	fmt.Println("\nPlayback done.")
	return nil
}
