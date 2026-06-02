package main

import (
	"fmt"
	"os"
	"strconv"

	"github.com/Nathanim1919/replay/internal/client"
	"github.com/Nathanim1919/replay/internal/recorder"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: replay record <output_file>")
		os.Exit(1)
	}

	switch os.Args[1] {
	case "record":
		outputPath := "recording.replay"
		if len(os.Args) >= 3 {
			outputPath = os.Args[2]
		}
		rec := recorder.NewRecorder()
		err := rec.Start(outputPath)
		if err != nil {
			fmt.Printf("Error recording: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Recording saved to %s\n", outputPath)
		url, err := client.Upload("http://localhost:3000", outputPath)
		if err != nil {
			fmt.Printf("Upload failed: %v (file saved locally)\n", err)
		} else {
			fmt.Printf("Share: %s\n", url)
		}
		os.Exit(0)
	case "play":
		if len(os.Args) < 3 {
			fmt.Println("Usage: replay play <file>")
			os.Exit(1)
		}
		speed := 1.0
		if len(os.Args) >= 4 {
			parsed, err := strconv.ParseFloat(os.Args[3], 64)
			if err == nil {
				speed = parsed
			}
		}
		err := playRecording(os.Args[2], speed)
		if err != nil {
			fmt.Printf("Error playing: %v\n", err)
			os.Exit(1)
		}
	case "upload":
		if len(os.Args) < 3 {
			fmt.Println("Usage: replay upload <file>")
			os.Exit(1)
		}
		url, err := client.Upload("http://localhost:3000", os.Args[2])
		if err != nil {
			fmt.Printf("Error uploading: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Uploaded to: %s\n", url)
		os.Exit(0)
	default:
		fmt.Println("Unknown command. Usage: replay record <output_file>")
	}
}
