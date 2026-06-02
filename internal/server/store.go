package server

import "time"

type Session struct {
	ID        string    `json:"id"`
	Shortcode string    `json:"shortcode"`
	Title     string    `json:"title"`
	Duration  float64   `json:"duration"`
	Width     int       `json:"width"`
	Height    int       `json:"height"`
	Shell     string    `json:"shell"`
	CreatedAt time.Time `json:"created_at"`
}

type SessionStore interface {
	SaveSession(session *Session) error
	ListSessions() ([]Session, error)
	GetSessionByShortcode(shortcode string) (*Session, error)
	// GetSessionByID(id string) (*Session, error)
}

type BlobStore interface {
	SaveFile(shortcode string, data []byte) error
	GetFile(shortcode string) ([]byte, error)
}
