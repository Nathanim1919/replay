package server

import "time"

type User struct {
	ID       string `json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Password string `json:"-"` // Hashed password, not exposed in JSON
}

type Recording struct {
	ID        string    `json:"id"`
	Shortcode string    `json:"shortcode"`
	UserID    string    `json:"user_id"`
	Title     string    `json:"title"`
	Duration  float64   `json:"duration"`
	Width     int       `json:"width"`
	Height    int       `json:"height"`
	Shell     string    `json:"shell"`
	CreatedAt time.Time `json:"created_at"`
}

type RecordingStore interface {
	SaveRecording(recording *Recording) error
	ListRecordings() ([]Recording, error)
	GetRecordingByShortcode(shortcode string) (*Recording, error)
	// GetRecordingByID(id string) (*Recording, error)
}

type BlobStore interface {
	SaveFile(shortcode string, data []byte) error
	GetFile(shortcode string) ([]byte, error)
}
