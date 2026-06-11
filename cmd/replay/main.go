package main

import (
	"fmt"
	"io"
	"os"
	"strconv"
	"time"

	"github.com/Nathanim1919/replay/cmd/lib"
	"github.com/Nathanim1919/replay/internal/format"

	"github.com/Nathanim1919/replay/internal/client"
	"github.com/Nathanim1919/replay/internal/recorder"
)

func main() {
	args := os.Args[1:]
	if len(args) > 0 && args[0] == "replay" {
		args = args[1:]
	}

	if len(args) < 1 {
		fmt.Println("Usage: replay record <output_file>")
		os.Exit(1)
	}

	session, err := lib.LoadSession()
		if err != nil {
			fmt.Printf("Failed to load session: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Authenticated with access token: %s\n", session.AccessToken)

	switch args[0] {
	case "help":
		fmt.Println("Usage:")
		fmt.Println("  replay record [output_file] - Record a new session (default: recording.replay)")
		fmt.Println("  replay play <file> [speed] - Play a recording (optional speed multiplier)")
		fmt.Println("  replay upload <file> - Upload a recording to the server")
		os.Exit(0)

	case "login":
        resp, err := client.Login()
        if err != nil {
            fmt.Printf("Login failed: %v\n", err)
            os.Exit(1)
        }
        fmt.Printf("User code: %s\n", resp.UserCode)
        fmt.Printf("Verify at: %s\n", resp.VerificationURI)
        fmt.Println("Waiting for approval in the browser...")
        
        // 1. Capture the returned session tokens from the successful poll
        session, err := client.PollDeviceAuth("http://localhost:8080", resp.DeviceCode, resp.Interval, resp.ExpiresIn)
        if err != nil {
            fmt.Printf("Login failed: %v\n", err)
            os.Exit(1)
        }
        
        // 2. Persist the session to local machine files
        if err := lib.SaveSession(session); err != nil {
            fmt.Printf("Failed to save credentials locally: %v\n", err)
            os.Exit(1)
        }

        fmt.Println("Login approved and session saved securely.")
        os.Exit(0)

	case "version":
		fmt.Println("Replay CLI version 1.0.0")
		os.Exit(0)
	
	// case "login":
		

	case "record":
		outputPath := "recording.replay"
		if len(args) >= 2 {
			outputPath = args[1]
		}
		rec := recorder.NewRecorder()
		err := rec.Start(outputPath)
		if err != nil {
			fmt.Printf("Error recording: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Recording saved to %s\n", outputPath)
		url, err := client.Upload("http://localhost:8080", outputPath, session.AccessToken)
		if err != nil {
			fmt.Printf("Upload failed: %v (file saved locally)\n", err)
		} else {
			fmt.Printf("Share: %s\n", url)
		}
		os.Exit(0)
	case "play":
		if len(args) < 2 {
			fmt.Println("Usage: replay play <file>")
			os.Exit(1)
		}
		speed := 1.0
		if len(args) >= 3 {
			parsed, err := strconv.ParseFloat(args[2], 64)
			if err == nil {
				speed = parsed
			}
		}
		err := playRecording(args[1], speed)
		if err != nil {
			fmt.Printf("Error playing: %v\n", err)
			os.Exit(1)
		}
	case "upload":
		if len(args) < 2 {
			fmt.Println("Usage: replay upload <file>")
			os.Exit(1)
		}
		url, err := client.Upload("http://localhost:8080", args[1], session.AccessToken)
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

func playRecording(filePath string, speed float64) error {
	reader, err := format.NewReplayReader(filePath)
	if err != nil {
		return err
	}
	defer reader.Close()

	header, err := reader.ReadHeader()
	if err != nil {
		return err
	}
	fmt.Printf("Playing: %dx%d session\n", header.Width, header.Height)

	var lastTime float64

	for {
		event, err := reader.ReadEvent()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		delay := (event.Time - lastTime) / speed
		if delay > 0 {
			time.Sleep(time.Duration(delay * float64(time.Second)))
		}
		lastTime = event.Time

		if event.Type == format.EventOutput {
			_, _ = os.Stdout.Write(event.RawData)
		}
	}

	fmt.Println("\nPlayback done.")
	return nil
}
