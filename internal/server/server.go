package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"time"

	"github.com/Nathanim1919/replay/internal/format"
	"github.com/google/uuid"
)

// HTTP server

type Server struct {
	sessionStore SessionStore
	blobStore    BlobStore
}

func NewServer(sessionStore SessionStore, blobStore BlobStore) *Server {
	return &Server{sessionStore: sessionStore, blobStore: blobStore}
}

func (s *Server) Router() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/upload", s.handleUpload)
	mux.HandleFunc("GET /api/sessions", s.handleListSession)
	mux.HandleFunc("GET /api/sessions/{shortcode}", s.handleGetSession)
	return mux
}

func (s *Server) handleUpload(w http.ResponseWriter, r *http.Request) {
	// read the entire request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Find the first newline
	idx := bytes.IndexByte(body, '\n')
	if idx == -1 {
		http.Error(w, "Invalid replay file", http.StatusBadRequest)
		return
	}

	// Parse header from the first line
	var header format.Header
	err = json.Unmarshal(body[:idx], &header)
	if err != nil {
		http.Error(w, "Invalid replay header", http.StatusBadRequest)
		return
	}

	// generate a shortcode
	shortcode := generateShortcode(8)

	err = s.blobStore.SaveFile(shortcode, body)
	if err != nil {
		http.Error(w, "Failed to save replay file", http.StatusInternalServerError)
		return
	}

	title := header.Title
	if title == "" {
		title = "Untitled"
	}

	err = s.sessionStore.SaveSession(&Session{
		ID:        uuid.New().String(),
		Shortcode: shortcode,
		Title:     title,
		Duration:  header.Duration,
		Width:     header.Width,
		Height:    header.Height,
		Shell:     header.Shell,
		CreatedAt: time.Now(),
	})
	if err != nil {
		http.Error(w, "Failed to save session", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"shortcode": shortcode,
		"url":       fmt.Sprintf("http://localhost:3000/s/%s", shortcode),
	})

}
func (s *Server) handleListSession(w http.ResponseWriter, r *http.Request) {
	sessions, err := s.sessionStore.ListSessions()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sessions)
}
func (s *Server) handleGetSession(w http.ResponseWriter, r *http.Request) {
	shortcode := r.PathValue("shortcode")
	data, err := s.blobStore.GetFile(shortcode)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/octet-stream")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func generateShortcode(length int) string {
	charset := "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}
