package service_test

import (
	"testing"

	"github.com/Seatify-org/seatify-common/model"
	"github.com/seatify/backend/booking-service/internal/mocks"
	"github.com/seatify/backend/booking-service/internal/repository"
	"github.com/seatify/backend/booking-service/internal/service"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

func TestBookingService_CreateBooking_Success(t *testing.T) {
	mockRepo := mocks.NewMockBookingRepository()
	mockRepo.CreateFunc = func(booking *model.Booking) error {
		booking.ID = 1
		return nil
	}

	logger := zap.NewNop()
	bookingService := service.NewBookingService(mockRepo, logger)

	booking, err := bookingService.CreateBooking(1, 100, 50000, "payment_123")

	assert.NoError(t, err)
	assert.NotNil(t, booking)
	assert.Equal(t, 1, booking.ID)
	assert.Equal(t, 1, booking.UserID)
	assert.Equal(t, 100, booking.SessionID)
	assert.Equal(t, 50000, booking.TotalAmountCents)
	assert.Equal(t, "pending", booking.Status)
	assert.Equal(t, "payment_123", booking.PaymentID)
}

func TestBookingService_CreateBooking_InvalidUserID(t *testing.T) {
	mockRepo := mocks.NewMockBookingRepository()
	logger := zap.NewNop()
	bookingService := service.NewBookingService(mockRepo, logger)

	booking, err := bookingService.CreateBooking(0, 100, 50000, "payment_123")

	assert.Nil(t, booking)
	assert.Error(t, err)
	assert.ErrorIs(t, err, service.ErrInvalidBookingData)
}

func TestBookingService_CreateBooking_InvalidSessionID(t *testing.T) {
	mockRepo := mocks.NewMockBookingRepository()
	logger := zap.NewNop()
	bookingService := service.NewBookingService(mockRepo, logger)

	booking, err := bookingService.CreateBooking(1, 0, 50000, "payment_123")

	assert.Nil(t, booking)
	assert.Error(t, err)
	assert.ErrorIs(t, err, service.ErrInvalidBookingData)
}

func TestBookingService_CreateBooking_InvalidAmount(t *testing.T) {
	mockRepo := mocks.NewMockBookingRepository()
	logger := zap.NewNop()
	bookingService := service.NewBookingService(mockRepo, logger)

	booking, err := bookingService.CreateBooking(1, 100, 0, "payment_123")

	assert.Nil(t, booking)
	assert.Error(t, err)
	assert.ErrorIs(t, err, service.ErrInvalidBookingData)
}

func TestBookingService_CreateBooking_RepositoryError(t *testing.T) {
	mockRepo := mocks.NewMockBookingRepository()
	mockRepo.CreateFunc = func(booking *model.Booking) error {
		return repository.ErrBookingNotFound
	}

	logger := zap.NewNop()
	bookingService := service.NewBookingService(mockRepo, logger)

	booking, err := bookingService.CreateBooking(1, 100, 50000, "payment_123")

	assert.Nil(t, booking)
	assert.Error(t, err)
	assert.ErrorIs(t, err, service.ErrBookingFailed)
}

func TestBookingService_GetBookingByID_Success(t *testing.T) {
	mockRepo := mocks.NewMockBookingRepository()
	expectedBooking := &model.Booking{
		ID:               1,
		UserID:           1,
		SessionID:        100,
		TotalAmountCents: 50000,
		Status:           "confirmed",
		PaymentID:        "payment_123",
	}

	mockRepo.GetByIDFunc = func(id int64) (*model.Booking, error) {
		if id == 1 {
			return expectedBooking, nil
		}
		return nil, repository.ErrBookingNotFound
	}

	logger := zap.NewNop()
	bookingService := service.NewBookingService(mockRepo, logger)

	booking, err := bookingService.GetBookingByID(1)

	assert.NoError(t, err)
	assert.NotNil(t, booking)
	assert.Equal(t, expectedBooking.ID, booking.ID)
	assert.Equal(t, expectedBooking.TotalAmountCents, booking.TotalAmountCents)
}

func TestBookingService_GetBookingByID_NotFound(t *testing.T) {
	mockRepo := mocks.NewMockBookingRepository()
	mockRepo.GetByIDFunc = func(id int64) (*model.Booking, error) {
		return nil, repository.ErrBookingNotFound
	}

	logger := zap.NewNop()
	bookingService := service.NewBookingService(mockRepo, logger)

	booking, err := bookingService.GetBookingByID(999)

	assert.Nil(t, booking)
	assert.Error(t, err)
	assert.ErrorIs(t, err, repository.ErrBookingNotFound)
}

func TestBookingService_GetUserBookings(t *testing.T) {
	mockRepo := mocks.NewMockBookingRepository()
	expectedBookings := []*model.Booking{
		{ID: 1, UserID: 1, SessionID: 100, TotalAmountCents: 50000, Status: "pending"},
		{ID: 2, UserID: 1, SessionID: 101, TotalAmountCents: 75000, Status: "confirmed"},
	}

	mockRepo.GetByUserIDFunc = func(userID int64) ([]*model.Booking, error) {
		if userID == 1 {
			return expectedBookings, nil
		}
		return []*model.Booking{}, nil
	}

	logger := zap.NewNop()
	bookingService := service.NewBookingService(mockRepo, logger)

	bookings, err := bookingService.GetUserBookings(1)

	assert.NoError(t, err)
	assert.Len(t, bookings, 2)
	assert.Equal(t, 1, bookings[0].ID)
	assert.Equal(t, 2, bookings[1].ID)
}

func TestBookingService_ConfirmBooking_Success(t *testing.T) {
	mockRepo := mocks.NewMockBookingRepository()
	mockRepo.UpdateStatusFunc = func(id int64, status string) error {
		if id == 1 && status == "confirmed" {
			return nil
		}
		return repository.ErrBookingNotFound
	}

	logger := zap.NewNop()
	bookingService := service.NewBookingService(mockRepo, logger)

	err := bookingService.ConfirmBooking(1)

	assert.NoError(t, err)
}

func TestBookingService_ConfirmBooking_NotFound(t *testing.T) {
	mockRepo := mocks.NewMockBookingRepository()
	mockRepo.UpdateStatusFunc = func(id int64, status string) error {
		return repository.ErrBookingNotFound
	}

	logger := zap.NewNop()
	bookingService := service.NewBookingService(mockRepo, logger)

	err := bookingService.ConfirmBooking(999)

	assert.Error(t, err)
	assert.ErrorIs(t, err, repository.ErrBookingNotFound)
}

func TestBookingService_CancelBooking_Success(t *testing.T) {
	mockRepo := mocks.NewMockBookingRepository()
	mockRepo.CancelFunc = func(id int64) error {
		if id == 1 {
			return nil
		}
		return repository.ErrBookingNotFound
	}

	logger := zap.NewNop()
	bookingService := service.NewBookingService(mockRepo, logger)

	err := bookingService.CancelBooking(1)

	assert.NoError(t, err)
}

func TestBookingService_CancelBooking_NotFound(t *testing.T) {
	mockRepo := mocks.NewMockBookingRepository()
	mockRepo.CancelFunc = func(id int64) error {
		return repository.ErrBookingNotFound
	}

	logger := zap.NewNop()
	bookingService := service.NewBookingService(mockRepo, logger)

	err := bookingService.CancelBooking(999)

	assert.Error(t, err)
	assert.ErrorIs(t, err, repository.ErrBookingNotFound)
}
