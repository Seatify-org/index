package handler

import (
	"bytes"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Seatify-org/seatify-common/model"
	"github.com/gorilla/mux"
	"github.com/seatify/backend/booking-service/internal/service"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

type mockAdminService struct {
	GetMoviesFunc   func() ([]model.Movie, error)
	CreateMovieFunc func(movie *model.Movie) error
	UpdateMovieFunc func(movie *model.Movie) error
	DeleteMovieFunc func(id int) error

	GetCinemasFunc   func() ([]model.Cinema, error)
	CreateCinemaFunc func(cinema *model.Cinema) error
	UpdateCinemaFunc func(cinema *model.Cinema) error
	DeleteCinemaFunc func(id int) error

	GetHallsByCinemaFunc func(cinemaID int) ([]model.Hall, error)
	CreateHallFunc       func(hall *model.Hall) error

	GetSessionsFunc   func() ([]model.Session, error)
	CreateSessionFunc func(session *model.Session) error
	UpdateSessionFunc func(session *model.Session) error
	DeleteSessionFunc func(id int) error
}

func (m *mockAdminService) GetMovies() ([]model.Movie, error) {
	if m.GetMoviesFunc != nil {
		return m.GetMoviesFunc()
	}
	return []model.Movie{}, nil
}

func (m *mockAdminService) CreateMovie(movie *model.Movie) error {
	if m.CreateMovieFunc != nil {
		return m.CreateMovieFunc(movie)
	}
	return nil
}

func (m *mockAdminService) UpdateMovie(movie *model.Movie) error {
	if m.UpdateMovieFunc != nil {
		return m.UpdateMovieFunc(movie)
	}
	return nil
}

func (m *mockAdminService) DeleteMovie(id int) error {
	if m.DeleteMovieFunc != nil {
		return m.DeleteMovieFunc(id)
	}
	return nil
}

func (m *mockAdminService) GetCinemas() ([]model.Cinema, error) {
	if m.GetCinemasFunc != nil {
		return m.GetCinemasFunc()
	}
	return []model.Cinema{}, nil
}

func (m *mockAdminService) CreateCinema(cinema *model.Cinema) error {
	if m.CreateCinemaFunc != nil {
		return m.CreateCinemaFunc(cinema)
	}
	return nil
}

func (m *mockAdminService) UpdateCinema(cinema *model.Cinema) error {
	if m.UpdateCinemaFunc != nil {
		return m.UpdateCinemaFunc(cinema)
	}
	return nil
}

func (m *mockAdminService) DeleteCinema(id int) error {
	if m.DeleteCinemaFunc != nil {
		return m.DeleteCinemaFunc(id)
	}
	return nil
}

func (m *mockAdminService) GetHallsByCinema(cinemaID int) ([]model.Hall, error) {
	if m.GetHallsByCinemaFunc != nil {
		return m.GetHallsByCinemaFunc(cinemaID)
	}
	return []model.Hall{}, nil
}

func (m *mockAdminService) CreateHall(hall *model.Hall) error {
	if m.CreateHallFunc != nil {
		return m.CreateHallFunc(hall)
	}
	return nil
}

func (m *mockAdminService) GetSessions() ([]model.Session, error) {
	if m.GetSessionsFunc != nil {
		return m.GetSessionsFunc()
	}
	return []model.Session{}, nil
}

func (m *mockAdminService) CreateSession(session *model.Session) error {
	if m.CreateSessionFunc != nil {
		return m.CreateSessionFunc(session)
	}
	return nil
}

func (m *mockAdminService) UpdateSession(session *model.Session) error {
	if m.UpdateSessionFunc != nil {
		return m.UpdateSessionFunc(session)
	}
	return nil
}

func (m *mockAdminService) DeleteSession(id int) error {
	if m.DeleteSessionFunc != nil {
		return m.DeleteSessionFunc(id)
	}
	return nil
}

func TestAdminHandler_GetMovies_Success(t *testing.T) {
	svc := &mockAdminService{
		GetMoviesFunc: func() ([]model.Movie, error) {
			return []model.Movie{
				{ID: 1, Title: "Dune"},
				{ID: 2, Title: "Matrix"},
			}, nil
		},
	}

	h := NewAdminHandler(svc, zap.NewNop())
	req := httptest.NewRequest(http.MethodGet, "/admin/movies", nil)
	rr := httptest.NewRecorder()

	h.GetMovies(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "Dune")
}

func TestAdminHandler_GetMovies_Error(t *testing.T) {
	svc := &mockAdminService{
		GetMoviesFunc: func() ([]model.Movie, error) {
			return nil, errors.New("db error")
		},
	}

	h := NewAdminHandler(svc, zap.NewNop())
	req := httptest.NewRequest(http.MethodGet, "/admin/movies", nil)
	rr := httptest.NewRecorder()

	h.GetMovies(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to fetch movies")
}

func TestAdminHandler_CreateMovie_Success(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	body := `{
		"title":"Interstellar",
		"description":"Sci-fi",
		"duration_minutes":169,
		"release_date":"2014-11-07T00:00:00Z",
		"poster_url":"https://example.com/poster.jpg",
		"banner_url":"https://example.com/banner.jpg",
		"trailer_url":"https://example.com/trailer.mp4",
		"rating":8.6
	}`
	req := httptest.NewRequest(http.MethodPost, "/admin/movies", bytes.NewBufferString(body))
	rr := httptest.NewRecorder()

	h.CreateMovie(rr, req)

	assert.Equal(t, http.StatusCreated, rr.Code)
	assert.Contains(t, rr.Body.String(), "Interstellar")
}

func TestAdminHandler_CreateMovie_InvalidBody(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPost, "/admin/movies", bytes.NewBufferString(`{invalid}`))
	rr := httptest.NewRecorder()

	h.CreateMovie(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid request body")
}

func TestAdminHandler_CreateMovie_Error(t *testing.T) {
	svc := &mockAdminService{
		CreateMovieFunc: func(movie *model.Movie) error {
			return errors.New("db error")
		},
	}
	h := NewAdminHandler(svc, zap.NewNop())

	body := `{
		"title":"Interstellar",
		"description":"Sci-fi",
		"duration_minutes":169,
		"release_date":"2014-11-07T00:00:00Z",
		"poster_url":"https://example.com/poster.jpg",
		"banner_url":"https://example.com/banner.jpg",
		"trailer_url":"https://example.com/trailer.mp4",
		"rating":8.6
	}`
	req := httptest.NewRequest(http.MethodPost, "/admin/movies", bytes.NewBufferString(body))
	rr := httptest.NewRecorder()

	h.CreateMovie(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to create movie")
}

func TestAdminHandler_UpdateMovie_Success(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	body := `{
		"title":"Updated Movie",
		"description":"Updated description",
		"duration_minutes":120,
		"release_date":"2014-11-07T00:00:00Z",
		"poster_url":"https://example.com/poster.jpg",
		"banner_url":"https://example.com/banner.jpg",
		"trailer_url":"https://example.com/trailer.mp4",
		"rating":8.1
	}`
	req := httptest.NewRequest(http.MethodPut, "/admin/movies/5", bytes.NewBufferString(body))
	req = mux.SetURLVars(req, map[string]string{"id": "5"})
	rr := httptest.NewRecorder()

	h.UpdateMovie(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), `"id":5`)
	assert.Contains(t, rr.Body.String(), "Updated Movie")
}

func TestAdminHandler_UpdateMovie_InvalidID(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPut, "/admin/movies/abc", bytes.NewBufferString(`{}`))
	req = mux.SetURLVars(req, map[string]string{"id": "abc"})
	rr := httptest.NewRecorder()

	h.UpdateMovie(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid movie id")
}

func TestAdminHandler_UpdateMovie_InvalidBody(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPut, "/admin/movies/1", bytes.NewBufferString(`{invalid}`))
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()

	h.UpdateMovie(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid request body")
}

func TestAdminHandler_UpdateMovie_Error(t *testing.T) {
	svc := &mockAdminService{
		UpdateMovieFunc: func(movie *model.Movie) error {
			return errors.New("db error")
		},
	}
	h := NewAdminHandler(svc, zap.NewNop())

	body := `{
		"title":"X",
		"description":"Updated description",
		"duration_minutes":120,
		"release_date":"2014-11-07T00:00:00Z",
		"poster_url":"https://example.com/poster.jpg",
		"banner_url":"https://example.com/banner.jpg",
		"trailer_url":"https://example.com/trailer.mp4",
		"rating":8.1
	}`
	req := httptest.NewRequest(http.MethodPut, "/admin/movies/1", bytes.NewBufferString(body))
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()

	h.UpdateMovie(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to update movie")
}

func TestAdminHandler_DeleteMovie_Success(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodDelete, "/admin/movies/1", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()

	h.DeleteMovie(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "movie deleted")
}

func TestAdminHandler_DeleteMovie_InvalidID(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodDelete, "/admin/movies/abc", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "abc"})
	rr := httptest.NewRecorder()

	h.DeleteMovie(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid movie id")
}

func TestAdminHandler_DeleteMovie_Error(t *testing.T) {
	svc := &mockAdminService{
		DeleteMovieFunc: func(id int) error {
			return errors.New("db error")
		},
	}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodDelete, "/admin/movies/1", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()

	h.DeleteMovie(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to delete movie")
}

func TestAdminHandler_GetCinemas_Success(t *testing.T) {
	svc := &mockAdminService{
		GetCinemasFunc: func() ([]model.Cinema, error) {
			return []model.Cinema{{ID: 1, Name: "Cinema City"}}, nil
		},
	}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/admin/cinemas", nil)
	rr := httptest.NewRecorder()

	h.GetCinemas(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "Cinema City")
}

func TestAdminHandler_GetCinemas_Error(t *testing.T) {
	svc := &mockAdminService{
		GetCinemasFunc: func() ([]model.Cinema, error) {
			return nil, errors.New("db error")
		},
	}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/admin/cinemas", nil)
	rr := httptest.NewRecorder()

	h.GetCinemas(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to fetch cinemas")
}

func TestAdminHandler_CreateCinema_Success(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPost, "/admin/cinemas", bytes.NewBufferString(`{"name":"Kino Star"}`))
	rr := httptest.NewRecorder()

	h.CreateCinema(rr, req)

	assert.Equal(t, http.StatusCreated, rr.Code)
	assert.Contains(t, rr.Body.String(), "Kino Star")
}

func TestAdminHandler_CreateCinema_InvalidBody(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPost, "/admin/cinemas", bytes.NewBufferString(`{invalid}`))
	rr := httptest.NewRecorder()

	h.CreateCinema(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid request body")
}

func TestAdminHandler_CreateCinema_Error(t *testing.T) {
	svc := &mockAdminService{
		CreateCinemaFunc: func(cinema *model.Cinema) error {
			return errors.New("db error")
		},
	}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPost, "/admin/cinemas", bytes.NewBufferString(`{"name":"Kino Star"}`))
	rr := httptest.NewRecorder()

	h.CreateCinema(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to create cinema")
}

func TestAdminHandler_UpdateCinema_Success(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPut, "/admin/cinemas/2", bytes.NewBufferString(`{"name":"Updated Cinema"}`))
	req = mux.SetURLVars(req, map[string]string{"id": "2"})
	rr := httptest.NewRecorder()

	h.UpdateCinema(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), `"id":2`)
	assert.Contains(t, rr.Body.String(), "Updated Cinema")
}

func TestAdminHandler_UpdateCinema_InvalidID(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPut, "/admin/cinemas/abc", bytes.NewBufferString(`{}`))
	req = mux.SetURLVars(req, map[string]string{"id": "abc"})
	rr := httptest.NewRecorder()

	h.UpdateCinema(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid cinema id")
}

func TestAdminHandler_UpdateCinema_InvalidBody(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPut, "/admin/cinemas/1", bytes.NewBufferString(`{invalid}`))
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()

	h.UpdateCinema(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid request body")
}

func TestAdminHandler_UpdateCinema_Error(t *testing.T) {
	svc := &mockAdminService{
		UpdateCinemaFunc: func(cinema *model.Cinema) error {
			return errors.New("db error")
		},
	}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPut, "/admin/cinemas/1", bytes.NewBufferString(`{"name":"X"}`))
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()

	h.UpdateCinema(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to update cinema")
}

func TestAdminHandler_DeleteCinema_Success(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodDelete, "/admin/cinemas/1", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()

	h.DeleteCinema(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "cinema deleted")
}

func TestAdminHandler_DeleteCinema_InvalidID(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodDelete, "/admin/cinemas/abc", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "abc"})
	rr := httptest.NewRecorder()

	h.DeleteCinema(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid cinema id")
}

func TestAdminHandler_DeleteCinema_Error(t *testing.T) {
	svc := &mockAdminService{
		DeleteCinemaFunc: func(id int) error {
			return errors.New("db error")
		},
	}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodDelete, "/admin/cinemas/1", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()

	h.DeleteCinema(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to delete cinema")
}

func TestAdminHandler_GetHallsByCinema_Success(t *testing.T) {
	svc := &mockAdminService{
		GetHallsByCinemaFunc: func(cinemaID int) ([]model.Hall, error) {
			return []model.Hall{{ID: 1, CinemaID: cinemaID, Name: "Hall A"}}, nil
		},
	}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/admin/cinemas/1/halls", nil)
	req = mux.SetURLVars(req, map[string]string{"cinemaId": "1"})
	rr := httptest.NewRecorder()

	h.GetHallsByCinema(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "Hall A")
}

func TestAdminHandler_GetHallsByCinema_InvalidID(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/admin/cinemas/abc/halls", nil)
	req = mux.SetURLVars(req, map[string]string{"cinemaId": "abc"})
	rr := httptest.NewRecorder()

	h.GetHallsByCinema(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid cinema id")
}

func TestAdminHandler_GetHallsByCinema_Error(t *testing.T) {
	svc := &mockAdminService{
		GetHallsByCinemaFunc: func(cinemaID int) ([]model.Hall, error) {
			return nil, errors.New("db error")
		},
	}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/admin/cinemas/1/halls", nil)
	req = mux.SetURLVars(req, map[string]string{"cinemaId": "1"})
	rr := httptest.NewRecorder()

	h.GetHallsByCinema(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to fetch halls")
}

func TestAdminHandler_CreateHall_Success(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPost, "/admin/halls", bytes.NewBufferString(`{
		"name":"Blue Hall",
		"cinema_id":1,
		"rows":10,
		"seats_per_row":12
	}`))
	rr := httptest.NewRecorder()

	h.CreateHall(rr, req)

	assert.Equal(t, http.StatusCreated, rr.Code)
	assert.Contains(t, rr.Body.String(), "Blue Hall")
	assert.Contains(t, rr.Body.String(), `"rows_count":10`)
	assert.Contains(t, rr.Body.String(), `"seats_per_row":12`)
	assert.Contains(t, rr.Body.String(), `"total_seats":120`)
}

func TestAdminHandler_CreateHall_InvalidBody(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPost, "/admin/halls", bytes.NewBufferString(`{invalid}`))
	rr := httptest.NewRecorder()

	h.CreateHall(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid request body")
}

func TestAdminHandler_CreateHall_Error(t *testing.T) {
	svc := &mockAdminService{
		CreateHallFunc: func(hall *model.Hall) error {
			return errors.New("db error")
		},
	}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPost, "/admin/halls", bytes.NewBufferString(`{
		"name":"Blue Hall",
		"cinema_id":1,
		"rows":10,
		"seats_per_row":12
	}`))
	rr := httptest.NewRecorder()

	h.CreateHall(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to create hall")
}

func TestAdminHandler_GetSessions_Success(t *testing.T) {
	svc := &mockAdminService{
		GetSessionsFunc: func() ([]model.Session, error) {
			return []model.Session{
				{
					ID:             1,
					MovieID:        10,
					HallID:         2,
					BasePriceCents: 400,
				},
			}, nil
		},
	}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/admin/sessions", nil)
	rr := httptest.NewRecorder()

	h.GetSessions(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), `"id":1`)
	assert.Contains(t, rr.Body.String(), `"movie_id":10`)
}

func TestAdminHandler_GetSessions_Error(t *testing.T) {
	svc := &mockAdminService{
		GetSessionsFunc: func() ([]model.Session, error) {
			return nil, errors.New("db error")
		},
	}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/admin/sessions", nil)
	rr := httptest.NewRecorder()

	h.GetSessions(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to fetch sessions")
}

func TestAdminHandler_CreateSession_Success(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPost, "/admin/sessions", bytes.NewBufferString(`{
		"movie_id":1,
		"hall_id":2,
		"start_time":"2026-06-10T19:30:00Z",
		"base_price_cents":400
	}`))
	rr := httptest.NewRecorder()

	h.CreateSession(rr, req)

	assert.Equal(t, http.StatusCreated, rr.Code)
	assert.Contains(t, rr.Body.String(), `"movie_id":1`)
	assert.Contains(t, rr.Body.String(), `"hall_id":2`)
}

func TestAdminHandler_CreateSession_InvalidBody(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPost, "/admin/sessions", bytes.NewBufferString(`{invalid}`))
	rr := httptest.NewRecorder()

	h.CreateSession(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid request body")
}

func TestAdminHandler_CreateSession_Error(t *testing.T) {
	svc := &mockAdminService{
		CreateSessionFunc: func(session *model.Session) error {
			return errors.New("db error")
		},
	}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPost, "/admin/sessions", bytes.NewBufferString(`{
		"movie_id":1,
		"hall_id":2,
		"start_time":"2026-06-10T19:30:00Z",
		"base_price_cents":400
	}`))
	rr := httptest.NewRecorder()

	h.CreateSession(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to create session")
}

func TestAdminHandler_UpdateSession_Success(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPut, "/admin/sessions/7", bytes.NewBufferString(`{
		"movie_id":1,
		"hall_id":2,
		"start_time":"2026-06-10T21:00:00Z",
		"base_price_cents":500
	}`))
	req = mux.SetURLVars(req, map[string]string{"id": "7"})
	rr := httptest.NewRecorder()

	h.UpdateSession(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), `"id":7`)
	assert.Contains(t, rr.Body.String(), `"base_price_cents":500`)
}

func TestAdminHandler_UpdateSession_InvalidID(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPut, "/admin/sessions/abc", bytes.NewBufferString(`{}`))
	req = mux.SetURLVars(req, map[string]string{"id": "abc"})
	rr := httptest.NewRecorder()

	h.UpdateSession(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid session id")
}

func TestAdminHandler_UpdateSession_InvalidBody(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPut, "/admin/sessions/1", bytes.NewBufferString(`{invalid}`))
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()

	h.UpdateSession(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid request body")
}

func TestAdminHandler_UpdateSession_Error(t *testing.T) {
	svc := &mockAdminService{
		UpdateSessionFunc: func(session *model.Session) error {
			return errors.New("db error")
		},
	}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPut, "/admin/sessions/1", bytes.NewBufferString(`{
		"movie_id":1,
		"hall_id":2,
		"start_time":"2026-06-10T21:00:00Z",
		"base_price_cents":500
	}`))
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()

	h.UpdateSession(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to update session")
}

func TestAdminHandler_DeleteSession_Success(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodDelete, "/admin/sessions/1", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()

	h.DeleteSession(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "session deleted")
}

func TestAdminHandler_DeleteSession_InvalidID(t *testing.T) {
	svc := &mockAdminService{}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodDelete, "/admin/sessions/abc", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "abc"})
	rr := httptest.NewRecorder()

	h.DeleteSession(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid session id")
}

func TestAdminHandler_DeleteSession_Error(t *testing.T) {
	svc := &mockAdminService{
		DeleteSessionFunc: func(id int) error {
			return errors.New("db error")
		},
	}
	h := NewAdminHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodDelete, "/admin/sessions/1", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()

	h.DeleteSession(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to delete session")
}

func TestMapAdminError(t *testing.T) {
	assert.Equal(t, http.StatusNotFound, mapAdminError(service.ErrMovieNotFound))
	assert.Equal(t, http.StatusNotFound, mapAdminError(service.ErrCinemaNotFound))
	assert.Equal(t, http.StatusNotFound, mapAdminError(service.ErrHallNotFound))
	assert.Equal(t, http.StatusNotFound, mapAdminError(service.ErrSessionNotFound))
	assert.Equal(t, http.StatusInternalServerError, mapAdminError(errors.New("other")))
}
