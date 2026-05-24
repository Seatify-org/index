package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/seatify/backend/booking-service/internal/repository"
	"github.com/seatify/backend/booking-service/internal/service"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

type BookingHandler struct {
	bookingService *service.BookingService
	logger         *zap.Logger
}

func NewBookingHandler(bookingService *service.BookingService, logger *zap.Logger) *BookingHandler {
	return &BookingHandler{
		bookingService: bookingService,
		logger:         logger,
	}
}

type CreateBookingRequest struct {
	UserID      int64   `json:"user_id"`
	SessionID   int64   `json:"session_id"`
	TotalAmount float64 `json:"total_amount"`
	PaymentID   string  `json:"payment_id"`
}

// @Summary Create a new booking
// @Description Create a new cinema ticket booking
// @Tags bookings
// @Accept json
// @Produce json
// @Param request body CreateBookingRequest true "Booking request"
// @Success 201 {object} model.Booking
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/bookings [post]
func (h *BookingHandler) CreateBooking(w http.ResponseWriter, r *http.Request) {
	var req CreateBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Error("failed to decode booking request", zap.Error(err))
		http.Error(w, `{"error": "invalid request body"}`, http.StatusBadRequest)
		return
	}

	booking, err := h.bookingService.CreateBooking(req.UserID, req.SessionID, req.TotalAmount, req.PaymentID)
	if err != nil {
		if err == service.ErrInvalidBookingData {
			h.logger.Warn("invalid booking data", zap.Error(err))
			http.Error(w, `{"error": "invalid booking data"}`, http.StatusBadRequest)
			return
		}
		h.logger.Error("failed to create booking", zap.Error(err))
		http.Error(w, `{"error": "internal server error"}`, http.StatusInternalServerError)
		return
	}

	h.logger.Info("booking created successfully", zap.Int64("booking_id", booking.ID))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(booking)
}

// @Summary Get booking by ID
// @Description Get a specific booking by its ID
// @Tags bookings
// @Produce json
// @Param id path int true "Booking ID"
// @Success 200 {object} model.Booking
// @Failure 404 {object} map[string]string
// @Router /api/v1/bookings/{id} [get]
func (h *BookingHandler) GetBooking(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		h.logger.Error("invalid booking id", zap.Error(err))
		http.Error(w, `{"error": "invalid booking id"}`, http.StatusBadRequest)
		return
	}

	booking, err := h.bookingService.GetBookingByID(id)
	if err != nil {
		if err == repository.ErrBookingNotFound {
			h.logger.Warn("booking not found", zap.Int64("id", id))
			http.Error(w, `{"error": "booking not found"}`, http.StatusNotFound)
			return
		}
		h.logger.Error("failed to get booking", zap.Error(err))
		http.Error(w, `{"error": "internal server error"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(booking)
}

// @Summary Get user bookings
// @Description Get all bookings for a specific user
// @Tags bookings
// @Produce json
// @Param user_id query int true "User ID"
// @Success 200 {array} model.Booking
// @Failure 400 {object} map[string]string
// @Router /api/v1/bookings/user [get]
func (h *BookingHandler) GetUserBookings(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.URL.Query().Get("user_id")
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		h.logger.Error("invalid user id", zap.Error(err))
		http.Error(w, `{"error": "invalid user id"}`, http.StatusBadRequest)
		return
	}

	bookings, err := h.bookingService.GetUserBookings(userID)
	if err != nil {
		h.logger.Error("failed to get user bookings", zap.Error(err))
		http.Error(w, `{"error": "internal server error"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bookings)
}

// @Summary Cancel booking
// @Description Cancel an existing booking
// @Tags bookings
// @Produce json
// @Param id path int true "Booking ID"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/v1/bookings/{id}/cancel [post]
func (h *BookingHandler) CancelBooking(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		h.logger.Error("invalid booking id", zap.Error(err))
		http.Error(w, `{"error": "invalid booking id"}`, http.StatusBadRequest)
		return
	}

	if err := h.bookingService.CancelBooking(id); err != nil {
		if err == repository.ErrBookingNotFound {
			h.logger.Warn("booking not found", zap.Int64("id", id))
			http.Error(w, `{"error": "booking not found"}`, http.StatusNotFound)
			return
		}
		h.logger.Error("failed to cancel booking", zap.Error(err))
		http.Error(w, `{"error": "internal server error"}`, http.StatusInternalServerError)
		return
	}

	h.logger.Info("booking cancelled successfully", zap.Int64("booking_id", id))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "booking cancelled"})
}
