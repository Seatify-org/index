package service

import (
	"errors"
	"testing"
	"time"

	"github.com/Seatify-org/seatify-common/model"
	"go.uber.org/zap"
)

type mockAdminRepository struct {
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

func (m *mockAdminRepository) GetMovies() ([]model.Movie, error) {
	if m.GetMoviesFunc != nil {
		return m.GetMoviesFunc()
	}
	return []model.Movie{}, nil
}

func (m *mockAdminRepository) CreateMovie(movie *model.Movie) error {
	if m.CreateMovieFunc != nil {
		return m.CreateMovieFunc(movie)
	}
	return nil
}

func (m *mockAdminRepository) UpdateMovie(movie *model.Movie) error {
	if m.UpdateMovieFunc != nil {
		return m.UpdateMovieFunc(movie)
	}
	return nil
}

func (m *mockAdminRepository) DeleteMovie(id int) error {
	if m.DeleteMovieFunc != nil {
		return m.DeleteMovieFunc(id)
	}
	return nil
}

func (m *mockAdminRepository) GetCinemas() ([]model.Cinema, error) {
	if m.GetCinemasFunc != nil {
		return m.GetCinemasFunc()
	}
	return []model.Cinema{}, nil
}

func (m *mockAdminRepository) CreateCinema(cinema *model.Cinema) error {
	if m.CreateCinemaFunc != nil {
		return m.CreateCinemaFunc(cinema)
	}
	return nil
}

func (m *mockAdminRepository) UpdateCinema(cinema *model.Cinema) error {
	if m.UpdateCinemaFunc != nil {
		return m.UpdateCinemaFunc(cinema)
	}
	return nil
}

func (m *mockAdminRepository) DeleteCinema(id int) error {
	if m.DeleteCinemaFunc != nil {
		return m.DeleteCinemaFunc(id)
	}
	return nil
}

func (m *mockAdminRepository) GetHallsByCinema(cinemaID int) ([]model.Hall, error) {
	if m.GetHallsByCinemaFunc != nil {
		return m.GetHallsByCinemaFunc(cinemaID)
	}
	return []model.Hall{}, nil
}

func (m *mockAdminRepository) CreateHall(hall *model.Hall) error {
	if m.CreateHallFunc != nil {
		return m.CreateHallFunc(hall)
	}
	return nil
}

func (m *mockAdminRepository) GetSessions() ([]model.Session, error) {
	if m.GetSessionsFunc != nil {
		return m.GetSessionsFunc()
	}
	return []model.Session{}, nil
}

func (m *mockAdminRepository) CreateSession(session *model.Session) error {
	if m.CreateSessionFunc != nil {
		return m.CreateSessionFunc(session)
	}
	return nil
}

func (m *mockAdminRepository) UpdateSession(session *model.Session) error {
	if m.UpdateSessionFunc != nil {
		return m.UpdateSessionFunc(session)
	}
	return nil
}

func (m *mockAdminRepository) DeleteSession(id int) error {
	if m.DeleteSessionFunc != nil {
		return m.DeleteSessionFunc(id)
	}
	return nil
}

func TestNewAdminService_NilLogger(t *testing.T) {
	svc := NewAdminService(&mockAdminRepository{}, nil)

	if svc == nil {
		t.Fatal("expected service, got nil")
	}
	if svc.logger == nil {
		t.Fatal("expected logger to be initialized")
	}
}

func TestAdminService_GetMovies(t *testing.T) {
	expected := []model.Movie{{ID: 1, Title: "Dune", Duration: 120}}
	repoErr := errors.New("repo error")

	tests := []struct {
		name    string
		repo    *mockAdminRepository
		wantErr error
		wantLen int
	}{
		{
			name: "success",
			repo: &mockAdminRepository{
				GetMoviesFunc: func() ([]model.Movie, error) {
					return expected, nil
				},
			},
			wantErr: nil,
			wantLen: 1,
		},
		{
			name: "repo error",
			repo: &mockAdminRepository{
				GetMoviesFunc: func() ([]model.Movie, error) {
					return nil, repoErr
				},
			},
			wantErr: repoErr,
			wantLen: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewAdminService(tt.repo, zap.NewNop())

			got, err := svc.GetMovies()

			if !errors.Is(err, tt.wantErr) && err != tt.wantErr {
				t.Fatalf("expected error %v, got %v", tt.wantErr, err)
			}
			if len(got) != tt.wantLen {
				t.Fatalf("expected len %d, got %d", tt.wantLen, len(got))
			}
		})
	}
}

func TestAdminService_CreateMovie(t *testing.T) {
	repoErr := errors.New("repo error")

	tests := []struct {
		name    string
		movie   *model.Movie
		repo    *mockAdminRepository
		wantErr string
	}{
		{
			name:    "nil movie",
			movie:   nil,
			repo:    &mockAdminRepository{},
			wantErr: "movie is nil",
		},
		{
			name:    "missing title",
			movie:   &model.Movie{Duration: 120},
			repo:    &mockAdminRepository{},
			wantErr: "movie title is required",
		},
		{
			name:    "invalid duration",
			movie:   &model.Movie{Title: "Dune", Duration: 0},
			repo:    &mockAdminRepository{},
			wantErr: "movie duration must be greater than zero",
		},
		{
			name:  "repo error",
			movie: &model.Movie{Title: "Dune", Duration: 120},
			repo: &mockAdminRepository{
				CreateMovieFunc: func(movie *model.Movie) error {
					return repoErr
				},
			},
			wantErr: "repo error",
		},
		{
			name:  "success",
			movie: &model.Movie{Title: "Dune", Duration: 120},
			repo:  &mockAdminRepository{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewAdminService(tt.repo, zap.NewNop())

			err := svc.CreateMovie(tt.movie)

			if tt.wantErr == "" && err != nil {
				t.Fatalf("expected nil error, got %v", err)
			}
			if tt.wantErr != "" {
				if err == nil || err.Error() != tt.wantErr {
					t.Fatalf("expected error %q, got %v", tt.wantErr, err)
				}
			}
		})
	}
}

func TestAdminService_UpdateMovie(t *testing.T) {
	repoErr := errors.New("repo error")

	tests := []struct {
		name    string
		movie   *model.Movie
		repo    *mockAdminRepository
		wantErr error
		wantMsg string
	}{
		{
			name:    "nil movie",
			movie:   nil,
			repo:    &mockAdminRepository{},
			wantMsg: "movie is nil",
		},
		{
			name:    "invalid id",
			movie:   &model.Movie{ID: 0, Title: "Dune", Duration: 120},
			repo:    &mockAdminRepository{},
			wantErr: ErrMovieNotFound,
		},
		{
			name:    "missing title",
			movie:   &model.Movie{ID: 1, Duration: 120},
			repo:    &mockAdminRepository{},
			wantMsg: "movie title is required",
		},
		{
			name:    "invalid duration",
			movie:   &model.Movie{ID: 1, Title: "Dune", Duration: 0},
			repo:    &mockAdminRepository{},
			wantMsg: "movie duration must be greater than zero",
		},
		{
			name:  "repo error",
			movie: &model.Movie{ID: 1, Title: "Dune", Duration: 120},
			repo: &mockAdminRepository{
				UpdateMovieFunc: func(movie *model.Movie) error {
					return repoErr
				},
			},
			wantErr: repoErr,
		},
		{
			name:  "success",
			movie: &model.Movie{ID: 1, Title: "Dune", Duration: 120},
			repo:  &mockAdminRepository{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewAdminService(tt.repo, zap.NewNop())

			err := svc.UpdateMovie(tt.movie)

			if tt.wantErr != nil && !errors.Is(err, tt.wantErr) {
				t.Fatalf("expected error %v, got %v", tt.wantErr, err)
			}
			if tt.wantMsg != "" {
				if err == nil || err.Error() != tt.wantMsg {
					t.Fatalf("expected error %q, got %v", tt.wantMsg, err)
				}
			}
			if tt.wantErr == nil && tt.wantMsg == "" && err != nil {
				t.Fatalf("expected nil error, got %v", err)
			}
		})
	}
}

func TestAdminService_DeleteMovie(t *testing.T) {
	repoErr := errors.New("repo error")

	tests := []struct {
		name    string
		id      int
		repo    *mockAdminRepository
		wantErr error
	}{
		{
			name:    "invalid id",
			id:      0,
			repo:    &mockAdminRepository{},
			wantErr: ErrMovieNotFound,
		},
		{
			name: "repo error",
			id:   1,
			repo: &mockAdminRepository{
				DeleteMovieFunc: func(id int) error {
					return repoErr
				},
			},
			wantErr: repoErr,
		},
		{
			name:    "success",
			id:      1,
			repo:    &mockAdminRepository{},
			wantErr: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewAdminService(tt.repo, zap.NewNop())

			err := svc.DeleteMovie(tt.id)

			if !errors.Is(err, tt.wantErr) && err != tt.wantErr {
				t.Fatalf("expected error %v, got %v", tt.wantErr, err)
			}
		})
	}
}

func TestAdminService_GetCinemas(t *testing.T) {
	expected := []model.Cinema{{ID: 1, Name: "Cinema 1"}}
	repoErr := errors.New("repo error")

	tests := []struct {
		name    string
		repo    *mockAdminRepository
		wantErr error
		wantLen int
	}{
		{
			name: "success",
			repo: &mockAdminRepository{
				GetCinemasFunc: func() ([]model.Cinema, error) {
					return expected, nil
				},
			},
			wantLen: 1,
		},
		{
			name: "repo error",
			repo: &mockAdminRepository{
				GetCinemasFunc: func() ([]model.Cinema, error) {
					return nil, repoErr
				},
			},
			wantErr: repoErr,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewAdminService(tt.repo, zap.NewNop())

			got, err := svc.GetCinemas()

			if !errors.Is(err, tt.wantErr) && err != tt.wantErr {
				t.Fatalf("expected error %v, got %v", tt.wantErr, err)
			}
			if len(got) != tt.wantLen {
				t.Fatalf("expected len %d, got %d", tt.wantLen, len(got))
			}
		})
	}
}

func TestAdminService_CreateCinema(t *testing.T) {
	repoErr := errors.New("repo error")

	tests := []struct {
		name    string
		cinema  *model.Cinema
		repo    *mockAdminRepository
		wantErr string
	}{
		{
			name:    "nil cinema",
			cinema:  nil,
			repo:    &mockAdminRepository{},
			wantErr: "cinema is nil",
		},
		{
			name:    "missing name",
			cinema:  &model.Cinema{},
			repo:    &mockAdminRepository{},
			wantErr: "cinema name is required",
		},
		{
			name: "repo error",
			cinema: &model.Cinema{
				Name: "Cinema 1",
			},
			repo: &mockAdminRepository{
				CreateCinemaFunc: func(cinema *model.Cinema) error {
					return repoErr
				},
			},
			wantErr: "repo error",
		},
		{
			name: "success",
			cinema: &model.Cinema{
				Name: "Cinema 1",
			},
			repo: &mockAdminRepository{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewAdminService(tt.repo, zap.NewNop())

			err := svc.CreateCinema(tt.cinema)

			if tt.wantErr == "" && err != nil {
				t.Fatalf("expected nil error, got %v", err)
			}
			if tt.wantErr != "" {
				if err == nil || err.Error() != tt.wantErr {
					t.Fatalf("expected error %q, got %v", tt.wantErr, err)
				}
			}
		})
	}
}

func TestAdminService_UpdateCinema(t *testing.T) {
	repoErr := errors.New("repo error")

	tests := []struct {
		name    string
		cinema  *model.Cinema
		repo    *mockAdminRepository
		wantErr error
		wantMsg string
	}{
		{
			name:    "nil cinema",
			cinema:  nil,
			repo:    &mockAdminRepository{},
			wantMsg: "cinema is nil",
		},
		{
			name:    "invalid id",
			cinema:  &model.Cinema{ID: 0, Name: "Cinema 1"},
			repo:    &mockAdminRepository{},
			wantErr: ErrCinemaNotFound,
		},
		{
			name:    "missing name",
			cinema:  &model.Cinema{ID: 1},
			repo:    &mockAdminRepository{},
			wantMsg: "cinema name is required",
		},
		{
			name: "repo error",
			cinema: &model.Cinema{
				ID:   1,
				Name: "Cinema 1",
			},
			repo: &mockAdminRepository{
				UpdateCinemaFunc: func(cinema *model.Cinema) error {
					return repoErr
				},
			},
			wantErr: repoErr,
		},
		{
			name: "success",
			cinema: &model.Cinema{
				ID:   1,
				Name: "Cinema 1",
			},
			repo: &mockAdminRepository{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewAdminService(tt.repo, zap.NewNop())

			err := svc.UpdateCinema(tt.cinema)

			if tt.wantErr != nil && !errors.Is(err, tt.wantErr) {
				t.Fatalf("expected error %v, got %v", tt.wantErr, err)
			}
			if tt.wantMsg != "" {
				if err == nil || err.Error() != tt.wantMsg {
					t.Fatalf("expected error %q, got %v", tt.wantMsg, err)
				}
			}
			if tt.wantErr == nil && tt.wantMsg == "" && err != nil {
				t.Fatalf("expected nil error, got %v", err)
			}
		})
	}
}

func TestAdminService_DeleteCinema(t *testing.T) {
	repoErr := errors.New("repo error")

	tests := []struct {
		name    string
		id      int
		repo    *mockAdminRepository
		wantErr error
	}{
		{
			name:    "invalid id",
			id:      0,
			repo:    &mockAdminRepository{},
			wantErr: ErrCinemaNotFound,
		},
		{
			name: "repo error",
			id:   1,
			repo: &mockAdminRepository{
				DeleteCinemaFunc: func(id int) error {
					return repoErr
				},
			},
			wantErr: repoErr,
		},
		{
			name:    "success",
			id:      1,
			repo:    &mockAdminRepository{},
			wantErr: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewAdminService(tt.repo, zap.NewNop())

			err := svc.DeleteCinema(tt.id)

			if !errors.Is(err, tt.wantErr) && err != tt.wantErr {
				t.Fatalf("expected error %v, got %v", tt.wantErr, err)
			}
		})
	}
}

func TestAdminService_GetHallsByCinema(t *testing.T) {
	repoErr := errors.New("repo error")
	expected := []model.Hall{{ID: 1, CinemaID: 1, Name: "Hall 1", TotalSeats: 100, Rows: 10, SeatsPerRow: 10}}

	tests := []struct {
		name     string
		cinemaID int
		repo     *mockAdminRepository
		wantErr  error
		wantLen  int
	}{
		{
			name:     "invalid cinema id",
			cinemaID: 0,
			repo:     &mockAdminRepository{},
			wantErr:  ErrCinemaNotFound,
		},
		{
			name:     "repo error",
			cinemaID: 1,
			repo: &mockAdminRepository{
				GetHallsByCinemaFunc: func(cinemaID int) ([]model.Hall, error) {
					return nil, repoErr
				},
			},
			wantErr: repoErr,
		},
		{
			name:     "success",
			cinemaID: 1,
			repo: &mockAdminRepository{
				GetHallsByCinemaFunc: func(cinemaID int) ([]model.Hall, error) {
					return expected, nil
				},
			},
			wantLen: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewAdminService(tt.repo, zap.NewNop())

			got, err := svc.GetHallsByCinema(tt.cinemaID)

			if !errors.Is(err, tt.wantErr) && err != tt.wantErr {
				t.Fatalf("expected error %v, got %v", tt.wantErr, err)
			}
			if len(got) != tt.wantLen {
				t.Fatalf("expected len %d, got %d", tt.wantLen, len(got))
			}
		})
	}
}

func TestAdminService_CreateHall(t *testing.T) {
	repoErr := errors.New("repo error")

	validHall := &model.Hall{
		CinemaID:    1,
		Name:        "Hall 1",
		TotalSeats:  100,
		Rows:        10,
		SeatsPerRow: 10,
	}

	tests := []struct {
		name    string
		hall    *model.Hall
		repo    *mockAdminRepository
		wantErr error
		wantMsg string
	}{
		{
			name:    "nil hall",
			hall:    nil,
			repo:    &mockAdminRepository{},
			wantMsg: "hall is nil",
		},
		{
			name:    "invalid cinema id",
			hall:    &model.Hall{CinemaID: 0, Name: "Hall 1", TotalSeats: 100, Rows: 10, SeatsPerRow: 10},
			repo:    &mockAdminRepository{},
			wantErr: ErrCinemaNotFound,
		},
		{
			name:    "missing name",
			hall:    &model.Hall{CinemaID: 1, TotalSeats: 100, Rows: 10, SeatsPerRow: 10},
			repo:    &mockAdminRepository{},
			wantMsg: "hall name is required",
		},
		{
			name:    "invalid total seats",
			hall:    &model.Hall{CinemaID: 1, Name: "Hall 1", TotalSeats: 0, Rows: 10, SeatsPerRow: 10},
			repo:    &mockAdminRepository{},
			wantMsg: "hall total seats must be greater than zero",
		},
		{
			name:    "invalid rows",
			hall:    &model.Hall{CinemaID: 1, Name: "Hall 1", TotalSeats: 100, Rows: 0, SeatsPerRow: 10},
			repo:    &mockAdminRepository{},
			wantMsg: "hall rows must be greater than zero",
		},
		{
			name:    "invalid seats per row",
			hall:    &model.Hall{CinemaID: 1, Name: "Hall 1", TotalSeats: 100, Rows: 10, SeatsPerRow: 0},
			repo:    &mockAdminRepository{},
			wantMsg: "hall seats per row must be greater than zero",
		},
		{
			name: "repo error",
			hall: validHall,
			repo: &mockAdminRepository{
				CreateHallFunc: func(hall *model.Hall) error {
					return repoErr
				},
			},
			wantErr: repoErr,
		},
		{
			name: "success",
			hall: validHall,
			repo: &mockAdminRepository{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewAdminService(tt.repo, zap.NewNop())

			err := svc.CreateHall(tt.hall)

			if tt.wantErr != nil && !errors.Is(err, tt.wantErr) {
				t.Fatalf("expected error %v, got %v", tt.wantErr, err)
			}
			if tt.wantMsg != "" {
				if err == nil || err.Error() != tt.wantMsg {
					t.Fatalf("expected error %q, got %v", tt.wantMsg, err)
				}
			}
			if tt.wantErr == nil && tt.wantMsg == "" && err != nil {
				t.Fatalf("expected nil error, got %v", err)
			}
		})
	}
}

func TestAdminService_GetSessions(t *testing.T) {
	expected := []model.Session{{ID: 1, MovieID: 1, HallID: 1, BasePriceCents: 1000, StartTime: time.Now()}}
	repoErr := errors.New("repo error")

	tests := []struct {
		name    string
		repo    *mockAdminRepository
		wantErr error
		wantLen int
	}{
		{
			name: "success",
			repo: &mockAdminRepository{
				GetSessionsFunc: func() ([]model.Session, error) {
					return expected, nil
				},
			},
			wantLen: 1,
		},
		{
			name: "repo error",
			repo: &mockAdminRepository{
				GetSessionsFunc: func() ([]model.Session, error) {
					return nil, repoErr
				},
			},
			wantErr: repoErr,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewAdminService(tt.repo, zap.NewNop())

			got, err := svc.GetSessions()

			if !errors.Is(err, tt.wantErr) && err != tt.wantErr {
				t.Fatalf("expected error %v, got %v", tt.wantErr, err)
			}
			if len(got) != tt.wantLen {
				t.Fatalf("expected len %d, got %d", tt.wantLen, len(got))
			}
		})
	}
}

func TestAdminService_CreateSession(t *testing.T) {
	repoErr := errors.New("repo error")

	validSession := &model.Session{
		MovieID:        1,
		HallID:         1,
		BasePriceCents: 1200,
		StartTime:      time.Now().Add(time.Hour),
	}

	tests := []struct {
		name    string
		session *model.Session
		repo    *mockAdminRepository
		wantErr error
		wantMsg string
	}{
		{
			name:    "nil session",
			session: nil,
			repo:    &mockAdminRepository{},
			wantMsg: "session is nil",
		},
		{
			name:    "invalid movie id",
			session: &model.Session{MovieID: 0, HallID: 1, BasePriceCents: 1200, StartTime: time.Now()},
			repo:    &mockAdminRepository{},
			wantErr: ErrMovieNotFound,
		},
		{
			name:    "invalid hall id",
			session: &model.Session{MovieID: 1, HallID: 0, BasePriceCents: 1200, StartTime: time.Now()},
			repo:    &mockAdminRepository{},
			wantErr: ErrHallNotFound,
		},
		{
			name:    "invalid base price",
			session: &model.Session{MovieID: 1, HallID: 1, BasePriceCents: 0, StartTime: time.Now()},
			repo:    &mockAdminRepository{},
			wantMsg: "base price must be greater than zero",
		},
		{
			name:    "zero start time",
			session: &model.Session{MovieID: 1, HallID: 1, BasePriceCents: 1200},
			repo:    &mockAdminRepository{},
			wantMsg: "start time is required",
		},
		{
			name:    "repo error",
			session: validSession,
			repo: &mockAdminRepository{
				CreateSessionFunc: func(session *model.Session) error {
					return repoErr
				},
			},
			wantErr: repoErr,
		},
		{
			name:    "success",
			session: validSession,
			repo:    &mockAdminRepository{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewAdminService(tt.repo, zap.NewNop())

			err := svc.CreateSession(tt.session)

			if tt.wantErr != nil && !errors.Is(err, tt.wantErr) {
				t.Fatalf("expected error %v, got %v", tt.wantErr, err)
			}
			if tt.wantMsg != "" {
				if err == nil || err.Error() != tt.wantMsg {
					t.Fatalf("expected error %q, got %v", tt.wantMsg, err)
				}
			}
			if tt.wantErr == nil && tt.wantMsg == "" && err != nil {
				t.Fatalf("expected nil error, got %v", err)
			}
		})
	}
}

func TestAdminService_UpdateSession(t *testing.T) {
	repoErr := errors.New("repo error")

	validSession := &model.Session{
		ID:             1,
		MovieID:        1,
		HallID:         1,
		BasePriceCents: 1200,
		StartTime:      time.Now().Add(time.Hour),
	}

	tests := []struct {
		name    string
		session *model.Session
		repo    *mockAdminRepository
		wantErr error
		wantMsg string
	}{
		{
			name:    "nil session",
			session: nil,
			repo:    &mockAdminRepository{},
			wantMsg: "session is nil",
		},
		{
			name:    "invalid session id",
			session: &model.Session{ID: 0, MovieID: 1, HallID: 1, BasePriceCents: 1200, StartTime: time.Now()},
			repo:    &mockAdminRepository{},
			wantErr: ErrSessionNotFound,
		},
		{
			name:    "invalid movie id",
			session: &model.Session{ID: 1, MovieID: 0, HallID: 1, BasePriceCents: 1200, StartTime: time.Now()},
			repo:    &mockAdminRepository{},
			wantErr: ErrMovieNotFound,
		},
		{
			name:    "invalid hall id",
			session: &model.Session{ID: 1, MovieID: 1, HallID: 0, BasePriceCents: 1200, StartTime: time.Now()},
			repo:    &mockAdminRepository{},
			wantErr: ErrHallNotFound,
		},
		{
			name:    "invalid base price",
			session: &model.Session{ID: 1, MovieID: 1, HallID: 1, BasePriceCents: 0, StartTime: time.Now()},
			repo:    &mockAdminRepository{},
			wantMsg: "base price must be greater than zero",
		},
		{
			name:    "zero start time",
			session: &model.Session{ID: 1, MovieID: 1, HallID: 1, BasePriceCents: 1200},
			repo:    &mockAdminRepository{},
			wantMsg: "start time is required",
		},
		{
			name:    "repo error",
			session: validSession,
			repo: &mockAdminRepository{
				UpdateSessionFunc: func(session *model.Session) error {
					return repoErr
				},
			},
			wantErr: repoErr,
		},
		{
			name:    "success",
			session: validSession,
			repo:    &mockAdminRepository{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewAdminService(tt.repo, zap.NewNop())

			err := svc.UpdateSession(tt.session)

			if tt.wantErr != nil && !errors.Is(err, tt.wantErr) {
				t.Fatalf("expected error %v, got %v", tt.wantErr, err)
			}
			if tt.wantMsg != "" {
				if err == nil || err.Error() != tt.wantMsg {
					t.Fatalf("expected error %q, got %v", tt.wantMsg, err)
				}
			}
			if tt.wantErr == nil && tt.wantMsg == "" && err != nil {
				t.Fatalf("expected nil error, got %v", err)
			}
		})
	}
}

func TestAdminService_DeleteSession(t *testing.T) {
	repoErr := errors.New("repo error")

	tests := []struct {
		name    string
		id      int
		repo    *mockAdminRepository
		wantErr error
	}{
		{
			name:    "invalid id",
			id:      0,
			repo:    &mockAdminRepository{},
			wantErr: ErrSessionNotFound,
		},
		{
			name: "repo error",
			id:   1,
			repo: &mockAdminRepository{
				DeleteSessionFunc: func(id int) error {
					return repoErr
				},
			},
			wantErr: repoErr,
		},
		{
			name:    "success",
			id:      1,
			repo:    &mockAdminRepository{},
			wantErr: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewAdminService(tt.repo, zap.NewNop())

			err := svc.DeleteSession(tt.id)

			if !errors.Is(err, tt.wantErr) && err != tt.wantErr {
				t.Fatalf("expected error %v, got %v", tt.wantErr, err)
			}
		})
	}
}
