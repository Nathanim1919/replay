package server

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/Nathanim1919/replay/internal/format"
)

func TestLocalBlobStorePreviewFile(t *testing.T) {
	dir := t.TempDir()
	store, err := NewLocalBlobStore(dir)
	if err != nil {
		t.Fatalf("NewLocalBlobStore() error = %v", err)
	}

	content := "{\"version\":1,\"width\":80,\"height\":24,\"timestamp\":1,\"duration\":1,\"shell\":\"/bin/bash\"}\n" +
		"[0,\"o\",\"\\u001b[?2004h\\u001b]0;user@host: ~\\u0007$ \"]\n" +
		"[0.1,\"i\",\"ls\\n\"]\n" +
		"[0.2,\"o\",\"file.txt\\r\\n\"]\n"
	path := filepath.Join(dir, "abc123.replay")
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatalf("os.WriteFile() error = %v", err)
	}

	preview, err := store.PreviewReplay("abc123", 2)
	if err != nil {
		t.Fatalf("PreviewReplay() error = %v", err)
	}
	if preview == "" {
		t.Fatal("PreviewReplay() returned empty preview")
	}

	lines := 0
	for _, line := range strings.Split(preview, "\n") {
		if strings.TrimSpace(line) == "" {
			continue
		}
		lines++
	}
	if lines < 2 {
		t.Fatalf("PreviewReplay() returned too few replay lines: %q", preview)
	}

	var header format.Header
	if err := json.Unmarshal([]byte(strings.Split(preview, "\n")[0]), &header); err != nil {
		t.Fatalf("first preview line is not a replay header: %v", err)
	}
	if header.Shell != "/bin/bash" {
		t.Fatalf("PreviewReplay() header = %+v, want shell to survive", header)
	}
}
