package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/Nathanim1919/replay/internal/domain"
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

func Login() (*domain.DeviceAuthResponse, error) {
	resp, err := http.Post("http://localhost:8080/api/auth/device/init", "application/json", bytes.NewReader(nil))
	if err != nil {
		return nil, fmt.Errorf("failed to start device login: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("device login failed with status: %d", resp.StatusCode)
	}

	var authResp domain.DeviceAuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		return nil, fmt.Errorf("failed to decode device login response: %w", err)
	}

	return &authResp, nil
}

func PollDeviceAuth(serverURL string, deviceCode string, intervalSeconds int, expiresInSeconds int) error {
	if intervalSeconds <= 0 {
		intervalSeconds = 5
	}
	if expiresInSeconds <= 0 {
		expiresInSeconds = 900
	}

	deadline := time.Now().Add(time.Duration(expiresInSeconds) * time.Second)
	client := &http.Client{Timeout: 10 * time.Second}

	for time.Now().Before(deadline) {
		payload, err := json.Marshal(map[string]string{"device_code": deviceCode})
		if err != nil {
			return fmt.Errorf("failed to encode device poll request: %w", err)
		}

		req, err := http.NewRequest(http.MethodPost, serverURL+"/api/auth/device/poll", bytes.NewReader(payload))
		if err != nil {
			return fmt.Errorf("failed to create device poll request: %w", err)
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			return fmt.Errorf("device poll request failed: %w", err)
		}

		var result map[string]string
		decodeErr := json.NewDecoder(resp.Body).Decode(&result)
		resp.Body.Close()
		if decodeErr != nil {
			return fmt.Errorf("failed to decode device poll response: %w", decodeErr)
		}

		switch result["status"] {
		case "approved":
			return nil
		case "expired", "denied":
			return fmt.Errorf("device login %s", result["status"])
		}

		time.Sleep(time.Duration(intervalSeconds) * time.Second)
	}

	return fmt.Errorf("device login timed out")
}
