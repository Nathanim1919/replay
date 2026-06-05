package auth

import (
	"github.com/Nathanim1919/replay/internal/server"
	"github.com/google/uuid"
)

type Service struct {
	Users UserStore
}

type UserStore interface {
	CreateUser(user *server.User) error
	GetUserById(userId string) (*server.User, error)
	GetUserByEmail(email string) (*server.User, error)
}

var (
	ErrEmailExists     = Error("email already exists")
	ErrInvalidPassword = Error("invalid password")
	ErrUserNotFound    = Error("user not found")
)

type Error string

func (e Error) Error() string {
	return string(e)
}


func (s *Service) RegisterUser(name, email, password string) (*server.User, error){
	// Validate email is not taken yet
	existing, err := s.Users.GetUserByEmail(email)
	if err != nil {
		return nil, err
	}

	if existing != nil {
		return nil, ErrEmailExists
	}

	// HashPassword
	hash, err := HashPassword(password)
	if err != nil {
		return nil, err
	} 


	// Create User in Db
	user := &server.User{
		ID: uuid.New().String(),
		Name: name,
		Email: email,
		PasswordHash: hash,
	}


	err = s.Users.CreateUser(user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *Service) Login(email, password string) (string, error){
	// make sure the email is registered
	existingUser, err := s.Users.GetUserByEmail(email)

	if err != nil {
		return "", err
	}

	if existingUser == nil {
		return "", ErrUserNotFound
	}


	ok := CheckPassword(password, existingUser.PasswordHash)
	if !ok{
		return "", ErrInvalidPassword
	}

	// if password is correct, generate accessToken and refreshToken
	accessToken, err := GenerateJWT(existingUser.ID)
	if err != nil {
		return "", err
	}

	return accessToken, nil

}