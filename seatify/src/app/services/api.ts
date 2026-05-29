// src/app/services/api.ts

const API_BASE_URL = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:8083';

export interface Movie {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  release_date: string;
  poster_url: string;
  rating?: number; 
  genre?: string[];
}

export interface Session {
  id: number;
  movie_id: number;
  hall_id: number;
  cinema_id: number;
  cinema_address: string;
  cinema_city: string;
  start_time: string;
  base_price_cents: number;
  time?: string;
  date?: string;
  price?: number;
  hall_name?: string;
}

export interface Cinema {
  id: number;
  name: string;
  address: string;
  city: string;
}

export const fetchMovies = async (): Promise<Movie[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/movies`);
    if (!response.ok) throw new Error('Ошибка загрузки фильмов');
    return await response.json();
  } catch (error) {
    console.error('API Error (fetchMovies):', error);
    return []; 
  }
};

export const fetchSessionsByMovie = async (movieId: number): Promise<Session[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/movies/${movieId}/sessions`);
    
    // Если сервер вернул 404 (сеансов нет), возвращаем пустой массив, а не ошибку
    if (response.status === 404) {
      return [];
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error ${response.status}:`, errorText);
      throw new Error(`Ошибка загрузки сеансов: ${response.status}`);
    }

    const data = await response.json();
    
    // Проверка на случай, если сервер вернул null вместо массива
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    return data.map((session: any) => ({
      ...session,
      time: new Date(session.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      date: new Date(session.start_time).toISOString().split('T')[0],
      price: session.base_price_cents / 100,
      hall_name: `Зал ${session.hall_id}` 
    }));
  } catch (error) {
    console.error(`API Error (fetchSessionsByMovie ${movieId}):`, error);
    return []; // Возвращаем пустой массив вместо проброса ошибки или null
  }
};

export const fetchSessionById = async (sessionId: number): Promise<Session | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/sessions/${sessionId}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Сеанс не найден');
    
    const data = await response.json();
    
    return {
      ...data,
      time: new Date(data.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      date: new Date(data.start_time).toISOString().split('T')[0],
      price: data.base_price_cents / 100,
      hall_name: `Зал ${data.hall_id}`
    };
  } catch (error) {
    console.error(`API Error (fetchSessionById ${sessionId}):`, error);
    return null;
  }
};