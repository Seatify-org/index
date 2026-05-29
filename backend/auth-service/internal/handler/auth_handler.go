package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/Seatify-org/seatify-common/model"
	"github.com/seatify/backend/auth-service/internal/service"
	"go.uber.org/zap"
)

type AuthServiceInterface interface {
	Register(input service.RegisterInput, ip, userAgent string) (*service.AuthTokens, error)
	Login(input service.LoginInput, ip, userAgent string) (*service.AuthTokens, error)
	Refresh(refreshToken, ip, userAgent string) (*service.AuthTokens, error)
	GetMe(accessToken string) (*model.User, error)
}

type AuthHandler struct {
	authService AuthServiceInterface
	logger      *zap.Logger
}

type registerRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func NewAuthHandler(authService AuthServiceInterface, logger *zap.Logger) *AuthHandler {
	if logger == nil {
		logger = zap.NewNop()
	}

	return &AuthHandler{
		authService: authService,
		logger:      logger,
	}
}

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// Register godoc
// @Summary Register user
// @Tags auth
// @Accept json
// @Produce json
// @Param request body registerRequest true "Register payload"
// @Success 201 {object} service.AuthTokens
// @Failure 400 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/register [post]
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	tokens, err := h.authService.Register(
		service.RegisterInput{
			Username: req.Username,
			Email:    req.Email,
			Password: req.Password,
		},
		r.RemoteAddr,
		r.UserAgent(),
	)
	if err != nil {
		if errors.Is(err, service.ErrUserAlreadyExists) {
			writeError(w, http.StatusConflict, "user already exists")
			return
		}

		h.logger.Error("register failed", zap.Error(err), zap.String("email", req.Email))
		writeError(w, http.StatusInternalServerError, "failed to register")
		return
	}

	writeJSON(w, http.StatusCreated, tokens)
}

// Login godoc
// @Summary Login user
// @Tags auth
// @Accept json
// @Produce json
// @Param request body loginRequest true "Login payload"
// @Success 200 {object} service.AuthTokens
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/login [post]
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	tokens, err := h.authService.Login(
		service.LoginInput{
			Email:    req.Email,
			Password: req.Password,
		},
		r.RemoteAddr,
		r.UserAgent(),
	)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			writeError(w, http.StatusUnauthorized, "invalid credentials")
			return
		}

		h.logger.Error("login failed", zap.Error(err), zap.String("email", req.Email))
		writeError(w, http.StatusInternalServerError, "failed to login")
		return
	}

	writeJSON(w, http.StatusOK, tokens)
}

// Refresh godoc
// @Summary Refresh tokens
// @Tags auth
// @Accept json
// @Produce json
// @Param request body refreshRequest true "Refresh payload"
// @Success 200 {object} service.AuthTokens
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/refresh [post]
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req refreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	tokens, err := h.authService.Refresh(req.RefreshToken, r.RemoteAddr, r.UserAgent())
	if err != nil {
		if errors.Is(err, service.ErrInvalidToken) {
			writeError(w, http.StatusUnauthorized, "invalid refresh token")
			return
		}

		h.logger.Error("refresh failed", zap.Error(err))
		writeError(w, http.StatusInternalServerError, "failed to refresh token")
		return
	}

	writeJSON(w, http.StatusOK, tokens)
}

// Me godoc
// @Summary Get current user
// @Tags auth
// @Produce json
// @Success 200 {object} model.User
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/me [get]
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		writeError(w, http.StatusUnauthorized, "missing authorization header")
		return
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		writeError(w, http.StatusUnauthorized, "invalid authorization header")
		return
	}

	user, err := h.authService.GetMe(parts[1])
	if err != nil {
		if errors.Is(err, service.ErrInvalidToken) {
			writeError(w, http.StatusUnauthorized, "invalid token")
			return
		}

		h.logger.Error("get me failed", zap.Error(err))
		writeError(w, http.StatusInternalServerError, "failed to fetch current user")
		return
	}

	writeJSON(w, http.StatusOK, user)
}
