package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/seatify/backend/booking-service/internal/config"
	"github.com/seatify/backend/booking-service/internal/handler"
	"github.com/seatify/backend/booking-service/internal/repository"
	"github.com/seatify/backend/booking-service/internal/service"
	"github.com/seatify/backend/common/logger"
	_ "github.com/swaggo/swag"
	httpSwagger "github.com/swaggo/http-swagger"
	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
	"go.uber.org/zap"
)

// @title Seatify Booking Service API
// @version 1.0
// @description Booking and ticket management microservice for Seatify cinema booking platform
// @host localhost:8082
// @BasePath /
func main() {
	cfg := config.LoadBookingConfig()

	if err := logger.Init(cfg.LogLevel); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}

	psqlInfo := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName)

	db, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		logger.Log.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		logger.Log.Fatal("Database ping failed", zap.Error(err))
	}

	logger.Log.Info("Connected to database successfully")

	bookingRepo := repository.NewPostgresBookingRepository(db)
	bookingService := service.NewBookingService(bookingRepo)
	bookingHandler := handler.NewBookingHandler(bookingService, logger.Log)

	router := mux.NewRouter()

	api := router.PathPrefix("/api/v1").Subrouter()
	api.HandleFunc("/bookings", bookingHandler.CreateBooking).Methods("POST")
	api.HandleFunc("/bookings/{id}", bookingHandler.GetBooking).Methods("GET")
	api.HandleFunc("/bookings/user", bookingHandler.GetUserBookings).Methods("GET")
	api.HandleFunc("/bookings/{id}/cancel", bookingHandler.CancelBooking).Methods("POST")

	router.PathPrefix("/swagger/").Handler(httpSwagger.WrapHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.ServerPort
	}

	logger.Log.Info("Starting booking service", zap.String("port", port))
	if err := http.ListenAndServe(":"+port, router); err != nil {
		logger.Log.Fatal("Failed to start server", zap.Error(err))
	}
}
