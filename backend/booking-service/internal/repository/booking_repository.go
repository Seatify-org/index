package repository

import (
	"database/sql"
	"errors"
	"time"

	"github.com/seatify/backend/common/model"
)

var ErrBookingNotFound = errors.New("booking not found")

type BookingRepository interface {
	Create(booking *model.Booking) error
	GetByID(id int64) (*model.Booking, error)
	GetByUserID(userID int64) ([]*model.Booking, error)
	UpdateStatus(id int64, status string) error
	Cancel(id int64) error
}

type postgresBookingRepository struct {
	db *sql.DB
}

func NewPostgresBookingRepository(db *sql.DB) BookingRepository {
	return &postgresBookingRepository{db: db}
}

func (r *postgresBookingRepository) Create(booking *model.Booking) error {
	query := `INSERT INTO bookings (user_id, session_id, total_amount_cents, status, booked_at, cancelled_at) 
			  VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
	now := time.Now().Format(time.RFC3339)
	return r.db.QueryRow(query, booking.UserID, booking.SessionID, booking.TotalAmount, booking.Status, now, nil).Scan(&booking.ID)
}

func (r *postgresBookingRepository) GetByID(id int64) (*model.Booking, error) {
	query := `SELECT id, user_id, session_id, total_amount_cents, status, booked_at, cancelled_at FROM bookings WHERE id = $1`
	booking := &model.Booking{}
	var bookedAt, cancelledAt sql.NullTime
	err := r.db.QueryRow(query, id).Scan(&booking.ID, &booking.UserID, &booking.SessionID, &booking.TotalAmount, &booking.Status, &bookedAt, &cancelledAt)
	if err == sql.ErrNoRows {
		return nil, ErrBookingNotFound
	}
	if bookedAt.Valid {
		booking.CreatedAt = bookedAt.Time.Format(time.RFC3339)
	}
	if cancelledAt.Valid {
		booking.CancelledAt = cancelledAt.Time.Format(time.RFC3339)
	}
	return booking, err
}

func (r *postgresBookingRepository) GetByUserID(userID int64) ([]*model.Booking, error) {
	query := `SELECT id, user_id, session_id, total_amount_cents, status, booked_at, cancelled_at FROM bookings WHERE user_id = $1 ORDER BY booked_at DESC`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []*model.Booking
	for rows.Next() {
		booking := &model.Booking{}
		var bookedAt, cancelledAt sql.NullTime
		err := rows.Scan(&booking.ID, &booking.UserID, &booking.SessionID, &booking.TotalAmount, &booking.Status, &bookedAt, &cancelledAt)
		if err != nil {
			return nil, err
		}
		if bookedAt.Valid {
			booking.CreatedAt = bookedAt.Time.Format(time.RFC3339)
		}
		if cancelledAt.Valid {
			booking.CancelledAt = cancelledAt.Time.Format(time.RFC3339)
		}
		bookings = append(bookings, booking)
	}
	return bookings, rows.Err()
}

func (r *postgresBookingRepository) UpdateStatus(id int64, status string) error {
	query := `UPDATE bookings SET status = $1 WHERE id = $2`
	result, err := r.db.Exec(query, status, id)
	if err != nil {
		return err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return ErrBookingNotFound
	}
	return nil
}

func (r *postgresBookingRepository) Cancel(id int64) error {
	return r.UpdateStatus(id, "cancelled")
}
