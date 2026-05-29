package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Seatify-org/seatify-common/model"
	"github.com/seatify/backend/booking-service/internal/service"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

type mockMovieService struct {
	GetAllFunc               func() ([]*model.Movie, error)
	GetByIDFunc              func(id int64) (*model.Movie, error)
	GetSessionsByMovieIDFunc func(movieID int64) ([]*model.Session, error)
	GetSessionByIDFunc       func(id int64) (*model.Session, error)
}

func (m *mockMovieService) GetAll() ([]*model.Movie, error) {
	if m.GetAllFunc != nil {
		return m.GetAllFunc()
	}
	return []*model.Movie{}, nil
}

func (m *mockMovieService) GetByID(id int64) (*model.Movie, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(id)
	}
	return nil, service.ErrMovieNotFound
}

func (m *mockMovieService) GetSessionsByMovieID(movieID int64) ([]*model.Session, error) {
	if m.GetSessionsByMovieIDFunc != nil {
		return m.GetSessionsByMovieIDFunc(movieID)
	}
	return []*model.Session{}, nil
}

func (m *mockMovieService) GetSessionByID(id int64) (*model.Session, error) {
	if m.GetSessionByIDFunc != nil {
		return m.GetSessionByIDFunc(id)
	}
	return nil, service.ErrSessionNotFound
}

func TestMovieHandler_GetMovies_Success(t *testing.T) {
	svc := &mockMovieService{
		GetAllFunc: func() ([]*model.Movie, error) {
			return []*model.Movie{
				{ID: 1, Title: "Interstellar"},
				{ID: 2, Title: "Inception"},
			}, nil
		},
	}

	h := NewMovieHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/movies", nil)
	rr := httptest.NewRecorder()

	h.GetMovies(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)

	var movies []*model.Movie
	err := json.Unmarshal(rr.Body.Bytes(), &movies)
	assert.NoError(t, err)
	assert.Len(t, movies, 2)
	assert.Equal(t, "Interstellar", movies[0].Title)
}

func TestMovieHandler_GetMovies_Error(t *testing.T) {
	svc := &mockMovieService{
		GetAllFunc: func() ([]*model.Movie, error) {
			return nil, errors.New("db failed")
		},
	}

	h := NewMovieHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/movies", nil)
	rr := httptest.NewRecorder()

	h.GetMovies(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to get movies")
}

func TestMovieHandler_GetMovieByID_Success(t *testing.T) {
	svc := &mockMovieService{
		GetByIDFunc: func(id int64) (*model.Movie, error) {
			return &model.Movie{
				ID:    int(id),
				Title: "Dune",
			}, nil
		},
	}

	h := NewMovieHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/movies/1", nil)
	rr := httptest.NewRecorder()

	h.GetMovieByID(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "Dune")
}

func TestMovieHandler_GetMovieByID_InvalidID(t *testing.T) {
	svc := &mockMovieService{}
	h := NewMovieHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/movies/abc", nil)
	rr := httptest.NewRecorder()

	h.GetMovieByID(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid movie id")
}

func TestMovieHandler_GetMovieByID_NotFound(t *testing.T) {
	svc := &mockMovieService{
		GetByIDFunc: func(id int64) (*model.Movie, error) {
			return nil, service.ErrMovieNotFound
		},
	}

	h := NewMovieHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/movies/999", nil)
	rr := httptest.NewRecorder()

	h.GetMovieByID(rr, req)

	assert.Equal(t, http.StatusNotFound, rr.Code)
	assert.Contains(t, rr.Body.String(), "movie not found")
}

func TestMovieHandler_GetMovieByID_InternalError(t *testing.T) {
	svc := &mockMovieService{
		GetByIDFunc: func(id int64) (*model.Movie, error) {
			return nil, errors.New("unexpected db error")
		},
	}

	h := NewMovieHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/movies/1", nil)
	rr := httptest.NewRecorder()

	h.GetMovieByID(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to get movie")
}

func TestMovieHandler_GetSessionsByMovieID_Success(t *testing.T) {
	svc := &mockMovieService{
		GetSessionsByMovieIDFunc: func(movieID int64) ([]*model.Session, error) {
			return []*model.Session{
				{ID: 1, MovieID: int(movieID), MovieTitle: "Dune"},
				{ID: 2, MovieID: int(movieID), MovieTitle: "Dune"},
			}, nil
		},
	}

	h := NewMovieHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/movies/1/sessions", nil)
	rr := httptest.NewRecorder()

	h.GetSessionsByMovieID(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "Dune")
}

func TestMovieHandler_GetSessionsByMovieID_InvalidPath(t *testing.T) {
	svc := &mockMovieService{}
	h := NewMovieHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/movies/", nil)
	rr := httptest.NewRecorder()

	h.GetSessionsByMovieID(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid request path")
}

func TestMovieHandler_GetSessionsByMovieID_InvalidMovieID(t *testing.T) {
	svc := &mockMovieService{}
	h := NewMovieHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/movies/abc/sessions", nil)
	rr := httptest.NewRecorder()

	h.GetSessionsByMovieID(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid movie id")
}

func TestMovieHandler_GetSessionsByMovieID_NotFound(t *testing.T) {
	svc := &mockMovieService{
		GetSessionsByMovieIDFunc: func(movieID int64) ([]*model.Session, error) {
			return nil, service.ErrMovieNotFound
		},
	}

	h := NewMovieHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/movies/999/sessions", nil)
	rr := httptest.NewRecorder()

	h.GetSessionsByMovieID(rr, req)

	assert.Equal(t, http.StatusNotFound, rr.Code)
	assert.Contains(t, rr.Body.String(), "movie not found")
}

func TestMovieHandler_GetSessionByID_Success(t *testing.T) {
	svc := &mockMovieService{
		GetSessionByIDFunc: func(id int64) (*model.Session, error) {
			return &model.Session{
				ID:         int(id),
				MovieTitle: "Matrix",
				Status:     "scheduled",
			}, nil
		},
	}

	h := NewMovieHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/sessions/10", nil)
	rr := httptest.NewRecorder()

	h.GetSessionByID(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "Matrix")
}

func TestMovieHandler_GetSessionByID_InvalidID(t *testing.T) {
	svc := &mockMovieService{}
	h := NewMovieHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/sessions/abc", nil)
	rr := httptest.NewRecorder()

	h.GetSessionByID(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid session id")
}

func TestMovieHandler_GetSessionByID_NotFound(t *testing.T) {
	svc := &mockMovieService{
		GetSessionByIDFunc: func(id int64) (*model.Session, error) {
			return nil, service.ErrSessionNotFound
		},
	}

	h := NewMovieHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/sessions/404", nil)
	rr := httptest.NewRecorder()

	h.GetSessionByID(rr, req)

	assert.Equal(t, http.StatusNotFound, rr.Code)
	assert.Contains(t, rr.Body.String(), "session not found")
}

func TestMovieHandler_GetSessionsByMovieID_InternalError(t *testing.T) {
	svc := &mockMovieService{
		GetSessionsByMovieIDFunc: func(movieID int64) ([]*model.Session, error) {
			return nil, errors.New("unexpected db error")
		},
	}

	h := NewMovieHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/movies/1/sessions", nil)
	rr := httptest.NewRecorder()

	h.GetSessionsByMovieID(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to get sessions")
}

func TestMovieHandler_GetSessionByID_InternalError(t *testing.T) {
	svc := &mockMovieService{
		GetSessionByIDFunc: func(id int64) (*model.Session, error) {
			return nil, errors.New("unexpected error")
		},
	}

	h := NewMovieHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/sessions/1", nil)
	rr := httptest.NewRecorder()

	h.GetSessionByID(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to get session")
}
