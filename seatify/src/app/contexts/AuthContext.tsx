import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { wsService } from "../services/websocket";

const AUTH_BASE_URL = '';

interface User {
  id: number;
  email: string;
  name: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, navigate: (to: string) => void) => Promise<void>;
  register: (email: string, password: string, name: string, navigate: (to: string) => void) => Promise<void>;
  logout: (navigate: (to: string) => void) => void;
  isAdmin: () => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          wsService.connect(storedToken);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string, navigate: (to: string) => void) => {
    try {
      const res = await fetch(`${AUTH_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Ошибка входа");
      }

      const data = await res.json();
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      wsService.connect(data.access_token);

      toast.success(`Добро пожаловать, ${data.user.name}!`);
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, navigate: (to: string) => void) => {
    try {
      const res = await fetch(`${AUTH_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Ошибка регистрации");
      }

      const data = await res.json();
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      wsService.connect(data.access_token);

      toast.success("Регистрация успешна!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const logout = (navigate: (to: string) => void) => {
    wsService.disconnect();
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Вы вышли из системы");
    navigate("/");
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAdmin, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}