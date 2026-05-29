package service

import (
	"errors"

	"github.com/Seatify-org/seatify-common/model"
	"github.com/seatify/backend/booking-service/internal/repository"
	"go.uber.org/zap"
)

var (
	ErrMovieNotFound   = errors.New("movie not found")
	ErrCinemaNotFound  = errors.New("cinema not found")
	ErrHallNotFound    = errors.New("hall not found")
	ErrSessionNotFound = errors.New("session not found")
)

type AdminService struct {
	repo   repository.AdminRepository
	logger *zap.Logger
}

func NewAdminService(repo repository.AdminRepository, logger *zap.Logger) *AdminService {
	if logger == nil {
		logger = zap.NewNop()
	}

	return &AdminService{
		repo:   repo,
		logger: logger,
	}
}

func (s *AdminService) GetMovies() ([]model.Movie, error) {
	movies, err := s.repo.GetMovies()
	if err != nil {
		s.logger.Error("failed to get movies", zap.Error(err))
		return nil, err
	}
	return movies, nil
}

func (s *AdminService) CreateMovie(movie *model.Movie) error {
	if movie == nil {
		return errors.New("movie is nil")
	}

	if movie.Title == "" {
		return errors.New("movie title is required")
	}

	if movie.Duration <= 0 {
		return errors.New("movie duration must be greater than zero")
	}

	if err := s.repo.CreateMovie(movie); err != nil {
		s.logger.Error("failed to create movie", zap.Error(err))
		return err
	}

	return nil
}

func (s *AdminService) UpdateMovie(movie *model.Movie) error {
	if movie == nil {
		return errors.New("movie is nil")
	}

	if movie.ID <= 0 {
		return ErrMovieNotFound
	}

	if movie.Title == "" {
		return errors.New("movie title is required")
	}

	if movie.Duration <= 0 {
		return errors.New("movie duration must be greater than zero")
	}

	if err := s.repo.UpdateMovie(movie); err != nil {
		s.logger.Error("failed to update movie", zap.Error(err), zap.Int("movie_id", movie.ID))
		return err
	}

	return nil
}

func (s *AdminService) DeleteMovie(id int) error {
	if id <= 0 {
		return ErrMovieNotFound
	}

	if err := s.repo.DeleteMovie(id); err != nil {
		s.logger.Error("failed to delete movie", zap.Error(err), zap.Int("movie_id", id))
		return err
	}

	return nil
}

func (s *AdminService) GetCinemas() ([]model.Cinema, error) {
	cinemas, err := s.repo.GetCinemas()
	if err != nil {
		s.logger.Error("failed to get cinemas", zap.Error(err))
		return nil, err
	}
	return cinemas, nil
}

func (s *AdminService) CreateCinema(cinema *model.Cinema) error {
	if cinema == nil {
		return errors.New("cinema is nil")
	}

	if cinema.Name == "" {
		return errors.New("cinema name is required")
	}

	if err := s.repo.CreateCinema(cinema); err != nil {
		s.logger.Error("failed to create cinema", zap.Error(err))
		return err
	}

	return nil
}

func (s *AdminService) UpdateCinema(cinema *model.Cinema) error {
	if cinema == nil {
		return errors.New("cinema is nil")
	}

	if cinema.ID <= 0 {
		return ErrCinemaNotFound
	}

	if cinema.Name == "" {
		return errors.New("cinema name is required")
	}

	if err := s.repo.UpdateCinema(cinema); err != nil {
		s.logger.Error("failed to update cinema", zap.Error(err), zap.Int("cinema_id", cinema.ID))
		return err
	}

	return nil
}

func (s *AdminService) DeleteCinema(id int) error {
	if id <= 0 {
		return ErrCinemaNotFound
	}

	if err := s.repo.DeleteCinema(id); err != nil {
		s.logger.Error("failed to delete cinema", zap.Error(err), zap.Int("cinema_id", id))
		return err
	}

	return nil
}

func (s *AdminService) GetHallsByCinema(cinemaID int) ([]model.Hall, error) {
	if cinemaID <= 0 {
		return nil, ErrCinemaNotFound
	}

	halls, err := s.repo.GetHallsByCinema(cinemaID)
	if err != nil {
		s.logger.Error("failed to get halls by cinema", zap.Error(err), zap.Int("cinema_id", cinemaID))
		return nil, err
	}

	return halls, nil
}

func (s *AdminService) CreateHall(hall *model.Hall) error {
	if hall == nil {
		return errors.New("hall is nil")
	}

	if hall.CinemaID <= 0 {
		return ErrCinemaNotFound
	}

	if hall.Name == "" {
		return errors.New("hall name is required")
	}

	if hall.TotalSeats <= 0 {
		return errors.New("hall total seats must be greater than zero")
	}

	if hall.Rows <= 0 {
		return errors.New("hall rows must be greater than zero")
	}

	if hall.SeatsPerRow <= 0 {
		return errors.New("hall seats per row must be greater than zero")
	}

	if err := s.repo.CreateHall(hall); err != nil {
		s.logger.Error("failed to create hall", zap.Error(err))
		return err
	}

	return nil
}

func (s *AdminService) GetSessions() ([]model.Session, error) {
	sessions, err := s.repo.GetSessions()
	if err != nil {
		s.logger.Error("failed to get sessions", zap.Error(err))
		return nil, err
	}

	return sessions, nil
}

func (s *AdminService) CreateSession(session *model.Session) error {
	if session == nil {
		return errors.New("session is nil")
	}

	if session.MovieID <= 0 {
		return ErrMovieNotFound
	}

	if session.HallID <= 0 {
		return ErrHallNotFound
	}

	if session.BasePriceCents <= 0 {
		return errors.New("base price must be greater than zero")
	}

	if session.StartTime.IsZero() {
		return errors.New("start time is required")
	}

	if err := s.repo.CreateSession(session); err != nil {
		s.logger.Error("failed to create session", zap.Error(err))
		return err
	}

	return nil
}

func (s *AdminService) UpdateSession(session *model.Session) error {
	if session == nil {
		return errors.New("session is nil")
	}

	if session.ID <= 0 {
		return ErrSessionNotFound
	}

	if session.MovieID <= 0 {
		return ErrMovieNotFound
	}

	if session.HallID <= 0 {
		return ErrHallNotFound
	}

	if session.BasePriceCents <= 0 {
		return errors.New("base price must be greater than zero")
	}

	if session.StartTime.IsZero() {
		return errors.New("start time is required")
	}

	if err := s.repo.UpdateSession(session); err != nil {
		s.logger.Error("failed to update session", zap.Error(err), zap.Int("session_id", session.ID))
		return err
	}

	return nil
}

func (s *AdminService) DeleteSession(id int) error {
	if id <= 0 {
		return ErrSessionNotFound
	}

	if err := s.repo.DeleteSession(id); err != nil {
		s.logger.Error("failed to delete session", zap.Error(err), zap.Int("session_id", id))
		return err
	}

	return nil
}
