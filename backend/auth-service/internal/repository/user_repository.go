package repository

import (
	"database/sql"
	"errors"

	"github.com/Seatify-org/seatify-common/model"
)

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrUserAlreadyExists = errors.New("user already exists")
)

type UserRepository interface {
	CreateUser(user *model.User) error
	GetByEmail(email string) (*model.User, error)
	GetByID(id int) (*model.User, error)
	SaveRefreshToken(token *model.RefreshToken) error
	GetRefreshToken(token string) (*model.RefreshToken, error)
	DeleteRefreshToken(token string) error
	CreateAuditLog(log *model.AuditLog) error
}

type postgresUserRepository struct {
	db *sql.DB
}

func NewPostgresUserRepository(db *sql.DB) UserRepository {
	return &postgresUserRepository{db: db}
}

func (r *postgresUserRepository) CreateUser(user *model.User) error {
	var exists bool
	err := r.db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`, user.Email).Scan(&exists)
	if err != nil {
		return err
	}
	if exists {
		return ErrUserAlreadyExists
	}

	query := `
		INSERT INTO users (username, email, password_hash, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`

	return r.db.QueryRow(query,
		user.Username,
		user.Email,
		user.PasswordHash,
		user.Role,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
}

func (r *postgresUserRepository) GetByEmail(email string) (*model.User, error) {
	query := `
		SELECT id, username, email, password_hash, role, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	user := &model.User{}
	err := r.db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (r *postgresUserRepository) GetByID(id int) (*model.User, error) {
	query := `
		SELECT id, username, email, password_hash, role, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	user := &model.User{}
	err := r.db.QueryRow(query, id).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (r *postgresUserRepository) SaveRefreshToken(token *model.RefreshToken) error {
	query := `
		INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
		VALUES ($1, $2, $3, NOW())
		RETURNING id, created_at
	`

	return r.db.QueryRow(query,
		token.UserID,
		token.Token,
		token.ExpiresAt,
	).Scan(&token.ID, &token.CreatedAt)
}

func (r *postgresUserRepository) GetRefreshToken(token string) (*model.RefreshToken, error) {
	query := `
		SELECT id, user_id, token, expires_at, created_at
		FROM refresh_tokens
		WHERE token = $1
	`

	rt := &model.RefreshToken{}
	err := r.db.QueryRow(query, token).Scan(
		&rt.ID,
		&rt.UserID,
		&rt.Token,
		&rt.ExpiresAt,
		&rt.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}

	return rt, nil
}

func (r *postgresUserRepository) DeleteRefreshToken(token string) error {
	_, err := r.db.Exec(`DELETE FROM refresh_tokens WHERE token = $1`, token)
	return err
}

func (r *postgresUserRepository) CreateAuditLog(log *model.AuditLog) error {
	query := `
		INSERT INTO audit_logs (user_id, action, ip, user_agent, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING id, created_at
	`

	return r.db.QueryRow(query,
		log.UserID,
		log.Action,
		log.IP,
		log.UserAgent,
	).Scan(&log.ID, &log.CreatedAt)
}
