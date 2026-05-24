import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { CreditCard, User, Mail, Lock, CheckCircle2, ArrowLeft } from "lucide-react";
import { formatRub, SERVICE_FEE } from "../utils/formatRub";
import { toast } from "sonner";

interface BookingData {
  movieId: string;
  sessionId: string;
  cinemaId: string;
  seats?: string[];
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
      setBookingData(JSON.parse(data));
    } else {
      toast.error('Данные бронирования не найдены. Пожалуйста, сначала выберите места.');
      navigate('/');
    }
  }, [navigate]);
  
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Invalid card number';
    }
    
    if (!formData.expiryDate.trim()) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = 'Invalid format (MM/YY)';
    }
    
    if (!formData.cvv.trim()) {
      newErrors.cvv = 'CVV is required';
    } else if (!/^\d{3}$/.test(formData.cvv)) {
      newErrors.cvv = 'Invalid CVV';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) return;
    
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setStep(3);
    
    // Clear booking data
    sessionStorage.removeItem('bookingData');
    
    toast.success('Booking confirmed!');
  };
  
  if (!bookingData) {
    return null;
  }
  
  return (
    <div className="min-h-screen pt-28 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {step < 3 && (
            <button
              onClick={() => step === 1 ? navigate(-1) : setStep(1)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Назад к выбору мест
            </button>
          )}
          
          <h1 className="text-3xl font-bold mb-2">Оформление заказа</h1>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-4 mt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-[#1A1A22] text-gray-500'
                }`}>
                  {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
                </div>
                <span className={`text-sm ${step >= s ? 'text-white' : 'text-gray-500'}`}>
                  {s === 1 ? 'Личная информация' : s === 2 ? 'Оплата' : 'Подтверждение'}
                </span>
                {s < 3 && <div className="w-12 h-0.5 bg-[#1A1A22]" />}
              </div>
            ))}
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            {step === 1 && (
              <div className="glass-strong rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-5">Личная информация</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Полное имя</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full pl-11 pr-4 py-2.5 glass text-sm text-white placeholder-gray-500 rounded-xl focus:outline-none focus:border-purple-500 transition-colors ${
                          errors.name ? 'border-red-500' : ''
                        }`}
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full pl-11 pr-4 py-2.5 glass text-sm text-white placeholder-gray-500 rounded-xl focus:outline-none focus:border-purple-500 transition-colors ${
                          errors.email ? 'border-red-500' : ''
                        }`}
                        placeholder="john@example.com"
                      />
                    </div>
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>
                
                <button
                  onClick={handleNext}
                  className="w-full mt-5 py-3 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl font-semibold transition-all duration-300 text-sm"
                >
                  Перейти к оплате
                </button>
              </div>
            )}
            
            {step === 2 && (
              <form onSubmit={handleSubmit} className="glass-strong rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-5">Информация об оплате</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Номер карты</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                        className={`w-full pl-11 pr-4 py-2.5 glass text-sm text-white placeholder-gray-500 rounded-xl focus:outline-none focus:border-purple-500 transition-colors ${
                          errors.cardNumber ? 'border-red-500' : ''
                        }`}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                    </div>
                    {errors.cardNumber && <p className="text-red-400 text-xs mt-1">{errors.cardNumber}</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Срок действия</label>
                      <input
                        type="text"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        className={`w-full px-4 py-2.5 glass text-sm text-white placeholder-gray-500 rounded-xl focus:outline-none focus:border-purple-500 transition-colors ${
                          errors.expiryDate ? 'border-red-500' : ''
                        }`}
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                      {errors.expiryDate && <p className="text-red-400 text-xs mt-1">{errors.expiryDate}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">CVV</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={formData.cvv}
                          onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                          className={`w-full pl-11 pr-4 py-2.5 glass text-sm text-white placeholder-gray-500 rounded-xl focus:outline-none focus:border-purple-500 transition-colors ${
                            errors.cvv ? 'border-red-500' : ''
                          }`}
                          placeholder="123"
                          maxLength={3}
                        />
                      </div>
                      {errors.cvv && <p className="text-red-400 text-xs mt-1">{errors.cvv}</p>}
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full mt-5 py-3 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isProcessing ? 'Обработка...' : 'Завершить бронирование'}
                </button>
              </form>
            )}
            
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-strong rounded-2xl p-8 text-center"
              >
                <div className="w-16 h-16 liquid-gradient rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold mb-2">Бронирование подтверждено!</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Ваши билеты отправлены на {formData.email}
                </p>
                
                <div className="glass rounded-xl p-5 mb-6 text-left">
                  <h3 className="font-bold mb-3 text-sm">Детали бронирования</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Фильм:</span>
                      <span>{bookingData.movieTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Кинотеатр:</span>
                      <span>{bookingData.cinemaName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Сеанс:</span>
                      <span>{bookingData.sessionTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Зал:</span>
                      <span>{bookingData.hallName}</span>
                    </div>
                    {bookingData.bookingType === 'general-admission' && bookingData.tickets ? (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Билеты:</span>
                        <span>
                          {bookingData.tickets.adult > 0 && `${bookingData.tickets.adult} Взрослый `}
                          {bookingData.tickets.child > 0 && `${bookingData.tickets.child} Детский `}
                          {bookingData.tickets.senior > 0 && `${bookingData.tickets.senior} Пенсионер`}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Места:</span>
                        <span>{bookingData.seats?.join(', ') || 'N/A'}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full py-3 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl font-semibold transition-all duration-300 text-sm"
                >
                  На главную
                </button>
              </motion.div>
            )}
          </motion.div>
          
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-24 bg-[#1A1A22] rounded-2xl p-6 border border-white/5">
              <h2 className="text-xl font-bold mb-4">Сводка заказа</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">{bookingData.movieTitle}</h3>
                  <p className="text-sm text-gray-400">
                    {bookingData.sessionTime} • {bookingData.hallName}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {bookingData.cinemaName}
                  </p>
                </div>
                
                {bookingData.bookingType === 'general-admission' && bookingData.tickets ? (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Билеты</p>
                    <div className="space-y-1.5">
                      {bookingData.tickets.adult > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">{bookingData.tickets.adult}× Взрослый</span>
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold">
                            {bookingData.tickets.adult}
                          </span>
                        </div>
                      )}
                      {bookingData.tickets.child > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">{bookingData.tickets.child}× Детский</span>
                          <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-semibold">
                            {bookingData.tickets.child}
                          </span>
                        </div>
                      )}
                      {bookingData.tickets.senior > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">{bookingData.tickets.senior}× Пенсионер</span>
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">
                            {bookingData.tickets.senior}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : bookingData.seats && bookingData.seats.length > 0 ? (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Места</p>
                    <div className="flex flex-wrap gap-2">
                      {bookingData.seats.map((seat) => (
                        <span key={seat} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                          {seat}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Подытог</span>
                    <span>{formatRub(bookingData.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Сервисный сбор</span>
                    <span>{formatRub(SERVICE_FEE)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/10">
                    <span>Итого</span>
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