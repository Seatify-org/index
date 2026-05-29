package main

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/lib/pq"

	"github.com/gorilla/mux"
	httpSwagger "github.com/swaggo/http-swagger"

	_ "github.com/seatify/backend/auth-service/docs"
	"github.com/seatify/backend/auth-service/internal/config"
	"github.com/seatify/backend/auth-service/internal/handler"
	"github.com/seatify/backend/auth-service/internal/repository"
	"github.com/seatify/backend/auth-service/internal/service"
	"go.uber.org/zap"
)

// @title Auth Service API
// @version 1.0
// @description API for authentication, registration and token refresh
// @BasePath /
func main() {
	cfg := config.Load()

	logger, err := zap.NewProduction()
	if err != nil {
		panic(fmt.Sprintf("failed to initialize logger: %v", err))
	}
	defer logger.Sync()

	db, err := initDB(cfg)
	if err != nil {
		logger.Fatal("failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	userRepo := repository.NewPostgresUserRepository(db)
	authService := service.NewAuthService(userRepo, logger, cfg.JWTSecret, cfg.JWTAccessTokenTTLMin, cfg.JWTRefreshTokenTTLHr)
	authHandler := handler.NewAuthHandler(authService, logger)

	router := mux.NewRouter()
	router.Use(loggingMiddleware(logger))

	router.HandleFunc("/health", healthHandler).Methods(http.MethodGet)
	router.PathPrefix("/swagger/").Handler(httpSwagger.WrapHandler)

	api := router.PathPrefix("/auth").Subrouter()
	api.HandleFunc("/register", authHandler.Register).Methods(http.MethodPost)
	api.HandleFunc("/login", authHandler.Login).Methods(http.MethodPost)
	api.HandleFunc("/refresh", authHandler.Refresh).Methods(http.MethodPost)
	api.HandleFunc("/me", authHandler.Me).Methods(http.MethodGet)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		logger.Info("auth-service started",
			zap.String("port", cfg.Port),
			zap.String("env", cfg.AppEnv),
			zap.String("swagger_url", fmt.Sprintf("http://localhost:%s/swagger/", cfg.Port)),
		)

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("server failed", zap.Error(err))
		}
	}()

	waitForShutdown(logger, srv)
}

func initDB(cfg *config.Config) (*sql.DB, error) {
	db, err := sql.Open("postgres", cfg.PostgresDSN())
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		_ = db.Close()
		return nil, err
	}

	return db, nil
}

func waitForShutdown(logger *zap.Logger, srv *http.Server) {
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	sig := <-stop
	logger.Info("shutdown signal received", zap.String("signal", sig.String()))

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("graceful shutdown failed", zap.Error(err))
		return
	}

	logger.Info("server stopped gracefully")
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"status":"ok"}`))
}

func loggingMiddleware(logger *zap.Logger) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			next.ServeHTTP(w, r)

			logger.Info("http request",
				zap.String("method", r.Method),
				zap.String("path", r.URL.Path),
				zap.String("remote_addr", r.RemoteAddr),
				zap.Duration("duration", time.Since(start)),
			)
		})
	}
}
