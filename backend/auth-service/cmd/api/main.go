package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/Seatify-org/seatify-common/logger"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
	_ "github.com/seatify/backend/auth-service/docs"
	"github.com/seatify/backend/auth-service/internal/config"
	"github.com/seatify/backend/auth-service/internal/handler"
	"github.com/seatify/backend/auth-service/internal/repository"
	"github.com/seatify/backend/auth-service/internal/service"
	httpSwagger "github.com/swaggo/http-swagger"
	_ "github.com/swaggo/swag"
	"go.uber.org/zap"
)

// @title Seatify Auth Service API
// @version 1.0
// @description Authentication and user management microservice for Seatify cinema booking platform
// @host localhost:8081
// @BasePath /
func main() {
	cfg := config.LoadAuthConfig()

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

	userRepo := repository.NewPostgresUserRepository(db)
	authService := service.NewAuthService(userRepo, cfg.JWTSecret)
	authHandler := handler.NewAuthHandler(authService, logger.Log)

	router := mux.NewRouter()

	api := router.PathPrefix("/api/v1").Subrouter()
	api.HandleFunc("/auth/register", authHandler.Register).Methods("POST")
	api.HandleFunc("/auth/login", authHandler.Login).Methods("POST")
	api.HandleFunc("/auth/users/{id}", authHandler.GetUser).Methods("GET")

	router.PathPrefix("/swagger/").Handler(httpSwagger.WrapHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.ServerPort
	}

	corsHandler := handlers.CORS(
		handlers.AllowedOrigins([]string{"*"}), // В продакшене замените "*" на адрес фронтенда
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
	)(router)

	logger.Log.Info("Starting booking service", zap.String("port", port))
	if err := http.ListenAndServe(":"+port, corsHandler); err != nil {
		logger.Log.Fatal("Failed to start server", zap.Error(err))
	}
}
