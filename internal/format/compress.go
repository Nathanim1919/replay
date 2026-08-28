package format

import (
	"bytes"
	"fmt"
	"io"

	"github.com/klauspost/compress/zstd"
)

// ZstdMagicHeader is the 4-byte magic number for Zstandard frames (0xFD2FB528 in little-endian format).
var ZstdMagicHeader = []byte{0x28, 0xB5, 0x2F, 0xFD}

// CompressZstd compresses raw replay event byte stream using Zstandard.
func CompressZstd(data []byte) ([]byte, error) {
	if len(data) == 0 {
		return data, nil
	}

	var buf bytes.Buffer
	enc, err := zstd.NewWriter(&buf, zstd.WithEncoderLevel(zstd.SpeedDefault))
	if err != nil {
		return nil, fmt.Errorf("failed to create zstd encoder: %w", err)
	}

	_, err = enc.Write(data)
	if err != nil {
		_ = enc.Close()
		return nil, fmt.Errorf("failed writing data to zstd encoder: %w", err)
	}

	err = enc.Close()
	if err != nil {
		return nil, fmt.Errorf("failed closing zstd encoder: %w", err)
	}

	return buf.Bytes(), nil
}

// DecompressZstd decompresses a Zstandard compressed byte slice. If data is uncompressed, it returns data as-is.
func DecompressZstd(data []byte) ([]byte, error) {
	if len(data) == 0 || !IsZstdCompressed(data) {
		return data, nil
	}

	dec, err := zstd.NewReader(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("failed to create zstd decoder: %w", err)
	}
	defer dec.Close()

	decompressed, err := io.ReadAll(dec)
	if err != nil {
		return nil, fmt.Errorf("failed decompressing zstd data: %w", err)
	}

	return decompressed, nil
}

// IsZstdCompressed checks if the given byte slice starts with the Zstd magic frame header.
func IsZstdCompressed(data []byte) bool {
	return len(data) >= 4 && bytes.Equal(data[:4], ZstdMagicHeader)
}
