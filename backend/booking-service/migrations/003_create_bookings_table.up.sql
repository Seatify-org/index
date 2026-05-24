CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    total_amount_cents INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    booked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_session ON bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE TABLE IF NOT EXISTS booking_seats (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id INTEGER NOT NULL REFERENCES seats(id),
    UNIQUE(booking_id, seat_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_seats_booking ON booking_seats(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_seats_seat ON booking_seats(seat_id);
