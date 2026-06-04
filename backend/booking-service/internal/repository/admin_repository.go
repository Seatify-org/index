package repository

import (
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/Seatify-org/seatify-common/model"
)

var ErrCinemaNotFoundRepo = errors.New("cinema not found")

// MovieResponse — расширенная структура фильма с genre, cast, director
type MovieResponse struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Duration    int       `json:"duration_minutes"`
	ReleaseDate time.Time `json:"release_date"`
	PosterURL   string    `json:"poster_url"`
	BannerURL   string    `json:"banner_url"`
	TrailerURL  string    `json:"trailer_url"`
	Rating      float64   `json:"rating"`
	CreatedAt   time.Time `json:"created_at"`
	Genre       []string  `json:"genre"`
	Cast        []string  `json:"cast"`
	Director    string    `json:"director"`
}

// Вспомогательные функции для конвертации между строкой и массивом
func stringToStrings(s string) []string {
	if s == "" {
		return []string{}
	}
	parts := strings.Split(s, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func stringsToString(arr []string) string {
	return strings.Join(arr, ",")
}

type AdminRepository interface {
	GetMovies() ([]MovieResponse, error)
	CreateMovie(m *MovieResponse) error
	UpdateMovie(m *MovieResponse) error
	DeleteMovie(id int) error

	GetCinemas() ([]model.Cinema, error)
	GetCinemaByID(id int64) (*model.Cinema, error)
	CreateCinema(c *model.Cinema) error
	UpdateCinema(c *model.Cinema) error
	DeleteCinema(id int) error

	GetHallsByCinema(cinemaID int) ([]model.Hall, error)
	CreateHall(h *model.Hall) error

	GetSessions() ([]model.Session, error)
	GetSessionsByCinemaID(cinemaID int64) ([]model.Session, error)
	CreateSession(s *model.Session) error
	UpdateSession(s *model.Session) error
	DeleteSession(id int) error
}

type postgresAdminRepository struct {
	db *sql.DB
}

func NewPostgresAdminRepository(db *sql.DB) AdminRepository {
	return &postgresAdminRepository{db: db}
}

// ===== MOVIES =====

func (r *postgresAdminRepository) GetMovies() ([]MovieResponse, error) {
	rows, err := r.db.Query(`
		SELECT id, title, description, duration_minutes, release_date, poster_url,
		       banner_url, trailer_url, rating, created_at,
		       COALESCE(genre, ''), COALESCE("cast", ''), COALESCE(director, '')
		FROM movies ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var movies []MovieResponse
	for rows.Next() {
		var m MovieResponse
		var description sql.NullString
		var releaseDate sql.NullTime
		var posterURL, bannerURL, trailerURL sql.NullString
		var rating sql.NullFloat64
		var genreStr, castStr, directorStr string

		err := rows.Scan(&m.ID, &m.Title, &description, &m.Duration, &releaseDate,
			&posterURL, &bannerURL, &trailerURL, &rating, &m.CreatedAt,
			&genreStr, &castStr, &directorStr)
		if err != nil {
			return nil, err
		}
		if description.Valid {
			m.Description = description.String
		}
		if releaseDate.Valid {
			m.ReleaseDate = releaseDate.Time
		}
		if posterURL.Valid {
			m.PosterURL = posterURL.String
		}
		if bannerURL.Valid {
			m.BannerURL = bannerURL.String
		}
		if trailerURL.Valid {
			m.TrailerURL = trailerURL.String
		}
		if rating.Valid {
			m.Rating = rating.Float64
		}

		m.Genre = stringToStrings(genreStr)
		m.Cast = stringToStrings(castStr)
		m.Director = directorStr

		movies = append(movies, m)
	}
	return movies, rows.Err()
}

func (r *postgresAdminRepository) CreateMovie(m *MovieResponse) error {
	return r.db.QueryRow(`
		INSERT INTO movies (title, description, duration_minutes, release_date,
			poster_url, banner_url, trailer_url, rating, genre, "cast", director, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
		RETURNING id, created_at`,
		m.Title, m.Description, m.Duration, m.ReleaseDate,
		m.PosterURL, m.BannerURL, m.TrailerURL, m.Rating,
		stringsToString(m.Genre), stringsToString(m.Cast), m.Director,
	).Scan(&m.ID, &m.CreatedAt)
}

func (r *postgresAdminRepository) UpdateMovie(m *MovieResponse) error {
	_, err := r.db.Exec(`
		UPDATE movies SET title=$1, description=$2, duration_minutes=$3, release_date=$4,
		    poster_url=$5, banner_url=$6, trailer_url=$7, rating=$8,
		    genre=$9, "cast"=$10, director=$11
		WHERE id=$12`,
		m.Title, m.Description, m.Duration, m.ReleaseDate,
		m.PosterURL, m.BannerURL, m.TrailerURL, m.Rating,
		stringsToString(m.Genre), stringsToString(m.Cast), m.Director,
		m.ID)
	return err
}

func (r *postgresAdminRepository) DeleteMovie(id int) error {
	_, err := r.db.Exec(`DELETE FROM movies WHERE id=$1`, id)
	return err
}

// ===== CINEMAS =====

func (r *postgresAdminRepository) GetCinemas() ([]model.Cinema, error) {
	rows, err := r.db.Query(`
		SELECT id, name, address, city, latitude, longitude, rating,
		       phone_number, created_at
		FROM cinemas ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cinemas []model.Cinema
	for rows.Next() {
		var c model.Cinema
		var address, city, phone sql.NullString
		var lat, lon, rating sql.NullFloat64

		err := rows.Scan(&c.ID, &c.Name, &address, &city, &lat, &lon, &rating, &phone, &c.CreatedAt)
		if err != nil {
			return nil, err
		}
		if address.Valid {
			c.Address = address.String
		}
		if city.Valid {
			c.City = city.String
		}
		if lat.Valid {
			c.Latitude = lat.Float64
		}
		if lon.Valid {
			c.Longitude = lon.Float64
		}
		if rating.Valid {
			c.Rating = rating.Float64
		}
		if phone.Valid {
			c.PhoneNumber = phone.String
		}

		cinemas = append(cinemas, c)
	}
	return cinemas, rows.Err()
}

func (r *postgresAdminRepository) GetCinemaByID(id int64) (*model.Cinema, error) {
	var c model.Cinema
	var address, city, phone sql.NullString
	var lat, lon, rating sql.NullFloat64

	err := r.db.QueryRow(`
		SELECT id, name, address, city, latitude, longitude, rating,
		       phone_number, created_at
		FROM cinemas WHERE id = $1`, id).Scan(
		&c.ID, &c.Name, &address, &city, &lat, &lon, &rating, &phone, &c.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrCinemaNotFoundRepo
	}
	if err != nil {
		return nil, err
	}
	if address.Valid {
		c.Address = address.String
	}
	if city.Valid {
		c.City = city.String
	}
	if lat.Valid {
		c.Latitude = lat.Float64
	}
	if lon.Valid {
		c.Longitude = lon.Float64
	}
	if rating.Valid {
		c.Rating = rating.Float64
	}
	if phone.Valid {
		c.PhoneNumber = phone.String
	}

	return &c, nil
}

func (r *postgresAdminRepository) CreateCinema(c *model.Cinema) error {
	return r.db.QueryRow(`
		INSERT INTO cinemas (name, address, city, latitude, longitude, rating,
			phone_number, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		RETURNING id, created_at`,
		c.Name, c.Address, c.City, c.Latitude, c.Longitude, c.Rating, c.PhoneNumber,
	).Scan(&c.ID, &c.CreatedAt)
}

func (r *postgresAdminRepository) UpdateCinema(c *model.Cinema) error {
	_, err := r.db.Exec(`
		UPDATE cinemas SET name=$1, address=$2, city=$3, latitude=$4, longitude=$5,
		    rating=$6, phone_number=$7
		WHERE id=$8`,
		c.Name, c.Address, c.City, c.Latitude, c.Longitude, c.Rating, c.PhoneNumber, c.ID)
	return err
}

func (r *postgresAdminRepository) DeleteCinema(id int) error {
	_, err := r.db.Exec(`DELETE FROM cinemas WHERE id=$1`, id)
	return err
}

// ===== HALLS =====

func (r *postgresAdminRepository) GetHallsByCinema(cinemaID int) ([]model.Hall, error) {
	rows, err := r.db.Query(`
		SELECT id, cinema_id, name, rows, seats_per_row, total_seats
		FROM halls WHERE cinema_id = $1 ORDER BY id`, cinemaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var halls []model.Hall
	for rows.Next() {
		var h model.Hall
		err := rows.Scan(&h.ID, &h.CinemaID, &h.Name, &h.Rows, &h.SeatsPerRow, &h.TotalSeats)
		if err != nil {
			return nil, err
		}
		halls = append(halls, h)
	}
	return halls, rows.Err()
}

func (r *postgresAdminRepository) CreateHall(h *model.Hall) error {
	return r.db.QueryRow(`
		INSERT INTO halls (cinema_id, name, total_seats, rows, seats_per_row)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at`,
		h.CinemaID, h.Name, h.TotalSeats, h.Rows, h.SeatsPerRow,
	).Scan(&h.ID, &h.CreatedAt)
}

// ===== SESSIONS =====

func (r *postgresAdminRepository) GetSessions() ([]model.Session, error) {
	rows, err := r.db.Query(`
		SELECT 
			s.id, s.movie_id, m.title, h.id, h.name, c.id, c.name, c.address, c.city,
			s.start_time, s.base_price_cents
		FROM sessions s
		JOIN movies m ON s.movie_id = m.id
		JOIN halls h ON s.hall_id = h.id
		JOIN cinemas c ON h.cinema_id = c.id
		ORDER BY s.start_time`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []model.Session
	for rows.Next() {
		var s model.Session
		err := rows.Scan(
			&s.ID, &s.MovieID, &s.MovieTitle, &s.HallID, &s.HallName,
			&s.CinemaID, &s.CinemaName, &s.CinemaAddress, &s.CinemaCity,
			&s.StartTime, &s.BasePriceCents,
		)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, rows.Err()
}

func (r *postgresAdminRepository) GetSessionsByCinemaID(cinemaID int64) ([]model.Session, error) {
	rows, err := r.db.Query(`
		SELECT 
			s.id, s.movie_id, m.title, h.id, h.name, c.id, c.name, c.address, c.city,
			s.start_time, s.base_price_cents
		FROM sessions s
		JOIN movies m ON s.movie_id = m.id
		JOIN halls h ON s.hall_id = h.id
		JOIN cinemas c ON h.cinema_id = c.id
		WHERE h.cinema_id = $1
		ORDER BY s.start_time`, cinemaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []model.Session
	for rows.Next() {
		var s model.Session
		err := rows.Scan(
			&s.ID, &s.MovieID, &s.MovieTitle, &s.HallID, &s.HallName,
			&s.CinemaID, &s.CinemaName, &s.CinemaAddress, &s.CinemaCity,
			&s.StartTime, &s.BasePriceCents,
		)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, rows.Err()
}

func (r *postgresAdminRepository) CreateSession(s *model.Session) error {
	return r.db.QueryRow(`
		INSERT INTO sessions (movie_id, hall_id, start_time, base_price_cents)
		VALUES ($1, $2, $3, $4) RETURNING id`,
		s.MovieID, s.HallID, s.StartTime, s.BasePriceCents,
	).Scan(&s.ID)
}

func (r *postgresAdminRepository) UpdateSession(s *model.Session) error {
	_, err := r.db.Exec(`
		UPDATE sessions SET movie_id=$1, hall_id=$2, start_time=$3, base_price_cents=$4
		WHERE id=$5`,
		s.MovieID, s.HallID, s.StartTime, s.BasePriceCents, s.ID)
	return err
}

func (r *postgresAdminRepository) DeleteSession(id int) error {
	_, err := r.db.Exec(`DELETE FROM sessions WHERE id=$1`, id)
	return err
}
