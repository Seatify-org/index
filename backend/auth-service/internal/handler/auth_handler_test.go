package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Seatify-org/seatify-common/model"
	"github.com/seatify/backend/auth-service/internal/service"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

type stubAuthService struct {
	RegisterFunc func(input service.RegisterInput, ip, userAgent string) (*service.AuthTokens, error)
	LoginFunc    func(input service.LoginInput, ip, userAgent string) (*service.AuthTokens, error)
	RefreshFunc  func(refreshToken, ip, userAgent string) (*service.AuthTokens, error)
	GetMeFunc    func(accessToken string) (*model.User, error)
}

func (s *stubAuthService) Register(input service.RegisterInput, ip, userAgent string) (*service.AuthTokens, error) {
	if s.RegisterFunc != nil {
		return s.RegisterFunc(input, ip, userAgent)
	}
	return nil, nil
}

func (s *stubAuthService) Login(input service.LoginInput, ip, userAgent string) (*service.AuthTokens, error) {
	if s.LoginFunc != nil {
		return s.LoginFunc(input, ip, userAgent)
	}
	return nil, nil
}

func (s *stubAuthService) Refresh(refreshToken, ip, userAgent string) (*service.AuthTokens, error) {
	if s.RefreshFunc != nil {
		return s.RefreshFunc(refreshToken, ip, userAgent)
	}
	return nil, nil
}

func (s *stubAuthService) GetMe(accessToken string) (*model.User, error) {
	if s.GetMeFunc != nil {
		return s.GetMeFunc(accessToken)
	}
	return nil, nil
}

func TestAuthHandler_Register_Success(t *testing.T) {
	svc := &stubAuthService{
		RegisterFunc: func(input service.RegisterInput, ip, userAgent string) (*service.AuthTokens, error) {
			return &service.AuthTokens{
				AccessToken:  "access-token",
				RefreshToken: "refresh-token",
				User: &model.User{
					ID:       1,
					Username: input.Username,
					Email:    input.Email,
					Role:     "user",
				},
			}, nil
		},
	}

	h := NewAuthHandler(svc, zap.NewNop())

	body := map[string]string{
		"username": "maksim",
		"email":    "maksim@example.com",
		"password": "password123",
	}
	b, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	h.Register(rr, req)

	assert.Equal(t, http.StatusCreated, rr.Code)
	assert.Contains(t, rr.Body.String(), "access-token")
	assert.Contains(t, rr.Body.String(), "refresh-token")
	assert.Contains(t, rr.Body.String(), "maksim@example.com")
}

func TestAuthHandler_Register_BadRequest(t *testing.T) {
	svc := &stubAuthService{}
	h := NewAuthHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewBufferString("{invalid-json"))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	h.Register(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid request body")
}

func TestAuthHandler_Register_Conflict(t *testing.T) {
	svc := &stubAuthService{
		RegisterFunc: func(input service.RegisterInput, ip, userAgent string) (*service.AuthTokens, error) {
			return nil, service.ErrUserAlreadyExists
		},
	}

	h := NewAuthHandler(svc, zap.NewNop())

	body := map[string]string{
		"username": "maksim",
		"email":    "maksim@example.com",
		"password": "password123",
	}
	b, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	h.Register(rr, req)

	assert.Equal(t, http.StatusConflict, rr.Code)
	assert.Contains(t, rr.Body.String(), "user already exists")
}

func TestAuthHandler_Login_Success(t *testing.T) {
	svc := &stubAuthService{
		LoginFunc: func(input service.LoginInput, ip, userAgent string) (*service.AuthTokens, error) {
			return &service.AuthTokens{
				AccessToken:  "access-token",
				RefreshToken: "refresh-token",
				User: &model.User{
					ID:       1,
					Username: "maksim",
					Email:    input.Email,
					Role:     "user",
				},
			}, nil
		},
	}

	h := NewAuthHandler(svc, zap.NewNop())

	body := map[string]string{
		"email":    "maksim@example.com",
		"password": "password123",
	}
	b, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	h.Login(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "access-token")
	assert.Contains(t, rr.Body.String(), "refresh-token")
}

func TestAuthHandler_Login_InvalidCredentials(t *testing.T) {
	svc := &stubAuthService{
		LoginFunc: func(input service.LoginInput, ip, userAgent string) (*service.AuthTokens, error) {
			return nil, service.ErrInvalidCredentials
		},
	}

	h := NewAuthHandler(svc, zap.NewNop())

	body := map[string]string{
		"email":    "maksim@example.com",
		"password": "wrong-password",
	}
	b, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	h.Login(rr, req)

	assert.Equal(t, http.StatusUnauthorized, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid credentials")
}

func TestAuthHandler_Refresh_Success(t *testing.T) {
	svc := &stubAuthService{
		RefreshFunc: func(refreshToken, ip, userAgent string) (*service.AuthTokens, error) {
			return &service.AuthTokens{
				AccessToken:  "new-access-token",
				RefreshToken: "new-refresh-token",
				User: &model.User{
					ID:       1,
					Username: "maksim",
					Email:    "maksim@example.com",
					Role:     "user",
				},
			}, nil
		},
	}

	h := NewAuthHandler(svc, zap.NewNop())

	body := map[string]string{
		"refresh_token": "old-refresh-token",
	}
	b, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/auth/refresh", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	h.Refresh(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "new-access-token")
	assert.Contains(t, rr.Body.String(), "new-refresh-token")
}

func TestAuthHandler_Refresh_InvalidToken(t *testing.T) {
	svc := &stubAuthService{
		RefreshFunc: func(refreshToken, ip, userAgent string) (*service.AuthTokens, error) {
			return nil, service.ErrInvalidToken
		},
	}

	h := NewAuthHandler(svc, zap.NewNop())

	body := map[string]string{
		"refresh_token": "bad-token",
	}
	b, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/auth/refresh", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	h.Refresh(rr, req)

	assert.Equal(t, http.StatusUnauthorized, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid refresh token")
}

func TestAuthHandler_Me_MissingHeader(t *testing.T) {
	svc := &stubAuthService{}
	h := NewAuthHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	rr := httptest.NewRecorder()

	h.Me(rr, req)

	assert.Equal(t, http.StatusUnauthorized, rr.Code)
	assert.Contains(t, rr.Body.String(), "missing authorization header")
}

func TestAuthHandler_Me_InvalidHeader(t *testing.T) {
	svc := &stubAuthService{}
	h := NewAuthHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	req.Header.Set("Authorization", "InvalidHeader")

	rr := httptest.NewRecorder()
	h.Me(rr, req)

	assert.Equal(t, http.StatusUnauthorized, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid authorization header")
}

func TestAuthHandler_Me_Success(t *testing.T) {
	svc := &stubAuthService{
		GetMeFunc: func(accessToken string) (*model.User, error) {
			return &model.User{
				ID:       1,
				Username: "maksim",
				Email:    "maksim@example.com",
				Role:     "user",
			}, nil
		},
	}

	h := NewAuthHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	req.Header.Set("Authorization", "Bearer valid-access-token")

	rr := httptest.NewRecorder()
	h.Me(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "maksim@example.com")
	assert.Contains(t, rr.Body.String(), "maksim")
}
