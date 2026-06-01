package main

import (
	"fmt"
	"github.com/Nathanim1919/replay/internal/recorder"
	"os"
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
		os.Exit(0)
	default:
		fmt.Println("Unknown command. Usage: replay record <output_file>")
	}
}
