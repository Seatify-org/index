package mocks

import (
	"errors"
	"testing"

	"github.com/Seatify-org/seatify-common/model"
)

func TestNewMockBookingRepository(t *testing.T) {
	repo := NewMockBookingRepository()

	if repo == nil {
		t.Fatal("expected mock repository, got nil")
	}
}

func TestMockBookingRepository_Create(t *testing.T) {
	repo := NewMockBookingRepository()
	expectedErr := errors.New("create error")

	called := false
	input := &model.Booking{ID: 1, UserID: 42}

	repo.CreateFunc = func(booking *model.Booking) error {
		called = true
		if booking != input {
			t.Fatalf("expected same booking pointer")
		}
		return expectedErr
	}

	err := repo.Create(input)

	if !called {
		t.Fatal("expected CreateFunc to be called")
	}
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}
}

func TestMockBookingRepository_Create_Default(t *testing.T) {
	repo := NewMockBookingRepository()

	err := repo.Create(&model.Booking{})

	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
}

func TestMockBookingRepository_GetByID(t *testing.T) {
	repo := NewMockBookingRepository()
	expected := &model.Booking{ID: 7}
	expectedErr := errors.New("get by id error")

	called := false
	repo.GetByIDFunc = func(id int64) (*model.Booking, error) {
		called = true
		if id != 7 {
			t.Fatalf("expected id 7, got %d", id)
		}
		return expected, expectedErr
	}

	got, err := repo.GetByID(7)

	if !called {
		t.Fatal("expected GetByIDFunc to be called")
	}
	if got != expected {
		t.Fatalf("expected booking %v, got %v", expected, got)
	}
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}
}

func TestMockBookingRepository_GetByID_Default(t *testing.T) {
	repo := NewMockBookingRepository()

	booking, err := repo.GetByID(1)

	if booking != nil {
		t.Fatalf("expected nil booking, got %#v", booking)
	}
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
}

func TestMockBookingRepository_GetByUserID(t *testing.T) {
	repo := NewMockBookingRepository()
	expected := []*model.Booking{
		{ID: 1, UserID: 42},
		{ID: 2, UserID: 42},
	}
	expectedErr := errors.New("get by user id error")

	called := false
	repo.GetByUserIDFunc = func(userID int64) ([]*model.Booking, error) {
		called = true
		if userID != 42 {
			t.Fatalf("expected userID 42, got %d", userID)
		}
		return expected, expectedErr
	}

	got, err := repo.GetByUserID(42)

	if !called {
		t.Fatal("expected GetByUserIDFunc to be called")
	}
	if len(got) != len(expected) {
		t.Fatalf("expected %d bookings, got %d", len(expected), len(got))
	}
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}
}

func TestMockBookingRepository_GetByUserID_Default(t *testing.T) {
	repo := NewMockBookingRepository()

	bookings, err := repo.GetByUserID(1)

	if bookings == nil {
		t.Fatal("expected empty slice, got nil")
	}
	if len(bookings) != 0 {
		t.Fatalf("expected empty bookings slice, got len=%d", len(bookings))
	}
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
}

func TestMockBookingRepository_UpdateStatus(t *testing.T) {
	repo := NewMockBookingRepository()
	expectedErr := errors.New("update status error")

	called := false
	repo.UpdateStatusFunc = func(id int64, status string) error {
		called = true
		if id != 5 {
			t.Fatalf("expected id 5, got %d", id)
		}
		if status != "confirmed" {
			t.Fatalf("expected status confirmed, got %s", status)
		}
		return expectedErr
	}

	err := repo.UpdateStatus(5, "confirmed")

	if !called {
		t.Fatal("expected UpdateStatusFunc to be called")
	}
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}
}

func TestMockBookingRepository_UpdateStatus_Default(t *testing.T) {
	repo := NewMockBookingRepository()

	err := repo.UpdateStatus(1, "confirmed")

	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
}

func TestMockBookingRepository_Cancel(t *testing.T) {
	repo := NewMockBookingRepository()
	expectedErr := errors.New("cancel error")

	called := false
	repo.CancelFunc = func(id int64) error {
		called = true
		if id != 9 {
			t.Fatalf("expected id 9, got %d", id)
		}
		return expectedErr
	}

	err := repo.Cancel(9)

	if !called {
		t.Fatal("expected CancelFunc to be called")
	}
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}
}

func TestMockBookingRepository_Cancel_Default(t *testing.T) {
	repo := NewMockBookingRepository()

	err := repo.Cancel(1)

	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
}
