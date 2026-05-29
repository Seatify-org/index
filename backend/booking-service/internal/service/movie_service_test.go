package service

import (
	"errors"
	"testing"

	"github.com/Seatify-org/seatify-common/model"
	"github.com/seatify/backend/booking-service/internal/repository"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

type mockMovieRepository struct {
	GetAllFunc               func() ([]*model.Movie, error)
	GetByIDFunc              func(id int64) (*model.Movie, error)
	GetSessionsByMovieIDFunc func(movieID int64) ([]*model.Session, error)
	GetSessionByIDFunc       func(id int64) (*model.Session, error)
}

func (m *mockMovieRepository) GetAll() ([]*model.Movie, error) {
	if m.GetAllFunc != nil {
		return m.GetAllFunc()
	}
	return []*model.Movie{}, nil
}

func (m *mockMovieRepository) GetByID(id int64) (*model.Movie, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(id)
	}
	return nil, repository.ErrMovieNotFound
}

func (m *mockMovieRepository) GetSessionsByMovieID(movieID int64) ([]*model.Session, error) {
	if m.GetSessionsByMovieIDFunc != nil {
		return m.GetSessionsByMovieIDFunc(movieID)
	}
	return []*model.Session{}, nil
}

func (m *mockMovieRepository) GetSessionByID(id int64) (*model.Session, error) {
	if m.GetSessionByIDFunc != nil {
		return m.GetSessionByIDFunc(id)
	}
	return nil, repository.ErrSessionNotFound
}

func TestMovieService_GetAll_Success(t *testing.T) {
	repo := &mockMovieRepository{
		GetAllFunc: func() ([]*model.Movie, error) {
			return []*model.Movie{
				{
					ID:       1,
					Title:    "Interstellar",
					Duration: 169,
				},
				{
					ID:       2,
					Title:    "Inception",
					Duration: 148,
				},
			}, nil
		},
	}

	svc := NewMovieService(repo, zap.NewNop())

	movies, err := svc.GetAll()

	assert.NoError(t, err)
	assert.Len(t, movies, 2)
	assert.Equal(t, "Interstellar", movies[0].Title)
	assert.Equal(t, "Inception", movies[1].Title)
}

func TestMovieService_GetAll_Error(t *testing.T) {
	repo := &mockMovieRepository{
		GetAllFunc: func() ([]*model.Movie, error) {
			return nil, errors.New("database error")
		},
	}

	svc := NewMovieService(repo, zap.NewNop())

	movies, err := svc.GetAll()

	assert.Error(t, err)
	assert.Nil(t, movies)
	assert.Contains(t, err.Error(), "database error")
}

func TestMovieService_GetByID_Success(t *testing.T) {
	repo := &mockMovieRepository{
		GetByIDFunc: func(id int64) (*model.Movie, error) {
			return &model.Movie{
				ID:       int(id),
				Title:    "Dune",
				Duration: 155,
			}, nil
		},
	}

	svc := NewMovieService(repo, zap.NewNop())

	movie, err := svc.GetByID(1)

	assert.NoError(t, err)
	assert.NotNil(t, movie)
	assert.Equal(t, int64(1), int64(movie.ID))
	assert.Equal(t, "Dune", movie.Title)
}

func TestMovieService_GetByID_ReturnsErrMovieNotFound_WhenRepoReturnsNilMovie(t *testing.T) {
	repo := &mockMovieRepository{
		GetByIDFunc: func(id int64) (*model.Movie, error) {
			return nil, nil
		},
	}

	svc := NewMovieService(repo, zap.NewNop())

	movie, err := svc.GetByID(1)

	if movie != nil {
		t.Fatalf("expected nil movie, got %#v", movie)
	}
	if !errors.Is(err, ErrMovieNotFound) {
		t.Fatalf("expected ErrMovieNotFound, got %v", err)
	}
}

func TestMovieService_GetSessionByID_ReturnsErrSessionNotFound_WhenRepoReturnsNilSession(t *testing.T) {
	repo := &mockMovieRepository{
		GetSessionByIDFunc: func(id int64) (*model.Session, error) {
			return nil, nil
		},
	}

	svc := NewMovieService(repo, zap.NewNop())

	session, err := svc.GetSessionByID(1)

	if session != nil {
		t.Fatalf("expected nil session, got %#v", session)
	}
	if !errors.Is(err, ErrSessionNotFound) {
		t.Fatalf("expected ErrSessionNotFound, got %v", err)
	}
}

func TestMovieService_GetByID_InvalidID(t *testing.T) {
	repo := &mockMovieRepository{}
	svc := NewMovieService(repo, zap.NewNop())

	movie, err := svc.GetByID(0)

	assert.Error(t, err)
	assert.Nil(t, movie)
	assert.ErrorIs(t, err, ErrMovieNotFound)
}

func TestMovieService_GetByID_RepositoryNotFound(t *testing.T) {
	repo := &mockMovieRepository{
		GetByIDFunc: func(id int64) (*model.Movie, error) {
			return nil, repository.ErrMovieNotFound
		},
	}

	svc := NewMovieService(repo, zap.NewNop())

	movie, err := svc.GetByID(999)

	assert.Error(t, err)
	assert.Nil(t, movie)
	assert.ErrorIs(t, err, repository.ErrMovieNotFound)
}

func TestMovieService_GetSessionsByMovieID_Success(t *testing.T) {
	repo := &mockMovieRepository{
		GetSessionsByMovieIDFunc: func(movieID int64) ([]*model.Session, error) {
			return []*model.Session{
				{
					ID:             1,
					MovieID:        int(movieID),
					MovieTitle:     "Dune",
					BasePriceCents: 1200,
				},
				{
					ID:             2,
					MovieID:        int(movieID),
					MovieTitle:     "Dune",
					BasePriceCents: 1500,
				},
			}, nil
		},
	}

	svc := NewMovieService(repo, zap.NewNop())

	sessions, err := svc.GetSessionsByMovieID(1)

	assert.NoError(t, err)
	assert.Len(t, sessions, 2)
	assert.Equal(t, "Dune", sessions[0].MovieTitle)
	assert.Equal(t, 1500, sessions[1].BasePriceCents)
}

func TestMovieService_GetSessionsByMovieID_InvalidMovieID(t *testing.T) {
	repo := &mockMovieRepository{}
	svc := NewMovieService(repo, zap.NewNop())

	sessions, err := svc.GetSessionsByMovieID(0)

	assert.Error(t, err)
	assert.Nil(t, sessions)
	assert.ErrorIs(t, err, ErrMovieNotFound)
}

func TestMovieService_GetSessionsByMovieID_Error(t *testing.T) {
	repo := &mockMovieRepository{
		GetSessionsByMovieIDFunc: func(movieID int64) ([]*model.Session, error) {
			return nil, errors.New("query failed")
		},
	}

	svc := NewMovieService(repo, zap.NewNop())

	sessions, err := svc.GetSessionsByMovieID(1)

	assert.Error(t, err)
	assert.Nil(t, sessions)
	assert.Contains(t, err.Error(), "query failed")
}

func TestMovieService_GetSessionByID_Success(t *testing.T) {
	repo := &mockMovieRepository{
		GetSessionByIDFunc: func(id int64) (*model.Session, error) {
			return &model.Session{
				ID:             int(id),
				MovieID:        1,
				MovieTitle:     "Matrix",
				BasePriceCents: 1000,
				Status:         "scheduled",
			}, nil
		},
	}

	svc := NewMovieService(repo, zap.NewNop())

	session, err := svc.GetSessionByID(10)

	assert.NoError(t, err)
	assert.NotNil(t, session)
	assert.Equal(t, 10, session.ID)
	assert.Equal(t, "Matrix", session.MovieTitle)
	assert.Equal(t, "scheduled", session.Status)
}

func TestMovieService_GetSessionByID_InvalidID(t *testing.T) {
	repo := &mockMovieRepository{}
	svc := NewMovieService(repo, zap.NewNop())

	session, err := svc.GetSessionByID(0)

	assert.Error(t, err)
	assert.Nil(t, session)
	assert.ErrorIs(t, err, ErrSessionNotFound)
}

func TestMovieService_GetSessionByID_RepositoryNotFound(t *testing.T) {
	repo := &mockMovieRepository{
		GetSessionByIDFunc: func(id int64) (*model.Session, error) {
			return nil, repository.ErrSessionNotFound
		},
	}

	svc := NewMovieService(repo, zap.NewNop())

	session, err := svc.GetSessionByID(404)

	assert.Error(t, err)
	assert.Nil(t, session)
	assert.ErrorIs(t, err, repository.ErrSessionNotFound)
}
