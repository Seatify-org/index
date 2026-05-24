package config

import (
	"os"

	"github.com/Seatify-org/seatify-common/config"
)

type AuthConfig struct {
	*config.Config
	JWTSecret     string
	TokenExpiry   int
	RefreshExpiry int
}

func LoadAuthConfig() *AuthConfig {
	baseConfig := config.Load()
	return &AuthConfig{
		Config:        baseConfig,
		JWTSecret:     getEnv("JWT_SECRET", "super-secret-key-change-in-production"),
		TokenExpiry:   3600,
		RefreshExpiry: 86400,
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
