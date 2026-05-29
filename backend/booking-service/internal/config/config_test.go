package config

import "testing"

func TestGetEnv_ReturnsEnvValue(t *testing.T) {
	t.Setenv("TEST_ENV_KEY", "custom-value")

	got := getEnv("TEST_ENV_KEY", "default-value")

	if got != "custom-value" {
		t.Fatalf("expected env value %q, got %q", "custom-value", got)
	}
}

func TestGetEnv_ReturnsDefaultWhenEnvMissing(t *testing.T) {
	t.Setenv("TEST_ENV_KEY_MISSING", "")

	got := getEnv("TEST_ENV_KEY_MISSING", "default-value")

	if got != "default-value" {
		t.Fatalf("expected default value %q, got %q", "default-value", got)
	}
}

func TestLoadBookingConfig_UsesAuthServiceURLFromEnv(t *testing.T) {
	t.Setenv("AUTH_SERVICE_URL", "http://auth-service:9999")

	cfg := LoadBookingConfig()

	if cfg == nil {
		t.Fatal("expected config, got nil")
	}

	if cfg.Config == nil {
		t.Fatal("expected embedded base config, got nil")
	}

	if cfg.AuthSvcURL != "http://auth-service:9999" {
		t.Fatalf("expected AuthSvcURL %q, got %q", "http://auth-service:9999", cfg.AuthSvcURL)
	}
}

func TestLoadBookingConfig_UsesDefaultAuthServiceURL(t *testing.T) {
	t.Setenv("AUTH_SERVICE_URL", "")

	cfg := LoadBookingConfig()

	if cfg == nil {
		t.Fatal("expected config, got nil")
	}

	if cfg.Config == nil {
		t.Fatal("expected embedded base config, got nil")
	}

	if cfg.AuthSvcURL != "http://localhost:8083" {
		t.Fatalf("expected default AuthSvcURL %q, got %q", "http://localhost:8083", cfg.AuthSvcURL)
	}
}
