package server

import (
	"database/sql"
	_ "modernc.org/sqlite" // Import sqlite driver
)

type SQLiteStore struct {
	db *sql.DB
}

func NewSQLiteStore(path string) (*SQLiteStore, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	_, err = db.Exec(createSessionsTable)
	if err != nil {
		return nil, err
	}
	return &SQLiteStore{db: db}, nil
}

// Create table statements
const createSessionsTable = `
CREATE TABLE IF NOT EXISTS sessions (
	id TEXT PRIMARY KEY,
	shortcode TEXT UNIQUE NOT NULL,
	title TEXT,
	duration REAL,
	width INTEGER,
	height INTEGER,
	shell TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`

func (s *SQLiteStore) SaveSession(session *Session) error {
	_, err := s.db.Exec("INSERT INTO sessions (id, shortcode, title, duration, width, height, shell, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", session.ID, session.Shortcode, session.Title, session.Duration, session.Width, session.Height, session.Shell, session.CreatedAt)
	if err != nil {
		return err
	}
	return nil
}

func (s *SQLiteStore) ListSessions() ([]Session, error) {
	rows, err := s.db.Query("SELECT id, shortcode, title, duration, width, height, shell, created_at FROM sessions")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []Session
	for rows.Next() {
		var session Session
		err := rows.Scan(&session.ID, &session.Shortcode, &session.Title, &session.Duration, &session.Width, &session.Height, &session.Shell, &session.CreatedAt)

		if err != nil {
			return nil, err
		}
		sessions = append(sessions, session)
	}
	return sessions, nil
}

func (s *SQLiteStore) GetSessionByShortcode(shortcode string) (*Session, error) {
	row := s.db.QueryRow("SELECT id, shortcode, title, duration, width, height, shell, created_at FROM sessions WHERE shortcode = ?", shortcode)

	var session Session
	err := row.Scan(&session.ID, &session.Shortcode, &session.Title, &session.Duration, &session.Width, &session.Height, &session.Shell, &session.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil // No session found
	}
	if err != nil {
		return nil, err // real error
	}
	return &session, nil // Success
}
