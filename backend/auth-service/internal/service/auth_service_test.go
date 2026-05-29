package service

import (
	"testing"
	"time"

	"github.com/Seatify-org/seatify-common/model"
	"github.com/seatify/backend/auth-service/internal/repository"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

type mockUserRepository struct {
	CreateUserFunc         func(user *model.User) error
	GetByEmailFunc         func(email string) (*model.User, error)
	GetByIDFunc            func(id int) (*model.User, error)
	SaveRefreshTokenFunc   func(token *model.RefreshToken) error
	GetRefreshTokenFunc    func(token string) (*model.RefreshToken, error)
	DeleteRefreshTokenFunc func(token string) error
	CreateAuditLogFunc     func(log *model.AuditLog) error
}

func (m *mockUserRepository) CreateUser(user *model.User) error {
	if m.CreateUserFunc != nil {
		return m.CreateUserFunc(user)
	}
	return nil
}

func (m *mockUserRepository) GetByEmail(email string) (*model.User, error) {
	if m.GetByEmailFunc != nil {
		return m.GetByEmailFunc(email)
	}
	return nil, repository.ErrUserNotFound
}

func (m *mockUserRepository) GetByID(id int) (*model.User, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(id)
	}
	return nil, repository.ErrUserNotFound
}

func (m *mockUserRepository) SaveRefreshToken(token *model.RefreshToken) error {
	if m.SaveRefreshTokenFunc != nil {
		return m.SaveRefreshTokenFunc(token)
	}
	return nil
}

func (m *mockUserRepository) GetRefreshToken(token string) (*model.RefreshToken, error) {
	if m.GetRefreshTokenFunc != nil {
		return m.GetRefreshTokenFunc(token)
	}
	return nil, repository.ErrUserNotFound
}

func (m *mockUserRepository) DeleteRefreshToken(token string) error {
	if m.DeleteRefreshTokenFunc != nil {
		return m.DeleteRefreshTokenFunc(token)
	}
	return nil
}

func (m *mockUserRepository) CreateAuditLog(log *model.AuditLog) error {
	if m.CreateAuditLogFunc != nil {
		return m.CreateAuditLogFunc(log)
	}
	return nil
}

func TestAuthService_Register_Success(t *testing.T) {
	mockRepo := &mockUserRepository{
		CreateUserFunc: func(user *model.User) error {
			user.ID = 1
			return nil
		},
		SaveRefreshTokenFunc: func(token *model.RefreshToken) error {
			return nil
		},
	}

	svc := NewAuthService(mockRepo, zap.NewNop(), "secret", 15, 168)

	result, err := svc.Register(RegisterInput{
		Username: "maksim",
		Email:    "maksim@example.com",
		Password: "password123",
	}, "127.0.0.1", "test-agent")

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.NotEmpty(t, result.AccessToken)
	assert.NotEmpty(t, result.RefreshToken)
	assert.NotNil(t, result.User)
	assert.Equal(t, "maksim@example.com", result.User.Email)
	assert.Equal(t, "user", result.User.Role)
}

func TestAuthService_Register_UserAlreadyExists(t *testing.T) {
	mockRepo := &mockUserRepository{
		CreateUserFunc: func(user *model.User) error {
			return repository.ErrUserAlreadyExists
		},
	}

	svc := NewAuthService(mockRepo, zap.NewNop(), "secret", 15, 168)

	result, err := svc.Register(RegisterInput{
		Username: "maksim",
		Email:    "maksim@example.com",
		Password: "password123",
	}, "127.0.0.1", "test-agent")

	assert.Nil(t, result)
	assert.Error(t, err)
	assert.ErrorIs(t, err, ErrUserAlreadyExists)
}

func TestAuthService_Login_Success(t *testing.T) {
	hashed, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	mockRepo := &mockUserRepository{
		GetByEmailFunc: func(email string) (*model.User, error) {
			return &model.User{
				ID:           1,
				Username:     "maksim",
				Email:        email,
				PasswordHash: string(hashed),
				Role:         "user",
			}, nil
		},
		SaveRefreshTokenFunc: func(token *model.RefreshToken) error {
			return nil
		},
	}

	svc := NewAuthService(mockRepo, zap.NewNop(), "secret", 15, 168)

	result, err := svc.Login(LoginInput{
		Email:    "maksim@example.com",
		Password: "password123",
	}, "127.0.0.1", "test-agent")

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.NotEmpty(t, result.AccessToken)
	assert.NotEmpty(t, result.RefreshToken)
}

func TestAuthService_Login_InvalidCredentials(t *testing.T) {
	hashed, _ := bcrypt.GenerateFromPassword([]byte("correct-password"), bcrypt.DefaultCost)

	mockRepo := &mockUserRepository{
		GetByEmailFunc: func(email string) (*model.User, error) {
			return &model.User{
				ID:           1,
				Email:        email,
				PasswordHash: string(hashed),
				Role:         "user",
			}, nil
		},
	}

	svc := NewAuthService(mockRepo, zap.NewNop(), "secret", 15, 168)

	result, err := svc.Login(LoginInput{
		Email:    "maksim@example.com",
		Password: "wrong-password",
	}, "127.0.0.1", "test-agent")

	assert.Nil(t, result)
	assert.Error(t, err)
	assert.ErrorIs(t, err, ErrInvalidCredentials)
}

func TestAuthService_Refresh_Success(t *testing.T) {
	user := &model.User{
		ID:       1,
		Username: "maksim",
		Email:    "maksim@example.com",
		Role:     "user",
	}

	mockRepo := &mockUserRepository{
		GetRefreshTokenFunc: func(token string) (*model.RefreshToken, error) {
			return &model.RefreshToken{
				ID:        1,
				UserID:    1,
				Token:     token,
				ExpiresAt: time.Now().Add(1 * time.Hour),
			}, nil
		},
		GetByIDFunc: func(id int) (*model.User, error) {
			return user, nil
		},
		DeleteRefreshTokenFunc: func(token string) error {
			return nil
		},
		SaveRefreshTokenFunc: func(token *model.RefreshToken) error {
			return nil
		},
	}

	svc := NewAuthService(mockRepo, zap.NewNop(), "secret", 15, 168)

	refreshToken := mustGenerateRefreshTokenForTest(t, svc, user)

	result, err := svc.Refresh(refreshToken, "127.0.0.1", "test-agent")

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.NotEmpty(t, result.AccessToken)
	assert.NotEmpty(t, result.RefreshToken)
	assert.NotNil(t, result.User)
	assert.Equal(t, user.ID, result.User.ID)
}

func TestAuthService_GetMe_Success(t *testing.T) {
	user := &model.User{
		ID:       1,
		Username: "maksim",
		Email:    "maksim@example.com",
		Role:     "user",
	}

	mockRepo := &mockUserRepository{
		GetByIDFunc: func(id int) (*model.User, error) {
			return user, nil
		},
	}

	svc := NewAuthService(mockRepo, zap.NewNop(), "secret", 15, 168)

	token, err := mustGenerateAccessTokenForTest(svc, user)
	assert.NoError(t, err)

	result, err := svc.GetMe(token)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, user.ID, result.ID)
	assert.Equal(t, user.Email, result.Email)
}

func mustGenerateAccessTokenForTest(svc *AuthService, user *model.User) (string, error) {
	return svcTestGenerateToken(svc, user, time.Minute*15)
}

func mustGenerateRefreshTokenForTest(t *testing.T, svc *AuthService, user *model.User) string {
	token, err := svcTestGenerateToken(svc, user, time.Hour*168)
	assert.NoError(t, err)
	return token
}

func svcTestGenerateToken(svc *AuthService, user *model.User, ttl time.Duration) (string, error) {
	return svc.generateToken(user, ttl)
}
