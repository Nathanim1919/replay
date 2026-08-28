package ai

import (
	"testing"
)

func TestAnalyzeSessionStream(t *testing.T) {
	rawReplay := []byte(`{"version":1,"width":80,"height":24,"timestamp":1700000000,"duration":10,"shell":"/bin/bash","title":"Build Demo"}
[0.1,"o","nathanim@dreamer-space:~$ cd /tmp\r\n"]
[0.5,"o","nathanim@dreamer-space:/tmp$ go build -o bin/app ./...\r\n"]
[1.2,"o","error: failed to resolve dependency\r\n"]
[2.0,"o","nathanim@dreamer-space:/tmp$ exit\r\n"]
`)

	analysis, err := AnalyzeSessionStream(rawReplay)
	if err != nil {
		t.Fatalf("AnalyzeSessionStream failed: %v", err)
	}

	if analysis.Title != "Build Demo" {
		t.Errorf("Expected title 'Build Demo', got '%s'", analysis.Title)
	}

	if analysis.ErrorCount == 0 {
		t.Errorf("Expected errorCount > 0, got %d", analysis.ErrorCount)
	}

	if len(analysis.Commands) == 0 {
		t.Errorf("Expected extracted commands, got 0")
	}

	t.Logf("Extracted Title: %s", analysis.Title)
	t.Logf("Extracted Summary: %s", analysis.Summary)
	t.Logf("Extracted Commands: %v", analysis.Commands)
	t.Logf("Error Count: %d", analysis.ErrorCount)
}
