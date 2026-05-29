import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Clock, Users, MapPin, Star, Building2 } from "lucide-react";
import { formatRub, SERVICE_FEE } from "../utils/formatRub";
import { fetchSessionById, type Session } from "../services/api";
import SeatGrid from "../components/SeatGrid";
import { toast } from "sonner";

// Тип для места (генерируется локально)
interface Seat {
  row: string;
  number: number;
  type: 'regular' | 'vip';
  isOccupied: boolean;
}

export default function SeatSelection() {
  const { id } = useParams(); // Movie ID
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionIdParam = searchParams.get("session");

  const [session, setSession] = useState<Session | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка данных сеанса по ID из URL
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionIdParam) {
        toast.error("Сеанс не указан");
        navigate(`/movie/${id}`);
        return;
      }

      const sId = parseInt(sessionIdParam, 10);
      if (isNaN(sId)) {
        toast.error("Неверный формат ID сеанса");
        navigate(`/movie/${id}`);
        return;
      }

      try {
        const data = await fetchSessionById(sId);
        if (!data) {
          toast.error("Сеанс не найден в базе данных");
          navigate(`/movie/${id}`);
          return;
        }
        setSession(data);
        
        // Генерируем места для этого зала
        const generatedSeats = generateSeats(data.hall_id, `Зал ${data.hall_id}`);
        setSeats(generatedSeats);

      } catch (error) {
        console.error("Error loading session:", error);
        toast.error("Ошибка загрузки данных сеанса");
        navigate(`/movie/${id}`);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [id, sessionIdParam, navigate]);

  // Таймер бронирования
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error("Сеанс истёк! Пожалуйста, начните снова.");
          navigate(`/movie/${id}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [id, navigate]);

  // Симуляция занятия мест другими пользователями
  useEffect(() => {
    const bookingInterval = setInterval(() => {
      setSeats((currentSeats) => {
        const getSeatId = (seat: Seat) => `${seat.row}${seat.number}`;
        const safeZone = new Set<string>();
        const allProtectedSeats = [...selectedSeats];
        if (hoveredSeat) allProtectedSeats.push(hoveredSeat);

        allProtectedSeats.forEach((seatId) => {
          const row = seatId.charAt(0);
          const number = parseInt(seatId.slice(1));
          const adjacentOffsets = [
            { rowOffset: 0, numOffset: -1 }, { rowOffset: 0, numOffset: 1 },
            { rowOffset: -1, numOffset: 0 }, { rowOffset: 1, numOffset: 0 },
            { rowOffset: -1, numOffset: -1 }, { rowOffset: -1, numOffset: 1 },
            { rowOffset: 1, numOffset: -1 }, { rowOffset: 1, numOffset: 1 },
          ];
          adjacentOffsets.forEach(({ rowOffset, numOffset }) => {
            const newRowChar = String.fromCharCode(row.charCodeAt(0) + rowOffset);
            const newNumber = number + numOffset;
            if (newNumber > 0) safeZone.add(`${newRowChar}${newNumber}`);
          });
          safeZone.add(seatId);
        });

        const availableSeats = currentSeats.filter((seat) => {
          const seatId = getSeatId(seat);
          return !seat.isOccupied && !safeZone.has(seatId);
        });

        if (availableSeats.length === 0) return currentSeats;

        const numSeatsToBook = Math.random() > 0.5 ? 1 : 2;
        const seatsToBook = Math.min(numSeatsToBook, availableSeats.length);
        const updatedSeats = [...currentSeats];

        for (let i = 0; i < seatsToBook; i++) {
          const randomIndex = Math.floor(Math.random() * availableSeats.length);
          const seatToBook = availableSeats[randomIndex];
          const seatIndex = updatedSeats.findIndex(
            (s) => s.row === seatToBook.row && s.number === seatToBook.number
          );
          if (seatIndex !== -1) {
            updatedSeats[seatIndex] = { ...updatedSeats[seatIndex], isOccupied: true };
          }
          availableSeats.splice(randomIndex, 1);
        }
        return updatedSeats;
      });
    }, 12000);
    return () => clearInterval(bookingInterval);
  }, [selectedSeats, hoveredSeat]);

  // Генерация сетки мест
  const generateSeats = (hallId: number, hallName?: string): Seat[] => {
    const seats: Seat[] = [];
    let rows: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    let seatsPerRow = 12;
    let vipRowStart = 100; // По умолчанию нет VIP

    if (hallName?.includes('VIP')) {
      rows = ['A', 'B', 'C', 'D', 'E', 'F'];
      seatsPerRow = 8;
    } else if (hallName?.includes('IMAX')) {
      rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
      seatsPerRow = 18;
      vipRowStart = 7;
    }

    rows.forEach((row, rowIndex) => {
      for (let i = 1; i <= seatsPerRow; i++) {
        let type: 'regular' | 'vip' = 'regular';
        if (rowIndex >= vipRowStart) type = 'vip';

        seats.push({
          row,
          number: i,
          type,
          isOccupied: Math.random() > 0.8, // 20% занято случайно
        });
      }
    });
    return seats;
  };

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) return prev.filter((s) => s !== seatId);
      if (prev.length >= 10) {
        toast.error("Максимум 10 мест на одно бронирование");
        return prev;
      }
      return [...prev, seatId];
    });
  };

  const getSeatPrice = (seatId: string) => {
    if (!session) return 0;
    const seat = seats.find((s) => `${s.row}${s.number}` === seatId);
    const basePrice = session.price || (session.base_price_cents / 100);
    return seat?.type === "vip" ? basePrice * 1.5 : basePrice;
  };

  const totalPrice = selectedSeats.reduce((sum, seatId) => sum + getSeatPrice(seatId), 0);

  const handleCheckout = () => {
    if (selectedSeats.length === 0) {
      toast.error("Пожалуйста, выберите хотя бы одно место");
      return;
    }
    if (!session) return;

    sessionStorage.setItem(
      "bookingData",
      JSON.stringify({
        movieId: id,
        sessionId: session.id, // Числовой ID
        cinemaId: session.cinema_id,
        seats: selectedSeats,
        totalPrice,
        movieTitle: "Фильм", // Можно добавить загрузку названия фильма отдельно
        sessionTime: session.time,
        hallName: session.hall_name,
        cinemaName: `Кинотеатр ${session.cinema_id}`, // Заглушка, пока нет данных о названии
        cinemaAddress: session.cinema_address,
      })
    );

    navigate("/snacks"); // Или сразу на checkout, если шаг с едой не нужен
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05050acc]">
        <div className="text-purple-400 text-xl font-semibold animate-pulse">Загрузка схемы зала...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-lg">Сеанс не найден</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 py-8">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate(`/movie/${id}`)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-5 h-5" /> Назад к фильму
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Выбор мест</h1>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-white">Кинотеатр {session.cinema_id}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span>4.5</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span>{session.cinema_address}</span>
                </div>
                <p className="text-sm text-gray-400">
                  {session.hall_name} • {session.time} • {session.date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 glass-strong rounded-xl border-2 border-red-500/30">
              <Clock className="w-5 h-5 text-red-400" />
              <span className="text-xl font-bold text-red-400">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 glass-strong rounded-2xl p-6 md:p-8">
            <SeatGrid seats={seats} selectedSeats={selectedSeats} onSeatSelect={handleSeatSelect} onSeatHover={setHoveredSeat} />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
            <div className="sticky top-24 glass-strong rounded-2xl p-5 space-y-5">
              <h2 className="text-xl font-bold">Сводка бронирования</h2>
              <div className="p-3 glass rounded-xl space-y-2">
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Кинотеатр {session.cinema_id}</p>
                    <p className="text-xs text-gray-400">{session.hall_name}</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-purple-400" />
                  <h3 className="font-semibold text-sm">Выбранные места</h3>
                </div>
                {selectedSeats.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSeats.map((seatId) => {
                      const seat = seats.find((s) => `${s.row}${s.number}` === seatId);
                      const price = getSeatPrice(seatId);
                      return (
                        <div key={seatId} className="flex items-center justify-between p-2.5 glass rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{seatId}</span>
                            {seat?.type === "vip" && (
                              <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-semibold rounded">VIP</span>
                            )}
                          </div>
                          <span className="text-gray-400 text-sm">{formatRub(price)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Места не выбраны</p>
                )}
              </div>
              <div className="pt-5 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Промежуточный итог</span>
                  <span>{formatRub(totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Сервисный сбор</span>
                  <span>{formatRub(SERVICE_FEE)}</span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold pt-2 border-t border-white/10">
                  <span>Итого</span>
                  <span className="text-purple-400">{formatRub(totalPrice + SERVICE_FEE)}</span>
                </div>
              </div>
              <button 
                onClick={handleCheckout} 
                disabled={selectedSeats.length === 0} 
                className="w-full py-3 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-sm"
              >
                Перейти к оформлению
              </button>
              <p className="text-xs text-gray-500 text-center">Ваши места будут удерживаться в течение {minutes} мин</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}