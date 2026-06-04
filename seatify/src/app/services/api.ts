// src/app/services/api.ts

const API_BASE_URL = 'http://localhost:8082'

// Функция для получения заголовков авторизации
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

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
  cinema_id?: number;
  cinema_address?: string;
  cinema_city?: string;
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

export interface Hall {
  id: number;
  cinema_id: number;
  name: string;
  capacity: number;
}

// ========== ПУБЛИЧНЫЕ ENDPOINTS ==========

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
    return [];
  }
};

export const fetchSessionById = async (sessionId: number): Promise<Session | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);
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

// ========== ADMIN ENDPOINTS (требуют JWT токен с ролью admin) ==========

// Movies
export const createMovie = async (movieData: Omit<Movie, 'id'>): Promise<Movie> => {
  const response = await fetch(`${API_BASE_URL}/admin/movies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(movieData)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка создания фильма: ${errorText}`);
  }
  
  return response.json();
};

export const updateMovie = async (id: number, movieData: Partial<Movie>): Promise<Movie> => {
  const response = await fetch(`${API_BASE_URL}/admin/movies/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(movieData)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка обновления фильма: ${errorText}`);
  }
  
  return response.json();
};

export const deleteMovie = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/movies/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка удаления фильма: ${errorText}`);
  }
};

// Cinemas
export const createCinema = async (cinemaData: Omit<Cinema, 'id'>): Promise<Cinema> => {
  const response = await fetch(`${API_BASE_URL}/admin/cinemas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(cinemaData)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка создания кинотеатра: ${errorText}`);
  }
  
  return response.json();
};

export const updateCinema = async (id: number, cinemaData: Partial<Cinema>): Promise<Cinema> => {
  const response = await fetch(`${API_BASE_URL}/admin/cinemas/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(cinemaData)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка обновления кинотеатра: ${errorText}`);
  }
  
  return response.json();
};

export const deleteCinema = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/cinemas/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка удаления кинотеатра: ${errorText}`);
  }
};

// Halls
export const createHall = async (hallData: Omit<Hall, 'id'>): Promise<Hall> => {
  const response = await fetch(`${API_BASE_URL}/admin/halls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(hallData)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка создания зала: ${errorText}`);
  }
  
  return response.json();
};

export const updateHall = async (id: number, hallData: Partial<Hall>): Promise<Hall> => {
  const response = await fetch(`${API_BASE_URL}/admin/halls/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(hallData)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка обновления зала: ${errorText}`);
  }
  
  return response.json();
};

export const deleteHall = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/halls/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
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
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
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
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
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
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка удаления сеанса: ${errorText}`);
  }
};


// ========== BOOKING ENDPOINTS ==========

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

export const fetchMyBookings = async (): Promise<Booking[]> => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found');
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/bookings/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch bookings:', errorText);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};

// ========== CINEMA ENDPOINTS ==========

export const fetchCinemas = async (): Promise<Cinema[]> => {
  try {
    // Получаем все фильмы и их сеансы, чтобы собрать кинотеатры
    const movies = await fetchMovies();
    const allSessionsPromises = movies.map(m => fetchSessionsByMovie(m.id));
    const sessionsArrays = await Promise.all(allSessionsPromises);
    const allSessions = sessionsArrays.flat();
    
    // Собираем уникальные кинотеатры
    const cinemaMap = new Map<number, Cinema>();
    allSessions.forEach(s => {
      if (s.cinema_id && !cinemaMap.has(s.cinema_id)) {
        cinemaMap.set(s.cinema_id, {
          id: s.cinema_id,
          name: s.cinema_name || `Кинотеатр ${s.cinema_id}`,
          address: s.cinema_address || 'Адрес уточняется',
          city: s.cinema_city || 'Москва',
        });
      }
    });
    
    return Array.from(cinemaMap.values());
  } catch (error) {
    console.error('Error fetching cinemas:', error);
    return [];
  }
};

export const fetchCinemaById = async (cinemaId: number): Promise<Cinema | null> => {
  try {
    const cinemas = await fetchCinemas();
    return cinemas.find(c => c.id === cinemaId) || null;
  } catch (error) {
    console.error(`Error fetching cinema ${cinemaId}:`, error);
    return null;
  }
};

// Получить все сеансы для конкретного кинотеатра
export const fetchSessionsByCinema = async (cinemaId: number): Promise<Session[]> => {
  try {
    const movies = await fetchMovies();
    const allSessionsPromises = movies.map(m => fetchSessionsByMovie(m.id));
    const sessionsArrays = await Promise.all(allSessionsPromises);
    const allSessions = sessionsArrays.flat();
    
    return allSessions.filter(s => s.cinema_id === cinemaId);
  } catch (error) {
    console.error(`Error fetching sessions for cinema ${cinemaId}:`, error);
    return [];
  }
};