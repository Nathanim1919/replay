package format

type Header struct {
	Version     int               `json:"version"`
	Width       int               `json:"width"`
	Height      int               `json:"height"`
	Timestamp   int64             `json:"timestamp"`             // Unix timestamp when recording started
	Duration    float64           `json:"duration"`              // Duration of the recording in seconds
	Shell       string            `json:"shell"`                 // Shell used for recording (e.g. "/bin/bash")
	Term        string            `json:"term,omitempty"`        // Terminal emulator used (e.g. "xterm-256color")
	Title       string            `json:"title,omitempty"`       // Title of the recording (e.g. "debugging api-server crashloop")
	Env         map[string]string `json:"env,omitempty"`         // Environment variables used for recording
	Checkpoints []float64         `json:"checkpoints,omitempty"` // Checkpoints for the recording, timestamps of checkpoint events (table of contents)
}
