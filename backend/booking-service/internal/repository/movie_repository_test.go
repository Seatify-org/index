package repository

import (
	"database/sql"
	"errors"
	"regexp"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

func newMockMovieRepo(t *testing.T) (*sql.DB, sqlmock.Sqlmock, MovieRepository) {
	t.Helper()

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}

	repo := NewPostgresMovieRepository(db)
	return db, mock, repo
}

func TestNewPostgresMovieRepository(t *testing.T) {
	db, _, repo := newMockMovieRepo(t)
	defer db.Close()

	if repo == nil {
		t.Fatal("expected repository, got nil")
	}
}

func TestPostgresMovieRepository_GetAll_Success(t *testing.T) {
	db, mock, repo := newMockMovieRepo(t)
	defer db.Close()

	createdAt := time.Now()
	releaseDate := time.Now().AddDate(-1, 0, 0)

	query := regexp.QuoteMeta(`
        SELECT id, title, description, duration_minutes, release_date,
               poster_url, banner_url, trailer_url, rating, created_at
        FROM movies
        ORDER BY id`)

	rows := sqlmock.NewRows([]string{
		"id", "title", "description", "duration_minutes", "release_date",
		"poster_url", "banner_url", "trailer_url", "rating", "created_at",
	}).
		AddRow(int64(1), "Movie 1", "Desc 1", 120, releaseDate, "poster1", "banner1", "trailer1", 8.5, createdAt).
		AddRow(int64(2), "Movie 2", nil, 95, nil, nil, nil, nil, nil, createdAt)

	mock.ExpectQuery(query).WillReturnRows(rows)

	movies, err := repo.GetAll()
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if len(movies) != 2 {
		t.Fatalf("expected 2 movies, got %d", len(movies))
	}
	if movies[0].Title != "Movie 1" {
		t.Fatalf("expected Movie 1, got %s", movies[0].Title)
	}
	if movies[0].Description != "Desc 1" {
		t.Fatalf("expected Desc 1, got %s", movies[0].Description)
	}
	if movies[0].PosterURL != "poster1" {
		t.Fatalf("expected poster1, got %s", movies[0].PosterURL)
	}
	if movies[0].BannerURL != "banner1" {
		t.Fatalf("expected banner1, got %s", movies[0].BannerURL)
	}
	if movies[0].TrailerURL != "trailer1" {
		t.Fatalf("expected trailer1, got %s", movies[0].TrailerURL)
	}
	if movies[0].Rating != 8.5 {
		t.Fatalf("expected rating 8.5, got %v", movies[0].Rating)
	}
	if movies[1].Description != "" {
		t.Fatalf("expected empty description, got %s", movies[1].Description)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresMovieRepository_GetAll_QueryError(t *testing.T) {
	db, mock, repo := newMockMovieRepo(t)
	defer db.Close()

	query := regexp.QuoteMeta(`
        SELECT id, title, description, duration_minutes, release_date,
               poster_url, banner_url, trailer_url, rating, created_at
        FROM movies
        ORDER BY id`)

	expectedErr := errors.New("query failed")
	mock.ExpectQuery(query).WillReturnError(expectedErr)

	movies, err := repo.GetAll()
	if movies != nil {
		t.Fatalf("expected nil movies, got %#v", movies)
	}
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresMovieRepository_GetAll_RowError(t *testing.T) {
	db, mock, repo := newMockMovieRepo(t)
	defer db.Close()

	createdAt := time.Now()
	query := regexp.QuoteMeta(`
        SELECT id, title, description, duration_minutes, release_date,
               poster_url, banner_url, trailer_url, rating, created_at
        FROM movies
        ORDER BY id`)

	expectedErr := errors.New("row error")
	rows := sqlmock.NewRows([]string{
		"id", "title", "description", "duration_minutes", "release_date",
		"poster_url", "banner_url", "trailer_url", "rating", "created_at",
	}).
		AddRow(int64(1), "Movie 1", "Desc 1", 120, nil, nil, nil, nil, nil, createdAt).
		RowError(0, expectedErr)

	mock.ExpectQuery(query).WillReturnRows(rows)

	movies, err := repo.GetAll()
	if movies != nil {
		t.Fatalf("expected nil movies, got %#v", movies)
	}
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresMovieRepository_GetByID_Success(t *testing.T) {
	db, mock, repo := newMockMovieRepo(t)
	defer db.Close()

	createdAt := time.Now()
	releaseDate := time.Now().AddDate(-2, 0, 0)

	query := regexp.QuoteMeta(`
        SELECT id, title, description, duration_minutes, release_date,
               poster_url, banner_url, trailer_url, rating, created_at
        FROM movies
        WHERE id = $1`)

	rows := sqlmock.NewRows([]string{
		"id", "title", "description", "duration_minutes", "release_date",
		"poster_url", "banner_url", "trailer_url", "rating", "created_at",
	}).AddRow(
		int64(1), "Movie 1", "Desc 1", 120, releaseDate,
		"poster1", "banner1", "trailer1", 8.8, createdAt,
	)

	mock.ExpectQuery(query).WithArgs(int64(1)).WillReturnRows(rows)

	movie, err := repo.GetByID(1)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if movie == nil {
		t.Fatal("expected movie, got nil")
	}
	if movie.ID != 1 {
		t.Fatalf("expected ID 1, got %d", movie.ID)
	}
	if movie.Title != "Movie 1" {
		t.Fatalf("expected Movie 1, got %s", movie.Title)
	}
	if movie.Rating != 8.8 {
		t.Fatalf("expected rating 8.8, got %v", movie.Rating)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresMovieRepository_GetByID_NotFound(t *testing.T) {
	db, mock, repo := newMockMovieRepo(t)
	defer db.Close()

	query := regexp.QuoteMeta(`
        SELECT id, title, description, duration_minutes, release_date,
               poster_url, banner_url, trailer_url, rating, created_at
        FROM movies
        WHERE id = $1`)

	mock.ExpectQuery(query).
		WithArgs(int64(1)).
		WillReturnError(sql.ErrNoRows)

	movie, err := repo.GetByID(1)
	if movie != nil {
		t.Fatalf("expected nil movie, got %#v", movie)
	}
	if !errors.Is(err, ErrMovieNotFound) {
		t.Fatalf("expected ErrMovieNotFound, got %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresMovieRepository_GetByID_QueryError(t *testing.T) {
	db, mock, repo := newMockMovieRepo(t)
	defer db.Close()

	query := regexp.QuoteMeta(`
        SELECT id, title, description, duration_minutes, release_date,
               poster_url, banner_url, trailer_url, rating, created_at
        FROM movies
        WHERE id = $1`)

	expectedErr := errors.New("select failed")
	mock.ExpectQuery(query).
		WithArgs(int64(1)).
		WillReturnError(expectedErr)

	movie, err := repo.GetByID(1)
	if movie != nil {
		t.Fatalf("expected nil movie, got %#v", movie)
	}
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresMovieRepository_GetSessionsByMovieID_Success(t *testing.T) {
	db, mock, repo := newMockMovieRepo(t)
	defer db.Close()

	startTime := time.Now().Add(time.Hour)
	endTime := startTime.Add(2 * time.Hour)
	createdAt := time.Now()

	query := regexp.QuoteMeta(`
        SELECT
            s.id,
            s.movie_id,
            m.title,
            s.hall_id,
            h.name,
            c.id,
            c.name,
            c.address,
            c.city,
            s.start_time,
            s.end_time,
            s.base_price_cents,
            s.status,
            s.available_seats,
            s.created_at
        FROM sessions s
        JOIN movies m ON s.movie_id = m.id
        JOIN halls h ON s.hall_id = h.id
        JOIN cinemas c ON h.cinema_id = c.id
        WHERE s.movie_id = $1
        ORDER BY s.start_time`)

	rows := sqlmock.NewRows([]string{
		"id", "movie_id", "title", "hall_id", "hall_name", "cinema_id",
		"cinema_name", "cinema_address", "cinema_city", "start_time",
		"end_time", "base_price_cents", "status", "available_seats", "created_at",
	}).
		AddRow(
			int64(1), int64(10), "Movie 1", int64(100), "Hall A", int64(1000),
			"Cinema X", "Addr 1", "Frankfurt", startTime,
			endTime, 1500, "scheduled", int64(50), createdAt,
		).
		AddRow(
			int64(2), int64(10), "Movie 1", int64(101), "Hall B", int64(1001),
			"Cinema Y", "Addr 2", "Berlin", startTime.Add(3*time.Hour),
			nil, 1700, "scheduled", nil, createdAt,
		)

	mock.ExpectQuery(query).WithArgs(int64(10)).WillReturnRows(rows)

	sessions, err := repo.GetSessionsByMovieID(10)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if len(sessions) != 2 {
		t.Fatalf("expected 2 sessions, got %d", len(sessions))
	}
	if sessions[0].ID != 1 {
		t.Fatalf("expected first session ID 1, got %d", sessions[0].ID)
	}
	if sessions[0].EndTime != endTime {
		t.Fatalf("expected endTime %v, got %v", endTime, sessions[0].EndTime)
	}
	if sessions[0].AvailableSeats != 50 {
		t.Fatalf("expected available seats 50, got %d", sessions[0].AvailableSeats)
	}
	if sessions[1].AvailableSeats != 0 {
		t.Fatalf("expected available seats 0, got %d", sessions[1].AvailableSeats)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresMovieRepository_GetSessionsByMovieID_QueryError(t *testing.T) {
	db, mock, repo := newMockMovieRepo(t)
	defer db.Close()

	query := regexp.QuoteMeta(`
        SELECT
            s.id,
            s.movie_id,
            m.title,
            s.hall_id,
            h.name,
            c.id,
            c.name,
            c.address,
            c.city,
            s.start_time,
            s.end_time,
            s.base_price_cents,
            s.status,
            s.available_seats,
            s.created_at
        FROM sessions s
        JOIN movies m ON s.movie_id = m.id
        JOIN halls h ON s.hall_id = h.id
        JOIN cinemas c ON h.cinema_id = c.id
        WHERE s.movie_id = $1
        ORDER BY s.start_time`)

	expectedErr := errors.New("query failed")
	mock.ExpectQuery(query).WithArgs(int64(10)).WillReturnError(expectedErr)

	sessions, err := repo.GetSessionsByMovieID(10)
	if sessions != nil {
		t.Fatalf("expected nil sessions, got %#v", sessions)
	}
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresMovieRepository_GetSessionsByMovieID_RowError(t *testing.T) {
	db, mock, repo := newMockMovieRepo(t)
	defer db.Close()

	startTime := time.Now()
	createdAt := time.Now()

	query := regexp.QuoteMeta(`
        SELECT
            s.id,
            s.movie_id,
            m.title,
            s.hall_id,
            h.name,
            c.id,
            c.name,
            c.address,
            c.city,
            s.start_time,
            s.end_time,
            s.base_price_cents,
            s.status,
            s.available_seats,
            s.created_at
        FROM sessions s
        JOIN movies m ON s.movie_id = m.id
        JOIN halls h ON s.hall_id = h.id
        JOIN cinemas c ON h.cinema_id = c.id
        WHERE s.movie_id = $1
        ORDER BY s.start_time`)

	expectedErr := errors.New("row error")
	rows := sqlmock.NewRows([]string{
		"id", "movie_id", "title", "hall_id", "hall_name", "cinema_id",
		"cinema_name", "cinema_address", "cinema_city", "start_time",
		"end_time", "base_price_cents", "status", "available_seats", "created_at",
	}).
		AddRow(
			int64(1), int64(10), "Movie 1", int64(100), "Hall A", int64(1000),
			"Cinema X", "Addr 1", "Frankfurt", startTime,
			nil, 1500, "scheduled", int64(50), createdAt,
		).
		RowError(0, expectedErr)

	mock.ExpectQuery(query).WithArgs(int64(10)).WillReturnRows(rows)

	sessions, err := repo.GetSessionsByMovieID(10)
	if sessions != nil {
		t.Fatalf("expected nil sessions, got %#v", sessions)
	}
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresMovieRepository_GetSessionByID_Success(t *testing.T) {
	db, mock, repo := newMockMovieRepo(t)
	defer db.Close()

	startTime := time.Now().Add(time.Hour)
	endTime := startTime.Add(2 * time.Hour)
	createdAt := time.Now()

	query := regexp.QuoteMeta(`
        SELECT
            s.id,
            s.movie_id,
            m.title,
            s.hall_id,
            h.name,
            c.id,
            c.name,
            c.address,
            c.city,
            s.start_time,
            s.end_time,
            s.base_price_cents,
            s.status,
            s.available_seats,
            s.created_at
        FROM sessions s
        JOIN movies m ON s.movie_id = m.id
        JOIN halls h ON s.hall_id = h.id
        JOIN cinemas c ON h.cinema_id = c.id
        WHERE s.id = $1`)

	rows := sqlmock.NewRows([]string{
		"id", "movie_id", "title", "hall_id", "hall_name", "cinema_id",
		"cinema_name", "cinema_address", "cinema_city", "start_time",
		"end_time", "base_price_cents", "status", "available_seats", "created_at",
	}).AddRow(
		int64(1), int64(10), "Movie 1", int64(100), "Hall A", int64(1000),
		"Cinema X", "Addr 1", "Frankfurt", startTime,
		endTime, 1500, "scheduled", int64(50), createdAt,
	)

	mock.ExpectQuery(query).WithArgs(int64(1)).WillReturnRows(rows)

	session, err := repo.GetSessionByID(1)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if session == nil {
		t.Fatal("expected session, got nil")
	}
	if session.ID != 1 {
		t.Fatalf("expected ID 1, got %d", session.ID)
	}
	if session.MovieTitle != "Movie 1" {
		t.Fatalf("expected Movie 1, got %s", session.MovieTitle)
	}
	if session.AvailableSeats != 50 {
		t.Fatalf("expected available seats 50, got %d", session.AvailableSeats)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresMovieRepository_GetSessionByID_NotFound(t *testing.T) {
	db, mock, repo := newMockMovieRepo(t)
	defer db.Close()

	query := regexp.QuoteMeta(`
        SELECT
            s.id,
            s.movie_id,
            m.title,
            s.hall_id,
            h.name,
            c.id,
            c.name,
            c.address,
            c.city,
            s.start_time,
            s.end_time,
            s.base_price_cents,
            s.status,
            s.available_seats,
            s.created_at
        FROM sessions s
        JOIN movies m ON s.movie_id = m.id
        JOIN halls h ON s.hall_id = h.id
        JOIN cinemas c ON h.cinema_id = c.id
        WHERE s.id = $1`)

	mock.ExpectQuery(query).
		WithArgs(int64(1)).
		WillReturnError(sql.ErrNoRows)

	session, err := repo.GetSessionByID(1)
	if session != nil {
		t.Fatalf("expected nil session, got %#v", session)
	}
	if !errors.Is(err, ErrSessionNotFound) {
		t.Fatalf("expected ErrSessionNotFound, got %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresMovieRepository_GetSessionByID_QueryError(t *testing.T) {
	db, mock, repo := newMockMovieRepo(t)
	defer db.Close()

	query := regexp.QuoteMeta(`
        SELECT
            s.id,
            s.movie_id,
            m.title,
            s.hall_id,
            h.name,
            c.id,
            c.name,
            c.address,
            c.city,
            s.start_time,
            s.end_time,
            s.base_price_cents,
            s.status,
            s.available_seats,
            s.created_at
        FROM sessions s
        JOIN movies m ON s.movie_id = m.id
        JOIN halls h ON s.hall_id = h.id
        JOIN cinemas c ON h.cinema_id = c.id
        WHERE s.id = $1`)

	expectedErr := errors.New("select failed")
	mock.ExpectQuery(query).
		WithArgs(int64(1)).
		WillReturnError(expectedErr)

	session, err := repo.GetSessionByID(1)
	if session != nil {
		t.Fatalf("expected nil session, got %#v", session)
	}
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
