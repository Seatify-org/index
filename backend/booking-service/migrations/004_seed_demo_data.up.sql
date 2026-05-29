INSERT INTO movies (title, description, duration_minutes, release_date, poster_url, banner_url, trailer_url, rating)
VALUES
    ('Разлом реальности', 'Фантастика о квантовых вычислениях', 148, '2026-03-15', 'https://i.ibb.co/RTvgJKcw/image.jpg', 'https://i.ibb.co/RTvgJKcw/image.jpg', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 8.7),
    ('Неоновый кошмар', 'Киберпанк-детектив', 132, '2026-02-28', 'https://i.ibb.co/dJpWbmCH/image.png', 'https://i.ibb.co/dJpWbmCH/image.png', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 9.1),
    ('Конечный горизонт', 'Космическое путешествие', 156, '2026-04-10', 'https://i.ibb.co/bgW796PF/Image-2.png', 'https://i.ibb.co/bgW796PF/Image-2.png', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 8.3);

INSERT INTO cinemas (name, address, city, latitude, longitude, rating, image_url, integration_level, phone_number)
VALUES
    ('KARO 11 Октябрь', 'Новый Арбат, 24', 'Москва', 55.7522, 37.5925, 4.8, NULL, 1, '+7-495-000-00-01'),
    ('Формула Кино Европа', 'Площадь Киевского Вокзала, 2', 'Москва', 55.7447, 37.5668, 4.7, NULL, 1, '+7-495-000-00-02'),
    ('Cinema Park Триумф', 'Ульяновская, 47', 'Саратов', 51.5336, 46.0343, 4.7, NULL, 1, '+7-845-200-00-03');

INSERT INTO halls (cinema_id, name, total_seats, rows, seats_per_row)
VALUES
    (1, 'IMAX Hall 1', 216, 12, 18),
    (1, 'Standard Hall 2', 96, 8, 12),
    (2, 'Hall 1', 112, 8, 14),
    (3, 'Hall 1', 120, 10, 12);

INSERT INTO sessions (movie_id, hall_id, start_time, end_time, base_price_cents, status, available_seats)
VALUES
    (1, 1, NOW() + INTERVAL '1 day 10 hours', NOW() + INTERVAL '1 day 12 hours 28 minutes', 59900, 'active', 216),
    (1, 1, NOW() + INTERVAL '1 day 14 hours', NOW() + INTERVAL '1 day 16 hours 28 minutes', 59900, 'active', 216),
    (2, 2, NOW() + INTERVAL '1 day 12 hours', NOW() + INTERVAL '1 day 14 hours 12 minutes', 44900, 'active', 96),
    (2, 3, NOW() + INTERVAL '2 day 18 hours', NOW() + INTERVAL '2 day 20 hours 12 minutes', 49900, 'active', 112),
    (3, 4, NOW() + INTERVAL '3 day 20 hours', NOW() + INTERVAL '3 day 22 hours 36 minutes', 89900, 'active', 120);