package format

import (
	"encoding/json"
	"os"
)

type ReplayWriter struct {
	file    *os.File      // the file to write the replay to
	encoder *json.Encoder // the encoder to write the replay to
}

func NewReplayWriter(path string) (*ReplayWriter, error) {
	file, err := os.Create(path)
	if err != nil {
		return nil, err
	}
	encoder := json.NewEncoder(file)
	return &ReplayWriter{file: file, encoder: encoder}, nil
}

func (w *ReplayWriter) WriteHeader(header Header) error {
	return w.encoder.Encode(header)
}

func (w *ReplayWriter) WriteEvent(event Event) error {
	return w.encoder.Encode(event)
}

func (w *ReplayWriter) Close() error {
	return w.file.Close()
}
