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
	query := `
		INSERT INTO bookings (
			user_id, session_id, total_amount_cents, payment_id, status, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id, created_at, updated_at`

	return r.db.QueryRow(
		query,
		booking.UserID,
		booking.SessionID,
		booking.TotalAmountCents,
		booking.PaymentID,
		booking.Status,
	).Scan(&booking.ID, &booking.CreatedAt, &booking.UpdatedAt)
}

func (r *postgresBookingRepository) GetByID(id int64) (*model.Booking, error) {
	query := `
		SELECT id, user_id, session_id, total_amount_cents, payment_id,
		       status, created_at, updated_at, cancelled_at
		FROM bookings
		WHERE id = $1`

	booking := &model.Booking{}
	var cancelledAt sql.NullTime
	var paymentID sql.NullString

	err := r.db.QueryRow(query, id).Scan(
		&booking.ID,
		&booking.UserID,
		&booking.SessionID,
		&booking.TotalAmountCents,
		&paymentID,
		&booking.Status,
		&booking.CreatedAt,
		&booking.UpdatedAt,
		&cancelledAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrBookingNotFound
	}
	if err != nil {
		return nil, err
	}

	if paymentID.Valid {
		booking.PaymentID = paymentID.String
	}
	if cancelledAt.Valid {
		booking.CancelledAt = &cancelledAt.Time
	}

	return booking, nil
}

func (r *postgresBookingRepository) GetByUserID(userID int64) ([]*model.Booking, error) {
	query := `
		SELECT id, user_id, session_id, total_amount_cents, payment_id,
		       status, created_at, updated_at, cancelled_at
		FROM bookings
		WHERE user_id = $1
		ORDER BY created_at DESC`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []*model.Booking
	for rows.Next() {
		booking := &model.Booking{}
		var cancelledAt sql.NullTime
		var paymentID sql.NullString

		err := rows.Scan(
			&booking.ID,
			&booking.UserID,
			&booking.SessionID,
			&booking.TotalAmountCents,
			&paymentID,
			&booking.Status,
			&booking.CreatedAt,
			&booking.UpdatedAt,
			&cancelledAt,
		)
		if err != nil {
			return nil, err
		}

		if paymentID.Valid {
			booking.PaymentID = paymentID.String
		}
		if cancelledAt.Valid {
			booking.CancelledAt = &cancelledAt.Time
		}

		bookings = append(bookings, booking)
	}

	return bookings, rows.Err()
}

func (r *postgresBookingRepository) UpdateStatus(id int64, status string) error {
	query := `UPDATE bookings SET status = $1, updated_at = $2 WHERE id = $3`

	result, err := r.db.Exec(query, status, time.Now(), id)
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
	now := time.Now()
	query := `
		UPDATE bookings
		SET status = 'cancelled', cancelled_at = $1, updated_at = $2
		WHERE id = $3`

	result, err := r.db.Exec(query, now, now, id)
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
