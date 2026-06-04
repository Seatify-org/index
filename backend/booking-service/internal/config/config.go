package config

import (
	"os"

	"github.com/Seatify-org/seatify-common/config"
)

type BookingConfig struct {
	*config.Config
	AuthSvcURL string
	JWTSecret  string
}

func LoadBookingConfig() *BookingConfig {
	baseConfig := config.Load()
	return &BookingConfig{
		Config:     baseConfig,
		AuthSvcURL: getEnv("AUTH_SERVICE_URL", "http://localhost:8081"),
		JWTSecret:  getEnv("JWT_SECRET", "super-secret-change-me"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
