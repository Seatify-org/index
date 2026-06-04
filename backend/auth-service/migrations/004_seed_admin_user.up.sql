INSERT INTO users (username, email, password_hash, role, created_at, updated_at)
VALUES (
    'Admin',
    'admin@seatify.ru',
    '$2a$10$XQJG0Z8JHJZ5Z5Z5Z5Z5ZOeK5vQ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', -- bcrypt hash of 'admin123'
    'admin',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;