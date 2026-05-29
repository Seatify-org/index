import { Navigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  // ИСПРАВЛЕНО: убрано isAuthenticated, используем только user и isLoading
  const { user, isLoading } = useAuth();

  // Пока идет загрузка (проверка токена/localStorage), показываем спиннер
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
          <p className="text-gray-400 text-sm">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  // Если пользователь не вошел вообще
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Если требуется админка, но роль не admin
  if (requireAdmin && user.role !== 'admin') {
    console.warn(`Доступ запрещен. Пользователь: ${user.email}, Роль: ${user.role || 'не указана'}`);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}