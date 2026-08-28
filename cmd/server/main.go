package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/Nathanim1919/replay/internal/domain"
	"github.com/Nathanim1919/replay/internal/server"
	"github.com/Nathanim1919/replay/internal/server/auth"
	"github.com/joho/godotenv"
)

// CombinedStore interface representing both recording store and user store.
type CombinedStore interface {
	SaveRecording(recording *server.Recording) error
	UpdateRecording(recording *server.Recording) error
	ListRecordings(userID string) ([]server.Recording, error)
	GetRecordingByShortcode(shortcode string) (*server.Recording, error)
	GetRecordingById(id string) (*server.Recording, error)

	CreateUser(user *domain.User) error
	GetUserById(userId string) (*domain.User, error)
	GetUserByEmail(email string) (*domain.User, error)
}

func main() {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// 1. Initialize Metadata Store (PostgreSQL vs SQLite)
	dbDriver := os.Getenv("DB_DRIVER")
	var sessionStore CombinedStore
	var err error

	if dbDriver == "postgres" {
		dbURL := os.Getenv("DATABASE_URL")
		if dbURL == "" {
			dbURL = "postgres://postgres:postgres@localhost:5432/replay?sslmode=disable"
		}
		fmt.Printf("Initializing PostgreSQL metadata store (%s)...\n", dbURL)
		sessionStore, err = server.NewPostgresStore(dbURL)
		if err != nil {
			fmt.Printf("Error creating PostgreSQL store: %v\n", err)
			os.Exit(1)
		}
	} else {
		fmt.Println("Initializing SQLite metadata store (sessions.db)...")
		sessionStore, err = server.NewSQLiteStore("sessions.db")
		if err != nil {
			fmt.Printf("Error creating SQLite store: %v\n", err)
			os.Exit(1)
		}
	}

	// 2. Initialize Blob Storage (AWS S3 / R2 / MinIO vs Local Disk)
	blobStorageDriver := os.Getenv("BLOB_STORAGE")
	var blobStore server.BlobStore

	if blobStorageDriver == "s3" {
		s3Cfg := server.S3Config{
			Bucket:    os.Getenv("AWS_S3_BUCKET"),
			Region:    os.Getenv("AWS_REGION"),
			Endpoint:  os.Getenv("AWS_ENDPOINT"),
			AccessKey: os.Getenv("AWS_ACCESS_KEY_ID"),
			SecretKey: os.Getenv("AWS_SECRET_ACCESS_KEY"),
		}
		fmt.Printf("Initializing S3/R2 Blob Store (Bucket: %s, Endpoint: %s)...\n", s3Cfg.Bucket, s3Cfg.Endpoint)
		blobStore, err = server.NewS3BlobStore(s3Cfg, "blobs")
		if err != nil {
			fmt.Printf("Error creating S3 blob store: %v\n", err)
			os.Exit(1)
		}
	} else {
		fmt.Println("Initializing Local Blob Store (blobs/)...")
		blobStore, err = server.NewLocalBlobStore("blobs")
		if err != nil {
			fmt.Printf("Error creating local blob store: %v\n", err)
			os.Exit(1)
		}
	}

	authHandler := &auth.Handler{
		Service:     &auth.Service{Users: sessionStore},
		DeviceStore: auth.NewDeviceAuthStore(),
	}

	svr := server.NewServer(sessionStore, blobStore, authHandler)

	fmt.Printf("Server listening on http://localhost:%s\n", port)
	err = http.ListenAndServe(":"+port, svr.Router())
	if err != nil {
		fmt.Printf("Error starting server: %v\n", err)
		os.Exit(1)
	}
}
