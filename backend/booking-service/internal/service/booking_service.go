package service

import (
	"errors"
	"fmt"

	"github.com/Seatify-org/seatify-common/model"
	"github.com/seatify/backend/booking-service/internal/repository"
	"go.uber.org/zap"
)

var (
	ErrInvalidBookingData = errors.New("invalid booking data")
	ErrBookingFailed      = errors.New("failed to create booking")
)

type BookingService struct {
	bookingRepo repository.BookingRepository
	logger      *zap.Logger
}

func NewBookingService(bookingRepo repository.BookingRepository, logger *zap.Logger) *BookingService {
	if logger == nil {
		logger = zap.NewNop()
	}

	return &BookingService{
		bookingRepo: bookingRepo,
		logger:      logger,
	}
}

func (s *BookingService) CreateBooking(userID, sessionID int64, totalAmountCents int, paymentID string) (*model.Booking, error) {
	s.logger.Info("creating booking",
		zap.Int64("user_id", userID),
		zap.Int64("session_id", sessionID),
		zap.Int("total_amount_cents", totalAmountCents),
		zap.String("payment_id", paymentID),
	)

	if userID <= 0 {
		return nil, fmt.Errorf("%w: invalid user_id (%d)", ErrInvalidBookingData, userID)
	}
	if sessionID <= 0 {
		return nil, fmt.Errorf("%w: invalid session_id (%d)", ErrInvalidBookingData, sessionID)
	}
	if totalAmountCents <= 0 {
		return nil, fmt.Errorf("%w: invalid total_amount_cents (%d)", ErrInvalidBookingData, totalAmountCents)
	}

	booking := &model.Booking{
		UserID:           int(userID),
		SessionID:        int(sessionID),
		TotalAmountCents: totalAmountCents,
		Status:           "pending",
		PaymentID:        paymentID,
	}

	if err := s.bookingRepo.Create(booking); err != nil {
		s.logger.Error("failed to create booking",
			zap.Error(err),
			zap.Int64("user_id", userID),
			zap.Int64("session_id", sessionID),
		)
		return nil, fmt.Errorf("%w: %v", ErrBookingFailed, err)
	}

	s.logger.Info("booking created",
		zap.Int("booking_id", booking.ID),
		zap.Int("user_id", booking.UserID),
		zap.Int("session_id", booking.SessionID),
	)

	return booking, nil
}

func (s *BookingService) GetBookingByID(id int64) (*model.Booking, error) {
	return s.bookingRepo.GetByID(id)
}

func (s *BookingService) GetUserBookings(userID int64) ([]*model.Booking, error) {
	return s.bookingRepo.GetByUserID(userID)
}

func (s *BookingService) ConfirmBooking(id int64) error {
	return s.bookingRepo.UpdateStatus(id, "confirmed")
}

func (s *BookingService) CancelBooking(id int64) error {
	return s.bookingRepo.Cancel(id)
}
