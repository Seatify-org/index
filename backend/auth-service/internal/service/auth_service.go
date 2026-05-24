package service

import (
	"errors"
	"time"

	"github.com/seatify/backend/common/model"
	"github.com/seatify/backend/auth-service/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserAlreadyExists  = errors.New("user already exists")
)

type AuthService struct {
	userRepo repository.UserRepository
	jwtSecret string
}

func NewAuthService(userRepo repository.UserRepository, jwtSecret string) *AuthService {
	return &AuthService{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
	}
}

func (s *AuthService) Register(email, password, name string) (*model.User, error) {
	existingUser, _ := s.userRepo.GetByEmail(email)
	if existingUser != nil {
		return nil, ErrUserAlreadyExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		Email:    email,
		Password: string(hashedPassword),
		Name:     name,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) Login(email, password string) (*model.User, error) {
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return user, nil
}

func (s *AuthService) GetUserByID(id int64) (*model.User, error) {
	return s.userRepo.GetByID(id)
}

func (s *AuthService) UpdateUser(user *model.User) error {
	return s.userRepo.Update(user)
}

func (s *AuthService) DeleteUser(id int64) error {
	return s.userRepo.Delete(id)
}

func (s *AuthService) GenerateToken(userID int64, expiry time.Duration) (string, error) {
	return "mock-jwt-token-for-user-" + string(rune(userID)), nil
}
