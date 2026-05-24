package mocks

import (
	"github.com/Seatify-org/seatify-common/model"
	"github.com/seatify/backend/auth-service/internal/repository"
)

type MockUserRepository struct {
	CreateFunc   func(user *model.User) error
	GetByIDFunc  func(id int64) (*model.User, error)
	GetByEmailFunc func(email string) (*model.User, error)
	UpdateFunc   func(user *model.User) error
	DeleteFunc   func(id int64) error
}

func NewMockUserRepository() *MockUserRepository {
	return &MockUserRepository{
		CreateFunc:   func(user *model.User) error { return nil },
		GetByIDFunc:  func(id int64) (*model.User, error) { return nil, nil },
		GetByEmailFunc: func(email string) (*model.User, error) { return nil, nil },
		UpdateFunc:   func(user *model.User) error { return nil },
		DeleteFunc:   func(id int64) error { return nil },
	}
}

func (m *MockUserRepository) Create(user *model.User) error {
	return m.CreateFunc(user)
}

func (m *MockUserRepository) GetByID(id int64) (*model.User, error) {
	return m.GetByIDFunc(id)
}

func (m *MockUserRepository) GetByEmail(email string) (*model.User, error) {
	return m.GetByEmailFunc(email)
}

func (m *MockUserRepository) Update(user *model.User) error {
	return m.UpdateFunc(user)
}

func (m *MockUserRepository) Delete(id int64) error {
	return m.DeleteFunc(id)
}

var _ repository.UserRepository = (*MockUserRepository)(nil)
