package service_test

import (
	"testing"

	"github.com/seatify/backend/common/model"
	"github.com/seatify/backend/booking-service/internal/mocks"
	"github.com/seatify/backend/booking-service/internal/repository"
	"github.com/seatify/backend/booking-service/internal/service"
	"github.com/stretchr/testify/assert"
)

func TestBookingService_CreateBooking_Success(t *testing.T) {
	mockRepo := mocks.NewMockBookingRepository()
	mockRepo.CreateFunc = func(booking *model.Booking) error {
		booking.ID = 1
		return nil
	}

	bookingService := service.NewBookingService(mockRepo)

	booking, err := bookingService.CreateBooking(1, 100, 500.0)

	assert.NoError(t, err)
	assert.NotNil(t, booking)
	assert.Equal(t, int64(1), booking.ID)
	assert.Equal(t, int64(1), booking.UserID)
	assert.Equal(t, int64(100), booking.SessionID)
	assert.Equal(t, "pending", booking.Status)
}

func TestBookingService_CreateBooking_InvalidData(t *testing.T) {
	mockRepo := mocks.NewMockBookingRepository()
	bookingService := service.NewBookingService(mockRepo)

	_, err := bookingService.CreateBooking(0, 100, 500.0)
	assert.Error(t, err)
	assert.Equal(t, service.ErrInvalidBookingData, err)

	_, err = bookingService.CreateBooking(1, 0, 500.0)
	assert.Error(t, err)
	assert.Equal(t, service.ErrInvalidBookingData, err)

	_, err = bookingService.CreateBooking(1, 100, 0)
	assert.Error(t, err)
	assert.Equal(t, service.ErrInvalidBookingData, err)
}

func TestBookingService_GetBookingByID(t *testing.T) {
	mockRepo := mocks.NewMockBookingRepository()
	expectedBooking := &model.Booking{ID: 1, UserID: 1, SessionID: 100, TotalAmount: 500.0, Status: "confirmed"}
	mockRepo.GetByIDFunc = func(id int64) (*model.Booking, error) {
		if id == 1 {
			return expectedBooking, nil
		}
		return nil, repository.ErrBookingNotFound
	}

	bookingService := service.NewBookingService(mockRepo)

	booking, err := bookingService.GetBookingByID(1)

	assert.NoError(t, err)
	assert.NotNil(t, booking)
	assert.Equal(t, expectedBooking.ID, booking.ID)
}

func TestBookingService_GetUserBookings(t *testing.T) {
	mockRepo := mocks.NewMockBookingRepository()
	expectedBookings := []*model.Booking{
		{ID: 1, UserID: 1, SessionID: 100, TotalAmount: 500.0},
		{ID: 2, UserID: 1, SessionID: 101, TotalAmount: 750.0},
	}
	mockRepo.GetByUserIDFunc = func(userID int64) ([]*model.Booking, error) {
		if userID == 1 {
			return expectedBookings, nil
		}
		return nil, nil
	}

	bookingService := service.NewBookingService(mockRepo)

	bookings, err := bookingService.GetUserBookings(1)

	assert.NoError(t, err)
	assert.Len(t, bookings, 2)
	assert.Equal(t, int64(1), bookings[0].ID)
	assert.Equal(t, int64(2), bookings[1].ID)
}

func TestBookingService_ConfirmBooking(t *testing.T) {
	mockRepo := mocks.NewMockBookingRepository()
	mockRepo.UpdateStatusFunc = func(id int64, status string) error {
		if id == 1 && status == "confirmed" {
			return nil
		}
		return repository.ErrBookingNotFound
	}

	bookingService := service.NewBookingService(mockRepo)

	err := bookingService.ConfirmBooking(1)

	assert.NoError(t, err)
}

func TestBookingService_CancelBooking(t *testing.T) {
	mockRepo := mocks.NewMockBookingRepository()
	mockRepo.CancelFunc = func(id int64) error {
		if id == 1 {
			return nil
		}
		return repository.ErrBookingNotFound
	}

	bookingService := service.NewBookingService(mockRepo)

	err := bookingService.CancelBooking(1)

	assert.NoError(t, err)

	err = bookingService.CancelBooking(999)
	assert.Error(t, err)
}
