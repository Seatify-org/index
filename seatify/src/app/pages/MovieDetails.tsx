import {
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Clock,
  Star,
  Play,
  User2,
  Video,
  MapPin,
  Navigation,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { formatRub } from "../utils/formatRub";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useCity } from "../contexts/CityContext";
import TrailerModal from "../components/TrailerModal";
// Импортируем API функции и типы
import { fetchMovies, fetchSessionsByMovie, type Movie as ApiMovie, type Session as ApiSession } from "../services/api";

// Расширенные типы для удобства
interface ExtendedMovie extends ApiMovie {
  genre: string[];
  rating: number;
  bannerUrl?: string;
  trailerUrl?: string;
  cast?: string[];
  director?: string;
}

interface ExtendedSession extends ApiSession {
  time: string;
  date: string;
  price: number;
  hallName: string;
  cinemaId: number;
  integrationLevel?: 1 | 2 | 3;
}

interface ExtendedCinema {
  id: number;
  name: string;
  address: string;
  city: string;
  distance?: number;
  rating?: number;
  integrationLevel?: 1 | 2 | 3;
}

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedCity } = useCity();

  const cinemaFromUrl = searchParams.get("cinema");
  const dateFromUrl = searchParams.get("date");

  const [selectedCinema, setSelectedCinema] = useState<string | null>(cinemaFromUrl);
  const [selectedSession, setSelectedSession] = useState<number | null>(null); // Теперь храним число
  const [selectedDate, setSelectedDate] = useState<string>(dateFromUrl || new Date().toISOString().split("T")[0]);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isPosterHovered, setIsPosterHovered] = useState(false);

  // Состояния данных
  const [movie, setMovie] = useState<ExtendedMovie | null>(null);
  const [sessions, setSessions] = useState<ExtendedSession[]>([]);
  const [cinemas, setCinemas] = useState<ExtendedCinema[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const movieId = Number(id);
        if (!movieId) throw new Error("Invalid movie ID");

        // 1. Загружаем все фильмы и ищем нужный (в идеале нужен endpoint /movies/:id)
        const allMovies = await fetchMovies();
        const foundMovie = allMovies.find(m => m.id === movieId);
        
        if (!foundMovie) {
          toast.error("Фильм не найден");
          navigate("/");
          return;
        }

        // Расширяем данные фильма заглушками (жанры, рейтинг и т.д.)
        const extendedMovie: ExtendedMovie = {
          ...foundMovie,
          genre: ["Фантастика", "Боевик"], // Заглушка
          rating: 8.5,                     // Заглушка
          bannerUrl: foundMovie.poster_url,
          trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Заглушка
          cast: ["Актер 1", "Актер 2"],
          director: "Режиссер",
        };
        setMovie(extendedMovie);

        // 2. Загружаем сеансы для этого фильма
        const apiSessions = await fetchSessionsByMovie(movieId);
        
        // Формируем список уникальных кинотеатров из сеансов
        const cinemaMap = new Map<number, ExtendedCinema>();
        
        const extendedSessions: ExtendedSession[] = apiSessions.map(s => {
          // Добавляем кинотеатр в мапу, если его там нет
          if (!cinemaMap.has(s.cinema_id)) {
            cinemaMap.set(s.cinema_id, {
              id: s.cinema_id,
              name: `Кинотеатр ${s.cinema_id}`, // Заглушка имени, пока нет отдельного эндпоинта
              address: s.cinema_address,
              city: s.cinema_city,
              rating: 4.5,
              distance: Math.random() * 10,
              integrationLevel: 1,
            });
          }

          return {
            ...s,
            time: new Date(s.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            date: new Date(s.start_time).toISOString().split('T')[0],
            price: s.base_price_cents / 100,
            hallName: `Зал ${s.hall_id}`,
            cinemaId: s.cinema_id,
          };
        });

        setSessions(extendedSessions);
        setCinemas(Array.from(cinemaMap.values()));

      } catch (error) {
        console.error("Failed to load movie details:", error);
        toast.error("Не удалось загрузить данные фильма");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  // Scroll to showtimes
  useEffect(() => {
    if (window.location.hash === "#showtimes") {
      setTimeout(() => {
        const element = document.getElementById("showtimes");
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, []);

  // Фильтрация сеансов по городу
  const allSessions = useMemo(() => {
    return sessions.filter(session => {
      const cinema = cinemas.find(c => c.id === session.cinemaId);
      return cinema?.city === selectedCity;
    });
  }, [sessions, cinemas, selectedCity]);

  const cinemasShowingMovie = useMemo(() => {
    return cinemas.filter(cinema => cinema.city === selectedCity);
  }, [cinemas, selectedCity]);

  // Даты
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  // Фильтры
  const filteredSessionsByDate = allSessions.filter(s => s.date === selectedDate);

  const sessionsByCinema = useMemo(() => {
    const grouped = new Map<number, ExtendedSession[]>();
    filteredSessionsByDate.forEach(session => {
      if (!grouped.has(session.cinemaId)) grouped.set(session.cinemaId, []);
      grouped.get(session.cinemaId)!.push(session);
    });
    return grouped;
  }, [filteredSessionsByDate]);

  const displaySessions = selectedCinema
    ? filteredSessionsByDate.filter(s => s.cinemaId === Number(selectedCinema))
    : filteredSessionsByDate;

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#05050acc]">
          <div className="text-purple-400 text-xl font-semibold animate-pulse">Загрузка информации о фильме...</div>
        </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-lg">Фильм не найден</p>
      </div>
    );
  }

  const handleBooking = () => {
    if (!selectedSession) {
      toast.error("Пожалуйста, выберите время сеанса");
      return;
    }

    const session = allSessions.find(s => s.id === selectedSession);
    if (!session) return;

    const cinema = cinemas.find(c => c.id === session.cinemaId);
    if (!cinema) return;

    const integrationLevel = session.integrationLevel || cinema.integrationLevel || 1;

    switch (integrationLevel) {
      case 1:
        navigate(`/movie/${id}/seats?session=${selectedSession}`);
        break;
      case 2:
        navigate(`/movie/${id}/general-admission?session=${selectedSession}`);
        break;
      case 3:
        navigate(`/movie/${id}/phone-booking?session=${selectedSession}`);
        break;
      default:
        navigate(`/movie/${id}/seats?session=${selectedSession}`);
    }
  };

  const handleCinemaFilter = (cinemaId: string | null) => {
    setSelectedCinema(cinemaId);
    setSelectedSession(null);
  };

  return (
    <div className="min-h-screen pt-28">
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:fixed lg:w-[260px] xl:w-[300px] space-y-4"
            >
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2">
                <ArrowLeft className="w-5 h-5" /> <span className="text-sm">Назад</span>
              </button>

              <div
                className="glass rounded-2xl overflow-hidden relative group cursor-pointer"
                onMouseEnter={() => setIsPosterHovered(true)}
                onMouseLeave={() => setIsPosterHovered(false)}
              >
                <img src={movie.poster_url} alt={movie.title} className="w-full aspect-[2/3] object-cover group-hover:scale-110 transition-transform duration-700" />
                <AnimatePresence>
                  {isPosterHovered && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(10px)" }}>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => setShowTrailer(true)} className="flex items-center gap-2 px-6 py-3 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl font-semibold transition-all duration-300">
                        <Play className="w-5 h-5" fill="white" /> Смотреть трейлер
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <h3 className="font-semibold text-sm">Доступно в</h3>
                </div>
                <p className="text-xl font-bold text-purple-400">{cinemasShowingMovie.length}</p>
                <p className="text-xs text-gray-400">кинотеатрах</p>
              </div>
            </motion.div>
          </div>

          {/* Right Content */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-9 space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{movie.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-full">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold text-white">{movie.rating}</span>
                  <span className="text-xs">/10</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{movie.duration} мин</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(movie.release_date).getFullYear()}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {movie.genre.map((genre) => (
                <span key={genre} className="px-3 py-1.5 liquid-gradient-subtle text-purple-300 rounded-full text-sm font-medium">{genre}</span>
              ))}
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-3">Описание</h2>
              <p className="text-gray-300 leading-relaxed">{movie.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass rounded-xl p-4">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-sm"><Video className="w-4 h-4 text-purple-400" /> Режиссёр</h3>
                <p className="text-gray-300 text-sm">{movie.director}</p>
              </div>
              <div className="glass rounded-xl p-4">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-sm"><User2 className="w-4 h-4 text-purple-400" /> В ролях</h3>
                <p className="text-gray-300 text-sm">{movie.cast?.join(", ")}</p>
              </div>
            </div>

            {/* Cinema & Sessions */}
            <div className="glass-strong rounded-2xl p-6" id="showtimes">
              <h3 className="text-xl font-bold mb-4">Выберите кинотеатр и сеанс</h3>

              {/* Date Selector */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <p className="text-sm font-semibold">Выберите дату</p>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {availableDates.map((date) => {
                    const dateStr = date.toISOString().split("T")[0];
                    const isSelected = selectedDate === dateStr;
                    const isToday = dateStr === new Date().toISOString().split("T")[0];
                    return (
                      <button key={dateStr} onClick={() => { setSelectedDate(dateStr); setSelectedSession(null); }} className={`p-2 rounded-lg transition-all text-center ${isSelected ? "liquid-gradient text-white" : "glass glass-hover"}`}>
                        <div className="text-xs text-gray-400 mb-1">{date.toLocaleDateString("en-US", { weekday: "short" })}</div>
                        <div className="text-lg font-bold">{date.getDate()}</div>
                        {isToday && <div className="text-xs text-purple-400 mt-1">Сегодня</div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cinema Tabs */}
              <div className="flex overflow-x-auto gap-2 pb-3 mb-5 border-b border-white/10 scrollbar-hide">
                <button onClick={() => handleCinemaFilter(null)} className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm ${selectedCinema === null ? "liquid-gradient text-white" : "glass text-gray-400 hover:text-white"}`}>Все кинотеатры</button>
                {cinemasShowingMovie.map((cinema) => (
                  <button key={cinema.id} onClick={() => handleCinemaFilter(String(cinema.id))} className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm ${selectedCinema === String(cinema.id) ? "liquid-gradient text-white" : "glass text-gray-400 hover:text-white"}`}>{cinema.name}</button>
                ))}
              </div>

              {/* Sessions Display */}
              {selectedCinema === null ? (
                <div className="space-y-4">
                  {Array.from(sessionsByCinema.entries()).map(([cinemaId, cinemaSessions]) => {
                    const cinema = cinemas.find(c => c.id === cinemaId);
                    if (!cinema) return null;
                    return (
                      <div key={cinemaId} className="glass rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold mb-1 text-sm">{cinema.name}</h4>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /><span>{cinema.address}</span></div>
                              {cinema.distance && <div className="flex items-center gap-1"><Navigation className="w-3 h-3" /><span>{cinema.distance.toFixed(1)} км</span></div>}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                          {cinemaSessions.map((session) => (
                            <button key={session.id} onClick={() => setSelectedSession(session.id)} className={`p-2 rounded-lg transition-all text-center ${selectedSession === session.id ? "liquid-gradient text-white" : "glass glass-hover"}`}>
                              <div className="text-sm font-bold">{session.time}</div>
                              <div className="text-xs text-gray-400">{formatRub(session.price)}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  {selectedCinema && (() => {
                    const cinema = cinemas.find(c => c.id === Number(selectedCinema));
                    return cinema ? (
                      <div className="mb-4 p-3 glass rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{cinema.name}</p>
                            <p className="text-xs text-gray-400">{cinema.address}</p>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {displaySessions.map((session) => (
                      <button key={session.id} onClick={() => setSelectedSession(session.id)} className={`p-3 rounded-lg transition-all text-center ${selectedSession === session.id ? "liquid-gradient text-white" : "glass glass-hover"}`}>
                        <div className="text-sm font-bold">{session.time}</div>
                        <div className="text-xs text-gray-400">{session.hallName}</div>
                        <div className="text-xs font-semibold text-purple-400 mt-1">{formatRub(session.price)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleBooking} disabled={!selectedSession} className="w-full mt-5 py-3 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                Перейти к выбору мест
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <TrailerModal isOpen={showTrailer} onClose={() => setShowTrailer(false)} videoUrl={movie.trailerUrl} title={movie.title} />
    </div>
  );
}