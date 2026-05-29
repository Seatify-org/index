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

	_ "github.com/seatify/backend/booking-service/docs"
	"github.com/seatify/backend/booking-service/internal/handler"
	"github.com/seatify/backend/booking-service/internal/repository"
	"github.com/seatify/backend/booking-service/internal/service"
	"go.uber.org/zap"
)

// @title Booking Service API
// @version 1.0
// @description API for movie sessions and bookings
// @BasePath /
func main() {
	logger, err := zap.NewProduction()
	if err != nil {
		panic(fmt.Sprintf("failed to initialize logger: %v", err))
	}
	defer logger.Sync()

	db, err := initDB()
	if err != nil {
		logger.Fatal("failed to initialize database", zap.Error(err))
	}
	defer db.Close()

	router := mux.NewRouter()
	router.Use(loggingMiddleware(logger))

	router.HandleFunc("/health", healthHandler).Methods(http.MethodGet)

	router.PathPrefix("/swagger/").Handler(httpSwagger.WrapHandler)

	adminRepo := repository.NewPostgresAdminRepository(db)
	movieRepo := repository.NewPostgresMovieRepository(db)
	bookingRepo := repository.NewPostgresBookingRepository(db)

	adminService := service.NewAdminService(adminRepo, logger)
	movieService := service.NewMovieService(movieRepo, logger)
	bookingService := service.NewBookingService(bookingRepo, logger)

	adminHandler := handler.NewAdminHandler(adminService, logger)
	movieHandler := handler.NewMovieHandler(movieService, logger)
	bookingHandler := handler.NewBookingHandler(bookingService, logger)

	router.HandleFunc("/movies", movieHandler.GetMovies).Methods(http.MethodGet)
	router.HandleFunc("/movies/{id:[0-9]+}", movieHandler.GetMovieByID).Methods(http.MethodGet)
	router.HandleFunc("/movies/{id:[0-9]+}/sessions", movieHandler.GetSessionsByMovieID).Methods(http.MethodGet)
	router.HandleFunc("/sessions/{id:[0-9]+}", movieHandler.GetSessionByID).Methods(http.MethodGet)

	router.HandleFunc("/bookings", bookingHandler.CreateBooking).Methods(http.MethodPost)
	router.HandleFunc("/bookings/{id:[0-9]+}", bookingHandler.GetBookingByID).Methods(http.MethodGet)
	router.HandleFunc("/bookings/me", bookingHandler.GetMyBookings).Methods(http.MethodGet)
	router.HandleFunc("/bookings/{id:[0-9]+}/confirm", bookingHandler.ConfirmBooking).Methods(http.MethodPatch)
	router.HandleFunc("/bookings/{id:[0-9]+}/cancel", bookingHandler.CancelBooking).Methods(http.MethodPatch)

	admin := router.PathPrefix("/admin").Subrouter()

	admin.HandleFunc("/movies", adminHandler.GetMovies).Methods(http.MethodGet)
	admin.HandleFunc("/movies", adminHandler.CreateMovie).Methods(http.MethodPost)
	admin.HandleFunc("/movies/{id:[0-9]+}", adminHandler.UpdateMovie).Methods(http.MethodPut)
	admin.HandleFunc("/movies/{id:[0-9]+}", adminHandler.DeleteMovie).Methods(http.MethodDelete)

	admin.HandleFunc("/cinemas", adminHandler.GetCinemas).Methods(http.MethodGet)
	admin.HandleFunc("/cinemas", adminHandler.CreateCinema).Methods(http.MethodPost)
	admin.HandleFunc("/cinemas/{id:[0-9]+}", adminHandler.UpdateCinema).Methods(http.MethodPut)
	admin.HandleFunc("/cinemas/{id:[0-9]+}", adminHandler.DeleteCinema).Methods(http.MethodDelete)

	admin.HandleFunc("/cinemas/{cinemaId:[0-9]+}/halls", adminHandler.GetHallsByCinema).Methods(http.MethodGet)
	admin.HandleFunc("/halls", adminHandler.CreateHall).Methods(http.MethodPost)

	admin.HandleFunc("/sessions", adminHandler.GetSessions).Methods(http.MethodGet)
	admin.HandleFunc("/sessions", adminHandler.CreateSession).Methods(http.MethodPost)
	admin.HandleFunc("/sessions/{id:[0-9]+}", adminHandler.UpdateSession).Methods(http.MethodPut)
	admin.HandleFunc("/sessions/{id:[0-9]+}", adminHandler.DeleteSession).Methods(http.MethodDelete)

	port := getEnv("PORT", "8082")

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		logger.Info("booking-service started",
			zap.String("port", port),
			zap.String("swagger_url", fmt.Sprintf("http://localhost:%s/swagger/", port)),
		)

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("server failed", zap.Error(err))
		}
	}()

	waitForShutdown(logger, srv)
}

func initDB() (*sql.DB, error) {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "seatify")
	password := getEnv("DB_PASSWORD", "seatify_password")
	dbName := getEnv("DB_NAME", "seatify")
	sslMode := getEnv("DB_SSLMODE", "disable")

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbName, sslMode,
	)

	db, err := sql.Open("postgres", dsn)
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
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	sig := <-quit
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

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
