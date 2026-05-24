CREATE TABLE IF NOT EXISTS seats (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    seat_number INTEGER NOT NULL,
    seat_type VARCHAR(50) DEFAULT 'standard',
    status VARCHAR(50) DEFAULT 'available',
    UNIQUE(session_id, row_number, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_seats_session ON seats(session_id);
CREATE INDEX IF NOT EXISTS idx_seats_status ON seats(status);
