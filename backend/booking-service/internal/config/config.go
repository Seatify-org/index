package config

import (
	"os"

	"github.com/Seatify-org/seatify-common/config"
)

type BookingConfig struct {
	*config.Config
	AuthSvcURL string
}

func LoadBookingConfig() *BookingConfig {
	baseConfig := config.Load()
	return &BookingConfig{
		Config:     baseConfig,
		AuthSvcURL: getEnv("AUTH_SERVICE_URL", "http://localhost:8083"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
