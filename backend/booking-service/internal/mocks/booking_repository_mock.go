package mocks

import (
	"github.com/Seatify-org/seatify-common/model"
	"github.com/seatify/backend/booking-service/internal/repository"
)

type MockBookingRepository struct {
	CreateFunc      func(booking *model.Booking) error
	GetByIDFunc     func(id int64) (*model.Booking, error)
	GetByUserIDFunc func(userID int64) ([]*model.Booking, error)
	UpdateStatusFunc func(id int64, status string) error
	CancelFunc      func(id int64) error
}

func NewMockBookingRepository() *MockBookingRepository {
	return &MockBookingRepository{
		CreateFunc:       func(booking *model.Booking) error { return nil },
		GetByIDFunc:      func(id int64) (*model.Booking, error) { return nil, nil },
		GetByUserIDFunc:  func(userID int64) ([]*model.Booking, error) { return nil, nil },
		UpdateStatusFunc: func(id int64, status string) error { return nil },
		CancelFunc:       func(id int64) error { return nil },
	}
}

func (m *MockBookingRepository) Create(booking *model.Booking) error {
	return m.CreateFunc(booking)
}

func (m *MockBookingRepository) GetByID(id int64) (*model.Booking, error) {
	return m.GetByIDFunc(id)
}

func (m *MockBookingRepository) GetByUserID(userID int64) ([]*model.Booking, error) {
	return m.GetByUserIDFunc(userID)
}

func (m *MockBookingRepository) UpdateStatus(id int64, status string) error {
	return m.UpdateStatusFunc(id, status)
}

func (m *MockBookingRepository) Cancel(id int64) error {
	return m.CancelFunc(id)
}

var _ repository.BookingRepository = (*MockBookingRepository)(nil)
