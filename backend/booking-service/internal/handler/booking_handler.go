package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/Seatify-org/seatify-common/model"
	"github.com/gorilla/mux"
	"github.com/seatify/backend/booking-service/internal/repository"
	"github.com/seatify/backend/booking-service/internal/service"
	"go.uber.org/zap"
)

type BookingServiceInterface interface {
	CreateBooking(userID, sessionID int64, totalAmountCents int, paymentID string) (*model.Booking, error)
	GetBookingByID(id int64) (*model.Booking, error)
	GetUserBookings(userID int64) ([]*model.Booking, error)
	ConfirmBooking(id int64) error
	CancelBooking(id int64) error
}

type BookingHandler struct {
	bookingService BookingServiceInterface
	logger         *zap.Logger
}

type createBookingRequest struct {
	SessionID        int64  `json:"session_id"`
	TotalAmountCents int    `json:"total_amount_cents"`
	PaymentID        string `json:"payment_id"`
}

func NewBookingHandler(bookingService BookingServiceInterface, logger *zap.Logger) *BookingHandler {
	if logger == nil {
		logger = zap.NewNop()
	}

	return &BookingHandler{
		bookingService: bookingService,
		logger:         logger,
	}
}

// CreateBooking godoc
// @Summary Create booking
// @Description Create a new booking for the authenticated user
// @Tags bookings
// @Accept json
// @Produce json
// @Param X-User-ID header int true "User ID"
// @Param request body createBookingRequest true "Booking request"
// @Success 201 {object} model.Booking
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /bookings [post]
func (h *BookingHandler) CreateBooking(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.Header.Get("X-User-ID")
	if userIDStr == "" {
		writeError(w, http.StatusUnauthorized, "missing user id")
		return
	}

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid user id")
		return
	}

	var req createBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	booking, err := h.bookingService.CreateBooking(
		userID,
		req.SessionID,
		req.TotalAmountCents,
		req.PaymentID,
	)
	if err != nil {
		if errors.Is(err, service.ErrInvalidBookingData) {
			writeError(w, http.StatusBadRequest, "invalid booking data")
			return
		}

		h.logger.Error("create booking failed",
			zap.Error(err),
			zap.Int64("user_id", userID),
			zap.Int64("session_id", req.SessionID),
		)
		writeError(w, http.StatusInternalServerError, "failed to create booking")
		return
	}

	writeJSON(w, http.StatusCreated, booking)
}

// GetBookingByID godoc
// @Summary Get booking by ID
// @Description Returns booking by booking ID
// @Tags bookings
// @Produce json
// @Param id path int true "Booking ID"
// @Success 200 {object} model.Booking
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /bookings/{id} [get]
func (h *BookingHandler) GetBookingByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(mux.Vars(r)["id"], 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid booking id")
		return
	}

	booking, err := h.bookingService.GetBookingByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrBookingNotFound) {
			writeError(w, http.StatusNotFound, "booking not found")
			return
		}

		h.logger.Error("get booking by id failed", zap.Error(err), zap.Int64("booking_id", id))
		writeError(w, http.StatusInternalServerError, "failed to fetch booking")
		return
	}

	writeJSON(w, http.StatusOK, booking)
}

// GetMyBookings godoc
// @Summary Get my bookings
// @Description Returns all bookings for authenticated user
// @Tags bookings
// @Produce json
// @Param X-User-ID header int true "User ID"
// @Success 200 {array} model.Booking
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /bookings/me [get]
func (h *BookingHandler) GetMyBookings(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.Header.Get("X-User-ID")
	if userIDStr == "" {
		writeError(w, http.StatusUnauthorized, "missing user id")
		return
	}

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid user id")
		return
	}

	bookings, err := h.bookingService.GetUserBookings(userID)
	if err != nil {
		h.logger.Error("get user bookings failed", zap.Error(err), zap.Int64("user_id", userID))
		writeError(w, http.StatusInternalServerError, "failed to fetch bookings")
		return
	}

	writeJSON(w, http.StatusOK, bookings)
}

// ConfirmBooking godoc
// @Summary Confirm booking
// @Description Confirms booking by ID
// @Tags bookings
// @Produce json
// @Param id path int true "Booking ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /bookings/{id}/confirm [patch]
func (h *BookingHandler) ConfirmBooking(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(mux.Vars(r)["id"], 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid booking id")
		return
	}

	if err := h.bookingService.ConfirmBooking(id); err != nil {
		if errors.Is(err, repository.ErrBookingNotFound) {
			writeError(w, http.StatusNotFound, "booking not found")
			return
		}

		h.logger.Error("confirm booking failed", zap.Error(err), zap.Int64("booking_id", id))
		writeError(w, http.StatusInternalServerError, "failed to confirm booking")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "booking confirmed"})
}

// CancelBooking godoc
// @Summary Cancel booking
// @Description Cancels booking by ID
// @Tags bookings
// @Produce json
// @Param id path int true "Booking ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /bookings/{id}/cancel [patch]
func (h *BookingHandler) CancelBooking(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(mux.Vars(r)["id"], 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid booking id")
		return
	}

	if err := h.bookingService.CancelBooking(id); err != nil {
		if errors.Is(err, repository.ErrBookingNotFound) {
			writeError(w, http.StatusNotFound, "booking not found")
			return
		}

		h.logger.Error("cancel booking failed", zap.Error(err), zap.Int64("booking_id", id))
		writeError(w, http.StatusInternalServerError, "failed to cancel booking")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "booking cancelled"})
}
