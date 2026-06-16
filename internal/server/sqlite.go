package server

import (
	"database/sql"
	"errors"
	"github.com/Nathanim1919/replay/internal/domain"
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
	_, err = db.Exec(createRecordingsTable)
	if err != nil {
		return nil, err
	}
	_, err = db.Exec(createUsersTable)
	if err != nil {
		return nil, err
	}
	return &SQLiteStore{db: db}, nil
}

// Create table statements
const createRecordingsTable = `
		CREATE TABLE IF NOT EXISTS recordings (
			id TEXT PRIMARY KEY,
			shortcode TEXT UNIQUE NOT NULL,
			title TEXT,
			user_id TEXT,
			duration REAL,
			width INTEGER,
			height INTEGER,
			shell TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
`

const createUsersTable = `
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			name TEXT,
			email TEXT UNIQUE,
			password TEXT
		)
`

func (s *SQLiteStore) SaveRecording(recording *Recording) error {
	_, err := s.db.Exec("INSERT INTO recordings (id, shortcode, title, user_id, duration, width, height, shell, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", recording.ID, recording.Shortcode, recording.Title, recording.UserID, recording.Duration, recording.Width, recording.Height, recording.Shell, recording.CreatedAt)
	if err != nil {
		return err
	}
	return nil
}

func (s *SQLiteStore) ListRecordings(userId string) ([]Recording, error) {
	rows, err := s.db.Query("SELECT id, shortcode, title, user_id, duration, width, height, shell, created_at FROM recordings WHERE user_id = ?", userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var recordings []Recording
	for rows.Next() {
		var recording Recording
		err := rows.Scan(&recording.ID, &recording.Shortcode, &recording.Title, &recording.UserID, &recording.Duration, &recording.Width, &recording.Height, &recording.Shell, &recording.CreatedAt)

		if err != nil {
			return nil, err
		}
		recordings = append(recordings, recording)
	}
	return recordings, nil
}

func (s *SQLiteStore) GetRecordingByShortcode(shortcode string) (*Recording, error) {
	row := s.db.QueryRow("SELECT id, shortcode, title, user_id, duration, width, height, shell, created_at FROM recordings WHERE shortcode = ?", shortcode)

	var recording Recording
	err := row.Scan(&recording.ID, &recording.Shortcode, &recording.Title, &recording.UserID, &recording.Duration, &recording.Width, &recording.Height, &recording.Shell, &recording.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil // No recording found
	}
	if err != nil {
		return nil, err // real error
	}
	return &recording, nil // Success
}


func (s *SQLiteStore) UpdateRecording(recording *Recording) error {
	_, err := s.db.Exec("UPDATE recordings SET title = ? WHERE id = ?", recording.Title, recording.ID)
	if err != nil {
		return err
	}
	return nil
}


func (s *SQLiteStore) GetRecordingById(id string) (*Recording, error) {
	row := s.db.QueryRow("SELECT id, shortcode, title, user_id, duration, width, height, shell, created_at FROM recordings WHERE id = ?", id)

	var recording Recording
	err := row.Scan(&recording.ID, &recording.Shortcode, &recording.Title, &recording.UserID, &recording.Duration, &recording.Width, &recording.Height, &recording.Shell, &recording.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil // No recording found
	}
	if err != nil {
		return nil, err // real error
	}
	return &recording, nil // Success
}

func (s *SQLiteStore) CreateUser(user *domain.User) error {
	_, err := s.db.Exec("INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)", user.ID, user.Name, user.Email, user.PasswordHash)
	return err
}

func (s *SQLiteStore) GetUserById(userId string) (*domain.User, error) {
	row := s.db.QueryRow("SELECT id, name, email, password FROM users WHERE id = ?", userId)

	var user domain.User
	err := row.Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *SQLiteStore) GetUserByEmail(email string) (*domain.User, error) {
	row := s.db.QueryRow("SELECT id, name, email, password FROM users WHERE email = ?", email)

	var user domain.User
	err := row.Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}
