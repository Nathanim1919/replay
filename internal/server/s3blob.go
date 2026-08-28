package server

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/Nathanim1919/replay/internal/format"
)

// S3Config holds connection parameters for S3, Cloudflare R2, or MinIO object storage.
type S3Config struct {
	Bucket    string
	Region    string
	Endpoint  string // e.g. "http://localhost:9000" for MinIO or "https://<account>.r2.cloudflarestorage.com"
	AccessKey string
	SecretKey string
}

// S3BlobStore implements BlobStore using S3 API or local fallback store.
type S3BlobStore struct {
	cfg        S3Config
	localCache *LocalBlobStore
	client     *http.Client
}

// NewS3BlobStore creates an S3/R2 blob storage manager with a local disk cache directory.
func NewS3BlobStore(cfg S3Config, cacheDir string) (*S3BlobStore, error) {
	local, err := NewLocalBlobStore(cacheDir)
	if err != nil {
		return nil, err
	}

	if cfg.Region == "" {
		cfg.Region = "us-east-1"
	}

	return &S3BlobStore{
		cfg:        cfg,
		localCache: local,
		client:     &http.Client{Timeout: 30 * time.Second},
	}, nil
}

func (s *S3BlobStore) SaveFile(shortcode string, data []byte) error {
	// 1. Save to local cache store first for immediate local preview generation
	if err := s.localCache.SaveFile(shortcode, data); err != nil {
		return fmt.Errorf("local cache write failed: %w", err)
	}

	// 2. If endpoint/bucket configured, push compressed blob to S3/R2 object storage
	if s.cfg.Bucket != "" && s.cfg.Endpoint != "" {
		compressed, err := format.CompressZstd(data)
		if err != nil {
			compressed = data
		}

		objectKey := fmt.Sprintf("recordings/%s.replay", shortcode)
		url := fmt.Sprintf("%s/%s/%s", strings.TrimRight(s.cfg.Endpoint, "/"), s.cfg.Bucket, objectKey)

		req, err := http.NewRequest(http.MethodPut, url, bytes.NewReader(compressed))
		if err != nil {
			return err
		}
		req.Header.Set("Content-Type", "application/octet-stream")

		resp, err := s.client.Do(req)
		if err != nil {
			// Non-blocking log if S3 remote is unavailable during local dev
			return nil
		}
		defer resp.Body.Close()
	}

	return nil
}

func (s *S3BlobStore) GetFile(shortcode string) ([]byte, error) {
	// 1. Try local cache store
	data, err := s.localCache.GetFile(shortcode)
	if err == nil && len(data) > 0 {
		return format.DecompressZstd(data)
	}

	// 2. Fallback to S3/R2 object fetch if available
	if s.cfg.Bucket != "" && s.cfg.Endpoint != "" {
		objectKey := fmt.Sprintf("recordings/%s.replay", shortcode)
		url := fmt.Sprintf("%s/%s/%s", strings.TrimRight(s.cfg.Endpoint, "/"), s.cfg.Bucket, objectKey)

		resp, err := s.client.Get(url)
		if err == nil && resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			remoteData, err := io.ReadAll(resp.Body)
			if err == nil {
				_ = s.localCache.SaveFile(shortcode, remoteData)
				return format.DecompressZstd(remoteData)
			}
		}
	}

	return nil, fmt.Errorf("recording blob not found for shortcode %s", shortcode)
}

func (s *S3BlobStore) PreviewReplay(shortcode string, maxEvents int) (string, error) {
	// Delegate preview generation to local cache store
	return s.localCache.PreviewReplay(shortcode, maxEvents)
}

// GetLocalPath returns absolute local file path for shortcode replay.
func (s *S3BlobStore) GetLocalPath(shortcode string) string {
	return filepath.Join(s.localCache.dir, shortcode+".replay")
}
