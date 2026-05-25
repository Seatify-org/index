-- Script to insert test sessions data into the database
-- Run this after migrations are applied

INSERT INTO sessions (movie_title, cinema_name, hall_name, start_time, end_time, price_cents, created_at)
VALUES 
    ('Разлом реальности', 'KARO 11 Oktyabr', 'IMAX Screen', NOW() + INTERVAL '1 day 10:00:00', NOW() + INTERVAL '1 day 12:28:00', 54900, NOW()),
    ('Неоновый кошмар', 'KARO 11 Oktyabr', 'Hall 2', NOW() + INTERVAL '1 day 14:00:00', NOW() + INTERVAL '1 day 16:12:00', 44900, NOW()),
    ('Конечный горизонт', 'KARO 11 Oktyabr', 'Hall 3', NOW() + INTERVAL '1 day 18:00:00', NOW() + INTERVAL '1 day 20:36:00', 44900, NOW()),
    ('Полуночные отголоски', 'Formula Kino Europe', 'IMAX Screen', NOW() + INTERVAL '1 day 11:00:00', NOW() + INTERVAL '1 day 13:18:00', 54900, NOW()),
    ('Гонка на выживание', 'Formula Kino Europe', 'Hall 2', NOW() + INTERVAL '1 day 15:00:00', NOW() + INTERVAL '1 day 17:04:00', 44900, NOW()),
    ('Разлом реальности', 'Cinema Park Metropolis', 'Hall 1', NOW() + INTERVAL '2 days 10:00:00', NOW() + INTERVAL '2 days 12:28:00', 44900, NOW()),
    ('Неоновый кошмар', 'Cinema Park Metropolis', 'Hall 2', NOW() + INTERVAL '2 days 13:00:00', NOW() + INTERVAL '2 days 15:12:00', 44900, NOW()),
    ('Конечный горизонт', 'Pioneer Cinema', 'IMAX Screen', NOW() + INTERVAL '2 days 16:00:00', NOW() + INTERVAL '2 days 18:36:00', 54900, NOW()),
    ('Полуночные отголоски', 'Pioneer Cinema', 'Hall 2', NOW() + INTERVAL '2 days 19:00:00', NOW() + INTERVAL '2 days 21:18:00', 44900, NOW()),
    ('Гонка на выживание', '5 Zvezd Novokuznetskaya', 'Hall 1', NOW() + INTERVAL '3 days 12:00:00', NOW() + INTERVAL '3 days 14:04:00', 34900, NOW()),
    ('Разлом реальности', 'Illusion', 'Hall 1', NOW() + INTERVAL '3 days 15:00:00', NOW() + INTERVAL '3 days 17:28:00', 34900, NOW()),
    ('Неоновый кошмар', 'Khudozhestvenny', 'Hall 1', NOW() + INTERVAL '3 days 18:00:00', NOW() + INTERVAL '3 days 20:12:00', 34900, NOW()),
    ('Конечный горизонт', 'KARO 13 Kuntsevo', 'IMAX Screen', NOW() + INTERVAL '4 days 10:00:00', NOW() + INTERVAL '4 days 12:36:00', 54900, NOW()),
    ('Полуночные отголоски', 'Mori Cinema', 'Hall 1', NOW() + INTERVAL '4 days 14:00:00', NOW() + INTERVAL '4 days 16:18:00', 44900, NOW()),
    ('Гонка на выживание', 'Vremena Goda', 'Hall 1', NOW() + INTERVAL '4 days 17:00:00', NOW() + INTERVAL '4 days 19:04:00', 44900, NOW()),
    ('Разлом реальности', 'Dom Kino', 'Hall 1', NOW() + INTERVAL '5 days 11:00:00', NOW() + INTERVAL '5 days 13:28:00', 34900, NOW()),
    ('Неоновый кошмар', 'Cinema Park CSKA', 'IMAX Screen', NOW() + INTERVAL '5 days 14:00:00', NOW() + INTERVAL '5 days 16:12:00', 54900, NOW()),
    ('Конечный горизонт', 'Formula Kino Chertanovo', 'Hall 1', NOW() + INTERVAL '5 days 18:00:00', NOW() + INTERVAL '5 days 20:36:00', 44900, NOW()),
    ('Полуночные отголоски', 'Kinomax Titan', 'Hall 1', NOW() + INTERVAL '6 days 12:00:00', NOW() + INTERVAL '6 days 14:18:00', 34900, NOW()),
    ('Гонка на выживание', 'Silver Cinema', 'Hall 1', NOW() + INTERVAL '6 days 15:00:00', NOW() + INTERVAL '6 days 17:04:00', 44900, NOW()),
    ('Разлом реальности', 'Cinema Park Triumph Mall', 'IMAX Screen', NOW() + INTERVAL '6 days 18:00:00', NOW() + INTERVAL '6 days 20:28:00', 54900, NOW()),
    ('Неоновый кошмар', 'Formula Kino Tau Gallery', 'Hall 1', NOW() + INTERVAL '7 days 10:00:00', NOW() + INTERVAL '7 days 12:12:00', 44900, NOW()),
    ('Конечный горизонт', 'Happy Cinema', 'Hall 1', NOW() + INTERVAL '7 days 13:00:00', NOW() + INTERVAL '7 days 15:36:00', 34900, NOW()),
    ('Полуночные отголоски', 'Cinema 5 City Mall', 'Hall 1', NOW() + INTERVAL '7 days 16:00:00', NOW() + INTERVAL '7 days 18:18:00', 34900, NOW()),
    ('Гонка на выживание', 'Oscar', 'Hall 1', NOW() + INTERVAL '7 days 19:00:00', NOW() + INTERVAL '7 days 21:04:00', 24900, NOW());

-- Verify inserted sessions
SELECT id, movie_title, cinema_name, hall_name, start_time, price_cents FROM sessions ORDER BY id;
