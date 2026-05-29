package repository

import (
	"database/sql"
	"database/sql/driver"
	"errors"
	"regexp"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/Seatify-org/seatify-common/model"
)

type anyTime struct{}

func (a anyTime) Match(v driver.Value) bool {
	_, ok := v.(time.Time)
	return ok
}

func newMockRepo(t *testing.T) (*sql.DB, sqlmock.Sqlmock, BookingRepository) {
	t.Helper()

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}

	repo := NewPostgresBookingRepository(db)
	return db, mock, repo
}

func TestNewPostgresBookingRepository(t *testing.T) {
	db, _, repo := newMockRepo(t)
	defer db.Close()

	if repo == nil {
		t.Fatal("expected repository, got nil")
	}
}

func TestPostgresBookingRepository_Create_Success(t *testing.T) {
	db, mock, repo := newMockRepo(t)
	defer db.Close()

	booking := &model.Booking{
		UserID:           42,
		SessionID:        10,
		TotalAmountCents: 1500,
		PaymentID:        "pay_123",
		Status:           "pending",
	}

	createdAt := time.Now()
	updatedAt := createdAt.Add(time.Minute)

	query := regexp.QuoteMeta(`
        INSERT INTO bookings (
            user_id, session_id, total_amount_cents, payment_id, status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, created_at, updated_at`)

	rows := sqlmock.NewRows([]string{"id", "created_at", "updated_at"}).
		AddRow(int64(1), createdAt, updatedAt)

	mock.ExpectQuery(query).
		WithArgs(booking.UserID, booking.SessionID, booking.TotalAmountCents, booking.PaymentID, booking.Status).
		WillReturnRows(rows)

	err := repo.Create(booking)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}

	if booking.ID != 1 {
		t.Fatalf("expected booking ID 1, got %d", booking.ID)
	}
	if booking.CreatedAt != createdAt {
		t.Fatalf("expected createdAt %v, got %v", createdAt, booking.CreatedAt)
	}
	if booking.UpdatedAt != updatedAt {
		t.Fatalf("expected updatedAt %v, got %v", updatedAt, booking.UpdatedAt)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresBookingRepository_Create_QueryError(t *testing.T) {
	db, mock, repo := newMockRepo(t)
	defer db.Close()

	booking := &model.Booking{
		UserID:           42,
		SessionID:        10,
		TotalAmountCents: 1500,
		PaymentID:        "pay_123",
		Status:           "pending",
	}

	query := regexp.QuoteMeta(`
        INSERT INTO bookings (
            user_id, session_id, total_amount_cents, payment_id, status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, created_at, updated_at`)

	expectedErr := errors.New("insert failed")

	mock.ExpectQuery(query).
		WithArgs(booking.UserID, booking.SessionID, booking.TotalAmountCents, booking.PaymentID, booking.Status).
		WillReturnError(expectedErr)

	err := repo.Create(booking)
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresBookingRepository_GetByID_Success(t *testing.T) {
	db, mock, repo := newMockRepo(t)
	defer db.Close()

	createdAt := time.Now().Add(-time.Hour)
	updatedAt := time.Now()
	cancelledAt := time.Now().Add(time.Hour)

	query := regexp.QuoteMeta(`
        SELECT id, user_id, session_id, total_amount_cents, payment_id,
               status, created_at, updated_at, cancelled_at
        FROM bookings
        WHERE id = $1`)

	rows := sqlmock.NewRows([]string{
		"id", "user_id", "session_id", "total_amount_cents", "payment_id",
		"status", "created_at", "updated_at", "cancelled_at",
	}).AddRow(
		int64(1), int64(42), int64(10), 1500, "pay_123",
		"cancelled", createdAt, updatedAt, cancelledAt,
	)

	mock.ExpectQuery(query).WithArgs(int64(1)).WillReturnRows(rows)

	booking, err := repo.GetByID(1)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if booking == nil {
		t.Fatal("expected booking, got nil")
	}
	if booking.ID != 1 {
		t.Fatalf("expected ID 1, got %d", booking.ID)
	}
	if booking.PaymentID != "pay_123" {
		t.Fatalf("expected payment ID pay_123, got %s", booking.PaymentID)
	}
	if booking.CancelledAt == nil {
		t.Fatal("expected cancelledAt to be set")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresBookingRepository_GetByID_NotFound(t *testing.T) {
	db, mock, repo := newMockRepo(t)
	defer db.Close()

	query := regexp.QuoteMeta(`
        SELECT id, user_id, session_id, total_amount_cents, payment_id,
               status, created_at, updated_at, cancelled_at
        FROM bookings
        WHERE id = $1`)

	mock.ExpectQuery(query).
		WithArgs(int64(1)).
		WillReturnError(sql.ErrNoRows)

	booking, err := repo.GetByID(1)
	if booking != nil {
		t.Fatalf("expected nil booking, got %#v", booking)
	}
	if !errors.Is(err, ErrBookingNotFound) {
		t.Fatalf("expected ErrBookingNotFound, got %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresBookingRepository_GetByID_QueryError(t *testing.T) {
	db, mock, repo := newMockRepo(t)
	defer db.Close()

	query := regexp.QuoteMeta(`
        SELECT id, user_id, session_id, total_amount_cents, payment_id,
               status, created_at, updated_at, cancelled_at
        FROM bookings
        WHERE id = $1`)

	expectedErr := errors.New("select failed")

	mock.ExpectQuery(query).
		WithArgs(int64(1)).
		WillReturnError(expectedErr)

	booking, err := repo.GetByID(1)
	if booking != nil {
		t.Fatalf("expected nil booking, got %#v", booking)
	}
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresBookingRepository_GetByUserID_Success(t *testing.T) {
	db, mock, repo := newMockRepo(t)
	defer db.Close()

	createdAt := time.Now().Add(-time.Hour)
	updatedAt := time.Now()

	query := regexp.QuoteMeta(`
        SELECT id, user_id, session_id, total_amount_cents, payment_id,
               status, created_at, updated_at, cancelled_at
        FROM bookings
        WHERE user_id = $1
        ORDER BY created_at DESC`)

	rows := sqlmock.NewRows([]string{
		"id", "user_id", "session_id", "total_amount_cents", "payment_id",
		"status", "created_at", "updated_at", "cancelled_at",
	}).
		AddRow(int64(2), int64(42), int64(11), 1700, "pay_2", "confirmed", createdAt, updatedAt, nil).
		AddRow(int64(1), int64(42), int64(10), 1500, "pay_1", "pending", createdAt, updatedAt, nil)

	mock.ExpectQuery(query).WithArgs(int64(42)).WillReturnRows(rows)

	bookings, err := repo.GetByUserID(42)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if len(bookings) != 2 {
		t.Fatalf("expected 2 bookings, got %d", len(bookings))
	}
	if bookings[0].ID != 2 {
		t.Fatalf("expected first booking ID 2, got %d", bookings[0].ID)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresBookingRepository_GetByUserID_QueryError(t *testing.T) {
	db, mock, repo := newMockRepo(t)
	defer db.Close()

	query := regexp.QuoteMeta(`
        SELECT id, user_id, session_id, total_amount_cents, payment_id,
               status, created_at, updated_at, cancelled_at
        FROM bookings
        WHERE user_id = $1
        ORDER BY created_at DESC`)

	expectedErr := errors.New("query failed")

	mock.ExpectQuery(query).
		WithArgs(int64(42)).
		WillReturnError(expectedErr)

	bookings, err := repo.GetByUserID(42)
	if bookings != nil {
		t.Fatalf("expected nil bookings, got %#v", bookings)
	}
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresBookingRepository_UpdateStatus_Success(t *testing.T) {
	db, mock, repo := newMockRepo(t)
	defer db.Close()

	query := regexp.QuoteMeta(`UPDATE bookings SET status = $1, updated_at = $2 WHERE id = $3`)

	mock.ExpectExec(query).
		WithArgs("confirmed", anyTime{}, int64(1)).
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := repo.UpdateStatus(1, "confirmed")
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresBookingRepository_UpdateStatus_NotFound(t *testing.T) {
	db, mock, repo := newMockRepo(t)
	defer db.Close()

	query := regexp.QuoteMeta(`UPDATE bookings SET status = $1, updated_at = $2 WHERE id = $3`)

	mock.ExpectExec(query).
		WithArgs("confirmed", anyTime{}, int64(1)).
		WillReturnResult(sqlmock.NewResult(0, 0))

	err := repo.UpdateStatus(1, "confirmed")
	if !errors.Is(err, ErrBookingNotFound) {
		t.Fatalf("expected ErrBookingNotFound, got %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresBookingRepository_UpdateStatus_ExecError(t *testing.T) {
	db, mock, repo := newMockRepo(t)
	defer db.Close()

	query := regexp.QuoteMeta(`UPDATE bookings SET status = $1, updated_at = $2 WHERE id = $3`)
	expectedErr := errors.New("update failed")

	mock.ExpectExec(query).
		WithArgs("confirmed", anyTime{}, int64(1)).
		WillReturnError(expectedErr)

	err := repo.UpdateStatus(1, "confirmed")
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresBookingRepository_Cancel_Success(t *testing.T) {
	db, mock, repo := newMockRepo(t)
	defer db.Close()

	query := regexp.QuoteMeta(`
        UPDATE bookings
        SET status = 'cancelled', cancelled_at = $1, updated_at = $2
        WHERE id = $3`)

	mock.ExpectExec(query).
		WithArgs(anyTime{}, anyTime{}, int64(1)).
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := repo.Cancel(1)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresBookingRepository_Cancel_NotFound(t *testing.T) {
	db, mock, repo := newMockRepo(t)
	defer db.Close()

	query := regexp.QuoteMeta(`
        UPDATE bookings
        SET status = 'cancelled', cancelled_at = $1, updated_at = $2
        WHERE id = $3`)

	mock.ExpectExec(query).
		WithArgs(anyTime{}, anyTime{}, int64(1)).
		WillReturnResult(sqlmock.NewResult(0, 0))

	err := repo.Cancel(1)
	if !errors.Is(err, ErrBookingNotFound) {
		t.Fatalf("expected ErrBookingNotFound, got %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostgresBookingRepository_Cancel_ExecError(t *testing.T) {
	db, mock, repo := newMockRepo(t)
	defer db.Close()

	query := regexp.QuoteMeta(`
        UPDATE bookings
        SET status = 'cancelled', cancelled_at = $1, updated_at = $2
        WHERE id = $3`)

	expectedErr := errors.New("cancel failed")

	mock.ExpectExec(query).
		WithArgs(anyTime{}, anyTime{}, int64(1)).
		WillReturnError(expectedErr)

	err := repo.Cancel(1)
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
