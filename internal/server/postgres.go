package server

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/Nathanim1919/replay/internal/domain"
	_ "github.com/lib/pq"
)

type PostgresStore struct {
	db *sql.DB
}

// NewPostgresStore connects to PostgreSQL database and initializes schema.
func NewPostgresStore(connStr string) (*PostgresStore, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed opening postgres connection: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed pinging postgres database: %w", err)
	}

	s := &PostgresStore{db: db}
	if err := s.initSchema(); err != nil {
		return nil, fmt.Errorf("failed initializing postgres schema: %w", err)
	}

	return s, nil
}

func (s *PostgresStore) initSchema() error {
	// 1. Attempt enabling pgvector extension (non-fatal if pgvector is not installed locally)
	_, _ = s.db.Exec("CREATE EXTENSION IF NOT EXISTS vector;")

	// 2. Create recordings table
	createRecordings := `
		CREATE TABLE IF NOT EXISTS recordings (
			id VARCHAR(64) PRIMARY KEY,
			shortcode VARCHAR(32) UNIQUE NOT NULL,
			title TEXT,
			user_id VARCHAR(64),
			duration DOUBLE PRECISION DEFAULT 0.0,
			width INT DEFAULT 80,
			height INT DEFAULT 24,
			shell VARCHAR(128),
			created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
		);
		CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON recordings(user_id);
		CREATE INDEX IF NOT EXISTS idx_recordings_shortcode ON recordings(shortcode);
	`
	if _, err := s.db.Exec(createRecordings); err != nil {
		return err
	}

	// 3. Create users table
	createUsers := `
		CREATE TABLE IF NOT EXISTS users (
			id VARCHAR(64) PRIMARY KEY,
			name VARCHAR(128),
			email VARCHAR(255) UNIQUE NOT NULL,
			password TEXT NOT NULL,
			created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
		);
		CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
	`
	if _, err := s.db.Exec(createUsers); err != nil {
		return err
	}

	return nil
}

func (s *PostgresStore) SaveRecording(recording *Recording) error {
	query := `
		INSERT INTO recordings (id, shortcode, title, user_id, duration, width, height, shell, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	createdAt := recording.CreatedAt
	if createdAt.IsZero() {
		createdAt = time.Now()
	}

	_, err := s.db.Exec(query,
		recording.ID,
		recording.Shortcode,
		recording.Title,
		recording.UserID,
		recording.Duration,
		recording.Width,
		recording.Height,
		recording.Shell,
		createdAt,
	)
	return err
}

func (s *PostgresStore) UpdateRecording(recording *Recording) error {
	query := `UPDATE recordings SET title = $1 WHERE id = $2`
	_, err := s.db.Exec(query, recording.Title, recording.ID)
	return err
}

func (s *PostgresStore) DeleteRecording(id string, userID string) error {
	query := `DELETE FROM recordings WHERE id = $1 AND user_id = $2`
	_, err := s.db.Exec(query, id, userID)
	return err
}

func (s *PostgresStore) ListRecordings(userID string) ([]Recording, error) {
	query := `
		SELECT id, shortcode, title, user_id, duration, width, height, shell, created_at
		FROM recordings
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var recordings []Recording
	for rows.Next() {
		var rec Recording
		err := rows.Scan(
			&rec.ID,
			&rec.Shortcode,
			&rec.Title,
			&rec.UserID,
			&rec.Duration,
			&rec.Width,
			&rec.Height,
			&rec.Shell,
			&rec.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		recordings = append(recordings, rec)
	}

	return recordings, nil
}

func (s *PostgresStore) GetRecordingByShortcode(shortcode string) (*Recording, error) {
	query := `
		SELECT id, shortcode, title, user_id, duration, width, height, shell, created_at
		FROM recordings
		WHERE shortcode = $1
	`
	row := s.db.QueryRow(query, shortcode)

	var rec Recording
	err := row.Scan(
		&rec.ID,
		&rec.Shortcode,
		&rec.Title,
		&rec.UserID,
		&rec.Duration,
		&rec.Width,
		&rec.Height,
		&rec.Shell,
		&rec.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &rec, nil
}

func (s *PostgresStore) GetRecordingById(id string) (*Recording, error) {
	query := `
		SELECT id, shortcode, title, user_id, duration, width, height, shell, created_at
		FROM recordings
		WHERE id = $1
	`
	row := s.db.QueryRow(query, id)

	var rec Recording
	err := row.Scan(
		&rec.ID,
		&rec.Shortcode,
		&rec.Title,
		&rec.UserID,
		&rec.Duration,
		&rec.Width,
		&rec.Height,
		&rec.Shell,
		&rec.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &rec, nil
}

func (s *PostgresStore) CreateUser(user *domain.User) error {
	query := `INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4)`
	_, err := s.db.Exec(query, user.ID, user.Name, user.Email, user.PasswordHash)
	return err
}

func (s *PostgresStore) GetUserById(userId string) (*domain.User, error) {
	query := `SELECT id, name, email, password FROM users WHERE id = $1`
	row := s.db.QueryRow(query, userId)

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

func (s *PostgresStore) GetUserByEmail(email string) (*domain.User, error) {
	query := `SELECT id, name, email, password FROM users WHERE email = $1`
	row := s.db.QueryRow(query, email)

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

// Close gracefully closes PostgreSQL database connection.
func (s *PostgresStore) Close() error {
	return s.db.Close()
}
