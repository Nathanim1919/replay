package lib

import (
	"encoding/json"
	"os"
	"path/filepath"

	"github.com/Nathanim1919/replay/internal/domain"
)

const configDir = ".replay"
const sessionFile = "session.json"

func SaveSession(token *domain.TokenSession) error {
    home, err := os.UserHomeDir()
    if err != nil {
        return err
    }

    // Target path: ~/.replay/session.json
    dirPath := filepath.Join(home, configDir)
    filePath := filepath.Join(dirPath, sessionFile)

    // Ensure the ~/.replay directory exists (Permissions: User Read/Write/Execute Only)
    if err := os.MkdirAll(dirPath, 0700); err != nil {
        return err
    }

    data, err := json.MarshalIndent(token, "", "  ")
    if err != nil {
        return err
    }

    // Write file with 0600 permissions so other OS local users cannot inspect it
    return os.WriteFile(filePath, data, 0600)
}


func LoadSession() (*domain.TokenSession, error) {
    home, _ := os.UserHomeDir()
    filePath := filepath.Join(home, configDir, sessionFile)

    data, err := os.ReadFile(filePath)
    if err != nil {
        return nil, err // No session found
    }

    var session domain.TokenSession
    json.Unmarshal(data, &session)
    return &session, nil
}

// Example usage inside a generic command:
// session, err := lib.LoadSession()
// req.Header.Set("Authorization", "Bearer " + session.AccessToken)