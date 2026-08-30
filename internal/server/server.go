package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"sync"
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
	Logout(http.ResponseWriter, *http.Request)
	Me(http.ResponseWriter, *http.Request)
	DeviceInit(http.ResponseWriter, *http.Request)
	DevicePoll(http.ResponseWriter, *http.Request)
	DeviceApprove(http.ResponseWriter, *http.Request)
}

func NewServer(sessionStore RecordingStore, blobStore BlobStore, authHandler authHandler) *Server {
	return &Server{sessionStore: sessionStore, blobStore: blobStore, authHandler: authHandler}
}

func getWebURL() string {
	if url := os.Getenv("WEB_URL"); url != "" {
		return url
	}
	return "https://replay.nathanim.dev"
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			w.Header().Set("Access-Control-Allow-Origin", getWebURL())
		}
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) Router() http.Handler {
    mux := http.NewServeMux()
    mux.Handle("POST /api/upload", auth.AuthMiddleware(http.HandlerFunc(s.handleUpload)))
    mux.Handle("GET /api/recordings", auth.AuthMiddleware(http.HandlerFunc(s.handleListRecording)))
    mux.HandleFunc("GET /api/recordings/public", s.handlePublicRecordings)
    mux.HandleFunc("GET /api/recordings/{shortcode}", s.handleGetRecording)
    mux.Handle("PUT /api/recordings/{id}", auth.AuthMiddleware(http.HandlerFunc(s.handleUpdateRecording)))
    mux.Handle("DELETE /api/recordings/{id}", auth.AuthMiddleware(http.HandlerFunc(s.handleDeleteRecording)))
    
    // Auth endpoints
    mux.HandleFunc("POST /api/auth/device/init", s.authHandler.DeviceInit)
    mux.HandleFunc("POST /api/auth/device/poll", s.authHandler.DevicePoll)
    
    // 1. WRAP THIS ROUTE WITH THE MIDDLEWARE
    mux.Handle("POST /api/auth/device/approve", auth.AuthMiddleware(http.HandlerFunc(s.authHandler.DeviceApprove)))
    
    mux.HandleFunc("POST /api/auth/signup", s.authHandler.Register)
    mux.HandleFunc("POST /api/auth/login", s.authHandler.Login)
	mux.HandleFunc("POST /api/auth/logout", s.authHandler.Logout)
    mux.Handle("GET /api/auth/me", auth.AuthMiddleware(http.HandlerFunc(s.authHandler.Me)))
    
    // ... rest of your router
    return cors(mux)
}

func (s *Server) handleUpload(w http.ResponseWriter, r *http.Request) {
	// read the entire request body
	body, err := io.ReadAll(r.Body)
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok {
		fmt.Println("No claims found in context")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	fmt.Printf("Authenticated user ID from claims: %s\n", claims.UserID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// If body is Zstd compressed, decompress to extract metadata header
	uncompressedBody := body
	if format.IsZstdCompressed(body) {
		decomp, err := format.DecompressZstd(body)
		if err == nil {
			uncompressedBody = decomp
		}
	}

	// Find the first newline
	idx := bytes.IndexByte(uncompressedBody, '\n')
	if idx == -1 {
		http.Error(w, "Invalid replay file", http.StatusBadRequest)
		return
	}

	// Parse header from the first line
	var header format.Header
	err = json.Unmarshal(uncompressedBody[:idx], &header)
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

	autoTags := ExtractAutoTags(header, uncompressedBody)

	err = s.sessionStore.SaveRecording(&Recording{
		ID:        uuid.New().String(),
		Shortcode: shortcode,
		Title:     title,
		Tags:      autoTags,
		UserID:    claims.UserID, // Use the authenticated user ID
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

	fmt.Printf("Saved recording: %s (shortcode: %s) UserID: %s Tags: %v\n", title, shortcode, claims.UserID, autoTags)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"shortcode": shortcode,
		"url":       fmt.Sprintf("%s/s/%s", getWebURL(), shortcode),
	})

}
func (s *Server) handleListRecording(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok {
		fmt.Println("No claims found in context")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	fmt.Printf("Authenticated user ID from claims: %s\n", claims.UserID)
	recordings, err := s.sessionStore.ListRecordings(claims.UserID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    var wg sync.WaitGroup
    sem := make(chan struct{}, 4) // Limit concurrency to 4

    for i := range recordings {
        wg.Add(1)
        
        // Pass a direct pointer to the specific recording element in the slice
        go func(rec *Recording) {
            defer wg.Done()
            sem <- struct{}{}
            defer func() { <-sem }()

            // Fetch the file using the specific recording's shortcode
            preview, err := s.blobStore.GetFile(rec.Shortcode)
            if err != nil {
                // Log the error if needed, but don't crash the server
                return
            }
            
            // Safely assign the preview data directly to this element
            rec.Preview = preview
        }(&recordings[i]) // <--- Passing the pointer to the exact index element
    }
    wg.Wait()

    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(recordings)
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


func (s *Server) handleUpdateRecording(w http.ResponseWriter, r *http.Request) {
	// get the recording ID from the URL path
	id := r.PathValue("id")
	record, err := s.sessionStore.GetRecordingById(id)
	if err != nil || record == nil {
		http.Error(w, "Recording not found", http.StatusNotFound)
		return
	}

	// parse the request body for updated title and tags
	var req struct {
		Title string   `json:"title"`
		Tags  []string `json:"tags"`
	}

	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Title != "" {
		record.Title = req.Title
	}
	if req.Tags != nil {
		record.Tags = req.Tags
	}

	// save the updated recording back to the store
	err = s.sessionStore.UpdateRecording(record)
	if err != nil {
		fmt.Printf("Failed to update recording: %v\n", err.Error())
		http.Error(w, "Failed to update recording", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleDeleteRecording(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	id := r.PathValue("id")
	record, err := s.sessionStore.GetRecordingById(id)
	if err != nil || record == nil {
		http.Error(w, "Recording not found", http.StatusNotFound)
		return
	}

	if record.UserID != claims.UserID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	if err := s.sessionStore.DeleteRecording(id, claims.UserID); err != nil {
		http.Error(w, "Failed to delete recording", http.StatusInternalServerError)
		return
	}

	_ = s.blobStore.DeleteFile(record.Shortcode)
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handlePublicRecordings(w http.ResponseWriter, r *http.Request) {
	recordings, err := s.sessionStore.ListPublicRecordings(50)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var wg sync.WaitGroup
	sem := make(chan struct{}, 4)

	for i := range recordings {
		wg.Add(1)
		go func(rec *Recording) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			preview, err := s.blobStore.GetFile(rec.Shortcode)
			if err != nil {
				return
			}
			rec.Preview = preview
		}(&recordings[i])
	}
	wg.Wait()

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(recordings)
}


func generateShortcode(length int) string {
	charset := "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}
