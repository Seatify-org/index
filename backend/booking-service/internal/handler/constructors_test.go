package handler

import (
	"testing"

	"go.uber.org/zap"
)

func TestNewAdminHandler_NilLogger(t *testing.T) {
	h := NewAdminHandler(&mockAdminService{}, nil)

	if h == nil {
		t.Fatal("expected handler, got nil")
	}
	if h.logger == nil {
		t.Fatal("expected logger to be initialized")
	}
}

func TestNewBookingHandler_NilLogger(t *testing.T) {
	h := NewBookingHandler(&mockBookingService{}, nil)

	if h == nil {
		t.Fatal("expected handler, got nil")
	}
	if h.logger == nil {
		t.Fatal("expected logger to be initialized")
	}
}

func TestNewMovieHandler_NilLogger(t *testing.T) {
	h := NewMovieHandler(&mockMovieService{}, nil)

	if h == nil {
		t.Fatal("expected handler, got nil")
	}
	if h.logger == nil {
		t.Fatal("expected logger to be initialized")
	}
}

func TestNewAdminHandler_UsesProvidedLogger(t *testing.T) {
	logger := zap.NewNop()
	h := NewAdminHandler(&mockAdminService{}, logger)

	if h.logger != logger {
		t.Fatal("expected provided logger to be used")
	}
}

func TestNewBookingHandler_UsesProvidedLogger(t *testing.T) {
	logger := zap.NewNop()
	h := NewBookingHandler(&mockBookingService{}, logger)

	if h.logger != logger {
		t.Fatal("expected provided logger to be used")
	}
}

func TestNewMovieHandler_UsesProvidedLogger(t *testing.T) {
	logger := zap.NewNop()
	h := NewMovieHandler(&mockMovieService{}, logger)

	if h.logger != logger {
		t.Fatal("expected provided logger to be used")
	}
}
