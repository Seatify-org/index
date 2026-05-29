package mocks

import (
	"github.com/Seatify-org/seatify-common/model"
)

type MockBookingRepository struct {
	CreateFunc       func(booking *model.Booking) error
	GetByIDFunc      func(id int64) (*model.Booking, error)
	GetByUserIDFunc  func(userID int64) ([]*model.Booking, error)
	UpdateStatusFunc func(id int64, status string) error
	CancelFunc       func(id int64) error
}

func NewMockBookingRepository() *MockBookingRepository {
	return &MockBookingRepository{}
}

func (m *MockBookingRepository) Create(booking *model.Booking) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(booking)
	}
	return nil
}

func (m *MockBookingRepository) GetByID(id int64) (*model.Booking, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(id)
	}
	return nil, nil
}

func (m *MockBookingRepository) GetByUserID(userID int64) ([]*model.Booking, error) {
	if m.GetByUserIDFunc != nil {
		return m.GetByUserIDFunc(userID)
	}
	return []*model.Booking{}, nil
}

func (m *MockBookingRepository) UpdateStatus(id int64, status string) error {
	if m.UpdateStatusFunc != nil {
		return m.UpdateStatusFunc(id, status)
	}
	return nil
}

func (m *MockBookingRepository) Cancel(id int64) error {
	if m.CancelFunc != nil {
		return m.CancelFunc(id)
	}
	return nil
}
