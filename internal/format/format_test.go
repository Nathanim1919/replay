package format

import (
	"io"
	"os"
	"path/filepath"
	"testing"
)

func TestRoundTrip(t *testing.T) {
	path := filepath.Join(os.TempDir(), "test.replay")
	defer os.Remove(path)

	// --- WRITE ---
	writer, err := NewReplayWriter(path)
	if err != nil {
		t.Fatalf("failed to create writer: %v", err)
	}

	header := Header{
		Version:   1,
		Width:     80,
		Height:    24,
		Timestamp: 1717243800,
		Duration:  60.5,
		Shell:     "/bin/bash",
	}
	err = writer.WriteHeader(header)
	if err != nil {
		t.Fatalf("failed to write header: %v", err)
	}

	event1 := Event{
		Time:    0.5,
		Type:    EventOutput,
		RawData: []byte("hello world\r\n"),
	}
	err = writer.WriteEvent(event1)
	if err != nil {
		t.Fatalf("failed to write event1: %v", err)
	}

	event2 := Event{
		Time: 5.0,
		Type: EventResize,
		Size: &TerminalSize{Width: 120, Height: 40},
	}
	err = writer.WriteEvent(event2)
	if err != nil {
		t.Fatalf("failed to write event2: %v", err)
	}

	event3 := Event{
		Time:   10.0,
		Type:   EventMarker,
		Marker: &MarkerData{Label: "bug found"},
	}
	err = writer.WriteEvent(event3)
	if err != nil {
		t.Fatalf("failed to write event3: %v", err)
	}

	err = writer.Close()
	if err != nil {
		t.Fatalf("failed to close writer: %v", err)
	}

	// --- READ ---
	reader, err := NewReplayReader(path)
	if err != nil {
		t.Fatalf("failed to create reader: %v", err)
	}
	defer reader.Close()

	gotHeader, err := reader.ReadHeader()
	if err != nil {
		t.Fatalf("failed to read header: %v", err)
	}
	if gotHeader.Version != header.Version {
		t.Errorf("version: got %d, want %d", gotHeader.Version, header.Version)
	}
	if gotHeader.Width != header.Width {
		t.Errorf("width: got %d, want %d", gotHeader.Width, header.Width)
	}
	if gotHeader.Height != header.Height {
		t.Errorf("height: got %d, want %d", gotHeader.Height, header.Height)
	}
	if gotHeader.Duration != header.Duration {
		t.Errorf("duration: got %f, want %f", gotHeader.Duration, header.Duration)
	}

	// Event 1: output
	gotEvent1, err := reader.ReadEvent()
	if err != nil {
		t.Fatalf("failed to read event1: %v", err)
	}
	if gotEvent1.Type != EventOutput {
		t.Errorf("event1 type: got %q, want %q", gotEvent1.Type, EventOutput)
	}
	if gotEvent1.Time != 0.5 {
		t.Errorf("event1 time: got %f, want %f", gotEvent1.Time, 0.5)
	}
	if string(gotEvent1.RawData) != string(event1.RawData) {
		t.Errorf("event1 data: got %q, want %q", gotEvent1.RawData, event1.RawData)
	}

	// Event 2: resize
	gotEvent2, err := reader.ReadEvent()
	if err != nil {
		t.Fatalf("failed to read event2: %v", err)
	}
	if gotEvent2.Type != EventResize {
		t.Errorf("event2 type: got %q, want %q", gotEvent2.Type, EventResize)
	}
	if gotEvent2.Size == nil {
		t.Fatalf("event2 size is nil")
	}
	if gotEvent2.Size.Width != 120 {
		t.Errorf("event2 width: got %d, want %d", gotEvent2.Size.Width, 120)
	}
	if gotEvent2.Size.Height != 40 {
		t.Errorf("event2 height: got %d, want %d", gotEvent2.Size.Height, 40)
	}

	// Event 3: marker
	gotEvent3, err := reader.ReadEvent()
	if err != nil {
		t.Fatalf("failed to read event3: %v", err)
	}
	if gotEvent3.Type != EventMarker {
		t.Errorf("event3 type: got %q, want %q", gotEvent3.Type, EventMarker)
	}
	if gotEvent3.Marker == nil {
		t.Fatalf("event3 marker is nil")
	}
	if gotEvent3.Marker.Label != "bug found" {
		t.Errorf("event3 label: got %q, want %q", gotEvent3.Marker.Label, "bug found")
	}

	// EOF
	_, err = reader.ReadEvent()
	if err != io.EOF {
		t.Errorf("expected io.EOF, got %v", err)
	}
}
