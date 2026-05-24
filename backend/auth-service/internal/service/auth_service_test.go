package service_test

import (
	"testing"

	"github.com/seatify/backend/common/model"
	"github.com/seatify/backend/auth-service/internal/repository"
	"github.com/seatify/backend/auth-service/internal/repository/mocks"
	"github.com/seatify/backend/auth-service/internal/service"
	"github.com/stretchr/testify/assert"
	"golang.org/x/crypto/bcrypt"
)

func TestAuthService_Register_Success(t *testing.T) {
	mockRepo := mocks.NewMockUserRepository()
	mockRepo.GetByEmailFunc = func(email string) (*model.User, error) {
		return nil, repository.ErrUserNotFound
	}
	mockRepo.CreateFunc = func(user *model.User) error {
		user.ID = 1
		return nil
	}

	authService := service.NewAuthService(mockRepo, "test-secret")

	user, err := authService.Register("test@example.com", "password123", "Test User")

	assert.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, "test@example.com", user.Email)
	assert.Equal(t, "Test User", user.Name)
	assert.NotEmpty(t, user.Password)
}

func TestAuthService_Register_UserExists(t *testing.T) {
	mockRepo := mocks.NewMockUserRepository()
	mockRepo.GetByEmailFunc = func(email string) (*model.User, error) {
		return &model.User{ID: 1, Email: email}, nil
	}

	authService := service.NewAuthService(mockRepo, "test-secret")

	user, err := authService.Register("existing@example.com", "password123", "Existing User")

	assert.Error(t, err)
	assert.Equal(t, service.ErrUserAlreadyExists, err)
	assert.Nil(t, user)
}

func TestAuthService_Login_InvalidCredentials(t *testing.T) {
	mockRepo := mocks.NewMockUserRepository()
	mockRepo.GetByEmailFunc = func(email string) (*model.User, error) {
		return nil, repository.ErrUserNotFound
	}

	authService := service.NewAuthService(mockRepo, "test-secret")

	user, err := authService.Login("test@example.com", "password123")

	assert.Error(t, err)
	assert.Equal(t, service.ErrInvalidCredentials, err)
	assert.Nil(t, user)
}

func TestAuthService_GetUserByID(t *testing.T) {
	mockRepo := mocks.NewMockUserRepository()
	expectedUser := &model.User{ID: 1, Email: "test@example.com", Name: "Test User"}
	mockRepo.GetByIDFunc = func(id int64) (*model.User, error) {
		if id == 1 {
			return expectedUser, nil
		}
		return nil, repository.ErrUserNotFound
	}

	authService := service.NewAuthService(mockRepo, "test-secret")

	user, err := authService.GetUserByID(1)

	assert.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, expectedUser.ID, user.ID)
	assert.Equal(t, expectedUser.Email, user.Email)
}

func TestAuthService_DeleteUser(t *testing.T) {
	mockRepo := mocks.NewMockUserRepository()
	mockRepo.DeleteFunc = func(id int64) error {
		if id == 1 {
			return nil
		}
		return repository.ErrUserNotFound
	}

	authService := service.NewAuthService(mockRepo, "test-secret")

	err := authService.DeleteUser(1)

	assert.NoError(t, err)

	err = authService.DeleteUser(999)
	assert.Error(t, err)
}

func TestAuthService_UpdateUser(t *testing.T) {
	mockRepo := mocks.NewMockUserRepository()
	updatedUser := &model.User{ID: 1, Email: "updated@example.com", Name: "Updated User"}
	mockRepo.UpdateFunc = func(user *model.User) error {
		if user.ID == 1 {
			return nil
		}
		return repository.ErrUserNotFound
	}

	authService := service.NewAuthService(mockRepo, "test-secret")

	err := authService.UpdateUser(updatedUser)

	assert.NoError(t, err)
}

func TestAuthService_GenerateToken(t *testing.T) {
	mockRepo := mocks.NewMockUserRepository()
	authService := service.NewAuthService(mockRepo, "test-secret")

	token, err := authService.GenerateToken(1, 0)

	assert.NoError(t, err)
	assert.NotEmpty(t, token)
}

func TestAuthService_Login_ValidCredentials(t *testing.T) {
	mockRepo := mocks.NewMockUserRepository()
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	existingUser := &model.User{ID: 1, Email: "test@example.com", Password: string(hashedPassword), Name: "Test User"}
	
	mockRepo.GetByEmailFunc = func(email string) (*model.User, error) {
		return existingUser, nil
	}

	authService := service.NewAuthService(mockRepo, "test-secret")

	user, err := authService.Login("test@example.com", "password123")

	assert.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, existingUser.ID, user.ID)
	assert.Equal(t, existingUser.Email, user.Email)
}

func TestAuthService_Login_WrongPassword(t *testing.T) {
	mockRepo := mocks.NewMockUserRepository()
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	existingUser := &model.User{ID: 1, Email: "test@example.com", Password: string(hashedPassword), Name: "Test User"}
	
	mockRepo.GetByEmailFunc = func(email string) (*model.User, error) {
		return existingUser, nil
	}

	authService := service.NewAuthService(mockRepo, "test-secret")

	user, err := authService.Login("test@example.com", "wrongpassword")

	assert.Error(t, err)
	assert.Equal(t, service.ErrInvalidCredentials, err)
	assert.Nil(t, user)
}
