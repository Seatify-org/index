// src/app/services/api.ts

const API_BASE_URL = 'http://localhost:8082';

// Функция для получения заголовков авторизации
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ========== INTERFACES ==========

export interface Movie {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  release_date: string;
  poster_url: string;
  banner_url?: string;
  trailer_url?: string;
  rating?: number;
  genre?: string[];
  cast?: string[];
  director?: string;
  created_at?: string;
}

export interface Session {
  id: number;
  movie_id: number;
  movie_title?: string;
  hall_id: number;
  hall_name?: string;
  cinema_id?: number;
  cinema_name?: string;
  cinema_address?: string;
  cinema_city?: string;
  start_time: string;
  base_price_cents: number;
  time?: string;
  date?: string;
  price?: number;
}

export interface Cinema {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  phone_number?: string;
  created_at?: string;
}

export interface Hall {
  id: number;
  cinema_id: number;
  name: string;
  rows: number;
  seats_per_row: number;
  total_seats?: number;
  created_at?: string;
}

export interface Booking {
  id: number;
  user_id: number;
  session_id: number;
  total_amount_cents: number;
  payment_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
}

// ========== PUBLIC ENDPOINTS ==========

export const fetchMovies = async (): Promise<Movie[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/movies`);
    if (!response.ok) throw new Error('Ошибка загрузки фильмов');
    return await response.json();
  } catch (error) {
    console.error('API Error (fetchMovies):', error);
    return [];
  }
};

export const fetchSessionsByMovie = async (movieId: number): Promise<Session[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}/sessions`);
    if (response.status === 404) return [];
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error ${response.status}:`, errorText);
      throw new Error(`Ошибка загрузки сеансов: ${response.status}`);
    }
    const data = await response.json();
    if (!data || !Array.isArray(data)) return [];
    return data;
  } catch (error) {
    console.error(`API Error (fetchSessionsByMovie ${movieId}):`, error);
    return [];
  }
};

export const fetchSessionById = async (sessionId: number): Promise<Session | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Сеанс не найден');
    return await response.json();
  } catch (error) {
    console.error(`API Error (fetchSessionById ${sessionId}):`, error);
    return null;
  }
};

// ========== PUBLIC CINEMA ENDPOINTS ==========

export const fetchCinemas = async (): Promise<Cinema[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cinemas`);
    if (!response.ok) throw new Error('Ошибка загрузки кинотеатров');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('API Error (fetchCinemas):', error);
    return [];
  }
};

export const fetchCinemaById = async (cinemaId: number): Promise<Cinema | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cinemas/${cinemaId}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Кинотеатр не найден');
    return await response.json();
  } catch (error) {
    console.error(`API Error (fetchCinemaById ${cinemaId}):`, error);
    return null;
  }
};

export const fetchHallsByCinema = async (cinemaId: number): Promise<Hall[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cinemas/${cinemaId}/halls`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`API Error (fetchHallsByCinema ${cinemaId}):`, error);
    return [];
  }
};

export const fetchSessionsByCinema = async (cinemaId: number): Promise<Session[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cinemas/${cinemaId}/sessions`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`API Error (fetchSessionsByCinema ${cinemaId}):`, error);
    return [];
  }
};

// ========== ADMIN ENDPOINTS (требуют JWT токен с ролью admin) ==========

// Movies
export const createMovie = async (movieData: Omit<Movie, 'id' | 'created_at'>): Promise<Movie> => {
  const response = await fetch(`${API_BASE_URL}/admin/movies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(movieData)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка создания фильма: ${errorText}`);
  }
  return response.json();
};

export const updateMovie = async (id: number, movieData: Partial<Movie>): Promise<Movie> => {
  const { id: _, created_at, ...data } = movieData as any;
  const response = await fetch(`${API_BASE_URL}/admin/movies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка обновления фильма: ${errorText}`);
  }
  return response.json();
};

export const deleteMovie = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/movies/${id}`, {
    method: 'DELETE', headers: getAuthHeaders()
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка удаления фильма: ${errorText}`);
  }
};

// Cinemas
export const createCinema = async (cinemaData: Omit<Cinema, 'id' | 'created_at'>): Promise<Cinema> => {
  const response = await fetch(`${API_BASE_URL}/admin/cinemas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(cinemaData)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка создания кинотеатра: ${errorText}`);
  }
  return response.json();
};

export const updateCinema = async (id: number, cinemaData: Partial<Cinema>): Promise<Cinema> => {
  const { id: _, created_at, ...data } = cinemaData as any;
  const response = await fetch(`${API_BASE_URL}/admin/cinemas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка обновления кинотеатра: ${errorText}`);
  }
  return response.json();
};

export const deleteCinema = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/cinemas/${id}`, {
    method: 'DELETE', headers: getAuthHeaders()
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка удаления кинотеатра: ${errorText}`);
  }
};

// Halls
export const createHall = async (hallData: Omit<Hall, 'id' | 'created_at' | 'total_seats'>): Promise<Hall> => {
  const response = await fetch(`${API_BASE_URL}/admin/halls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(hallData)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка создания зала: ${errorText}`);
  }
  return response.json();
};

export const updateHall = async (id: number, hallData: Partial<Hall>): Promise<Hall> => {
  const { id: _, created_at, total_seats, ...data } = hallData as any;
  const response = await fetch(`${API_BASE_URL}/admin/halls/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка обновления зала: ${errorText}`);
  }
  return response.json();
};

export const deleteHall = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/halls/${id}`, {
    method: 'DELETE', headers: getAuthHeaders()
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка удаления зала: ${errorText}`);
  }
};

// Sessions
export const createSession = async (sessionData: {
  movie_id: number;
  hall_id: number;
  start_time: string;
  base_price_cents: number;
}): Promise<Session> => {
  const response = await fetch(`${API_BASE_URL}/admin/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(sessionData)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка создания сеанса: ${errorText}`);
  }
  return response.json();
};

export const updateSession = async (id: number, sessionData: {
  movie_id?: number;
  hall_id?: number;
  start_time?: string;
  base_price_cents?: number;
}): Promise<Session> => {
  const response = await fetch(`${API_BASE_URL}/admin/sessions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(sessionData)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка обновления сеанса: ${errorText}`);
  }
  return response.json();
};

export const deleteSession = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/sessions/${id}`, {
    method: 'DELETE', headers: getAuthHeaders()
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка удаления сеанса: ${errorText}`);
  }
};

// ========== BOOKING ENDPOINTS ==========

export const fetchMyBookings = async (): Promise<Booking[]> => {
  const token = localStorage.getItem('token');
  if (!token) return [];
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};