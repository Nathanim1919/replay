// this Token.go file will handle JWT token generation and validation. It will use the jwt-go library to generate and validate JWT tokens. It will also use the session store to manage user sessions.

package auth

import (
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"os"
	"time"
)

type Claims struct {
	UserID string `json:"user_id"`
	jwt.RegisteredClaims
}

func GetSecretKey() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		panic("JWT_SECRET environment variable not set")
	}
	return []byte(secret)
}

func GenerateJWT(userId string) (string,string, error) {
	AccessTokenclaims := &Claims{
		UserID: userId,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userId,
		},
	}


	RefreshTokenClaims := &Claims{
		UserID: userId,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(30 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userId,
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, AccessTokenclaims)
    refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, RefreshTokenClaims)
	

	signedToken, err := accessToken.SignedString(GetSecretKey())
    signedRefreshToken, err := refreshToken.SignedString(GetSecretKey())
	if err != nil {
		return "", "", err
	}
	return signedToken, signedRefreshToken, nil
}

func ValidateJWT(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		_, ok := token.Method.(*jwt.SigningMethodHMAC)

		if !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return GetSecretKey(), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)

	if ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("invalid token")
}
