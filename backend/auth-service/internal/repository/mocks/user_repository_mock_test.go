package mocks

import (
	"errors"
	"testing"

	"github.com/Seatify-org/seatify-common/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewMockUserRepository(t *testing.T) {
	repo := NewMockUserRepository()
	require.NotNil(t, repo)
}

func TestMockUserRepository_CreateUser_Default(t *testing.T) {
	repo := NewMockUserRepository()

	err := repo.CreateUser(&model.User{Email: "maksim@example.com"})
	assert.NoError(t, err)
}

func TestMockUserRepository_CreateUser_WithFunc(t *testing.T) {
	repo := NewMockUserRepository()
	expectedErr := errors.New("create failed")

	repo.CreateUserFunc = func(user *model.User) error {
		assert.Equal(t, "maksim@example.com", user.Email)
		return expectedErr
	}

	err := repo.CreateUser(&model.User{Email: "maksim@example.com"})
	assert.ErrorIs(t, err, expectedErr)
}

func TestMockUserRepository_GetByEmail_Default(t *testing.T) {
	repo := NewMockUserRepository()

	user, err := repo.GetByEmail("maksim@example.com")
	assert.NoError(t, err)
	assert.Nil(t, user)
}

func TestMockUserRepository_GetByEmail_WithFunc(t *testing.T) {
	repo := NewMockUserRepository()

	repo.GetByEmailFunc = func(email string) (*model.User, error) {
		assert.Equal(t, "maksim@example.com", email)
		return &model.User{ID: 1, Email: email}, nil
	}

	user, err := repo.GetByEmail("maksim@example.com")
	require.NoError(t, err)
	require.NotNil(t, user)
	assert.Equal(t, 1, user.ID)
	assert.Equal(t, "maksim@example.com", user.Email)
}

func TestMockUserRepository_GetByID_Default(t *testing.T) {
	repo := NewMockUserRepository()

	user, err := repo.GetByID(1)
	assert.NoError(t, err)
	assert.Nil(t, user)
}

func TestMockUserRepository_GetByID_WithFunc(t *testing.T) {
	repo := NewMockUserRepository()

	repo.GetByIDFunc = func(id int) (*model.User, error) {
		assert.Equal(t, 1, id)
		return &model.User{ID: id, Username: "maksim"}, nil
	}

	user, err := repo.GetByID(1)
	require.NoError(t, err)
	require.NotNil(t, user)
	assert.Equal(t, 1, user.ID)
	assert.Equal(t, "maksim", user.Username)
}

func TestMockUserRepository_SaveRefreshToken_Default(t *testing.T) {
	repo := NewMockUserRepository()

	err := repo.SaveRefreshToken(&model.RefreshToken{Token: "refresh-token"})
	assert.NoError(t, err)
}

func TestMockUserRepository_SaveRefreshToken_WithFunc(t *testing.T) {
	repo := NewMockUserRepository()
	expectedErr := errors.New("save refresh failed")

	repo.SaveRefreshTokenFunc = func(token *model.RefreshToken) error {
		assert.Equal(t, "refresh-token", token.Token)
		return expectedErr
	}

	err := repo.SaveRefreshToken(&model.RefreshToken{Token: "refresh-token"})
	assert.ErrorIs(t, err, expectedErr)
}

func TestMockUserRepository_GetRefreshToken_Default(t *testing.T) {
	repo := NewMockUserRepository()

	token, err := repo.GetRefreshToken("refresh-token")
	assert.NoError(t, err)
	assert.Nil(t, token)
}

func TestMockUserRepository_GetRefreshToken_WithFunc(t *testing.T) {
	repo := NewMockUserRepository()

	repo.GetRefreshTokenFunc = func(token string) (*model.RefreshToken, error) {
		assert.Equal(t, "refresh-token", token)
		return &model.RefreshToken{ID: 1, Token: token, UserID: 7}, nil
	}

	rt, err := repo.GetRefreshToken("refresh-token")
	require.NoError(t, err)
	require.NotNil(t, rt)
	assert.Equal(t, 1, rt.ID)
	assert.Equal(t, 7, rt.UserID)
	assert.Equal(t, "refresh-token", rt.Token)
}

func TestMockUserRepository_DeleteRefreshToken_Default(t *testing.T) {
	repo := NewMockUserRepository()

	err := repo.DeleteRefreshToken("refresh-token")
	assert.NoError(t, err)
}

func TestMockUserRepository_DeleteRefreshToken_WithFunc(t *testing.T) {
	repo := NewMockUserRepository()
	expectedErr := errors.New("delete refresh failed")

	repo.DeleteRefreshTokenFunc = func(token string) error {
		assert.Equal(t, "refresh-token", token)
		return expectedErr
	}

	err := repo.DeleteRefreshToken("refresh-token")
	assert.ErrorIs(t, err, expectedErr)
}

func TestMockUserRepository_CreateAuditLog_Default(t *testing.T) {
	repo := NewMockUserRepository()

	err := repo.CreateAuditLog(&model.AuditLog{Action: "login"})
	assert.NoError(t, err)
}

func TestMockUserRepository_CreateAuditLog_WithFunc(t *testing.T) {
	repo := NewMockUserRepository()
	expectedErr := errors.New("audit log failed")

	repo.CreateAuditLogFunc = func(log *model.AuditLog) error {
		assert.Equal(t, "login", log.Action)
		return expectedErr
	}

	err := repo.CreateAuditLog(&model.AuditLog{Action: "login"})
	assert.ErrorIs(t, err, expectedErr)
}
