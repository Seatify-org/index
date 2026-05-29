package service

import (
	"github.com/Seatify-org/seatify-common/model"
	"github.com/seatify/backend/booking-service/internal/repository"
	"go.uber.org/zap"
)

type MovieService struct {
	repo   repository.MovieRepository
	logger *zap.Logger
}

func NewMovieService(repo repository.MovieRepository, logger *zap.Logger) *MovieService {
	if logger == nil {
		logger = zap.NewNop()
	}

	return &MovieService{
		repo:   repo,
		logger: logger,
	}
}

func (s *MovieService) GetAll() ([]*model.Movie, error) {
	movies, err := s.repo.GetAll()
	if err != nil {
		s.logger.Error("failed to get movies", zap.Error(err))
		return nil, err
	}

	return movies, nil
}

func (s *MovieService) GetByID(id int64) (*model.Movie, error) {
	if id <= 0 {
		return nil, ErrMovieNotFound
	}

	movie, err := s.repo.GetByID(id)
	if err != nil {
		s.logger.Error("failed to get movie by id", zap.Error(err), zap.Int64("movie_id", id))
		return nil, err
	}

	if movie == nil {
		return nil, ErrMovieNotFound
	}

	return movie, nil
}

func (s *MovieService) GetSessionsByMovieID(movieID int64) ([]*model.Session, error) {
	if movieID <= 0 {
		return nil, ErrMovieNotFound
	}

	sessions, err := s.repo.GetSessionsByMovieID(movieID)
	if err != nil {
		s.logger.Error("failed to get sessions by movie id", zap.Error(err), zap.Int64("movie_id", movieID))
		return nil, err
	}

	return sessions, nil
}

func (s *MovieService) GetSessionByID(id int64) (*model.Session, error) {
	if id <= 0 {
		return nil, ErrSessionNotFound
	}

	session, err := s.repo.GetSessionByID(id)
	if err != nil {
		s.logger.Error("failed to get session by id", zap.Error(err), zap.Int64("session_id", id))
		return nil, err
	}

	if session == nil {
		return nil, ErrSessionNotFound
	}

	return session, nil
}
