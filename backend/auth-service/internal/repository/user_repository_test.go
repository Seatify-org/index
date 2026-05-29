package repository

import (
	"database/sql"
	"errors"
	"regexp"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/Seatify-org/seatify-common/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newMockRepo(t *testing.T) (*postgresUserRepository, sqlmock.Sqlmock, *sql.DB) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)

	repo := &postgresUserRepository{db: db}
	return repo, mock, db
}

func TestNewPostgresUserRepository(t *testing.T) {
	db, _, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := NewPostgresUserRepository(db)
	assert.NotNil(t, repo)
}

func TestPostgresUserRepository_CreateUser_Success(t *testing.T) {
	repo, mock, db := newMockRepo(t)
	defer db.Close()

	now := time.Now()
	user := &model.User{
		Username:     "maksim",
		Email:        "maksim@example.com",
		PasswordHash: "hashed-password",
		Role:         "user",
	}

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`)).
		WithArgs(user.Email).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

	mock.ExpectQuery(regexp.QuoteMeta(`
        INSERT INTO users (username, email, password_hash, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, created_at, updated_at
    `)).
		WithArgs(user.Username, user.Email, user.PasswordHash, user.Role).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at", "updated_at"}).AddRow(1, now, now))

	err := repo.CreateUser(user)
	require.NoError(t, err)
	assert.Equal(t, 1, user.ID)
	assert.WithinDuration(t, now, user.CreatedAt, time.Second)
	assert.WithinDuration(t, now, user.UpdatedAt, time.Second)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestPostgresUserRepository_CreateUser_AlreadyExists(t *testing.T) {
	repo, mock, db := newMockRepo(t)
	defer db.Close()

	user := &model.User{
		Email: "maksim@example.com",
	}

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`)).
		WithArgs(user.Email).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	err := repo.CreateUser(user)
	require.Error(t, err)
	assert.ErrorIs(t, err, ErrUserAlreadyExists)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestPostgresUserRepository_CreateUser_CheckExistsQueryError(t *testing.T) {
	repo, mock, db := newMockRepo(t)
	defer db.Close()

	user := &model.User{
		Email: "maksim@example.com",
	}

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`)).
		WithArgs(user.Email).
		WillReturnError(errors.New("db error"))

	err := repo.CreateUser(user)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "db error")
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestPostgresUserRepository_GetByEmail_Success(t *testing.T) {
	repo, mock, db := newMockRepo(t)
	defer db.Close()

	now := time.Now()
	email := "maksim@example.com"

	mock.ExpectQuery(regexp.QuoteMeta(`
        SELECT id, username, email, password_hash, role, created_at, updated_at
        FROM users
        WHERE email = $1
    `)).
		WithArgs(email).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "username", "email", "password_hash", "role", "created_at", "updated_at",
		}).AddRow(1, "maksim", email, "hashed", "user", now, now))

	user, err := repo.GetByEmail(email)
	require.NoError(t, err)
	require.NotNil(t, user)
	assert.Equal(t, 1, user.ID)
	assert.Equal(t, email, user.Email)
	assert.Equal(t, "maksim", user.Username)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestPostgresUserRepository_GetByEmail_NotFound(t *testing.T) {
	repo, mock, db := newMockRepo(t)
	defer db.Close()

	email := "missing@example.com"

	mock.ExpectQuery(regexp.QuoteMeta(`
        SELECT id, username, email, password_hash, role, created_at, updated_at
        FROM users
        WHERE email = $1
    `)).
		WithArgs(email).
		WillReturnError(sql.ErrNoRows)

	user, err := repo.GetByEmail(email)
	require.Error(t, err)
	assert.Nil(t, user)
	assert.ErrorIs(t, err, ErrUserNotFound)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestPostgresUserRepository_GetByID_Success(t *testing.T) {
	repo, mock, db := newMockRepo(t)
	defer db.Close()

	now := time.Now()

	mock.ExpectQuery(regexp.QuoteMeta(`
        SELECT id, username, email, password_hash, role, created_at, updated_at
        FROM users
        WHERE id = $1
    `)).
		WithArgs(1).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "username", "email", "password_hash", "role", "created_at", "updated_at",
		}).AddRow(1, "maksim", "maksim@example.com", "hashed", "user", now, now))

	user, err := repo.GetByID(1)
	require.NoError(t, err)
	require.NotNil(t, user)
	assert.Equal(t, 1, user.ID)
	assert.Equal(t, "maksim", user.Username)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestPostgresUserRepository_GetByID_NotFound(t *testing.T) {
	repo, mock, db := newMockRepo(t)
	defer db.Close()

	mock.ExpectQuery(regexp.QuoteMeta(`
        SELECT id, username, email, password_hash, role, created_at, updated_at
        FROM users
        WHERE id = $1
    `)).
		WithArgs(404).
		WillReturnError(sql.ErrNoRows)

	user, err := repo.GetByID(404)
	require.Error(t, err)
	assert.Nil(t, user)
	assert.ErrorIs(t, err, ErrUserNotFound)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestPostgresUserRepository_SaveRefreshToken_Success(t *testing.T) {
	repo, mock, db := newMockRepo(t)
	defer db.Close()

	now := time.Now()
	token := &model.RefreshToken{
		UserID:    1,
		Token:     "refresh-token",
		ExpiresAt: now.Add(24 * time.Hour),
	}

	mock.ExpectQuery(regexp.QuoteMeta(`
        INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, created_at
    `)).
		WithArgs(token.UserID, token.Token, token.ExpiresAt).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at"}).AddRow(10, now))

	err := repo.SaveRefreshToken(token)
	require.NoError(t, err)
	assert.Equal(t, 10, token.ID)
	assert.WithinDuration(t, now, token.CreatedAt, time.Second)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestPostgresUserRepository_GetRefreshToken_Success(t *testing.T) {
	repo, mock, db := newMockRepo(t)
	defer db.Close()

	now := time.Now()
	token := "refresh-token"

	mock.ExpectQuery(regexp.QuoteMeta(`
        SELECT id, user_id, token, expires_at, created_at
        FROM refresh_tokens
        WHERE token = $1
    `)).
		WithArgs(token).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "user_id", "token", "expires_at", "created_at",
		}).AddRow(1, 7, token, now.Add(time.Hour), now))

	rt, err := repo.GetRefreshToken(token)
	require.NoError(t, err)
	require.NotNil(t, rt)
	assert.Equal(t, 1, rt.ID)
	assert.Equal(t, 7, rt.UserID)
	assert.Equal(t, token, rt.Token)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestPostgresUserRepository_GetRefreshToken_NotFound(t *testing.T) {
	repo, mock, db := newMockRepo(t)
	defer db.Close()

	token := "missing-token"

	mock.ExpectQuery(regexp.QuoteMeta(`
        SELECT id, user_id, token, expires_at, created_at
        FROM refresh_tokens
        WHERE token = $1
    `)).
		WithArgs(token).
		WillReturnError(sql.ErrNoRows)

	rt, err := repo.GetRefreshToken(token)
	require.Error(t, err)
	assert.Nil(t, rt)
	assert.ErrorIs(t, err, ErrUserNotFound)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestPostgresUserRepository_DeleteRefreshToken_Success(t *testing.T) {
	repo, mock, db := newMockRepo(t)
	defer db.Close()

	mock.ExpectExec(regexp.QuoteMeta(`DELETE FROM refresh_tokens WHERE token = $1`)).
		WithArgs("refresh-token").
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := repo.DeleteRefreshToken("refresh-token")
	require.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestPostgresUserRepository_CreateAuditLog_Success(t *testing.T) {
	repo, mock, db := newMockRepo(t)
	defer db.Close()

	now := time.Now()
	log := &model.AuditLog{
		UserID:    1,
		Action:    "login",
		IP:        "127.0.0.1",
		UserAgent: "test-agent",
	}

	mock.ExpectQuery(regexp.QuoteMeta(`
        INSERT INTO audit_logs (user_id, action, ip, user_agent, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, created_at
    `)).
		WithArgs(log.UserID, log.Action, log.IP, log.UserAgent).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at"}).AddRow(99, now))

	err := repo.CreateAuditLog(log)
	require.NoError(t, err)
	assert.Equal(t, 99, log.ID)
	assert.WithinDuration(t, now, log.CreatedAt, time.Second)
	assert.NoError(t, mock.ExpectationsWereMet())
}
