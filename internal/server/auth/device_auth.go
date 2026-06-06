package auth

import (
	"crypto/rand"
	"encoding/base32"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/Nathanim1919/replay/internal/domain"
)

type DeviceAuthStore struct {
	mu       sync.Mutex
	byDevice map[string]*domain.DeviceAuthRequest
	byUser   map[string]*domain.DeviceAuthRequest
}

func NewDeviceAuthStore() *DeviceAuthStore {
	return &DeviceAuthStore{
		byDevice: make(map[string]*domain.DeviceAuthRequest),
		byUser:   make(map[string]*domain.DeviceAuthRequest),
	}
}

func (s *DeviceAuthStore) Create(baseURL string) (*domain.DeviceAuthResponse, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	deviceCode, err := generateCode(32)
	if err != nil {
		return nil, err
	}

	userCode, err := generateCode(8)
	if err != nil {
		return nil, err
	}

	resp := &domain.DeviceAuthResponse{
		DeviceCode:      deviceCode,
		UserCode:        userCode,
		VerificationURI: fmt.Sprintf("%s/auth/device/verify?user_code=%s", strings.TrimRight(baseURL, "/"), userCode),
		ExpiresIn:       900,
		Interval:        5,
	}

	now := time.Now()
	req := &domain.DeviceAuthRequest{
		UserCode:   userCode,
		DeviceCode: deviceCode,
		Status:     "pending",
		CreatedAt:  now,
		ExpiresAt:  now.Add(time.Duration(resp.ExpiresIn) * time.Second),
	}

	s.byDevice[deviceCode] = req
	s.byUser[userCode] = req
	return resp, nil
}

func (s *DeviceAuthStore) Poll(deviceCode string) (*domain.DeviceAuthRequest, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	req, ok := s.byDevice[deviceCode]
	if !ok {
		return nil, false
	}
	if time.Now().After(req.ExpiresAt) {
		req.Status = "expired"
	}
	return req, true
}

func (s *DeviceAuthStore) Approve(userCode string, userID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	req, ok := s.byUser[userCode]
	if !ok {
		return fmt.Errorf("device code not found")
	}

	req.Status = "approved"
	req.UserID = userID
	return nil
}

func generateCode(length int) (string, error) {
	if length <= 0 {
		return "", fmt.Errorf("invalid code length")
	}

	buf := make([]byte, length)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}

	encoder := base32.StdEncoding.WithPadding(base32.NoPadding)
	code := strings.ToUpper(encoder.EncodeToString(buf))
	if len(code) > length {
		code = code[:length]
	}
	return code, nil
}

func (h *Handler) DeviceInit(w http.ResponseWriter, r *http.Request) {
	if h.DeviceStore == nil {
		http.Error(w, "device auth store not configured", http.StatusInternalServerError)
		return
	}

	resp, err := h.DeviceStore.Create("http://localhost:3000")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(resp)
}

func (h *Handler) DevicePoll(w http.ResponseWriter, r *http.Request) {
	if h.DeviceStore == nil {
		http.Error(w, "device auth store not configured", http.StatusInternalServerError)
		return
	}

	var payload struct {
		DeviceCode string `json:"device_code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if payload.DeviceCode == "" {
		http.Error(w, "device_code is required", http.StatusBadRequest)
		return
	}

	req, ok := h.DeviceStore.Poll(payload.DeviceCode)
	if !ok {
		http.Error(w, "device code not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": req.Status})
}

func (h *Handler) DeviceApprove(w http.ResponseWriter, r *http.Request) {
	if h.DeviceStore == nil {
		http.Error(w, "device auth store not configured", http.StatusInternalServerError)
		return
	}

	var payload struct {
		UserCode string `json:"user_code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if payload.UserCode == "" {
		http.Error(w, "user_code is required", http.StatusBadRequest)
		return
	}

	if err := h.DeviceStore.Approve(payload.UserCode, ""); err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "approved"})
}
