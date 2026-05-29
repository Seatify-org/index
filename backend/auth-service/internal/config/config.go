package config

import (
	"fmt"
	"os"
)

type Config struct {
	AppEnv               string
	Port                 string
	DBHost               string
	DBPort               string
	DBUser               string
	DBPassword           string
	DBName               string
	DBSSLMode            string
	JWTSecret            string
	JWTAccessTokenTTLMin int
	JWTRefreshTokenTTLHr int
}

func Load() *Config {
	return &Config{
		AppEnv:               getEnv("APP_ENV", "development"),
		Port:                 getEnv("PORT", "8081"),
		DBHost:               getEnv("DB_HOST", "localhost"),
		DBPort:               getEnv("DB_PORT", "5432"),
		DBUser:               getEnv("DB_USER", "seatify"),
		DBPassword:           getEnv("DB_PASSWORD", "seatify_password"),
		DBName:               getEnv("DB_NAME", "seatify"),
		DBSSLMode:            getEnv("DB_SSLMODE", "disable"),
		JWTSecret:            getEnv("JWT_SECRET", "super-secret-change-me"),
		JWTAccessTokenTTLMin: getEnvAsInt("JWT_ACCESS_TOKEN_TTL_MIN", 15),
		JWTRefreshTokenTTLHr: getEnvAsInt("JWT_REFRESH_TOKEN_TTL_HR", 168),
	}
}

func (c *Config) PostgresDSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost,
		c.DBPort,
		c.DBUser,
		c.DBPassword,
		c.DBName,
		c.DBSSLMode,
	)
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getEnvAsInt(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	var parsed int
	_, err := fmt.Sscanf(value, "%d", &parsed)
	if err != nil {
		return fallback
	}
	return parsed
}
