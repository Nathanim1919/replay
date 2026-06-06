package auth

import (
    "context"
    "fmt"
    "net/http"
)

func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        fmt.Println("-> auth middleware called via cookies")

        // 1. Get the cookie from the request (Change "token" to whatever name you chose at login)
        cookie, err := r.Cookie("token")
        if err != nil {
            if err == http.ErrNoCookie {
                http.Error(w, "Authentication cookie missing", http.StatusUnauthorized)
                return
            }
            http.Error(w, "Internal server error reading cookie", http.StatusBadRequest)
            return
        }

        // 2. Validate the JWT found inside the cookie's Value
        claims, err := ValidateJWT(cookie.Value)
        if err != nil {
            http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
            return
        }

        fmt.Printf("Authenticated user: %s\n", claims.UserID)

        // 3. Attach claims to the request context exactly as before
        ctx := context.WithValue(r.Context(), "claims", claims)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}