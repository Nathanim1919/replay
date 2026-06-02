package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

func Upload(serverURL string, filePath string) (string, error) {
	// read the replay file
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %v", err)
	}

	// post to the server
	resp, err := http.Post(serverURL+"/api/upload", "application/octet-stream", bytes.NewReader(data))
	if err != nil {
		return "", fmt.Errorf("failed to upload: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return "", fmt.Errorf("upload failed with status: %d", resp.StatusCode)
	}

	var result map[string]string
	json.NewDecoder(resp.Body).Decode(&result)

	return result["url"], nil
}
