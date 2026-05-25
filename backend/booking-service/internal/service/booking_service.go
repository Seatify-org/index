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
	logger      *zap.Logger // Добавлено поле logger
}

func NewBookingService(bookingRepo repository.BookingRepository, logger *zap.Logger) *BookingService { // Добавлен параметр logger
	return &BookingService{
		bookingRepo: bookingRepo,
		logger:      logger,
	}
}

func (s *BookingService) CreateBooking(userID, sessionID int64, totalAmount float64, paymentID string) (*model.Booking, error) {
	// Логирование для отладки
	fmt.Printf("DEBUG: Received booking request - UserID: %d, SessionID: %d, Amount: %f, PaymentID: %s\n", userID, sessionID, totalAmount, paymentID)

	if userID <= 0 {
		return nil, fmt.Errorf("%w: invalid user_id (%d)", ErrInvalidBookingData, userID)
	}
	if sessionID <= 0 {
		return nil, fmt.Errorf("%w: invalid session_id (%d)", ErrInvalidBookingData, sessionID)
	}
	if totalAmount <= 0 {
		return nil, fmt.Errorf("%w: invalid total_amount (%f)", ErrInvalidBookingData, totalAmount)
	}

	// Проверка существования сессии в БД (опционально, если есть сессионный репозиторий)
	// Если проверки нет, убедитесь, что foreign key constraint не вызывает панику, а возвращает ошибку

	booking := &model.Booking{
		UserID:      int(userID),
		SessionID:   int(sessionID),
		TotalAmount: int(totalAmount),
		Status:      "pending",
		PaymentID:   paymentID,
	}

	if err := s.bookingRepo.Create(booking); err != nil {
		// Логируем ошибку БД
		fmt.Printf("DEBUG: Database error: %v\n", err)
		return nil, fmt.Errorf("%w: %v", ErrBookingFailed, err)
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
