package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/Seatify-org/seatify-common/model"
	"github.com/gorilla/mux"
	"github.com/seatify/backend/booking-service/internal/service"
	"go.uber.org/zap"
)

type AdminServiceInterface interface {
	GetMovies() ([]model.Movie, error)
	CreateMovie(movie *model.Movie) error
	UpdateMovie(movie *model.Movie) error
	DeleteMovie(id int) error

	GetCinemas() ([]model.Cinema, error)
	CreateCinema(cinema *model.Cinema) error
	UpdateCinema(cinema *model.Cinema) error
	DeleteCinema(id int) error

	GetHallsByCinema(cinemaID int) ([]model.Hall, error)
	CreateHall(hall *model.Hall) error

	GetSessions() ([]model.Session, error)
	CreateSession(session *model.Session) error
	UpdateSession(session *model.Session) error
	DeleteSession(id int) error
}

type AdminHandler struct {
	adminService AdminServiceInterface
	logger       *zap.Logger
}

type createMovieRequest struct {
	Title       string    `json:"title" example:"Dune: Part Two"`
	Description string    `json:"description" example:"Epic sci-fi film"`
	Duration    int       `json:"duration_minutes" example:"166"`
	ReleaseDate time.Time `json:"release_date" example:"2024-03-01T00:00:00Z"`
	PosterURL   string    `json:"poster_url" example:"https://example.com/poster.jpg"`
	BannerURL   string    `json:"banner_url" example:"https://example.com/banner.jpg"`
	TrailerURL  string    `json:"trailer_url" example:"https://example.com/trailer.mp4"`
	Rating      float64   `json:"rating" example:"8.7"`
}

type updateMovieRequest struct {
	Title       string    `json:"title" example:"Dune: Part Two"`
	Description string    `json:"description" example:"Epic sci-fi film"`
	Duration    int       `json:"duration_minutes" example:"166"`
	ReleaseDate time.Time `json:"release_date" example:"2024-03-01T00:00:00Z"`
	PosterURL   string    `json:"poster_url" example:"https://example.com/poster.jpg"`
	BannerURL   string    `json:"banner_url" example:"https://example.com/banner.jpg"`
	TrailerURL  string    `json:"trailer_url" example:"https://example.com/trailer.mp4"`
	Rating      float64   `json:"rating" example:"8.7"`
}

type createCinemaRequest struct {
	Name      string  `json:"name"`
	Address   string  `json:"address"`
	City      string  `json:"city"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Rating    float64 `json:"rating"`
	Phone     string  `json:"phone"`
}

type updateCinemaRequest struct {
	Name      string  `json:"name"`
	Address   string  `json:"address"`
	City      string  `json:"city"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Rating    float64 `json:"rating"`
	Phone     string  `json:"phone"`
}

type createHallRequest struct {
	CinemaID    int    `json:"cinema_id" example:"1"`
	Name        string `json:"name" example:"VIP Hall 1"`
	Rows        int    `json:"rows" example:"10"`
	SeatsPerRow int    `json:"seats_per_row" example:"10"`
}

type createSessionRequest struct {
	MovieID        int       `json:"movie_id" example:"1"`
	HallID         int       `json:"hall_id" example:"1"`
	StartTime      time.Time `json:"start_time" example:"2026-05-29T18:00:00Z"`
	BasePriceCents int       `json:"base_price_cents" example:"1200"`
}

type updateSessionRequest struct {
	MovieID        int       `json:"movie_id" example:"1"`
	HallID         int       `json:"hall_id" example:"1"`
	StartTime      time.Time `json:"start_time" example:"2026-05-29T18:00:00Z"`
	BasePriceCents int       `json:"base_price_cents" example:"1200"`
}

type sessionResponse struct {
	ID             int       `json:"id"`
	MovieID        int       `json:"movie_id"`
	HallID         int       `json:"hall_id"`
	StartTime      time.Time `json:"start_time"`
	BasePriceCents int       `json:"base_price_cents"`
}

func NewAdminHandler(adminService AdminServiceInterface, logger *zap.Logger) *AdminHandler {
	if logger == nil {
		logger = zap.NewNop()
	}

	return &AdminHandler{
		adminService: adminService,
		logger:       logger,
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

func decodeJSONBody(w http.ResponseWriter, r *http.Request, dst interface{}) bool {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	if err := dec.Decode(dst); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return false
	}

	if dec.Decode(&struct{}{}) != nil && !errors.Is(dec.Decode(&struct{}{}), nil) {
	}

	return true
}

func requireNonEmpty(value string, field string) error {
	if strings.TrimSpace(value) == "" {
		return errors.New(field + " is required")
	}
	return nil
}

func validateMovieRequest(req createMovieRequest) error {
	if err := requireNonEmpty(req.Title, "title"); err != nil {
		return err
	}
	if req.Duration <= 0 {
		return errors.New("duration_minutes must be greater than 0")
	}
	return nil
}

func validateUpdateMovieRequest(req updateMovieRequest) error {
	if err := requireNonEmpty(req.Title, "title"); err != nil {
		return err
	}
	if req.Duration <= 0 {
		return errors.New("duration_minutes must be greater than 0")
	}
	return nil
}

func validateCinemaRequest(req createCinemaRequest) error {
	if err := requireNonEmpty(req.Name, "name"); err != nil {
		return err
	}
	return nil
}

func validateUpdateCinemaRequest(req updateCinemaRequest) error {
	if err := requireNonEmpty(req.Name, "name"); err != nil {
		return err
	}
	return nil
}

func validateHallRequest(req createHallRequest) error {
	if req.CinemaID <= 0 {
		return errors.New("cinema_id is required")
	}
	if err := requireNonEmpty(req.Name, "name"); err != nil {
		return err
	}
	if req.Rows <= 0 {
		return errors.New("rows must be greater than 0")
	}
	if req.SeatsPerRow <= 0 {
		return errors.New("seats_per_row must be greater than 0")
	}
	return nil
}

func validateSessionRequest(req createSessionRequest) error {
	if req.MovieID <= 0 {
		return errors.New("movie_id is required")
	}
	if req.HallID <= 0 {
		return errors.New("hall_id is required")
	}
	if req.StartTime.IsZero() {
		return errors.New("start_time is required")
	}
	if req.BasePriceCents <= 0 {
		return errors.New("base_price_cents must be greater than 0")
	}
	return nil
}

func validateUpdateSessionRequest(req updateSessionRequest) error {
	if req.MovieID <= 0 {
		return errors.New("movie_id is required")
	}
	if req.HallID <= 0 {
		return errors.New("hall_id is required")
	}
	if req.StartTime.IsZero() {
		return errors.New("start_time is required")
	}
	if req.BasePriceCents <= 0 {
		return errors.New("base_price_cents must be greater than 0")
	}
	return nil
}

func toSessionResponse(sess model.Session) sessionResponse {
	return sessionResponse{
		ID:             sess.ID,
		MovieID:        sess.MovieID,
		HallID:         sess.HallID,
		StartTime:      sess.StartTime,
		BasePriceCents: sess.BasePriceCents,
	}
}

func toSessionResponses(sessions []model.Session) []sessionResponse {
	result := make([]sessionResponse, 0, len(sessions))
	for _, sess := range sessions {
		result = append(result, toSessionResponse(sess))
	}
	return result
}

// GetMovies godoc
// @Summary Get admin movies
// @Description Returns all movies for admin management
// @Tags admin
// @Produce json
// @Success 200 {array} model.Movie
// @Failure 500 {object} map[string]string
// @Router /admin/movies [get]
func (h *AdminHandler) GetMovies(w http.ResponseWriter, r *http.Request) {
	movies, err := h.adminService.GetMovies()
	if err != nil {
		h.logger.Error("get movies failed", zap.Error(err))
		writeError(w, http.StatusInternalServerError, "failed to fetch movies")
		return
	}

	writeJSON(w, http.StatusOK, movies)
}

// CreateMovie godoc
// @Summary Create movie
// @Description Creates a new movie
// @Tags admin
// @Accept json
// @Produce json
// @Param request body createMovieRequest true "Movie payload"
// @Success 201 {object} model.Movie
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/movies [post]
func (h *AdminHandler) CreateMovie(w http.ResponseWriter, r *http.Request) {
	var req createMovieRequest
	if !decodeJSONBody(w, r, &req) {
		return
	}

	if err := validateMovieRequest(req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	movie := model.Movie{
		Title:       req.Title,
		Description: req.Description,
		Duration:    req.Duration,
		ReleaseDate: req.ReleaseDate,
		PosterURL:   req.PosterURL,
		BannerURL:   req.BannerURL,
		TrailerURL:  req.TrailerURL,
		Rating:      req.Rating,
	}

	if err := h.adminService.CreateMovie(&movie); err != nil {
		h.logger.Error("create movie failed", zap.Error(err))
		writeError(w, http.StatusInternalServerError, "failed to create movie")
		return
	}

	writeJSON(w, http.StatusCreated, movie)
}

// UpdateMovie godoc
// @Summary Update movie
// @Description Updates movie by ID
// @Tags admin
// @Accept json
// @Produce json
// @Param id path int true "Movie ID"
// @Param request body updateMovieRequest true "Movie payload"
// @Success 200 {object} model.Movie
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/movies/{id} [put]
func (h *AdminHandler) UpdateMovie(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid movie id")
		return
	}

	var req updateMovieRequest
	if !decodeJSONBody(w, r, &req) {
		return
	}

	if err := validateUpdateMovieRequest(req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	movie := model.Movie{
		ID:          id,
		Title:       req.Title,
		Description: req.Description,
		Duration:    req.Duration,
		ReleaseDate: req.ReleaseDate,
		PosterURL:   req.PosterURL,
		BannerURL:   req.BannerURL,
		TrailerURL:  req.TrailerURL,
		Rating:      req.Rating,
	}

	if err := h.adminService.UpdateMovie(&movie); err != nil {
		h.logger.Error("update movie failed", zap.Error(err), zap.Int("movie_id", id))
		writeError(w, mapAdminError(err), "failed to update movie")
		return
	}

	writeJSON(w, http.StatusOK, movie)
}

// DeleteMovie godoc
// @Summary Delete movie
// @Description Deletes movie by ID
// @Tags admin
// @Produce json
// @Param id path int true "Movie ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/movies/{id} [delete]
func (h *AdminHandler) DeleteMovie(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid movie id")
		return
	}

	if err := h.adminService.DeleteMovie(id); err != nil {
		h.logger.Error("delete movie failed", zap.Error(err), zap.Int("movie_id", id))
		writeError(w, mapAdminError(err), "failed to delete movie")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "movie deleted"})
}

// GetCinemas godoc
// @Summary Get cinemas
// @Description Returns all cinemas
// @Tags admin
// @Produce json
// @Success 200 {array} model.Cinema
// @Failure 500 {object} map[string]string
// @Router /admin/cinemas [get]
func (h *AdminHandler) GetCinemas(w http.ResponseWriter, r *http.Request) {
	cinemas, err := h.adminService.GetCinemas()
	if err != nil {
		h.logger.Error("get cinemas failed", zap.Error(err))
		writeError(w, http.StatusInternalServerError, "failed to fetch cinemas")
		return
	}

	writeJSON(w, http.StatusOK, cinemas)
}

// CreateCinema godoc
// @Summary Create cinema
// @Description Creates a new cinema
// @Tags admin
// @Accept json
// @Produce json
// @Param request body createCinemaRequest true "Cinema payload"
// @Success 201 {object} model.Cinema
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/cinemas [post]
func (h *AdminHandler) CreateCinema(w http.ResponseWriter, r *http.Request) {
	var req createCinemaRequest
	if !decodeJSONBody(w, r, &req) {
		return
	}

	if err := validateCinemaRequest(req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	cinema := model.Cinema{
		Name:        req.Name,
		Address:     req.Address,
		City:        req.City,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
		Rating:      req.Rating,
		PhoneNumber: req.Phone,
	}

	if err := h.adminService.CreateCinema(&cinema); err != nil {
		h.logger.Error("create cinema failed", zap.Error(err))
		writeError(w, http.StatusInternalServerError, "failed to create cinema")
		return
	}

	writeJSON(w, http.StatusCreated, cinema)
}

// UpdateCinema godoc
// @Summary Update cinema
// @Description Updates cinema by ID
// @Tags admin
// @Accept json
// @Produce json
// @Param id path int true "Cinema ID"
// @Param request body updateCinemaRequest true "Cinema payload"
// @Success 200 {object} model.Cinema
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/cinemas/{id} [put]
func (h *AdminHandler) UpdateCinema(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid cinema id")
		return
	}

	var req updateCinemaRequest
	if !decodeJSONBody(w, r, &req) {
		return
	}

	if err := validateUpdateCinemaRequest(req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	cinema := model.Cinema{
		ID:          id,
		Name:        req.Name,
		Address:     req.Address,
		City:        req.City,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
		Rating:      req.Rating,
		PhoneNumber: req.Phone,
	}

	if err := h.adminService.UpdateCinema(&cinema); err != nil {
		h.logger.Error("update cinema failed", zap.Error(err), zap.Int("cinema_id", id))
		writeError(w, mapAdminError(err), "failed to update cinema")
		return
	}

	writeJSON(w, http.StatusOK, cinema)
}

// DeleteCinema godoc
// @Summary Delete cinema
// @Description Deletes cinema by ID
// @Tags admin
// @Produce json
// @Param id path int true "Cinema ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/cinemas/{id} [delete]
func (h *AdminHandler) DeleteCinema(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid cinema id")
		return
	}

	if err := h.adminService.DeleteCinema(id); err != nil {
		h.logger.Error("delete cinema failed", zap.Error(err), zap.Int("cinema_id", id))
		writeError(w, mapAdminError(err), "failed to delete cinema")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "cinema deleted"})
}

// GetHallsByCinema godoc
// @Summary Get halls by cinema
// @Description Returns all halls for cinema
// @Tags admin
// @Produce json
// @Param cinemaId path int true "Cinema ID"
// @Success 200 {array} model.Hall
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/cinemas/{cinemaId}/halls [get]
func (h *AdminHandler) GetHallsByCinema(w http.ResponseWriter, r *http.Request) {
	cinemaID, err := strconv.Atoi(mux.Vars(r)["cinemaId"])
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid cinema id")
		return
	}

	halls, err := h.adminService.GetHallsByCinema(cinemaID)
	if err != nil {
		h.logger.Error("get halls failed", zap.Error(err), zap.Int("cinema_id", cinemaID))
		writeError(w, mapAdminError(err), "failed to fetch halls")
		return
	}

	writeJSON(w, http.StatusOK, halls)
}

// CreateHall godoc
// @Summary Create hall
// @Description Creates a new hall
// @Tags admin
// @Accept json
// @Produce json
// @Param request body createHallRequest true "Hall payload"
// @Success 201 {object} model.Hall
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/halls [post]
func (h *AdminHandler) CreateHall(w http.ResponseWriter, r *http.Request) {
	var req createHallRequest
	if !decodeJSONBody(w, r, &req) {
		return
	}

	if err := validateHallRequest(req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	hall := model.Hall{
		CinemaID:    req.CinemaID,
		Name:        req.Name,
		Rows:        req.Rows,
		SeatsPerRow: req.SeatsPerRow,
		TotalSeats:  req.Rows * req.SeatsPerRow,
	}

	if err := h.adminService.CreateHall(&hall); err != nil {
		h.logger.Error("create hall failed", zap.Error(err), zap.Int("cinema_id", hall.CinemaID))
		writeError(w, mapAdminError(err), "failed to create hall")
		return
	}

	writeJSON(w, http.StatusCreated, hall)
}

// GetSessions godoc
// @Summary Get sessions
// @Description Returns all sessions
// @Tags admin
// @Produce json
// @Success 200 {array} sessionResponse
// @Failure 500 {object} map[string]string
// @Router /admin/sessions [get]
func (h *AdminHandler) GetSessions(w http.ResponseWriter, r *http.Request) {
	sessions, err := h.adminService.GetSessions()
	if err != nil {
		h.logger.Error("get sessions failed", zap.Error(err))
		writeError(w, http.StatusInternalServerError, "failed to fetch sessions")
		return
	}

	writeJSON(w, http.StatusOK, toSessionResponses(sessions))
}

// CreateSession godoc
// @Summary Create session
// @Description Creates a new session
// @Tags admin
// @Accept json
// @Produce json
// @Param request body createSessionRequest true "Session payload"
// @Success 201 {object} sessionResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/sessions [post]
func (h *AdminHandler) CreateSession(w http.ResponseWriter, r *http.Request) {
	var req createSessionRequest
	if !decodeJSONBody(w, r, &req) {
		return
	}

	if err := validateSessionRequest(req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	sess := model.Session{
		MovieID:        req.MovieID,
		HallID:         req.HallID,
		StartTime:      req.StartTime,
		BasePriceCents: req.BasePriceCents,
	}

	if err := h.adminService.CreateSession(&sess); err != nil {
		h.logger.Error("create session failed", zap.Error(err))
		writeError(w, http.StatusInternalServerError, "failed to create session")
		return
	}

	writeJSON(w, http.StatusCreated, toSessionResponse(sess))
}

// UpdateSession godoc
// @Summary Update session
// @Description Updates session by ID
// @Tags admin
// @Accept json
// @Produce json
// @Param id path int true "Session ID"
// @Param request body updateSessionRequest true "Session payload"
// @Success 200 {object} sessionResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/sessions/{id} [put]
func (h *AdminHandler) UpdateSession(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid session id")
		return
	}

	var req updateSessionRequest
	if !decodeJSONBody(w, r, &req) {
		return
	}

	if err := validateUpdateSessionRequest(req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	sess := model.Session{
		ID:             id,
		MovieID:        req.MovieID,
		HallID:         req.HallID,
		StartTime:      req.StartTime,
		BasePriceCents: req.BasePriceCents,
	}

	if err := h.adminService.UpdateSession(&sess); err != nil {
		h.logger.Error("update session failed", zap.Error(err), zap.Int("session_id", id))
		writeError(w, mapAdminError(err), "failed to update session")
		return
	}

	writeJSON(w, http.StatusOK, toSessionResponse(sess))
}

// DeleteSession godoc
// @Summary Delete session
// @Description Deletes session by ID
// @Tags admin
// @Produce json
// @Param id path int true "Session ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/sessions/{id} [delete]
func (h *AdminHandler) DeleteSession(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid session id")
		return
	}

	if err := h.adminService.DeleteSession(id); err != nil {
		h.logger.Error("delete session failed", zap.Error(err), zap.Int("session_id", id))
		writeError(w, mapAdminError(err), "failed to delete session")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "session deleted"})
}

func mapAdminError(err error) int {
	switch {
	case errors.Is(err, service.ErrMovieNotFound),
		errors.Is(err, service.ErrCinemaNotFound),
		errors.Is(err, service.ErrHallNotFound),
		errors.Is(err, service.ErrSessionNotFound):
		return http.StatusNotFound
	default:
		return http.StatusInternalServerError
	}
}
