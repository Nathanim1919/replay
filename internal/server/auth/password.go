package auth

import "golang.org/x/crypto/bcrypt"

func HashPassword(password string) (string, error) {
	hashedBytes, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return "", err
	}

	return string(hashedBytes), nil
}

func CheckPassword(password string, hashed string) bool {
	err := bcrypt.CompareHashAndPassword(
		[]byte(hashed),
		[]byte(password),
	)

	return err == nil
}