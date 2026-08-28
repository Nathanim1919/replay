package format

import (
	"encoding/json"
	"fmt"
)

// write constants for event types
const (
	EventOutput     = "o"
	EventInput      = "i"
	EventResize     = "r"
	EventCheckpoint = "c"
	EventMarker     = "m"
	EventTelemetry  = "p"
)

type TerminalSize struct {
	Width  int
	Height int
}

type TerminalState struct {
	ScreenBuffer string
}

type MarkerData struct {
	Label string
}

type TelemetryData struct {
	PID    int     `json:"pid"`
	CWD    string  `json:"cwd"`
	Cmd    string  `json:"cmd,omitempty"`
	CPU    float64 `json:"cpu_pct,omitempty"`
	Memory float64 `json:"mem_mb,omitempty"`
}

type Event struct {
	Time      float64        // in seconds with sub-millisecond precision
	Type      string
	RawData   []byte         // raw terminal output bytes, for output events
	Size      *TerminalSize  // terminal size, for resize events
	State     *TerminalState // terminal state, for checkpoint events
	Marker    *MarkerData    // marker data, for marker events
	Telemetry *TelemetryData // telemetry data, for process events
}

// write a function to marshal an event to a JSON string
func (e Event) MarshalJSON() ([]byte, error) {
	switch e.Type {
	case "o", "i":
		elements := []any{e.Time, e.Type, string(e.RawData)}
		return json.Marshal(elements)
	case "r":
		elements := []any{e.Time, e.Type, e.Size}
		return json.Marshal(elements)
	case "c":
		elements := []any{e.Time, e.Type, e.State}
		return json.Marshal(elements)
	case "m":
		elements := []any{e.Time, e.Type, e.Marker}
		return json.Marshal(elements)
	case "p":
		elements := []any{e.Time, e.Type, e.Telemetry}
		return json.Marshal(elements)
	default:
		return nil, fmt.Errorf("unknown event type: %s", e.Type)
	}
}

func (e *Event) UnmarshalJSON(data []byte) error {
	var raw []json.RawMessage
	err := json.Unmarshal(data, &raw)
	if err != nil {
		return err
	}

	// check if length is 3
	if len(raw) != 3 {
		return fmt.Errorf("expected 3 elements in array, got %d", len(raw))
	}

	// parse first element into Time
	err = json.Unmarshal(raw[0], &e.Time)
	if err != nil {
		return err
	}

	// parse second element into Type
	err = json.Unmarshal(raw[1], &e.Type)
	if err != nil {
		return err
	}

	// parse third element based on Type
	switch e.Type {
	case "o", "i":
		var s string
		err = json.Unmarshal(raw[2], &s)
		if err != nil {
			return err
		}
		e.RawData = []byte(s)
	case "r":
		e.Size = &TerminalSize{}
		err = json.Unmarshal(raw[2], e.Size)
		if err != nil {
			return err
		}
	case "c":
		e.State = &TerminalState{}
		err = json.Unmarshal(raw[2], e.State)
		if err != nil {
			return err
		}
	case "m":
		e.Marker = &MarkerData{}
		err = json.Unmarshal(raw[2], e.Marker)
		if err != nil {
			return err
		}
	case "p":
		e.Telemetry = &TelemetryData{}
		err = json.Unmarshal(raw[2], e.Telemetry)
		if err != nil {
			return err
		}
	default:
		return fmt.Errorf("unknown event type: %s", e.Type)
	}

	return nil
}
