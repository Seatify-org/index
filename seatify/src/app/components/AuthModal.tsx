import { useState } from "react";
import { X, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (mode === 'signin') {
        await login(formData.email, formData.password);
        toast.success('Добро пожаловать!');
      } else {
        await signup(formData.name, formData.email, formData.password);
        toast.success('Аккаунт успешно создан!');
      }
      onClose();
      setFormData({ name: '', email: '', password: '' });
    } catch (error) {
      toast.error('Ошибка авторизации. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setFormData({ name: '', email: '', password: '' });
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md glass-strong rounded-3xl z-50 overflow-hidden border-2 border-white/20"
          >
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-purple-500/50 blur-xl opacity-50" />
            
            <div className="relative p-8">
              {/* Close Button */}
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="absolute top-4 right-4 p-2 glass glass-hover rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">
                  {mode === 'signin' ? 'Добро пожаловать' : 'Создать аккаунт'}
                </h2>
                <p className="text-gray-400 text-sm">
                  {mode === 'signin'
                    ? 'Войдите, чтобы управлять бронированиями'
                    : 'Присоединяйтесь к Seatify и начните бронировать билеты'}
                </p>
              </div>
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Полное имя</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 glass text-sm text-white placeholder-gray-500 rounded-xl focus:outline-none focus:border-purple-500/50 transition-colors"
                        placeholder="Иван Иванов"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 glass text-sm text-white placeholder-gray-500 rounded-xl focus:outline-none focus:border-purple-500/50 transition-colors"
                      placeholder="ivan@example.com"
                      disabled={isLoading}
                    />
                  </div>
                  {mode === 'signin' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Попробуйте: admin@seatify.com для доступа администратора
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 glass text-sm text-white placeholder-gray-500 rounded-xl focus:outline-none focus:border-purple-500/50 transition-colors"
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Обработка...
                    </>
                  ) : (
                    mode === 'signin' ? 'Войти' : 'Создать аккаунт'
                  )}
                </button>
              </form>
              
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 glass rounded-full text-gray-400">или</span>
                </div>
              </div>
              
              {/* Social Login */}
              <div className="space-y-3">
                <button
                  type="button"
                  disabled={isLoading}
                  className="w-full py-3 glass glass-hover rounded-xl font-semibold transition-all text-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                  Войти через Google
                </button>
              </div>
              
              {/* Toggle Mode */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  disabled={isLoading}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {mode === 'signin' ? (
                    <>Нет аккаунта? <span className="text-purple-400 font-semibold">Зарегистрироваться</span></>
                  ) : (
                    <>Уже есть аккаунт? <span className="text-purple-400 font-semibold">Войти</span></>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
