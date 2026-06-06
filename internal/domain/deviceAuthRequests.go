package domain

import "time"


// device_auth_requests
type DeviceAuthRequest struct {
	ID        string    `json:"id"`
	UserCode    string    `json:"user_code"`
	DeviceCode  string    `json:"device_code"`
	UserID      string    `json:"user_id"`
	Status	  string    `json:"status"` // pending, approved, denied
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}


// 1. Define the shape of your API response
type DeviceAuthResponse struct {
    DeviceCode      string `json:"device_code"`
    UserCode        string `json:"user_code"`
    VerificationURI string `json:"verification_uri"`
    ExpiresIn       int    `json:"expires_in"`
    Interval        int    `json:"interval"`
}