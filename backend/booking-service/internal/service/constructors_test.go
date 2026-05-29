package service

import (
	"testing"

	"github.com/Seatify-org/seatify-common/model"
	"github.com/seatify/backend/booking-service/internal/mocks"
	"go.uber.org/zap"
)

func TestNewBookingService_NilLogger(t *testing.T) {
	repo := mocks.NewMockBookingRepository()
	svc := NewBookingService(repo, nil)

	if svc == nil {
		t.Fatal("expected service, got nil")
	}
	if svc.logger == nil {
		t.Fatal("expected logger to be initialized")
	}
}

func TestNewBookingService_UsesProvidedLogger(t *testing.T) {
	repo := mocks.NewMockBookingRepository()
	logger := zap.NewNop()

	svc := NewBookingService(repo, logger)

	if svc.logger != logger {
		t.Fatal("expected provided logger to be used")
	}
}

type stubMovieRepository struct{}

func (s *stubMovieRepository) GetAll() ([]*model.Movie, error) {
	return []*model.Movie{}, nil
}

func (s *stubMovieRepository) GetByID(id int64) (*model.Movie, error) {
	return nil, nil
}

func (s *stubMovieRepository) GetSessionsByMovieID(id int64) ([]*model.Session, error) {
	return []*model.Session{}, nil
}

func (s *stubMovieRepository) GetSessionByID(id int64) (*model.Session, error) {
	return nil, nil
}

func TestNewMovieService_NilLogger(t *testing.T) {
	repo := &stubMovieRepository{}
	svc := NewMovieService(repo, nil)

	if svc == nil {
		t.Fatal("expected service, got nil")
	}
	if svc.logger == nil {
		t.Fatal("expected logger to be initialized")
	}
}

func TestNewMovieService_UsesProvidedLogger(t *testing.T) {
	repo := &stubMovieRepository{}
	logger := zap.NewNop()

	svc := NewMovieService(repo, logger)

	if svc.logger != logger {
		t.Fatal("expected provided logger to be used")
	}
}
