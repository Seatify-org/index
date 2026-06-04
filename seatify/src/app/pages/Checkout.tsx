import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { CreditCard, User, Mail, Lock, CheckCircle2, ArrowLeft } from "lucide-react";
import { formatRub, SERVICE_FEE } from "../utils/formatRub";
import { toast } from "sonner";

interface BookingData {
  movieId: string;
  sessionId: string | number;
  cinemaId: string;
  seats?: (string | number)[];
  tickets?: {
    adult: number;
    child: number;
    senior: number;
  };
  totalPrice: number;
  movieTitle: string;
  sessionTime?: string;
  hallName?: string;
  cinemaName?: string;
  cinemaAddress?: string;
  bookingType?: 'seat-selection' | 'general-admission' | 'phone-booking';
  snacks?: Record<number, number>;
  snacksTotal?: number;
  grandTotal?: number;
}

export default function Checkout() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const data = sessionStorage.getItem('bookingData');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setBookingData(parsed);
        if (!parsed.sessionId) {
          toast.error('Ошибка: Данные сеанса отсутствуют.');
          navigate('/');
        }
      } catch (e) {
        toast.error('Ошибка чтения данных бронирования.');
        navigate('/');
      }
    } else {
      toast.error('Данные бронирования не найдены.');
      navigate('/');
    }
  }, [navigate]);
  
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Введите имя';
    if (!formData.email.trim()) {
      newErrors.email = 'Введите Email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Неверный формат Email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.cardNumber.trim()) {
      newErrors.cardNumber = 'Введите номер карты';
    } else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Нужно 16 цифр';
    }
    if (!formData.expiryDate.trim()) {
      newErrors.expiryDate = 'Введите срок';
    } else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = 'Формат ММ/ГГ';
    }
    if (!formData.cvv.trim()) {
      newErrors.cvv = 'Введите CVV';
    } else if (!/^\d{3}$/.test(formData.cvv)) {
      newErrors.cvv = '3 цифры';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const parseNumericId = (val: any): number | null => {
    if (typeof val === 'number') return val;
    if (!val) return null;
    const numbers = String(val).match(/\d+/);
    if (numbers) {
      const num = parseInt(numbers[0], 10);
      return isNaN(num) ? null : num;
    }
    return null;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2() || !bookingData) return;

    setIsProcessing(true);
    
    try {
      const cleanSessionId = parseNumericId(bookingData.sessionId);
      if (!cleanSessionId || cleanSessionId <= 0) {
        throw new Error(`Некорректный ID сеанса: "${bookingData.sessionId}"`);
      }

      const totalAmount = Math.round((bookingData.grandTotal || bookingData.totalPrice) * 100);
      if (totalAmount <= 0) throw new Error('Сумма заказа некорректна');

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Необходима авторизация');
        navigate('/');
        return;
      }

      const paymentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const payload = {
        session_id: cleanSessionId,
        total_amount_cents: totalAmount,
        payment_id: paymentId,
        status: "pending"
      };

      console.log("🚀 Отправка запроса:", payload);

      const response = await fetch('http://localhost:8082/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      
      if (!response.ok) {
        console.error("❌ Ошибка сервера:", text);
        if (!text || text.startsWith('<')) {
          throw new Error("Ошибка соединения с сервером.");
        }
        try {
          const errJson = JSON.parse(text);
          throw new Error(errJson.error || 'Ошибка сервера');
        } catch (parseErr) {
          throw new Error(text || 'Неизвестная ошибка сервера');
        }
      }

      try {
        JSON.parse(text);
      } catch (e) {
        throw new Error("Сервер вернул некорректный JSON");
      }
      
      setIsProcessing(false);
      setStep(3);
      sessionStorage.removeItem('bookingData');
      toast.success('Бронирование успешно!');
      
    } catch (error: any) {
      setIsProcessing(false);
      console.error("💥 Ошибка в handleSubmit:", error);
      toast.error(error.message || 'Ошибка при создании бронирования');
    }
  };
  
  if (!bookingData) return null;
  
  return (
    <div className="min-h-screen pt-20 md:pt-28 pb-8 md:pb-12">
      <div className="max-w-4xl mx-auto px-3 md:px-4 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 md:mb-8">
          {step < 3 && (
            <button onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-3 md:mb-4 active:scale-95">
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /> <span className="text-sm">Назад</span>
            </button>
          )}
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Оформление заказа</h1>
          
          {/* Stepper - адаптивный */}
          <div className="flex items-center gap-2 md:gap-4 mt-4 md:mt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-1.5 md:gap-2 flex-1">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-semibold text-sm md:text-base transition-all flex-shrink-0 ${step >= s ? 'bg-purple-500 text-white' : 'bg-[#1A1A22] text-gray-500'}`}>
                  {step > s ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : s}
                </div>
                <span className={`text-xs md:text-sm hidden sm:inline ${step >= s ? 'text-white' : 'text-gray-500'}`}>
                  {s === 1 ? 'Инфо' : s === 2 ? 'Оплата' : 'Готово'}
                </span>
                {s < 3 && <div className="flex-1 h-0.5 bg-[#1A1A22] hidden sm:block" />}
              </div>
            ))}
          </div>
          
          {/* Mobile Stepper - только кружки */}
          <div className="flex items-center gap-2 mt-3 sm:hidden">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 h-1 rounded-full transition-all">
                <div className={`h-full rounded-full ${step >= s ? 'liquid-gradient' : 'bg-[#1A1A22]'}`} />
              </div>
            ))}
          </div>
        </motion.div>
        
        {/* Mobile: Итого сверху */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:hidden mb-4 md:mb-6">
          <div className="glass-strong rounded-xl md:rounded-2xl p-4 md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 mb-1">Ваш заказ</p>
                <h3 className="font-semibold text-sm md:text-base truncate">{bookingData.movieTitle}</h3>
                <p className="text-xs md:text-sm text-gray-400 mt-0.5">{bookingData.sessionTime}</p>
                {bookingData.hallName && <p className="text-xs text-gray-500">{bookingData.hallName}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-400">К оплате</p>
                <p className="text-lg md:text-xl font-bold text-purple-400">{formatRub(bookingData.totalPrice + SERVICE_FEE)}</p>
              </div>
            </div>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
            {step === 1 && (
              <div className="glass-strong rounded-xl md:rounded-2xl p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-5">Личная информация</h2>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2">Имя</label>
                    <div className="relative">
                      <User className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`w-full pl-10 md:pl-11 pr-4 py-2.5 md:py-3 glass text-sm text-white rounded-lg md:rounded-xl focus:outline-none focus:border-purple-500 ${errors.name ? 'border-red-500' : ''}`} placeholder="Иван Иванов" />
                    </div>
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`w-full pl-10 md:pl-11 pr-4 py-2.5 md:py-3 glass text-sm text-white rounded-lg md:rounded-xl focus:outline-none focus:border-purple-500 ${errors.email ? 'border-red-500' : ''}`} placeholder="ivan@example.ru" />
                    </div>
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>
                <button onClick={handleNext} className="w-full mt-4 md:mt-5 py-3 md:py-3.5 liquid-gradient rounded-lg md:rounded-xl font-semibold text-sm active:scale-98 transition-transform">Далее</button>
              </div>
            )}
            
            {step === 2 && (
              <form onSubmit={handleSubmit} className="glass-strong rounded-xl md:rounded-2xl p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-5">Оплата</h2>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2">Карта</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" value={formData.cardNumber} onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })} className={`w-full pl-10 md:pl-11 pr-4 py-2.5 md:py-3 glass text-sm text-white rounded-lg md:rounded-xl focus:outline-none focus:border-purple-500 ${errors.cardNumber ? 'border-red-500' : ''}`} placeholder="1234 5678 9012 3456" maxLength={19} />
                    </div>
                    {errors.cardNumber && <p className="text-red-400 text-xs mt-1">{errors.cardNumber}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2">Срок</label>
                      <input type="text" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} className={`w-full px-3 md:px-4 py-2.5 md:py-3 glass text-sm text-white rounded-lg md:rounded-xl focus:outline-none focus:border-purple-500 ${errors.expiryDate ? 'border-red-500' : ''}`} placeholder="MM/YY" maxLength={5} />
                      {errors.expiryDate && <p className="text-red-400 text-xs mt-1">{errors.expiryDate}</p>}
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2">CVV</label>
                      <div className="relative">
                        <Lock className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={formData.cvv} onChange={(e) => setFormData({ ...formData, cvv: e.target.value })} className={`w-full pl-10 md:pl-11 pr-4 py-2.5 md:py-3 glass text-sm text-white rounded-lg md:rounded-xl focus:outline-none focus:border-purple-500 ${errors.cvv ? 'border-red-500' : ''}`} placeholder="123" maxLength={3} />
                      </div>
                      {errors.cvv && <p className="text-red-400 text-xs mt-1">{errors.cvv}</p>}
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={isProcessing} className="w-full mt-4 md:mt-5 py-3 md:py-3.5 liquid-gradient rounded-lg md:rounded-xl font-semibold text-sm disabled:opacity-50 active:scale-98 transition-transform">
                  {isProcessing ? 'Обработка...' : 'Оплатить'}
                </button>
              </form>
            )}
            
            {step === 3 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-xl md:rounded-2xl p-6 md:p-8 text-center">
                <div className="w-14 h-14 md:w-16 md:h-16 liquid-gradient rounded-full flex items-center justify-center mx-auto mb-4 md:mb-5">
                  <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-2">Успешно!</h2>
                <p className="text-gray-400 text-xs md:text-sm mb-5 md:mb-6">Билеты отправлены на {formData.email}</p>
                <button onClick={() => navigate('/profile')} className="w-full py-3 md:py-3.5 liquid-gradient rounded-lg md:rounded-xl font-semibold text-sm active:scale-98 transition-transform">В профиль</button>
              </motion.div>
            )}
          </motion.div>
          
          {/* Desktop: Итого сбоку */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 bg-[#1A1A22] rounded-2xl p-6 border border-white/5">
              <h2 className="text-xl font-bold mb-4">Итого</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{bookingData.movieTitle}</h3>
                  <p className="text-sm text-gray-400">{bookingData.sessionTime}</p>
                </div>
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="flex justify-between text-xl font-bold">
                    <span>К оплате:</span>
                    <span className="text-purple-400">{formatRub(bookingData.totalPrice + SERVICE_FEE)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}