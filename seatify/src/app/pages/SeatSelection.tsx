import { useState, useEffect } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Clock,
  Users,
  MapPin,
  Star,
  Building2,
} from "lucide-react";
import { formatRub, SERVICE_FEE } from "../utils/formatRub";
import {
  movies,
  sessions,
  generateSeats,
  getCinemaById,
  type Seat,
} from "../data/movies";
import SeatGrid from "../components/SeatGrid";
import { toast } from "sonner";

export default function SeatSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(300);

  const movie = movies.find((m) => m.id === id);
  // Ищем сессию, поддерживая и строковые, и числовые ID для совместимости
  const session = sessions.find((s) => String(s.id) === sessionId || s.id === sessionId);
  
  const cinema = session ? getCinemaById(session.cinemaId) : null;

  const [seats, setSeats] = useState<Seat[]>(() =>
    session ? generateSeats(session.hallId, session.hallName) : []
  );

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

  if (!movie || !session || !cinema) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-lg">Сеанс не найден</p>
      </div>
    );
  }

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
    const seat = seats.find((s) => `${s.row}${s.number}` === seatId);
    return seat?.type === "vip" ? session.price * 1.5 : session.price;
  };

  const totalPrice = selectedSeats.reduce((sum, seatId) => sum + getSeatPrice(seatId), 0);

  // Вспомогательная функция для очистки ID от букв
  const parseNumericId = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 1; // Fallback
    const strVal = String(val);
    const numbers = strVal.match(/\d+/);
    return numbers ? parseInt(numbers[0], 10) : 1;
  };

  const handleCheckout = () => {
    if (selectedSeats.length === 0) {
      toast.error("Пожалуйста, выберите хотя бы одно место");
      return;
    }

    // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Преобразуем ID сеанса в число
    const numericSessionId = parseNumericId(session.id);

    sessionStorage.setItem(
      "bookingData",
      JSON.stringify({
        movieId: id,
        sessionId: numericSessionId, // Сохраняем как число!
        cinemaId: cinema.id,
        seats: selectedSeats,
        totalPrice,
        movieTitle: movie.title,
        sessionTime: session.time,
        hallName: session.hallName,
        cinemaName: cinema.name,
        cinemaAddress: cinema.address,
      })
    );

    navigate("/snacks");
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="min-h-screen pt-28 py-8">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate(`/movie/${id}`)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-5 h-5" /> Назад к фильму
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{movie.title}</h1>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-white">{cinema.name}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span>{cinema.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span>{cinema.address}</span>
                </div>
                <p className="text-sm text-gray-400">
                  {session.hallName} • {session.time} • {new Date(session.date).toLocaleDateString()}
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
                    <p className="font-semibold text-sm">{cinema.name}</p>
                    <p className="text-xs text-gray-400">{session.hallName}</p>
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
              <button onClick={handleCheckout} disabled={selectedSeats.length === 0} className="w-full py-3 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-sm">
                Перейти к оформлению
              </button>
              <p className="text-xs text-gray-500 text-center">Ваши места будут удерживаться в течение {minutes} минут</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}