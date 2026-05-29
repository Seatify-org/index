// src/data/movies.ts

// 1. ИНТЕРФЕЙСЫ (Обновлены типы ID на number для соответствия БД)
export interface Movie {
  id: number; // Было string, стало number
  title: string;
  description: string;
  duration_minutes: number;
  release_date: string;
  poster_url: string;
  // Дополнительные поля для фронтенда, которых может не быть в БД
  rating?: number;
  genre?: string[];
  bannerUrl?: string;
  trailerUrl?: string;
  cast?: string[];
  director?: string;
}

export interface Cinema {
  id: number; // Было string
  name: string;
  address: string;
  city: string;
  rating?: number;
  facilities?: string[];
  integrationLevel?: 1 | 2 | 3;
  // Остальные поля можно добавить по мере необходимости
}

export interface Session {
  id: number; // Было string
  movie_id: number; // Было movieId: string
  hall_id: number;
  cinema_id: number;
  cinema_name?: string; // Добавлено для удобства
  hall_name?: string;   // Добавлено для удобства
  start_time: string;   // ISO формат даты
  base_price_cents: number;
  
  // Для совместимости со старым кодом можно добавить геттеры или алиасы,
  // но лучше сразу менять код компонентов на новые имена полей.
  // Временные алиасы (удалите их позже):
  movieId?: number;
  cinemaId?: number;
  hallId?: number;
  time?: string;
  date?: string;
  price?: number;
}

export interface Seat {
  row: string;
  number: number;
  type: 'regular' | 'vip';
  isOccupied: boolean;
}

export interface Booking {
  id: number;
  user_id: number;
  session_id: number;
  total_amount_cents: number;
  status: string;
  created_at: string;
}

// 2. УДАЛЕНЫ ВСЕ МОКОВЫЕ ДАННЫЕ (movies, sessions, cinemas массивы)
// Теперь мы получаем их через API!

// 3. ФУНКЦИЯ ГЕНЕРАЦИИ МЕСТ (Оставляем, так как это логика отображения)
export const generateSeats = (hallName?: string): Seat[] => {
  const seats: Seat[] = [];
  
  let rows: string[];
  let seatsPerRow: number;
  let hasVIP: boolean;
  let allVIP = false;
  let vipRowStart = 0;
  let vipSeatStart = 0;
  let vipSeatEnd = 0;
  
  if (hallName?.includes('Premium')) {
    rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    seatsPerRow = 8;
    allVIP = true;
  } else if (hallName?.includes('IMAX')) {
    rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    seatsPerRow = 18;
    hasVIP = true;
    vipRowStart = 7;
    vipSeatStart = 6;
    vipSeatEnd = 13;
  } else if (hallName?.includes('4DX')) {
    rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    seatsPerRow = 14;
    hasVIP = true;
    vipRowStart = 5;
    vipSeatStart = 4;
    vipSeatEnd = 11;
  } else {
    rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    seatsPerRow = 12;
    hasVIP = false;
  }
  
  rows.forEach((row, rowIndex) => {
    for (let i = 1; i <= seatsPerRow; i++) {
      let seatType: 'vip' | 'regular' = 'regular';
      
      if (allVIP) {
        seatType = 'vip';
      } else if (hasVIP && rowIndex >= vipRowStart && i >= vipSeatStart && i <= vipSeatEnd) {
        seatType = 'vip';
      }
      
      // В реальном приложении статус занятости должен приходить с бэкенда
      // Сейчас генерируем случайно для демонстрации
      const isOccupied = Math.random() > 0.8; 
      
      seats.push({
        row,
        number: i,
        type: seatType,
        isOccupied,
      });
    }
  });
  
  return seats;
};

// 4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ПРЕОБРАЗОВАНИЯ ДАННЫХ API
// Помогают мапить данные с бэкенда (snake_case) на фронтенд (camelCase), если нужно

export const mapSessionToFrontend = (apiSession: Session): Session => {
  return {
    ...apiSession,
    // Алиасы для совместимости со старым кодом компонентов
    movieId: apiSession.movie_id,
    cinemaId: apiSession.cinema_id,
    hallId: apiSession.hall_id,
    time: new Date(apiSession.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    date: new Date(apiSession.start_time).toISOString().split('T')[0],
    price: Math.round(apiSession.base_price_cents / 100), // Конвертируем копейки в рубли для отображения
  };
};