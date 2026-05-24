package repository

import (
	"database/sql"
	"errors"
	"time"

	"github.com/Seatify-org/seatify-common/model"
)

var ErrUserNotFound = errors.New("user not found")

type UserRepository interface {
	Create(user *model.User) error
	GetByID(id int64) (*model.User, error)
	GetByEmail(email string) (*model.User, error)
	Update(user *model.User) error
	Delete(id int64) error
}

type postgresUserRepository struct {
	db *sql.DB
}

func NewPostgresUserRepository(db *sql.DB) UserRepository {
	return &postgresUserRepository{db: db}
}

func (r *postgresUserRepository) Create(user *model.User) error {
	// Исправлено: password_hash -> password, name -> first_name, last_name
	query := `INSERT INTO users (email, password_hash, first_name, last_name, phone, created_at, updated_at) 
			  VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`
	now := time.Now()
	return r.db.QueryRow(query, user.Email, user.Password, user.FirstName, user.LastName, user.Phone, now, now).Scan(&user.ID)
}

func (r *postgresUserRepository) GetByID(id int64) (*model.User, error) {
	// Исправлено: поля соответствуют БД
	query := `SELECT id, email, password_hash, first_name, last_name, phone, created_at, updated_at FROM users WHERE id = $1`
	user := &model.User{}
	err := r.db.QueryRow(query, id).Scan(&user.ID, &user.Email, &user.Password, &user.FirstName, &user.LastName, &user.Phone, &user.CreatedAt, &user.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	return user, err
}

func (r *postgresUserRepository) GetByEmail(email string) (*model.User, error) {
	// Исправлено: поля соответствуют БД
	query := `SELECT id, email, password_hash, first_name, last_name, phone, created_at, updated_at FROM users WHERE email = $1`
	user := &model.User{}
	err := r.db.QueryRow(query, email).Scan(&user.ID, &user.Email, &user.Password, &user.FirstName, &user.LastName, &user.Phone, &user.CreatedAt, &user.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	return user, err
}

func (r *postgresUserRepository) Update(user *model.User) error {
	query := `UPDATE users SET email = $1, first_name = $2, last_name = $3, phone = $4, updated_at = $5 WHERE id = $6`
	now := time.Now()
	result, err := r.db.Exec(query, user.Email, user.FirstName, user.LastName, user.Phone, now, user.ID)
	if err != nil {
		return err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return ErrUserNotFound
	}
	return nil
}

func (r *postgresUserRepository) Delete(id int64) error {
	query := `DELETE FROM users WHERE id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return ErrUserNotFound
	}
	return nil
}
