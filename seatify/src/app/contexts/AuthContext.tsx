import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ИСПРАВЛЕНИЕ 1: Убедитесь, что URL не дублирует путь. 
// Если в .env написано http://localhost:8082/api/v1, то ниже нужно убирать '/api/v1'.
// Лучший вариант: изменить .env на VITE_AUTH_SERVICE_URL=http://localhost:8082
// Тогда код ниже будет верным.
const AUTH_API_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8082';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Проверка: если AUTH_API_URL уже содержит /api/v1, этот код добавит второй раз.
      // Убедитесь, что в .env стоит просто http://localhost:8082
      const response = await fetch(`${AUTH_API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // Попытка прочитать ошибку, но если ответ не JSON (например HTML 404), будет ошибка парсинга
        const text = await response.text();
        let errorMsg = 'Login failed';
        try {
          const errorJson = JSON.parse(text);
          errorMsg = errorJson.error || errorMsg;
        } catch (e) {
          console.error('Server response not JSON:', text);
          if (response.status === 404) errorMsg = 'Auth service not found (check URL)';
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      // ИСПРАВЛЕНИЕ 2: Проверка структуры ответа. 
      // Бэкенд может возвращать просто { token: "...", user: {...} } или иначе.
      if (!data.token) {
         throw new Error('No token received from server');
      }

      setToken(data.token);
      
      // Безопасное получение имени
      const userData: User = {
        id: data.user?.id || 0,
        name: data.user?.first_name || data.user?.name || email.split('@')[0],
        email: data.user?.email || email,
        role: 'user',
      };
      
      setUser(userData);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const [firstName, lastName] = name.split(' ');
      
      const response = await fetch(`${AUTH_API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password,
          first_name: firstName || name,
          last_name: lastName || '',
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = 'Registration failed';
        try {
          const errorJson = JSON.parse(text);
          errorMsg = errorJson.error || errorMsg;
        } catch (e) {
           if (response.status === 404) errorMsg = 'Auth service not found (check URL)';
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      if (!data.token) {
         throw new Error('No token received from server');
      }

      setToken(data.token);
      const userData: User = {
        id: data.user?.id || 0,
        name: data.user?.first_name || name,
        email: data.user?.email || email,
        role: 'user',
      };
      
      setUser(userData);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}