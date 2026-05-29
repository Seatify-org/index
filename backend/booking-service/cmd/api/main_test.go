package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"go.uber.org/zap"
)

func TestHealthHandler(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rr := httptest.NewRecorder()

	healthHandler(rr, req)

	res := rr.Result()
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, res.StatusCode)
	}

	contentType := res.Header.Get("Content-Type")
	if contentType != "application/json" {
		t.Fatalf("expected content type %q, got %q", "application/json", contentType)
	}

	body := rr.Body.String()
	if body != `{"status":"ok"}` {
		t.Fatalf("expected body %q, got %q", `{"status":"ok"}`, body)
	}
}

func TestLoggingMiddleware_CallsNextHandler(t *testing.T) {
	logger := zap.NewNop()

	called := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusNoContent)
	})

	middleware := loggingMiddleware(logger)
	handler := middleware(next)

	req := httptest.NewRequest(http.MethodGet, "/movies", nil)
	req.RemoteAddr = "127.0.0.1:12345"
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if !called {
		t.Fatal("expected next handler to be called")
	}

	if rr.Result().StatusCode != http.StatusNoContent {
		t.Fatalf("expected status %d, got %d", http.StatusNoContent, rr.Result().StatusCode)
	}
}

func TestLoggingMiddleware_PreservesRequestData(t *testing.T) {
	logger := zap.NewNop()

	var gotMethod string
	var gotPath string
	var gotRemoteAddr string

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotMethod = r.Method
		gotPath = r.URL.Path
		gotRemoteAddr = r.RemoteAddr
		w.WriteHeader(http.StatusOK)
	})

	handler := loggingMiddleware(logger)(next)

	req := httptest.NewRequest(http.MethodPost, "/bookings", nil)
	req.RemoteAddr = "10.0.0.5:4567"
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if gotMethod != http.MethodPost {
		t.Fatalf("expected method %q, got %q", http.MethodPost, gotMethod)
	}

	if gotPath != "/bookings" {
		t.Fatalf("expected path %q, got %q", "/bookings", gotPath)
	}

	if gotRemoteAddr != "10.0.0.5:4567" {
		t.Fatalf("expected remote addr %q, got %q", "10.0.0.5:4567", gotRemoteAddr)
	}
}

func TestGetEnv_ReturnsEnvValue(t *testing.T) {
	t.Setenv("TEST_MAIN_ENV", "custom-main-value")

	got := getEnv("TEST_MAIN_ENV", "fallback-main-value")

	if got != "custom-main-value" {
		t.Fatalf("expected %q, got %q", "custom-main-value", got)
	}
}

func TestGetEnv_ReturnsFallbackWhenEnvMissing(t *testing.T) {
	t.Setenv("TEST_MAIN_ENV_EMPTY", "")

	got := getEnv("TEST_MAIN_ENV_EMPTY", "fallback-main-value")

	if got != "fallback-main-value" {
		t.Fatalf("expected %q, got %q", "fallback-main-value", got)
	}
}
