package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"github.com/Nathanim1919/replay/internal/format"
)

// SessionAnalysis holds AI-extracted insights and structured metadata from a recording stream.
type SessionAnalysis struct {
	Title       string   `json:"title"`
	Summary     string   `json:"summary"`
	Commands    []string `json:"commands"`
	ErrorCount  int      `json:"error_count"`
	DetectedOS  string   `json:"detected_os,omitempty"`
	Environment string   `json:"environment,omitempty"`
}

var promptPattern = regexp.MustCompile(`(?m)^[a-zA-Z0-9_\-\.]+@[a-zA-Z0-9_\-\.]+:.*[\$#]\s*(.+)`)

// AnalyzeSessionStream parses a raw .replay stream and extracts executed commands, summaries, and errors.
func AnalyzeSessionStream(data []byte) (*SessionAnalysis, error) {
	decompressed, err := format.DecompressZstd(data)
	if err != nil {
		return nil, fmt.Errorf("failed decompressing replay stream for AI analysis: %w", err)
	}

	lines := bytes.Split(decompressed, []byte("\n"))
	if len(lines) == 0 {
		return nil, fmt.Errorf("empty replay stream")
	}

	var header format.Header
	if err := json.Unmarshal(lines[0], &header); err != nil {
		return nil, fmt.Errorf("invalid header: %w", err)
	}

	var rawOutput strings.Builder
	var commands []string
	cmdMap := make(map[string]bool)
	errorCount := 0

	errorKeywords := []string{"error", "failed", "fatal", "exception", "command not found", "exit code 1"}

	for _, line := range lines[1:] {
		line = bytes.TrimSpace(line)
		if len(line) == 0 {
			continue
		}

		var event format.Event
		if err := json.Unmarshal(line, &event); err != nil {
			continue
		}

		if event.Type == format.EventOutput {
			text := string(event.RawData)
			rawOutput.WriteString(text)

			lower := strings.ToLower(text)
			for _, kw := range errorKeywords {
				if strings.Contains(lower, kw) {
					errorCount++
					break
				}
			}
		}
	}

	fullText := rawOutput.String()

	// Extract prompt lines
	matches := promptPattern.FindAllStringSubmatch(fullText, -1)
	for _, match := range matches {
		if len(match) > 1 {
			cmd := strings.TrimSpace(match[1])
			if cmd != "" && !cmdMap[cmd] {
				cmdMap[cmd] = true
				commands = append(commands, cmd)
			}
		}
	}

	// Generate smart executive summary
	summaryText := fmt.Sprintf("Terminal session running %s shell across %d captured output streams.", header.Shell, len(lines)-1)
	if len(commands) > 0 {
		summaryText += fmt.Sprintf(" Executed %d distinct commands including: %s.", len(commands), strings.Join(limitStrings(commands, 3), ", "))
	}

	if errorCount > 0 {
		summaryText += fmt.Sprintf(" Encountered %d potential error log entries.", errorCount)
	}

	title := header.Title
	if title == "" || title == "Untitled" {
		if len(commands) > 0 {
			title = fmt.Sprintf("Session: %s", commands[0])
		} else {
			title = "Terminal Session"
		}
	}

	return &SessionAnalysis{
		Title:      title,
		Summary:    summaryText,
		Commands:   commands,
		ErrorCount: errorCount,
	}, nil
}

func limitStrings(slice []string, max int) []string {
	if len(slice) <= max {
		return slice
	}
	return slice[:max]
}
