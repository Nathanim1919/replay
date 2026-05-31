package format

import (
	"encoding/json"
	"os"
)

type ReplayReader struct {
	file    *os.File      // the file to read the replay from
	decoder *json.Decoder // the decoder to read the replay from
}

func NewReplayReader(path string) (*ReplayReader, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	decoder := json.NewDecoder(file)
	return &ReplayReader{file: file, decoder: decoder}, nil
}

func (r *ReplayReader) ReadHeader() (Header, error) {
	var header Header
	err := r.decoder.Decode(&header)
	if err != nil {
		return Header{}, err
	}
	return header, nil
}

func (r *ReplayReader) ReadEvent() (Event, error) {
	var event Event
	err := r.decoder.Decode(&event)
	if err != nil {
		return Event{}, err
	}
	return event, nil
}

func (r *ReplayReader) Close() error {
	return r.file.Close()
}
