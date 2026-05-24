package repository

import (
	"database/sql"
	"errors"
	"time"

	"github.com/seatify/backend/common/model"
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
	query := `INSERT INTO users (email, password, name, created_at, updated_at) 
			  VALUES ($1, $2, $3, $4, $5) RETURNING id`
	now := time.Now().Format(time.RFC3339)
	return r.db.QueryRow(query, user.Email, user.Password, user.Name, now, now).Scan(&user.ID)
}

func (r *postgresUserRepository) GetByID(id int64) (*model.User, error) {
	query := `SELECT id, email, password, name, created_at, updated_at FROM users WHERE id = $1`
	user := &model.User{}
	err := r.db.QueryRow(query, id).Scan(&user.ID, &user.Email, &user.Password, &user.Name, &user.CreatedAt, &user.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	return user, err
}

func (r *postgresUserRepository) GetByEmail(email string) (*model.User, error) {
	query := `SELECT id, email, password, name, created_at, updated_at FROM users WHERE email = $1`
	user := &model.User{}
	err := r.db.QueryRow(query, email).Scan(&user.ID, &user.Email, &user.Password, &user.Name, &user.CreatedAt, &user.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	return user, err
}

func (r *postgresUserRepository) Update(user *model.User) error {
	query := `UPDATE users SET email = $1, name = $2, updated_at = $3 WHERE id = $4`
	now := time.Now().Format(time.RFC3339)
	result, err := r.db.Exec(query, user.Email, user.Name, now, user.ID)
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
