import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, LogOut, Calendar, MapPin, Clock, Ticket as TicketIcon, Film, QrCode, Share2, CalendarPlus, X, ChevronRight, ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { userBookings, movies, getCinemaById, sessions } from "../data/movies";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { formatRub } from "../utils/formatRub";

type TabType = 'upcoming' | 'past';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [selectedBooking, setSelectedBooking] = useState<typeof userBookings[0] | null>(null);
  
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };
  
  const getBookingDetails = (booking: typeof userBookings[0]) => {
    const movie = movies.find((m) => m.id === booking.movieId);
    const session = sessions.find((s) => s.id === booking.sessionId);
    const cinema = session ? getCinemaById(session.cinemaId) : undefined;
    return { movie, session, cinema };
  };
  
  const upcomingBookings = userBookings.filter(b => b.status === 'active');
  const pastBookings = userBookings.filter(b => b.status === 'completed' || b.status === 'cancelled');
  
  const currentBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;
  
  // Get recommended movies (exclude already booked ones)
  const bookedMovieIds = userBookings.map(b => b.movieId);
  const recommendedMovies = movies.filter(m => !bookedMovieIds.includes(m.id)).slice(0, 8);
  
  // Calculate stats
  const totalWatchedMovies = userBookings.filter(b => b.status === 'completed').length;
  const totalSpent = userBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  
  return (
    <div className="min-h-screen pt-16 pb-12">
      {/* Top Spacing Buffer with Gradient */}
      <div className="h-16 bg-gradient-to-b from-transparent to-transparent" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Назад</span>
        </button>
        
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/40 blur-xl" />
                <div className="relative w-16 h-16 liquid-gradient rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
              </div>
              
              {/* User Info */}
              <div>
                <h1 className="text-2xl font-bold">{user?.name}</h1>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 glass glass-hover rounded-xl text-sm font-medium transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </motion.div>
        
        {/* Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex p-1 glass-strong rounded-2xl">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`relative px-8 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'upcoming' 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {activeTab === 'upcoming' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 liquid-gradient rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Предстоящие сеансы</span>
            </button>
            
            <button
              onClick={() => setActiveTab('past')}
              className={`relative px-8 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'past' 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {activeTab === 'past' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 liquid-gradient rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Прошедшие</span>
            </button>
          </div>
        </motion.div>
        
        {/* Tickets List */}
        <AnimatePresence mode="wait">
          {currentBookings.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {currentBookings.map((booking, index) => {
                const { movie, session, cinema } = getBookingDetails(booking);
                if (!movie || !session || !cinema) return null;
                
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedBooking(booking)}
                    className={`group relative glass-strong rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02] ${
                      booking.status === 'completed' || booking.status === 'cancelled' 
                        ? 'opacity-70' 
                        : ''
                    }`}
                  >
                    {/* Glow Effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-pink-500/0 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                    
                    <div className="flex gap-4">
                      {/* Movie Poster */}
                      <div className="relative flex-shrink-0 w-24 h-36 rounded-xl overflow-hidden glass">
                        <img 
                          src={movie.posterUrl} 
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Ticket Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold mb-1 truncate group-hover:text-purple-300 transition-colors">
                              {movie.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{cinema.name}</span>
                            </div>
                          </div>
                          
                          {/* Status Badge */}
                          <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            booking.status === 'active' 
                              ? 'liquid-gradient-subtle text-green-400 border border-green-500/30' 
                              : booking.status === 'completed'
                              ? 'glass text-gray-400'
                              : 'glass text-red-400 border border-red-500/30'
                          }`}>
                            {booking.status === 'active' ? 'Активный' : booking.status === 'completed' ? 'Просмотрено' : 'Отменено'}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-purple-400" />
                            <span>{new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-purple-400" />
                            <span>{session.time}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Film className="w-4 h-4 text-purple-400" />
                            <span>{session.hallName}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <TicketIcon className="w-4 h-4 text-purple-400" />
                            <span>Места: {booking.seats.join(', ')}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold">
                            {formatRub(booking.totalPrice)}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Подробнее</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                      
                      {/* QR Code Preview */}
                      {booking.status === 'active' && (
                        <div className="hidden lg:flex flex-shrink-0 w-24 h-24 glass rounded-xl items-center justify-center">
                          <QrCode className="w-16 h-16 text-purple-400" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            // Empty State
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center min-h-[400px]"
            >
              <div className="text-center glass-strong rounded-3xl p-12 max-w-md">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-purple-500/20 blur-3xl" />
                  <div className="relative w-20 h-20 mx-auto glass rounded-2xl flex items-center justify-center">
                    <TicketIcon className="w-10 h-10 text-gray-600" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-3">
                  {activeTab === 'upcoming' ? 'Нет предстоящих билетов' : 'No Past Bookings'}
                </h3>
                <p className="text-gray-400 mb-6">
                  {activeTab === 'upcoming'
                    ? 'Начните свой кинопуть с бронирования первого фильма!'
                    : 'Your booking history will appear here once you watch some movies.'}
                </p>
                
                {activeTab === 'upcoming' && (
                  <button
                    onClick={() => navigate('/')}
                    className="px-8 py-3 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl font-semibold transition-all duration-300"
                  >
                    Искать фильмы
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Recommended Movies Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Рекомендуем для вас</h2>
            <p className="text-sm text-gray-400">Based on your viewing history, we think you'll love these movies</p>
          </div>
          
          {recommendedMovies.length > 0 ? (
            <div className="overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide">
              <div className="flex gap-4 min-w-min">
                {recommendedMovies.map((movie, index) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group cursor-pointer flex-shrink-0 w-48"
                  >
                    <div className="relative glass-strong rounded-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30">
                      {/* Poster */}
                      <div className="aspect-[2/3] relative">
                        <img 
                          src={movie.posterUrl} 
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        
                        {/* Rating badge */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 glass-strong rounded-lg">
                          <span className="text-yellow-500">⭐</span>
                          <span className="text-xs font-bold">{movie.rating}</span>
                        </div>
                        
                        {/* Genre tag */}
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-1 liquid-gradient-subtle text-purple-300 rounded-lg text-xs font-medium">
                            {movie.genre[0]}
                          </span>
                        </div>
                        
                        {/* Hover button */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/movie/${movie.id}`)}
                            className="px-4 py-2 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                      
                      {/* Movie info */}
                      <div className="p-3">
                        <h3 className="font-semibold text-sm mb-1 truncate group-hover:text-purple-300 transition-colors">
                          {movie.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{movie.duration}m</span>
                          <span>•</span>
                          <span className="truncate">{movie.genre[1] || movie.genre[0]}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-strong rounded-2xl p-8 text-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-purple-500/20 blur-2xl" />
                <div className="relative w-16 h-16 mx-auto glass rounded-xl flex items-center justify-center">
                  <Film className="w-8 h-8 text-gray-600" />
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                We're finding the perfect movies for you!
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl text-sm font-semibold transition-all"
              >
                Explore Movies
              </button>
            </div>
          )}
        </motion.div>
        
        {/* Loyalty Stats Block */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12"
        >
          <div className="glass-strong rounded-3xl p-6">
            <h2 className="text-2xl font-bold mb-6">Ваше кино-путешествие</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Movies Watched */}
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-purple-500/20 blur-2xl" />
                  <div className="relative w-20 h-20 mx-auto liquid-gradient rounded-2xl flex items-center justify-center">
                    <Film className="w-10 h-10" />
                  </div>
                </div>
                <div className="text-3xl font-bold liquid-gradient bg-clip-text text-transparent mb-1">
                  {totalWatchedMovies}
                </div>
                <p className="text-sm text-gray-400">Фильмов просмотрено</p>
              </div>
              
              {/* Total Spent */}
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-pink-500/20 blur-2xl" />
                  <div className="relative w-20 h-20 mx-auto liquid-gradient rounded-2xl flex items-center justify-center">
                    <TicketIcon className="w-10 h-10" />
                  </div>
                </div>
                <div className="text-3xl font-bold liquid-gradient bg-clip-text text-transparent mb-1">
                  {formatRub(totalSpent)}
                </div>
                <p className="text-sm text-gray-400">Всего потрачено</p>
              </div>
              
              {/* Active Bookings */}
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-cyan-500/20 blur-2xl" />
                  <div className="relative w-20 h-20 mx-auto liquid-gradient rounded-2xl flex items-center justify-center">
                    <Calendar className="w-10 h-10" />
                  </div>
                </div>
                <div className="text-3xl font-bold liquid-gradient bg-clip-text text-transparent mb-1">
                  {upcomingBookings.length}
                </div>
                <p className="text-sm text-gray-400">Предстоящих сеансов</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            {totalWatchedMovies > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">До следующей награды</span>
                  <span className="text-sm font-semibold">{totalWatchedMovies % 10}/10 фильмов</span>
                </div>
                <div className="h-2 glass rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(totalWatchedMovies % 10) * 10}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full liquid-gradient"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {10 - (totalWatchedMovies % 10) === 1
                    ? "Всего 1 фильм до следующей награды!"
                    : `Посмотрите еще ${10 - (totalWatchedMovies % 10)} фильмов, чтобы получить награду!`}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      
      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBooking(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[90vh] overflow-hidden z-50"
              style={{
                background: 'rgba(15, 15, 20, 0.95)',
                backdropFilter: 'blur(40px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              {/* Subtle Glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-b from-purple-500/20 to-transparent rounded-3xl blur-md -z-10" />
              
              <div className="relative flex flex-col max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {(() => {
                  const { movie, session, cinema } = getBookingDetails(selectedBooking);
                  if (!movie || !session || !cinema) return null;
                  
                  return (
                    <div className="p-8">
                      {/* Close Button */}
                      <button
                        onClick={() => setSelectedBooking(null)}
                        className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-lg transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      
                      {/* Header */}
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-2">{movie.title}</h2>
                        <p className="text-gray-400 text-sm">{cinema.name}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(session.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })} • {session.time}
                        </p>
                      </div>
                      
                      {/* Ticket Info Grid */}
                      <div className="mb-8 grid grid-cols-2 gap-6">
                        {/* Movie */}
                        <div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <Film className="w-3.5 h-3.5" />
                            <span>Фильм</span>
                          </div>
                          <p className="font-semibold text-sm truncate">{movie.title}</p>
                        </div>
                        
                        {/* Cinema */}
                        <div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Кинотеатр</span>
                          </div>
                          <p className="font-semibold text-sm truncate">{cinema.name}</p>
                        </div>
                        
                        {/* Time */}
                        <div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Сеанс</span>
                          </div>
                          <p className="font-semibold text-sm">{session.time}</p>
                        </div>
                        
                        {/* Hall */}
                        <div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <TicketIcon className="w-3.5 h-3.5" />
                            <span>Зал</span>
                          </div>
                          <p className="font-semibold text-sm">{session.hallName}</p>
                        </div>
                        
                        {/* Seats */}
                        <div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <User className="w-3.5 h-3.5" />
                            <span>Места</span>
                          </div>
                          <p className="font-semibold text-sm">{selectedBooking.seats.join(', ')}</p>
                        </div>
                        
                        {/* Price */}
                        <div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <span>💳</span>
                            <span>Оплачено</span>
                          </div>
                          <p className="font-semibold text-sm">{formatRub(selectedBooking.totalPrice)}</p>
                        </div>
                      </div>
                      
                      {/* QR Code - Focus Area */}
                      {selectedBooking.status === 'active' && (
                        <div className="mb-8">
                          <div className="relative rounded-2xl p-8 flex flex-col items-center" style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                          }}>
                            {/* Subtle animated glow */}
                            <motion.div 
                              className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl"
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            />
                            
                            <div className="relative w-48 h-48 bg-white rounded-xl flex items-center justify-center mb-4">
                              <QrCode className="w-40 h-40 text-black" />
                            </div>
                            
                            <p className="text-xs text-gray-400 text-center">
                              Сканировать на входе
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      {selectedBooking.status === 'active' && (
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => {
                              toast.success('Added to calendar!');
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            <CalendarPlus className="w-4 h-4" />
                            <span>Добавить в календарь</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              toast.success('Ticket shared!');
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            <Share2 className="w-4 h-4" />
                            <span>Поделиться</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}