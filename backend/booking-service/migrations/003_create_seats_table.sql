-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS seats (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    seat_number INTEGER NOT NULL,
    seat_type VARCHAR(50) NOT NULL DEFAULT 'standard',
    price DECIMAL(10, 2) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, row_number, seat_number)
);

CREATE INDEX idx_seats_session_id ON seats(session_id);
CREATE INDEX idx_seats_availability ON seats(is_available);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_seats_availability;
DROP INDEX IF EXISTS idx_seats_session_id;
DROP TABLE IF EXISTS seats;
-- +goose StatementEnd
