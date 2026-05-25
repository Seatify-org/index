#!/bin/bash

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-seatify}"
DB_PASSWORD="${DB_PASSWORD:-seatify_password}"
DB_NAME="${DB_NAME:-seatify}"

export PGPASSWORD="$DB_PASSWORD"

echo "Applying migrations to database $DB_NAME at $DB_HOST:$DB_PORT..."

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MIGRATIONS_DIR="$SCRIPT_DIR/../migrations"

# List of migration files in order
MIGRATIONS=(
    "001_create_sessions_table.up.sql"
    "002_create_seats_table.up.sql"
    "003_create_bookings_table.up.sql"
    "004_add_payment_id_to_bookings.up.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    file_path="$MIGRATIONS_DIR/$migration"
    if [ -f "$file_path" ]; then
        echo "Applying: $migration"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file_path"
        if [ $? -ne 0 ]; then
            echo "Error applying migration: $migration"
            exit 1
        fi
    else
        echo "Warning: Migration file not found: $file_path"
    fi
done

echo "All migrations applied successfully!"

# Insert test data
echo ""
echo "Inserting test sessions data..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATIONS_DIR/005_insert_test_sessions.sql"

# Verify sessions
echo ""
echo "Verifying sessions data:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT id, movie_title, cinema_name, hall_name, start_time, price_cents FROM sessions ORDER BY id LIMIT 10;"
