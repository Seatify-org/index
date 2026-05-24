import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Clock, Users, MapPin, Star, Building2, Plus, Minus, Ticket } from "lucide-react";
import { formatRub } from "../utils/formatRub";
import { movies, sessions, getCinemaById } from "../data/movies";
import { toast } from "sonner";

type TicketType = 'adult' | 'child' | 'senior';

interface TicketSelection {
  adult: number;
  child: number;
  senior: number;
}

const TICKET_PRICES = {
  adult: 1.0,  // 100% of base price
  child: 0.6,  // 60% of base price
  senior: 0.8, // 80% of base price
};

export default function GeneralAdmission() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  
  const [tickets, setTickets] = useState<TicketSelection>({
    adult: 0,
    child: 0,
    senior: 0,
  });
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  
  const movie = movies.find((m) => m.id === id);
  const session = sessions.find((s) => s.id === sessionId);
  const cinema = session ? getCinemaById(session.cinemaId) : null;
  
  // Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Сессия истекла! Пожалуйста, начните заново.');
          navigate(`/movie/${id}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [id, navigate]);
  
  if (!movie || !session || !cinema) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-lg">Сеанс не найден</p>
      </div>
    );
  }
  
  const updateTicketCount = (type: TicketType, delta: number) => {
    setTickets((prev) => {
      const newCount = Math.max(0, Math.min(10, prev[type] + delta));
      const totalTickets = Object.values({ ...prev, [type]: newCount }).reduce((a, b) => a + b, 0);
      
      if (totalTickets > 10) {
        toast.error('Максимум 10 билетов на одно бронирование');
        return prev;
      }
      
      return { ...prev, [type]: newCount };
    });
  };
  
  const totalTickets = tickets.adult + tickets.child + tickets.senior;
  const totalPrice = 
    tickets.adult * session.price * TICKET_PRICES.adult +
    tickets.child * session.price * TICKET_PRICES.child +
    tickets.senior * session.price * TICKET_PRICES.senior;
  
  const handleCheckout = () => {
    if (totalTickets === 0) {
      toast.error('Пожалуйста, выберите хотя бы один билет');
      return;
    }
    
    // Store booking data in sessionStorage for checkout
    sessionStorage.setItem('bookingData', JSON.stringify({
      movieId: id,
      movieTitle: movie.title,
      sessionId: session.id,
      cinemaId: cinema.id,
      tickets,
      totalPrice,
      bookingType: 'general-admission',
    }));
    
    navigate('/snacks');
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="min-h-screen pt-28 py-8">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(`/movie/${id}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад к фильму</span>
          </button>
          
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
              <p className="text-sm text-gray-400">Выберите количество и тип билетов</p>
            </div>
            
            {/* Timer */}
            <div className="glass-strong px-4 py-3 rounded-xl flex items-center gap-3">
              <Clock className={`w-5 h-5 ${timeRemaining < 60 ? 'text-red-400 animate-pulse' : 'text-purple-400'}`} />
              <div>
                <p className="text-xs text-gray-400">Осталось времени</p>
                <p className={`font-bold ${timeRemaining < 60 ? 'text-red-400' : 'text-white'}`}>
                  {formatTime(timeRemaining)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Ticket Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Admission Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-strong rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 glass rounded-xl flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Общий вход</h2>
                  <p className="text-sm text-gray-400">Открытая рассадка - Выберите любое свободное место по прибытии</p>
                </div>
              </div>
              
              <div className="glass rounded-xl p-4 border border-cyan-500/20">
                <p className="text-sm text-gray-300">
                  <strong className="text-cyan-400">💡 Как это работает:</strong> Выберите нужное количество билетов.
                  Вы сможете выбрать любое свободное место, когда прибудете в театр. Выбор мест не требуется!
                </p>
              </div>
            </motion.div>
            
            {/* Ticket Type Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              {/* Adult Tickets */}
              <div className="glass-strong rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Взрослый</h3>
                    <p className="text-sm text-gray-400">Возраст 18+</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatRub(session.price * TICKET_PRICES.adult)}</p>
                    <p className="text-xs text-gray-400">за билет</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between glass rounded-xl p-4">
                  <button
                    onClick={() => updateTicketCount('adult', -1)}
                    disabled={tickets.adult === 0}
                    className="w-10 h-10 rounded-lg glass hover:glass-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  
                  <div className="text-center px-8">
                    <p className="text-3xl font-bold">{tickets.adult}</p>
                    <p className="text-xs text-gray-400">билетов</p>
                  </div>
                  
                  <button
                    onClick={() => updateTicketCount('adult', 1)}
                    disabled={totalTickets >= 10}
                    className="w-10 h-10 rounded-lg liquid-gradient hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Child Tickets */}
              <div className="glass-strong rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Детский</h3>
                    <p className="text-sm text-gray-400">Возраст 3-17</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatRub(session.price * TICKET_PRICES.child)}</p>
                    <p className="text-xs text-gray-400">за билет</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between glass rounded-xl p-4">
                  <button
                    onClick={() => updateTicketCount('child', -1)}
                    disabled={tickets.child === 0}
                    className="w-10 h-10 rounded-lg glass hover:glass-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  
                  <div className="text-center px-8">
                    <p className="text-3xl font-bold">{tickets.child}</p>
                    <p className="text-xs text-gray-400">билетов</p>
                  </div>
                  
                  <button
                    onClick={() => updateTicketCount('child', 1)}
                    disabled={totalTickets >= 10}
                    className="w-10 h-10 rounded-lg liquid-gradient hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Senior Tickets */}
              <div className="glass-strong rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Пенсионер</h3>
                    <p className="text-sm text-gray-400">Возраст 60+</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatRub(session.price * TICKET_PRICES.senior)}</p>
                    <p className="text-xs text-gray-400">за билет</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between glass rounded-xl p-4">
                  <button
                    onClick={() => updateTicketCount('senior', -1)}
                    disabled={tickets.senior === 0}
                    className="w-10 h-10 rounded-lg glass hover:glass-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  
                  <div className="text-center px-8">
                    <p className="text-3xl font-bold">{tickets.senior}</p>
                    <p className="text-xs text-gray-400">билетов</p>
                  </div>
                  
                  <button
                    onClick={() => updateTicketCount('senior', 1)}
                    disabled={totalTickets >= 10}
                    className="w-10 h-10 rounded-lg liquid-gradient hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Sidebar - Booking Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-strong rounded-2xl p-6 sticky top-24 space-y-6"
            >
              <h3 className="text-xl font-bold">Сводка бронирования</h3>
              
              {/* Cinema Info */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-400">Кинотеатр</p>
                    <p className="font-semibold truncate">{cinema.name}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-400">Местоположение</p>
                    <p className="text-sm truncate">{cinema.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-400">Время сеанса</p>
                    <p className="font-semibold">
                      {new Date(session.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })} at {session.time}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-400">Зал</p>
                    <p className="font-semibold">{session.hallName}</p>
                  </div>
                </div>
              </div>
              
              <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
              
              {/* Ticket Breakdown */}
              <div className="space-y-2">
                <p className="text-sm text-gray-400 font-semibold">Выбранные билеты</p>
                
                {tickets.adult > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">{tickets.adult} × Взрослый</span>
                    <span className="font-semibold">{formatRub(tickets.adult * session.price * TICKET_PRICES.adult)}</span>
                  </div>
                )}

                {tickets.child > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">{tickets.child} × Детский</span>
                    <span className="font-semibold">{formatRub(tickets.child * session.price * TICKET_PRICES.child)}</span>
                  </div>
                )}

                {tickets.senior > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">{tickets.senior} × Пенсионер</span>
                    <span className="font-semibold">{formatRub(tickets.senior * session.price * TICKET_PRICES.senior)}</span>
                  </div>
                )}

                {totalTickets === 0 && (
                  <p className="text-sm text-gray-500 italic">Билеты не выбраны</p>
                )}
              </div>
              
              <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
              
              {/* Total */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 text-purple-400 font-bold flex items-center justify-center text-base">₽</span>
                  <span className="font-semibold">Итого</span>
                </div>
                <span className="text-2xl font-bold">{formatRub(totalPrice)}</span>
              </div>
              
              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={totalTickets === 0}
                className="w-full py-3 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Продолжить на закуски
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}