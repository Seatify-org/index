CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    release_date DATE,
    poster_url VARCHAR(500),
    banner_url VARCHAR(500),
    trailer_url VARCHAR(500),
    rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cinemas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
    image_url VARCHAR(500),
    integration_level INTEGER NOT NULL DEFAULT 1 CHECK (integration_level IN (1, 2, 3)),
    phone_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS halls (
    id SERIAL PRIMARY KEY,
    cinema_id INTEGER NOT NULL REFERENCES cinemas(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    total_seats INTEGER NOT NULL CHECK (total_seats > 0),
    rows INTEGER NOT NULL CHECK (rows > 0),
    seats_per_row INTEGER NOT NULL CHECK (seats_per_row > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cinemas_city ON cinemas(city);
CREATE INDEX IF NOT EXISTS idx_halls_cinema_id ON halls(cinema_id);