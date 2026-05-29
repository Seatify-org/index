package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Seatify-org/seatify-common/model"
	"github.com/gorilla/mux"
	"github.com/seatify/backend/booking-service/internal/repository"
	"github.com/seatify/backend/booking-service/internal/service"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

type mockBookingService struct {
	CreateBookingFunc   func(userID, sessionID int64, totalAmountCents int, paymentID string) (*model.Booking, error)
	GetBookingByIDFunc  func(id int64) (*model.Booking, error)
	GetUserBookingsFunc func(userID int64) ([]*model.Booking, error)
	ConfirmBookingFunc  func(id int64) error
	CancelBookingFunc   func(id int64) error
}

func (m *mockBookingService) CreateBooking(userID, sessionID int64, totalAmountCents int, paymentID string) (*model.Booking, error) {
	if m.CreateBookingFunc != nil {
		return m.CreateBookingFunc(userID, sessionID, totalAmountCents, paymentID)
	}
	return nil, nil
}

func (m *mockBookingService) GetBookingByID(id int64) (*model.Booking, error) {
	if m.GetBookingByIDFunc != nil {
		return m.GetBookingByIDFunc(id)
	}
	return nil, repository.ErrBookingNotFound
}

func (m *mockBookingService) GetUserBookings(userID int64) ([]*model.Booking, error) {
	if m.GetUserBookingsFunc != nil {
		return m.GetUserBookingsFunc(userID)
	}
	return []*model.Booking{}, nil
}

func (m *mockBookingService) ConfirmBooking(id int64) error {
	if m.ConfirmBookingFunc != nil {
		return m.ConfirmBookingFunc(id)
	}
	return nil
}

func (m *mockBookingService) CancelBooking(id int64) error {
	if m.CancelBookingFunc != nil {
		return m.CancelBookingFunc(id)
	}
	return nil
}

func TestBookingHandler_CreateBooking_Success(t *testing.T) {
	svc := &mockBookingService{
		CreateBookingFunc: func(userID, sessionID int64, totalAmountCents int, paymentID string) (*model.Booking, error) {
			return &model.Booking{
				ID:               1,
				UserID:           int(userID),
				SessionID:        int(sessionID),
				TotalAmountCents: totalAmountCents,
				PaymentID:        paymentID,
				Status:           "pending",
			}, nil
		},
	}

	h := NewBookingHandler(svc, zap.NewNop())

	body := `{"session_id":10,"total_amount_cents":1500,"payment_id":"pay_123"}`
	req := httptest.NewRequest(http.MethodPost, "/bookings", bytes.NewBufferString(body))
	req.Header.Set("X-User-ID", "42")
	rr := httptest.NewRecorder()

	h.CreateBooking(rr, req)

	assert.Equal(t, http.StatusCreated, rr.Code)
	assert.Contains(t, rr.Body.String(), `"user_id":42`)
	assert.Contains(t, rr.Body.String(), `"session_id":10`)
}

func TestBookingHandler_CreateBooking_MissingUserID(t *testing.T) {
	h := NewBookingHandler(&mockBookingService{}, zap.NewNop())

	req := httptest.NewRequest(http.MethodPost, "/bookings", bytes.NewBufferString(`{}`))
	rr := httptest.NewRecorder()

	h.CreateBooking(rr, req)

	assert.Equal(t, http.StatusUnauthorized, rr.Code)
	assert.Contains(t, rr.Body.String(), "missing user id")
}

func TestBookingHandler_CreateBooking_InvalidUserID(t *testing.T) {
	h := NewBookingHandler(&mockBookingService{}, zap.NewNop())

	req := httptest.NewRequest(http.MethodPost, "/bookings", bytes.NewBufferString(`{}`))
	req.Header.Set("X-User-ID", "abc")
	rr := httptest.NewRecorder()

	h.CreateBooking(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid user id")
}

func TestBookingHandler_CreateBooking_InvalidBody(t *testing.T) {
	h := NewBookingHandler(&mockBookingService{}, zap.NewNop())

	req := httptest.NewRequest(http.MethodPost, "/bookings", bytes.NewBufferString(`{invalid json}`))
	req.Header.Set("X-User-ID", "42")
	rr := httptest.NewRecorder()

	h.CreateBooking(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid request body")
}

func TestBookingHandler_CreateBooking_InvalidBookingData(t *testing.T) {
	svc := &mockBookingService{
		CreateBookingFunc: func(userID, sessionID int64, totalAmountCents int, paymentID string) (*model.Booking, error) {
			return nil, service.ErrInvalidBookingData
		},
	}

	h := NewBookingHandler(svc, zap.NewNop())

	body := `{"session_id":10,"total_amount_cents":1500,"payment_id":"pay_123"}`
	req := httptest.NewRequest(http.MethodPost, "/bookings", bytes.NewBufferString(body))
	req.Header.Set("X-User-ID", "42")
	rr := httptest.NewRecorder()

	h.CreateBooking(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid booking data")
}

func TestBookingHandler_CreateBooking_InternalError(t *testing.T) {
	svc := &mockBookingService{
		CreateBookingFunc: func(userID, sessionID int64, totalAmountCents int, paymentID string) (*model.Booking, error) {
			return nil, errors.New("db error")
		},
	}

	h := NewBookingHandler(svc, zap.NewNop())

	body := `{"session_id":10,"total_amount_cents":1500,"payment_id":"pay_123"}`
	req := httptest.NewRequest(http.MethodPost, "/bookings", bytes.NewBufferString(body))
	req.Header.Set("X-User-ID", "42")
	rr := httptest.NewRecorder()

	h.CreateBooking(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to create booking")
}

func TestBookingHandler_GetBookingByID_Success(t *testing.T) {
	svc := &mockBookingService{
		GetBookingByIDFunc: func(id int64) (*model.Booking, error) {
			return &model.Booking{
				ID:        int(id),
				UserID:    42,
				SessionID: 10,
				Status:    "pending",
			}, nil
		},
	}

	h := NewBookingHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/bookings/1", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()

	h.GetBookingByID(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), `"id":1`)
}

func TestBookingHandler_GetBookingByID_InvalidID(t *testing.T) {
	h := NewBookingHandler(&mockBookingService{}, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/bookings/abc", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "abc"})
	rr := httptest.NewRecorder()

	h.GetBookingByID(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid booking id")
}

func TestBookingHandler_GetBookingByID_NotFound(t *testing.T) {
	svc := &mockBookingService{
		GetBookingByIDFunc: func(id int64) (*model.Booking, error) {
			return nil, repository.ErrBookingNotFound
		},
	}

	h := NewBookingHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/bookings/999", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "999"})
	rr := httptest.NewRecorder()

	h.GetBookingByID(rr, req)

	assert.Equal(t, http.StatusNotFound, rr.Code)
	assert.Contains(t, rr.Body.String(), "booking not found")
}

func TestBookingHandler_GetBookingByID_InternalError(t *testing.T) {
	svc := &mockBookingService{
		GetBookingByIDFunc: func(id int64) (*model.Booking, error) {
			return nil, errors.New("db exploded")
		},
	}

	h := NewBookingHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/bookings/1", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()

	h.GetBookingByID(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to fetch booking")
}

func TestBookingHandler_GetMyBookings_Success(t *testing.T) {
	svc := &mockBookingService{
		GetUserBookingsFunc: func(userID int64) ([]*model.Booking, error) {
			return []*model.Booking{
				{ID: 1, UserID: int(userID), SessionID: 10, Status: "pending"},
				{ID: 2, UserID: int(userID), SessionID: 11, Status: "confirmed"},
			}, nil
		},
	}

	h := NewBookingHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/my/bookings", nil)
	req.Header.Set("X-User-ID", "42")
	rr := httptest.NewRecorder()

	h.GetMyBookings(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)

	var bookings []*model.Booking
	err := json.Unmarshal(rr.Body.Bytes(), &bookings)
	assert.NoError(t, err)
	assert.Len(t, bookings, 2)
}

func TestBookingHandler_GetMyBookings_MissingUserID(t *testing.T) {
	h := NewBookingHandler(&mockBookingService{}, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/my/bookings", nil)
	rr := httptest.NewRecorder()

	h.GetMyBookings(rr, req)

	assert.Equal(t, http.StatusUnauthorized, rr.Code)
	assert.Contains(t, rr.Body.String(), "missing user id")
}

func TestBookingHandler_GetMyBookings_InvalidUserID(t *testing.T) {
	h := NewBookingHandler(&mockBookingService{}, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/my/bookings", nil)
	req.Header.Set("X-User-ID", "abc")
	rr := httptest.NewRecorder()

	h.GetMyBookings(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid user id")
}

func TestBookingHandler_GetMyBookings_InternalError(t *testing.T) {
	svc := &mockBookingService{
		GetUserBookingsFunc: func(userID int64) ([]*model.Booking, error) {
			return nil, errors.New("db error")
		},
	}

	h := NewBookingHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodGet, "/my/bookings", nil)
	req.Header.Set("X-User-ID", "42")
	rr := httptest.NewRecorder()

	h.GetMyBookings(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to fetch bookings")
}

func TestBookingHandler_ConfirmBooking_Success(t *testing.T) {
	svc := &mockBookingService{
		ConfirmBookingFunc: func(id int64) error {
			return nil
		},
	}

	h := NewBookingHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPatch, "/bookings/1/confirm", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()

	h.ConfirmBooking(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "booking confirmed")
}

func TestBookingHandler_ConfirmBooking_InvalidID(t *testing.T) {
	h := NewBookingHandler(&mockBookingService{}, zap.NewNop())

	req := httptest.NewRequest(http.MethodPatch, "/bookings/abc/confirm", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "abc"})
	rr := httptest.NewRecorder()

	h.ConfirmBooking(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid booking id")
}

func TestBookingHandler_ConfirmBooking_NotFound(t *testing.T) {
	svc := &mockBookingService{
		ConfirmBookingFunc: func(id int64) error {
			return repository.ErrBookingNotFound
		},
	}

	h := NewBookingHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPatch, "/bookings/999/confirm", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "999"})
	rr := httptest.NewRecorder()

	h.ConfirmBooking(rr, req)

	assert.Equal(t, http.StatusNotFound, rr.Code)
	assert.Contains(t, rr.Body.String(), "booking not found")
}

func TestBookingHandler_ConfirmBooking_InternalError(t *testing.T) {
	svc := &mockBookingService{
		ConfirmBookingFunc: func(id int64) error {
			return errors.New("unexpected error")
		},
	}

	h := NewBookingHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPatch, "/bookings/1/confirm", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()

	h.ConfirmBooking(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to confirm booking")
}

func TestBookingHandler_CancelBooking_Success(t *testing.T) {
	svc := &mockBookingService{
		CancelBookingFunc: func(id int64) error {
			return nil
		},
	}

	h := NewBookingHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPatch, "/bookings/1/cancel", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()

	h.CancelBooking(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "booking cancelled")
}

func TestBookingHandler_CancelBooking_InvalidID(t *testing.T) {
	h := NewBookingHandler(&mockBookingService{}, zap.NewNop())

	req := httptest.NewRequest(http.MethodPatch, "/bookings/abc/cancel", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "abc"})
	rr := httptest.NewRecorder()

	h.CancelBooking(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "invalid booking id")
}

func TestBookingHandler_CancelBooking_NotFound(t *testing.T) {
	svc := &mockBookingService{
		CancelBookingFunc: func(id int64) error {
			return repository.ErrBookingNotFound
		},
	}

	h := NewBookingHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPatch, "/bookings/999/cancel", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "999"})
	rr := httptest.NewRecorder()

	h.CancelBooking(rr, req)

	assert.Equal(t, http.StatusNotFound, rr.Code)
	assert.Contains(t, rr.Body.String(), "booking not found")
}

func TestBookingHandler_CancelBooking_InternalError(t *testing.T) {
	svc := &mockBookingService{
		CancelBookingFunc: func(id int64) error {
			return errors.New("unexpected error")
		},
	}

	h := NewBookingHandler(svc, zap.NewNop())

	req := httptest.NewRequest(http.MethodPatch, "/bookings/1/cancel", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()

	h.CancelBooking(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "failed to cancel booking")
}
