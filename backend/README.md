# Запуск бэкенд-сервисов Seatify

Этот документ описывает шаги для локального запуска бэкенд-сервисов.

## Предварительные требования

- Docker и Docker Compose установлены
- Go 1.21+ (для локальной разработки)
- Make (опционально)

## Быстрый запуск с Docker Compose

### Шаг 1: Перейдите в директорию backend

```bash
cd backend
```

### Шаг 2: Запустите все сервисы

```bash
docker-compose up -d
```

Эта команда запустит:
- PostgreSQL (порт 5432)
- Auth Service (порт 8081)
- Booking Service (порт 8082)

### Шаг 3: Проверьте статус сервисов

```bash
docker-compose ps
```

### Шаг 4: Примените миграции

Для auth-service:
```bash
docker exec -it seatify_auth_service sh -c "cd /root && goose -dir migrations postgres 'host=postgres port=5432 user=seatify password=seatify_password dbname=seatify sslmode=disable' up"
```

Для booking-service:
```bash
docker exec -it seatify_booking_service sh -c "cd /root && goose -dir migrations postgres 'host=postgres port=5432 user=seatify password=seatify_password dbname=seatify sslmode=disable' up"
```

Или используйте make:
```bash
make migrate-auth
make migrate-booking
```

### Шаг 5: Проверьте работу API

Auth Service Swagger: http://localhost:8081/swagger/
Booking Service Swagger: http://localhost:8082/swagger/

### Шаг 6: Просмотр логов

```bash
docker-compose logs -f booking-service
docker-compose logs -f auth-service
```

### Остановка сервисов

```bash
docker-compose down
```

Для удаления volumes (база данных будет удалена):
```bash
docker-compose down -v
```

## Локальная разработка (без Docker)

### Шаг 1: Установите PostgreSQL

Убедитесь, что PostgreSQL запущен и создана база данных:

```bash
createdb seatify
```

### Шаг 2: Настройте переменные окружения

Создайте файл `.env` в директории каждого сервиса или экспортируйте переменные:

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=your_password
export DB_NAME=seatify
export SERVER_PORT=8082
export LOG_LEVEL=debug
export JWT_SECRET=your-secret-key
```

### Шаг 3: Примените миграции

Установите golang-migrate:
```bash
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

Примените миграции для auth-service:
```bash
cd backend/auth-service
migrate -path migrations -database "postgresql://postgres:password@localhost:5432/seatify?sslmode=disable" up
```

Примените миграции для booking-service:
```bash
cd backend/booking-service
migrate -path migrations -database "postgresql://postgres:password@localhost:5432/seatify?sslmode=disable" up
```

### Шаг 4: Запустите сервисы

Auth Service:
```bash
cd backend/auth-service
go run cmd/api/main.go
```

Booking Service:
```bash
cd backend/booking-service
go run cmd/api/main.go
```

## Тестирование

### Запуск тестов

```bash
# Auth service
cd backend/auth-service
go test ./... -v -cover

# Booking service
cd backend/booking-service
go test ./... -v -cover
```

### Генерация моков

```bash
go install github.com/golang/mock/mockgen@latest
```

## API Endpoints

### Auth Service (http://localhost:8081)

- `POST /api/v1/auth/register` - Регистрация пользователя
- `POST /api/v1/auth/login` - Вход
- `GET /api/v1/auth/users/{id}` - Получение информации о пользователе

### Booking Service (http://localhost:8082)

- `POST /api/v1/bookings` - Создание бронирования
- `GET /api/v1/bookings/{id}` - Получение бронирования
- `GET /api/v1/bookings/user` - Получение бронирований пользователя
- `POST /api/v1/bookings/{id}/cancel` - Отмена бронирования

## Конфигурация базы данных

По умолчанию используются следующие параметры:
- Host: localhost (или postgres в Docker)
- Port: 5432
- User: seatify
- Password: seatify_password
- Database: seatify

## Troubleshooting

### Ошибка подключения к базе данных

Проверьте, что PostgreSQL запущен и доступен:
```bash
docker-compose ps
```

### Порт уже занят

Измените порт в docker-compose.yml или остановите конфликтующий сервис.

### Миграции не применяются

Проверьте, что у вас установлена правильная версия golang-migrate и путь к миграциям указан верно.
