package format

import (
	"bytes"
	"testing"
)

func TestZstdCompressDecompress(t *testing.T) {
	raw := []byte(`{"version":1,"width":80,"height":24,"timestamp":1700000000,"duration":5,"shell":"/bin/bash"}
[0.05,"o","user@host:~$ "]
[0.12,"o","ls -la\r\n"]
[0.25,"o","drwxr-xr-x 2 user group 4096 Aug 28 12:00 .\r\n"]
`)

	compressed, err := CompressZstd(raw)
	if err != nil {
		t.Fatalf("CompressZstd failed: %v", err)
	}

	if !IsZstdCompressed(compressed) {
		t.Errorf("Expected compressed data to be recognized as Zstd compressed")
	}

	decompressed, err := DecompressZstd(compressed)
	if err != nil {
		t.Fatalf("DecompressZstd failed: %v", err)
	}

	if !bytes.Equal(raw, decompressed) {
		t.Errorf("Decompressed content mismatch! Expected:\n%s\nGot:\n%s", string(raw), string(decompressed))
	}

	t.Logf("Raw size: %d bytes -> Compressed size: %d bytes (%.1f%% ratio)",
		len(raw), len(compressed), float64(len(compressed))/float64(len(raw))*100)
}

func TestUncompressedPassThrough(t *testing.T) {
	raw := []byte("plain text line\n")

	if IsZstdCompressed(raw) {
		t.Errorf("Plain text wrongly identified as Zstd compressed")
	}

	decompressed, err := DecompressZstd(raw)
	if err != nil {
		t.Fatalf("DecompressZstd failed on raw data: %v", err)
	}

	if !bytes.Equal(raw, decompressed) {
		t.Errorf("Pass-through data altered")
	}
}
