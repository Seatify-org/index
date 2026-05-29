package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/Seatify-org/seatify-common/model"
	"github.com/golang-jwt/jwt/v5"
	"github.com/seatify/backend/auth-service/internal/repository"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidToken       = errors.New("invalid token")
	ErrUserAlreadyExists  = errors.New("user already exists")
)

type AuthService struct {
	userRepo       repository.UserRepository
	logger         *zap.Logger
	jwtSecret      string
	accessTTLMin   int
	refreshTTLHour int
}

type AuthTokens struct {
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	User         *model.User `json:"user"`
}

type RegisterInput struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type CustomClaims struct {
	UserID int    `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func NewAuthService(
	userRepo repository.UserRepository,
	logger *zap.Logger,
	jwtSecret string,
	accessTTLMin int,
	refreshTTLHour int,
) *AuthService {
	if logger == nil {
		logger = zap.NewNop()
	}

	return &AuthService{
		userRepo:       userRepo,
		logger:         logger,
		jwtSecret:      jwtSecret,
		accessTTLMin:   accessTTLMin,
		refreshTTLHour: refreshTTLHour,
	}
}

func (s *AuthService) Register(input RegisterInput, ip, userAgent string) (*AuthTokens, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		Username:     input.Username,
		Email:        input.Email,
		PasswordHash: string(hashedPassword),
		Role:         "user",
	}

	if err := s.userRepo.CreateUser(user); err != nil {
		if errors.Is(err, repository.ErrUserAlreadyExists) {
			return nil, ErrUserAlreadyExists
		}
		return nil, err
	}

	tokens, err := s.issueTokens(user)
	if err != nil {
		return nil, err
	}

	_ = s.userRepo.CreateAuditLog(&model.AuditLog{
		UserID:    user.ID,
		Action:    "register",
		IP:        ip,
		UserAgent: userAgent,
	})

	s.logger.Info("user registered",
		zap.Int("user_id", user.ID),
		zap.String("email", user.Email),
	)

	return tokens, nil
}

func (s *AuthService) Login(input LoginInput, ip, userAgent string) (*AuthTokens, error) {
	user, err := s.userRepo.GetByEmail(input.Email)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	tokens, err := s.issueTokens(user)
	if err != nil {
		return nil, err
	}

	_ = s.userRepo.CreateAuditLog(&model.AuditLog{
		UserID:    user.ID,
		Action:    "login",
		IP:        ip,
		UserAgent: userAgent,
	})

	s.logger.Info("user logged in",
		zap.Int("user_id", user.ID),
		zap.String("email", user.Email),
	)

	return tokens, nil
}

func (s *AuthService) Refresh(refreshToken string, ip, userAgent string) (*AuthTokens, error) {
	storedToken, err := s.userRepo.GetRefreshToken(refreshToken)
	if err != nil {
		return nil, ErrInvalidToken
	}

	if time.Now().After(storedToken.ExpiresAt) {
		_ = s.userRepo.DeleteRefreshToken(refreshToken)
		return nil, ErrInvalidToken
	}

	claims, err := s.parseToken(refreshToken)
	if err != nil {
		return nil, ErrInvalidToken
	}

	user, err := s.userRepo.GetByID(claims.UserID)
	if err != nil {
		return nil, ErrInvalidToken
	}

	_ = s.userRepo.DeleteRefreshToken(refreshToken)

	tokens, err := s.issueTokens(user)
	if err != nil {
		return nil, err
	}

	_ = s.userRepo.CreateAuditLog(&model.AuditLog{
		UserID:    user.ID,
		Action:    "refresh",
		IP:        ip,
		UserAgent: userAgent,
	})

	return tokens, nil
}

func (s *AuthService) GetMe(accessToken string) (*model.User, error) {
	claims, err := s.parseToken(accessToken)
	if err != nil {
		return nil, ErrInvalidToken
	}

	user, err := s.userRepo.GetByID(claims.UserID)
	if err != nil {
		return nil, ErrInvalidToken
	}

	return user, nil
}

func (s *AuthService) issueTokens(user *model.User) (*AuthTokens, error) {
	accessToken, err := s.generateToken(user, time.Minute*time.Duration(s.accessTTLMin))
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.generateToken(user, time.Hour*time.Duration(s.refreshTTLHour))
	if err != nil {
		return nil, err
	}

	refreshModel := &model.RefreshToken{
		UserID:    user.ID,
		Token:     refreshToken,
		ExpiresAt: time.Now().Add(time.Hour * time.Duration(s.refreshTTLHour)),
	}

	if err := s.userRepo.SaveRefreshToken(refreshModel); err != nil {
		return nil, err
	}

	return &AuthTokens{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
	}, nil
}

func (s *AuthService) generateToken(user *model.User, ttl time.Duration) (string, error) {
	now := time.Now()

	claims := CustomClaims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   fmt.Sprintf("%d", user.ID),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func (s *AuthService) parseToken(tokenString string) (*CustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtSecret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*CustomClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
