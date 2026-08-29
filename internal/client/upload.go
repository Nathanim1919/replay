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


func Upload(serverURL string, filePath string, token string) (string, error) {
    // 1. Read the replay file
    data, err := os.ReadFile(filePath)
    if err != nil {
        return "", fmt.Errorf("failed to read file: %v", err)
    }

    // 2. Create a custom HTTP POST request
    req, err := http.NewRequest("POST", serverURL+"/api/upload", bytes.NewReader(data))
    if err != nil {
        return "", fmt.Errorf("failed to create request: %v", err)
    }

    // 3. Set the required headers, including the Bearer token
    req.Header.Set("Content-Type", "application/octet-stream")
    req.Header.Set("Authorization", "Bearer "+token) // <--- CRITICAL: Passes the session token

    // 4. Send the request using the default HTTP Client
    client := &http.Client{}
    resp, err := client.Do(req)

    if err != nil {
        return "", fmt.Errorf("failed to upload: %v", err.Error())
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusCreated {
        return "", fmt.Errorf("upload failed with status: %d", resp.StatusCode)
    }

    var result map[string]string
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return "", fmt.Errorf("failed to decode response: %v", err)
    }

    return result["url"], nil
}

func Login(serverURL string) (*domain.DeviceAuthResponse, error) {
	resp, err := http.Post(serverURL+"/api/auth/device/init", "application/json", bytes.NewReader(nil))
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

// Update your signature to return (*TokenSession, error)
func PollDeviceAuth(apiURL string, deviceCode string, interval int, expiresIn int) (*domain.TokenSession, error) {
    ticker := time.NewTicker(time.Duration(interval) * time.Second)
    defer ticker.Stop()

    timeout := time.After(time.Duration(expiresIn) * time.Second)

    payload := map[string]string{"device_code": deviceCode}
    body, _ := json.Marshal(payload)

    for {
        select {
        case <-timeout:
            return nil, fmt.Errorf("authentication timed out")
        case <-ticker.C:
            resp, err := http.Post(apiURL+"/api/auth/device/poll", "application/json", bytes.NewBuffer(body))
            if err != nil {
                continue // Try again next tick if the server is temporarily down
            }
            defer resp.Body.Close()

            // Parse response
            var pollResp map[string]interface{}
            if err := json.NewDecoder(resp.Body).Decode(&pollResp); err != nil {
                continue
            }

            // Check what the server sent back
            if status, ok := pollResp["status"].(string); ok {
                if status == "authorization_pending" {
                    continue // Keep polling
                }
                
                if status == "approved" {
                    // Turn map data into our clean TokenSession struct
                    tokenSession := &domain.TokenSession{
                        AccessToken:  pollResp["access_token"].(string),
                        RefreshToken: pollResp["refresh_token"].(string),
                        TokenType:    pollResp["token_type"].(string),
                        ExpiresIn:    int(pollResp["expires_in"].(float64)),
                    }
                    return tokenSession, nil
                }
            }

            if errMsg, ok := pollResp["error"].(string); ok && errMsg == "expired_token" {
                return nil, fmt.Errorf("the login session expired, please try again")
            }
        }
    }
}
