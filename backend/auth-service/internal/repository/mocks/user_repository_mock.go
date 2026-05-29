package mocks

import "github.com/Seatify-org/seatify-common/model"

type MockUserRepository struct {
	CreateUserFunc         func(user *model.User) error
	GetByEmailFunc         func(email string) (*model.User, error)
	GetByIDFunc            func(id int) (*model.User, error)
	SaveRefreshTokenFunc   func(token *model.RefreshToken) error
	GetRefreshTokenFunc    func(token string) (*model.RefreshToken, error)
	DeleteRefreshTokenFunc func(token string) error
	CreateAuditLogFunc     func(log *model.AuditLog) error
}

func NewMockUserRepository() *MockUserRepository {
	return &MockUserRepository{}
}

func (m *MockUserRepository) CreateUser(user *model.User) error {
	if m.CreateUserFunc != nil {
		return m.CreateUserFunc(user)
	}
	return nil
}

func (m *MockUserRepository) GetByEmail(email string) (*model.User, error) {
	if m.GetByEmailFunc != nil {
		return m.GetByEmailFunc(email)
	}
	return nil, nil
}

func (m *MockUserRepository) GetByID(id int) (*model.User, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(id)
	}
	return nil, nil
}

func (m *MockUserRepository) SaveRefreshToken(token *model.RefreshToken) error {
	if m.SaveRefreshTokenFunc != nil {
		return m.SaveRefreshTokenFunc(token)
	}
	return nil
}

func (m *MockUserRepository) GetRefreshToken(token string) (*model.RefreshToken, error) {
	if m.GetRefreshTokenFunc != nil {
		return m.GetRefreshTokenFunc(token)
	}
	return nil, nil
}

func (m *MockUserRepository) DeleteRefreshToken(token string) error {
	if m.DeleteRefreshTokenFunc != nil {
		return m.DeleteRefreshTokenFunc(token)
	}
	return nil
}

func (m *MockUserRepository) CreateAuditLog(log *model.AuditLog) error {
	if m.CreateAuditLogFunc != nil {
		return m.CreateAuditLogFunc(log)
	}
	return nil
}
