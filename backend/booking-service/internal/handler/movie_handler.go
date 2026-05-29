package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/Seatify-org/seatify-common/model"
	"github.com/seatify/backend/booking-service/internal/service"
	"go.uber.org/zap"
)

type MovieServiceInterface interface {
	GetAll() ([]*model.Movie, error)
	GetByID(id int64) (*model.Movie, error)
	GetSessionsByMovieID(movieID int64) ([]*model.Session, error)
	GetSessionByID(id int64) (*model.Session, error)
}

type MovieHandler struct {
	movieService MovieServiceInterface
	logger       *zap.Logger
}

func NewMovieHandler(movieService MovieServiceInterface, logger *zap.Logger) *MovieHandler {
	if logger == nil {
		logger = zap.NewNop()
	}

	return &MovieHandler{
		movieService: movieService,
		logger:       logger,
	}
}

func (h *MovieHandler) writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func (h *MovieHandler) writeError(w http.ResponseWriter, status int, message string) {
	h.writeJSON(w, status, map[string]string{"error": message})
}

// GetMovies godoc
// @Summary Get all movies
// @Tags movies
// @Produce json
// @Success 200 {array} model.Movie
// @Failure 500 {object} map[string]string
// @Router /movies [get]
func (h *MovieHandler) GetMovies(w http.ResponseWriter, r *http.Request) {
	movies, err := h.movieService.GetAll()
	if err != nil {
		h.logger.Error("failed to get movies", zap.Error(err))
		h.writeError(w, http.StatusInternalServerError, "failed to get movies")
		return
	}

	h.writeJSON(w, http.StatusOK, movies)
}

// GetMovieByID godoc
// @Summary Get movie by ID
// @Tags movies
// @Produce json
// @Param id path int true "Movie ID"
// @Success 200 {object} model.Movie
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /movies/{id} [get]
func (h *MovieHandler) GetMovieByID(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/movies/")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		h.writeError(w, http.StatusBadRequest, "invalid movie id")
		return
	}

	movie, err := h.movieService.GetByID(id)
	if err != nil {
		if errors.Is(err, service.ErrMovieNotFound) {
			h.writeError(w, http.StatusNotFound, "movie not found")
			return
		}

		h.logger.Error("failed to get movie by id", zap.Error(err), zap.Int64("movie_id", id))
		h.writeError(w, http.StatusInternalServerError, "failed to get movie")
		return
	}

	h.writeJSON(w, http.StatusOK, movie)
}

// GetSessionsByMovieID godoc
// @Summary Get sessions by movie ID
// @Tags movies
// @Produce json
// @Param id path int true "Movie ID"
// @Success 200 {array} model.Session
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /movies/{id}/sessions [get]
func (h *MovieHandler) GetSessionsByMovieID(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/movies/")
	parts := strings.Split(path, "/")
	if len(parts) < 2 {
		h.writeError(w, http.StatusBadRequest, "invalid request path")
		return
	}

	id, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil || id <= 0 {
		h.writeError(w, http.StatusBadRequest, "invalid movie id")
		return
	}

	sessions, err := h.movieService.GetSessionsByMovieID(id)
	if err != nil {
		if errors.Is(err, service.ErrMovieNotFound) {
			h.writeError(w, http.StatusNotFound, "movie not found")
			return
		}

		h.logger.Error("failed to get sessions by movie id", zap.Error(err), zap.Int64("movie_id", id))
		h.writeError(w, http.StatusInternalServerError, "failed to get sessions")
		return
	}

	h.writeJSON(w, http.StatusOK, sessions)
}

// GetSessionByID godoc
// @Summary Get session by ID
// @Tags movies
// @Produce json
// @Param id path int true "Session ID"
// @Success 200 {object} model.Session
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /sessions/{id} [get]
func (h *MovieHandler) GetSessionByID(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/sessions/")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		h.writeError(w, http.StatusBadRequest, "invalid session id")
		return
	}

	session, err := h.movieService.GetSessionByID(id)
	if err != nil {
		if errors.Is(err, service.ErrSessionNotFound) {
			h.writeError(w, http.StatusNotFound, "session not found")
			return
		}

		h.logger.Error("failed to get session by id", zap.Error(err), zap.Int64("session_id", id))
		h.writeError(w, http.StatusInternalServerError, "failed to get session")
		return
	}

	h.writeJSON(w, http.StatusOK, session)
}
