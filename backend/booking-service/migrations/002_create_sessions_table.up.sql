CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    hall_id INTEGER NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    base_price_cents INTEGER NOT NULL CHECK (base_price_cents > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    available_seats INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_sessions_status CHECK (status IN ('active', 'cancelled', 'sold_out'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_movie_id ON sessions(movie_id);
CREATE INDEX IF NOT EXISTS idx_sessions_hall_id ON sessions(hall_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);