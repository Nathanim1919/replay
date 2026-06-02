package server

import (
	"os"
	"path/filepath"
)

type LocalBlobStore struct {
	dir string
}

func NewLocalBlobStore(dir string) (*LocalBlobStore, error) {
	err := os.MkdirAll(dir, 0755)
	if err != nil {
		return nil, err
	}
	return &LocalBlobStore{dir: dir}, nil
}

func (s *LocalBlobStore) SaveFile(shortcode string, data []byte) error {
	path := filepath.Join(s.dir, shortcode+".replay")
	return os.WriteFile(path, data, 0644)
}

func (s *LocalBlobStore) GetFile(shortcode string) ([]byte, error) {
	path := filepath.Join(s.dir, shortcode+".replay")
	return os.ReadFile(path)
}
