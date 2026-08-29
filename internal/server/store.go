package server

import "time"

// type User struct {
// 	ID           string
// 	Name         string
// 	Email        string
// 	PasswordHash string
// }

type Recording struct {
	ID        string    `json:"id"`
	Shortcode string    `json:"shortcode"`
	UserID    string    `json:"user_id"`
	Title     string    `json:"title"`
	Tags      []string  `json:"tags"`
	Preview   []byte    `json:"preview,omitempty"`
	Duration  float64   `json:"duration"`
	Width     int       `json:"width"`
	Height    int       `json:"height"`
	Shell     string    `json:"shell"`
	CreatedAt time.Time `json:"created_at"`
}

type RecordingStore interface {
	SaveRecording(recording *Recording) error
	UpdateRecording(recording *Recording) error
	DeleteRecording(id string, userID string) error
	ListRecordings(userID string) ([]Recording, error)
	GetRecordingByShortcode(shortcode string) (*Recording, error)
	GetRecordingById(id string) (*Recording, error)
}

type BlobStore interface {
	SaveFile(shortcode string, data []byte) error
	GetFile(shortcode string) ([]byte, error)
	DeleteFile(shortcode string) error
	PreviewReplay(shortcode string, maxEvents int) (string, error)
}
