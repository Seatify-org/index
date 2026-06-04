import { useParams, useNavigate } from "react-router";
import { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { MapPin, Star, Clock, Calendar, ArrowLeft, Film, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchCinemaById, fetchSessionsByCinema, type Cinema, type Session } from "../services/api";
import { formatRub } from "../utils/formatRub";
import { toast } from "sonner";

interface ExtendedSession extends Session {
  time: string;
  date: string;
  price: number;
}

export default function CinemaSchedule() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [sessions, setSessions] = useState<ExtendedSession[]>([]);
  const [loading, setLoading] = useState(true);

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
  
  const [selectedDate, setSelectedDate] = useState<string>(availableDates[0].toISOString().split('T')[0]);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      
      try {
        const cinemaId = Number(id);
        
        const [cinemaData, cinemaSessions] = await Promise.all([
          fetchCinemaById(cinemaId),
          fetchSessionsByCinema(cinemaId),
        ]);

        if (!cinemaData) {
          toast.error('Кинотеатр не найден');
          navigate('/');
          return;
        }

        setCinema(cinemaData);

        const extendedSessions: ExtendedSession[] = cinemaSessions.map(s => ({
          ...s,
          time: new Date(s.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          date: new Date(s.start_time).toISOString().split('T')[0],
          price: s.base_price_cents / 100,
        }));
        setSessions(extendedSessions);

      } catch (error) {
        console.error("Failed to load cinema data", error);
        toast.error("Не удалось загрузить данные кинотеатра");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);
  
  // Фильтруем сеансы по выбранной дате
  const cinemaSessions = useMemo(() => {
    return sessions.filter(s => s.cinema_id === Number(id) && s.date === selectedDate);
  }, [id, selectedDate, sessions]);
  
  // Группируем сеансы по фильмам
  const sessionsByMovie = useMemo(() => {
    const grouped = new Map<number, ExtendedSession[]>();
    
    cinemaSessions.forEach((session) => {
      if (!grouped.has(session.movie_id)) {
        grouped.set(session.movie_id, []);
      }
      grouped.get(session.movie_id)!.push(session);
    });
    
    grouped.forEach((movieSessions) => {
      movieSessions.sort((a, b) => a.time.localeCompare(b.time));
    });
    
    return grouped;
  }, [cinemaSessions]);

  // ✅ ПЕРЕМЕЩЁН СЮДА — перед ранними return
  const uniqueMovies = useMemo(() => {
    const movieMap = new Map<number, { id: number; title: string }>();
    cinemaSessions.forEach(s => {
      if (s.movie_id && !movieMap.has(s.movie_id)) {
        movieMap.set(s.movie_id, {
          id: s.movie_id,
          title: s.movie_title || `Фильм ${s.movie_id}`,
        });
      }
    });
    return Array.from(movieMap.values());
  }, [cinemaSessions]);
  
  // ✅ Теперь все хуки вызваны, можно делать ранние return
  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-purple-400 text-xl font-semibold animate-pulse">Загрузка расписания...</div>
      </div>
    );
  }

  if (!cinema) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-gray-400 text-lg">Кинотеатр не найден</p>
      </div>
    );
  }
  
  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentIndex = availableDates.findIndex(d => d.toISOString().split('T')[0] === selectedDate);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedDate(availableDates[currentIndex - 1].toISOString().split('T')[0]);
    } else if (direction === 'next' && currentIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[currentIndex + 1].toISOString().split('T')[0]);
    }
  };
  
  return (
    <div className="min-h-screen pt-24 pb-12">
      {/* Header */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Назад</span>
        </button>
        
        <div className="glass-strong rounded-2xl overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{cinema.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{cinema.address}, {cinema.city}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Date Selector */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="glass-strong rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold">Выберите дату</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDateChange('prev')}
              disabled={selectedDate === availableDates[0].toISOString().split('T')[0]}
              className="p-2 glass rounded-lg hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex-1 grid grid-cols-7 gap-2">
              {availableDates.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`p-3 rounded-lg transition-all text-center ${
                      isSelected
                        ? 'liquid-gradient text-white'
                        : 'glass glass-hover'
                    }`}
                  >
                    <div className="text-xs text-gray-400 mb-1">
                      {date.toLocaleDateString('ru-RU', { weekday: 'short' })}
                    </div>
                    <div className="text-lg font-bold">
                      {date.getDate()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {date.toLocaleDateString('ru-RU', { month: 'short' })}
                    </div>
                    {isToday && (
                      <div className="text-xs text-purple-400 mt-1">Сегодня</div>
                    )}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handleDateChange('next')}
              disabled={selectedDate === availableDates[availableDates.length - 1].toISOString().split('T')[0]}
              className="p-2 glass rounded-lg hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
      
      {/* Schedule Grid */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Film className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold">Расписание на день</h2>
            <span className="text-sm text-gray-400">
              ({sessionsByMovie.size} {sessionsByMovie.size === 1 ? 'фильм' : sessionsByMovie.size < 5 ? 'фильма' : 'фильмов'} • {cinemaSessions.length} {cinemaSessions.length === 1 ? 'сеанс' : cinemaSessions.length < 5 ? 'сеанса' : 'сеансов'})
            </span>
          </div>
          
          {sessionsByMovie.size === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Нет сеансов на эту дату</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from(sessionsByMovie.entries()).map(([movieId, movieSessions]) => {
                const movieTitle = movieSessions[0]?.movie_title || `Фильм ${movieId}`;
                
                return (
                  <motion.div 
                    key={movieId} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-4"
                  >
                    <div className="flex gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-bold text-lg mb-1 cursor-pointer hover:text-purple-400 transition-colors"
                          onClick={() => navigate(`/movie/${movieId}`)}
                        >
                          {movieTitle}
                        </h3>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{movieSessions.length} сеанс(ов)</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {movieSessions.map((session) => {
                            return (
                              <button
                                key={session.id}
                                onClick={() => {
                                  navigate(`/movie/${movieId}/seats?session=${session.id}`);
                                }}
                                className="group relative"
                              >
                                <div className="px-4 py-2 glass hover:liquid-gradient rounded-lg transition-all text-sm font-semibold flex flex-col items-center gap-0.5">
                                  <span className="text-white">{session.time}</span>
                                  <span className="text-xs text-gray-400 group-hover:text-purple-300 transition-colors">
                                    {session.hall_name || `Зал ${session.hall_id}`}
                                  </span>
                                  <span className="text-xs text-purple-300 font-semibold">
                                    {formatRub(session.price)}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}