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
	ServerURL = "https://replay-backend-dq8p.onrender.com"
	Version   = "1.0.0"
)

func main() {
	args := os.Args[1:]
	if len(args) > 0 && args[0] == "replay" {
		args = args[1:]
	}

	if len(args) < 1 {
		printHelp()
		os.Exit(0)
	}

	switch args[0] {
	case "help", "-h", "--help":
		printHelp()
		os.Exit(0)

	case "version", "-v", "--version":
		fmt.Printf("Replay CLI v%s (Target API: %s)\n", Version, ServerURL)
		os.Exit(0)

	case "login":
		resp, err := client.Login(ServerURL)
		if err != nil {
			fmt.Printf("❌ Login failed: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("🔑 User code: %s\n", resp.UserCode)
		fmt.Printf("🌐 Verify at: %s\n", resp.VerificationURI)
		fmt.Println("⏳ Waiting for device authorization in your browser...")

		session, err := client.PollDeviceAuth(ServerURL, resp.DeviceCode, resp.Interval, resp.ExpiresIn)
		if err != nil {
			fmt.Printf("❌ Login failed: %v\n", err)
			os.Exit(1)
		}

		if err := lib.SaveSession(session); err != nil {
			fmt.Printf("❌ Failed to save credentials locally: %v\n", err)
			os.Exit(1)
		}

		fmt.Println("✅ Login successful! Session token saved securely.")
		os.Exit(0)

	case "play":
		if len(args) < 2 {
			fmt.Println("💡 Usage: replay play <file.replay> [speed_multiplier]")
			fmt.Println("   Example: replay play recording.replay 1.5")
			os.Exit(1)
		}
		speed := 1.0
		if len(args) >= 3 {
			parsed, err := strconv.ParseFloat(args[2], 64)
			if err == nil && parsed > 0 {
				speed = parsed
			}
		}
		err := playRecording(args[1], speed)
		if err != nil {
			fmt.Printf("❌ Playback error: %v\n", err)
			os.Exit(1)
		}
		os.Exit(0)

	case "fork":
		if len(args) < 2 {
			fmt.Println("💡 Usage: replay fork <file.replay> [timestamp_seconds]")
			fmt.Println("   Example: replay fork session.replay 42.5")
			os.Exit(1)
		}
		filePath := args[1]
		var targetTime float64
		if len(args) >= 3 {
			if parsed, err := strconv.ParseFloat(args[2], 64); err == nil {
				targetTime = parsed
			}
		}

		data, err := os.ReadFile(filePath)
		if err != nil {
			fmt.Printf("❌ Error reading session file: %v\n", err)
			os.Exit(1)
		}

		forkState, err := recorder.ExtractForkState(data, targetTime)
		if err != nil {
			fmt.Printf("❌ Error extracting fork state: %v\n", err)
			os.Exit(1)
		}

		fmt.Printf("🚀 Forking session at state %0.2fs...\n", targetTime)
		if err := recorder.LaunchForkedSession(forkState); err != nil {
			fmt.Printf("❌ Error running forked shell: %v\n", err)
			os.Exit(1)
		}
		os.Exit(0)

	case "record", "upload":
		session, err := lib.LoadSession()
		if err != nil || session == nil || session.AccessToken == "" {
			fmt.Println("🔒 Authentication required before recording or uploading sessions.")
			fmt.Println("   Run 'replay login' to connect your terminal account.")
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
			fmt.Printf("🔴 Recording terminal session to %s (Press Ctrl+D or exit shell when finished)...\n", outputPath)
			err := rec.Start(outputPath)
			if err != nil {
				fmt.Printf("❌ Recording error: %v\n", err)
				os.Exit(1)
			}
			fmt.Printf("💾 Session saved locally to %s\n", outputPath)

			fmt.Println("☁️ Uploading session stream to cloud...")
			url, err := client.Upload(ServerURL, outputPath, session.AccessToken)
			if err != nil {
				fmt.Printf("⚠️ Upload warning: %v (local file preserved)\n", err)
			} else {
				fmt.Printf("🔗 Instant Share URL: %s\n", url)
			}
			os.Exit(0)

		case "upload":
			if len(args) < 2 {
				fmt.Println("💡 Usage: replay upload <file.replay>")
				os.Exit(1)
			}
			fmt.Printf("☁️ Uploading %s...\n", args[1])
			url, err := client.Upload(ServerURL, args[1], session.AccessToken)
			if err != nil {
				fmt.Printf("❌ Upload failed: %v\n", err)
				os.Exit(1)
			}
			fmt.Printf("🔗 Live Web Replay: %s\n", url)
			os.Exit(0)
		}

	default:
		fmt.Printf("❓ Unknown command '%s'. Run 'replay help' to see all available commands.\n", args[0])
		os.Exit(1)
	}
}

func printHelp() {
	const (
		Reset   = "\033[0m"
		Bold    = "\033[1m"
		Dim     = "\033[2m"
		Cyan    = "\033[38;5;39m"  // Premium Electric Cyan
		Indigo  = "\033[38;5;63m"  // Deep Brand Accent
		Mint    = "\033[38;5;78m"  // Success Mint
		Amber   = "\033[38;5;214m" // Warning Amber
		Purple  = "\033[38;5;141m" // AI Vivid Purple
		Gray    = "\033[38;5;242m" // Subdued Metadata
	)

	// High-Impact Sleek Header
	fmt.Print(Indigo + Bold)
	fmt.Println(`    ____                 __              `)
	fmt.Println(`   / __ \___  ____  ____/ /___ ___  __  `)
	fmt.Println(`  / /_/ / _ \/ __ \/ __  / __ \__ \/ / / /`)
	fmt.Print(Cyan + Bold)
	fmt.Println(` / _, _/  __/ /_/ / /_/ / /_/ / / / /_/ / `)
	fmt.Println(`/_/ |_|\___/ .___/\__,_/\__,_/_/ /_/\__, /  `)
	fmt.Println(`          /_/                      /____/   ` + Reset)

	fmt.Printf(" %sDeveloper-First Terminal Session Engine%s  %s[v%s]%s\n\n", Dim, Reset, Gray, Version, Reset)

	// Usage Syntax
	fmt.Printf("%sUSAGE%s\n", Bold+Cyan, Reset)
	fmt.Printf("  $ %sreplay%s %s<command>%s %s[flags]%s %s[args]%s\n\n", Bold+Mint, Reset, Bold, Reset, Dim, Reset, Dim, Reset)

	// Core Recording & Playback Group
	fmt.Printf("%sSESSION RECORDING & PLAYBACK%s\n", Bold+Cyan, Reset)
	fmt.Printf("  %s%-22s%s %sRecord active shell with live telemetry & DLP protection%s\n", Mint, "record [file.replay]", Reset, Dim, Reset)
	fmt.Printf("  %s%-22s%s %sReplay session locally in terminal with speed control%s\n", Mint, "play <file> [speed]", Reset, Dim, Reset)
	fmt.Printf("  %s%-22s%s %sUpload local session stream to web cloud player%s\n", Mint, "upload <file.replay>", Reset, Dim, Reset)
	fmt.Println()

	// AI & Forking Capabilities
	fmt.Printf("%sAI & TIME-TRAVEL FORKING%s\n", Bold+Cyan, Reset)
	fmt.Printf("  %s%-22s%s %sJump into recorded state subshell at target time%s\n", Purple, "fork <file> [timestamp]", Reset, Dim, Reset)
	fmt.Println()

	// System & Authentication Group
	fmt.Printf("%sACCOUNT & SYSTEM%s\n", Bold+Cyan, Reset)
	fmt.Printf("  %s%-22s%s %sAuthenticate CLI with web dashboard account%s\n", Amber, "login", Reset, Dim, Reset)
	fmt.Printf("  %s%-22s%s %sShow version specs & server target endpoints%s\n", Amber, "version", Reset, Dim, Reset)
	fmt.Printf("  %s%-22s%s %sDisplay this interactive engine documentation%s\n", Amber, "help", Reset, Dim, Reset)
	fmt.Println()

	// Flags breakdown
	fmt.Printf("%sRECORD FLAGS%s\n", Bold+Cyan, Reset)
	fmt.Printf("  %s%-22s%s %sDisable keystroke input logging%s\n", Gray, "--no-input", Reset, Dim, Reset)
	fmt.Printf("  %s%-22s%s %sBypass real-time DLP secret redactor%s\n", Gray, "--no-scrub", Reset, Dim, Reset)
	fmt.Println()

	// Pro-Tips & Examples
	fmt.Printf("%sEXAMPLES%s\n", Bold+Cyan, Reset)
	fmt.Printf("  %s$ replay record demo.replay%s             %s# Record & auto-upload to cloud%s\n", Bold, Reset, Dim, Reset)
	fmt.Printf("  %s$ replay fork demo.replay 12.5%s          %s# Launch subshell at 12.5s mark%s\n", Bold, Reset, Dim, Reset)
	fmt.Printf("  %s$ replay play demo.replay 2.0%s           %s# Fast-forward playback at 2x speed%s\n", Bold, Reset, Dim, Reset)
	fmt.Println()

	// Footer Link
	fmt.Printf("%sDOCUMENTATION & COMMUNITY%s\n", Bold, Reset)
	fmt.Printf("  🌐 Web App & Replays: %shttps://replay.space%s\n\n", Cyan, Reset)
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