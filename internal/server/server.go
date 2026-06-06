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
	"github.com/Nathanim1919/replay/internal/server/auth"
	"github.com/google/uuid"
)

// HTTP server

type Server struct {
	sessionStore RecordingStore
	blobStore    BlobStore
	authHandler  authHandler
}

type authHandler interface {
	Register(http.ResponseWriter, *http.Request)
	Login(http.ResponseWriter, *http.Request)
	Me(http.ResponseWriter, *http.Request)
	DeviceInit(http.ResponseWriter, *http.Request)
	DevicePoll(http.ResponseWriter, *http.Request)
	DeviceApprove(http.ResponseWriter, *http.Request)
}

func NewServer(sessionStore RecordingStore, blobStore BlobStore, authHandler authHandler) *Server {
	return &Server{sessionStore: sessionStore, blobStore: blobStore, authHandler: authHandler}
}

// Example of custom CORSMiddleware function
func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent) // ✅ Explicitly return 204 for OPTIONS
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) Router() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/upload", s.handleUpload)
	mux.HandleFunc("GET /api/recordings", s.handleListRecording)
	mux.HandleFunc("GET /api/recordings/{shortcode}", s.handleGetRecording)
	mux.HandleFunc("POST /api/auth/device/init", s.authHandler.DeviceInit)
	mux.HandleFunc("POST /api/auth/device/poll", s.authHandler.DevicePoll)
	mux.HandleFunc("POST /api/auth/device/approve", s.authHandler.DeviceApprove)
	mux.HandleFunc("POST /api/auth/register", s.authHandler.Register)
	mux.HandleFunc("POST /api/auth/login", s.authHandler.Login)
	mux.Handle("GET /api/auth/me", auth.AuthMiddleware(http.HandlerFunc(s.authHandler.Me)))
	mux.HandleFunc("/auth/register", s.authHandler.Register)
	mux.HandleFunc("/auth/login", s.authHandler.Login)
	mux.Handle("/auth/me",
		auth.AuthMiddleware(http.HandlerFunc(s.authHandler.Me)),
	)
	return cors(mux)
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

	err = s.sessionStore.SaveRecording(&Recording{
		ID:        uuid.New().String(),
		Shortcode: shortcode,
		Title:     title,
		// UserID:    header.UserID, // Assuming UserID is part of the header
		Duration:  header.Duration,
		Width:     header.Width,
		Height:    header.Height,
		Shell:     header.Shell,
		CreatedAt: time.Now(),
	})
	if err != nil {
		http.Error(w, "Failed to save recording", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"shortcode": shortcode,
		"url":       fmt.Sprintf("http://localhost:3000/s/%s", shortcode),
	})

}
func (s *Server) handleListRecording(w http.ResponseWriter, r *http.Request) {
	recordings, err := s.sessionStore.ListRecordings()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(recordings)
}
func (s *Server) handleGetRecording(w http.ResponseWriter, r *http.Request) {
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
