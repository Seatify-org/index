DELETE FROM bookings;

DELETE FROM sessions
WHERE movie_id IN (
    SELECT id FROM movies
    WHERE title IN ('Разлом реальности', 'Неоновый кошмар', 'Конечный горизонт')
);

DELETE FROM halls
WHERE name IN ('IMAX Hall 1', 'Standard Hall 2', 'Hall 1')
  AND cinema_id IN (
    SELECT id FROM cinemas
    WHERE name IN ('KARO 11 Октябрь', 'Формула Кино Европа', 'Cinema Park Триумф')
);

DELETE FROM cinemas
WHERE name IN ('KARO 11 Октябрь', 'Формула Кино Европа', 'Cinema Park Триумф');

DELETE FROM movies
WHERE title IN ('Разлом реальности', 'Неоновый кошмар', 'Конечный горизонт');