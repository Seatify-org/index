package handler

import (
	"encoding/json"
	"net/http"

	"github.com/seatify/backend/common/model"
	"github.com/seatify/backend/auth-service/internal/service"
	"go.uber.org/zap"
)

type AuthHandler struct {
	authService *service.AuthService
	logger      *zap.Logger
}

func NewAuthHandler(authService *service.AuthService, logger *zap.Logger) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		logger:      logger,
	}
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	User  *model.User `json:"user"`
	Token string      `json:"token"`
}

// @Summary Register a new user
// @Description Register a new user with email, password and name
// @Tags auth
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "Register request"
// @Success 201 {object} AuthResponse
// @Failure 400 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Router /api/v1/auth/register [post]
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Error("failed to decode register request", zap.Error(err))
		http.Error(w, `{"error": "invalid request body"}`, http.StatusBadRequest)
		return
	}

	user, err := h.authService.Register(req.Email, req.Password, req.Name)
	if err != nil {
		if err == service.ErrUserAlreadyExists {
			h.logger.Warn("user already exists", zap.String("email", req.Email))
			http.Error(w, `{"error": "user already exists"}`, http.StatusConflict)
			return
		}
		h.logger.Error("failed to register user", zap.Error(err))
		http.Error(w, `{"error": "internal server error"}`, http.StatusInternalServerError)
		return
	}

	token, _ := h.authService.GenerateToken(user.ID, 0)

	h.logger.Info("user registered successfully", zap.Int64("user_id", user.ID))

	response := AuthResponse{User: user, Token: token}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// @Summary Login user
// @Description Authenticate user and return JWT token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Login request"
// @Success 200 {object} AuthResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /api/v1/auth/login [post]
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Error("failed to decode login request", zap.Error(err))
		http.Error(w, `{"error": "invalid request body"}`, http.StatusBadRequest)
		return
	}

	user, err := h.authService.Login(req.Email, req.Password)
	if err != nil {
		h.logger.Warn("invalid login credentials", zap.String("email", req.Email))
		http.Error(w, `{"error": "invalid credentials"}`, http.StatusUnauthorized)
		return
	}

	token, _ := h.authService.GenerateToken(user.ID, 0)

	h.logger.Info("user logged in successfully", zap.Int64("user_id", user.ID))

	response := AuthResponse{User: user, Token: token}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// @Summary Get user profile
// @Description Get current user profile by ID
// @Tags auth
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {object} model.User
// @Failure 404 {object} map[string]string
// @Router /api/v1/auth/users/{id} [get]
func (h *AuthHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	// Implementation would extract user ID from JWT token
	h.logger.Info("get user profile")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "not implemented"})
}
