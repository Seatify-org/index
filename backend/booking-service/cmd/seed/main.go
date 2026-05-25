package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

func main() {
	// Получаем строку подключения из переменных окружения или используем дефолтную
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		// Дефолтное подключение для локальной разработки (из docker-compose.yml)
		connStr = "host=localhost port=5432 user=seatify password=seatify_password dbname=seatify sslmode=disable"
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	fmt.Println("Connected to database. Seeding data...")

	// 1. Создаем тестового пользователя (если нет)
	_, err = db.Exec(`
		INSERT INTO users (id, email, password_hash, full_name, created_at)
		VALUES (1, 'test@example.com', 'hash_placeholder', 'Test User', $1)
		ON CONFLICT (id) DO NOTHING;
	`, time.Now())
	if err != nil {
		log.Printf("Warning: Could not seed user: %v", err)
	}

	// 2. Создаем тестовый фильм (если нет)
	movieID := 999
	_, err = db.Exec(`
		INSERT INTO movies (id, title, description, duration_minutes, release_date, poster_url, trailer_url, rating, created_at, updated_at)
		VALUES ($1, 'Test Movie', 'A test movie for booking', 120, $2, 'http://example.com/poster.jpg', 'http://example.com/trailer.mp4', 8.5, $3, $3)
		ON CONFLICT (id) DO NOTHING;
	`, movieID, time.Now().Format("2006-01-02"), time.Now())
	if err != nil {
		log.Printf("Warning: Could not seed movie: %v", err)
	}

	// 3. Создаем тестовый сеанс с ID 1400 (который вы используете на фронтенде)
	// Важно: Session ID должен совпадать с тем, что отправляет фронтенд
	sessionID := 1400
	startTime := time.Now().Add(24 * time.Hour) // Завтра
	endTime := startTime.Add(2 * time.Hour)

	_, err = db.Exec(`
		INSERT INTO sessions (id, movie_id, hall_id, start_time, end_time, base_price_cents, available_seats, status, created_at, updated_at)
		VALUES ($1, $2, 1, $3, $4, 50000, 100, 'active', $5, $5)
		ON CONFLICT (id) DO UPDATE SET 
			movie_id = $2, 
			start_time = $3, 
			end_time = $4, 
			status = 'active',
			updated_at = $5;
	`, sessionID, movieID, startTime, endTime, time.Now())
	if err != nil {
		log.Fatalf("Error seeding session: %v", err)
	}

	fmt.Printf("Successfully seeded data!\n")
	fmt.Printf("- User ID: 1\n")
	fmt.Printf("- Movie ID: %d\n", movieID)
	fmt.Printf("- Session ID: %d (Start time: %s)\n", sessionID, startTime.Format("2006-01-02 15:04"))
	fmt.Println("Now you can try booking again.")
}
