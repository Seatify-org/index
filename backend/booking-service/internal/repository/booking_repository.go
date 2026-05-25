package repository

import (
	"database/sql"
	"errors"
	"time"

	"github.com/Seatify-org/seatify-common/model"
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
	query := `INSERT INTO bookings (user_id, session_id, total_amount_cents, status, payment_id, created_at, updated_at) 
			  VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, created_at, updated_at`

	err := r.db.QueryRow(query, booking.UserID, booking.SessionID, booking.TotalAmount, booking.Status, booking.PaymentID).Scan(&booking.ID, &booking.CreatedAt, &booking.UpdatedAt)
	return err
}

func (r *postgresBookingRepository) GetByID(id int64) (*model.Booking, error) {
	query := `SELECT id, user_id, session_id, total_amount_cents, status, payment_id, created_at, updated_at FROM bookings WHERE id = $1`
	booking := &model.Booking{}
	err := r.db.QueryRow(query, id).Scan(&booking.ID, &booking.UserID, &booking.SessionID, &booking.TotalAmount, &booking.Status, &booking.PaymentID, &booking.CreatedAt, &booking.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrBookingNotFound
	}
	return booking, err
}

func (r *postgresBookingRepository) GetByUserID(userID int64) ([]*model.Booking, error) {
	query := `SELECT id, user_id, session_id, total_amount_cents, status, payment_id, created_at, updated_at FROM bookings WHERE user_id = $1 ORDER BY created_at DESC`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []*model.Booking
	for rows.Next() {
		booking := &model.Booking{}
		err := rows.Scan(&booking.ID, &booking.UserID, &booking.SessionID, &booking.TotalAmount, &booking.Status, &booking.PaymentID, &booking.CreatedAt, &booking.UpdatedAt)
		if err != nil {
			return nil, err
		}
		bookings = append(bookings, booking)
	}
	return bookings, rows.Err()
}

func (r *postgresBookingRepository) UpdateStatus(id int64, status string) error {
	query := `UPDATE bookings SET status = $1, updated_at = $2 WHERE id = $3`
	now := time.Now().Format(time.RFC3339)
	result, err := r.db.Exec(query, status, now, id)
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
