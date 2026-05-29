package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetEnv_ReturnsValueFromEnvironment(t *testing.T) {
	t.Setenv("TEST_ENV_KEY", "custom-value")
	assert.Equal(t, "custom-value", getEnv("TEST_ENV_KEY", "fallback"))
}

func TestGetEnv_ReturnsFallbackWhenEmpty(t *testing.T) {
	_ = os.Unsetenv("TEST_ENV_EMPTY")
	assert.Equal(t, "fallback", getEnv("TEST_ENV_EMPTY", "fallback"))
}

func TestGetEnvAsInt_ReturnsParsedValue(t *testing.T) {
	t.Setenv("TEST_ENV_INT", "42")
	assert.Equal(t, 42, getEnvAsInt("TEST_ENV_INT", 7))
}

func TestGetEnvAsInt_ReturnsFallbackOnMissing(t *testing.T) {
	_ = os.Unsetenv("TEST_ENV_INT_MISSING")
	assert.Equal(t, 7, getEnvAsInt("TEST_ENV_INT_MISSING", 7))
}

func TestGetEnvAsInt_ReturnsFallbackOnInvalidValue(t *testing.T) {
	t.Setenv("TEST_ENV_INT_INVALID", "abc")
	assert.Equal(t, 7, getEnvAsInt("TEST_ENV_INT_INVALID", 7))
}

func TestLoad_ReturnsDefaults(t *testing.T) {
	_ = os.Unsetenv("APP_ENV")
	_ = os.Unsetenv("PORT")
	_ = os.Unsetenv("DB_HOST")
	_ = os.Unsetenv("DB_PORT")
	_ = os.Unsetenv("DB_USER")
	_ = os.Unsetenv("DB_PASSWORD")
	_ = os.Unsetenv("DB_NAME")
	_ = os.Unsetenv("DB_SSLMODE")
	_ = os.Unsetenv("JWT_SECRET")
	_ = os.Unsetenv("JWT_ACCESS_TOKEN_TTL_MIN")
	_ = os.Unsetenv("JWT_REFRESH_TOKEN_TTL_HR")

	cfg := Load()

	assert.Equal(t, "development", cfg.AppEnv)
	assert.Equal(t, "8081", cfg.Port)
	assert.Equal(t, "localhost", cfg.DBHost)
	assert.Equal(t, "5432", cfg.DBPort)
	assert.Equal(t, "seatify", cfg.DBUser)
	assert.Equal(t, "seatify_password", cfg.DBPassword)
	assert.Equal(t, "seatify", cfg.DBName)
	assert.Equal(t, "disable", cfg.DBSSLMode)
	assert.Equal(t, "super-secret-change-me", cfg.JWTSecret)
	assert.Equal(t, 15, cfg.JWTAccessTokenTTLMin)
	assert.Equal(t, 168, cfg.JWTRefreshTokenTTLHr)
}

func TestLoad_ReturnsValuesFromEnvironment(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("PORT", "9090")
	t.Setenv("DB_HOST", "postgres")
	t.Setenv("DB_PORT", "5433")
	t.Setenv("DB_USER", "appuser")
	t.Setenv("DB_PASSWORD", "strongpass")
	t.Setenv("DB_NAME", "authdb")
	t.Setenv("DB_SSLMODE", "require")
	t.Setenv("JWT_SECRET", "jwt-secret")
	t.Setenv("JWT_ACCESS_TOKEN_TTL_MIN", "30")
	t.Setenv("JWT_REFRESH_TOKEN_TTL_HR", "240")

	cfg := Load()

	assert.Equal(t, "production", cfg.AppEnv)
	assert.Equal(t, "9090", cfg.Port)
	assert.Equal(t, "postgres", cfg.DBHost)
	assert.Equal(t, "5433", cfg.DBPort)
	assert.Equal(t, "appuser", cfg.DBUser)
	assert.Equal(t, "strongpass", cfg.DBPassword)
	assert.Equal(t, "authdb", cfg.DBName)
	assert.Equal(t, "require", cfg.DBSSLMode)
	assert.Equal(t, "jwt-secret", cfg.JWTSecret)
	assert.Equal(t, 30, cfg.JWTAccessTokenTTLMin)
	assert.Equal(t, 240, cfg.JWTRefreshTokenTTLHr)
}

func TestConfig_PostgresDSN(t *testing.T) {
	cfg := &Config{
		DBHost:     "localhost",
		DBPort:     "5432",
		DBUser:     "seatify",
		DBPassword: "secret",
		DBName:     "auth_service",
		DBSSLMode:  "disable",
	}

	dsn := cfg.PostgresDSN()

	assert.Equal(t, "host=localhost port=5432 user=seatify password=secret dbname=auth_service sslmode=disable", dsn)
}
