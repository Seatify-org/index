# Инструкция по настройке базы данных для Booking Service

## Проблема
Ошибка `foreign key constraint "bookings_session_id_fkey"` означает, что вы пытаетесь создать бронирование для сеанса (`session_id`), которого не существует в базе данных.

## Решение

### Вариант 1: Использование Docker (Рекомендуется)

1. **Запустите PostgreSQL и примените миграции:**
   ```bash
   cd /workspace/backend
   docker-compose up -d postgres
   ```

2. **Дождитесь готовности базы данных (около 10 секунд):**
   ```bash
   sleep 10
   ```

3. **Примените миграции вручную:**
   ```bash
   cd /workspace/backend/booking-service
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_USER=seatify
   export DB_PASSWORD=seatify_password
   export DB_NAME=seatify
   
   ./scripts/apply_migrations.sh
   ```

   Или выполните SQL файлы по порядку через psql:
   ```bash
   export PGPASSWORD="seatify_password"
   psql -h localhost -p 5432 -U seatify -d seatify -f migrations/001_create_sessions_table.up.sql
   psql -h localhost -p 5432 -U seatify -d seatify -f migrations/002_create_seats_table.up.sql
   psql -h localhost -p 5432 -U seatify -d seatify -f migrations/003_create_bookings_table.up.sql
   psql -h localhost -p 5432 -U seatify -d seatify -f migrations/004_add_payment_id_to_bookings.up.sql
   psql -h localhost -p 5432 -U seatify -d seatify -f migrations/005_insert_test_sessions.sql
   ```

### Вариант 2: Проверка существующей базы данных

Если у вас уже есть запущенный PostgreSQL, проверьте наличие данных:

```bash
export PGPASSWORD="your_password"
psql -h localhost -p 5432 -U your_user -d your_database -c "SELECT id, movie_title, cinema_name FROM sessions ORDER BY id LIMIT 10;"
```

Если таблица пустая или не существует - примените миграции как показано выше.

### Вариант 3: Быстрая проверка через Go-код

Создайте простой скрипт для проверки подключения и наличия данных:

```go
package main

import (
    "database/sql"
    "fmt"
    _ "github.com/lib/pq"
)

func main() {
    connStr := "host=localhost port=5432 user=seatify password=seatify_password dbname=seatify sslmode=disable"
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        fmt.Println("Error connecting:", err)
        return
    }
    defer db.Close()
    
    var count int
    err = db.QueryRow("SELECT COUNT(*) FROM sessions").Scan(&count)
    if err != nil {
        fmt.Println("Error querying:", err)
        return
    }
    
    fmt.Printf("Found %d sessions in database\n", count)
    
    rows, _ := db.Query("SELECT id, movie_title FROM sessions LIMIT 5")
    defer rows.Close()
    
    for rows.Next() {
        var id int
        var title string
        rows.Scan(&id, &title)
        fmt.Printf("Session ID: %d, Title: %s\n", id, title)
    }
}
```

## Проверка успешности

После применения миграций вы должны увидеть сессии с ID от 1 до 25+:

```sql
SELECT id, movie_title, cinema_name, start_time FROM sessions ORDER BY id;
```

Теперь попробуйте снова создать бронирование с `session_id: 1` (или любым другим из списка).

## Важные замечания

1. **Frontend использует строковые ID** (например, "s703"), которые функция `parseNumericId` преобразует в числа (703). Убедитесь, что в базе есть сессия с таким ID.

2. **Тестовые данные** в файле `005_insert_test_sessions.sql` создают 25 сеансов с ID от 1 до 25.

3. **Для продакшена** вам нужно будет синхронизировать ID сеансов между фронтендом и бэкендом через API, а не использовать моковые данные.
