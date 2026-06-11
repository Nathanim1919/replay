package auth

import (
	"context"
	"fmt"
	"net/http"
	"strings"
)

func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        var tokenStr string

        // 1. Check Authorization Header first (for CLI requests)
        authHeader := r.Header.Get("Authorization")
        if strings.HasPrefix(authHeader, "Bearer ") {
            tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
            fmt.Println("We fucking get the token from the auth header:- ", tokenStr)
        } else {
            // 2. Fallback to Cookie (for Web App requests)
            cookie, err := r.Cookie("access_token")
            if err == nil {
                tokenStr = cookie.Value
            }
        }

        if tokenStr == "" {
            http.Error(w, "Authentication missing", http.StatusUnauthorized)
            return
        }

        // 3. Validate the token statelessly
        claims, err := ValidateJWT(tokenStr)
        if err != nil {
            // If expired or invalid, return 401 so the client knows to call /refresh
            http.Error(w, "Token expired or invalid", http.StatusUnauthorized)
            return
        }

        ctx := context.WithValue(r.Context(), "claims", claims)
        fmt.Printf("Authenticated user ID: %s\n", claims.UserID)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}