package config

import (
	"os"

	"github.com/seatify/backend/common/config"
)

type BookingConfig struct {
	*config.Config
	AuthSvcURL string
}

func LoadBookingConfig() *BookingConfig {
	baseConfig := config.Load()
	return &BookingConfig{
		Config:     baseConfig,
		AuthSvcURL: getEnv("AUTH_SERVICE_URL", "http://localhost:8081"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
