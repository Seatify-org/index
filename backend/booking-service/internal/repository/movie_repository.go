package repository

import (
	"database/sql"
	"errors"

	"github.com/Seatify-org/seatify-common/model"
)

var (
	ErrMovieNotFound   = errors.New("movie not found")
	ErrSessionNotFound = errors.New("session not found")
)

type MovieRepository interface {
	GetAll() ([]*model.Movie, error)
	GetByID(id int64) (*model.Movie, error)
	GetSessionsByMovieID(movieID int64) ([]*model.Session, error)
	GetSessionByID(id int64) (*model.Session, error)
}

type postgresMovieRepository struct {
	db *sql.DB
}

func NewPostgresMovieRepository(db *sql.DB) MovieRepository {
	return &postgresMovieRepository{db: db}
}

func (r *postgresMovieRepository) GetAll() ([]*model.Movie, error) {
	rows, err := r.db.Query(`
		SELECT id, title, description, duration_minutes, release_date,
		       poster_url, banner_url, trailer_url, rating, created_at
		FROM movies
		ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var movies []*model.Movie
	for rows.Next() {
		movie := &model.Movie{}
		var description sql.NullString
		var releaseDate sql.NullTime
		var posterURL sql.NullString
		var bannerURL sql.NullString
		var trailerURL sql.NullString
		var rating sql.NullFloat64

		err := rows.Scan(
			&movie.ID,
			&movie.Title,
			&description,
			&movie.Duration,
			&releaseDate,
			&posterURL,
			&bannerURL,
			&trailerURL,
			&rating,
			&movie.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		if description.Valid {
			movie.Description = description.String
		}
		if releaseDate.Valid {
			movie.ReleaseDate = releaseDate.Time
		}
		if posterURL.Valid {
			movie.PosterURL = posterURL.String
		}
		if bannerURL.Valid {
			movie.BannerURL = bannerURL.String
		}
		if trailerURL.Valid {
			movie.TrailerURL = trailerURL.String
		}
		if rating.Valid {
			movie.Rating = rating.Float64
		}

		movies = append(movies, movie)
	}

	return movies, rows.Err()
}

func (r *postgresMovieRepository) GetByID(id int64) (*model.Movie, error) {
	query := `
		SELECT id, title, description, duration_minutes, release_date,
		       poster_url, banner_url, trailer_url, rating, created_at
		FROM movies
		WHERE id = $1`

	movie := &model.Movie{}
	var description sql.NullString
	var releaseDate sql.NullTime
	var posterURL sql.NullString
	var bannerURL sql.NullString
	var trailerURL sql.NullString
	var rating sql.NullFloat64

	err := r.db.QueryRow(query, id).Scan(
		&movie.ID,
		&movie.Title,
		&description,
		&movie.Duration,
		&releaseDate,
		&posterURL,
		&bannerURL,
		&trailerURL,
		&rating,
		&movie.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrMovieNotFound
	}
	if err != nil {
		return nil, err
	}

	if description.Valid {
		movie.Description = description.String
	}
	if releaseDate.Valid {
		movie.ReleaseDate = releaseDate.Time
	}
	if posterURL.Valid {
		movie.PosterURL = posterURL.String
	}
	if bannerURL.Valid {
		movie.BannerURL = bannerURL.String
	}
	if trailerURL.Valid {
		movie.TrailerURL = trailerURL.String
	}
	if rating.Valid {
		movie.Rating = rating.Float64
	}

	return movie, nil
}

func (r *postgresMovieRepository) GetSessionsByMovieID(movieID int64) ([]*model.Session, error) {
	rows, err := r.db.Query(`
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
		ORDER BY s.start_time`, movieID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []*model.Session
	for rows.Next() {
		session := &model.Session{}
		var endTime sql.NullTime
		var availableSeats sql.NullInt64
		err := rows.Scan(
			&session.ID,
			&session.MovieID,
			&session.MovieTitle,
			&session.HallID,
			&session.HallName,
			&session.CinemaID,
			&session.CinemaName,
			&session.CinemaAddress,
			&session.CinemaCity,
			&session.StartTime,
			&endTime,
			&session.BasePriceCents,
			&session.Status,
			&availableSeats,
			&session.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		if endTime.Valid {
			session.EndTime = endTime.Time
		}
		if availableSeats.Valid {
			session.AvailableSeats = int(availableSeats.Int64)
		}
		sessions = append(sessions, session)
	}

	return sessions, rows.Err()
}

func (r *postgresMovieRepository) GetSessionByID(id int64) (*model.Session, error) {
	query := `
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
		WHERE s.id = $1`

	session := &model.Session{}
	var endTime sql.NullTime
	var availableSeats sql.NullInt64

	err := r.db.QueryRow(query, id).Scan(
		&session.ID,
		&session.MovieID,
		&session.MovieTitle,
		&session.HallID,
		&session.HallName,
		&session.CinemaID,
		&session.CinemaName,
		&session.CinemaAddress,
		&session.CinemaCity,
		&session.StartTime,
		&endTime,
		&session.BasePriceCents,
		&session.Status,
		&availableSeats,
		&session.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrSessionNotFound
	}
	if err != nil {
		return nil, err
	}

	if endTime.Valid {
		session.EndTime = endTime.Time
	}
	if availableSeats.Valid {
		session.AvailableSeats = int(availableSeats.Int64)
	}

	return session, nil
}
