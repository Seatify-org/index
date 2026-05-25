package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/Seatify-org/seatify-common/logger"
	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
	_ "github.com/seatify/backend/booking-service/docs"
	"github.com/seatify/backend/booking-service/internal/config"
	"github.com/seatify/backend/booking-service/internal/handler"
	"github.com/seatify/backend/booking-service/internal/repository"
	"github.com/seatify/backend/booking-service/internal/service"
	httpSwagger "github.com/swaggo/http-swagger"
	"go.uber.org/zap"
)

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
	bookingService := service.NewBookingService(bookingRepo, logger.Log)
	bookingHandler := handler.NewBookingHandler(bookingService, logger.Log)

	router := mux.NewRouter()

	api := router.PathPrefix("/api/v1").Subrouter()
	api.HandleFunc("/bookings", bookingHandler.CreateBooking).Methods("POST", "OPTIONS")
	api.HandleFunc("/bookings/{id}", bookingHandler.GetBooking).Methods("GET", "OPTIONS")
	api.HandleFunc("/bookings/user", bookingHandler.GetUserBookings).Methods("GET", "OPTIONS")
	api.HandleFunc("/bookings/{id}/cancel", bookingHandler.CancelBooking).Methods("POST", "OPTIONS")

	router.PathPrefix("/swagger/").Handler(httpSwagger.WrapHandler)

	// CORS Middleware - должен быть самым внешним слоем
	corsMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.ServerPort
	}

	logger.Log.Info("Starting booking service", zap.String("port", port))

	// Оборачиваем весь роутер в CORS
	if err := http.ListenAndServe(":"+port, corsMiddleware(router)); err != nil {
		logger.Log.Fatal("Failed to start server", zap.Error(err))
	}
}
