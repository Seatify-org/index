import { useParams, useNavigate } from "react-router";
import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { MapPin, Star, Clock, Calendar, Navigation, ArrowLeft, Film, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchMovies, type Movie as ApiMovie } from "../services/api";
import { formatRub } from "../utils/formatRub";

export default function CinemaSchedule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cinema = getCinemaById(id || '');
  
  // Generate next 7 days for date selection
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
  
  // Get all sessions for this cinema on selected date
  const cinemaSessions = useMemo(() => {
    return sessions.filter(s => s.cinemaId === id && s.date === selectedDate);
  }, [id, selectedDate]);
  
  // Group sessions by movie
  const sessionsByMovie = useMemo(() => {
    const grouped = new Map<string, typeof cinemaSessions>();
    
    cinemaSessions.forEach((session) => {
      if (!grouped.has(session.movieId)) {
        grouped.set(session.movieId, []);
      }
      grouped.get(session.movieId)!.push(session);
    });
    
    // Sort sessions by time within each movie
    grouped.forEach((movieSessions) => {
      movieSessions.sort((a, b) => a.time.localeCompare(b.time));
    });
    
    return grouped;
  }, [cinemaSessions]);
  
  // Generate time slots for the day (from 10:00 to 23:00)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 10; hour <= 23; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);
  
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
  
  const getTimePosition = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = (hours - 10) * 60 + minutes; // 10:00 is start
    const totalDayMinutes = 13 * 60; // 10:00 to 23:00
    return (totalMinutes / totalDayMinutes) * 100;
  };
  
  const getSessionWidth = (duration: number) => {
    const totalDayMinutes = 13 * 60;
    return (duration / totalDayMinutes) * 100;
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
        
        {/* Cinema Info */}
        <div className="glass-strong rounded-2xl overflow-hidden">
          {/* Banner Image */}
          <div className="relative h-48">
            <img 
              src={cinema.imageUrl}
              alt={cinema.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-[#05050A]/60 to-transparent" />
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{cinema.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{cinema.address}</span>
                  </div>
                  {cinema.distance && (
                    <div className="flex items-center gap-1">
                      <Navigation className="w-4 h-4" />
                      <span>{cinema.distance}km away</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-white font-semibold">{cinema.rating}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {cinema.facilities.map(facility => (
                  <span 
                    key={facility}
                    className="px-3 py-1.5 liquid-gradient-subtle text-purple-300 rounded-full text-xs font-medium"
                  >
                    {facility}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Cinema Photos - Compact Row */}
            {cinema.photos && (
              <div className="grid grid-cols-3 gap-3">
                {cinema.photos.hall && (
                  <div className="group relative aspect-[4/3] rounded-xl overflow-hidden">
                    <img 
                      src={cinema.photos.hall}
                      alt="Hall Interior"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="absolute bottom-2 left-2 text-xs font-medium text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                      Зал и места
                    </span>
                  </div>
                )}
                {cinema.photos.screen && (
                  <div className="group relative aspect-[4/3] rounded-xl overflow-hidden">
                    <img 
                      src={cinema.photos.screen}
                      alt="Screen View"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="absolute bottom-2 left-2 text-xs font-medium text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                      Экран
                    </span>
                  </div>
                )}
                {cinema.photos.facade && (
                  <div className="group relative aspect-[4/3] rounded-xl overflow-hidden">
                    <img 
                      src={cinema.photos.facade}
                      alt="Building Entrance"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="absolute bottom-2 left-2 text-xs font-medium text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                      Вход
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* Infrastructure Tags & Cinema Ratings - Side by Side */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Infrastructure Tags */}
              {cinema.infrastructureTags && cinema.infrastructureTags.length > 0 && (
                <div className="glass rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Краткая информация</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {cinema.infrastructureTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs font-medium rounded-lg glass-hover border border-white/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Cinema Quality Ratings */}
              {cinema.cinemaRatings && (
                <div className="glass rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Качество кинотеатра</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Звук</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < cinema.cinemaRatings!.sound
                                ? 'text-cyan-400 fill-cyan-400'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Комфорт</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < cinema.cinemaRatings!.comfort
                                ? 'text-purple-400 fill-purple-400'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Чистота</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < cinema.cinemaRatings!.cleanliness
                                ? 'text-green-400 fill-green-400'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Температура</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < cinema.cinemaRatings!.temperature
                                ? 'text-orange-400 fill-orange-400'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-lg font-bold">
                      {date.getDate()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {date.toLocaleDateString('en-US', { month: 'short' })}
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
                const movie = movies.find(m => m.id === movieId);
                if (!movie) return null;
                
                return (
                  <motion.div 
                    key={movieId} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-4"
                  >
                    <div className="flex gap-4">
                      {/* Movie Poster - Compact */}
                      <div 
                        className="w-20 h-28 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => navigate(`/movie/${movie.id}`)}
                      >
                        <img 
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Movie Info & Showtimes */}
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-bold text-lg mb-1 cursor-pointer hover:text-purple-400 transition-colors"
                          onClick={() => navigate(`/movie/${movie.id}`)}
                        >
                          {movie.title}
                        </h3>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-white">{movie.rating}</span>
                          </div>
                          <span>•</span>
                          <span>{movie.genre.slice(0, 2).join(', ')}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{movie.duration} min</span>
                          </div>
                        </div>
                        
                        {/* Showtimes Grid */}
                        <div className="flex flex-wrap gap-2">
                          {movieSessions.map((session) => {
                            // Determine booking button text based on integration level
                            const integrationLevel = session.integrationLevel || cinema.integrationLevel;
                            const buttonText = integrationLevel === 3 ? '📞' : session.time;
                            
                            return (
                              <button
                                key={session.id}
                                onClick={() => {
                                  // Route to appropriate booking page based on integration level
                                  switch (integrationLevel) {
                                    case 1:
                                      navigate(`/movie/${movie.id}/seats?session=${session.id}`);
                                      break;
                                    case 2:
                                      navigate(`/movie/${movie.id}/general-admission?session=${session.id}`);
                                      break;
                                    case 3:
                                      navigate(`/movie/${movie.id}/phone-booking?session=${session.id}`);
                                      break;
                                    default:
                                      navigate(`/movie/${movie.id}/seats?session=${session.id}`);
                                  }
                                }}
                                className="group relative"
                              >
                                <div className="px-4 py-2 glass hover:liquid-gradient rounded-lg transition-all text-sm font-semibold flex flex-col items-center gap-0.5">
                                  <span className="text-white">{buttonText}</span>
                                  <span className="text-xs text-gray-400 group-hover:text-purple-300 transition-colors">
                                    {session.hallName}
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