package server

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"
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

func (s *LocalBlobStore) DeleteFile(shortcode string) error {
	path := filepath.Join(s.dir, shortcode+".replay")
	err := os.Remove(path)
	if err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

func (s *LocalBlobStore) PreviewReplay(shortcode string, maxEvents int) (string, error) {
	path := filepath.Join(s.dir, shortcode+".replay")
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	scanner.Buffer(make([]byte, 0, 64*1024), 2*1024*1024)

	if !scanner.Scan() {
		if err := scanner.Err(); err != nil {
			return "", err
		}
		return "", nil
	}

	var preview strings.Builder
	preview.WriteString(scanner.Text())
	preview.WriteByte('\n')

	count := 0
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}

		preview.WriteString(line)
		preview.WriteByte('\n')
		count++
		if count >= maxEvents {
			break
		}
	}

	if err := scanner.Err(); err != nil {
		return "", err
	}

	return strings.TrimSpace(preview.String()), nil
}
