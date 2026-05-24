package service

import (
	"errors"

	"github.com/seatify/backend/common/model"
	"github.com/seatify/backend/booking-service/internal/repository"
)

var (
	ErrInvalidBookingData = errors.New("invalid booking data")
	ErrBookingFailed      = errors.New("failed to create booking")
)

type BookingService struct {
	bookingRepo repository.BookingRepository
}

func NewBookingService(bookingRepo repository.BookingRepository) *BookingService {
	return &BookingService{
		bookingRepo: bookingRepo,
	}
}

func (s *BookingService) CreateBooking(userID, sessionID int64, totalAmount float64, paymentID string) (*model.Booking, error) {
	if userID <= 0 || sessionID <= 0 || totalAmount <= 0 {
		return nil, ErrInvalidBookingData
	}

	booking := &model.Booking{
		UserID:      userID,
		SessionID:   sessionID,
		TotalAmount: totalAmount,
		Status:      "pending",
		PaymentID:   paymentID,
	}

	if err := s.bookingRepo.Create(booking); err != nil {
		return nil, ErrBookingFailed
	}

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
