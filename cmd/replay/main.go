package main

import (
	"fmt"
	"io"
	"os"
	"strconv"
	"time"

	"github.com/Nathanim1919/replay/cmd/lib"
	"github.com/Nathanim1919/replay/internal/client"
	"github.com/Nathanim1919/replay/internal/format"
	"github.com/Nathanim1919/replay/internal/recorder"
)

// These can be overridden dynamically during `go build` using -ldflags
var (
	ServerURL = "http://localhost:8080"
	Version   = "1.0.0-dev"
)

func main() {
	args := os.Args[1:]
	if len(args) > 0 && args[0] == "replay" {
		args = args[1:]
	}

	if len(args) < 1 {
		fmt.Println("Usage: replay <command> [arguments]")
		fmt.Println("Run 'replay help' for a list of available commands.")
		os.Exit(1)
	}

	switch args[0] {
case "help":
		// ANSI Escape Color Codes
		const (
			Reset     = "\033[0m"
			Bold      = "\033[1m"
			Dim       = "\033[2m"
			Blue      = "\033[38;5;39m"  // Premium Cyan/Blue
			Indigo    = "\033[38;5;63m"  // Deep Brand Accent
			Green     = "\033[38;5;78m"  // Success Mint
			Yellow    = "\033[38;5;214m" // Warning Amber
		)

		// 1. High-Impact ASCII Logo Line Art
		fmt.Print(Indigo + Bold)
		fmt.Println(`    ____                 __              `)
		fmt.Println(`   / __ \___  ____  ____/ /___ ___  __  `)
		fmt.Println(`  / /_/ / _ \/ __ \/ __  / __ \__ \/ / / /`)
		fmt.Print(Blue + Bold)
		fmt.Println(` / _, _/  __/ /_/ / /_/ / /_/ / / / /_/ / `)
		fmt.Println(`/_/ |_|\___/ .___/\__,_/\__,_/_/ /_/\__, /  `)
		fmt.Println(`          /_/                      /____/   ` + Reset)

		// 2. Structural Tagline
		fmt.Printf(" %sThe Multi-Dimensional Interactive CLI Engine%s\n\n", Dim, Reset)

		// 3. Usage Block
		fmt.Printf("%sUSAGE:%s\n", Bold+Blue, Reset)
		fmt.Printf("  $ replay <command> [arguments]\n\n")

		// 4. Core Commands Group
		fmt.Printf("%sCORE COMMANDS:%s\n", Bold+Blue, Reset)
		fmt.Printf("  %s%-18s%s %sRecord an active shell session to a stream file%s\n", Green, "record [file]", Reset, Dim, Reset)
		fmt.Printf("  %s%-18s%s %sPlay back a local recording inside your terminal%s\n", Green, "play <file> [spd]", Reset, Dim, Reset)
		fmt.Printf("  %s%-18s%s %sUpload and stream a recording to the cloud%s\n", Green, "upload <file>", Reset, Dim, Reset)
		fmt.Println()

		// 5. System Commands Group
		fmt.Printf("%sSYSTEM COMMANDS:%s\n", Bold+Blue, Reset)
		fmt.Printf("  %s%-18s%s %sLink your current terminal to your account%s\n", Yellow, "login", Reset, Dim, Reset)
		fmt.Printf("  %s%-18s%s %sDisplay current runtime version information%s\n", Yellow, "version", Reset, Dim, Reset)
		fmt.Printf("  %s%-18s%s %sShow this detailed options breakdown directory%s\n", Yellow, "help", Reset, Dim, Reset)
		fmt.Println()

		// 6. Footer Callout
		fmt.Printf("%sLEARN MORE:%s\n", Bold, Reset)
		fmt.Printf("  Read documentation or report engine errors at %shttps://replay.space%s\n\n", Blue, Reset)
		os.Exit(0)

	case "version":
		fmt.Printf("Replay CLI version %s (Target: %s)\n", Version, ServerURL)
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

		// Using the dynamic ServerURL here
		session, err := client.PollDeviceAuth(ServerURL, resp.DeviceCode, resp.Interval, resp.ExpiresIn)
		if err != nil {
			fmt.Printf("Login failed: %v\n", err)
			os.Exit(1)
		}

		if err := lib.SaveSession(session); err != nil {
			fmt.Printf("Failed to save credentials locally: %v\n", err)
			os.Exit(1)
		}

		fmt.Println("Login approved and session saved securely.")
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
		os.Exit(0)

	// Protected commands: These require a valid session context loaded first
	case "record", "upload":
		session, err := lib.LoadSession()
		if err != nil {
			fmt.Println("Authentication missing. Please run 'replay login' first.")
			os.Exit(1)
		}

		switch args[0] {
case "record":
			outputPath := "recording.replay"
			opts := recorder.DefaultOptions()

			for i := 1; i < len(args); i++ {
				arg := args[i]
				if arg == "--no-input" {
					opts.RecordInput = false
				} else if arg == "--no-scrub" {
					opts.EnableDLP = false
				} else if len(arg) > 0 && arg[0] != '-' {
					outputPath = arg
				}
			}

			rec := recorder.NewRecorderWithOptions(opts)
			err := rec.Start(outputPath)
			if err != nil {
				fmt.Printf("Error recording: %v\n", err)
				os.Exit(1)
			}
			fmt.Printf("Recording saved to %s\n", outputPath)

			// Using dynamic ServerURL & session token
			url, err := client.Upload(ServerURL, outputPath, session.AccessToken)
			if err != nil {
				fmt.Printf("Upload failed: %v (file saved locally)\n", err)
			} else {
				fmt.Printf("Share: %s\n", url)
			}
			os.Exit(0)

		case "upload":
			if len(args) < 2 {
				fmt.Println("Usage: replay upload <file>")
				os.Exit(1)
			}
			// Using dynamic ServerURL & session token
			url, err := client.Upload(ServerURL, args[1], session.AccessToken)
			if err != nil {
				fmt.Printf("Error uploading: %v\n", err)
				os.Exit(1)
			}
			fmt.Printf("Uploaded to: %s\n", url)
			os.Exit(0)
		}

	default:
		fmt.Printf("Unknown command: %s. Run 'replay help' for usage.\n", args[0])
		os.Exit(1)
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